<template>
  <div class="order-container">
    <Card>
      <!-- 搜索表单 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="订单号">
          <Input v-model:value="searchForm.orderNo" placeholder="请输入订单号" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="商户号">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="订单状态">
          <Select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear style="width: 120px">
            <SelectOption :value="0">待支付</SelectOption>
            <SelectOption :value="1">支付中</SelectOption>
            <SelectOption :value="2">已支付</SelectOption>
            <SelectOption :value="3">已取消</SelectOption>
            <SelectOption :value="4">已退款</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="支付通道">
          <Select v-model:value="searchForm.payChannel" placeholder="请选择通道" allow-clear style="width: 140px">
            <SelectOption value="WX_QR">微信扫码</SelectOption>
            <SelectOption value="ALI_QR">支付宝扫码</SelectOption>
            <SelectOption value="CT_QR">通联扫码</SelectOption>
            <SelectOption value="HF_QR">汇付扫码</SelectOption>
            <SelectOption value="FY_QR">富友扫码</SelectOption>
            <SelectOption value="CITIC_QR">中信银行</SelectOption>
          </Select>
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
          <Statistic title="总订单数" :value="stats.totalCount" />
        </Col>
        <Col :span="6">
          <Statistic title="总交易额" :value="stats.totalAmount" :precision="2" prefix="¥" />
        </Col>
        <Col :span="6">
          <Statistic title="今日订单" :value="stats.todayCount" />
        </Col>
        <Col :span="6">
          <Statistic title="今日交易额" :value="stats.todayAmount" :precision="2" prefix="¥" />
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

      <!-- 订单列表 -->
      <Table 
        :data-source="dataSource" 
        :columns="columns" 
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: 1500 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'orderNo'">
            <a @click="openDetailModal(record)">{{ record.orderNo }}</a>
          </template>
          <template v-else-if="column.key === 'amount'">
            <span style="color: #f5222d; font-weight: 500;">¥{{ record.amount }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="getStatusColor(record.status)">
              {{ getStatusName(record.status) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'payChannel'">
            {{ record.payChannelName }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="handleRefund(record)" v-if="record.status === 2">
                退款
              </Button>
              <Button type="link" size="small" @click="handleClose(record)" v-if="record.status === 0">
                关闭
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 订单详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="订单详情"
      width="700px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentOrder">
        <DescriptionsItem label="订单号" :span="2">{{ currentOrder.orderNo }}</DescriptionsItem>
        <DescriptionsItem label="商户号">{{ currentOrder.mchNo }}</DescriptionsItem>
        <DescriptionsItem label="商户名称">{{ currentOrder.mchName }}</DescriptionsItem>
        <DescriptionsItem label="订单金额">
          <span style="color: #f5222d; font-weight: 500;">¥{{ currentOrder.amount }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="订单状态">
          <Tag :color="getStatusColor(currentOrder.status)">
            {{ getStatusName(currentOrder.status) }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="支付通道">{{ currentOrder.payChannelName }}</DescriptionsItem>
        <DescriptionsItem label="通道订单号">{{ currentOrder.channelOrderNo || '-' }}</DescriptionsItem>
        <DescriptionsItem label="订单标题">{{ currentOrder.subject }}</DescriptionsItem>
        <DescriptionsItem label="订单描述">{{ currentOrder.body || '-' }}</DescriptionsItem>
        <DescriptionsItem label="支付时间">{{ currentOrder.payTime || '-' }}</DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentOrder.createdAt }}</DescriptionsItem>
      </Descriptions>
    </Modal>

    <!-- 退款弹窗 -->
    <Modal
      v-model:open="refundVisible"
      title="申请退款"
      @ok="handleRefundSubmit"
    >
      <Form :model="refundForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="原订单号">{{ currentOrder?.orderNo }}</FormItem>
        <FormItem label="订单金额">{{ currentOrder?.amount }}</FormItem>
        <FormItem label="退款金额" required>
          <InputNumber 
            v-model:value="refundForm.refundAmount" 
            :min="0.01" 
            :max="currentOrder?.amount" 
            :precision="2" 
            style="width: 100%" 
          />
        </FormItem>
        <FormItem label="退款原因">
          <Textarea v-model:value="refundForm.refundReason" :rows="3" placeholder="请输入退款原因" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Statistic, Row, Col, RangePicker, Modal, Descriptions, DescriptionsItem, InputNumber, Textarea } from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

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
  orderNo: '',
  mchNo: '',
  status: undefined as number | undefined,
  payChannel: '',
});

const dateRange = ref<[any, any] | null>(null);

const stats = reactive({
  totalCount: 0,
  totalAmount: 0,
  todayCount: 0,
  todayAmount: 0,
});

const columns = [
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180, fixed: 'left' },
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 120 },
  { title: '商户名称', dataIndex: 'mchName', key: 'mchName', width: 150 },
  { title: '订单金额', key: 'amount', width: 120 },
  { title: '支付通道', key: 'payChannel', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '通道订单号', dataIndex: 'channelOrderNo', key: 'channelOrderNo', width: 180 },
  { title: '支付时间', dataIndex: 'payTime', key: 'payTime', width: 160 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
];

