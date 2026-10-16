import fs from "fs";
import path from "path";

const ROOT = path.resolve("e:/DexAndroid");

const langs = [
  { code: "en", file: "README.md", label: "English" },
  { code: "zh-CN", file: "README.zh-CN.md", label: "简体中文" },
  { code: "zh-TW", file: "README.zh-TW.md", label: "繁體中文" },
  { code: "ja", file: "README.ja.md", label: "日本語" },
  { code: "ko", file: "README.ko.md", label: "한국어" },
  { code: "es", file: "README.es.md", label: "Español" },
  { code: "fr", file: "README.fr.md", label: "Français" },
  { code: "de", file: "README.de.md", label: "Deutsch" },
  { code: "pt-BR", file: "README.pt-BR.md", label: "Português" },
  { code: "ru", file: "README.ru.md", label: "Русский" },
  { code: "ar", file: "README.ar.md", label: "العربية" },
  { code: "hi", file: "README.hi.md", label: "हिन्दी" },
  { code: "id", file: "README.id.md", label: "Bahasa Indonesia" },
  { code: "vi", file: "README.vi.md", label: "Tiếng Việt" },
  { code: "th", file: "README.th.md", label: "ไทย" },
  { code: "it", file: "README.it.md", label: "Italiano" },
  { code: "tr", file: "README.tr.md", label: "Türkçe" },
];

function switcher(currentFile) {
  return langs
    .map((l) =>
      l.file === currentFile ? `**${l.label}**` : `[${l.label}](./${l.file})`
    )
    .join(" · ");
}

const mcpJson = `{
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
}`;

const installBash = `git clone https://github.com/TimeCyber/DexAndroid.git
cd DexAndroid
npm install
npm run build`;

const startBash = `npm start
# node dist/index.js`;

const smaliEx = `smali_list_classes  smaliDir=.../smali  keyword=login
smali_search        smaliDir=.../smali  pattern=https?://|/api/|publicClient/
smali_read_class    smaliDir=.../smali  className=com.example.api.ApiService`;

const tree = `DexAndroid/
├── src/                 # MCP server (TypeScript)
│   ├── index.ts
│   ├── adb.ts
│   ├── detect.ts
│   ├── smali.ts
│   └── unpack/
├── dist/
├── examples/            # Damai / Huaxi sample smali.zip + docs
├── tools/               # baksmali / frida-server / BlackDex (local)
├── unpack-output/       # local dumps (gitignored)
├── package.json
└── README.md`;

const featureTable = `| | MCP | |
| --- | --- | --- |
| Devices | \`list_devices\` | ADB devices |
| Packages | \`list_packages\` | Filter by keyword |
| Packer detect | \`detect_packer\` | 360 / Tencent / Bangcle / ijiami / Alibaba, etc. |
| Pull APK | \`pull_apk\` | Installed app (+ splits) |
| Static unpack | \`static_unpack\` | Extract \`classes*.dex\` |
| No-Root unpack | \`blackdex_prepare\` / \`blackdex_pull\` | BlackDex dump |
| Root unpack | \`frida_prepare\` / \`frida_unpack\` | frida-server + frida-dexdump |
| Decompile | \`dex_to_smali\` | baksmali → smali |
| Analyze | \`smali_list_classes\` / \`smali_read_class\` / \`smali_search\` | List / read / regex |`;

const compareTable = `| | Root? | When |
| --- | --- | --- |
| Static | No | Unpacked / shell / resources only |
| BlackDex | No | Most protected apps |
| Frida | **Yes** | Strong packers / fuller dump |`;

const envTable = `| Var | Meaning | Default |
| --- | --- | --- |
| \`ADB_PATH\` | adb binary | \`adb\` |
| \`DEX_OUT_DIR\` | Output dir | \`<cwd>/unpack-output\` |
| \`BAKSMALI_JAR\` | baksmali jar | auto under \`tools/\` |`;

const toolsTable = `| Tool | Params |
| --- | --- |
| \`detect_packer\` | \`apkPath\` or \`pkg\`, optional \`serial\` |
| \`pull_apk\` | \`pkg\`, optional \`outDir\` / \`serial\` |
| \`static_unpack\` | \`apkPath\` or \`pkg\`, optional \`outDir\` |
| \`blackdex_prepare\` | \`blackdexApkPath\`, optional \`serial\` |
| \`blackdex_pull\` | \`targetPkg\`, optional \`outDir\` / \`serial\` |
| \`frida_prepare\` | optional \`serial\` / \`serverLocalPath\` |
| \`frida_unpack\` | \`pkg\`, optional \`spawn\` / \`deepSearch\` / \`outDir\` |
| \`dex_to_smali\` | \`dexInput\`, optional \`outDir\` |
| \`smali_list_classes\` | \`smaliDir\`, optional \`keyword\` |
| \`smali_read_class\` | \`smaliDir\`, \`className\` |
| \`smali_search\` | \`smaliDir\`, \`pattern\`, optional \`flags\` / \`maxResults\` |`;

const examplesTable = `| App | Path | Contents |
| --- | --- | --- |
| Damai | [\`examples/damai/\`](./examples/damai/) | Frida smali.zip + API docs |
| Huaxi Maternity | [\`examples/huaxi/\`](./examples/huaxi/) | Static smali.zip (\`info.cd120.two\`) |`;

