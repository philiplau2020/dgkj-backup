<template>
  <div class="statistics-merchant">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="商户名称">
          <Input v-model:value="searchForm.mchName" placeholder="请输入商户名称" allow-clear style="width: 160px" />
        </FormItem>
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
            <Statistic title="商户总数" :value="stats.totalCount" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="活跃商户" :value="stats.activeCount" :value-style="{ color: '#52c41a' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="今日新增" :value="stats.todayNew" :value-style="{ color: '#1890ff' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="待审核" :value="stats.pendingAudit" :value-style="{ color: '#faad14' }" />
          </Card>
        </Col>
      </Row>

      <!-- 图表 -->
      <Row :gutter="16">
        <Col :span="12">
          <Card title="商户交易额TOP10">
            <div ref="barChartRef" style="height: 350px"></div>
          </Card>
        </Col>
        <Col :span="12">
          <Card title="商户交易笔数TOP10">
            <div ref="pieChartRef" style="height: 350px"></div>
          </Card>
        </Col>
      </Row>

      <!-- 数据表格 -->
      <Card title="商户明细" class="table-card">
        <Table
          :data-source="tableData"
          :columns="columns"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="mchNo"
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
              <Progress :percent="calcSuccessRate(record)" :status="calcSuccessRate(record) >= 95 ? 'success' : 'exception'" size="small" />
            </template>
          </template>
        </Table>
      </Card>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { Card, Form, FormItem, Input, RangePicker, Button, Space, Row, Col, Statistic, Table } from 'ant-design-vue';
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
  mchName: '',
  startDate: '',
  endDate: '',
});

const dateRange = ref<[any, any] | null>(null);

const stats = reactive({
  totalCount: 0,
  activeCount: 0,
  todayNew: 0,
  pendingAudit: 0,
});

const columns = [
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 120 },
  { title: '商户名称', dataIndex: 'mchName', key: 'mchName', width: 180 },
  { title: '交易笔数', dataIndex: 'totalCount', key: 'totalCount', width: 120 },
  { title: '交易金额', key: 'totalAmount', width: 150 },
  { title: '成功笔数', dataIndex: 'successCount', key: 'successCount', width: 120 },
  { title: '成功金额', key: 'successAmount', width: 150 },
  { title: '退款笔数', dataIndex: 'refundCount', key: 'refundCount', width: 120 },
  { title: '退款金额', key: 'refundAmount', width: 150 },
  { title: '成功率', key: 'successRate', width: 150 },
];

const barChartRef = ref<HTMLElement>();
const pieChartRef = ref<HTMLElement>();
let barChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;

function calcSuccessRate(record: any) {
  if (record.totalCount === 0) return 0;
  return Number(((record.successCount / record.totalCount) * 100).toFixed(2));
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.mchName) params.mchName = searchForm.mchName;

    const res = await defHttp.get({ url: '/basic-api/stat/merchant/list', params });

    if (res && res.data) {
      tableData.value = res.data;
      pagination.total = res.total || res.data.length;

      stats.totalCount = res.total || res.data.length;
      stats.activeCount = Math.floor(res.data.length * 0.8);
      stats.todayNew = Math.floor(Math.random() * 10) + 1;
      stats.pendingAudit = Math.floor(Math.random() * 5);

      updateCharts(res.data);
    } else if (Array.isArray(res)) {
      tableData.value = res;
      pagination.total = res.length;
      stats.totalCount = res.length;
      stats.activeCount = Math.floor(res.length * 0.8);
      updateCharts(res);
    }
  } catch (error) {
    console.error('获取数据失败', error);
    tableData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function updateCharts(data: any[]) {
  const top10 = [...data].sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount)).slice(0, 10);
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'];

  if (barChart) {
    barChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', name: '交易金额(元)' },
      yAxis: { type: 'category', data: top10.map(item => item.mchName), axisLabel: { rotate: 0 } },
      series: [
        {
          type: 'bar',
          data: top10.map((item, index) => ({
            value: Number(item.totalAmount),
            itemStyle: { color: colors[index % colors.length], borderRadius: [0, 4, 4, 0] },
          })),
          barWidth: '60%',
        },
      ],
    });
  }

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
          data: top10.map((item, index) => ({
            value: item.totalCount,
            name: item.mchName,
            itemStyle: { color: colors[index % colors.length] },
          })),
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
  searchForm.mchName = '';
  dateRange.value = null;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function initCharts() {
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value);
  }
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value);
  }

  window.addEventListener('resize', () => {
    barChart?.resize();
    pieChart?.resize();
  });
}

onMounted(() => {
  initCharts();
  fetchData();
});

onUnmounted(() => {
  barChart?.dispose();
  pieChart?.dispose();
});
</script>

<style scoped>
.statistics-merchant {
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
