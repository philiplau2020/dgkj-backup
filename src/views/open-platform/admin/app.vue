<template>
  <div class="app-admin">
    <Card>
      <!-- 搜索表单 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="应用名称">
          <Input v-model:value="searchForm.keyword" placeholder="请输入应用名称" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="应用类型">
          <Select v-model:value="searchForm.appType" placeholder="请选择" allow-clear style="width: 120px">
            <SelectOption value="web">Web</SelectOption>
            <SelectOption value="mobile">移动端</SelectOption>
            <SelectOption value="miniapp">小程序</SelectOption>
            <SelectOption value="api">API</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" placeholder="请选择" allow-clear style="width: 100px">
            <SelectOption value="active">正常</SelectOption>
            <SelectOption value="suspended">暂停</SelectOption>
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
        row-key="appId"
        :scroll="{ x: 1500 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'appId'">
            <Button type="link" size="small" @click="openDetailModal(record)">{{ record.appId }}</Button>
          </template>
          <template v-else-if="column.key === 'appType'">
            <Tag :color="appTypeColorMap[record.appType]">{{ appTypeNameMap[record.appType] }}</Tag>
          </template>
          <template v-else-if="column.key === 'payTypes'">
            <Space wrap>
              <Tag v-for="pt in record.enabledPayTypes" :key="pt" size="small">{{ payTypeNameMap[pt] || pt }}</Tag>
            </Space>
          </template>
          <template v-else-if="column.key === 'quota'">
            <Progress 
              :percent="Math.round(record.todayCallCount / record.dailyQuota * 100)" 
              size="small"
              :status="record.todayCallCount / record.dailyQuota > 0.8 ? 'exception' : 'active'"
            />
            <span class="quota-text">{{ record.todayCallCount }} / {{ record.dailyQuota }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="record.status === 'active' ? 'success' : 'warning'" />
            <span>{{ record.status === 'active' ? '正常' : '暂停' }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="handleToggleStatus(record)">
                {{ record.status === 'active' ? '暂停' : '启用' }}
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="应用详情"
      width="800px"
      :footer="null"
    >
      <Tabs v-if="currentRecord">
        <TabPane key="basic" tab="基本信息">
          <Descriptions :column="2" bordered>
            <DescriptionsItem label="应用ID">{{ currentRecord.appId }}</DescriptionsItem>
            <DescriptionsItem label="应用名称">{{ currentRecord.appName }}</DescriptionsItem>
            <DescriptionsItem label="开发者">
              <Button type="link" size="small" @click="$router.push('/open-platform-admin/developer')">
                {{ currentRecord.developerName }}
              </Button>
            </DescriptionsItem>
            <DescriptionsItem label="应用类型">
              <Tag :color="appTypeColorMap[currentRecord.appType]">{{ appTypeNameMap[currentRecord.appType] }}</Tag>
            </DescriptionsItem>
            <DescriptionsItem label="应用描述" :span="2">{{ currentRecord.description || '-' }}</DescriptionsItem>
            <DescriptionsItem label="回调地址" :span="2">{{ currentRecord.notifyUrl || '-' }}</DescriptionsItem>
            <DescriptionsItem label="状态">
              <Badge :status="currentRecord.status === 'active' ? 'success' : 'warning'" />
              {{ currentRecord.status === 'active' ? '正常' : '暂停' }}
            </DescriptionsItem>
            <DescriptionsItem label="创建时间">{{ currentRecord.createTime }}</DescriptionsItem>
          </Descriptions>
        </TabPane>
        <TabPane key="quota" tab="配额信息">
          <Descriptions :column="2" bordered>
            <DescriptionsItem label="日调用配额">{{ currentRecord.dailyQuota }}</DescriptionsItem>
            <DescriptionsItem label="今日调用量">{{ currentRecord.todayCallCount }}</DescriptionsItem>
            <DescriptionsItem label="本周调用量">{{ currentRecord.weekCallCount }}</DescriptionsItem>
            <DescriptionsItem label="本月调用量">{{ currentRecord.monthCallCount }}</DescriptionsItem>
            <DescriptionsItem label="总调用量">{{ currentRecord.totalCallCount }}</DescriptionsItem>
            <DescriptionsItem label="配额重置时间">每日 00:00</DescriptionsItem>
          </Descriptions>
        </TabPane>
        <TabPane key="keys" tab="API Key">
          <Table :columns="keyColumns" :data-source="currentRecord.keys || []" size="small" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Badge :status="record.status === 'active' ? 'success' : 'error'" />
                <span>{{ record.status === 'active' ? '正常' : '禁用' }}</span>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Badge, Modal, Descriptions, DescriptionsItem, Progress, Tabs, TabPane, message } from 'ant-design-vue';
import { SearchOutlined } from '@ant-design/icons-vue';

interface AppRecord {
  appId: string;
  appName: string;
  developerId: string;
  developerName: string;
  appType: string;
  description: string;
  notifyUrl: string;
  enabledPayTypes: string[];
  status: string;
  dailyQuota: number;
  todayCallCount: number;
  weekCallCount: number;
  monthCallCount: number;
  totalCallCount: number;
  createTime: string;
  keys?: Array<{ keyId: string; apiKey: string; status: string; createdAt: string }>;
}

const loading = ref(false);
const dataSource = ref<AppRecord[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  keyword: '',
  appType: undefined as string | undefined,
  status: undefined as string | undefined,
});

