/**
 * 中信银行模块 Mock 数据
 * 路径与 src/api/config.ts 完全一致
 */
import { resultSuccess } from './_util';
import type { MockMethod } from 'vite-plugin-mock';

// 模拟账户信息
const mockAccount = {
  id: 'acc-001',
  accountNo: 'CITIC001',
  accountName: '道谷科技有限公司',
  accountType: 2,
  accountTypeName: '企业账户',
  accountAttr: 1,
  accountAttrName: '普通账户',
  bizUserId: 'BIZ001',
  balance: '2568000.00',
  availableBalance: '2518000.00',
  frozenBalance: '50000.00',
  pendingBalance: '0.00',
  status: 1,
  statusName: '正常',
  auditStatus: 1,
  channel: 'CITIC',
  mchNo: 'M10001',
  agentNo: 'A001',
  remark: '',
  createTime: '2024-01-01 10:00:00',
  updateTime: '2024-01-01 10:00:00',
};

// 模拟账户统计
const mockAccountStats = {
  balance: 2568000.00,
  availableBalance: 2518000.00,
  frozenBalance: 50000.00,
  pendingBalance: 0.00,
  totalIncome: 3865200.00,
  totalExpense: 2156800.00,
  todayIncome: 128560.00,
  todayExpense: 85600.00,
  todayNet: 42960.00,
  monthIncome: 3865200.00,
  monthExpense: 2156800.00,
  monthNet: 1708400.00,
};

// 模拟账户流水记录
const mockAccountRecords = [];
const recordBizTypes = [
  { bizType: 1, bizTypeName: '交易收入', remarks: ['扫码收入', '代付收入'] },
  { bizType: 2, bizTypeName: '交易支出', remarks: ['退款支出'] },
  { bizType: 3, bizTypeName: '冻结', remarks: ['代付冻结', '结算冻结'] },
  { bizType: 4, bizTypeName: '解冻', remarks: ['代付解冻', '结算解冻'] },
  { bizType: 5, bizTypeName: '资金归集', remarks: ['归集支出', '归集收入'] },
  { bizType: 6, bizTypeName: '分账支出', remarks: ['分账支出', '分账收入'] },
  { bizType: 7, bizTypeName: '代付', remarks: ['代付成功', '代付失败'] },
  { bizType: 8, bizTypeName: '结算', remarks: ['结算成功', '结算失败', 'D0结算申请', 'T1结算申请'] },
];
for (let i = 1; i <= 50; i++) {
  const bizTypeInfo = recordBizTypes[Math.floor(Math.random() * recordBizTypes.length)];
  const remark = bizTypeInfo.remarks[Math.floor(Math.random() * bizTypeInfo.remarks.length)];
  const amount = Math.random() > 0.5
    ? parseFloat((Math.random() * 10000 + 100).toFixed(2))
    : -parseFloat((Math.random() * 5000 + 100).toFixed(2));
  const balanceBefore = 2568000 - i * 500;
  mockAccountRecords.push({
    id: `rec-${i}`,
    recordNo: 'REC' + Date.now().toString().slice(0, 10) + i.toString().padStart(4, '0'),
    accountNo: 'CITIC001',
    accountName: '道谷科技有限公司',
    bizType: bizTypeInfo.bizType,
    bizTypeName: bizTypeInfo.bizTypeName,
    amount,
    balanceBefore,
    balanceAfter: balanceBefore + amount,
    orderNo: 'ORD' + (Date.now().toString().slice(0, 8)) + i.toString().padStart(6, '0'),
    oppositeAccountNo: 'CITIC002',
    oppositeAccountName: '子账户A',
    remark,
    createTime: new Date(Date.now() - i * 86400000).toISOString().replace('T', ' ').substring(0, 19),
  });
}

