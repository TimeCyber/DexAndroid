# demo-hello（自有 MCP 验证工程）

> 本目录是 **DexAndroid 仓库自带的最小 Demo**，用于验证 `find_app_entry` / `smali_patch` / `apk_repack`。  
> **不是**第三方 App 样本；请勿对 `examples/huaxi`、`examples/damai` 做入口改写或二次打包。

## 流程

```text
1. （可选）find_app_entry  projectDir=examples/demo-hello
2. smali_patch  mode=insert_after_onCreate_super  projectDir=...  content=<Toast/对话框 smali>
3. apk_repack   projectDir=examples/demo-hello   （需 tools/apktool*.jar）
```

验证：安装签名 APK 后启动，应看到「你好啊」。

## 完整链路产物

| 步骤 | 路径 |
| --- | --- |
| 原包（空白首页） | `unpack-output/repack/demo-hello-original.apk` |
| 反编译工程 | `unpack-output/repack/demo-hello-from-apk/` |
| 重打包（网络图 + 点击打开浏览器） | `unpack-output/repack/demo-hello-repacked.apk` |

一键重跑（图片版）：

```bash
set APKTOOL_JAR=tools\apktool_2.9.3.jar
node tools/demo-hello-image-pipeline.mjs
```

行为：全屏 `ImageView` 加载 OSS 图片；点击打开 https://www.mcp-x.com/dist/zsTmwu/ ；**约 5 秒后退出全屏进入「首页」**。

Smali 模板与易错点见 skill：[`skills/smali-network-image-splash`](../../skills/smali-network-image-splash/SKILL.md)。
