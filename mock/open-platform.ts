/**
 * 开放平台 Mock 数据
 * 拦截 /api/v1/* 和 /basic-api/open/* 请求
 */
import { MockMethod } from 'vite-plugin-mock';
import { resultSuccess } from '../_util';

// 模拟开发者数据
const mockDevelopers = [
  {
    developerId: 'DEV00001',
    developerName: '测试开发者',
    username: 'dev001',
    password: '123456',
    email: 'dev@example.com',
    mobile: '13800138000',
    company: '测试科技有限公司',
    level: 'basic',
    status: 'active',
    appCount: 2,
    totalCallCount: 12580,
    lastLoginTime: '2026-05-11T10:30:00Z',
    lastLoginIp: '127.0.0.1',
    createTime: '2026-01-15T08:00:00Z',
  },
];

// 模拟应用数据
const mockApps = [
  {
    appId: 'APP00001',
    appKey: 'DGKJ00001ABCD',
    appSecret: '************************',
    appName: '测试商城收款',
    appType: 'web',
    description: '用于测试环境的支付集成',
    mchNo: 'M00001',
    domain: 'https://testshop.example.com',
    notifyUrl: 'https://testshop.example.com/notify',
    refundNotifyUrl: 'https://testshop.example.com/refund-notify',
    enabledPayTypes: ['wx_jsapi', 'wx_native', 'alipay', 'unionpay'],
    enabledApis: ['pay', 'query', 'refund', 'transfer'],
    status: 'active',
    todayCallCount: 156,
    totalCallCount: 12340,
    monthCallCount: 4560,
    monthTradeAmount: 98000.00,
    ipWhitelistCount: 2,
    secretUpdateTime: '2026-04-01T10:00:00Z',
    createTime: '2026-01-20T14:30:00Z',
    updateTime: '2026-05-10T16:00:00Z',
  },
  {
    appId: 'APP00002',
    appKey: 'DGKJ00002EFGH',
    appSecret: '************************',
    appName: '移动端H5收款',
    appType: 'mobile',
    description: '移动端H5支付应用',
    mchNo: 'M00001',
    domain: 'https://m.example.com',
    notifyUrl: 'https://m.example.com/notify',
    enabledPayTypes: ['wx_h5', 'alipay_wap'],
    enabledApis: ['pay', 'query'],
    status: 'active',
    todayCallCount: 42,
    totalCallCount: 240,
    monthCallCount: 120,
    monthTradeAmount: 32000.00,
    secretUpdateTime: '2026-02-15T10:00:00Z',
    createTime: '2026-02-15T09:00:00Z',
    updateTime: '2026-05-08T12:00:00Z',
  },
  {
    appId: 'APP00003',
    appKey: 'DGKJ00003IJKL',
    appSecret: '************************',
    appName: '小程序支付',
    appType: 'miniapp',
    description: '微信小程序支付集成',
    mchNo: 'M00002',
    notifyUrl: 'https://wxapp.example.com/notify',
    enabledPayTypes: ['wx_jsapi'],
    enabledApis: ['pay', 'query'],
    status: 'pending',
    todayCallCount: 0,
    totalCallCount: 0,
    monthCallCount: 0,
    monthTradeAmount: 0,
    createTime: '2026-05-10T08:00:00Z',
    updateTime: '2026-05-10T08:00:00Z',
  },
];

// 模拟 API Key 数据
const mockApiKeys = {
  APP00001: [
    {
      keyId: 'KEY000001',
      keyValue: 'AK00001ABCD1234EFGH5678',
      keySecret: '***',
      signType: 'hmac_sha256',
      alias: '生产环境Key',
      boundIp: '127.0.0.1',
      status: 'active',
      expireTime: null,
      usedCount: 12340,
      lastUsedTime: '2026-05-11T10:25:00Z',
      lastUsedIp: '1.2.3.4',
      createTime: '2026-01-20T14:35:00Z',
    },
    {
      keyId: 'KEY000002',
      keyValue: 'AK00002IJKL9012MNOP3456',
      keySecret: '***',
      signType: 'hmac_sha256',
      alias: '测试环境Key',
      boundIp: null,
      status: 'active',
      expireTime: null,
      usedCount: 200,
      lastUsedTime: '2026-05-10T18:00:00Z',
      lastUsedIp: '192.168.1.1',
      createTime: '2026-03-01T10:00:00Z',
    },
  ],
};

// 模拟配额数据
const mockQuotas = {
  APP00001: {
    daily: { used: 156, limit: 10000 },
    monthly: { used: 4560, limit: 100000 },
    rateLimit: 20,
    appLimit: 3,
  },
};