// 模拟银行卡列表
const mockCardList = [
  {
    id: 'card-001',
    bizUserId: 'BIZ001',
    accountNo: 'CITIC001',
    cardNo: '6212261234567890123',
    cardType: 1,
    cardTypeName: '对公账户',
    bankName: '中信银行',
    bankCode: '302000011',
    branchName: '北京朝阳支行',
    branchCode: '302100011',
    cardHolder: '道谷科技有限公司',
    certNo: '91110000XXXXXXXXX',
    phone: '13800138000',
    status: 1,
    statusName: '已绑定',
    bindTime: '2024-01-01 10:00:00',
    remark: '',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
  },
  {
    id: 'card-002',
    bizUserId: 'BIZ001',
    accountNo: 'CITIC001',
    cardNo: '6212261234567890124',
    cardType: 2,
    cardTypeName: '对私账户',
    bankName: '中信银行',
    bankCode: '302000011',
    branchName: '北京海淀支行',
    branchCode: '302100012',
    cardHolder: '张三',
    certNo: '110101199001011234',
    phone: '13900139000',
    status: 1,
    statusName: '已绑定',
    bindTime: '2024-01-05 14:30:00',
    remark: '',
    createTime: '2024-01-05 14:30:00',
    updateTime: '2024-01-05 14:30:00',
  },
  {
    id: 'card-003',
    bizUserId: 'BIZ001',
    accountNo: 'CITIC001',
    cardNo: '6212261234567890125',
    cardType: 2,
    cardTypeName: '对私账户',
    bankName: '中国工商银行',
    bankCode: '102100099',
    branchName: '上海浦东支行',
    branchCode: '102290099',
    cardHolder: '李四',
    certNo: '310101199002022345',
    phone: '13700137000',
    status: 0,
    statusName: '已解绑',
    bindTime: '2024-01-10 09:15:00',
    unbindTime: '2024-02-15 16:30:00',
    unbindReason: '用户主动解绑',
    remark: '',
    createTime: '2024-01-10 09:15:00',
    updateTime: '2024-02-15 16:30:00',
  },
  {
    id: 'card-004',
    bizUserId: 'BIZ001',
    accountNo: 'CITIC001',
    cardNo: '6212261234567890126',
    cardType: 2,
    cardTypeName: '对私账户',
    bankName: '中国建设银行',
    bankCode: '105100099',
    branchName: '深圳南山支行',
    branchCode: '105584099',
    cardHolder: '王五',
    certNo: '440301199003033456',
    phone: '13600136000',
    status: 1,
    statusName: '已绑定',
    bindTime: '2024-02-01 11:00:00',
    remark: '',
    createTime: '2024-02-01 11:00:00',
    updateTime: '2024-02-01 11:00:00',
  },
];

// 模拟归集列表
const mockCollectionList = [];
for (let i = 1; i <= 10; i++) {
  const types = [1, 2, 3];
  const typeNames = ['全额归集', '定额归集', '保留余额归集'];
  const typeIdx = (i % 3);
  mockCollectionList.push({
    id: `col-${i}`,
    collectionNo: 'COL' + Date.now().toString().slice(0, 8) + i.toString().padStart(4, '0'),
    fromAccountNo: 'SUB' + i.toString().padStart(3, '0'),
    fromAccountName: `子账户${['A', 'B', 'C', 'D', 'E'][i % 5]}`,
    toAccountNo: 'CITIC001',
    toAccountName: '道谷科技有限公司',
    collectionType: types[typeIdx],
    collectionTypeName: typeNames[typeIdx],
    collectionAmount: typeIdx === 1 ? 10000.00 : null,
    reservedAmount: typeIdx === 2 ? 5000.00 : null,
    status: Math.random() > 0.3 ? 1 : 0,
    statusName: Math.random() > 0.3 ? '成功' : '失败',
    relationStatus: 1,
    failReason: '',
    remark: '',
    createTime: new Date(Date.now() - i * 86400000 * 7).toISOString().replace('T', ' ').substring(0, 19),
    updateTime: new Date(Date.now() - i * 86400000 * 7).toISOString().replace('T', ' ').substring(0, 19),
  });
}

