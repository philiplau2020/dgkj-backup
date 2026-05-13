<template>
  <div class="check-diff-bill">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="对账批次">
          <Input v-model:value="searchForm.batchNo" placeholder="请输入批次号" allow-clear style="width: 170px" />
        </FormItem>
        <FormItem label="订单号">
          <Input v-model:value="searchForm.orderNo" placeholder="请输入订单号" allow-clear style="width: 170px" />
        </FormItem>
        <FormItem label="差异类型">
          <Select v-model:value="searchForm.diffType" allow-clear style="width: 110px">
            <SelectOption :value="1">长款</SelectOption>
            <SelectOption :value="2">短款</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="处理状态">
          <Select v-model:value="searchForm.handleStatus" allow-clear style="width: 110px">
            <SelectOption :value="0">未处理</SelectOption>
            <SelectOption :value="1">已处理</SelectOption>
          </Select>
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <Row :gutter="16" class="stat-row">
        <Col :span="6"><Statistic title="差异总数" :value="stats.totalCount" /></Col>
        <Col :span="6"><Statistic title="长款金额" :value="stats.longAmount" :precision="2" prefix="¥" :value-style="{ color: '#1890ff' }" /></Col>
        <Col :span="6"><Statistic title="短款金额" :value="stats.shortAmount" :precision="2" prefix="¥" :value-style="{ color: '#f5222d' }" /></Col>
        <Col :span="6"><Statistic title="已处理" :value="stats.handledCount" /></Col>
      </Row>

      <div class="table-toolbar">
        <Space>
          <Button @click="handleBatchHandle">批量处理</Button>
          <Button @click="handleExport">导出</Button>
          <Button @click="handleRefresh"><ReloadOutlined />刷新</Button>
        </Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1300 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'diffType'"><Tag :color="record.diffType === 1 ? 'blue' : 'red'">{{ record.diffTypeName }}</Tag></template>
          <template v-else-if="column.key === 'diffAmount'"><span :style="{ color: record.diffType === 1 ? '#1890ff' : '#f5222d' }">¥{{ record.diffAmount }}</span></template>
          <template v-else-if="column.key === 'handleStatus'"><Tag :color="record.handleStatus === 1 ? 'success' : 'default'">{{ record.handleStatusName }}</Tag></template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="handleDiff(record)" v-if="record.handleStatus === 0">处理</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="detailVisible" title="差异详情" width="600px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="订单号" :span="2">{{ currentRecord.orderNo }}</DescriptionsItem>
        <DescriptionsItem label="批次号">{{ currentRecord.batchNo }}</DescriptionsItem>
        <DescriptionsItem label="支付接口">{{ currentRecord.ifCodeName }}</DescriptionsItem>
        <DescriptionsItem label="差异类型"><Tag :color="currentRecord.diffType === 1 ? 'blue' : 'red'">{{ currentRecord.diffTypeName }}</Tag></DescriptionsItem>
        <DescriptionsItem label="差异金额">¥{{ currentRecord.diffAmount }}</DescriptionsItem>
        <DescriptionsItem label="处理状态"><Tag :color="currentRecord.handleStatus === 1 ? 'success' : 'default'">{{ currentRecord.handleStatusName }}</Tag></DescriptionsItem>
        <DescriptionsItem label="订单金额">¥{{ currentRecord.orderAmount }}</DescriptionsItem>
        <DescriptionsItem label="账单金额">¥{{ currentRecord.billAmount }}</DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createdAt }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Row, Col, Statistic, Modal, Descriptions, DescriptionsItem } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ batchNo: '', orderNo: '', diffType: undefined as number | undefined, handleStatus: undefined as number | undefined });
const stats = reactive({ totalCount: 0, longAmount: 0, shortAmount: 0, handledCount: 0 });

const columns = [
  { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 180 },
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
  { title: '支付接口', dataIndex: 'ifCodeName', key: 'ifCodeName', width: 120 },
  { title: '差异类型', key: 'diffType', width: 100 },
  { title: '差异金额', key: 'diffAmount', width: 120 },
  { title: '订单金额', dataIndex: 'orderAmount', key: 'orderAmount', width: 120 },
  { title: '账单金额', dataIndex: 'billAmount', key: 'billAmount', width: 120 },
  { title: '处理状态', key: 'handleStatus', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

async function fetchData() {
  loading.value = true;
  try {
    const params: any = { page: pagination.current, pageSize: pagination.pageSize };
    if (searchForm.batchNo) params.batchNo = searchForm.batchNo;
    if (searchForm.orderNo) params.orderNo = searchForm.orderNo;
    if (searchForm.diffType !== undefined) params.diffType = searchForm.diffType;
    if (searchForm.handleStatus !== undefined) params.handleStatus = searchForm.handleStatus;
    
    const res = await defHttp.get({ url: '/basic-api/check/diff-bill/list', params });
    if (res) {
      dataSource.value = res.list || [];
      pagination.total = res.total || 0;
      stats.totalCount = dataSource.value.length;
      stats.longAmount = dataSource.value.filter(item => item.diffType === 1).reduce((sum, item) => sum + Number(item.diffAmount), 0);
      stats.shortAmount = dataSource.value.filter(item => item.diffType === 2).reduce((sum, item) => sum + Number(item.diffAmount), 0);
      stats.handledCount = dataSource.value.filter(item => item.handleStatus === 1).length;
    } else {
      dataSource.value = [];
      pagination.total = 0;
    }
  } catch (e) {
    dataSource.value = [];
    pagination.total = 0;
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.batchNo = ''; searchForm.orderNo = ''; searchForm.diffType = undefined; searchForm.handleStatus = undefined; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openDetailModal(record: any) { currentRecord.value = record; detailVisible.value = true; }
function handleDiff(record: any) { message.success('处理成功'); fetchData(); }
function handleBatchHandle() { message.info('批量处理功能开发中'); }
function handleExport() { message.info('导出功能开发中'); }
function handleRefresh() { fetchData(); message.success('刷新成功'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.check-diff-bill { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
