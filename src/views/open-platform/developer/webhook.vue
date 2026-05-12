<template>
  <div class="webhook-manage">
    <Card class="app-selector">
      <Form layout="inline">
        <FormItem label="选择应用">
          <Select v-model:value="selectedAppId" placeholder="请选择应用" style="width: 280px" @change="onAppChange">
            <SelectOption v-for="app in appList" :key="app.appId" :value="app.appId">
              {{ app.appName }} ({{ app.appKey }})
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem>
          <Button type="primary" @click="showCreateModal = true"><PlusOutlined /> 添加Webhook</Button>
        </FormItem>
      </Form>
    </Card>

    <!-- 统计卡片 -->
    <Row :gutter="16" style="margin-bottom: 16px">
      <Col :span="6">
        <Card>
          <Statistic title="已配置Webhook" :value="webhookList.length" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="总推送次数" :value="totalSent" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="成功次数" :value="totalSuccess" />
          <Progress :percent="successRate" :showInfo="true" size="small" style="margin-top: 8px" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="失败次数" :value="totalFail" />
        </Card>
      </Col>
    </Row>

    <!-- Webhook列表 -->
    <Card>
      <template #title>
        <Space>
          <span>Webhook 配置</span>
          <RadioGroup v-model:value="filterStatus" button-style="solid" size="small" @change="fetchWebhooks">
            <RadioButton value="">全部</RadioButton>
            <RadioButton value="active">启用</RadioButton>
            <RadioButton value="disabled">禁用</RadioButton>
          </RadioGroup>
        </Space>
      </template>

      <Table :data-source="filteredWebhooks" :columns="columns" :loading="loading" :pagination="{ pageSize: 10 }" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'eventType'">
            <Tag :color="eventTypeColor(record.eventType)">{{ eventTypeLabel(record.eventType) }}</Tag>
          </template>
          <template v-else-if="column.key === 'callbackUrl'">
            <Text :ellipsis="{ tooltip: record.callbackUrl }" style="max-width: 280px; font-family: monospace; font-size: 12px">
              {{ record.callbackUrl }}
            </Text>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="record.status === 'active' ? 'success' : 'default'" />
            {{ record.status === 'active' ? '启用' : '禁用' }}
          </template>
          <template v-else-if="column.key === 'stats'">
            <Space direction="vertical" :size="0">
              <span>推送 {{ record.totalSent || 0 }} 次</span>
              <span style="color: #52c41a">成功 {{ record.successCount || 0 }}</span>
              <span style="color: #ff4d4f">失败 {{ record.failCount || 0 }}</span>
            </Space>
          </template>
          <template v-else-if="column.key === 'lastSentTime'">
            <span style="font-size: 12px; color: #666">
              {{ record.lastSentTime ? formatDate(record.lastSentTime) : '从未推送' }}
            </span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="testWebhook(record)"><SendOutlined /> 测试</Button>
              <Button type="link" size="small" @click="editWebhook(record)"><EditOutlined /> 编辑</Button>
              <Button type="link" size="small" danger @click="deleteWebhook(record)"><DeleteOutlined /> 删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 创建/编辑弹窗 -->
    <Modal
      v-model:open="showCreateModal"
      :title="editingWebhook ? '编辑Webhook' : '添加Webhook'"
      width="600"
      @ok="handleSave"
      :confirmLoading="loading"
    >
      <Form :model="webhookForm" layout="vertical" :label-col="{ span: 6 }">
        <FormItem label="事件类型" name="eventType" :rules="[{ required: true, message: '请选择事件类型' }]">
          <Select v-model:value="webhookForm.eventType" placeholder="选择事件类型">
            <SelectOption value="payment">支付结果通知</SelectOption>
            <SelectOption value="refund">退款结果通知</SelectOption>
            <SelectOption value="transfer">转账结果通知</SelectOption>
            <SelectOption value="account">账户变动通知</SelectOption>
            <SelectOption value="alert">告警通知</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="回调地址" name="callbackUrl" :rules="[{ required: true, message: '请输入回调地址' }, { type: 'url', message: '请输入有效的URL' }]">
          <Input v-model:value="webhookForm.callbackUrl" placeholder="https://your-domain.com/webhook/dgkj" />
        </FormItem>
        <FormItem label="状态">
          <Switch :checked="webhookForm.status === 'active'" @change="(checked: boolean) => webhookForm.status = checked ? 'active' : 'disabled'" />
          {{ webhookForm.status === 'active' ? '启用' : '禁用' }}
        </FormItem>
        <FormItem label="描述" name="description">
          <Textarea v-model:value="webhookForm.description" placeholder="Webhook用途描述" :rows="2" />
        </FormItem>
        <Alert type="info" show-icon>
          <template #message>回调签名说明</template>
          <template #description>
            回调通知会携带 <code>X-Sign</code> 请求头，请使用 AppSecret 进行签名验证。签名算法与API签名一致。
          </template>
        </Alert>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Card, Form, FormItem, Select, SelectOption, Button, Row, Col, Statistic, Progress, Table, Tag, Badge, Space, RadioGroup, RadioButton, Modal, Input, Textarea, Switch, Alert, message, Popconfirm, Typography } from 'ant-design-vue';