// 模拟分账列表
const mockProfitShareList = [];
for (let i = 1; i <= 20; i++) {
  const statuses = [1, 1, 1, 0, 2];
  const statusIdx = Math.floor(Math.random() * statuses.length);
  const shareTypes = [1, 2];
  const shareTypeIdx = i % 2;
  mockProfitShareList.push({
    id: `ps-${i}`,
    shareNo: 'PS' + Date.now().toString().slice(0, 8) + i.toString().padStart(4, '0'),
    orderNo: 'ORD' + Date.now().toString().slice(0, 8) + i.toString().padStart(6, '0'),
    accountNo: 'CITIC001',
    accountName: '道谷科技有限公司',
    receiverAccountNo: 'SUB' + (i % 5 + 1).toString().padStart(3, '0'),
    receiverName: `子账户${['A', 'B', 'C', 'D', 'E'][i % 5]}`,
    shareType: shareTypes[shareTypeIdx],
    shareTypeName: shareTypeIdx === 0 ? '比例分账' : '金额分账',
    shareRate: shareTypeIdx === 0 ? (10 + Math.random() * 20).toFixed(2) : null,
    shareAmount: parseFloat((Math.random() * 1000 + 100).toFixed(2)),
    orderAmount: parseFloat((Math.random() * 5000 + 1000).toFixed(2)),
    status: statuses[statusIdx],
    statusName: ['待处理', '成功', '失败', '处理中'][statusIdx],
    shareTime: statusIdx === 1 ? new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19) : null,
    failReason: statusIdx === 2 ? '余额不足' : '',
    remark: '',
    createTime: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19),
    updateTime: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19),
  });
}

// 模拟代付列表
const mockTransferList = [];
for (let i = 1; i <= 20; i++) {
  const statuses = [1, 1, 1, 3, 3, 0, 2];
  const statusIdx = Math.floor(Math.random() * statuses.length);
  const transferTypes = [1, 2, 3];
  const transferTypeIdx = i % 3;
  const transferTypeNames = ['直接代付', '批量代付', '商户提现'];
  const amount = parseFloat((Math.random() * 5000 + 500).toFixed(2));
  mockTransferList.push({
    id: `trf-${i}`,
    transferNo: 'TRF' + Date.now().toString().slice(0, 8) + i.toString().padStart(4, '0'),
    citicOrderNo: statusIdx === 1 ? 'CITIC' + Math.random().toString(36).substr(2, 16).toUpperCase() : null,
    accountNo: 'CITIC001',
    accountName: '道谷科技有限公司',
    receiverCardNo: '621226' + (1000000000 + i * 111111).toString(),
    receiverBankName: ['中信银行', '中国工商银行', '中国建设银行', '中国农业银行'][i % 4],
    receiverBankCode: ['302000011', '102100099', '105100099', '103100099'][i % 4],
    receiverBranchName: '北京' + ['朝阳', '海淀', '西城', '东城'][i % 4] + '支行',
    receiverBranchCode: '',
    receiverName: ['张三', '李四', '王五', '赵六'][i % 4],
    receiverPhone: '138' + (10000000 + i * 111111).toString(),
    amount,
    fee: parseFloat((amount * 0.002).toFixed(2)),
    actualAmount: parseFloat((amount * 0.998).toFixed(2)),
    transferType: transferTypes[transferTypeIdx],
    transferTypeName: transferTypeNames[transferTypeIdx],
    status: statuses[statusIdx],
    statusName: ['待处理', '成功', '失败', '处理中'][statusIdx],
    successTime: statusIdx === 1 ? new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19) : null,
    failReason: statusIdx === 2 ? '银行处理失败' : '',
    notifyTime: statusIdx === 1 ? new Date(Date.now() - i * 3600000 + 1000).toISOString().replace('T', ' ').substring(0, 19) : null,
    remark: '',
    createTime: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19),
    updateTime: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19),
  });
}

