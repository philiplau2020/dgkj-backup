<template>
  <div class="mch-rate">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleAdd">配置费率</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'rate'">
          <span class="rate">{{ (parseFloat(record.rate) * 100).toFixed(2) }}%</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <Badge :status="record.status === 1 ? 'success' : 'default'" :text="record.status === 1 ? '启用' : '停用'" />
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
    const res = await fetch(`/basic-api/mch/rate/list?${new URLSearchParams(params)}`);
    return (await res.json()).result;
  },
  columns: [
    { title: '商户号', dataIndex: 'mchNo', width: 120 },
    { title: '商户名称', dataIndex: 'mchName', width: 200 },
    { title: '费率', key: 'rate', width: 100 },
    { title: '最小限额', dataIndex: 'minAmount', width: 120 },
    { title: '最大限额', dataIndex: 'maxAmount', width: 120 },
    { title: '状态', key: 'status', width: 100 },
  ],
  showTableSetting: true,
  bordered: true,
});

function handleAdd() {}
</script>

<style scoped>
.rate {
  color: #f5222d;
  font-weight: 600;
}
</style>
