<template>
  <div class="open-platform-admin">
    <Row :gutter="16" class="stats-row">
      <Col :span="6">
        <Card>
          <Statistic 
            title="开发者总数" 
            :value="stats.developerCount" 
            :prefix="h(UserOutlined)" 
            :value-style="{ color: '#1890ff' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic 
            title="应用总数" 
            :value="stats.appCount" 
            :prefix="h(AppstoreOutlined)" 
            :value-style="{ color: '#52c41a' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic 
            title="今日调用量" 
            :value="stats.todayCallCount" 
            :prefix="h(BarChartOutlined)" 
            :value-style="{ color: '#faad14' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic 
            title="平均响应时间" 
            :value="stats.avgResponseTime" 
            suffix="ms"
            :prefix="h(ClockCircleOutlined)" 
            :value-style="{ color: '#f5222d' }"
          />
        </Card>
      </Col>
    </Row>

    <Row :gutter="16" class="charts-row">
      <Col :span="16">
        <Card title="调用量趋势">
          <div ref="trendChartRef" class="chart-container"></div>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="应用分布">
          <div ref="pieChartRef" class="chart-container"></div>
        </Card>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="24">
        <Card title="最新开发者">
          <template #extra>
            <Button type="link" @click="$router.push('/open-platform-admin/developer')">查看更多</Button>
          </template>
          <Table 
            :columns="developerColumns" 
            :data-source="recentDevelopers" 
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Badge :status="record.status === 'active' ? 'success' : 'error'" />
                <span>{{ record.status === 'active' ? '正常' : '禁用' }}</span>
              </template>
              <template v-else-if="column.key === 'level'">
                <Tag :color="levelColorMap[record.level]">{{ levelNameMap[record.level] }}</Tag>
              </template>
            </template>
          </Table>
        </Card>
      </Col>
    </Row>

    <Row :gutter="16" class="bottom-row">
      <Col :span="12">
        <Card title="最新应用">
          <template #extra>
            <Button type="link" @click="$router.push('/open-platform-admin/app')">查看更多</Button>
          </template>
          <Table 
            :columns="appColumns" 
            :data-source="recentApps" 
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Badge :status="record.status === 'active' ? 'success' : 'warning'" />
                <span>{{ record.status === 'active' ? '正常' : '暂停' }}</span>
              </template>
            </template>
          </Table>
        </Card>
      </Col>
      <Col :span="12">
        <Card title="调用日志">
          <template #extra>
            <Button type="link" @click="$router.push('/open-platform-admin/log')">查看更多</Button>
          </template>
          <Timeline>
            <TimelineItem v-for="log in recentLogs" :key="log.id" :color="log.success ? 'green' : 'red'">
              <p>
                <Tag :color="log.method === 'POST' ? 'blue' : 'green'">{{ log.method }}</Tag>
                <code>{{ log.apiPath }}</code>
              </p>
              <p class="log-info">
                <span>{{ log.appName }}</span>
                <span>{{ log.responseTime }}ms</span>
                <span>{{ log.createTime }}</span>
              </p>
            </TimelineItem>
          </Timeline>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { Row, Col, Card, Statistic, Table, Tag, Badge, Button, Timeline, TimelineItem } from 'ant-design-vue';
import { UserOutlined, AppstoreOutlined, BarChartOutlined, ClockCircleOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';

const trendChartRef = ref<HTMLElement>();
const pieChartRef = ref<HTMLElement>();

const stats = reactive({
  developerCount: 1258,
  appCount: 3421,
  todayCallCount: 156789,
  avgResponseTime: 45,
});

const levelColorMap: Record<string, string> = {
  basic: 'default',
  standard: 'blue',
  professional: 'purple',
  enterprise: 'gold',
};

const levelNameMap: Record<string, string> = {
  basic: '基础版',
  standard: '标准版',
  professional: '专业版',
  enterprise: '企业版',
};

const developerColumns = [
  { title: '开发者ID', dataIndex: 'developerId', key: 'developerId', width: 150 },
  { title: '开发者名称', dataIndex: 'developerName', key: 'developerName' },
  { title: '等级', key: 'level', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: '注册时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
];

const appColumns = [
  { title: '应用ID', dataIndex: 'appId', key: 'appId', width: 150 },
  { title: '应用名称', dataIndex: 'appName', key: 'appName' },
  { title: '开发者', dataIndex: 'developerName', key: 'developerName', width: 120 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
];

const recentDevelopers = ref([
  { developerId: 'DEV001', developerName: '某某科技', level: 'professional', status: 'active', createTime: '2024-01-01 10:00:00' },
  { developerId: 'DEV002', developerName: '某支付公司', level: 'enterprise', status: 'active', createTime: '2024-01-02 14:30:00' },
  { developerId: 'DEV003', developerName: '测试商户', level: 'basic', status: 'active', createTime: '2024-01-03 09:15:00' },
]);

const recentApps = ref([
  { appId: 'APP001', appName: '商户收款APP', developerName: '某某科技', status: 'active', createTime: '2024-01-01 10:30:00' },
  { appId: 'APP002', appName: '官网支付', developerName: '某支付公司', status: 'active', createTime: '2024-01-02 15:00:00' },
  { appId: 'APP003', appName: '测试应用', developerName: '测试商户', status: 'active', createTime: '2024-01-03 10:00:00' },
]);

const recentLogs = ref([
  { id: 1, method: 'POST', apiPath: '/api/v1/pay/gateway', appName: '商户收款APP', success: true, responseTime: 45, createTime: '10:30:25' },
  { id: 2, method: 'GET', apiPath: '/api/v1/query/order/xxx', appName: '官网支付', success: true, responseTime: 32, createTime: '10:30:20' },
  { id: 3, method: 'POST', apiPath: '/api/v1/refund/apply', appName: '商户收款APP', success: false, responseTime: 120, createTime: '10:30:15' },
  { id: 4, method: 'GET', apiPath: '/api/v1/account/balance', appName: '测试应用', success: true, responseTime: 28, createTime: '10:30:10' },
]);

onMounted(() => {
  initTrendChart();
  initPieChart();
});

function initTrendChart() {
  if (!trendChartRef.value) return;
  
  const chart = echarts.init(trendChartRef.value);
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['调用量', '成功量', '失败量'] },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    },
    yAxis: { type: 'value' },
    series: [
      { name: '调用量', type: 'line', data: [1200, 800, 4500, 12000, 18500, 22000, 15000], smooth: true },
      { name: '成功量', type: 'line', data: [1180, 790, 4450, 11800, 18200, 21700, 14800], smooth: true },
      { name: '失败量', type: 'line', data: [20, 10, 50, 200, 300, 300, 200], smooth: true },
    ],
  };
  chart.setOption(option);
}

function initPieChart() {
  if (!pieChartRef.value) return;
  
  const chart = echarts.init(pieChartRef.value);
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '应用分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [
          { value: 1048, name: '微信支付' },
          { value: 735, name: '支付宝' },
          { value: 580, name: '银联' },
          { value: 484, name: '其他' },
        ],
      },
    ],
  };
  chart.setOption(option);
}
</script>

<style scoped>
.open-platform-admin {
  padding: 16px;
  background: #f0f2f5;
}

.stats-row {
  margin-bottom: 16px;
}

.charts-row {
  margin-bottom: 16px;
}

.chart-container {
  height: 300px;
}

.bottom-row {
  margin-bottom: 16px;
}

.log-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
