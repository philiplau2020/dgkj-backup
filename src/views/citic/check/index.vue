<template>
  <div class="citic-check">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="对账日期">
          <DatePicker v-model:value="searchForm.checkDate" style="width: 130px" />
        </FormItem>
        <FormItem label="日期范围">
          <RangePicker v-model:value="dateRange" style="width: 240px" />
        </FormItem>
        <FormItem label="渠道">
          <Select v-model:value="searchForm.channel" allow-clear style="width: 150px">
            <SelectOption value="CITIC_QR">中信银行扫码</SelectOption>
            <SelectOption value="WX_QR">微信扫码</SelectOption>
            <SelectOption value="ALI_QR">支付宝扫码</SelectOption>
            <SelectOption value="CT_QR">通联扫码</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 110px">
            <SelectOption :value="0">未对账</SelectOption>
            <SelectOption :value="1">有差异</SelectOption>
            <SelectOption :value="2">已平账</SelectOption>
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
          <Card size="small" class="stat-card">
            <Statistic title="对账单总数" :value="stats.totalCount" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small" class="stat-card">
            <Statistic title="已平账" :value="stats.settledCount" :value-style="{ color: '#52c41a' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small" class="stat-card">
            <Statistic title="有差异" :value="stats.diffCount" :value-style="{ color: '#f5222d' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small" class="stat-card">
            <Statistic 
              title="差异总金额" 
              :value="Number(stats.diffAmount)" 
              :precision="2" 
              prefix="¥" 
              :value-style="{ color: '#f5222d' }" 
            />
          </Card>
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="handleCheck">
            <template #icon><AuditOutlined /></template>
            发起对账
          </Button>
          <Button @click="handleDownload">
            <template #icon><DownloadOutlined /></template>
            下载对账单
          </Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 对账列表 -->
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
          <template v-if="column.key === 'checkNo'">
            <a @click="openDetailModal(record)">{{ record.checkNo }}</a>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="getStatusColor(record.status)">
              {{ record.statusName }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'totalAmount'">
            <span class="amount-text">¥{{ record.totalAmount }}</span>
          </template>
          <template v-else-if="column.key === 'successAmount'">
            <span class="success-amount">¥{{ record.successAmount }}</span>
          </template>
          <template v-else-if="column.key === 'diffCount'">
            <span :style="{ color: record.diffCount > 0 ? '#f5222d' : '#52c41a' }">
              {{ record.diffCount }}
            </span>
          </template>
          <template v-else-if="column.key === 'diffAmount'">
            <span :style="{ color: Number(record.diffAmount) > 0 ? '#f5222d' : '#52c41a' }">
              {{ Number(record.diffAmount) > 0 ? '+' : '' }}¥{{ record.diffAmount }}
            </span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="handleConfirmDiff(record)" v-if="record.diffCount > 0">
                确认差异
              </Button>
              <Button type="link" size="small" @click="handleRecheck(record)" v-if="record.status === 1">
                重新对账
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="对账详情"
      width="900px"
      :footer="null"
    >
      <Descriptions :column="3" bordered v-if="currentRecord">
        <DescriptionsItem label="对账单号" :span="2">{{ currentRecord.checkNo }}</DescriptionsItem>
        <DescriptionsItem label="对账日期">{{ currentRecord.checkDate }}</DescriptionsItem>
        <DescriptionsItem label="渠道">{{ currentRecord.channelName }}</DescriptionsItem>
        <DescriptionsItem label="状态">
          <Tag :color="getStatusColor(currentRecord.status)">
            {{ currentRecord.statusName }}
          </Tag>
        </DescriptionsItem>
      </Descriptions>

      <!-- 统计概览 -->
      <Row :gutter="16" class="detail-stat-row">
        <Col :span="6">
          <Card size="small">
            <Statistic title="总笔数" :value="currentRecord?.totalCount || 0" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="总金额" :value="Number(currentRecord?.totalAmount || 0)" :precision="2" prefix="¥" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="成功笔数" :value="currentRecord?.successCount || 0" suffix="/" />
            <span class="sub-text">总笔数</span>
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="成功金额" :value="Number(currentRecord?.successAmount || 0)" :precision="2" prefix="¥" />
          </Card>
        </Col>
      </Row>

      <Row :gutter="16" class="detail-stat-row">
        <Col :span="6">
          <Card size="small">
            <Statistic title="退款笔数" :value="currentRecord?.refundCount || 0" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="退款金额" :value="Number(currentRecord?.refundAmount || 0)" :precision="2" prefix="¥" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="差异笔数" :value="currentRecord?.diffCount || 0" :value-style="{ color: currentRecord?.diffCount > 0 ? '#f5222d' : '#52c41a' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="差异金额" :value="Number(currentRecord?.diffAmount || 0)" :precision="2" prefix="¥" :value-style="{ color: Number(currentRecord?.diffAmount || 0) > 0 ? '#f5222d' : '#52c41a' }" />
          </Card>
        </Col>
      </Row>

      <!-- 差异明细 -->
      <Divider>差异明细</Divider>
      <Table
        :data-source="diffDetails"
        :columns="diffColumns"
        :pagination="diffPagination"
        :loading="diffLoading"
        @change="handleDiffTableChange"
        size="small"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'amount'">
            <span class="amount-text">¥{{ record.amount }}</span>
          </template>
          <template v-else-if="column.key === 'diffAmount'">
            <span :style="{ color: Number(record.diffAmount) > 0 ? '#f5222d' : '#52c41a' }">
              {{ Number(record.diffAmount) > 0 ? '+' : '' }}¥{{ record.diffAmount }}
            </span>
          </template>
          <template v-else-if="column.key === 'diffType'">
            <Tag :color="record.diffType === 1 ? 'orange' : 'cyan'">
              {{ record.diffTypeName }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'handleStatus'">
            <Badge :status="record.handleStatus === 1 ? 'success' : 'warning'" :text="record.handleStatusName" />
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="handleHandleDiff(record)" v-if="record.handleStatus === 0">
              处理
            </Button>
            <span v-else class="handled-text">已处理</span>
          </template>
        </template>
      </Table>

      <div class="detail-footer">
        <span>创建时间: {{ currentRecord?.createdAt }}</span>
      </div>
    </Modal>

    <!-- 确认差异弹窗 -->
    <Modal
      v-model:open="confirmVisible"
      title="确认差异"
      width="500px"
      @ok="handleConfirmSubmit"
      :confirm-loading="submitLoading"
    >
      <Alert type="warning" show-icon class="mb-16">
        <template #message>差异确认</template>
        <template #description>
          请确认以下差异数据，确认后将记录为已确认差异。
        </template>
      </Alert>
      <Form :model="confirmForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="对账单号">{{ currentRecord?.checkNo }}</FormItem>
        <FormItem label="差异笔数">{{ currentRecord?.diffCount }}</FormItem>
        <FormItem label="差异金额">
          <span :style="{ color: '#f5222d' }">¥{{ currentRecord?.diffAmount }}</span>
        </FormItem>
        <FormItem label="处理方式">
          <RadioGroup v-model:value="confirmForm.handleType">
            <Radio :value="1">长款(平台多)</Radio>
            <Radio :value="2">短款(通道多)</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="差异原因">
          <Select v-model:value="confirmForm.reason" placeholder="请选择差异原因" style="width: 100%">
            <SelectOption value="重复退款">重复退款</SelectOption>
            <SelectOption value="系统延迟">系统延迟</SelectOption>
            <SelectOption value="数据篡改">数据篡改</SelectOption>
            <SelectOption value="其他">其他</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="备注">
          <Textarea v-model:value="confirmForm.remark" :rows="3" placeholder="请输入处理备注" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 发起对账弹窗 -->
    <Modal
      v-model:open="checkVisible"
      title="发起对账"
      width="450px"
      @ok="handleCheckSubmit"
      :confirm-loading="submitLoading"
    >
      <Form :model="checkForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="对账日期">
          <DatePicker v-model:value="checkForm.checkDate" style="width: 100%" />
        </FormItem>
        <FormItem label="渠道">
          <Select v-model:value="checkForm.channel" placeholder="请选择渠道" style="width: 100%">
            <SelectOption value="">全部渠道</SelectOption>
            <SelectOption value="CITIC_QR">中信银行扫码</SelectOption>
            <SelectOption value="WX_QR">微信扫码</SelectOption>
            <SelectOption value="ALI_QR">支付宝扫码</SelectOption>
            <SelectOption value="CT_QR">通联扫码</SelectOption>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { 
  Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, 
  Tag, Row, Col, Statistic, DatePicker, RangePicker, Modal, Descriptions, 
  DescriptionsItem, Divider, RadioGroup, Radio, Textarea, Alert, Badge, message 
} from 'ant-design-vue';
import { SearchOutlined, AuditOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { getCheckList, confirmCheckDiff, getCheckDiffList, downloadCheckBill, triggerCheck } from '@/api/citic';

const loading = ref(false);
const diffLoading = ref(false);
const submitLoading = ref(false);
const dataSource = ref<any[]>([]);
const diffDetails = ref<any[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const diffPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const searchForm = reactive({
  checkDate: null as any,
  channel: '',
  status: undefined as number | undefined,
});

const dateRange = ref<[any, any] | null>(null);

const stats = reactive({
  totalCount: 0,
  settledCount: 0,
  diffCount: 0,
  diffAmount: '0.00',
});

const columns = [
  { title: '对账单号', dataIndex: 'checkNo', key: 'checkNo', width: 160 },
  { title: '对账日期', dataIndex: 'checkDate', key: 'checkDate', width: 120 },
  { title: '渠道', dataIndex: 'channelName', key: 'channelName', width: 130 },
  { title: '总笔数', dataIndex: 'totalCount', key: 'totalCount', width: 90 },
  { title: '总金额', key: 'totalAmount', width: 130 },
  { title: '成功笔数', dataIndex: 'successCount', key: 'successCount', width: 90 },
  { title: '成功金额', key: 'successAmount', width: 130 },
  { title: '差异笔数', key: 'diffCount', width: 90 },
  { title: '差异金额', key: 'diffAmount', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 180 },
];

const diffColumns = [
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
  { title: '交易金额', key: 'amount', width: 120 },
  { title: '差异类型', key: 'diffType', width: 100 },
  { title: '差异金额', key: 'diffAmount', width: 120 },
  { title: '处理状态', key: 'handleStatus', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '操作', key: 'action', width: 80 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

const confirmVisible = ref(false);
const confirmForm = reactive({
  handleType: 1,
  reason: '',
  remark: '',
});

const checkVisible = ref(false);
const checkForm = reactive({
  checkDate: null as any,
  channel: '',
});

function getStatusColor(status: number) {
  const map: Record<number, string> = { 0: 'default', 1: 'error', 2: 'success' };
  return map[status] || 'default';
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.checkDate) params.checkDate = searchForm.checkDate.format('YYYY-MM-DD');
    if (searchForm.channel) params.channel = searchForm.channel;
    if (searchForm.status !== undefined) params.status = searchForm.status;
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0].format('YYYY-MM-DD');
      params.endDate = dateRange.value[1].format('YYYY-MM-DD');
    }

    const res = await getCheckList(params);
    if (res.result) {
      dataSource.value = res.result.list || [];
      pagination.total = res.result.total || 0;

      // 更新统计
      stats.totalCount = dataSource.value.length;
      stats.settledCount = dataSource.value.filter(item => item.status === 2).length;
      stats.diffCount = dataSource.value.filter(item => item.status === 1).length;
      stats.diffAmount = dataSource.value.reduce((sum: number, item: any) => sum + Number(item.diffAmount), 0).toFixed(2);
    }
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

async function fetchDiffDetails(checkNo: string) {
  diffLoading.value = true;
  try {
    const params = {
      page: diffPagination.current,
      pageSize: diffPagination.pageSize,
    };
    const res = await getCheckDiffList(checkNo, params);
    if (res.result) {
      diffDetails.value = res.result.list || [];
      diffPagination.total = res.result.total || 0;
    }
  } catch (error) {
    console.error('获取差异明细失败', error);
  } finally {
    diffLoading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.checkDate = null;
  searchForm.channel = '';
  searchForm.status = undefined;
  dateRange.value = null;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function handleDiffTableChange(pag: any) {
  diffPagination.current = pag.current;
  diffPagination.pageSize = pag.pageSize;
  if (currentRecord.value) {
    fetchDiffDetails(currentRecord.value.checkNo);
  }
}

function openDetailModal(record: any) {
  currentRecord.value = record;
  diffPagination.current = 1;
  fetchDiffDetails(record.checkNo);
  detailVisible.value = true;
}

function handleConfirmDiff(record: any) {
  currentRecord.value = record;
  confirmForm.handleType = 1;
  confirmForm.reason = '';
  confirmForm.remark = '';
  confirmVisible.value = true;
}

async function handleConfirmSubmit() {
  if (!confirmForm.reason) {
    message.error('请选择差异原因');
    return;
  }
  submitLoading.value = true;
  try {
    await confirmCheckDiff(currentRecord.value.checkNo, {
      diffAmount: currentRecord.value.diffAmount,
      remark: confirmForm.remark,
    });
    message.success('确认成功');
    confirmVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('确认失败');
  } finally {
    submitLoading.value = false;
  }
}

function handleHandleDiff(record: any) {
  message.info('处理差异功能开发中');
}

async function handleRecheck(record: any) {
  try {
    await new Promise((resolve) => {
      Modal.confirm({
        title: '重新对账',
        content: `确定要对 ${record.checkDate} 的数据进行重新对账吗？`,
        okText: '确认',
        cancelText: '取消',
        onOk: resolve,
      });
    });
    message.success('重新对账任务已提交');
  } catch (error) {
    // 用户取消
  }
}

function handleDownload() {
  message.info('下载对账单功能开发中');
}

function openCheckModal() {
  checkForm.checkDate = null;
  checkForm.channel = '';
  checkVisible.value = true;
}

async function handleCheck() {
  openCheckModal();
}

async function handleCheckSubmit() {
  if (!checkForm.checkDate) {
    message.error('请选择对账日期');
    return;
  }
  submitLoading.value = true;
  try {
    await triggerCheck(checkForm.checkDate.format('YYYY-MM-DD'), checkForm.channel);
    message.success('对账任务已提交');
    checkVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('发起对账失败');
  } finally {
    submitLoading.value = false;
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
.citic-check {
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

.table-toolbar {
  margin-bottom: 16px;
}

.amount-text {
  color: #f5222d;
  font-weight: 500;
}

.success-amount {
  color: #52c41a;
  font-weight: 500;
}

.detail-stat-row {
  margin-bottom: 16px;
}

.sub-text {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.detail-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  color: #999;
  font-size: 12px;
}

.mb-16 {
  margin-bottom: 16px;
}

.handled-text {
  color: #52c41a;
}
</style>
