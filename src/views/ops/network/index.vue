<template>
  <div class="network-monitor">
    <Row :gutter="16" class="summary-row">
      <Col :span="6"><Card><Statistic title="网卡总数" :value="pagination.total" /></Card></Col>
      <Col :span="6"><Card><Statistic title="在线网卡" :value="onlineCount" /></Card></Col>
      <Col :span="6"><Card><Statistic title="总入带宽" :value="totalBandwidthIn" suffix="Mbps" /></Card></Col>
      <Col :span="6"><Card><Statistic title="总出带宽" :value="totalBandwidthOut" suffix="Mbps" /></Card></Col>
    </Row>

    <Card>
      <template #title>
        <Space>
          <span>网络接口</span>
          <Button type="primary" @click="fetchData"><ReloadOutlined /> 刷新</Button>
        </Space>
      </template>

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
            <Badge :status="record.status === 'up' ? 'success' : 'error'" :text="record.status === 'up' ? '正常' : '断开'" />
          </template>
          <template v-else-if="column.key === 'speed'">
            <Tag :color="record.speed === 'N/A' ? 'default' : 'blue'">{{ record.speed }}</Tag>
          </template>
          <template v-else-if="column.key === 'bandwidthIn'">
            <span style="color: #1890ff">{{ record.bandwidthIn?.toFixed(1) }} Mbps</span>
          </template>
          <template v-else-if="column.key === 'bandwidthOut'">
            <span style="color: #52c41a">{{ record.bandwidthOut?.toFixed(1) }} Mbps</span>
          </template>
          <template v-else-if="column.key === 'rxBytes'">
            {{ formatBytes(record.rxBytes) }}
          </template>
          <template v-else-if="column.key === 'txBytes'">
            {{ formatBytes(record.txBytes) }}
          </template>
          <template v-else-if="column.key === 'errors'">
            <span :style="{ color: (record.rxErrors + record.txErrors) > 0 ? '#f5222d' : '#52c41a' }">
              {{ record.rxErrors + record.txErrors }}
            </span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="showDetail(record)">
              <EyeOutlined /> 详情
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 端口详情 -->
    <Card title="端口监听" style="margin-top: 16px">
      <template #extra>
        <Space>
          <Select v-model:value="selectedServerId" style="width: 200px" placeholder="选择服务器" @change="fetchPorts">
            <SelectOption v-for="srv in servers" :key="srv.id" :value="srv.id">
              {{ srv.hostname }} ({{ srv.ip }})
            </SelectOption>
          </Select>
        </Space>
      </template>

      <Table
        :data-source="portList"
        :columns="portColumns"
        :loading="portLoading"
        :pagination="{ pageSize: 10 }"
        size="small"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'state'">
            <Tag :color="getStateColor(record.state)">{{ record.state }}</Tag>
          </template>
          <template v-else-if="column.key === 'connections'">
            <span :style="{ color: record.connections > 100 ? '#f5222d' : '#52c41a' }">{{ record.connections }}</span>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 带宽详情抽屉 -->
    <Drawer v-model:open="detailVisible" :title="`网络详情 - ${currentNet?.interfaceName || ''}`" width="800">
      <template v-if="currentNet">
        <Descriptions :column="2" size="small" bordered style="margin-bottom: 16px">
          <DescriptionsItem label="网卡名称">{{ currentNet.interfaceName }}</DescriptionsItem>
          <DescriptionsItem label="IP地址">{{ currentNet.ip }}</DescriptionsItem>
          <DescriptionsItem label="MAC地址">{{ currentNet.mac }}</DescriptionsItem>
          <DescriptionsItem label="状态">{{ currentNet.status === 'up' ? '正常' : '断开' }}</DescriptionsItem>
          <DescriptionsItem label="速率">{{ currentNet.speed }}</DescriptionsItem>
          <DescriptionsItem label="接收字节">{{ formatBytes(currentNet.rxBytes) }}</DescriptionsItem>
          <DescriptionsItem label="发送字节">{{ formatBytes(currentNet.txBytes) }}</DescriptionsItem>
          <DescriptionsItem label="接收包">{{ currentNet.rxPackets?.toLocaleString() }}</DescriptionsItem>
        </Descriptions>

        <Card size="small" title="带宽趋势" style="margin-bottom: 16px">
          <div ref="bandwidthChartRef" style="height: 250px"></div>
        </Card>

        <Card size="small" title="连接状态">
          <div ref="connectionChartRef" style="height: 250px"></div>
        </Card>

        <div v-if="connectionDetail.topConnections?.length > 0" style="margin-top: 16px">
          <h4>活跃连接 TOP5</h4>
          <Table :data-source="connectionDetail.topConnections" :columns="connColumns" size="small" :pagination="false" />
        </div>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from 'vue';
import { Card, Table, Statistic, Badge, Tag, Button, Space, Select, SelectOption, Drawer, Descriptions, DescriptionsItem, Row, Col } from 'ant-design-vue';
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import { getNetworkList, getNetworkPort, getNetworkBandwidth, getNetworkConnection, getServerList } from '@/api/ops';

const loading = ref(false);
const portLoading = ref(false);
const dataSource = ref<any[]>([]);
const portList = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const servers = ref<any[]>([]);
const selectedServerId = ref('srv-001');
const detailVisible = ref(false);
const currentNet = ref<any>(null);
const connectionDetail = ref<any>({});
const bandwidthChartRef = ref<HTMLElement>();
const connectionChartRef = ref<HTMLElement>();
let detailCharts: echarts.ECharts[] = [];

