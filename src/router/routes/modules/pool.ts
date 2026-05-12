import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const pool: AppRouteModule = {
  path: '/pool',
  name: 'Pool',
  component: LAYOUT,
  redirect: '/pool/index',
  meta: {
    orderNo: 70,
    icon: 'ant-design:swap-outlined',
    title: '轮转池管理',
  },
  children: [
    {
      path: 'index',
      name: 'PoolIndex',
      component: () => import('@/views/pool/index.vue'),
      meta: { title: '轮转池管理' },
    },
    {
      path: 'channel',
      name: 'PoolChannel',
      component: () => import('@/views/pool/index.vue'),
      meta: { title: '通道管理' },
    },
    {
      path: 'rule',
      name: 'PoolRule',
      component: () => import('@/views/pool/index.vue'),
      meta: { title: '规则配置' },
    },
    {
      path: 'strategy',
      name: 'PoolStrategy',
      component: () => import('@/views/pool/index.vue'),
      meta: { title: '策略管理' },
    },
  ],
};

export default pool;
