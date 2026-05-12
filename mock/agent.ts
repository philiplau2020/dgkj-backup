/**
 * 代理管理模块 Mock 数据
 */
import { resultSuccess } from './_util';
import type { MockMethod } from 'fastify';

// 模拟代理商数据
const mockAgentList = [
  {
    id: 1,
    agentNo: 'A10001',
    agentName: '一级代理商',
    agentType: 1,
    agentTypeName: '一级代理',
    parentAgentNo: null,
    contactName: '张一',
    contactMobile: '13800001001',
    email: 'zhangyi@example.com',
    status: 1,
    statusName: '正常',
    totalMerchant: 25,
    totalProfit: '125680.00',
    balance: '35800.00',
    createdAt: '2024-01-01 10:00:00',
  },
  {
    id: 2,
    agentNo: 'A10002',
    agentName: '二级代理商A',
    agentType: 2,
    agentTypeName: '二级代理',
    parentAgentNo: 'A10001',
    contactName: '张二',
    contactMobile: '13800001002',
    email: 'zhanger@example.com',
    status: 1,
    statusName: '正常',
    totalMerchant: 12,
    totalProfit: '45680.00',
    balance: '12600.00',
    createdAt: '2024-01-05 14:30:00',
  },
  {
    id: 3,
    agentNo: 'A10003',
    agentName: '二级代理商B',
    agentType: 2,
    agentTypeName: '二级代理',
    parentAgentNo: 'A10001',
    contactName: '张三',
    contactMobile: '13800001003',
    email: 'zhangsan@example.com',
    status: 1,
    statusName: '正常',
    totalMerchant: 8,
    totalProfit: '28650.00',
    balance: '8500.00',
    createdAt: '2024-01-10 09:15:00',
  },
  {
    id: 4,
    agentNo: 'A10004',
    agentName: '待审核代理商',
    agentType: 1,
    agentTypeName: '一级代理',
    parentAgentNo: null,
    contactName: '张四',
    contactMobile: '13800001004',
    email: 'zhangsi@example.com',
    status: 0,
    statusName: '待审核',
    totalMerchant: 0,
    totalProfit: '0.00',
    balance: '0.00',
    createdAt: '2024-01-20 16:45:00',
  },
  {
    id: 5,
    agentNo: 'A10005',
    agentName: '已冻结代理商',
    agentType: 2,
    agentTypeName: '二级代理',
    parentAgentNo: 'A10002',
    contactName: '张五',
    contactMobile: '13800001005',
    email: 'zhangwu@example.com',
    status: 2,
    statusName: '冻结',
    totalMerchant: 3,
    totalProfit: '12500.00',
    balance: '0.00',
    createdAt: '2024-01-08 11:20:00',
  },
];

// 模拟分润记录
const mockProfitList = [];
for (let i = 1; i <= 100; i++) {
  const agent = mockAgentList[Math.floor(Math.random() * mockAgentList.length)];
  const mch = ['M10001', 'M10002', 'M10003', 'M10004'][Math.floor(Math.random() * 4)];
  const tradeAmount = (Math.random() * 5000 + 100).toFixed(2);
  const profitRate = [0.002, 0.003, 0.004][Math.floor(Math.random() * 3)];
  
  mockProfitList.push({
    id: i,
    profitNo: 'PF' + Date.now().toString().slice(0, 10) + i.toString().padStart(4, '0'),
    agentNo: agent.agentNo,
    agentName: agent.agentName,
    mchNo: mch,
    mchName: '测试商户00' + mch.slice(-1),
    orderNo: 'P' + Date.now().toString().slice(0, 10) + i.toString().padStart(4, '0'),
    tradeAmount,
    profitRate: profitRate.toString(),
    profitAmount: (Number(tradeAmount) * profitRate).toFixed(2),
    settleStatus: Math.random() > 0.3 ? 1 : 0,
    settleStatusName: Math.random() > 0.3 ? '已结算' : '待结算',
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
  });
}

