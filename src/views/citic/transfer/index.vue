<template>
  <div class="citic-transfer">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="代付单号">
          <Input v-model:value="searchForm.transferNo" placeholder="请输入代付单号" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="账户">
          <Input v-model:value="searchForm.accountNo" placeholder="请输入账户" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="收款人">
          <Input v-model:value="searchForm.receiverName" placeholder="请输入收款人" allow-clear style="width: 120px" />
        </FormItem>
        <FormItem label="代付类型">
          <Select v-model:value="searchForm.transferType" allow-clear style="width: 120px">
            <SelectOption :value="1">直接代付</SelectOption>
            <SelectOption :value="2">批量代付</SelectOption>
            <SelectOption :value="3">商户提现</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 100px">
            <SelectOption :value="0">待处理</SelectOption>
            <SelectOption :value="1">成功</SelectOption>
            <SelectOption :value="2">失败</SelectOption>
            <SelectOption :value="3">处理中</SelectOption>
          </Select>
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
            <Statistic title="待处理笔数" :value="stats.pendingCount" :value-style="{ color: '#faad14' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="处理中笔数" :value="stats.processingCount" :value-style="{ color: '#1890ff' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="今日代付总额" :value="Number(stats.todayAmount)" :precision="2" prefix="¥" :value-style="{ color: '#f5222d', fontSize: '20px' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="成功率" :value="stats.successRate" suffix="%" :value-style="{ color: '#52c41a' }" />
          </Card>
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openPayModal">
            <template #icon><PlusOutlined /></template>
            代付下单
          </Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 代付列表 -->
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
          <template v-if="column.key === 'transferNo'">
            <span class="transfer-no">{{ record.transferNo }}</span>
          </template>
          <template v-else-if="column.key === 'receiverCardNo'">
            <span class="card-no">{{ formatCardNo(record.receiverCardNo) }}</span>
          </template>
          <template v-else-if="column.key === 'amount'">
            <span class="amount-text">¥{{ record.amount }}</span>
          </template>
          <template v-else-if="column.key === 'fee'">
            <span class="fee-text">¥{{ record.fee }}</span>
          </template>
          <template v-else-if="column.key === 'transferType'">
            <Tag :color="getTransferTypeColor(record.transferType)">
              {{ record.transferTypeName }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="getStatusBadge(record.status)" :text="record.statusName" />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="handleQuery(record)" v-if="record.status === 3">查询结果</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 代付下单弹窗 -->
    <Modal
      v-model:open="payVisible"
      title="代付下单"
      width="600px"
      @ok="handlePay"
      :confirm-loading="submitLoading"
    >
      <Alert message="代付说明" type="info" show-icon class="mb-16">
        <template #description>
          代付将从账户余额中扣除相应金额（含手续费），打款至指定银行卡。预计1-3个工作日到账。
        </template>
      </Alert>
      <Form :model="payForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="payRules" ref="payFormRef">
        <FormItem label="代付账户" name="accountNo">
          <Select v-model:value="payForm.accountNo" placeholder="请选择代付账户" show-search style="width: 100%">
            <SelectOption v-for="acc in accountList" :key="acc.accountNo" :value="acc.accountNo">
              {{ acc.accountName }} ({{ acc.accountNo }}) - 可用: ¥{{ acc.availableBalance }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="代付类型" name="transferType">
          <RadioGroup v-model:value="payForm.transferType">
            <Radio :value="1">直接代付</Radio>
            <Radio :value="2">批量代付</Radio>
            <Radio :value="3">商户提现</Radio>
          </RadioGroup>
        </FormItem>
        <Divider>收款方信息</Divider>
        <FormItem label="收款人姓名" name="receiverName">
          <Input v-model:value="payForm.receiverName" placeholder="请输入收款人姓名" />
        </FormItem>
        <FormItem label="收款卡号" name="receiverCardNo">
          <Input v-model:value="payForm.receiverCardNo" placeholder="请输入收款银行卡号" :maxlength="19" @input="handleCardNoInput" />
          <div class="card-bank-info" v-if="payForm.receiverBankName">
            <BankOutlined />
            <span>{{ payForm.receiverBankName }}</span>
          </div>
        </FormItem>
        <FormItem label="收款银行" name="receiverBankName">
          <Input v-model:value="payForm.receiverBankName" placeholder="请输入收款银行名称" />
        </FormItem>
        <FormItem label="开户支行" name="receiverBranchName">
          <Input v-model:value="payForm.receiverBranchName" placeholder="请输入开户支行名称" />
        </FormItem>
        <FormItem label="收款手机" name="receiverPhone">
          <Input v-model:value="payForm.receiverPhone" placeholder="请输入收款人手机号" :maxlength="11" />
        </FormItem>
        <Divider>代付金额</Divider>
        <FormItem label="代付金额" name="amount">
          <InputNumber
            v-model:value="payForm.amount"
            :min="0.01"
            :max="999999999"
            :precision="2"
            style="width: 100%"
            placeholder="请输入代付金额"
          />
          <div class="amount-hint" v-if="selectedAccount">
            手续费: ¥{{ calculateFee().toFixed(2) }}
            <span class="total-hint">，合计扣除: ¥{{ (payForm.amount + calculateFee()).toFixed(2) }}</span>
          </div>
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="payForm.remark" placeholder="请输入备注" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 详情弹窗 -->
    <Modal v-model:open="detailVisible" title="代付详情" width="700px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="代付单号" :span="2">
          <span class="transfer-no">{{ currentRecord.transferNo }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="中信订单号">{{ currentRecord.citicOrderNo || '-' }}</DescriptionsItem>
        <DescriptionsItem label="代付类型">
          <Tag :color="getTransferTypeColor(currentRecord.transferType)">{{ currentRecord.transferTypeName }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="代付账户">{{ currentRecord.accountNo }}</DescriptionsItem>
        <DescriptionsItem label="账户名称">{{ currentRecord.accountName }}</DescriptionsItem>
        <DescriptionsItem label="收款人">{{ currentRecord.receiverName }}</DescriptionsItem>
        <DescriptionsItem label="收款卡号">
          <span class="card-no">{{ formatCardNo(currentRecord.receiverCardNo) }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="收款银行">{{ currentRecord.receiverBankName }}</DescriptionsItem>
        <DescriptionsItem label="开户支行">{{ currentRecord.receiverBranchName || '-' }}</DescriptionsItem>
        <DescriptionsItem label="代付金额">
          <span class="amount-text">¥{{ currentRecord.amount }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="手续费">
          <span class="fee-text">¥{{ currentRecord.fee }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="实付金额">
          <span class="actual-amount">¥{{ currentRecord.actualAmount }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="getStatusBadge(currentRecord.status)" :text="currentRecord.statusName" />
        </DescriptionsItem>
        <DescriptionsItem label="成功时间">{{ currentRecord.successTime || '-' }}</DescriptionsItem>
        <DescriptionsItem label="失败原因" v-if="currentRecord.failReason" :span="2">
          <span class="fail-reason">{{ currentRecord.failReason }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createTime }}</DescriptionsItem>
        <DescriptionsItem label="备注" :span="2">{{ currentRecord.remark || '-' }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space,
  Tag, Badge, Row, Col, Statistic, Modal, Descriptions, DescriptionsItem,
  InputNumber, RadioGroup, Radio, message, Alert, Divider
} from 'ant-design-vue';
import { PlusOutlined, SearchOutlined, ReloadOutlined, BankOutlined } from '@ant-design/icons-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const submitLoading = ref(false);
const dataSource = ref<any[]>([]);
const accountList = ref<any[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  transferNo: '',
  accountNo: '',
  receiverName: '',
  transferType: undefined as number | undefined,
  status: undefined as number | undefined,
});

const stats = reactive({
  pendingCount: 0,
  processingCount: 0,
  todayAmount: '0.00',
  successRate: 100,
});

const columns = [
  { title: '代付单号', dataIndex: 'transferNo', key: 'transferNo', width: 200 },
  { title: '代付账户', dataIndex: 'accountNo', key: 'accountNo', width: 140 },
  { title: '收款人', dataIndex: 'receiverName', key: 'receiverName', width: 100 },
  { title: '收款卡号', key: 'receiverCardNo', width: 180 },
  { title: '收款银行', dataIndex: 'receiverBankName', key: 'receiverBankName', width: 130 },
  { title: '代付金额', key: 'amount', width: 120 },
  { title: '手续费', key: 'fee', width: 100 },
  { title: '代付类型', key: 'transferType', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

const payVisible = ref(false);
const detailVisible = ref(false);
const currentRecord = ref<any>(null);
const payFormRef = ref();

const payForm = reactive({
  accountNo: '',
  accountName: '',
  transferType: 1 as 1 | 2 | 3,
  receiverName: '',
  receiverCardNo: '',
  receiverBankName: '',
  receiverBankCode: '',
  receiverBranchName: '',
  receiverBranchCode: '',
  receiverPhone: '',
  amount: 0,
  fee: 0,
  remark: '',
});

const payRules = {
  accountNo: [{ required: true, message: '请选择代付账户' }],
  receiverName: [{ required: true, message: '请输入收款人姓名' }],
  receiverCardNo: [{ required: true, message: '请输入收款卡号' }],
  receiverBankName: [{ required: true, message: '请输入收款银行' }],
  amount: [{ required: true, message: '请输入代付金额' }],
};

const selectedAccount = computed(() => {
  return accountList.value.find(acc => acc.accountNo === payForm.accountNo);
});

function getTransferTypeColor(type: number) {
  const map: Record<number, string> = { 1: 'blue', 2: 'purple', 3: 'cyan' };
  return map[type] || 'default';
}

function getStatusBadge(status: number) {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'error', 3: 'processing' };
  return map[status] || 'default';
}

function formatCardNo(cardNo: string) {
  if (!cardNo) return '-';
  return cardNo.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function handleCardNoInput(e: any) {
  payForm.receiverCardNo = e.target.value.replace(/\D/g, '');
}

function calculateFee() {
  return Number(payForm.amount) * 0.002;
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.transferNo) params.transferNo = searchForm.transferNo;
    if (searchForm.accountNo) params.accountNo = searchForm.accountNo;
    if (searchForm.receiverName) params.receiverName = searchForm.receiverName;
    if (searchForm.transferType !== undefined) params.transferType = searchForm.transferType;
    if (searchForm.status !== undefined) params.status = searchForm.status;

    const res = await defHttp.get({ url: '/basic-api/citic/transfer/list', params });
    if (res) {
      dataSource.value = res.list || [];
      pagination.total = res.total || 0;
      updateStats();
    }
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

async function fetchAccountList() {
  try {
    const res = await defHttp.get({ url: '/basic-api/citic/account/list', params: { page: 1, pageSize: 100 } });
    if (res && res.list) {
      accountList.value = res.list || [];
    }
  } catch (error) {
    console.error('获取账户列表失败', error);
  }
}

function updateStats() {
  stats.pendingCount = dataSource.value.filter((item: any) => item.status === 0).length;
  stats.processingCount = dataSource.value.filter((item: any) => item.status === 3).length;
  stats.todayAmount = dataSource.value.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0).toFixed(2);
  const successCount = dataSource.value.filter((item: any) => item.status === 1).length;
  stats.successRate = dataSource.value.length > 0 ? ((successCount / dataSource.value.length) * 100).toFixed(1) as any : 100;
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.transferNo = '';
  searchForm.accountNo = '';
  searchForm.receiverName = '';
  searchForm.transferType = undefined;
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openPayModal() {
  Object.assign(payForm, {
    accountNo: '',
    transferType: 1,
    receiverName: '',
    receiverCardNo: '',
    receiverBankName: '',
    receiverBankCode: '',
    receiverBranchName: '',
    receiverBranchCode: '',
    receiverPhone: '',
    amount: 0,
    remark: '',
  });
  payVisible.value = true;
}

async function handlePay() {
  if (payForm.amount <= 0) {
    message.error('请输入正确的代付金额');
    return;
  }
  if (selectedAccount.value && payForm.amount + calculateFee() > selectedAccount.value.availableBalance) {
    message.error('余额不足，请确保账户有足够余额支付本金和手续费');
    return;
  }
  submitLoading.value = true;
  try {
    await defHttp.post({ url: '/basic-api/citic/transfer', data: {
      accountNo: payForm.accountNo,
      receiverCardNo: payForm.receiverCardNo,
      receiverBankName: payForm.receiverBankName,
      receiverName: payForm.receiverName,
      amount: payForm.amount,
      transferType: payForm.transferType,
      remark: payForm.remark,
    }});
    message.success('代付申请已提交');
    payVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('代付申请失败');
  } finally {
    submitLoading.value = false;
  }
}

function openDetailModal(record: any) {
  currentRecord.value = record;
  detailVisible.value = true;
}

async function handleQuery(record: any) {
  try {
    const res = await defHttp.get({ url: '/basic-api/citic/transfer/query', params: { transferNo: record.transferNo } });
    if (res) {
      currentRecord.value = res;
      message.success(`当前状态: ${res.statusName}`);
    }
  } catch (error) {
    message.error('查询失败');
  }
}

function handleRefresh() {
  fetchData();
  message.success('刷新成功');
}

onMounted(() => {
  fetchData();
  fetchAccountList();
});
</script>

<style scoped>
.citic-transfer {
  padding: 16px;
  background: #f0f2f5;
}
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.transfer-no, .card-no { font-family: 'Consolas', monospace; color: #666; }
.amount-text { color: #f5222d; font-weight: 500; }
.fee-text { color: #666; }
.actual-amount { color: #52c41a; font-weight: 500; }
.fail-reason { color: #f5222d; }
.card-bank-info {
  margin-top: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}
.amount-hint {
  margin-top: 8px;
  color: #faad14;
  font-size: 12px;
}
.total-hint { color: #f5222d; margin-left: 8px; }
.mb-16 { margin-bottom: 16px; }
</style>
