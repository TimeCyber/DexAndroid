# DexAndroid

[简体中文](./README.md) · [繁體中文](./README.zh-TW.md) · [English](./README.en.md) · **日本語** · [한국어](./README.ko.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Deutsch](./README.de.md) · [Português](./README.pt-BR.md) · [Русский](./README.ru.md) · [العربية](./README.ar.md) · [हिन्दी](./README.hi.md) · [Bahasa Indonesia](./README.id.md) · [Tiếng Việt](./README.vi.md) · [ไทย](./README.th.md) · [Italiano](./README.it.md) · [Türkçe](./README.tr.md)

> ⚠️ **学習・教育目的のみ。** 違法行為、無断クラック、権利侵害、第三者保護の回避には使用しないでください。各国の法令と対象アプリの利用規約を遵守してください。悪用の責任は利用者にあります。

Android アンパック + smali 解析用 **MCP Server**。Cursor / Claude などから、端末管理・保護検知・静的/非 Root/Root アンパック・dex→smali・API 文字列検索が可能です。

Repo: [https://github.com/TimeCyber/DexAndroid](https://github.com/TimeCyber/DexAndroid)

---

## 機能

| 機能 | MCP ツール | 説明 |
| --- | --- | --- |
| Devices | `list_devices` | Connected ADB devices |
| Packages | `list_packages` | Optional keyword filter |
| Packer detect | `detect_packer` | 360 / Tencent / Bangcle / ijiami / Alibaba, etc. |
| Pull APK | `pull_apk` | Installed app (+ splits) |
| Static unpack | `static_unpack` | Extract `classes*.dex` |
| No-Root unpack | `blackdex_prepare` / `blackdex_pull` | BlackDex memory dump |
| Root unpack | `frida_prepare` / `frida_unpack` | frida-server + frida-dexdump |
| Decompile | `dex_to_smali` | baksmali → smali |
| Analyze | `smali_list_classes` / `smali_read_class` / `smali_search` | List / read / regex |

### アンパック方式の比較

| 方式 | Root? | 用途 |
| --- | --- | --- |
| Static | No | Unpacked apps or shell/resources only |
| BlackDex | No | Most protected apps |
| Frida | **Yes** | Strong packers / fuller dumps |

---

## 要件

- **Windows / macOS / Linux**（手順は Windows 例）
- **Node.js** ≥ 18
- **ADB**（PATH または `ADB_PATH`）
- **Java 8+**（baksmali）
- 任意：[BlackDex](https://github.com/CodingGay/BlackDex/releases)、Root + `frida-server`、`pip install frida-tools frida-dexdump`

`tools/` に baksmali / frida-server / BlackDex を配置（大きなバイナリは gitignore）。

---

## インストールとビルド

```bash
git clone https://github.com/TimeCyber/DexAndroid.git
cd DexAndroid
npm install
npm run build
```

MCP 起動（stdio）:

```bash
npm start
# node dist/index.js
```

開発モード:

```bash
npm run dev
```

---

## Cursor（MCP）連携

`.cursor/mcp.json` などに追加（**パスは環境に合わせて変更**）：

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

保存後 Cursor を再起動 / MCP を再読込。

---

## 環境変数

| 変数 | 意味 | 既定 |
| --- | --- | --- |
| `ADB_PATH` | adb executable | `adb` |
| `DEX_OUT_DIR` | Default output dir | `<cwd>/unpack-output` |
| `BAKSMALI_JAR` | baksmali jar | auto-discover under `tools/` |

---

## 典型的な手順

### 1. 静的アンパック（最速）

1. `list_devices` またはローカル `apkPath`。
2. `detect_packer`。
3. `static_unpack` → `classes*.dex`。
4. `dex_to_smali`。
5. `smali_search` / `smali_read_class`。

**注意:** 保護アプリの静的 dex はシェルのみのことが多いです。業務コードは BlackDex / Frida を。

### 2. 非 Root（BlackDex）

1. `list_devices`。
2. `blackdex_prepare`（`blackdexApkPath`）。
3. 端末の BlackDex で対象アプリをダンプ。
4. `blackdex_pull`（`targetPkg`）。
5. `dex_to_smali` → `smali_*`。

### 3. Root（Frida）

1. Root 済み、`adb` 利用可。
2. `frida_prepare` で `frida-server` を起動。
3. ホスト側 `frida` / `frida-dexdump` をバージョン合わせ（推奨 16.x）。
4. `frida_unpack`（`spawn: true`、`deepSearch: true` 推奨）。
5. `dex_to_smali` 後に解析。

Frida 17 で失敗する場合は 16.x に揃えてください。必要なら一時的に `setenforce 0`。

### 4. smali 解析例

```text
smali_list_classes  smaliDir=.../smali  keyword=login
smali_search        smaliDir=.../smali  pattern=https?://|/api/|publicClient/
smali_read_class    smaliDir=.../smali  className=com.example.api.ApiService
```

---

## 構成

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
├── package.json
└── README.md
```

---

## デコンパイル例

[`examples/`](./examples/) を参照（smali は zip）：

| 例 | パス | 内容 |
| --- | --- | --- |
| Damai | [`examples/damai/`](./examples/damai/) | Frida smali.zip + API 文書 |
| Huaxi | [`examples/huaxi/`](./examples/huaxi/) | 静的 smali.zip（`info.cd120.two`） |

解凍後に `smali_*` を実行できます。

---

## MCP ツール早見表

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

## FAQ

**Q: `list_devices` が空？**  
USB デバッグと `adb devices` を確認。複数端末は `serial`。

**Q: 静的後に業務クラスがない？**  
保護の可能性大 → BlackDex / Frida。

**Q: `dex_to_smali` 失敗？**  
Java と baksmali jar（または `BAKSMALI_JAR`）を確認。

**Q: Frida jailed / 版不一致？**  
`frida-server` とホスト `frida` のメジャー版を揃える。

**Q: 出力先は？**  
既定は `unpack-output/`。**Git にコミットしないでください。**

---

## 法令遵守と免責

本プロジェクトは**学習・教育および許可されたセキュリティ研究のみ**を目的とします。不正アクセス、クラック、著作権侵害など違法行為への使用を固く禁じます。悪用について作者・貢献者は責任を負いません。利用により本条件に同意したものとみなします。

> ⚠️ **学習・教育目的のみ。** 違法行為、無断クラック、権利侵害、第三者保護の回避には使用しないでください。各国の法令と対象アプリの利用規約を遵守してください。悪用の責任は利用者にあります。

---

## License

MIT（リポジトリに `LICENSE` がある場合はそれに従う）。
