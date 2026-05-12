<template>
  <div class="citic-account">
    <Card>
      <!-- 账户概览 -->
      <Row :gutter="24" class="account-overview">
        <Col :span="6">
          <Card size="small" class="account-card">
            <Statistic 
              title="账户余额" 
              :value="Number(accountInfo.balance)" 
              :precision="2" 
              prefix="¥" 
              :value-style="{ color: '#f5222d', fontSize: '24px' }" 
            />
            <div class="card-footer">
              <span class="label">可用:</span>
              <span class="value">¥{{ Number(accountInfo.availableBalance).toFixed(2) }}</span>
            </div>
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small" class="account-card">
            <Statistic 
              title="今日收入" 
              :value="Number(stats.todayIncome)" 
              :precision="2" 
              prefix="¥" 
              :value-style="{ color: '#52c41a', fontSize: '24px' }" 
            />
            <div class="card-footer">
              <span class="label">今日支出:</span>
              <span class="value expense">¥{{ Number(stats.todayExpense).toFixed(2) }}</span>
            </div>
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small" class="account-card">
            <Statistic 
              title="本月收入" 
              :value="Number(stats.monthIncome)" 
              :precision="2" 
              prefix="¥" 
              :value-style="{ color: '#1890ff', fontSize: '24px' }" 
            />
            <div class="card-footer">
              <span class="label">本月支出:</span>
              <span class="value expense">¥{{ Number(stats.monthExpense).toFixed(2) }}</span>
            </div>
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small" class="account-card">
            <div class="freeze-info">
              <div class="freeze-item">
                <span class="label">冻结金额</span>
                <span class="value frozen">¥{{ Number(accountInfo.frozenBalance).toFixed(2) }}</span>
              </div>
              <div class="freeze-item">
                <span class="label">账户状态</span>
                <Badge :status="accountInfo.status === 1 ? 'success' : 'error'" />
                <span class="value">{{ accountInfo.statusName }}</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 账户详情 -->
      <Descriptions title="账户信息" bordered :column="3" class="account-desc">
        <DescriptionsItem label="账户号">{{ accountInfo.accountNo }}</DescriptionsItem>
        <DescriptionsItem label="账户名称">{{ accountInfo.accountName }}</DescriptionsItem>
        <DescriptionsItem label="账户类型">
          <Tag :color="accountInfo.accountType === 1 ? 'blue' : 'green'">
            {{ accountInfo.accountTypeName }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="开户行">{{ accountInfo.bankName }}</DescriptionsItem>
        <DescriptionsItem label="银行卡号">{{ accountInfo.cardNo }}</DescriptionsItem>
        <DescriptionsItem label="账户状态">
          <Badge :status="accountInfo.status === 1 ? 'success' : 'error'" :text="accountInfo.statusName" />
        </DescriptionsItem>
      </Descriptions>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <Space>
          <Button type="primary" @click="openRechargeModal" :disabled="accountInfo.status !== 1">
            <template #icon><PlusOutlined /></template>
            充值
          </Button>
          <Button @click="openWithdrawModal" :disabled="accountInfo.status !== 1">
            <template #icon><MinusOutlined /></template>
            取款
          </Button>
          <Button @click="openTransferModal" :disabled="accountInfo.status !== 1">
            <template #icon><SwapOutlined /></template>
            转账
          </Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 账户变动记录 -->
      <Card title="账户变动记录" class="record-card">
        <template #extra>
          <Space>
            <Select v-model:value="recordType" style="width: 120px" @change="fetchRecords">
              <SelectOption value="">全部类型</SelectOption>
              <SelectOption value="1">收入</SelectOption>
              <SelectOption value="2">支出</SelectOption>
            </Select>
            <RangePicker v-model:value="dateRange" @change="fetchRecords" style="width: 240px" />
          </Space>
        </template>
        
        <Table
          :data-source="records"
          :columns="columns"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'recordNo'">
              <span class="record-no">{{ record.recordNo }}</span>
            </template>
            <template v-else-if="column.key === 'type'">
              <Tag :color="record.type === 1 ? 'success' : 'error'">
                {{ record.typeName }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'amount'">
              <span :class="record.type === 1 ? 'income' : 'expense'">
                {{ record.type === 1 ? '+' : '-' }}¥{{ record.amount }}
              </span>
            </template>
            <template v-else-if="column.key === 'balanceAfter'">
              <span class="balance">¥{{ record.balanceAfter }}</span>
            </template>
          </template>
        </Table>
      </Card>
    </Card>

    <!-- 充值弹窗 -->
    <Modal 
      v-model:open="rechargeVisible" 
      title="账户充值" 
      width="500px"
      @ok="handleRecharge"
      :confirm-loading="submitLoading"
    >
      <Alert message="充值说明" type="info" show-icon class="mb-16">
        <template #description>
          充值金额将即时到账，充值手续费为0.00%。
        </template>
      </Alert>
      <Form :model="rechargeForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="账户号">{{ accountInfo.accountNo }}</FormItem>
        <FormItem label="账户名称">{{ accountInfo.accountName }}</FormItem>
        <FormItem label="充值金额" required>
          <InputNumber 
            v-model:value="rechargeForm.amount" 
            :min="0.01" 
            :max="999999999"
            :precision="2" 
            style="width: 100%" 
            placeholder="请输入充值金额"
          />
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="rechargeForm.remark" placeholder="请输入备注(选填)" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 取款弹窗 -->
    <Modal 
      v-model:open="withdrawVisible" 
      title="账户取款" 
      width="500px"
      @ok="handleWithdraw"
      :confirm-loading="submitLoading"
    >
      <Alert message="取款说明" type="warning" show-icon class="mb-16">
        <template #description>
          取款金额将原路退回，预计1-3个工作日到账。
        </template>
      </Alert>
      <Form :model="withdrawForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="账户号">{{ accountInfo.accountNo }}</FormItem>
        <FormItem label="可用余额">
          <span class="available-balance">¥{{ Number(accountInfo.availableBalance).toFixed(2) }}</span>
        </FormItem>
        <FormItem label="取款金额" required>
          <InputNumber 
            v-model:value="withdrawForm.amount" 
            :min="0.01" 
            :max="Number(accountInfo.availableBalance)" 
            :precision="2" 
            style="width: 100%" 
            placeholder="请输入取款金额"
          />
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="withdrawForm.remark" placeholder="请输入备注(选填)" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 转账弹窗 -->
    <Modal 
      v-model:open="transferVisible" 
      title="账户转账" 
      width="500px"
      @ok="handleTransfer"
      :confirm-loading="submitLoading"
    >
      <Form :model="transferForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="转出账户">
          <span class="from-account">{{ accountInfo.accountNo }} ({{ accountInfo.accountName }})</span>
        </FormItem>
        <FormItem label="转入账户" required>
          <Select 
            v-model:value="transferForm.toAccountType" 
            style="width: 100%"
            placeholder="请选择转入账户类型"
          >
            <SelectOption value="citic">中信银行账户</SelectOption>
            <SelectOption value="bank">银行卡</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="目标账户" required v-if="transferForm.toAccountType === 'citic'">
          <Select v-model:value="transferForm.toAccount" style="width: 100%" placeholder="请选择目标账户">
            <SelectOption v-for="card in cardList" :key="card.id" :value="card.cardNo">
              {{ card.accountName }} - {{ card.cardNo }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="目标账户" required v-else>
          <Input v-model:value="transferForm.bankCardNo" placeholder="请输入银行卡号" />
        </FormItem>
        <FormItem label="转账金额" required>
          <InputNumber 
            v-model:value="transferForm.amount" 
            :min="0.01" 
            :precision="2" 
            style="width: 100%" 
            placeholder="请输入转账金额"
          />
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="transferForm.remark" placeholder="请输入备注(选填)" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { 
  Card, Row, Col, Statistic, Descriptions, DescriptionsItem, Tag, Badge, 
  Button, Space, Table, Modal, Form, FormItem, InputNumber, Input, 
  Select, SelectOption, RangePicker, Alert, message 
} from 'ant-design-vue';
import { PlusOutlined, MinusOutlined, SwapOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { getCiticAccountInfo, getAccountRecords, getAccountStats, getCardList } from '@/api/citic';

const loading = ref(false);
const submitLoading = ref(false);
const records = ref<any[]>([]);
const cardList = ref<any[]>([]);

const accountInfo = reactive({
  accountNo: '-',
  accountName: '-',
  accountType: 1,
  accountTypeName: '-',
  balance: '0.00',
  frozenBalance: '0.00',
  availableBalance: '0.00',
  cardNo: '-',
  bankName: '-',
  status: 1,
  statusName: '-',
});

const stats = reactive({
  todayIncome: '0.00',
  todayExpense: '0.00',
  todayNet: '0.00',
  monthIncome: '0.00',
  monthExpense: '0.00',
  monthNet: '0.00',
});

const recordType = ref('');
const dateRange = ref<[any, any] | null>(null);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const columns = [
  { title: '记录编号', dataIndex: 'recordNo', key: 'recordNo', width: 180 },
  { title: '变动类型', key: 'type', width: 100 },
  { title: '变动金额', key: 'amount', width: 150 },
  { title: '变动前余额', dataIndex: 'balanceBefore', key: 'balanceBefore', width: 130, customRender: ({ text }) => `¥${text}` },
  { title: '变动后余额', key: 'balanceAfter', width: 130 },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
];

const rechargeVisible = ref(false);
const rechargeForm = reactive({ amount: 0, remark: '' });

const withdrawVisible = ref(false);
const withdrawForm = reactive({ amount: 0, remark: '' });

const transferVisible = ref(false);
const transferForm = reactive({ 
  toAccountType: 'citic',
  toAccount: '', 
  bankCardNo: '',
  amount: 0, 
  remark: '' 
});

async function fetchAccountInfo() {
  try {
    const res = await getCiticAccountInfo();
    if (res.result) {
      Object.assign(accountInfo, res.result);
    }
  } catch (error) {
    console.error('获取账户信息失败', error);
  }
}

async function fetchStats() {
  try {
    const res = await getAccountStats();
    if (res.result) {
      Object.assign(stats, res.result);
    }
  } catch (error) {
    console.error('获取统计数据失败', error);
  }
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

async function fetchRecords() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (recordType.value) params.type = recordType.value;
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0].format('YYYY-MM-DD');
      params.endDate = dateRange.value[1].format('YYYY-MM-DD');
    }

    const res = await getAccountRecords(params);
    if (res.result) {
      records.value = res.result.list || [];
      pagination.total = res.result.total || 0;
    }
  } catch (error) {
    console.error('获取记录失败', error);
  } finally {
    loading.value = false;
  }
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchRecords();
}

function openRechargeModal() {
  rechargeForm.amount = 0;
  rechargeForm.remark = '';
  rechargeVisible.value = true;
}

async function handleRecharge() {
  if (rechargeForm.amount <= 0) {
    message.error('请输入正确的充值金额');
    return;
  }
  submitLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success('充值成功');
    rechargeVisible.value = false;
    fetchAccountInfo();
    fetchStats();
    fetchRecords();
  } catch (error) {
    message.error('充值失败');
  } finally {
    submitLoading.value = false;
  }
}

