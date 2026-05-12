/**
 * 交易管理 Mock 数据
 */
import { resultSuccess } from './_util';
import type { MockMethod } from 'fastify';

// 模拟订单数据
const mockOrderList = [];
const channels = ['WX_QR', 'ALI_QR', 'CT_QR', 'HF_QR', 'FY_QR', 'CITIC_QR'];
const channelNames = ['微信扫码', '支付宝扫码', '通联扫码', '汇付扫码', '富友扫码', '中信银行扫码'];
const statuses = [0, 1, 2, 3, 4];
const statusNames = ['待支付', '支付中', '已支付', '已取消', '已退款'];

for (let i = 1; i <= 100; i++) {
  const channelIndex = Math.floor(Math.random() * channels.length);
  const statusIndex = Math.floor(Math.random() * statuses.length);
  const amount = Math.floor(Math.random() * 10000) + 100;
  
  mockOrderList.push({
    id: i,
    orderNo: 'P' + Date.now().toString().slice(0, 10) + i.toString().padStart(4, '0'),
    mchNo: i % 2 === 0 ? 'M10001' : 'M10002',
    mchName: i % 2 === 0 ? '测试商户001' : '测试商户002',
    amount: amount.toFixed(2),
    payChannel: channels[channelIndex],
    payChannelName: channelNames[channelIndex],
    channelOrderNo: channels[channelIndex].substring(0, 2) + Date.now().toString().slice(0, 8) + i.toString().padStart(4, '0'),
    status: statuses[statusIndex],
    statusName: statusNames[statusIndex],
    subject: '测试订单' + i,
    payTime: statusIndex === 2 ? new Date(Date.now() - Math.random() * 86400000 * 7).toISOString() : null,
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
  });
}

// 已关闭订单
const mockCloseList = mockOrderList.filter(item => item.status === 3);

// 退款订单
const mockRefundList = mockOrderList
  .filter(item => item.status === 4)
  .map((item, index) => ({
    ...item,
    refundNo: 'R' + item.orderNo.substring(1),
    refundAmount: (Number(item.amount) * 0.5).toFixed(2),
    refundTime: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
    refundReason: index % 2 === 0 ? '用户申请退款' : '重复支付退款',
  }));

export default [
  // 订单列表
  {
    url: '/basic-api/order/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, mchNo, orderNo, status, payChannel } = query;
      let filteredList = [...mockOrderList];
      
      if (mchNo) {
        filteredList = filteredList.filter(item => item.mchNo.includes(mchNo));
      }
      if (orderNo) {
        filteredList = filteredList.filter(item => item.orderNo.includes(orderNo));
      }
      if (status !== undefined && status !== '') {
        filteredList = filteredList.filter(item => item.status === Number(status));
      }
      if (payChannel) {
        filteredList = filteredList.filter(item => item.payChannel === payChannel);
      }
      
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      const list = filteredList.slice(start, end);
      
      return resultSuccess({
        total: filteredList.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list,
      });
    },
  },

  // 订单详情
  {
    url: '/basic-api/order/info/:orderNo',
    timeout: 300,
    method: 'get',
    response: ({ pathParams }) => {
      const order = mockOrderList.find(item => item.orderNo === pathParams.orderNo);
      return resultSuccess(order);
    },
  },

  // 订单统计
  {
    url: '/basic-api/order/stats',
    timeout: 500,
    method: 'get',
    response: () => {
      const paidOrders = mockOrderList.filter(item => item.status === 2);
      const totalAmount = paidOrders.reduce((sum, item) => sum + Number(item.amount), 0);
      
      return resultSuccess({
        totalCount: mockOrderList.length,
        paidCount: paidOrders.length,
        totalAmount: totalAmount.toFixed(2),
        todayCount: Math.floor(Math.random() * 100) + 50,
        todayAmount: (Math.floor(Math.random() * 50000) + 10000).toFixed(2),
      });
    },
  },

  // 退款列表
  {
    url: '/basic-api/refund/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      const list = mockRefundList.slice(start, end);
      
      return resultSuccess({
        total: mockRefundList.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list,
      });
    },
  },

  // 已关闭订单列表
  {
    url: '/basic-api/trade/close/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      const list = mockCloseList.slice(start, end);
      
      return resultSuccess({
        total: mockCloseList.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list,
      });
    },
  },

  // 申请退款
  {
    url: '/basic-api/refund/apply',
    timeout: 500,
    method: 'post',
    response: () => {
      return resultSuccess('R' + Date.now());
    },
  },

  // 关闭订单
  {
    url: '/basic-api/order/close/:orderNo',
    timeout: 300,
    method: 'post',
    response: () => {
      return resultSuccess(true);
    },
  },
] as MockMethod[];