/** @type {Record<string, any>} */
const T = {
  "zh-CN": {
    title: "安卓脱壳 + smali 分析 **MCP Server**。在 Cursor / Claude 等客户端中通过工具调用完成：设备管理、加固检测、静态/免 Root/Root 脱壳、dex→smali、接口字符串检索。",
    disclaimer:
      "> ⚠️ **仅用于学习与教学目的。** 禁止用于任何违法犯罪、未授权破解、侵权或绕过他人防护的行为。使用者须遵守所在国家/地区法律法规与目标应用服务条款；因滥用造成的后果由使用者自行承担。",
    hFeatures: "功能概览",
    hCompare: "三种脱壳方案对比",
    hReq: "环境要求",
    req: [
      "**Windows / macOS / Linux**（文档以 Windows 为例）",
      "**Node.js** ≥ 18",
      "**ADB**：加入 PATH，或设置 `ADB_PATH`",
      "**Java 8+**（`dex_to_smali` 调用 baksmali）",
      "可选：[BlackDex](https://github.com/CodingGay/BlackDex/releases) APK；设备 Root + `frida-server`；本机 `pip install frida-tools frida-dexdump`",
    ],
    reqNote:
      "将 baksmali fat jar / frida-server / BlackDex 放到本地 `tools/`（大文件默认不进 Git，见 `.gitignore`）。",
    hInstall: "安装与构建",
    hStart: "启动 MCP（stdio，供客户端拉起）",
    hDev: "开发模式（先编译再启动）",
    hCursor: "接入 Cursor（MCP）",
    cursorNote:
      "在项目 `.cursor/mcp.json` 或 Cursor 全局 MCP 配置中增加（**路径改成你的本机目录**）：",
    cursorAfter:
      "保存后重启 Cursor / 重载 MCP。例如：「列出设备并检测加固」「对本地 apk 做 static_unpack，再 dex_to_smali，搜索登录接口」。",
    hEnv: "环境变量",
    hUsage: "使用说明（典型流程）",
    hStatic: "1. 静态解包（最快）",
    staticSteps: [
      "`list_devices` 确认设备（若用 `pkg` 拉取）或准备本地 `apkPath`。",
      "`detect_packer` 看是否加固。",
      "`static_unpack` → 得到 `classes*.dex`。",
      "`dex_to_smali` → smali 目录。",
      "`smali_search` / `smali_read_class` 分析接口、字符串、加解密等。",
    ],
    staticNote:
      "**注意：** 加固 App 的静态 dex 往往只有壳，业务代码需 BlackDex / Frida。",
    hBlack: "2. 免 Root（BlackDex）",
    blackSteps: [
      "`list_devices`。",
      "`blackdex_prepare`，传入 `blackdexApkPath`。",
      "在手机 BlackDex 界面选择目标应用并脱壳。",
      "`blackdex_pull`，传入 `targetPkg`。",
      "`dex_to_smali` → 再 `smali_*` 分析。",
    ],
    hFrida: "3. Root（Frida）",
    fridaSteps: [
      "设备已 Root（如 Magisk），`adb` 可用。",
      "`frida_prepare`：推送并启动 `tools/frida-server`。",
      "本机已安装匹配版本的 `frida` / `frida-dexdump`（建议 16.x）。",
      "`frida_unpack`：传 `pkg`，建议 `spawn: true`、`deepSearch: true`。",
      "对输出目录 `dex_to_smali` 后分析。",
    ],
    fridaNote:
      "若 Frida 17 附加失败，可降级到同一 16.x；部分机型需临时 `setenforce 0`。",
    hSmali: "4. smali 分析示例",
    hTree: "目录结构",
    hExamples: "反编译示例",
    examplesIntro:
      "仓库 [`examples/`](./examples/) 提供两套可下载示例（smali 为 zip）：",
    examplesAfter:
      "解压后即可对目录执行 `smali_list_classes` / `smali_search` / `smali_read_class`。",
    hTools: "MCP 工具参数速查",
    hMock: "可选：Mock 演示客户端",
    mockBody:
      "`mock-client/` 为独立小服务，演示「登录 → 选座 → 下单」本地 Mock，**不请求真实线上业务**。详见 [mock-client/README.md](./mock-client/README.md)。",
    mockOpen: "浏览器打开 `http://127.0.0.1:17806/`。",
    hFaq: "常见问题",
    faq: [
      ["`list_devices` 为空？", "检查 USB 调试、`adb devices`、多设备时传 `serial`。"],
      ["静态解包后找不到业务类？", "多半是加固壳，请改用 BlackDex 或 Frida。"],
      ["`dex_to_smali` 失败？", "确认已安装 Java，并在 `tools/` 放置 baksmali jar，或设置 `BAKSMALI_JAR`。"],
      ["Frida 报 jailed / 版本不匹配？", "保持 `frida-server` 与本机 `frida` 主版本一致；必要时用 16.x。"],
      ["输出目录在哪？", "默认 `unpack-output/`（或 `DEX_OUT_DIR`）。**请勿提交到 Git**。"],
    ],
    hLegal: "合规与免责声明",
    legal:
      "本项目**仅用于学习、教学与已授权的安全研究**。严禁将本工具用于任何违法犯罪活动，包括但不限于未授权访问、破解、盗版、攻击他人系统或侵犯知识产权。作者与贡献者不对任何滥用行为负责。使用即表示你已阅读并同意上述条款。",
    hLicense: "License",
    license: "MIT（若仓库内存在 `LICENSE` 文件，以该文件为准）。",
    featHead: ["能力", "MCP 工具", "说明"],
    featRows: [
      ["设备列表", "`list_devices`", "ADB 已连接设备"],
      ["包名列表", "`list_packages`", "可按关键字过滤"],
      ["加固识别", "`detect_packer`", "360 / 腾讯 / 梆梆 / 爱加密 / 阿里聚安全等"],
      ["拉 APK", "`pull_apk`", "从设备拉取已安装应用（含 split）"],
      ["静态解包", "`static_unpack`", "解压 APK 提取 `classes*.dex`"],
      ["免 Root 脱壳", "`blackdex_prepare` / `blackdex_pull`", "BlackDex 内存 dump 后拉取"],
      ["Root 脱壳", "`frida_prepare` / `frida_unpack`", "推送 frida-server + frida-dexdump"],
      ["反编译", "`dex_to_smali`", "baksmali 转 smali"],
      ["分析", "`smali_list_classes` / `smali_read_class` / `smali_search`", "列类、读类、正则搜索"],
    ],
    cmpHead: ["方案", "是否需要 Root", "适用场景"],
    cmpRows: [
      ["静态解包", "否", "未加固，或只要壳/资源"],
      ["BlackDex", "否", "多数加固 App"],
      ["Frida", "**是**", "强加固 / 壳对抗，内存 dump 更完整"],
    ],
    envHead: ["变量", "说明", "默认"],
    envRows: [
      ["`ADB_PATH`", "adb 可执行文件", "`adb`"],
      ["`DEX_OUT_DIR`", "脱壳/拉取默认输出目录", "`<cwd>/unpack-output`"],
      ["`BAKSMALI_JAR`", "baksmali 可执行 jar", "自动在 `tools/` 下查找"],
    ],
    exHead: ["示例", "路径", "内容"],
    exRows: [
      ["大麦", "[`examples/damai/`](./examples/damai/)", "Frida smali 压缩包 + API / 选座 / 登录文档"],
      ["华西妇幼", "[`examples/huaxi/`](./examples/huaxi/)", "静态解包 smali 压缩包（`info.cd120.two`）"],
    ],
  },
};

// Build other languages from English base + localized strings
T.en = {
  title:
    "Android unpacking + smali analysis **MCP Server**. Use from Cursor / Claude to manage devices, detect packers, unpack (static / BlackDex / Frida), convert dex→smali, and search API strings.",
  disclaimer:
    "> ⚠️ **For learning and teaching purposes only.** Do **not** use this project for any illegal activity, unauthorized cracking, copyright infringement, or bypassing third-party protections. You must follow local laws and the target app’s terms. You are solely responsible for misuse.",
  hFeatures: "Features",
  hCompare: "Unpacking methods",
  hReq: "Requirements",
  req: [
    "**Windows / macOS / Linux** (docs use Windows examples)",
    "**Node.js** ≥ 18",
    "**ADB** on PATH, or set `ADB_PATH`",
    "**Java 8+** (for baksmali via `dex_to_smali`)",
    "Optional: [BlackDex](https://github.com/CodingGay/BlackDex/releases); rooted device + `frida-server`; `pip install frida-tools frida-dexdump`",
  ],
  reqNote:
    "Place baksmali fat jar / frida-server / BlackDex under local `tools/` (large binaries are gitignored).",
  hInstall: "Install & build",
  hStart: "Start MCP (stdio)",
  hDev: "Dev mode",
  hCursor: "Cursor MCP setup",
  cursorNote:
    "Add to `.cursor/mcp.json` or global MCP config (**change paths to your machine**):",
  cursorAfter:
    "Restart Cursor / reload MCP. Example prompts: list devices & detect packer; static_unpack a local apk, then dex_to_smali and search login APIs.",
  hEnv: "Environment variables",
  hUsage: "Typical workflows",
  hStatic: "1. Static unpack (fastest)",
  staticSteps: [
    "`list_devices` or prepare local `apkPath`.",
    "`detect_packer`.",
    "`static_unpack` → `classes*.dex`.",
    "`dex_to_smali` → smali folder.",
    "`smali_search` / `smali_read_class`.",
  ],
  staticNote:
    "**Note:** Protected apps often yield only the shell via static unpack—use BlackDex / Frida for business code.",
  hBlack: "2. No-Root (BlackDex)",
  blackSteps: [
    "`list_devices`.",
    "`blackdex_prepare` with `blackdexApkPath`.",
    "Unpack the target app in BlackDex UI.",
    "`blackdex_pull` with `targetPkg`.",
    "`dex_to_smali` then `smali_*`.",
  ],
  hFrida: "3. Root (Frida)",
  fridaSteps: [
    "Rooted device (e.g. Magisk), `adb` ready.",
    "`frida_prepare` to push/start `tools/frida-server`.",
    "Matching `frida` / `frida-dexdump` locally (prefer 16.x).",
    "`frida_unpack` with `pkg`, prefer `spawn: true`, `deepSearch: true`.",
    "`dex_to_smali` on output, then analyze.",
  ],
  fridaNote:
    "If Frida 17 attach fails, align tools to 16.x; some devices need temporary `setenforce 0`.",
  hSmali: "4. smali analysis examples",
  hTree: "Layout",
  hExamples: "Decompile examples",
  examplesIntro: "See [`examples/`](./examples/) (smali shipped as zip):",
  examplesAfter:
    "After unzip, run `smali_list_classes` / `smali_search` / `smali_read_class`.",
  hTools: "MCP tool cheatsheet",
  hMock: "Optional mock client",
  mockBody:
    "`mock-client/` demos login → seat → order locally and **does not hit real production APIs**. See [mock-client/README.md](./mock-client/README.md).",
  mockOpen: "Open `http://127.0.0.1:17806/`.",
  hFaq: "FAQ",
  faq: [
    ["Empty `list_devices`?", "Check USB debugging, `adb devices`, pass `serial` if multiple."],
    ["No business classes after static unpack?", "Likely packed—use BlackDex or Frida."],
    ["`dex_to_smali` failed?", "Install Java; put baksmali jar in `tools/` or set `BAKSMALI_JAR`."],
    ["Frida jailed / version mismatch?", "Keep `frida-server` and host `frida` major versions aligned; try 16.x."],
    ["Where is output?", "Default `unpack-output/` (or `DEX_OUT_DIR`). **Do not commit dumps.**"],
  ],
  hLegal: "Legal & disclaimer",
  legal:
    "This project is **only for learning, teaching, and authorized security research**. It is strictly forbidden to use it for any criminal or illegal activity, including unauthorized access, cracking, piracy, attacking systems, or IP infringement. Authors and contributors are not liable for misuse. By using this software you agree to these terms.",
  hLicense: "License",
  license: "MIT (see `LICENSE` in the repo if present).",
  featHead: ["Capability", "MCP tool", "Notes"],
  featRows: [
    ["Devices", "`list_devices`", "Connected ADB devices"],
    ["Packages", "`list_packages`", "Optional keyword filter"],
    ["Packer detect", "`detect_packer`", "360 / Tencent / Bangcle / ijiami / Alibaba, etc."],
    ["Pull APK", "`pull_apk`", "Installed app (+ splits)"],
    ["Static unpack", "`static_unpack`", "Extract `classes*.dex`"],
    ["No-Root unpack", "`blackdex_prepare` / `blackdex_pull`", "BlackDex memory dump"],
    ["Root unpack", "`frida_prepare` / `frida_unpack`", "frida-server + frida-dexdump"],
    ["Decompile", "`dex_to_smali`", "baksmali → smali"],
    ["Analyze", "`smali_list_classes` / `smali_read_class` / `smali_search`", "List / read / regex"],
  ],
  cmpHead: ["Method", "Root?", "Use when"],
  cmpRows: [
    ["Static", "No", "Unpacked apps or shell/resources only"],
    ["BlackDex", "No", "Most protected apps"],
    ["Frida", "**Yes**", "Strong packers / fuller dumps"],
  ],
  envHead: ["Variable", "Meaning", "Default"],
  envRows: [
    ["`ADB_PATH`", "adb executable", "`adb`"],
    ["`DEX_OUT_DIR`", "Default output dir", "`<cwd>/unpack-output`"],
    ["`BAKSMALI_JAR`", "baksmali jar", "auto-discover under `tools/`"],
  ],
  exHead: ["Sample", "Path", "Contents"],
  exRows: [
    ["Damai", "[`examples/damai/`](./examples/damai/)", "Frida smali.zip + API docs"],
    ["Huaxi Maternity", "[`examples/huaxi/`](./examples/huaxi/)", "Static smali.zip (`info.cd120.two`)"],
  ],
};

