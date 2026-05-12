/**
 * 轮转池管理Mock数据
 */
import { resultSuccess } from './_util';
import type { MockMethod } from 'vite-plugin-mock';

// 模拟通道数据
const mockChannelList = [
  {
    id: 1,
    channelCode: 'WX_QR_01',
    channelName: '微信扫码通道01',
    channelType: 'wechat',
    status: 1,
    statusName: '正常',
    priority: 10,
    weight: 100,
    dailyLimit: 50000,
    monthlyLimit: 1000000,
    singleMinAmt: 1,
    singleMaxAmt: 5000,
    dailyCountLimit: 500,
    monthlyCountLimit: 15000,
    startTime: '00:00:00',
    endTime: '23:59:59',
    todayAmount: 18652.50,
    todayCount: 128,
    monthAmount: 568920.00,
    monthCount: 3860,
    todaySuccessAmount: 18520.00,
    todaySuccessCount: 125,
    successRate: 97.66,
    avgResponseTime: 256,
  },
  {
    id: 2,
    channelCode: 'WX_QR_02',
    channelName: '微信扫码通道02',
    channelType: 'wechat',
    status: 1,
    statusName: '正常',
    priority: 20,
    weight: 80,
    dailyLimit: 30000,
    monthlyLimit: 600000,
    singleMinAmt: 1,
    singleMaxAmt: 3000,
    dailyCountLimit: 300,
    monthlyCountLimit: 9000,
    startTime: '00:00:00',
    endTime: '23:59:59',
    todayAmount: 8650.00,
    todayCount: 86,
    monthAmount: 256800.00,
    monthCount: 2650,
    todaySuccessAmount: 8500.00,
    todaySuccessCount: 82,
    successRate: 95.35,
    avgResponseTime: 320,
  },
  {
    id: 3,
    channelCode: 'ALI_QR_01',
    channelName: '支付宝扫码01',
    channelType: 'alipay',
    status: 1,
    statusName: '正常',
    priority: 10,
    weight: 100,
    dailyLimit: 50000,
    monthlyLimit: 1000000,
    singleMinAmt: 1,
    singleMaxAmt: 5000,
    dailyCountLimit: 500,
    monthlyCountLimit: 15000,
    startTime: '00:00:00',
    endTime: '23:59:59',
    todayAmount: 12680.00,
    todayCount: 86,
    monthAmount: 386500.00,
    monthCount: 2650,
    todaySuccessAmount: 12480.00,
    todaySuccessCount: 84,
    successRate: 97.67,
    avgResponseTime: 280,
  },
  {
    id: 4,
    channelCode: 'ALI_QR_02',
    channelName: '支付宝扫码02',
    channelType: 'alipay',
    status: 1,
    statusName: '正常',
    priority: 30,
    weight: 60,
    dailyLimit: 30000,
    monthlyLimit: 600000,
    singleMinAmt: 1,
    singleMaxAmt: 3000,
    dailyCountLimit: 300,
    monthlyCountLimit: 9000,
    startTime: '00:00:00',
    endTime: '23:59:59',
    todayAmount: 5680.00,
    todayCount: 42,
    monthAmount: 168200.00,
    monthCount: 1260,
    todaySuccessAmount: 5500.00,
    todaySuccessCount: 40,
    successRate: 95.24,
    avgResponseTime: 310,
  },
  {
    id: 5,
    channelCode: 'CT_QR_01',
    channelName: '通联扫码01',
    channelType: 'ctpay',
    status: 1,
    statusName: '正常',
    priority: 30,
    weight: 60,
    dailyLimit: 100000,
    monthlyLimit: 2000000,
    singleMinAmt: 10,
    singleMaxAmt: 10000,
    dailyCountLimit: 1000,
    monthlyCountLimit: 30000,
    startTime: '08:00:00',
    endTime: '22:00:00',
    todayAmount: 42800.00,
    todayCount: 56,
    monthAmount: 1285600.00,
    monthCount: 1680,
    todaySuccessAmount: 42000.00,
    todaySuccessCount: 54,
    successRate: 96.43,
    avgResponseTime: 450,
  },
  {
    id: 6,
    channelCode: 'HF_QR_01',
    channelName: '汇付扫码01',
    channelType: 'hfpay',
    status: 1,
    statusName: '正常',
    priority: 40,
    weight: 50,
    dailyLimit: 80000,
    monthlyLimit: 1600000,
    singleMinAmt: 10,
    singleMaxAmt: 8000,
    dailyCountLimit: 800,
    monthlyCountLimit: 24000,
    startTime: '00:00:00',
    endTime: '23:59:59',
    todayAmount: 18600.00,
    todayCount: 32,
    monthAmount: 568200.00,
    monthCount: 980,
    todaySuccessAmount: 18200.00,
    todaySuccessCount: 30,
    successRate: 93.75,
    avgResponseTime: 520,
  },
  {
    id: 7,
    channelCode: 'FY_QR_01',
    channelName: '富友扫码01',
    channelType: 'fypay',
    status: 0,
    statusName: '停用',
    priority: 50,
    weight: 50,
    dailyLimit: 80000,
    monthlyLimit: 1600000,
    singleMinAmt: 10,
    singleMaxAmt: 8000,
    dailyCountLimit: 800,
    monthlyCountLimit: 24000,
    startTime: '00:00:00',
    endTime: '23:59:59',
    todayAmount: 0,
    todayCount: 0,
    monthAmount: 125600.00,
    monthCount: 420,
    todaySuccessAmount: 0,
    todaySuccessCount: 0,
    successRate: 0,
    avgResponseTime: 0,
  },
  {
    id: 8,
    channelCode: 'CITIC_QR_01',
    channelName: '中信银行01',
    channelType: 'citic',
    status: 1,
    statusName: '正常',
    priority: 15,
    weight: 100,
    dailyLimit: 200000,
    monthlyLimit: 4000000,
    singleMinAmt: 100,
    singleMaxAmt: 50000,
    dailyCountLimit: 2000,
    monthlyCountLimit: 60000,
    startTime: '00:00:00',
    endTime: '23:59:59',
    todayAmount: 32500.00,
    todayCount: 18,
    monthAmount: 986500.00,
    monthCount: 560,
    todaySuccessAmount: 32000.00,
    todaySuccessCount: 17,
    successRate: 94.44,
    avgResponseTime: 680,
  },
  {
    id: 9,
    channelCode: 'CITIC_QR_02',
    channelName: '中信银行02',
    channelType: 'citic',
    status: 1,
    statusName: '正常',
    priority: 25,
    weight: 80,
    dailyLimit: 150000,
    monthlyLimit: 3000000,
    singleMinAmt: 100,
    singleMaxAmt: 30000,
    dailyCountLimit: 1500,
    monthlyCountLimit: 45000,
    startTime: '00:00:00',
    endTime: '23:59:59',
    todayAmount: 15800.00,
    todayCount: 12,
    monthAmount: 486500.00,
    monthCount: 380,
    todaySuccessAmount: 15500.00,
    todaySuccessCount: 11,
    successRate: 91.67,
    avgResponseTime: 720,
  },
];

