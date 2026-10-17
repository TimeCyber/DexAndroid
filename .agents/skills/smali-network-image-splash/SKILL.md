---
name: smali-network-image-splash
description: >-
  Smali example for fullscreen ImageView splash: load a remote HTTPS image,
  open URL on click, after N seconds leave fullscreen to a plain home page.
  Use when patching demo-hello / authorized APKs for 网络图片、开屏 ImageView、
  HttpURLConnection、decodeByteArray、5秒后回首页, or when wiring
  LoadImageRunnable / SetBitmapRunnable / RestoreBlankHomeRunnable.
license: MIT
compatibility: >-
  Cursor (.cursor/skills), Codex (.agents/skills), Claude Code (.claude/skills);
  DexAndroid MCP apk_decode / apk_repack / find_app_entry when available.
---

# Smali 网络图片开屏示例

> **Canonical source:** `skills/smali-network-image-splash/SKILL.md`  
> Synced copies: `.cursor/skills/` · `.agents/skills/` · `.claude/skills/`  
> After editing the canonical file, run `node tools/sync-skills.mjs`.

在**自有或已授权**的 apktool 工程里，用纯 smali 实现：

1. 启动全屏 `ImageView`（`CENTER_CROP` + `MATCH_PARENT`）
2. 后台线程 `HttpURLConnection` 拉 HTTPS 图 → `decodeByteArray` → UI 线程 `setImageBitmap`
3. 点击图片用 `ACTION_VIEW` 打开外链
4. N 秒后**退出全屏**，切到普通「首页」页（便于和开屏区分）

参考实现：`examples/demo-hello` + 产物工程 `unpack-output/repack/demo-hello-from-apk/`。  
完整 smali 模板见本 skill 的 [examples/](examples/)。

**禁止**把本模板用于未授权第三方 App 的广告/外链注入。

---

## 推荐流程（MCP）

```text
1. apk_decode     apkPath=<原包>  outDir=<工程目录>
2. find_app_entry projectDir=<工程目录>
3. 补 AndroidManifest：INTERNET（HTTPS 也要）；可选 usesCleartextTraffic
4. 写入 helpers + 改入口 Activity onCreate（见 examples/）
5. apk_repack     projectDir=<工程目录>  outApk=<签名 apk>
6. adb uninstall <pkg> && adb install <签名 apk>
```

一键（本仓库 demo）：

```bash
set APKTOOL_JAR=tools/apktool_2.9.3.jar
node tools/demo-hello-image-pipeline.mjs
```

> 若 pipeline 与 `demo-hello-from-apk` 里已验证 smali 不一致，以本 skill `examples/` 与 `demo-hello-from-apk` 为准。

---

## 类职责

| 类 | 作用 |
| --- | --- |
| `MainActivity` | 全屏窗体 + ImageView；启动加载线程；`Handler.postDelayed` 回首页 |
| `LoadImageRunnable` | 子线程下载字节 → `BitmapFactory.decodeByteArray` → `runOnUiThread` |
| `SetBitmapRunnable` | UI 线程 `imageView.setImageBitmap`（不要加反了的 attach 判断） |
| `OpenBrowserClickListener` | `Intent.ACTION_VIEW` + `Uri.parse` |
| `RestoreBlankHomeRunnable` | `clearFlags(FLAG_FULLSCREEN)`、恢复 system UI，再 `setContentView` 首页 |

---

## 关键常量

| 含义 | 值 |
| --- | --- |
| `FEATURE_NO_TITLE` | `0x1`（须在 `super.onCreate` **之前** `requestWindowFeature`） |
| `FLAG_FULLSCREEN` | `0x400` |
| 沉浸式 `systemUiVisibility` | `0x1706`（开屏用；回首页清 `0`） |
| `MATCH_PARENT` / 白色 | `-0x1` |
| 黑色背景 | `-0x1000000` |
| 5 秒 | `const-wide/16 vX, 0x1388` |
| HTTP 200 | `0xc8` |

---

## Manifest 最少改动

```xml
<uses-permission android:name="android.permission.INTERNET" />
<application android:usesCleartextTraffic="true" ...>
```

HTTPS 图也必须有 `INTERNET`。`usesCleartextTraffic` 仅 http 需要，保留无妨。

---

## 加载图片（可靠写法）

不要依赖裸 `BitmapFactory.decodeStream`（流不支持 mark 时易解出 null）。推荐：

1. `HttpURLConnection`，`setInstanceFollowRedirects(true)`，超时约 15s
2. `getResponseCode() == 200` 再读
3. 读入 `ByteArrayOutputStream` → `toByteArray`
4. `BitmapFactory.decodeByteArray([B, 0, len)`
5. `activity.runOnUiThread(new SetBitmapRunnable(imageView, bitmap))`

模板：`examples/LoadImageRunnable.smali`。

---

## 回首页（非全屏）

开屏用了全屏 flag 时，回首页必须：

1. `window.clearFlags(0x400)`
2. `decorView.setSystemUiVisibility(0)`
3. 再 `setContentView`（白底 `TextView`「首页」即可区分）

空指针 / finishing 判断必须写成：

```smali
if-eqz v0, :cond_skip          # null → skip
invoke-virtual {v0}, Landroid/app/Activity;->isFinishing()Z
move-result v1
if-nez v1, :cond_skip          # finishing≠0 → skip
# ... 真正切首页 ...
:cond_skip
return-void
```

---

## Smali 易错点（本示例踩过）

| 错误 | 现象 | 正确 |
| --- | --- | --- |
| 空判断写成 `if-nez v0, :skip` | 非空直接 return，5 秒永不回首页 | null 用 `if-eqz` |
| `isFinishing` 后用 `if-eqz` 当「完成则跳过」 | 正常 Activity 反而跳过逻辑 | finishing≠0 才 `if-nez` 跳过 |
| `isAttachedToWindow` 后 `if-nez` 再 `setImageBitmap` | 已挂载时不设图 → 一直黑屏 | **直接** `setImageBitmap`，或 `if-eqz`（未挂载才跳过） |
| 容器背景白色 + 图未出 | 看起来像白屏/坏了 | 开屏底用黑色，首页白底非全屏 |
| `requestWindowFeature` 放在 `super.onCreate` 后 | 可能抛错/无效 | 放在 `super` 之前 |

记住：`if-eqz` = 寄存器为 0 则跳；`if-nez` = 非 0 则跳。对象 null == 0。

---

## 验收清单

- [ ] 启动后数秒内看到远程图片（全屏、裁剪铺满）
- [ ] 点击图片能打开目标 URL
- [ ] 约 5 秒后进入非全屏首页（状态栏可见，有「首页」字样）
- [ ] 重装前先 `adb uninstall`，避免签名冲突

---

## 示例文件

| 文件 | 说明 |
| --- | --- |
| [examples/MainActivity.smali](examples/MainActivity.smali) | 全屏 ImageView + 定时回首页 |
| [examples/LoadImageRunnable.smali](examples/LoadImageRunnable.smali) | HTTPS 下载 + decodeByteArray |
| [examples/SetBitmapRunnable.smali](examples/SetBitmapRunnable.smali) | UI 设图 |
| [examples/OpenBrowserClickListener.smali](examples/OpenBrowserClickListener.smali) | 点击打开浏览器 |
| [examples/RestoreBlankHomeRunnable.smali](examples/RestoreBlankHomeRunnable.smali) | 退出全屏回首页 |

包名默认 `com.dexandroid.demohello`；换包时全局替换类路径。