function openWithdrawModal() {
  withdrawForm.amount = 0;
  withdrawForm.remark = '';
  withdrawVisible.value = true;
}

async function handleWithdraw() {
  if (withdrawForm.amount <= 0) {
    message.error('请输入正确的取款金额');
    return;
  }
  if (withdrawForm.amount > Number(accountInfo.availableBalance)) {
    message.error('取款金额不能超过可用余额');
    return;
  }
  submitLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success('取款申请已提交');
    withdrawVisible.value = false;
    fetchAccountInfo();
    fetchStats();
    fetchRecords();
  } catch (error) {
    message.error('取款失败');
  } finally {
    submitLoading.value = false;
  }
}

function openTransferModal() {
  transferForm.toAccountType = 'citic';
  transferForm.toAccount = '';
  transferForm.bankCardNo = '';
  transferForm.amount = 0;
  transferForm.remark = '';
  transferVisible.value = true;
}

async function handleTransfer() {
  if (transferForm.amount <= 0) {
    message.error('请输入正确的转账金额');
    return;
  }
  if (transferForm.toAccountType === 'citic' && !transferForm.toAccount) {
    message.error('请选择目标账户');
    return;
  }
  if (transferForm.toAccountType === 'bank' && !transferForm.bankCardNo) {
    message.error('请输入银行卡号');
    return;
  }
  submitLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success('转账成功');
    transferVisible.value = false;
    fetchAccountInfo();
    fetchStats();
    fetchRecords();
  } catch (error) {
    message.error('转账失败');
  } finally {
    submitLoading.value = false;
  }
}

