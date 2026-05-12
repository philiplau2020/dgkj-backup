<template>
  <div class="channel-mch">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleAdd">新增通道商户</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <Badge :status="record.status === 1 ? 'success' : 'error'" :text="record.statusText" />
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
    const res = await fetch(`/basic-api/channel/mch/list?${new URLSearchParams(params)}`);
    return (await res.json()).result;
  },
  columns: [
    { title: '渠道', dataIndex: 'channelName', width: 120 },
    { title: 'AppId', dataIndex: 'appId', width: 150 },
    { title: '商户ID', dataIndex: 'mchId', width: 120 },
    { title: '状态', key: 'status', width: 80 },
    { title: '通道余额', dataIndex: 'balance', width: 120 },
    { title: '今日交易额', dataIndex: 'todayAmount', width: 120 },
    { title: '今日笔数', dataIndex: 'todayCount', width: 80 },
    { title: '备注', dataIndex: 'remark', width: 150 },
  ],
  showTableSetting: true,
  bordered: true,
});

function handleAdd() {}
</script>
