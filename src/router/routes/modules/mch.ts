import { RouteRecordRaw } from 'vue-router';

const mchRoutes: RouteRecordRaw[] = [
  {
    path: '/mch',
    name: 'Mch',
    redirect: '/mch/dashboard',
    meta: { title: '商户管理', icon: 'shop', roles: ['mch'] },
    children: [
      {
        path: 'dashboard',
        name: 'MchDashboard',
        component: () => import('@/views/mch/dashboard/index.vue'),
        meta: { title: '商户首页', roles: ['mch'] },
      },
      {
        path: 'order',
        name: 'MchOrder',
        component: () => import('@/views/trade/order/index.vue'),
        meta: { title: '交易订单', roles: ['mch'] },
      },
      {
        path: 'transfer',
        name: 'MchTransfer',
        component: () => import('@/views/trade/transfer/index.vue'),
        meta: { title: '转账操作', roles: ['mch'] },
      },
      {
        path: 'settle',
        name: 'MchSettle',
        component: () => import('@/views/citic/settle/index.vue'),
        meta: { title: '结算记录', roles: ['mch'] },
      },
      {
        path: 'config',
        name: 'MchConfig',
        component: () => import('@/views/channel/config/index.vue'),
        meta: { title: '通道配置', roles: ['mch'] },
      },
      {
        path: 'channel-bill',
        name: 'MchChannelBill',
        component: () => import('@/views/check/channel-bill/index.vue'),
        meta: { title: '通道对账', roles: ['mch'] },
      },
      {
        path: 'entry',
        name: 'MchEntry',
        component: () => import('@/views/mch/entry/index.vue'),
        meta: { title: '进件管理', roles: ['mch'] },
      },
    ],
  },
];

export default mchRoutes;
