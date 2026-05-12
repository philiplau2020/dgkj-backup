/**
 * DGKJ 支付平台 - 统一 API 配置
 *
 * 本文件定义了所有 API 的基础路径前缀，确保前后端接口一致性
 *
 * 重要：开发环境使用 Mock，数据路径为 /basic-api/*
 * 生产环境使用真实后端，路径为 /api/*
 *
 * API 路由结构 (Mock 路径):
 * - /basic-api/login           - 登录
 * - /basic-api/logout          - 登出
 * - /basic-api/getUserInfo     - 获取用户信息
 * - /basic-api/getPermCode     - 获取权限码
 * - /basic-api/sys/*           - 系统管理
 * - /basic-api/mch/*           - 商户管理
 * - /basic-api/agent/*         - 代理管理
 * - /basic-api/trade/*         - 交易管理
 * - /basic-api/finance/*       - 财务管理
 * - /basic-api/channel/*       - 通道管理
 * - /basic-api/citic/*         - 兴业管理
 * - /basic-api/statistics/*     - 统计管理
 * - /basic-api/device/*        - 设备管理
 * - /basic-api/check/*         - 对账管理
 * - /basic-api/profit/*        - 分润管理
 */

export const API_BASE = '/basic-api';

export const ApiPath = {
  // 认证模块 - Java 后端使用 /auth 前缀
  Login: `${API_BASE}/auth/login`,
  Logout: `${API_BASE}/auth/logout`,
  GetUserInfo: `${API_BASE}/auth/userinfo`,

  // 系统管理
  SysUserList: `${API_BASE}/sys/user/list`,
  SysUser: `${API_BASE}/sys/user`,
  SysRoleList: `${API_BASE}/sys/role/list`,
  SysRole: `${API_BASE}/sys/role`,
  SysMenuList: `${API_BASE}/sys/menu/list`,
  SysMenu: `${API_BASE}/sys/menu`,
  SysDeptList: `${API_BASE}/sys/dept/list`,
  SysDept: `${API_BASE}/sys/dept`,
  SysDictList: `${API_BASE}/sys/dict/list`,
  SysDictData: `${API_BASE}/sys/dict/data`,
  SysConfigList: `${API_BASE}/sys/config/list`,
  SysLogList: `${API_BASE}/sys/log/list`,
  SysNoticeList: `${API_BASE}/sys/notice/list`,
  SysNotice: `${API_BASE}/sys/notice`,

  // 商户管理 (注意: Mock 使用 merchant 前缀)
  MchList: `${API_BASE}/merchant/list`,
  Mch: `${API_BASE}/merchant`,
  MchReview: `${API_BASE}/merchant/audit`,
  MchAppList: `${API_BASE}/mch/app/list`,
  MchApp: `${API_BASE}/mch/app`,
  MchStoreList: `${API_BASE}/mch/store/list`,
  MchStore: `${API_BASE}/mch/store`,
  MchRateList: `${API_BASE}/mch/rate/list`,
  MchRate: `${API_BASE}/mch/rate`,

  // 代理管理 (注意: Mock 使用 agent 前缀)
  AgentList: `${API_BASE}/agent/list`,
  Agent: `${API_BASE}/agent`,
  AgentInfo: `${API_BASE}/agent/info`,
  AgentStats: `${API_BASE}/agent/stats`,
  AgentReview: `${API_BASE}/agent/audit`,
  AgentAuditList: `${API_BASE}/agent/audit/list`,
  AgentProfitList: `${API_BASE}/agent/profit/list`,
  AgentWithdrawList: `${API_BASE}/agent/withdraw/list`,
  AgentWithdraw: `${API_BASE}/agent/withdraw`,
  AgentWithdrawReview: `${API_BASE}/agent/withdraw/review`,

  // 交易管理 (注意: Mock 使用 order 前缀而非 trade/order)
  TradeOrderList: `${API_BASE}/order/list`,
  TradeOrder: `${API_BASE}/order`,
  TradeOrderInfo: `${API_BASE}/order/info`,
  TradeOrderStats: `${API_BASE}/order/stats`,
  TradeOrderClose: `${API_BASE}/order/close`,
  TradeRefundList: `${API_BASE}/refund/list`,
  TradeRefund: `${API_BASE}/refund`,
  TradeRefundApply: `${API_BASE}/refund/apply`,
  TradeTransferList: `${API_BASE}/trade/transfer/list`,
  TradeTransfer: `${API_BASE}/trade/transfer`,
  TradeNotifyList: `${API_BASE}/trade/notify/list`,
  TradeNotifyResend: `${API_BASE}/trade/notify/resend`,

  // 财务管理 (注意: Mock 使用 account 前缀)
  FinanceAccountList: `${API_BASE}/account/list`,
  FinanceAccount: `${API_BASE}/account`,
  FinanceAccountInfo: `${API_BASE}/account/info`,
  FinanceRecordList: `${API_BASE}/account/record`,
  FinanceSettlementList: `${API_BASE}/finance/settlement/list`,
  FinanceSettlement: `${API_BASE}/finance/settlement`,
  FinanceSettlementReview: `${API_BASE}/finance/settlement/review`,
  FinanceWithdrawList: `${API_BASE}/finance/withdraw/list`,
  FinanceWithdraw: `${API_BASE}/finance/withdraw`,
  FinanceStatementList: `${API_BASE}/finance/statement/list`,

  // 通道管理 (注意: Mock 使用 channel 前缀)
  ChannelList: `${API_BASE}/channel/mch/list`,
  Channel: `${API_BASE}/channel/mch`,
  ChannelRouteList: `${API_BASE}/channel/route/list`,
  ChannelPoolList: `${API_BASE}/pool/channel/list`,
  ChannelPool: `${API_BASE}/pool/channel`,
  ChannelStrategyList: `${API_BASE}/pool/rule/list`,
  ChannelStrategy: `${API_BASE}/pool/rule`,
  ChannelRecommend: `${API_BASE}/pool/channel/recommend`,
  ChannelMchList: `${API_BASE}/channel/mch/list`,
  ChannelMch: `${API_BASE}/channel/mch`,
  ChannelRoute: `${API_BASE}/channel/route`,
  ChannelPoolInfo: `${API_BASE}/pool/channel/info`,
  ChannelPoolStats: `${API_BASE}/pool/channel/stats`,
  ChannelPoolAdd: `${API_BASE}/pool/channel/add`,
  ChannelPoolUpdate: `${API_BASE}/pool/channel/update`,
  ChannelPoolDelete: `${API_BASE}/pool/channel/delete`,
  ChannelPoolToggle: `${API_BASE}/pool/channel/toggle`,

  // 兴业管理
  CiticAccountList: `${API_BASE}/citic/account/list`,
  CiticAccount: `${API_BASE}/citic/account`,
  CiticCardList: `${API_BASE}/citic/card/list`,
  CiticCard: `${API_BASE}/citic/card`,
  CiticSettlementList: `${API_BASE}/citic/settlement/list`,
  CiticSettlement: `${API_BASE}/citic/settlement`,
  CiticSettlementReview: `${API_BASE}/citic/settlement/review`,
  CiticCheckList: `${API_BASE}/citic/check/list`,
  CiticCheck: `${API_BASE}/citic/check`,

  // 统计管理 (注意: Mock 使用 stat 前缀)
  StatisticsDashboard: `${API_BASE}/stat/trade/today`,
  StatisticsTradeList: `${API_BASE}/stat/trade/trend`,
  StatisticsTradeTrend: `${API_BASE}/stat/trade/trend`,
  StatisticsTradePayType: `${API_BASE}/stat/channel`,
  StatisticsMerchantList: `${API_BASE}/stat/merchant`,
  StatisticsAgentList: `${API_BASE}/agent/list`,
  StatisticsChannelList: `${API_BASE}/stat/channel`,
  StatisticsFinanceList: `${API_BASE}/stat/finance`,

  // 设备管理
  DeviceList: `${API_BASE}/device/list`,
  Device: `${API_BASE}/device`,
  DeviceBind: `${API_BASE}/device/bind`,
  DeviceCodeList: `${API_BASE}/device/code/list`,
  DeviceCode: `${API_BASE}/device/code`,
  DeviceQrcodeList: `${API_BASE}/device/qrcode/list`,
  DeviceSpeakerList: `${API_BASE}/device/speaker/list`,
  DevicePrinterList: `${API_BASE}/device/printer/list`,
  DevicePosList: `${API_BASE}/device/pos/list`,

  // 对账管理
  CheckBatchList: `${API_BASE}/check/batch/list`,
  CheckBatch: `${API_BASE}/check/batch`,
  CheckBatchReview: `${API_BASE}/check/batch/review`,
  CheckChannelBillList: `${API_BASE}/check/channel-bill/list`,
  CheckChannelBill: `${API_BASE}/check/channel-bill`,
  CheckDiffBillList: `${API_BASE}/check/diff-bill/list`,
  CheckDiffBillHandle: `${API_BASE}/check/diff-bill/handle`,

  // 分润管理
  ProfitAccountGroupList: `${API_BASE}/profit/account-group/list`,
  ProfitAccountGroup: `${API_BASE}/profit/account-group`,
  ProfitReceiverList: `${API_BASE}/profit/receiver/list`,
  ProfitReceiver: `${API_BASE}/profit/receiver`,
  ProfitRecordList: `${API_BASE}/profit/record/list`,
  ProfitRollbackList: `${API_BASE}/profit/rollback/list`,
  ProfitRollback: `${API_BASE}/profit/rollback`,
} as const;

export default ApiPath;
