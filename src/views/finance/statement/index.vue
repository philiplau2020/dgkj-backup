<template>
  <div class="finance-statement">
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'totalAmount'">
          <span class="amount">￥{{ record.totalAmount }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <Badge :status="record.status === 1 ? 'success' : 'error'" :text="record.statusText" />
        </template>
        <template v-else-if="column.key === 'action'">
          <a @click="handleView(record)">对账详情</a>
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
    const res = await fetch(`/basic-api/finance/statement/list?${new URLSearchParams(params)}`);
    return (await res.json()).result;
  },
  columns: [
    { title: '对账单号', dataIndex: 'statementNo', width: 150 },
    { title: '对账日期', dataIndex: 'statDate', width: 120 },
    { title: '交易总额', key: 'totalAmount', width: 130 },
    { title: '成功金额', dataIndex: 'successAmount', width: 130 },
    { title: '失败金额', dataIndex: 'failAmount', width: 120 },
    { title: '笔数', dataIndex: 'totalCount', width: 80 },
    { title: '差异金额', dataIndex: 'diffAmount', width: 120 },
    { title: '状态', key: 'status', width: 100 },
    { title: '操作', key: 'action', width: 100 },
  ],
  showTableSetting: true,
  bordered: true,
});

function handleView(record: any) {
  console.log('查看对账详情', record);
}
</script>

<style scoped>
.amount {
  color: #f5222d;
  font-weight: 600;
}
</style>
