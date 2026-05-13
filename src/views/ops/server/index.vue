<template>
  <div class="server-monitor">
    <Card class="table-card">
      <template #title>
        <Space>
          <span>服务器列表</span>
          <Button type="primary" @click="fetchData">
            <ReloadOutlined /> 刷新
          </Button>
        </Space>
      </template>
      <template #extra>
        <Space>
          <Select v-model:value="filterStatus" style="width: 120px" placeholder="状态筛选" allowClear>
            <SelectOption value="online">在线</SelectOption>
            <SelectOption value="offline">离线</SelectOption>
            <SelectOption value="warning">警告</SelectOption>
          </Select>
          <InputSearch v-model:value="keyword" placeholder="搜索主机名/IP" style="width: 200px" @search="handleSearch" />
        </Space>
      </template>

      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1400 }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Badge :status="getStatusBadge(record.status)" :text="getStatusText(record.status)" />
          </template>
          <template v-else-if="column.key === 'cpuUsage'">
            <Progress :percent="record.cpuUsage" :showInfo="false" size="small" :stroke-color="getUsageColor(record.cpuUsage)" />
            <span style="margin-left: 8px; font-size: 12px">{{ record.cpuUsage.toFixed(1) }}%</span>
          </template>
          <template v-else-if="column.key === 'memUsage'">
            <Progress :percent="record.memUsage" :showInfo="false" size="small" :stroke-color="getUsageColor(record.memUsage)" />
            <span style="margin-left: 8px; font-size: 12px">{{ record.memUsage.toFixed(1) }}%</span>
          </template>
          <template v-else-if="column.key === 'diskUsage'">
            <Progress :percent="record.diskUsage" :showInfo="false" size="small" :stroke-color="getUsageColor(record.diskUsage)" />
            <span style="margin-left: 8px; font-size: 12px">{{ record.diskUsage.toFixed(1) }}%</span>
          </template>
          <template v-else-if="column.key === 'uptime'">
            {{ formatUptime(record.uptime) }}
          </template>
          <template v-else-if="column.key === 'lastHeartbeat'">
            {{ formatTime(record.lastHeartbeat) }}
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
    <Drawer v-model:open="detailVisible" :title="`服务器详情 - ${currentServer?.hostname || ''}`" width="900" :bodyStyle="{ padding: '0' }">
      <Tabs v-if="currentServer">
        <TabPane key="overview" tab="概览">
          <Descriptions :column="2" size="small" bordered>
            <DescriptionsItem label="主机名">{{ currentServer.hostname }}</DescriptionsItem>
            <DescriptionsItem label="IP地址">{{ currentServer.ip }}</DescriptionsItem>
            <DescriptionsItem label="操作系统">{{ currentServer.os }}</DescriptionsItem>
            <DescriptionsItem label="角色">{{ currentServer.role }}</DescriptionsItem>
            <DescriptionsItem label="CPU核心">{{ currentServer.cpuCores }} 核</DescriptionsItem>
            <DescriptionsItem label="内存总量">{{ formatBytes(currentServer.memTotal * 1024 * 1024) }}</DescriptionsItem>
            <DescriptionsItem label="磁盘总量">{{ currentServer.diskTotal }} GB</DescriptionsItem>
            <DescriptionsItem label="运行时长">{{ formatUptime(currentServer.uptime) }}</DescriptionsItem>
          </Descriptions>

          <Row :gutter="16" style="margin-top: 16px">
            <Col :span="8">
              <Card size="small" title="CPU 使用率">
                <div ref="cpuDetailRef" style="height: 160px"></div>
              </Card>
            </Col>
            <Col :span="8">
              <Card size="small" title="内存使用率">
                <div ref="memDetailRef" style="height: 160px"></div>
              </Card>
            </Col>
            <Col :span="8">
              <Card size="small" title="磁盘使用率">
                <div ref="diskDetailRef" style="height: 160px"></div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane key="network" tab="网络">
          <Card size="small" title="网络带宽" style="margin-bottom: 16px">
            <div ref="bandwidthDetailRef" style="height: 200px"></div>
          </Card>
          <Card size="small" title="进程列表">
            <Table :data-source="serverDetail.processes || []" :columns="processColumns" size="small" :pagination="false" />
          </Card>
        </TabPane>

        <TabPane key="disk" tab="磁盘">
          <Card size="small" title="挂载点">
            <List size="small" :data-source="serverDetail.mountPoints || []">
              <template #renderItem="{ item }">
                <ListItem>
                  <ListItemMeta :title="item.path" />
                  <div style="width: 300px">
                    <Progress :percent="Number(item.usage.toFixed(1))" size="small" :stroke-color="getUsageColor(Number(item.usage))" />
                  </div>
                  <div style="margin-left: 12px; font-size: 12px; color: #666">
                    {{ formatBytes(item.used * 1024 * 1024 * 1024) }} / {{ item.total }} GB
                  </div>
                </ListItem>
              </template>
            </List>
          </Card>
        </TabPane>
      </Tabs>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue';
