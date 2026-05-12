<template>
  <div class="developer-center">
    <!-- 开发者入驻 -->
    <Card v-if="!isLoggedIn" class="register-card">
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="login" tab="登录">
          <Form :model="loginForm" layout="vertical" @finish="handleLogin">
            <FormItem label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
              <Input v-model:value="loginForm.username" placeholder="用户名/手机号" size="large" />
            </FormItem>
            <FormItem label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
              <InputPassword v-model:value="loginForm.password" placeholder="请输入密码" size="large" />
            </FormItem>
            <FormItem>
              <Button type="primary" html-type="submit" size="large" block :loading="loading">登录</Button>
            </FormItem>
          </Form>
        </TabPane>
        <TabPane key="register" tab="注册入驻">
          <Form :model="registerForm" layout="vertical" @finish="handleRegister">
            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="开发者名称" name="developerName" :rules="[{ required: true, message: '请输入开发者名称' }]">
                  <Input v-model:value="registerForm.developerName" placeholder="个人开发者/公司名称" />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="登录账号" name="username" :rules="[{ required: true, min: 4, max: 32, message: '4-32位字母数字组合' }]">
                  <Input v-model:value="registerForm.username" placeholder="登录用户名" />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="登录密码" name="password" :rules="[{ required: true, min: 6, max: 32, message: '6-32位密码' }]">
                  <InputPassword v-model:value="registerForm.password" placeholder="登录密码" />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="邮箱" name="email" :rules="[{ required: true, type: 'email', message: '请输入正确邮箱' }]">
                  <Input v-model:value="registerForm.email" placeholder="用于接收通知" />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="手机号" name="mobile" :rules="[{ required: true, message: '请输入手机号' }]">
                  <Input v-model:value="registerForm.mobile" placeholder="手机号码" />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="公司名称" name="company">
                  <Input v-model:value="registerForm.company" placeholder="企业开发者填写" />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="统一社会信用代码" name="businessLicense">
                  <Input v-model:value="registerForm.businessLicense" placeholder="企业开发者填写" />
                </FormItem>
              </Col>
              <Col :span="24">
                <FormItem label="应用场景说明" name="description">
                  <Textarea v-model:value="registerForm.description" placeholder="请描述您的应用场景和预计接入的业务类型" :rows="3" />
                </FormItem>
              </Col>
            </Row>
            <FormItem>
              <Button type="primary" html-type="submit" size="large" block :loading="loading">提交注册</Button>
            </FormItem>
          </Form>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 开发者中心 -->
    <div v-else>
      <!-- 开发者信息 -->
      <Card class="info-card">
        <Row :gutter="16" align="middle">
          <Col :span="16">
            <div class="dev-info">
              <Avatar :size="64" style="background: #1890ff; font-size: 24px">{{ developerInfo.developerName?.charAt(0) }}</Avatar>
              <div class="dev-detail">
                <h2>{{ developerInfo.developerName }}</h2>
                <Space>
                  <Tag :color="statusColor">{{ developerInfo.status === 'active' ? '已激活' : developerInfo.status === 'pending' ? '待审核' : '停用' }}</Tag>
                  <Tag :color="levelColor">{{ levelDesc }}</Tag>
                  <Button type="text" danger size="small" @click="handleLogout"><LogoutOutlined /> 退出</Button>
                </Space>
              </div>
            </div>
          </Col>
          <Col :span="8">
            <Row :gutter="8">
              <Col :span="12">
                <Statistic title="应用数量" :value="developerInfo.appCount || 0" />
              </Col>
              <Col :span="12">
                <Statistic title="累计调用" :value="developerInfo.totalCallCount || 0" />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <!-- 应用管理 -->
      <Card class="app-list-card">
        <template #title>
          <Space>
            <span>我的应用</span>
            <Button type="primary" @click="showCreateModal = true"><PlusOutlined /> 创建应用</Button>
            <Button @click="$router.push('/open-platform/webhook')"><ApiOutlined /> Webhook管理</Button>
          </Space>
        </template>

        <Table :data-source="appList" :columns="appColumns" :loading="loading" :pagination="{ pageSize: 10 }" row-key="appId">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'appKey'">
              <div class="app-key-cell">
                <span class="key-value">{{ record.appKey }}</span>
                <Button type="link" size="small" @click="copyText(record.appKey)"><CopyOutlined /></Button>
              </div>
            </template>
            <template v-else-if="column.key === 'status'">
              <Badge :status="record.status === 'active' ? 'success' : 'warning'" />
              {{ record.status === 'active' ? '正常' : record.status === 'pending' ? '待审核' : '停用' }}
            </template>
            <template v-else-if="column.key === 'payTypes'">
              <Space wrap>
                <Tag v-for="pt in (record.enabledPayTypes || []).slice(0, 3)" :key="pt" color="blue">{{ pt }}</Tag>
                <Tag v-if="(record.enabledPayTypes || []).length > 3">+{{ record.enabledPayTypes.length - 3 }}</Tag>
              </Space>
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button type="link" size="small" @click="showAppDetail(record)"><EyeOutlined /> 详情</Button>
                <Button type="link" size="small" @click="showApiKey(record)"><KeyOutlined /> API Key</Button>
                <Button type="link" size="small" @click="resetSecret(record.appId)" danger><ReloadOutlined /> 重置密钥</Button>
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <!-- 配额信息 -->
      <Row :gutter="16" style="margin-top: 16px">
        <Col :span="6">
          <Card>
            <Statistic title="今日调用" :value="quota.daily?.used || 0" :suffix="`/ ${quota.daily?.limit || 0}`" />
            <Progress :percent="dailyPercent" :showInfo="false" size="small" />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic title="本月调用" :value="quota.monthly?.used || 0" :suffix="`/ ${quota.monthly?.limit || 0}`" />
            <Progress :percent="monthlyPercent" :showInfo="false" size="small" />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic title="限流配置" :value="quota.rateLimit || 0" suffix="次/秒" />
            <div class="quota-label">QPS 上限 (每应用)</div>
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic title="套餐等级" :value="developerInfo.level || 'trial'" />
            <div class="quota-label">{{ levelDesc }}</div>
          </Card>
        </Col>
      </Row>
    </div>

    <!-- 创建应用弹窗 -->
    <Modal v-model:open="showCreateModal" title="创建应用" width="600" @ok="handleCreateApp" :confirmLoading="loading">
      <Form :model="appForm" layout="vertical">
        <FormItem label="应用名称" name="appName" :rules="[{ required: true, message: '请输入应用名称' }]">
          <Input v-model:value="appForm.appName" placeholder="如: 商城收款系统" />
        </FormItem>
        <FormItem label="应用类型" name="appType" :rules="[{ required: true, message: '请选择应用类型' }]">
          <RadioGroup v-model:value="appForm.appType">
            <Radio value="web">PC网站</Radio>
            <Radio value="mobile">移动应用</Radio>
            <Radio value="miniapp">小程序</Radio>
            <Radio value="api">API接入</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="应用场景说明" name="appScenario">
          <Textarea v-model:value="appForm.appScenario" placeholder="描述应用的使用场景" :rows="3" />
        </FormItem>
        <FormItem label="正式域名" name="domain">
          <Input v-model:value="appForm.domain" placeholder="https://www.example.com" />
        </FormItem>
        <FormItem label="支付通知地址" name="notifyUrl" :rules="[{ required: true, message: '请填写通知地址' }]">
          <Input v-model:value="appForm.notifyUrl" placeholder="https://www.example.com/notify" />
        </FormItem>
        <FormItem label="退款通知地址" name="refundNotifyUrl">
          <Input v-model:value="appForm.refundNotifyUrl" placeholder="https://www.example.com/refund-notify" />
        </FormItem>
        <FormItem label="授权支付方式">
          <CheckboxGroup v-model:value="appForm.enabledPayTypes">
            <Checkbox value="wx_jsapi">微信JSAPI</Checkbox>
            <Checkbox value="wx_native">微信Native</Checkbox>
            <Checkbox value="wx_h5">微信H5</Checkbox>
            <Checkbox value="alipay">支付宝JSAPI</Checkbox>
            <Checkbox value="alipay_qr">支付宝扫码</Checkbox>
            <Checkbox value="unionpay">银联云闪付</Checkbox>
            <Checkbox value="bank">银行卡支付</Checkbox>
          </CheckboxGroup>
        </FormItem>
      </Form>
    </Modal>

    <!-- App Secret 弹窗 -->
    <Modal v-model:open="showSecretModal" title="应用凭证" :footer="null">
      <Alert type="warning" message="AppSecret 仅显示一次，请立即复制并妥善保管！" show-icon banner />
      <div class="secret-display">
        <FormItem label="AppKey">
          <Input :value="currentApp?.appKey" readOnly addonBefore />
          <Button type="link" @click="copyText(currentApp?.appKey)"><CopyOutlined /> 复制</Button>
        </FormItem>
        <FormItem label="AppSecret">
          <Input :value="currentApp?.appSecret" readOnly type="password" addonBefore />
          <Button type="link" @click="copyText(currentApp?.appSecret)"><CopyOutlined /> 复制</Button>
        </FormItem>
      </div>
    </Modal>

    <!-- API Key 管理 -->
    <Modal v-model:open="showKeyModal" title="API Key 管理" width="700">
      <div style="margin-bottom: 16px">
        <Button type="primary" @click="showAddKeyModal = true"><PlusOutlined /> 添加 Key</Button>
      </div>
      <Table :data-source="keyList" :columns="keyColumns" size="small" :pagination="false" row-key="keyId">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'keyValue'">
            <span style="font-family: monospace">{{ record.keyValue }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Switch :checked="record.status === 'active'" @change="() => {}" />
            {{ record.status === 'active' ? '启用' : '禁用' }}
          </template>
        </template>
      </Table>
    </Modal>

    <!-- 添加 Key -->
    <Modal v-model:open="showAddKeyModal" title="添加 API Key" @ok="handleAddKey" :confirmLoading="loading">
      <Form :model="keyForm" layout="vertical">
        <FormItem label="Key 别名" name="alias">
          <Input v-model:value="keyForm.alias" placeholder="如: 生产环境Key" />
        </FormItem>
        <FormItem label="签名算法" name="signType">
          <RadioGroup v-model:value="keyForm.signType">
            <Radio value="hmac_sha256">HMAC-SHA256 (推荐)</Radio>
            <Radio value="rsa_2048">RSA-SHA256</Radio>
            <Radio value="sm2">SM2 国密</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="绑定IP (可选)" name="boundIp">
          <Input v-model:value="keyForm.boundIp" placeholder="留空表示不限制IP，支持多IP逗号分隔" />
        </FormItem>
        <FormItem label="过期时间" name="expireDays">
          <RadioGroup v-model:value="keyForm.expireDays">
            <Radio :value="0">永不过期</Radio>
            <Radio :value="90">90天</Radio>
            <Radio :value="180">180天</Radio>
            <Radio :value="365">1年</Radio>
          </RadioGroup>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Card, Form, FormItem, Input, InputPassword, Button, Tabs, TabPane, Row, Col, Avatar, Space, Tag, Statistic, Progress, Table, Badge, Modal, Alert, Radio, RadioGroup, Checkbox, CheckboxGroup, Textarea, Switch, Select, SelectOption } from 'ant-design-vue';
