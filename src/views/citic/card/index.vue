<template>
  <div class="citic-card">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="持卡人">
          <Input v-model:value="searchForm.accountName" placeholder="请输入持卡人" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="卡号">
          <Input v-model:value="searchForm.cardNo" placeholder="请输入卡号" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="开户行">
          <Input v-model:value="searchForm.bankName" placeholder="请输入开户行" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="卡类型">
          <Select v-model:value="searchForm.cardType" allow-clear style="width: 120px">
            <SelectOption :value="1">对公账户</SelectOption>
            <SelectOption :value="2">对私账户</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 100px">
            <SelectOption :value="1">正常</SelectOption>
            <SelectOption :value="0">已解绑</SelectOption>
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
            <Statistic title="绑定卡片" :value="stats.bindCount" :value-style="{ color: '#1890ff' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="对公账户" :value="stats.publicCount" :value-style="{ color: '#722ed1' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="对私账户" :value="stats.privateCount" :value-style="{ color: '#52c41a' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="已解绑" :value="stats.unbindCount" :value-style="{ color: '#8c8c8c' }" />
          </Card>
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openBindModal">
            <template #icon><PlusOutlined /></template>
            绑定银行卡
          </Button>
          <Button @click="handleExport">
            <template #icon><DownloadOutlined /></template>
            导出
          </Button>
        </Space>
      </div>

      <!-- 银行卡列表 -->
      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cardNo'">
            <div class="card-no-cell">
              <span class="card-no">{{ formatCardNo(record.cardNo) }}</span>
              <Button type="link" size="small" @click="copyCardNo(record.cardNo)">
                <template #icon><CopyOutlined /></template>
              </Button>
            </div>
          </template>
          <template v-else-if="column.key === 'cardType'">
            <Tag :color="record.cardType === 1 ? 'blue' : 'green'">
              {{ record.cardTypeName }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="record.status === 1 ? 'success' : 'default'" :text="record.statusName" />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="openEditModal(record)" v-if="record.status === 1">编辑</Button>
              <Button type="link" size="small" danger @click="handleUnbind(record)" v-if="record.status === 1">
                解绑
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 绑定银行卡弹窗 -->
    <Modal
      v-model:open="bindVisible"
      title="绑定银行卡"
      width="500px"
      @ok="handleBind"
      :confirm-loading="submitLoading"
    >
      <Alert message="绑定说明" type="info" show-icon class="mb-16">
        <template #description>
          请确保银行卡信息真实有效，绑定后可用于资金结算。
        </template>
      </Alert>
      <Form :model="bindForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="bindRules" ref="bindFormRef">
        <FormItem label="银行卡号" name="cardNo">
          <Input 
            v-model:value="bindForm.cardNo" 
            placeholder="请输入银行卡号" 
            :maxlength="19"
            @input="handleCardNoInput"
          />
          <div class="card-bank-info" v-if="bindForm.bankName">
            <BankOutlined />
            <span>{{ bindForm.bankName }}</span>
          </div>
        </FormItem>
        <FormItem label="持卡人" name="accountName">
          <Input v-model:value="bindForm.accountName" placeholder="请输入持卡人姓名" />
        </FormItem>
        <FormItem label="身份证号" name="idCard">
          <Input v-model:value="bindForm.idCard" placeholder="请输入身份证号" :maxlength="18" />
        </FormItem>
        <FormItem label="手机号" name="mobile">
          <Input v-model:value="bindForm.mobile" placeholder="请输入银行预留手机号" :maxlength="11" />
        </FormItem>
        <FormItem label="开户行" name="bankName">
          <Input v-model:value="bindForm.bankName" placeholder="请输入开户行名称" />
        </FormItem>
        <FormItem label="开户支行" name="branchName">
          <Input v-model:value="bindForm.branchName" placeholder="请输入开户支行名称" />
        </FormItem>
        <FormItem label="卡类型" name="cardType">
          <RadioGroup v-model:value="bindForm.cardType">
            <Radio :value="1">对公账户</Radio>
            <Radio :value="2">对私账户</Radio>
          </RadioGroup>
        </FormItem>
      </Form>
    </Modal>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="银行卡详情"
      width="600px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentCard">
        <DescriptionsItem label="卡号" :span="2">
          <Space>
            <span class="card-no">{{ currentCard.cardNo }}</span>
            <Button type="link" size="small" @click="copyCardNo(currentCard.cardNo)">复制</Button>
          </Space>
        </DescriptionsItem>
        <DescriptionsItem label="持卡人">{{ currentCard.accountName }}</DescriptionsItem>
        <DescriptionsItem label="卡类型">
          <Tag :color="currentCard.cardType === 1 ? 'blue' : 'green'">
            {{ currentCard.cardTypeName }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="开户行">{{ currentCard.bankName }}</DescriptionsItem>
        <DescriptionsItem label="开户支行">{{ currentCard.branchName || '-' }}</DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="currentCard.status === 1 ? 'success' : 'default'" :text="currentCard.statusName" />
        </DescriptionsItem>
        <DescriptionsItem label="绑定时间">{{ currentCard.bindTime }}</DescriptionsItem>
        <DescriptionsItem label="解绑时间" v-if="currentCard.unbindTime">
          {{ currentCard.unbindTime }}
        </DescriptionsItem>
      </Descriptions>
      
      <!-- 使用记录 -->
      <Divider>使用记录</Divider>
      <Table
        :data-source="useRecords"
        :columns="useRecordColumns"
        :pagination="false"
        size="small"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'amount'">
            <span :style="{ color: record.type === 1 ? '#52c41a' : '#f5222d' }">
              {{ record.type === 1 ? '+' : '-' }}¥{{ record.amount }}
            </span>
          </template>
        </template>
      </Table>
    </Modal>

    <!-- 编辑弹窗 -->
    <Modal
      v-model:open="editVisible"
      title="编辑银行卡"
      width="500px"
      @ok="handleEdit"
      :confirm-loading="submitLoading"
    >
      <Form :model="editForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="卡号">
          <Input :value="currentCard?.cardNo" disabled />
        </FormItem>
        <FormItem label="持卡人" name="accountName">
          <Input v-model:value="editForm.accountName" placeholder="请输入持卡人姓名" />
        </FormItem>
        <FormItem label="开户行" name="bankName">
          <Input v-model:value="editForm.bankName" placeholder="请输入开户行名称" />
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="editForm.remark" placeholder="请输入备注" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { 
  Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, 
  Tag, Badge, Modal, Descriptions, DescriptionsItem, RadioGroup, Radio, 
  Row, Col, Statistic, Alert, Divider, message, InputNumber 
} from 'ant-design-vue';
import { PlusOutlined, SearchOutlined, CopyOutlined, DownloadOutlined, BankOutlined } from '@ant-design/icons-vue';
import { getCardList, bindCard, unbindCard } from '@/api/citic';

const loading = ref(false);
const submitLoading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  accountName: '',
  cardNo: '',
  bankName: '',
  cardType: undefined as number | undefined,
  status: undefined as number | undefined,
});

const stats = reactive({
  bindCount: 0,
  publicCount: 0,
  privateCount: 0,
  unbindCount: 0,
});

const columns = [
  { title: '卡号', dataIndex: 'cardNo', key: 'cardNo', width: 220 },
  { title: '持卡人', dataIndex: 'accountName', key: 'accountName', width: 120 },
  { title: '开户行', dataIndex: 'bankName', key: 'bankName', width: 150 },
  { title: '卡类型', key: 'cardType', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '绑定时间', dataIndex: 'bindTime', key: 'bindTime', width: 170 },
  { title: '操作', key: 'action', width: 150 },
];

const useRecordColumns = [
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '类型', dataIndex: 'typeName', key: 'typeName', width: 100 },
  { title: '金额', key: 'amount', width: 120 },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
];