const { Text } = Typography;
import { PlusOutlined, SendOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import * as opApi from '@/api/open-platform';

const selectedAppId = ref('');
const appList = ref<any[]>([]);
const webhookList = ref<any[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);
const editingWebhook = ref<any>(null);
const filterStatus = ref('');

const webhookForm = reactive({
  eventType: 'payment',
  callbackUrl: '',
  status: 'active' as 'active' | 'disabled',
  description: '',
});

const columns = [
  { title: '事件类型', key: 'eventType', width: 120 },
  { title: '回调地址', key: 'callbackUrl', width: 320 },
  { title: '状态', key: 'status', width: 100 },
  { title: '推送统计', key: 'stats', width: 150 },
  { title: '最后推送', key: 'lastSentTime', width: 160 },
  { title: '操作', key: 'action', width: 200 },
];

const filteredWebhooks = computed(() => {
  if (!filterStatus.value) return webhookList.value;
  return webhookList.value.filter((w) => w.status === filterStatus.value);
});

const totalSent = computed(() => webhookList.value.reduce((sum, w) => sum + (w.totalSent || 0), 0));
const totalSuccess = computed(() => webhookList.value.reduce((sum, w) => sum + (w.successCount || 0), 0));
const totalFail = computed(() => webhookList.value.reduce((sum, w) => sum + (w.failCount || 0), 0));
const successRate = computed(() => {
  if (!totalSent.value) return 0;
  return Math.round((totalSuccess.value / totalSent.value) * 100);
});

function eventTypeColor(type: string) {
  const m: Record<string, string> = {
    payment: 'green', refund: 'orange', transfer: 'blue', account: 'purple', alert: 'red',
  };
  return m[type] || 'default';
}

function eventTypeLabel(type: string) {
  const m: Record<string, string> = {
    payment: '支付通知', refund: '退款通知', transfer: '转账通知', account: '账户变动', alert: '告警',
  };
  return m[type] || type;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN');
}

async function loadApps() {
  try {
    const res = await opApi.getAppList({ page: 1, pageSize: 100 }) as any;
    appList.value = res?.list || [];
    if (appList.value.length > 0 && !selectedAppId.value) {
      selectedAppId.value = appList.value[0].appId;
      fetchWebhooks();
    }
  } catch (e) {
    console.error(e);
  }
}

async function fetchWebhooks() {
  if (!selectedAppId.value) return;
  loading.value = true;
  try {
    const mockWh = generateMockWebhooks(selectedAppId.value);
    webhookList.value = mockWh;
  } finally {
    loading.value = false;
  }
}

function generateMockWebhooks(appId: string) {
  return [
    {
      id: 'wh_' + appId + '_1',
      appId,
      eventType: 'payment',
      callbackUrl: `https://demo.example.com/webhook/${appId}/payment`,
      status: 'active',
      description: '支付结果回调',
      totalSent: 1256,
      successCount: 1248,
      failCount: 8,
      lastSentTime: new Date(Date.now() - 300000).toISOString(),
      lastResponseCode: 200,
    },
    {
      id: 'wh_' + appId + '_2',
      appId,
      eventType: 'refund',
      callbackUrl: `https://demo.example.com/webhook/${appId}/refund`,
      status: 'active',
      description: '退款结果回调',
      totalSent: 42,
      successCount: 41,
      failCount: 1,
      lastSentTime: new Date(Date.now() - 3600000).toISOString(),
      lastResponseCode: 200,
    },
    {
      id: 'wh_' + appId + '_3',
      appId,
      eventType: 'transfer',
      callbackUrl: `https://demo.example.com/webhook/${appId}/transfer`,
      status: 'disabled',
      description: '转账结果回调 (未启用)',
      totalSent: 0,
      successCount: 0,
      failCount: 0,
      lastSentTime: null,
    },
  ];
}

function onAppChange() {
  fetchWebhooks();
}

function editWebhook(record: any) {
  editingWebhook.value = record;
  Object.assign(webhookForm, {
    eventType: record.eventType,
    callbackUrl: record.callbackUrl,
    status: record.status,
    description: record.description || '',
  });
  showCreateModal.value = true;
}

function handleSave() {
  if (!webhookForm.callbackUrl) {
    message.error('请输入回调地址');
    return;
  }
  loading.value = true;
  setTimeout(() => {
    const newWh = {
      id: editingWebhook.value?.id || 'wh_new_' + Date.now(),
      appId: selectedAppId.value,
      eventType: webhookForm.eventType,
      callbackUrl: webhookForm.callbackUrl,
      status: webhookForm.status,
      description: webhookForm.description,
      totalSent: 0,
      successCount: 0,
      failCount: 0,
      lastSentTime: null,
    };
    if (editingWebhook.value) {
      const idx = webhookList.value.findIndex((w) => w.id === editingWebhook.value.id);
      if (idx >= 0) webhookList.value[idx] = newWh;
    } else {
      webhookList.value.push(newWh);
    }
    message.success(editingWebhook.value ? '更新成功' : '添加成功');
    showCreateModal.value = false;
    editingWebhook.value = null;
    Object.assign(webhookForm, { eventType: 'payment', callbackUrl: '', status: 'active', description: '' });
    loading.value = false;
  }, 300);
}

function testWebhook(record: any) {
  message.loading('正在发送测试通知...', 0.5);
  setTimeout(() => {
    const mockResponses = [200, 200, 500];
    const code = mockResponses[Math.floor(Math.random() * 3)];
    if (code === 200) {
      message.success(`测试通知已送达 (HTTP ${code})`);
    } else {
      message.error(`测试通知失败 (HTTP ${code})`);
    }
  }, 800);
}

function deleteWebhook(record: any) {
  const idx = webhookList.value.findIndex((w) => w.id === record.id);
  if (idx >= 0) {
    webhookList.value.splice(idx, 1);
    message.success('Webhook已删除');
  }
}

onMounted(() => {
  loadApps();
});
</script>

<style scoped>
.webhook-manage { padding: 16px; background: #f0f2f5; }
.app-selector { margin-bottom: 16px; }
code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-size: 12px; }
</style>
