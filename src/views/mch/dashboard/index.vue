<template>
  <div class="mch-dashboard">
    <Row :gutter="16" class="stat-row">
      <Col :span="6">
        <Card hoverable>
          <Statistic title="今日交易" :value="stats.todayAmount" prefix="¥" :precision="2" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="今日订单" :value="stats.todayOrders" suffix="笔" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="账户余额" :value="stats.balance" prefix="¥" :precision="2" :value-style="{ color: '#52c41a' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="通道数量" :value="stats.channels" suffix="个" />
        </Card>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="16">
        <Card title="交易走势">
          <div ref="tradeChartRef" style="height: 300px;"></div>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="通道分布">
          <div ref="channelChartRef" style="height: 300px;"></div>
        </Card>
      </Col>
    </Row>

    <Row :gutter="16" style="margin-top: 16px;">
      <Col :span="12">
        <Card title="最近交易">
          <Table :data-source="recentOrders" :columns="orderColumns" size="small" :pagination="false" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Tag :color="record.status === 'success' ? 'green' : 'orange'">
                  {{ record.status === 'success' ? '成功' : '处理中' }}
                </Tag>
              </template>
            </template>
          </Table>
        </Card>
      </Col>
      <Col :span="12">
        <Card title="快捷操作">
          <List>
            <ListItem>
              <Button type="link" @click="$router.push('/mch/order')">交易订单</Button>
            </ListItem>
            <ListItem>
              <Button type="link" @click="$router.push('/mch/transfer')">转账操作</Button>
            </ListItem>
            <ListItem>
              <Button type="link" @click="$router.push('/mch/settle')">结算记录</Button>
            </ListItem>
            <ListItem>
              <Button type="link" @click="$router.push('/mch/config')">通道配置</Button>
            </ListItem>
          </List>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Row, Col, Card, Statistic, Table, Tag, List, ListItem, Button } from 'ant-design-vue';
import * as echarts from 'echarts';

const tradeChartRef = ref();
const channelChartRef = ref();
const stats = reactive({
  todayAmount: 0,
  todayOrders: 0,
  balance: 0,
  channels: 0,
});

const recentOrders = ref([
  { id: '1', orderNo: 'PAY20240513001', amount: 100.00, status: 'success', time: '10:30:25' },
  { id: '2', orderNo: 'PAY20240513002', amount: 500.00, status: 'success', time: '10:28:10' },
  { id: '3', orderNo: 'PAY20240513003', amount: 200.00, status: 'pending', time: '10:25:00' },
  { id: '4', orderNo: 'PAY20240513004', amount: 1000.00, status: 'success', time: '10:20:15' },
  { id: '5', orderNo: 'PAY20240513005', amount: 50.00, status: 'success', time: '10:15:30' },
]);

const orderColumns = [
  { title: '订单号', dataIndex: 'orderNo', width: 180 },
  { title: '金额', dataIndex: 'amount', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: '时间', dataIndex: 'time', width: 100 },
];

onMounted(() => {
  // 模拟加载数据
  stats.todayAmount = 25680.00;
  stats.todayOrders = 128;
  stats.balance = 156000.00;
  stats.channels = 5;

  // 交易走势图
  if (tradeChartRef.value) {
    const chart = echarts.init(tradeChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['交易额'] },
      xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
      yAxis: { type: 'value', name: '金额(元)' },
      series: [{ name: '交易额', type: 'line', smooth: true, data: [0, 0, 5000, 12000, 8000, 3000, 680] }],
    });
  }

  // 通道分布图
  if (channelChartRef.value) {
    const chart = echarts.init(channelChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 45, name: '微信支付' },
          { value: 35, name: '支付宝' },
          { value: 15, name: '银联' },
          { value: 5, name: '其他' },
        ],
      }],
    });
  }
});
</script>

<style scoped>
.mch-dashboard { padding: 16px; }
.stat-row { margin-bottom: 16px; }
</style>
