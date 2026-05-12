import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const device: AppRouteModule = {
  path: '/device',
  name: 'Device',
  component: LAYOUT,
  redirect: '/device/code',
  meta: {
    orderNo: 65,
    icon: 'ant-design:mobile-outlined',
    title: '设备配置',
  },
  children: [
    {
      path: 'code',
      name: 'DeviceCode',
      component: () => import('@/views/device/code/index.vue'),
      meta: { title: '码牌管理' },
    },
    {
      path: 'speaker',
      name: 'DeviceSpeaker',
      component: () => import('@/views/device/speaker/index.vue'),
      meta: { title: '云喇叭' },
    },
    {
      path: 'printer',
      name: 'DevicePrinter',
      component: () => import('@/views/device/printer/index.vue'),
      meta: { title: '云打印' },
    },
    {
      path: 'pos',
      name: 'DevicePos',
      component: () => import('@/views/device/pos/index.vue'),
      meta: { title: '扫码POS' },
    },
    {
      path: 'activation',
      name: 'DeviceActivation',
      component: () => import('@/views/device/activation/index.vue'),
      meta: { title: '激活码管理' },
    },
  ],
};

export default device;
