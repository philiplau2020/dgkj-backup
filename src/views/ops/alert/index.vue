<template>
  <div class="alert-center">
    <!-- 统计 -->
    <Row :gutter="16" class="stat-row">
      <Col :span="4">
        <Card class="alert-stat-card critical">
          <Statistic title="严重" :value="pagination.total" />
          <Tag color="red" style="margin-top: 4px">{{ pagination.total }} 条</Tag>
        </Card>
      </Col>
      <Col :span="4">
        <Card class="alert-stat-card">
          <Statistic title="活跃告警" :value="activeCount" :value-style="{ color: '#f5222d' }" />
        </Card>
      </Col>
      <Col :span="4">
        <Card class="alert-stat-card">
          <Statistic title="已确认" :value="ackCount" :value-style="{ color: '#faad14' }" />
        </Card>
      </Col>
      <Col :span="4">
        <Card class="alert-stat-card">
          <Statistic title="已解决" :value="resolvedCount" :value-style="{ color: '#52c41a' }" />
        </Card>
      </Col>
      <Col :span="4">
        <Card class="alert-stat-card">
          <Statistic title="今日新增" :value="todayCount" />
        </Card>
      </Col>
      <Col :span="4">
        <Card class="alert-stat-card">
          <Statistic title="规则总数" :value="ruleCount" />
        </Card>
      </Col>
    </Row>

    <!-- 告警列表 -->
    <Card>
      <template #title>
        <Space>
          <span>告警列表</span>
          <Select v-model:value="filterLevel" style="width: 120px" placeholder="告警级别" allowClear @change="handleSearch">
            <SelectOption value="critical">严重</SelectOption>
            <SelectOption value="error">错误</SelectOption>
            <SelectOption value="warning">警告</SelectOption>
            <SelectOption value="info">通知</SelectOption>
          </Select>
          <Select v-model:value="filterStatus" style="width: 140px" placeholder="处理状态" allowClear @change="handleSearch">
            <SelectOption value="active">活跃</SelectOption>
            <SelectOption value="acknowledged">已确认</SelectOption>
            <SelectOption value="resolved">已解决</SelectOption>
            <SelectOption value="silenced">已静默</SelectOption>
          </Select>
          <InputSearch v-model:value="keyword" placeholder="搜索告警内容" style="width: 200px" @search="handleSearch" />
          <Button type="primary" @click="handleSearch"><SearchOutlined /> 搜索</Button>
        </Space>
      </template>
      <template #extra>
        <Space>
          <Button type="primary" @click="showRuleModal = true"><PlusOutlined /> 添加规则</Button>
          <Button @click="fetchData"><ReloadOutlined /> 刷新</Button>
        </Space>
      </template>

      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1600 }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'level'">
            <Tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="getStatusBadge(record.status)" :text="getStatusText(record.status)" />
          </template>
          <template v-else-if="column.key === 'value'">
            <span :style="{ color: record.value > record.threshold ? '#f5222d' : '#52c41a' }">
              {{ record.value }} {{ record.unit }}
            </span>
            <span style="color: #999; font-size: 12px"> / {{ record.threshold }}{{ record.unit }}</span>
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ formatTime(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'duration'">
            {{ formatDuration(record.duration) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Space size="small">
              <Button v-if="record.status === 'active'" type="link" size="small" @click="handleAlert(record, 'ack')">
                确认
              </Button>
              <Button v-if="record.status === 'acknowledged' || record.status === 'active'" type="link" size="small" @click="handleAlert(record, 'resolve')">
                解决
              </Button>
              <Button type="link" size="small" @click="showDetail(record)">
                <EyeOutlined /> 详情
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 告警详情抽屉 -->
    <Drawer v-model:open="detailVisible" title="告警详情" width="700">
      <template v-if="currentAlert">
        <Descriptions :column="2" size="small" bordered style="margin-bottom: 16px">
          <DescriptionsItem label="告警标题">{{ currentAlert.title }}</DescriptionsItem>
          <DescriptionsItem label="级别">
            <Tag :color="getLevelColor(currentAlert.level)">{{ getLevelText(currentAlert.level) }}</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="状态">
            <Badge :status="getStatusBadge(currentAlert.status)" :text="getStatusText(currentAlert.status)" />
          </DescriptionsItem>
          <DescriptionsItem label="主机">{{ currentAlert.host }}</DescriptionsItem>
          <DescriptionsItem label="指标">{{ currentAlert.metric }}</DescriptionsItem>
          <DescriptionsItem label="当前值">{{ currentAlert.value }} {{ currentAlert.unit }}</DescriptionsItem>
          <DescriptionsItem label="阈值">{{ currentAlert.threshold }} {{ currentAlert.unit }}</DescriptionsItem>
          <DescriptionsItem label="触发次数">{{ currentAlert.count }} 次</DescriptionsItem>
          <DescriptionsItem label="持续时间">{{ formatDuration(currentAlert.duration) }}</DescriptionsItem>
          <DescriptionsItem label="创建时间">{{ currentAlert.createdAt }}</DescriptionsItem>
          <DescriptionsItem label="确认时间" :span="2">{{ currentAlert.acknowledgedAt || '-' }}</DescriptionsItem>
          <DescriptionsItem label="确认人">{{ currentAlert.acknowledgedBy || '-' }}</DescriptionsItem>
          <DescriptionsItem label="解决时间">{{ currentAlert.resolvedAt || '-' }}</DescriptionsItem>
        </Descriptions>

        <Card size="small" title="告警内容" style="margin-bottom: 16px">
          <pre class="alert-content">{{ currentAlert.content }}</pre>
        </Card>

        <Card size="small" title="处理历史">
          <Timeline>
            <TimelineItem v-for="(h, i) in alertDetail.history || []" :key="i" :color="h.event === 'resolved' ? 'green' : h.event === 'acknowledged' ? 'blue' : 'red'">
              <p><strong>{{ h.desc }}</strong></p>
              <p style="color: #999; font-size: 12px">{{ h.time }}</p>
            </TimelineItem>
          </Timeline>
        </Card>

        <Card size="small" title="触发规则" style="margin-top: 16px">
          <Descriptions :column="2" size="small">
            <DescriptionsItem label="规则名称">{{ alertDetail.rule?.name }}</DescriptionsItem>
            <DescriptionsItem label="表达式">{{ alertDetail.rule?.expr }}</DescriptionsItem>
            <DescriptionsItem label="严重程度">{{ alertDetail.rule?.severity }}</DescriptionsItem>
            <DescriptionsItem label="持续时间">{{ alertDetail.rule?.duration }}</DescriptionsItem>
            <DescriptionsItem label="通知渠道">{{ alertDetail.rule?.notifyChannels?.join(', ') }}</DescriptionsItem>
            <DescriptionsItem label="通知组">{{ alertDetail.rule?.notifyGroups?.join(', ') }}</DescriptionsItem>
          </Descriptions>
        </Card>
      </template>
    </Drawer>

    <!-- 告警规则抽屉 -->
    <Drawer v-model:open="showRuleModal" title="告警规则" width="800">
      <Table
        :data-source="ruleList"
        :columns="ruleColumns"
        :loading="ruleLoading"
        :pagination="{ pageSize: 10 }"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'severity'">
            <Tag :color="getLevelColor(record.severity)">{{ getLevelText(record.severity) }}</Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Switch :checked="record.status === 'enabled'" @change="() => {}" />
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="showDetail(record)">编辑</Button>
          </template>
        </template>
      </Table>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Card, Row, Col, Statistic, Tag, Table, Badge, Space, Select, SelectOption, InputSearch, Button, Drawer, Descriptions, DescriptionsItem, Timeline, TimelineItem, Switch } from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { getAlertList, getAlertDetail, handleAlert as handleAlertApi, getAlertRuleList } from '@/api/ops';
import { message } from 'ant-design-vue';

const loading = ref(false);
const ruleLoading = ref(false);
const dataSource = ref<any[]>([]);
const ruleList = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });
const filterLevel = ref<string>();
const filterStatus = ref<string>();
const keyword = ref('');
const detailVisible = ref(false);
const showRuleModal = ref(false);
const currentAlert = ref<any>(null);
const alertDetail = ref<any>({});

