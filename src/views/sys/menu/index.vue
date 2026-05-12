<template>
  <div class="sys-menu">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleAdd">新增菜单</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'icon'">
          <Icon :icon="record.meta?.icon || 'ant-design:file-outlined'" />
        </template>
        <template v-else-if="column.key === 'status'">
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
import { Icon } from '@/components/Icon';

const [registerTable] = useTable({
  api: async (params) => {
    const res = await fetch('/basic-api/sys/menu/list');
    return (await res.json()).result;
  },
  columns: [
    { title: '菜单名称', dataIndex: ['meta', 'title'], width: 180 },
    { title: '图标', key: 'icon', width: 80 },
    { title: '路由路径', dataIndex: 'path', width: 200 },
    { title: '组件路径', dataIndex: 'component', width: 200 },
    { title: '排序', dataIndex: 'sort', width: 80 },
    { title: '状态', key: 'status', width: 100 },
    { title: '操作', key: 'action', width: 150 },
  ],
  showTableSetting: true,
  bordered: true,
  rowKey: 'id',
});

function createActions(record) {
  return [
    { label: '新增', onClick: () => handleAddChild(record) },
    { label: '编辑', onClick: () => handleEdit(record) },
    { label: '删除', color: 'error', onClick: () => handleDelete(record) },
  ];
}

function handleAdd() {}
function handleAddChild(record) {}
function handleEdit(record) {}
function handleDelete(record) {}
</script>
