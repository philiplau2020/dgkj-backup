<template>
  <div class="citic-settle">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="结算单号">
          <Input v-model:value="searchForm.settleNo" placeholder="请输入结算单号" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="商户号">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="商户名称">
          <Input v-model:value="searchForm.mchName" placeholder="请输入商户名称" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem label="结算类型">
          <Select v-model:value="searchForm.settleType" allow-clear style="width: 120px">
            <SelectOption :value="1">D0结算</SelectOption>
            <SelectOption :value="2">T1结算</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 110px">
            <SelectOption :value="0">待处理</SelectOption>
            <SelectOption :value="1">处理中</SelectOption>
            <SelectOption :value="2">已结算</SelectOption>
            <SelectOption :value="3">已拒绝</SelectOption>
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
          <Card size="small" class="stat-card">
            <Statistic title="待处理" :value="stats.pendingCount" :value-style="{ color: '#faad14' }" />
            <div class="stat-footer">
              <span class="amount">¥{{ Number(stats.pendingAmount).toFixed(2) }}</span>
            </div>
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small" class="stat-card">
            <Statistic title="处理中" :value="stats.processingCount" :value-style="{ color: '#1890ff' }" />
            <div class="stat-footer">
              <span class="amount">¥{{ Number(stats.processingAmount).toFixed(2) }}</span>
            </div>
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small" class="stat-card">
            <Statistic title="已结算金额" :value="Number(stats.settledAmount)" :precision="2" prefix="¥" :value-style="{ color: '#52c41a', fontSize: '20px' }" />
            <div class="stat-footer">
              <span class="count">{{ stats.settledCount }} 笔</span>
            </div>
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small" class="stat-card">
            <Statistic title="累计手续费" :value="Number(stats.totalFee)" :precision="2" prefix="¥" :value-style="{ fontSize: '20px' }" />
            <div class="stat-footer">
              <span class="rate">平均费率: {{ stats.avgRate }}%</span>
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openApplyModal">
            <template #icon><PlusOutlined /></template>
            申请结算
          </Button>
          <Button @click="handleExport">
            <template #icon><DownloadOutlined /></template>
            导出
          </Button>
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
        :scroll="{ x: 1600 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'settleNo'">
            <a @click="openDetailModal(record)">{{ record.settleNo }}</a>
          </template>
          <template v-else-if="column.key === 'amount'">
            <span class="amount-text">¥{{ record.amount }}</span>
          </template>
          <template v-else-if="column.key === 'fee'">
            <span class="fee-text">¥{{ record.fee }}</span>
          </template>
          <template v-else-if="column.key === 'actualAmount'">
            <span class="actual-amount">¥{{ record.actualAmount }}</span>
          </template>
          <template v-else-if="column.key === 'settleType'">
            <Tag :color="record.settleType === 1 ? 'purple' : 'cyan'">
              {{ record.settleTypeName }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="getStatusBadge(record.status)" :text="record.statusName" />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="handleConfirm(record)" v-if="record.status === 0">
                确认
              </Button>
              <Button type="link" size="small" danger @click="handleCancel(record)" v-if="record.status === 0">
                取消
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
      width="700px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="结算单号" :span="2">
          <Space>
            <span class="settle-no">{{ currentRecord.settleNo }}</span>
            <Button type="link" size="small" @click="copySettleNo">复制</Button>
          </Space>
        </DescriptionsItem>
        <DescriptionsItem label="商户号">{{ currentRecord.mchNo }}</DescriptionsItem>
        <DescriptionsItem label="商户名称">{{ currentRecord.mchName }}</DescriptionsItem>
        <DescriptionsItem label="结算金额">
          <span class="amount-text">¥{{ currentRecord.amount }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="手续费">
          <span class="fee-text">¥{{ currentRecord.fee }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="到账金额">
          <span class="actual-amount">¥{{ currentRecord.actualAmount }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="结算类型">
          <Tag :color="currentRecord.settleType === 1 ? 'purple' : 'cyan'">
            {{ currentRecord.settleTypeName }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="getStatusBadge(currentRecord.status)" :text="currentRecord.statusName" />
        </DescriptionsItem>
        <DescriptionsItem label="收款银行">{{ currentRecord.bankName }}</DescriptionsItem>
        <DescriptionsItem label="收款账户">{{ currentRecord.bankAccount }}</DescriptionsItem>
        <DescriptionsItem label="收款人">{{ currentRecord.bankUserName }}</DescriptionsItem>
        <DescriptionsItem label="申请时间">{{ currentRecord.createdAt }}</DescriptionsItem>
        <DescriptionsItem label="处理时间">{{ currentRecord.updateAt || '-' }}</DescriptionsItem>
        <DescriptionsItem label="备注" :span="2">{{ currentRecord.remark || '-' }}</DescriptionsItem>
      </Descriptions>

      <!-- 关联订单 -->
      <Divider>关联订单</Divider>
      <Table
        :data-source="relatedOrders"
        :columns="orderColumns"
        :pagination="false"
        size="small"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'amount'">
            <span class="amount-text">¥{{ record.amount }}</span>
          </template>
        </template>
      </Table>
    </Modal>

    <!-- 申请结算弹窗 -->
    <Modal
      v-model:open="applyVisible"
      title="申请结算"
      width="550px"
      @ok="handleApply"
      :confirm-loading="submitLoading"
    >
      <Form :model="applyForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="applyRules" ref="applyFormRef">
        <FormItem label="结算类型" name="settleType">
          <RadioGroup v-model:value="applyForm.settleType">
            <Radio :value="1">
              <span>D0结算</span>
              <span class="settle-type-desc">当日结算，实时到账</span>
            </Radio>
            <Radio :value="2">
              <span>T1结算</span>
              <span class="settle-type-desc">次日结算，手续费更低</span>
            </Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="商户">
          <Select v-model:value="applyForm.mchNo" placeholder="请选择商户" style="width: 100%">
            <SelectOption v-for="mch in merchantList" :key="mch.mchNo" :value="mch.mchNo">
              {{ mch.mchName }} ({{ mch.mchNo }})
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="结算金额" name="amount">
          <InputNumber 
            v-model:value="applyForm.amount" 
            :min="1" 
            :max="999999999"
            :precision="2" 
            style="width: 100%" 
            placeholder="请输入结算金额" 
          />
          <div class="amount-hint">
            可结算余额: ¥{{ availableBalance.toFixed(2) }}
          </div>
        </FormItem>
        <FormItem label="收款账户">
          <Select v-model:value="applyForm.bankAccount" placeholder="请选择收款账户" style="width: 100%">
            <SelectOption v-for="card in cardList" :key="card.id" :value="card.cardNo">
              {{ card.accountName }} - {{ card.cardNo.slice(-4).padstart(card.cardNo.length - 4, '*') }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="applyForm.remark" :rows="2" placeholder="请输入备注(选填)" />
        </FormItem>
        
        <!-- 手续费试算 -->
        <Alert type="info" show-icon class="fee-preview">
          <template #message>
            手续费试算
          </template>
          <template #description>
            <div class="fee-calc">
              <div class="fee-row">
                <span>结算金额:</span>
                <span>¥{{ applyForm.amount.toFixed(2) }}</span>
              </div>
              <div class="fee-row">
                <span>手续费率:</span>
                <span>{{ applyForm.settleType === 1 ? '0.35% (D0)' : '0.25% (T1)' }}</span>
              </div>
              <div class="fee-row">
                <span>手续费:</span>
                <span class="fee-amount">¥{{ calculateFee().toFixed(2) }}</span>
              </div>
              <div class="fee-row total">
                <span>到账金额:</span>
                <span class="actual-amount">¥{{ (applyForm.amount - calculateFee()).toFixed(2) }}</span>
              </div>
            </div>
          </template>
        </Alert>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { 
  Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, 
  Tag, Badge, Row, Col, Statistic, RangePicker, Modal, Descriptions, 
  DescriptionsItem, RadioGroup, Radio, Textarea, InputNumber, Alert, Divider, message 
} from 'ant-design-vue';
import { PlusOutlined, SearchOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { getCiticSettleList, applyCiticSettle, confirmCiticSettle, cancelCiticSettle, getCardList } from '@/api/citic';

const loading = ref(false);
const submitLoading = ref(false);
const dataSource = ref<any[]>([]);
const cardList = ref<any[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  settleNo: '',
  mchNo: '',
  mchName: '',
  settleType: undefined as number | undefined,
  status: undefined as number | undefined,
});

const dateRange = ref<[any, any] | null>(null);

const stats = reactive({
  pendingCount: 0,
  pendingAmount: '0.00',
  processingCount: 0,
  processingAmount: '0.00',
  settledAmount: '0.00',
  settledCount: 0,
  totalFee: '0.00',
  avgRate: '0.00',
});

const columns = [
  { title: '结算单号', dataIndex: 'settleNo', key: 'settleNo', width: 190 },
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 120 },
  { title: '商户名称', dataIndex: 'mchName', key: 'mchName', width: 150 },
  { title: '结算金额', key: 'amount', width: 130 },
  { title: '手续费', key: 'fee', width: 110 },
  { title: '到账金额', key: 'actualAmount', width: 130 },
  { title: '结算类型', key: 'settleType', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

const orderColumns = [
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
  { title: '交易金额', key: 'amount', width: 120 },
  { title: '交易时间', dataIndex: 'tradeTime', key: 'tradeTime', width: 170 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);
const relatedOrders = ref<any[]>([]);

const applyVisible = ref(false);
const applyFormRef = ref();
const applyForm = reactive({
  settleType: 1,
  mchNo: '',
  amount: 0,
  bankAccount: '',
  remark: '',
});
const applyRules = {
  amount: [{ required: true, message: '请输入结算金额' }],
  mchNo: [{ required: true, message: '请选择商户' }],
};

// 模拟商户列表
const merchantList = ref([
  { mchNo: 'M10001', mchName: '测试商户001' },
  { mchNo: 'M10002', mchName: '测试商户002' },
  { mchNo: 'M10003', mchName: '测试商户003' },
]);

const availableBalance = computed(() => {
  return 50000.00;
});

function getStatusBadge(status: number) {
  const map: Record<number, string> = { 
    0: 'warning', 
    1: 'processing', 
    2: 'success',
    3: 'error',
  };
  return map[status] || 'default';
}

function calculateFee() {
  const rate = applyForm.settleType === 1 ? 0.0035 : 0.0025;
  return applyForm.amount * rate;
}

function copySettleNo() {
  if (currentRecord.value) {
    navigator.clipboard.writeText(currentRecord.value.settleNo);
    message.success('结算单号已复制');
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.settleNo) params.settleNo = searchForm.settleNo;
    if (searchForm.mchNo) params.mchNo = searchForm.mchNo;
    if (searchForm.mchName) params.mchName = searchForm.mchName;
    if (searchForm.settleType !== undefined) params.settleType = searchForm.settleType;
    if (searchForm.status !== undefined) params.status = searchForm.status;
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0].format('YYYY-MM-DD');
      params.endDate = dateRange.value[1].format('YYYY-MM-DD');
    }

    const res = await getCiticSettleList(params);
    if (res.result) {
      dataSource.value = res.result.list || [];
      pagination.total = res.result.total || 0;
      
      // 更新统计
      const list = dataSource.value;
      stats.pendingCount = list.filter(item => item.status === 0).length;
      stats.pendingAmount = list.filter(item => item.status === 0).reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2);
      stats.processingCount = list.filter(item => item.status === 1).length;
      stats.processingAmount = list.filter(item => item.status === 1).reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2);
      stats.settledAmount = list.filter(item => item.status === 2).reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2);
      stats.settledCount = list.filter(item => item.status === 2).length;
      stats.totalFee = list.reduce((sum, item) => sum + Number(item.fee), 0).toFixed(2);
      
      const settledTotal = list.filter(item => item.status === 2).reduce((sum, item) => sum + Number(item.amount), 0);
      const settledFee = list.filter(item => item.status === 2).reduce((sum, item) => sum + Number(item.fee), 0);
      stats.avgRate = settledTotal > 0 ? ((settledFee / settledTotal) * 100).toFixed(2) : '0.00';
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
  searchForm.settleNo = '';
  searchForm.mchNo = '';
  searchForm.mchName = '';
  searchForm.settleType = undefined;
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
  // 模拟关联订单
  relatedOrders.value = [];
  for (let i = 1; i <= 3; i++) {
    relatedOrders.value.push({
      id: i,
      orderNo: 'P' + Date.now().toString().slice(0, 10) + i.toString().padStart(4, '0'),
      amount: (Math.random() * 1000 + 100).toFixed(2),
      tradeTime: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19),
    });
  }
  detailVisible.value = true;
}

function openApplyModal() {
  applyForm.settleType = 1;
  applyForm.mchNo = '';
  applyForm.amount = 0;
  applyForm.bankAccount = '';
  applyForm.remark = '';
  applyVisible.value = true;
}

async function handleApply() {
  if (applyForm.amount <= 0) {
    message.error('请输入正确的结算金额');
    return;
  }
  if (!applyForm.mchNo) {
    message.error('请选择商户');
    return;
  }
  submitLoading.value = true;
  try {
    await applyCiticSettle({
      accountNo: 'CITIC001',
      amount: applyForm.amount.toString(),
      settleType: applyForm.settleType,
      remark: applyForm.remark,
    });
    message.success('结算申请已提交');
    applyVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('申请失败');
  } finally {
    submitLoading.value = false;
  }
}

async function handleConfirm(record: any) {
  try {
    await new Promise((resolve) => {
      Modal.confirm({
        title: '确认结算',
        content: `确认结算单 ${record.settleNo}？`,
        okText: '确认',
        cancelText: '取消',
        onOk: resolve,
      });
    });
    
    await confirmCiticSettle(record.settleNo);
    message.success('结算已确认');
    fetchData();
  } catch (error) {
    // 用户取消
  }
}

async function handleCancel(record: any) {
  try {
    await new Promise((resolve) => {
      Modal.confirm({
        title: '取消结算',
        content: `确定要取消结算单 ${record.settleNo} 吗？`,
        okText: '确认取消',
        okType: 'danger',
        cancelText: '返回',
        onOk: resolve,
      });
    });
    
    await cancelCiticSettle(record.settleNo);
    message.success('结算已取消');
    fetchData();
  } catch (error) {
    // 用户取消
  }
}

function handleExport() {
  message.info('导出功能开发中');
}

function handleRefresh() {
  fetchData();
  message.success('刷新成功');
}

async function fetchCardList() {
  try {
    const res = await getCardList({ page: 1, pageSize: 100 });
    if (res.result) {
      cardList.value = res.result.list || [];
    }
  } catch (error) {
    console.error('获取银行卡列表失败', error);
  }
}

onMounted(() => {
  fetchData();
  fetchCardList();
});
</script>

<style scoped>
.citic-settle {
  padding: 16px;
  background: #f0f2f5;
}

.search-form {
  margin-bottom: 16px;
}

.stat-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
}

.stat-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #666;
}

.stat-footer .amount {
  color: #f5222d;
  font-weight: 500;
}

.stat-footer .count {
  color: #52c41a;
}

.stat-footer .rate {
  color: #1890ff;
}

.table-toolbar {
  margin-bottom: 16px;
}

.settle-no {
  font-family: 'Consolas', monospace;
}

.amount-text {
  color: #f5222d;
  font-weight: 500;
}

.fee-text {
  color: #666;
}

.actual-amount {
  color: #52c41a;
  font-weight: 500;
}

.settle-type-desc {
  margin-left: 8px;
  color: #999;
  font-size: 12px;
}

.amount-hint {
  margin-top: 8px;
  color: #52c41a;
  font-size: 12px;
}

.fee-preview {
  margin-top: 16px;
}

.fee-calc {
  padding: 8px 0;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  color: #666;
}

.fee-row.total {
  border-top: 1px dashed #ddd;
  margin-top: 8px;
  padding-top: 8px;
  font-weight: 500;
  color: #333;
}

.fee-row .fee-amount {
  color: #faad14;
}

.fee-row .actual-amount {
  color: #52c41a;
}
</style>
