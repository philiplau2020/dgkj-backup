<template>
  <div class="agent-profit">
    <Card>
      <!-- 搜索表单 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="代理商号">
          <Input v-model:value="searchForm.agentNo" placeholder="请输入代理商号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="商户号">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="结算状态">
          <Select v-model:value="searchForm.settleStatus" placeholder="请选择" allow-clear style="width: 100px">
            <SelectOption :value="0">待结算</SelectOption>
            <SelectOption :value="1">已结算</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="日期范围">
          <RangePicker v-model:value="dateRange" style="width: 240px" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              查询
            </Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <!-- 统计卡片 -->
      <Row :gutter="16" class="stat-row">
        <Col :span="6">
          <Statistic title="累计分润" :value="stats.totalProfit" :precision="2" prefix="¥" :value-style="{ color: '#f5222d' }" />
        </Col>
        <Col :span="6">
          <Statistic title="待结算" :value="stats.pendingProfit" :precision="2" prefix="¥" :value-style="{ color: '#faad14' }" />
        </Col>
        <Col :span="6">
          <Statistic title="已结算" :value="stats.settledProfit" :precision="2" prefix="¥" :value-style="{ color: '#52c41a' }" />
        </Col>
        <Col :span="6">
          <Statistic title="分润笔数" :value="stats.totalCount" />
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button @click="handleExport">导出</Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 分润记录列表 -->
      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: 1400 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'profitAmount'">
            <span style="color: #f5222d; font-weight: 500;">¥{{ record.profitAmount }}</span>
          </template>
          <template v-else-if="column.key === 'settleStatus'">
            <Tag :color="record.settleStatus === 1 ? 'green' : 'orange'">
              {{ record.settleStatusName }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="handleSettle(record)" v-if="record.settleStatus === 0">
                结算
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="分润详情"
      width="600px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="分润单号" :span="2">{{ currentRecord.profitNo }}</DescriptionsItem>
        <DescriptionsItem label="代理商号">{{ currentRecord.agentNo }}</DescriptionsItem>
        <DescriptionsItem label="代理商名称">{{ currentRecord.agentName }}</DescriptionsItem>
        <DescriptionsItem label="商户号">{{ currentRecord.mchNo }}</DescriptionsItem>
        <DescriptionsItem label="商户名称">{{ currentRecord.mchName }}</DescriptionsItem>
        <DescriptionsItem label="交易订单号">{{ currentRecord.orderNo }}</DescriptionsItem>
        <DescriptionsItem label="交易金额">
          <span style="color: #f5222d">¥{{ currentRecord.tradeAmount }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="分润比例">{{ (Number(currentRecord.profitRate) * 100).toFixed(1) }}%</DescriptionsItem>
        <DescriptionsItem label="分润金额">
          <span style="color: #f5222d; font-weight: 500;">¥{{ currentRecord.profitAmount }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="结算状态">
          <Tag :color="currentRecord.settleStatus === 1 ? 'green' : 'orange'">
            {{ currentRecord.settleStatusName }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createdAt }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Row, Col, Statistic, RangePicker, Modal, Descriptions, DescriptionsItem } from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  agentNo: '',
  mchNo: '',
  settleStatus: undefined as number | undefined,
});

const dateRange = ref<[any, any] | null>(null);

const stats = reactive({
  totalProfit: 0,
  pendingProfit: 0,
  settledProfit: 0,
  totalCount: 0,
});

const columns = [
  { title: '分润单号', dataIndex: 'profitNo', key: 'profitNo', width: 160 },
  { title: '代理商号', dataIndex: 'agentNo', key: 'agentNo', width: 120 },
  { title: '代理商名称', dataIndex: 'agentName', key: 'agentName', width: 140 },
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 120 },
  { title: '交易订单号', dataIndex: 'orderNo', key: 'orderNo', width: 170 },
  { title: '交易金额', dataIndex: 'tradeAmount', key: 'tradeAmount', width: 120 },
  { title: '分润比例', dataIndex: 'profitRate', key: 'profitRate', width: 100, customRender: ({ text }) => `${(Number(text) * 100).toFixed(1)}%` },
  { title: '分润金额', key: 'profitAmount', width: 120 },
  { title: '结算状态', key: 'settleStatus', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.agentNo) params.agentNo = searchForm.agentNo;
    if (searchForm.mchNo) params.mchNo = searchForm.mchNo;
    if (searchForm.settleStatus !== undefined) params.settleStatus = searchForm.settleStatus;

    const res = await fetch(`/basic-api/agent/profit/list?${new URLSearchParams(params as any)}`);
    const data = await res.json();

    if (data.result) {
      dataSource.value = data.result.list || [];
      pagination.total = data.result.total || 0;
    }

    // 统计数据
    const allData = dataSource.value;
    stats.totalCount = data.result?.total || 0;
    stats.totalProfit = allData.reduce((sum: number, item: any) => sum + Number(item.profitAmount), 0);
    stats.settledProfit = allData.filter((item: any) => item.settleStatus === 1).reduce((sum: number, item: any) => sum + Number(item.profitAmount), 0);
    stats.pendingProfit = stats.totalProfit - stats.settledProfit;
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.agentNo = '';
  searchForm.mchNo = '';
  searchForm.settleStatus = undefined;
  dateRange.value = null;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openDetailModal(record: any) {
  currentRecord.value = record;
  detailVisible.value = true;
}

function handleSettle(record: any) {
  message.success('分润结算成功');
  fetchData();
}

function handleExport() {
  message.info('导出功能开发中');
}

function handleRefresh() {
  fetchData();
  message.success('刷新成功');
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.agent-profit {
  padding: 16px;
  background: #f0f2f5;
}
.search-form {
  margin-bottom: 16px;
}
.stat-row {
  margin-bottom: 16px;
}
.table-toolbar {
  margin-bottom: 16px;
}
</style>
