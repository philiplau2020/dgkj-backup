import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const merchant: AppRouteModule = {
  path: '/merchant',
  name: 'Merchant',
  component: LAYOUT,
  redirect: '/merchant/list',
  meta: {
    orderNo: 30,
    icon: 'ant-design:shop-outlined',
    title: '商户管理',
  },
  children: [
    {
      path: 'list',
      name: 'MerchantList',
      component: () => import('@/views/mch/list/index.vue'),
      meta: { title: '商户列表' },
    },
    {
      path: 'app',
      name: 'MerchantApp',
      component: () => import('@/views/mch/app/index.vue'),
      meta: { title: '应用列表' },
    },
    {
      path: 'entry',
      name: 'MerchantEntry',
      component: () => import('@/views/mch/entry/index.vue'),
      meta: { title: '进件管理' },
    },
    {
      path: 'store',
      name: 'MerchantStore',
      component: () => import('@/views/mch/store/index.vue'),
      meta: { title: '门店管理' },
    },
    {
      path: 'rate',
      name: 'MerchantRate',
      component: () => import('@/views/mch/rate/index.vue'),
      meta: { title: '商户费率' },
    },
  ],
};

export default merchant;
