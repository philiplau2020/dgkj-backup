<template>
  <div class="open-platform-admin">
    <!-- 概览统计 -->
    <Row :gutter="16" style="margin-bottom: 16px">
      <Col :span="6">
        <Card hoverable>
          <Statistic title="开发者总数" :value="stats.devTotal" @click="activeTab = 'developer'">
            <template #suffix>
              <span style="font-size: 14px; color: #1890ff; cursor: pointer">查看</span>
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="应用总数" :value="stats.appTotal" @click="activeTab = 'app'">
            <template #suffix>
              <span style="font-size: 14px; color: #1890ff; cursor: pointer">查看</span>
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="今日API调用" :value="stats.todayCalls" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="今日成功率" :value="stats.todaySuccessRate" suffix="%" :precision="2" />
        </Card>
      </Col>
    </Row>

    <!-- Tab切换 -->
    <Card>
      <template #title>平台管理</template>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="developer" tab="开发者管理">
          <!-- 开发者搜索 -->
          <Form layout="inline" style="margin-bottom: 16px">
            <FormItem label="关键词">
              <Input v-model:value="devParams.keyword" placeholder="开发者名称/用户名/公司" style="width: 200px" allowClear @pressEnter="loadDevList" />
            </FormItem>
            <FormItem label="状态">
              <Select v-model:value="devParams.status" placeholder="全部" style="width: 120px" allowClear @change="loadDevList">
                <SelectOption value="">全部</SelectOption>
                <SelectOption value="active">已激活</SelectOption>
                <SelectOption value="pending">待审核</SelectOption>
                <SelectOption value="rejected">已拒绝</SelectOption>
                <SelectOption value="suspended">已停用</SelectOption>
              </Select>
            </FormItem>
            <FormItem label="等级">
              <Select v-model:value="devParams.level" placeholder="全部" style="width: 120px" allowClear @change="loadDevList">
                <SelectOption value="">全部</SelectOption>
                <SelectOption value="trial">体验版</SelectOption>
                <SelectOption value="basic">基础版</SelectOption>
                <SelectOption value="professional">专业版</SelectOption>
                <SelectOption value="enterprise">企业版</SelectOption>
              </Select>
            </FormItem>
            <FormItem>
              <Space>
                <Button type="primary" @click="loadDevList"><SearchOutlined /> 搜索</Button>
                <Button @click="resetDevParams">重置</Button>
              </Space>
            </FormItem>
          </Form>

          <Table :data-source="devList" :columns="devColumns" :loading="loading" :pagination="devPagination" @change="handleDevTableChange" row-key="developerId" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'">
                <Tag :color="levelColor(record.level)">{{ levelLabel(record.level) }}</Tag>
              </template>
              <template v-else-if="column.key === 'status'">
                <Badge :status="statusBadge(record.status)" />
                {{ statusLabel(record.status) }}
              </template>
              <template v-else-if="column.key === 'appCount'">
                <Tag color="blue">{{ record.appCount }}</Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space>
                  <Button type="link" size="small" @click="showDevDetail(record)"><EyeOutlined /> 详情</Button>
                  <Button v-if="record.status === 'pending'" type="link" size="small" @click="reviewDev(record, 'active')"><CheckOutlined /> 通过</Button>
                  <Button v-if="record.status === 'pending'" type="link" size="small" danger @click="reviewDev(record, 'rejected')"><CloseOutlined /> 拒绝</Button>
                  <Button type="link" size="small" @click="changeLevel(record)"><SettingOutlined /> 等级</Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="app" tab="应用管理">
          <!-- 应用搜索 -->
          <Form layout="inline" style="margin-bottom: 16px">
            <FormItem label="关键词">
              <Input v-model:value="appParams.keyword" placeholder="应用名称/AppKey" style="width: 200px" allowClear @pressEnter="loadAppList" />
            </FormItem>
            <FormItem label="状态">
              <Select v-model:value="appParams.status" placeholder="全部" style="width: 120px" allowClear @change="loadAppList">
                <SelectOption value="">全部</SelectOption>
                <SelectOption value="active">正常</SelectOption>
                <SelectOption value="pending">待审核</SelectOption>
                <SelectOption value="suspended">停用</SelectOption>
              </Select>
            </FormItem>
            <FormItem>
              <Space>
                <Button type="primary" @click="loadAppList"><SearchOutlined /> 搜索</Button>
                <Button @click="resetAppParams">重置</Button>
              </Space>
            </FormItem>
          </Form>

          <Table :data-source="appList" :columns="appColumns" :loading="loading" :pagination="appPagination" @change="handleAppTableChange" row-key="appId" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'appType'">
                {{ appTypeLabel(record.appType) }}
              </template>
              <template v-else-if="column.key === 'status'">
                <Badge :status="record.status === 'active' ? 'success' : record.status === 'pending' ? 'processing' : 'error'" />
                {{ appStatusLabel(record.status) }}
              </template>
              <template v-else-if="column.key === 'payTypes'">
                <Tag v-for="pt in (record.enabledPayTypes || []).slice(0, 2)" :key="pt" size="small" color="blue">{{ pt }}</Tag>
                <Tag v-if="(record.enabledPayTypes || []).length > 2" size="small">+{{ record.enabledPayTypes.length - 2 }}</Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space>
                  <Button type="link" size="small" @click="showAppDetail(record)"><EyeOutlined /> 详情</Button>
                  <Button v-if="record.status === 'pending'" type="link" size="small" @click="reviewApp(record, 'active')"><CheckOutlined /> 通过</Button>
                  <Button v-if="record.status === 'pending'" type="link" size="small" danger @click="reviewApp(record, 'suspended')"><CloseOutlined /> 拒绝</Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="log" tab="API日志">
          <!-- 日志搜索 -->
          <Form layout="inline" style="margin-bottom: 16px">
            <FormItem label="应用">
              <Select v-model:value="logParams.appId" placeholder="全部应用" style="width: 180px" allowClear @change="loadLogList">
                <SelectOption v-for="app in appList" :key="app.appId" :value="app.appId">{{ app.appName }}</SelectOption>
              </Select>
            </FormItem>
            <FormItem label="结果">
              <Select v-model:value="logParams.result" placeholder="全部" style="width: 100px" allowClear @change="loadLogList">
                <SelectOption value="">全部</SelectOption>
                <SelectOption value="success">成功</SelectOption>
                <SelectOption value="error">失败</SelectOption>
              </Select>
            </FormItem>
            <FormItem label="接口">
              <Input v-model:value="logParams.apiPath" placeholder="接口路径" style="width: 200px" allowClear @pressEnter="loadLogList" />
            </FormItem>
            <FormItem>
              <Space>
                <Button type="primary" @click="loadLogList"><SearchOutlined /> 搜索</Button>
                <Button @click="resetLogParams">重置</Button>
              </Space>
            </FormItem>
          </Form>

          <!-- 实时统计 -->
          <Row :gutter="16" style="margin-bottom: 16px">
            <Col :span="4">
              <Statistic title="今日调用" :value="logStats.today?.total || 0" />
            </Col>
            <Col :span="4">
              <Statistic title="成功" :value="logStats.today?.success || 0" :valueStyle="{ color: '#52c41a' }" />
            </Col>
            <Col :span="4">
              <Statistic title="失败" :value="logStats.today?.error || 0" :valueStyle="{ color: '#ff4d4f' }" />
            </Col>
            <Col :span="12">
              <div style="padding-top: 8px">
                <Text type="secondary">热门接口: </Text>
                <Tag v-for="api in (logStats.topApis || []).slice(0, 3)" :key="api.apiPath">{{ api.apiPath }} ({{ api.count }})</Tag>
              </div>
            </Col>
          </Row>

          <Table :data-source="logList" :columns="logColumns" :loading="loading" :pagination="logPagination" @change="handleLogTableChange" row-key="id" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'result'">
                <Tag :color="record.result === 'success' ? 'success' : 'error'">
                  {{ record.result === 'success' ? '成功' : '失败' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'method'">
                <Tag :color="methodColor(record.method)">{{ record.method }}</Tag>
              </template>
              <template v-else-if="column.key === 'apiPath'">
                <Text code style="font-size: 12px">{{ record.apiPath }}</Text>
              </template>
              <template v-else-if="column.key === 'clientIp'">
                <Text type="secondary" style="font-size: 12px">{{ record.clientIp }}</Text>
              </template>
              <template v-else-if="column.key === 'responseTime'">
                <Text :type="record.responseTime > 500 ? 'danger' : record.responseTime > 200 ? 'warning' : 'secondary'">
                  {{ record.responseTime }}ms
                </Text>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 开发者详情弹窗 -->
    <Modal v-model:open="showDevModal" title="开发者详情" width="700" :footer="null">
      <Descriptions :column="2" bordered size="small" v-if="currentDev">
        <DescriptionsItem label="开发者ID">{{ currentDev.developerId }}</DescriptionsItem>
        <DescriptionsItem label="用户名">{{ currentDev.username }}</DescriptionsItem>
        <DescriptionsItem label="开发者名称">{{ currentDev.developerName }}</DescriptionsItem>
        <DescriptionsItem label="公司名称">{{ currentDev.company || '-' }}</DescriptionsItem>
        <DescriptionsItem label="邮箱">{{ currentDev.email }}</DescriptionsItem>
        <DescriptionsItem label="手机号">{{ currentDev.mobile }}</DescriptionsItem>
        <DescriptionsItem label="等级">
          <Tag :color="levelColor(currentDev.level)">{{ levelLabel(currentDev.level) }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="statusBadge(currentDev.status)" />
          {{ statusLabel(currentDev.status) }}
        </DescriptionsItem>
        <DescriptionsItem label="应用数量">{{ currentDev.appCount }}</DescriptionsItem>
        <DescriptionsItem label="累计调用">{{ currentDev.totalCallCount }}</DescriptionsItem>
        <DescriptionsItem label="最后登录时间">{{ currentDev.lastLoginTime || '-' }}</DescriptionsItem>
        <DescriptionsItem label="最后登录IP">{{ currentDev.lastLoginIp || '-' }}</DescriptionsItem>
        <DescriptionsItem label="注册时间" :span="2">{{ currentDev.createTime }}</DescriptionsItem>
      </Descriptions>
    </Modal>

    <!-- 调整等级弹窗 -->
    <Modal v-model:open="showLevelModal" title="调整开发者等级" @ok="handleLevelChange" :confirmLoading="loading">
      <Form :model="levelForm" layout="vertical">
        <FormItem label="开发者">{{ currentDev?.developerName }}</FormItem>
        <FormItem label="当前等级">
          <Tag :color="levelColor(currentDev?.level || '')">{{ levelLabel(currentDev?.level || '') }}</Tag>
        </FormItem>
        <FormItem label="新等级" name="level">
          <RadioGroup v-model:value="levelForm.level">
            <Radio value="trial">体验版 (1应用, 100次/日)</Radio>
            <Radio value="basic">基础版 (3应用, 1万次/日)</Radio>
            <Radio value="professional">专业版 (10应用, 10万次/日)</Radio>
            <Radio value="enterprise">企业版 (50应用, 100万次/日)</Radio>
          </RadioGroup>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Row, Col, Card, Statistic, Tabs, TabPane, Form, FormItem, Input, Select, SelectOption,
  Button, Space, Table, Tag, Badge, Modal, Descriptions, DescriptionsItem, Typography, Radio, RadioGroup,
} from 'ant-design-vue';
const { Text } = Typography;
import {
  SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined, SettingOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import * as opAdminApi from '@/api/open-platform';

const activeTab = ref('developer');
const loading = ref(false);
const showDevModal = ref(false);
const showLevelModal = ref(false);
const currentDev = ref<any>(null);

// 统计数据
const stats = reactive({
  devTotal: 0,
  appTotal: 0,
  todayCalls: 0,
  todaySuccessRate: 0,
});

const logStats = reactive<any>({
  today: { total: 0, success: 0, error: 0 },
  topApis: [],
  topApps: [],
});

// 开发者相关
const devParams = reactive({ keyword: '', status: '', level: '' });
const devList = ref<any[]>([]);
const devPagination = reactive({ current: 1, pageSize: 10, total: 0 });
const levelForm = reactive({ level: 'basic' });

const devColumns = [
  { title: '开发者ID', dataIndex: 'developerId', width: 160 },
  { title: '名称', dataIndex: 'developerName', width: 150 },
  { title: '用户名', dataIndex: 'username', width: 120 },
  { title: '公司', dataIndex: 'company', width: 150, ellipsis: true },
  { title: '等级', key: 'level', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '应用数', key: 'appCount', width: 80 },
  { title: '累计调用', dataIndex: 'totalCallCount', width: 100 },
  { title: '最后登录', dataIndex: 'lastLoginTime', width: 160 },
  { title: '注册时间', dataIndex: 'createTime', width: 160 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
];

// 应用相关
const appParams = reactive({ keyword: '', status: '' });
const appList = ref<any[]>([]);
const appPagination = reactive({ current: 1, pageSize: 10, total: 0 });

const appColumns = [
  { title: 'AppKey', dataIndex: 'appKey', width: 200, ellipsis: true },
  { title: '应用名称', dataIndex: 'appName', width: 150 },
  { title: '类型', key: 'appType', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '支付方式', key: 'payTypes', width: 200 },
  { title: '商户号', dataIndex: 'mchNo', width: 120 },
  { title: '今日调用', dataIndex: 'todayCallCount', width: 100 },
  { title: '累计调用', dataIndex: 'totalCallCount', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 160 },
  { title: '操作', key: 'action', width: 160 },
];

// 日志相关
const logParams = reactive({ appId: '', result: '', apiPath: '' });
const logList = ref<any[]>([]);
const logPagination = reactive({ current: 1, pageSize: 20, total: 0 });

const logColumns = [
  { title: '时间', dataIndex: 'createTime', width: 180 },
  { title: '应用', dataIndex: 'appId', width: 160, ellipsis: true },
  { title: '方法', key: 'method', width: 80 },
  { title: '接口', key: 'apiPath', width: 220 },
  { title: '结果', key: 'result', width: 80 },
  { title: '响应码', dataIndex: 'httpCode', width: 80 },
  { title: '耗时', key: 'responseTime', width: 80 },
  { title: 'IP', key: 'clientIp', width: 140 },
  { title: '错误码', dataIndex: 'code', width: 100 },
];

function levelColor(level: string) {
  const m: Record<string, string> = { trial: 'default', basic: 'blue', professional: 'purple', enterprise: 'red' };
  return m[level] || 'default';
}
function levelLabel(level: string) {
  const m: Record<string, string> = { trial: '体验版', basic: '基础版', professional: '专业版', enterprise: '企业版' };
  return m[level] || level;
}
function statusBadge(status: string) {
  const m: Record<string, string> = { active: 'success', pending: 'processing', rejected: 'error', suspended: 'error' };
  return m[status] || 'default';
}
function statusLabel(status: string) {
  const m: Record<string, string> = { active: '已激活', pending: '待审核', rejected: '已拒绝', suspended: '已停用' };
  return m[status] || status;
}
function appTypeLabel(type: string) {
  const m: Record<string, string> = { web: 'PC网站', mobile: '移动应用', miniapp: '小程序', api: 'API接入' };
  return m[type] || type;
}
function appStatusLabel(status: string) {
  const m: Record<string, string> = { active: '正常', pending: '待审核', suspended: '停用' };
  return m[status] || status;
}
function methodColor(method: string) {
  const m: Record<string, string> = { GET: 'blue', POST: 'green', PUT: 'orange', DELETE: 'red' };
  return m[method] || 'default';
}

async function loadStats() {
  try {
    const res = await opAdminApi.adminGetLogStatistics() as any;
    if (res?.code === 'OP0000') {
      Object.assign(logStats, res.data);
      stats.todayCalls = res.data.today?.total || 0;
      stats.todaySuccessRate = res.data.today?.total
        ? Math.round((res.data.today?.success / res.data.today?.total) * 10000) / 100
        : 0;
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadDevList() {
  loading.value = true;
  try {
    const res = await opAdminApi.adminGetDevList({
      page: devPagination.current,
      pageSize: devPagination.pageSize,
      keyword: devParams.keyword || undefined,
      status: devParams.status || undefined,
      level: devParams.level || undefined,
    }) as any;
    if (res?.code === 'OP0000') {
      devList.value = res.data?.list || [];
      devPagination.total = res.data?.total || 0;
      stats.devTotal = res.data?.total || 0;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function loadAppList() {
  loading.value = true;
  try {
    const res = await opAdminApi.adminGetAppList({
      page: appPagination.current,
      pageSize: appPagination.pageSize,
      keyword: appParams.keyword || undefined,
      status: appParams.status || undefined,
    }) as any;
    if (res?.code === 'OP0000') {
      appList.value = res.data?.list || [];
      appPagination.total = res.data?.total || 0;
      stats.appTotal = res.data?.total || 0;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function loadLogList() {
  loading.value = true;
  try {
    const res = await opAdminApi.adminGetLogList({
      page: logPagination.current,
      pageSize: logPagination.pageSize,
      appId: logParams.appId || undefined,
      result: logParams.result || undefined,
      apiPath: logParams.apiPath || undefined,
    }) as any;
    if (res?.code === 'OP0000') {
      logList.value = res.data?.list || [];
      logPagination.total = res.data?.total || 0;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function handleDevTableChange(pagination: any) {
  devPagination.current = pagination.current;
  devPagination.pageSize = pagination.pageSize;
  loadDevList();
}

function handleAppTableChange(pagination: any) {
  appPagination.current = pagination.current;
  appPagination.pageSize = pagination.pageSize;
  loadAppList();
}

function handleLogTableChange(pagination: any) {
  logPagination.current = pagination.current;
  logPagination.pageSize = pagination.pageSize;
  loadLogList();
}

function showDevDetail(record: any) {
  currentDev.value = record;
  showDevModal.value = true;
}

function changeLevel(record: any) {
  currentDev.value = record;
  levelForm.level = record.level;
  showLevelModal.value = true;
}

async function handleLevelChange() {
  if (!currentDev.value) return;
  loading.value = true;
  try {
    await opAdminApi.adminUpdateDevLevel(currentDev.value.developerId, levelForm.level);
    message.success('等级调整成功');
    showLevelModal.value = false;
    loadDevList();
  } catch (e: any) {
    message.error(e.message || '调整失败');
  } finally {
    loading.value = false;
  }
}

async function reviewDev(record: any, status: 'active' | 'rejected') {
  try {
    await opAdminApi.adminReviewDev(record.developerId, { status });
    message.success(status === 'active' ? '已通过审核' : '已拒绝');
    loadDevList();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

async function reviewApp(record: any, status: 'active' | 'suspended') {
  try {
    await opAdminApi.adminReviewApp(record.appId, status);
    message.success(status === 'active' ? '已通过审核' : '已拒绝');
    loadAppList();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

function showAppDetail(record: any) {
  message.info(`应用详情: ${record.appName} (${record.appId})`);
}

function resetDevParams() {
  devParams.keyword = '';
  devParams.status = '';
  devParams.level = '';
  devPagination.current = 1;
  loadDevList();
}

function resetAppParams() {
  appParams.keyword = '';
  appParams.status = '';
  appPagination.current = 1;
  loadAppList();
}

function resetLogParams() {
  logParams.appId = '';
  logParams.result = '';
  logParams.apiPath = '';
  logPagination.current = 1;
  loadLogList();
}

onMounted(() => {
  loadStats();
  loadDevList();
  loadAppList();
  loadLogList();
});
</script>

<style scoped>
.open-platform-admin { padding: 16px; background: #f0f2f5; }
</style>