// 模拟规则数据
const mockRuleList = [
  { 
    id: 1, 
    ruleCode: 'AMOUNT_LIMIT_1', 
    ruleName: '小额优先微信', 
    ruleType: 'RULE_TYPE_AMOUNT_LIMIT', 
    priority: 10, 
    status: 1, 
    statusName: '正常',
    config: '{"minAmount": 0, "maxAmount": 500, "channelType": "wechat"}',
  },
  { 
    id: 2, 
    ruleCode: 'AMOUNT_LIMIT_2', 
    ruleName: '中额用通联', 
    ruleType: 'RULE_TYPE_AMOUNT_LIMIT', 
    priority: 20, 
    status: 1, 
    statusName: '正常',
    config: '{"minAmount": 500, "maxAmount": 5000, "channelType": "ctpay"}',
  },
  { 
    id: 3, 
    ruleCode: 'AMOUNT_LIMIT_3', 
    ruleName: '大额用中信', 
    ruleType: 'RULE_TYPE_AMOUNT_LIMIT', 
    priority: 30, 
    status: 1, 
    statusName: '正常',
    config: '{"minAmount": 5000, "maxAmount": 999999999, "channelType": "citic"}',
  },
  { 
    id: 4, 
    ruleCode: 'TIME_LIMIT_1', 
    ruleName: '夜间禁用通联', 
    ruleType: 'RULE_TYPE_TIME_LIMIT', 
    priority: 40, 
    status: 1, 
    statusName: '正常',
    config: '{"forbiddenTimeStart": "22:00:00", "forbiddenTimeEnd": "08:00:00", "channelType": "ctpay"}',
  },
  { 
    id: 5, 
    ruleCode: 'SUCCESS_RATE_1', 
    ruleName: '成功率低于90%暂停', 
    ruleType: 'RULE_TYPE_SUCCESS_RATE', 
    priority: 60, 
    status: 1, 
    statusName: '正常',
    config: '{"minSuccessRate": 90}',
  },
  { 
    id: 6, 
    ruleCode: 'RESPONSE_TIME_1', 
    ruleName: '响应超3秒降级', 
    ruleType: 'RULE_TYPE_RESPONSE_TIME', 
    priority: 70, 
    status: 1, 
    statusName: '正常',
    config: '{"maxResponseTime": 3000}',
  },
  { 
    id: 7, 
    ruleCode: 'STRATEGY_ROUND', 
    ruleName: '轮询策略', 
    ruleType: 'RULE_TYPE_ROUND_ROBIN', 
    priority: 100, 
    status: 1, 
    statusName: '正常',
    config: '{"channels": ["WX_QR_01", "WX_QR_02", "ALI_QR_01"]}',
  },
  { 
    id: 8, 
    ruleCode: 'STRATEGY_WEIGHT', 
    ruleName: '加权随机策略', 
    ruleType: 'RULE_TYPE_WEIGHT_RANDOM', 
    priority: 101, 
    status: 0, 
    statusName: '停用',
    config: '{"channels": ["WX_QR_01", "ALI_QR_01", "CT_QR_01"], "weights": [3, 3, 2]}',
  },
];

