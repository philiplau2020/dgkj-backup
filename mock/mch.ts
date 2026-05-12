/**
 * 商户管理 Mock 数据
 */
import { resultSuccess } from './_util';
import type { MockMethod } from 'vite-plugin-mock';

// 模拟商户数据
const mockMerchantList = [
  {
    id: 1,
    mchNo: 'M10001',
    mchName: '测试商户001',
    mchType: 2,
    mchTypeName: '企业',
    isvNo: 'ISV0001',
    agentNo: 'A10001',
    contactName: '李四',
    contactMobile: '13900139000',
    contactEmail: 'lisi@example.com',
    bankCard: '622202****1234',
    bankName: '中国工商银行',
    status: 1,
    statusName: '正常',
    auditStatus: 1,
    auditStatusName: '已通过',
    rate: 0.006,
    createdAt: '2024-01-15 10:30:00',
  },
  {
    id: 2,
    mchNo: 'M10002',
    mchName: '测试商户002',
    mchType: 1,
    mchTypeName: '个人',
    isvNo: 'ISV0001',
    agentNo: null,
    contactName: '王五',
    contactMobile: '13700137000',
    contactEmail: 'wangwu@example.com',
    bankCard: '622202****5678',
    bankName: '中国建设银行',
    status: 1,
    statusName: '正常',
    auditStatus: 1,
    auditStatusName: '已通过',
    rate: 0.0055,
    createdAt: '2024-01-18 14:20:00',
  },
  {
    id: 3,
    mchNo: 'M10003',
    mchName: '待审核商户',
    mchType: 2,
    mchTypeName: '企业',
    isvNo: 'ISV0001',
    agentNo: null,
    contactName: '赵六',
    contactMobile: '13600136000',
    contactEmail: 'zhaoliu@example.com',
    bankCard: '622202****9012',
    bankName: '中国农业银行',
    status: 0,
    statusName: '待审核',
    auditStatus: 0,
    auditStatusName: '待审核',
    rate: 0.006,
    createdAt: '2024-01-20 09:15:00',
  },
  {
    id: 4,
    mchNo: 'M10004',
    mchName: '已冻结商户',
    mchType: 1,
    mchTypeName: '个人',
    isvNo: 'ISV0001',
    agentNo: 'A10002',
    contactName: '钱七',
    contactMobile: '13500135000',
    contactEmail: 'qianqi@example.com',
    bankCard: '622202****3456',
    bankName: '招商银行',
    status: 2,
    statusName: '冻结',
    auditStatus: 1,
    auditStatusName: '已通过',
    rate: 0.007,
    createdAt: '2024-01-10 16:45:00',
  },
];

// 商户费率配置
const mockRateList = [
  { id: 1, mchNo: 'M10001', mchName: '测试商户001', rate: 0.006, minAmount: 1, maxAmount: 50000, status: 1, statusText: '启用' },
  { id: 2, mchNo: 'M10002', mchName: '测试商户002', rate: 0.0055, minAmount: 1, maxAmount: 10000, status: 1, statusText: '启用' },
  { id: 3, mchNo: 'M10005', mchName: '测试商户005', rate: 0.007, minAmount: 100, maxAmount: 100000, status: 0, statusText: '停用' },
];

// 商户进件申请列表
const mockEntryList = mockMerchantList.filter(item => item.auditStatus === 0);

