<template>
  <div class="agent-dashboard">
    <Row :gutter="16" class="stat-row">
      <Col :span="6">
        <Card hoverable>
          <Statistic title="代理等级" :value="stats.level" suffix="级" :prefix="h(TeamOutlined)" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="下级代理" :value="stats.subAgents" suffix="人" :prefix="h(UserOutlined)" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="商户数量" :value="stats.merchants" suffix="家" :prefix="h(ShopOutlined)" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="累计佣金" :value="stats.commission" prefix="¥" :precision="2" />
        </Card>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="16">
        <Card title="交易趋势">
          <div ref="tradeChartRef" style="height: 300px;"></div>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="快捷操作">
          <List>
            <ListItem>
              <Button type="link" @click="$router.push('/agent/merchant')">商户管理</Button>
            </ListItem>
            <ListItem>
              <Button type="link" @click="$router.push('/agent/withdraw')">提现申请</Button>
            </ListItem>
            <ListItem>
              <Button type="link" @click="$router.push('/agent/profit')">收益明细</Button>
            </ListItem>
            <ListItem>
              <Button type="link" @click="$router.push('/agent/statistics')">数据统计</Button>
            </ListItem>
          </List>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue';
import { Row, Col, Card, Statistic } from 'ant-design-vue';
import { TeamOutlined, UserOutlined, ShopOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';

const tradeChartRef = ref();
const stats = reactive({
  level: 1,
  subAgents: 0,
  merchants: 0,
  commission: 0,
});

onMounted(() => {
  // 模拟加载数据
  stats.level = 1;
  stats.subAgents = 5;
  stats.merchants = 23;
  stats.commission = 128500.00;

  // 初始化图表
  if (tradeChartRef.value) {
    const chart = echarts.init(tradeChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['交易额', '佣金'] },
      xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
      yAxis: [
        { type: 'value', name: '交易额' },
        { type: 'value', name: '佣金' }
      ],
      series: [
        { name: '交易额', type: 'bar', data: [12000, 15000, 18000, 14000, 20000, 22000, 19000] },
        { name: '佣金', type: 'line', yAxisIndex: 1, data: [1200, 1500, 1800, 1400, 2000, 2200, 1900] }
      ]
    });
  }
});
</script>

<style scoped>
.agent-dashboard { padding: 16px; }
.stat-row { margin-bottom: 16px; }
</style>
