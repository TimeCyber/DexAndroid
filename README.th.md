# DexAndroid

[简体中文](./README.md) · [繁體中文](./README.zh-TW.md) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Deutsch](./README.de.md) · [Português](./README.pt-BR.md) · [Русский](./README.ru.md) · [العربية](./README.ar.md) · [हिन्दी](./README.hi.md) · [Bahasa Indonesia](./README.id.md) · [Tiếng Việt](./README.vi.md) · **ไทย** · [Italiano](./README.it.md) · [Türkçe](./README.tr.md)

> ⚠️ **ใช้เพื่อการเรียนรู้และการสอนเท่านั้น** ห้ามใช้เพื่อการกระทำผิดกฎหมาย การแคร็กโดยไม่ได้รับอนุญาต การละเมิดลิขสิทธิ์ หรือการเลี่ยงการป้องกันของผู้อื่น ต้องปฏิบัติตามกฎหมายท้องถิ่นและข้อกำหนดของแอป ผู้ใช้รับผิดชอบต่อการใช้ในทางที่ผิด

**MCP Server** สำหรับ unpack Android + วิเคราะห์ smali จาก Cursor / Claude: จัดการอุปกรณ์ ตรวจจับ packer unpack แบบ static / BlackDex / Frida แปลง dex→smali และค้นหาสตริง API

Repo: [https://github.com/TimeCyber/DexAndroid](https://github.com/TimeCyber/DexAndroid)

---

## ฟีเจอร์

| ความสามารถ | เครื่องมือ MCP | หมายเหตุ |
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

### วิธี unpack

| วิธี | Root? | เมื่อไหร่ |
| --- | --- | --- |
| Static | No | Unpacked apps or shell/resources only |
| BlackDex | No | Most protected apps |
| Frida | **Yes** | Strong packers / fuller dumps |

---

## ความต้องการของระบบ

- **Windows / macOS / Linux** (docs use Windows examples)
- **Node.js** ≥ 18
- **ADB** on PATH, or set `ADB_PATH`
- **Java 8+** (for baksmali via `dex_to_smali`)
- Optional: [BlackDex](https://github.com/CodingGay/BlackDex/releases); rooted device + `frida-server`; `pip install frida-tools frida-dexdump`

Place baksmali fat jar / frida-server / BlackDex under local `tools/` (large binaries are gitignored).

---

## ติดตั้งและ build

```bash
git clone https://github.com/TimeCyber/DexAndroid.git
cd DexAndroid
npm install
npm run build
```

เริ่ม MCP (stdio):

```bash
npm start
# node dist/index.js
```

โหมดพัฒนา:

```bash
npm run dev
```

---

## ตั้งค่า Cursor (MCP)

เพิ่มใน `.cursor/mcp.json` (**แก้พาธ**):

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

รีสตาร์ท Cursor / รีโหลด MCP

---

## ตัวแปรสภาพแวดล้อม

| ตัวแปร | ความหมาย | ค่าเริ่มต้น |
| --- | --- | --- |
| `ADB_PATH` | adb executable | `adb` |
| `DEX_OUT_DIR` | Default output dir | `<cwd>/unpack-output` |
| `BAKSMALI_JAR` | baksmali jar | auto-discover under `tools/` |

---

## ขั้นตอนทั่วไป

### 1. Static unpack (เร็วสุด)

1. `list_devices` or prepare local `apkPath`.
2. `detect_packer`.
3. `static_unpack` → `classes*.dex`.
4. `dex_to_smali` → smali folder.
5. `smali_search` / `smali_read_class`.

**Note:** Protected apps often yield only the shell via static unpack—use BlackDex / Frida for business code.

### 2. ไม่ต้อง Root (BlackDex)

1. `list_devices`.
2. `blackdex_prepare` with `blackdexApkPath`.
3. Unpack the target app in BlackDex UI.
4. `blackdex_pull` with `targetPkg`.
5. `dex_to_smali` then `smali_*`.

### 3. ต้อง Root (Frida)

1. Rooted device (e.g. Magisk), `adb` ready.
2. `frida_prepare` to push/start `tools/frida-server`.
3. Matching `frida` / `frida-dexdump` locally (prefer 16.x).
4. `frida_unpack` with `pkg`, prefer `spawn: true`, `deepSearch: true`.
5. `dex_to_smali` on output, then analyze.

If Frida 17 attach fails, align tools to 16.x; some devices need temporary `setenforce 0`.

### 4. ตัวอย่าง smali

```text
smali_list_classes  smaliDir=.../smali  keyword=login
smali_search        smaliDir=.../smali  pattern=https?://|/api/|publicClient/
smali_read_class    smaliDir=.../smali  className=com.example.api.ApiService
```

---

## โครงสร้าง

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

## ตัวอย่าง decompile

ดู [`examples/`](./examples/) (smali เป็น zip):

| ตัวอย่าง | พาธ | เนื้อหา |
| --- | --- | --- |
| Damai | [`examples/damai/`](./examples/damai/) | Frida smali.zip + API docs |
| Huaxi Maternity | [`examples/huaxi/`](./examples/huaxi/) | Static smali.zip (`info.cd120.two`) |

หลังแตกไฟล์ ใช้ `smali_*`

---

## คู่มือเครื่องมือ MCP

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

## คำถามที่พบบ่อย

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

## ข้อจำกัดความรับผิดทางกฎหมาย

โปรเจกต์นี้ **เพื่อการเรียนรู้ การสอน และการวิจัยความปลอดภัยที่ได้รับอนุญาตเท่านั้น** ห้ามใช้เพื่ออาชญากรรมหรือกิจกรรมผิดกฎหมาย (เข้าถึงโดยไม่ได้รับอนุญาต แคร็ก ละเมิดลิขสิทธิ์ โจมตีระบบ หรือละเมิดทรัพย์สินทางปัญญา) ผู้เขียนไม่รับผิดต่อการใช้ในทางที่ผิด การใช้งานถือว่ายอมรับเงื่อนไขนี้

> ⚠️ **ใช้เพื่อการเรียนรู้และการสอนเท่านั้น** ห้ามใช้เพื่อการกระทำผิดกฎหมาย การแคร็กโดยไม่ได้รับอนุญาต การละเมิดลิขสิทธิ์ หรือการเลี่ยงการป้องกันของผู้อื่น ต้องปฏิบัติตามกฎหมายท้องถิ่นและข้อกำหนดของแอป ผู้ใช้รับผิดชอบต่อการใช้ในทางที่ผิด

---

## License

MIT (see `LICENSE` in the repo if present).
