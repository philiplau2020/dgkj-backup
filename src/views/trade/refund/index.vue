<template>
  <div class="trade-refund">
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'amount'">
          <span class="amount">￥{{ record.amount }}</span>
        </template>
        <template v-else-if="column.key === 'refundAmount'">
          <span class="refund">-￥{{ record.refundAmount }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <Badge :status="getStatusType(record.status)" :text="record.statusText" />
        </template>
        <template v-else-if="column.key === 'action'">
          <a @click="handleView(record)">详情</a>
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
    const res = await fetch(`/basic-api/refund/list?${new URLSearchParams(params)}`);
    return (await res.json()).result;
  },
  columns: [
    { title: '退款单号', dataIndex: 'refundNo', width: 180 },
    { title: '原订单号', dataIndex: 'orderNo', width: 180 },
    { title: '商户', dataIndex: 'mchName', width: 150 },
    { title: '订单金额', key: 'amount', width: 120 },
    { title: '退款金额', key: 'refundAmount', width: 120 },
    { title: '状态', key: 'status', width: 100 },
    { title: '退款原因', dataIndex: 'refundReason', width: 200 },
    { title: '退款时间', dataIndex: 'refundTime', width: 180 },
    { title: '操作', key: 'action', width: 80 },
  ],
  useSearchForm: true,
  formConfig: {
    labelWidth: 80,
    schemas: [
      { field: 'refundNo', label: '退款单号', component: 'Input', colProps: { span: 6 } },
      { field: 'orderNo', label: '原订单号', component: 'Input', colProps: { span: 6 } },
    ],
  },
  showTableSetting: true,
  bordered: true,
});

function getStatusType(status: number) {
  const map: Record<number, string> = { 0: 'warning', 1: 'success' };
  return map[status] || 'default';
}

function handleView(record: any) {
  console.log('查看详情', record);
}
</script>

<style scoped>
.amount {
  color: #666;
}
.refund {
  color: #f5222d;
  font-weight: 500;
}
</style>