// 模拟结算列表
const mockSettlementList = [];
for (let i = 1; i <= 50; i++) {
  const statuses = [0, 1, 2, 2, 2, 3];
  const statusIdx = Math.floor(Math.random() * statuses.length);
  const settleTypes = [1, 2];
  const settleTypeIdx = i % 2;
  const settleTypeNames = ['D0结算', 'T1结算'];
  const amount = parseFloat((Math.random() * 50000 + 1000).toFixed(2));
  const rate = settleTypeIdx === 0 ? 0.0035 : 0.0025;
  const fee = parseFloat((amount * rate).toFixed(2));
  mockSettlementList.push({
    id: `stl-${i}`,
    settleNo: 'STL' + Date.now().toString().slice(0, 8) + i.toString().padStart(4, '0'),
    citicOrderNo: statusIdx === 2 ? 'CITIC' + Math.random().toString(36).substr(2, 16).toUpperCase() : null,
    accountNo: 'CITIC001',
    accountName: '道谷科技有限公司',
    settleType: settleTypes[settleTypeIdx],
    settleTypeName: settleTypeNames[settleTypeIdx],
    amount,
    fee,
    actualAmount: parseFloat((amount - fee).toFixed(2)),
    targetCardNo: '6212261234567890' + i.toString().padStart(3, '0'),
    targetBankName: ['中信银行', '中国工商银行'][i % 2],
    targetBankCode: ['302000011', '102100099'][i % 2],
    targetBranchName: '北京朝阳支行',
    targetBranchCode: '302100011',
    status: statuses[statusIdx],
    statusName: ['待处理', '处理中', '已结算', '已拒绝'][statusIdx],
    settleTime: statusIdx === 2 ? new Date(Date.now() - i * 86400000).toISOString().replace('T', ' ').substring(0, 19) : null,
    completeTime: statusIdx === 2 ? new Date(Date.now() - i * 86400000 + 1000).toISOString().replace('T', ' ').substring(0, 19) : null,
    failReason: statusIdx === 3 ? '余额不足' : '',
    remark: '',
    createTime: new Date(Date.now() - i * 86400000).toISOString().replace('T', ' ').substring(0, 19),
    updateTime: new Date(Date.now() - i * 86400000).toISOString().replace('T', ' ').substring(0, 19),
  });
}

// 模拟对账列表
const mockCheckList = [];
for (let i = 1; i <= 30; i++) {
  const checkDate = new Date();
  checkDate.setDate(checkDate.getDate() - i);
  const totalCount = Math.floor(Math.random() * 500) + 100;
  const successRate = 0.9 + Math.random() * 0.08;
  const successCount = Math.floor(totalCount * successRate);
  const refundRate = 0.01 + Math.random() * 0.02;
  const refundCount = Math.floor(totalCount * refundRate);
  const failCount = totalCount - successCount - refundCount;
  const totalAmount = parseFloat((totalCount * (100 + Math.random() * 100)).toFixed(2));
  const successAmount = parseFloat((successCount * (100 + Math.random() * 100)).toFixed(2));
  const failAmount = parseFloat((failCount * (100 + Math.random() * 100)).toFixed(2));
  const refundAmount = parseFloat((refundCount * (50 + Math.random() * 50)).toFixed(2));
  const diffCount = Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0;
  const diffAmount = parseFloat((diffCount * (20 + Math.random() * 30)).toFixed(2));

  mockCheckList.push({
    id: `chk-${i}`,
    checkNo: 'CHK' + checkDate.toISOString().split('T')[0].replace(/-/g, ''),
    checkDate: checkDate.toISOString().split('T')[0],
    checkType: 1,
    checkTypeName: '交易对账',
    channelCode: ['CITIC_QR', 'WX_QR', 'ALI_QR', 'CT_QR'][i % 4],
    channelName: ['中信银行扫码', '微信扫码', '支付宝扫码', '通联扫码'][i % 4],
    totalCount,
    totalAmount,
    successCount,
    successAmount,
    failCount,
    failAmount,
    refundCount,
    refundAmount,
    diffCount,
    diffAmount,
    status: diffCount > 0 ? 1 : 2,
    statusName: diffCount > 0 ? '有差异' : '已平账',
    filePath: null,
    fileUrl: null,
    remark: '',
    createTime: checkDate.toISOString().replace('T', ' ').substring(0, 19),
    updateTime: checkDate.toISOString().replace('T', ' ').substring(0, 19),
  });
}

