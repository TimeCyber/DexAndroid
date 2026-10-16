#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import re
import json
from collections import defaultdict

DEX_DIR = r"e:\DexAndroid\unpack-output\106\frida"
OUT_JSON = r"e:\DexAndroid\unpack-output\106\_extract.json"

SKIP_URL_SUBSTR = (
    "schemas.android",
    "xmlns",
    "w3.org",
    "apache.org",
    "google.com/go",
    "github.com",
    "mozilla",
    "ietf.org",
    "example.com",
    "issuetracker",
    "goo.gle",
    "ns.adobe",
    "xmlpull",
)

mtop = set()
urls = set()
paths = set()
classes_damai = set()
api_name_const = set()  # strings looking like API names used by MTOP

url_re = re.compile(rb"https?://[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%\-]{6,220}")
mtop_re = re.compile(rb"mtop\.[a-zA-Z0-9_.]{3,100}")
class_re = re.compile(rb"Lcn/damai/[A-Za-z0-9_/$]+;")
path_re = re.compile(rb"[\"'](/[a-zA-Z0-9_./\-]{3,100})[\"']")
# common taobao/damai API style without mtop. prefix in some places
api_re = re.compile(rb"[\"']((?:mtop|com)\.[a-zA-Z0-9_.]{5,100})[\"']")

for fn in os.listdir(DEX_DIR):
    if not fn.endswith(".dex"):
        continue
    body = open(os.path.join(DEX_DIR, fn), "rb").read()

    for m in mtop_re.finditer(body):
        s = m.group().decode("ascii", "ignore")
        if len(s) < 90:
            mtop.add(s)

    for m in url_re.finditer(body):
        u = m.group().decode("ascii", "ignore")
        if any(x in u for x in SKIP_URL_SUBSTR):
            continue
        # strip trailing junk
        u = u.rstrip("\\\"')]>.,;")
        if len(u) >= 12:
            urls.add(u)

    for m in class_re.finditer(body):
        c = m.group().decode("ascii", "ignore")[1:-1].replace("/", ".")
        c = c.split("$")[0]
        classes_damai.add(c)

    for m in path_re.finditer(body):
        p = m.group(1).decode("ascii", "ignore")
        if any(k in p for k in ("/api", "/gw", "/mtop", "/rest", "/v1", "/v2", "/h5", "/app")):
            paths.add(p)

    for m in api_re.finditer(body):
        s = m.group(1).decode("ascii", "ignore")
        if "mtop." in s or s.startswith("com.taobao") or s.startswith("com.damai"):
            api_name_const.add(s)

# group mtop by prefix
groups = defaultdict(list)
for a in sorted(mtop):
    parts = a.split(".")
    key = ".".join(parts[:3]) if len(parts) >= 3 else a
    groups[key].append(a)

# package top-level under cn.damai
pkg_roots = defaultdict(int)
for c in classes_damai:
    parts = c.split(".")
    if len(parts) >= 3:
        pkg_roots[".".join(parts[:3])] += 1

result = {
    "source": DEX_DIR,
    "dex_count": len([f for f in os.listdir(DEX_DIR) if f.endswith(".dex")]),
    "mtop_count": len(mtop),
    "mtop": sorted(mtop),
    "mtop_groups": {k: v for k, v in sorted(groups.items())},
    "urls": sorted(urls),
    "paths": sorted(paths),
    "api_name_const": sorted(api_name_const),
    "class_count": len(classes_damai),
    "pkg_roots": dict(sorted(pkg_roots.items(), key=lambda x: -x[1])[:80]),
    "classes_sample": sorted(classes_damai)[:400],
}

with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("dex", result["dex_count"])
print("mtop", result["mtop_count"])
print("urls", len(urls))
print("paths", len(paths))
print("classes", result["class_count"])
print("groups", len(groups))
print("->", OUT_JSON)
