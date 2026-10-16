# 大麦流程 Mock 演示客户端

Windows 本地演示：按 `unpack-output/106/选座下单流程接口文案.md` 走通

**登录 → Token → 项目/场次 → 选座/预检/算价 → build/adjust → create → 支付完成**

按大麦文档形态请求：`POST {前缀}/gw/<api>/<v>/`，body 为 `data=<json>&type=originaljson`。  
内置本地 Mock 网关，**不会请求大麦线上**。

## 启动

```bat
cd /d e:\DexAndroid\mock-client
npm start
```

UI：`http://127.0.0.1:17806/`  
网关：`http://127.0.0.1:17806/gw/<api>/<v>/`

## Mock 层开关 / 接口前缀

右上角：

- **启用 Mock 层**：本机返回假数据
- **关闭 Mock 层**：浏览器仍请求本机 `/gw/`，由 Node **代理**到前缀（默认 `https://mtop.damai.cn`），避免 CORS `Failed to fetch`
- 真实上游仍需 App 签名，代理只能解决跨域，不能绕过风控；演示发码请开 Mock

## 演示路径

1. 确认前缀 → 任意账号密码登录
2. 项目详情 → 选场次 → 选票档数量
3. 算价 → 选观演人 → build/adjust → create → 支付
4. 右侧日志显示 `/gw/...` 路径
