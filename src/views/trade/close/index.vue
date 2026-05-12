<template>
  <div class="trade-close">
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'amount'">
          <span class="amount">￥{{ record.amount }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <Badge :status="'default'" text="已取消" />
        </template>
      </template>
    </BasicTable>
  </div>
</template>

<script setup lang="ts">
import { useTable } from '@/components/Table';
import { Badge } from 'ant-design-vue';

const [registerTable] = useTable({
  api: async (params) => {
    const res = await fetch(`/basic-api/trade/close/list?${new URLSearchParams(params)}`);
    return (await res.json()).result;
  },
  columns: [
    { title: '订单号', dataIndex: 'orderNo', width: 180 },
    { title: '商户', dataIndex: 'mchName', width: 150 },
    { title: '金额', key: 'amount', width: 120 },
    { title: '支付渠道', dataIndex: 'payChannelText', width: 100 },
    { title: '状态', key: 'status', width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', width: 180 },
  ],
  showTableSetting: true,
  bordered: true,
});
</script>

<style scoped>
.amount {
  color: #999;
  text-decoration: line-through;
}
</style>