function cloneEn(overrides) {
  return { ...T.en, ...overrides };
}

T["zh-TW"] = cloneEn({
  title:
    "安卓脫殼 + smali 分析 **MCP Server**。可在 Cursor / Claude 等客戶端透過工具呼叫完成：裝置管理、加固偵測、靜態/免 Root/Root 脫殼、dex→smali、介面字串檢索。",
  disclaimer:
    "> ⚠️ **僅供學習與教學用途。** 禁止用於任何違法犯罪、未授權破解、侵權或規避他人防護之行為。使用者須遵守當地法律與目標應用服務條款；濫用後果自負。",
  hFeatures: "功能概覽",
  hCompare: "三種脫殼方案比較",
  hReq: "環境需求",
  req: [
    "**Windows / macOS / Linux**（文件以 Windows 為例）",
    "**Node.js** ≥ 18",
    "**ADB**：加入 PATH，或設定 `ADB_PATH`",
    "**Java 8+**（`dex_to_smali` 呼叫 baksmali）",
    "可選：[BlackDex](https://github.com/CodingGay/BlackDex/releases)；裝置 Root + `frida-server`；本機 `pip install frida-tools frida-dexdump`",
  ],
  reqNote:
    "請將 baksmali fat jar / frida-server / BlackDex 放於本機 `tools/`（大型檔案預設不進 Git）。",
  hInstall: "安裝與建置",
  hStart: "啟動 MCP（stdio）",
  hDev: "開發模式",
  hCursor: "接入 Cursor（MCP）",
  cursorNote: "於 `.cursor/mcp.json` 或全域 MCP 設定新增（**路徑請改為本機**）：",
  cursorAfter: "儲存後重啟 Cursor / 重載 MCP。",
  hEnv: "環境變數",
  hUsage: "使用說明（典型流程）",
  hStatic: "1. 靜態解包（最快）",
  staticSteps: [
    "`list_devices` 或準備本機 `apkPath`。",
    "`detect_packer`。",
    "`static_unpack` → `classes*.dex`。",
    "`dex_to_smali` → smali 目錄。",
    "`smali_search` / `smali_read_class`。",
  ],
  staticNote: "**注意：** 加固 App 靜態 dex 常只有殼，業務程式碼需 BlackDex / Frida。",
  hBlack: "2. 免 Root（BlackDex）",
  blackSteps: [
    "`list_devices`。",
    "`blackdex_prepare`（`blackdexApkPath`）。",
    "於手機 BlackDex 介面選擇目標 App 並脫殼。",
    "`blackdex_pull`（`targetPkg`）。",
    "`dex_to_smali` 後再 `smali_*`。",
  ],
  hFrida: "3. Root（Frida）",
  fridaSteps: [
    "裝置已 Root，`adb` 可用。",
    "`frida_prepare` 推送並啟動 `frida-server`。",
    "本機安裝相符版本 `frida` / `frida-dexdump`（建議 16.x）。",
    "`frida_unpack`（建議 `spawn: true`、`deepSearch: true`）。",
    "`dex_to_smali` 後分析。",
  ],
  fridaNote: "若 Frida 17 附加失敗，可對齊至 16.x；部分機型需暫時 `setenforce 0`。",
  hSmali: "4. smali 分析範例",
  hTree: "目錄結構",
  hExamples: "反編譯範例",
  examplesIntro: "見 [`examples/`](./examples/)（smali 以 zip 提供）：",
  examplesAfter: "解壓後即可執行 `smali_*` 工具。",
  hTools: "MCP 工具參數速查",
  hMock: "可選：Mock 示範客戶端",
  mockBody:
    "`mock-client/` 示範「登入 → 選座 → 下單」本地 Mock，**不請求真實線上業務**。詳見 [mock-client/README.md](./mock-client/README.md)。",
  mockOpen: "瀏覽器開啟 `http://127.0.0.1:17806/`。",
  hFaq: "常見問題",
  faq: [
    ["`list_devices` 為空？", "檢查 USB 偵錯、`adb devices`，多裝置時傳 `serial`。"],
    ["靜態解包後找不到業務類？", "多半是加固殼，請改用 BlackDex 或 Frida。"],
    ["`dex_to_smali` 失敗？", "確認已安裝 Java，並放置 baksmali jar 或設定 `BAKSMALI_JAR`。"],
    ["Frida jailed / 版本不符？", "保持 `frida-server` 與本機 `frida` 主版本一致；必要時用 16.x。"],
    ["輸出目錄在哪？", "預設 `unpack-output/`。**請勿提交至 Git**。"],
  ],
  hLegal: "合規與免責聲明",
  legal:
    "本專案**僅供學習、教學與已授權安全研究**。嚴禁用於任何違法犯罪行為，包括未授權存取、破解、盜版、攻擊系統或侵害智慧財產權。作者與貢獻者不對濫用負責。使用即表示同意上述條款。",
  hLicense: "License",
  license: "MIT（若倉庫內有 `LICENSE`，以其為準）。",
  featHead: ["能力", "MCP 工具", "說明"],
  featRows: T["zh-CN"].featRows,
  cmpHead: ["方案", "是否需要 Root", "適用場景"],
  cmpRows: T["zh-CN"].cmpRows,
  envHead: ["變數", "說明", "預設"],
  envRows: T["zh-CN"].envRows,
  exHead: ["範例", "路徑", "內容"],
  exRows: [
    ["大麥", "[`examples/damai/`](./examples/damai/)", "Frida smali 壓縮包 + API 文件"],
    ["華西婦幼", "[`examples/huaxi/`](./examples/huaxi/)", "靜態解包 smali 壓縮包（`info.cd120.two`）"],
  ],
});