// 当前登录的开发者
let currentDeveloper: any = null;
let developerToken = 'mock_dev_token_001';

// ==================== 开发者接口 ====================

export default [
  // 注册
  {
    url: '/api/v1/dev/register',
    timeout: 500,
    method: 'post',
    response: ({ body }) => {
      const { username, email, developerName } = body || {};
      if (!username || !email) {
        return { code: 'OP1008', message: '缺少必要参数', data: null };
      }
      return {
        code: 'OP0000',
        message: '注册成功，请等待审核',
        data: {
          developerId: 'DEV' + Date.now().toString(36).toUpperCase(),
          status: 'pending',
        },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 登录
  {
    url: '/api/v1/dev/login',
    timeout: 300,
    method: 'post',
    response: ({ body }) => {
      const { username, password } = body || {};
      if (username === 'dev001' && password === '123456') {
        const dev = mockDevelopers[0];
        currentDeveloper = dev;
        return {
          code: 'OP0000',
          message: '操作成功',
          data: {
            developerId: dev.developerId,
            developerName: dev.developerName,
            email: dev.email,
            mobile: dev.mobile,
            company: dev.company,
            level: dev.level,
            status: dev.status,
            token: developerToken,
          },
          requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
          timestamp: new Date().toISOString(),
        };
      }
      return {
        code: 'OP1003',
        message: '用户名或密码错误',
        data: null,
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 获取开发者信息
  {
    url: '/api/v1/dev/info',
    timeout: 200,
    method: 'get',
    response: () => {
      if (!currentDeveloper) {
        return {
          code: 'OP1003',
          message: '请先登录',
          data: null,
          requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
          timestamp: new Date().toISOString(),
        };
      }
      return {
        code: 'OP0000',
        message: '操作成功',
        data: {
          developerId: currentDeveloper.developerId,
          developerName: currentDeveloper.developerName,
          email: currentDeveloper.email,
          mobile: currentDeveloper.mobile,
          company: currentDeveloper.company,
          level: currentDeveloper.level,
          status: currentDeveloper.status,
          appCount: currentDeveloper.appCount,
          totalCallCount: currentDeveloper.totalCallCount,
          lastLoginTime: currentDeveloper.lastLoginTime,
          lastLoginIp: currentDeveloper.lastLoginIp,
          createTime: currentDeveloper.createTime,
        },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // ==================== 应用管理接口 ====================

  // 创建应用
  {
    url: '/api/v1/app',
    timeout: 500,
    method: 'post',
    response: ({ body }) => {
      if (!currentDeveloper) {
        return { code: 'OP5001', message: '请先登录', data: null };
      }
      const { appName } = body || {};
      if (!appName) {
        return { code: 'OP1008', message: '缺少必要参数', data: null };
      }
      const newApp = {
        appId: 'APP' + Date.now().toString(36).toUpperCase(),
        appKey: 'DGKJ' + Date.now().toString(36).toUpperCase(),
        appSecret: Array.from({ length: 32 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join(''),
        appName,
        appType: body.appType || 'web',
        description: body.description || '',
        mchNo: 'M' + Date.now().toString(36).toUpperCase(),
        notifyUrl: body.notifyUrl || '',
        enabledPayTypes: body.enabledPayTypes || ['wx_jsapi', 'wx_native', 'alipay'],
        enabledApis: ['pay', 'query', 'refund', 'transfer'],
        status: 'pending',
        todayCallCount: 0,
        totalCallCount: 0,
        monthCallCount: 0,
        monthTradeAmount: 0,
        createTime: new Date().toISOString(),
      };
      mockApps.push(newApp);
      return {
        code: 'OP0000',
        message: '应用创建成功，请等待审核。AppSecret仅显示一次，请妥善保管！',
        data: {
          appId: newApp.appId,
          appKey: newApp.appKey,
          appSecret: newApp.appSecret,
          appName: newApp.appName,
          mchNo: newApp.mchNo,
          status: 'pending',
        },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 应用列表
  {
    url: '/api/v1/app/list',
    timeout: 200,
    method: 'get',
    response: ({ query }) => {
      if (!currentDeveloper) {
        return { code: 'OP5001', message: '请先登录', data: null };
      }
      const page = parseInt(query.page as string) || 1;
      const pageSize = parseInt(query.pageSize as string) || 10;
      const keyword = (query.keyword as string || '').toLowerCase();
      const status = query.status as string;

      let filtered = mockApps;
      if (keyword) {
        filtered = filtered.filter((a) => a.appName.toLowerCase().includes(keyword) || a.appId.toLowerCase().includes(keyword));
      }
      if (status) {
        filtered = filtered.filter((a) => a.status === status);
      }

      const start = (page - 1) * pageSize;
      const list = filtered.slice(start, start + pageSize);

      return {
        code: 'OP0000',
        message: '操作成功',
        data: { list, total: filtered.length },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 应用详情
  {
    url: '/api/v1/app/:appId',
    timeout: 200,
    method: 'get',
    response: ({ query }) => {
      if (!currentDeveloper) {
        return { code: 'OP5001', message: '请先登录', data: null };
      }
      const app = mockApps.find((a) => a.appId === query.appId);
      if (!app) {
        return { code: 'OP4001', message: '应用不存在', data: null };
      }
      return {
        code: 'OP0000',
        message: '操作成功',
        data: app,
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 更新应用
  {
    url: '/api/v1/app/:appId',
    timeout: 300,
    method: 'put',
    response: () => {
      if (!currentDeveloper) {
        return { code: 'OP5001', message: '请先登录', data: null };
      }
      return {
        code: 'OP0000',
        message: '更新成功',
        data: null,
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 重置 AppSecret
  {
    url: '/api/v1/app/:appId/reset-secret',
    timeout: 300,
    method: 'post',
    response: ({ query }) => {
      if (!currentDeveloper) {
        return { code: 'OP5001', message: '请先登录', data: null };
      }
      const newSecret = Array.from({ length: 32 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('');
      const app = mockApps.find((a) => a.appId === query.appId);
      if (app) app.appSecret = newSecret;
      return {
        code: 'OP0000',
        message: 'AppSecret已重置，请妥善保管！',
        data: { appSecret: newSecret },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // ==================== API Key 管理 ====================

  // Key 列表
  {
    url: '/api/v1/app/:appId/keys',
    timeout: 200,
    method: 'get',
    response: ({ query }) => {
      if (!currentDeveloper) {
        return { code: 'OP5001', message: '请先登录', data: null };
      }
      return {
        code: 'OP0000',
        message: '操作成功',
        data: mockApiKeys[query.appId as string] || [],
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 创建 Key
  {
    url: '/api/v1/app/:appId/key',
    timeout: 300,
    method: 'post',
    response: ({ query }) => {
      if (!currentDeveloper) {
        return { code: 'OP5001', message: '请先登录', data: null };
      }
      const newKey = {
        keyId: 'KEY' + Date.now().toString(36).toUpperCase(),
        keyValue: 'AK' + Array.from({ length: 20 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join(''),
        keySecret: Array.from({ length: 32 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join(''),
        signType: 'hmac_sha256',
        expireTime: null,
        createTime: new Date().toISOString(),
      };
      const appId = query.appId as string;
      if (!mockApiKeys[appId]) mockApiKeys[appId] = [];
      mockApiKeys[appId].push(newKey);
      return {
        code: 'OP0000',
        message: 'API Key创建成功，请妥善保管KeySecret！',
        data: newKey,
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 禁用 Key
  {
    url: '/api/v1/app/:appId/key/:keyId/disable',
    timeout: 200,
    method: 'post',
    response: () => {
      if (!currentDeveloper) {
        return { code: 'OP5001', message: '请先登录', data: null };
      }
      return {
        code: 'OP0000',
        message: '操作成功',
        data: null,
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 删除 Key
  {
    url: '/api/v1/app/:appId/key/:keyId',
    timeout: 200,
    method: 'delete',
    response: () => {
      if (!currentDeveloper) {
        return { code: 'OP5001', message: '请先登录', data: null };
      }
      return {
        code: 'OP0000',
        message: '删除成功',
        data: null,
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // ==================== 配额查询 ====================

  // 获取配额
  {
    url: '/api/v1/app/:appId/quota',
    timeout: 200,
    method: 'get',
    response: ({ query }) => {
      if (!currentDeveloper) {
        return { code: 'OP5001', message: '请先登录', data: null };
      }
      return {
        code: 'OP0000',
        message: '操作成功',
        data: mockQuotas[query.appId as string] || {
          daily: { used: 0, limit: 100 },
          monthly: { used: 0, limit: 1000 },
          rateLimit: 5,
          appLimit: 1,
        },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // ==================== 支付接口 ====================

  // 发起支付
  {
    url: '/api/v1/pay/gateway',
    timeout: 500,
    method: 'post',
    response: ({ body }) => {
      const { orderNo, payType, amount } = body || {};
      if (!orderNo || !payType) {
        return { code: 'OP1008', message: '缺少必要参数', data: null };
      }
      const platformOrderNo = 'OP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
      return {
        code: 'OP0000',
        message: '操作成功',
        data: {
          orderNo: platformOrderNo,
          payUrl: payType === 'wx_native' ? `https://api.dgkjpay.com/gateway/wx/native?orderNo=${platformOrderNo}&amount=${amount}` : `https://api.dgkjpay.com/gateway?orderNo=${platformOrderNo}&amount=${amount}`,
          qrCode: payType === 'wx_native' || payType === 'alipay_qr' ? `https://api.dgkjpay.com/qr/${platformOrderNo}` : null,
          amount: parseInt(amount) || 100,
          mchNo: body?.mchNo || 'M00001',
          payType,
          status: 'pending',
          expireTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 查询订单
  {
    url: '/api/v1/query/order/:orderNo',
    timeout: 300,
    method: 'get',
    response: ({ url }) => {
      const orderNo = url.split('/').pop();
      return {
        code: 'OP0000',
        message: '操作成功',
        data: {
          orderNo,
          mchNo: 'M00001',
          appId: 'APP00001',
          payType: 'wx_native',
          amount: 100,
          actualAmount: 100,
          status: 'paid',
          subject: '测试商品',
          attach: null,
          channelOrderNo: 'C' + Date.now().toString(36).toUpperCase(),
          paidTime: new Date(Date.now() - 600000).toISOString(),
          createTime: new Date(Date.now() - 1800000).toISOString(),
          expireTime: new Date(Date.now() + 5400000).toISOString(),
        },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 关闭订单
  {
    url: '/api/v1/order/:orderNo/close',
    timeout: 300,
    method: 'post',
    response: ({ url }) => {
      const orderNo = url.split('/').pop();
      return {
        code: 'OP0000',
        message: '操作成功',
        data: { orderNo, status: 'closed' },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // ==================== 退款接口 ====================

  // 申请退款
  {
    url: '/api/v1/refund/apply',
    timeout: 500,
    method: 'post',
    response: ({ body }) => {
      const { orderNo, refundAmount } = body || {};
      return {
        code: 'OP0000',
        message: '操作成功',
        data: {
          refundNo: 'RF' + Date.now().toString(36).toUpperCase(),
          orderNo,
          refundAmount: parseInt(refundAmount) || 100,
          status: 'pending',
          createTime: new Date().toISOString(),
        },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 查询退款
  {
    url: '/api/v1/query/refund/:refundNo',
    timeout: 300,
    method: 'get',
    response: ({ url }) => {
      const refundNo = url.split('/').pop();
      return {
        code: 'OP0000',
        message: '操作成功',
        data: {
          refundNo,
          orderNo: 'OP' + Date.now().toString(36).toUpperCase(),
          mchNo: 'M00001',
          refundAmount: 100,
          status: 'success',
          refundReason: '用户取消订单',
          createTime: new Date(Date.now() - 3600000).toISOString(),
          updateTime: new Date(Date.now() - 1800000).toISOString(),
        },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // ==================== 转账接口 ====================

  // 发起转账
  {
    url: '/api/v1/transfer/pay',
    timeout: 500,
    method: 'post',
    response: ({ body }) => {
      const { outNo, amount } = body || {};
      return {
        code: 'OP0000',
        message: '操作成功',
        data: {
          transferNo: 'TR' + Date.now().toString(36).toUpperCase(),
          outNo,
          amount: parseInt(amount) || 10000,
          fee: Math.round((parseInt(amount) || 10000) * 0.001),
          actualAmount: Math.round((parseInt(amount) || 10000) * 0.999),
          status: 'pending',
          createTime: new Date().toISOString(),
        },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 查询转账
  {
    url: '/api/v1/query/transfer/:transferNo',
    timeout: 300,
    method: 'get',
    response: ({ url }) => {
      const transferNo = url.split('/').pop();
      return {
        code: 'OP0000',
        message: '操作成功',
        data: {
          transferNo,
          outNo: 'T' + Date.now().toString(36).toUpperCase(),
          mchNo: 'M00001',
          amount: 10000,
          fee: 10,
          actualAmount: 9990,
          status: 'success',
          accountName: '张三',
          bankName: '中国工商银行',
          createTime: new Date(Date.now() - 3600000).toISOString(),
          updateTime: new Date(Date.now() - 1800000).toISOString(),
        },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // ==================== 账户接口 ====================

  // 查询余额
  {
    url: '/api/v1/account/balance',
    timeout: 300,
    method: 'get',
    response: () => {
      return {
        code: 'OP0000',
        message: '操作成功',
        data: {
          mchNo: 'M00001',
          availableBalance: 98560.00,
          frozenBalance: 5000.00,
          totalBalance: 103560.00,
          currency: 'CNY',
          updateTime: new Date().toISOString(),
        },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // ==================== 管理后台接口 (basic-api/open) ====================

  // 开发者列表
  {
    url: '/basic-api/open/developer/list',
    timeout: 200,
    method: 'get',
    response: ({ query }) => {
      const page = parseInt(query.page as string) || 1;
      const pageSize = parseInt(query.pageSize as string) || 10;
      const keyword = (query.keyword as string || '').toLowerCase();

      let list = mockDevelopers.map((d) => ({
        developerId: d.developerId,
        developerName: d.developerName,
        username: d.username,
        email: d.email,
        mobile: d.mobile,
        company: d.company,
        level: d.level,
        status: d.status,
        appCount: d.appCount,
        totalCallCount: d.totalCallCount,
        lastLoginTime: d.lastLoginTime,
        createTime: d.createTime,
      }));

      if (keyword) {
        list = list.filter((d) => d.developerName.toLowerCase().includes(keyword) || d.username.toLowerCase().includes(keyword));
      }

      const start = (page - 1) * pageSize;
      return {
        code: 'OP0000',
        message: '操作成功',
        data: { list: list.slice(start, start + pageSize), total: list.length },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 开发者详情
  {
    url: '/basic-api/open/developer/:developerId',
    timeout: 200,
    method: 'get',
    response: ({ url }) => {
      const id = url.split('/').pop();
      const dev = mockDevelopers.find((d) => d.developerId === id);
      if (!dev) {
        return { code: 'OP4001', message: '开发者不存在', data: null };
      }
      return {
        code: 'OP0000',
        message: '操作成功',
        data: dev,
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 审核开发者
  {
    url: '/basic-api/open/developer/:developerId/review',
    timeout: 300,
    method: 'post',
    response: () => ({
      code: 'OP0000',
      message: '操作成功',
      data: null,
      requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toISOString(),
    }),
  },

  // 应用列表 (管理后台)
  {
    url: '/basic-api/open/app/list',
    timeout: 200,
    method: 'get',
    response: ({ query }) => {
      const page = parseInt(query.page as string) || 1;
      const pageSize = parseInt(query.pageSize as string) || 10;
      const start = (page - 1) * pageSize;
      return {
        code: 'OP0000',
        message: '操作成功',
        data: { list: mockApps.slice(start, start + pageSize), total: mockApps.length },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // 应用审核
  {
    url: '/basic-api/open/app/:appId/review',
    timeout: 300,
    method: 'post',
    response: ({ body }) => {
      const app = mockApps.find((a) => a.appId === body?.appId || true);
      if (app) app.status = body?.status || 'active';
      return {
        code: 'OP0000',
        message: '操作成功',
        data: null,
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // API 日志列表
  {
    url: '/basic-api/open/log/list',
    timeout: 200,
    method: 'get',
    response: ({ query }) => {
      const page = parseInt(query.page as string) || 1;
      const pageSize = parseInt(query.pageSize as string) || 20;
      const mockLogs = Array.from({ length: 50 }, (_, i) => ({
        id: 'log' + (50 - i),
        appId: 'APP00001',
        developerId: 'DEV00001',
        mchNo: 'M00001',
        method: i % 2 === 0 ? 'POST' : 'GET',
        apiPath: ['/api/v1/pay/gateway', '/api/v1/query/order', '/api/v1/refund/apply'][i % 3],
        result: i % 10 === 0 ? 'error' : 'success',
        httpCode: i % 10 === 0 ? 401 : 200,
        code: i % 10 === 0 ? 'OP1001' : 'OP0000',
        responseTime: Math.floor(50 + Math.random() * 450),
        clientIp: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        createTime: new Date(Date.now() - i * 60000).toISOString(),
      }));
      const start = (page - 1) * pageSize;
      return {
        code: 'OP0000',
        message: '操作成功',
        data: { list: mockLogs.slice(start, start + pageSize), total: mockLogs.length },
        requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // API 日志统计
  {
    url: '/basic-api/open/log/statistics',
    timeout: 200,
    method: 'get',
    response: () => ({
      code: 'OP0000',
      message: '操作成功',
      data: {
        today: { total: 198, error: 3, success: 195 },
        topApis: [
          { apiPath: '/api/v1/pay/gateway', count: 89 },
          { apiPath: '/api/v1/query/order', count: 67 },
          { apiPath: '/api/v1/refund/apply', count: 42 },
        ],
        topApps: [
          { appId: 'APP00001', count: 156 },
          { appId: 'APP00002', count: 42 },
        ],
      },
      requestId: 'REQ' + Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toISOString(),
    }),
  },
] as MockMethod[];
