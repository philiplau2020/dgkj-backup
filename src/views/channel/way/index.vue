<template>
  <div class="channel-way">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="支付方式代码">
          <Input v-model:value="searchForm.wayCode" placeholder="请输入支付方式代码" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem label="支付方式名称">
          <Input v-model:value="searchForm.wayName" placeholder="请输入支付方式名称" allow-clear style="width: 150px" />
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
            新建支付方式
          </Button>
        </Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="false" row-key="id" :scroll="{ x: 1000 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'wayType'">
            <Tag :color="record.wayType === 1 ? 'blue' : 'green'">{{ record.wayTypeName }}</Tag>
          </template>
          <template v-else-if="column.key === 'icon'">
            <span v-html="record.icon"></span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Switch :checked="record.status === 1" @change="(checked) => handleStatusChange(record, checked)" />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openEditModal(record)">编辑</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="formVisible" :title="formMode === 'add' ? '新建支付方式' : '编辑支付方式'" width="500px" @ok="handleFormSubmit">
      <Form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="formRules" ref="formRef">
        <FormItem label="支付方式代码" name="wayCode">
          <Input v-model:value="formData.wayCode" placeholder="如: WX_QR" :disabled="formMode === 'edit'" />
        </FormItem>
        <FormItem label="支付方式名称" name="wayName">
          <Input v-model:value="formData.wayName" placeholder="如: 微信扫码" />
        </FormItem>
        <FormItem label="支付类型" name="wayType">
          <RadioGroup v-model:value="formData.wayType">
            <Radio :value="1">扫码支付</Radio>
            <Radio :value="2">刷卡支付</Radio>
            <Radio :value="3">H5支付</Radio>
            <Radio :value="4">APP支付</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="状态" name="status">
          <RadioGroup v-model:value="formData.status">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">停用</Radio>
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
import { Card, Table, Form, FormItem, Input, Button, Space, Tag, Switch, RadioGroup, Radio, Textarea, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const columns = [
  { title: '支付方式代码', dataIndex: 'wayCode', key: 'wayCode', width: 150 },
  { title: '支付方式名称', dataIndex: 'wayName', key: 'wayName', width: 150 },
  { title: '支付类型', key: 'wayType', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

const searchForm = reactive({ wayCode: '', wayName: '' });
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formData = reactive({ wayCode: '', wayName: '', wayType: 1, status: 1, remark: '' });
const formRules = { wayCode: [{ required: true, message: '请输入支付方式代码' }], wayName: [{ required: true, message: '请输入支付方式名称' }] };

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = [
      { id: 1, wayCode: 'WX_QR', wayName: '微信扫码', wayType: 1, wayTypeName: '扫码支付', status: 1, createdAt: '2024-01-01 10:00:00' },
      { id: 2, wayCode: 'ALI_QR', wayName: '支付宝扫码', wayType: 1, wayTypeName: '扫码支付', status: 1, createdAt: '2024-01-01 10:00:00' },
      { id: 3, wayCode: 'WX_BAR', wayName: '微信刷卡', wayType: 2, wayTypeName: '刷卡支付', status: 1, createdAt: '2024-01-01 10:00:00' },
      { id: 4, wayCode: 'ALI_BAR', wayName: '支付宝刷卡', wayType: 2, wayTypeName: '刷卡支付', status: 1, createdAt: '2024-01-01 10:00:00' },
      { id: 5, wayCode: 'WX_H5', wayName: '微信H5', wayType: 3, wayTypeName: 'H5支付', status: 0, createdAt: '2024-01-01 10:00:00' },
      { id: 6, wayCode: 'CITIC_QR', wayName: '中信银行扫码', wayType: 1, wayTypeName: '扫码支付', status: 1, createdAt: '2024-01-01 10:00:00' },
    ];
  } finally { loading.value = false; }
}

function handleSearch() { fetchData(); }
function handleReset() { searchForm.wayCode = ''; searchForm.wayName = ''; fetchData(); }
function handleStatusChange(record: any, checked: boolean) { record.status = checked ? 1 : 0; message.success('状态更新成功'); }
function openAddModal() { formMode.value = 'add'; Object.assign(formData, { wayCode: '', wayName: '', wayType: 1, status: 1, remark: '' }); formVisible.value = true; }
function openEditModal(record: any) { formMode.value = 'edit'; Object.assign(formData, record); formVisible.value = true; }
async function handleFormSubmit() { message.success(formMode.value === 'add' ? '创建成功' : '更新成功'); formVisible.value = false; fetchData(); }
function handleDelete(record: any) { message.warning('删除功能需要确认'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.channel-way { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
