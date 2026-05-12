<template>
  <div class="finance-withdraw">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleAdd">申请代付</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'amount'">
          <span class="amount">￥{{ record.amount }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <Badge :status="getStatusType(record.status)" :text="record.statusText" />
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
    const res = await fetch(`/basic-api/finance/withdraw/list?${new URLSearchParams(params)}`);
    return (await res.json()).result;
  },
  columns: [
    { title: '代付单号', dataIndex: 'withdrawNo', width: 180 },
    { title: '商户', dataIndex: 'mchName', width: 150 },
    { title: '代付金额', key: 'amount', width: 120 },
    { title: '手续费', dataIndex: 'fee', width: 100 },
    { title: '收款人', dataIndex: 'realName', width: 100 },
    { title: '银行', dataIndex: 'bankName', width: 100 },
    { title: '银行账号', dataIndex: 'bankAccount', width: 150 },
    { title: '状态', key: 'status', width: 100 },
    { title: '到账时间', dataIndex: 'notifyTime', width: 180 },
    { title: '申请时间', dataIndex: 'createdAt', width: 180 },
  ],
  showTableSetting: true,
  bordered: true,
});

function getStatusType(status: number) {
  const map: Record<number, string> = { 0: 'warning', 1: 'success' };
  return map[status] || 'default';
}

function handleAdd() {
  console.log('申请代付');
}
</script>

<style scoped>
.amount {
  color: #f5222d;
  font-weight: 600;
}
</style>
