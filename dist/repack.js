import { join, resolve, dirname } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { copyFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { exec, hasCommand, ensureDir } from "./util.js";
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
async function ensureJava() {
    if (!(await hasCommand("java"))) {
        throw new Error("未找到 java，apktool / 签名需要 JRE。");
    }
}
function findJar(envKey, patterns) {
    if (process.env[envKey] && existsSync(process.env[envKey])) {
        return process.env[envKey];
    }
    const toolsDir = join(PROJECT_ROOT, "tools");
    if (!existsSync(toolsDir))
        return undefined;
    try {
        const names = readdirSync(toolsDir);
        for (const n of names) {
            if (patterns.some((re) => re.test(n)))
                return join(toolsDir, n);
        }
    }
    catch {
        /* ignore */
    }
    return undefined;
}
async function findApktoolJar() {
    const jar = findJar("APKTOOL_JAR", [/^apktool.*\.jar$/i]);
    if (jar)
        return jar;
    if (await hasCommand("apktool"))
        return "apktool"; // wrapper script
    throw new Error("未找到 apktool。请将 apktool*.jar 放到 tools/，或设置 APKTOOL_JAR，或安装 apktool 到 PATH。");
}
async function runApktool(args, timeoutMs = 300000) {
    await ensureJava();
    const tool = await findApktoolJar();
    if (tool.endsWith(".jar") || tool.includes(".jar")) {
        return exec("java", ["-jar", tool, ...args], { timeoutMs });
    }
    return exec(tool, args, { timeoutMs });
}
/** apktool d：解码 APK 为可编辑工程目录。 */
export async function apkDecode(apkPath, outDir) {
    const st = await stat(apkPath).catch(() => null);
    if (!st?.isFile())
        throw new Error(`APK 不存在：${apkPath}`);
    const projectDir = outDir || join(PROJECT_ROOT, "unpack-output", "apktool", basenameNoExt(apkPath));
    await ensureDir(dirname(projectDir));
    const r = await runApktool(["d", "-f", "-o", projectDir, apkPath]);
    if (r.code !== 0) {
        throw new Error(`apktool decode 失败 (code=${r.code})\n${r.stdout}\n${r.stderr}`);
    }
    return {
        apkPath,
        projectDir,
        log: (r.stdout + "\n" + r.stderr).trim(),
    };
}
function basenameNoExt(p) {
    const base = p.replace(/\\/g, "/").split("/").pop() || "app";
    return base.replace(/\.apk$/i, "");
}
async function ensureDebugKeystore(keystorePath) {
    if (existsSync(keystorePath))
        return;
    await ensureDir(dirname(keystorePath));
    if (!(await hasCommand("keytool"))) {
        throw new Error("未找到 keytool，无法生成调试签名证书。请安装 JDK。");
    }
    const r = await exec("keytool", [
        "-genkeypair",
        "-v",
        "-keystore",
        keystorePath,
        "-storepass",
        "android",
        "-keypass",
        "android",
        "-alias",
        "androiddebugkey",
        "-keyalg",
        "RSA",
        "-keysize",
        "2048",
        "-validity",
        "10000",
        "-dname",
        "CN=Android Debug,O=Android,C=US",
    ], { timeoutMs: 60000 });
    if (r.code !== 0) {
        throw new Error(`生成 debug keystore 失败：\n${r.stderr || r.stdout}`);
    }
}
async function zipalign(inApk, outApk) {
    if (!(await hasCommand("zipalign"))) {
        await copyFile(inApk, outApk);
        return "未找到 zipalign，已跳过对齐（直接复制）。";
    }
    const r = await exec("zipalign", ["-f", "4", inApk, outApk], { timeoutMs: 120000 });
    if (r.code !== 0) {
        throw new Error(`zipalign 失败：\n${r.stderr || r.stdout}`);
    }
    return "zipalign 完成。";
}
async function signApk(apkPath, outApk, keystore, alias, storepass, keypass) {
    if (await hasCommand("apksigner")) {
        const r = await exec("apksigner", [
            "sign",
            "--ks",
            keystore,
            "--ks-key-alias",
            alias,
            "--ks-pass",
            `pass:${storepass}`,
            "--key-pass",
            `pass:${keypass}`,
            "--out",
            outApk,
            apkPath,
        ], { timeoutMs: 120000 });
        if (r.code !== 0)
            throw new Error(`apksigner 失败：\n${r.stderr || r.stdout}`);
        return "apksigner 签名完成。";
    }
    // jarsigner 就地签名后复制
    await copyFile(apkPath, outApk);
    if (!(await hasCommand("jarsigner"))) {
        throw new Error("未找到 apksigner 或 jarsigner，无法签名。请安装 Android build-tools 或 JDK。");
    }
    const r = await exec("jarsigner", [
        "-sigalg",
        "SHA256withRSA",
        "-digestalg",
        "SHA-256",
        "-keystore",
        keystore,
        "-storepass",
        storepass,
        "-keypass",
        keypass,
        outApk,
        alias,
    ], { timeoutMs: 120000 });
    if (r.code !== 0)
        throw new Error(`jarsigner 失败：\n${r.stderr || r.stdout}`);
    return "jarsigner 签名完成。";
}
/**
 * 将 apktool 工程重新打包并签名，输出可安装 APK。
 * 仅做通用 rebuild/sign，不注入任何业务代码。
 */
export async function apkRepack(opts) {
    const projectDir = resolve(opts.projectDir);
    if (!existsSync(join(projectDir, "apktool.yml")) && !existsSync(join(projectDir, "AndroidManifest.xml"))) {
        throw new Error(`不像 apktool 工程目录（缺少 apktool.yml / AndroidManifest.xml）：${projectDir}`);
    }
    const buildDir = join(projectDir, "dist");
    await ensureDir(buildDir);
    const unsignedApk = join(buildDir, "unsigned.apk");
    const build = await runApktool(["b", "-f", "-o", unsignedApk, projectDir]);
    if (build.code !== 0) {
        throw new Error(`apktool build 失败 (code=${build.code})\n${build.stdout}\n${build.stderr}`);
    }
    const logs = [(build.stdout + "\n" + build.stderr).trim()];
    const alignedApk = join(buildDir, "aligned.apk");
    logs.push(await zipalign(unsignedApk, alignedApk));
    const keystore = opts.keystore || join(PROJECT_ROOT, "tools", "debug.keystore");
    const alias = opts.alias || "androiddebugkey";
    const storepass = opts.storepass || "android";
    const keypass = opts.keypass || storepass;
    await ensureDebugKeystore(keystore);
    const signedApk = opts.outApk ||
        join(PROJECT_ROOT, "unpack-output", "repack", `${basenameNoExt(projectDir)}-signed.apk`);
    await ensureDir(dirname(signedApk));
    logs.push(await signApk(alignedApk, signedApk, keystore, alias, storepass, keypass));
    return {
        projectDir,
        unsignedApk,
        alignedApk,
        signedApk,
        keystore,
        log: logs.filter(Boolean).join("\n"),
    };
}