export default [
  // 代理商列表
  {
    url: '/basic-api/agent/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, agentNo, agentName, status } = query;
      let filteredList = [...mockAgentList];
      
      if (agentNo) {
        filteredList = filteredList.filter(item => item.agentNo.includes(agentNo));
      }
      if (agentName) {
        filteredList = filteredList.filter(item => item.agentName.includes(agentName));
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

  // 代理商详情
  {
    url: '/basic-api/agent/info/:agentNo',
    timeout: 300,
    method: 'get',
    response: ({ pathParams }) => {
      const agent = mockAgentList.find(item => item.agentNo === pathParams.agentNo);
      return resultSuccess(agent);
    },
  },

  // 创建代理商
  {
    url: '/basic-api/agent/create',
    timeout: 500,
    method: 'post',
    response: () => {
      return resultSuccess('A' + Date.now());
    },
  },

  // 更新代理商
  {
    url: '/basic-api/agent/update/:agentNo',
    timeout: 500,
    method: 'post',
    response: () => {
      return resultSuccess(true);
    },
  },

  // 代理商统计
  {
    url: '/basic-api/agent/stats',
    timeout: 300,
    method: 'get',
    response: () => {
      const activeAgents = mockAgentList.filter(item => item.status === 1);
      return resultSuccess({
        totalAgent: mockAgentList.length,
        activeAgent: activeAgents.length,
        totalMerchant: activeAgents.reduce((sum, item) => sum + item.totalMerchant, 0),
        totalProfit: activeAgents.reduce((sum, item) => sum + Number(item.totalProfit), 0).toFixed(2),
        pendingAudit: mockAgentList.filter(item => item.status === 0).length,
      });
    },
  },

  // 代理商审核列表
  {
    url: '/basic-api/agent/audit/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const auditList = mockAgentList
        .filter(item => item.status === 0)
        .map(item => ({
          id: item.id,
          auditNo: 'AUD' + item.agentNo,
          agentNo: item.agentNo,
          agentName: item.agentName,
          agentType: item.agentType,
          contactName: item.contactName,
          contactMobile: item.contactMobile,
          status: 0,
          statusName: '待审核',
          remark: '',
          createdAt: item.createdAt,
        }));
      
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      const list = auditList.slice(start, end);
      
      return resultSuccess({
        total: auditList.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list,
      });
    },
  },

  // 审核代理商
  {
    url: '/basic-api/agent/audit',
    timeout: 300,
    method: 'post',
    response: () => {
      return resultSuccess(true);
    },
  },

  // 分润记录
  {
    url: '/basic-api/agent/profit/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, agentNo } = query;
      let filteredList = [...mockProfitList];

      if (agentNo) {
        filteredList = filteredList.filter(item => item.agentNo === agentNo);
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

  // 代理商提现列表
  {
    url: '/basic-api/agent/withdraw/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, agentNo, status } = query;
      const statuses = [0, 0, 1, 1, 1, 2, 3];
      const data = [];
      for (let i = 1; i <= 50; i++) {
        const statusIdx = i % 7;
        const agent = mockAgentList[i % mockAgentList.length];
        data.push({
          id: i,
          withdrawNo: 'WD' + Date.now().toString().slice(0, 8) + String(i).padStart(4, '0'),
          agentNo: agentNo || agent.agentNo,
          agentName: agent.agentName,
          amount: parseFloat((Math.random() * 5000 + 100).toFixed(2)),
          fee: parseFloat((Math.random() * 30 + 1).toFixed(2)),
          actualAmount: 0,
          bankName: ['中国工商银行', '中国建设银行', '中国农业银行', '招商银行'][i % 4],
          bankCard: '622202****' + (1000 + i),
          bankUsername: ['张三', '李四', '王五', '赵六'][i % 4],
          status: statuses[statusIdx],
          statusName: ['待审核', '审核通过', '已打款', '已拒绝', '打款失败'][statusIdx],
          remark: '',
          applyTime: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString().replace('T', ' ').substring(0, 19),
          reviewTime: null,
          transferTime: null,
        });
        data[data.length - 1].actualAmount = parseFloat((data[data.length - 1].amount - data[data.length - 1].fee).toFixed(2));
        if (statuses[statusIdx] >= 1) {
          data[data.length - 1].reviewTime = new Date(Date.now() - Math.random() * 3600000).toISOString().replace('T', ' ').substring(0, 19);
        }
        if (statuses[statusIdx] === 2) {
          data[data.length - 1].transferTime = new Date(Date.now() - Math.random() * 3600000).toISOString().replace('T', ' ').substring(0, 19);
        }
      }

      let filteredList = [...data];
      if (agentNo) filteredList = filteredList.filter(item => item.agentNo === agentNo);
      if (status !== undefined && status !== '') filteredList = filteredList.filter(item => item.status === Number(status));

      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);

      return resultSuccess({
        total: filteredList.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list: filteredList.slice(start, end),
      });
    },
  },

  // 代理商提现申请
  {
    url: '/basic-api/agent/withdraw',
    timeout: 500,
    method: 'post',
    response: ({ body }) => {
      return resultSuccess({
        withdrawNo: 'WD' + Date.now(),
        ...body,
        status: 0,
        statusName: '待审核',
        applyTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    },
  },

  // 代理商提现审核
  {
    url: '/basic-api/agent/withdraw/review/:id',
    timeout: 300,
    method: 'put',
    response: ({ body }) => resultSuccess({ id: body.id, ...body, reviewTime: new Date().toISOString().replace('T', ' ').substring(0, 19) }),
  },
] as MockMethod[];
