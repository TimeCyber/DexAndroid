import * as api from "./mock-api.js";
import { MOCK_PROJECT } from "./mock-data.js";

const STEPS = [
  { id: 0, title: "登录", sub: "短信验证码 → Token" },
  { id: 1, title: "项目/场次", sub: "getdetail" },
  { id: 2, title: "选票档", sub: "票档 + 数量" },
  { id: 3, title: "确认订单", sub: "build / adjust" },
  { id: 4, title: "支付完成", sub: "create → pay" },
];

const LOG_MAX = 18;

const state = {
  step: 0,
  project: null,
  perform: null,
  prices: [],
  selectedPrice: null,
  ticketCount: 1,
  customers: [],
  selectedCustomer: null,
  calc: null,
  build: null,
  orderId: null,
  pay: null,
  busy: false,
  error: "",
};

const $ = (sel) => document.querySelector(sel);

function renderSteps() {
  const root = $("#steps");
  root.innerHTML = STEPS.map((s) => {
    const cls = ["step"];
    if (s.id === state.step) cls.push("active");
    if (s.id < state.step) cls.push("done");
    return `<div class="${cls.join(" ")}"><span class="num">${s.id + 1}</span>${s.title}</div>`;
  }).join("");
}

function renderSession() {
  const chip = $("#sessionChip");
  const mode = api.isMockLayerEnabled() ? "Mock" : "直连";
  if (api.session.loggedIn) {
    chip.classList.add("on");
    chip.textContent = `[${mode}] 已登录 ${api.session.loginId} · token ${api.session.damaiToken || "-"}`;
  } else {
    chip.classList.remove("on");
    chip.textContent = `[${mode}] 未登录`;
  }
}

function refreshModeBanner() {
  const banner = $("#modeBanner");
  if (!banner) return;
  if (api.isMockLayerEnabled()) {
    banner.classList.remove("direct");
    banner.innerHTML =
      "<strong>Mock 层已开启</strong> — 请求打到本地 Mock 网关，使用假数据，不会产生真实订单。";
  } else {
    banner.classList.add("direct");
    banner.innerHTML =
      "<strong>Mock 层已关闭</strong> — 按前缀直连（默认 <code>https://mtop.damai.cn</code>）。真实环境需签名/风控，本客户端可能无法直接登录成功。";
  }
}

function setBusy(v) {
  state.busy = v;
  document.querySelectorAll("[data-action]").forEach((el) => {
    el.disabled = v;
  });
}

function showError(msg) {
  state.error = msg || "";
  const el = $("#pageError");
  if (!el) return;
  el.textContent = state.error;
  el.classList.toggle("hidden", !state.error);
}

async function run(fn) {
  showError("");
  setBusy(true);
  try {
    await fn();
  } catch (e) {
    showError(e.message || String(e));
  } finally {
    setBusy(false);
    renderSession();
    renderPage();
  }
}

function shortApiName(api) {
  return String(api || "").replace(/^mtop\.(damai\.|taobao\.|com\.taobao\.)?/, "");
}

function appendLog(entry) {
  if (entry.phase !== "response") return;
  const pre = $("#apiLog");
  if (pre.classList.contains("log-empty")) {
    pre.classList.remove("log-empty");
    pre.textContent = "";
  }
  const ok = entry.response?.ret?.[0]?.includes("SUCCESS") ?? true;
  const path = entry.url ? entry.url.replace(/^https?:\/\/[^/]+/i, "") : shortApiName(entry.api);
  const line = document.createElement("div");
  line.className = "log-line";
  line.title = entry.url || entry.api;
  line.innerHTML = `<span class="${ok ? "tag-res" : "tag-err"}">${ok ? "OK" : "ERR"}</span> <span class="log-path">${path}</span> <span class="log-ms">${entry.ms ?? "-"}ms</span>`;
  pre.appendChild(line);
  while (pre.children.length > LOG_MAX) pre.removeChild(pre.firstChild);
  pre.scrollTop = pre.scrollHeight;
}

api.onApiLog(appendLog);

function refreshPrefixHint() {
  const hint = $("#prefixHint");
  const input = $("#apiPrefix");
  if (!hint || !input) return;
  const base = api.resolveApiPrefix(input.value);
  const mode = api.isMockLayerEnabled() ? "Mock" : "直连(经本机代理)";
  hint.textContent = `[${mode}] ${base}/gw/<api>/<v>/`;
}

