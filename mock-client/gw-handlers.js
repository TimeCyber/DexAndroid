/**
 * 按选座下单流程接口文案 §十三 的路径与字段，提供本地 Mock 响应。
 * 路径形态：POST /gw/<api>/<v>/  body: data=<json>&type=originaljson
 */

const MOCK_PROJECT = {
  itemId: "720000000000",
  projectId: "720000000000",
  title: "【Mock】城市巡回演唱会",
  venue: "演示体育馆",
  cityId: "110100",
  notice: "本服务为流程演示 Mock，不会产生真实订单。",
  performs: [
    {
      performId: "210000000",
      performanceId: "210000000",
      name: "2026-10-18 19:30 场",
      timeText: "2026-10-18 19:30",
    },
    {
      performId: "210000001",
      performanceId: "210000001",
      name: "2026-10-19 19:30 场",
      timeText: "2026-10-19 19:30",
    },
  ],
  prices: [
    { priceId: "3001", skuId: "80001", name: "看台 A", price: 58000, priceText: "¥580", color: "#2f6fed" },
    { priceId: "3002", skuId: "80002", name: "看台 B", price: 38000, priceText: "¥380", color: "#0f9d58" },
    { priceId: "3003", skuId: "80003", name: "内场", price: 88000, priceText: "¥880", color: "#e67e22" },
  ],
};

const sessions = new Map();
/** smsSid -> { loginId, code, at } */
const pendingSms = new Map();

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function createSession(api, loginId) {
  const newSid = uid("sid");
  const cookie2 = uid("c2");
  const sess = {
    sid: newSid,
    loginId,
    cookie: `cookie2=${cookie2}; sid=${newSid}`,
    ssoToken: "",
    damaiToken: "",
    accessToken: "",
    loginKey: "",
  };
  sessions.set(newSid, sess);
  return {
    ...ok(api, {
      sid: newSid,
      nick: `mock_${loginId.slice(-4) || "user"}`,
      loginType: "sms",
    }),
    _setCookie: sess.cookie,
    _sid: newSid,
  };
}

function ok(api, data) {
  return { api, v: null, ret: ["SUCCESS::调用成功"], data, mock: true };
}

function fail(msg, code = "FAIL_BIZ") {
  return { api: "mock", ret: [`${code}::${msg}`], data: null, mock: true };
}

function getSession(sid) {
  if (!sid) return null;
  return sessions.get(sid) || null;
}

function requireSession(sid) {
  const s = getSession(sid);
  if (!s) {
    const err = new Error("SESSION_EXPIRED::请先登录");
    err.mtop = fail("请先登录", "SESSION_EXPIRED");
    throw err;
  }
  return s;
}

