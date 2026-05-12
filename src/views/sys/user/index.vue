<template>
  <div class="sys-user">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleAdd">新增用户</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <Badge :status="record.status === 1 ? 'success' : 'default'" :text="record.status === 1 ? '正常' : '停用'" />
        </template>
        <template v-else-if="column.key === 'roles'">
          <Space wrap>
            <Tag v-for="role in record.roles" :key="role.value" color="blue">{{ role.roleName }}</Tag>
          </Space>
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
import { Badge, Tag, Space } from 'ant-design-vue';

const [registerTable] = useTable({
  api: async (params) => {
    const res = await fetch(`/basic-api/sys/user/list?${new URLSearchParams(params)}`);
    return (await res.json()).result;
  },
  columns: [
    { title: '用户ID', dataIndex: 'userId', width: 80 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '昵称', dataIndex: 'realName', width: 120 },
    { title: '描述', dataIndex: 'desc', width: 150 },
    { title: '状态', dataIndex: 'status', width: 100 },
    { title: '角色', key: 'roles', width: 200 },
    { title: '操作', key: 'action', width: 150 },
  ],
  useSearchForm: true,
  formConfig: {
    labelWidth: 80,
    schemas: [
      { field: 'username', label: '用户名', component: 'Input', colProps: { span: 6 } },
      {
        field: 'status',
        label: '状态',
        component: 'Select',
        colProps: { span: 6 },
        componentProps: { options: [{ label: '正常', value: 1 }, { label: '停用', value: 0 }] },
      },
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
