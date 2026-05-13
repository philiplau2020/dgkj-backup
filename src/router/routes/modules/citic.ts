import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const citic: AppRouteModule = {
  path: '/citic',
  name: 'Citic',
  component: LAYOUT,
  redirect: '/citic/account',
  meta: {
    orderNo: 95,
    icon: 'ant-design:bank-outlined',
    title: '中信银行E管家',
  },
  children: [
    {
      path: 'account',
      name: 'CiticAccount',
      component: () => import('@/views/citic/account/index.vue'),
      meta: { title: '账户管理' },
    },
    {
      path: 'card',
      name: 'CiticCard',
      component: () => import('@/views/citic/card/index.vue'),
      meta: { title: '银行卡管理' },
    },
    {
      path: 'collection',
      name: 'CiticCollection',
      component: () => import('@/views/citic/collection/index.vue'),
      meta: { title: '资金归集' },
    },
    {
      path: 'profit-share',
      name: 'CiticProfitShare',
      component: () => import('@/views/citic/profit-share/index.vue'),
      meta: { title: '余额分账' },
    },
    {
      path: 'transfer',
      name: 'CiticTransfer',
      component: () => import('@/views/citic/transfer/index.vue'),
      meta: { title: '代付打款' },
    },
    {
      path: 'settle',
      name: 'CiticSettle',
      component: () => import('@/views/citic/settle/index.vue'),
      meta: { title: '结算管理' },
    },
    {
      path: 'check',
      name: 'CiticCheck',
      component: () => import('@/views/citic/check/index.vue'),
      meta: { title: '对账管理' },
    },
    {
      path: 'config',
      name: 'CiticConfig',
      component: () => import('@/views/citic/config/index.vue'),
      meta: { title: '银行配置' },
    },
  ],
};

export default citic;