T.ja = cloneEn({
  title:
    "Android アンパック + smali 解析用 **MCP Server**。Cursor / Claude などから、端末管理・保護検知・静的/非 Root/Root アンパック・dex→smali・API 文字列検索が可能です。",
  disclaimer:
    "> ⚠️ **学習・教育目的のみ。** 違法行為、無断クラック、権利侵害、第三者保護の回避には使用しないでください。各国の法令と対象アプリの利用規約を遵守してください。悪用の責任は利用者にあります。",
  hFeatures: "機能",
  hCompare: "アンパック方式の比較",
  hReq: "要件",
  req: [
    "**Windows / macOS / Linux**（手順は Windows 例）",
    "**Node.js** ≥ 18",
    "**ADB**（PATH または `ADB_PATH`）",
    "**Java 8+**（baksmali）",
    "任意：[BlackDex](https://github.com/CodingGay/BlackDex/releases)、Root + `frida-server`、`pip install frida-tools frida-dexdump`",
  ],
  reqNote: "`tools/` に baksmali / frida-server / BlackDex を配置（大きなバイナリは gitignore）。",
  hInstall: "インストールとビルド",
  hStart: "MCP 起動（stdio）",
  hDev: "開発モード",
  hCursor: "Cursor（MCP）連携",
  cursorNote: "`.cursor/mcp.json` などに追加（**パスは環境に合わせて変更**）：",
  cursorAfter: "保存後 Cursor を再起動 / MCP を再読込。",
  hEnv: "環境変数",
  hUsage: "典型的な手順",
  hStatic: "1. 静的アンパック（最速）",
  staticSteps: [
    "`list_devices` またはローカル `apkPath`。",
    "`detect_packer`。",
    "`static_unpack` → `classes*.dex`。",
    "`dex_to_smali`。",
    "`smali_search` / `smali_read_class`。",
  ],
  staticNote: "**注意:** 保護アプリの静的 dex はシェルのみのことが多いです。業務コードは BlackDex / Frida を。",
  hBlack: "2. 非 Root（BlackDex）",
  blackSteps: [
    "`list_devices`。",
    "`blackdex_prepare`（`blackdexApkPath`）。",
    "端末の BlackDex で対象アプリをダンプ。",
    "`blackdex_pull`（`targetPkg`）。",
    "`dex_to_smali` → `smali_*`。",
  ],
  hFrida: "3. Root（Frida）",
  fridaSteps: [
    "Root 済み、`adb` 利用可。",
    "`frida_prepare` で `frida-server` を起動。",
    "ホスト側 `frida` / `frida-dexdump` をバージョン合わせ（推奨 16.x）。",
    "`frida_unpack`（`spawn: true`、`deepSearch: true` 推奨）。",
    "`dex_to_smali` 後に解析。",
  ],
  fridaNote: "Frida 17 で失敗する場合は 16.x に揃えてください。必要なら一時的に `setenforce 0`。",
  hSmali: "4. smali 解析例",
  hTree: "構成",
  hExamples: "デコンパイル例",
  examplesIntro: "[`examples/`](./examples/) を参照（smali は zip）：",
  examplesAfter: "解凍後に `smali_*` を実行できます。",
  hTools: "MCP ツール早見表",
  hMock: "任意：Mock クライアント",
  mockBody:
    "`mock-client/` はログイン→座席→注文のローカル Mock で、**本番 API にはアクセスしません**。[mock-client/README.md](./mock-client/README.md)",
  mockOpen: "`http://127.0.0.1:17806/` を開く。",
  hFaq: "FAQ",
  faq: [
    ["`list_devices` が空？", "USB デバッグと `adb devices` を確認。複数端末は `serial`。"],
    ["静的後に業務クラスがない？", "保護の可能性大 → BlackDex / Frida。"],
    ["`dex_to_smali` 失敗？", "Java と baksmali jar（または `BAKSMALI_JAR`）を確認。"],
    ["Frida jailed / 版不一致？", "`frida-server` とホスト `frida` のメジャー版を揃える。"],
    ["出力先は？", "既定は `unpack-output/`。**Git にコミットしないでください。**"],
  ],
  hLegal: "法令遵守と免責",
  legal:
    "本プロジェクトは**学習・教育および許可されたセキュリティ研究のみ**を目的とします。不正アクセス、クラック、著作権侵害など違法行為への使用を固く禁じます。悪用について作者・貢献者は責任を負いません。利用により本条件に同意したものとみなします。",
  license: "MIT（リポジトリに `LICENSE` がある場合はそれに従う）。",
  featHead: ["機能", "MCP ツール", "説明"],
  cmpHead: ["方式", "Root?", "用途"],
  envHead: ["変数", "意味", "既定"],
  exHead: ["例", "パス", "内容"],
  exRows: [
    ["Damai", "[`examples/damai/`](./examples/damai/)", "Frida smali.zip + API 文書"],
    ["Huaxi", "[`examples/huaxi/`](./examples/huaxi/)", "静的 smali.zip（`info.cd120.two`）"],
  ],
});

T.ko = cloneEn({
  title:
    "안드로이드 언패킹 + smali 분석 **MCP Server**. Cursor / Claude 등에서 기기 관리, 보호(패커) 탐지, 정적/비루팅/루팅 언패킹, dex→smali, API 문자열 검색을 수행합니다.",
  disclaimer:
    "> ⚠️ **학습 및 교육 목적으로만 사용하세요.** 불법 행위, 무단 크래킹, 저작권 침해, 제3자 보호 우회에 사용하지 마십시오. 현지 법령과 대상 앱 약관을 준수해야 하며, 오남용 책임은 사용자에게 있습니다.",
  hFeatures: "기능",
  hCompare: "언패킹 방식 비교",
  hReq: "요구 사항",
  req: [
    "**Windows / macOS / Linux** (문서는 Windows 기준)",
    "**Node.js** ≥ 18",
    "**ADB** (PATH 또는 `ADB_PATH`)",
    "**Java 8+** (baksmali)",
    "선택: [BlackDex](https://github.com/CodingGay/BlackDex/releases), 루팅 + `frida-server`, `pip install frida-tools frida-dexdump`",
  ],
  reqNote: "`tools/`에 baksmali / frida-server / BlackDex 배치 (대용량은 gitignore).",
  hInstall: "설치 및 빌드",
  hStart: "MCP 시작 (stdio)",
  hDev: "개발 모드",
  hCursor: "Cursor MCP 연동",
  cursorNote: "`.cursor/mcp.json` 등에 추가 (**경로를 로컬에 맞게 수정**):",
  cursorAfter: "저장 후 Cursor 재시작 / MCP 리로드.",
  hEnv: "환경 변수",
  hUsage: "사용 흐름",
  hStatic: "1. 정적 언패킹 (가장 빠름)",
  staticSteps: [
    "`list_devices` 또는 로컬 `apkPath`.",
    "`detect_packer`.",
    "`static_unpack` → `classes*.dex`.",
    "`dex_to_smali`.",
    "`smali_search` / `smali_read_class`.",
  ],
  staticNote: "**참고:** 보호 앱의 정적 dex는 쉘만일 수 있습니다. 비즈니스 코드는 BlackDex / Frida.",
  hBlack: "2. 비루팅 (BlackDex)",
  blackSteps: [
    "`list_devices`.",
    "`blackdex_prepare` (`blackdexApkPath`).",
    "BlackDex UI에서 대상 앱 덤프.",
    "`blackdex_pull` (`targetPkg`).",
    "`dex_to_smali` 후 `smali_*`.",
  ],
  hFrida: "3. 루팅 (Frida)",
  fridaSteps: [
    "루팅된 기기, `adb` 사용 가능.",
    "`frida_prepare`로 `frida-server` 실행.",
    "호스트 `frida` / `frida-dexdump` 버전 맞춤 (권장 16.x).",
    "`frida_unpack` (`spawn: true`, `deepSearch: true` 권장).",
    "`dex_to_smali` 후 분석.",
  ],
  fridaNote: "Frida 17 실패 시 16.x로 맞추세요. 일부 기기는 임시 `setenforce 0`.",
  hSmali: "4. smali 분석 예",
  hTree: "디렉터리 구조",
  hExamples: "디컴파일 예제",
  examplesIntro: "[`examples/`](./examples/) 참고 (smali는 zip):",
  examplesAfter: "압축 해제 후 `smali_*` 실행.",
  hTools: "MCP 도구 치트시트",
  hMock: "선택: Mock 클라이언트",
  mockBody:
    "`mock-client/`는 로그인→좌석→주문 로컬 Mock이며 **실제 온라인 API를 호출하지 않습니다**. [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "`http://127.0.0.1:17806/` 열기.",
  hFaq: "FAQ",
  faq: [
    ["`list_devices`가 비어 있음?", "USB 디버깅/`adb devices` 확인, 다중 기기는 `serial`."],
    ["정적 후 비즈니스 클래스 없음?", "패커 가능성 → BlackDex/Frida."],
    ["`dex_to_smali` 실패?", "Java와 baksmali jar/`BAKSMALI_JAR` 확인."],
    ["Frida jailed / 버전 불일치?", "`frida-server`와 호스트 `frida` 메이저 버전 일치."],
    ["출력 위치?", "기본 `unpack-output/`. **Git에 커밋하지 마세요.**"],
  ],
  hLegal: "법적 고지 및 면책",
  legal:
    "본 프로젝트는 **학습·교육 및 승인된 보안 연구 전용**입니다. 무단 접근, 크래킹, 불법 복제, 시스템 공격, 지식재산권 침해 등 일체의 불법 행위에 사용하는 것을 엄격히 금지합니다. 오남용에 대해 저자와 기여자는 책임지지 않습니다. 사용 시 본 조건에 동의한 것으로 간주합니다.",
  license: "MIT (저장소에 `LICENSE`가 있으면 해당 파일 기준).",
  featHead: ["기능", "MCP 도구", "설명"],
  cmpHead: ["방식", "Root?", "용도"],
  envHead: ["변수", "의미", "기본값"],
  exHead: ["예제", "경로", "내용"],
});

