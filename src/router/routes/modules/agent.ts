import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const agent: AppRouteModule = {
  path: '/agent',
  name: 'Agent',
  component: LAYOUT,
  redirect: '/agent/list',
  meta: {
    orderNo: 35,
    icon: 'ant-design:team-outlined',
    title: '代理商管理',
  },
  children: [
    {
      path: 'list',
      name: 'AgentList',
      component: () => import('@/views/agent/list/index.vue'),
      meta: { title: '代理商列表' },
    },
    {
      path: 'audit',
      name: 'AgentAudit',
      component: () => import('@/views/agent/audit/index.vue'),
      meta: { title: '代理商审核' },
    },
    {
      path: 'profit',
      name: 'AgentProfit',
      component: () => import('@/views/agent/profit/index.vue'),
      meta: { title: '佣金管理' },
    },
    {
      path: 'withdraw',
      name: 'AgentWithdraw',
      component: () => import('@/views/agent/withdraw/index.vue'),
      meta: { title: '提现申请' },
    },
  ],
};

export default agent;