const currentCard = ref<any>(null);
const detailVisible = ref(false);
const useRecords = ref<any[]>([]);

const bindVisible = ref(false);
const bindFormRef = ref();
const bindForm = reactive({
  cardNo: '',
  accountName: '',
  idCard: '',
  mobile: '',
  bankName: '',
  branchName: '',
  cardType: 2,
});
const bindRules = {
  cardNo: [{ required: true, message: '请输入银行卡号' }],
  accountName: [{ required: true, message: '请输入持卡人姓名' }],
  idCard: [{ required: true, message: '请输入身份证号' }],
  mobile: [{ required: true, message: '请输入银行预留手机号' }],
  bankName: [{ required: true, message: '请输入开户行名称' }],
  cardType: [{ required: true, message: '请选择卡类型' }],
};

const editVisible = ref(false);
const editForm = reactive({
  accountName: '',
  bankName: '',
  remark: '',
});

function formatCardNo(cardNo: string) {
  if (!cardNo) return '-';
  return cardNo.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function copyCardNo(cardNo: string) {
  navigator.clipboard.writeText(cardNo).then(() => {
    message.success('卡号已复制');
  }).catch(() => {
    message.error('复制失败');
  });
}

function handleCardNoInput(e: any) {
  bindForm.cardNo = e.target.value.replace(/\D/g, '');
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.accountName) params.accountName = searchForm.accountName;
    if (searchForm.cardNo) params.cardNo = searchForm.cardNo;
    if (searchForm.bankName) params.bankName = searchForm.bankName;
    if (searchForm.cardType !== undefined) params.cardType = searchForm.cardType;
    if (searchForm.status !== undefined) params.status = searchForm.status;

    const res = await getCardList(params);
    if (res.result) {
      dataSource.value = res.result.list || [];
      pagination.total = res.result.total || 0;
      
      // 更新统计
      stats.bindCount = dataSource.value.filter(item => item.status === 1).length;
      stats.publicCount = dataSource.value.filter(item => item.cardType === 1).length;
      stats.privateCount = dataSource.value.filter(item => item.cardType === 2).length;
      stats.unbindCount = dataSource.value.filter(item => item.status === 0).length;
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
  searchForm.accountName = '';
  searchForm.cardNo = '';
  searchForm.bankName = '';
  searchForm.cardType = undefined;
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openBindModal() {
  Object.assign(bindForm, {
    cardNo: '',
    accountName: '',
    idCard: '',
    mobile: '',
    bankName: '',
    branchName: '',
    cardType: 2,
  });
  bindVisible.value = true;
}

async function handleBind() {
  try {
    submitLoading.value = true;
    await bindCard({
      cardNo: bindForm.cardNo,
      accountName: bindForm.accountName,
      bankName: bindForm.bankName,
    });
    message.success('绑定成功');
    bindVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('绑定失败');
  } finally {
    submitLoading.value = false;
  }
}

function openDetailModal(record: any) {
  currentCard.value = record;
  // 模拟使用记录
  useRecords.value = [];
  for (let i = 1; i <= 5; i++) {
    useRecords.value.push({
      id: i,
      createdAt: new Date(Date.now() - i * 86400000).toISOString().replace('T', ' ').substring(0, 19),
      type: Math.random() > 0.5 ? 1 : 2,
      typeName: Math.random() > 0.5 ? '结算' : '充值',
      amount: (Math.random() * 10000).toFixed(2),
      remark: '-',
    });
  }
  detailVisible.value = true;
}

function openEditModal(record: any) {
  currentCard.value = record;
  Object.assign(editForm, {
    accountName: record.accountName,
    bankName: record.bankName,
    remark: '',
  });
  editVisible.value = true;
}

async function handleEdit() {
  message.success('编辑成功');
  editVisible.value = false;
  fetchData();
}

async function handleUnbind(record: any) {
  try {
    await new Promise((resolve) => {
      Modal.confirm({
        title: '确认解绑',
        content: `确定要解绑银行卡 ${formatCardNo(record.cardNo)} 吗？`,
        okText: '确认解绑',
        cancelText: '取消',
        onOk: resolve,
      });
    });
    
    await unbindCard(record.cardNo);
    message.success('解绑成功');
    fetchData();
  } catch (error) {
    // 用户取消
  }
}

function handleExport() {
  message.info('导出功能开发中');
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.citic-card {
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

.card-no-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-no {
  font-family: 'Consolas', monospace;
  letter-spacing: 1px;
}

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

.mb-16 {
  margin-bottom: 16px;
}
</style>
