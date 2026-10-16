# 示例：大麦 App

- **来源**：设备 Frida 内存 dump → `dex_to_smali`
- **包名参考**：常见为 `cn.damai`（以实际设备安装为准）
- **smali**：[`smali.zip`](./smali.zip)（解压后即可用 `smali_search` / `smali_read_class` 分析）

## 文档

| 文件 | 内容 |
| --- | --- |
| [`API文档.md`](./API文档.md) | MTOP 等接口梳理 |
| [`选座下单流程接口文案.md`](./选座下单流程接口文案.md) | 选座 / 下单流程 |
| [`关键登录下单参数.md`](./关键登录下单参数.md) | 登录与下单关键参数 |

## 解压

```bash
# Windows
Expand-Archive smali.zip -DestinationPath smali

# 或任意解压工具解压到 examples/damai/smali/
```
