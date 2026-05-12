<template>
  <div class="check-batch">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="对账批次号">
          <Input v-model:value="searchForm.batchNo" placeholder="请输入批次号" allow-clear style="width: 170px" />
        </FormItem>
        <FormItem label="支付接口">
          <Select v-model:value="searchForm.ifCode" allow-clear style="width: 140px">
            <SelectOption value="CITIC_QR">中信银行</SelectOption>
            <SelectOption value="WX_QR">微信</SelectOption>
            <SelectOption value="ALI_QR">支付宝</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 110px">
            <SelectOption :value="0">未对账</SelectOption>
            <SelectOption :value="1">有差异</SelectOption>
            <SelectOption :value="2">已平账</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="日期">
          <DatePicker v-model:value="searchForm.checkDate" style="width: 120px" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <Row :gutter="16" class="stat-row">
        <Col :span="6"><Statistic title="对账批次" :value="stats.totalCount" /></Col>
        <Col :span="6"><Statistic title="已平账" :value="stats.settledCount" :value-style="{ color: '#52c41a' }" /></Col>
        <Col :span="6"><Statistic title="有差异" :value="stats.diffCount" :value-style="{ color: '#f5222d' }" /></Col>
        <Col :span="6"><Statistic title="差异总金额" :value="stats.diffAmount" :precision="2" prefix="¥" :value-style="{ color: '#f5222d' }" /></Col>
      </Row>

      <div class="table-toolbar">
        <Space>
          <Button @click="handleCheck">发起对账</Button>
          <Button @click="handleDownload">下载对账单</Button>
          <Button @click="handleRefresh"><ReloadOutlined />刷新</Button>
        </Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1200 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'"><Tag :color="getStatusColor(record.status)">{{ record.statusName }}</Tag></template>
          <template v-else-if="column.key === 'diffAmount'"><span :style="{ color: Number(record.diffAmount) > 0 ? '#f5222d' : '#52c41a' }">¥{{ record.diffAmount }}</span></template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="handleRecheck(record)">重新对账</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="detailVisible" title="对账批次详情" width="700px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="批次号" :span="2">{{ currentRecord.batchNo }}</DescriptionsItem>
        <DescriptionsItem label="对账日期">{{ currentRecord.checkDate }}</DescriptionsItem>
        <DescriptionsItem label="支付接口">{{ currentRecord.ifCodeName }}</DescriptionsItem>
        <DescriptionsItem label="状态"><Tag :color="getStatusColor(currentRecord.status)">{{ currentRecord.statusName }}</Tag></DescriptionsItem>
        <DescriptionsItem label="订单总数">{{ currentRecord.orderCount }}</DescriptionsItem>
        <DescriptionsItem label="对账金额">¥{{ currentRecord.checkAmount }}</DescriptionsItem>
        <DescriptionsItem label="差异笔数">{{ currentRecord.diffCount }}</DescriptionsItem>
        <DescriptionsItem label="差异金额">¥{{ currentRecord.diffAmount }}</DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createdAt }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Row, Col, Statistic, DatePicker, Modal, Descriptions, DescriptionsItem } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ batchNo: '', ifCode: '', status: undefined as number | undefined, checkDate: null as any });
const stats = reactive({ totalCount: 0, settledCount: 0, diffCount: 0, diffAmount: 0 });

const columns = [
  { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 180 },
  { title: '对账日期', dataIndex: 'checkDate', key: 'checkDate', width: 120 },
  { title: '支付接口', dataIndex: 'ifCodeName', key: 'ifCodeName', width: 120 },
  { title: '订单总数', dataIndex: 'orderCount', key: 'orderCount', width: 100 },
  { title: '对账金额', dataIndex: 'checkAmount', key: 'checkAmount', width: 130, customRender: ({ text }) => `¥${text}` },
  { title: '差异笔数', dataIndex: 'diffCount', key: 'diffCount', width: 100 },
  { title: '差异金额', key: 'diffAmount', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 150 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

function getStatusColor(status: number) { return { 0: 'default', 1: 'error', 2: 'success' }[status] || 'default'; }

async function fetchData() {
  loading.value = true;
  try {
    const mockData = [];
    for (let i = 1; i <= 30; i++) {
      const status = Math.random() > 0.3 ? 2 : (Math.random() > 0.5 ? 1 : 0);
      mockData.push({
        id: i, batchNo: 'BATCH' + new Date().toISOString().split('T')[0].replace(/-/g, '') + i.toString().padStart(4, '0'),
        checkDate: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        ifCode: ['CITIC_QR', 'WX_QR', 'ALI_QR'][i % 3], ifCodeName: ['中信银行', '微信', '支付宝'][i % 3],
        orderCount: Math.floor(Math.random() * 500) + 100, checkAmount: (Math.random() * 50000 + 10000).toFixed(2),
        diffCount: status === 2 ? 0 : Math.floor(Math.random() * 5),
        diffAmount: status === 2 ? '0.00' : (Math.random() * 100).toFixed(2), status, statusName: ['未对账', '有差异', '已平账'][status],
        createdAt: new Date(Date.now() - i * 86400000).toISOString().replace('T', ' ').slice(0, 19),
      });
    }
    dataSource.value = mockData; pagination.total = mockData.length;
    stats.totalCount = mockData.length;
    stats.settledCount = mockData.filter(item => item.status === 2).length;
    stats.diffCount = mockData.filter(item => item.status === 1).length;
    stats.diffAmount = mockData.filter(item => item.status === 1).reduce((sum, item) => sum + Number(item.diffAmount), 0);
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.batchNo = ''; searchForm.ifCode = ''; searchForm.status = undefined; searchForm.checkDate = null; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openDetailModal(record: any) { currentRecord.value = record; detailVisible.value = true; }
function handleCheck() { message.info('发起对账功能开发中'); }
function handleDownload() { message.info('下载对账单功能开发中'); }
function handleRecheck(record: any) { message.success('重新对账成功'); fetchData(); }
function handleRefresh() { fetchData(); message.success('刷新成功'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.check-batch { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
