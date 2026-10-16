---
name: android-api-smali-analysis
description: >-
  Analyze Android APK/smali network APIs end-to-end: Retrofit/OkHttp paths,
  request/response bodies, headers, interceptors, encrypt/decrypt/sign methods,
  and key recovery (smali, .so, server-delivered). Use when the user asks for
  接口/API/下单/请求头/加密/密钥/smali analysis of an unpacked App.
---

# Android API Smali 完整分析

对脱壳后的 smali（或 APK）做**接口还原**时，禁止只报 path + body 字段。  
若接口存在加解密 / 签名：**必须完整还原算法 + 调用链 + 实际密钥（或密钥材料）**，并写入文档；只写「密钥在 so / 服务端」而不给出可复现材料 = **未完成**。

缺一项要明确写「未找到 / 不适用」及已搜关键字与已尝试路径。

---

## 强制分析清单（缺一不可）

### 1. 服务端入口
- BaseUrl / 多环境域名（prod / test / H5）
- path 前缀拼接方式（如 `cloud/` + `appointment/` + `publicClient/xxx`）
- HTTP 方法（Retrofit `@GET/@POST` 或 OkHttp method）
- Content-Type（JSON / form / multipart）

### 2. 请求体（Body）
- Request 模型类全名与全部字段（含父类 `BaseRequest` 等默认字段）
- 字段来源（UI / 上一接口响应 / 本地缓存）
- 示例 JSON（字段名与 smali 一致）
- Response 模型关键字段

### 3. 请求头（Headers）——必须单独成节
搜索并读完整条链路，不能跳过：

| 搜索目标 | 典型关键字 |
| --- | --- |
| OkHttp Interceptor | `implements Lokhttp3/Interceptor`、混淆后的 `Lqh/x`、`*.Interceptor.kt` |
| Header 注入 | `addHeader`、`Headers$Builder`、`header(`、公共 `HashMap` put |
| 鉴权 | `Authorization`、`Bearer`、`accessToken`、`token`、`Cookie` |
| 自定义头 | `User-Agent`、`deviceId`、`appCode`、`channel`、`timestamp`、`nonce`、`sign`、`encryptParameter` |

对每个头写清：头名、取值来源、是否动态更新、注入位置（类.方法）。

### 4. 加密 / 签名 / 完整性（必须单独成节）
至少覆盖：

1. **是否加密**：请求体、请求头、Query、整包；写清「有 / 无 / 部分接口」。
2. **触发条件**：全局拦截器还是特定 path。
3. **算法**：AES/RSA/DES、模式与填充、IV 规则（是否等于 Key、是否随机、是否下发）。
4. **密钥（必须拿到）**：见下文「密钥检索流程」；文档中写明**明文密钥或可复现推导公式**。
5. **编码**：Base64 flag、Hex、URL-safe。
6. **落点**：body 字段 / header / query。
7. **加解密方法**：类名、方法签名、encrypt / decrypt 对称关系。
8. **签名**：MD5/SHA/HMAC 拼接顺序与参与字段。
9. **SDK 噪声**：友盟 / Bugly / OSS 等标注「非业务链路」，勿当成业务下单加密。

### 5. 调用链
- Activity / ViewModel → ApiService → Interceptor 顺序
- 下单前后接口（确认页 → 下单 → 支付 → 详情）

### 6. 落文档（有加解密时必写）
将结果写入项目文档（如 `examples/<app>/API文档.md` 或用户指定路径），至少包含：

- 接口 URL / Method / Headers / Body
- 加解密算法与参数（mode、padding、IV）
- **密钥明文或等价材料**（见验收标准）
- encrypt / decrypt 伪代码或可运行片段
- 证据路径（smali 类、so 路径、下发接口）

---

## 密钥检索流程（必须按序执行）

发现 `encrypt` / `Cipher` / `SecretKey` / `sign` 后，**不得停在「密钥来自 native / 服务器」**。按下列来源逐项排查，直到拿到可复现密钥或证明当前环境无法取得（并写明原因）。

### Step A — Java / Smali 明文与半明文

```text
密钥相关搜索：
secret|SecretKey|AES_KEY|aesKey|iv|IV|publicKey|privateKey|
getString\(|BuildConfig|const-string.{0,40}(key|Key|AES|RSA|sign)
```

- `const-string` 硬编码（16/24/32 字节常见）
- `BuildConfig` / `assets` / `res/raw` / `.properties`
- Base64 常量（先 decode 再判断是否为密钥）
- 拼接规则：`appId + time + salt` 等（文档写清公式与样例）

### Step B — Native `.so`（Cipher.so / 自研加密库）

常见链路：`CipherClient` / `CipherCore.getString("a")` → `System.loadLibrary("cipher-lib")` → `libcipher-lib.so`。

**检索步骤：**

1. 从 APK 解出 `lib/**/lib*.so`（优先 `libcipher*.so`、`libencrypt*.so`、业务包名相关 so）。
2. 对 so 抽字符串：优先 8/16/24/32 长度、`[A-Za-z0-9_\-]{8,32}`、含 `key`/`aes`/`secret`/`app` 前缀口令。
3. 定位 JNI：`Java_*_getString`、`Encryptor::decrypt`、`AES_set_encrypt_key` 等。
4. 若字符串表被二次加密：还原 so 内 `decrypt` 算法后再解出业务密钥。
5. 必要时用 REA / 反汇编跟 `getString` 返回值；或运行时 Frida hook `AESEncryptor.encrypt` / `CipherCore.getString` 打出明文（仅授权环境）。

**文档要求：** 写清 so 路径、符号/字符串证据、最终密钥明文。  
例：`lib/arm64-v8a/libcipher-lib.so` 字符串 `hxfy_jkmh_123456` → AES Key/IV。

