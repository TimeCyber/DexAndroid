#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate API文档.md from Frida dump extraction."""
import json
import re
from collections import defaultdict
from pathlib import Path

BASE = Path(r"e:\DexAndroid\unpack-output\106")
extract = json.loads((BASE / "_extract.json").read_text(encoding="utf-8"))
biz = json.loads((BASE / "_extract_biz.json").read_text(encoding="utf-8"))

mtop = extract["mtop"]
damai = sorted(a for a in mtop if a.startswith("mtop.damai"))
film = sorted(a for a in mtop if a.startswith("mtop.film"))
other = sorted(
    a
    for a in mtop
    if not a.startswith("mtop.damai") and not a.startswith("mtop.film")
)


def subgroup(apis, depth=4):
    g = defaultdict(list)
    for a in apis:
        parts = a.split(".")
        key = ".".join(parts[:depth]) if len(parts) >= depth else a
        g[key].append(a)
    return dict(sorted(g.items()))


# categorize damai APIs by keyword
DAMAI_CATS = [
    ("商品/项目详情", ("item.", "project", "detail.getdetail", "tips.", "notice.")),
    ("交易下单", ("trade.order", "spliceorder", "calcTicket", "order.")),
    ("票夹/票务", ("ticklet", "ticket", "eticket", "perform")),
    ("选座", ("seat", "maitix")),
    ("搜索", ("search.",)),
    ("首页/运营位", ("mec.", "aristotle", "popup", "homepage", "home.")),
    ("用户/消息", ("msgbox", "user.", "mxm.user", "push.token")),
    ("营销/优惠券", ("coupon", "mkt.", "promotion", "activity.")),
    ("评价/社区", ("comment", "discover", "content", "evaluate")),
    ("AI/其他", ("wireless.ai", "artiste", "vote", "nls")),
]

FILM_CATS = [
    ("影院/排期", ("Cinema", "Schedule", "ShowTime", "Seat")),
    ("影片/演出", ("Show", "Film", "ArtShow", "Artiste", "Festival")),
    ("下单/支付", ("Order", "Cashier", "Pay", "Trade", "Coupon", "FCode")),
    ("社区/评论", ("Community", "Comment", "Discussion", "Feed")),
    ("广告/推荐", ("Advertise", "Guess", "Recommend", "Flash", "Guide")),
    ("其他", ()),
]


def categorize(apis, cats):
    used = set()
    out = []
    for name, keys in cats:
        hit = []
        for a in apis:
            if a in used:
                continue
            if not keys or any(k in a for k in keys):
                hit.append(a)
                used.add(a)
        if hit:
            out.append((name, hit))
    rest = [a for a in apis if a not in used]
    if rest:
        out.append(("未分组", rest))
    return out


# hosts summary
hosts = biz["hosts"]
biz_urls = biz["biz_urls"]

# pick representative URLs
def pick_urls(*keywords):
    hits = []
    for u in biz_urls:
        lu = u.lower()
        if any(k in lu for k in keywords):
            hits.append(u)
    # unique by host+path prefix
    seen = set()
    uniq = []
    for u in hits:
        key = u.split("?")[0]
        if key not in seen:
            seen.add(key)
            uniq.append(u)
    return uniq[:40]


pkg_roots = extract["pkg_roots"]

lines = []
A = lines.append

A("# 大麦 (cn.damai) 接口文档")
A("")
A("> 基于 Frida 内存 dump 静态字符串提取  ")
A("> 样本包名：`cn.damai`（大麦 9.0.35）  ")
A("> 加固：阿里聚安全  ")
A("> dump 目录：`unpack-output/106/frida/`（97 个 dex，约 233MB）  ")
A("> 业务类数量：约 %d（`cn.damai.*`）" % extract["class_count"])
A("")
A("## 1. 协议说明")
A("")
A("大麦 App 主通道为 **阿里 MTOP**：")
A("")
A("- 典型请求字段：`api`（接口名）、`v`（版本）、`data`（业务 JSON）、登录态 `sid/cookie`")
A("- 网关 Host 常随环境切换（正式 / 预发 wapa / 测试 waptest）")
A("- H5 / 营销页大量走 `m.damai.cn`、`gw.alicdn.com`、淘宝/支付宝域")
A("")
A("调用形态（示意）：")
A("")
A("```text")
A("POST https://<mtop-host>/gw/<api>/<v>/")
A("Content-Type: application/x-www-form-urlencoded")
A("api=<mtop.xxx>&v=1.0&data={...}&...")
A("```")
A("")
A("## 2. 主要域名")
A("")
A("| Host | 出现次数(字符串) | 用途（推断） |")
A("| --- | ---: | --- |")
for h, c in list(hosts.items())[:35]:
    role = ""
    hl = h.lower()
    if "damai" in hl and "download" in hl:
        role = "客户端下载"
    elif "passport" in hl or "login" in hl or "security" in hl:
        role = "登录/账号安全"
    elif "detail.damai" in hl:
        role = "项目详情 H5"
    elif "m.damai" in hl:
        role = "大麦 H5 主站"
    elif "market.wapa.damai" in hl:
        role = "大麦预发营销"
    elif "alicdn" in hl or "img." in hl:
        role = "CDN / 静态资源"
    elif "alipay" in hl:
        role = "支付宝"
    elif "taobao" in hl or "tmall" in hl:
        role = "淘宝系"
    elif "amap" in hl:
        role = "高德地图"
    elif "taopiaopiao" in hl:
        role = "淘票票"
    elif "youku" in hl:
        role = "优酷账号/连通"
    A(f"| `{h}` | {c} | {role} |")
