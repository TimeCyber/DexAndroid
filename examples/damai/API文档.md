# 大麦 (cn.damai) 接口文档

> 基于 Frida 内存 dump 静态字符串提取  
> 样本包名：`cn.damai`（大麦 9.0.35）  
> 加固：阿里聚安全  
> dump 目录：`unpack-output/106/frida/`（97 个 dex，约 233MB）  
> 业务类数量：约 5961（`cn.damai.*`）

## 1. 协议说明

大麦 App 主通道为 **阿里 MTOP**：

- 典型请求字段：`api`（接口名）、`v`（版本）、`data`（业务 JSON）、登录态 `sid/cookie`
- 网关 Host 常随环境切换（正式 / 预发 wapa / 测试 waptest）
- H5 / 营销页大量走 `m.damai.cn`、`gw.alicdn.com`、淘宝/支付宝域

调用形态（示意）：

```text
POST https://<mtop-host>/gw/<api>/<v>/
Content-Type: application/x-www-form-urlencoded
api=<mtop.xxx>&v=1.0&data={...}&...
```

## 2. 主要域名

| Host | 出现次数(字符串) | 用途（推断） |
| --- | ---: | --- |
| `gw.alicdn.com` | 166 | CDN / 静态资源 |
| `img.alicdn.com` | 82 | CDN / 静态资源 |
| `m.damai.cn` | 66 | 大麦 H5 主站 |
| `g.alicdn.com` | 23 | CDN / 静态资源 |
| `market.wapa.damai.cn` | 20 | 大麦预发营销 |
| `restsdk.amap.com` | 20 | 高德地图 |
| `androiddownload.damai.cn` | 10 | 客户端下载 |
| `mdn.alipayobjects.com` | 10 | 支付宝 |
| `h5.m.taobao.com` | 8 | 淘宝系 |
| `mclient.alipay.com` | 8 | 支付宝 |
| `t.damai.cn` | 8 |  |
| `m.wapa.taopiaopiao.com` | 7 | 淘票票 |
| `market.wapa.taobao.com` | 7 | 淘宝系 |
| `render.alipay.com` | 6 | 支付宝 |
| `login.m.taobao.com` | 5 | 登录/账号安全 |
| `account.youku.com` | 5 | 优酷账号/连通 |
| `market.m.taobao.com` | 4 | 淘宝系 |
| `shop.m.taobao.com` | 4 | 淘宝系 |
| `wb.amap.com` | 4 | 高德地图 |
| `detail.damai.cn` | 4 | 项目详情 H5 |
| `h5.m.taopiaopiao.com` | 4 | 淘票票 |
| `ihelp.taobao.com` | 4 | 淘宝系 |
| `m.taopiaopiao.com` | 4 | 淘票票 |
| `p.damai.cn` | 4 |  |
| `passport.damai.cn` | 4 | 登录/账号安全 |
| `terms.alicdn.com` | 4 | CDN / 静态资源 |
| `m.taobao.com` | 3 | 淘宝系 |
| `m5.amap.com` | 3 | 高德地图 |
| `pre-wormhole.tmall.com` | 3 | 淘宝系 |
| `tmq-service.taobao.org` | 3 | 淘宝系 |
| `wappaygw.alipay.com` | 3 | 支付宝 |
| `connectivity.youku.com` | 3 | 优酷账号/连通 |
| `market.waptest.taobao.com` | 3 | 淘宝系 |
| `msecurity.damai.cn` | 3 | 登录/账号安全 |
| `oss.taopiaopiao.com` | 3 | 淘票票 |

## 3. 业务模块（代码包）

| 包前缀 | 类数量 | 说明 |
| --- | ---: | --- |
| `cn.damai.commonbusiness` | 822 | 通用业务组件 |
| `cn.damai.homepage` | 819 | 首页 |
| `cn.damai.tetris` | 675 | 动态楼层/组件框架 |
| `cn.damai.trade` | 668 | 交易下单 |
| `cn.damai.pioneer` | 295 | 新版/先锋频道 |
| `cn.damai.mine` | 273 | 我的 |
| `cn.damai.uikit` | 265 | UI 组件 |
| `cn.damai.ticklet` | 235 | 票夹 |
| `cn.damai.user` | 194 | 用户 |
| `cn.damai.common` | 138 | 基础公共 |
| `cn.damai.discover` | 136 | 发现/社区 |
| `cn.damai.category` | 123 | 类目/抢票等 |
| `cn.damai.ultron` | 122 | 奥创交易 |
| `cn.damai.comment` | 104 | 评价 |
| `cn.damai.launcher` | 103 | 启动 |
| `cn.damai.seat` | 101 | 选座 |
| `cn.damai.h5container` | 86 | H5 容器 |
| `cn.damai.search` | 84 | 搜索 |
| `cn.damai.issue` | 81 |  |
| `cn.damai.projectfiltercopy` | 65 |  |
| `cn.damai.projectfilter` | 47 |  |
| `cn.damai.baseview` | 46 |  |
| `cn.damai.onearch` | 36 |  |
| `cn.damai.player` | 35 |  |
| `cn.damai.message` | 34 |  |
| `cn.damai.login` | 27 | 登录 |
| `cn.damai.feedmini` | 27 |  |
| `cn.damai.fluttercommon` | 22 |  |
| `cn.damai.evaluate` | 22 |  |
| `cn.damai.setting` | 22 |  |

## 4. MTOP 接口总览

| 前缀 | 数量 |
| --- | ---: |
| `mtop.damai.*` | 276 |
| `mtop.film.*` | 171 |
| 其他（淘宝/账号/支付等） | 178 |
| **合计** | **625** |

## 5. mtop.damai.*（大麦主业务）

### 5.1 商品/项目详情

| API |
| --- |
| `mtop.damai.item.calcTicketPrice` |
| `mtop.damai.item.detail.getdetail` |
| `mtop.damai.item.detail.getdetail.1.0` |
| `mtop.damai.item.detail.scriptkill.getdetail` |
| `mtop.damai.item.notice.query` |
| `mtop.damai.item.oldproject.getitemid` |
| `mtop.damai.item.projectdetail.projectid.get` |
| `mtop.damai.item.tips.information` |
| `mtop.damai.search.tips.get` |
| `mtop.damai.travel.ticket.detail.getdetail` |
| `mtop.damai.wireless.guide.base.project.get` |
| `mtop.damai.wireless.project.getB2B2CAreaInfo` |
| `mtop.damai.wireless.project.getpreareainfo` |
| `mtop.damai.wireless.search.favourable.projectlist.get` |
| `mtop.damai.wireless.search.project.classfy.statistics` |
| `mtop.damai.wireless.search.project.classify` |
| `mtop.damai.wireless.search.projectlist.byrecommend.get` |
| `mtop.damai.wireless.ticklet2.extension.notice.query` |
| `mtop.damai.wireless.venue.item.list` |

### 5.2 交易下单

| API |
| --- |
| `mtop.damai.spliceorder.create` |
| `mtop.damai.trade.order.adjust` |
| `mtop.damai.trade.order.build` |
| `mtop.damai.trade.order.create` |
| `mtop.damai.wireless.order.cancelorder` |
| `mtop.damai.wireless.order.canresell` |
| `mtop.damai.wireless.order.confirmOrderExtAsync` |
| `mtop.damai.wireless.order.deliveryFee.change` |
| `mtop.damai.wireless.order.getpayparam` |
| `mtop.damai.wireless.order.invoice.submit` |
| `mtop.damai.wireless.order.invoice.submitpre` |
| `mtop.damai.wireless.order.invoice.view` |
| `mtop.damai.wireless.order.orderAfterChooseSeat` |
| `mtop.damai.wireless.order.orderDeliveryAddress.update` |
| `mtop.damai.wireless.order.orderdetail` |
| `mtop.damai.wireless.order.orderinfo` |
| `mtop.damai.wireless.order.orderlist.get` |
| `mtop.damai.wireless.order.orderpayparam` |
| `mtop.damai.wireless.order.orderprogress` |
| `mtop.damai.wireless.order.paydone.combo.get` |
| `mtop.damai.wireless.order.paymentCompletion` |
| `mtop.damai.wireless.order.paymentCompletion4Secondary` |
| `mtop.damai.wireless.order.paymentcompletion` |
| `mtop.damai.wireless.order.paymentwaylist` |
| `mtop.damai.wireless.order.querySelfMachineAddress` |
| `mtop.damai.wireless.order.querylogisticsdetail` |
| `mtop.damai.wireless.order.redpacket` |
| `mtop.damai.wireless.order.refund.check` |
| `mtop.damai.wireless.order.remindchooseseat` |
| `mtop.damai.wireless.order.reminddelivery` |
| `mtop.damai.wireless.order.secondaryorderlist` |
| `mtop.damai.wireless.order.zlorderrefundprogress` |
| `mtop.damai.wireless.resource.order.get` |
| `mtop.damai.wireless.secondaryorder.orderdetail` |
| `mtop.damai.wireless.trade.common.order.confirm` |
| `mtop.damai.wireless.trade.common.order.create` |
| `mtop.damai.wireless.waiting.order.refund.create` |

### 5.3 票夹/票务

| API |
| --- |
| `mtop.damai.wireless.search.performance.calendar.get` |
| `mtop.damai.wireless.seat.queryperformseatstatus` |
| `mtop.damai.wireless.ticklet.comment.get` |
| `mtop.damai.wireless.ticklet.face.binding` |
| `mtop.damai.wireless.ticklet.face.unbinding` |
| `mtop.damai.wireless.ticklet.performs.preload` |
| `mtop.damai.wireless.ticklet2.extension.exchangesite.list` |
| `mtop.damai.wireless.ticklet2.extension.list2` |
| `mtop.damai.wireless.ticklet2.nft.prepareIssue` |
| `mtop.damai.wireless.ticklet2.perform.detail.get` |
| `mtop.damai.wireless.ticklet2.perform.detail.qrcode` |
| `mtop.damai.wireless.ticklet2.perform.my.detail.get` |
| `mtop.damai.wireless.ticklet2.performs.first` |
| `mtop.damai.wireless.ticklet2.performs.get` |
| `mtop.damai.wireless.ticklet2.performs.history.get` |
| `mtop.damai.wireless.ticklet2.performs.my.get` |
| `mtop.damai.wireless.ticklet2.performs.preload` |
| `mtop.damai.wireless.ticklet2.souvenir.detail.get` |
| `mtop.damai.wireless.ticklet2.transfer.accept` |
| `mtop.damai.wireless.ticklet2.transfer.accept.query` |
| `mtop.damai.wireless.ticklet2.transfer.cancel` |
| `mtop.damai.wireless.ticklet2.transfer.grant` |
| `mtop.damai.wireless.ticklet2.transfer.query` |

### 5.4 选座

