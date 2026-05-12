<template>
  <div class="ops-overview">
    <!-- 状态总览卡片 -->
    <Row :gutter="16" class="stat-row">
      <Col :span="6">
        <Card class="stat-card">
          <Statistic
            title="服务器总数"
            :value="overviewData.servers.total"
            suffix="/ 8"
          >
            <template #suffix>
              <span class="stat-suffix">/ {{ overviewData.servers.total }}</span>
            </template>
          </Statistic>
          <div class="stat-info">
            <Tag color="success">{{ overviewData.servers.online }} 在线</Tag>
            <Tag color="error">{{ overviewData.servers.offline }} 离线</Tag>
          </div>
          <div class="stat-bar">
            <Progress :percent="Math.round((overviewData.servers.online / overviewData.servers.total) * 100)" :showInfo="false" size="small" status="active" />
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card class="stat-card">
          <Statistic
            title="服务总数"
            :value="overviewData.services.total"
          >
          </Statistic>
          <div class="stat-info">
            <Tag color="success">{{ overviewData.services.running }} 运行</Tag>
            <Tag color="warning">{{ overviewData.services.stopped + overviewData.services.restarting }} 异常</Tag>
          </div>
          <div class="stat-detail">
            <span>平均响应: <strong>{{ overviewData.services.avgResponseTime }}ms</strong></span>
            <span>总请求: <strong>{{ formatNumber(overviewData.services.totalRequests) }}</strong></span>
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card class="stat-card">
          <Statistic
            title="应用健康"
            :value="overviewData.apps.healthy"
          >
          </Statistic>
          <div class="stat-info">
            <Tag color="success">{{ overviewData.apps.healthy }} 健康</Tag>
            <Tag color="error">{{ overviewData.apps.unhealthy }} 异常</Tag>
          </div>
          <div class="stat-detail">
            <span>请求量: <strong>{{ formatNumber(overviewData.apps.totalRequests) }}</strong></span>
            <span>错误: <strong class="error-text">{{ overviewData.apps.totalErrors }}</strong></span>
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card class="stat-card alert-card">
          <Statistic
            :value="overviewData.alerts.total"
            title="活跃告警"
          >
          </Statistic>
          <div class="stat-info">
            <Tag color="red">{{ overviewData.alerts.critical }} 严重</Tag>
            <Tag color="error">{{ overviewData.alerts.error }} 错误</Tag>
            <Tag color="warning">{{ overviewData.alerts.warning }} 警告</Tag>
          </div>
          <div class="stat-detail">
            <span>待处理: <strong class="warning-text">{{ overviewData.alerts.pending }}</strong></span>
          </div>
        </Card>
      </Col>
    </Row>

    <!-- 性能指标 -->
    <Row :gutter="16" class="perf-row">
      <Col :span="6">
        <Card title="CPU 使用率">
          <div ref="cpuChartRef" style="height: 160px"></div>
          <div class="perf-value">
            <span class="value">{{ overviewData.servers.avgCpu.toFixed(1) }}%</span>
            <span class="label">平均</span>
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card title="内存使用率">
          <div ref="memChartRef" style="height: 160px"></div>
          <div class="perf-value">
            <span class="value">{{ overviewData.servers.avgMemory.toFixed(1) }}%</span>
            <span class="label">平均</span>
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card title="磁盘使用率">
          <div ref="diskChartRef" style="height: 160px"></div>
          <div class="perf-value">
            <span class="value">{{ overviewData.servers.avgDisk.toFixed(1) }}%</span>
            <span class="label">平均</span>
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card title="业务指标">
          <div class="biz-mini">
            <div class="biz-item">
              <span class="biz-label">订单量</span>
              <span class="biz-value">{{ formatNumber(overviewData.business.orderCount) }}</span>
            </div>
            <div class="biz-item">
              <span class="biz-label">交易金额</span>
              <span class="biz-value">￥{{ formatNumber(overviewData.business.orderAmount) }}</span>
            </div>
            <div class="biz-item">
              <span class="biz-label">成功率</span>
              <span class="biz-value success">{{ overviewData.business.successRate }}%</span>
            </div>
            <div class="biz-item">
              <span class="biz-label">活跃用户</span>
              <span class="biz-value">{{ formatNumber(overviewData.business.activeUsers) }}</span>
            </div>
          </div>
        </Card>
      </Col>
    </Row>

    <!-- 图表区 -->
    <Row :gutter="16" class="chart-row">
      <Col :span="16">
        <Card title="24小时趋势">
          <template #extra>
            <Segmented v-model:value="trendType" :options="trendOptions" size="small" />
          </template>
          <div ref="trendChartRef" style="height: 280px"></div>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="实时监控">
          <div ref="radarChartRef" style="height: 280px"></div>
        </Card>
      </Col>
    </Row>

    <!-- 服务健康 & 告警 & 日志统计 -->
    <Row :gutter="16" class="bottom-row">
      <Col :span="8">
        <Card title="服务健康状态">
          <template #extra>
            <RouterLink to="/ops/service">更多</RouterLink>
          </template>
          <List :data-source="serviceHealth" :loading="loading" size="small">
            <template #renderItem="{ item }">
              <ListItem>
                <ListItemMeta :title="item.name" />
                <template #actions>
                  <Badge :status="getHealthStatus(item.status)" />
                  <span>{{ item.responseTime }}ms</span>
                </template>
              </ListItem>
            </template>
          </List>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="活跃告警">
          <template #extra>
            <RouterLink to="/ops/alert">更多</RouterLink>
          </template>
          <List :data-source="activeAlerts" :loading="loading" size="small">
            <template #renderItem="{ item }">
              <ListItem>
                <ListItemMeta :title="item.title" :description="item.host" />
                <template #actions>
                  <Tag :color="getAlertColor(item.level)">{{ item.level.toUpperCase() }}</Tag>
                </template>
              </ListItem>
            </template>
          </List>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="日志统计">
          <template #extra>
            <RouterLink to="/ops/log">更多</RouterLink>
          </template>
          <div ref="logChartRef" style="height: 200px"></div>
          <div class="log-summary">
            <span>今日总量: <strong>{{ formatNumber(overviewData.logs.todayTotal) }}</strong></span>
            <span>错误: <strong class="error-text">{{ overviewData.logs.errorCount }}</strong></span>
            <span>警告: <strong class="warning-text">{{ overviewData.logs.warnCount }}</strong></span>
          </div>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { Row, Col, Card, Statistic, Tag, Progress, List, ListItem, ListItemMeta, Badge, Segmented } from 'ant-design-vue';