T.es = cloneEn({
  title:
    "**MCP Server** de desempaquetado Android + análisis smali. Desde Cursor / Claude: dispositivos, detección de protectores, unpack estático / BlackDex / Frida, dex→smali y búsqueda de APIs.",
  disclaimer:
    "> ⚠️ **Solo para aprendizaje y enseñanza.** No lo use para actividades ilegales, cracking no autorizado, infracción de derechos ni elusión de protecciones de terceros. Cumpla las leyes locales y los términos de la app. Usted es responsable del mal uso.",
  hFeatures: "Funciones",
  hCompare: "Métodos de unpack",
  hReq: "Requisitos",
  hInstall: "Instalación y compilación",
  hStart: "Iniciar MCP (stdio)",
  hDev: "Modo desarrollo",
  hCursor: "Integración Cursor (MCP)",
  cursorNote: "Añada a `.cursor/mcp.json` (**ajuste las rutas**):",
  cursorAfter: "Reinicie Cursor / recargue MCP.",
  hEnv: "Variables de entorno",
  hUsage: "Flujos típicos",
  hStatic: "1. Unpack estático (más rápido)",
  hBlack: "2. Sin Root (BlackDex)",
  hFrida: "3. Con Root (Frida)",
  hSmali: "4. Ejemplos smali",
  hTree: "Estructura",
  hExamples: "Ejemplos de decompilación",
  examplesIntro: "Vea [`examples/`](./examples/) (smali en zip):",
  examplesAfter: "Tras descomprimir, use `smali_*`.",
  hTools: "Referencia rápida MCP",
  hMock: "Opcional: cliente Mock",
  mockBody:
    "`mock-client/` simula login → asiento → pedido **sin llamar APIs reales**. [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "Abra `http://127.0.0.1:17806/`.",
  hFaq: "Preguntas frecuentes",
  hLegal: "Aviso legal",
  legal:
    "Este proyecto es **solo para aprendizaje, enseñanza e investigación de seguridad autorizada**. Queda prohibido usarlo para delitos o ilegalidades (acceso no autorizado, cracking, piratería, ataques o infracción de PI). Autores y contribuidores no responden por abusos. Al usarlo acepta estos términos.",
  featHead: ["Capacidad", "Herramienta MCP", "Notas"],
  cmpHead: ["Método", "¿Root?", "Cuándo"],
  envHead: ["Variable", "Significado", "Por defecto"],
  exHead: ["Ejemplo", "Ruta", "Contenido"],
});

T.fr = cloneEn({
  title:
    "**MCP Server** de dépaquetage Android + analyse smali. Depuis Cursor / Claude : appareils, détection de packers, unpack statique / BlackDex / Frida, dex→smali, recherche d’API.",
  disclaimer:
    "> ⚠️ **Uniquement à des fins d’apprentissage et d’enseignement.** Interdit pour toute activité illégale, crack non autorisé, contrefaçon ou contournement de protections. Respectez les lois locales et les conditions de l’application. Vous êtes responsable des abus.",
  hFeatures: "Fonctionnalités",
  hCompare: "Méthodes d’unpack",
  hReq: "Prérequis",
  hInstall: "Installation et build",
  hStart: "Démarrer le MCP (stdio)",
  hDev: "Mode développement",
  hCursor: "Intégration Cursor (MCP)",
  cursorNote: "Ajoutez dans `.cursor/mcp.json` (**adaptez les chemins**) :",
  cursorAfter: "Redémarrez Cursor / rechargez le MCP.",
  hEnv: "Variables d’environnement",
  hUsage: "Flux typiques",
  hStatic: "1. Unpack statique (le plus rapide)",
  hBlack: "2. Sans Root (BlackDex)",
  hFrida: "3. Avec Root (Frida)",
  hSmali: "4. Exemples smali",
  hTree: "Structure",
  hExamples: "Exemples de décompilation",
  examplesIntro: "Voir [`examples/`](./examples/) (smali en zip) :",
  examplesAfter: "Après extraction, utilisez `smali_*`.",
  hTools: "Aide-mémoire MCP",
  hMock: "Optionnel : client Mock",
  mockBody:
    "`mock-client/` démontre login → siège → commande **sans appeler les APIs de production**. [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "Ouvrez `http://127.0.0.1:17806/`.",
  hFaq: "FAQ",
  hLegal: "Mentions légales",
  legal:
    "Ce projet est **réservé à l’apprentissage, l’enseignement et la recherche en sécurité autorisée**. Toute utilisation criminelle ou illégale (accès non autorisé, crack, piratage, attaques, atteinte à la PI) est interdite. Les auteurs ne sont pas responsables des abus. L’utilisation vaut acceptation.",
  featHead: ["Capacité", "Outil MCP", "Notes"],
  cmpHead: ["Méthode", "Root ?", "Cas d’usage"],
  envHead: ["Variable", "Signification", "Défaut"],
  exHead: ["Exemple", "Chemin", "Contenu"],
});

T.de = cloneEn({
  title:
    "Android-Unpacking + Smali-Analyse **MCP Server**. Über Cursor / Claude: Geräte, Packer-Erkennung, statisches / BlackDex / Frida-Unpacking, dex→smali, API-String-Suche.",
  disclaimer:
    "> ⚠️ **Nur für Lern- und Lehrzwecke.** Nicht für illegale Aktivitäten, unautorisiertes Cracken, Urheberrechtsverletzung oder das Umgehen fremder Schutzmaßnahmen verwenden. Beachten Sie lokale Gesetze und die Nutzungsbedingungen der App. Missbrauch liegt in Ihrer Verantwortung.",
  hFeatures: "Funktionen",
  hCompare: "Unpack-Methoden",
  hReq: "Voraussetzungen",
  hInstall: "Installation & Build",
  hStart: "MCP starten (stdio)",
  hDev: "Entwicklungsmodus",
  hCursor: "Cursor-MCP einrichten",
  cursorNote: "In `.cursor/mcp.json` eintragen (**Pfade anpassen**):",
  cursorAfter: "Cursor neu starten / MCP neu laden.",
  hEnv: "Umgebungsvariablen",
  hUsage: "Typische Abläufe",
  hStatic: "1. Statisches Unpack (schnellste)",
  hBlack: "2. Ohne Root (BlackDex)",
  hFrida: "3. Mit Root (Frida)",
  hSmali: "4. Smali-Beispiele",
  hTree: "Struktur",
  hExamples: "Decompile-Beispiele",
  examplesIntro: "Siehe [`examples/`](./examples/) (Smali als Zip):",
  examplesAfter: "Nach dem Entpacken `smali_*` nutzen.",
  hTools: "MCP-Kurzreferenz",
  hMock: "Optional: Mock-Client",
  mockBody:
    "`mock-client/` demonstriert Login → Sitz → Bestellung **ohne echte Produktions-APIs**. [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "`http://127.0.0.1:17806/` öffnen.",
  hFaq: "FAQ",
  hLegal: "Rechtlicher Hinweis",
  legal:
    "Dieses Projekt dient **ausschließlich dem Lernen, der Lehre und autorisierter Sicherheitsforschung**. Die Nutzung für Straftaten oder illegale Handlungen (unautorisierter Zugriff, Cracking, Piraterie, Angriffe, IP-Verletzung) ist streng untersagt. Autoren und Mitwirkende haften nicht für Missbrauch. Nutzung gilt als Zustimmung.",
  featHead: ["Fähigkeit", "MCP-Tool", "Hinweise"],
  cmpHead: ["Methode", "Root?", "Einsatz"],
  envHead: ["Variable", "Bedeutung", "Standard"],
  exHead: ["Beispiel", "Pfad", "Inhalt"],
});

