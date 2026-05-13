<template>
  <div class="log-monitor">
    <!-- 统计概览 -->
    <Row :gutter="16" class="stat-row">
      <Col :span="6">
        <Card>
          <Statistic title="今日日志总量" :value="stats.today?.total || 0" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="ERROR" :value="stats.today?.error || 0" :value-style="{ color: '#f5222d' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="WARN" :value="stats.today?.warn || 0" :value-style="{ color: '#faad14' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="平均每分钟" :value="stats.today?.avgPerMinute || 0" />
        </Card>
      </Col>
    </Row>

    <Row :gutter="16" class="chart-row">
      <Col :span="12">
        <Card title="日志级别分布">
          <div ref="levelChartRef" style="height: 200px"></div>
        </Card>
      </Col>
      <Col :span="12">
        <Card title="24小时趋势">
          <div ref="trendChartRef" style="height: 200px"></div>
        </Card>
      </Col>
    </Row>

    <!-- 搜索和列表 -->
    <Card>
      <template #title>
        <Space wrap>
          <span>日志列表</span>
          <Select v-model:value="searchLevel" style="width: 120px" placeholder="日志级别" allowClear @change="handleSearch">
            <SelectOption value="DEBUG">DEBUG</SelectOption>
            <SelectOption value="INFO">INFO</SelectOption>
            <SelectOption value="WARN">WARN</SelectOption>
            <SelectOption value="ERROR">ERROR</SelectOption>
            <SelectOption value="FATAL">FATAL</SelectOption>
          </Select>
          <Select v-model:value="searchService" style="width: 180px" placeholder="服务名称" allowClear @change="handleSearch">
            <SelectOption v-for="s in serviceOptions" :key="s" :value="s">{{ s }}</SelectOption>
          </Select>
          <InputSearch v-model:value="searchKeyword" placeholder="搜索关键词" style="width: 200px" @search="handleSearch" />
          <RangePicker v-model:value="dateRange" @change="handleSearch" />
          <Button type="primary" @click="handleSearch"><SearchOutlined /> 搜索</Button>
          <Button @click="resetSearch">重置</Button>
        </Space>
      </template>

      <template #extra>
        <Space>
          <span style="color: #999; font-size: 12px">
            共 {{ pagination.total }} 条
          </span>
          <Button size="small" @click="fetchData"><ReloadOutlined /> 刷新</Button>
        </Space>
      </template>

      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1400, y: 400 }"
        row-key="id"
        @change="handleTableChange"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'level'">
            <Tag :color="getLevelColor(record.level)">{{ record.level }}</Tag>
          </template>
          <template v-else-if="column.key === 'timestamp'">
            {{ formatTime(record.timestamp) }}
          </template>
          <template v-else-if="column.key === 'message'">
            <Tooltip :title="record.message" placement="topLeft">
              <span class="log-message">{{ record.message }}</span>
            </Tooltip>
          </template>
          <template v-else-if="column.key === 'traceId'">
            <span style="font-family: monospace; font-size: 12px; color: #1890ff;">{{ record.traceId }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="showDetail(record)">
              <EyeOutlined /> 详情
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 日志详情 -->
    <Drawer v-model:open="detailVisible" title="日志详情" width="700">
      <template v-if="currentLog">
        <Descriptions :column="2" size="small" bordered style="margin-bottom: 16px">
          <DescriptionsItem label="时间">{{ currentLog.timestamp }}</DescriptionsItem>
          <DescriptionsItem label="级别">
            <Tag :color="getLevelColor(currentLog.level)">{{ currentLog.level }}</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="服务">{{ currentLog.serviceName }}</DescriptionsItem>
          <DescriptionsItem label="主机">{{ currentLog.host }}</DescriptionsItem>
          <DescriptionsItem label="来源">{{ currentLog.source }}</DescriptionsItem>
          <DescriptionsItem label="追踪ID">{{ currentLog.traceId }}</DescriptionsItem>
        </Descriptions>

        <Card size="small" title="日志内容" style="margin-bottom: 16px">
          <pre class="log-content">{{ currentLog.message }}</pre>
        </Card>

        <Card v-if="currentLog.exception" size="small" title="异常信息">
          <pre class="exception-content">{{ currentLog.exception }}</pre>
        </Card>

        <Card v-if="currentLog.stackTrace" size="small" title="堆栈跟踪" style="margin-top: 16px">
          <pre class="stack-content">{{ currentLog.stackTrace }}</pre>
        </Card>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue';
import { Card, Row, Col, Statistic, Table, Tag, Tooltip, Space, Select, SelectOption, InputSearch, RangePicker, Button, Drawer, Descriptions, DescriptionsItem } from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import { getLogList, getLogStatistics } from '@/api/ops';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });
const searchLevel = ref<string>();
const searchService = ref<string>();
const searchKeyword = ref('');
const dateRange = ref<any[]>([]);
const detailVisible = ref(false);
const currentLog = ref<any>(null);
const levelChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();
const stats = ref<any>({});
const serviceOptions = ref<string[]>(['payment-gateway', 'order-service', 'merchant-service', 'channel-service', 'notify-service', 'settlement-service', 'nginx', 'mysql']);
let statCharts: echarts.ECharts[] = [];

