<template>
  <div class="device-activation">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="激活码">
          <Input v-model:value="searchForm.code" placeholder="请输入激活码" allow-clear style="width: 160px" />
        </FormItem>
        <FormItem label="设备类型">
          <Select v-model:value="searchForm.deviceType" allow-clear style="width: 120px" placeholder="请选择">
            <SelectOption :value="1">二维码设备</SelectOption>
            <SelectOption :value="2">云喇叭</SelectOption>
            <SelectOption :value="3">小票机</SelectOption>
            <SelectOption :value="4">POS机</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 100px" placeholder="请选择">
            <SelectOption :value="0">未使用</SelectOption>
            <SelectOption :value="1">已使用</SelectOption>
            <SelectOption :value="2">已过期</SelectOption>
          </Select>
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
          <Button type="primary" @click="openGenerateModal">
            <template #icon><PlusOutlined /></template>
            生成激活码
          </Button>
        </Space>
      </div>

      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: 1300 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'deviceType'">
            <Tag :color="getTypeColor(record.deviceType)">{{ record.deviceTypeName }}</Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="getStatusBadge(record.status)" />
            <span>{{ record.statusName }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="handleCopy(record)">复制激活码</Button>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="generateVisible" title="生成激活码" width="500px" @ok="handleGenerate" :confirm-loading="generateLoading">
      <Form :model="generateForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="设备类型" name="deviceType">
          <Select v-model:value="generateForm.deviceType" placeholder="请选择设备类型">
            <SelectOption :value="1">二维码设备</SelectOption>
            <SelectOption :value="2">云喇叭</SelectOption>
            <SelectOption :value="3">小票机</SelectOption>
            <SelectOption :value="4">POS机</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="批次号" name="batchNo">
          <Input v-model:value="generateForm.batchNo" placeholder="请输入批次号" />
        </FormItem>
        <FormItem label="数量" name="count">
          <InputNumber v-model:value="generateForm.count" :min="1" :max="1000" style="width: 100%" />
        </FormItem>
      </Form>
    </Modal>

    <Modal v-model:open="codesVisible" title="生成的激活码" width="600px" :footer="null" v-if="generatedCodes.length">
      <Alert message="请妥善保管以下激活码，每个激活码仅能使用一次" type="info" show-icon style="margin-bottom: 16px" />
      <div class="codes-list">
        <Tag v-for="code in generatedCodes" :key="code" color="blue" style="margin: 4px; font-size: 14px;">{{ code }}</Tag>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, InputNumber, Select, SelectOption, Button, Space, Tag, Badge, Modal, Alert, message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const generateLoading = ref(false);
const dataSource = ref<any[]>([]);
const generatedCodes = ref<string[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ code: '', deviceType: undefined as number | undefined, status: undefined as number | undefined });

const columns = [
  { title: '激活码', dataIndex: 'code', key: 'code', width: 180 },
  { title: '设备类型', key: 'deviceType', width: 100 },
  { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 150 },
  { title: '状态', key: 'status', width: 100 },
  { title: '过期时间', dataIndex: 'expireTime', key: 'expireTime', width: 170 },
  { title: '使用时间', dataIndex: 'usedTime', key: 'usedTime', width: 170 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

const generateVisible = ref(false);
const codesVisible = ref(false);
const generateForm = reactive({ deviceType: 1, batchNo: '', count: 10 });

const getTypeColor = (type: number) => ({ 1: 'blue', 2: 'green', 3: 'orange', 4: 'purple' }[type] || 'default');
const getStatusBadge = (status: number) => ({ 0: 'processing', 1: 'success', 2: 'error' }[status] || 'default');

async function fetchData() {
  loading.value = true;
  try {
    const params: any = { page: pagination.current, pageSize: pagination.pageSize };
    if (searchForm.code) params.code = searchForm.code;
    if (searchForm.deviceType !== undefined) params.deviceType = searchForm.deviceType;
    if (searchForm.status !== undefined) params.status = searchForm.status;

    const res = await defHttp.get({ url: '/basic-api/device/activation/list', params });
    dataSource.value = res?.data?.list || res?.list || [];
    pagination.total = res?.data?.total || res?.total || 0;
  } catch (e) { console.error('获取激活码列表失败', e); dataSource.value = []; }
  finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { Object.assign(searchForm, { code: '', deviceType: undefined, status: undefined }); handleSearch(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openGenerateModal() { generateForm.batchNo = `BATCH${Date.now()}`; generateVisible.value = true; }

async function handleGenerate() {
  generateLoading.value = true;
  try {
    const res = await defHttp.post({ url: '/basic-api/device/activation/generate', params: generateForm });
    if (res?.data?.codes) {
      generatedCodes.value = res.data.codes;
      codesVisible.value = true;
    }
    message.success('生成成功'); generateVisible.value = false; fetchData();
  } catch (e) { message.error('生成失败'); }
  finally { generateLoading.value = false; }
}

function handleCopy(record: any) {
  navigator.clipboard.writeText(record.code);
  message.success('已复制到剪贴板');
}

onMounted(() => fetchData());
</script>

<style scoped>
.device-activation { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.codes-list { max-height: 300px; overflow-y: auto; }
</style>
