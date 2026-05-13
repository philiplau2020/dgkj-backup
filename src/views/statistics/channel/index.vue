<template>
  <div class="statistics-channel">
    <Card>
      <!-- 筛选条件 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="渠道名称">
          <Input v-model:value="searchForm.channelName" placeholder="请输入渠道名称" allow-clear style="width: 160px" />
        </FormItem>
        <FormItem label="日期范围">
          <RangePicker v-model:value="dateRange" />
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
            <Statistic title="渠道总数" :value="stats.totalChannel" />
          </Card>
        </Col>
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
            <Statistic title="平均成功率" :value="stats.avgSuccessRate" suffix="%" :precision="2" />
          </Card>
        </Col>
      </Row>

      <!-- 图表 -->
      <Row :gutter="16">
        <Col :span="12">
          <Card title="渠道交易金额占比">
            <div ref="pieChartRef" style="height: 350px"></div>
          </Card>
        </Col>
        <Col :span="12">
          <Card title="渠道交易笔数占比">
            <div ref="barChartRef" style="height: 350px"></div>
          </Card>
        </Col>
      </Row>

      <!-- 数据表格 -->
      <Card title="渠道明细" class="table-card">
        <Table
          :data-source="tableData"
          :columns="columns"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="channel"
          :scroll="{ x: 1200 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'totalAmount'">
              <span style="color: #f5222d; font-weight: 500;">¥{{ Number(record.totalAmount).toLocaleString() }}</span>
            </template>
            <template v-else-if="column.key === 'successAmount'">
              <span style="color: #52c41a;">¥{{ Number(record.successAmount).toLocaleString() }}</span>
            </template>
            <template v-else-if="column.key === 'refundAmount'">
              <span style="color: #faad14;">¥{{ Number(record.refundAmount).toLocaleString() }}</span>
            </template>
            <template v-else-if="column.key === 'successRate'">
              <Progress :percent="Number(record.successRate.replace('%', ''))" :status="Number(record.successRate.replace('%', '')) >= 95 ? 'success' : 'exception'" size="small" />
            </template>
          </template>
        </Table>
      </Card>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { Card, Form, FormItem, Input, RangePicker, Button, Row, Col, Statistic, Table, Progress } from 'ant-design-vue';
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
  channelName: '',
  startDate: '',
  endDate: '',
});

const dateRange = ref<[any, any] | null>(null);

const stats = reactive({
  totalChannel: 0,
  totalCount: 0,
  totalAmount: 0,
  avgSuccessRate: 0,
});

const columns = [
  { title: '渠道编码', dataIndex: 'channel', key: 'channel', width: 120 },
  { title: '渠道名称', dataIndex: 'channelName', key: 'channelName', width: 140 },
  { title: '交易笔数', dataIndex: 'totalCount', key: 'totalCount', width: 120 },
  { title: '交易金额', key: 'totalAmount', width: 150 },
  { title: '成功笔数', dataIndex: 'successCount', key: 'successCount', width: 120 },
  { title: '成功金额', key: 'successAmount', width: 150 },
  { title: '退款笔数', dataIndex: 'refundCount', key: 'refundCount', width: 120 },
  { title: '退款金额', key: 'refundAmount', width: 150 },
  { title: '成功率', key: 'successRate', width: 150 },
];

const pieChartRef = ref<HTMLElement>();
const barChartRef = ref<HTMLElement>();
let pieChart: echarts.ECharts | null = null;
let barChart: echarts.ECharts | null = null;

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };

    const res = await defHttp.get({ url: '/basic-api/stat/channel/list', params });
    if (res && res.data) {
      tableData.value = res.data;
      pagination.total = res.total || res.data.length;

      stats.totalChannel = res.total || res.data?.length || 0;
      stats.totalCount = tableData.value.reduce((sum: number, item: any) => sum + item.totalCount, 0);
      stats.totalAmount = tableData.value.reduce((sum: number, item: any) => sum + Number(item.totalAmount), 0);
      const totalRates = tableData.value.reduce((sum: number, item: any) => sum + Number((item.successRate || '0').replace('%', '')), 0);
      stats.avgSuccessRate = tableData.value.length > 0 ? totalRates / tableData.value.length : 0;

      updateCharts(tableData.value);
    }
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

function updateCharts(data: any[]) {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

  if (pieChart) {
    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: (params: any) => `${params.name}<br/>¥${Number(params.value).toLocaleString()} (${params.percent}%)` },
      legend: { orient: 'vertical', right: '5%', top: 'center' },
      series: [
        {
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
          data: data.map((item, index) => ({
            value: Number(item.totalAmount),
            name: item.channelName,
            itemStyle: { color: colors[index % colors.length] },
          })),
        },
      ],
    });
  }

  if (barChart) {
    barChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: data.map(item => item.channelName), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '笔数' },
      series: [
        {
          type: 'bar',
          data: data.map((item, index) => ({
            value: item.totalCount,
            itemStyle: { color: colors[index % colors.length], borderRadius: [4, 4, 0, 0] },
          })),
          barWidth: '50%',
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
  searchForm.channelName = '';
  dateRange.value = null;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function initCharts() {
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value);
  }
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value);
  }

  window.addEventListener('resize', () => {
    pieChart?.resize();
    barChart?.resize();
  });
}

onMounted(() => {
  initCharts();
  fetchData();
});

onUnmounted(() => {
  pieChart?.dispose();
  barChart?.dispose();
});
</script>

<style scoped>
.statistics-channel {
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
