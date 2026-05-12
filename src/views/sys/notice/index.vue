<template>
  <div class="sys-notice">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="公告标题">
          <Input v-model:value="searchForm.title" placeholder="请输入公告标题" allow-clear style="width: 180px" />
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
            发布公告
          </Button>
        </Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1200 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <a @click="openDetailModal(record)">{{ record.title }}</a>
          </template>
          <template v-else-if="column.key === 'scope'">
            <Tag>{{ record.scopeName }}</Tag>
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

    <Modal v-model:open="formVisible" :title="formMode === 'add' ? '发布公告' : '编辑公告'" width="600px" @ok="handleFormSubmit">
      <Form :model="formData" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }" :rules="formRules">
        <FormItem label="公告标题" name="title">
          <Input v-model:value="formData.title" placeholder="请输入公告标题" />
        </FormItem>
        <FormItem label="公告副标题" name="subtitle">
          <Input v-model:value="formData.subtitle" placeholder="请输入公告副标题" />
        </FormItem>
        <FormItem label="公告范围" name="scope">
          <CheckboxGroup v-model:value="formData.scope">
            <Checkbox :value="1">商户平台</Checkbox>
            <Checkbox :value="2">代理商平台</Checkbox>
            <Checkbox :value="3">运营平台</Checkbox>
          </CheckboxGroup>
        </FormItem>
        <FormItem label="公告内容" name="content">
          <Textarea v-model:value="formData.content" :rows="6" placeholder="请输入公告内容" />
        </FormItem>
      </Form>
    </Modal>

    <Modal v-model:open="detailVisible" title="公告详情" width="600px" :footer="null">
      <Descriptions :column="1" bordered v-if="currentRecord">
        <DescriptionsItem label="公告标题">{{ currentRecord.title }}</DescriptionsItem>
        <DescriptionsItem label="公告副标题">{{ currentRecord.subtitle || '-' }}</DescriptionsItem>
        <DescriptionsItem label="公告范围">{{ currentRecord.scopeName }}</DescriptionsItem>
        <DescriptionsItem label="发布人">{{ currentRecord.publisher }}</DescriptionsItem>
        <DescriptionsItem label="发布时间">{{ currentRecord.createdAt }}</DescriptionsItem>
        <DescriptionsItem label="公告内容">
          <div style="white-space: pre-wrap;">{{ currentRecord.content }}</div>
        </DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Button, Space, Tag, Checkbox, CheckboxGroup, Textarea, Modal, Descriptions, DescriptionsItem } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ title: '' });

const columns = [
  { title: '公告标题', dataIndex: 'title', key: 'title', width: 250 },
  { title: '公告副标题', dataIndex: 'subtitle', key: 'subtitle', width: 200 },
  { title: '公告范围', key: 'scope', width: 150 },
  { title: '发布人', dataIndex: 'publisher', key: 'publisher', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formData = reactive({ title: '', subtitle: '', scope: [1] as number[], content: '' });
const formRules = { title: [{ required: true, message: '请输入公告标题' }], content: [{ required: true, message: '请输入公告内容' }] };

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = [
      { id: 1, title: '系统升级通知', subtitle: 'V2.0版本上线', scope: 1, scopeName: '商户平台', publisher: '管理员', content: '系统将于本周日凌晨进行升级...', createdAt: '2024-01-15 10:00:00' },
      { id: 2, title: '费率调整公告', subtitle: '', scope: 2, scopeName: '代理商平台', publisher: '管理员', content: '自2024年2月1日起，费率将进行调整...', createdAt: '2024-01-10 14:30:00' },
      { id: 3, title: '春节假期安排', subtitle: '', scope: 3, scopeName: '运营平台', publisher: '管理员', content: '春节期间系统正常运行...', createdAt: '2024-01-05 09:00:00' },
    ];
    pagination.total = dataSource.value.length;
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.title = ''; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openAddModal() { formMode.value = 'add'; Object.assign(formData, { title: '', subtitle: '', scope: [1], content: '' }); formVisible.value = true; }
function openEditModal(record: any) { formMode.value = 'edit'; Object.assign(formData, record); formVisible.value = true; }
function openDetailModal(record: any) { currentRecord.value = record; detailVisible.value = true; }
async function handleFormSubmit() { message.success(formMode.value === 'add' ? '发布成功' : '更新成功'); formVisible.value = false; fetchData(); }
function handleDelete(record: any) { message.warning('删除功能需要确认'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.sys-notice { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
