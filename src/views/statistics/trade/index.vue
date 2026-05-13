<template>
  <div class="statistics-trade">
    <Card>
      <!-- 筛选条件 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="统计维度">
          <RadioGroup v-model:value="searchForm.type" @change="handleTypeChange">
            <RadioButton value="day">按日</RadioButton>
            <RadioButton value="week">按周</RadioButton>
            <RadioButton value="month">按月</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label="日期范围">
          <RangePicker v-model:value="dateRange" @change="handleDateChange" />
        </FormItem>
        <FormItem>
          <Button type="primary" @click="handleSearch">
            <template #icon><SearchOutlined /></template>
            查询
          </Button>
          <Button @click="handleReset" style="margin-left: 8px">重置</Button>
        </FormItem>
      </Form>

      <!-- 统计卡片 -->
      <Row :gutter="16" class="stat-row">
        <Col :span="6">
          <Card size="small">
            <Statistic title="总交易笔数" :value="stats.totalCount" suffix="笔" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="总交易金额" :value="stats.totalAmount" :precision="2" prefix="¥" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="总退款笔数" :value="stats.totalRefundCount" suffix="笔" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="总退款金额" :value="stats.totalRefundAmount" :precision="2" prefix="¥" />
          </Card>
        </Col>
      </Row>

      <!-- 图表 -->
      <Row :gutter="16">
        <Col :span="16">
          <Card title="交易趋势">
            <div ref="trendChartRef" style="height: 350px"></div>
          </Card>
        </Col>
        <Col :span="8">
          <Card title="交易占比">
            <div ref="pieChartRef" style="height: 350px"></div>
          </Card>
        </Col>
      </Row>

      <!-- 数据表格 -->
      <Card title="交易明细" class="table-card">
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
            <template v-if="column.key === 'orderAmount'">
              <span style="color: #f5222d; font-weight: 500;">¥{{ Number(record.amount || 0).toLocaleString() }}</span>
            </template>
            <template v-else-if="column.key === 'successAmount'">
              <span style="color: #52c41a; font-weight: 500;">¥{{ Number(record.successAmount || 0).toLocaleString() }}</span>
            </template>
          </template>
        </Table>
      </Card>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { Card, Form, FormItem, RadioGroup, RadioButton, RangePicker, Button, Row, Col, Statistic, Table } from 'ant-design-vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import { defHttp } from '@/utils/http/axios';

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
  type: 'day',
  startDate: '',
  endDate: '',
});

const dateRange = ref<[any, any] | null>(null);

const stats = reactive({
  totalCount: 0,
  totalAmount: 0,
  totalRefundCount: 0,
  totalRefundAmount: 0,
});

const columns = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
  { title: '交易笔数', dataIndex: 'count', key: 'count', width: 120 },
  { title: '交易金额', key: 'orderAmount', width: 150 },
  { title: '成功笔数', dataIndex: 'successCount', key: 'successCount', width: 120 },
  { title: '成功金额', key: 'successAmount', width: 150 },
];

const trendChartRef = ref<HTMLElement>();
const pieChartRef = ref<HTMLElement>();
let trendChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;

async function fetchData() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.append('type', searchForm.type);
    if (searchForm.startDate) params.append('startDate', searchForm.startDate);
    if (searchForm.endDate) params.append('endDate', searchForm.endDate);

    const res = await defHttp.get({ url: '/basic-api/stat/trade/trend', params: {
      type: searchForm.type,
      startDate: searchForm.startDate || undefined,
      endDate: searchForm.endDate || undefined,
    } });
    const data = res;

    if (data && data.data) {
      tableData.value = data.data;
      pagination.total = data.result.length;

      // 计算统计
      stats.totalCount = (data.data || []).reduce((sum: number, item: any) => sum + Number(item.count || 0), 0);
      stats.totalAmount = (data.data || []).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
      stats.totalRefundCount = data.result.reduce((sum: number, item: any) => sum + item.refundCount, 0);
      stats.totalRefundAmount = data.result.reduce((sum: number, item: any) => sum + item.refundAmount, 0);

      updateCharts(data.result);
    }
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
      legend: { data: ['交易金额', '退款金额', '交易笔数'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map(item => item.date),
        axisLabel: { rotate: 30 },
      },
      yAxis: [
        { type: 'value', name: '金额(元)', axisLabel: { formatter: (val: number) => (val / 10000).toFixed(0) + '万' } },
        { type: 'value', name: '笔数', axisLabel: { formatter: (val: number) => val.toLocaleString() } },
      ],
      series: [
        { name: '交易金额', type: 'bar', data: data.data.map((item: any) => item.amount), itemStyle: { color: '#1890ff' } },
        { name: '成功金额', type: 'bar', data: data.data.map((item: any) => item.successAmount || 0), itemStyle: { color: '#52c41a' } },
        { name: '交易笔数', type: 'line', yAxisIndex: 1, data: data.data.map((item: any) => item.count), itemStyle: { color: '#faad14' } },
      ],
    });
  }

  if (pieChart) {
    const totalAmount = (data.data || []).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
    const successAmount = (data.data || []).reduce((sum: number, item: any) => sum + Number(item.successAmount || 0), 0);
    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: (params: any) => `${params.name}: ¥${params.value.toLocaleString()} (${params.percent}%)` },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%' },
          data: [
            { value: successAmount, name: '成功交易', itemStyle: { color: '#52c41a' } },
            { value: totalAmount - successAmount, name: '失败交易', itemStyle: { color: '#f5222d' } },
          ],
        },
      ],
    });
  }
}

function handleTypeChange() {
  fetchData();
}

function handleDateChange() {
  if (dateRange.value && dateRange.value.length === 2) {
    searchForm.startDate = dateRange.value[0].format('YYYY-MM-DD');
    searchForm.endDate = dateRange.value[1].format('YYYY-MM-DD');
  } else {
    searchForm.startDate = '';
    searchForm.endDate = '';
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.type = 'day';
  searchForm.startDate = '';
  searchForm.endDate = '';
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
.statistics-trade {
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
