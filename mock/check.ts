/**
 * 对账管理 Mock 数据
 */
import { resultSuccess } from './_util';
import type { MockMethod } from 'vite-plugin-mock';

const mockBatchList = [];
for (let i = 1; i <= 50; i++) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const totalCount = Math.floor(Math.random() * 500) + 100;
  const successRate = 0.9 + Math.random() * 0.08;
  const successCount = Math.floor(totalCount * successRate);
  const failCount = totalCount - successCount;
  const diffCount = Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0;
  const totalAmount = parseFloat((totalCount * (100 + Math.random() * 100)).toFixed(2));
  const successAmount = parseFloat((successCount * (100 + Math.random() * 100)).toFixed(2));
  const failAmount = totalAmount - successAmount;
  const channelCodes = ['CITIC_QR', 'WX_QR', 'ALI_QR', 'CT_QR'];
  const channelNames = ['中信银行', '微信', '支付宝', '通联'];
  const channelIdx = i % 4;
  const status = diffCount > 0 ? 1 : 2;
  mockBatchList.push({
    id: i,
    batchNo: 'BATCH' + date.toISOString().split('T')[0].replace(/-/g, '') + String(i).padStart(4, '0'),
    checkDate: date.toISOString().split('T')[0],
    checkType: 1,
    checkTypeName: '交易对账',
    channelCode: channelCodes[channelIdx],
    channelName: channelNames[channelIdx],
    totalCount,
    totalAmount,
    successCount,
    successAmount,
    failCount,
    failAmount,
    diffCount,
    diffAmount: diffCount > 0 ? parseFloat((diffCount * (20 + Math.random() * 30)).toFixed(2)) : 0,
    status,
    statusName: status === 1 ? '有差异' : '已平账',
    completeTime: new Date(Date.now() - i * 86400000).toISOString(),
    remark: '',
    createdAt: date.toISOString().replace('T', ' ').substring(0, 19),
    updateTime: date.toISOString().replace('T', ' ').substring(0, 19),
  });
}

const mockChannelBillList = [];
for (let i = 1; i <= 100; i++) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(i / 3));
  const billTypes = [1, 2];
  const billTypeIdx = Math.floor(Math.random() * 2);
  const tradeStatus = Math.random() > 0.05 ? 1 : 0;
  const channelCodes = ['CITIC_QR', 'WX_QR', 'ALI_QR', 'CT_QR'];
  const channelNames = ['中信银行', '微信', '支付宝', '通联'];
  const channelIdx = i % 4;
  mockChannelBillList.push({
    id: i,
    billNo: 'BILL' + Date.now().toString().slice(0, 8) + String(i).padStart(4, '0'),
    batchNo: mockBatchList[Math.floor(Math.random() * Math.min(mockBatchList.length, 10))]?.batchNo || '',
    channelCode: channelCodes[channelIdx],
    channelName: channelNames[channelIdx],
    channelOrderNo: 'CHN' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    mchNo: i % 3 === 0 ? 'M10001' : i % 3 === 1 ? 'M10002' : 'M10003',
    mchName: i % 3 === 0 ? '测试商户001' : i % 3 === 1 ? '测试商户002' : '测试商户003',
    orderNo: 'ORD' + Date.now().toString().slice(0, 8) + String(i).padStart(6, '0'),
    payType: ['wx_native', 'alipay_qr', 'unionpay'][i % 3],
    amount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
    fee: parseFloat((Math.random() * 5 + 0.1).toFixed(2)),
    status: tradeStatus,
    statusName: tradeStatus === 1 ? '成功' : '失败',
    tradeTime: date.toISOString().replace('T', ' ').substring(0, 19),
    remark: '',
    createdAt: date.toISOString().replace('T', ' ').substring(0, 19),
  });
}

