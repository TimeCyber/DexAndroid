# DexAndroid---Android Decompile MCP

**English** · [简体中文](./README.zh-CN.md) · [繁體中文](./README.zh-TW.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Deutsch](./README.de.md) · [Português](./README.pt-BR.md) · [Русский](./README.ru.md) · [العربية](./README.ar.md) · [हिन्दी](./README.hi.md) · [Bahasa Indonesia](./README.id.md) · [Tiếng Việt](./README.vi.md) · [ไทย](./README.th.md) · [Italiano](./README.it.md) · [Türkçe](./README.tr.md)

> ⚠️ **For learning and teaching purposes only.** Do **not** use this project for any illegal activity, unauthorized cracking, copyright infringement, or bypassing third-party protections. You must follow local laws and the target app’s terms. You are solely responsible for misuse.

Android unpacking + smali analysis **MCP Server**. Use from Cursor / Codex / Claude Code to manage devices, detect packers, unpack (static / BlackDex / Frida), convert dex→smali, and search API strings.

Repo: [https://github.com/TimeCyber/DexAndroid](https://github.com/TimeCyber/DexAndroid) · npm: [android-decompile-mcp](https://www.npmjs.com/package/android-decompile-mcp)

---

## Quick start (npm + MCP)

**1. No clone — download & run from npm:**

```bash
npx -y android-decompile-mcp
```

**2. Load into Cursor / Claude / Codex — paste into `.cursor/mcp.json` (or global MCP config):**

```json
{
  "mcpServers": {
    "android-decompile-mcp": {
      "command": "npx",
      "args": ["-y", "android-decompile-mcp"],
      "env": {
        "ADB_PATH": "adb",
        "DEX_OUT_DIR": "./unpack-output"
      }
    }
  }
}
```

Save → restart the client / reload MCP. Done.

Optional global install: `npm i -g android-decompile-mcp` then run `android-decompile-mcp`.

---

## Features

| Capability | MCP tool | Notes |
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
| Entry locate | `find_app_entry` | MAIN/LAUNCHER + smali onCreate (read-only) |
| Decode / rebuild | `apk_decode` / `apk_repack` | apktool decode + rebuild/sign |

### Unpacking methods

| Method | Root? | Use when |
| --- | --- | --- |
| Static | No | Unpacked apps or shell/resources only |
| BlackDex | No | Most protected apps |
| Frida | **Yes** | Strong packers / fuller dumps |

---

## Requirements

- **Windows / macOS / Linux** (docs use Windows examples)
- **Node.js** ≥ 18
- **ADB** on PATH, or set `ADB_PATH`
- **Java 8+** (for baksmali via `dex_to_smali`)
- Optional: [BlackDex](https://github.com/CodingGay/BlackDex/releases); rooted device + `frida-server`; `pip install frida-tools frida-dexdump`

Place baksmali fat jar / frida-server / BlackDex under local `tools/` (large binaries are gitignored).

---

## Local development build

```bash
git clone https://github.com/TimeCyber/DexAndroid.git
cd DexAndroid
npm install
npm run build
npm start
```

---

## Environment variables

| Variable | Meaning | Default |
| --- | --- | --- |
| `ADB_PATH` | adb executable | `adb` |
| `DEX_OUT_DIR` | Default output dir | `<cwd>/unpack-output` |
| `BAKSMALI_JAR` | baksmali jar | auto-discover under `tools/` |

---

## Typical workflows

### 1. Static unpack (fastest)

1. `list_devices` or prepare local `apkPath`.
2. `detect_packer`.
3. `static_unpack` → `classes*.dex`.
4. `dex_to_smali` → smali folder.
5. `smali_search` / `smali_read_class`.

**Note:** Protected apps often yield only the shell via static unpack—use BlackDex / Frida for business code.

### 2. No-Root (BlackDex)

1. `list_devices`.
2. `blackdex_prepare` with `blackdexApkPath`.
3. Unpack the target app in BlackDex UI.
4. `blackdex_pull` with `targetPkg`.
5. `dex_to_smali` then `smali_*`.

### 3. Root (Frida)

1. Rooted device (e.g. Magisk), `adb` ready.
2. `frida_prepare` to push/start `tools/frida-server`.
3. Matching `frida` / `frida-dexdump` locally (prefer 16.x).
4. `frida_unpack` with `pkg`, prefer `spawn: true`, `deepSearch: true`.
5. `dex_to_smali` on output, then analyze.

If Frida 17 attach fails, align tools to 16.x; some devices need temporary `setenforce 0`.

### 4. smali analysis examples

```text
smali_list_classes  smaliDir=.../smali  keyword=login
smali_search        smaliDir=.../smali  pattern=https?://|/api/|publicClient/
smali_read_class    smaliDir=.../smali  className=com.example.api.ApiService
```

---

## Layout

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
├── skills/              # Canonical agent skills (edit here, then sync)
├── .cursor/skills/      # Cursor copy
├── .agents/skills/      # Codex copy
├── .claude/skills/      # Claude Code copy
├── tools/               # baksmali / frida-server / BlackDex (local)
├── unpack-output/       # local dumps (gitignored)
├── package.json
└── README.md
```

### Agent skills (Cursor / Codex / Claude Code)

After unpacking, use **`android-api-smali-analysis`** so the agent recovers **headers, body, encrypt/decrypt methods, and keys** (smali / `.so` / server-delivered), not path-only notes.

| Client | Skill path |
| --- | --- |
| Canonical | [`skills/android-api-smali-analysis/SKILL.md`](./skills/android-api-smali-analysis/SKILL.md) |
| Cursor | [`.cursor/skills/android-api-smali-analysis/`](./.cursor/skills/android-api-smali-analysis/) |
| Codex | [`.agents/skills/android-api-smali-analysis/`](./.agents/skills/android-api-smali-analysis/) |
| Claude Code | [`.claude/skills/android-api-smali-analysis/`](./.claude/skills/android-api-smali-analysis/) (`/android-api-smali-analysis`) |

Edit the canonical file, then sync copies:

```bash
node tools/sync-skills.mjs
```

See [`skills/README.md`](./skills/README.md).

---

## Decompile examples

See [`examples/`](./examples/) (smali shipped as zip):

| Sample | Path | Contents |
| --- | --- | --- |
| Damai | [`examples/damai/`](./examples/damai/) | Frida smali.zip + API docs |
| Huaxi Maternity | [`examples/huaxi/`](./examples/huaxi/) | Static smali.zip (`info.cd120.two`) |

After unzip, run `smali_list_classes` / `smali_search` / `smali_read_class`.

---

## MCP tool cheatsheet

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
| `find_app_entry` | `projectDir` / `manifestPath` / `apkPath`, optional `smaliDir`（只读定位入口） |
| `apk_decode` | `apkPath`, optional `outDir`（apktool 解码） |
| `apk_repack` | `projectDir`, optional `outApk` / keystore 参数（重建并签名） |
| `smali_patch` | `mode` + `smaliPath`/`projectDir`；调用方 `content` 或 `insert_verify_log` |

---

## FAQ

**Q: Empty `list_devices`?**  
Check USB debugging, `adb devices`, pass `serial` if multiple.

**Q: No business classes after static unpack?**  
Likely packed—use BlackDex or Frida.

**Q: `dex_to_smali` failed?**  
Install Java; put baksmali jar in `tools/` or set `BAKSMALI_JAR`.

**Q: Frida jailed / version mismatch?**  
Keep `frida-server` and host `frida` major versions aligned; try 16.x.

**Q: Where is output?**  
Default `unpack-output/` (or `DEX_OUT_DIR`). **Do not commit dumps.**

---

## Legal & disclaimer

This project is **only for learning, teaching, and authorized security research**. It is strictly forbidden to use it for any criminal or illegal activity, including unauthorized access, cracking, piracy, attacking systems, or IP infringement. Authors and contributors are not liable for misuse. By using this software you agree to these terms.

> ⚠️ **For learning and teaching purposes only.** Do **not** use this project for any illegal activity, unauthorized cracking, copyright infringement, or bypassing third-party protections. You must follow local laws and the target app’s terms. You are solely responsible for misuse.

---

## License

MIT — see [`LICENSE`](./LICENSE).
