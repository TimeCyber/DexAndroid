/**
 * 按大麦文档形态请求：POST {前缀}/gw/<api>/<v>/
 * body: data=<urlencode(json)>&type=originaljson
 * 前缀为空时默认 http://127.0.0.1
 */

const listeners = new Set();
const STORAGE_KEY = "damai_mock_api_prefix";
const MOCK_LAYER_KEY = "damai_mock_layer_enabled";
/** Mock 开：空前缀默认本机；Mock 关：空前缀默认大麦真实网关 */
export const DEFAULT_PREFIX_MOCK = "http://127.0.0.1";
export const DEFAULT_PREFIX_REAL = "https://mtop.damai.cn";

export function onApiLog(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(entry) {
  for (const fn of listeners) fn(entry);
}

export function getStoredPrefix() {
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function setStoredPrefix(value) {
  localStorage.setItem(STORAGE_KEY, value ?? "");
}

/** 是否启用本地 Mock 层（默认开启） */
export function isMockLayerEnabled() {
  const v = localStorage.getItem(MOCK_LAYER_KEY);
  return v === null ? true : v === "1";
}

export function setMockLayerEnabled(on) {
  localStorage.setItem(MOCK_LAYER_KEY, on ? "1" : "0");
}

export function defaultPrefixForMode(mockOn = isMockLayerEnabled()) {
  if (mockOn) {
    if (typeof location !== "undefined" && location.origin) return location.origin;
    return DEFAULT_PREFIX_MOCK;
  }
  return DEFAULT_PREFIX_REAL;
}

/**
 * 解析前缀：
 * - Mock 开且留空 → 当前页 origin / http://127.0.0.1
 * - Mock 关且留空 → https://mtop.damai.cn
 */
export function resolveApiPrefix(raw) {
  let s = String(raw ?? "").trim();
  if (!s) s = defaultPrefixForMode();
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  return s.replace(/\/+$/, "");
}

/** 接口后缀：/gw/<api>/<v>/ */
export function apiSuffix(api, version) {
  return `/gw/${api}/${version}/`;
}

/** 逻辑上游 URL（日志展示用） */
export function buildLogicalUrl(api, version, prefixRaw) {
  const el = typeof document !== "undefined" ? document.getElementById("apiPrefix") : null;
  const raw = prefixRaw != null ? prefixRaw : el ? el.value : getStoredPrefix();
  return `${resolveApiPrefix(raw)}${apiSuffix(api, version)}`;
}

/**
 * 浏览器实际请求地址：始终打本机同域 /gw/，避免跨域 Failed to fetch。
 * Mock 关时由 Node 代理到「接口前缀」。
 */
export function buildApiUrl(api, version) {
  const origin =
    typeof location !== "undefined" && location.origin
      ? location.origin
      : DEFAULT_PREFIX_MOCK;
  return `${origin}${apiSuffix(api, version)}`;
}

export function getUpstreamPrefix() {
  const el = typeof document !== "undefined" ? document.getElementById("apiPrefix") : null;
  return resolveApiPrefix(el ? el.value : getStoredPrefix());
}

export const session = {
  loggedIn: false,
  loginId: "",
  sid: "",
  cookie: "",
  ssoToken: "",
  damaiToken: "",
  accessToken: "",
  loginKey: "",
  smsSid: "",
  mockCode: "",
};

/** 把 MTOP 风控/校验错误转成可操作提示 */
export function formatMtopError(ret0) {
  const msg = String(ret0 || "");
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return "网络失败：请确认已 npm start 且页面走本机地址；直连请重启服务以启用本地代理。";
  }
  if (
    msg.includes("FAIL_SYS_USER_VALIDATE") ||
    msg.includes("被挤爆") ||
    msg.includes("RGV587") ||
    msg.includes("哎哟喂")
  ) {
    return (
      "上游风控拦截（缺 x-sign/WUA 等 App 签名）。" +
      "演示请打开「启用 Mock 层」；真实发码需官方 App/SDK。"
    );
  }
  return msg;
}

async function mtopCall(api, version, data, { needLogin = false } = {}) {
  if (needLogin && !session.loggedIn) {
    throw new Error("需要先完成登录（会话）");
  }

  const mockOn = isMockLayerEnabled();
  const transportUrl = buildApiUrl(api, version);
  const logicalUrl = buildLogicalUrl(api, version);
  const started = Date.now();
  emit({
    phase: "request",
    api,
    version,
    url: logicalUrl,
    request: data,
    at: new Date().toISOString(),
  });

  const body = new URLSearchParams();
  body.set("data", JSON.stringify(data ?? {}));
  body.set("type", "originaljson");

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    "X-Mock-Layer": mockOn ? "1" : "0",
    "X-Upstream-Prefix": getUpstreamPrefix(),
  };
  if (session.sid) headers["X-Mock-Sid"] = session.sid;

  let json;
  try {
    const res = await fetch(transportUrl, {
      method: "POST",
      headers,
      body: body.toString(),
      credentials: "include",
    });
    const text = await res.text();
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`响应非 JSON (${res.status}): ${text.slice(0, 120)}`);
    }
    if (!res.ok) {
      throw new Error(formatMtopError(json?.ret?.[0] || `HTTP ${res.status}`));
    }
  } catch (e) {
    const friendly = formatMtopError(e.message);
    emit({
      phase: "response",
      api,
      version,
      url: logicalUrl,
      request: data,
      response: { ret: [`FAIL::${friendly}`], data: null },
      ms: Date.now() - started,
      at: new Date().toISOString(),
    });
    throw new Error(friendly);
  }

  const ret0 = json?.ret?.[0] || "";
  if (ret0 && !ret0.includes("SUCCESS")) {
    const friendly = formatMtopError(ret0);
    emit({
      phase: "response",
      api,
      version,
      url: logicalUrl,
      request: data,
      response: json,
      ms: Date.now() - started,
      at: new Date().toISOString(),
    });
    throw new Error(friendly);
  }

  emit({
    phase: "response",
    api,
    version,
    url: logicalUrl,
    request: data,
    response: json,
    ms: Date.now() - started,
    at: new Date().toISOString(),
  });
  return json;
}

