# DexAndroid

[简体中文](./README.md) · **繁體中文** · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Deutsch](./README.de.md) · [Português](./README.pt-BR.md) · [Русский](./README.ru.md) · [العربية](./README.ar.md) · [हिन्दी](./README.hi.md) · [Bahasa Indonesia](./README.id.md) · [Tiếng Việt](./README.vi.md) · [ไทย](./README.th.md) · [Italiano](./README.it.md) · [Türkçe](./README.tr.md)

> ⚠️ **僅供學習與教學用途。** 禁止用於任何違法犯罪、未授權破解、侵權或規避他人防護之行為。使用者須遵守當地法律與目標應用服務條款；濫用後果自負。

安卓脫殼 + smali 分析 **MCP Server**。可在 Cursor / Claude 等客戶端透過工具呼叫完成：裝置管理、加固偵測、靜態/免 Root/Root 脫殼、dex→smali、介面字串檢索。

Repo: [https://github.com/TimeCyber/DexAndroid](https://github.com/TimeCyber/DexAndroid)

---

## 功能概覽

| 能力 | MCP 工具 | 說明 |
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

### 三種脫殼方案比較

| 方案 | 是否需要 Root | 適用場景 |
| --- | --- | --- |
| 静态解包 | 否 | 未加固，或只要壳/资源 |
| BlackDex | 否 | 多数加固 App |
| Frida | **是** | 强加固 / 壳对抗，内存 dump 更完整 |

---

## 環境需求

- **Windows / macOS / Linux**（文件以 Windows 為例）
- **Node.js** ≥ 18
- **ADB**：加入 PATH，或設定 `ADB_PATH`
- **Java 8+**（`dex_to_smali` 呼叫 baksmali）
- 可選：[BlackDex](https://github.com/CodingGay/BlackDex/releases)；裝置 Root + `frida-server`；本機 `pip install frida-tools frida-dexdump`

請將 baksmali fat jar / frida-server / BlackDex 放於本機 `tools/`（大型檔案預設不進 Git）。

---

## 安裝與建置

```bash
git clone https://github.com/TimeCyber/DexAndroid.git
cd DexAndroid
npm install
npm run build
```

啟動 MCP（stdio）:

```bash
npm start
# node dist/index.js
```

開發模式:

```bash
npm run dev
```

---

## 接入 Cursor（MCP）

於 `.cursor/mcp.json` 或全域 MCP 設定新增（**路徑請改為本機**）：

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

儲存後重啟 Cursor / 重載 MCP。

---

## 環境變數

| 變數 | 說明 | 預設 |
| --- | --- | --- |
| `ADB_PATH` | adb 可执行文件 | `adb` |
| `DEX_OUT_DIR` | 脱壳/拉取默认输出目录 | `<cwd>/unpack-output` |
| `BAKSMALI_JAR` | baksmali 可执行 jar | 自动在 `tools/` 下查找 |

---

## 使用說明（典型流程）

### 1. 靜態解包（最快）

1. `list_devices` 或準備本機 `apkPath`。
2. `detect_packer`。
3. `static_unpack` → `classes*.dex`。
4. `dex_to_smali` → smali 目錄。
5. `smali_search` / `smali_read_class`。

**注意：** 加固 App 靜態 dex 常只有殼，業務程式碼需 BlackDex / Frida。

### 2. 免 Root（BlackDex）

1. `list_devices`。
2. `blackdex_prepare`（`blackdexApkPath`）。
3. 於手機 BlackDex 介面選擇目標 App 並脫殼。
4. `blackdex_pull`（`targetPkg`）。
5. `dex_to_smali` 後再 `smali_*`。

### 3. Root（Frida）

1. 裝置已 Root，`adb` 可用。
2. `frida_prepare` 推送並啟動 `frida-server`。
3. 本機安裝相符版本 `frida` / `frida-dexdump`（建議 16.x）。
4. `frida_unpack`（建議 `spawn: true`、`deepSearch: true`）。
5. `dex_to_smali` 後分析。

若 Frida 17 附加失敗，可對齊至 16.x；部分機型需暫時 `setenforce 0`。

### 4. smali 分析範例

```text
smali_list_classes  smaliDir=.../smali  keyword=login
smali_search        smaliDir=.../smali  pattern=https?://|/api/|publicClient/
smali_read_class    smaliDir=.../smali  className=com.example.api.ApiService
```

---

## 目錄結構

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
├── tools/               # baksmali / frida-server / BlackDex (local)
├── unpack-output/       # local dumps (gitignored)
├── mock-client/
├── package.json
└── README.md
```

---

## 反編譯範例

見 [`examples/`](./examples/)（smali 以 zip 提供）：

| 範例 | 路徑 | 內容 |
| --- | --- | --- |
| 大麥 | [`examples/damai/`](./examples/damai/) | Frida smali 壓縮包 + API 文件 |
| 華西婦幼 | [`examples/huaxi/`](./examples/huaxi/) | 靜態解包 smali 壓縮包（`info.cd120.two`） |

解壓後即可執行 `smali_*` 工具。

---

## MCP 工具參數速查

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

---

## 可選：Mock 示範客戶端

`mock-client/` 示範「登入 → 選座 → 下單」本地 Mock，**不請求真實線上業務**。詳見 [mock-client/README.md](./mock-client/README.md)。

```bash
cd mock-client
npm install
npm start
```

瀏覽器開啟 `http://127.0.0.1:17806/`。

---

## 常見問題

**Q: `list_devices` 為空？**  
檢查 USB 偵錯、`adb devices`，多裝置時傳 `serial`。

**Q: 靜態解包後找不到業務類？**  
多半是加固殼，請改用 BlackDex 或 Frida。

**Q: `dex_to_smali` 失敗？**  
確認已安裝 Java，並放置 baksmali jar 或設定 `BAKSMALI_JAR`。

**Q: Frida jailed / 版本不符？**  
保持 `frida-server` 與本機 `frida` 主版本一致；必要時用 16.x。

**Q: 輸出目錄在哪？**  
預設 `unpack-output/`。**請勿提交至 Git**。

---

## 合規與免責聲明

本專案**僅供學習、教學與已授權安全研究**。嚴禁用於任何違法犯罪行為，包括未授權存取、破解、盜版、攻擊系統或侵害智慧財產權。作者與貢獻者不對濫用負責。使用即表示同意上述條款。

> ⚠️ **僅供學習與教學用途。** 禁止用於任何違法犯罪、未授權破解、侵權或規避他人防護之行為。使用者須遵守當地法律與目標應用服務條款；濫用後果自負。

---

## License

MIT（若倉庫內有 `LICENSE`，以其為準）。
