import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const openPlatform: AppRouteModule = {
  path: '/open-platform',
  name: 'OpenPlatform',
  component: LAYOUT,
  redirect: '/open-platform/overview',
  meta: {
    orderNo: 3,
    icon: 'ant-design:api-outlined',
    title: '开放平台',
  },
  children: [
    {
      path: 'overview',
      name: 'OpenPlatformOverview',
      component: () => import('@/views/open-platform/overview/index.vue'),
      meta: { title: '平台首页' },
    },
    {
      path: 'developer',
      name: 'OpenPlatformDeveloper',
      component: () => import('@/views/open-platform/developer/index.vue'),
      meta: { title: '开发者中心' },
    },
    {
      path: 'document',
      name: 'OpenPlatformDocument',
      component: () => import('@/views/open-platform/document/index.vue'),
      meta: { title: 'API文档' },
    },
    {
      path: 'debug',
      name: 'OpenPlatformDebug',
      component: () => import('@/views/open-platform/debug/index.vue'),
      meta: { title: '在线调试' },
    },
    {
      path: 'webhook',
      name: 'OpenPlatformWebhook',
      component: () => import('@/views/open-platform/developer/webhook.vue'),
      meta: { title: 'Webhook管理' },
    },
  ],
};

export default openPlatform;
