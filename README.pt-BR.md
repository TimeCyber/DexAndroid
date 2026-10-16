# DexAndroid

[简体中文](./README.md) · [繁體中文](./README.zh-TW.md) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Deutsch](./README.de.md) · **Português** · [Русский](./README.ru.md) · [العربية](./README.ar.md) · [हिन्दी](./README.hi.md) · [Bahasa Indonesia](./README.id.md) · [Tiếng Việt](./README.vi.md) · [ไทย](./README.th.md) · [Italiano](./README.it.md) · [Türkçe](./README.tr.md)

> ⚠️ **Apenas para aprendizado e ensino.** Não use para atividades ilegais, cracking não autorizado, violação de direitos ou contorno de proteções de terceiros. Cumpra as leis locais e os termos do app. Você é responsável pelo mau uso.

**MCP Server** de unpacking Android + análise smali. No Cursor / Claude: dispositivos, detecção de packers, unpack estático / BlackDex / Frida, dex→smali e busca de APIs.

Repo: [https://github.com/TimeCyber/DexAndroid](https://github.com/TimeCyber/DexAndroid)

---

## Recursos

| Capacidade | Ferramenta MCP | Notas |
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

| Método | Root? | Quando |
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

## Instalação e build

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

Modo dev:

```bash
npm run dev
```

---

## Integração Cursor (MCP)

Adicione em `.cursor/mcp.json` (**ajuste os caminhos**):

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

Reinicie o Cursor / recarregue o MCP.

---

## Variáveis de ambiente

| Variável | Significado | Padrão |
| --- | --- | --- |
| `ADB_PATH` | adb executable | `adb` |
| `DEX_OUT_DIR` | Default output dir | `<cwd>/unpack-output` |
| `BAKSMALI_JAR` | baksmali jar | auto-discover under `tools/` |

---

## Fluxos típicos

### 1. Unpack estático (mais rápido)

1. `list_devices` or prepare local `apkPath`.
2. `detect_packer`.
3. `static_unpack` → `classes*.dex`.
4. `dex_to_smali` → smali folder.
5. `smali_search` / `smali_read_class`.

**Note:** Protected apps often yield only the shell via static unpack—use BlackDex / Frida for business code.

### 2. Sem Root (BlackDex)

1. `list_devices`.
2. `blackdex_prepare` with `blackdexApkPath`.
3. Unpack the target app in BlackDex UI.
4. `blackdex_pull` with `targetPkg`.
5. `dex_to_smali` then `smali_*`.

### 3. Com Root (Frida)

1. Rooted device (e.g. Magisk), `adb` ready.
2. `frida_prepare` to push/start `tools/frida-server`.
3. Matching `frida` / `frida-dexdump` locally (prefer 16.x).
4. `frida_unpack` with `pkg`, prefer `spawn: true`, `deepSearch: true`.
5. `dex_to_smali` on output, then analyze.

If Frida 17 attach fails, align tools to 16.x; some devices need temporary `setenforce 0`.

### 4. Exemplos smali

```text
smali_list_classes  smaliDir=.../smali  keyword=login
smali_search        smaliDir=.../smali  pattern=https?://|/api/|publicClient/
smali_read_class    smaliDir=.../smali  className=com.example.api.ApiService
```

---

## Estrutura

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

## Exemplos de decompilação

Veja [`examples/`](./examples/) (smali em zip):

| Exemplo | Caminho | Conteúdo |
| --- | --- | --- |
| Damai | [`examples/damai/`](./examples/damai/) | Frida smali.zip + API docs |
| Huaxi Maternity | [`examples/huaxi/`](./examples/huaxi/) | Static smali.zip (`info.cd120.two`) |

Após extrair, use `smali_*`.

---

## Cola rápida MCP

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

## Opcional: cliente Mock

`mock-client/` demonstra login → assento → pedido **sem chamar APIs reais**. [mock-client/README.md](./mock-client/README.md)

```bash
cd mock-client
npm install
npm start
```

Abra `http://127.0.0.1:17806/`.

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

## Aviso legal

Este projeto é **somente para aprendizado, ensino e pesquisa de segurança autorizada**. É proibido usá-lo para crimes ou ilegalidades (acesso não autorizado, cracking, pirataria, ataques ou violação de PI). Autores e contribuidores não respondem por abusos. Ao usar, você concorda com estes termos.

> ⚠️ **Apenas para aprendizado e ensino.** Não use para atividades ilegais, cracking não autorizado, violação de direitos ou contorno de proteções de terceiros. Cumpra as leis locais e os termos do app. Você é responsável pelo mau uso.

---

## License

MIT (see `LICENSE` in the repo if present).
