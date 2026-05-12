/**
 * 分润管理 Mock 数据
 */
import { resultSuccess } from './_util';
import type { MockMethod } from 'vite-plugin-mock';

const mockAccountGroupList = [];
for (let i = 1; i <= 20; i++) {
  mockAccountGroupList.push({
    id: i,
    groupNo: 'G' + String(1000 + i),
    groupName: ['默认分账组', '代理商分账', '供应商分账', '员工分账'][i % 4],
    agentNo: i % 3 === 0 ? 'A10001' : null,
    mchNo: i % 2 === 0 ? 'M10001' : 'M10002',
    mchName: i % 2 === 0 ? '测试商户001' : '测试商户002',
    status: 1,
    statusName: '正常',
    remark: i % 5 === 0 ? '备注' + i : '',
    creator: 'admin',
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 60).toISOString().replace('T', ' ').substring(0, 19),
    updateTime: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString().replace('T', ' ').substring(0, 19),
  });
}

const mockReceiverList = [];
for (let i = 1; i <= 40; i++) {
  const channelTypes = [1, 2, 3, 4];
  const channelTypeIdx = i % 4;
  const channelTypes2 = ['微信', '支付宝', '通联', '中信银行'];
  const relationTypes = [1, 2, 3, 4];
  const relationTypeIdx = i % 4;
  const relationTypes2 = ['代理商', '供应商', '员工', '其他'];
  mockReceiverList.push({
    id: i,
    receiverNo: 'R' + String(1000 + i),
    groupNo: mockAccountGroupList[i % mockAccountGroupList.length]?.groupNo || 'G1001',
    groupName: mockAccountGroupList[i % mockAccountGroupList.length]?.groupName || '默认分账组',
    receiverType: channelTypes[channelTypeIdx],
    receiverTypeName: channelTypes2[channelTypeIdx],
    receiverName: ['张三', '李四', '王五', '赵六'][i % 4],
    receiverAccount: 'acc_' + String(100000 + i),
    bankName: ['中国工商银行', '中国建设银行', '中国农业银行', '中信银行'][i % 4],
    profitRatio: (0.05 + Math.random() * 0.15).toFixed(4),
    fixedAmount: i % 3 === 0 ? (Math.random() * 100 + 10).toFixed(2) : null,
    isDefault: i % 5 === 0 ? 1 : 0,
    status: Math.random() > 0.2 ? 1 : 0,
    statusName: Math.random() > 0.2 ? '正常' : '停用',
    relationType: relationTypes[relationTypeIdx],
    relationTypeName: relationTypes2[relationTypeIdx],
    remark: i % 6 === 0 ? '备注' + i : '',
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 90).toISOString().replace('T', ' ').substring(0, 19),
    updateTime: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString().replace('T', ' ').substring(0, 19),
  });
}

const mockProfitRecordList = [];
for (let i = 1; i <= 80; i++) {
  const statuses = [0, 1, 2, 3];
  const statusIdx = Math.floor(Math.random() * statuses.length);
  const profitRate = (0.05 + Math.random() * 0.15);
  const orderAmount = Math.random() * 5000 + 100;
  const profitAmount = orderAmount * profitRate;
  mockProfitRecordList.push({
    id: i,
    profitNo: 'PF' + Date.now().toString().slice(0, 8) + String(i).padStart(4, '0'),
    orderNo: 'ORD' + Date.now().toString().slice(0, 8) + String(i).padStart(6, '0'),
    mchNo: i % 3 === 0 ? 'M10001' : i % 3 === 1 ? 'M10002' : 'M10003',
    mchName: i % 3 === 0 ? '测试商户001' : i % 3 === 1 ? '测试商户002' : '测试商户003',
    channelCode: ['CITIC_QR', 'WX_QR', 'ALI_QR'][i % 3],
    channelName: ['中信银行', '微信', '支付宝'][i % 3],
    orderAmount: orderAmount.toFixed(2),
    profitAmount: profitAmount.toFixed(2),
    profitRate: profitRate.toFixed(4),
    profitType: i % 2 === 0 ? 1 : 2,
    profitTypeName: i % 2 === 0 ? '比例分账' : '金额分账',
    status: statuses[statusIdx],
    statusName: ['待分账', '分账中', '已分账', '分账失败'][statusIdx],
    settleTime: statusIdx === 2 ? new Date(Date.now() - Math.random() * 86400000).toISOString().replace('T', ' ').substring(0, 19) : null,
    remark: '',
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString().replace('T', ' ').substring(0, 19),
  });
}

