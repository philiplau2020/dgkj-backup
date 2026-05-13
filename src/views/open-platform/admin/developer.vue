<template>
  <div class="developer-admin">
    <Card>
      <!-- 搜索表单 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="开发者名称">
          <Input v-model:value="searchForm.keyword" placeholder="请输入开发者名称" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="开发者等级">
          <Select v-model:value="searchForm.level" placeholder="请选择" allow-clear style="width: 120px">
            <SelectOption value="basic">基础版</SelectOption>
            <SelectOption value="standard">标准版</SelectOption>
            <SelectOption value="professional">专业版</SelectOption>
            <SelectOption value="enterprise">企业版</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" placeholder="请选择" allow-clear style="width: 100px">
            <SelectOption value="active">正常</SelectOption>
            <SelectOption value="inactive">禁用</SelectOption>
            <SelectOption value="pending">待审核</SelectOption>
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

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openAddModal">
            <template #icon><PlusOutlined /></template>
            添加开发者
          </Button>
          <Button @click="handleExport">导出</Button>
        </Space>
      </div>

      <!-- 表格 -->
      <Table 
        :data-source="dataSource" 
        :columns="columns" 
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="developerId"
        :scroll="{ x: 1400 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Badge :status="getStatusBadge(record.status)" />
            <span>{{ getStatusName(record.status) }}</span>
          </template>
          <template v-else-if="column.key === 'level'">
            <Select 
              :value="record.level" 
              style="width: 100px"
              @change="(val) => handleLevelChange(record, val)"
            >
              <SelectOption value="basic">基础版</SelectOption>
              <SelectOption value="standard">标准版</SelectOption>
              <SelectOption value="professional">专业版</SelectOption>
              <SelectOption value="enterprise">企业版</SelectOption>
            </Select>
          </template>
          <template v-else-if="column.key === 'appCount'">
            <Tag color="blue">{{ record.appCount }} 个</Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="openReviewModal(record)" v-if="record.status === 'pending'">审核</Button>
              <Button type="link" size="small" @click="toggleStatus(record)">
                {{ record.status === 'active' ? '禁用' : '启用' }}
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="开发者详情"
      width="700px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="开发者ID" :span="2">{{ currentRecord.developerId }}</DescriptionsItem>
        <DescriptionsItem label="开发者名称">{{ currentRecord.developerName }}</DescriptionsItem>
        <DescriptionsItem label="用户名称">{{ currentRecord.username }}</DescriptionsItem>
        <DescriptionsItem label="邮箱">{{ currentRecord.email }}</DescriptionsItem>
        <DescriptionsItem label="手机号">{{ currentRecord.mobile }}</DescriptionsItem>
        <DescriptionsItem label="等级">
          <Tag :color="levelColorMap[currentRecord.level]">{{ levelNameMap[currentRecord.level] }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="getStatusBadge(currentRecord.status)" />
          {{ getStatusName(currentRecord.status) }}
        </DescriptionsItem>
        <DescriptionsItem label="应用数量">{{ currentRecord.appCount }} 个</DescriptionsItem>
        <DescriptionsItem label="日调用配额">{{ currentRecord.dailyQuota || 100000 }}</DescriptionsItem>
        <DescriptionsItem label="注册时间">{{ currentRecord.createTime }}</DescriptionsItem>
        <DescriptionsItem label="最近登录">{{ currentRecord.lastLoginTime || '-' }}</DescriptionsItem>
        <DescriptionsItem label="备注" :span="2">{{ currentRecord.remark || '-' }}</DescriptionsItem>
      </Descriptions>
    </Modal>

    <!-- 审核弹窗 -->
    <Modal
      v-model:open="reviewVisible"
      title="审核开发者"
      @ok="handleReview"
      :confirm-loading="reviewLoading"
    >
      <Form :model="reviewForm" layout="vertical">
        <FormItem label="审核结果">
          <RadioGroup v-model:value="reviewForm.status">
            <Radio value="active">通过</Radio>
            <Radio value="rejected">拒绝</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="备注">
          <Input.TextArea v-model:value="reviewForm.remark" :rows="3" placeholder="请输入审核备注" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Badge, Modal, Descriptions, DescriptionsItem, Radio, RadioGroup, message } from 'ant-design-vue';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons-vue';

