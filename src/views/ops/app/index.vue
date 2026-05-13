<template>
  <div class="app-monitor">
    <Row :gutter="16" class="summary-row">
      <Col :span="6">
        <Card>
          <Statistic title="应用总数" :value="pagination.total" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="总请求量" :value="totalRequests" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="总错误数" :value="totalErrors" :value-style="{ color: totalErrors > 0 ? '#f5222d' : '#52c41a' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="平均响应时间" :value="avgResponseTime" suffix="ms" />
        </Card>
      </Col>
    </Row>

    <Card>
      <template #title>
        <Space>
          <span>应用列表</span>
          <Button type="primary" @click="fetchData"><ReloadOutlined /> 刷新</Button>
        </Space>
      </template>
      <template #extra>
        <InputSearch v-model:value="keyword" placeholder="搜索应用名称" style="width: 200px" @search="handleSearch" />
      </template>

      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1600 }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'requests'">
            {{ record.requests?.toLocaleString() }}
          </template>
          <template v-else-if="column.key === 'errors'">
            <span :style="{ color: record.errors > 0 ? '#f5222d' : '#52c41a' }">{{ record.errors }}</span>
          </template>
          <template v-else-if="column.key === 'avgResponseTime'">
            <span :style="{ color: record.avgResponseTime > 200 ? '#f5222d' : '#52c41a' }">{{ record.avgResponseTime }}ms</span>
          </template>
          <template v-else-if="column.key === 'p99ResponseTime'">
            {{ record.p99ResponseTime }}ms
          </template>
          <template v-else-if="column.key === 'qps'">
            <span style="color: #1890ff">{{ record.qps?.toFixed(1) }}</span>
          </template>
          <template v-else-if="column.key === 'concurrency'">
            {{ record.concurrency }}
          </template>
          <template v-else-if="column.key === 'cpuUsage'">
            <Progress :percent="record.cpuUsage" :showInfo="false" size="small" :stroke-color="getColor(record.cpuUsage)" />
            <span style="margin-left: 8px; font-size: 12px">{{ record.cpuUsage.toFixed(1) }}%</span>
          </template>
          <template v-else-if="column.key === 'memUsage'">
            <Progress :percent="record.memUsage" :showInfo="false" size="small" :stroke-color="getColor(record.memUsage)" />
            <span style="margin-left: 8px; font-size: 12px">{{ record.memUsage.toFixed(1) }}%</span>
          </template>
          <template v-else-if="column.key === 'jvmUsage'">
            <Progress :percent="record.jvmHeapUsage" :showInfo="false" size="small" :stroke-color="getColor(record.jvmHeapUsage)" />
            <span style="margin-left: 8px; font-size: 12px">{{ record.jvmHeapUsage.toFixed(1) }}%</span>
          </template>
          <template v-else-if="column.key === 'gcCount'">
            <span style="color: #fa8c16">{{ record.gcCount }}</span>
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
    <Drawer v-model:open="detailVisible" :title="`应用详情 - ${currentApp?.name || ''}`" width="900">
      <template v-if="currentApp">
        <Tabs>
          <TabPane key="jvm" tab="JVM监控">
            <Row :gutter="16" style="margin-bottom: 16px">
              <Col :span="8">
                <Card size="small" title="堆内存使用">
                  <Progress :percent="Number(appDetail.jvmHeapUsage?.toFixed(1))" :stroke-color="getColor(Number(appDetail.jvmHeapUsage))" />
                  <div style="font-size: 12px; color: #666; margin-top: 8px">
                    {{ formatBytes((appDetail.heapUsed || 0) * 1024 * 1024) }} / {{ formatBytes((appDetail.heapMax || 4096) * 1024 * 1024) }}
                  </div>
                </Card>
              </Col>
              <Col :span="8">
                <Card size="small" title="年轻代使用">
                  <Progress :percent="Number(appDetail.jvmYoungGenUsage?.toFixed(1))" :stroke-color="getColor(Number(appDetail.jvmYoungGenUsage))" />
                  <div style="font-size: 12px; color: #666; margin-top: 8px">
                    {{ formatBytes((appDetail.youngGenUsed || 0) * 1024 * 1024) }}
                  </div>
                </Card>
              </Col>
              <Col :span="8">
                <Card size="small" title="老年代使用">
                  <Progress :percent="Number(appDetail.jvmOldGenUsage?.toFixed(1))" :stroke-color="getColor(Number(appDetail.jvmOldGenUsage))" />
                  <div style="font-size: 12px; color: #666; margin-top: 8px">
                    {{ formatBytes((appDetail.oldGenUsed || 0) * 1024 * 1024) }}
                  </div>
                </Card>
              </Col>
            </Row>
            <Card size="small" title="堆内存趋势" style="margin-bottom: 16px">
              <div ref="heapChartRef" style="height: 200px"></div>
            </Card>
            <Card size="small" title="GC 趋势">
              <div ref="gcChartRef" style="height: 200px"></div>
            </Card>
          </TabPane>

          <TabPane key="thread" tab="线程监控">
            <Row :gutter="16" style="margin-bottom: 16px">
              <Col :span="6">
                <Card size="small"><Statistic title="线程数" :value="appDetail.threadCount" /></Card>
              </Col>
              <Col :span="6">
                <Card size="small"><Statistic title="峰值线程" :value="appDetail.threadPeak" /></Card>
              </Col>
              <Col :span="6">
                <Card size="small"><Statistic title="守护线程" :value="appDetail.daemonCount" /></Card>
              </Col>
              <Col :span="6">
                <Card size="small"><Statistic title="阻塞线程" :value="appDetail.blockedCount" /></Card>
              </Col>
            </Row>
            <Card size="small" title="线程趋势" style="margin-bottom: 16px">
              <div ref="threadChartRef" style="height: 200px"></div>
            </Card>
            <Card size="small" title="活跃线程 TOP5">
              <Table :data-source="appDetail.topThreads || []" :columns="threadColumns" size="small" :pagination="false" />
            </Card>
          </TabPane>

          <TabPane key="db" tab="数据库">
            <Row :gutter="16" style="margin-bottom: 16px">
              <Col :span="8">
                <Card size="small"><Statistic title="活跃连接" :value="appDetail.dbActive" /></Card>
              </Col>
              <Col :span="8">
                <Card size="small"><Statistic title="空闲连接" :value="appDetail.dbIdle" /></Card>
              </Col>
              <Col :span="8">
                <Card size="small"><Statistic title="等待连接" :value="appDetail.waitingCount || 0" /></Card>
              </Col>
            </Row>
            <Card size="small" title="慢查询">
              <Table :data-source="appDetail.slowQueries || []" :columns="sqlColumns" size="small" :pagination="false" />
            </Card>
            <Card size="small" title="SQL连接趋势" style="margin-top: 16px">
              <div ref="sqlChartRef" style="height: 200px"></div>
            </Card>
          </TabPane>
        </Tabs>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from 'vue';
