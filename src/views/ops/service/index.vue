<template>
  <div class="service-monitor">
    <Card class="filter-card">
      <Row :gutter="16">
        <Col :span="6">
          <Form layout="vertical">
            <FormItem label="服务名称">
              <InputSearch v-model:value="keyword" placeholder="搜索服务名称" @search="handleSearch" />
            </FormItem>
          </Form>
        </Col>
        <Col :span="6">
          <Form layout="vertical">
            <FormItem label="状态">
              <Select v-model:value="filterStatus" placeholder="全部状态" allowClear @change="handleSearch">
                <SelectOption value="running">运行中</SelectOption>
                <SelectOption value="stopped">已停止</SelectOption>
                <SelectOption value="restarting">重启中</SelectOption>
                <SelectOption value="warning">警告</SelectOption>
              </Select>
            </FormItem>
          </Form>
        </Col>
        <Col :span="12">
          <Form layout="vertical">
            <FormItem label="健康检查">
              <Space>
                <Button :type="healthFilter === 'all' ? 'primary' : 'default'" @click="healthFilter = 'all'; fetchData()">全部</Button>
                <Button :type="healthFilter === 'healthy' ? 'primary' : 'default'" @click="healthFilter = 'healthy'; fetchData()">
                  <Badge status="success" /> 健康
                </Button>
                <Button :type="healthFilter === 'unhealthy' ? 'primary' : 'default'" @click="healthFilter = 'unhealthy'; fetchData()">
                  <Badge status="error" /> 异常
                </Button>
                <Button type="primary" @click="fetchData">
                  <ReloadOutlined /> 刷新
                </Button>
              </Space>
            </FormItem>
          </Form>
        </Col>
      </Row>
    </Card>

    <Row :gutter="16" class="summary-row">
      <Col :span="4">
        <Card class="summary-card">
          <Statistic title="服务总数" :value="pagination.total" />
          <div class="summary-bottom">
            <Tag color="blue">{{ pagination.total }} 个</Tag>
          </div>
        </Card>
      </Col>
      <Col :span="4">
        <Card class="summary-card">
          <Statistic title="运行中" :value="runningCount" :value-style="{ color: '#52c41a' }" />
          <div class="summary-bottom">
            <Tag color="success">正常</Tag>
          </div>
        </Card>
      </Col>
      <Col :span="4">
        <Card class="summary-card">
          <Statistic title="已停止" :value="stoppedCount" :value-style="{ color: '#f5222d' }" />
          <div class="summary-bottom">
            <Tag color="error">异常</Tag>
          </div>
        </Card>
      </Col>
      <Col :span="4">
        <Card class="summary-card">
          <Statistic title="平均响应时间" :value="avgResponse" suffix="ms" />
          <div class="summary-bottom">
            <span class="perf-label">响应速度</span>
          </div>
        </Card>
      </Col>
      <Col :span="4">
        <Card class="summary-card">
          <Statistic title="总请求量" :value="totalRequests" />
          <div class="summary-bottom">
            <span class="perf-label">今日累计</span>
          </div>
        </Card>
      </Col>
      <Col :span="4">
        <Card class="summary-card">
          <Statistic title="错误数" :value="totalErrors" :value-style="{ color: totalErrors > 0 ? '#f5222d' : '#52c41a' }" />
          <div class="summary-bottom">
            <span class="perf-label">总错误</span>
          </div>
        </Card>
      </Col>
    </Row>

    <Card>
      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1500 }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Badge :status="getStatusBadge(record.status)" :text="getStatusText(record.status)" />
          </template>
          <template v-else-if="column.key === 'healthStatus'">
            <Badge :status="getHealthBadge(record.healthStatus)" :text="getHealthText(record.healthStatus)" />
          </template>
          <template v-else-if="column.key === 'responseTime'">
            <span :style="{ color: record.responseTime > 200 ? '#f5222d' : record.responseTime > 100 ? '#faad14' : '#52c41a' }">
              {{ record.responseTime }}ms
            </span>
          </template>
          <template v-else-if="column.key === 'cpuUsage'">
            <Progress :percent="record.cpuUsage" :showInfo="false" size="small" :stroke-color="getUsageColor(record.cpuUsage)" />
            <span style="margin-left: 8px; font-size: 12px">{{ record.cpuUsage.toFixed(1) }}%</span>
          </template>
          <template v-else-if="column.key === 'uptime'">
            {{ formatUptime(record.uptime) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="showDetail(record)">
              <EyeOutlined /> 详情
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情抽屉 -->
    <Drawer v-model:open="detailVisible" :title="`服务详情 - ${currentService?.displayName || ''}`" width="900">
      <template v-if="currentService">
        <Descriptions :column="2" size="small" bordered style="margin-bottom: 16px">
          <DescriptionsItem label="服务名称">{{ currentService.name }}</DescriptionsItem>
          <DescriptionsItem label="显示名称">{{ currentService.displayName }}</DescriptionsItem>
          <DescriptionsItem label="版本">{{ currentService.version }}</DescriptionsItem>
          <DescriptionsItem label="主机">{{ currentService.host }}:{{ currentService.port }}</DescriptionsItem>
          <DescriptionsItem label="进程ID">{{ currentService.pid }}</DescriptionsItem>
          <DescriptionsItem label="启动时间">{{ currentService.startTime }}</DescriptionsItem>
          <DescriptionsItem label="运行时长">{{ formatUptime(currentService.uptime) }}</DescriptionsItem>
          <DescriptionsItem label="健康检查URL">{{ currentService.healthCheckUrl }}</DescriptionsItem>
        </Descriptions>

        <Row :gutter="16" style="margin-bottom: 16px">
          <Col :span="8">
            <Card size="small" title="请求量">
              <Statistic :value="currentService.requests" />
            </Card>
          </Col>
          <Col :span="8">
            <Card size="small" title="错误数">
              <Statistic :value="currentService.errors" :value-style="{ color: currentService.errors > 0 ? '#f5222d' : '#52c41a' }" />
            </Card>
          </Col>
          <Col :span="8">
            <Card size="small" title="响应时间">
              <Statistic :value="currentService.responseTime" suffix="ms" />
            </Card>
          </Col>
        </Row>

        <Card size="small" title="请求趋势" style="margin-bottom: 16px">
          <div ref="requestChartRef" style="height: 200px"></div>
        </Card>

        <Card size="small" title="接口列表">
          <Table :data-source="serviceDetail.endpoints || []" :columns="endpointColumns" size="small" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'avgResponseTime'">
                <span :style="{ color: record.avgResponseTime > 200 ? '#f5222d' : '#52c41a' }">{{ record.avgResponseTime }}ms</span>
              </template>
              <template v-else-if="column.key === 'errorRate'">
                <span :style="{ color: record.errorRate > 1 ? '#f5222d' : '#52c41a' }">{{ record.errorRate }}%</span>
              </template>
            </template>
          </Table>
        </Card>

        <Card size="small" title="依赖服务" style="margin-top: 16px">
          <List size="small" :data-source="serviceDetail.dependencies || []">
            <template #renderItem="{ item }">
              <ListItem>
                <ListItemMeta :title="item.name" />
                <template #actions>
                  <Badge :status="item.status === 'healthy' ? 'success' : 'warning'" />
                  <span>{{ item.avgResponseTime }}ms</span>
                </template>
              </ListItem>
            </template>
          </List>
        </Card>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from 'vue';
import { Card, Table, Badge, Progress, Statistic, Tag, Button, Space, Form, FormItem, InputSearch, Select, SelectOption, Drawer, Descriptions, DescriptionsItem, Row, Col, List, ListItem, ListItemMeta } from 'ant-design-vue';
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import { getServiceList, getServiceDetail } from '@/api/ops';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const keyword = ref('');
const filterStatus = ref<string>();
const healthFilter = ref('all');
const detailVisible = ref(false);
const currentService = ref<any>(null);
const serviceDetail = ref<any>({});
const requestChartRef = ref<HTMLElement>();
let requestChart: echarts.ECharts | null = null;

const runningCount = computed(() => dataSource.value.filter((s) => s.status === 'running').length);
const stoppedCount = computed(() => dataSource.value.filter((s) => s.status === 'stopped' || s.status === 'restarting').length);
const avgResponse = computed(() => {
  const running = dataSource.value.filter((s) => s.status === 'running');
  if (running.length === 0) return 0;
  return Math.round(running.reduce((sum, s) => sum + s.responseTime, 0) / running.length);
});
const totalRequests = computed(() => dataSource.value.reduce((sum, s) => sum + s.requests, 0));
const totalErrors = computed(() => dataSource.value.reduce((sum, s) => sum + s.errors, 0));

const columns = [
  { title: '状态', key: 'status', width: 90 },
  { title: '健康', key: 'healthStatus', width: 80 },
  { title: '服务名称', dataIndex: 'name', width: 160 },
  { title: '显示名称', dataIndex: 'displayName', width: 120 },
  { title: '版本', dataIndex: 'version', width: 80 },
  { title: '主机:端口', dataIndex: 'host', width: 160, customRender: ({ record }: any) => `${record.host}:${record.port}` },
  { title: '响应时间', key: 'responseTime', width: 100 },
  { title: 'CPU %', key: 'cpuUsage', width: 140 },
  { title: '请求量', dataIndex: 'requests', width: 100, customRender: ({ value }: any) => value?.toLocaleString() },
  { title: '错误数', dataIndex: 'errors', width: 80 },
  { title: '运行时长', key: 'uptime', width: 100 },
  { title: '操作', key: 'action', width: 80 },
];

const endpointColumns = [
  { title: '路径', dataIndex: 'path', width: 200 },
  { title: '方法', dataIndex: 'method', width: 80 },
  { title: '平均响应', key: 'avgResponseTime', width: 100 },
  { title: 'QPS', dataIndex: 'qps', width: 80 },
  { title: '错误率', key: 'errorRate', width: 80 },
];

function getStatusBadge(s: string) {
  const m: Record<string, 'success' | 'error' | 'warning' | 'default'> = { running: 'success', stopped: 'error', restarting: 'warning' };
  return m[s] || 'default';
}
function getStatusText(s: string) {
  const m: Record<string, string> = { running: '运行中', stopped: '已停止', restarting: '重启中' };
  return m[s] || s;
}
function getHealthBadge(s: string) {
  const m: Record<string, 'success' | 'error' | 'warning' | 'default'> = { healthy: 'success', unhealthy: 'error', unknown: 'warning' };
  return m[s] || 'default';
}
function getHealthText(s: string) {
  const m: Record<string, string> = { healthy: '健康', unhealthy: '异常', unknown: '未知' };
  return m[s] || s;
}
function getUsageColor(v: number) {
  if (v < 60) return '#52c41a';
  if (v < 80) return '#faad14';
  return '#f5222d';
}
function formatUptime(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}天${h}时`;
  if (h > 0) return `${h}时${m}分`;
  return `${m}分钟`;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await getServiceList({ page: pagination.current, pageSize: pagination.pageSize, keyword: keyword.value });
    // Handle unified API response format
    const data = res?.data || res;
    dataSource.value = data?.list || res?.list || [];
    pagination.total = data?.total || res?.total || 0;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

async function showDetail(record: any) {
  currentService.value = record;
  detailVisible.value = true;
  try {
    const res = await getServiceDetail(record.id);
    serviceDetail.value = res || {};
    await nextTick();
    initChart();
  } catch (e) { console.error(e); }
}

function initChart() {
  if (!requestChartRef.value) return;
  if (requestChart) requestChart.dispose();
  requestChart = echarts.init(requestChartRef.value);
  const data = serviceDetail.value.requestHistory || [];
  requestChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['请求量', '错误数'], bottom: 0 },
    grid: { left: 50, right: 10, top: 10, bottom: 30 },
    xAxis: { type: 'category', data: data.map((d: any) => d.time), show: false },
    yAxis: [
      { type: 'value', name: '请求', splitLine: { lineStyle: { type: 'dashed' } } },
      { type: 'value', name: '错误', splitLine: { show: false } },
    ],
    series: [
      { name: '请求量', type: 'bar', data: data.map((d: any) => d.requests), itemStyle: { color: '#1890ff' } },
      { name: '错误数', type: 'line', yAxisIndex: 1, data: data.map((d: any) => d.errors), itemStyle: { color: '#f5222d' }, lineStyle: { width: 2 } },
    ],
  });
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}
function handleSearch() {
  pagination.current = 1;
  fetchData();
}

onMounted(() => fetchData());
onUnmounted(() => { if (requestChart) requestChart.dispose(); });
</script>

<style scoped>
.service-monitor {
  padding: 16px;
  background: #f0f2f5;
}
.filter-card, .summary-row {
  margin-bottom: 16px;
}
.summary-card :deep(.ant-statistic-title) {
  font-size: 12px;
}
.summary-bottom {
  margin-top: 4px;
}
.perf-label {
  font-size: 12px;
  color: #999;
}
</style>