const columns = [
  { title: '时间', key: 'timestamp', width: 180 },
  { title: '级别', key: 'level', width: 80 },
  { title: '服务', dataIndex: 'serviceName', width: 140 },
  { title: '主机', dataIndex: 'host', width: 130 },
  { title: '消息', key: 'message', ellipsis: true },
  { title: '追踪ID', key: 'traceId', width: 160 },
  { title: '操作', key: 'action', width: 80 },
];

function getLevelColor(level: string) {
  const m: Record<string, string> = {
    DEBUG: '#909399', INFO: '#409EFF', WARN: '#E6A23C', ERROR: '#F56C6C', FATAL: '#8B0000',
  };
  return m[level] || '#909399';
}

function formatTime(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN', { hour12: false });
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await getLogList({
      page: pagination.current,
      pageSize: pagination.pageSize,
      level: searchLevel.value,
      serviceName: searchService.value,
    });
    // Handle unified API response format
    const data = res?.data || res;
    dataSource.value = data?.list || res?.list || [];
    pagination.total = data?.total || res?.total || 0;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

async function fetchStats() {
  try {
    const res = await getLogStatistics();
    stats.value = res || {};
    await nextTick();
    initCharts();
  } catch (e) { console.error(e); }
}

function initCharts() {
  statCharts.forEach((c) => c.dispose());
  statCharts = [];

  if (levelChartRef.value) {
    const chart = echarts.init(levelChartRef.value);
    const byLevel = stats.value.byLevel || [];
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '45%'],
        label: { show: false },
        data: byLevel.map((l: any) => ({ name: l.level, value: l.count, itemStyle: { color: l.color } })),
      }],
    });
    statCharts.push(chart);
  }

  if (trendChartRef.value) {
    const chart = echarts.init(trendChartRef.value);
    const trend = stats.value.trend || [];
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['日志量', '错误'], bottom: 0 },
      grid: { left: 50, right: 10, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: trend.map((d: any) => `${d.hour}:00`), show: false },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [
        { name: '日志量', type: 'bar', data: trend.map((d: any) => d.count), itemStyle: { color: '#409EFF' } },
        { name: '错误', type: 'line', yAxisIndex: 0, data: trend.map((d: any) => d.error), itemStyle: { color: '#F56C6C' }, lineStyle: { width: 2 } },
      ],
    });
    statCharts.push(chart);
  }
}

function showDetail(record: any) {
  currentLog.value = record;
  detailVisible.value = true;
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function resetSearch() {
  searchLevel.value = undefined;
  searchService.value = undefined;
  searchKeyword.value = '';
  dateRange.value = [];
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

onMounted(() => { fetchData(); fetchStats(); });
onUnmounted(() => statCharts.forEach((c) => c.dispose()));
</script>

<style scoped>
.log-monitor { padding: 16px; background: #f0f2f5; }
.stat-row, .chart-row { margin-bottom: 16px; }
.log-message { cursor: pointer; }
.log-message:hover { color: #1890ff; }
pre.log-content, pre.exception-content, pre.stack-content {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