import { Card, Table, Statistic, Progress, Button, Space, InputSearch, Drawer, Tabs, TabPane, Row, Col, Descriptions, DescriptionsItem } from 'ant-design-vue';
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import { getAppList, getAppJVM, getAppThread, getAppSql } from '@/api/ops';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const keyword = ref('');
const detailVisible = ref(false);
const currentApp = ref<any>(null);
const appDetail = ref<any>({});
const heapChartRef = ref<HTMLElement>();
const gcChartRef = ref<HTMLElement>();
const threadChartRef = ref<HTMLElement>();
const sqlChartRef = ref<HTMLElement>();
let detailCharts: echarts.ECharts[] = [];

const totalRequests = computed(() => dataSource.value.reduce((s, r) => s + (r.requests || 0), 0));
const totalErrors = computed(() => dataSource.value.reduce((s, r) => s + (r.errors || 0), 0));
const avgResponseTime = computed(() => {
  if (dataSource.value.length === 0) return 0;
  return Math.round(dataSource.value.reduce((s, r) => s + (r.avgResponseTime || 0), 0) / dataSource.value.length);
});

const columns = [
  { title: '应用名称', dataIndex: 'name', width: 140 },
  { title: '分组', dataIndex: 'group', width: 100 },
  { title: '请求量', key: 'requests', width: 100 },
  { title: '错误数', key: 'errors', width: 80 },
  { title: '平均响应', key: 'avgResponseTime', width: 100 },
  { title: 'P99响应', key: 'p99ResponseTime', width: 100 },
  { title: 'QPS', key: 'qps', width: 80 },
  { title: '并发数', key: 'concurrency', width: 80 },
  { title: 'CPU %', key: 'cpuUsage', width: 140 },
  { title: '内存 %', key: 'memUsage', width: 140 },
  { title: 'JVM堆', key: 'jvmUsage', width: 140 },
  { title: 'GC次数', key: 'gcCount', width: 80 },
  { title: '操作', key: 'action', width: 80 },
];

