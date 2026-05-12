/**
 * 统计分析 Mock 数据
 */
import { resultSuccess } from './_util';
import type { MockMethod } from 'fastify';

// 交易趋势数据
const trendData = [];
for (let i = 30; i >= 0; i--) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const orderCount = Math.floor(Math.random() * 500) + 800;
  const orderAmount = Math.floor(Math.random() * 100000) + 200000;
  const refundCount = Math.floor(Math.random() * 20) + 5;
  const refundAmount = Math.floor(Math.random() * 5000) + 1000;
  
  trendData.push({
    date: date.toISOString().split('T')[0],
    orderCount,
    orderAmount,
    refundCount,
    refundAmount,
  });
}

// 渠道统计数据
const channelStats = [
  {
    channel: 'WX_QR',
    channelName: '微信扫码',
    totalCount: 125680,
    totalAmount: '35862000.00',
    successCount: 121280,
    successAmount: '34621000.00',
    refundCount: 2560,
    refundAmount: '1256800.00',
    successRate: '96.5%',
  },
  {
    channel: 'ALI_QR',
    channelName: '支付宝扫码',
    totalCount: 98650,
    totalAmount: '28650000.00',
    successCount: 95850,
    successAmount: '27852000.00',
    refundCount: 1890,
    refundAmount: '798000.00',
    successRate: '97.2%',
  },
  {
    channel: 'CT_QR',
    channelName: '通联扫码',
    totalCount: 15680,
    totalAmount: '6850000.00',
    successCount: 14860,
    successAmount: '6502000.00',
    refundCount: 320,
    refundAmount: '148000.00',
    successRate: '94.8%',
  },
  {
    channel: 'HF_QR',
    channelName: '汇付扫码',
    totalCount: 10250,
    totalAmount: '4520000.00',
    successCount: 9900,
    successAmount: '4385000.00',
    refundCount: 180,
    refundAmount: '67500.00',
    successRate: '96.6%',
  },
  {
    channel: 'FY_QR',
    channelName: '富友扫码',
    totalCount: 8560,
    totalAmount: '3580000.00',
    successCount: 8250,
    successAmount: '3458000.00',
    refundCount: 156,
    refundAmount: '61200.00',
    successRate: '96.4%',
  },
  {
    channel: 'CITIC_QR',
    channelName: '中信银行扫码',
    totalCount: 5680,
    totalAmount: '4520000.00',
    successCount: 5600,
    successAmount: '4452000.00',
    refundCount: 58,
    refundAmount: '48000.00',
    successRate: '98.6%',
  },
];

// 商户统计数据
const merchantStats = [];
for (let i = 1; i <= 20; i++) {
  const totalCount = Math.floor(Math.random() * 10000) + 1000;
  const successCount = Math.floor(totalCount * 0.95);
  const refundCount = Math.floor(totalCount * 0.02);
  const totalAmount = totalCount * 120 + Math.random() * 10000;
  
  merchantStats.push({
    mchNo: 'M1000' + i,
    mchName: '测试商户00' + i,
    totalCount,
    totalAmount: totalAmount.toFixed(2),
    successCount,
    successAmount: (successCount * 120 + Math.random() * 9500).toFixed(2),
    refundCount,
    refundAmount: (refundCount * 80 + Math.random() * 1000).toFixed(2),
  });
}

export default [
  // 今日交易统计
  {
    url: '/basic-api/stat/trade/today',
    timeout: 500,
    method: 'get',
    response: () => {
      return resultSuccess({
        totalAmount: '386520.50',
        totalCount: 1256,
        successAmount: '382840.50',
        successCount: 1240,
        refundAmount: '3680.00',
        refundCount: 12,
        successRate: '98.72%',
      });
    },
  },

  // 交易趋势
  {
    url: '/basic-api/stat/trade/trend',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { type = 'day', startDate, endDate } = query;
      let filtered = [...trendData];
      
      if (startDate) {
        filtered = filtered.filter(item => item.date >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter(item => item.date <= endDate);
      }
      
      if (type === 'week') {
        const weekly = [];
        for (let i = 0; i < filtered.length; i += 7) {
          const weekData = filtered.slice(i, i + 7);
          if (weekData.length > 0) {
            weekly.push({
              date: weekData[0].date + ' ~ ' + weekData[weekData.length - 1].date,
              orderCount: weekData.reduce((sum, item) => sum + item.orderCount, 0),
              orderAmount: weekData.reduce((sum, item) => sum + item.orderAmount, 0),
              refundCount: weekData.reduce((sum, item) => sum + item.refundCount, 0),
              refundAmount: weekData.reduce((sum, item) => sum + item.refundAmount, 0),
            });
          }
        }
        return resultSuccess(weekly);
      }
      
      if (type === 'month') {
        const monthly = {};
        filtered.forEach(item => {
          const month = item.date.substring(0, 7);
          if (!monthly[month]) {
            monthly[month] = {
              date: month,
              orderCount: 0,
              orderAmount: 0,
              refundCount: 0,
              refundAmount: 0,
            };
          }
          monthly[month].orderCount += item.orderCount;
          monthly[month].orderAmount += item.orderAmount;
          monthly[month].refundCount += item.refundCount;
          monthly[month].refundAmount += item.refundAmount;
        });
        return resultSuccess(Object.values(monthly));
      }
      
      return resultSuccess(filtered);
    },
  },

  // 渠道统计
  {
    url: '/basic-api/stat/channel',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      const list = channelStats.slice(start, end);
      
      return resultSuccess({
        total: channelStats.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list,
      });
    },
  },

  // 商户统计
  {
    url: '/basic-api/stat/merchant',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      const list = merchantStats.slice(start, end);
      
      return resultSuccess({
        total: merchantStats.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list,
      });
    },
  },

  // 财务统计
  {
    url: '/basic-api/stat/finance',
    timeout: 500,
    method: 'get',
    response: () => {
      return resultSuccess({
        totalIncome: '5680000.00',
        totalExpense: '4560000.00',
        totalProfit: '1120000.00',
        pendingSettlement: '358000.00',
        totalSettlement: '5320000.00',
        totalWithdraw: '1240000.00',
      });
    },
  },
] as MockMethod[];
