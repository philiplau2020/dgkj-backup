<template>
  <div class="sys-dict">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleAdd">新增字典</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <Badge :status="record.status === 1 ? 'success' : 'default'" :text="record.status === 1 ? '正常' : '停用'" />
        </template>
        <template v-else-if="column.key === 'action'">
          <TableAction :actions="createActions(record)" />
        </template>
      </template>
    </BasicTable>
  </div>
</template>

<script setup lang="ts">
import { useTable } from '@/components/Table';
import { Badge } from 'ant-design-vue';

const [registerTable] = useTable({
  columns: [
    { title: '字典名称', dataIndex: 'dictName', width: 150 },
    { title: '字典编码', dataIndex: 'dictCode', width: 150 },
    { title: '描述', dataIndex: 'description', width: 200 },
    { title: '状态', key: 'status', width: 100 },
    { title: '操作', key: 'action', width: 150 },
  ],
  showTableSetting: true,
  bordered: true,
});

function createActions(record) {
  return [
    { label: '编辑', onClick: () => handleEdit(record) },
    { label: '删除', color: 'error', onClick: () => handleDelete(record) },
  ];
}

function handleAdd() {}
function handleEdit(record) {}
function handleDelete(record) {}
</script>