// 模拟对账差异明细
const mockCheckDiffs = [];
for (let i = 1; i <= 20; i++) {
  const diffTypes = [1, 2];
  const diffTypeNames = ['金额差异', '状态不一致'];
  const diffTypeIdx = Math.floor(Math.random() * 2);
  mockCheckDiffs.push({
    id: `diff-${i}`,
    checkNo: mockCheckList[0].checkNo,
    orderNo: 'ORD' + Date.now().toString().slice(0, 8) + i.toString().padStart(6, '0'),
    tradeNo: 'TRD' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    channelOrderNo: 'CHN' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    amount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
    channelAmount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
    diffAmount: parseFloat((Math.random() * 50 + 1).toFixed(2)),
    diffType: diffTypes[diffTypeIdx],
    diffTypeName: diffTypeNames[diffTypeIdx],
    handleStatus: Math.random() > 0.6 ? 1 : 0,
    handleStatusName: Math.random() > 0.6 ? '已确认' : '待处理',
    remark: '',
    createTime: new Date(Date.now() - i * 86400000).toISOString().replace('T', ' ').substring(0, 19),
  });
}

export default [
  // ========== 账户管理 ==========
  {
    url: '/basic-api/citic/account/list',
    timeout: 300,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const list = [mockAccount];
      return resultSuccess({ total: 1, page: Number(page), pageSize: Number(pageSize), list });
    },
  },
  {
    url: '/basic-api/citic/account/info',
    timeout: 300,
    method: 'get',
    response: () => resultSuccess(mockAccount),
  },
  {
    url: '/basic-api/citic/account/stats',
    timeout: 300,
    method: 'get',
    response: () => resultSuccess(mockAccountStats),
  },
  {
    url: '/basic-api/citic/account/balance',
    timeout: 300,
    method: 'get',
    response: () => resultSuccess({
      accountNo: mockAccount.accountNo,
      accountName: mockAccount.accountName,
      balance: mockAccount.balance,
      availableBalance: mockAccount.availableBalance,
      frozenBalance: mockAccount.frozenBalance,
      pendingBalance: mockAccount.pendingBalance,
      currency: 'CNY',
      queryTime: new Date().toISOString(),
    }),
  },
  {
    url: '/basic-api/citic/account/records',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, bizType, startDate, endDate } = query;
      let list = [...mockAccountRecords];
      if (bizType !== undefined && bizType !== '') {
        list = list.filter(item => item.bizType === Number(bizType));
      }
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, end) });
    },
  },
  {
    url: '/basic-api/citic/account/register',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ ...body, id: 'new-' + Date.now(), createTime: new Date().toISOString() }),
  },

  // ========== 银行卡管理 ==========
  {
    url: '/basic-api/citic/card/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, cardNo, accountName, bankName, cardType, status } = query;
      let list = [...mockCardList];
      if (cardNo) list = list.filter(item => item.cardNo.includes(cardNo));
      if (accountName) list = list.filter(item => item.cardHolder?.includes(accountName));
      if (bankName) list = list.filter(item => item.bankName.includes(bankName));
      if (cardType !== undefined && cardType !== '') list = list.filter(item => item.cardType === Number(cardType));
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  {
    url: '/basic-api/citic/card/bind',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ id: 'new-' + Date.now(), ...body, status: 1, bindTime: new Date().toISOString().replace('T', ' ').substring(0, 19), createTime: new Date().toISOString() }),
  },
  {
    url: '/basic-api/citic/card/unbind',
    timeout: 300,
    method: 'post',
    response: () => resultSuccess({ status: 0, unbindTime: new Date().toISOString().replace('T', ' ').substring(0, 19) }),
  },
  {
    url: '/basic-api/citic/card/:id',
    timeout: 300,
    method: 'delete',
    response: () => resultSuccess(true),
  },

  // ========== 资金归集 ==========
  {
    url: '/basic-api/citic/collection/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, fromAccountNo, toAccountNo, collectionType, relationStatus } = query;
      let list = [...mockCollectionList];
      if (fromAccountNo) list = list.filter(item => item.fromAccountNo.includes(fromAccountNo));
      if (toAccountNo) list = list.filter(item => item.toAccountNo.includes(toAccountNo));
      if (collectionType !== undefined && collectionType !== '') list = list.filter(item => item.collectionType === Number(collectionType));
      if (relationStatus !== undefined && relationStatus !== '') list = list.filter(item => item.relationStatus === Number(relationStatus));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  {
    url: '/basic-api/citic/collection/set',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ id: 'new-' + Date.now(), collectionNo: 'COL' + Date.now(), ...body, status: 0, relationStatus: 1, createTime: new Date().toISOString() }),
  },
  {
    url: '/basic-api/citic/collection/active',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ success: true, collectionNo: body.collectionNo, amount: 10000.00, status: 'SUCCESS' }),
  },
  {
    url: '/basic-api/citic/collection/:id',
    timeout: 300,
    method: 'delete',
    response: () => resultSuccess(true),
  },

  // ========== 余额分账 ==========
  {
    url: '/basic-api/citic/profit-share/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, accountNo, orderNo, status } = query;
      let list = [...mockProfitShareList];
      if (accountNo) list = list.filter(item => item.accountNo.includes(accountNo));
      if (orderNo) list = list.filter(item => item.orderNo.includes(orderNo));
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  {
    url: '/basic-api/citic/profit-share/execute',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ success: true, shareNo: 'PS' + Date.now(), accountNo: body.accountNo, shareAmount: body.shareAmount, status: 'SUCCESS' }),
  },
  {
    url: '/basic-api/citic/profit-share/:id',
    timeout: 300,
    method: 'delete',
    response: () => resultSuccess(true),
  },

  // ========== 代付打款 ==========
  {
    url: '/basic-api/citic/transfer/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, transferNo, status, transferType } = query;
      let list = [...mockTransferList];
      if (transferNo) list = list.filter(item => item.transferNo.includes(transferNo));
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      if (transferType !== undefined && transferType !== '') list = list.filter(item => item.transferType === Number(transferType));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  {
    url: '/basic-api/citic/transfer/pay',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ success: true, transferNo: 'TRF' + Date.now(), amount: body.amount, fee: body.fee, status: 'PROCESSING' }),
  },
  {
    url: '/basic-api/citic/transfer/query',
    timeout: 300,
    method: 'get',
    response: ({ query }) => {
      const item = mockTransferList.find(t => t.transferNo === query.transferNo);
      return resultSuccess(item || mockTransferList[0]);
    },
  },
  {
    url: '/basic-api/citic/transfer/confirm',
    timeout: 300,
    method: 'post',
    response: ({ body }) => resultSuccess({ success: body.success, transferNo: body.transferNo, citicOrderNo: 'CITIC' + Math.random().toString(36).substr(2, 16).toUpperCase() }),
  },

  // ========== 结算管理 ==========
  {
    url: '/basic-api/citic/settlement/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, settleNo, settleType, status } = query;
      let list = [...mockSettlementList];
      if (settleNo) list = list.filter(item => item.settleNo.includes(settleNo));
      if (settleType !== undefined && settleType !== '') list = list.filter(item => item.settleType === Number(settleType));
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  {
    url: '/basic-api/citic/settlement/apply',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ settleNo: 'STL' + Date.now(), amount: body.amount, fee: body.amount * 0.0035, actualAmount: body.amount * 0.9965, status: 'PROCESSING' }),
  },
  {
    url: '/basic-api/citic/settlement/confirm',
    timeout: 300,
    method: 'post',
    response: ({ body }) => resultSuccess({ success: body.success, settleNo: body.settleNo }),
  },
  {
    url: '/basic-api/citic/settlement/cancel',
    timeout: 300,
    method: 'post',
    response: ({ body }) => resultSuccess({ settleNo: body.settleNo, status: 'FAILED', failReason: '用户取消' }),
  },

  // ========== 对账管理 ==========
  {
    url: '/basic-api/citic/check/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, checkDate, channelCode, status } = query;
      let list = [...mockCheckList];
      if (checkDate) list = list.filter(item => item.checkDate === checkDate);
      if (channelCode) list = list.filter(item => item.channelCode === channelCode);
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  {
    url: '/basic-api/citic/check/trigger',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ checkNo: 'CHK' + body.checkDate.replace(/-/g, ''), taskId: 'TASK' + Date.now(), status: 'PENDING' }),
  },
  {
    url: '/basic-api/citic/check/download',
    timeout: 500,
    method: 'get',
    response: ({ query }) => resultSuccess({
      fileUrl: `/downloads/citic_check_${query.checkDate}_${query.channelCode || 'ALL'}.xlsx`,
      fileName: `中信银行对账单_${query.checkDate}_${query.channelCode || 'ALL'}.xlsx`,
    }),
  },
  {
    url: '/basic-api/citic/check/diff/list',
    timeout: 300,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const total = mockCheckDiffs.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: mockCheckDiffs.slice(start, start + Number(pageSize)) });
    },
  },
  {
    url: '/basic-api/citic/check/diff/confirm',
    timeout: 300,
    method: 'post',
    response: ({ body }) => resultSuccess({ confirmedCount: body.diffIds?.length || 1, checkNo: body.checkNo }),
  },

  // ========== 自动调度服务 ==========
  {
    url: '/basic-api/citic/auto/check',
    timeout: 1000,
    method: 'post',
    response: ({ body }) => resultSuccess({
      success: true,
      checkNo: 'CHK' + body.checkDate.replace(/-/g, ''),
      totalCount: 100,
      successCount: 98,
      failCount: 1,
      diffCount: 1,
      diffAmount: 50.00,
    }),
  },
  {
    url: '/basic-api/citic/auto/settlement',
    timeout: 1000,
    method: 'post',
    response: ({ body }) => resultSuccess({
      success: true,
      settleNo: 'STL' + Date.now(),
      amount: 10000,
      fee: 35,
      actualAmount: 9965,
    }),
  },
  {
    url: '/basic-api/citic/auto/profit-share',
    timeout: 1000,
    method: 'post',
    response: ({ body }) => resultSuccess({
      success: true,
      shareNo: 'PS' + Date.now(),
      totalShareAmount: body.receivers?.reduce((s: number, r: any) => s + (r.shareAmount || 0), 0) || 0,
      results: body.receivers?.map((r: any) => ({ receiverAccountNo: r.accountNo, shareAmount: r.shareAmount || 0, status: 'SUCCESS' })) || [],
    }),
  },
  {
    url: '/basic-api/citic/auto/collection',
    timeout: 1000,
    method: 'post',
    response: () => resultSuccess({ success: true, totalCollected: 50000, results: [] }),
  },
  {
    url: '/basic-api/citic/auto/configs',
    timeout: 300,
    method: 'get',
    response: () => resultSuccess({
      checkConfig: { enabled: true, checkTime: '02:00', channels: ['CITIC_QR', 'WX_QR', 'ALI_QR'], autoConfirmDiff: true, diffThreshold: 100 },
      settlementConfig: { enabled: true, settleType: 2, minAmount: 100, maxAmount: 500000, settleTimeStart: '09:00', settleTimeEnd: '17:00', feeRates: { d0: 0.0035, t1: 0.0025 } },
      profitShareConfig: { enabled: true, shareType: 1, platformShareRate: 20, autoShareOnTrade: true },
      collectionConfig: { enabled: true, collectionType: 1, collectionTime: '23:00', accounts: [] },
    }),
  },
  {
    url: '/basic-api/citic/auto/configs',
    timeout: 300,
    method: 'post',
    response: () => resultSuccess({ success: true }),
  },
] as MockMethod[];
