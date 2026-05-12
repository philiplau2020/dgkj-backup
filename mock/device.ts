/**
 * 设备管理 Mock 数据
 */
import { resultSuccess } from './_util';
import type { MockMethod } from 'vite-plugin-mock';

const mockDeviceList = [];
for (let i = 1; i <= 50; i++) {
  const deviceTypes = ['qrcode', 'speaker', 'printer', 'pos'];
  const typeIdx = i % 4;
  const deviceType = deviceTypes[typeIdx];
  mockDeviceList.push({
    id: i,
    deviceNo: 'DEV' + String(i).padStart(6, '0'),
    deviceName: ['码牌_' + i, '云喇叭_' + i, '云打印机_' + i, '扫码POS_' + i][typeIdx],
    deviceType,
    deviceTypeName: ['码牌', '云喇叭', '云打印机', '扫码POS'][typeIdx],
    mchNo: i % 3 === 0 ? 'M10001' : i % 3 === 1 ? 'M10002' : null,
    mchName: i % 3 === 0 ? '测试商户001' : i % 3 === 1 ? '测试商户002' : null,
    storeId: i % 5 === 0 ? 'S00' + i : null,
    storeName: i % 5 === 0 ? '门店' + i : null,
    sn: 'SN' + Date.now().toString().slice(0, 8) + i,
    status: Math.floor(Math.random() * 3),
    statusName: ['未激活', '正常', '故障'][Math.floor(Math.random() * 3)],
    activateTime: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 86400000 * 30).toISOString() : null,
    lastHeartbeat: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 3600000).toISOString() : null,
    remark: i % 5 === 0 ? '备注' + i : '',
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 90).toISOString(),
  });
}

const mockActivationCodes = [];
for (let i = 1; i <= 30; i++) {
  const batchNo = 'BATCH' + Math.floor(i / 5);
  const deviceTypes = ['qrcode', 'speaker', 'printer', 'pos'];
  mockActivationCodes.push({
    id: i,
    code: 'ACT' + String(1000 + i),
    batchNo,
    deviceType: deviceTypes[i % 4],
    deviceTypeName: ['码牌', '云喇叭', '云打印机', '扫码POS'][i % 4],
    status: Math.random() > 0.3 ? 1 : 0,
    statusName: Math.random() > 0.3 ? '已使用' : '未使用',
    usedTime: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 86400000 * 15).toISOString() : null,
    usedMchNo: Math.random() > 0.3 ? 'M1000' + (i % 3 + 1) : null,
    usedMchName: Math.random() > 0.3 ? '测试商户00' + (i % 3 + 1) : null,
    expireTime: new Date(Date.now() + Math.random() * 86400000 * 365).toISOString(),
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 60).toISOString(),
  });
}

const mockQrcodeList = mockDeviceList.filter(d => d.deviceType === 'qrcode');
const mockSpeakerList = mockDeviceList.filter(d => d.deviceType === 'speaker');
const mockPrinterList = mockDeviceList.filter(d => d.deviceType === 'printer');
const mockPosList = mockDeviceList.filter(d => d.deviceType === 'pos');

function getStatusColor(status) {
  return { 0: 'default', 1: 'success', 2: 'error' }[status] || 'default';
}

function getStatusName(status) {
  return ['未激活', '正常', '故障'][status] || '未知';
}

export default [
  // 设备列表
  {
    url: '/basic-api/device/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, deviceNo, deviceType, status } = query;
      let list = [...mockDeviceList];
      if (deviceNo) list = list.filter(item => item.deviceNo.includes(deviceNo));
      if (deviceType) list = list.filter(item => item.deviceType === deviceType);
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, end) });
    },
  },
  // 设备详情
  {
    url: '/basic-api/device/:id',
    timeout: 300,
    method: 'get',
    response: ({ pathParams }) => {
      const device = mockDeviceList.find(item => item.id === Number(pathParams.id));
      return resultSuccess(device);
    },
  },
  // 创建设备
  {
    url: '/basic-api/device',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ id: Date.now(), ...body, createdAt: new Date().toISOString() }),
  },
  // 更新设备
  {
    url: '/basic-api/device/:id',
    timeout: 500,
    method: 'put',
    response: () => resultSuccess(true),
  },
  // 绑定设备
  {
    url: '/basic-api/device/:id/bind',
    timeout: 500,
    method: 'put',
    response: () => resultSuccess({ success: true }),
  },
  // 激活码列表
  {
    url: '/basic-api/device/code/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, code, batchNo, status } = query;
      let list = [...mockActivationCodes];
      if (code) list = list.filter(item => item.code.includes(code));
      if (batchNo) list = list.filter(item => item.batchNo.includes(batchNo));
      if (status !== undefined && status !== '') list = list.filter(item => item.status === Number(status));
      const total = list.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: list.slice(start, start + Number(pageSize)) });
    },
  },
  // 生成激活码
  {
    url: '/basic-api/device/code',
    timeout: 500,
    method: 'post',
    response: ({ body }) => resultSuccess({ id: Date.now(), ...body, createdAt: new Date().toISOString() }),
  },
  // 码牌列表
  {
    url: '/basic-api/device/qrcode/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const total = mockQrcodeList.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: mockQrcodeList.slice(start, start + Number(pageSize)) });
    },
  },
  // 云喇叭列表
  {
    url: '/basic-api/device/speaker/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const total = mockSpeakerList.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: mockSpeakerList.slice(start, start + Number(pageSize)) });
    },
  },
  // 云打印列表
  {
    url: '/basic-api/device/printer/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const total = mockPrinterList.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: mockPrinterList.slice(start, start + Number(pageSize)) });
    },
  },
  // 扫码POS列表
  {
    url: '/basic-api/device/pos/list',
    timeout: 500,
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      const total = mockPosList.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({ total, page: Number(page), pageSize: Number(pageSize), list: mockPosList.slice(start, start + Number(pageSize)) });
    },
  },
] as MockMethod[];
