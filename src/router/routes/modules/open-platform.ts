import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const openPlatform: AppRouteModule = {
  path: '/open-platform',
  name: 'OpenPlatform',
  component: LAYOUT,
  redirect: '/open-platform/docs',
  meta: {
    orderNo: 3,
    icon: 'ant-design:api-outlined',
    title: '开放平台',
  },
  children: [
    {
      path: 'docs',
      name: 'OpenPlatformDocs',
      component: () => import('@/views/open-platform/docs/index.vue'),
      meta: { title: 'API文档', icon: 'ant-design:book-outlined' },
    },
    {
      path: 'developer',
      name: 'OpenPlatformDeveloper',
      component: () => import('@/views/open-platform/developer/index.vue'),
      meta: { title: '开发者中心' },
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