| API |
| --- |
| `mtop.damai.maitix.division.getdisivionchildrenspecial` |
| `mtop.damai.wireless.seat.chooseSeatParam` |
| `mtop.damai.wireless.seat.dynamicInfo` |
| `mtop.damai.wireless.seat.precheck` |
| `mtop.damai.wireless.seat.querypricecolor` |

### 5.5 搜索

| API |
| --- |
| `mtop.damai.search.pioneer.page.get` |
| `mtop.damai.wireless.search.account.head` |
| `mtop.damai.wireless.search.artist.list` |
| `mtop.damai.wireless.search.artist.search` |
| `mtop.damai.wireless.search.artistpage.search` |
| `mtop.damai.wireless.search.baccount.search` |
| `mtop.damai.wireless.search.brand.detail` |
| `mtop.damai.wireless.search.brand.nearshow` |
| `mtop.damai.wireless.search.brand.search` |
| `mtop.damai.wireless.search.broadcast.list` |
| `mtop.damai.wireless.search.byrecommend.get` |
| `mtop.damai.wireless.search.cms.category.get` |
| `mtop.damai.wireless.search.detailedlist.get` |
| `mtop.damai.wireless.search.merge.category.get` |
| `mtop.damai.wireless.search.rangkinglist.get` |
| `mtop.damai.wireless.search.search` |
| `mtop.damai.wireless.search.searchegg.get` |
| `mtop.damai.wireless.search.venue.search` |
| `mtop.damai.wireless.search.video.search` |
| `mtop.damai.wireless.ysearch.suggest` |

### 5.6 首页/运营位

| API |
| --- |
| `mtop.damai.artiste.home.pic` |
| `mtop.damai.mec.aristotle.get` |
| `mtop.damai.mec.aristotle.get_app_home_` |
| `mtop.damai.mec.aristotle.get_app_home_pioneer_4.1` |
| `mtop.damai.mec.aristotle.get_app_home_pioneer_discover_1.3` |
| `mtop.damai.mec.aristotle.get_app_pioneer_cinema_venue_1.1` |
| `mtop.damai.mec.popup.get` |
| `mtop.damai.mec.popup.report` |
| `mtop.damai.wireless.discovery.home.wanna.get` |
| `mtop.damai.wireless.discovery.home.wanna.getRecommendInfo` |
| `mtop.damai.wireless.home.appglobalconfig` |
| `mtop.damai.wireless.home.float` |
| `mtop.damai.wireless.home.float.report` |
| `mtop.damai.wireless.home.globalconfig` |
| `mtop.damai.wireless.home.guess.get` |
| `mtop.damai.wireless.home.homePage.get` |
| `mtop.damai.wireless.home.myadvert` |
| `mtop.damai.wireless.home.pioneerGlobalconfig` |
| `mtop.damai.wireless.home.recommend.feed.click` |
| `mtop.damai.wireless.home.recommend.feed.get` |
| `mtop.damai.wireless.home.welcome` |

### 5.7 用户/消息

| API |
| --- |
| `mtop.damai.mc.push.token.logout` |
| `mtop.damai.mc.push.token.uploadnew` |
| `mtop.damai.msgbox.user.message.clear` |
| `mtop.damai.msgbox.user.message.del` |
| `mtop.damai.msgbox.user.message.group` |
| `mtop.damai.msgbox.user.message.group.get` |
| `mtop.damai.msgbox.user.message.group.list` |
| `mtop.damai.msgbox.user.message.read` |
| `mtop.damai.mxm.user.accesstoken.get` |
| `mtop.damai.mxm.user.token.get` |
| `mtop.damai.wireless.user.canVerifyCustomers.list` |
| `mtop.damai.wireless.user.certification.queryAlipayCertification` |
| `mtop.damai.wireless.user.certification.queryStatus` |
| `mtop.damai.wireless.user.certification.querystatus` |
| `mtop.damai.wireless.user.certification.rebindForAlipay` |
| `mtop.damai.wireless.user.certification.schedule.query` |
| `mtop.damai.wireless.user.certification.student.authenticate` |
| `mtop.damai.wireless.user.certification.student.sign` |
| `mtop.damai.wireless.user.certification.submit` |
| `mtop.damai.wireless.user.custom.account.sync` |
| `mtop.damai.wireless.user.customer.add` |
| `mtop.damai.wireless.user.customer.addcheck` |
| `mtop.damai.wireless.user.customer.remove` |
| `mtop.damai.wireless.user.customer.typelist` |
| `mtop.damai.wireless.user.customer.update` |
| `mtop.damai.wireless.user.customerlist.get` |
| `mtop.damai.wireless.user.feedback.add` |
| `mtop.damai.wireless.user.feedback.bizIdentifiers` |
| `mtop.damai.wireless.user.feedback.replayDetail` |
| `mtop.damai.wireless.user.feedback.replayList` |
| `mtop.damai.wireless.user.getUserProfile` |
| `mtop.damai.wireless.user.identify.queryIdentifyInfo` |
| `mtop.damai.wireless.user.identity.info.query` |
| `mtop.damai.wireless.user.identity.verify.start` |
| `mtop.damai.wireless.user.my.content.get` |
| `mtop.damai.wireless.user.nextStep.wait` |
| `mtop.damai.wireless.user.permission.get` |
| `mtop.damai.wireless.user.permission.getlist` |
| `mtop.damai.wireless.user.permission.setlist` |
| `mtop.damai.wireless.user.permission.setup` |
| `mtop.damai.wireless.user.phone.allowable.query` |
| `mtop.damai.wireless.user.saveUserProfile` |
| `mtop.damai.wireless.user.shippingaddress.add` |
| `mtop.damai.wireless.user.shippingaddress.del` |
| `mtop.damai.wireless.user.shippingaddress.getUserAddressList` |
| `mtop.damai.wireless.user.shippingaddress.modify` |
| `mtop.damai.wireless.user.shippingaddress.setDefaultAddress` |
| `mtop.damai.wireless.user.sms.config.get` |
| `mtop.damai.wireless.user.sms.config.update` |
| `mtop.damai.wireless.user.switchPioneerVersion` |
| `mtop.damai.wireless.user.uploadHeadImg` |
| `mtop.damai.wireless.user.verify.start` |

### 5.8 营销/优惠券

| API |
| --- |
| `mtop.damai.wireless.activity.vote` |
| `mtop.damai.wireless.guide.brand.coupon.gain` |
| `mtop.damai.wireless.mkt.coupon.applyCoupon4User` |
| `mtop.damai.wireless.mkt.coupon.cancelCoupon` |
| `mtop.damai.wireless.mkt.coupon.queryCouponActsOfItem` |
| `mtop.damai.wireless.mkt.coupon.queryCouponsOfUser` |
| `mtop.damai.wireless.mkt.privilege.verifyandsigncode` |
| `mtop.damai.wireless.mkt.promotion.calcOrderPromotion` |
| `mtop.damai.wireless.play.imkt.task.data.report` |
| `mtop.damai.wireless.playplatform.activity.share.detail` |

### 5.9 评价/社区

| API |
| --- |
| `mtop.damai.comment.list.oper` |
| `mtop.damai.wireless.comment.ai.praise` |
| `mtop.damai.wireless.comment.ai.query` |
| `mtop.damai.wireless.comment.baccount.search` |
| `mtop.damai.wireless.comment.batch.praise` |
| `mtop.damai.wireless.comment.content.report` |
| `mtop.damai.wireless.comment.delete` |
| `mtop.damai.wireless.comment.head.get` |
| `mtop.damai.wireless.comment.list.get` |
| `mtop.damai.wireless.comment.list.recommend` |
| `mtop.damai.wireless.comment.modify` |
| `mtop.damai.wireless.comment.module.get` |
| `mtop.damai.wireless.comment.praise` |
| `mtop.damai.wireless.comment.publish` |
| `mtop.damai.wireless.comment.publisher.render` |
| `mtop.damai.wireless.comment.query.theme` |
| `mtop.damai.wireless.comment.render` |
| `mtop.damai.wireless.comment.success.render` |
| `mtop.damai.wireless.content.comment.get` |
| `mtop.damai.wireless.content.my.list` |
| `mtop.damai.wireless.content.parse` |
| `mtop.damai.wireless.content.wantsee.praise.list` |
| `mtop.damai.wireless.discovery.detail.get` |
| `mtop.damai.wireless.discovery.detail.task` |
| `mtop.damai.wireless.discovery.detail.wanna.getrecommendinfo` |
| `mtop.damai.wireless.discovery.focus` |
| `mtop.damai.wireless.discovery.publish.check` |
| `mtop.damai.wireless.discovery.theme.get` |
| `mtop.damai.wireless.locallife.comment.module.get` |
| `mtop.damai.wireless.locallife.comment.praise` |

### 5.10 AI/其他

| API |
| --- |
| `mtop.damai.wireless.ai.getNlsToken` |
| `mtop.damai.wireless.ai.pageConfig` |
| `mtop.damai.wireless.ai.stream.response` |
| `mtop.damai.wireless.channel.artiste` |

### 5.11 未分组

| API |
| --- |
| `mtop.damai.cn` |
| `mtop.damai.wireless.area.groupcity` |
| `mtop.damai.wireless.badge.mark` |
| `mtop.damai.wireless.badge.query` |
| `mtop.damai.wireless.channel.page.prize.draw` |
| `mtop.damai.wireless.channel.page.tasks.get` |
| `mtop.damai.wireless.community.article.delete` |
| `mtop.damai.wireless.community.repertoire.query` |
| `mtop.damai.wireless.community.share.tofans` |
| `mtop.damai.wireless.configure.paysuccess.get` |
| `mtop.damai.wireless.device.score.get` |
| `mtop.damai.wireless.follow.booking.list` |
| `mtop.damai.wireless.follow.circlelist.query` |
| `mtop.damai.wireless.follow.feed.query` |
| `mtop.damai.wireless.follow.mycircle.query` |
| `mtop.damai.wireless.follow.relation.book.cancel` |
| `mtop.damai.wireless.follow.relation.fans.list` |
| `mtop.damai.wireless.follow.relation.follow.list` |
| `mtop.damai.wireless.follow.relation.target.get` |
| `mtop.damai.wireless.follow.relation.update` |
| `mtop.damai.wireless.follow.relation.update.batch` |
| `mtop.damai.wireless.follow.relation.update.v2` |
| `mtop.damai.wireless.gaia.template.query` |
| `mtop.damai.wireless.invoice.applyInvoice` |
| `mtop.damai.wireless.invoice.queryInvoiceInfo` |
| `mtop.damai.wireless.invoice.submitInvoiceApplication` |
| `mtop.damai.wireless.ip.remind.pop.report` |
| `mtop.damai.wireless.live.detail.get` |
| `mtop.damai.wireless.live.view.update` |
| `mtop.damai.wireless.map.scenicspot.nearby` |
| `mtop.damai.wireless.map.scenicspot.rendering` |
| `mtop.damai.wireless.my.cancelOrder` |
| `mtop.damai.wireless.my.getPayParm` |
| `mtop.damai.wireless.my.getPersonalInfo` |
| `mtop.damai.wireless.my.myrights.query` |
| `mtop.damai.wireless.mypage.feed` |
| `mtop.damai.wireless.open.api.authorize` |
| `mtop.damai.wireless.pay.success.recommend.get` |
| `mtop.damai.wireless.pf.mustsee.get` |
| `mtop.damai.wireless.pioneer.mini.get` |
| `mtop.damai.wireless.score.consumlist` |
| `mtop.damai.wireless.score.getlist` |
| `mtop.damai.wireless.score.info` |
| `mtop.damai.wireless.secondaryorde.orderdetail` |
| `mtop.damai.wireless.theme.follow.relation.update` |
| `mtop.damai.wireless.third.account.session.get` |
| `mtop.damai.wireless.tpp.follow.relation.update` |
| `mtop.damai.wireless.tpp.follow.relation.update.batch` |
| `mtop.damai.wireless.venue.info` |
| `mtop.damai.wireless.venue.ip.list` |
| `mtop.damai.wireless.venue.photo.official` |
| `mtop.damai.wireless.venue.photo.user` |
| `mtop.damai.wireless.vip.brand.rights.gain` |
| `mtop.damai.wireless.vip.cardInfo.get` |
| `mtop.damai.wireless.weixin.qrcode.get` |

