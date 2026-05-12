<template>
  <div class="sys-role">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleAdd">新增角色</a-button>
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
  api: async (params) => {
    const res = await fetch(`/basic-api/sys/role/list?${new URLSearchParams(params)}`);
    return (await res.json()).result;
  },
  columns: [
    { title: '角色ID', dataIndex: 'id', width: 80 },
    { title: '角色名称', dataIndex: 'roleName', width: 150 },
    { title: '角色标识', dataIndex: 'roleValue', width: 150 },
    { title: '描述', dataIndex: 'description', width: 200 },
    { title: '排序', dataIndex: 'sort', width: 80 },
    { title: '状态', dataIndex: 'status', width: 100 },
    { title: '操作', key: 'action', width: 150 },
  ],
  useSearchForm: true,
  formConfig: {
    labelWidth: 80,
    schemas: [
      { field: 'roleName', label: '角色名称', component: 'Input', colProps: { span: 6 } },
    ],
  },
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
