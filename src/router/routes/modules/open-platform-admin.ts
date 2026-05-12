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
      meta: { title: '平台管理' },
    },
  ],
};

export default openPlatformAdmin;
