import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const ops: AppRouteModule = {
  path: '/ops',
  name: 'Ops',
  component: LAYOUT,
  redirect: '/ops/overview',
  meta: {
    orderNo: 5,
    icon: 'ant-design:monitor-outlined',
    title: '运维监控',
  },
  children: [
    {
      path: 'overview',
      name: 'OpsOverview',
      component: () => import('@/views/ops/overview/index.vue'),
      meta: { title: '综合概览' },
    },
    {
      path: 'server',
      name: 'OpsServer',
      component: () => import('@/views/ops/server/index.vue'),
      meta: { title: '服务器监控' },
    },
    {
      path: 'service',
      name: 'OpsService',
      component: () => import('@/views/ops/service/index.vue'),
      meta: { title: '服务监控' },
    },
    {
      path: 'app',
      name: 'OpsApp',
      component: () => import('@/views/ops/app/index.vue'),
      meta: { title: '应用监控' },
    },
    {
      path: 'network',
      name: 'OpsNetwork',
      component: () => import('@/views/ops/network/index.vue'),
      meta: { title: '网络监控' },
    },
    {
      path: 'business',
      name: 'OpsBusiness',
      component: () => import('@/views/ops/business/index.vue'),
      meta: { title: '业务指标' },
    },
    {
      path: 'log',
      name: 'OpsLog',
      component: () => import('@/views/ops/log/index.vue'),
      meta: { title: '日志监控' },
    },
    {
      path: 'alert',
      name: 'OpsAlert',
      component: () => import('@/views/ops/alert/index.vue'),
      meta: { title: '告警中心' },
    },
  ],
};

export default ops;