export async function getLoginFlow() {
  return mtopCall("mtop.taobao.mloginService.getLoginFlow", "1.0", {});
}

/** 发短信验证码 mtop.taobao.mloginService.smsSend */
export async function smsSend({ loginId, countryCode = "CN", phoneCode = "86" }) {
  const mobile = String(loginId || "").trim();
  if (!/^1\d{10}$/.test(mobile)) {
    throw new Error("请输入正确的 11 位手机号");
  }
  const res = await mtopCall("mtop.taobao.mloginService.smsSend", "1.0", {
    loginId: mobile,
    countryCode,
    phoneCode,
    codeLength: "6",
    deviceName: "Mock-Windows",
    useDeviceToken: true,
    t: Date.now(),
  });
  session.smsSid = res.data?.smsSid || "";
  session.mockCode = res.data?.mockCode || "";
  return res;
}

/** 短信验证码登录 mtop.taobao.mloginService.smsLogin */
export async function smsLogin({
  loginId,
  smsCode,
  smsSid,
  countryCode = "CN",
  phoneCode = "86",
}) {
  const mobile = String(loginId || "").trim();
  const code = String(smsCode || "").trim();
  if (!/^1\d{10}$/.test(mobile)) {
    throw new Error("请输入正确的 11 位手机号");
  }
  if (!code) throw new Error("请输入验证码");
  const res = await mtopCall("mtop.taobao.mloginService.smsLogin", "1.0", {
    loginId: mobile,
    smsCode: code,
    smsSid: smsSid || session.smsSid || "",
    countryCode,
    phoneCode,
    codeLength: "6",
    loginType: "sms",
    deviceName: "Mock-Windows",
    useDeviceToken: true,
    t: Date.now(),
  });
  session.loggedIn = true;
  session.loginId = mobile;
  session.sid = res.data?.sid || "";
  session.cookie = session.sid ? `sid=${session.sid}` : "";
  return res;
}

/** @deprecated 保留账密，默认流程请用 smsLogin */
export async function login({ loginId, password }) {
  if (!loginId?.trim() || !password) {
    throw new Error("请输入账号和密码");
  }
  const res = await mtopCall("mtop.taobao.alibabaMLoginService.login", "1.0", {
    loginId: loginId.trim(),
    password,
    pwdEncrypted: false,
    loginType: "taobao",
    deviceName: "Mock-Windows",
    useDeviceToken: true,
    t: Date.now(),
  });
  session.loggedIn = true;
  session.loginId = loginId.trim();
  session.sid = res.data?.sid || "";
  session.cookie = session.sid ? `sid=${session.sid}` : "";
  return res;
}

