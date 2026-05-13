/**
 * 轮转池路由配置
 */

import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const poolRoutes: AppRouteModule = {
  path: '/pool',
  name: 'Pool',
  component: LAYOUT,
  redirect: '/pool/channel-mch',
  meta: {
    title: '轮转池管理',
    icon: 'ion:git-compare-outline',
    orderNo: 50,
  },
  children: [
    {
      path: 'channel-mch',
      name: 'PoolChannelMch',
      component: () => import('@/views/pool/channel-mch/index.vue'),
      meta: { title: '通道商户管理' },
    },
    {
      path: 'monitor',
      name: 'PoolMonitor',
      component: () => import('@/views/pool/monitor/index.vue'),
      meta: { title: '实时监控' },
    },
    {
      path: 'strategy',
      name: 'PoolStrategy',
      component: () => import('@/views/pool/strategy/index.vue'),
      meta: { title: '路由策略' },
    },
  ],
};

export default poolRoutes;
