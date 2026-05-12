import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const finance: AppRouteModule = {
  path: '/finance',
  name: 'Finance',
  component: LAYOUT,
  redirect: '/finance/account',
  meta: {
    orderNo: 25,
    icon: 'ant-design:wallet-outlined',
    title: '账户中心',
  },
  children: [
    {
      path: 'account',
      name: 'FinanceAccount',
      component: () => import('@/views/finance/account/index.vue'),
      meta: { title: '账户信息' },
    },
    {
      path: 'record',
      name: 'FinanceRecord',
      component: () => import('@/views/finance/record/index.vue'),
      meta: { title: '账务记录' },
    },
    {
      path: 'settlement',
      name: 'FinanceSettlement',
      component: () => import('@/views/finance/settlement/index.vue'),
      meta: { title: '结算管理' },
    },
    {
      path: 'withdraw',
      name: 'FinanceWithdraw',
      component: () => import('@/views/finance/withdraw/index.vue'),
      meta: { title: '提现管理' },
    },
    {
      path: 'statement',
      name: 'FinanceStatement',
      component: () => import('@/views/finance/statement/index.vue'),
      meta: { title: '对账报表' },
    },
  ],
};

export default finance;
