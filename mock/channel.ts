/**
 * 通道管理 Mock 数据
 */
import { resultSuccess } from './_util';
import type { MockMethod } from 'vite-plugin-mock';

// 通道商户列表
const mockChannelMchList = [
  { id: 1, channelCode: 'WX_QR_01', channelName: '微信扫码通道01', appId: 'wx1234567890', mchId: 'WX10001', status: 1, statusText: '正常', balance: '50000.00', todayAmount: '18652.50', todayCount: 128 },
  { id: 2, channelCode: 'ALI_QR_01', channelName: '支付宝扫码01', appId: 'ali1234567890', mchId: 'ALI10001', status: 1, statusText: '正常', balance: '30000.00', todayAmount: '12680.00', todayCount: 86 },
  { id: 3, channelCode: 'CT_QR_01', channelName: '通联扫码01', appId: 'ct1234567890', mchId: 'CT10001', status: 1, statusText: '正常', balance: '80000.00', todayAmount: '42800.00', todayCount: 56 },
  { id: 4, channelCode: 'HF_QR_01', channelName: '汇付扫码01', appId: 'hf1234567890', mchId: 'HF10001', status: 0, statusText: '停用', balance: '0.00', todayAmount: '0.00', todayCount: 0 },
  { id: 5, channelCode: 'CITIC_QR_01', channelName: '中信银行01', appId: 'citic1234567890', mchId: 'CITIC10001', status: 1, statusText: '正常', balance: '200000.00', todayAmount: '32500.00', todayCount: 18 },
];

// 路由配置列表
const mockRouteList = [
  { id: 1, routeName: '微信优先策略', routeCode: 'ROUTE_WX_FIRST', priority: 10, channels: 'WX_QR_01,WX_QR_02', status: 1, statusText: '启用', remark: '金额<500优先走微信' },
  { id: 2, routeName: '通联大额策略', routeCode: 'ROUTE_CT_LARGE', priority: 20, channels: 'CT_QR_01', status: 1, statusText: '启用', remark: '金额>=5000走通联' },
  { id: 3, routeName: '中信银行兜底', routeCode: 'ROUTE_CITIC_BACKUP', priority: 30, channels: 'CITIC_QR_01', status: 1, statusText: '启用', remark: '其他通道失败时兜底' },
  { id: 4, routeName: '轮询策略', routeCode: 'ROUTE_ROUND_ROBIN', priority: 100, channels: 'WX_QR_01,ALI_QR_01', status: 1, statusText: '启用', remark: '按权重轮询' },
];

export default [
  // 通道商户列表
  {
    url: '/basic-api/channel/mch/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      
      return resultSuccess({
        total: mockChannelMchList.length,
        page: Number(page),
        pageSize: Number(pageSize),
        list: mockChannelMchList.slice(start, end),
      });
    },
  },

  // 路由列表
  {
    url: '/basic-api/channel/route/list',
    timeout: 500,
    method: 'get',
    response: () => {
      return resultSuccess(mockRouteList);
    },
  },
] as MockMethod[];
