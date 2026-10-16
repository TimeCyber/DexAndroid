#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { join } from "node:path";
import { textResult } from "./util.js";
import { listDevices, listPackages, resolveSerial } from "./adb.js";
import { detectPacker } from "./detect.js";
import { staticUnpack, pullApkFromDevice } from "./unpack/static.js";
import { fridaUnpack, fridaPrepare } from "./unpack/frida.js";
import { blackdexPrepare, blackdexPull } from "./unpack/blackdex.js";
import { dexToSmali, smaliListClasses, smaliReadClass, smaliSearch, } from "./smali.js";
const DEFAULT_OUT = process.env.DEX_OUT_DIR || join(process.cwd(), "unpack-output");
const TOOLS = [
    {
        name: "list_devices",
        description: "列出当前通过 ADB 连接的安卓设备及其状态。",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "list_packages",
        description: "列出设备上已安装的应用包名，可用关键字过滤。",
        inputSchema: {
            type: "object",
            properties: {
                keyword: { type: "string", description: "按包名关键字过滤" },
                serial: { type: "string", description: "设备 serial（多设备时必填）" },
            },
        },
    },
    {
        name: "detect_packer",
        description: "识别 APK 是否被加固及加固厂商（360/腾讯/梆梆/爱加密等）。可传本地 apkPath，或传 pkg 自动从设备拉取后检测。",
        inputSchema: {
            type: "object",
            properties: {
                apkPath: { type: "string", description: "本地 APK 路径" },
                pkg: { type: "string", description: "设备上应用包名（将先拉取 APK）" },
                serial: { type: "string" },
            },
        },
    },
    {
        name: "pull_apk",
        description: "从设备拉取已安装应用的 APK（含 split）到本机。",
        inputSchema: {
            type: "object",
            properties: {
                pkg: { type: "string", description: "应用包名" },
                outDir: { type: "string", description: "输出目录，默认 unpack-output" },
                serial: { type: "string" },
            },
            required: ["pkg"],
        },
    },
    {
        name: "static_unpack",
        description: "静态解包：解压 APK 提取所有 classes*.dex。可传 apkPath 或 pkg（自动拉取）。加固 APK 得到的是壳 dex。",
        inputSchema: {
            type: "object",
            properties: {
                apkPath: { type: "string" },
                pkg: { type: "string" },
                outDir: { type: "string" },
                serial: { type: "string" },
            },
        },
    },
    {
        name: "frida_prepare",
        description: "root 方案准备：推送并启动 frida-server（默认 tools/frida-server，需 Magisk/su）。",
        inputSchema: {
            type: "object",
            properties: {
                serial: { type: "string" },
                serverLocalPath: { type: "string", description: "本机 frida-server 路径" },
            },
        },
    },
    {
        name: "frida_unpack",
        description: "root 方案：用 frida-dexdump 从内存 dump 已解密 dex。需设备已 root + frida-server 运行 + 本机安装 frida-dexdump。",
        inputSchema: {
            type: "object",
            properties: {
                pkg: { type: "string", description: "目标应用包名" },
                outDir: { type: "string" },
                serial: { type: "string" },
                spawn: {
                    type: "boolean",
                    description: "true=由 frida 启动应用(脱壳更完整)，false=按包名 attach",
                },
                deepSearch: { type: "boolean", description: "深度搜索，默认 true" },
            },
            required: ["pkg"],
        },
    },
    {
        name: "dex_to_smali",
        description: "把 dex 反编译为 smali。dexInput 可为单个 .dex 文件或包含多个 dex 的目录（如脱壳输出目录）。",
        inputSchema: {
            type: "object",
            properties: {
                dexInput: { type: "string", description: ".dex 文件或含 dex 的目录" },
                outDir: { type: "string", description: "smali 输出目录，默认 <out>/smali" },
            },
            required: ["dexInput"],
        },
    },
    {
        name: "smali_list_classes",
        description: "列出 smali 目录下所有类名，可用关键字过滤。",
        inputSchema: {
            type: "object",
            properties: {
                smaliDir: { type: "string", description: "smali 根目录" },
                keyword: { type: "string" },
            },
            required: ["smaliDir"],
        },
    },
    {
        name: "smali_read_class",
        description: "读取指定类的 smali 源码。className 支持 com.foo.Bar 或 com/foo/Bar。",
        inputSchema: {
            type: "object",
            properties: {
                smaliDir: { type: "string" },
                className: { type: "string" },
            },
            required: ["smaliDir", "className"],
        },
    },
    {
        name: "smali_search",
        description: "在 smali 目录中按正则搜索内容（用于分析 API 调用、字符串、加解密、权限等）。返回 文件:行号 命中。",
        inputSchema: {
            type: "object",
            properties: {
                smaliDir: { type: "string" },
                pattern: { type: "string", description: "正则表达式" },
                flags: { type: "string", description: "正则 flags，默认 i" },
                maxResults: { type: "number", description: "最大命中数，默认 500" },
            },
            required: ["smaliDir", "pattern"],
        },
    },
    {
        name: "blackdex_prepare",
        description: "免 root 方案第一步：在设备安装并启动 BlackDex（需提供其 APK 路径）。随后在设备上选目标应用脱壳。",
        inputSchema: {
            type: "object",
            properties: {
                blackdexApkPath: { type: "string", description: "BlackDex APK 本地路径" },
                serial: { type: "string" },
            },
        },
    },
    {
        name: "blackdex_pull",
        description: "免 root 方案第二步：把 BlackDex 脱壳 dump 出的 dex 从设备拉回本机。",
        inputSchema: {
            type: "object",
            properties: {
                outDir: { type: "string" },
                targetPkg: { type: "string", description: "目标应用包名（用于定位 dump 子目录）" },
                serial: { type: "string" },
            },
        },
    },
];
const server = new Server({ name: "dex-android-unpack-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name } = req.params;
    const args = (req.params.arguments ?? {});
    try {
        switch (name) {
            case "list_devices": {
                const d = await listDevices();
                return textResult(d.length
                    ? d.map((x) => `${x.serial}\t${x.state}\t${x.model ?? ""}`).join("\n")
                    : "未检测到设备。");
            }
            case "list_packages": {
                const s = await resolveSerial(args.serial);
                const pkgs = await listPackages(s, args.keyword);
                return textResult(`共 ${pkgs.length} 个包：\n` + pkgs.join("\n"));
            }
            case "detect_packer": {
                let apk = args.apkPath;
                if (!apk && args.pkg) {
                    const { baseApk } = await pullApkFromDevice(args.pkg, DEFAULT_OUT, args.serial);
                    apk = baseApk;
                }
                if (!apk)
                    throw new Error("请提供 apkPath 或 pkg。");
                const r = detectPacker(apk);
                return textResult(`APK: ${apk}\n` +
                    `是否加固: ${r.packed ? "是" : "否"}\n` +
                    `加固厂商: ${r.packers.join(", ") || "未识别"}\n` +
                    `dex 数量: ${r.dexCount}，条目总数: ${r.entryCount}\n` +
                    (r.hits.length ? `命中特征:\n` + r.hits.map((h) => `  ${h.packer} <= ${h.entry}`).join("\n") : ""));
            }
            case "pull_apk": {
                const r = await pullApkFromDevice(args.pkg, args.outDir || DEFAULT_OUT, args.serial);
                return textResult(`已拉取 APK:\n${r.localApks.join("\n")}\n主 APK: ${r.baseApk}`);
            }
            case "static_unpack": {
                let apk = args.apkPath;
                if (!apk && args.pkg) {
                    const { baseApk } = await pullApkFromDevice(args.pkg, args.outDir || DEFAULT_OUT, args.serial);
                    apk = baseApk;
                }
                if (!apk)
                    throw new Error("请提供 apkPath 或 pkg。");
                const r = await staticUnpack(apk, args.outDir || DEFAULT_OUT);
                return textResult(`已解包: ${r.apk}\n输出目录: ${r.outDir}\ndex 文件:\n${r.dexFiles.join("\n")}\n${r.note}`);
            }
            case "frida_prepare": {
                const r = await fridaPrepare(args.serial, args.serverLocalPath);
                return textResult(`设备: ${r.serial}\n运行中: ${r.running}\n${r.message}`);
            }
            case "frida_unpack": {
                const r = await fridaUnpack(args.pkg, args.outDir || DEFAULT_OUT, {
                    serial: args.serial,
                    spawn: args.spawn,
                    deepSearch: args.deepSearch,
                });
                return textResult(`frida-dexdump 退出码: ${r.code}\n${r.dexHint}\n--- 日志 ---\n${r.log}`);
            }
            case "dex_to_smali": {
                const out = args.outDir || join(DEFAULT_OUT, "smali");
                const r = await dexToSmali(args.dexInput, out);
                return textResult(`已反编译 ${r.dexFiles.length} 个 dex\n` +
                    `smali 输出目录:\n${r.classDirs.join("\n")}\n` +
                    `可用 smali_list_classes / smali_read_class / smali_search 进一步分析。`);
            }
            case "smali_list_classes": {
                const classes = await smaliListClasses(args.smaliDir, args.keyword);
                return textResult(`共 ${classes.length} 个类：\n` + classes.join("\n"));
            }
            case "smali_read_class": {
                const src = await smaliReadClass(args.smaliDir, args.className);
                return textResult(src);
            }
            case "smali_search": {
                const m = await smaliSearch(args.smaliDir, args.pattern, {
                    flags: args.flags,
                    maxResults: args.maxResults,
                });
                return textResult(`命中 ${m.length} 处：\n` +
                    m.map((x) => `${x.file}:${x.line}: ${x.text}`).join("\n"));
            }
            case "blackdex_prepare": {
                const r = await blackdexPrepare(args.blackdexApkPath, args.serial);
                return textResult(`设备: ${r.serial}\n已安装: ${r.installed}\n已启动: ${r.launched}\n${r.message}`);
            }
            case "blackdex_pull": {
                const r = await blackdexPull(args.outDir || DEFAULT_OUT, args.serial, args.targetPkg);
                return textResult(`已拉取到: ${r.pulledTo}\n--- 远端结构 ---\n${r.listing}`);
            }
            default:
                throw new Error(`未知工具: ${name}`);
        }
    }
    catch (err) {
        return { content: [{ type: "text", text: `错误: ${err?.message ?? err}` }], isError: true };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // stderr 打印，避免污染 stdio 协议通道
    console.error("[dex-android-unpack-mcp] MCP server 已启动 (stdio)");
}
main().catch((e) => {
    console.error("启动失败:", e);
    process.exit(1);
});
