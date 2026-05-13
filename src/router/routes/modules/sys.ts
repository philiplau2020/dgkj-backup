import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const sys: AppRouteModule = {
  path: '/system',
  name: 'System',
  component: LAYOUT,
  redirect: '/system/user',
  meta: {
    orderNo: 90,
    icon: 'ion:settings-outline',
    title: '系统管理',
  },
  children: [
    {
      path: 'user',
      name: 'SystemUser',
      component: () => import('@/views/sys/user/index.vue'),
      meta: { title: '操作员管理' },
    },
    {
      path: 'role',
      name: 'SystemRole',
      component: () => import('@/views/sys/role/index.vue'),
      meta: { title: '角色管理' },
    },
    {
      path: 'dept',
      name: 'SystemDept',
      component: () => import('@/views/sys/dept/index.vue'),
      meta: { title: '团队管理' },
    },
    {
      path: 'menu',
      name: 'SystemMenu',
      component: () => import('@/views/sys/menu/index.vue'),
      meta: { title: '菜单权限' },
    },
    {
      path: 'dict',
      name: 'SystemDict',
      component: () => import('@/views/sys/dict/index.vue'),
      meta: { title: '字典管理' },
    },
    {
      path: 'notice',
      name: 'SystemNotice',
      component: () => import('@/views/sys/notice/index.vue'),
      meta: { title: '公告管理' },
    },
    {
      path: 'config',
      name: 'SystemConfig',
      component: () => import('@/views/sys/config/index.vue'),
      meta: { title: '系统配置' },
    },
    {
      path: 'log',
      name: 'SystemLog',
      component: () => import('@/views/sys/log/index.vue'),
      meta: { title: '系统日志' },
    },
    {
      path: 'notify',
      name: 'SystemNotify',
      component: () => import('@/views/sys/notify/index.vue'),
      meta: { title: '通知管理' },
    },
  ],
};

export default sys;
