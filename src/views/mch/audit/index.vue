<template>
  <div class="mch-audit">
    <Card>
      <!-- 搜索表单 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="商户名称">
          <Input v-model:value="searchForm.mchName" placeholder="请输入商户名称" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="商户号">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem label="审核状态">
          <Select v-model:value="searchForm.auditStatus" placeholder="请选择状态" allow-clear style="width: 120px">
            <SelectOption :value="0">待审核</SelectOption>
            <SelectOption :value="1">已通过</SelectOption>
            <SelectOption :value="2">已拒绝</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="申请时间">
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
          <Statistic title="待审核" :value="stats.pendingCount" :value-style="{ color: '#faad14' }" />
        </Col>
        <Col :span="6">
          <Statistic title="已通过" :value="stats.passedCount" :value-style="{ color: '#52c41a' }" />
        </Col>
        <Col :span="6">
          <Statistic title="已拒绝" :value="stats.rejectedCount" :value-style="{ color: '#f5222d' }" />
        </Col>
        <Col :span="6">
          <Statistic title="审核通过率" :value="stats.passRate" suffix="%" :value-style="{ color: '#1890ff' }" />
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

      <!-- 审核列表 -->
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
          <template v-if="column.key === 'mchNo'">
            <a @click="openDetailModal(record)">{{ record.mchNo }}</a>
          </template>
          <template v-else-if="column.key === 'mchType'">
            <Tag :color="record.mchType === 1 ? 'blue' : 'green'">
              {{ record.mchType === 1 ? '个人' : '企业' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'auditStatus'">
            <Tag :color="getAuditColor(record.auditStatus)">
              {{ getAuditStatusName(record.auditStatus) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="openAuditModal(record)" v-if="record.auditStatus === 0">审核</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="商户审核详情"
      width="800px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="商户号" :span="2">{{ currentRecord.mchNo }}</DescriptionsItem>
        <DescriptionsItem label="商户名称">{{ currentRecord.mchName }}</DescriptionsItem>
        <DescriptionsItem label="商户类型">
          <Tag :color="currentRecord.mchType === 1 ? 'blue' : 'green'">
            {{ currentRecord.mchType === 1 ? '个人' : '企业' }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="联系人">{{ currentRecord.contactName }}</DescriptionsItem>
        <DescriptionsItem label="联系电话">{{ currentRecord.contactMobile }}</DescriptionsItem>
        <DescriptionsItem label="联系邮箱">{{ currentRecord.contactEmail || '-' }}</DescriptionsItem>
        <DescriptionsItem label="开户银行">{{ currentRecord.bankName || '-' }}</DescriptionsItem>
        <DescriptionsItem label="银行账号">{{ currentRecord.bankCard || '-' }}</DescriptionsItem>
        <DescriptionsItem label="省份">{{ currentRecord.province || '-' }}</DescriptionsItem>
        <DescriptionsItem label="城市">{{ currentRecord.city || '-' }}</DescriptionsItem>
        <DescriptionsItem label="详细地址" :span="2">{{ currentRecord.address || '-' }}</DescriptionsItem>
        <DescriptionsItem label="审核状态">
          <Tag :color="getAuditColor(currentRecord.auditStatus)">
            {{ getAuditStatusName(currentRecord.auditStatus) }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="申请时间">{{ currentRecord.createdAt }}</DescriptionsItem>
        <DescriptionsItem label="审核备注" :span="2">{{ currentRecord.auditRemark || '-' }}</DescriptionsItem>
      </Descriptions>
    </Modal>

    <!-- 审核弹窗 -->
    <Modal
      v-model:open="auditVisible"
      title="商户审核"
      width="500px"
      @ok="handleAuditSubmit"
    >
      <Form :model="auditForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" ref="auditFormRef">
        <FormItem label="商户号">
          <Input :value="currentRecord?.mchNo" disabled />
        </FormItem>
        <FormItem label="商户名称">
          <Input :value="currentRecord?.mchName" disabled />
        </FormItem>
        <FormItem label="审核结果" name="auditStatus">
          <RadioGroup v-model:value="auditForm.auditStatus">
            <Radio :value="1">通过</Radio>
            <Radio :value="2">拒绝</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="审核备注" name="auditRemark">
          <Textarea v-model:value="auditForm.auditRemark" :rows="3" placeholder="请输入审核备注" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag,
  Row, Col, Statistic, Modal, Descriptions, DescriptionsItem, RadioGroup, Radio,
  Textarea, RangePicker,
} from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({
  current: 1, pageSize: 10, total: 0,
  showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  mchName: '',
  mchNo: '',
  auditStatus: undefined as number | undefined,
});
const dateRange = ref<[any, any] | null>(null);

const stats = reactive({
  pendingCount: 0, passedCount: 0, rejectedCount: 0, passRate: 0,
});

const columns = [
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 130 },
  { title: '商户名称', dataIndex: 'mchName', key: 'mchName', width: 180 },
  { title: '商户类型', key: 'mchType', width: 90 },
  { title: '联系人', dataIndex: 'contactName', key: 'contactName', width: 100 },
  { title: '联系电话', dataIndex: 'contactMobile', key: 'contactMobile', width: 130 },
  { title: '代理商', dataIndex: 'agentName', key: 'agentName', width: 120 },
  { title: '审核状态', key: 'auditStatus', width: 100 },
  { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);
const auditVisible = ref(false);
const auditForm = reactive({ auditStatus: 1, auditRemark: '' });

function getAuditColor(status: number) {
  return { 0: 'warning', 1: 'success', 2: 'error' }[status] || 'default';
}

function getAuditStatusName(status: number) {
  return { 0: '待审核', 1: '已通过', 2: '已拒绝' }[status] || '未知';
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.mchName) params.mchName = searchForm.mchName;
    if (searchForm.mchNo) params.mchNo = searchForm.mchNo;
    if (searchForm.auditStatus !== undefined) params.auditStatus = searchForm.auditStatus;

    const res = await defHttp.get({ url: '/basic-api/mch/audit/list', params });
    if (res) {
      dataSource.value = res.list || [];
      pagination.total = res.total || 0;
      // 更新统计数据
      stats.pendingCount = dataSource.value.filter(d => d.auditStatus === 0).length;
      stats.passedCount = dataSource.value.filter(d => d.auditStatus === 1).length;
      stats.rejectedCount = dataSource.value.filter(d => d.auditStatus === 2).length;
      const total = stats.pendingCount + stats.passedCount + stats.rejectedCount;
      stats.passRate = total > 0 ? Math.round((stats.passedCount / total) * 100) : 0;
    } else {
      dataSource.value = [];
      pagination.total = 0;
    }
  } catch (e) {
    dataSource.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() {
  searchForm.mchName = '';
  searchForm.mchNo = '';
  searchForm.auditStatus = undefined;
  dateRange.value = null;
  handleSearch();
}
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }

function openDetailModal(record: any) { currentRecord.value = record; detailVisible.value = true; }
function openAuditModal(record: any) {
  currentRecord.value = record;
  auditForm.auditStatus = 1;
  auditForm.auditRemark = '';
  auditVisible.value = true;
}

async function handleAuditSubmit() {
  try {
    await defHttp.post({ url: '/basic-api/mch/audit', data: { mchNo: currentRecord.value?.mchNo, ...auditForm } });
    message.success(auditForm.auditStatus === 1 ? '审核通过' : '已拒绝');
    auditVisible.value = false;
    fetchData();
  } catch (e) {
    message.error('操作失败');
    fetchData();
  }
}

function handleExport() { message.info('导出功能开发中'); }
function handleRefresh() { fetchData(); message.success('刷新成功'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.mch-audit { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
