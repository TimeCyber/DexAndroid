# DexAndroid

安卓脱壳 + smali 分析 **MCP Server**。在 Cursor / Claude 等客户端中通过工具调用完成：设备管理、加固检测、静态/免 Root/Root 脱壳、dex→smali、接口字符串检索。

仓库：[https://github.com/TimeCyber/DexAndroid](https://github.com/TimeCyber/DexAndroid)

---

## 功能概览

| 能力 | MCP 工具 | 说明 |
| --- | --- | --- |
| 设备列表 | `list_devices` | ADB 已连接设备 |
| 包名列表 | `list_packages` | 可按关键字过滤 |
| 加固识别 | `detect_packer` | 360 / 腾讯 / 梆梆 / 爱加密 / 阿里聚安全等 |
| 拉 APK | `pull_apk` | 从设备拉取已安装应用（含 split） |
| 静态解包 | `static_unpack` | 解压 APK 提取 `classes*.dex`（加固多为壳 dex） |
| 免 Root 脱壳 | `blackdex_prepare` / `blackdex_pull` | BlackDex 内存 dump 后拉取 |
| Root 脱壳 | `frida_prepare` / `frida_unpack` | 推送 frida-server + frida-dexdump |
| 反编译 | `dex_to_smali` | baksmali 转 smali |
| 分析 | `smali_list_classes` / `smali_read_class` / `smali_search` | 列类、读类、正则搜索 |

### 三种脱壳方案对比

| 方案 | 是否需要 Root | 适用场景 |
| --- | --- | --- |
| 静态解包 | 否 | 未加固，或只要壳/资源 |
| BlackDex | 否 | 多数加固 App（设备上操作选 App） |
| Frida | **是** | 强加固 / 壳对抗，内存 dump 更完整 |

---

## 环境要求

- **Windows / macOS / Linux**（文档以 Windows 为例）
- **Node.js** ≥ 18
- **ADB**：加入 PATH，或设置 `ADB_PATH`
- **Java 8+**（`dex_to_smali` 调用 baksmali）
- 可选：
  - [BlackDex](https://github.com/CodingGay/BlackDex/releases) APK（免 Root）
  - 设备 Root + `frida-server`；本机 `pip install frida-tools frida-dexdump`（Root 方案）

将 baksmali fat jar / frida-server / BlackDex 放到本地 `tools/`（该目录大文件默认不进 Git，见 `.gitignore`）。

---

## 安装与构建

```bash
git clone https://github.com/TimeCyber/DexAndroid.git
cd DexAndroid
npm install
npm run build
```

启动 MCP（stdio，供客户端拉起）：

```bash
npm start
# 等价于: node dist/index.js
```

开发模式（先编译再启动）：

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

保存后重启 Cursor / 重载 MCP。在对话里可直接让 Agent 调用上述工具，例如：

- 「列出设备并检测 `cn.xxx` 的加固」
- 「对本地 `xxx.apk` 做 static_unpack，再 dex_to_smali，搜索登录接口」

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
2. `blackdex_prepare`，传入 `blackdexApkPath`（本机 BlackDex APK）。
3. 在手机 BlackDex 界面选择目标应用并脱壳。
4. `blackdex_pull`，传入 `targetPkg`，把 dump 拉到 `DEX_OUT_DIR`。
5. `dex_to_smali` → 再 `smali_*` 分析。

### 3. Root（Frida）

1. 设备已 Root（如 Magisk），`adb` 可用。
2. `frida_prepare`：推送并启动 `tools/frida-server`（可用 `serverLocalPath` 指定）。
3. 本机已安装匹配版本的 `frida` / `frida-dexdump`（建议 16.x 与 server 一致）。
4. `frida_unpack`：传 `pkg`，建议 `spawn: true`、`deepSearch: true`。
5. 对输出目录 `dex_to_smali` 后分析。

若 Frida 17 附加失败，可降级本机 frida-tools 与设备 frida-server 到同一 16.x 版本；部分机型需临时 `setenforce 0`。

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
├── src/                 # TypeScript 源码（MCP server）
│   ├── index.ts         # 工具注册与入口
│   ├── adb.ts
│   ├── detect.ts
│   ├── smali.ts
│   └── unpack/          # static / blackdex / frida
├── dist/                # tsc 编译输出（npm run build）
├── examples/            # 反编译示例（大麦 / 华西妇幼 smali.zip + 文档）
├── tools/               # 本地放置 baksmali / frida-server / BlackDex（默认不入库）
├── unpack-output/       # 脱壳输出（默认不入库）
├── mock-client/         # 可选：大麦流程本地 Mock 演示（见 mock-client/README.md）
├── package.json
└── README.md
```

---

## 反编译示例

仓库 [`examples/`](./examples/) 提供两套可下载的示例产物（smali 为 zip，避免直接提交海量小文件）：

| 示例 | 路径 | 内容 |
| --- | --- | --- |
| 大麦 | [`examples/damai/`](./examples/damai/) | Frida smali 压缩包 + API / 选座 / 登录参数文档 |
| 华西妇幼 | [`examples/huaxi/`](./examples/huaxi/) | 静态解包 smali 压缩包（包名 `info.cd120.two`） |

解压后即可对目录执行 `smali_list_classes` / `smali_search` / `smali_read_class`。

---

## MCP 工具参数速查

| 工具 | 常用参数 |
| --- | --- |
| `detect_packer` | `apkPath` 或 `pkg`，可选 `serial` |
| `pull_apk` | `pkg`，可选 `outDir` / `serial` |
| `static_unpack` | `apkPath` 或 `pkg`，可选 `outDir` |
| `blackdex_prepare` | `blackdexApkPath`，可选 `serial` |
| `blackdex_pull` | `targetPkg`，可选 `outDir` / `serial` |
| `frida_prepare` | 可选 `serial` / `serverLocalPath` |
| `frida_unpack` | `pkg`，可选 `spawn` / `deepSearch` / `outDir` |
| `dex_to_smali` | `dexInput`（文件或目录），可选 `outDir` |
| `smali_list_classes` | `smaliDir`，可选 `keyword` |
| `smali_read_class` | `smaliDir`，`className`（`com.foo.Bar` 或路径） |
| `smali_search` | `smaliDir`，`pattern`，可选 `flags` / `maxResults` |

---

## 可选：Mock 演示客户端

`mock-client/` 为独立小服务，用于按文档形态演示「登录 → 选座 → 下单」本地 Mock 网关，**不请求真实线上业务**。详见 [mock-client/README.md](./mock-client/README.md)。

```bash
cd mock-client
npm install
npm start
```

浏览器打开 `http://127.0.0.1:17806/`。

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
默认 `unpack-output/`（或 `DEX_OUT_DIR`）。该目录含 APK/dump，**请勿提交到 Git**。

---

## 合规说明

本工具仅用于**自有应用、已授权安全审计、教学研究**等合法场景。请遵守当地法律与目标应用服务条款，禁止用于未授权破解或侵权。

---

## License

MIT（若后续补充 `LICENSE` 文件以仓库内文件为准）。