import * as echarts from 'echarts';
import { getOpsOverview, getServiceHealth, getAlertList } from '@/api/ops';

const loading = ref(false);
const cpuChartRef = ref<HTMLElement>();
const memChartRef = ref<HTMLElement>();
const diskChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();
const radarChartRef = ref<HTMLElement>();
const logChartRef = ref<HTMLElement>();
const trendType = ref('cpu');
const trendOptions = [
  { label: 'CPU', value: 'cpu' },
  { label: '内存', value: 'memory' },
  { label: '响应时间', value: 'responseTime' },
  { label: 'QPS', value: 'qps' },
];

const overviewData = reactive({
  servers: { total: 0, online: 0, offline: 0, avgCpu: 0, avgMemory: 0, avgDisk: 0 },
  services: { total: 0, running: 0, stopped: 0, restarting: 0, avgResponseTime: 0, totalRequests: 0, totalErrors: 0 },
  apps: { total: 0, healthy: 0, unhealthy: 0, totalRequests: 0, totalErrors: 0, avgResponseTime: 0 },
  business: { orderCount: 0, orderAmount: 0, successRate: 0, avgResponseTime: 0, activeUsers: 0, activeConnections: 0 },
  alerts: { total: 0, critical: 0, error: 0, warning: 0, info: 0, pending: 0 },
  logs: { todayTotal: 0, errorCount: 0, warnCount: 0, avgPerMinute: 0 },
  trend: [] as any[],
});

const serviceHealth = ref<any[]>([]);
const activeAlerts = ref<any[]>([]);
let charts: echarts.ECharts[] = [];
let refreshTimer: number | null = null;

function formatNumber(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

function getHealthStatus(status: string) {
  const map: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
    healthy: 'success',
    unhealthy: 'error',
    unknown: 'warning',
  };
  return map[status] || 'default';
}

function getAlertColor(level: string) {
  const map: Record<string, string> = {
    critical: 'red',
    error: 'orange',
    warning: 'gold',
    info: 'blue',
  };
  return map[level] || 'blue';
}

