<template>
  <div class="log-admin">
    <Card>
      <!-- 搜索表单 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="应用">
          <Select v-model:value="searchForm.appId" placeholder="请选择应用" allow-clear style="width: 180px" show-search>
            <SelectOption v-for="app in appList" :key="app.appId" :value="app.appId">{{ app.appName }}</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="API路径">
          <Input v-model:value="searchForm.apiPath" placeholder="请输入API路径" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="请求方法">
          <Select v-model:value="searchForm.method" placeholder="请选择" allow-clear style="width: 100px">
            <SelectOption value="GET">GET</SelectOption>
            <SelectOption value="POST">POST</SelectOption>
            <SelectOption value="PUT">PUT</SelectOption>
            <SelectOption value="DELETE">DELETE</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="调用结果">
          <Select v-model:value="searchForm.result" placeholder="请选择" allow-clear style="width: 100px">
            <SelectOption value="success">成功</SelectOption>
            <SelectOption value="failed">失败</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="调用时间">
          <RangePicker 
            v-model:value="searchForm.dateRange" 
            :placeholder="['开始时间', '结束时间']"
            format="YYYY-MM-DD"
            style="width: 240px"
          />
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
      <Row :gutter="16" class="stats-row">
        <Col :span="6">
          <Statistic title="总调用量" :value="stats.totalCount" />
        </Col>
        <Col :span="6">
          <Statistic title="成功量" :value="stats.successCount" :value-style="{ color: '#52c41a' }" />
        </Col>
        <Col :span="6">
          <Statistic title="失败量" :value="stats.failedCount" :value-style="{ color: '#f5222d' }" />
        </Col>
        <Col :span="6">
          <Statistic title="平均响应时间" :value="stats.avgResponseTime" suffix="ms" />
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button @click="handleExport">
            <template #icon><DownloadOutlined /></template>
            导出
          </Button>
          <Button @click="handleViewStatistics">
            <template #icon><BarChartOutlined /></template>
            统计报表
          </Button>
        </Space>
      </div>

      <!-- 表格 -->
      <Table 
        :data-source="dataSource" 
        :columns="columns" 
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: 1600 }"
        :size="'middle'"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'method'">
            <Tag :color="methodColorMap[record.method]">{{ record.method }}</Tag>
          </template>
          <template v-else-if="column.key === 'apiPath'">
            <code class="api-path">{{ record.apiPath }}</code>
          </template>
          <template v-else-if="column.key === 'result'">
            <Badge :status="record.success ? 'success' : 'error'" />
            <span>{{ record.success ? '成功' : '失败' }}</span>
          </template>
          <template v-else-if="column.key === 'responseTime'">
            <span :class="responseTimeClass(record.responseTime)">{{ record.responseTime }}ms</span>
          </template>
          <template v-else-if="column.key === 'ip'">
            <Tooltip :title="`${record.ip}${record.location ? ' - ' + record.location : ''}`">
              <span>{{ record.ip }}</span>
            </Tooltip>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="调用详情"
      width="800px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="日志ID" :span="2">{{ currentRecord.id }}</DescriptionsItem>
        <DescriptionsItem label="应用名称">{{ currentRecord.appName }}</DescriptionsItem>
        <DescriptionsItem label="开发者">{{ currentRecord.developerName }}</DescriptionsItem>
        <DescriptionsItem label="请求方法">
          <Tag :color="methodColorMap[currentRecord.method]">{{ currentRecord.method }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="API路径" :span="2">
          <code>{{ currentRecord.apiPath }}</code>
        </DescriptionsItem>
        <DescriptionsItem label="请求IP">{{ currentRecord.ip }}</DescriptionsItem>
        <DescriptionsItem label="地理位置">{{ currentRecord.location || '-' }}</DescriptionsItem>
        <DescriptionsItem label="调用结果">
          <Badge :status="currentRecord.success ? 'success' : 'error'" />
          {{ currentRecord.success ? '成功' : '失败' }}
        </DescriptionsItem>
        <DescriptionsItem label="响应时间">{{ currentRecord.responseTime }}ms</DescriptionsItem>
        <DescriptionsItem label="调用时间">{{ currentRecord.createTime }}</DescriptionsItem>
        <DescriptionsItem label="请求参数" :span="2">
          <pre class="json-content">{{ formatJson(currentRecord.requestParams) }}</pre>
        </DescriptionsItem>
        <DescriptionsItem label="响应结果" :span="2">
          <pre class="json-content" :class="{ error: !currentRecord.success }">{{ formatJson(currentRecord.responseBody) }}</pre>
        </DescriptionsItem>
        <DescriptionsItem v-if="currentRecord.errorMsg" label="错误信息" :span="2">
          <Alert :message="currentRecord.errorMsg" type="error" show-icon />
        </DescriptionsItem>
      </Descriptions>
    </Modal>

    <!-- 统计弹窗 -->
    <Modal
      v-model:open="statsVisible"
      title="调用统计报表"
      width="1000px"
      :footer="null"
    >
      <Row :gutter="16">
        <Col :span="12">
          <Card title="按应用分布" size="small">
            <div ref="appPieChartRef" class="chart-container"></div>
          </Card>
        </Col>
        <Col :span="12">
          <Card title="按接口分布" size="small">
            <div ref="apiPieChartRef" class="chart-container"></div>
          </Card>
        </Col>
      </Row>
      <Row :gutter="16" style="margin-top: 16px">
        <Col :span="24">
          <Card title="调用量趋势" size="small">
            <div ref="trendChartRef" class="chart-container"></div>
          </Card>
        </Col>
      </Row>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Badge, Modal, Descriptions, DescriptionsItem, Statistic, Row, Col, RangePicker, Tooltip, Alert, Progress } from 'ant-design-vue';