## 6. mtop.film.*（淘票票/电影相关）

### 6.1 影院/排期

| API |
| --- |
| `mtop.film.MtopCinemaAPI.getCinema` |
| `mtop.film.MtopCinemaAPI.getCinemaById` |
| `mtop.film.MtopCinemaAPI.getCinemaList` |
| `mtop.film.MtopCinemaAPI.getCinemaListInPage` |
| `mtop.film.MtopCinemaAPI.getCinemasByUserId` |
| `mtop.film.MtopCinemaAPI.getItemCinemas` |
| `mtop.film.MtopCinemaAPI.getRecommendCinemaSchedule` |
| `mtop.film.MtopMarketingAPI.queryToolsForLockSeat` |
| `mtop.film.MtopSaleAPI.getCinemaSale` |
| `mtop.film.MtopScheduleAPI.getCinemaPageHappyCoinExchange` |
| `mtop.film.MtopScheduleAPI.getCinemaSales` |
| `mtop.film.MtopScheduleAPI.getNewCinemaSchedules` |
| `mtop.film.MtopSearchAPI.searchCinemas` |
| `mtop.film.MtopSeatAPI.asyLockSeat` |
| `mtop.film.MtopSeatAPI.getOrderingSeatsCheck` |
| `mtop.film.MtopSeatAPI.getScheduleSeat` |
| `mtop.film.MtopSeatAPI.getSeatsByScheduleId` |
| `mtop.film.MtopSeatAPI.getSoldSeatIdsByScheduleId` |
| `mtop.film.MtopSeatAPI.getSoldSeatMapByScheduleId` |
| `mtop.film.MtopSeatAPI.orderSeatsWithMarketing` |
| `mtop.film.MtopSeatAPI.previewScheduleSeat` |
| `mtop.film.MtopSeatAPI.unlockAllSeats` |
| `mtop.film.MtopShowAPI.getSeatTheme` |
| `mtop.film.MtopUserAPI.addUserCinema` |
| `mtop.film.MtopUserAPI.removeUserCinema` |

### 6.2 影片/演出

| API |
| --- |
| `mtop.film.MtopArtShowAPI.getArtShowCalendar` |
| `mtop.film.MtopArtisteAPI.getArtisteImageById` |
| `mtop.film.MtopCommentAPI.queryUserCommentByShow` |
| `mtop.film.MtopFilmFestivalAPI.getShowFestivalList` |
| `mtop.film.MtopGuessYouWantAPI.getShowGuessPage` |
| `mtop.film.MtopGuessYouWantAPI.getShowPreferencePage` |
| `mtop.film.MtopMCardAPI.updateMcardShowExpire` |
| `mtop.film.MtopShowAPI.getShowTrailers` |
| `mtop.film.MtopShowAPI.getShowsByCityCode` |
| `mtop.film.MtopShowAPI.getWantShows` |
| `mtop.film.MtopShowAPI.selectShowBySearch` |
| `mtop.film.mtopshowapi.deleteWantShow` |

### 6.3 下单/支付

| API |
| --- |
| `mtop.film.MtopAdvertiseAPI.queryAdvertise4TradeSuccess` |
| `mtop.film.MtopCashierConsultAPI.postCashierConsult` |
| `mtop.film.MtopCashierConsultAPI.postStandardPay` |
| `mtop.film.MtopCashierConsultAPI.selectPayOption` |
| `mtop.film.MtopCycleDiscountAPI.getCouponNotify` |
| `mtop.film.MtopFCodeAPI.bindFCode4Detail` |
| `mtop.film.MtopFCodeAPI.unbindFcode` |
| `mtop.film.MtopGuideAPI.successOrderRecommend` |
| `mtop.film.MtopMCardAPI.createMCardOrder` |
| `mtop.film.MtopMCardAPI.getOrderMCardInfo` |
| `mtop.film.MtopOrderAPI.closeUnpayOrder` |
| `mtop.film.MtopOrderAPI.customerRefundOrderWithUserRight` |
| `mtop.film.MtopOrderAPI.delHistoryOrder` |
| `mtop.film.MtopOrderAPI.deleteHistoryTicket` |
| `mtop.film.MtopOrderAPI.getBizOrders` |
| `mtop.film.MtopOrderAPI.getBizTickets` |
| `mtop.film.MtopOrderAPI.getOrderByExtId` |
| `mtop.film.MtopOrderAPI.getSaleOrderDetail` |
| `mtop.film.MtopOrderAPI.getTicketDetail` |
| `mtop.film.MtopOrderAPI.getTicketStandardQrCodeInfo` |
| `mtop.film.MtopOrderAPI.ordering` |
| `mtop.film.MtopOrderAPI.salerefundindex` |
| `mtop.film.MtopSaleAPI.closeUnpaySaleOrder` |
| `mtop.film.MtopSaleAPI.createSaleOrder` |
| `mtop.film.MtopSaleAPI.salePaymentSolution` |
| `mtop.film.MtopSpliceOrderAPI.getFinishUsers` |
| `mtop.film.MtopSpliceOrderAPI.listSpliceOrder` |
| `mtop.film.MtopUserAssetsAPI.queryOrderAsset` |
| `mtop.film.mtopfcodeapi.getExtCouponDetail` |
| `mtop.film.mtopfcodeapi.getExtCoupons` |

### 6.4 社区/评论

| API |
| --- |
| `mtop.film.MtopCommentAPI.changeFavorStatus` |
| `mtop.film.MtopCommunityAPI.addDiscussion` |
| `mtop.film.MtopCommunityAPI.communityHomepage` |
| `mtop.film.MtopCommunityAPI.deleteDiscussion` |
| `mtop.film.MtopCommunityAPI.filmHallIndex` |
| `mtop.film.MtopCommunityAPI.getBattleDetail` |
| `mtop.film.MtopCommunityAPI.getCommunitySquare` |
| `mtop.film.MtopCommunityAPI.queryDiscussionDetail` |
| `mtop.film.MtopCommunityAPI.queryDiscussionSubjectList` |
| `mtop.film.MtopCommunityAPI.queryTabDiscussionList` |
| `mtop.film.MtopCommunityAPI.reportDiscussion` |
| `mtop.film.MtopCommunityAPI.submitBattle` |
| `mtop.film.MtopCommunityFeedAPI.communityFeedList` |
| `mtop.film.MtopUserFeedbackAPI.addUserFeedback` |
| `mtop.film.mtopnewcommentapi.getCommentList` |
| `mtop.film.mtopnewcommentapi.getCommentReplyList` |

### 6.5 广告/推荐

| API |
| --- |
| `mtop.film.MtopFlashAPI.showFlash` |
| `mtop.film.MtopIndependentAdvertiseAPI.queryAdvertise` |
| `mtop.film.MtopIndependentAdvertiseAPI.queryCmsAdvertise` |
| `mtop.film.MtopIndependentAdvertiseAPI.queryDispatchData` |
| `mtop.film.MtopItemAdvertiseAPI.queryAdvertise` |
| `mtop.film.MtopMemberAPI.getYoukuAdvertise` |
| `mtop.film.MtopRecommendAPI.refreshRecommandMedias` |
| `mtop.film.independentAdvertiseAPI.queryPreloadAdvList` |

### 6.6 其他

