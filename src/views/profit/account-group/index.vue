<template>
  <div class="profit-account-group">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="商户">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="组名称">
          <Input v-model:value="searchForm.groupName" placeholder="请输入组名称" allow-clear style="width: 150px" />
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
            新建账号组
          </Button>
        </Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1000 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'isAuto'">
            <Tag :color="record.isAuto === 1 ? 'green' : 'default'">{{ record.isAuto === 1 ? '是' : '否' }}</Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openEditModal(record)">编辑</Button>
              <Button type="link" size="small" @click="openReceiverModal(record)">收款账号</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="formVisible" :title="formMode === 'add' ? '新建账号组' : '编辑账号组'" width="500px" @ok="handleFormSubmit">
      <Form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="formRules">
        <FormItem label="商户号" name="mchNo">
          <Input v-model:value="formData.mchNo" placeholder="请输入商户号" />
        </FormItem>
        <FormItem label="组名称" name="groupName">
          <Input v-model:value="formData.groupName" placeholder="请输入组名称" />
        </FormItem>
        <FormItem label="自动分账" name="isAuto">
          <RadioGroup v-model:value="formData.isAuto">
            <Radio :value="1">是</Radio>
            <Radio :value="0">否</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="备注">
          <Textarea v-model:value="formData.remark" :rows="3" placeholder="请输入备注" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Button, Space, Tag, RadioGroup, Radio, Textarea, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ mchNo: '', groupName: '' });
const columns = [
  { title: '组ID', dataIndex: 'groupId', key: 'groupId', width: 100 },
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 120 },
  { title: '商户名称', dataIndex: 'mchName', key: 'mchName', width: 150 },
  { title: '组名称', dataIndex: 'groupName', key: 'groupName', width: 150 },
  { title: '自动分账', key: 'isAuto', width: 100 },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 200 },
];

const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formData = reactive({ mchNo: '', mchName: '', groupName: '', isAuto: 0, remark: '' });
const formRules = { mchNo: [{ required: true, message: '请输入商户号' }], groupName: [{ required: true, message: '请输入组名称' }] };

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = [
      { id: 1, groupId: 'G001', mchNo: 'M10001', mchName: '测试商户001', groupName: '默认分账组', isAuto: 1, creator: 'admin', createdAt: '2024-01-01 10:00:00' },
      { id: 2, groupId: 'G002', mchNo: 'M10001', mchName: '测试商户001', groupName: '代理商分账', isAuto: 0, creator: 'admin', createdAt: '2024-01-05 14:30:00' },
      { id: 3, groupId: 'G003', mchNo: 'M10002', mchName: '测试商户002', groupName: '默认分账组', isAuto: 1, creator: 'admin', createdAt: '2024-01-10 09:15:00' },
    ];
    pagination.total = dataSource.value.length;
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.mchNo = ''; searchForm.groupName = ''; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openAddModal() { formMode.value = 'add'; Object.assign(formData, { mchNo: '', mchName: '', groupName: '', isAuto: 0, remark: '' }); formVisible.value = true; }
function openEditModal(record: any) { formMode.value = 'edit'; Object.assign(formData, record); formVisible.value = true; }
function openReceiverModal(record: any) { message.info('收款账号管理页面跳转中'); }
async function handleFormSubmit() { message.success(formMode.value === 'add' ? '创建成功' : '更新成功'); formVisible.value = false; fetchData(); }
function handleDelete(record: any) { message.warning('删除功能需要确认'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.profit-account-group { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