import { SearchOutlined, DownloadOutlined, BarChartOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import type { Dayjs } from 'dayjs';

interface LogRecord {
  id: string;
  appId: string;
  appName: string;
  developerId: string;
  developerName: string;
  method: string;
  apiPath: string;
  ip: string;
  location: string;
  success: boolean;
  responseTime: number;
  requestParams: any;
  responseBody: any;
  errorMsg?: string;
  createTime: string;
}

interface AppItem {
  appId: string;
  appName: string;
}

const loading = ref(false);
const dataSource = ref<LogRecord[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  appId: undefined as string | undefined,
  apiPath: '',
  method: undefined as string | undefined,
  result: undefined as string | undefined,
  dateRange: null as [Dayjs | null, Dayjs | null] | null,
});

const appList = ref<AppItem[]>([
  { appId: 'APP001', appName: '商户收款APP' },
  { appId: 'APP002', appName: '官网支付' },
  { appId: 'APP003', appName: '测试应用' },
]);

const stats = reactive({
  totalCount: 125698,
  successCount: 124865,
  failedCount: 833,
  avgResponseTime: 45,
});

const columns = [
  { title: '日志ID', dataIndex: 'id', key: 'id', width: 200 },
  { title: '应用', dataIndex: 'appName', key: 'appName', width: 120 },
  { title: '开发者', dataIndex: 'developerName', key: 'developerName', width: 100 },
  { title: '方法', key: 'method', width: 80 },
  { title: 'API路径', key: 'apiPath', width: 200 },
  { title: '结果', key: 'result', width: 80 },
  { title: '响应时间', key: 'responseTime', width: 100 },
  { title: 'IP地址', key: 'ip', width: 120 },
  { title: '调用时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
];

const methodColorMap: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
};

const detailVisible = ref(false);
const currentRecord = ref<LogRecord | null>(null);

const statsVisible = ref(false);
const appPieChartRef = ref<HTMLElement>();
const apiPieChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = [
      { id: 'LOG001', appId: 'APP001', appName: '商户收款APP', developerId: 'DEV001', developerName: '某某科技', method: 'POST', apiPath: '/api/v1/pay/gateway', ip: '127.0.0.1', location: '本地', success: true, responseTime: 45, requestParams: { amount: 100 }, responseBody: { code: 0 }, createTime: '2024-01-15 10:30:25' },
      { id: 'LOG002', appId: 'APP002', appName: '官网支付', developerId: 'DEV002', developerName: '某支付公司', method: 'GET', apiPath: '/api/v1/query/order/xxx', ip: '192.168.1.1', location: '北京市', success: true, responseTime: 32, requestParams: {}, responseBody: { code: 0 }, createTime: '2024-01-15 10:30:20' },
      { id: 'LOG003', appId: 'APP001', appName: '商户收款APP', developerId: 'DEV001', developerName: '某某科技', method: 'POST', apiPath: '/api/v1/refund/apply', ip: '127.0.0.1', location: '本地', success: false, responseTime: 120, requestParams: { orderNo: 'xxx' }, responseBody: { code: 400, message: '订单不存在' }, errorMsg: '订单不存在', createTime: '2024-01-15 10:30:15' },
      { id: 'LOG004', appId: 'APP003', appName: '测试应用', developerId: 'DEV003', developerName: '测试商户', method: 'GET', apiPath: '/api/v1/account/balance', ip: '10.0.0.1', location: '上海市', success: true, responseTime: 28, requestParams: {}, responseBody: { code: 0, data: { balance: 10000 } }, createTime: '2024-01-15 10:30:10' },
    ];
    pagination.total = dataSource.value.length;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.appId = undefined;
  searchForm.apiPath = '';
  searchForm.method = undefined;
  searchForm.result = undefined;
  searchForm.dateRange = null;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function responseTimeClass(time: number) {
  if (time < 100) return 'response-fast';
  if (time < 500) return 'response-normal';
  return 'response-slow';
}

function formatJson(data: any) {
  if (!data) return '-';
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function openDetailModal(record: LogRecord) {
  currentRecord.value = record;
  detailVisible.value = true;
}

function handleExport() {
  // 导出功能
}

function handleViewStatistics() {
  statsVisible.value = true;
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.log-admin {
  padding: 16px;
  background: #f0f2f5;
}

.search-form {
  margin-bottom: 16px;
}

.stats-row {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.api-path {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.response-fast {
  color: #52c41a;
}

.response-normal {
  color: #faad14;
}

.response-slow {
  color: #f5222d;
}

.json-content {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  margin: 0;
}

.json-content.error {
  background: #fff2f0;
  color: #f5222d;
}

.chart-container {
  height: 250px;
}
</style>
