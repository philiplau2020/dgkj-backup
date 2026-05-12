import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const channel: AppRouteModule = {
  path: '/channel',
  name: 'Channel',
  component: LAYOUT,
  redirect: '/channel/config',
  meta: {
    orderNo: 60,
    icon: 'ant-design:gateway-outlined',
    title: '渠道管理',
  },
  children: [
    {
      path: 'config',
      name: 'ChannelConfig',
      component: () => import('@/views/channel/config/index.vue'),
      meta: { title: '渠道配置' },
    },
    {
      path: 'mch',
      name: 'ChannelMch',
      component: () => import('@/views/channel/mch/index.vue'),
      meta: { title: '通道商户' },
    },
    {
      path: 'route',
      name: 'ChannelRoute',
      component: () => import('@/views/channel/route/index.vue'),
      meta: { title: '路由配置' },
    },
  ],
};

export default channel;
