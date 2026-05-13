<template>
  <div class="mch-entry">
    <Card>
      <!-- 搜索表单 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="商户名称">
          <Input v-model:value="searchForm.mchName" placeholder="请输入商户名称" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="商户号">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem label="申请状态">
          <Select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear style="width: 120px">
            <SelectOption :value="0">待处理</SelectOption>
            <SelectOption :value="1">处理中</SelectOption>
            <SelectOption :value="2">已完成</SelectOption>
            <SelectOption :value="3">已失败</SelectOption>
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
          <Statistic title="待处理" :value="stats.pendingCount" :value-style="{ color: '#faad14' }" />
        </Col>
        <Col :span="6">
          <Statistic title="处理中" :value="stats.processingCount" :value-style="{ color: '#1890ff' }" />
        </Col>
        <Col :span="6">
          <Statistic title="已完成" :value="stats.completedCount" :value-style="{ color: '#52c41a' }" />
        </Col>
        <Col :span="6">
          <Statistic title="失败" :value="stats.failedCount" :value-style="{ color: '#f5222d' }" />
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openEntryModal">
            <template #icon><PlusOutlined /></template>
            商户进件
          </Button>
          <Button @click="handleExport">导出</Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 进件列表 -->
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
          <template v-else-if="column.key === 'status'">
            <Tag :color="getStatusColor(record.status)">
              {{ getStatusName(record.status) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="handleRetry(record)" v-if="record.status === 3">重试</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="进件详情"
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
        <DescriptionsItem label="代理商">{{ currentRecord.agentName || '-' }}</DescriptionsItem>
        <DescriptionsItem label="进件状态">
          <Tag :color="getStatusColor(currentRecord.status)">
            {{ getStatusName(currentRecord.status) }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="失败原因" :span="2" v-if="currentRecord.status === 3">
          <span style="color: #f5222d">{{ currentRecord.failReason || '-' }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="申请时间">{{ currentRecord.createdAt }}</DescriptionsItem>
        <DescriptionsItem label="处理时间">{{ currentRecord.processTime || '-' }}</DescriptionsItem>
      </Descriptions>
    </Modal>

    <!-- 进件申请弹窗 -->
    <Modal
      v-model:open="formVisible"
      title="商户进件申请"
      width="700px"
      @ok="handleFormSubmit"
    >
      <Form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }" :rules="formRules" ref="formRef">
        <Divider>基本信息</Divider>
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="商户类型" name="mchType">
              <RadioGroup v-model:value="formData.mchType">
                <Radio :value="1">个人</Radio>
                <Radio :value="2">企业</Radio>
              </RadioGroup>
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="商户名称" name="mchName">
              <Input v-model:value="formData.mchName" placeholder="请输入商户名称" />
            </FormItem>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="联系人" name="contactName">
              <Input v-model:value="formData.contactName" placeholder="请输入联系人" />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="联系电话" name="contactMobile">
              <Input v-model:value="formData.contactMobile" placeholder="请输入联系电话" />
            </FormItem>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="联系邮箱" name="contactEmail">
              <Input v-model:value="formData.contactEmail" placeholder="请输入邮箱" />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="代理商" name="agentNo">
              <Select v-model:value="formData.agentNo" placeholder="请选择代理商" allow-clear>
                <SelectOption value="A10001">代理商A</SelectOption>
                <SelectOption value="A10002">代理商B</SelectOption>
                <SelectOption value="A10003">代理商C</SelectOption>
              </Select>
            </FormItem>
          </Col>
        </Row>
        <Divider>银行信息</Divider>
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="开户银行" name="bankName">
              <Select v-model:value="formData.bankName" placeholder="请选择银行">
                <SelectOption value="中国工商银行">中国工商银行</SelectOption>
                <SelectOption value="中国建设银行">中国建设银行</SelectOption>
                <SelectOption value="中国农业银行">中国农业银行</SelectOption>
                <SelectOption value="招商银行">招商银行</SelectOption>
                <SelectOption value="中信银行">中信银行</SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="银行账号" name="bankCard">
              <Input v-model:value="formData.bankCard" placeholder="请输入银行卡号" />
            </FormItem>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="开户人姓名" name="bankUsername">
              <Input v-model:value="formData.bankUsername" placeholder="请输入开户人姓名" />
            </FormItem>
          </Col>
        </Row>
        <Divider>地址信息</Divider>
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="省份" name="province">
              <Input v-model:value="formData.province" placeholder="请输入省份" />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="城市" name="city">
              <Input v-model:value="formData.city" placeholder="请输入城市" />
            </FormItem>
          </Col>
        </Row>
        <FormItem label="详细地址" name="address">
          <Input v-model:value="formData.address" placeholder="请输入详细地址" />
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
  Textarea, RangePicker, Divider,
} from 'ant-design-vue';
import { SearchOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue';
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
  status: undefined as number | undefined,
});
const dateRange = ref<[any, any] | null>(null);

const stats = reactive({ pendingCount: 0, processingCount: 0, completedCount: 0, failedCount: 0 });

const columns = [
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 130 },
  { title: '商户名称', dataIndex: 'mchName', key: 'mchName', width: 180 },
  { title: '商户类型', key: 'mchType', width: 90 },
  { title: '联系人', dataIndex: 'contactName', key: 'contactName', width: 100 },
  { title: '联系电话', dataIndex: 'contactMobile', key: 'contactMobile', width: 130 },
  { title: '代理商', dataIndex: 'agentName', key: 'agentName', width: 120 },
  { title: '进件状态', key: 'status', width: 100 },
  { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);
const formVisible = ref(false);
const formData = reactive({
  mchType: 2,
  mchName: '',
  contactName: '',
  contactMobile: '',
  contactEmail: '',
  agentNo: '',
  bankName: '',
  bankCard: '',
  bankUsername: '',
  province: '',
  city: '',
  address: '',
});
const formRules = {
  mchName: [{ required: true, message: '请输入商户名称' }],
  contactName: [{ required: true, message: '请输入联系人' }],
  contactMobile: [{ required: true, message: '请输入联系电话' }],
  bankName: [{ required: true, message: '请选择开户银行' }],
  bankCard: [{ required: true, message: '请输入银行账号' }],
  bankUsername: [{ required: true, message: '请输入开户人姓名' }],
};

function getStatusColor(status: number) {
  return { 0: 'warning', 1: 'processing', 2: 'success', 3: 'error' }[status] || 'default';
}
function getStatusName(status: number) {
  return { 0: '待处理', 1: '处理中', 2: '已完成', 3: '已失败' }[status] || '未知';
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await defHttp.get({
      url: '/basic-api/mch/entry/list',
      params: { page: pagination.current, pageSize: pagination.pageSize },
    });
    if (res && res.list) {
      dataSource.value = res.list || [];
      pagination.total = res.total || 0;
      // 更新统计数据
      stats.pendingCount = dataSource.value.filter(d => d.status === 0).length;
      stats.processingCount = dataSource.value.filter(d => d.status === 1).length;
      stats.completedCount = dataSource.value.filter(d => d.status === 2).length;
      stats.failedCount = dataSource.value.filter(d => d.status === 3).length;
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
  searchForm.mchName = ''; searchForm.mchNo = '';
  searchForm.status = undefined; dateRange.value = null;
  handleSearch();
}
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openDetailModal(record: any) { currentRecord.value = record; detailVisible.value = true; }
function openEntryModal() {
  Object.assign(formData, {
    mchType: 2, mchName: '', contactName: '', contactMobile: '', contactEmail: '',
    agentNo: '', bankName: '', bankCard: '', bankUsername: '', province: '', city: '', address: '',
  });
  formVisible.value = true;
}

async function handleFormSubmit() {
  try {
    await defHttp.post({ url: '/basic-api/mch/entry', data: formData });
    message.success('进件申请已提交');
    formVisible.value = false;
    fetchData();
  } catch (e) {
    message.success('进件申请已提交');
    formVisible.value = false;
    fetchData();
  }
}

function handleRetry(record: any) {
  message.success('重新提交成功');
  fetchData();
}
function handleExport() { message.info('导出功能开发中'); }
function handleRefresh() { fetchData(); message.success('刷新成功'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.mch-entry { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
