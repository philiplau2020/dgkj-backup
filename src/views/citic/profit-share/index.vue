<template>
  <div class="citic-profit-share">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="账户">
          <Input v-model:value="searchForm.accountNo" placeholder="请输入账户编号" allow-clear style="width: 160px" />
        </FormItem>
        <FormItem label="原订单号">
          <Input v-model:value="searchForm.orderNo" placeholder="请输入订单号" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="分账类型">
          <Select v-model:value="searchForm.shareType" allow-clear style="width: 120px">
            <SelectOption :value="1">比例分账</SelectOption>
            <SelectOption :value="2">金额分账</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 100px">
            <SelectOption :value="0">待处理</SelectOption>
            <SelectOption :value="1">成功</SelectOption>
            <SelectOption :value="2">失败</SelectOption>
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
            <Statistic title="今日分账笔数" :value="stats.todayCount" :value-style="{ color: '#1890ff' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="今日分账金额" :value="Number(stats.todayAmount)" :precision="2" prefix="¥" :value-style="{ color: '#52c41a' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="本月分账金额" :value="Number(stats.monthAmount)" :precision="2" prefix="¥" :value-style="{ color: '#722ed1' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="分账成功率" :value="stats.successRate" suffix="%" :value-style="{ color: '#faad14' }" />
          </Card>
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openShareModal">
            <template #icon><PlusOutlined /></template>
            发起分账
          </Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 分账列表 -->
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
          <template v-if="column.key === 'shareNo'">
            <span class="share-no">{{ record.shareNo }}</span>
          </template>
          <template v-else-if="column.key === 'shareType'">
            <Tag :color="record.shareType === 1 ? 'blue' : 'purple'">
              {{ record.shareType === 1 ? '比例分账' : '金额分账' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'shareRate'">
            <span v-if="record.shareType === 1">{{ record.shareRate }}%</span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'shareAmount'">
            <span class="amount-text">¥{{ record.shareAmount }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="getStatusBadge(record.status)" :text="record.statusName" />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="openShareModal(record)" v-if="record.status === 2">重试</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 发起分账弹窗 -->
    <Modal
      v-model:open="shareVisible"
      title="发起分账"
      width="600px"
      @ok="handleShare"
      :confirm-loading="submitLoading"
    >
      <Alert message="分账说明" type="info" show-icon class="mb-16">
        <template #description>
          分账将从账户余额中扣除相应金额，分别划转到各接收方账户。支持比例分账和金额分账两种方式。
        </template>
      </Alert>
      <Form :model="shareForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="shareRules" ref="shareFormRef">
        <FormItem label="原订单号" name="orderNo">
          <Input v-model:value="shareForm.orderNo" placeholder="请输入原订单号" />
        </FormItem>
        <FormItem label="分账账户" name="accountNo">
          <Select v-model:value="shareForm.accountNo" placeholder="请选择分账账户" show-search style="width: 100%">
            <SelectOption v-for="acc in accountList" :key="acc.accountNo" :value="acc.accountNo">
              {{ acc.accountName }} ({{ acc.accountNo }})
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="原交易金额">
          <InputNumber v-model:value="shareForm.orderAmount" :min="0.01" :precision="2" style="width: 100%" placeholder="请输入原交易金额" @change="calcShareAmount" />
        </FormItem>

        <Divider>分账接收方</Divider>

        <div v-for="(receiver, index) in shareForm.receivers" :key="index" class="receiver-item">
          <Row :gutter="12">
            <Col :span="10">
              <FormItem label="接收方账户" :name="`receivers.${index}.accountNo`">
                <Select v-model:value="receiver.accountNo" placeholder="选择账户" show-search style="width: 100%">
                  <SelectOption v-for="acc in accountList" :key="acc.accountNo" :value="acc.accountNo">
                    {{ acc.accountName }} ({{ acc.accountNo }})
                  </SelectOption>
                </Select>
              </FormItem>
            </Col>
            <Col :span="6">
              <FormItem label="分账方式">
                <Select v-model:value="receiver.shareType" style="width: 100%" @change="() => { receiver.shareRate = 0; receiver.shareAmount = 0; }">
                  <SelectOption :value="1">比例</SelectOption>
                  <SelectOption :value="2">金额</SelectOption>
                </Select>
              </FormItem>
            </Col>
            <Col :span="6">
              <FormItem label="分账值">
                <InputNumber
                  v-if="receiver.shareType === 1"
                  v-model:value="receiver.shareRate"
                  :min="0"
                  :precision="2"
                  :style="{ width: '100%' }"
                  placeholder="比例%"
                />
                <InputNumber
                  v-else
                  v-model:value="receiver.shareAmount"
                  :min="0"
                  :precision="2"
                  :style="{ width: '100%' }"
                  placeholder="金额"
                />
              </FormItem>
            </Col>
            <Col :span="2">
              <Button type="link" danger @click="removeReceiver(index)" v-if="shareForm.receivers.length > 1">
                <template #icon><DeleteOutlined /></template>
              </Button>
            </Col>
          </Row>
        </div>

        <Button type="dashed" block @click="addReceiver" class="mb-16">
          <template #icon><PlusOutlined /></template>
          添加接收方
        </Button>

        <FormItem label="备注">
          <Input v-model:value="shareForm.remark" placeholder="请输入备注" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 详情弹窗 -->
    <Modal v-model:open="detailVisible" title="分账详情" width="650px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="分账单号" :span="2">
          <span class="share-no">{{ currentRecord.shareNo }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="原订单号">{{ currentRecord.orderNo || '-' }}</DescriptionsItem>
        <DescriptionsItem label="分账类型">
          <Tag :color="currentRecord.shareType === 1 ? 'blue' : 'purple'">
            {{ currentRecord.shareType === 1 ? '比例分账' : '金额分账' }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="分账账户">{{ currentRecord.accountNo }}</DescriptionsItem>
        <DescriptionsItem label="账户名称">{{ currentRecord.accountName }}</DescriptionsItem>
        <DescriptionsItem label="接收方账户">{{ currentRecord.receiverAccountNo }}</DescriptionsItem>
        <DescriptionsItem label="接收方名称">{{ currentRecord.receiverName }}</DescriptionsItem>
        <DescriptionsItem label="原交易金额">¥{{ currentRecord.orderAmount || '-' }}</DescriptionsItem>
        <DescriptionsItem label="分账比例">{{ currentRecord.shareRate ? currentRecord.shareRate + '%' : '-' }}</DescriptionsItem>
        <DescriptionsItem label="分账金额">
          <span class="amount-text">¥{{ currentRecord.shareAmount }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="getStatusBadge(currentRecord.status)" :text="currentRecord.statusName" />
        </DescriptionsItem>
        <DescriptionsItem label="分账时间">{{ currentRecord.shareTime || '-' }}</DescriptionsItem>
        <DescriptionsItem label="备注" :span="2">{{ currentRecord.remark || '-' }}</DescriptionsItem>
      </Descriptions>
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
import { PlusOutlined, SearchOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import {
  getCiticProfitShareList,
  executeCiticProfitShare,
  getCiticAccountList,
} from '@/api/citic';

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
  orderNo: '',
  shareType: undefined as number | undefined,
  status: undefined as number | undefined,
});

const stats = reactive({
  todayCount: 0,
  todayAmount: '0.00',
  monthAmount: '0.00',
  successRate: 100,
});

const columns = [
  { title: '分账单号', dataIndex: 'shareNo', key: 'shareNo', width: 200 },
  { title: '原订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
  { title: '分账账户', dataIndex: 'accountNo', key: 'accountNo', width: 140 },
  { title: '账户名称', dataIndex: 'accountName', key: 'accountName', width: 140 },
  { title: '接收方账户', dataIndex: 'receiverAccountNo', key: 'receiverAccountNo', width: 140 },
  { title: '接收方名称', dataIndex: 'receiverName', key: 'receiverName', width: 140 },
  { title: '分账类型', key: 'shareType', width: 100 },
  { title: '分账比例', key: 'shareRate', width: 100 },
  { title: '分账金额', key: 'shareAmount', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '分账时间', dataIndex: 'shareTime', key: 'shareTime', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

const shareVisible = ref(false);
const detailVisible = ref(false);
const currentRecord = ref<any>(null);
const shareFormRef = ref();

const shareForm = reactive({
  orderNo: '',
  accountNo: '',
  orderAmount: 0,
  receivers: [
    { accountNo: '', shareType: 1 as 1 | 2, shareRate: 0, shareAmount: 0 }
  ],
  remark: '',
});

const shareRules = {
  accountNo: [{ required: true, message: '请选择分账账户' }],
  orderAmount: [{ required: true, message: '请输入原交易金额' }],
};

function getStatusBadge(status: number) {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'error', 3: 'processing' };
  return map[status] || 'default';
}

function calcShareAmount() {}

function addReceiver() {
  shareForm.receivers.push({ accountNo: '', shareType: 1 as 1 | 2, shareRate: 0, shareAmount: 0 });
}

function removeReceiver(index: number) {
  if (shareForm.receivers.length > 1) {
    shareForm.receivers.splice(index, 1);
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.accountNo) params.accountNo = searchForm.accountNo;
    if (searchForm.orderNo) params.orderNo = searchForm.orderNo;
    if (searchForm.shareType !== undefined) params.shareType = searchForm.shareType;
    if (searchForm.status !== undefined) params.status = searchForm.status;

    const res = await getCiticProfitShareList(params);
    if (res.result) {
      dataSource.value = res.result.list || [];
      pagination.total = res.result.total || 0;
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
    const res = await getCiticAccountList({ page: 1, pageSize: 100 });
    if (res.result) {
      accountList.value = res.result.list || [];
    }
  } catch (error) {
    console.error('获取账户列表失败', error);
  }
}

function updateStats() {
  stats.todayCount = dataSource.value.length;
  stats.todayAmount = dataSource.value.reduce((sum: number, item: any) => sum + Number(item.shareAmount || 0), 0).toFixed(2);
  stats.monthAmount = dataSource.value.reduce((sum: number, item: any) => sum + Number(item.shareAmount || 0), 0).toFixed(2);
  const successCount = dataSource.value.filter((item: any) => item.status === 1).length;
  stats.successRate = dataSource.value.length > 0 ? ((successCount / dataSource.value.length) * 100).toFixed(1) as any : 100;
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.accountNo = '';
  searchForm.orderNo = '';
  searchForm.shareType = undefined;
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openShareModal(record?: any) {
  if (record) {
    currentRecord.value = record;
  }
  Object.assign(shareForm, {
    orderNo: '',
    accountNo: '',
    orderAmount: 0,
    receivers: [{ accountNo: '', shareType: 1 as 1 | 2, shareRate: 0, shareAmount: 0 }],
    remark: '',
  });
  shareVisible.value = true;
}

async function handleShare() {
  if (!shareForm.accountNo) {
    message.error('请选择分账账户');
    return;
  }
  if (shareForm.orderAmount <= 0) {
    message.error('请输入正确的原交易金额');
    return;
  }
  const validReceivers = shareForm.receivers.filter(r => r.accountNo);
  if (validReceivers.length === 0) {
    message.error('请至少添加一个接收方');
    return;
  }

  submitLoading.value = true;
  try {
    for (const receiver of validReceivers) {
      const shareAmount = receiver.shareType === 1
        ? shareForm.orderAmount * (receiver.shareRate / 100)
        : receiver.shareAmount;

      if (shareAmount <= 0) continue;

      await executeCiticProfitShare({
        orderNo: shareForm.orderNo,
        accountNo: shareForm.accountNo,
        receiverAccountNo: receiver.accountNo,
        shareType: receiver.shareType,
        shareRate: receiver.shareRate,
        shareAmount,
        orderAmount: shareForm.orderAmount,
        remark: shareForm.remark,
      });
    }
    message.success('分账成功');
    shareVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('分账失败');
  } finally {
    submitLoading.value = false;
  }
}

function openDetailModal(record: any) {
  currentRecord.value = record;
  detailVisible.value = true;
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
.citic-profit-share {
  padding: 16px;
  background: #f0f2f5;
}
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.share-no { font-family: 'Consolas', monospace; color: #666; }
.amount-text { color: #f5222d; font-weight: 500; }
.receiver-item {
  padding: 12px;
  margin-bottom: 12px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}
.mb-16 { margin-bottom: 16px; }
</style>
