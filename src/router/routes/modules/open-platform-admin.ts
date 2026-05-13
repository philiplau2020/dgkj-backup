import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const openPlatformAdmin: AppRouteModule = {
  path: '/open-platform-admin',
  name: 'OpenPlatformAdmin',
  component: LAYOUT,
  redirect: '/open-platform-admin/overview',
  meta: {
    orderNo: 5,
    icon: 'ant-design:api-outlined',
    title: '开放平台管理',
  },
  children: [
    {
      path: 'overview',
      name: 'OpenPlatformAdminOverview',
      component: () => import('@/views/open-platform/admin/index.vue'),
      meta: { title: '平台概览' },
    },
    {
      path: 'developer',
      name: 'OpenPlatformAdminDeveloper',
      component: () => import('@/views/open-platform/admin/developer.vue'),
      meta: { title: '开发者管理' },
    },
    {
      path: 'app',
      name: 'OpenPlatformAdminApp',
      component: () => import('@/views/open-platform/admin/app.vue'),
      meta: { title: '应用管理' },
    },
    {
      path: 'log',
      name: 'OpenPlatformAdminLog',
      component: () => import('@/views/open-platform/admin/log.vue'),
      meta: { title: '调用日志' },
    },
    {
      path: 'docs',
      name: 'OpenPlatformAdminDocs',
      component: () => import('@/views/open-platform/docs/index.vue'),
      meta: { title: 'API文档' },
    },
  ],
};

export default openPlatformAdmin;