| API |
| --- |
| `mtop.film.AbAPI.getMultiScenarioAb` |
| `mtop.film.AbAPI.uploadAb` |
| `mtop.film.MtopContentAPI.collect` |
| `mtop.film.MtopContentAPI.unCollect` |
| `mtop.film.MtopIndependentSkinsAPI.querySkins` |
| `mtop.film.MtopInteractionAPI.queryTinyRedPacket` |
| `mtop.film.MtopInteractionReportAPI.report` |
| `mtop.film.MtopLuckyDrawAPI.batchLotteryDraw` |
| `mtop.film.MtopLuckyDrawAPI.getQualificationResult` |
| `mtop.film.MtopLuckyDrawAPI.lotteryDraw` |
| `mtop.film.MtopLuckyDrawAPI.newLotteryDraw` |
| `mtop.film.MtopMediaAPI.favorMedia` |
| `mtop.film.MtopMediaAPI.getFavorMedias` |
| `mtop.film.MtopMemberAPI.createSCard` |
| `mtop.film.MtopMemberAPI.getMemberChangeInfo` |
| `mtop.film.MtopMemberAPI.querySpringYoukuPackages` |
| `mtop.film.MtopMemberAPI.quickOpenCardIndex` |
| `mtop.film.MtopMindAPI.changeArticleFavorStatus` |
| `mtop.film.MtopMindAPI.modifyUserPrivacy` |
| `mtop.film.MtopMissionAPI.drawMissionReward` |
| `mtop.film.MtopMissionAPI.getMissionResultByType` |
| `mtop.film.MtopRegionAPI.getDamaiHotAndAllRegion` |
| `mtop.film.MtopSnatchAPI.createSnatchGroup` |
| `mtop.film.MtopSnsAPI.focusUser` |
| `mtop.film.MtopSnsAPI.getFansByPage` |
| `mtop.film.MtopSnsAPI.getMixFocusedUser` |
| `mtop.film.MtopSnsAPI.updateFocusUserInfo` |
| `mtop.film.MtopTaskAPI.completeTask` |
| `mtop.film.MtopTaskAPI.queryUserTaskByBizId` |
| `mtop.film.MtopTaskAPI.queryUserTaskModule` |
| `mtop.film.MtopTinyVideoAPI.reportPlay` |
| `mtop.film.MtopUserAPI.getUserUsedPhone` |
| `mtop.film.MtopUserAPI.updateUserProfile` |
| `mtop.film.MtopYilianAPI.joinYilianClub` |
| `mtop.film.MtopYilianAPI.leaveYilianClub` |
| `mtop.film.MtopYilianAPI.receiveQueryLetter` |
| `mtop.film.life.aristotle.get` |
| `mtop.film.life.aristotle.get_damai_show_detail_` |
| `mtop.film.life.popup.get` |
| `mtop.film.life.popup.report` |
| `mtop.film.mtopblackvipapi.activate` |
| `mtop.film.mtopcinemaapi.getcinemalistinpage` |
| `mtop.film.mtopcommentapi.addcommentreport` |
| `mtop.film.mtopcommentapi.changehelpstatus` |
| `mtop.film.mtopcommentapi.queryfriendcomments` |
| `mtop.film.mtopcommentapi.queryusercommentsbyoption` |
| `mtop.film.mtopcommunityapi.queryuserdiscussionlist` |
| `mtop.film.mtopfcodeapi.getcoupondetail` |
| `mtop.film.mtopfcodeapi.getcoupons` |
| `mtop.film.mtopmarketingapi.cacpaymentsolution` |
| `mtop.film.mtopmarketingapi.cacseatprice` |
| `mtop.film.mtopmindapi.changefavorstatus` |
| `mtop.film.mtopmindapi.changeshowwantstatus` |
| `mtop.film.mtopnewcommentapi.addcomment` |
| `mtop.film.mtopnewcommentapi.deletecomment` |
| `mtop.film.mtoporderapi.checkendorseorder` |
| `mtop.film.mtoporderapi.getsoontickets` |
| `mtop.film.mtopphonelotteryflowapi.drawlotterytouser` |
| `mtop.film.mtopphonelotteryflowapi.sendsmsverifycode` |
| `mtop.film.mtopphonelotteryflowapi.useredirectqualification` |
| `mtop.film.mtopreportapi.report` |
| `mtop.film.mtopscheduleapi.getcinemaschedules` |
| `mtop.film.mtopseatapi.getscheduleseat` |
| `mtop.film.mtopseatapi.previewscheduleseat` |
| `mtop.film.mtopshowapi.getuserwatchedshows` |
| `mtop.film.mtopsnsapi.getfocususersbypage` |
| `mtop.film.mtopuserapi.getminiuserprofile` |
| `mtop.film.pfusercenter.guide.call.back` |
| `mtop.film.pfusercenter.identity.layout.update` |
| `mtop.film.pfusercenter.identity.memberinfo.get` |
| `mtop.film.pfusercenter.payresult.querypayresultprofit` |
| `mtop.film.pfusercenter.profit.querydetail` |
| `mtop.film.pfusercenter.profit.subscription.create` |
| `mtop.film.pfusercenter.profit.subscription.delete` |
| `mtop.film.pfusercenter.relation.bind.damai` |
| `mtop.film.pfusercenter.relation.onekeybind.damai` |
| `mtop.film.pfusercenter.ticket.queryNextUpcomingTicket` |
| `mtop.film.skin.show.get` |
| `mtop.film.user.notifyconfig.get` |
| `mtop.film.user.notifyconfig.set` |

## 7. 其他 MTOP（账号 / 淘宝 / 支付辅助）

| API |
| --- |
| `mtop.account.biometric.close` |
| `mtop.account.biometric.open` |
| `mtop.alibaba.damai.LogAPI.logcode` |
| `mtop.alibaba.damai.LogAPI.logstamp` |
| `mtop.alibaba.damai.detail.getdetail` |
| `mtop.alibaba.damai.detail.getdetail.center` |
| `mtop.alibaba.damai.logapi.logcode` |
| `mtop.alibaba.damai.logapi.logstamp` |
| `mtop.alibaba.detail.subpage.getdetail` |
| `mtop.alibaba.emas.publish.update.escort.get` |
| `mtop.alibaba.emas.publish.update.get` |
| `mtop.alibaba.emas.publish.update.resource.upload` |
| `mtop.alibaba.havana.tbmpc.thirdPart.bindAlipay` |
| `mtop.alibaba.havanaappiv.nonloginverify.url` |
| `mtop.alibaba.havanaappiv.nonloginverify.url.withenv` |
| `mtop.alibaba.havanaappiv.verify.url` |
| `mtop.alibaba.security.passkey.authenticate` |
| `mtop.alibaba.security.passkey.challenge` |
| `mtop.alibaba.security.passkey.config.query` |
| `mtop.alibaba.security.passkey.log` |
| `mtop.alibaba.security.passkey.registration` |
| `mtop.alibaba.security.passkey.remove` |
| `mtop.alibaba.security.passkey.usable` |
| `mtop.alibaba.ucc.authcodet.validate` |
| `mtop.alibaba.ucc.bind.change` |
| `mtop.alibaba.ucc.bind.identify` |
| `mtop.alibaba.ucc.bind.pure.oauth` |
| `mtop.alibaba.ucc.bind.token.authcode` |
| `mtop.alibaba.ucc.bindByNativeAuth` |
| `mtop.alibaba.ucc.convertAuthCodeToAccessToken` |
| `mtop.alibaba.ucc.get.authinfo` |
| `mtop.alibaba.ucc.getLocalSiteAuthUrl` |
| `mtop.alibaba.ucc.getalipayauthurl` |
| `mtop.alibaba.ucc.grow.continue.login` |
| `mtop.alibaba.ucc.grow.url.get` |
| `mtop.alibaba.ucc.grow.url.get.no.login` |
| `mtop.alibaba.ucc.localauthurl.get.bytoken` |
| `mtop.alibaba.ucc.login.continue` |
| `mtop.alibaba.ucc.native.oauthLogin` |
| `mtop.alibaba.ucc.nointeraction.bind` |
| `mtop.alibaba.ucc.nointeraction.bind.info.query` |
| `mtop.alibaba.ucc.nointeraction.unbind` |
| `mtop.alibaba.ucc.nointeraction.update.oauth` |
| `mtop.alibaba.ucc.oauthLogin` |
| `mtop.alibaba.ucc.recommend.bind` |
| `mtop.alibaba.ucc.taobao.apply.usertoken` |
| `mtop.alibaba.ucc.unbind` |
| `mtop.alibaba.ucc.upgrade.account` |
| `mtop.antiattack.checkcode.validate.activity_action` |
| `mtop.client.mudp.update` |
| `mtop.client.mudp.update.outer` |
| `mtop.com.taobao.mloginService.appLaunch` |
| `mtop.com.taobao.mloginService.appOldAutoLogin` |
| `mtop.com.taobao.mloginService.getAppLaunchInfo` |
| `mtop.com.taobao.mloginService.prelogininfo` |
| `mtop.com.taobao.mloginservice.unifyssotokenlogin` |
| `mtop.common.getTimestamp` |
| `mtop.common.gettimestamp` |
| `mtop.deliver.getAddressList` |
| `mtop.domain.EnvModeEnum` |
| `mtop.domain.IMTOPDataObject` |
| `mtop.domain.MethodEnum` |
| `mtop.domain.MtopRequest` |
| `mtop.domain.MtopResponse` |
| `mtop.external.instanceConfigs.get` |
| `mtop.getUploadFileToken` |
| `mtop.global.SDKUtils` |
| `mtop.global.init.InnerMtopInitTask` |
| `mtop.global.init.OpenMtopInitTask` |
| `mtop.global.init.ProductMtopInitTask` |
| `mtop.global.init.QMtopInitTask` |
| `mtop.havana.mpc.thirdBind.management.bindThirdPartId` |
| `mtop.havana.mpc.thirdBind.management.changeBindThirdPartId` |
| `mtop.havana.register.queryregisterlink` |
| `mtop.havana.register.sdk.checkcode.send` |
| `mtop.havana.register.sdk.country.get` |
| `mtop.havana.register.sdk.direct.register` |
| `mtop.havana.register.sdk.email.checkcode.send` |
| `mtop.havana.register.sdk.nick.check.and.recommend` |
| `mtop.havana.register.sdk.register` |
| `mtop.havana.register.sdk.sns.register` |
| `mtop.havana.register.sdk.verdor.register` |
| `mtop.intf.Mtop` |
| `mtop.intf.MtopBuilder` |
| `mtop.item.detail.content.feed` |
| `mtop.item.detail.recommend.all` |
| `mtop.login.getAlipayCookies` |
| `mtop.login.getWapLoginCookies` |
| `mtop.mEasyLoginService.login` |
| `mtop.mLoginTokenService.applySsoToken` |
| `mtop.mLoginTokenService.applySsoTokenV2` |
| `mtop.mLoginUnitService.autoLogin` |
| `mtop.mloginService.login` |
| `mtop.mloginService.mloginTokenLogin` |
| `mtop.mloginService.ssoLogin` |
| `mtop.mloginunitservice.autologin` |
| `mtop.netfit.DMBaseMtopRequest` |
| `mtop.platform` |
| `mtop.protocol.builder.impl.InnerProtocolParamBuilderImpl` |
| `mtop.rpc.impl.MtopRpcServiceImpl` |
| `mtop.sys.newDeviceId` |
| `mtop.taobao.alibabaMLoginService.applySsoToken` |
| `mtop.taobao.alibabaMLoginService.autologin` |
| `mtop.taobao.alibabaMLoginService.login` |
| `mtop.taobao.alibabaMLoginService.logout` |
| `mtop.taobao.alibabaMLoginService.mloginTokenLogin` |
| `mtop.taobao.alibabaMLoginService.snsLogin` |
| `mtop.taobao.aserver.concurrent.count` |
| `mtop.taobao.commonuse.mloginService.canceledQrCode` |
| `mtop.taobao.commonuse.mloginService.confirmedQrCode` |
| `mtop.taobao.commonuse.mloginService.genQrCode` |
| `mtop.taobao.commonuse.mloginService.qrcodelogin` |
| `mtop.taobao.commonuse.mloginService.scanedQrCode` |
| `mtop.taobao.countryservice.country.get` |
| `mtop.taobao.cttp.mi.logs.upload` |
| `mtop.taobao.daidebug.insertlog` |
| `mtop.taobao.ha.query` |
| `mtop.taobao.havana.mlogin.alipayaso` |
| `mtop.taobao.havana.mlogin.logout` |
| `mtop.taobao.havana.mlogin.youkuLegacy.refreshCookie` |
| `mtop.taobao.havana.mlogin.youkuLegacy.verifyCookie` |
| `mtop.taobao.login.mLoginUnitService.fingerprintLogin` |
| `mtop.taobao.login.mLoginUnitService.fingerprintLoginApplyToken` |
| `mtop.taobao.login.signForAlipaySNSLogin` |
| `mtop.taobao.mloginService.biometricLogin` |
| `mtop.taobao.mloginService.getLoginFlow` |
| `mtop.taobao.mloginService.preScanFaceLogin` |
| `mtop.taobao.mloginService.simLogin` |
| `mtop.taobao.mloginService.simLogin.userinput` |
| `mtop.taobao.mloginService.smsLogin` |
| `mtop.taobao.mloginService.smsLogin.nick` |
| `mtop.taobao.mloginService.smsSend` |
| `mtop.taobao.mloginService.smsSend.nick` |
| `mtop.taobao.mloginService.snsLogin` |
| `mtop.taobao.mloginService.touristlogin` |
| `mtop.taobao.mloginservice.passkey.challenge` |
| `mtop.taobao.mloginservice.passkey.login` |
| `mtop.taobao.sdk.genurl` |
| `mtop.taobao.search.highway.upload` |
| `mtop.taobao.tbmpc.canChangeNick` |
| `mtop.taobao.tbmpc.findMemberCenterFeature` |
| `mtop.taobao.tbmpc.getSdkAccountCenterUrl` |
| `mtop.taobao.tbmpc.getSdkAccountCenterUrlWithSession` |
| `mtop.taobao.tmq.performance.reportPerformance` |
| `mtop.taobao.upp.service.gateway` |
| `mtop.taopiaopiao.wireless.gaia.template.query` |
| `mtop.trade.order.adjust` |
| `mtop.trade.order.adjust.dmpre` |
| `mtop.trade.order.build` |
| `mtop.trade.order.build.dmpre` |
| `mtop.trade.order.create` |
| `mtop.trade.order.create.dmpre` |
| `mtop.uncenter.mudp` |
| `mtop.uploadFile` |
| `mtop.util.ReflectUtil` |
| `mtop.verifycenter.rp.event` |
| `mtop.verifycenter.rp.event.sessionless` |
| `mtop.verifycenter.rp.getwirelessconf` |
| `mtop.verifycenter.rp.log` |
| `mtop.verifycenter.rp.start` |
| `mtop.verifycenter.rp.submit` |
| `mtop.verifycenter.rp.upload` |
| `mtop.youku.mLoginTokenService.applySsoTokenV2` |
| `mtop.youku.madai.aps.cloudplayservice.get` |
| `mtop.youku.play.ups.appinfo.get` |
| `mtop.youku.playlog.open.batch.push` |
| `mtop.youku.playlog.open.get` |
| `mtop.youku.playlog.open.getVideoInfo` |
| `mtop.youku.playlog.open.push` |
| `mtop.youku.sdkservice.globalConfig` |
| `mtop.youku.sdkservice.logout` |
| `mtop.youku.sdkservice.refreshCookie` |
| `mtop.youku.sdkservice.verifyCookie` |
| `mtop.youku.xlp.data.getDeviceScore` |

