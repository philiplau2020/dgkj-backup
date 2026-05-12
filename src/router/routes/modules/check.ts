import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const check: AppRouteModule = {
  path: '/check',
  name: 'Check',
  component: LAYOUT,
  redirect: '/check/batch',
  meta: {
    orderNo: 60,
    icon: 'ant-design:audit-outlined',
    title: '对账管理',
  },
  children: [
    {
      path: 'batch',
      name: 'CheckBatch',
      component: () => import('@/views/check/batch/index.vue'),
      meta: { title: '对账批次' },
    },
    {
      path: 'channel-bill',
      name: 'CheckChannelBill',
      component: () => import('@/views/check/channel-bill/index.vue'),
      meta: { title: '渠道账单' },
    },
    {
      path: 'diff-bill',
      name: 'CheckDiffBill',
      component: () => import('@/views/check/diff-bill/index.vue'),
      meta: { title: '差异账单' },
    },
  ],
};

export default check;