const threadColumns = [
  { title: '线程名', dataIndex: 'name', width: 180 },
  { title: '状态', dataIndex: 'state', width: 100 },
  { title: 'CPU %', dataIndex: 'cpu', width: 80 },
  { title: '内存 MB', dataIndex: 'mem', width: 80 },
  { title: '增量CPU', dataIndex: 'deltaCpu', width: 80 },
];

const sqlColumns = [
  { title: 'SQL语句', dataIndex: 'sql', ellipsis: true },
  { title: '执行时间', dataIndex: 'execTime', width: 100, customRender: ({ value }: any) => `${value}ms` },
  { title: '执行次数', dataIndex: 'count', width: 100 },
];

function getColor(v: number) {
  if (v < 60) return '#52c41a';
  if (v < 80) return '#faad14';
  return '#f5222d';
}

function formatBytes(b: number): string {
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (b >= 1024 && i < 3) { b /= 1024; i++; }
  return `${b.toFixed(1)} ${u[i]}`;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await getAppList({ page: pagination.current, pageSize: pagination.pageSize, keyword: keyword.value });
    // Handle unified API response format
    const data = res?.data || res;
    dataSource.value = data?.list || res?.list || [];
    pagination.total = data?.total || res?.total || 0;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

async function showDetail(record: any) {
  currentApp.value = record;
  detailVisible.value = true;
  try {
    const [jvmRes, threadRes, sqlRes] = await Promise.all([
      getAppJVM(record.id).catch(() => ({})),
      getAppThread(record.id).catch(() => ({})),
      getAppSql(record.id).catch(() => ({})),
    ]);
    appDetail.value = { ...record, ...jvmRes, ...threadRes, ...sqlRes };
    await nextTick();
    initDetailCharts();
  } catch (e) { console.error(e); }
}

function initDetailCharts() {
  detailCharts.forEach((c) => c.dispose());
  detailCharts = [];

  const makeLine = (ref: HTMLElement, data: any[], color: string) => {
    const chart = echarts.init(ref);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 10, top: 10, bottom: 20 },
      xAxis: { type: 'category', data: data.map((d) => d.time), show: false },
      yAxis: { type: 'value', show: false },
      series: [{
        type: 'line', data: data.map((d) => d.used || d.count || 0),
        smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: color + '60' }, { offset: 1, color: color + '10' }]) },
        lineStyle: { color, width: 2 }, itemStyle: { color },
      }],
    });
    detailCharts.push(chart);
  };

  if (heapChartRef.value && appDetail.value.heapHistory) makeLine(heapChartRef.value, appDetail.value.heapHistory, '#1890ff');
  if (gcChartRef.value && appDetail.value.gcHistory) makeLine(gcChartRef.value, appDetail.value.gcHistory, '#fa8c16');
  if (threadChartRef.value && appDetail.value.threadHistory) makeLine(threadChartRef.value, appDetail.value.threadHistory, '#722ed1');

  if (sqlChartRef.value && appDetail.value.sqlHistory) {
    const chart = echarts.init(sqlChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['活跃连接', '慢查询'], bottom: 0 },
      grid: { left: 40, right: 10, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: appDetail.value.sqlHistory.map((d: any) => d.time), show: false },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [
        { name: '活跃连接', type: 'line', data: appDetail.value.sqlHistory.map((d: any) => d.active), itemStyle: { color: '#1890ff' } },
        { name: '慢查询', type: 'line', data: appDetail.value.sqlHistory.map((d: any) => d.slow), itemStyle: { color: '#f5222d' } },
      ],
    });
    detailCharts.push(chart);
  }
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
onUnmounted(() => detailCharts.forEach((c) => c.dispose()));
</script>

<style scoped>
.app-monitor { padding: 16px; background: #f0f2f5; }
.summary-row { margin-bottom: 16px; }
</style>