T["pt-BR"] = cloneEn({
  title:
    "**MCP Server** de unpacking Android + análise smali. No Cursor / Claude: dispositivos, detecção de packers, unpack estático / BlackDex / Frida, dex→smali e busca de APIs.",
  disclaimer:
    "> ⚠️ **Apenas para aprendizado e ensino.** Não use para atividades ilegais, cracking não autorizado, violação de direitos ou contorno de proteções de terceiros. Cumpra as leis locais e os termos do app. Você é responsável pelo mau uso.",
  hFeatures: "Recursos",
  hCompare: "Métodos de unpack",
  hReq: "Requisitos",
  hInstall: "Instalação e build",
  hStart: "Iniciar MCP (stdio)",
  hDev: "Modo dev",
  hCursor: "Integração Cursor (MCP)",
  cursorNote: "Adicione em `.cursor/mcp.json` (**ajuste os caminhos**):",
  cursorAfter: "Reinicie o Cursor / recarregue o MCP.",
  hEnv: "Variáveis de ambiente",
  hUsage: "Fluxos típicos",
  hStatic: "1. Unpack estático (mais rápido)",
  hBlack: "2. Sem Root (BlackDex)",
  hFrida: "3. Com Root (Frida)",
  hSmali: "4. Exemplos smali",
  hTree: "Estrutura",
  hExamples: "Exemplos de decompilação",
  examplesIntro: "Veja [`examples/`](./examples/) (smali em zip):",
  examplesAfter: "Após extrair, use `smali_*`.",
  hTools: "Cola rápida MCP",
  hMock: "Opcional: cliente Mock",
  mockBody:
    "`mock-client/` demonstra login → assento → pedido **sem chamar APIs reais**. [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "Abra `http://127.0.0.1:17806/`.",
  hFaq: "FAQ",
  hLegal: "Aviso legal",
  legal:
    "Este projeto é **somente para aprendizado, ensino e pesquisa de segurança autorizada**. É proibido usá-lo para crimes ou ilegalidades (acesso não autorizado, cracking, pirataria, ataques ou violação de PI). Autores e contribuidores não respondem por abusos. Ao usar, você concorda com estes termos.",
  featHead: ["Capacidade", "Ferramenta MCP", "Notas"],
  cmpHead: ["Método", "Root?", "Quando"],
  envHead: ["Variável", "Significado", "Padrão"],
  exHead: ["Exemplo", "Caminho", "Conteúdo"],
});

T.ru = cloneEn({
  title:
    "**MCP Server** для распаковки Android и анализа smali. В Cursor / Claude: устройства, детекция пакеров, static / BlackDex / Frida, dex→smali, поиск API-строк.",
  disclaimer:
    "> ⚠️ **Только для обучения и преподавания.** Запрещено использовать для преступлений, несанкционированного взлома, нарушения авторских прав или обхода чужих защит. Соблюдайте законы и условия приложения. Ответственность за злоупотребления — на пользователе.",
  hFeatures: "Возможности",
  hCompare: "Методы распаковки",
  hReq: "Требования",
  hInstall: "Установка и сборка",
  hStart: "Запуск MCP (stdio)",
  hDev: "Режим разработки",
  hCursor: "Подключение Cursor (MCP)",
  cursorNote: "Добавьте в `.cursor/mcp.json` (**измените пути**):",
  cursorAfter: "Перезапустите Cursor / перезагрузите MCP.",
  hEnv: "Переменные окружения",
  hUsage: "Типовые сценарии",
  hStatic: "1. Статическая распаковка (быстрее всего)",
  hBlack: "2. Без Root (BlackDex)",
  hFrida: "3. С Root (Frida)",
  hSmali: "4. Примеры smali",
  hTree: "Структура",
  hExamples: "Примеры декомпиляции",
  examplesIntro: "См. [`examples/`](./examples/) (smali в zip):",
  examplesAfter: "После распаковки используйте `smali_*`.",
  hTools: "Шпаргалка MCP",
  hMock: "Опционально: Mock-клиент",
  mockBody:
    "`mock-client/` демонстрирует логин → место → заказ **без реальных API**. [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "Откройте `http://127.0.0.1:17806/`.",
  hFaq: "FAQ",
  hLegal: "Правовая оговорка",
  legal:
    "Проект **только для обучения, преподавания и уполномоченных исследований безопасности**. Запрещено использовать для преступлений и незаконных действий (несанкционированный доступ, взлом, пиратство, атаки, нарушение ИП). Авторы не несут ответственности за злоупотребления. Использование означает согласие.",
  featHead: ["Возможность", "MCP-инструмент", "Примечание"],
  cmpHead: ["Метод", "Root?", "Когда"],
  envHead: ["Переменная", "Смысл", "По умолчанию"],
  exHead: ["Пример", "Путь", "Содержимое"],
});

T.ar = cloneEn({
  title:
    "**خادم MCP** لفك حزم أندرويد وتحليل smali. من Cursor / Claude: إدارة الأجهزة، كشف الحماية، فك ثابت / BlackDex / Frida، dex→smali، والبحث عن واجهات API.",
  disclaimer:
    "> ⚠️ **للتعلّم والتعليم فقط.** يُحظر الاستخدام في أي نشاط غير قانوني أو اختراق غير مصرّح أو انتهاك حقوق أو تجاوز حماية الغير. التزم بالقوانين المحلية وشروط التطبيق. المسؤولية عن إساءة الاستخدام على المستخدم.",
  hFeatures: "الميزات",
  hCompare: "طرق فك الحماية",
  hReq: "المتطلبات",
  hInstall: "التثبيت والبناء",
  hStart: "تشغيل MCP (stdio)",
  hDev: "وضع التطوير",
  hCursor: "إعداد Cursor (MCP)",
  cursorNote: "أضف إلى `.cursor/mcp.json` (**عدّل المسارات**):",
  cursorAfter: "أعد تشغيل Cursor / أعد تحميل MCP.",
  hEnv: "متغيرات البيئة",
  hUsage: "مسارات العمل النموذجية",
  hStatic: "1. فك ثابت (الأسرع)",
  hBlack: "2. بدون Root (BlackDex)",
  hFrida: "3. مع Root (Frida)",
  hSmali: "4. أمثلة smali",
  hTree: "هيكل المشروع",
  hExamples: "أمثلة فك التجميع",
  examplesIntro: "انظر [`examples/`](./examples/) (smali كـ zip):",
  examplesAfter: "بعد الفك استخدم `smali_*`.",
  hTools: "مرجع سريع لأدوات MCP",
  hMock: "اختياري: عميل Mock",
  mockBody:
    "`mock-client/` يعرض تسجيل الدخول → المقعد → الطلب **دون استدعاء واجهات الإنتاج**. [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "افتح `http://127.0.0.1:17806/`.",
  hFaq: "الأسئلة الشائعة",
  hLegal: "إخلاء المسؤولية القانوني",
  legal:
    "هذا المشروع **للتعلّم والتعليم والبحث الأمني المصرّح به فقط**. يُحظر استخدامه في أي جريمة أو نشاط غير قانوني (وصول غير مصرّح، اختراق، قرصنة، هجمات، انتهاك الملكية الفكرية). المؤلفون غير مسؤولين عن إساءة الاستخدام. باستخدامك توافق على هذه الشروط.",
  featHead: ["القدرة", "أداة MCP", "ملاحظات"],
  cmpHead: ["الطريقة", "Root؟", "متى"],
  envHead: ["المتغير", "المعنى", "الافتراضي"],
  exHead: ["مثال", "المسار", "المحتوى"],
});

T.hi = cloneEn({
  title:
    "Android अनपैकिंग + smali विश्लेषण **MCP Server**। Cursor / Claude से डिवाइस प्रबंधन, पैकर डिटेक्ट, static / BlackDex / Frida अनपैक, dex→smali और API स्ट्रिंग खोज।",
  disclaimer:
    "> ⚠️ **केवल सीखने और शिक्षण के लिए।** किसी भी अवैध गतिविधि, अनधिकृत क्रैकिंग, कॉपीराइट उल्लंघन या दूसरों की सुरक्षा बायपास करने के लिए उपयोग न करें। स्थानीय कानून और ऐप की शर्तों का पालन करें। दुरुपयोग की ज़िम्मेदारी उपयोगकर्ता की है।",
  hFeatures: "विशेषताएँ",
  hCompare: "अनपैक विधियाँ",
  hReq: "आवश्यकताएँ",
  hInstall: "इंस्टॉल और बिल्ड",
  hStart: "MCP शुरू करें (stdio)",
  hDev: "डेव मोड",
  hCursor: "Cursor MCP सेटअप",
  cursorNote: "`.cursor/mcp.json` में जोड़ें (**पथ बदलें**):",
  cursorAfter: "Cursor रीस्टार्ट / MCP रीलोड करें।",
  hEnv: "एनवायरनमेंट वेरिएबल",
  hUsage: "सामान्य वर्कफ़्लो",
  hStatic: "1. स्टैटिक अनपैक (सबसे तेज़)",
  hBlack: "2. बिना Root (BlackDex)",
  hFrida: "3. Root के साथ (Frida)",
  hSmali: "4. smali उदाहरण",
  hTree: "संरचना",
  hExamples: "डीकंपाइल उदाहरण",
  examplesIntro: "[`examples/`](./examples/) देखें (smali zip में):",
  examplesAfter: "अनज़िप के बाद `smali_*` चलाएँ।",
  hTools: "MCP टूल चीटशीट",
  hMock: "वैकल्पिक: Mock क्लाइंट",
  mockBody:
    "`mock-client/` लॉगिन → सीट → ऑर्डर का लोकल Mock है और **असली प्रोडक्शन API नहीं बुलाता**। [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "`http://127.0.0.1:17806/` खोलें।",
  hFaq: "FAQ",
  hLegal: "कानूनी अस्वीकरण",
  legal:
    "यह प्रोजेक्ट **केवल सीखने, शिक्षण और अधिकृत सुरक्षा अनुसंधान** के लिए है। किसी भी आपराधिक/अवैध उपयोग (अनधिकृत पहुँच, क्रैकिंग, पायरेसी, हमले, IP उल्लंघन) पर सख्त प्रतिबंध है। दुरुपयोग के लिए लेखक उत्तरदायी नहीं। उपयोग का अर्थ इन शर्तों से सहमति है।",
  featHead: ["क्षमता", "MCP टूल", "नोट्स"],
  cmpHead: ["विधि", "Root?", "कब"],
  envHead: ["वेरिएबल", "अर्थ", "डिफ़ॉल्ट"],
  exHead: ["नमूना", "पथ", "सामग्री"],
});

