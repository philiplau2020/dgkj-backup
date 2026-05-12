<template>
  <div class="trade-withdraw">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="提现单号">
          <Input v-model:value="searchForm.withdrawNo" placeholder="请输入提现单号" allow-clear style="width: 170px" />
        </FormItem>
        <FormItem label="商户号">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 110px">
            <SelectOption :value="0">待处理</SelectOption>
            <SelectOption :value="1">处理中</SelectOption>
            <SelectOption :value="2">已成功</SelectOption>
            <SelectOption :value="3">已失败</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="日期">
          <RangePicker v-model:value="dateRange" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <Row :gutter="16" class="stat-row">
        <Col :span="6"><Statistic title="待处理" :value="stats.pendingCount" :value-style="{ color: '#faad14' }" /></Col>
        <Col :span="6"><Statistic title="处理中" :value="stats.processingCount" :value-style="{ color: '#1890ff' }" /></Col>
        <Col :span="6"><Statistic title="成功金额" :value="stats.successAmount" :precision="2" prefix="¥" :value-style="{ color: '#52c41a' }" /></Col>
        <Col :span="6"><Statistic title="失败金额" :value="stats.failAmount" :precision="2" prefix="¥" :value-style="{ color: '#f5222d' }" /></Col>
      </Row>

      <div class="table-toolbar">
        <Space><Button @click="handleExport">导出</Button><Button @click="handleRefresh"><ReloadOutlined />刷新</Button></Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1400 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'amount'"><span style="color: #f5222d; font-weight: 500;">¥{{ record.amount }}</span></template>
          <template v-else-if="column.key === 'fee'">¥{{ record.fee }}</template>
          <template v-else-if="column.key === 'actualAmount'"><span style="color: #52c41a;">¥{{ record.actualAmount }}</span></template>
          <template v-else-if="column.key === 'status'"><Tag :color="getStatusColor(record.status)">{{ record.statusName }}</Tag></template>
          <template v-else-if="column.key === 'action'">
            <Space><Button type="link" size="small" @click="openDetailModal(record)">详情</Button></Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="detailVisible" title="提现详情" width="650px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="提现单号" :span="2">{{ currentRecord.withdrawNo }}</DescriptionsItem>
        <DescriptionsItem label="商户号">{{ currentRecord.mchNo }}</DescriptionsItem>
        <DescriptionsItem label="商户名称">{{ currentRecord.mchName }}</DescriptionsItem>
        <DescriptionsItem label="提现金额"><span style="color: #f5222d; font-weight: 500;">¥{{ currentRecord.amount }}</span></DescriptionsItem>
        <DescriptionsItem label="手续费">¥{{ currentRecord.fee }}</DescriptionsItem>
        <DescriptionsItem label="实际到账"><span style="color: #52c41a;">¥{{ currentRecord.actualAmount }}</span></DescriptionsItem>
        <DescriptionsItem label="银行名称">{{ currentRecord.bankName }}</DescriptionsItem>
        <DescriptionsItem label="银行账号">{{ currentRecord.bankAccount }}</DescriptionsItem>
        <DescriptionsItem label="状态"><Tag :color="getStatusColor(currentRecord.status)">{{ currentRecord.statusName }}</Tag></DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createdAt }}</DescriptionsItem>
        <DescriptionsItem label="处理时间">{{ currentRecord.processTime || '-' }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Row, Col, Statistic, RangePicker, Modal, Descriptions, DescriptionsItem } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ withdrawNo: '', mchNo: '', status: undefined as number | undefined });
const dateRange = ref<[any, any] | null>(null);
const stats = reactive({ pendingCount: 0, processingCount: 0, successAmount: 0, failAmount: 0 });

const columns = [
  { title: '提现单号', dataIndex: 'withdrawNo', key: 'withdrawNo', width: 180 },
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 120 },
  { title: '商户名称', dataIndex: 'mchName', key: 'mchName', width: 140 },
  { title: '提现金额', key: 'amount', width: 120 },
  { title: '手续费', key: 'fee', width: 100 },
  { title: '实际到账', key: 'actualAmount', width: 120 },
  { title: '银行名称', dataIndex: 'bankName', key: 'bankName', width: 130 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 80 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

function getStatusColor(status: number) { return { 0: 'default', 1: 'processing', 2: 'success', 3: 'error' }[status] || 'default'; }

async function fetchData() {
  loading.value = true;
  try {
    const mockData = [];
    for (let i = 1; i <= 20; i++) {
      const status = [0, 1, 2, 3][Math.floor(Math.random() * 4)];
      const amount = (Math.random() * 10000 + 100).toFixed(2);
      mockData.push({
        id: i, withdrawNo: 'WD' + Date.now().toString().slice(0, 10) + i,
        mchNo: i % 2 === 0 ? 'M10001' : 'M10002', mchName: i % 2 === 0 ? '测试商户001' : '测试商户002',
        amount, fee: (Number(amount) * 0.006).toFixed(2), actualAmount: (Number(amount) * 0.994).toFixed(2),
        bankName: '中信银行', bankAccount: '621226****' + (1000 + i), status, statusName: ['待处理', '处理中', '已成功', '已失败'][status],
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString().replace('T', ' ').slice(0, 19),
        processTime: status >= 2 ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null,
      });
    }
    dataSource.value = mockData; pagination.total = mockData.length;
    stats.pendingCount = mockData.filter(item => item.status === 0).length;
    stats.processingCount = mockData.filter(item => item.status === 1).length;
    stats.successAmount = mockData.filter(item => item.status === 2).reduce((sum, item) => sum + Number(item.amount), 0);
    stats.failAmount = mockData.filter(item => item.status === 3).reduce((sum, item) => sum + Number(item.amount), 0);
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.withdrawNo = ''; searchForm.mchNo = ''; searchForm.status = undefined; dateRange.value = null; handleSearch(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openDetailModal(record: any) { currentRecord.value = record; detailVisible.value = true; }
function handleExport() { message.info('导出功能开发中'); }
function handleRefresh() { fetchData(); message.success('刷新成功'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.trade-withdraw { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