## 8. 关键 H5 / 页面 URL（摘录）

### 8.1 大麦站内

| URL |
| --- |
| `http://m.damai.cn` |
| `http://m.damai.cn/orderlist.aspx` |
| `https://androiddownload.damai.cn/pic/click_want_anition_json.zip` |
| `https://androiddownload.damai.cn/pic/damai_profit_gradient_bg.png` |
| `https://androiddownload.damai.cn/pic/damai_profit_member_bg.png` |
| `https://androiddownload.damai.cn/pic/dialog_action_container_bg1.png` |
| `https://androiddownload.damai.cn/pic/ticklet_project_default_image.png` |
| `https://androiddownload.damai.cn/uc/` |
| `https://androiddownload.damai.cn/uc/debug/arm64-v8a/libkernelu4_zip_uc_276.so` |
| `https://androiddownload.damai.cn/uc/debug/armeabi-v7a/libkernelu4_zip_uc_276.so` |
| `https://androiddownload.damai.cn/uc/release/arm64-v8a/libkernelu4_zip_uc_276.so` |
| `https://androiddownload.damai.cn/uc/release/armeabi-v7a/libkernelu4_zip_uc_276.so` |
| `https://detail.damai.cn/` |
| `https://detail.damai.cn/item.htm?id=1089325722488,null` |
| `https://help.damai.cn/helpPageH5Context.htm?pageId=92` |
| `https://m.damai.cn` |
| `https://m.damai.cn/app/dmfe/dramas/pages/ip/index.html?ipId=` |
| `https://m.damai.cn/app/dmfe/select-seat-biz/kylin.html` |
| `https://m.damai.cn/app/dmfe/show/pages/my/index.html` |
| `https://m.damai.cn/content/videos/common.html` |
| `https://m.damai.cn/damai/activity/discover/detail.html` |
| `https://m.damai.cn/damai/activity/discover/themepagecms.html` |
| `https://m.damai.cn/damai/activity/passport/index.html?userId=` |
| `https://m.damai.cn/damai/activity/vip/index.html` |
| `https://m.damai.cn/damai/activity/vip/join.html` |
| `https://m.damai.cn/damai/activity/waitcomment/index.html` |
| `https://m.damai.cn/damai/detail/item.html` |
| `https://m.damai.cn/damai/mine/audience-notice/index.html` |
| `https://m.damai.cn/movies/cinemas.html` |
| `https://m.damai.cn/movies/detail.html` |
| `https://m.damai.cn/movies/home.html?from=damai` |
| `https://m.damai.cn/movies/list.html?tabIndex=now&channelMode=YES&usewindvane=1&sqm=dianying.damai.tpptodm.icon&disableNav=YES&hidestatusbar=1&bizpass_pioneer=` |
| `https://m.damai.cn/movies/movie-cinemas.html` |
| `https://m.damai.cn/movies/seat.html` |
| `https://m.damai.cn/movies/showtimes.html` |
| `https://m.damai.cn/movies/tickets.html?type=ticket&pullRefresh=YES&spm=dianying.damai.app.ticketlist` |
| `https://m.damai.cn/movies/vip/center.html?hidenavbar=1&disableNav=YES&refreshable=true&hidestatusbar=1&pullRefresh=YES&__webview_options__=transparentTitle%3Dalways%26pullRefresh%3DYES%26titlePenetrate%3DYES` |
| `https://m.damai.cn/pages/landing.html?targetUrl=` |
| `https://m.damai.cn/ph4/seat.html?pha=true&quickBuy=0` |
| `https://m.damai.cn/shows/account-health.html?hidenavbar=1` |

### 8.2 登录 / 支付

| URL |
| --- |
| `http://ab.alipay.com/agreement/contract.htm` |
| `http://login.m.taobao.com/login.htm` |
| `http://login.m.taobao.com/minisdk/login.htm;https://oauth.m.taobao.com/authorize` |
| `http://login.m.taobao.com/minisdk/login.htm;https://oauth.m.taobao.com/authorize;((https` |
| `http://login.m.taobao.com/qrcodeShow.htm?appKey=%s&from=bcqrlogin` |
| `http://login.m.taobao.com/taolang/weiboBind.htm?hideBar=1` |
| `http://mclient.alipay.com/cashier/mobilepay.htm` |
| `http://mclient.alipay.com/home/exterfaceAssign.htm` |
| `http://mclient.alipay.com/service/rest.htm` |
| `http://passport.daily.alibaba.com/taobao_oauth_common.htm?appName=taobao-oauth-common&appEntrance=sdk-common&needTopToken=true&topTokenAppName=` |
| `http://pre-sdkservice-userservice.passport.youku.com` |
| `http://tfs.alipayobjects.com/L1/71/100/and/alipay_wap_main.apk` |
| `http://wappaygw.alipay.com/service/rest.htm` |
| `https://account.youku.com` |
| `https://account.youku.com/` |
| `https://account.youku.com/logoutAll.htm` |
| `https://account.youku.com/wap/login.htm` |
| `https://account.youku.com/wap/register.htm` |
| `https://authweb.alipay.com/auth?auth_type=PURE_OAUTH_SDK&app_id=` |
| `https://d.alipay.com` |
| `https://ds.alipay.com/?scheme=` |
| `https://loggw-exsdk.alipay.com/loggw/logUpload.do` |
| `https://m.damai.cn/damai/activity/passport/index.html?userId=` |
| `https://mcgw.alipay.com/sdklog.do` |
| `https://mclient.alipay.com/cashier/mobilepay.htm` |
| `https://mclient.alipay.com/home/exterfaceAssign.htm` |
| `https://mclient.alipay.com/service/rest.htm` |
| `https://mclient.alipay.com/wapcashier/api/cashierMainMergeRequest.htm` |
| `https://mdn.alipayobjects.com/graph_jupiter/afts/img/A*hqjPQok8dboAAAAAAAAAAAAADsF2AQ/original` |
| `https://mdn.alipayobjects.com/graph_jupiter/afts/img/A*qtYLSZLPQ6cAAAAAAAAAAAAADsF2AQ/original` |
| `https://mdn.alipayobjects.com/mars/afts/file/A*61p6RaAHN4sAAAAAQIAAAAgAelB4AQ` |
| `https://mdn.alipayobjects.com/mars/afts/file/A*GIsCRIbViGcAAAAAQIAAAAgAelB4AQ` |
| `https://mdn.alipayobjects.com/mars/afts/file/A*Q9XBRLmN_XQAAAAAQMAAAAgAelB4AQ` |
| `https://mdn.alipayobjects.com/mars/afts/file/A*Y-4xTIHb3igAAAAAQJAAAAgAelB4AQ` |
| `https://mdn.alipayobjects.com/mars/afts/file/A*hqptTJMo7HcAAAAAQMAAAAgAelB4AQ` |
| `https://mdn.alipayobjects.com/mars/afts/file/A*rzK5SK6dwRgAAAAAAAAAAAAADlB4AQ` |
| `https://mdn.alipayobjects.com/mars/afts/file/A*svDGRqubAaUAAAAAQMAAAAgAelB4AQ` |
| `https://mdn.alipayobjects.com/mars/afts/file/A*vuCrR5O3Q5oAAAAAQJAAAAgAelB4AQ` |
| `https://mobilegw.alipay.com/mgw.htm` |
| `https://mobilegw.alipaydev.com/mgw.htm` |

### 8.3 CDN / 资源