async function fetchData() {
  loading.value = true;
  try {
    const [overviewRes, healthRes, alertRes] = await Promise.all([
      getOpsOverview().catch(() => null),
      getServiceHealth().catch(() => null),
      getAlertList({ page: 1, pageSize: 5, status: 'active' }).catch(() => ({ list: [] })),
    ]);

    if (overviewRes) {
      Object.assign(overviewData.servers, overviewRes.servers || {});
      Object.assign(overviewData.services, overviewRes.services || {});
      Object.assign(overviewData.apps, overviewRes.apps || {});
      Object.assign(overviewData.business, overviewRes.business || {});
      Object.assign(overviewData.alerts, overviewRes.alerts || {});
      Object.assign(overviewData.logs, overviewRes.logs || {});
      if (overviewRes.trend) overviewData.trend = overviewRes.trend;
    }

    if (healthRes?.details) {
      serviceHealth.value = healthRes.details;
    }

    if (alertRes?.list) {
      activeAlerts.value = alertRes.list;
    }

    initCharts();
  } catch (error) {
    console.error('获取运维概览数据失败', error);
  } finally {
    loading.value = false;
  }
}

function initCharts() {
  charts.forEach((c) => c.dispose());
  charts = [];

  // CPU 仪表盘
  if (cpuChartRef.value) {
    const chart = echarts.init(cpuChartRef.value);
    chart.setOption({
      series: [{
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 4,
        itemStyle: { color: getGaugeColor(overviewData.servers.avgCpu) },
        progress: { show: true, width: 12 },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 12, color: [[1, '#f0f0f0']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        detail: { valueAnimation: true, fontSize: 20, offsetCenter: [0, '30%'], formatter: '{value}%' },
        data: [{ value: parseFloat(overviewData.servers.avgCpu.toFixed(1)) }],
      }],
    });
    charts.push(chart);
  }

  // 内存仪表盘
  if (memChartRef.value) {
    const chart = echarts.init(memChartRef.value);
    chart.setOption({
      series: [{
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 4,
        itemStyle: { color: getGaugeColor(overviewData.servers.avgMemory) },
        progress: { show: true, width: 12 },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 12, color: [[1, '#f0f0f0']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        detail: { valueAnimation: true, fontSize: 20, offsetCenter: [0, '30%'], formatter: '{value}%' },
        data: [{ value: parseFloat(overviewData.servers.avgMemory.toFixed(1)) }],
      }],
    });
    charts.push(chart);
  }

  // 磁盘仪表盘
  if (diskChartRef.value) {
    const chart = echarts.init(diskChartRef.value);
    chart.setOption({
      series: [{
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 4,
        itemStyle: { color: getGaugeColor(overviewData.servers.avgDisk) },
        progress: { show: true, width: 12 },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 12, color: [[1, '#f0f0f0']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        detail: { valueAnimation: true, fontSize: 20, offsetCenter: [0, '30%'], formatter: '{value}%' },
        data: [{ value: parseFloat(overviewData.servers.avgDisk.toFixed(1)) }],
      }],
    });
    charts.push(chart);
  }

  // 趋势图
  if (trendChartRef.value && overviewData.trend.length > 0) {
    const chart = echarts.init(trendChartRef.value);
    const typeMap: Record<string, { key: string; color: string; label: string }> = {
      cpu: { key: 'cpu', color: '#1890ff', label: 'CPU %' },
      memory: { key: 'memory', color: '#722ed1', label: '内存 %' },
      responseTime: { key: 'responseTime', color: '#52c41a', label: '响应时间 ms' },
      qps: { key: 'qps', color: '#fa8c16', label: 'QPS' },
    };
    const cfg = typeMap[trendType.value];
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: overviewData.trend.map((t) => t.date), boundaryGap: false },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [{
        type: 'line',
        data: overviewData.trend.map((t) => t[cfg.key]),
        smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: cfg.color + '40' }, { offset: 1, color: cfg.color + '05' }]) },
        lineStyle: { color: cfg.color, width: 2 },
        itemStyle: { color: cfg.color },
        markLine: {
          silent: true,
          data: [{ type: 'average', name: '平均值' }],
        },
      }],
    });
    charts.push(chart);
  }

  // 雷达图
  if (radarChartRef.value) {
    const chart = echarts.init(radarChartRef.value);
    chart.setOption({
      tooltip: {},
      radar: {
        indicator: [
          { name: 'CPU', max: 100 },
          { name: '内存', max: 100 },
          { name: '磁盘', max: 100 },
          { name: 'QPS', max: 100 },
          { name: '成功率', max: 100 },
          { name: '响应速度', max: 100 },
        ],
        radius: '65%',
      },
      series: [{
        type: 'radar',
        data: [{
          value: [
            overviewData.servers.avgCpu,
            overviewData.servers.avgMemory,
            overviewData.servers.avgDisk,
            Math.min((overviewData.services.totalRequests / 1000000) * 100, 100),
            overviewData.business.successRate,
            Math.max(100 - (overviewData.services.avgResponseTime / 5), 0),
          ],
          name: '系统健康度',
          areaStyle: { color: 'rgba(24, 144, 255, 0.3)' },
          lineStyle: { color: '#1890ff' },
          itemStyle: { color: '#1890ff' },
        }],
      }],
    });
    charts.push(chart);
  }

  // 日志分布饼图
  if (logChartRef.value) {
    const chart = echarts.init(logChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['50%', '45%'],
        label: { show: false },
        data: [
          { name: 'ERROR', value: overviewData.logs.errorCount, itemStyle: { color: '#F56C6C' } },
          { name: 'WARN', value: overviewData.logs.warnCount, itemStyle: { color: '#E6A23C' } },
          { name: 'INFO', value: overviewData.logs.todayTotal - overviewData.logs.errorCount - overviewData.logs.warnCount, itemStyle: { color: '#409EFF' } },
        ],
      }],
    });
    charts.push(chart);
  }
}

