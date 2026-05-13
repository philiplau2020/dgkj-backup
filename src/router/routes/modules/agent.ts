import { RouteRecordRaw } from 'vue-router';

const agentRoutes: RouteRecordRaw[] = [
  {
    path: '/agent',
    name: 'Agent',
    redirect: '/agent/dashboard',
    meta: { title: '代理商管理', icon: 'team', roles: ['agent'] },
    children: [
      {
        path: 'dashboard',
        name: 'AgentDashboard',
        component: () => import('@/views/agent/dashboard/index.vue'),
        meta: { title: '代理首页', roles: ['agent'] },
      },
      {
        path: 'merchant',
        name: 'AgentMerchant',
        component: () => import('@/views/agent/list/index.vue'),
        meta: { title: '商户管理', roles: ['agent'] },
      },
      {
        path: 'withdraw',
        name: 'AgentWithdraw',
        component: () => import('@/views/agent/withdraw/index.vue'),
        meta: { title: '提现申请', roles: ['agent'] },
      },
      {
        path: 'profit',
        name: 'AgentProfit',
        component: () => import('@/views/profit/record/index.vue'),
        meta: { title: '收益明细', roles: ['agent'] },
      },
      {
        path: 'statistics',
        name: 'AgentStatistics',
        component: () => import('@/views/statistics/agent/index.vue'),
        meta: { title: '数据统计', roles: ['agent'] },
      },
      {
        path: 'audit',
        name: 'AgentAudit',
        component: () => import('@/views/agent/audit/index.vue'),
        meta: { title: '审核管理', roles: ['agent'] },
      },
    ],
  },
];

export default agentRoutes;