A("")

A("## 3. 业务模块（代码包）")
A("")
A("| 包前缀 | 类数量 | 说明 |")
A("| --- | ---: | --- |")
desc_map = {
    "cn.damai.commonbusiness": "通用业务组件",
    "cn.damai.homepage": "首页",
    "cn.damai.tetris": "动态楼层/组件框架",
    "cn.damai.trade": "交易下单",
    "cn.damai.pioneer": "新版/先锋频道",
    "cn.damai.mine": "我的",
    "cn.damai.uikit": "UI 组件",
    "cn.damai.ticklet": "票夹",
    "cn.damai.user": "用户",
    "cn.damai.common": "基础公共",
    "cn.damai.discover": "发现/社区",
    "cn.damai.category": "类目/抢票等",
    "cn.damai.ultron": "奥创交易",
    "cn.damai.comment": "评价",
    "cn.damai.launcher": "启动",
    "cn.damai.seat": "选座",
    "cn.damai.h5container": "H5 容器",
    "cn.damai.search": "搜索",
    "cn.damai.login": "登录",
    "cn.damai.pay": "支付",
    "cn.damai.filmdetail": "影片详情",
}
for pkg, cnt in list(pkg_roots.items())[:30]:
    A(f"| `{pkg}` | {cnt} | {desc_map.get(pkg, '')} |")
A("")

A("## 4. MTOP 接口总览")
A("")
A("| 前缀 | 数量 |")
A("| --- | ---: |")
A(f"| `mtop.damai.*` | {len(damai)} |")
A(f"| `mtop.film.*` | {len(film)} |")
A(f"| 其他（淘宝/账号/支付等） | {len(other)} |")
A(f"| **合计** | **{len(mtop)}** |")
A("")

A("## 5. mtop.damai.*（大麦主业务）")
A("")
for i, (cat, apis) in enumerate(categorize(damai, DAMAI_CATS), 1):
    A(f"### 5.{i} {cat}")
    A("")
    A("| API |")
    A("| --- |")
    for a in apis:
        A(f"| `{a}` |")
    A("")

A("## 6. mtop.film.*（淘票票/电影相关）")
A("")
for i, (cat, apis) in enumerate(categorize(film, FILM_CATS), 1):
    A(f"### 6.{i} {cat}")
    A("")
    A("| API |")
    A("| --- |")
    for a in apis:
        A(f"| `{a}` |")
    A("")

A("## 7. 其他 MTOP（账号 / 淘宝 / 支付辅助）")
A("")
A("| API |")
A("| --- |")
for a in other:
    # skip obvious noise class-like names
    if a in ("mtop.FullTraceHelper", "mtop.UccRemoteLogin", "mtop.appName", "mtop.appVersion"):
        continue
    A(f"| `{a}` |")
A("")

A("## 8. 关键 H5 / 页面 URL（摘录）")
A("")
A("### 8.1 大麦站内")
A("")
A("| URL |")
A("| --- |")
for u in pick_urls("m.damai.cn", "detail.damai", "passport.damai", "t.damai", "p.damai", "msecurity.damai", "androiddownload.damai"):
    A(f"| `{u}` |")
A("")
A("### 8.2 登录 / 支付")
A("")
A("| URL |")
A("| --- |")
for u in pick_urls("login.m.taobao", "alipay", "passport", "account.youku"):
    A(f"| `{u}` |")
A("")
A("### 8.3 CDN / 资源")
A("")
A("| URL |")
A("| --- |")
for u in pick_urls("gw.alicdn.com", "img.alicdn.com", "g.alicdn.com")[:25]:
    A(f"| `{u}` |")
A("")

A("## 9. 关键业务流程（推断）")
A("")
A("```text")
A("浏览项目 -> mtop.damai.item.detail.getdetail")
A("         -> 价格试算 mtop.damai.item.calcTicketPrice")
A("         -> 下单构建 mtop.damai.trade.order.build")
A("         -> 创建订单 mtop.damai.trade.order.create / spliceorder.create")
A("         -> 支付 mtop.film.MtopCashierConsultAPI.* / 支付宝 H5")
A("         -> 票夹 mtop.damai.*ticklet* / cn.damai.ticklet")
A("```")
A("")
A("抢票相关代码包：`cn.damai.category.grab`；搜索：`mtop.damai.search.*`。")
A("")
A("## 10. 数据来源与局限")
A("")
A("- 接口名来自 dex 内可见字符串，**不等于线上都会被调用**。")
A("- 未包含完整请求/响应字段定义（需结合运行时抓包或进一步 smali 跟读）。")
A("- 部分接口可能有多版本（如 `*.1.0` 后缀）。")
A("- 原始清单：`_extract.json` / `_mtop_damai.txt` / `_mtop_film.txt`。")
A("")

out = BASE / "API文档.md"
out.write_text("\n".join(lines), encoding="utf-8")
print("wrote", out, "lines", len(lines))
