<template>
  <div class="business-monitor">
    <!-- 核心指标 -->
    <Row :gutter="16" class="kpi-row">
      <Col :span="4">
        <Card class="kpi-card">
          <Statistic title="今日订单量" :value="kpiData.orderCount" :value-style="{ color: '#1890ff' }" />
          <div class="kpi-compare">
            <span :style="{ color: kpiData.growth > 0 ? '#52c41a' : '#f5222d' }">
              {{ kpiData.growth > 0 ? '+' : '' }}{{ kpiData.growth?.toFixed(1) }}%
            </span>
            <span class="kpi-compare-label">vs 昨日</span>
          </div>
        </Card>
      </Col>
      <Col :span="4">
        <Card class="kpi-card">
          <Statistic title="今日交易额" :value="kpiData.orderAmount" :precision="2" prefix="￥" :value-style="{ color: '#f5222d' }" />
          <div class="kpi-compare">
            <span style="color: #52c41a">+{{ ((kpiData.orderAmount / kpiData.yesterdayAmount - 1) * 100).toFixed(1) }}%</span>
            <span class="kpi-compare-label">vs 昨日</span>
          </div>
        </Card>
      </Col>
      <Col :span="4">
        <Card class="kpi-card">
          <Statistic title="成功率" :value="kpiData.successRate" suffix="%" :value-style="{ color: '#52c41a' }" />
          <div class="kpi-compare">
            <Progress :percent="kpiData.successRate" :showInfo="false" size="small" status="active" />
          </div>
        </Card>
      </Col>
      <Col :span="4">
        <Card class="kpi-card">
          <Statistic title="平均响应时间" :value="kpiData.avgResponseTime" suffix="ms" />
          <div class="kpi-compare">
            <span class="kpi-compare-label">API响应</span>
          </div>
        </Card>
      </Col>
      <Col :span="4">
        <Card class="kpi-card">
          <Statistic title="活跃用户" :value="kpiData.activeUsers" :value-style="{ color: '#722ed1' }" />
          <div class="kpi-compare">
            <span class="kpi-compare-label">实时在线</span>
          </div>
        </Card>
      </Col>
      <Col :span="4">
        <Card class="kpi-card">
          <Statistic title="缓存命中率" :value="kpiData.cacheHitRate" suffix="%" :value-style="{ color: '#fa8c16' }" />
          <div class="kpi-compare">
            <span class="kpi-compare-label">Redis缓存</span>
          </div>
        </Card>
      </Col>
    </Row>

    <!-- 趋势图表 -->
    <Row :gutter="16" class="chart-row">
      <Col :span="16">
        <Card>
          <template #extra>
            <RadioGroup v-model:value="trendDays" button-style="solid" @change="fetchTrend">
              <RadioButton value="7">近7天</RadioButton>
              <RadioButton value="14">近14天</RadioButton>
              <RadioButton value="30">近30天</RadioButton>
            </RadioGroup>
          </template>
          <template #title>
            <Segmented v-model:value="trendType" :options="trendOptions" @change="updateTrendChart" />
          </template>
          <div ref="trendChartRef" style="height: 320px"></div>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="实时业务状态">
          <div ref="radarChartRef" style="height: 320px"></div>
        </Card>
      </Col>
    </Row>

    <!-- 详细指标 -->
    <Row :gutter="16" class="metrics-row">
      <Col :span="12">
        <Card title="性能指标">
          <Descriptions :column="2" size="small">
            <DescriptionsItem label="TPS">{{ kpiData.tps?.toFixed(1) }}</DescriptionsItem>
            <DescriptionsItem label="QPS">{{ kpiData.qps?.toFixed(1) }}</DescriptionsItem>
            <DescriptionsItem label="平均响应">
              <span :style="{ color: (kpiData.avgRt || 0) > 100 ? '#faad14' : '#52c41a' }">{{ kpiData.avgRt?.toFixed(0) }}ms</span>
            </DescriptionsItem>
            <DescriptionsItem label="最大响应">{{ kpiData.maxRt?.toFixed(0) }}ms</DescriptionsItem>
            <DescriptionsItem label="P99响应">{{ kpiData.p99Rt?.toFixed(0) }}ms</DescriptionsItem>
            <DescriptionsItem label="错误率">
              <span :style="{ color: (kpiData.errorRate || 0) > 1 ? '#f5222d' : '#52c41a' }">{{ kpiData.errorRate?.toFixed(2) }}%</span>
            </DescriptionsItem>
          </Descriptions>
        </Card>
      </Col>
      <Col :span="12">
        <Card title="业务健康度">
          <Descriptions :column="2" size="small">
            <DescriptionsItem label="活跃连接">{{ kpiData.activeConnections }}</DescriptionsItem>
            <DescriptionsItem label="队列长度">{{ kpiData.queueLength }}</DescriptionsItem>
            <DescriptionsItem label="新增用户">{{ kpiData.newUsers }}</DescriptionsItem>
            <DescriptionsItem label="用户留存率">{{ kpiData.retention?.toFixed(1) }}%</DescriptionsItem>
            <DescriptionsItem label="转化率">{{ kpiData.conversion?.toFixed(1) }}%</DescriptionsItem>
            <DescriptionsItem label="成功率">
              <span style="color: #52c41a">{{ kpiData.successRate?.toFixed(2) }}%</span>
            </DescriptionsItem>
          </Descriptions>
        </Card>
      </Col>
    </Row>

    <!-- 趋势表格 -->
    <Card title="每日趋势数据" style="margin-top: 16px">
      <Table
        :data-source="trendData"
        :columns="trendColumns"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        size="small"
        row-key="date"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'orderAmount'">
            <span style="color: #f5222d">￥{{ Number(record.orderAmount).toFixed(2) }}</span>
          </template>
          <template v-else-if="column.key === 'successRate'">
            <span style="color: #52c41a">{{ record.successRate?.toFixed(2) }}%</span>
          </template>
          <template v-else-if="column.key === 'cpu'">
            <Progress :percent="record.cpu" :showInfo="false" size="small" :stroke-color="getColor(record.cpu)" />
            <span style="margin-left: 8px; font-size: 12px">{{ record.cpu?.toFixed(1) }}%</span>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { Card, Row, Col, Statistic, Progress, Segmented, RadioGroup, RadioButton, Descriptions, DescriptionsItem, Table } from 'ant-design-vue';