const onlineCount = computed(() => dataSource.value.filter((n) => n.status === 'up').length);
const totalBandwidthIn = computed(() => dataSource.value.reduce((s, n) => s + (n.bandwidthIn || 0), 0));
const totalBandwidthOut = computed(() => dataSource.value.reduce((s, n) => s + (n.bandwidthOut || 0), 0));

const columns = [
  { title: '状态', key: 'status', width: 80 },
  { title: '网卡', dataIndex: 'interfaceName', width: 100 },
  { title: 'IP地址', dataIndex: 'ip', width: 130 },
  { title: 'MAC地址', dataIndex: 'mac', width: 170 },
  { title: '速率', key: 'speed', width: 80 },
  { title: '入带宽', key: 'bandwidthIn', width: 110 },
  { title: '出带宽', key: 'bandwidthOut', width: 110 },
  { title: '接收', key: 'rxBytes', width: 100 },
  { title: '发送', key: 'txBytes', width: 100 },
  { title: '错包', key: 'errors', width: 80 },
  { title: '操作', key: 'action', width: 80 },
];

const portColumns = [
  { title: '端口', dataIndex: 'port', width: 80 },
  { title: '协议', dataIndex: 'protocol', width: 80 },
  { title: '状态', key: 'state', width: 120 },
  { title: '进程', dataIndex: 'processName', width: 120 },
  { title: 'PID', dataIndex: 'pid', width: 80 },
  { title: '连接数', key: 'connections', width: 100 },
  { title: '绑定地址', dataIndex: 'bindAddress', width: 120 },
];

const connColumns = [
  { title: '远程IP', dataIndex: 'remoteIp', width: 140 },
  { title: '端口', dataIndex: 'port', width: 80 },
  { title: '状态', dataIndex: 'state', width: 100 },
  { title: '连接数', dataIndex: 'count', width: 80 },
  { title: '首次出现', dataIndex: 'firstSeen', width: 160 },
];

function getStateColor(state: string) {
  const m: Record<string, string> = { LISTEN: 'success', ESTABLISHED: 'processing', TIME_WAIT: 'warning', CLOSE_WAIT: 'warning' };
  return m[state] || 'default';
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
    const res = await getNetworkList({ page: pagination.current, pageSize: pagination.pageSize });
    // Handle unified API response format
    const data = res?.data || res;
    dataSource.value = data?.list || res?.list || [];
    pagination.total = data?.total || res?.total || 0;

    const srvRes = await getServerList({ page: 1, pageSize: 100 });
    const srvData = srvRes?.data || srvRes;
    servers.value = srvData?.list || srvRes?.list || [];
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

async function fetchPorts() {
  portLoading.value = true;
  try {
    const res = await getNetworkPort(selectedServerId.value);
    portList.value = res || [];
  } catch (e) { console.error(e); }
  finally { portLoading.value = false; }
}

async function showDetail(record: any) {
  currentNet.value = record;
  detailVisible.value = true;
  try {
    const [bwRes, connRes] = await Promise.all([
      getNetworkBandwidth(record.serverId || 'srv-001').catch(() => ({})),
      getNetworkConnection(record.serverId || 'srv-001').catch(() => ({})),
    ]);
    connectionDetail.value = connRes || {};
    await nextTick();
    initDetailCharts(bwRes);
  } catch (e) { console.error(e); }
}

function initDetailCharts(bwData: any) {
  detailCharts.forEach((c) => c.dispose());
  detailCharts = [];

  if (bandwidthChartRef.value) {
    const chart = echarts.init(bandwidthChartRef.value);
    const inData = bwData?.in || [];
    const outData = bwData?.out || [];
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['入带宽', '出带宽'], bottom: 0 },
      grid: { left: 50, right: 10, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: inData.map((d: any) => d.time), show: false },
      yAxis: { type: 'value', name: 'Mbps', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [
        { name: '入带宽', type: 'line', data: inData.map((d: any) => d.value), smooth: true, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#1890ff40' }, { offset: 1, color: '#1890ff05' }]) }, lineStyle: { color: '#1890ff', width: 2 }, itemStyle: { color: '#1890ff' } },
        { name: '出带宽', type: 'line', data: outData.map((d: any) => d.value), smooth: true, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#52c41a40' }, { offset: 1, color: '#52c41a05' }]) }, lineStyle: { color: '#52c41a', width: 2 }, itemStyle: { color: '#52c41a' } },
      ],
    });
    detailCharts.push(chart);
  }

  if (connectionChartRef.value) {
    const chart = echarts.init(connectionChartRef.value);
    const hist = connectionDetail.value.connectionHistory || [];
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['已建立', '总连接'], bottom: 0 },
      grid: { left: 50, right: 10, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: hist.map((d: any) => d.time), show: false },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [
        { name: '已建立', type: 'line', data: hist.map((d: any) => d.established), smooth: true, itemStyle: { color: '#52c41a' } },
        { name: '总连接', type: 'line', data: hist.map((d: any) => d.total), smooth: true, itemStyle: { color: '#1890ff' } },
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

onMounted(() => { fetchData(); fetchPorts(); });
onUnmounted(() => detailCharts.forEach((c) => c.dispose()));
</script>

<style scoped>
.network-monitor { padding: 16px; background: #f0f2f5; }
.summary-row { margin-bottom: 16px; }
</style>
