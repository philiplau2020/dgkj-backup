<template>
  <div class="sys-dept">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="团队名称">
          <Input v-model:value="searchForm.deptName" placeholder="请输入团队名称" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openAddModal">
            <template #icon><PlusOutlined /></template>
            新增团队
          </Button>
        </Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1000 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="openEditModal(record)">编辑</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="formVisible" :title="formMode === 'add' ? '新增团队' : '编辑团队'" width="500px" @ok="handleFormSubmit">
      <Form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }" :rules="formRules">
        <FormItem label="团队名称" name="deptName">
          <Input v-model:value="formData.deptName" placeholder="请输入团队名称" />
        </FormItem>
        <FormItem label="团队编号" name="deptCode">
          <Input v-model:value="formData.deptCode" placeholder="请输入团队编号" />
        </FormItem>
        <FormItem label="统计周期" name="statCycle">
          <Select v-model:value="formData.statCycle" placeholder="请选择统计周期">
            <SelectOption :value="1">按日</SelectOption>
            <SelectOption :value="2">按周</SelectOption>
            <SelectOption :value="3">按月</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="备注">
          <Textarea v-model:value="formData.remark" :rows="3" placeholder="请输入备注" />
        </FormItem>
      </Form>
    </Modal>

    <Modal v-model:open="detailVisible" title="团队详情" width="600px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentDept">
        <DescriptionsItem label="团队ID">{{ currentDept.id }}</DescriptionsItem>
        <DescriptionsItem label="团队编号">{{ currentDept.deptCode }}</DescriptionsItem>
        <DescriptionsItem label="团队名称">{{ currentDept.deptName }}</DescriptionsItem>
        <DescriptionsItem label="统计周期">{{ currentDept.statCycleName }}</DescriptionsItem>
        <DescriptionsItem label="成员数量">{{ currentDept.memberCount }}</DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentDept.createdAt }}</DescriptionsItem>
        <DescriptionsItem label="备注" :span="2">{{ currentDept.remark || '-' }}</DescriptionsItem>
      </Descriptions>

      <Divider>团队成员</Divider>
      <Table :data-source="currentDept?.members || []" :columns="memberColumns" :pagination="false" row-key="id" size="small" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Modal, Descriptions, DescriptionsItem, Textarea, Divider } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ deptName: '' });

const columns = [
  { title: '团队ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '团队编号', dataIndex: 'deptCode', key: 'deptCode', width: 120 },
  { title: '团队名称', dataIndex: 'deptName', key: 'deptName', width: 150 },
  { title: '成员数量', dataIndex: 'memberCount', key: 'memberCount', width: 100 },
  { title: '统计周期', dataIndex: 'statCycleName', key: 'statCycleName', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 180 },
];

const memberColumns = [
  { title: '成员ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '成员姓名', dataIndex: 'name', key: 'name', width: 100 },
  { title: '手机号', dataIndex: 'mobile', key: 'mobile', width: 130 },
  { title: '是否队长', dataIndex: 'isLeader', key: 'isLeader', width: 100, customRender: ({ text }) => text ? '是' : '否' },
  { title: '拓展商户数', dataIndex: 'mchCount', key: 'mchCount', width: 100 },
];

const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formData = reactive({ deptName: '', deptCode: '', statCycle: 1, remark: '' });
const formRules = { deptName: [{ required: true, message: '请输入团队名称' }], deptCode: [{ required: true, message: '请输入团队编号' }] };

const currentDept = ref<any>(null);
const detailVisible = ref(false);

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = [
      { id: 1, deptCode: 'TEAM001', deptName: '销售一部', memberCount: 10, statCycle: 1, statCycleName: '按日', remark: '', createdAt: '2024-01-01 10:00:00', members: [
        { id: 1, name: '张三', mobile: '13800001001', isLeader: true, mchCount: 5 },
        { id: 2, name: '李四', mobile: '13800001002', isLeader: false, mchCount: 3 },
      ]},
      { id: 2, deptCode: 'TEAM002', deptName: '销售二部', memberCount: 8, statCycle: 2, statCycleName: '按周', remark: '', createdAt: '2024-01-05 14:30:00', members: [] },
    ];
    pagination.total = dataSource.value.length;
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.deptName = ''; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openAddModal() { formMode.value = 'add'; Object.assign(formData, { deptName: '', deptCode: '', statCycle: 1, remark: '' }); formVisible.value = true; }
function openEditModal(record: any) { formMode.value = 'edit'; Object.assign(formData, record); formVisible.value = true; }
function openDetailModal(record: any) { currentDept.value = record; detailVisible.value = true; }
async function handleFormSubmit() { message.success(formMode.value === 'add' ? '新增成功' : '更新成功'); formVisible.value = false; fetchData(); }
function handleDelete(record: any) { message.warning('删除功能需要确认'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.sys-dept { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