import * as echarts from 'echarts';
import { getBusinessOverview, getBusinessTrend, getBusinessKpi } from '@/api/ops';

const loading = ref(false);
const trendDays = ref('7');
const trendType = ref('orderAmount');
const trendOptions = [
  { label: '交易额', value: 'orderAmount' },
  { label: '订单量', value: 'orderCount' },
  { label: '用户', value: 'activeUsers' },
  { label: '错误率', value: 'errorRate' },
];
const trendChartRef = ref<HTMLElement>();
const radarChartRef = ref<HTMLElement>();

const kpiData = reactive<any>({
  orderCount: 0, orderAmount: 0, successRate: 0, avgResponseTime: 0,
  activeUsers: 0, activeConnections: 0, queueLength: 0, cacheHitRate: 0,
  growth: 0, yesterdayAmount: 0, tps: 0, qps: 0, avgRt: 0, maxRt: 0,
  p99Rt: 0, errorRate: 0, newUsers: 0, retention: 0, conversion: 0,
});
const trendData = ref<any[]>([]);
let trendChart: echarts.ECharts | null = null;
let refreshTimer: number | null = null;

const trendColumns = [
  { title: '日期', dataIndex: 'date', width: 120 },
  { title: '交易额', key: 'orderAmount', width: 150 },
  { title: '订单量', dataIndex: 'orderCount', width: 120 },
  { title: '成功率', key: 'successRate', width: 100 },
  { title: '活跃用户', dataIndex: 'activeUsers', width: 120 },
  { title: '平均响应', dataIndex: 'responseTime', width: 100, customRender: ({ value }: any) => `${value}ms` },
  { title: 'QPS', dataIndex: 'qps', width: 80 },
  { title: 'CPU', key: 'cpu', width: 150 },
  { title: '内存', dataIndex: 'memory', width: 150, customRender: ({ value }: any) => `${value?.toFixed(1)}%` },
];

