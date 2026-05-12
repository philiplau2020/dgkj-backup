/**
 * 支付平台完整菜单 Mock 数据
 * 与 src/router/routes/modules/*.ts 保持完全一致
 */
import { MockMethod } from 'vite-plugin-mock';
import { resultSuccess, getRequestToken, requestParams } from '../_util';

const allMenus = [
  // 仪表盘
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: 'LAYOUT',
    redirect: '/dashboard/analysis',
    meta: { title: '仪表盘', icon: 'carbon:dashboard', hideChildrenInMenu: true },
    children: [
      {
        path: 'analysis',
        name: 'Analysis',
        component: '/dashboard/analysis/index',
        meta: { title: '数据概览', hideMenu: true, hideBreadcrumb: true, currentActiveMenu: '/dashboard' },
      },
    ],
  },

  // 运维监控
  {
    path: '/ops',
    name: 'Ops',
    component: 'LAYOUT',
    redirect: '/ops/overview',
    meta: { title: '运维监控', icon: 'ant-design:monitor-outlined' },
    children: [
      { path: 'overview', name: 'OpsOverview', component: '/ops/overview/index', meta: { title: '综合概览' } },
      { path: 'server', name: 'OpsServer', component: '/ops/server/index', meta: { title: '服务器监控' } },
      { path: 'service', name: 'OpsService', component: '/ops/service/index', meta: { title: '服务监控' } },
      { path: 'app', name: 'OpsApp', component: '/ops/app/index', meta: { title: '应用监控' } },
      { path: 'network', name: 'OpsNetwork', component: '/ops/network/index', meta: { title: '网络监控' } },
      { path: 'business', name: 'OpsBusiness', component: '/ops/business/index', meta: { title: '业务指标' } },
      { path: 'log', name: 'OpsLog', component: '/ops/log/index', meta: { title: '日志监控' } },
      { path: 'alert', name: 'OpsAlert', component: '/ops/alert/index', meta: { title: '告警中心' } },
    ],
  },

  // 开放平台
  {
    path: '/open-platform',
    name: 'OpenPlatform',
    component: 'LAYOUT',
    redirect: '/open-platform/overview',
    meta: { title: '开放平台', icon: 'ant-design:api-outlined' },
    children: [
      { path: 'overview', name: 'OpenPlatformOverview', component: '/open-platform/overview/index', meta: { title: '平台首页' } },
      { path: 'developer', name: 'OpenPlatformDeveloper', component: '/open-platform/developer/index', meta: { title: '开发者中心' } },
      { path: 'document', name: 'OpenPlatformDocument', component: '/open-platform/document/index', meta: { title: 'API文档' } },
      { path: 'debug', name: 'OpenPlatformDebug', component: '/open-platform/debug/index', meta: { title: '在线调试' } },
      { path: 'webhook', name: 'OpenPlatformWebhook', component: '/open-platform/developer/webhook', meta: { title: 'Webhook管理' } },
    ],
  },

  // 系统管理
  {
    path: '/system',
    name: 'System',
    component: 'LAYOUT',
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'ion:settings-outline' },
    children: [
      { path: 'user', name: 'SystemUser', component: '/sys/user/index', meta: { title: '操作员管理' } },
      { path: 'role', name: 'SystemRole', component: '/sys/role/index', meta: { title: '角色管理' } },
      { path: 'dept', name: 'SystemDept', component: '/sys/dept/index', meta: { title: '团队管理' } },
      { path: 'menu', name: 'SystemMenu', component: '/sys/menu/index', meta: { title: '菜单权限' } },
      { path: 'dict', name: 'SystemDict', component: '/sys/dict/index', meta: { title: '字典管理' } },
      { path: 'config', name: 'SystemConfig', component: '/sys/config/index', meta: { title: '系统配置' } },
      { path: 'log', name: 'SystemLog', component: '/sys/log/index', meta: { title: '系统日志' } },
    ],
  },

  // 商户管理
  {
    path: '/merchant',
    name: 'Merchant',
    component: 'LAYOUT',
    redirect: '/merchant/list',
    meta: { title: '商户管理', icon: 'ant-design:shop-outlined' },
    children: [
      { path: 'list', name: 'MerchantList', component: '/mch/list/index', meta: { title: '商户列表' } },
      { path: 'app', name: 'MerchantApp', component: '/mch/app/index', meta: { title: '应用列表' } },
      { path: 'entry', name: 'MerchantEntry', component: '/mch/entry/index', meta: { title: '进件管理' } },
      { path: 'store', name: 'MerchantStore', component: '/mch/store/index', meta: { title: '门店管理' } },
      { path: 'rate', name: 'MerchantRate', component: '/mch/rate/index', meta: { title: '商户费率' } },
    ],
  },

  // 交易管理
  {
    path: '/trade',
    name: 'Trade',
    component: 'LAYOUT',
    redirect: '/trade/order',
    meta: { title: '订单管理', icon: 'ant-design:swap-outlined' },
    children: [
      { path: 'order', name: 'TradeOrder', component: '/trade/order/index', meta: { title: '支付订单' } },
      { path: 'refund', name: 'TradeRefund', component: '/trade/refund/index', meta: { title: '退款订单' } },
      { path: 'transfer', name: 'TradeTransfer', component: '/trade/transfer/index', meta: { title: '转账订单' } },
      { path: 'notify', name: 'TradeNotify', component: '/trade/notify/index', meta: { title: '商户通知' } },
      { path: 'withdraw', name: 'TradeWithdraw', component: '/trade/withdraw/index', meta: { title: '提现记录' } },
    ],
  },

  // 账户中心
  {
    path: '/finance',
    name: 'Finance',
    component: 'LAYOUT',
    redirect: '/finance/account',
    meta: { title: '账户中心', icon: 'ant-design:account-book-outlined' },
    children: [
      { path: 'account', name: 'FinanceAccount', component: '/finance/account/index', meta: { title: '账户信息' } },
      { path: 'record', name: 'FinanceRecord', component: '/finance/record/index', meta: { title: '账务记录' } },
      { path: 'settlement', name: 'FinanceSettlement', component: '/finance/settlement/index', meta: { title: '结算管理' } },
      { path: 'withdraw', name: 'FinanceWithdraw', component: '/finance/withdraw/index', meta: { title: '提现管理' } },
      { path: 'statement', name: 'FinanceStatement', component: '/finance/statement/index', meta: { title: '对账报表' } },
    ],
  },

  // 渠道管理
  {
    path: '/channel',
    name: 'Channel',
    component: 'LAYOUT',
    redirect: '/channel/config',
    meta: { title: '渠道管理', icon: 'ant-design:api-outlined' },
    children: [
      { path: 'config', name: 'ChannelConfig', component: '/channel/config/index', meta: { title: '渠道配置' } },
      { path: 'mch', name: 'ChannelMch', component: '/channel/mch/index', meta: { title: '通道商户' } },
      { path: 'route', name: 'ChannelRoute', component: '/channel/route/index', meta: { title: '路由配置' } },
    ],
  },

  // 代理商管理
  {
    path: '/agent',
    name: 'Agent',
    component: 'LAYOUT',
    redirect: '/agent/list',
    meta: { title: '代理商管理', icon: 'ant-design:team-outlined' },
    children: [
      { path: 'list', name: 'AgentList', component: '/agent/list/index', meta: { title: '代理商列表' } },
      { path: 'audit', name: 'AgentAudit', component: '/agent/audit/index', meta: { title: '代理商审核' } },
      { path: 'profit', name: 'AgentProfit', component: '/agent/profit/index', meta: { title: '佣金管理' } },
      { path: 'withdraw', name: 'AgentWithdraw', component: '/agent/withdraw/index', meta: { title: '提现申请' } },
    ],
  },

  // 数据统计
  {
    path: '/statistics',
    name: 'Statistics',
    component: 'LAYOUT',
    redirect: '/statistics/trade',
    meta: { title: '数据统计', icon: 'ant-design:bar-chart-outlined' },
    children: [
      { path: 'trade', name: 'StatTrade', component: '/statistics/trade/index', meta: { title: '交易统计' } },
      { path: 'merchant', name: 'StatMerchant', component: '/statistics/merchant/index', meta: { title: '商户统计' } },
      { path: 'agent', name: 'StatAgent', component: '/statistics/agent/index', meta: { title: '代理商统计' } },
      { path: 'channel', name: 'StatChannel', component: '/statistics/channel/index', meta: { title: '通道统计' } },
      { path: 'finance', name: 'StatFinance', component: '/statistics/finance/index', meta: { title: '财务统计' } },
    ],
  },

  // 中信银行E管家
  {
    path: '/citic',
    name: 'Citic',
    component: 'LAYOUT',
    redirect: '/citic/account',
    meta: { title: '中信银行E管家', icon: 'cib:ccdic' },
    children: [
      { path: 'account', name: 'CiticAccount', component: '/citic/account/index', meta: { title: '账户管理' } },
      { path: 'card', name: 'CiticCard', component: '/citic/card/index', meta: { title: '银行卡管理' } },
      { path: 'collection', name: 'CiticCollection', component: '/citic/collection/index', meta: { title: '资金归集' } },
      { path: 'profit-share', name: 'CiticProfitShare', component: '/citic/profit-share/index', meta: { title: '余额分账' } },
      { path: 'transfer', name: 'CiticTransfer', component: '/citic/transfer/index', meta: { title: '代付打款' } },
      { path: 'settle', name: 'CiticSettle', component: '/citic/settle/index', meta: { title: '结算管理' } },
      { path: 'check', name: 'CiticCheck', component: '/citic/check/index', meta: { title: '对账管理' } },
    ],
  },

  // 对账管理
  {
    path: '/check',
    name: 'Check',
    component: 'LAYOUT',
    redirect: '/check/batch',
    meta: { title: '对账管理', icon: 'ant-design:reconciliation-outlined' },
    children: [
      { path: 'batch', name: 'CheckBatch', component: '/check/batch/index', meta: { title: '对账批次' } },
      { path: 'channel-bill', name: 'CheckChannelBill', component: '/check/channel-bill/index', meta: { title: '渠道账单' } },
      { path: 'diff-bill', name: 'CheckDiffBill', component: '/check/diff-bill/index', meta: { title: '差异账单' } },
    ],
  },

  // 分账管理
  {
    path: '/profit',
    name: 'Profit',
    component: 'LAYOUT',
    redirect: '/profit/account-group',
    meta: { title: '分账管理', icon: 'ant-design:percentage-outlined' },
    children: [
      { path: 'account-group', name: 'ProfitAccountGroup', component: '/profit/account-group/index', meta: { title: '账号组管理' } },
      { path: 'receiver', name: 'ProfitReceiver', component: '/profit/receiver/index', meta: { title: '收款账号管理' } },
      { path: 'record', name: 'ProfitRecord', component: '/profit/record/index', meta: { title: '分账记录' } },
      { path: 'rollback', name: 'ProfitRollback', component: '/profit/rollback/index', meta: { title: '分账回退记录' } },
    ],
  },

  // 设备配置
  {
    path: '/device',
    name: 'Device',
    component: 'LAYOUT',
    redirect: '/device/code',
    meta: { title: '设备配置', icon: 'ant-design:mobile-outlined' },
    children: [
      { path: 'code', name: 'DeviceCode', component: '/device/code/index', meta: { title: '码牌管理' } },
      { path: 'speaker', name: 'DeviceSpeaker', component: '/device/speaker/index', meta: { title: '云喇叭' } },
      { path: 'printer', name: 'DevicePrinter', component: '/device/printer/index', meta: { title: '云打印' } },
      { path: 'pos', name: 'DevicePos', component: '/device/pos/index', meta: { title: '扫码POS' } },
      { path: 'activation', name: 'DeviceActivation', component: '/device/activation/index', meta: { title: '激活码管理' } },
    ],
  },

  // 轮转池管理
  {
    path: '/pool',
    name: 'Pool',
    component: 'LAYOUT',
    redirect: '/pool/index',
    meta: { title: '轮转池管理', icon: 'ant-design:swap-outlined' },
    children: [
      { path: 'index', name: 'PoolIndex', component: '/pool/index', meta: { title: '轮转池管理' } },
    ],
  },

  // 关于
  {
    path: '/about',
    name: 'About',
    component: 'LAYOUT',
    redirect: '/about/index',
    meta: { title: '关于', icon: 'ant-design:info-circle-outlined' },
    children: [
      { path: 'index', name: 'AboutPage', component: '/sys/about/index', meta: { title: '关于', hideMenu: true } },
    ],
  },
];

export default [
  {
    url: '/basic-api/getMenuList',
    timeout: 500,
    method: 'get',
    response: (request: requestParams) => {
      const token = getRequestToken(request);
      if (!token) return resultSuccess([]);
      return resultSuccess(allMenus);
    },
  },
] as MockMethod[];