const activeCount = computed(() => dataSource.value.filter((a) => a.status === 'active').length);
const ackCount = computed(() => dataSource.value.filter((a) => a.status === 'acknowledged').length);
const resolvedCount = computed(() => dataSource.value.filter((a) => a.status === 'resolved').length);
const todayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return dataSource.value.filter((a) => a.createdAt?.startsWith(today)).length;
});
const ruleCount = ref(0);

const columns = [
  { title: '级别', key: 'level', width: 80 },
  { title: '状态', key: 'status', width: 90 },
  { title: '告警标题', dataIndex: 'title', width: 200 },
  { title: '主机', dataIndex: 'host', width: 140 },
  { title: '指标', dataIndex: 'metric', width: 150 },
  { title: '数值', key: 'value', width: 160 },
  { title: '持续时间', key: 'duration', width: 100 },
  { title: '触发次数', dataIndex: 'count', width: 90 },
  { title: '创建时间', key: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' },
];

const ruleColumns = [
  { title: '规则名称', dataIndex: 'name', width: 180 },
  { title: '指标', dataIndex: 'metric', width: 150 },
  { title: '表达式', dataIndex: 'expr', width: 100 },
  { title: '严重程度', key: 'severity', width: 90 },
  { title: '持续时间', dataIndex: 'duration', width: 90 },
  { title: '状态', key: 'status', width: 80 },
  { title: '告警次数', dataIndex: 'alerts', width: 90 },
  { title: '最后告警', dataIndex: 'lastAlert', width: 160 },
  { title: '操作', key: 'action', width: 80 },
];

function getLevelColor(level: string) {
  const m: Record<string, string> = { critical: 'red', error: 'orange', warning: 'gold', info: 'blue' };
  return m[level] || 'blue';
}
function getLevelText(level: string) {
  const m: Record<string, string> = { critical: '严重', error: '错误', warning: '警告', info: '通知' };
  return m[level] || level;
}
function getStatusBadge(s: string) {
  const m: Record<string, 'error' | 'warning' | 'success' | 'default'> = { active: 'error', acknowledged: 'warning', resolved: 'success', silenced: 'default' };
  return m[s] || 'default';
}
function getStatusText(s: string) {
  const m: Record<string, string> = { active: '活跃', acknowledged: '已确认', resolved: '已解决', silenced: '已静默' };
  return m[s] || s;
}
function formatTime(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN', { hour12: false });
}
function formatDuration(s: number): string {
  if (s < 60) return `${s}秒`;
  if (s < 3600) return `${Math.floor(s / 60)}分${s % 60}秒`;
  return `${Math.floor(s / 3600)}小时${Math.floor((s % 3600) / 60)}分`;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await getAlertList({
      page: pagination.current,
      pageSize: pagination.pageSize,
      level: filterLevel.value,
      status: filterStatus.value,
    });
    dataSource.value = res?.list || [];
    pagination.total = res?.total || 0;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

async function showDetail(record: any) {
  currentAlert.value = record;
  detailVisible.value = true;
  try {
    const res = await getAlertDetail(record.id);
    alertDetail.value = res || {};
  } catch (e) { console.error(e); }
}

async function handleAlert(record: any, action: 'ack' | 'resolve' | 'silence') {
  try {
    await handleAlertApi(record.id, action);
    message.success('处理成功');
    fetchData();
  } catch (e) {
    message.error('处理失败');
  }
}

async function fetchRules() {
  ruleLoading.value = true;
  try {
    const res = await getAlertRuleList({ page: 1, pageSize: 100 });
    ruleList.value = res?.list || [];
    ruleCount.value = res?.total || 0;
  } catch (e) { console.error(e); }
  finally { ruleLoading.value = false; }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

onMounted(() => { fetchData(); fetchRules(); });
</script>

<style scoped>
.alert-center { padding: 16px; background: #f0f2f5; }
.stat-row { margin-bottom: 16px; }
.alert-stat-card :deep(.ant-statistic-title) { font-size: 12px; }
.alert-content {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}
</style>