| URL |
| --- |
| `http://gw.alicdn.com/tfs/TB19zmbeYus3KVjSZKbXXXqkFXa-540-540.png` |
| `http://gw.alicdn.com/tfs/TB1TXD7eRKw3KVjSZFOXXarDVXa-540-540.png` |
| `http://gw.alicdn.com/tfs/TB1U_tbbMFY.1VjSZFnXXcFHXXa-540-540.png` |
| `http://gw.alicdn.com/tfs/TB1j4MKeQ5E3KVjSZFCXXbuzXXa-540-540.png` |
| `http://gw.alicdn.com/tfs/TB1llJ4e2WG3KVjSZFPXXXaiXXa-540-540.png` |
| `http://gw.alicdn.com/tfs/TB1o_sJeQ9E3KVjSZFGXXc19XXa-540-540.png` |
| `http://gw.alicdn.com/tfs/TB1vPF4e25G3KVjSZPxXXbI3XXa-540-540.png` |
| `http://gw.alicdn.com/tfscom/` |
| `http://img.alicdn.com/tfs/TB10.2GeRCw3KVjSZFlXXcJkFXa-708-582.png` |
| `http://img.alicdn.com/tfs/TB10K9UeQ9E3KVjSZFGXXc19XXa-366-150.png` |
| `http://img.alicdn.com/tfs/TB11TSUeROD3KVjSZFFXXcn9pXa-480-813.png` |
| `http://img.alicdn.com/tfs/TB11tq6eRGw3KVjSZFwXXbQ2FXa-900-395.png` |
| `http://img.alicdn.com/tfs/TB17nSUeROD3KVjSZFFXXcn9pXa-366-150.png` |
| `http://img.alicdn.com/tfs/TB18R92eLWG3KVjSZPcXXbkbXXa-1280-720.png` |
| `http://img.alicdn.com/tfs/TB19RK5eLWG3KVjSZFPXXXaiXXa-640-1000.png` |
| `http://img.alicdn.com/tfs/TB1AnzAeRiE3KVjSZFMXXbQhVXa-670-458.png` |
| `http://img.alicdn.com/tfs/TB1CzOVeUGF3KVjSZFvXXb_nXXa-1125-1503.jpg` |
| `http://img.alicdn.com/tfs/TB1E2W1eRWD3KVjSZFsXXcqkpXa-900-936.png` |
| `http://img.alicdn.com/tfs/TB1EUG3eRCw3KVjSZFuXXcAOpXa-900-728.png` |
| `http://img.alicdn.com/tfs/TB1GtAgb2Bj_uVjSZFpXXc0SXXa-640-1074.png` |
| `http://img.alicdn.com/tfs/TB1JxO0eL5G3KVjSZPxXXbI3XXa-900-468.png` |
| `http://img.alicdn.com/tfs/TB1V892eLWG3KVjSZPcXXbkbXXa-480-80.png` |
| `http://img.alicdn.com/tfs/TB1V9C2eUGF3KVjSZFoXXbmpFXa-750-400.png` |
| `http://img.alicdn.com/tfs/TB1Vh5TeLWG3KVjSZFPXXXaiXXa-1125-2001.jpg` |
| `http://img.alicdn.com/tfs/TB1ZLbzeL1H3KVjSZFHXXbKppXa-670-424.jpg` |

## 9. 关键业务流程（推断）

```text
浏览项目 -> mtop.damai.item.detail.getdetail
         -> 价格试算 mtop.damai.item.calcTicketPrice
         -> 下单构建 mtop.damai.trade.order.build
         -> 创建订单 mtop.damai.trade.order.create / spliceorder.create
         -> 支付 mtop.film.MtopCashierConsultAPI.* / 支付宝 H5
         -> 票夹 mtop.damai.*ticklet* / cn.damai.ticklet
```

抢票相关代码包：`cn.damai.category.grab`；搜索：`mtop.damai.search.*`。

## 10. 关键接口完整请求/响应（smali 反编译）

> 来源：`unpack-output/106/frida-smali`（Frida dump → baksmali）。  
> 按 `android-api-smali-analysis` skill：除 path/body 外，必须写清**请求头、加解密/签名、密钥材料**。  
> 示例业务 ID 为占位；网关 `x-sign` / Cookie 需真实设备会话。

### 10.0 通用：服务端入口 / 请求头 / 加解密

#### 10.0.1 服务端入口

| 项 | 值 | 证据 |
| --- | --- | --- |
| 协议 | 阿里 **MTOP** | 全站 `mtop.*` Request |
| Method | **POST** | `Content-Type: application/x-www-form-urlencoded` |
| Path | `/gw/<api>/<v>/` | 如 `/gw/mtop.damai.trade.order.create/1.0/` |
| Host（正式） | `mtop.damai.cn` | `DMQueryKey.setDomain` |
| Host（预发） | `pre-mtop.damai.cn` | 同上 |
| Host（日常） | `daliy-mtop.damai.cn` | 同上（源码拼写） |
| Body 形态 | `data=<urlencode(json)>&type=originaljson` | Request public 字段 → JSON |

```http
POST https://mtop.damai.cn/gw/<api>/<v>/ HTTP/1.1
Host: mtop.damai.cn
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Cookie: cookie2=...; _m_h5_tk=...; unb=...; ...
User-Agent: <MTOP/App UA>

# 网关公共头（由 MTOP SDK + 无线保镖注入，业务 smali 不手写）
x-appkey: <appKey>
x-t: <unix-ms>
x-sign: <SecurityGuard 签名>
x-sid: <登录后 sid，NEED_SESSION 时>
x-uid: <userId>
x-utdid: <设备 utdid>
x-ttid: <渠道 ttid>
x-devid: <可选>
x-mini-wua / x-sgext / x-umt: <风控 WUA 相关，部分接口>
x-features / x-app-ver / x-pv: <SDK 特性与版本>

data=%7B...%7D&type=originaljson
```

#### 10.0.2 请求头（Headers）

| Header | 值/来源 | 是否签名/加密 | 注入位置 |
| --- | --- | --- | --- |
| `Content-Type` | `application/x-www-form-urlencoded;charset=UTF-8` | 否 | MTOP 客户端 |
| `Cookie` | `cookie2` / `_m_h5_tk` / 登录会话等 | 会话凭证 | 登录成功后落盘；`NEED_SESSION=true` 必带 |
| `x-appkey` | 大麦 AppKey（资源 `appkey_release` / MtopConfig） | 参与签名输入 | MTOP SDK |
| `x-t` | 毫秒时间戳 | 参与签名输入 | MTOP SDK |
| `x-sign` | 网关签名 | **是（核心）** | 无线保镖 `SecurityGuard` / MTOP InnerSign |
| `x-sid` / `x-uid` | 登录会话 | 鉴权 | Session 管理 |
| `x-utdid` / `x-ttid` | 设备 / 渠道 | 参与签名输入 | UTDevice / 配置 |
| `x-mini-wua` 等 | WUA 风控串 | 风控签名 | `SecurityGuardManagerWraper.getWUA` / `useWua()` |
| 业务 Header AES | **无** | 不适用 | 已搜 `encryptParameter` / 业务 `Cipher`：大麦下单链**无**华西式 Header 密文 |

dump 内可见的 header 字符串（分析/埋点侧，非完整 MTOP 表）：`x-appkey`、`x-app-ver`、`x-utdid`、`x-uid`、`x-pv`、`x-ttid`、`x-t`（`tb/bj6`、analytics）。  
**完整 `x-sign` 常量表所在 `mtopsdk.*` 实现未打进本 Frida 子集**（仅有 `Lmtopsdk/mtop/stat/MtopMonitor` 引用），故网关头以「SDK 惯例 + SecurityGuard」还原。

#### 10.0.3 加密 / 签名 / 密钥

| 层级 | 有无 | 说明 |
| --- | --- | --- |
| 业务 Body AES/RSA | **无** | 登录/详情/选座/下单 `data` 均为**明文 JSON**（可 URL 编码） |
| 业务 Header 密文 | **无** | 不同于华西 `encryptParameter` |
| AccessToken 业务 sign | **有** | 仅 `mtop.damai.mxm.user.accesstoken.get` 的 data.`sign` |
| 网关 MTOP `x-sign` | **有（全局）** | 所有 `/gw/` 请求；算法在无线保镖 so，**非**业务 smali 明文 |
| WUA / ecode | **有（条件）** | `NEED_ECODE` / `useWua()` 的接口（如 precheck、create 链） |
| 登录密码 | 可选加密 | `pwdEncrypted`；默认 `false` 时 password 明文进 data（仍走 HTTPS + x-sign） |
| 第三方 SDK AES | 忽略 | 友盟/推送等非购票链路 |

**AccessToken 业务签名（可复现）：**

- 来源类型：硬编码  
- 密钥明文：`166432f6316846fab25e5c39e9e57d71`  
- 证据：`cn.damai.im.request.AliMeTokenRequest.toSignParamMap`  
- 参与字段（LinkedHashMap 顺序）：`userCode` → `from` → `v` → `timestamp` → `key`  
- 公式（与类注释/常规一致）：`sign = MD5(userCode + from + v + timestamp + key)`（小写 hex；若线上不符再按「按序拼接 map 的 value」核对）  
- 密文落点：data 字段 `sign`；body 其余字段仍明文  

**网关 `x-sign`（不可从业务 smali 复现明文密钥）：**

- 来源类型：Native / 无线保镖（`com.alibaba.wireless.security.open.SecurityGuardManager`、`SecurityGuardManagerWraper`）  
- 已搜：`x-sign`、`InnerSign`、`ProtocolParamBuilder`、`mtopsdk/mtop/**` 实现类 → **本 dump 无完整实现**  
- 文档结论：需真机抓包拿 `x-sign`，或授权环境 hook `ISign` / SecurityGuard；**不得伪造可复现密钥**  

---

### 10.1 账密登录 `mtop.taobao.alibabaMLoginService.login`

| 项 | 值 |
| --- | --- |
| 类 | `PasswordLoginRequest` ← `LoginRequestBase` ← `MemberRequestBase` |
| API（正式） | `mtop.taobao.alibabaMLoginService.login`（另有 `com.taobao.mtop.mloginService.login`） |
| v | `1.0`（SDK 默认） |
| 需登录态 | 否（建会话） |
| Body 加密 | 无（`pwdEncrypted=false` 时密码明文在 JSON 内） |
| 网关签名 | 有（`x-sign` + 可选 WUA） |

**请求头：** 见 §10.0.2；登录前通常无有效 `x-sid`，成功后 Cookie/`sid` 由 Havana 回写。

**data 字段（请求）：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `loginId` | string | 账号/手机号 |
| `password` | string | 密码 |
| `pwdEncrypted` | bool | 默认 `false` |
| `loginType` | string | 默认 `"taobao"` |
| `hid` | string | 可选 |
| `sid` | string | 续登时可能带 |
| `deviceName` | string | `Brand(Model)`，如 `Xiaomi(MI 8)` |
| `deviceTokenKey` / `deviceTokenSign` | string | 设备 token（SecurityGuard） |
| `useDeviceToken` | bool | 默认 `true` |
| `t` | long | 时间戳 |
| `snsToken` / `biometricId` 等 | string | 三方/生物 |

**完整 POST 示例：**

