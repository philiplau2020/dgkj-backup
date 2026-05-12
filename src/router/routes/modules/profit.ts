import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const profit: AppRouteModule = {
  path: '/profit',
  name: 'Profit',
  component: LAYOUT,
  redirect: '/profit/account-group',
  meta: {
    orderNo: 55,
    icon: 'ant-design:account-book-outlined',
    title: '分账管理',
  },
  children: [
    {
      path: 'account-group',
      name: 'ProfitAccountGroup',
      component: () => import('@/views/profit/account-group/index.vue'),
      meta: { title: '账号组管理' },
    },
    {
      path: 'receiver',
      name: 'ProfitReceiver',
      component: () => import('@/views/profit/receiver/index.vue'),
      meta: { title: '收款账号管理' },
    },
    {
      path: 'record',
      name: 'ProfitRecord',
      component: () => import('@/views/profit/record/index.vue'),
      meta: { title: '分账记录' },
    },
    {
      path: 'rollback',
      name: 'ProfitRollback',
      component: () => import('@/views/profit/rollback/index.vue'),
      meta: { title: '分账回退记录' },
    },
  ],
};

export default profit;
