/** 本地假数据，对照选座下单流程接口文案，不请求线上 */

export const MOCK_PROJECT = {
  itemId: "720000000000",
  projectId: "720000000000",
  title: "【Mock】城市巡回演唱会",
  venue: "演示体育馆",
  cityId: "110100",
  notice: "本客户端为流程演示，所有数据均为本地 Mock，不会产生真实订单。",
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

export function delay(ms = 320) {
  return new Promise((r) => setTimeout(r, ms));
}

export function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
