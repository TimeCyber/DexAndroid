# DexAndroid

[简体中文](./README.md) · [繁體中文](./README.zh-TW.md) · [English](./README.en.md) · [日本語](./README.ja.md) · **한국어** · [Español](./README.es.md) · [Français](./README.fr.md) · [Deutsch](./README.de.md) · [Português](./README.pt-BR.md) · [Русский](./README.ru.md) · [العربية](./README.ar.md) · [हिन्दी](./README.hi.md) · [Bahasa Indonesia](./README.id.md) · [Tiếng Việt](./README.vi.md) · [ไทย](./README.th.md) · [Italiano](./README.it.md) · [Türkçe](./README.tr.md)

> ⚠️ **학습 및 교육 목적으로만 사용하세요.** 불법 행위, 무단 크래킹, 저작권 침해, 제3자 보호 우회에 사용하지 마십시오. 현지 법령과 대상 앱 약관을 준수해야 하며, 오남용 책임은 사용자에게 있습니다.

안드로이드 언패킹 + smali 분석 **MCP Server**. Cursor / Claude 등에서 기기 관리, 보호(패커) 탐지, 정적/비루팅/루팅 언패킹, dex→smali, API 문자열 검색을 수행합니다.

Repo: [https://github.com/TimeCyber/DexAndroid](https://github.com/TimeCyber/DexAndroid)

---

## 기능

| 기능 | MCP 도구 | 설명 |
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

### 언패킹 방식 비교

| 방식 | Root? | 용도 |
| --- | --- | --- |
| Static | No | Unpacked apps or shell/resources only |
| BlackDex | No | Most protected apps |
| Frida | **Yes** | Strong packers / fuller dumps |

---

## 요구 사항

- **Windows / macOS / Linux** (문서는 Windows 기준)
- **Node.js** ≥ 18
- **ADB** (PATH 또는 `ADB_PATH`)
- **Java 8+** (baksmali)
- 선택: [BlackDex](https://github.com/CodingGay/BlackDex/releases), 루팅 + `frida-server`, `pip install frida-tools frida-dexdump`

`tools/`에 baksmali / frida-server / BlackDex 배치 (대용량은 gitignore).

---

## 설치 및 빌드

```bash
git clone https://github.com/TimeCyber/DexAndroid.git
cd DexAndroid
npm install
npm run build
```

MCP 시작 (stdio):

```bash
npm start
# node dist/index.js
```

개발 모드:

```bash
npm run dev
```

---

## Cursor MCP 연동

`.cursor/mcp.json` 등에 추가 (**경로를 로컬에 맞게 수정**):

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

저장 후 Cursor 재시작 / MCP 리로드.

---

## 환경 변수

| 변수 | 의미 | 기본값 |
| --- | --- | --- |
| `ADB_PATH` | adb executable | `adb` |
| `DEX_OUT_DIR` | Default output dir | `<cwd>/unpack-output` |
| `BAKSMALI_JAR` | baksmali jar | auto-discover under `tools/` |

---

## 사용 흐름

### 1. 정적 언패킹 (가장 빠름)

1. `list_devices` 또는 로컬 `apkPath`.
2. `detect_packer`.
3. `static_unpack` → `classes*.dex`.
4. `dex_to_smali`.
5. `smali_search` / `smali_read_class`.

**참고:** 보호 앱의 정적 dex는 쉘만일 수 있습니다. 비즈니스 코드는 BlackDex / Frida.

### 2. 비루팅 (BlackDex)

1. `list_devices`.
2. `blackdex_prepare` (`blackdexApkPath`).
3. BlackDex UI에서 대상 앱 덤프.
4. `blackdex_pull` (`targetPkg`).
5. `dex_to_smali` 후 `smali_*`.

### 3. 루팅 (Frida)

1. 루팅된 기기, `adb` 사용 가능.
2. `frida_prepare`로 `frida-server` 실행.
3. 호스트 `frida` / `frida-dexdump` 버전 맞춤 (권장 16.x).
4. `frida_unpack` (`spawn: true`, `deepSearch: true` 권장).
5. `dex_to_smali` 후 분석.

Frida 17 실패 시 16.x로 맞추세요. 일부 기기는 임시 `setenforce 0`.

### 4. smali 분석 예

```text
smali_list_classes  smaliDir=.../smali  keyword=login
smali_search        smaliDir=.../smali  pattern=https?://|/api/|publicClient/
smali_read_class    smaliDir=.../smali  className=com.example.api.ApiService
```

---

## 디렉터리 구조

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

## 디컴파일 예제

[`examples/`](./examples/) 참고 (smali는 zip):

| 예제 | 경로 | 내용 |
| --- | --- | --- |
| Damai | [`examples/damai/`](./examples/damai/) | Frida smali.zip + API docs |
| Huaxi Maternity | [`examples/huaxi/`](./examples/huaxi/) | Static smali.zip (`info.cd120.two`) |

압축 해제 후 `smali_*` 실행.

---

## MCP 도구 치트시트

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

**Q: `list_devices`가 비어 있음?**  
USB 디버깅/`adb devices` 확인, 다중 기기는 `serial`.

**Q: 정적 후 비즈니스 클래스 없음?**  
패커 가능성 → BlackDex/Frida.

**Q: `dex_to_smali` 실패?**  
Java와 baksmali jar/`BAKSMALI_JAR` 확인.

**Q: Frida jailed / 버전 불일치?**  
`frida-server`와 호스트 `frida` 메이저 버전 일치.

**Q: 출력 위치?**  
기본 `unpack-output/`. **Git에 커밋하지 마세요.**

---

## 법적 고지 및 면책

본 프로젝트는 **학습·교육 및 승인된 보안 연구 전용**입니다. 무단 접근, 크래킹, 불법 복제, 시스템 공격, 지식재산권 침해 등 일체의 불법 행위에 사용하는 것을 엄격히 금지합니다. 오남용에 대해 저자와 기여자는 책임지지 않습니다. 사용 시 본 조건에 동의한 것으로 간주합니다.

> ⚠️ **학습 및 교육 목적으로만 사용하세요.** 불법 행위, 무단 크래킹, 저작권 침해, 제3자 보호 우회에 사용하지 마십시오. 현지 법령과 대상 앱 약관을 준수해야 하며, 오남용 책임은 사용자에게 있습니다.

---

## License

MIT (저장소에 `LICENSE`가 있으면 해당 파일 기준).