T.id = cloneEn({
  title:
    "**MCP Server** unpacking Android + analisis smali. Dari Cursor / Claude: perangkat, deteksi packer, unpack statis / BlackDex / Frida, dex→smali, pencarian string API.",
  disclaimer:
    "> ⚠️ **Hanya untuk belajar dan mengajar.** Jangan gunakan untuk kegiatan ilegal, cracking tanpa izin, pelanggaran hak cipta, atau melewati proteksi pihak lain. Patuhi hukum setempat dan syarat aplikasi. Penyalahgunaan menjadi tanggung jawab pengguna.",
  hFeatures: "Fitur",
  hCompare: "Metode unpack",
  hReq: "Persyaratan",
  hInstall: "Instalasi & build",
  hStart: "Jalankan MCP (stdio)",
  hDev: "Mode dev",
  hCursor: "Setup Cursor (MCP)",
  cursorNote: "Tambahkan ke `.cursor/mcp.json` (**sesuaikan path**):",
  cursorAfter: "Restart Cursor / reload MCP.",
  hEnv: "Variabel lingkungan",
  hUsage: "Alur tipikal",
  hStatic: "1. Unpack statis (tercepat)",
  hBlack: "2. Tanpa Root (BlackDex)",
  hFrida: "3. Dengan Root (Frida)",
  hSmali: "4. Contoh smali",
  hTree: "Struktur",
  hExamples: "Contoh dekompilasi",
  examplesIntro: "Lihat [`examples/`](./examples/) (smali sebagai zip):",
  examplesAfter: "Setelah unzip, jalankan `smali_*`.",
  hTools: "Cheatsheet alat MCP",
  hMock: "Opsional: klien Mock",
  mockBody:
    "`mock-client/` mendemo login → kursi → order **tanpa memanggil API produksi**. [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "Buka `http://127.0.0.1:17806/`.",
  hFaq: "FAQ",
  hLegal: "Pernyataan hukum",
  legal:
    "Proyek ini **hanya untuk pembelajaran, pengajaran, dan riset keamanan yang diizinkan**. Dilarang keras untuk kejahatan atau ilegalitas (akses tanpa izin, cracking, pembajakan, serangan, pelanggaran IP). Penulis tidak bertanggung jawab atas penyalahgunaan. Dengan menggunakan, Anda menyetujui syarat ini.",
  featHead: ["Kemampuan", "Alat MCP", "Catatan"],
  cmpHead: ["Metode", "Root?", "Kapan"],
  envHead: ["Variabel", "Arti", "Default"],
  exHead: ["Contoh", "Path", "Isi"],
});

T.vi = cloneEn({
  title:
    "**MCP Server** giải nén Android + phân tích smali. Trong Cursor / Claude: quản lý thiết bị, phát hiện packer, unpack tĩnh / BlackDex / Frida, dex→smali, tìm chuỗi API.",
  disclaimer:
    "> ⚠️ **Chỉ dùng cho học tập và giảng dạy.** Không dùng cho hành vi bất hợp pháp, crack trái phép, xâm phạm bản quyền hay vượt bảo vệ của bên thứ ba. Tuân thủ pháp luật địa phương và điều khoản ứng dụng. Người dùng chịu trách nhiệm nếu lạm dụng.",
  hFeatures: "Tính năng",
  hCompare: "Các phương pháp unpack",
  hReq: "Yêu cầu",
  hInstall: "Cài đặt & build",
  hStart: "Khởi động MCP (stdio)",
  hDev: "Chế độ dev",
  hCursor: "Thiết lập Cursor (MCP)",
  cursorNote: "Thêm vào `.cursor/mcp.json` (**đổi đường dẫn**):",
  cursorAfter: "Khởi động lại Cursor / tải lại MCP.",
  hEnv: "Biến môi trường",
  hUsage: "Quy trình điển hình",
  hStatic: "1. Unpack tĩnh (nhanh nhất)",
  hBlack: "2. Không Root (BlackDex)",
  hFrida: "3. Có Root (Frida)",
  hSmali: "4. Ví dụ smali",
  hTree: "Cấu trúc",
  hExamples: "Ví dụ decompile",
  examplesIntro: "Xem [`examples/`](./examples/) (smali dạng zip):",
  examplesAfter: "Sau khi giải nén, dùng `smali_*`.",
  hTools: "Bảng tra MCP",
  hMock: "Tùy chọn: client Mock",
  mockBody:
    "`mock-client/` demo đăng nhập → chọn chỗ → đặt hàng **không gọi API thật**. [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "Mở `http://127.0.0.1:17806/`.",
  hFaq: "FAQ",
  hLegal: "Tuyên bố pháp lý",
  legal:
    "Dự án này **chỉ dành cho học tập, giảng dạy và nghiên cứu bảo mật được ủy quyền**. Nghiêm cấm dùng cho tội phạm/bất hợp pháp (truy cập trái phép, crack, đạo nhái, tấn công, xâm phạm IP). Tác giả không chịu trách nhiệm về lạm dụng. Việc sử dụng đồng nghĩa chấp nhận điều khoản.",
  featHead: ["Khả năng", "Công cụ MCP", "Ghi chú"],
  cmpHead: ["Phương pháp", "Root?", "Khi nào"],
  envHead: ["Biến", "Ý nghĩa", "Mặc định"],
  exHead: ["Ví dụ", "Đường dẫn", "Nội dung"],
});

T.th = cloneEn({
  title:
    "**MCP Server** สำหรับ unpack Android + วิเคราะห์ smali จาก Cursor / Claude: จัดการอุปกรณ์ ตรวจจับ packer unpack แบบ static / BlackDex / Frida แปลง dex→smali และค้นหาสตริง API",
  disclaimer:
    "> ⚠️ **ใช้เพื่อการเรียนรู้และการสอนเท่านั้น** ห้ามใช้เพื่อการกระทำผิดกฎหมาย การแคร็กโดยไม่ได้รับอนุญาต การละเมิดลิขสิทธิ์ หรือการเลี่ยงการป้องกันของผู้อื่น ต้องปฏิบัติตามกฎหมายท้องถิ่นและข้อกำหนดของแอป ผู้ใช้รับผิดชอบต่อการใช้ในทางที่ผิด",
  hFeatures: "ฟีเจอร์",
  hCompare: "วิธี unpack",
  hReq: "ความต้องการของระบบ",
  hInstall: "ติดตั้งและ build",
  hStart: "เริ่ม MCP (stdio)",
  hDev: "โหมดพัฒนา",
  hCursor: "ตั้งค่า Cursor (MCP)",
  cursorNote: "เพิ่มใน `.cursor/mcp.json` (**แก้พาธ**):",
  cursorAfter: "รีสตาร์ท Cursor / รีโหลด MCP",
  hEnv: "ตัวแปรสภาพแวดล้อม",
  hUsage: "ขั้นตอนทั่วไป",
  hStatic: "1. Static unpack (เร็วสุด)",
  hBlack: "2. ไม่ต้อง Root (BlackDex)",
  hFrida: "3. ต้อง Root (Frida)",
  hSmali: "4. ตัวอย่าง smali",
  hTree: "โครงสร้าง",
  hExamples: "ตัวอย่าง decompile",
  examplesIntro: "ดู [`examples/`](./examples/) (smali เป็น zip):",
  examplesAfter: "หลังแตกไฟล์ ใช้ `smali_*`",
  hTools: "คู่มือเครื่องมือ MCP",
  hMock: "ตัวเลือก: ไคลเอนต์ Mock",
  mockBody:
    "`mock-client/` เดโม่ login → ที่นั่ง → สั่งซื้อ **ไม่เรียก API จริง** [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "เปิด `http://127.0.0.1:17806/`",
  hFaq: "คำถามที่พบบ่อย",
  hLegal: "ข้อจำกัดความรับผิดทางกฎหมาย",
  legal:
    "โปรเจกต์นี้ **เพื่อการเรียนรู้ การสอน และการวิจัยความปลอดภัยที่ได้รับอนุญาตเท่านั้น** ห้ามใช้เพื่ออาชญากรรมหรือกิจกรรมผิดกฎหมาย (เข้าถึงโดยไม่ได้รับอนุญาต แคร็ก ละเมิดลิขสิทธิ์ โจมตีระบบ หรือละเมิดทรัพย์สินทางปัญญา) ผู้เขียนไม่รับผิดต่อการใช้ในทางที่ผิด การใช้งานถือว่ายอมรับเงื่อนไขนี้",
  featHead: ["ความสามารถ", "เครื่องมือ MCP", "หมายเหตุ"],
  cmpHead: ["วิธี", "Root?", "เมื่อไหร่"],
  envHead: ["ตัวแปร", "ความหมาย", "ค่าเริ่มต้น"],
  exHead: ["ตัวอย่าง", "พาธ", "เนื้อหา"],
});