export default [
  // 通道列表
  {
    url: '/basic-api/pool/channel/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, channelCode, channelType, status } = query;
      let list = [...mockChannelList];
      
      if (channelCode) {
        list = list.filter(item => item.channelCode.includes(channelCode));
      }
      if (channelType) {
        list = list.filter(item => item.channelType === channelType);
      }
      if (status !== undefined && status !== '') {
        list = list.filter(item => item.status === Number(status));
      }
      
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      
      return resultSuccess({
        total: list.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list: list.slice(start, end),
      });
    },
  },
  
  // 通道详情
  {
    url: '/basic-api/pool/channel/info/:id',
    timeout: 300,
    method: 'get',
    response: ({ pathParams }) => {
      const channel = mockChannelList.find(item => item.id === Number(pathParams.id));
      return resultSuccess(channel);
    },
  },
  
  // 通道统计
  {
    url: '/basic-api/pool/channel/stats',
    timeout: 500,
    method: 'get',
    response: () => {
      const activeChannels = mockChannelList.filter(c => c.status === 1);
      const totalSuccessRate = activeChannels.length > 0 
        ? activeChannels.reduce((sum, c) => sum + c.successRate, 0) / activeChannels.length 
        : 0;
      const totalResponseTime = activeChannels.length > 0 
        ? activeChannels.reduce((sum, c) => sum + c.avgResponseTime, 0) / activeChannels.length 
        : 0;
        
      return resultSuccess({
        totalChannel: mockChannelList.length,
        activeChannel: activeChannels.length,
        todayTotalAmount: activeChannels.reduce((sum, c) => sum + c.todayAmount, 0),
        todayTotalCount: activeChannels.reduce((sum, c) => sum + c.todayCount, 0),
        todaySuccessAmount: activeChannels.reduce((sum, c) => sum + c.todaySuccessAmount, 0),
        todaySuccessCount: activeChannels.reduce((sum, c) => sum + c.todaySuccessCount, 0),
        avgSuccessRate: totalSuccessRate.toFixed(2),
        avgResponseTime: Math.round(totalResponseTime),
        channelList: mockChannelList,
      });
    },
  },
  
  // 添加通道
  {
    url: '/basic-api/pool/channel/add',
    timeout: 500,
    method: 'post',
    response: () => {
      return resultSuccess({ id: Date.now() });
    },
  },
  
  // 更新通道
  {
    url: '/basic-api/pool/channel/update/:id',
    timeout: 500,
    method: 'post',
    response: () => {
      return resultSuccess(true);
    },
  },
  
  // 删除通道
  {
    url: '/basic-api/pool/channel/delete/:id',
    timeout: 300,
    method: 'post',
    response: () => {
      return resultSuccess(true);
    },
  },
  
  // 切换通道状态
  {
    url: '/basic-api/pool/channel/toggle/:id',
    timeout: 300,
    method: 'post',
    response: () => {
      return resultSuccess(true);
    },
  },
  
  // 规则列表
  {
    url: '/basic-api/pool/rule/list',
    timeout: 500,
    method: 'get',
    response: () => {
      return resultSuccess(mockRuleList);
    },
  },
  
  // 添加规则
  {
    url: '/basic-api/pool/rule/add',
    timeout: 500,
    method: 'post',
    response: () => {
      return resultSuccess({ id: Date.now() });
    },
  },
  
  // 更新规则
  {
    url: '/basic-api/pool/rule/update/:id',
    timeout: 500,
    method: 'post',
    response: () => {
      return resultSuccess(true);
    },
  },
  
  // 删除规则
  {
    url: '/basic-api/pool/rule/delete/:id',
    timeout: 300,
    method: 'post',
    response: () => {
      return resultSuccess(true);
    },
  },
  
  // 切换规则状态
  {
    url: '/basic-api/pool/rule/toggle/:id',
    timeout: 300,
    method: 'post',
    response: () => {
      return resultSuccess(true);
    },
  },
  
  // 路由测试
  {
    url: '/basic-api/pool/route',
    timeout: 300,
    method: 'post',
    response: ({ query }) => {
      const { mchNo, amount, payChannel } = query;
      
      const amountNum = Number(amount);
      let selectedChannel;
      
      // 简单路由逻辑
      if (amountNum < 500) {
        if (payChannel && payChannel.toLowerCase() === 'wx') {
          selectedChannel = mockChannelList.find(c => c.channelCode.startsWith('WX') && c.status === 1);
        } else if (payChannel && payChannel.toLowerCase() === 'ali') {
          selectedChannel = mockChannelList.find(c => c.channelCode.startsWith('ALI') && c.status === 1);
        } else {
          selectedChannel = mockChannelList.find(c => c.channelCode.startsWith('WX') && c.status === 1);
        }
      } else if (amountNum < 5000) {
        if (payChannel && payChannel.toLowerCase() === 'ct') {
          selectedChannel = mockChannelList.find(c => c.channelCode.startsWith('CT') && c.status === 1);
        } else {
          selectedChannel = mockChannelList.find(c => c.channelCode.startsWith('CT') && c.status === 1);
        }
      } else {
        if (payChannel && payChannel.toLowerCase() === 'citic') {
          selectedChannel = mockChannelList.find(c => c.channelCode.startsWith('CITIC') && c.status === 1);
        } else {
          selectedChannel = mockChannelList.find(c => c.channelCode.startsWith('CITIC') && c.status === 1);
        }
      }
      
      if (!selectedChannel) {
        selectedChannel = mockChannelList.find(c => c.status === 1);
      }
      
      if (selectedChannel) {
        return resultSuccess({
          success: true,
          channelId: selectedChannel.id,
          channelCode: selectedChannel.channelCode,
          channelName: selectedChannel.channelName,
          channelType: selectedChannel.channelType,
          priority: selectedChannel.priority,
          remainLimit: selectedChannel.dailyLimit - selectedChannel.todayAmount,
        });
      }
      
      return resultSuccess({
        success: false,
        rejectReason: '无可用通道',
      });
    },
  },
  
  // 推荐通道
  {
    url: '/basic-api/pool/channel/recommend',
    timeout: 300,
    method: 'get',
    response: ({ query }) => {
      const { amount, payChannel } = query;
      const amountNum = Number(amount);
      
      let channels = mockChannelList.filter(c => c.status === 1);
      
      if (amountNum < 500) {
        channels = channels.filter(c => c.channelType === 'wechat' || c.channelType === 'alipay');
      } else if (amountNum < 5000) {
        channels = channels.filter(c => c.channelType === 'ctpay' || c.channelType === 'hfpay');
      } else {
        channels = channels.filter(c => c.channelType === 'citic');
      }
      
      return resultSuccess(channels);
    },
  },
] as MockMethod[];