function getGaugeColor(value: number) {
  if (value < 60) return '#52c41a';
  if (value < 80) return '#faad14';
  return '#f5222d';
}

function handleResize() {
  charts.forEach((c) => c?.resize());
}

watch(trendType, () => {
  if (trendChartRef.value && overviewData.trend.length > 0) {
    const chart = echarts.getInstanceByDom(trendChartRef.value);
    if (chart) {
      const typeMap: Record<string, { key: string; color: string }> = {
        cpu: { key: 'cpu', color: '#1890ff' },
        memory: { key: 'memory', color: '#722ed1' },
        responseTime: { key: 'responseTime', color: '#52c41a' },
        qps: { key: 'qps', color: '#fa8c16' },
      };
      const cfg = typeMap[trendType.value];
      chart.setOption({
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
        series: [{
          data: overviewData.trend.map((t) => t[cfg.key]),
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: cfg.color + '40' }, { offset: 1, color: cfg.color + '05' }]) },
          lineStyle: { color: cfg.color, width: 2 },
          itemStyle: { color: cfg.color },
        }],
      });
    }
  }
});

onMounted(() => {
  fetchData();
  window.addEventListener('resize', handleResize);
  refreshTimer = window.setInterval(fetchData, 30000);
});

onUnmounted(() => {
  charts.forEach((c) => c.dispose());
  window.removeEventListener('resize', handleResize);
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<style scoped>
.ops-overview {
  padding: 16px;
  background: #f0f2f5;
}
.stat-row,
.perf-row,
.chart-row,
.bottom-row {
  margin-bottom: 16px;
}
.stat-card :deep(.ant-statistic-title) {
  font-size: 13px;
  color: #666;
}
.stat-card :deep(.ant-statistic-content-value) {
  font-size: 28px;
  font-weight: 700;
}
.stat-suffix {
  font-size: 14px;
  color: #999;
  margin-left: 4px;
}
.stat-info {
  margin-top: 8px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.stat-detail {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
  display: flex;
  justify-content: space-between;
}
.alert-card :deep(.ant-statistic-content-value) {
  color: #f5222d;
}
.error-text {
  color: #f5222d;
}
.warning-text {
  color: #faad14;
}
.success {
  color: #52c41a;
}
.perf-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 4px;
}
.perf-value .value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}
.perf-value .label {
  font-size: 12px;
  color: #999;
}
.biz-mini {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.biz-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.biz-label {
  font-size: 12px;
  color: #888;
}
.biz-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.log-summary {
  margin-top: 8px;
  display: flex;
  justify-content: space-around;
  font-size: 12px;
  color: #666;
}
</style>