T.it = cloneEn({
  title:
    "**MCP Server** per unpacking Android + analisi smali. Da Cursor / Claude: dispositivi, rilevamento packer, unpack statico / BlackDex / Frida, dex→smali, ricerca stringhe API.",
  disclaimer:
    "> ⚠️ **Solo per apprendimento e didattica.** Non usare per attività illegali, cracking non autorizzato, violazione di copyright o elusione di protezioni di terzi. Rispettare le leggi locali e i termini dell’app. L’abuso è responsabilità dell’utente.",
  hFeatures: "Funzionalità",
  hCompare: "Metodi di unpack",
  hReq: "Requisiti",
  hInstall: "Installazione e build",
  hStart: "Avvia MCP (stdio)",
  hDev: "Modalità dev",
  hCursor: "Setup Cursor (MCP)",
  cursorNote: "Aggiungi a `.cursor/mcp.json` (**modifica i path**):",
  cursorAfter: "Riavvia Cursor / ricarica MCP.",
  hEnv: "Variabili d’ambiente",
  hUsage: "Flussi tipici",
  hStatic: "1. Unpack statico (più veloce)",
  hBlack: "2. Senza Root (BlackDex)",
  hFrida: "3. Con Root (Frida)",
  hSmali: "4. Esempi smali",
  hTree: "Struttura",
  hExamples: "Esempi di decompilazione",
  examplesIntro: "Vedi [`examples/`](./examples/) (smali in zip):",
  examplesAfter: "Dopo l’estrazione usa `smali_*`.",
  hTools: "Cheatsheet MCP",
  hMock: "Opzionale: client Mock",
  mockBody:
    "`mock-client/` dimostra login → posto → ordine **senza chiamare API di produzione**. [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "Apri `http://127.0.0.1:17806/`.",
  hFaq: "FAQ",
  hLegal: "Avviso legale",
  legal:
    "Questo progetto è **solo per apprendimento, didattica e ricerca di sicurezza autorizzata**. È vietato usarlo per reati o illegalità (accesso non autorizzato, cracking, pirateria, attacchi, violazione IP). Autori e contributor non rispondono degli abusi. L’uso implica accettazione.",
  featHead: ["Capacità", "Tool MCP", "Note"],
  cmpHead: ["Metodo", "Root?", "Quando"],
  envHead: ["Variabile", "Significato", "Default"],
  exHead: ["Esempio", "Percorso", "Contenuto"],
});

T.tr = cloneEn({
  title:
    "Android unpack + smali analiz **MCP Server**. Cursor / Claude ile cihaz yönetimi, packer tespiti, statik / BlackDex / Frida unpack, dex→smali ve API dizesi arama.",
  disclaimer:
    "> ⚠️ **Yalnızca öğrenme ve öğretim amaçlıdır.** Yasadışı faaliyet, yetkisiz crack, telif ihlali veya üçüncü taraf korumalarını aşmak için kullanmayın. Yerel yasalara ve uygulamanın şartlarına uyun. Kötüye kullanımdan kullanıcı sorumludur.",
  hFeatures: "Özellikler",
  hCompare: "Unpack yöntemleri",
  hReq: "Gereksinimler",
  hInstall: "Kurulum ve derleme",
  hStart: "MCP başlat (stdio)",
  hDev: "Geliştirme modu",
  hCursor: "Cursor MCP kurulumu",
  cursorNote: "`.cursor/mcp.json` dosyasına ekleyin (**yolları değiştirin**):",
  cursorAfter: "Cursor’ı yeniden başlatın / MCP’yi yenileyin.",
  hEnv: "Ortam değişkenleri",
  hUsage: "Tipik akışlar",
  hStatic: "1. Statik unpack (en hızlı)",
  hBlack: "2. Rootsuz (BlackDex)",
  hFrida: "3. Root ile (Frida)",
  hSmali: "4. smali örnekleri",
  hTree: "Yapı",
  hExamples: "Decompile örnekleri",
  examplesIntro: "[`examples/`](./examples/) klasörüne bakın (smali zip):",
  examplesAfter: "Açtıktan sonra `smali_*` çalıştırın.",
  hTools: "MCP araç özeti",
  hMock: "İsteğe bağlı: Mock istemci",
  mockBody:
    "`mock-client/` giriş → koltuk → sipariş demosunu **gerçek üretim API’lerine istek atmadan** gösterir. [mock-client/README.md](./mock-client/README.md)",
  mockOpen: "`http://127.0.0.1:17806/` açın.",
  hFaq: "SSS",
  hLegal: "Yasal uyarı",
  legal:
    "Bu proje **yalnızca öğrenme, öğretim ve yetkili güvenlik araştırması** içindir. Suç veya yasadışı kullanım (yetkisiz erişim, crack, korsanlık, saldırı, fikri mülkiyet ihlali) kesinlikle yasaktır. Yazarlar kötüye kullanımdan sorumlu değildir. Kullanım bu şartları kabul anlamına gelir.",
  featHead: ["Yetenek", "MCP aracı", "Notlar"],
  cmpHead: ["Yöntem", "Root?", "Ne zaman"],
  envHead: ["Değişken", "Anlam", "Varsayılan"],
  exHead: ["Örnek", "Yol", "İçerik"],
});

function table(head, rows) {
  const h = `| ${head.join(" | ")} |`;
  const s = `| ${head.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
  return `${h}\n${s}\n${body}`;
}

function steps(list) {
  return list.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

function faqBlock(faq) {
  return faq.map(([q, a]) => `**Q: ${q}**  \n${a}`).join("\n\n");
}

function build(langMeta) {
  const t = T[langMeta.code];
  if (!t) throw new Error("missing " + langMeta.code);
  const dir = langMeta.code === "ar" ? "dir=\"rtl\"\n\n" : "";
  return `${dir}# DexAndroid

${switcher(langMeta.file)}

${t.disclaimer}

${t.title}

Repo: [https://github.com/TimeCyber/DexAndroid](https://github.com/TimeCyber/DexAndroid)

---

## ${t.hFeatures}

${table(t.featHead, t.featRows)}

### ${t.hCompare}

${table(t.cmpHead, t.cmpRows)}

---

## ${t.hReq}

${t.req.map((x) => `- ${x}`).join("\n")}

${t.reqNote}

---

## ${t.hInstall}

\`\`\`bash
${installBash}
\`\`\`

${t.hStart}:

\`\`\`bash
${startBash}
\`\`\`

${t.hDev}:

\`\`\`bash
npm run dev
\`\`\`

---

## ${t.hCursor}

${t.cursorNote}

\`\`\`json
${mcpJson}
\`\`\`

${t.cursorAfter}

---

## ${t.hEnv}

${table(t.envHead, t.envRows)}

---

## ${t.hUsage}

### ${t.hStatic}

${steps(t.staticSteps)}

${t.staticNote}

### ${t.hBlack}

${steps(t.blackSteps)}

### ${t.hFrida}

${steps(t.fridaSteps)}

${t.fridaNote}

### ${t.hSmali}

\`\`\`text
${smaliEx}
\`\`\`

---

## ${t.hTree}

\`\`\`text
${tree}
\`\`\`

---

## ${t.hExamples}

${t.examplesIntro}

${table(t.exHead, t.exRows)}

${t.examplesAfter}

---

## ${t.hTools}

${toolsTable}

---

## ${t.hFaq}

${faqBlock(t.faq)}

---

## ${t.hLegal}

${t.legal}

${t.disclaimer}

---

## ${t.hLicense}

${t.license}
`;
}

for (const lang of langs) {
  const out = path.join(ROOT, lang.file);
  fs.writeFileSync(out, build(lang), "utf8");
  console.log("wrote", lang.file);
}

console.log("done", langs.length);