function bindPrefixInput() {
  const input = $("#apiPrefix");
  const toggle = $("#mockLayerToggle");
  if (!input) return;

  if (toggle) {
    toggle.checked = api.isMockLayerEnabled();
    toggle.addEventListener("change", () => {
      const on = toggle.checked;
      api.setMockLayerEnabled(on);
      // 切换模式时给出对应默认前缀，便于马上联调
      input.value = api.defaultPrefixForMode(on);
      api.setStoredPrefix(input.value);
      refreshModeBanner();
      refreshPrefixHint();
      renderSession();
      if (state.step === 0) renderPage();
    });
  }

  const stored = api.getStoredPrefix();
  input.value = stored || api.defaultPrefixForMode();
  refreshModeBanner();
  refreshPrefixHint();
  input.addEventListener("input", () => {
    api.setStoredPrefix(input.value);
    refreshPrefixHint();
  });
  input.addEventListener("change", () => {
    api.setStoredPrefix(input.value);
    refreshPrefixHint();
  });
}

function renderPage() {
  renderSteps();
  const bd = $("#mainBd");
  const hdTitle = $("#mainTitle");
  const hdSub = $("#mainSub");
  const ft = $("#mainFt");
  hdSub.textContent = STEPS[state.step].sub;

  if (state.step === 0) {
    hdTitle.textContent = "阶段 0：手机号验证码登录 / Token";
    bd.innerHTML = `
      <p class="hint">默认短信登录：<code>smsSend</code> → <code>smsLogin</code> →
      <code>applySsoToken</code> → <code>getWapLoginCookies</code> →
      <code>mxm.user.token.get</code> → <code>accesstoken.get</code>。
      ${
        api.isMockLayerEnabled()
          ? "Mock 验证码固定 <strong>123456</strong>。"
          : "当前为<strong>直连</strong>（经本机代理避免 CORS）。无 App 签名仍会被上游风控；演示发码请开启 Mock 层。"
      }</p>
      <div class="form-grid">
        <label>手机号 loginId<input id="loginId" value="13800000000" inputmode="numeric" maxlength="11" autocomplete="tel" /></label>
        <label>验证码 smsCode
          <div class="sms-row">
            <input id="smsCode" value="" inputmode="numeric" maxlength="6" placeholder="6 位验证码" autocomplete="one-time-code" />
            <button type="button" class="btn" data-action id="btnSmsSend">获取验证码</button>
          </div>
        </label>
      </div>
      <p id="smsTip" class="selected-seats"></p>
      <p id="pageError" class="error ${state.error ? "" : "hidden"}">${state.error || ""}</p>
      ${
        api.session.loggedIn
          ? `<div class="success-box" style="margin-top:14px">
              <h3>Mock 会话已就绪</h3>
              <div class="kv">
                <div><dt>手机号</dt><dd>${api.session.loginId}</dd></div>
                <div><dt>sid</dt><dd>${api.session.sid}</dd></div>
                <div><dt>SSO</dt><dd>${api.session.ssoToken}</dd></div>
                <div><dt>大麦 Token</dt><dd>${api.session.damaiToken}</dd></div>
                <div><dt>AccessToken</dt><dd>${api.session.accessToken}</dd></div>
              </div>
            </div>`
          : ""
      }
    `;
    ft.innerHTML = `
      <button class="btn ghost" data-action type="button" id="btnLogout">清除会话</button>
      <button class="btn primary" data-action type="button" id="btnLogin">
        ${api.session.loggedIn ? "重新短信登录" : "验证码登录并拿 Token"}
      </button>
      <button class="btn primary" data-action type="button" id="btnNext0" ${
        api.session.loggedIn ? "" : "disabled"
      }>下一步：项目场次</button>
    `;
    $("#btnSmsSend").onclick = () =>
      run(async () => {
        // 发码不依赖 getLoginFlow；直连时该接口常被风控，会误挡发码
        const res = await api.smsSend({ loginId: $("#loginId").value });
        const tip = $("#smsTip");
        if (tip) {
          if (api.isMockLayerEnabled() && res.data?.mockCode) {
            tip.innerHTML = `已发送 · smsSid=${res.data?.smsSid || "-"} · Mock 码 <strong>${
              res.data.mockCode
            }</strong>`;
            $("#smsCode").value = res.data.mockCode;
          } else {
            tip.textContent = `已请求发码 · smsSid=${res.data?.smsSid || res.data?.sid || "-"}`;
          }
        }
      });
    $("#btnLogin").onclick = () =>
      run(async () => {
        if (!api.session.smsSid) {
          await api.smsSend({ loginId: $("#loginId").value });
        }
        await api.smsLogin({
          loginId: $("#loginId").value,
          smsCode: $("#smsCode").value,
          smsSid: api.session.smsSid,
        });
        await api.applySsoToken();
        await api.getWapLoginCookies();
        await api.getDamaiToken();
        await api.getAccessToken();
      });
    $("#btnLogout").onclick = () =>
      run(async () => {
        api.logout();
        state.step = 0;
        state.orderId = null;
      });
    $("#btnNext0").onclick = () => {
      state.step = 1;
      renderPage();
    };
    return;
  }

  if (state.step === 1) {
    hdTitle.textContent = "阶段 1：项目详情 / 选择场次";
    const itemId = state.project?.itemId || MOCK_PROJECT.itemId;
    bd.innerHTML = `
      <p class="hint">调用 <code>mtop.damai.item.detail.getdetail</code>，产出 itemId / performId / priceId。</p>
      <div class="form-grid">
        <label>itemId<input id="itemId" value="${itemId}" /></label>
      </div>
      <div id="projectBox" style="margin-top:14px"></div>
      <p id="pageError" class="error ${state.error ? "" : "hidden"}">${state.error || ""}</p>
    `;
    ft.innerHTML = `
      <button class="btn ghost" data-action type="button" id="btnBack1">上一步</button>
      <button class="btn" data-action type="button" id="btnLoadDetail">拉取详情</button>
      <button class="btn primary" data-action type="button" id="btnNext1" ${
        state.perform ? "" : "disabled"
      }>下一步：选座</button>
    `;
    const box = $("#projectBox");
    if (state.project) {
      box.innerHTML = `
        <h3 style="margin:0 0 6px">${state.project.title}</h3>
        <p class="hint" style="margin-top:0">${state.project.venue} · ${state.project.notice}</p>
        <div class="price-row">
          ${state.project.prices
            .map(
              (p) =>
                `<span class="price-chip"><i style="background:${p.color}"></i>${p.name} ${p.priceText}</span>`,
            )
            .join("")}
        </div>
        <div class="cards" id="performCards">
          ${state.project.performs
            .map((p) => {
              const sel = state.perform?.performId === p.performId ? "selected" : "";
              return `<div class="card ${sel}" data-pid="${p.performId}">
                <h3>${p.name}</h3>
                <p>performId / performanceId = ${p.performId}</p>
              </div>`;
            })
            .join("")}
        </div>
      `;
      box.querySelectorAll(".card").forEach((el) => {
        el.onclick = () => {
          state.perform = state.project.performs.find((p) => p.performId === el.dataset.pid);
          state.selectedPrice = null;
          state.ticketCount = 1;
          state.calc = null;
          state.prices = [];
          renderPage();
        };
      });
    }
    $("#btnBack1").onclick = () => {
      state.step = 0;
      renderPage();
    };
    $("#btnLoadDetail").onclick = () =>
      run(async () => {
        const res = await api.getDetail($("#itemId").value.trim());
        state.project = res.data;
        state.perform = null;
      });
    $("#btnNext1").onclick = () => {
      if (!state.perform) return;
      state.step = 2;
      renderPage();
      run(async () => {
        const bundle = await api.getPriceTiers({
          projectId: state.project.projectId,
          itemId: state.project.itemId,
          performanceId: state.perform.performanceId,
        });
        state.prices = bundle.prices;
        renderPage();
      });
    };
    return;
  }

  if (state.step === 2) {
    hdTitle.textContent = "阶段 2～3：选择票档 / 算价";
    const sp = state.selectedPrice;
    bd.innerHTML = `
      <p class="hint">对齐大麦非选座购票：先选<strong>票档</strong>再设<strong>数量</strong>（非点具体座位）。
      Mock <code>dynamicInfo</code> 取 priceList，再 <code>calcTicketPrice</code>（skuParamListJson）。
      场次：${state.perform?.name || "-"}</p>
      <div class="cards" id="priceCards">
        ${(state.prices.length ? state.prices : state.project?.prices || [])
          .map((p) => {
            const sel = sp?.priceId === p.priceId ? "selected" : "";
            return `<div class="card price-card ${sel}" data-priceid="${p.priceId}">
              <div class="price-card-top">
                <i class="price-dot" style="background:${p.color}"></i>
                <h3>${p.name}</h3>
                <strong>${p.priceText}</strong>
              </div>
              <p>priceId=${p.priceId} · skuId=${p.skuId}${
                p.remain != null ? ` · 余票 ${p.remain}` : ""
              }</p>
            </div>`;
          })
          .join("")}
      </div>
      <div class="qty-row">
        <span>购买数量</span>
        <button type="button" class="btn qty-btn" data-action id="btnQtyMinus">−</button>
        <strong id="qtyVal">${state.ticketCount}</strong>
        <button type="button" class="btn qty-btn" data-action id="btnQtyPlus">+</button>
        <span class="qty-hint">限购 4 张</span>
      </div>
      <p class="selected-seats">
        ${
          sp
            ? `已选：${sp.name} × ${state.ticketCount}`
            : "请选择票档"
        }
        ${state.calc ? ` · 应付 <strong>${state.calc.model.realTotalAmtText}</strong>` : ""}
      </p>
      <p id="pageError" class="error ${state.error ? "" : "hidden"}">${state.error || ""}</p>
    `;
    $("#priceCards")?.querySelectorAll(".card").forEach((el) => {
      el.onclick = () => {
        const list = state.prices.length ? state.prices : state.project.prices;
        state.selectedPrice = list.find((p) => p.priceId === el.dataset.priceid);
        state.calc = null;
        renderPage();
      };
    });
    ft.innerHTML = `
      <button class="btn ghost" data-action type="button" id="btnBack2">上一步</button>
      <button class="btn" data-action type="button" id="btnCalc" ${
        sp ? "" : "disabled"
      }>算价</button>
      <button class="btn primary" data-action type="button" id="btnNext2" ${
        state.calc ? "" : "disabled"
      }>下一步：确认订单</button>
    `;
    $("#btnQtyMinus").onclick = () => {
      if (state.ticketCount <= 1) return;
      state.ticketCount -= 1;
      state.calc = null;
      renderPage();
    };
    $("#btnQtyPlus").onclick = () => {
      if (state.ticketCount >= 4) return;
      state.ticketCount += 1;
      state.calc = null;
      renderPage();
    };
    $("#btnBack2").onclick = () => {
      state.step = 1;
      renderPage();
    };
    $("#btnCalc").onclick = () =>
      run(async () => {
        const calcRes = await api.calcTicketPrice({
          itemId: state.project.itemId,
          performId: state.perform.performId,
          priceId: state.selectedPrice.priceId,
          price: state.selectedPrice.price,
          count: state.ticketCount,
        });
        state.calc = calcRes.data;
      });
    $("#btnNext2").onclick = () => {
      state.step = 3;
      state.customers = [];
      state.selectedCustomer = null;
      renderPage();
      run(async () => {
        const res = await api.getCustomerList();
        state.customers = res.data.result || [];
        state.selectedCustomer = state.customers[0] || null;
        renderPage();
      });
    };
    return;
  }

  if (state.step === 3) {
    hdTitle.textContent = "阶段 4：确认订单 / 观演人";
    const sku = state.selectedPrice;
    const sc = state.selectedCustomer;
    bd.innerHTML = `
      <p class="hint">观演人来自 <code>mtop.damai.wireless.user.customerlist.get</code>（v2.0，PurchaserListRequest，需登录）。
      再 <code>trade.order.build</code> / <code>adjust</code>。</p>
      <div class="cards" id="customerCards">
        ${
          state.customers.length
            ? state.customers
                .map((c) => {
                  const sel = sc?.contactsId === c.contactsId ? "selected" : "";
                  return `<div class="card ${sel}" data-cid="${c.contactsId}">
                    <h3>${c.name} <span style="font-weight:400;color:var(--muted);font-size:12px">${c.identityTypeName || ""}</span></h3>
                    <p>${c.maskedIdentityNo || "-"} · contactsId=${c.contactsId}${
                      c.isUserVerified ? " · 已实名" : ""
                    }</p>
                  </div>`;
                })
                .join("")
            : `<p class="hint">正在拉取观演人列表…</p>`
        }
      </div>
      <div class="kv" style="margin-top:14px">
        <div><dt>票档</dt><dd>${sku?.name || "-"} × ${state.ticketCount}</dd></div>
        <div><dt>金额</dt><dd>${state.calc?.model?.realTotalAmtText || "-"}</dd></div>
        <div><dt>观演人</dt><dd>${sc ? `${sc.name}（${sc.maskedIdentityNo}）` : "-"}</dd></div>
        <div><dt>buyParam</dt><dd>${
          sku
            ? `${state.project.itemId}_${state.ticketCount}_${sku.skuId}`
            : "-"
        }</dd></div>
        <div><dt>ultronParams</dt><dd>${state.build?.ultronParams || "尚未 build"}</dd></div>
      </div>
      <p id="pageError" class="error ${state.error ? "" : "hidden"}">${state.error || ""}</p>
    `;
    $("#customerCards")?.querySelectorAll(".card").forEach((el) => {
      el.onclick = () => {
        state.selectedCustomer = state.customers.find(
          (c) => String(c.contactsId) === el.dataset.cid,
        );
        state.build = null;
        renderPage();
      };
    });
    ft.innerHTML = `
      <button class="btn ghost" data-action type="button" id="btnBack3">上一步</button>
      <button class="btn" data-action type="button" id="btnReloadCust">刷新观演人</button>
      <button class="btn" data-action type="button" id="btnBuild" ${
        sc ? "" : "disabled"
      }>构建订单</button>
      <button class="btn" data-action type="button" id="btnAdjust" ${
        state.build && sc ? "" : "disabled"
      }>确认观演人</button>
      <button class="btn primary" data-action type="button" id="btnNext3" ${
        state.build ? "" : "disabled"
      }>下一步：创建并支付</button>
    `;
    $("#btnBack3").onclick = () => {
      state.step = 2;
      renderPage();
    };
    $("#btnReloadCust").onclick = () =>
      run(async () => {
        const res = await api.getCustomerList();
        state.customers = res.data.result || [];
        state.selectedCustomer = state.customers[0] || null;
        state.build = null;
      });
    $("#btnBuild").onclick = () =>
      run(async () => {
        const res = await api.orderBuild({
          itemId: state.project.itemId,
          count: state.ticketCount,
          skuId: state.selectedPrice.skuId,
        });
        state.build = res.data;
      });
    $("#btnAdjust").onclick = () =>
      run(async () => {
        const res = await api.orderAdjust({
          params: state.build.ultronParams,
          contactsId: state.selectedCustomer.contactsId,
          viewerName: state.selectedCustomer.name,
        });
        state.build = { ...state.build, ...res.data };
      });
    $("#btnNext3").onclick = () => {
      state.step = 4;
      renderPage();
    };
    return;
  }

  // step 4
  hdTitle.textContent = "阶段 5：创建订单 / 支付";
  bd.innerHTML = `
    <p class="hint"><code>trade.order.create</code> → <code>getpayparam</code> →
    （Mock 跳过真实支付宝）→ <code>paymentCompletion</code>。</p>
    ${
      state.orderId
        ? `<div class="success-box">
            <h3>${state.pay?.paid ? "Mock 支付完成" : "订单已创建（待支付）"}</h3>
            <div class="kv">
              <div><dt>orderId</dt><dd>${state.orderId}</dd></div>
              <div><dt>支付串</dt><dd>${state.pay?.payString || state.pay?.message || "-"}</dd></div>
            </div>
          </div>`
        : `<p class="hint">点击下方按钮按序创建订单并完成 Mock 支付。</p>`
    }
    <p id="pageError" class="error ${state.error ? "" : "hidden"}">${state.error || ""}</p>
  `;
  ft.innerHTML = `
    <button class="btn ghost" data-action type="button" id="btnBack4">上一步</button>
    <button class="btn primary" data-action type="button" id="btnPay">
      ${state.pay?.paid ? "再走一遍支付链" : "创建订单并 Mock 支付"}
    </button>
    <button class="btn" data-action type="button" id="btnRestart">从头开始</button>
  `;
  $("#btnBack4").onclick = () => {
    state.step = 3;
    renderPage();
  };
  $("#btnPay").onclick = () =>
    run(async () => {
      const created = await api.orderCreate({ params: state.build.ultronParams });
      state.orderId = created.data.orderId;
      const payParam = await api.getPayParam({ orderId: state.orderId });
      const done = await api.paymentCompletion({ orderId: state.orderId });
      state.pay = { ...payParam.data, ...done.data };
    });
  $("#btnRestart").onclick = () =>
    run(async () => {
      api.logout();
      Object.assign(state, {
        step: 0,
        project: null,
        perform: null,
        prices: [],
        selectedPrice: null,
        ticketCount: 1,
        customers: [],
        selectedCustomer: null,
        calc: null,
        build: null,
        orderId: null,
        pay: null,
        error: "",
      });
      $("#apiLog").textContent = "等待操作…每行一条接口结果。";
      $("#apiLog").classList.add("log-empty");
    });
}

$("#btnClearLog").onclick = () => {
  $("#apiLog").textContent = "日志已清空。";
  $("#apiLog").classList.add("log-empty");
};

bindPrefixInput();
renderSession();
renderPage();
