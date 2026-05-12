import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const trade: AppRouteModule = {
  path: '/trade',
  name: 'Trade',
  component: LAYOUT,
  redirect: '/trade/order',
  meta: {
    orderNo: 40,
    icon: 'ant-design:transaction-outlined',
    title: '订单管理',
  },
  children: [
    {
      path: 'order',
      name: 'TradeOrder',
      component: () => import('@/views/trade/order/index.vue'),
      meta: { title: '支付订单' },
    },
    {
      path: 'refund',
      name: 'TradeRefund',
      component: () => import('@/views/trade/refund/index.vue'),
      meta: { title: '退款订单' },
    },
    {
      path: 'transfer',
      name: 'TradeTransfer',
      component: () => import('@/views/trade/transfer/index.vue'),
      meta: { title: '转账订单' },
    },
    {
      path: 'notify',
      name: 'TradeNotify',
      component: () => import('@/views/trade/notify/index.vue'),
      meta: { title: '商户通知' },
    },
    {
      path: 'withdraw',
      name: 'TradeWithdraw',
      component: () => import('@/views/trade/withdraw/index.vue'),
      meta: { title: '提现记录' },
    },
  ],
};

export default trade;