export function handleGw(api, _version, data, sid) {
  switch (api) {
    case "mtop.taobao.mloginService.getLoginFlow":
      return ok(api, {
        loginWays: ["sms", "password"],
        tip: "Mock：默认手机号+验证码登录",
      });

    /** 发短信验证码 — SMSLoginRequest 同源字段 */
    case "mtop.taobao.mloginService.smsSend":
    case "mtop.taobao.mloginService.smsSend.nick": {
      const loginId = String(data.loginId || data.mobile || "").trim();
      if (!/^1\d{10}$/.test(loginId)) return fail("请输入正确手机号");
      const smsSid = uid("smssid");
      const code = "123456";
      pendingSms.set(smsSid, { loginId, code, at: Date.now() });
      return ok(api, {
        smsSid,
        codeLength: "6",
        /** 仅 Mock 回显，真实环境不会返回验证码 */
        mockCode: code,
        tip: "验证码已发送（Mock 固定 123456）",
      });
    }

    /** 短信验证码登录 */
    case "mtop.taobao.mloginService.smsLogin":
    case "mtop.taobao.mloginService.smsLogin.nick": {
      const loginId = String(data.loginId || "").trim();
      const smsCode = String(data.smsCode || "").trim();
      const smsSid = String(data.smsSid || "").trim();
      if (!/^1\d{10}$/.test(loginId)) return fail("请输入正确手机号");
      if (!smsCode) return fail("请输入验证码");
      const pending = smsSid ? pendingSms.get(smsSid) : null;
      if (!pending || pending.loginId !== loginId) return fail("请先获取验证码");
      if (pending.code !== smsCode) return fail("验证码错误（Mock 为 123456）");
      pendingSms.delete(smsSid);
      return createSession(api, loginId);
    }

    case "mtop.taobao.alibabaMLoginService.login":
    case "mtop.mloginService.login": {
      const loginId = String(data.loginId || "").trim();
      if (!loginId || !data.password) return fail("请输入账号和密码");
      return createSession(api, loginId);
    }

    case "mtop.mLoginTokenService.applySsoToken":
    case "mtop.mLoginTokenService.applySsoTokenV2": {
      const s = requireSession(sid);
      s.ssoToken = uid("sso");
      return ok(api, { ssoToken: s.ssoToken });
    }

    case "mtop.login.getWapLoginCookies": {
      const s = requireSession(sid);
      return ok(api, { cookies: s.cookie });
    }

    case "mtop.damai.mxm.user.token.get": {
      const s = requireSession(sid);
      s.damaiToken = uid("dmt");
      return ok(api, { result: s.damaiToken });
    }

    case "mtop.damai.mxm.user.accesstoken.get": {
      const s = requireSession(sid);
      s.accessToken = uid("act");
      s.loginKey = uid("lk");
      return ok(api, { accessToken: s.accessToken, loginKey: s.loginKey });
    }

    case "mtop.damai.item.detail.getdetail":
    case "mtop.damai.item.detail.getdetail.1.0":
      return ok(api, {
        itemId: MOCK_PROJECT.itemId,
        projectId: MOCK_PROJECT.projectId,
        title: MOCK_PROJECT.title,
        venue: MOCK_PROJECT.venue,
        notice: MOCK_PROJECT.notice,
        supportSeat: true,
        performs: MOCK_PROJECT.performs,
        prices: MOCK_PROJECT.prices,
      });

    case "mtop.damai.wireless.seat.dynamicInfo":
      return ok(api, {
        priceList: MOCK_PROJECT.prices.map((p) => ({ ...p, remain: 120, limit: 4 })),
        performBasicInfo: MOCK_PROJECT.performs.find(
          (p) => p.performanceId === String(data.performanceId || ""),
        ),
        promotionDetail: null,
      });

    case "mtop.damai.item.calcTicketPrice": {
      requireSession(sid);
      let list = [];
      try {
        list = JSON.parse(data.skuParamListJson || "[]");
      } catch {
        return fail("skuParamListJson 无效");
      }
      if (!list.length) return fail("请先选择票档并设置数量");
      const count = Number(list[0].count || 0);
      if (count > 4) return fail("限购 4 张（Mock）");
      const total = list.reduce((sum, x) => sum + Number(x.price || 0) * Number(x.count || 0), 0);
      return ok(api, {
        success: true,
        model: {
          realTotalAmt: total,
          realTotalAmtText: `¥${(total / 100).toFixed(0)}`,
          ticketModuleDetailVOS: list,
        },
      });
    }

    case "mtop.damai.wireless.user.customerlist.get": {
      const s = requireSession(sid);
      return ok(api, {
        result: [
          {
            contactsId: 10001,
            name: "张三",
            maskedName: "张*",
            identityType: 1,
            identityTypeName: "身份证",
            maskedIdentityNo: "110***********1234",
            identityNo: "110101199001011234",
            isUserVerified: 1,
            verifyStatus: 1,
          },
          {
            contactsId: 10002,
            name: "李四",
            maskedName: "李*",
            identityType: 1,
            identityTypeName: "身份证",
            maskedIdentityNo: "310***********5678",
            identityNo: "310101199203035678",
            isUserVerified: 1,
            verifyStatus: 1,
          },
          {
            contactsId: 10003,
            name: "王五",
            maskedName: "王*",
            identityType: 1,
            identityTypeName: "身份证",
            maskedIdentityNo: "440***********9012",
            identityNo: "440101199512129012",
            isUserVerified: 0,
            verifyStatus: 0,
          },
        ],
        loginkey: data.loginkey || s.loginKey,
      });
    }

    case "mtop.damai.trade.order.build": {
      requireSession(sid);
      return ok(api, {
        buyParam: data.buyParam,
        ultronParams: uid("ultron"),
        viewers: [],
        delivery: "电子票",
        amountText: "待确认",
      });
    }

    case "mtop.damai.trade.order.adjust": {
      requireSession(sid);
      return ok(api, {
        ultronParams: data.params || uid("ultron"),
        contactsId: data.contactsId,
        viewerName: data.viewerName || "",
        adjusted: true,
      });
    }

    case "mtop.damai.trade.order.create": {
      requireSession(sid);
      return ok(api, {
        orderId: String(1234567890123 + Math.floor(Math.random() * 9000)),
        payStatus: "WAIT_PAY",
      });
    }

    case "mtop.damai.wireless.order.getpayparam": {
      requireSession(sid);
      return ok(api, {
        payChannel: "ALIPAY_MOCK",
        payString: `mock://pay?orderId=${data.orderId}&token=${uid("pay")}`,
      });
    }

    case "mtop.damai.wireless.order.paymentCompletion":
    case "mtop.damai.wireless.order.paymentcompletion": {
      requireSession(sid);
      return ok(api, { orderId: data.orderId, paid: true, message: "Mock 支付完成" });
    }

    default:
      return fail(`未实现的 Mock API: ${api}`, "API_NOT_MOCKED");
  }
}

export function parseSidFromCookie(cookieHeader) {
  if (!cookieHeader) return "";
  const m = /(?:^|;\s*)sid=([^;]+)/.exec(cookieHeader);
  return m ? m[1] : "";
}