const mockRollbackList = [];
for (let i = 1; i <= 30; i++) {
  const statuses = [0, 1, 2, 3];
  const statusIdx = Math.floor(Math.random() * statuses.length);
  const rollbackAmount = Math.random() * 500 + 10;
  const profitRate = 0.10;
  mockRollbackList.push({
    id: i,
    rollbackNo: 'RB' + Date.now().toString().slice(0, 8) + String(i).padStart(4, '0'),
    profitNo: 'PF' + Date.now().toString().slice(0, 8) + String(i).padStart(4, '0'),
    orderNo: 'ORD' + Date.now().toString().slice(0, 8) + String(i).padStart(6, '0'),
    refundNo: 'REF' + Date.now().toString().slice(0, 8) + String(i).padStart(4, '0'),
    mchNo: i % 2 === 0 ? 'M10001' : 'M10002',
    mchName: i % 2 === 0 ? '测试商户001' : '测试商户002',
    receiverNo: 'R' + String(1000 + (i % 10 + 1)),
    receiverName: ['张三', '李四', '王五', '赵六'][i % 4],
    receiverAccount: 'acc_' + String(100000 + (i % 10 + 1)),
    rollbackAmount: rollbackAmount.toFixed(2),
    profitAmount: (rollbackAmount / profitRate).toFixed(2),
    profitRate: profitRate.toFixed(4),
    rollbackType: i % 2 === 0 ? 1 : 2,
    rollbackTypeName: i % 2 === 0 ? '退款回退' : '人工回退',
    reason: i % 3 === 0 ? '订单退款' : i % 3 === 1 ? '分账失败' : '人工处理',
    status: statuses[statusIdx],
    statusName: ['待处理', '回退中', '已回退', '回退失败'][statusIdx],
    completeTime: statusIdx === 2 ? new Date(Date.now() - Math.random() * 86400000).toISOString().replace('T', ' ').substring(0, 19) : null,
    remark: '',
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString().replace('T', ' ').substring(0, 19),
    updateTime: new Date(Date.now() - Math.random() * 86400000 * 15).toISOString().replace('T', ' ').substring(0, 19),
  });
}

export default [
  // 账号组列表
  {
    url: '/basic-api/profit/account-group/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, groupName, mchNo, status } = query;
      let list = [...mockAccountGroupList];
      if (groupName) list = list.filter(item => item.groupName.includes(groupName));
      if (mchNo) list = list.filter(item => item.mchNo.includes(mchNo));
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  // 创建账号组
  {
    url: '/basic-api/profit/account-group',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ id: Date.now(), groupNo: 'G' + Date.now(), ...body, createdAt: new Date().toISOString() }),
  },
  // 更新账号组
  {
    url: '/basic-api/profit/account-group/:id',
    timeout: 500,
    method: 'put',
    response: () => resultSuccess(true),
  },
  // 收款账号列表
  {
    url: '/basic-api/profit/receiver/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, receiverName, status, receiverType } = query;
      let list = [...mockReceiverList];
      if (receiverName) list = list.filter(item => item.receiverName.includes(receiverName));
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      if (receiverType !== undefined && receiverType !== '') list = list.filter(item => item.receiverType === Number(receiverType));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  // 添加收款账号
  {
    url: '/basic-api/profit/receiver',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ id: Date.now(), receiverNo: 'R' + Date.now(), ...body, createdAt: new Date().toISOString() }),
  },
  // 更新收款账号
  {
    url: '/basic-api/profit/receiver/:id',
    timeout: 500,
    method: 'put',
    response: () => resultSuccess(true),
  },
  // 删除收款账号
  {
    url: '/basic-api/profit/receiver/:id',
    timeout: 300,
    method: 'delete',
    response: () => resultSuccess(true),
  },
  // 分账记录列表
  {
    url: '/basic-api/profit/record/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, profitNo, mchNo, status } = query;
      let list = [...mockProfitRecordList];
      if (profitNo) list = list.filter(item => item.profitNo.includes(profitNo));
      if (mchNo) list = list.filter(item => item.mchNo.includes(mchNo));
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  // 创建分账记录
  {
    url: '/basic-api/profit/record',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ id: Date.now(), profitNo: 'PF' + Date.now(), ...body, createdAt: new Date().toISOString() }),
  },
  // 结算分账记录
  {
    url: '/basic-api/profit/record/:id/settle',
    timeout: 500,
    method: 'put',
    response: () => resultSuccess(true),
  },
  // 回退记录列表
  {
    url: '/basic-api/profit/rollback/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, rollbackNo, profitNo, status } = query;
      let list = [...mockRollbackList];
      if (rollbackNo) list = list.filter(item => item.rollbackNo.includes(rollbackNo));
      if (profitNo) list = list.filter(item => item.profitNo.includes(profitNo));
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  // 创建回退记录
  {
    url: '/basic-api/profit/rollback',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ id: Date.now(), rollbackNo: 'RB' + Date.now(), ...body, createdAt: new Date().toISOString() }),
  },
  // 完成回退
  {
    url: '/basic-api/profit/rollback/:id/complete',
    timeout: 500,
    method: 'put',
    response: () => resultSuccess(true),
  },
] as MockMethod[];