const mockDiffBillList = [];
for (let i = 1; i <= 30; i++) {
  const diffTypes = [1, 2];
  const diffTypeIdx = Math.floor(Math.random() * 2);
  const diffAmount = parseFloat((Math.random() * 50 + 1).toFixed(2));
  mockDiffBillList.push({
    id: i,
    diffNo: 'DIFF' + Date.now().toString().slice(0, 8) + String(i).padStart(4, '0'),
    batchNo: mockBatchList[Math.floor(Math.random() * Math.min(mockBatchList.length, 5))]?.batchNo || '',
    orderNo: 'ORD' + Date.now().toString().slice(0, 8) + String(i).padStart(6, '0'),
    tradeNo: 'TRD' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    channelOrderNo: 'CHN' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    mchNo: i % 2 === 0 ? 'M10001' : 'M10002',
    mchName: i % 2 === 0 ? '测试商户001' : '测试商户002',
    ifCode: ['CITIC_QR', 'WX_QR', 'ALI_QR'][i % 3],
    ifCodeName: ['中信银行', '微信', '支付宝'][i % 3],
    amount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
    channelAmount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
    diffAmount,
    diffType: diffTypes[diffTypeIdx],
    diffTypeName: ['长款', '短款'][diffTypeIdx],
    status: Math.random() > 0.6 ? 1 : 0,
    statusName: Math.random() > 0.6 ? '已确认' : '待处理',
    handleRemark: '',
    handleTime: null,
    handleUserId: null,
    createTime: new Date(Date.now() - i * 86400000).toISOString().replace('T', ' ').substring(0, 19),
    updateTime: new Date(Date.now() - i * 86400000).toISOString().replace('T', ' ').substring(0, 19),
  });
}

export default [
  // 对账批次列表
  {
    url: '/basic-api/check/batch/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, batchNo, channelCode, status, checkDate } = query;
      let list = [...mockBatchList];
      if (batchNo) list = list.filter(item => item.batchNo.includes(batchNo));
      if (channelCode) list = list.filter(item => item.channelCode === channelCode);
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      if (checkDate) list = list.filter(item => item.checkDate === checkDate);
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  // 创建对账批次
  {
    url: '/basic-api/check/batch',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ id: Date.now(), batchNo: 'BATCH' + Date.now(), ...body, status: 0, createdAt: new Date().toISOString() }),
  },
  // 审核对账批次
  {
    url: '/basic-api/check/batch/:id/review',
    timeout: 300,
    method: 'put',
    response: () => resultSuccess(true),
  },
  // 渠道账单列表
  {
    url: '/basic-api/check/channel-bill/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, batchNo, channelCode, billType, status } = query;
      let list = [...mockChannelBillList];
      if (batchNo) list = list.filter(item => item.batchNo.includes(batchNo));
      if (channelCode) list = list.filter(item => item.channelCode === channelCode);
      if (billType !== undefined && billType !== '') list = list.filter(item => item.status === Number(billType));
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  // 创建渠道账单
  {
    url: '/basic-api/check/channel-bill',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ id: Date.now(), ...body, createdAt: new Date().toISOString() }),
  },
  // 差异账单列表
  {
    url: '/basic-api/check/diff-bill/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, batchNo, orderNo, diffType, status } = query;
      let list = [...mockDiffBillList];
      if (batchNo) list = list.filter(item => item.batchNo.includes(batchNo));
      if (orderNo) list = list.filter(item => item.orderNo.includes(orderNo));
      if (diffType !== undefined && diffType !== '') list = list.filter(item => item.diffType === Number(diffType));
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  // 处理差异账单
  {
    url: '/basic-api/check/diff-bill/:id/handle',
    timeout: 300,
    method: 'put',
    response: ({ body, pathParams }) => resultSuccess({ id: pathParams.id, ...body, status: 1, handleTime: new Date().toISOString() }),
  },
  // 处理差异账单 (备用路由)
  {
    url: '/basic-api/check/diff-bill/handle',
    timeout: 300,
    method: 'post',
    response: ({ body }) => resultSuccess({ success: true, ...body }),
  },
] as MockMethod[];
