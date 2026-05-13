<template>
  <div class="agent-list">
    <Card>
      <!-- 搜索表单 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="代理商号">
          <Input v-model:value="searchForm.agentNo" placeholder="请输入代理商号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="代理商名称">
          <Input v-model:value="searchForm.agentName" placeholder="请输入代理商名称" allow-clear style="width: 160px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear style="width: 100px">
            <SelectOption :value="1">正常</SelectOption>
            <SelectOption :value="0">待审核</SelectOption>
            <SelectOption :value="2">冻结</SelectOption>
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
          <Statistic title="代理商总数" :value="stats.totalAgent" />
        </Col>
        <Col :span="6">
          <Statistic title="活跃代理商" :value="stats.activeAgent" :value-style="{ color: '#52c41a' }" />
        </Col>
        <Col :span="6">
          <Statistic title="名下商户" :value="stats.totalMerchant" />
        </Col>
        <Col :span="6">
          <Statistic title="累计分润" :value="stats.totalProfit" :precision="2" prefix="¥" :value-style="{ color: '#f5222d' }" />
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openAddModal">
            <template #icon><PlusOutlined /></template>
            新增代理商
          </Button>
          <Button @click="handleExport">导出</Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 代理商列表 -->
      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: 1400 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'agentNo'">
            <a @click="openDetailModal(record)">{{ record.agentNo }}</a>
          </template>
          <template v-else-if="column.key === 'agentType'">
            <Tag :color="record.agentType === 1 ? 'blue' : 'green'">
              {{ record.agentType === 1 ? '一级代理' : '二级代理' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="getStatusBadge(record.status)" />
            <span>{{ record.statusName }}</span>
          </template>
          <template v-else-if="column.key === 'profitRate'">
            {{ (record.profitRate * 100).toFixed(1) }}%
          </template>
          <template v-else-if="column.key === 'totalProfit'">
            <span style="color: #f5222d">¥{{ record.totalProfit }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="openEditModal(record)">编辑</Button>
              <Dropdown>
                <Button type="link" size="small">更多</Button>
                <template #overlay>
                  <Menu @click="({ key }) => handleMenuClick(key, record)">
                    <MenuItem key="profit">分润记录</MenuItem>
                    <MenuItem key="enable" v-if="record.status !== 1">启用</MenuItem>
                    <MenuItem key="disable" v-if="record.status === 1">禁用</MenuItem>
                  </Menu>
                </template>
              </Dropdown>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="代理商详情"
      width="700px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="代理商号">{{ currentRecord.agentNo }}</DescriptionsItem>
        <DescriptionsItem label="代理商名称">{{ currentRecord.agentName }}</DescriptionsItem>
        <DescriptionsItem label="代理类型">
          <Tag :color="currentRecord.agentType === 1 ? 'blue' : 'green'">
            {{ currentRecord.agentType === 1 ? '一级代理' : '二级代理' }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="上级代理">{{ currentRecord.parentAgentNo || '-' }}</DescriptionsItem>
        <DescriptionsItem label="联系人">{{ currentRecord.contactName }}</DescriptionsItem>
        <DescriptionsItem label="联系电话">{{ currentRecord.contactMobile }}</DescriptionsItem>
        <DescriptionsItem label="邮箱">{{ currentRecord.email || '-' }}</DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="getStatusBadge(currentRecord.status)" />
          {{ currentRecord.statusName }}
        </DescriptionsItem>
        <DescriptionsItem label="名下商户">{{ currentRecord.totalMerchant }}</DescriptionsItem>
        <DescriptionsItem label="累计分润">
          <span style="color: #f5222d">¥{{ currentRecord.totalProfit }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="账户余额">
          <span style="color: #f5222d">¥{{ currentRecord.balance }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createdAt }}</DescriptionsItem>
      </Descriptions>
    </Modal>

    <!-- 新增/编辑弹窗 -->
    <Modal
      v-model:open="formVisible"
      :title="formMode === 'add' ? '新增代理商' : '编辑代理商'"
      width="600px"
      @ok="handleFormSubmit"
    >
      <Form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="formRules" ref="formRef">
        <FormItem label="代理商名称" name="agentName">
          <Input v-model:value="formData.agentName" placeholder="请输入代理商名称" />
        </FormItem>
        <FormItem label="代理类型" name="agentType">
          <RadioGroup v-model:value="formData.agentType">
            <Radio :value="1">一级代理</Radio>
            <Radio :value="2">二级代理</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="上级代理" v-if="formData.agentType === 2" name="parentAgentNo">
          <Select v-model:value="formData.parentAgentNo" placeholder="请选择上级代理商" allow-clear>
            <SelectOption v-for="agent in parentAgents" :key="agent.agentNo" :value="agent.agentNo">
              {{ agent.agentName }} ({{ agent.agentNo }})
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="联系人" name="contactName">
          <Input v-model:value="formData.contactName" placeholder="请输入联系人" />
        </FormItem>
        <FormItem label="联系电话" name="contactMobile">
          <Input v-model:value="formData.contactMobile" placeholder="请输入联系电话" />
        </FormItem>
        <FormItem label="邮箱" name="email">
          <Input v-model:value="formData.email" placeholder="请输入邮箱" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Badge, Row, Col, Statistic, Dropdown, Menu, MenuItem, Modal, Descriptions, DescriptionsItem, RadioGroup, Radio } from 'ant-design-vue';
import { SearchOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';

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
  agentNo: '',
  agentName: '',
  status: undefined as number | undefined,
});

const stats = reactive({
  totalAgent: 0,
  activeAgent: 0,
  totalMerchant: 0,
  totalProfit: 0,
});

const columns = [
  { title: '代理商号', dataIndex: 'agentNo', key: 'agentNo', width: 120 },
  { title: '代理商名称', dataIndex: 'agentName', key: 'agentName', width: 150 },
  { title: '代理类型', key: 'agentType', width: 100 },
  { title: '上级代理', dataIndex: 'parentAgentNo', key: 'parentAgentNo', width: 120 },
  { title: '联系人', dataIndex: 'contactName', key: 'contactName', width: 100 },
  { title: '联系电话', dataIndex: 'contactMobile', key: 'contactMobile', width: 130 },
  { title: '名下商户', dataIndex: 'totalMerchant', key: 'totalMerchant', width: 100 },
  { title: '累计分润', key: 'totalProfit', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

// 新增/编辑
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const parentAgents = ref<any[]>([]);
const formData = reactive({
  agentName: '',
  agentType: 1,
  parentAgentNo: '',
  contactName: '',
  contactMobile: '',
  email: '',
});
const formRules = {
  agentName: [{ required: true, message: '请输入代理商名称' }],
  agentType: [{ required: true, message: '请选择代理类型' }],
  contactName: [{ required: true, message: '请输入联系人' }],
  contactMobile: [{ required: true, message: '请输入联系电话' }],
};

function getStatusBadge(status: number) {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'error' };
  return map[status] || 'default';
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.agentNo) params.agentNo = searchForm.agentNo;
    if (searchForm.agentName) params.agentName = searchForm.agentName;
    if (searchForm.status !== undefined) params.status = searchForm.status;

    const res = await defHttp.get({ url: '/basic-api/agent/list', params });
    if (res) {
      dataSource.value = res.list || [];
      pagination.total = res.total || 0;
    }
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const res = await defHttp.get({ url: '/basic-api/agent/stats' });
    if (res) {
      Object.assign(stats, res);
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
  searchForm.agentNo = '';
  searchForm.agentName = '';
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openDetailModal(record: any) {
  currentRecord.value = record;
  detailVisible.value = true;
}

function openAddModal() {
  formMode.value = 'add';
  Object.assign(formData, {
    agentName: '',
    agentType: 1,
    parentAgentNo: '',
    contactName: '',
    contactMobile: '',
    email: '',
  });
  formVisible.value = true;
}

function openEditModal(record: any) {
  formMode.value = 'edit';
  currentRecord.value = record;
  Object.assign(formData, {
    agentName: record.agentName,
    agentType: record.agentType,
    parentAgentNo: record.parentAgentNo || '',
    contactName: record.contactName,
    contactMobile: record.contactMobile,
    email: record.email,
  });
  formVisible.value = true;
}

async function handleFormSubmit() {
  try {
    message.success(formMode.value === 'add' ? '新增成功' : '编辑成功');
    formVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('操作失败');
  }
}

function handleMenuClick(key: string, record: any) {
  switch (key) {
    case 'profit':
      message.info('分润记录功能开发中');
      break;
    case 'enable':
      message.success('启用成功');
      fetchData();
      break;
    case 'disable':
      message.success('禁用成功');
      fetchData();
      break;
  }
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
.agent-list {
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
