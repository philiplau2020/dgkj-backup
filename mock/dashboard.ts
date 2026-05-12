/**
 * 首页统计数据
 */
import { resultSuccess } from './_util';
import type { MockMethod } from 'fastify';

export default [
  {
    url: '/basic-api/stat/dashboard/today',
    timeout: 500,
    method: 'get',
    response: () => {
      return resultSuccess({
        totalAmount: '158802.88',
        totalCount: 1256,
        successAmount: '156802.88',
        successCount: 1238,
        amountGrowth: 9.01,
        countGrowth: 8.65,
      });
    },
  },
  {
    url: '/basic-api/stat/dashboard/account',
    timeout: 500,
    method: 'get',
    response: () => {
      return resultSuccess({
        totalBalance: '385000.00',
        frozenBalance: '8000.00',
        availableBalance: '377000.00',
      });
    },
  },
  {
    url: '/basic-api/stat/dashboard/merchant',
    timeout: 500,
    method: 'get',
    response: () => {
      return resultSuccess({
        totalCount: 100,
        activeCount: 85,
        auditPendingCount: 3,
      });
    },
  },
  {
    url: '/basic-api/stat/dashboard/channel',
    timeout: 500,
    method: 'get',
    response: () => {
      return resultSuccess([
        { channelName: '微信扫码', amount: 68000 },
        { channelName: '支付宝扫码', amount: 52000 },
        { channelName: '银联扫码', amount: 28000 },
        { channelName: '中信银行', amount: 10802.88 },
      ]);
    },
  },
  {
    url: '/basic-api/stat/dashboard/trend',
    timeout: 500,
    method: 'get',
    response: () => {
      const trend = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        trend.push({
          date: date.toISOString().split('T')[0],
          amount: (Math.random() * 50000 + 100000).toFixed(2),
          count: Math.floor(Math.random() * 300 + 800),
        });
      }
      return resultSuccess(trend);
    },
  },
  {
    url: '/basic-api/stat/dashboard/pending',
    timeout: 500,
    method: 'get',
    response: () => {
      return resultSuccess([
        { title: '商户审核', desc: '待审核商户入网申请', count: 3 },
        { title: '代理商审核', desc: '待审核代理商申请', count: 2 },
        { title: '退款申请', desc: '待处理退款订单', count: 5 },
        { title: '结算申请', desc: '待确认结算请求', count: 8 },
      ]);
    },
  },
  {
    url: '/basic-api/stat/dashboard/recent',
    timeout: 500,
    method: 'get',
    response: () => {
      return resultSuccess([
        { orderNo: 'DG202605110001', mchName: '测试商户A', amount: '1280.00', statusText: '已支付', createdAt: '14:05:32' },
        { orderNo: 'DG202605110002', mchName: '测试商户B', amount: '560.00', statusText: '待支付', createdAt: '14:04:18' },
        { orderNo: 'DG202605110003', mchName: '测试商户C', amount: '3280.00', statusText: '已支付', createdAt: '14:03:45' },
        { orderNo: 'DG202605110004', mchName: '测试商户A', amount: '880.00', statusText: '支付中', createdAt: '14:02:11' },
        { orderNo: 'DG202605110005', mchName: '测试商户D', amount: '1580.00', statusText: '已支付', createdAt: '14:01:33' },
      ]);
    },
  },
] as MockMethod[];