export default [
  // 商户列表
  {
    url: '/basic-api/merchant/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, mchNo, mchName, status, auditStatus } = query;
      let filteredList = [...mockMerchantList];
      
      if (mchNo) {
        filteredList = filteredList.filter(item => item.mchNo.includes(mchNo));
      }
      if (mchName) {
        filteredList = filteredList.filter(item => item.mchName.includes(mchName));
      }
      if (status !== undefined && status !== '') {
        filteredList = filteredList.filter(item => item.status === Number(status));
      }
      if (auditStatus !== undefined && auditStatus !== '') {
        filteredList = filteredList.filter(item => item.auditStatus === Number(auditStatus));
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

  // 商户详情
  {
    url: '/basic-api/merchant/info/:mchNo',
    timeout: 300,
    method: 'get',
    response: ({ pathParams }) => {
      const merchant = mockMerchantList.find(item => item.mchNo === pathParams.mchNo);
      return resultSuccess(merchant);
    },
  },

  // 创建商户
  {
    url: '/basic-api/merchant/create',
    timeout: 500,
    method: 'post',
    response: () => {
      return resultSuccess('M' + Date.now());
    },
  },

  // 审核商户
  {
    url: '/basic-api/merchant/audit',
    timeout: 300,
    method: 'post',
    response: () => {
      return resultSuccess(true);
    },
  },

  // 商户进件列表
  {
    url: '/basic-api/mch/entry/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      
      return resultSuccess({
        total: mockEntryList.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list: mockEntryList.slice(start, end),
      });
    },
  },

  // 商户费率列表
  {
    url: '/basic-api/mch/rate/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);

      return resultSuccess({
        total: mockRateList.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list: mockRateList.slice(start, end),
      });
    },
  },

  // 商户应用列表
  {
    url: '/basic-api/mch/app/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, mchNo, appId, appName, status } = query;
      const appList = [];
      for (let i = 1; i <= 30; i++) {
        const merchant = mockMerchantList[i % mockMerchantList.length];
        appList.push({
          id: i,
          appId: 'APP' + String(1000 + i),
          appName: ['默认应用', 'H5应用', '小程序', 'PC应用'][i % 4],
          appType: i % 4,
          mchNo: mchNo || merchant.mchNo,
          mchName: merchant.mchName,
          status: Math.floor(Math.random() * 2),
          statusName: ['正常', '停用'][Math.floor(Math.random() * 2)],
          appSecret: '****' + String(Date.now()).slice(-8),
          notifyUrl: 'https://example.com/notify',
          returnUrl: 'https://example.com/return',
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 90).toISOString().replace('T', ' ').substring(0, 19),
          updatedAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString().replace('T', ' ').substring(0, 19),
        });
      }

      let filteredList = [...appList];
      if (mchNo) filteredList = filteredList.filter(item => item.mchNo.includes(mchNo));
      if (appName) filteredList = filteredList.filter(item => item.appName.includes(appName));
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

  // 商户应用详情
  {
    url: '/basic-api/mch/app/:appId',
    timeout: 300,
    method: 'get',
    response: ({ pathParams }) => {
      return resultSuccess({
        id: 1,
        appId: pathParams.appId,
        appName: '默认应用',
        appType: 0,
        mchNo: 'M10001',
        mchName: '测试商户001',
        status: 1,
        statusName: '正常',
        appSecret: 'sk_' + String(Date.now()).slice(-16),
        notifyUrl: 'https://example.com/notify',
        returnUrl: 'https://example.com/return',
        payConfig: { wxEnabled: true, aliEnabled: true, unionEnabled: false },
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    },
  },

  // 创建商户应用
  {
    url: '/basic-api/mch/app',
    timeout: 500,
    method: 'post',
    response: ({ body }) => {
      return resultSuccess({
        id: Date.now(),
        appId: 'APP' + Date.now(),
        ...body,
        status: 1,
        statusName: '正常',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    },
  },

  // 更新商户应用
  {
    url: '/basic-api/mch/app/:appId',
    timeout: 500,
    method: 'put',
    response: () => resultSuccess(true),
  },

  // 删除商户应用
  {
    url: '/basic-api/mch/app/:appId',
    timeout: 300,
    method: 'delete',
    response: () => resultSuccess(true),
  },

  // 商户门店列表
  {
    url: '/basic-api/mch/store/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, mchNo, storeId, storeName, status } = query;
      const storeList = [];
      for (let i = 1; i <= 40; i++) {
        const merchant = mockMerchantList[i % mockMerchantList.length];
        storeList.push({
          id: i,
          storeId: 'S' + String(1000 + i),
          storeName: ['南山科技园店', '福田CBD店', '罗湖万象城店', '宝安中心店'][i % 4],
          mchNo: mchNo || merchant.mchNo,
          mchName: merchant.mchName,
          storeType: i % 3,
          storeTypeName: ['直营店', '加盟店', '联营店'][i % 3],
          contactName: ['张三', '李四', '王五', '赵六'][i % 4],
          contactMobile: '138' + String(10000000 + i * 111111),
          province: '广东省',
          city: '深圳市',
          district: ['南山区', '福田区', '罗湖区', '宝安区'][i % 4],
          address: ['科技园路' + i + '号', '福华三路' + i + '号', '万象城' + i + '楼', '宝安大道' + i + '号'][i % 4],
          deviceCount: Math.floor(Math.random() * 10),
          status: Math.floor(Math.random() * 2),
          statusName: ['正常', '停用'][Math.floor(Math.random() * 2)],
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 90).toISOString().replace('T', ' ').substring(0, 19),
        });
      }

      let filteredList = [...storeList];
      if (mchNo) filteredList = filteredList.filter(item => item.mchNo.includes(mchNo));
      if (storeId) filteredList = filteredList.filter(item => item.storeId.includes(storeId));
      if (storeName) filteredList = filteredList.filter(item => item.storeName.includes(storeName));
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

  // 商户门店详情
  {
    url: '/basic-api/mch/store/:storeId',
    timeout: 300,
    method: 'get',
    response: ({ pathParams }) => {
      return resultSuccess({
        id: 1,
        storeId: pathParams.storeId,
        storeName: '南山科技园店',
        mchNo: 'M10001',
        mchName: '测试商户001',
        storeType: 0,
        storeTypeName: '直营店',
        contactName: '张三',
        contactMobile: '13800138000',
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        address: '科技园路1号',
        deviceCount: 5,
        status: 1,
        statusName: '正常',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    },
  },

  // 创建商户门店
  {
    url: '/basic-api/mch/store',
    timeout: 500,
    method: 'post',
    response: ({ body }) => {
      return resultSuccess({
        id: Date.now(),
        storeId: 'S' + Date.now(),
        ...body,
        status: 1,
        statusName: '正常',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    },
  },

  // 更新商户门店
  {
    url: '/basic-api/mch/store/:storeId',
    timeout: 500,
    method: 'put',
    response: () => resultSuccess(true),
  },

  // 删除商户门店
  {
    url: '/basic-api/mch/store/:storeId',
    timeout: 300,
    method: 'delete',
    response: () => resultSuccess(true),
  },
] as MockMethod[];
