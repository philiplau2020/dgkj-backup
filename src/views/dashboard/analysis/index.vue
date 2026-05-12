<template>
  <div class="dashboard">
    <Row :gutter="16" class="stat-row">
      <Col :span="6">
        <Card>
          <Statistic
            title="今日交易总额"
            :value="statData.today.successAmount"
            :precision="2"
            prefix="￥"
            :value-style="{ color: '#f5222d' }"
          >
            <template #suffix>
              <span class="growth" v-if="statData.today.growth > 0">↑ {{ statData.today.growth }}%</span>
              <span class="growth down" v-else-if="statData.today.growth < 0">↓ {{ Math.abs(statData.today.growth) }}%</span>
            </template>
          </Statistic>
          <div class="stat-extra">
            <span>交易笔数: {{ statData.today.successCount || 0 }}</span>
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="昨日交易总额"
            :value="statData.yesterday.successAmount"
            :precision="2"
            prefix="￥"
            :value-style="{ color: '#1890ff' }"
          />
          <div class="stat-extra">
            <span>交易笔数: {{ statData.yesterday.successCount || 0 }}</span>
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="本月交易总额"
            :value="statData.month.successAmount"
            :precision="2"
            prefix="￥"
            :value-style="{ color: '#52c41a' }"
          />
          <div class="stat-extra">
            <span>退款金额: ￥{{ statData.month.refundAmount || 0 }}</span>
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            title="商户总数"
            :value="statData.counts.mchCount"
            :precision="0"
            suffix="户"
            :value-style="{ color: '#faad14' }"
          />
          <div class="stat-extra">
            <span>代理商: {{ statData.counts.agentCount }}</span>
          </div>
        </Card>
      </Col>
    </Row>

    <Row :gutter="16" class="chart-row">
      <Col :span="16">
        <Card title="交易趋势">
          <div ref="trendChartRef" style="height: 300px"></div>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="支付方式分布">
          <div ref="channelChartRef" style="height: 300px"></div>
        </Card>
      </Col>
    </Row>

    <Row :gutter="16" class="table-row">
      <Col :span="12">
        <Card title="待处理事项">
          <template #extra>
            <a @click="$router.push('/task/pending')">查看全部</a>
          </template>
          <List :data-source="statData.pending" :loading="loading">
            <template #renderItem="{ item }">
              <ListItem>
                <ListItemMeta :title="item.title" :description="item.desc" />
                <template #actions>
                  <a-badge :count="item.count" :number-style="{ backgroundColor: '#faad14' }" />
                </template>
              </ListItem>
            </template>
          </List>
        </Card>
      </Col>
      <Col :span="12">
        <Card title="最新订单">
          <template #extra>
            <a @click="$router.push('/trade/order')">查看全部</a>
          </template>
          <Table :data-source="statData.recentOrders" :columns="recentColumns" size="small" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'amount'">
                <span style="color: #f5222d">￥{{ record.amount }}</span>
              </template>
              <template v-else-if="column.key === 'statusText'">
                <Badge :status="getOrderStatus(record.status)" :text="getStatusText(record.status)" />
              </template>
            </template>
          </Table>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Row, Col, Card, Statistic, List, ListItem, ListItemMeta, Table, Badge } from 'ant-design-vue';
import * as echarts from 'echarts';
import { getDashboardStats, getTradeTrend, getPayTypeStats } from '@/api/statistics';

const loading = ref(false);
const trendChartRef = ref<HTMLElement>();
const channelChartRef = ref<HTMLElement>();

const statData = reactive({
  today: {
    totalCount: 0,
    successCount: 0,
    successAmount: 0,
    growth: 0,
  },
  yesterday: {
    successCount: 0,
    successAmount: 0,
  },
  month: {
    successCount: 0,
    successAmount: 0,
    refundCount: 0,
    refundAmount: 0,
  },
  counts: {
    mchCount: 0,
    agentCount: 0,
    orderCount: 0,
  },
  trend: [] as any[],
  payType: [] as any[],
  pending: [
    { title: '待审核商户', desc: '新注册商户待审核', count: 0 },
    { title: '待审核代理商', desc: '新注册代理商待审核', count: 0 },
    { title: '待处理提现', desc: '提现申请待处理', count: 0 },
    { title: '待处理对账', desc: '差异账单待处理', count: 0 },
  ],
  recentOrders: [] as any[],
});

const recentColumns = [
  { title: '订单号', dataIndex: 'orderNo', width: 160 },
  { title: '商户', dataIndex: 'mchNo', width: 100 },
  { title: '金额', key: 'amount', width: 100 },
  { title: '状态', key: 'statusText', width: 80 },
  { title: '时间', dataIndex: 'createTime', width: 150 },
];

const statusMap: Record<number, { text: string; badge: string }> = {
  0: { text: '待支付', badge: 'default' },
  1: { text: '已支付', badge: 'success' },
  2: { text: '支付中', badge: 'processing' },
  3: { text: '已关闭', badge: 'default' },
  4: { text: '已退款', badge: 'warning' },
};

function getStatusText(status: number) {
  return statusMap[status]?.text || '未知';
}

function getOrderStatus(status: number) {
  return statusMap[status]?.badge || 'default';
}

async function fetchData() {
  loading.value = true;
  try {
    const [dashboardRes, trendRes, payTypeRes] = await Promise.all([
      getDashboardStats().catch(() => null),
      getTradeTrend({ startDate: '', endDate: '' }).catch(() => []),
      getPayTypeStats({ startDate: '', endDate: '' }).catch(() => []),
    ]);

    if (dashboardRes) {
      Object.assign(statData.today, dashboardRes.today || {});
      Object.assign(statData.yesterday, dashboardRes.yesterday || {});
      Object.assign(statData.month, dashboardRes.month || {});
      Object.assign(statData.counts, dashboardRes.counts || {});
    }

    if (trendRes) {
      statData.trend = Array.isArray(trendRes) ? trendRes : [];
    }

    if (payTypeRes) {
      statData.payType = Array.isArray(payTypeRes) ? payTypeRes : [];
    }

    initCharts();
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

function initCharts() {
  if (trendChartRef.value && statData.trend.length > 0) {
    const chart = echarts.init(trendChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['交易金额', '交易笔数'] },
      xAxis: { type: 'category', data: statData.trend.map((t) => t.date) },
      yAxis: [
        { type: 'value', name: '金额(元)' },
        { type: 'value', name: '笔数', splitLine: { show: false } },
      ],
      series: [
        {
          name: '交易金额',
          type: 'bar',
          data: statData.trend.map((t) => parseFloat(t.amount || 0)),
          itemStyle: { color: '#1890ff' },
        },
        {
          name: '交易笔数',
          type: 'line',
          yAxisIndex: 1,
          data: statData.trend.map((t) => t.count || 0),
          itemStyle: { color: '#52c41a' },
        },
      ],
    });
  }

  if (channelChartRef.value && statData.payType.length > 0) {
    const chart = echarts.init(channelChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          data: statData.payType.map((c) => ({
            name: c.payTypeName || c.payType,
            value: c.amount || 0,
          })),
        },
      ],
    });
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.dashboard {
  padding: 16px;
  background: #f0f2f5;
}
.stat-row,
.chart-row,
.table-row {
  margin-bottom: 16px;
}
.stat-extra {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}
.growth {
  font-size: 14px;
  color: #52c41a;
  margin-left: 8px;
}
.growth.down {
  color: #f5222d;
}
</style>
