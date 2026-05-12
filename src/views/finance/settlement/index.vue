<template>
  <div class="settlement-container">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="商户号">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 100px">
            <SelectOption :value="0">待处理</SelectOption>
            <SelectOption :value="1">已结算</SelectOption>
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
            <Statistic title="待处理" :value="stats.pendingCount" :value-style="{ color: '#faad14' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="待处理金额" :value="stats.pendingAmount" :precision="2" prefix="¥" :value-style="{ color: '#faad14' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="已结算金额" :value="stats.settledAmount" :precision="2" prefix="¥" :value-style="{ color: '#52c41a' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="累计手续费" :value="stats.totalFee" :precision="2" prefix="¥" />
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

      <!-- 结算列表 -->
      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: 1300 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'amount'">
            <span style="color: #f5222d; font-weight: 500;">¥{{ record.amount }}</span>
          </template>
          <template v-else-if="column.key === 'fee'">
            ¥{{ record.fee }}
          </template>
          <template v-else-if="column.key === 'actualAmount'">
            <span style="color: #52c41a;">¥{{ record.actualAmount }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'green' : 'orange'">
              {{ record.statusName }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="handleProcess(record)" v-if="record.status === 0">
                处理
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="结算详情"
      width="600px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="结算单号" :span="2">{{ currentRecord.settleNo }}</DescriptionsItem>
        <DescriptionsItem label="商户号">{{ currentRecord.mchNo }}</DescriptionsItem>
        <DescriptionsItem label="商户名称">{{ currentRecord.mchName }}</DescriptionsItem>
        <DescriptionsItem label="结算金额">
          <span style="color: #f5222d; font-weight: 500;">¥{{ currentRecord.amount }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="手续费">¥{{ currentRecord.fee }}</DescriptionsItem>
        <DescriptionsItem label="实际到账">
          <span style="color: #52c41a;">¥{{ currentRecord.actualAmount }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="收款银行">{{ currentRecord.bankName }}</DescriptionsItem>
        <DescriptionsItem label="收款账户">{{ currentRecord.bankAccount }}</DescriptionsItem>
        <DescriptionsItem label="收款人">{{ currentRecord.bankUserName }}</DescriptionsItem>
        <DescriptionsItem label="状态">
          <Tag :color="currentRecord.status === 1 ? 'green' : 'orange'">
            {{ currentRecord.statusName }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createdAt }}</DescriptionsItem>
        <DescriptionsItem label="结算时间">{{ currentRecord.settleTime || '-' }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Row, Col, Statistic, RangePicker, Modal, Descriptions, DescriptionsItem } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { getSettlementList } from '@/api/finance';

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
  mchNo: '',
  status: undefined as number | undefined,
});

const dateRange = ref<[any, any] | null>(null);

const stats = reactive({
  pendingCount: 0,
  pendingAmount: 0,
  settledAmount: 0,
  totalFee: 0,
});

const columns = [
  { title: '结算单号', dataIndex: 'settleNo', key: 'settleNo', width: 170 },
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 120 },
  { title: '商户名称', dataIndex: 'mchName', key: 'mchName', width: 140 },
  { title: '结算金额', key: 'amount', width: 120 },
  { title: '手续费', key: 'fee', width: 100 },
  { title: '实际到账', key: 'actualAmount', width: 120 },
  { title: '收款银行', dataIndex: 'bankName', key: 'bankName', width: 130 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.mchNo) params.mchNo = searchForm.mchNo;
    if (searchForm.status !== undefined) params.status = searchForm.status;

    const res = await getSettlementList(params);
    if (res.result) {
      dataSource.value = res.result.list || [];
      pagination.total = res.result.total || 0;

      // 计算统计
      stats.pendingCount = dataSource.value.filter(item => item.status === 0).length;
      stats.pendingAmount = dataSource.value
        .filter(item => item.status === 0)
        .reduce((sum: number, item: any) => sum + Number(item.amount), 0);
      stats.settledAmount = dataSource.value
        .filter(item => item.status === 1)
        .reduce((sum: number, item: any) => sum + Number(item.amount), 0);
      stats.totalFee = dataSource.value.reduce((sum: number, item: any) => sum + Number(item.fee), 0);
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
  searchForm.mchNo = '';
  searchForm.status = undefined;
  dateRange.value = null;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openDetailModal(record: any) {
  currentRecord.value = record;
  detailVisible.value = true;
}

async function handleProcess(record: any) {
  message.success('结算处理成功');
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
.settlement-container {
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
</style>