import { Card, Table, Button, Space, InputSearch, Select, SelectOption, Badge, Progress, Drawer, Tabs, TabPane, Descriptions, DescriptionsItem, Row, Col, List, ListItem, ListItemMeta } from 'ant-design-vue';
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import { getServerList, getServerDetail } from '@/api/ops';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const filterStatus = ref<string>();
const keyword = ref('');
const detailVisible = ref(false);
const currentServer = ref<any>(null);
const serverDetail = ref<any>({});
const cpuDetailRef = ref<HTMLElement>();
const memDetailRef = ref<HTMLElement>();
const diskDetailRef = ref<HTMLElement>();
const bandwidthDetailRef = ref<HTMLElement>();
let detailCharts: echarts.ECharts[] = [];

const columns = [
  { title: '状态', key: 'status', width: 80 },
  { title: '主机名', dataIndex: 'hostname', width: 140 },
  { title: 'IP地址', dataIndex: 'ip', width: 130 },
  { title: '角色', dataIndex: 'role', width: 120 },
  { title: 'CPU使用率', key: 'cpuUsage', width: 160 },
  { title: '内存使用率', key: 'memUsage', width: 160 },
  { title: '磁盘使用率', key: 'diskUsage', width: 160 },
  { title: '运行时长', key: 'uptime', width: 120 },
  { title: '最后心跳', key: 'lastHeartbeat', width: 160 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
];

const processColumns = [
  { title: 'PID', dataIndex: 'pid', width: 80 },
  { title: '进程名', dataIndex: 'name', width: 120 },
  { title: 'CPU %', dataIndex: 'cpu', width: 80 },
  { title: '内存 MB', dataIndex: 'mem', width: 80 },
  { title: '状态', dataIndex: 'state', width: 80 },
];

function getStatusBadge(status: string) {
  const map: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
    online: 'success', running: 'success',
    offline: 'error', stopped: 'error',
    warning: 'warning', restarting: 'warning',
  };
  return map[status] || 'default';
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    online: '在线', offline: '离线',
    running: '运行', stopped: '停止',
    warning: '警告', restarting: '重启中',
  };
  return map[status] || status;
}

function getUsageColor(value: number) {
  if (value < 60) return '#52c41a';
  if (value < 80) return '#faad14';
  return '#f5222d';
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}天 ${h}小时`;
  if (h > 0) return `${h}小时 ${m}分钟`;
  return `${m}分钟`;
}

function formatTime(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  return d.toLocaleString();
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await getServerList({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: keyword.value,
    });
    // Handle unified API response format
    const data = res?.data || res;
    dataSource.value = data?.list || res?.list || [];
    pagination.total = data?.total || res?.total || 0;
  } catch (error) {
    console.error('获取服务器列表失败', error);
  } finally {
    loading.value = false;
  }
}

async function showDetail(record: any) {
  currentServer.value = record;
  detailVisible.value = true;
  try {
    const res = await getServerDetail(record.id);
    serverDetail.value = res || {};
    await nextTick();
    initDetailCharts();
  } catch (error) {
    console.error('获取服务器详情失败', error);
  }
}

function initDetailCharts() {
  detailCharts.forEach((c) => c.dispose());
  detailCharts = [];

  const hist = serverDetail.value;
  const makeLineOption = (ref: HTMLElement, data: any[], color: string, label: string) => {
    const chart = echarts.init(ref);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 10, top: 10, bottom: 20 },
      xAxis: { type: 'category', data: data.map((d) => d.time), show: false },
      yAxis: { type: 'value', show: false },
      series: [{
        type: 'line',
        data: data.map((d) => d.value),
        smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: color + '60' }, { offset: 1, color: color + '10' }]) },
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        markLine: { silent: true, data: [{ type: 'average' }], lineStyle: { color: '#999', type: 'dashed' } },
      }],
    });
    detailCharts.push(chart);
  };

  if (hist.cpuHistory) makeLineOption(cpuDetailRef.value!, hist.cpuHistory, '#1890ff', 'CPU %');
  if (hist.memHistory) makeLineOption(memDetailRef.value!, hist.memHistory, '#722ed1', 'MEM %');
  if (hist.diskHistory) makeLineOption(diskDetailRef.value!, hist.diskHistory, '#fa8c16', 'DISK %');

  if (bandwidthDetailRef.value && hist.networkHistory) {
    const chart = echarts.init(bandwidthDetailRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['入带宽', '出带宽'], bottom: 0 },
      grid: { left: 50, right: 10, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: hist.networkHistory.map((d: any) => d.time), show: false },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [
        { name: '入带宽', type: 'line', data: hist.networkHistory.map((d: any) => d.rx), smooth: true, itemStyle: { color: '#1890ff' } },
        { name: '出带宽', type: 'line', data: hist.networkHistory.map((d: any) => d.tx), smooth: true, itemStyle: { color: '#52c41a' } },
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
onUnmounted(() => { detailCharts.forEach((c) => c.dispose()); });
</script>

<style scoped>
.server-monitor {
  padding: 16px;
  background: #f0f2f5;
}
.table-card {
  margin-bottom: 16px;
}
</style>
