/**
 * 财务管理 Mock 数据
 */
import { resultSuccess } from './_util';
import type { MockMethod } from 'fastify';

// 模拟账户数据
const mockAccountList = [
  {
    id: 1,
    accountNo: 'A10001',
    mchNo: 'M10001',
    mchName: '测试商户001',
    balance: '10000.00',
    frozenBalance: '500.00',
    availableBalance: '9500.00',
    totalIncome: '50000.00',
    totalExpense: '40000.00',
  },
  {
    id: 2,
    accountNo: 'A10002',
    mchNo: 'M10002',
    mchName: '测试商户002',
    balance: '5000.00',
    frozenBalance: '0.00',
    availableBalance: '5000.00',
    totalIncome: '30000.00',
    totalExpense: '25000.00',
  },
  {
    id: 3,
    accountNo: 'A10003',
    mchNo: 'M10003',
    mchName: '待审核商户',
    balance: '0.00',
    frozenBalance: '0.00',
    availableBalance: '0.00',
    totalIncome: '0.00',
    totalExpense: '0.00',
  },
];

// 模拟账务记录
const mockRecordList = [];
for (let i = 1; i <= 100; i++) {
  const changeTypes = [1, 2, 3, 4];
  const changeTypeNames = ['收入', '支出', '冻结', '解冻'];
  const typeIndex = Math.floor(Math.random() * changeTypes.length);
  const mch = mockAccountList[Math.floor(Math.random() * mockAccountList.length)];
  
  mockRecordList.push({
    id: i,
    recordNo: 'R' + Date.now().toString().slice(0, 10) + i.toString().padStart(4, '0'),
    accountNo: mch.accountNo,
    mchNo: mch.mchNo,
    changeType: changeTypes[typeIndex],
    changeTypeName: changeTypeNames[typeIndex],
    amount: (Math.random() * 1000).toFixed(2),
    balanceBefore: (Math.random() * 10000).toFixed(2),
    balanceAfter: (Math.random() * 10000).toFixed(2),
    bizOrderNo: 'P' + Date.now().toString().slice(0, 10) + i.toString().padStart(4, '0'),
    bizOrderType: typeIndex === 1 ? '结算' : '交易',
    remark: typeIndex === 1 ? '商户结算' : '支付收入',
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
  });
}

// 模拟结算列表
const mockSettlementList = [];
for (let i = 1; i <= 50; i++) {
  const statusIndex = Math.floor(Math.random() * 2);
  const mch = mockAccountList[Math.floor(Math.random() * mockAccountList.length)];
  
  mockSettlementList.push({
    id: i,
    settleNo: 'S' + Date.now().toString().slice(0, 10) + i.toString().padStart(4, '0'),
    mchNo: mch.mchNo,
    mchName: mch.mchName,
    amount: (Math.random() * 5000 + 100).toFixed(2),
    fee: (Math.random() * 50 + 5).toFixed(2),
    actualAmount: (Math.random() * 4950 + 95).toFixed(2),
    bankName: '中国工商银行',
    bankAccount: '622202****' + (1000 + i),
    bankUserName: '张三',
    status: statusIndex,
    statusName: statusIndex === 0 ? '待处理' : '已结算',
    settleTime: statusIndex === 1 ? new Date(Date.now() - Math.random() * 86400000 * 7).toISOString() : null,
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 14).toISOString(),
  });
}

// 模拟代付列表
const mockWithdrawList = [];
for (let i = 1; i <= 30; i++) {
  const statusIndex = Math.floor(Math.random() * 2);
  const mch = mockAccountList[Math.floor(Math.random() * mockAccountList.length)];
  
  mockWithdrawList.push({
    id: i,
    withdrawNo: 'W' + Date.now().toString().slice(0, 10) + i.toString().padStart(4, '0'),
    mchNo: mch.mchNo,
    mchName: mch.mchName,
    amount: (Math.random() * 2000 + 100).toFixed(2),
    fee: (Math.random() * 20 + 2).toFixed(2),
    actualAmount: (Math.random() * 1980 + 98).toFixed(2),
    bankName: '中国建设银行',
    bankAccount: '621700****' + (2000 + i),
    realName: '张三',
    status: statusIndex,
    statusText: statusIndex === 0 ? '处理中' : '已完成',
    notifyTime: statusIndex === 1 ? new Date(Date.now() - Math.random() * 86400000).toISOString() : null,
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
  });
}

// 对账单列表
const mockStatementList = [];
for (let i = 1; i <= 30; i++) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const statusIndex = Math.floor(Math.random() * 3);
  const totalAmount = Math.random() * 100000 + 10000;
  const successAmount = totalAmount * (0.9 + Math.random() * 0.1);
  const failAmount = totalAmount - successAmount;
  
  mockStatementList.push({
    id: i,
    statementNo: 'ST' + date.toISOString().split('T')[0].replace(/-/g, ''),
    statDate: date.toISOString().split('T')[0],
    totalAmount: totalAmount.toFixed(2),
    successAmount: successAmount.toFixed(2),
    failAmount: failAmount.toFixed(2),
    totalCount: Math.floor(Math.random() * 500) + 100,
    diffAmount: statusIndex === 2 ? (Math.random() * 100).toFixed(2) : '0.00',
    status: statusIndex,
    statusText: statusIndex === 0 ? '未对账' : statusIndex === 1 ? '有差异' : '已平账',
  });
}

export default [
  // 账户列表
  {
    url: '/basic-api/account/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      
      return resultSuccess({
        total: mockAccountList.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list: mockAccountList.slice(start, end),
      });
    },
  },

  // 账户详情
  {
    url: '/basic-api/account/info/:mchNo',
    timeout: 300,
    method: 'get',
    response: ({ pathParams }) => {
      const account = mockAccountList.find(item => item.mchNo === pathParams.mchNo);
      return resultSuccess(account);
    },
  },

  // 账户记录
  {
    url: '/basic-api/account/record',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, mchNo, changeType } = query;
      let filteredList = [...mockRecordList];
      
      if (mchNo) {
        filteredList = filteredList.filter(item => item.mchNo === mchNo);
      }
      if (changeType !== undefined && changeType !== '') {
        filteredList = filteredList.filter(item => item.changeType === Number(changeType));
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

  // 结算列表
  {
    url: '/basic-api/finance/settlement/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, mchNo, status } = query;
      let filteredList = [...mockSettlementList];
      
      if (mchNo) {
        filteredList = filteredList.filter(item => item.mchNo.includes(mchNo));
      }
      if (status !== undefined && status !== '') {
        filteredList = filteredList.filter(item => item.status === Number(status));
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

  // 代付列表
  {
    url: '/basic-api/finance/withdraw/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      const list = mockWithdrawList.slice(start, end);
      
      return resultSuccess({
        total: mockWithdrawList.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list,
      });
    },
  },

  // 对账单列表
  {
    url: '/basic-api/finance/statement/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      const list = mockStatementList.slice(start, end);
      
      return resultSuccess({
        total: mockStatementList.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list,
      });
    },
  },
] as MockMethod[];
