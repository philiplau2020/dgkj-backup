import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const statistics: AppRouteModule = {
  path: '/statistics',
  name: 'Statistics',
  component: LAYOUT,
  redirect: '/statistics/trade',
  meta: {
    orderNo: 45,
    icon: 'ant-design:bar-chart-outlined',
    title: '数据统计',
  },
  children: [
    {
      path: 'trade',
      name: 'StatTrade',
      component: () => import('@/views/statistics/trade/index.vue'),
      meta: { title: '交易统计' },
    },
    {
      path: 'merchant',
      name: 'StatMerchant',
      component: () => import('@/views/statistics/merchant/index.vue'),
      meta: { title: '商户统计' },
    },
    {
      path: 'agent',
      name: 'StatAgent',
      component: () => import('@/views/statistics/agent/index.vue'),
      meta: { title: '代理商统计' },
    },
    {
      path: 'channel',
      name: 'StatChannel',
      component: () => import('@/views/statistics/channel/index.vue'),
      meta: { title: '通道统计' },
    },
    {
      path: 'finance',
      name: 'StatFinance',
      component: () => import('@/views/statistics/finance/index.vue'),
      meta: { title: '财务统计' },
    },
  ],
};

export default statistics;
