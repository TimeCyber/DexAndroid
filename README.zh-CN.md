# DexAndroid

[English](./README.md) · **简体中文** · [繁體中文](./README.zh-TW.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Deutsch](./README.de.md) · [Português](./README.pt-BR.md) · [Русский](./README.ru.md) · [العربية](./README.ar.md) · [हिन्दी](./README.hi.md) · [Bahasa Indonesia](./README.id.md) · [Tiếng Việt](./README.vi.md) · [ไทย](./README.th.md) · [Italiano](./README.it.md) · [Türkçe](./README.tr.md)

> ⚠️ **仅用于学习与教学目的。** 禁止用于任何违法犯罪、未授权破解、侵权或绕过他人防护的行为。使用者须遵守所在国家/地区法律法规与目标应用服务条款；因滥用造成的后果由使用者自行承担。

安卓脱壳 + smali 分析 **MCP Server**。在 Cursor / Claude 等客户端中通过工具调用完成：设备管理、加固检测、静态/免 Root/Root 脱壳、dex→smali、接口字符串检索。

Repo: [https://github.com/TimeCyber/DexAndroid](https://github.com/TimeCyber/DexAndroid)

---

## 功能概览

| 能力 | MCP 工具 | 说明 |
| --- | --- | --- |
| 设备列表 | `list_devices` | ADB 已连接设备 |
| 包名列表 | `list_packages` | 可按关键字过滤 |
| 加固识别 | `detect_packer` | 360 / 腾讯 / 梆梆 / 爱加密 / 阿里聚安全等 |
| 拉 APK | `pull_apk` | 从设备拉取已安装应用（含 split） |
| 静态解包 | `static_unpack` | 解压 APK 提取 `classes*.dex` |
| 免 Root 脱壳 | `blackdex_prepare` / `blackdex_pull` | BlackDex 内存 dump 后拉取 |
| Root 脱壳 | `frida_prepare` / `frida_unpack` | 推送 frida-server + frida-dexdump |
| 反编译 | `dex_to_smali` | baksmali 转 smali |
| 分析 | `smali_list_classes` / `smali_read_class` / `smali_search` | 列类、读类、正则搜索 |
| 入口定位 | `find_app_entry` | MAIN/LAUNCHER + smali onCreate（只读） |
| 解码/重打包 | `apk_decode` / `apk_repack` | apktool 解码 + 重建签名 |

### 三种脱壳方案对比

| 方案 | 是否需要 Root | 适用场景 |
| --- | --- | --- |
| 静态解包 | 否 | 未加固，或只要壳/资源 |
| BlackDex | 否 | 多数加固 App |
| Frida | **是** | 强加固 / 壳对抗，内存 dump 更完整 |

---

## 环境要求

- **Windows / macOS / Linux**（文档以 Windows 为例）
- **Node.js** ≥ 18
- **ADB**：加入 PATH，或设置 `ADB_PATH`
- **Java 8+**（`dex_to_smali` 调用 baksmali）
- 可选：[BlackDex](https://github.com/CodingGay/BlackDex/releases) APK；设备 Root + `frida-server`；本机 `pip install frida-tools frida-dexdump`

将 baksmali fat jar / frida-server / BlackDex 放到本地 `tools/`（大文件默认不进 Git，见 `.gitignore`）。

---

## 安装与构建

```bash
git clone https://github.com/TimeCyber/DexAndroid.git
cd DexAndroid
npm install
npm run build
```

启动 MCP（stdio，供客户端拉起）:

```bash
npm start
# node dist/index.js
```

开发模式（先编译再启动）:

```bash
npm run dev
```

---

## 接入 Cursor（MCP）

在项目 `.cursor/mcp.json` 或 Cursor 全局 MCP 配置中增加（**路径改成你的本机目录**）：

```json
{
  "mcpServers": {
    "dex-android-unpack": {
      "command": "node",
      "args": ["E:/DexAndroid/dist/index.js"],
      "env": {
        "ADB_PATH": "E:/Android/Sdk/platform-tools/adb.exe",
        "DEX_OUT_DIR": "E:/DexAndroid/unpack-output"
      }
    }
  }
}
```

保存后重启 Cursor / 重载 MCP。例如：「列出设备并检测加固」「对本地 apk 做 static_unpack，再 dex_to_smali，搜索登录接口」。

---

## 环境变量

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `ADB_PATH` | adb 可执行文件 | `adb` |
| `DEX_OUT_DIR` | 脱壳/拉取默认输出目录 | `<cwd>/unpack-output` |
| `BAKSMALI_JAR` | baksmali 可执行 jar | 自动在 `tools/` 下查找 |

---

## 使用说明（典型流程）

### 1. 静态解包（最快）

1. `list_devices` 确认设备（若用 `pkg` 拉取）或准备本地 `apkPath`。
2. `detect_packer` 看是否加固。
3. `static_unpack` → 得到 `classes*.dex`。
4. `dex_to_smali` → smali 目录。
5. `smali_search` / `smali_read_class` 分析接口、字符串、加解密等。

**注意：** 加固 App 的静态 dex 往往只有壳，业务代码需 BlackDex / Frida。

### 2. 免 Root（BlackDex）

1. `list_devices`。
2. `blackdex_prepare`，传入 `blackdexApkPath`。
3. 在手机 BlackDex 界面选择目标应用并脱壳。
4. `blackdex_pull`，传入 `targetPkg`。
5. `dex_to_smali` → 再 `smali_*` 分析。

### 3. Root（Frida）

1. 设备已 Root（如 Magisk），`adb` 可用。
2. `frida_prepare`：推送并启动 `tools/frida-server`。
3. 本机已安装匹配版本的 `frida` / `frida-dexdump`（建议 16.x）。
4. `frida_unpack`：传 `pkg`，建议 `spawn: true`、`deepSearch: true`。
5. 对输出目录 `dex_to_smali` 后分析。

若 Frida 17 附加失败，可降级到同一 16.x；部分机型需临时 `setenforce 0`。

### 4. smali 分析示例

```text
smali_list_classes  smaliDir=.../smali  keyword=login
smali_search        smaliDir=.../smali  pattern=https?://|/api/|publicClient/
smali_read_class    smaliDir=.../smali  className=com.example.api.ApiService
```

---

## 目录结构

```text
DexAndroid/
├── src/                 # MCP server (TypeScript)
│   ├── index.ts
│   ├── adb.ts
│   ├── detect.ts
│   ├── smali.ts
│   └── unpack/
├── dist/
├── examples/            # Damai / Huaxi sample smali.zip + docs
├── skills/              # 规范 skill 源（改这里再 sync）
├── .cursor/skills/      # Cursor
├── .agents/skills/      # Codex
├── .claude/skills/      # Claude Code
├── tools/               # baksmali / frida-server / BlackDex (local)
├── unpack-output/       # local dumps (gitignored)
├── package.json
└── README.md
```

### Agent Skill（多客户端）

脱壳后使用 **`android-api-smali-analysis`**，强制还原请求头 / Body / 加解密与密钥（smali / `.so` / 服务端下发），禁止只写 path。

| 客户端 | 路径 |
| --- | --- |
| 规范源 | [`skills/android-api-smali-analysis/SKILL.md`](./skills/android-api-smali-analysis/SKILL.md) |
| Cursor | [`.cursor/skills/`](./.cursor/skills/android-api-smali-analysis/) |
| Codex | [`.agents/skills/`](./.agents/skills/android-api-smali-analysis/) |
| Claude Code | [`.claude/skills/`](./.claude/skills/android-api-smali-analysis/)（可 `/android-api-smali-analysis`） |

修改规范源后执行：`node tools/sync-skills.mjs`。详见 [`skills/README.md`](./skills/README.md)。

---

## 反编译示例

仓库 [`examples/`](./examples/) 提供两套可下载示例（smali 为 zip）：

| 示例 | 路径 | 内容 |
| --- | --- | --- |
| 大麦 | [`examples/damai/`](./examples/damai/) | Frida smali 压缩包 + API / 选座 / 登录文档 |
| 华西妇幼 | [`examples/huaxi/`](./examples/huaxi/) | 静态解包 smali 压缩包（`info.cd120.two`） |

解压后即可对目录执行 `smali_list_classes` / `smali_search` / `smali_read_class`。

---

## MCP 工具参数速查

| Tool | Params |
| --- | --- |
| `detect_packer` | `apkPath` or `pkg`, optional `serial` |
| `pull_apk` | `pkg`, optional `outDir` / `serial` |
| `static_unpack` | `apkPath` or `pkg`, optional `outDir` |
| `blackdex_prepare` | `blackdexApkPath`, optional `serial` |
| `blackdex_pull` | `targetPkg`, optional `outDir` / `serial` |
| `frida_prepare` | optional `serial` / `serverLocalPath` |
| `frida_unpack` | `pkg`, optional `spawn` / `deepSearch` / `outDir` |
| `dex_to_smali` | `dexInput`, optional `outDir` |
| `smali_list_classes` | `smaliDir`, optional `keyword` |
| `smali_read_class` | `smaliDir`, `className` |
| `smali_search` | `smaliDir`, `pattern`, optional `flags` / `maxResults` |
| `find_app_entry` | `projectDir` / `manifestPath` / `apkPath`，可选 `smaliDir` |
| `apk_decode` | `apkPath`，可选 `outDir` |
| `apk_repack` | `projectDir`，可选 `outApk` / keystore 参数 |
| `smali_patch` | `mode` + `smaliPath`/`projectDir`；自备 `content` 或 `insert_verify_log` |

---

## 常见问题

**Q: `list_devices` 为空？**  
检查 USB 调试、`adb devices`、多设备时传 `serial`。

**Q: 静态解包后找不到业务类？**  
多半是加固壳，请改用 BlackDex 或 Frida。

**Q: `dex_to_smali` 失败？**  
确认已安装 Java，并在 `tools/` 放置 baksmali jar，或设置 `BAKSMALI_JAR`。

**Q: Frida 报 jailed / 版本不匹配？**  
保持 `frida-server` 与本机 `frida` 主版本一致；必要时用 16.x。

**Q: 输出目录在哪？**  
默认 `unpack-output/`（或 `DEX_OUT_DIR`）。**请勿提交到 Git**。

---

## 合规与免责声明

本项目**仅用于学习、教学与已授权的安全研究**。严禁将本工具用于任何违法犯罪活动，包括但不限于未授权访问、破解、盗版、攻击他人系统或侵犯知识产权。作者与贡献者不对任何滥用行为负责。使用即表示你已阅读并同意上述条款。

> ⚠️ **仅用于学习与教学目的。** 禁止用于任何违法犯罪、未授权破解、侵权或绕过他人防护的行为。使用者须遵守所在国家/地区法律法规与目标应用服务条款；因滥用造成的后果由使用者自行承担。

---

## License

MIT，见仓库根目录 [`LICENSE`](./LICENSE)。