interface DeveloperRecord {
  developerId: string;
  developerName: string;
  username: string;
  email: string;
  mobile: string;
  level: string;
  status: string;
  appCount: number;
  dailyQuota?: number;
  createTime: string;
  lastLoginTime?: string;
  remark?: string;
}

const loading = ref(false);
const dataSource = ref<DeveloperRecord[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  keyword: '',
  level: undefined as string | undefined,
  status: undefined as string | undefined,
});

const columns = [
  { title: '开发者ID', dataIndex: 'developerId', key: 'developerId', width: 150 },
  { title: '开发者名称', dataIndex: 'developerName', key: 'developerName', width: 150 },
  { title: '用户名称', dataIndex: 'username', key: 'username', width: 120 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 180 },
  { title: '等级', key: 'level', width: 120 },
  { title: '应用数', key: 'appCount', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '注册时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' as const },
];

const levelColorMap: Record<string, string> = {
  basic: 'default',
  standard: 'blue',
  professional: 'purple',
  enterprise: 'gold',
};

const levelNameMap: Record<string, string> = {
  basic: '基础版',
  standard: '标准版',
  professional: '专业版',
  enterprise: '企业版',
};

const detailVisible = ref(false);
const currentRecord = ref<DeveloperRecord | null>(null);

const reviewVisible = ref(false);
const reviewLoading = ref(false);
const reviewForm = reactive({
  status: 'active' as 'active' | 'rejected',
  remark: '',
});

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'success',
    inactive: 'error',
    pending: 'warning',
  };
  return map[status] || 'default';
}

function getStatusName(status: string) {
  const map: Record<string, string> = {
    active: '正常',
    inactive: '禁用',
    pending: '待审核',
  };
  return map[status] || status;
}

async function fetchData() {
  loading.value = true;
  try {
    // 模拟数据
    dataSource.value = [
      { developerId: 'DEV001', developerName: '某某科技', username: 'user001', email: 'dev1@example.com', mobile: '13800138001', level: 'professional', status: 'active', appCount: 5, dailyQuota: 100000, createTime: '2024-01-01 10:00:00', lastLoginTime: '2024-01-15 14:30:00' },
      { developerId: 'DEV002', developerName: '某支付公司', username: 'user002', email: 'dev2@example.com', mobile: '13800138002', level: 'enterprise', status: 'active', appCount: 10, dailyQuota: 500000, createTime: '2024-01-02 14:30:00', lastLoginTime: '2024-01-15 16:00:00' },
      { developerId: 'DEV003', developerName: '测试商户', username: 'user003', email: 'dev3@example.com', mobile: '13800138003', level: 'basic', status: 'pending', appCount: 0, dailyQuota: 10000, createTime: '2024-01-03 09:15:00' },
      { developerId: 'DEV004', developerName: '商户A', username: 'user004', email: 'dev4@example.com', mobile: '13800138004', level: 'standard', status: 'inactive', appCount: 2, dailyQuota: 50000, createTime: '2024-01-04 11:00:00' },
    ];
    pagination.total = dataSource.value.length;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.keyword = '';
  searchForm.level = undefined;
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openAddModal() {
  message.info('添加开发者功能开发中');
}

function openDetailModal(record: DeveloperRecord) {
  currentRecord.value = record;
  detailVisible.value = true;
}

function openReviewModal(record: DeveloperRecord) {
  currentRecord.value = record;
  reviewForm.status = 'active';
  reviewForm.remark = '';
  reviewVisible.value = true;
}

async function handleReview() {
  reviewLoading.value = true;
  try {
    message.success('审核成功');
    reviewVisible.value = false;
    fetchData();
  } finally {
    reviewLoading.value = false;
  }
}

async function handleLevelChange(record: DeveloperRecord, level: string) {
  try {
    record.level = level;
    message.success('等级修改成功');
  } catch (error) {
    message.error('修改失败');
  }
}

async function toggleStatus(record: DeveloperRecord) {
  const newStatus = record.status === 'active' ? 'inactive' : 'active';
  try {
    record.status = newStatus;
    message.success(newStatus === 'active' ? '已启用' : '已禁用');
  } catch (error) {
    message.error('操作失败');
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
.developer-admin {
  padding: 16px;
  background: #f0f2f5;
}

.search-form {
  margin-bottom: 16px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
</style>
