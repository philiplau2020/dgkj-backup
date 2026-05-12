<template>
  <div class="device-code">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="码牌ID">
          <Input v-model:value="searchForm.codeId" placeholder="请输入码牌ID" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem label="商户">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 100px">
            <SelectOption :value="1">正常</SelectOption>
            <SelectOption :value="0">停用</SelectOption>
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
          <Button type="primary" @click="openCreateModal">
            <template #icon><PlusOutlined /></template>
            创建空码
          </Button>
          <Button @click="handleExport">导出</Button>
        </Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1200 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'qrcode'">
            <QrcodeOutlined style="font-size: 24px; color: #1890ff;" />
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'green' : 'default'">{{ record.statusName }}</Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openBindModal(record)">绑定</Button>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="createVisible" title="创建空码" width="500px" @ok="handleCreate">
      <Form :model="createForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="批次号"><Input v-model:value="createForm.batchNo" placeholder="请输入批次号" /></FormItem>
        <FormItem label="数量"><InputNumber v-model:value="createForm.count" :min="1" :max="1000" style="width: 100%" /></FormItem>
        <FormItem label="码牌金额">
          <InputNumber v-model:value="createForm.amount" :min="0" :precision="2" style="width: 100%" placeholder="0表示不定价" />
        </FormItem>
        <FormItem label="状态">
          <RadioGroup v-model:value="createForm.status"><Radio :value="1">启用</Radio><Radio :value="0">停用</Radio></RadioGroup>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, InputNumber, RadioGroup, Radio, Modal } from 'ant-design-vue';
import { PlusOutlined, QrcodeOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ codeId: '', mchNo: '', status: undefined as number | undefined });

const columns = [
  { title: '二维码', key: 'qrcode', width: 80 },
  { title: '码牌ID', dataIndex: 'codeId', key: 'codeId', width: 150 },
  { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 120 },
  { title: '绑定商户', dataIndex: 'mchName', key: 'mchName', width: 130 },
  { title: '代理商', dataIndex: 'agentName', key: 'agentName', width: 100 },
  { title: '固定金额', dataIndex: 'amount', key: 'amount', width: 100, customRender: ({ text }) => text > 0 ? `¥${text}` : '-' },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

const createVisible = ref(false);
const createForm = reactive({ batchNo: '', count: 100, amount: 0, status: 1 });

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = [
      { id: 1, codeId: 'QD202401010001', batchNo: 'BATCH001', mchNo: 'M10001', mchName: '测试商户001', agentName: '代理商A', amount: 0, status: 1, statusName: '正常', createdAt: '2024-01-01 10:00:00' },
      { id: 2, codeId: 'QD202401010002', batchNo: 'BATCH001', mchNo: 'M10001', mchName: '测试商户001', agentName: '代理商A', amount: 100, status: 1, statusName: '正常', createdAt: '2024-01-01 10:00:00' },
      { id: 3, codeId: 'QD202401020001', batchNo: 'BATCH002', mchNo: '', mchName: '未绑定', agentName: '代理商B', amount: 0, status: 1, statusName: '正常', createdAt: '2024-01-02 14:30:00' },
    ];
    pagination.total = dataSource.value.length;
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.codeId = ''; searchForm.mchNo = ''; searchForm.status = undefined; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openCreateModal() { createVisible.value = true; }
function openBindModal(record: any) { message.info('绑定功能开发中'); }
function openDetailModal(record: any) { message.info('详情功能开发中'); }
function handleCreate() { message.success('创建成功'); createVisible.value = false; fetchData(); }
function handleExport() { message.info('导出功能开发中'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.device-code { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
