<template>
  <div class="statistics-finance">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="日期范围">
          <RangePicker v-model:value="dateRange" style="width: 240px" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              查询
            </Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <!-- 统计卡片 -->
      <Row :gutter="16" class="stat-row">
        <Col :span="6">
          <Card size="small">
            <Statistic title="账户总余额" :value="stats.totalBalance" :precision="2" prefix="¥" :value-style="{ color: '#1890ff', fontSize: '20px' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="今日结算" :value="stats.todaySettle" :precision="2" prefix="¥" :value-style="{ color: '#52c41a', fontSize: '20px' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="今日代付" :value="stats.todayWithdraw" :precision="2" prefix="¥" :value-style="{ color: '#faad14', fontSize: '20px' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="待处理" :value="stats.pendingCount" />
          </Card>
        </Col>
      </Row>

      <!-- 图表 -->
      <Row :gutter="16">
        <Col :span="12">
          <Card title="收支趋势">
            <div ref="trendChartRef" style="height: 350px"></div>
          </Card>
        </Col>
        <Col :span="12">
          <Card title="收支占比">
            <div ref="pieChartRef" style="height: 350px"></div>
          </Card>
        </Col>
      </Row>

      <!-- 收支明细 -->
      <Card title="收支明细" class="table-card">
        <Table
          :data-source="tableData"
          :columns="columns"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="date"
          :scroll="{ x: 1000 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'income'">
              <span style="color: #52c41a;">+¥{{ Number(record.income).toLocaleString() }}</span>
            </template>
            <template v-else-if="column.key === 'expense'">
              <span style="color: #f5222d;">-¥{{ Number(record.expense).toLocaleString() }}</span>
            </template>
            <template v-else-if="column.key === 'profit'">
              <span :style="{ color: record.profit >= 0 ? '#52c41a' : '#f5222d', fontWeight: 500 }">
                ¥{{ Number(record.profit).toLocaleString() }}
              </span>
            </template>
          </template>
        </Table>
      </Card>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { Card, Form, FormItem, RangePicker, Button, Space, Row, Col, Statistic, Table } from 'ant-design-vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';

const loading = ref(false);
const tableData = ref<any[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  startDate: '',
  endDate: '',
});

const dateRange = ref<[any, any] | null>(null);

const stats = reactive({
  totalBalance: 0,
  todaySettle: 0,
  todayWithdraw: 0,
  pendingCount: 0,
});

const columns = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
  { title: '收入', key: 'income', width: 150 },
  { title: '支出', key: 'expense', width: 150 },
  { title: '净收益', key: 'profit', width: 150 },
  { title: '结算笔数', dataIndex: 'settleCount', key: 'settleCount', width: 120 },
  { title: '代付笔数', dataIndex: 'withdrawCount', key: 'withdrawCount', width: 120 },
];

const trendChartRef = ref<HTMLElement>();
const pieChartRef = ref<HTMLElement>();
let trendChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;

async function fetchData() {
  loading.value = true;
  try {
    const params = new URLSearchParams();

    const res = await fetch(`/basic-api/stat/finance?${params}`);
    const data = await res.json();

    if (data.result) {
      stats.totalBalance = Number(data.result.totalIncome || 0) - Number(data.result.totalExpense || 0);
      stats.todaySettle = 18000 + Math.random() * 5000;
      stats.todayWithdraw = 3500 + Math.random() * 1000;
      stats.pendingCount = Math.floor(Math.random() * 10) + 1;
    }

    // 生成模拟趋势数据
    const mockData = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const income = 20000 + Math.random() * 30000;
      const expense = 15000 + Math.random() * 20000;
      mockData.push({
        date: date.toISOString().split('T')[0],
        income: Number(income.toFixed(2)),
        expense: Number(expense.toFixed(2)),
        profit: Number((income - expense).toFixed(2)),
        settleCount: Math.floor(Math.random() * 20) + 10,
        withdrawCount: Math.floor(Math.random() * 10) + 5,
      });
    }
    tableData.value = mockData;
    pagination.total = mockData.length;

    updateCharts(mockData);
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

function updateCharts(data: any[]) {
  if (trendChart) {
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['收入', '支出', '净收益'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map(item => item.date),
        axisLabel: { rotate: 30 },
      },
      yAxis: [
        { type: 'value', name: '金额(元)' },
      ],
      series: [
        { name: '收入', type: 'bar', data: data.map(item => item.income), itemStyle: { color: '#52c41a' } },
        { name: '支出', type: 'bar', data: data.map(item => item.expense), itemStyle: { color: '#f5222d' } },
        { name: '净收益', type: 'line', data: data.map(item => item.profit), itemStyle: { color: '#1890ff' } },
      ],
    });
  }

  if (pieChart) {
    const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = data.reduce((sum, item) => sum + item.expense, 0);
    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: (params: any) => `${params.name}: ¥${Number(params.value).toLocaleString()} (${params.percent}%)` },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%' },
          data: [
            { value: totalIncome, name: '收入', itemStyle: { color: '#52c41a' } },
            { value: totalExpense, name: '支出', itemStyle: { color: '#f5222d' } },
          ],
        },
      ],
    });
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  dateRange.value = null;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
}

function initCharts() {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value);
  }
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value);
  }

  window.addEventListener('resize', () => {
    trendChart?.resize();
    pieChart?.resize();
  });
}

onMounted(() => {
  initCharts();
  fetchData();
});

onUnmounted(() => {
  trendChart?.dispose();
  pieChart?.dispose();
});
</script>

<style scoped>
.statistics-finance {
  padding: 16px;
  background: #f0f2f5;
}
.search-form {
  margin-bottom: 16px;
}
.stat-row {
  margin-bottom: 16px;
}
.table-card {
  margin-top: 16px;
}
</style>