```http
POST https://mtop.damai.cn/gw/mtop.taobao.alibabaMLoginService.login/1.0/ HTTP/1.1
Host: mtop.damai.cn
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
x-appkey: <appKey>
x-t: 1710000000000
x-sign: <SecurityGuard>
x-utdid: <utdid>
x-ttid: <ttid>

data={"loginId":"13800000000","password":"<pwd>","pwdEncrypted":false,"loginType":"taobao","deviceName":"Xiaomi(MI 8)","useDeviceToken":true,"t":1710000000000}&type=originaljson
```

**响应（Havana/mLogin 壳）：** `api` / `v` / `ret` / `data`；成功时会话字段（`sid`、token、cookie 线索）以抓包为准。  
**调用链：** 登录 UI → `UserLoginServiceImpl` → MTOP →（可选）`applySsoToken` / `getWapLoginCookies` → §10.2/10.3。

---

### 10.2 大麦 Token `mtop.damai.mxm.user.token.get`

| 项 | 值 |
| --- | --- |
| 类 | `AliMeTokenRequestV2` |
| v | `1.0` |
| NEED_ECODE / NEED_SESSION | **true / true** |
| Body 加密 | 无 |
| 业务 sign | 无（与 AccessToken 不同） |

**请求头：** 必须带登录 Cookie / `x-sid`；其余同 §10.0.2。

**data 字段：**

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `loginStateType` | `"1"` | 登录态类型 |
| `xiaoMiType` | `"1"` | 小蜜/客服侧类型 |

```http
POST https://mtop.damai.cn/gw/mtop.damai.mxm.user.token.get/1.0/ HTTP/1.1
Host: mtop.damai.cn
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Cookie: <登录后 Cookie>
x-appkey: <appKey>
x-t: <ts>
x-sign: <SecurityGuard>
x-sid: <sid>
x-uid: <uid>

data={"loginStateType":"1","xiaoMiType":"1"}&type=originaljson
```

**响应模型 `AliMeTokenInfo`：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `result` | string | Token 字符串 |

```json
{
  "api": "mtop.damai.mxm.user.token.get",
  "v": "1.0",
  "ret": ["SUCCESS::调用成功"],
  "data": { "result": "<token>" }
}
```

---

### 10.3 AccessToken `mtop.damai.mxm.user.accesstoken.get`

| 项 | 值 |
| --- | --- |
| 类 | `AliMeTokenRequest` |
| v | `1.0` |
| NEED_ECODE / SESSION | false / false（类声明；实际常仍带 Cookie） |
| Body 业务加密 | **无**；另有 **data.sign** |

#### 加密与签名（本接口）

| 项 | 内容 |
| --- | --- |
| 有无 / 触发 | 每次请求必算 `sign` |
| 算法 | MD5（UTF-8 拼接后摘要） |
| **密钥明文** | `166432f6316846fab25e5c39e9e57d71` |
| 密钥来源 | 硬编码（`toSignParamMap` 中 `key`） |
| 密钥证据 | `cn/damai/im/request/AliMeTokenRequest.smali` |
| 公式 | `sign = MD5(userCode + from + v + timestamp + "166432f6316846fab25e5c39e9e57d71")` |
| 密文落点 | data.`sign`；其余 data 明文 |

```http
POST https://mtop.damai.cn/gw/mtop.damai.mxm.user.accesstoken.get/1.0/ HTTP/1.1
Host: mtop.damai.cn
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
x-appkey: <appKey>
x-t: <ts>
x-sign: <SecurityGuard>

data={"userCode":"<uid>","from":"<from>","v":"1.0","timestamp":"1710000000","sign":"<md5>"}&type=originaljson
```

**响应：** 同 `AliMeTokenInfo.result`。

---

### 10.4 项目详情（查看）`mtop.damai.item.detail.getdetail`

| 项 | 值 |
| --- | --- |
| 类 | `ProjectNewDetailRequest` / `ProjectItemDetailRequest` |
| v | `1.0`（旧路径另有 `1.2` / `mtop.alibaba.damai.detail.getdetail`） |
| NEED_ECODE / SESSION | false / false |
| Body 加密 | 无 |
| 用途 | **查看**项目/场次/票档入口 |

**请求头：** 网关公共头 §10.0.2；可不登录（部分场次信息可能受限）。

**data 字段：**

| 字段 | 说明 |
| --- | --- |
| `itemId` | 项目/商品 ID |
| `version` | 可选，详情协议版本 |
| `dmChannel` | 先锋开时为 `damai@damaiapp_pioneer` |

```http
POST https://mtop.damai.cn/gw/mtop.damai.item.detail.getdetail/1.0/ HTTP/1.1
Host: mtop.damai.cn
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
x-appkey: <appKey>
x-t: <ts>
x-sign: <SecurityGuard>
x-utdid: <utdid>

data={"itemId":"720000000000","version":"1.0"}&type=originaljson
```

**响应：** `ProjectDetailNewBean` / `ProjectDetailItemResultDataBean`（场次、票档、是否选座等，结构大，以抓包 `data` 为准）。  
**调用链：** `ProjectDetailActivity` → `ProjectNewDetailRequest` → 选座/下单。

---

### 10.4b 订单详情（查看）`mtop.damai.wireless.order.orderdetail`

| 项 | 值 |
| --- | --- |
| 类 | `cn.damai.trade.newtradeorder.ui.orderdetail.net.OrderDetailRequest` |
| API | `mtop.damai.wireless.order.orderdetail`（常量 `OrderDetailConstantsApi.API_ORDER_DETAIL`） |
| v | **`2.0`** |
| NEED_ECODE / SESSION | **true / true** |
| Body 加密 | 无 |
| 用途 | **查看**已创建订单 |

**data 字段：**

| 字段 | 说明 |
| --- | --- |
| `orderId` | 订单号 |
| `sVersion` | 默认 `"2"` |
| `checkInvoiceResult` | bool |
| `checkModifyResult` | bool |

```http
POST https://mtop.damai.cn/gw/mtop.damai.wireless.order.orderdetail/2.0/ HTTP/1.1
Host: mtop.damai.cn
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Cookie: <登录态>
x-appkey: <appKey>
x-t: <ts>
x-sign: <SecurityGuard>
x-sid: <sid>
x-uid: <uid>

data={"orderId":"1234567890123","sVersion":"2","checkInvoiceResult":false,"checkModifyResult":false}&type=originaljson
```

**响应：** `OrderDetailBean`（状态、票档、观演人、支付/配送等）。  
**旁路：** 次级单 `mtop.damai.wireless.secondaryorde.orderdetail`（券包详情，字段 `orderId/sVersion/dmChannel`）。

---

### 10.5 座位动态 `mtop.damai.wireless.seat.dynamicInfo`

| 项 | 值 |
| --- | --- |
| 类 | `MtopSeatDynamicRequest` |
| v | `1.0` |
| NEED_ECODE / SESSION | false / false |

**data 字段：**

| 字段 | 说明 |
| --- | --- |
| `projectId` | 项目 ID（字符串） |
| `itemId` | 商品 ID |
| `performanceId` | 场次 ID（注意字段名是 performanceId） |
| `postChooseSeatFilterPriceIds` | 票价过滤，可空 |
| `privilegeActId` | 特权活动，可空 |
| `privilegeFilterSkuIds` | 特权 SKU，可空 |
| `hasPromotion` | bool |
| `activityId` | 活动 ID，可空 |
| `dmChannel` | 默认 `*@damai_android_*` |

```http
POST https://mtop.damai.cn/gw/mtop.damai.wireless.seat.dynamicInfo/1.0/ HTTP/1.1
Content-Type: application/x-www-form-urlencoded;charset=UTF-8

data={"projectId":"720000000000","itemId":"720000000000","performanceId":"210000000","postChooseSeatFilterPriceIds":"","privilegeActId":"","privilegeFilterSkuIds":"","hasPromotion":false,"activityId":"","dmChannel":"*@damai_android_*"}&type=originaljson
```

**响应 `SeatDynamic`：**

| 字段 | 说明 |
| --- | --- |
| `performBasicInfo` | 场次基础/`ItemSku`（含 `calculateTag`、`needCalc`） |
| `priceList` | `Price[]`：`priceId/skuId/salePrice/oriPrice/color/salable/...` |
| `standColorList` | 看台颜色汇总 |
| `promotionDetail` | 促销详情 |

---

### 10.6 座位状态 `mtop.damai.wireless.seat.queryperformseatstatus`

| 项 | 值 |
| --- | --- |
| 类 | `MtopStatusCompressRequest` |
| v | `1.0` |

**data 字段：** `projectId`、`performanceId`、`areaInfoVersion`、`standIds?`、`serialNumber?`、`dmChannel`（内部另持 `itemId` 用于监听/缓存）

```http
POST https://mtop.damai.cn/gw/mtop.damai.wireless.seat.queryperformseatstatus/1.0/ HTTP/1.1
Content-Type: application/x-www-form-urlencoded;charset=UTF-8

data={"projectId":"720000000000","performanceId":"210000000","areaInfoVersion":"1","standIds":"1001,1002","serialNumber":"","dmChannel":"*@damai_android_*"}&type=originaljson
```

**响应 `CompressSeatStatus`：**

| 字段 | 说明 |
| --- | --- |
| `seatStatus` | `Map<regionId, 压缩状态串>`，客户端 `decompress()` 还原 |

---

### 10.7 票价颜色 `mtop.damai.wireless.seat.querypricecolor`

| 项 | 值 |
| --- | --- |
| 类 | `MtopPriceColorRequest` |
| v | `1.2` |

**data：** `projectId`、`performanceId`、`cityId`、`standIds?`、`datasource`=`"3"`、`channel`=`"1001000100020002"`、`dmChannel`=`*@damai_android_*`

```http
POST https://mtop.damai.cn/gw/mtop.damai.wireless.seat.querypricecolor/1.2/ HTTP/1.1
Content-Type: application/x-www-form-urlencoded;charset=UTF-8

data={"projectId":"720000000000","performanceId":"210000000","cityId":"110100","standIds":"1001","datasource":"3","channel":"1001000100020002","dmChannel":"*@damai_android_*"}&type=originaljson
```

---

### 10.8 选座预检 `mtop.damai.wireless.seat.precheck`

| 项 | 值 |
| --- | --- |
| 类 | `MtopPreCheckRequest` |
| v | `1.0` |
| HTTP | **强制 POST** |
| NEED_ECODE / SESSION | **true / true** |
| 其它 | `useWua()`（风控 WUA） |

**data：** `projectId`、`performanceId`、`standSeats`（选中座位 JSON/串）、`serialNumber?`、`dmChannel`

```http
POST https://mtop.damai.cn/gw/mtop.damai.wireless.seat.precheck/1.0/ HTTP/1.1
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Cookie: <登录态>

data={"projectId":"720000000000","performanceId":"210000000","standSeats":"[{\"standId\":\"1001\",\"seatId\":\"90001\"}]","serialNumber":"","dmChannel":"*@damai_android_*"}&type=originaljson
```

---

