# DexAndroid

[简体中文](./README.md) · [繁體中文](./README.zh-TW.md) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · **Español** · [Français](./README.fr.md) · [Deutsch](./README.de.md) · [Português](./README.pt-BR.md) · [Русский](./README.ru.md) · [العربية](./README.ar.md) · [हिन्दी](./README.hi.md) · [Bahasa Indonesia](./README.id.md) · [Tiếng Việt](./README.vi.md) · [ไทย](./README.th.md) · [Italiano](./README.it.md) · [Türkçe](./README.tr.md)

> ⚠️ **Solo para aprendizaje y enseñanza.** No lo use para actividades ilegales, cracking no autorizado, infracción de derechos ni elusión de protecciones de terceros. Cumpla las leyes locales y los términos de la app. Usted es responsable del mal uso.

**MCP Server** de desempaquetado Android + análisis smali. Desde Cursor / Claude: dispositivos, detección de protectores, unpack estático / BlackDex / Frida, dex→smali y búsqueda de APIs.

Repo: [https://github.com/TimeCyber/DexAndroid](https://github.com/TimeCyber/DexAndroid)

---

## Funciones

| Capacidad | Herramienta MCP | Notas |
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

### Métodos de unpack

| Método | ¿Root? | Cuándo |
| --- | --- | --- |
| Static | No | Unpacked apps or shell/resources only |
| BlackDex | No | Most protected apps |
| Frida | **Yes** | Strong packers / fuller dumps |

---

## Requisitos

- **Windows / macOS / Linux** (docs use Windows examples)
- **Node.js** ≥ 18
- **ADB** on PATH, or set `ADB_PATH`
- **Java 8+** (for baksmali via `dex_to_smali`)
- Optional: [BlackDex](https://github.com/CodingGay/BlackDex/releases); rooted device + `frida-server`; `pip install frida-tools frida-dexdump`

Place baksmali fat jar / frida-server / BlackDex under local `tools/` (large binaries are gitignored).

---

## Instalación y compilación

```bash
git clone https://github.com/TimeCyber/DexAndroid.git
cd DexAndroid
npm install
npm run build
```

Iniciar MCP (stdio):

```bash
npm start
# node dist/index.js
```

Modo desarrollo:

```bash
npm run dev
```

---

## Integración Cursor (MCP)

Añada a `.cursor/mcp.json` (**ajuste las rutas**):

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

Reinicie Cursor / recargue MCP.

---

## Variables de entorno

| Variable | Significado | Por defecto |
| --- | --- | --- |
| `ADB_PATH` | adb executable | `adb` |
| `DEX_OUT_DIR` | Default output dir | `<cwd>/unpack-output` |
| `BAKSMALI_JAR` | baksmali jar | auto-discover under `tools/` |

---

## Flujos típicos

### 1. Unpack estático (más rápido)

1. `list_devices` or prepare local `apkPath`.
2. `detect_packer`.
3. `static_unpack` → `classes*.dex`.
4. `dex_to_smali` → smali folder.
5. `smali_search` / `smali_read_class`.

**Note:** Protected apps often yield only the shell via static unpack—use BlackDex / Frida for business code.

### 2. Sin Root (BlackDex)

1. `list_devices`.
2. `blackdex_prepare` with `blackdexApkPath`.
3. Unpack the target app in BlackDex UI.
4. `blackdex_pull` with `targetPkg`.
5. `dex_to_smali` then `smali_*`.

### 3. Con Root (Frida)

1. Rooted device (e.g. Magisk), `adb` ready.
2. `frida_prepare` to push/start `tools/frida-server`.
3. Matching `frida` / `frida-dexdump` locally (prefer 16.x).
4. `frida_unpack` with `pkg`, prefer `spawn: true`, `deepSearch: true`.
5. `dex_to_smali` on output, then analyze.

If Frida 17 attach fails, align tools to 16.x; some devices need temporary `setenforce 0`.

### 4. Ejemplos smali

```text
smali_list_classes  smaliDir=.../smali  keyword=login
smali_search        smaliDir=.../smali  pattern=https?://|/api/|publicClient/
smali_read_class    smaliDir=.../smali  className=com.example.api.ApiService
```

---

## Estructura

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

## Ejemplos de decompilación

Vea [`examples/`](./examples/) (smali en zip):

| Ejemplo | Ruta | Contenido |
| --- | --- | --- |
| Damai | [`examples/damai/`](./examples/damai/) | Frida smali.zip + API docs |
| Huaxi Maternity | [`examples/huaxi/`](./examples/huaxi/) | Static smali.zip (`info.cd120.two`) |

Tras descomprimir, use `smali_*`.

---

## Referencia rápida MCP

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

## Preguntas frecuentes

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

## Aviso legal

Este proyecto es **solo para aprendizaje, enseñanza e investigación de seguridad autorizada**. Queda prohibido usarlo para delitos o ilegalidades (acceso no autorizado, cracking, piratería, ataques o infracción de PI). Autores y contribuidores no responden por abusos. Al usarlo acepta estos términos.

> ⚠️ **Solo para aprendizaje y enseñanza.** No lo use para actividades ilegales, cracking no autorizado, infracción de derechos ni elusión de protecciones de terceros. Cumpla las leyes locales y los términos de la app. Usted es responsable del mal uso.

---

## License

MIT (see `LICENSE` in the repo if present).