import { PlusOutlined, CopyOutlined, EyeOutlined, KeyOutlined, ReloadOutlined, LogoutOutlined, SearchOutlined, ApiOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import * as opApi from '@/api/open-platform';

const loading = ref(false);
const activeTab = ref('login');
const devTab = ref('app');
const isLoggedIn = ref(false);
const appKeyword = ref('');
const appStatusFilter = ref('');
const showCreateModal = ref(false);
const showSecretModal = ref(false);
const showKeyModal = ref(false);
const showAddKeyModal = ref(false);
const currentApp = ref<any>(null);
const appList = ref<any[]>([]);
const keyList = ref<any[]>([]);
const quota = ref<any>({});

const developerInfo = reactive({
  developerId: '', developerName: '', email: '', mobile: '', company: '',
  level: 'trial', status: 'pending', appCount: 0, totalCallCount: 0, mchNo: '',
  token: '',
});

const loginForm = reactive({ username: '', password: '' });
const registerForm = reactive({
  developerName: '', username: '', password: '', email: '', mobile: '',
  company: '', businessLicense: '', description: '',
});
const appForm = reactive({
  appName: '', appType: 'web', appScenario: '', domain: '',
  notifyUrl: '', refundNotifyUrl: '', enabledPayTypes: ['wx_jsapi', 'wx_native', 'alipay'],
});
const keyForm = reactive({ alias: '', signType: 'hmac_sha256', boundIp: '', expireDays: 0 });

const statusColor = computed(() => {
  const m: Record<string, string> = { pending: 'gold', active: 'green', suspended: 'red' };
  return m[developerInfo.status] || 'default';
});
const levelColor = computed(() => {
  const m: Record<string, string> = { trial: 'default', basic: 'blue', professional: 'purple', enterprise: 'red' };
  return m[developerInfo.level] || 'default';
});
const dailyPercent = computed(() => {
  const used = quota.value?.daily?.used || 0;
  const limit = quota.value?.daily?.limit || 1;
  return Math.min(Math.round((used / limit) * 100), 100);
});
const monthlyPercent = computed(() => {
  const used = quota.value?.monthly?.used || 0;
  const limit = quota.value?.monthly?.limit || 1;
  return Math.min(Math.round((used / limit) * 100), 100);
});
const levelDesc = computed(() => {
  const m: Record<string, string> = {
    trial: '体验版 (1应用, 100次/日)',
    basic: '基础版 (3应用, 1万次/日)',
    professional: '专业版 (10应用, 10万次/日)',
    enterprise: '企业版 (50应用, 100万次/日)',
  };
  return m[developerInfo.level] || '';
});

const appColumns = [
  { title: 'AppKey', key: 'appKey', width: 220 },
  { title: '应用名称', dataIndex: 'appName', width: 160 },
  { title: '类型', dataIndex: 'appType', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '支付方式', key: 'payTypes', width: 280 },
  { title: '今日调用', dataIndex: 'todayCallCount', width: 100 },
  { title: '操作', key: 'action', width: 240 },
];

const keyColumns = [
  { title: 'Key ID', dataIndex: 'keyId', width: 120 },
  { title: 'Key', key: 'keyValue', width: 240 },
  { title: '签名算法', dataIndex: 'signType', width: 120 },
  { title: '状态', key: 'status', width: 80 },
  { title: '累计使用', dataIndex: 'usedCount', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 160 },
];

async function handleLogin() {
  loading.value = true;
  try {
    const res = await opApi.devLogin(loginForm) as any;
    if (res.code === 'OP0000') {
      Object.assign(developerInfo, res.data);
      isLoggedIn.value = true;
      message.success('登录成功');
      saveSession();
      await loadData();
    } else {
      message.error(res.message || '登录失败');
    }
  } catch (e: any) {
    message.error(e.message || '登录失败');
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  loading.value = true;
  try {
    const res = await opApi.devRegister(registerForm) as any;
    if (res.code === 'OP0000') {
      message.success('注册成功，请等待审核');
      activeTab.value = 'login';
    } else {
      message.error(res.message || '注册失败');
    }
  } catch (e: any) {
    message.error(e.message || '注册失败');
  } finally {
    loading.value = false;
  }
}

async function loadData() {
  try {
    const appRes = await opApi.getAppList({
      page: 1,
      pageSize: 100,
      keyword: appKeyword.value || undefined,
      status: appStatusFilter.value || undefined,
    });
    appList.value = (appRes as any)?.list || [];

    const firstApp = appList.value[0];
    if (firstApp) {
      if (!currentApp.value) currentApp.value = firstApp;
      const quotaRes = await opApi.getQuota(firstApp.appId);
      quota.value = (quotaRes as any) || {};
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleCreateApp() {
  loading.value = true;
  try {
    const res = await opApi.createApp(appForm) as any;
    if (res.code === 'OP0000') {
      message.success('应用创建成功');
      showCreateModal.value = false;
      // 显示凭证弹窗
      currentApp.value = res.data;
      showSecretModal.value = true;
      loadData();
    } else {
      message.error(res.message || '创建失败');
    }
  } catch (e: any) {
    message.error(e.message || '创建失败');
  } finally {
    loading.value = false;
  }
}

function handleLogout() {
  localStorage.removeItem('op_developer');
  Object.assign(developerInfo, {
    developerId: '', developerName: '', email: '', mobile: '', company: '',
    level: 'trial', status: 'pending', appCount: 0, totalCallCount: 0, mchNo: '', token: '',
  });
  isLoggedIn.value = false;
  appList.value = [];
  quota.value = {};
  activeTab.value = 'login';
  message.info('已退出登录');
}

async function showAppDetail(record: any) {
  try {
    const res = await opApi.getAppDetail(record.appId) as any;
    if (res.code === 'OP0000') {
      currentApp.value = res.data;
      showSecretModal.value = true;
    }
  } catch (e) {
    message.error('获取详情失败');
  }
}

async function showApiKey(record: any) {
  currentApp.value = record;
  showKeyModal.value = true;
  try {
    const [keyRes, quotaRes] = await Promise.all([
      opApi.getKeyList(record.appId),
      opApi.getQuota(record.appId),
    ]);
    keyList.value = (keyRes as any)?.data || [];
    quota.value = (quotaRes as any) || {};
  } catch (e) {
    console.error(e);
  }
}

async function handleAddKey() {
  if (!currentApp.value) return;
  loading.value = true;
  try {
    const res = await opApi.createApiKey(currentApp.value.appId, keyForm) as any;
    if (res.code === 'OP0000') {
      message.success('Key 创建成功，请立即复制保存');
      keyList.value.unshift(res.data);
      showAddKeyModal.value = false;
    }
  } catch (e: any) {
    message.error(e.message || '创建失败');
  } finally {
    loading.value = false;
  }
}

async function resetSecret(appId: string) {
  try {
    const res = await opApi.resetAppSecret(appId) as any;
    if (res.code === 'OP0000') {
      message.warning('AppSecret 已重置，请立即保存新密钥');
      currentApp.value = { ...currentApp.value, appSecret: res.data.appSecret };
      showSecretModal.value = true;
    }
  } catch (e) {
    message.error('重置失败');
  }
}

function copyText(text: string) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => message.success('已复制到剪贴板'));
}

function saveSession() {
  if (developerInfo.token) {
    localStorage.setItem('op_developer', JSON.stringify({
      developerId: developerInfo.developerId,
      developerName: developerInfo.developerName,
      email: developerInfo.email,
      mobile: developerInfo.mobile,
      company: developerInfo.company,
      level: developerInfo.level,
      status: developerInfo.status,
      appCount: developerInfo.appCount,
      totalCallCount: developerInfo.totalCallCount,
      mchNo: developerInfo.mchNo,
      token: developerInfo.token,
    }));
  }
}

function loadSession() {
  const saved = localStorage.getItem('op_developer');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      Object.assign(developerInfo, data);
      developerInfo.token = data.token;
      isLoggedIn.value = true;
      loadData();
    } catch (e) {
      localStorage.removeItem('op_developer');
    }
  }
}

onMounted(() => {
  loadSession();
});
</script>

<style scoped>
.developer-center { padding: 16px; background: #f0f2f5; }
.register-card { max-width: 800px; margin: 0 auto; }
.info-card, .app-list-card { margin-bottom: 16px; }
.dev-info { display: flex; align-items: center; gap: 16px; }
.dev-detail h2 { margin: 0 0 8px; }
.app-key-cell { display: flex; align-items: center; }
.key-value { font-family: monospace; font-size: 12px; color: #666; }
.quota-label { font-size: 12px; color: #999; margin-top: 4px; }
.secret-display :deep(.ant-form-item) { margin-bottom: 16px; }
</style>