export async function applySsoToken() {
  const res = await mtopCall("mtop.mLoginTokenService.applySsoToken", "1.0", {}, { needLogin: true });
  session.ssoToken = res.data?.ssoToken || "";
  return res;
}

export async function getWapLoginCookies() {
  const res = await mtopCall("mtop.login.getWapLoginCookies", "1.0", {}, { needLogin: true });
  if (res.data?.cookies) session.cookie = res.data.cookies;
  return res;
}

export async function getDamaiToken() {
  const res = await mtopCall(
    "mtop.damai.mxm.user.token.get",
    "1.0",
    { loginStateType: "1", xiaoMiType: "1" },
    { needLogin: true },
  );
  session.damaiToken = res.data?.result || "";
  return res;
}

export async function getAccessToken() {
  const res = await mtopCall(
    "mtop.damai.mxm.user.accesstoken.get",
    "1.0",
    {
      userCode: session.loginId,
      from: "mock",
      v: "1.0",
      timestamp: Date.now(),
    },
    { needLogin: true },
  );
  session.accessToken = res.data?.accessToken || "";
  session.loginKey = res.data?.loginKey || "";
  return res;
}

export async function getDetail(itemId) {
  return mtopCall("mtop.damai.item.detail.getdetail", "1.0", {
    itemId: itemId || "720000000000",
    version: "1.0",
  });
}

export async function getPriceTiers({ projectId, itemId, performanceId }) {
  const dynamic = await mtopCall("mtop.damai.wireless.seat.dynamicInfo", "1.0", {
    projectId,
    itemId,
    performanceId,
    hasPromotion: false,
    dmChannel: "*@damai_android_*",
  });
  return { dynamic, prices: dynamic.data?.priceList || [] };
}

export async function calcTicketPrice({ itemId, performId, priceId, price, count }) {
  if (!priceId || !count) throw new Error("请先选择票档并设置数量");
  if (count > 4) throw new Error("限购 4 张（Mock）");
  const skuParamList = [{ priceId, price, count }];
  return mtopCall(
    "mtop.damai.item.calcTicketPrice",
    "2.0",
    {
      itemId,
      performId,
      calculateTag: `tag_${Date.now()}`,
      skuParamListJson: JSON.stringify(skuParamList),
      dmChannel: "*@damai_android_*",
    },
    { needLogin: true },
  );
}

export async function getCustomerList() {
  return mtopCall(
    "mtop.damai.wireless.user.customerlist.get",
    "2.0",
    { loginkey: session.loginKey || "mock-login-key" },
    { needLogin: true },
  );
}

export async function orderBuild({ itemId, count, skuId }) {
  const buyParam = `${itemId}_${count}_${skuId}`;
  return mtopCall(
    "mtop.damai.trade.order.build",
    "1.0",
    {
      buyNow: "true",
      buyParam,
      exParams: JSON.stringify({ coupon: "true", coVersion: "2.0" }),
    },
    { needLogin: true },
  );
}

export async function orderAdjust({ params, contactsId, viewerName }) {
  return mtopCall(
    "mtop.damai.trade.order.adjust",
    "1.0",
    {
      feature: JSON.stringify({ gzip: "true" }),
      params,
      contactsId,
      viewerName,
    },
    { needLogin: true },
  );
}

export async function orderCreate({ params }) {
  return mtopCall(
    "mtop.damai.trade.order.create",
    "1.0",
    {
      params,
      feature: JSON.stringify({ gzip: "true", subChannel: "damai@tppnew_app" }),
      gzip: "true",
      orderMarker: "v:utdid=mock-windows",
    },
    { needLogin: true },
  );
}

export async function getPayParam({ orderId }) {
  return mtopCall(
    "mtop.damai.wireless.order.getpayparam",
    "2.0",
    {
      orderId,
      type: "1",
      loginkey: session.loginKey || "mock-login-key",
      pageurl: "http://m.damai.cn/orderlist.aspx",
    },
    { needLogin: true },
  );
}

export async function paymentCompletion({ orderId }) {
  return mtopCall(
    "mtop.damai.wireless.order.paymentCompletion",
    "1.0",
    { orderId, result: "SUCCESS" },
    { needLogin: true },
  );
}

export function logout() {
  Object.assign(session, {
    loggedIn: false,
    loginId: "",
    sid: "",
    cookie: "",
    ssoToken: "",
    damaiToken: "",
    accessToken: "",
    loginKey: "",
    smsSid: "",
    mockCode: "",
  });
}