### Step C — 服务端下发密钥

搜索：

```text
secretKey|aesKey|encryptKey|publicKey|keyId|sessionKey|
/getKey|/security|/config|handshake|negotiate
```

查清：

| 项 | 要写明 |
| --- | --- |
| 下发接口 | path、Method、是否需登录 |
| 响应字段 | 哪个 JSON 字段是 key / iv / keyId |
| 本地存储 | SP / DB / 内存单例字段名 |
| 更新时机 | 启动 / 登录后 / 定时刷新 |
| 保护 | 是否再包一层 RSA/AES，外层密钥在哪 |

**文档要求：** 下发接口 + 响应示例（可脱敏）+ 客户端保存位置 + 最终用于业务加解密的明文/推导方式。  
若当前无抓包样本：仍须从 smali 还原「下发接口与字段」；密钥值标注「需登录后从该接口获取」，并给出解析代码位置。

### Step D — 证书 / 非对称密钥

- `assets/*.pem`、`*.cer`、`-----BEGIN PUBLIC KEY-----`
- Android Keystore / 指纹加密（说明无法直接导出时的替代：hook 明文输入输出）
- RSA 加密 AES 会话密钥的组合模式：分别还原两层

### Step E — 动态推导 / 设备绑定

- 包名、签名 MD5、`Build.SERIAL`、AndroidId 等参与派生
- 写清伪代码：`key = MD5(packageName + salt).substring(0,16)` 之类，并给出一组可验证样例

### 密钥来源分类表（写入文档）

| 类型 | 典型位置 | 本任务动作 |
| --- | --- | --- |
| 硬编码 | smali `const-string`、BuildConfig | 直接抄出明文 |
| Native so | `libcipher-lib.so` 等 | 抽串 / 还原 decrypt / hook |
| 服务端下发 | 配置/握手接口 | 还原接口 + 字段 + 存储 |
| 本地生成 | 随机 IV + 服务端公钥 | 写清随机性与封装格式 |
| 证书/非对称 | assets、KeyStore | 导出或说明限制 |

---

## 有加解密时的验收标准（全部满足才算完成）

1. 指出**哪些接口**加密/签名（path 列表）。  
2. 给出 **encrypt / decrypt（或 verify）完整方式**：算法、mode、padding、IV、编码。  
3. 给出 **密钥明文**，或「可复现公式 + 全部输入材料」；仅写「在 so 里」不合格。  
4. 标明密钥来源类型（上表之一）与证据（文件路径 / 类.方法 / 接口）。  
5. 说明密文落点（如 Header `encryptParameter`）及 body 是否仍为明文。  
6. 将以上内容**写入文档**（用户指定路径，或 `examples/<app>/` 下 API 文档）。

---

## 推荐工具顺序（DexAndroid / MCP）

1. `smali_search`：path、`Interceptor`、`encrypt`、`SecretKey`、`getString`
2. `smali_list_classes`：`*ApiService*`、`*Interceptor*`、`*Encrypt*`、`Cipher*`
3. `smali_read_class`：ApiService、Req/Res、Interceptor、加解密工具类
4. 读 `MainApplication` / `ApiManager`：OkHttp 组装、公共 header Map、额外挂载的 EncryptInterceptor
5. 从 APK 解 so → 抽字符串 / REA 分析 /（授权下）Frida hook 打密钥
6. 追踪「下发密钥」接口与本地缓存读写
7. 汇总写入 API 文档

业务加解密关键字：

```text
encrypt|decrypt|AES|RSA|Cipher|SecretKey|IvParameter|HMAC|MD5|SHA
encryptParameter|sign|signature|Interceptor
CipherCore|cipher-lib|cipher.so|AESEncryptor|Encryptor
secretKey|sessionKey|aesKey|getString
```

---

## 输出模板（必须按此结构）

```markdown
## 接口：METHOD fullUrlOrPath

### 请求头
| Header | 值/来源 | 是否加密/签名 | 证据（类.方法） |
| --- | --- | --- | --- |

### 请求体
- 模型：
- JSON 示例：
- 是否被二次加密/改写：

### 加密与签名
- 有无 / 触发条件：
- 算法（mode/padding/IV）：
- **密钥明文或公式：**（必填）
- 密钥来源类型：（硬编码 / so / 服务端下发 / 本地生成 / 证书）
- 密钥证据：（so 路径+字符串 / 接口 path+字段 / smali 常量）
- 密文落点：
- encrypt 方法：
- decrypt 方法：

### 响应体
- 模型关键字段：

### 调用链
- ...
```

---

## 反例（禁止）

- 只列 path + body，不写请求头  
- 未搜 Interceptor / Cipher / so 就断言「无加密」  
- 写「密钥在 so / 服务器」却不继续挖出明文或下发接口  
- 把第三方 SDK（推送/统计）AES 当成业务下单加密  
- 发现 `encryptParameter` 却不追 AES 实现与密钥  
- 分析完加解密但不写入文档  

---

## 华西妇幼（info.cd120.two）已知基线（分析时核对是否仍成立）

- 公共 Header：`accessToken` ← `vd/a.d`，经 `vd/b` 注入  
- 挂号模块：`mf/t` = `EncryptInterceptor.kt`  
- **仅 URL 含 `publicClient/sureOrder`**：Body JSON → AES → Header `encryptParameter`  
- 算法：`AES/CBC/PKCS5Padding`（`AESEncryptor`），Key 与 IV 同一 UTF-8 串  
- **密钥明文：`hxfy_jkmh_123456`**  
  - 来源类型：Native so  
  - 证据：`CipherCore.getString("a")` ← `lib/arm64-v8a/libcipher-lib.so` 字符串  
- Body 仍发送明文 JSON；加密副本在 Header  

分析新版本时重新验证，勿盲抄。
