import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import { handleGw, parseSidFromCookie } from "./gw-handlers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");
const PORT = Number(process.env.PORT) || 17806;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function cors(res, req) {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Mock-Sid, X-Mock-Layer, X-Upstream-Prefix, Cookie",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function parseForm(body) {
  const params = new URLSearchParams(body);
  let data = {};
  const raw = params.get("data");
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { _raw: raw };
    }
  }
  return { data, type: params.get("type") };
}

function normalizePrefix(raw) {
  let s = String(raw || "https://mtop.damai.cn").trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  return s.replace(/\/+$/, "");
}

/** 直连：由本机转发，避免浏览器 CORS Failed to fetch */
async function proxyUpstream(api, version, body, upstreamPrefix) {
  const prefix = normalizePrefix(upstreamPrefix);
  const url = `${prefix}/gw/${api}/${version}/`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; MockClient) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
      Accept: "application/json",
    },
    body,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = {
      ret: [`FAIL::上游非 JSON HTTP ${res.status}`],
      data: { raw: text.slice(0, 300) },
      mock: false,
      upstream: url,
    };
  }
  if (!json.upstream) json.upstream = url;
  json.mock = false;
  return { status: res.status, json, url };
}

async function handleGwRequest(req, res, urlPath) {
  cors(res, req);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ret: ["FAIL::Method Not Allowed"] }));
    return;
  }

  const m = urlPath.match(/^\/gw\/([^/]+)\/([^/]+)\/?$/);
  if (!m) {
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ret: ["FAIL::bad gw path, expect /gw/<api>/<v>/"] }));
    return;
  }
  const api = decodeURIComponent(m[1]);
  const version = decodeURIComponent(m[2]);
  const body = await readBody(req);
  const mockLayer = String(req.headers["x-mock-layer"] ?? "1") !== "0";
  const upstreamPrefix = req.headers["x-upstream-prefix"] || "https://mtop.damai.cn";

  // —— 直连：代理到真实前缀 ——
  if (!mockLayer) {
    try {
      const { status, json, url } = await proxyUpstream(api, version, body, upstreamPrefix);
      console.log(`[GW-PROXY] ${url} → ${json.ret?.[0] || status}`);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(json));
    } catch (e) {
      console.log(`[GW-PROXY] error ${e.message}`);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          ret: [`FAIL::代理上游失败 ${e.message}`],
          data: null,
          mock: false,
        }),
      );
    }
    return;
  }

  // —— Mock 层 ——
  const { data } = parseForm(body);
  const sid =
    req.headers["x-mock-sid"] ||
    parseSidFromCookie(req.headers.cookie || "") ||
    data.sid ||
    "";

  let result;
  try {
    result = handleGw(api, version, data, sid);
  } catch (e) {
    result = e.mtop || {
      ret: [`FAIL::${e.message}`],
      data: null,
      mock: true,
    };
  }

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
  };
  if (result._setCookie) {
    headers["Set-Cookie"] = `${result._setCookie}; Path=/; SameSite=Lax`;
  }
  const { _setCookie, _sid, ...payload } = result;
  if (_sid) payload.data = { ...payload.data, sid: _sid };

  console.log(`[GW-MOCK] POST /gw/${api}/${version}/ → ${payload.ret?.[0] || "?"}`);
  res.writeHead(200, headers);
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);

  if (urlPath.startsWith("/gw/")) {
    try {
      await handleGwRequest(req, res, urlPath);
    } catch (e) {
      cors(res, req);
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ret: [`FAIL::${e.message}`] }));
    }
    return;
  }

  cors(res, req);
  let rel = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(PUBLIC, rel));

  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${PORT}/`;
  console.log(`[Mock] 演示客户端已启动`);
  console.log(`[Mock] UI   ${url}`);
  console.log(`[Mock] 本地 ${url}gw/<api>/<v>/  （Mock 开=假数据；Mock 关=代理上游）`);
  if (process.platform === "win32") {
    exec(`start "" "${url}"`);
  }
});
