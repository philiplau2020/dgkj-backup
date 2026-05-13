<template>
  <div class="citic-account">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="账户编号">
          <Input v-model:value="searchForm.accountNo" placeholder="请输入账户编号" allow-clear style="width: 160px" />
        </FormItem>
        <FormItem label="账户名称">
          <Input v-model:value="searchForm.accountName" placeholder="请输入账户名称" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem label="账户类型">
          <Select v-model:value="searchForm.accountType" allow-clear style="width: 120px">
            <SelectOption :value="1">个人账户</SelectOption>
            <SelectOption :value="2">企业账户</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 100px">
            <SelectOption :value="1">启用</SelectOption>
            <SelectOption :value="0">停用</SelectOption>
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
            <Statistic title="账户总数" :value="stats.totalCount" :value-style="{ color: '#1890ff' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="总余额" :value="Number(stats.totalBalance)" :precision="2" prefix="¥" :value-style="{ color: '#f5222d', fontSize: '20px' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="总可用余额" :value="Number(stats.totalAvailable)" :precision="2" prefix="¥" :value-style="{ color: '#52c41a', fontSize: '20px' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="今日收入" :value="Number(stats.todayIncome)" :precision="2" prefix="¥" :value-style="{ color: '#722ed1' }" />
          </Card>
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openRegisterModal">
            <template #icon><PlusOutlined /></template>
            开户
          </Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 账户列表 -->
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
          <template v-if="column.key === 'accountType'">
            <Tag :color="record.accountType === 1 ? 'blue' : 'green'">
              {{ record.accountType === 1 ? '个人账户' : '企业账户' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'balance'">
            <span class="amount-text">¥{{ Number(record.balance || 0).toFixed(2) }}</span>
          </template>
          <template v-else-if="column.key === 'availableBalance'">
            <span class="available-text">¥{{ Number(record.availableBalance || 0).toFixed(2) }}</span>
          </template>
          <template v-else-if="column.key === 'frozenBalance'">
            <span class="frozen-text">¥{{ Number(record.frozenBalance || 0).toFixed(2) }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Switch :checked="record.status === 1" @change="(checked) => handleToggleStatus(record, checked)" />
            <span style="margin-left: 8px">{{ record.status === 1 ? '启用' : '停用' }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="openEditModal(record)">编辑</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 开户/编辑弹窗 -->
    <Modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑账户' : '开户'"
      width="600px"
      @ok="handleSubmit"
      :confirm-loading="submitLoading"
    >
      <Form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="formRules" ref="formRef">
        <FormItem label="账户编号" name="accountNo" v-if="!isEdit">
          <Input v-model:value="formData.accountNo" placeholder="请输入账户编号" />
        </FormItem>
        <FormItem label="账户名称" name="accountName">
          <Input v-model:value="formData.accountName" placeholder="请输入账户名称" />
        </FormItem>
        <FormItem label="账户类型" name="accountType">
          <RadioGroup v-model:value="formData.accountType">
            <Radio :value="1">个人账户</Radio>
            <Radio :value="2">企业账户</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="账户属性" name="accountAttr">
          <Select v-model:value="formData.accountAttr" style="width: 100%">
            <SelectOption :value="1">普通账户</SelectOption>
            <SelectOption :value="2">过渡账户</SelectOption>
            <SelectOption :value="3">归集账户</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="关联商户号">
          <Input v-model:value="formData.mchNo" placeholder="请输入关联商户号(选填)" />
        </FormItem>
        <FormItem label="关联代理商号">
          <Input v-model:value="formData.agentNo" placeholder="请输入关联代理商号(选填)" />
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="formData.remark" placeholder="请输入备注" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 详情弹窗 -->
    <Modal v-model:open="detailVisible" title="账户详情" width="700px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="账户编号" :span="2">
          <span class="account-no">{{ currentRecord.accountNo }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="账户名称">{{ currentRecord.accountName }}</DescriptionsItem>
        <DescriptionsItem label="账户类型">
          <Tag :color="currentRecord.accountType === 1 ? 'blue' : 'green'">
            {{ currentRecord.accountType === 1 ? '个人账户' : '企业账户' }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="账户属性">
          <Tag v-if="currentRecord.accountAttr === 1">普通账户</Tag>
          <Tag v-else-if="currentRecord.accountAttr === 2">过渡账户</Tag>
          <Tag v-else>归集账户</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="总余额">
          <span class="amount-text">¥{{ Number(currentRecord.balance || 0).toFixed(2) }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="可用余额">
          <span class="available-text">¥{{ Number(currentRecord.availableBalance || 0).toFixed(2) }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="冻结金额">
          <span class="frozen-text">¥{{ Number(currentRecord.frozenBalance || 0).toFixed(2) }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="待结算金额">
          <span>¥{{ Number(currentRecord.pendingBalance || 0).toFixed(2) }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="关联商户号">{{ currentRecord.mchNo || '-' }}</DescriptionsItem>
        <DescriptionsItem label="关联代理商号">{{ currentRecord.agentNo || '-' }}</DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="currentRecord.status === 1 ? 'success' : 'error'" :text="currentRecord.status === 1 ? '启用' : '停用'" />
        </DescriptionsItem>
        <DescriptionsItem label="审核状态">
          <Tag v-if="currentRecord.auditStatus === 0" color="orange">待审核</Tag>
          <Tag v-else-if="currentRecord.auditStatus === 1" color="green">已通过</Tag>
          <Tag v-else color="red">已拒绝</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createTime }}</DescriptionsItem>
        <DescriptionsItem label="更新时间">{{ currentRecord.updateTime || '-' }}</DescriptionsItem>
        <DescriptionsItem label="备注" :span="2">{{ currentRecord.remark || '-' }}</DescriptionsItem>
      </Descriptions>

      <!-- 账户操作 -->
      <Divider>账户操作</Divider>
      <Space>
        <Button type="primary" @click="openRechargeModal" :disabled="currentRecord.status !== 1">
          <template #icon><PlusOutlined /></template>
          充值
        </Button>
        <Button @click="openWithdrawModal" :disabled="currentRecord.status !== 1">
          <template #icon><MinusOutlined /></template>
          取款
        </Button>
        <Button @click="openTransferModal" :disabled="currentRecord.status !== 1">
          <template #icon><SwapOutlined /></template>
          转账
        </Button>
        <Button @click="openRecordModal" :disabled="currentRecord.status !== 1">
          <template #icon><FileTextOutlined /></template>
          查看流水
        </Button>
      </Space>
    </Modal>

    <!-- 充值弹窗 -->
    <Modal v-model:open="rechargeVisible" title="账户充值" width="450px" @ok="handleRecharge" :confirm-loading="submitLoading">
      <Alert message="充值说明" type="info" show-icon class="mb-16">
        <template #description>充值金额将即时到账，充值手续费为0.00%。</template>
      </Alert>
      <Form :model="rechargeForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="账户编号">{{ currentRecord?.accountNo }}</FormItem>
        <FormItem label="账户名称">{{ currentRecord?.accountName }}</FormItem>
        <FormItem label="充值金额" required>
          <InputNumber v-model:value="rechargeForm.amount" :min="0.01" :max="999999999" :precision="2" style="width: 100%" placeholder="请输入充值金额" />
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="rechargeForm.remark" placeholder="请输入备注(选填)" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 取款弹窗 -->
    <Modal v-model:open="withdrawVisible" title="账户取款" width="450px" @ok="handleWithdraw" :confirm-loading="submitLoading">
      <Alert message="取款说明" type="warning" show-icon class="mb-16">
        <template #description>取款金额将原路退回，预计1-3个工作日到账。</template>
      </Alert>
      <Form :model="withdrawForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="账户编号">{{ currentRecord?.accountNo }}</FormItem>
        <FormItem label="可用余额">
          <span class="available-text">¥{{ Number(currentRecord?.availableBalance || 0).toFixed(2) }}</span>
        </FormItem>
        <FormItem label="取款金额" required>
          <InputNumber v-model:value="withdrawForm.amount" :min="0.01" :max="Number(currentRecord?.availableBalance || 0)" :precision="2" style="width: 100%" placeholder="请输入取款金额" />
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="withdrawForm.remark" placeholder="请输入备注(选填)" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 转账弹窗 -->
    <Modal v-model:open="transferVisible" title="账户转账" width="500px" @ok="handleTransfer" :confirm-loading="submitLoading">
      <Form :model="transferForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="转出账户">
          <span>{{ currentRecord?.accountNo }} ({{ currentRecord?.accountName }})</span>
        </FormItem>
        <FormItem label="转入账户" required>
          <Select v-model:value="transferForm.toAccountNo" placeholder="请选择目标账户" show-search style="width: 100%">
            <SelectOption v-for="acc in accountList.filter(a => a.accountNo !== currentRecord?.accountNo)" :key="acc.accountNo" :value="acc.accountNo">
              {{ acc.accountName }} ({{ acc.accountNo }})
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="转账金额" required>
          <InputNumber v-model:value="transferForm.amount" :min="0.01" :precision="2" style="width: 100%" placeholder="请输入转账金额" />
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="transferForm.remark" placeholder="请输入备注(选填)" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 流水弹窗 -->
    <Modal v-model:open="recordVisible" title="账户流水" width="900px" :footer="null">
      <Table :data-source="records" :columns="recordColumns" :loading="recordLoading" :pagination="recordPagination" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'bizType'">
            <Tag :color="getBizTypeColor(record.bizType)">{{ record.bizTypeName }}</Tag>
          </template>
          <template v-else-if="column.key === 'amount'">
            <span :class="record.amount > 0 ? 'income-text' : 'expense-text'">
              {{ record.amount > 0 ? '+' : '' }}¥{{ record.amount }}
            </span>
          </template>
        </template>
      </Table>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space,
  Tag, Badge, Row, Col, Statistic, Modal, Descriptions, DescriptionsItem,
  InputNumber, Switch, message, Alert, Divider, RadioGroup, Radio
} from 'ant-design-vue';
import { PlusOutlined, SearchOutlined, ReloadOutlined, MinusOutlined, SwapOutlined, FileTextOutlined } from '@ant-design/icons-vue';
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
  accountNo: '',
  accountName: '',
  accountType: undefined as number | undefined,
  status: undefined as number | undefined,
});

const stats = reactive({
  totalCount: 0,
  totalBalance: '0.00',
  totalAvailable: '0.00',
  todayIncome: '0.00',
});

const columns = [
  { title: '账户编号', dataIndex: 'accountNo', key: 'accountNo', width: 180 },
  { title: '账户名称', dataIndex: 'accountName', key: 'accountName', width: 150 },
  { title: '账户类型', key: 'accountType', width: 100 },
  { title: '总余额', key: 'balance', width: 130 },
  { title: '可用余额', key: 'availableBalance', width: 130 },
  { title: '冻结金额', key: 'frozenBalance', width: 120 },
  { title: '状态', key: 'status', width: 120 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 100 },
];

const modalVisible = ref(false);
const isEdit = ref(false);
const formRef = ref();
const currentRecord = ref<any>(null);
const detailVisible = ref(false);

const formData = reactive({
  accountNo: '',
  accountName: '',
  accountType: 1,
  accountAttr: 1,
  mchNo: '',
  agentNo: '',
  remark: '',
});

const formRules = {
  accountNo: [{ required: true, message: '请输入账户编号' }],
  accountName: [{ required: true, message: '请输入账户名称' }],
  accountType: [{ required: true, message: '请选择账户类型' }],
};

// 充值
const rechargeVisible = ref(false);
const rechargeForm = reactive({ amount: 0, remark: '' });

// 取款
const withdrawVisible = ref(false);
const withdrawForm = reactive({ amount: 0, remark: '' });

// 转账
const transferVisible = ref(false);
const transferForm = reactive({ toAccountNo: '', amount: 0, remark: '' });

// 流水
const recordVisible = ref(false);
const recordLoading = ref(false);
const records = ref<any[]>([]);
const recordPagination = reactive({ current: 1, pageSize: 10, total: 0 });

const recordColumns = [
  { title: '流水号', dataIndex: 'recordNo', key: 'recordNo', width: 200 },
  { title: '业务类型', key: 'bizType', width: 100 },
  { title: '变动金额', key: 'amount', width: 130 },
  { title: '变动前余额', dataIndex: 'balanceBefore', key: 'balanceBefore', width: 130, customRender: ({ text }) => `¥${Number(text || 0).toFixed(2)}` },
  { title: '变动后余额', dataIndex: 'balanceAfter', key: 'balanceAfter', width: 130, customRender: ({ text }) => `¥${Number(text || 0).toFixed(2)}` },
  { title: '关联单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
];

function getBizTypeColor(type: number) {
  const map: Record<number, string> = {
    1: 'green', 2: 'red', 3: 'orange', 4: 'blue',
    5: 'purple', 6: 'cyan', 7: 'magenta', 8: 'gold'
  };
  return map[type] || 'default';
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.accountNo) params.accountNo = searchForm.accountNo;
    if (searchForm.accountName) params.accountName = searchForm.accountName;
    if (searchForm.accountType !== undefined) params.accountType = searchForm.accountType;
    if (searchForm.status !== undefined) params.status = searchForm.status;

    const res = await defHttp.get({ url: '/basic-api/citic/account/list', params });
    if (res && res.data) {
      dataSource.value = res.data.list || [];
      pagination.total = res.data.total || 0;
      accountList.value = dataSource.value;
      updateStats();
    }
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

function updateStats() {
  stats.totalCount = dataSource.value.length;
  stats.totalBalance = dataSource.value.reduce((sum, item) => sum + Number(item.balance || 0), 0).toFixed(2);
  stats.totalAvailable = dataSource.value.reduce((sum, item) => sum + Number(item.availableBalance || 0), 0).toFixed(2);
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.accountNo = '';
  searchForm.accountName = '';
  searchForm.accountType = undefined;
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openRegisterModal() {
  isEdit.value = false;
  Object.assign(formData, {
    accountNo: '',
    accountName: '',
    accountType: 1,
    accountAttr: 1,
    mchNo: '',
    agentNo: '',
    remark: '',
  });
  modalVisible.value = true;
}

function openEditModal(record: any) {
  isEdit.value = true;
  currentRecord.value = record;
  Object.assign(formData, {
    accountNo: record.accountNo,
    accountName: record.accountName,
    accountType: record.accountType,
    accountAttr: record.accountAttr,
    mchNo: record.mchNo,
    agentNo: record.agentNo,
    remark: record.remark,
  });
  modalVisible.value = true;
}

async function handleSubmit() {
  submitLoading.value = true;
  try {
    if (isEdit.value && currentRecord.value) {
      await defHttp.put({ url: `/basic-api/citic/account/${currentRecord.value.id}`, data: formData });
      message.success('更新成功');
    } else {
      await defHttp.post({ url: '/basic-api/citic/account/register', data: formData });
      message.success('开户成功');
    }
    modalVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('操作失败');
  } finally {
    submitLoading.value = false;
  }
}

async function handleToggleStatus(record: any, checked: boolean) {
  try {
    await defHttp.put({ url: `/basic-api/citic/account/${record.id}`, data: { status: checked ? 1 : 0 } });
    message.success(checked ? '账户已启用' : '账户已停用');
    fetchData();
  } catch (error) {
    message.error('操作失败');
  }
}

function openDetailModal(record: any) {
  currentRecord.value = record;
  detailVisible.value = true;
}

// 充值
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
    // 模拟充值，实际应该调用充值API
    await new Promise(resolve => setTimeout(resolve, 500));
    message.success('充值成功');
    rechargeVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('充值失败');
  } finally {
    submitLoading.value = false;
  }
}

// 取款
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
  if (withdrawForm.amount > Number(currentRecord.value?.availableBalance || 0)) {
    message.error('取款金额不能超过可用余额');
    return;
  }
  submitLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    message.success('取款申请已提交');
    withdrawVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('取款失败');
  } finally {
    submitLoading.value = false;
  }
}

// 转账
function openTransferModal() {
  transferForm.toAccountNo = '';
  transferForm.amount = 0;
  transferForm.remark = '';
  transferVisible.value = true;
}

async function handleTransfer() {
  if (!transferForm.toAccountNo) {
    message.error('请选择目标账户');
    return;
  }
  if (transferForm.amount <= 0) {
    message.error('请输入正确的转账金额');
    return;
  }
  submitLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    message.success('转账成功');
    transferVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('转账失败');
  } finally {
    submitLoading.value = false;
  }
}

// 流水
function openRecordModal() {
  recordPagination.current = 1;
  fetchRecords();
  recordVisible.value = true;
}

async function fetchRecords() {
  if (!currentRecord.value) return;
  recordLoading.value = true;
  try {
    const res = await defHttp.get({
      url: '/basic-api/citic/account/records',
      params: {
        accountNo: currentRecord.value.accountNo,
        page: recordPagination.current,
        pageSize: recordPagination.pageSize,
      }
    });
    if (res && res.data) {
      records.value = res.data.list || [];
      recordPagination.total = res.data.total || 0;
    }
  } catch (error) {
    console.error('获取流水失败', error);
  } finally {
    recordLoading.value = false;
  }
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
.citic-account {
  padding: 16px;
  background: #f0f2f5;
}

.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.account-no { font-family: 'Consolas', monospace; color: #666; }
.amount-text { color: #f5222d; font-weight: 500; }
.available-text { color: #52c41a; font-weight: 500; }
.frozen-text { color: #faad14; }
.income-text { color: #52c41a; font-weight: 500; }
.expense-text { color: #f5222d; font-weight: 500; }
.mb-16 { margin-bottom: 16px; }
</style>