### 10.9 先付后选座参数 `mtop.damai.wireless.seat.chooseSeatParam`

| 项 | 值 |
| --- | --- |
| 类 | `OrderFirstPayInfoRequest` |
| v | `2.0` |
| NEED_ECODE / SESSION | **true / true** |

> dump 中该 API 名绑定的是「订单号换选座参数」，**不是**进选座页的主入口；主入口为 `dynamicInfo` + `queryperformseatstatus`。

**data：** `orderId`（long）

```http
POST https://mtop.damai.cn/gw/mtop.damai.wireless.seat.chooseSeatParam/2.0/ HTTP/1.1
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Cookie: <登录态>

data={"orderId":1234567890123}&type=originaljson
```

---

### 10.10 算价 `mtop.damai.item.calcTicketPrice`

| 项 | 值 |
| --- | --- |
| 类 | `MtopCalcTicketPriceRequest` / `MtopCalcTicketPriceRequestNew` |
| v | `2.0` |
| NEED_ECODE / SESSION | **true / true** |

**data 字段：**

| 字段 | 说明 |
| --- | --- |
| `itemId` | 商品 ID |
| `performId` | 场次 ID（注意与座位接口的 `performanceId` 拼写不同） |
| `calculateTag` | 来自 `SeatDynamic.performBasicInfo.calculateTag` |
| `skuParamListJson` | `SeatCalcParams[]` 的 JSON 字符串 |
| `dmChannel` | `*@damai_android_*` |
| `exParams` | 可选 Map（New 版） |

`SeatCalcParams`：`priceId`、`price`（分）、`count`。

```http
POST https://mtop.damai.cn/gw/mtop.damai.item.calcTicketPrice/2.0/ HTTP/1.1
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Cookie: <登录态>

data={"itemId":"720000000000","performId":"210000000","calculateTag":"<tag>","skuParamListJson":"[{\"priceId\":\"3001\",\"price\":58000,\"count\":2}]","dmChannel":"*@damai_android_*"}&type=originaljson
```

**响应 `TicketCalcRes`：**

| 字段 | 说明 |
| --- | --- |
| `success` | bool |
| `errorCode` / `errorMsg` / `errorLevel` | 失败信息 |
| `model` | `TicketCalcBean` |

`TicketCalcBean`：`realTotalAmt`、`realTotalAmtText`、`reduceTotalAmt`、`reduceTotalAmtDesc`、`calculateModuleVOS`、`ticketModuleDetailVOS`、`usedPromotionList`。

阻断立即购买错误码：`2010001` / `20100002` / `20100003`。

```json
{
  "api": "mtop.damai.item.calcTicketPrice",
  "v": "2.0",
  "ret": ["SUCCESS::调用成功"],
  "data": {
    "success": true,
    "model": {
      "realTotalAmt": "1160.00",
      "realTotalAmtText": "¥1160",
      "reduceTotalAmt": "0",
      "ticketModuleDetailVOS": [],
      "calculateModuleVOS": []
    }
  }
}
```

---

### 10.11 构建订单 `mtop.damai.trade.order.build`

| 项 | 值 |
| --- | --- |
| API 选择 | 新：`mtop.damai.trade.order.build` **v=1.0**；旧：`mtop.trade.order.build` **v=4.0**；预发旧：`*.build.dmpre` |
| 组装类 | `UltronParamsMaker.makeBuildOrderParams` / `DMQueryKey` |

**立即购买（purchase_from=2）data：**

| 字段 | 说明 |
| --- | --- |
| `buyNow` | `"true"` |
| `buyParam` | `itemId_count_skuId` 多段用逗号：`720.._2_80001`（见 `BuyParam.concatBuyParams`） |
| `exParams` | JSON 字符串；会合并 `coupon=true`、`coVersion=2.0`、`websiteLanguage` 等 |

```http
POST https://mtop.damai.cn/gw/mtop.damai.trade.order.build/1.0/ HTTP/1.1
Host: mtop.damai.cn
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Cookie: <登录态>
x-appkey: <appKey>
x-t: <ts>
x-sign: <SecurityGuard>
x-sid: <sid>
x-uid: <uid>
x-utdid: <utdid>

data={"buyNow":"true","buyParam":"720000000000_2_80001","exParams":"{\"coupon\":\"true\",\"coVersion\":\"2.0\",\"websiteLanguage\":\"zh_CN\"}"}&type=originaljson
```

**加密与签名：** Body **明文**；网关 `x-sign` + 登录态；无业务 AES。  
**响应：** 奥创 Ultron 组件协议（确认页组件树）；后续 `adjust`/`create` 依赖回传 `params`。

---

### 10.12 调整订单 `mtop.damai.trade.order.adjust`

`UltronParamsMaker.makeAdjustOrderParams`：

| 字段 | 值 |
| --- | --- |
| `feature` | `{"gzip":"true"}` |
| `params` | build 返回并经用户修改后的协议串 |

```http
POST https://mtop.damai.cn/gw/mtop.damai.trade.order.adjust/1.0/ HTTP/1.1
Host: mtop.damai.cn
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Cookie: <登录态>
x-sign: <SecurityGuard>
x-sid: <sid>

data={"feature":"{\"gzip\":\"true\"}","params":"<ultron-params-from-build>"}&type=originaljson
```

---

### 10.13 创建订单（下单）`mtop.damai.trade.order.create`

| 项 | 值 |
| --- | --- |
| 新 API | `mtop.damai.trade.order.create` v=`1.0`（`UltronCreateOrder.API_NAME_ONLINE_NEW`） |
| 旧 API | `mtop.trade.order.create` v=`4.0` |
| 预发旧 | `mtop.trade.order.create.dmpre` |
| NEED_SESSION | **是**（未登录 create 失败） |
| Body 加密 | **无**（`params` 为 Ultron 协议串，可 gzip 标记） |
| 网关签名 | **有** `x-sign`；常附 WUA |

**data 关键键（`UltronCreateOrder`）：**

| 字段 | 值/说明 |
| --- | --- |
| `params` | 确认页最终协议 |
| `feature` | `{"gzip":"true","subChannel":"damai@tppnew_app"}`（常量 `V_FEATURE`） |
| `gzip` | `"true"`（`V_GZIP`） |
| `orderMarker` | `v:utdid=<utdid>` |
| `appGuide` | 可选 |

```http
POST https://mtop.damai.cn/gw/mtop.damai.trade.order.create/1.0/ HTTP/1.1
Host: mtop.damai.cn
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Cookie: <登录态>
x-appkey: <appKey>
x-t: <ts>
x-sign: <SecurityGuard>
x-sid: <sid>
x-uid: <uid>
x-utdid: <utdid>
x-mini-wua: <WUA，若 SDK 开启>

data={"params":"<ultron-params>","feature":"{\"gzip\":\"true\",\"subChannel\":\"damai@tppnew_app\"}","gzip":"true","orderMarker":"v:utdid=<utdid>"}&type=originaljson
```

#### 加密与签名（下单）

| 项 | 内容 |
| --- | --- |
| 业务 Body AES | **无** |
| 密钥（业务层） | **不适用**（无业务加密） |
| 网关 `x-sign` | SecurityGuard；密钥在 so，本 dump 无明文 |
| 密文落点 | 无；`params` 明文（或网关层 gzip） |
| 调用链 | `UltronPresenter` → build → adjust → **create** → `getpayparam` → 支付 |

**响应（推断）：** 含 `orderId` / 支付跳转；再调 §10.14；查单见 §10.4b。

---

### 10.14 支付参数 `mtop.damai.wireless.order.getpayparam`

| 项 | 值 |
| --- | --- |
| 类 | `OrderDetailWolfPayRequest` |
| v | `2.0` |
| NEED_ECODE / SESSION | **true / true** |
| Body 加密 | 无 |

**data：** `orderId`、`type`、`loginkey`（本地登录 key）、`pageurl`（默认 `http://m.damai.cn/orderlist.aspx`）

```http
POST https://mtop.damai.cn/gw/mtop.damai.wireless.order.getpayparam/2.0/ HTTP/1.1
Host: mtop.damai.cn
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Cookie: <登录态>
x-sign: <SecurityGuard>
x-sid: <sid>

data={"orderId":"1234567890123","type":"1","loginkey":"<login-key>","pageurl":"http://m.damai.cn/orderlist.aspx"}&type=originaljson
```

---

### 10.15 字段名对照速记

| 业务含义 | 座位相关接口 | 算价/下单 |
| --- | --- | --- |
| 场次 ID | `performanceId` | `performId` |
| 购买串 | — | `buyParam` = `itemId_count_skuId` |
| 渠道 | `dmChannel=*@damai_android_*` | 同左 / `subChannel=damai@tppnew_app` |
| AccessToken 签名 key | — | `166432f6316846fab25e5c39e9e57d71` |
| 查看项目 | `item.detail.getdetail` | — |
| 查看订单 | `wireless.order.orderdetail` v=2.0 | — |

### 10.16 登录 / 查看 / 下单速查（详细请求）

| 场景 | API | v | Session | Body 加密 | 额外签名 |
| --- | --- | --- | --- | --- | --- |
| 登录 | `mtop.taobao.alibabaMLoginService.login` | 1.0 | 否 | 无 | 网关 x-sign |
| Token | `mtop.damai.mxm.user.token.get` | 1.0 | 是 | 无 | 网关 x-sign |
| AccessToken | `mtop.damai.mxm.user.accesstoken.get` | 1.0 | 否* | 无 | **data.sign + 硬编码 key** + x-sign |
| 查看项目 | `mtop.damai.item.detail.getdetail` | 1.0 | 否 | 无 | x-sign |
| 查看订单 | `mtop.damai.wireless.order.orderdetail` | 2.0 | 是 | 无 | x-sign |
| 下单 | `mtop.damai.trade.order.create` | 1.0 | 是 | 无 | x-sign (+WUA) |

## 11. 数据来源与局限

- 接口名与字段来自 Frida dump 的 Request/Bean **public 字段**，不等于线上必调或必传。
- 响应壳为标准 MTOP：`api/v/ret/data`；业务体以类字段为准，未跟完的嵌套 Bean 需再抓包。
- **业务层：** 购票主链无 AES；唯一还原的业务密钥为 AccessToken 的 `166432f6316846fab25e5c39e9e57d71`。
- **网关层：** `x-sign` / WUA / ecode 由 MTOP + `SecurityGuard` 生成；本 dump **无**完整 `mtopsdk` 实现与 so 明文密钥 → 标注「需抓包/hook」，不编造可复现算法。
- 已搜关键字：`x-sign`、`encryptParameter`、`InnerSign`、`ProtocolParamBuilder`、`Cipher`（业务下单）、`toSignParamMap`、`SecurityGuardManagerWraper`。
- 原始清单：`_extract.json` / `_mtop_damai.txt`；smali：`unpack-output/106/frida-smali/`。