const columns = [
  { title: '应用ID', key: 'appId', width: 150 },
  { title: '应用名称', dataIndex: 'appName', key: 'appName', width: 150 },
  { title: '开发者', dataIndex: 'developerName', key: 'developerName', width: 120 },
  { title: '类型', key: 'appType', width: 100 },
  { title: '支付方式', key: 'payTypes', width: 250 },
  { title: '配额使用', key: 'quota', width: 150 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' as const },
];

const keyColumns = [
  { title: 'Key ID', dataIndex: 'keyId', key: 'keyId' },
  { title: 'API Key', dataIndex: 'apiKey', key: 'apiKey' },
  { title: '状态', key: 'status' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
];

const appTypeColorMap: Record<string, string> = {
  web: 'blue',
  mobile: 'green',
  miniapp: 'orange',
  api: 'purple',
};

const appTypeNameMap: Record<string, string> = {
  web: 'Web应用',
  mobile: '移动应用',
  miniapp: '小程序',
  api: 'API接入',
};

const payTypeNameMap: Record<string, string> = {
  wx_native: '微信扫码',
  wx_jsapi: '微信JSAPI',
  wx_h5: '微信H5',
  wx_app: '微信APP',
  alipay_qr: '支付宝扫码',
  alipay_wap: '支付宝WAP',
  alipay_app: '支付宝APP',
  unionpay: '银联',
};

const detailVisible = ref(false);
const currentRecord = ref<AppRecord | null>(null);

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = [
      {
        appId: 'APP001', appName: '商户收款APP', developerId: 'DEV001', developerName: '某某科技',
        appType: 'mobile', description: '用于线下商户收款', notifyUrl: 'https://example.com/notify',
        enabledPayTypes: ['wx_native', 'alipay_qr', 'unionpay'], status: 'active',
        dailyQuota: 100000, todayCallCount: 12500, weekCallCount: 87500, monthCallCount: 350000, totalCallCount: 1500000,
        createTime: '2024-01-01 10:30:00',
        keys: [
          { keyId: 'KEY001', apiKey: 'DGKJ_AK_xxxxxxxxxxx', status: 'active', createdAt: '2024-01-01 10:30:00' },
        ],
      },
      {
        appId: 'APP002', appName: '官网支付', developerId: 'DEV002', developerName: '某支付公司',
        appType: 'web', description: '官网在线支付', notifyUrl: 'https://pay.example.com/notify',
        enabledPayTypes: ['wx_jsapi', 'alipay_wap'], status: 'active',
        dailyQuota: 500000, todayCallCount: 85000, weekCallCount: 595000, monthCallCount: 2380000, totalCallCount: 10000000,
        createTime: '2024-01-02 15:00:00',
        keys: [],
      },
      {
        appId: 'APP003', appName: '测试应用', developerId: 'DEV003', developerName: '测试商户',
        appType: 'api', description: '测试用', notifyUrl: 'https://test.example.com/notify',
        enabledPayTypes: ['wx_native', 'alipay_qr'], status: 'suspended',
        dailyQuota: 10000, todayCallCount: 120, weekCallCount: 840, monthCallCount: 3360, totalCallCount: 10000,
        createTime: '2024-01-03 10:00:00',
        keys: [],
      },
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
  searchForm.appType = undefined;
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openDetailModal(record: AppRecord) {
  currentRecord.value = record;
  detailVisible.value = true;
}

async function handleToggleStatus(record: AppRecord) {
  record.status = record.status === 'active' ? 'suspended' : 'active';
  message.success(record.status === 'active' ? '已启用' : '已暂停');
}

function handleExport() {
  message.info('导出功能开发中');
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.app-admin {
  padding: 16px;
  background: #f0f2f5;
}

.search-form {
  margin-bottom: 16px;
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.quota-text {
  font-size: 12px;
  color: #999;
}
</style>