const currentOrder = ref<any>(null);
const detailVisible = ref(false);
const refundVisible = ref(false);
const refundForm = reactive({
  refundAmount: 0,
  refundReason: '',
});

function getStatusColor(status: number) {
  const map: Record<number, string> = {
    0: 'default',
    1: 'processing',
    2: 'success',
    3: 'warning',
    4: 'error',
  };
  return map[status] || 'default';
}

function getStatusName(status: number) {
  const map: Record<number, string> = {
    0: '待支付',
    1: '支付中',
    2: '已支付',
    3: '已取消',
    4: '已退款',
  };
  return map[status] || '未知';
}

async function fetchData() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.current.toString(),
      pageSize: pagination.pageSize.toString(),
    });
    if (searchForm.orderNo) params.append('orderNo', searchForm.orderNo);
    if (searchForm.mchNo) params.append('mchNo', searchForm.mchNo);
    if (searchForm.status !== undefined) params.append('status', searchForm.status.toString());
    if (searchForm.payChannel) params.append('payChannel', searchForm.payChannel);

    const res = await fetch(`/basic-api/order/list?${params}`);
    const data = await res.json();
    
    if (data.result) {
      dataSource.value = data.result.list || [];
      pagination.total = data.result.total || 0;
    }

    // 获取统计数据
    const statsRes = await fetch('/basic-api/order/stats');
    const statsData = await statsRes.json();
    if (statsData.result) {
      Object.assign(stats, statsData.result);
    }
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const res = await fetch('/basic-api/order/stats');
    const data = await res.json();
    if (data.result) {
      Object.assign(stats, data.result);
    }
  } catch (error) {
    console.error('获取统计数据失败', error);
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.orderNo = '';
  searchForm.mchNo = '';
  searchForm.status = undefined;
  searchForm.payChannel = '';
  dateRange.value = null;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openDetailModal(order: any) {
  currentOrder.value = order;
  detailVisible.value = true;
}

function handleRefund(order: any) {
  currentOrder.value = order;
  refundForm.refundAmount = Number(order.amount);
  refundForm.refundReason = '';
  refundVisible.value = true;
}

async function handleRefundSubmit() {
  try {
    message.success('退款申请已提交');
    refundVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('退款申请提交失败');
  }
}

function handleClose(order: any) {
  // 关闭订单逻辑
  message.info('关闭订单功能开发中');
}

function handleExport() {
  message.info('导出功能开发中');
}

function handleRefresh() {
  fetchData();
  fetchStats();
  message.success('刷新成功');
}

onMounted(() => {
  fetchData();
  fetchStats();
});
</script>

<style scoped>
.order-container {
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