function getColor(v: number) {
  if (v < 60) return '#52c41a';
  if (v < 80) return '#faad14';
  return '#f5222d';
}

async function fetchData() {
  loading.value = true;
  try {
    const [overviewRes, kpiRes] = await Promise.all([
      getBusinessOverview().catch(() => ({})),
      getBusinessKpi().catch(() => ({})),
    ]);
    // Handle unified API response format
    const overview = overviewRes?.data || overviewRes;
    const kpi = kpiRes?.data || kpiRes;
    Object.assign(kpiData, overview || {}, kpi || {});
    await fetchTrend();
    initRadarChart();
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

async function fetchTrend() {
  try {
    const res = await getBusinessTrend({ days: Number(trendDays.value) });
    trendData.value = res || [];
    initTrendChart();
  } catch (e) { console.error(e); }
}

function initTrendChart() {
  if (!trendChartRef.value) return;
  if (trendChart) trendChart.dispose();
  trendChart = echarts.init(trendChartRef.value);

  const typeMap: Record<string, { color: string; label: string; unit: string }> = {
    orderAmount: { color: '#f5222d', label: '交易额', unit: '元' },
    orderCount: { color: '#1890ff', label: '订单量', unit: '笔' },
    activeUsers: { color: '#722ed1', label: '活跃用户', unit: '人' },
    errorRate: { color: '#fa8c16', label: '错误率', unit: '%' },
  };
  const cfg = typeMap[trendType.value];

  trendChart.setOption({
    tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0].name}<br/>${cfg.label}: ${params[0].value}${cfg.unit}` },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: trendData.value.map((d) => d.date), boundaryGap: false },
    yAxis: { type: 'value', name: cfg.unit, splitLine: { lineStyle: { type: 'dashed' } } },
    series: [{
      type: 'line', data: trendData.value.map((d) => d[trendType.value]),
      smooth: true,
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: cfg.color + '40' }, { offset: 1, color: cfg.color + '05' }]) },
      lineStyle: { color: cfg.color, width: 2 }, itemStyle: { color: cfg.color },
    }],
  });
}

function updateTrendChart() {
  initTrendChart();
}

function initRadarChart() {
  if (!radarChartRef.value) return;
  const chart = echarts.init(radarChartRef.value);
  chart.setOption({
    tooltip: {},
    radar: {
      indicator: [
        { name: '交易性能', max: 100 },
        { name: '成功率', max: 100 },
        { name: '响应速度', max: 100 },
        { name: '用户活跃', max: 100 },
        { name: '系统稳定', max: 100 },
        { name: '缓存效率', max: 100 },
      ],
      radius: '65%',
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          Math.min((kpiData.orderAmount / 10000) * 10, 100),
          kpiData.successRate || 0,
          Math.max(100 - (kpiData.avgRt || 0) / 5, 0),
          Math.min((kpiData.activeUsers / 1000) * 100, 100),
          Math.max(100 - (kpiData.errorRate || 0) * 20, 0),
          kpiData.cacheHitRate || 0,
        ],
        name: '业务健康度',
        areaStyle: { color: 'rgba(82, 196, 26, 0.3)' },
        lineStyle: { color: '#52c41a' },
        itemStyle: { color: '#52c41a' },
      }],
    }],
  });
}

onMounted(() => { fetchData(); refreshTimer = window.setInterval(fetchData, 30000); });
onUnmounted(() => { if (trendChart) trendChart.dispose(); if (refreshTimer) clearInterval(refreshTimer); });
</script>

<style scoped>
.business-monitor { padding: 16px; background: #f0f2f5; }
.kpi-row, .chart-row, .metrics-row { margin-bottom: 16px; }
.kpi-card :deep(.ant-statistic-title) { font-size: 12px; color: #666; }
.kpi-card :deep(.ant-statistic-content-value) { font-size: 24px; }
.kpi-compare { margin-top: 4px; font-size: 12px; display: flex; align-items: center; gap: 4px; }
.kpi-compare-label { color: #999; }
</style>
