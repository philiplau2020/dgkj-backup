<template>
  <div class="finance-record">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="账户号">
          <Input v-model:value="searchForm.accountNo" placeholder="请输入账户号" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem label="变动类型">
          <Select v-model:value="searchForm.changeType" allow-clear style="width: 100px">
            <SelectOption :value="1">收入</SelectOption>
            <SelectOption :value="2">支出</SelectOption>
            <SelectOption :value="3">冻结</SelectOption>
            <SelectOption :value="4">解冻</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="日期范围">
          <RangePicker v-model:value="dateRange" style="width: 240px" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <!-- 统计 -->
      <Row :gutter="16" class="stat-row">
        <Col :span="6">
          <Card size="small">
            <Statistic title="总收入" :value="stats.totalIncome" :precision="2" prefix="¥" :value-style="{ color: '#52c41a' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="总支出" :value="stats.totalExpense" :precision="2" prefix="¥" :value-style="{ color: '#f5222d' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="冻结金额" :value="stats.totalFrozen" :precision="2" prefix="¥" :value-style="{ color: '#faad14' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="记录总数" :value="stats.totalCount" />
          </Card>
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button @click="handleExport">导出</Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 记录列表 -->
      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: 1400 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'changeType'">
            <Tag :color="getTypeColor(record.changeType)">{{ record.changeTypeName }}</Tag>
          </template>
          <template v-else-if="column.key === 'amount'">
            <span :class="getAmountClass(record.changeType)">
              {{ getAmountPrefix(record.changeType) }}¥{{ record.amount }}
            </span>
          </template>
          <template v-else-if="column.key === 'balanceAfter'">
            <span class="balance">¥{{ record.balanceAfter }}</span>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Row, Col, Statistic, RangePicker } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { getAccountRecord } from '@/api/finance';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  accountNo: '',
  changeType: undefined as number | undefined,
});

const dateRange = ref<[any, any] | null>(null);

const stats = reactive({
  totalIncome: 0,
  totalExpense: 0,
  totalFrozen: 0,
  totalCount: 0,
});

const columns = [
  { title: '变动单号', dataIndex: 'recordNo', key: 'recordNo', width: 180 },
  { title: '账户号', dataIndex: 'accountNo', key: 'accountNo', width: 140 },
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 120 },
  { title: '变动类型', key: 'changeType', width: 100 },
  { title: '变动金额', key: 'amount', width: 130 },
  { title: '变动前余额', dataIndex: 'balanceBefore', key: 'balanceBefore', width: 130, customRender: ({ text }) => `¥${text}` },
  { title: '变动后余额', key: 'balanceAfter', width: 130 },
  { title: '业务订单号', dataIndex: 'bizOrderNo', key: 'bizOrderNo', width: 170 },
  { title: '业务类型', dataIndex: 'bizOrderType', key: 'bizOrderType', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 120 },
  { title: '变动时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
];

function getAmountPrefix(type: number) {
  return type === 2 || type === 3 ? '-' : '+';
}

function getAmountClass(type: number) {
  return type === 2 || type === 3 ? 'expense' : 'income';
}

function getTypeColor(type: number) {
  const map: Record<number, string> = { 1: 'green', 2: 'red', 3: 'orange', 4: 'blue' };
  return map[type] || 'default';
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.accountNo) params.mchNo = searchForm.accountNo;
    if (searchForm.changeType !== undefined) params.changeType = searchForm.changeType;

    const res = await getAccountRecord(params);
    if (res.result) {
      dataSource.value = res.result.list || [];
      pagination.total = res.result.total || 0;

      // 计算统计
      stats.totalCount = pagination.total;
      stats.totalIncome = dataSource.value
        .filter(item => item.changeType === 1)
        .reduce((sum: number, item: any) => sum + Number(item.amount), 0);
      stats.totalExpense = dataSource.value
        .filter(item => item.changeType === 2)
        .reduce((sum: number, item: any) => sum + Number(item.amount), 0);
      stats.totalFrozen = dataSource.value
        .filter(item => item.changeType === 3)
        .reduce((sum: number, item: any) => sum + Number(item.amount), 0);
    }
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.accountNo = '';
  searchForm.changeType = undefined;
  dateRange.value = null;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function handleExport() {
  message.info('导出功能开发中');
}

function handleRefresh() {
  fetchData();
  message.success('刷新成功');
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.finance-record {
  padding: 16px;
  background: #f0f2f5;
}
.search-form {
  margin-bottom: 16px;
}
.stat-row {
  margin-bottom: 16px;
}
.table-toolbar {
  margin-bottom: 16px;
}
.income {
  color: #52c41a;
  font-weight: 600;
}
.expense {
  color: #f5222d;
  font-weight: 600;
}
.balance {
  color: #1890ff;
  font-weight: 600;
}
</style>