async function handleRefresh() {
  await Promise.all([fetchAccountInfo(), fetchStats(), fetchRecords()]);
  message.success('刷新成功');
}

onMounted(async () => {
  await Promise.all([fetchAccountInfo(), fetchStats(), fetchCardList(), fetchRecords()]);
});
</script>

<style scoped>
.citic-account {
  padding: 16px;
  background: #f0f2f5;
}

.account-overview {
  margin-bottom: 24px;
}

.account-card {
  text-align: center;
}

.card-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #666;
}

.card-footer .label {
  margin-right: 4px;
}

.card-footer .value {
  font-weight: 500;
  color: #333;
}

.card-footer .value.expense {
  color: #f5222d;
}

.freeze-info {
  padding: 8px 0;
}

.freeze-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.freeze-item:last-child {
  margin-bottom: 0;
}

.freeze-item .label {
  color: #666;
}

.freeze-item .value {
  font-weight: 500;
  color: #333;
}

.freeze-item .value.frozen {
  color: #faad14;
}

.account-desc {
  margin-bottom: 24px;
}

.action-buttons {
  margin-bottom: 24px;
}

.record-card {
  margin-top: 16px;
}

.record-no {
  font-family: 'Consolas', monospace;
  color: #666;
}

.income {
  color: #52c41a;
  font-weight: 500;
}

.expense {
  color: #f5222d;
  font-weight: 500;
}

.balance {
  color: #333;
}

.mb-16 {
  margin-bottom: 16px;
}

.available-balance {
  color: #52c41a;
  font-weight: 500;
  font-size: 16px;
}

.from-account {
  color: #666;
}
</style>
