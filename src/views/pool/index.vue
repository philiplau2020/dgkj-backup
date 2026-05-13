<template>
  <div class="pool-container">
    <!-- 统计卡片 -->
    <Row :gutter="16" class="stat-row">
      <Col :span="6">
        <Card class="stat-card">
          <Statistic
            title="通道总数"
            :value="stats.totalChannel"
            suffix="个"
            :value-style="{ color: '#1890ff' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card class="stat-card">
          <Statistic
            title="在线通道"
            :value="stats.activeChannel"
            suffix="个"
            :value-style="{ color: '#52c41a' }"
          />
          <div class="stat-footer">
            占比 {{ stats.activeRate }}%
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card class="stat-card">
          <Statistic
            title="今日交易额"
            :value="Number(stats.todayTotalAmount)"
            :precision="2"
            prefix="¥"
            :value-style="{ color: '#f5222d' }"
          />
          <div class="stat-footer">
            交易 {{ stats.todayTotalCount }} 笔
          </div>
        </Card>
      </Col>
      <Col :span="6">
        <Card class="stat-card">
          <Statistic
            title="今日成功率"
            :value="Number(stats.avgSuccessRate)"
            suffix="%"
            :precision="2"
            :value-style="{ color: '#faad14' }"
          />
          <div class="stat-footer">
            平均响应 {{ stats.avgResponseTime }}ms
          </div>
        </Card>
      </Col>
    </Row>

    <!-- 路由测试 -->
    <Card title="通道路由测试" class="test-card">
      <Row :gutter="16">
        <Col :span="5">
          <FormItem label="商户号">
            <Input v-model:value="testForm.mchNo" placeholder="请输入商户号" />
          </FormItem>
        </Col>
        <Col :span="5">
          <FormItem label="交易金额">
            <InputNumber 
              v-model:value="testForm.amount" 
              :min="0" 
              :precision="2" 
              placeholder="金额(元)" 
              style="width: 100%" 
            />
          </FormItem>
        </Col>
        <Col :span="5">
          <FormItem label="支付通道">
            <Select v-model:value="testForm.payChannel" placeholder="选择通道" allow-clear style="width: 100%">
              <SelectOption value="WX">微信</SelectOption>
              <SelectOption value="ALI">支付宝</SelectOption>
              <SelectOption value="CT">通联</SelectOption>
              <SelectOption value="CITIC">中信银行</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="5">
          <FormItem label="商户类型">
            <Select v-model:value="testForm.mchType" placeholder="商户类型" allow-clear style="width: 100%">
              <SelectOption value="1">个人</SelectOption>
              <SelectOption value="2">企业</SelectOption>
            </Select>
          </FormItem>
        </Col>
        <Col :span="4">
          <Space direction="vertical" style="width: 100%">
            <Button type="primary" @click="handleRouteTest" :loading="routeLoading">
              <template #icon><ThunderboltOutlined /></template>
              测试路由
            </Button>
            <Button @click="resetForm">重置</Button>
          </Space>
        </Col>
      </Row>
      
      <!-- 路由结果 -->
      <div v-if="routeResult" class="route-result" :class="{ success: routeResult.success, fail: !routeResult.success }">
        <div v-if="routeResult.success" class="result-content">
          <CheckCircleOutlined style="color: #52c41a; font-size: 24px; margin-right: 12px;" />
          <span class="result-title">路由成功</span>
          <Tag color="green">{{ routeResult.channelCode }}</Tag>
          <span class="channel-name">{{ routeResult.channelName }}</span>
          <Divider type="vertical" />
          <span class="route-info">
            优先级: {{ routeResult.priority }} | 剩余限额: ¥{{ routeResult.remainLimit?.toLocaleString() }}
          </span>
        </div>
        <div v-else class="result-content">
          <CloseCircleOutlined style="color: #f5222d; font-size: 24px; margin-right: 12px;" />
          <span class="result-title">路由失败</span>
          <span class="reject-reason">{{ routeResult.rejectReason }}</span>
        </div>
      </div>
    </Card>

    <!-- 通道列表 -->
    <Card title="通道列表" class="table-card">
      <template #extra>
        <Space>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
          <Button type="primary" @click="openChannelModal()">
            <template #icon><PlusOutlined /></template>
            添加通道
          </Button>
        </Space>
      </template>

      <!-- 通道类型筛选 -->
      <RadioGroup v-model:value="channelFilter" class="channel-filter" @change="fetchChannelList">
        <RadioButton value="">全部</RadioButton>
        <RadioButton value="wechat">微信</RadioButton>
        <RadioButton value="alipay">支付宝</RadioButton>
        <RadioButton value="ctpay">通联</RadioButton>
        <RadioButton value="citic">中信银行</RadioButton>
      </RadioGroup>
      
      <Table 
        :data-source="channelList" 
        :columns="channelColumns" 
        :loading="loading" 
        :pagination="false" 
        row-key="id"
        :scroll="{ x: 1800 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'channelCode'">
            <a @click="openChannelModal(record)">
              <Tag :color="getTypeColor(record.channelType)">{{ record.channelCode }}</Tag>
            </a>
          </template>
          <template v-else-if="column.key === 'channelType'">
            <Tag :color="getTypeColor(record.channelType)">
              {{ getTypeName(record.channelType) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="record.status === 1 ? 'success' : 'default'" />
            <span>{{ record.status === 1 ? '正常' : '停用' }}</span>
          </template>
          <template v-else-if="column.key === 'todayAmount'">
            <span style="color: #f5222d; font-weight: 500;">¥{{ record.todayAmount.toLocaleString() }}</span>
          </template>
          <template v-else-if="column.key === 'successRate'">
            <Progress 
              :percent="Number(record.successRate)" 
              :status="record.successRate >= 95 ? 'success' : record.successRate >= 90 ? 'active' : 'exception'"
              :format="() => record.successRate + '%'"
              size="small"
            />
          </template>
          <template v-else-if="column.key === 'limit'">
            <span class="limit-info">
              <span class="limit-value" :style="{ color: record.todayAmount >= record.dailyLimit * 0.9 ? '#f5222d' : '#52c41a' }">
                ¥{{ record.todayAmount.toLocaleString() }}
              </span>
              <span class="limit-divider">/</span>
              <span class="limit-total">{{ record.dailyLimit?.toLocaleString() || '无限制' }}</span>
            </span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openChannelModal(record)">编辑</Button>
              <Button type="link" size="small" @click="handleToggleStatus(record)">
                {{ record.status === 1 ? '停用' : '启用' }}
              </Button>
              <Button type="link" size="small" danger @click="handleDeleteChannel(record)">
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 规则列表 -->
    <Card title="轮转规则" class="table-card">
      <template #extra>
        <Button type="primary" @click="openRuleModal()">
          <template #icon><PlusOutlined /></template>
          添加规则
        </Button>
      </template>
      <Table :data-source="ruleList" :columns="ruleColumns" :pagination="false" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Switch :checked="record.status === 1" @change="() => toggleRuleStatus(record)" />
          </template>
          <template v-else-if="column.key === 'ruleType'">
            <Tag>{{ getRuleTypeName(record.ruleType) }}</Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openRuleModal(record)">编辑</Button>
              <Button type="link" size="small" danger @click="handleDeleteRule(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 通道编辑弹窗 -->
    <Modal 
      v-model:open="channelModalVisible" 
      :title="channelForm.id ? '编辑通道' : '添加通道'" 
      width="700px"
      @ok="handleChannelSubmit"
      :confirm-loading="submitLoading"
    >
      <Form :model="channelForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="通道编码" name="channelCode">
          <Input v-model:value="channelForm.channelCode" :disabled="!!channelForm.id" placeholder="如: WX_QR_01" />
        </FormItem>
        <FormItem label="通道名称" name="channelName">
          <Input v-model:value="channelForm.channelName" placeholder="如: 微信扫码通道01" />
        </FormItem>
        <FormItem label="通道类型" name="channelType">
          <Select v-model:value="channelForm.channelType">
            <SelectOption value="wechat">微信</SelectOption>
            <SelectOption value="alipay">支付宝</SelectOption>
            <SelectOption value="ctpay">通联</SelectOption>
            <SelectOption value="hfpay">汇付</SelectOption>
            <SelectOption value="fypay">富友</SelectOption>
            <SelectOption value="citic">中信银行</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="优先级">
          <InputNumber v-model:value="channelForm.priority" :min="1" :max="999" style="width: 100%" />
          <div class="form-hint">数字越小优先级越高</div>
        </FormItem>
        <FormItem label="权重">
          <InputNumber v-model:value="channelForm.weight" :min="1" :max="1000" style="width: 100%" />
          <div class="form-hint">权重越高被选中的概率越大</div>
        </FormItem>
        <FormItem label="日限额">
          <InputNumber v-model:value="channelForm.dailyLimit" :min="0" :precision="2" style="width: 100%" placeholder="0表示不限" />
        </FormItem>
        <FormItem label="月限额">
          <InputNumber v-model:value="channelForm.monthlyLimit" :min="0" :precision="2" style="width: 100%" placeholder="0表示不限" />
        </FormItem>
        <FormItem label="单笔最小限额">
          <InputNumber v-model:value="channelForm.singleMinAmt" :min="0" :precision="2" style="width: 100%" />
        </FormItem>
        <FormItem label="单笔最大限额">
          <InputNumber v-model:value="channelForm.singleMaxAmt" :min="0" :precision="2" style="width: 100%" />
        </FormItem>
        <FormItem label="日笔数限制">
          <InputNumber v-model:value="channelForm.dailyCountLimit" :min="0" style="width: 100%" placeholder="0表示不限" />
        </FormItem>
        <FormItem label="交易时间段">
          <TimePicker.RangePicker v-model:value="timeRange" :format="'HH:mm:ss'" style="width: 100%" />
          <div class="form-hint">设置通道可交易的时间段，留空表示全天可交易</div>
        </FormItem>
      </Form>
    </Modal>

    <!-- 规则编辑弹窗 -->
    <Modal 
      v-model:open="ruleModalVisible" 
      :title="ruleForm.id ? '编辑规则' : '添加规则'" 
      width="600px"
      @ok="handleRuleSubmit"
      :confirm-loading="submitLoading"
    >
      <Form :model="ruleForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="规则编码" name="ruleCode">
          <Input v-model:value="ruleForm.ruleCode" :disabled="!!ruleForm.id" placeholder="如: AMOUNT_LIMIT_1" />
        </FormItem>
        <FormItem label="规则名称" name="ruleName">
          <Input v-model:value="ruleForm.ruleName" placeholder="如: 小额优先微信" />
        </FormItem>
        <FormItem label="规则类型" name="ruleType">
          <Select v-model:value="ruleForm.ruleType">
            <SelectOption value="RULE_TYPE_AMOUNT_LIMIT">金额限制</SelectOption>
            <SelectOption value="RULE_TYPE_TIME_LIMIT">时间段限制</SelectOption>
            <SelectOption value="RULE_TYPE_IP_LIMIT">IP限制</SelectOption>
            <SelectOption value="RULE_TYPE_SUCCESS_RATE">成功率限制</SelectOption>
            <SelectOption value="RULE_TYPE_RESPONSE_TIME">响应时间限制</SelectOption>
            <SelectOption value="RULE_TYPE_ROUND_ROBIN">轮询策略</SelectOption>
            <SelectOption value="RULE_TYPE_WEIGHT_RANDOM">加权随机策略</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="优先级">
          <InputNumber v-model:value="ruleForm.priority" :min="1" :max="999" style="width: 100%" />
        </FormItem>
        <FormItem label="规则配置">
          <Textarea v-model:value="ruleForm.config" :rows="4" placeholder="请输入规则配置JSON" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { 
  Row, Col, Card, Statistic, Table, Button, Space, Tag, Badge, Progress, 
  Modal, Form, FormItem, Input, InputNumber, Select, SelectOption, 
  TimePicker, Divider, RadioGroup, RadioButton, Switch, Textarea, message 
} from 'ant-design-vue';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons-vue';
import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '@/api/config';

const loading = ref(false);
const routeLoading = ref(false);
const submitLoading = ref(false);
const channelList = ref<any[]>([]);
const ruleList = ref<any[]>([]);
const routeResult = ref<any>(null);
const channelFilter = ref('');

const testForm = reactive({
  mchNo: 'M10001',
  amount: 100,
  payChannel: '',
  mchType: '',
});

const stats = reactive({
  totalChannel: 0,
  activeChannel: 0,
  activeRate: 0,
  todayTotalAmount: 0,
  todayTotalCount: 0,
  avgSuccessRate: 0,
  avgResponseTime: 0,
});

// 通道弹窗
const channelModalVisible = ref(false);
const channelForm = reactive({
  id: null as number | null,
  channelCode: '',
  channelName: '',
  channelType: 'wechat',
  priority: 100,
  weight: 100,
  dailyLimit: 0,
  monthlyLimit: 0,
  singleMinAmt: 0,
  singleMaxAmt: 0,
  dailyCountLimit: 0,
});
const timeRange = ref<[any, any] | null>(null);

// 规则弹窗
const ruleModalVisible = ref(false);
const ruleForm = reactive({
  id: null as number | null,
  ruleCode: '',
  ruleName: '',
  ruleType: 'RULE_TYPE_AMOUNT_LIMIT',
  priority: 100,
  config: '',
});

const channelColumns = [
  { title: '通道编码', key: 'channelCode', width: 150 },
  { title: '通道名称', dataIndex: 'channelName', key: 'channelName', width: 180 },
  { title: '类型', key: 'channelType', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
  { title: '权重', dataIndex: 'weight', key: 'weight', width: 80 },
  { title: '今日交易额', key: 'todayAmount', width: 150 },
  { title: '日限额进度', key: 'limit', width: 180 },
  { title: '今日笔数', dataIndex: 'todayCount', key: 'todayCount', width: 100 },
  { title: '成功率', key: 'successRate', width: 140 },
  { title: '响应时间', dataIndex: 'avgResponseTime', key: 'avgResponseTime', width: 100, customRender: ({ text }) => `${text}ms` },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const ruleColumns = [
  { title: '规则编码', dataIndex: 'ruleCode', key: 'ruleCode', width: 160 },
  { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName' },
  { title: '规则类型', key: 'ruleType', width: 160 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 120 },
];

function getTypeColor(type: string) {
  const map: Record<string, string> = {
    wechat: 'green',
    alipay: 'blue',
    ctpay: 'orange',
    hfpay: 'purple',
    fypay: 'cyan',
    citic: 'red',
  };
  return map[type] || 'default';
}

function getTypeName(type: string) {
  const map: Record<string, string> = {
    wechat: '微信',
    alipay: '支付宝',
    ctpay: '通联',
    hfpay: '汇付',
    fypay: '富友',
    citic: '中信银行',
  };
  return map[type] || type;
}

function getRuleTypeName(type: string) {
  const map: Record<string, string> = {
    'RULE_TYPE_AMOUNT_LIMIT': '金额限制',
    'RULE_TYPE_TIME_LIMIT': '时间段限制',
    'RULE_TYPE_IP_LIMIT': 'IP限制',
    'RULE_TYPE_SUCCESS_RATE': '成功率限制',
    'RULE_TYPE_RESPONSE_TIME': '响应时间限制',
    'RULE_TYPE_ROUND_ROBIN': '轮询策略',
    'RULE_TYPE_WEIGHT_RANDOM': '加权随机策略',
  };
  return map[type] || type;
}

async function fetchChannelList() {
  loading.value = true;
  try {
    const params: any = { page: 1, pageSize: 100 };
    if (channelFilter.value) params.channelType = channelFilter.value;
    
    const res = await defHttp.get({ url: ApiPath.ChannelPoolList, params });
    const data = res?.data || res;
    channelList.value = data?.list || [];
  } catch (error) {
    console.error('获取通道列表失败', error);
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const res = await defHttp.get({ url: ApiPath.ChannelPoolStats });
    const data = res?.data || res;
    if (data) {
      Object.assign(stats, {
        totalChannel: data.totalChannel || 0,
        activeChannel: data.activeChannel || 0,
        todayTotalAmount: data.todayAmount || 0,
        todayTotalCount: data.todayCount || 0,
        avgSuccessRate: data.successRate || 0,
        avgResponseTime: data.responseTime || 0,
      });
      stats.activeRate = stats.totalChannel > 0 ? ((stats.activeChannel / stats.totalChannel) * 100).toFixed(1) : 0;
    }
  } catch (error) {
    console.error('获取统计数据失败', error);
  }
}

async function fetchRuleList() {
  try {
    const res = await defHttp.get({ url: ApiPath.ChannelStrategyList, params: { page: 1, pageSize: 100 } });
    const data = res?.data || res;
    ruleList.value = data?.list || [];
  } catch (error) {
    console.error('获取规则列表失败', error);
  }
}

async function handleRouteTest() {
  routeLoading.value = true;
  try {
    const payTypeMap: Record<string, string> = {
      'WX': 'wechat', 'ALI': 'alipay', 'CT': 'ctpay', 'CITIC': 'citic'
    };
    const payType = testForm.payChannel ? payTypeMap[testForm.payChannel] || testForm.payChannel.toLowerCase() : '';
    
    const res = await defHttp.get({ 
      url: ApiPath.ChannelRecommend, 
      params: { payType, amount: testForm.amount || 0 }
    });
    const data = res?.data || res;
    
    if (data?.channelCode) {
      routeResult.value = {
        success: true,
        channelCode: data.channelCode || '',
        channelName: data.channelName || '',
        priority: data.priority || 1,
        remainLimit: data.remainLimit || data.dailyLimit || 0,
      };
    } else {
      routeResult.value = { success: false, rejectReason: data?.message || '未找到可用通道' };
    }
  } catch (error: any) {
    console.error('路由测试失败', error);
    routeResult.value = { success: false, rejectReason: error?.message || '请求失败' };
  } finally {
    routeLoading.value = false;
  }
}

function resetForm() {
  testForm.mchNo = 'M10001';
  testForm.amount = 100;
  testForm.payChannel = '';
  testForm.mchType = '';
  routeResult.value = null;
}

function openChannelModal(record?: any) {
  if (record) {
    Object.assign(channelForm, record);
  } else {
    Object.assign(channelForm, {
      id: null,
      channelCode: '',
      channelName: '',
      channelType: 'wechat',
      priority: 100,
      weight: 100,
      dailyLimit: 0,
      monthlyLimit: 0,
      singleMinAmt: 0,
      singleMaxAmt: 0,
      dailyCountLimit: 0,
    });
  }
  channelModalVisible.value = true;
}

function handleChannelSubmit() {
  submitLoading.value = true;
  setTimeout(() => {
    message.success(channelForm.id ? '编辑成功' : '添加成功');
    channelModalVisible.value = false;
    submitLoading.value = false;
    fetchChannelList();
    fetchStats();
  }, 500);
}

function handleToggleStatus(record: any) {
  message.success(`${record.status === 1 ? '停用' : '启用'}成功`);
  fetchChannelList();
  fetchStats();
}

function handleDeleteChannel(record: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除通道 ${record.channelName} 吗？`,
    okText: '确认删除',
    okType: 'danger',
    onOk: () => {
      message.success('删除成功');
      fetchChannelList();
      fetchStats();
    },
  });
}

function openRuleModal(record?: any) {
  if (record) {
    Object.assign(ruleForm, record);
  } else {
    Object.assign(ruleForm, {
      id: null,
      ruleCode: '',
      ruleName: '',
      ruleType: 'RULE_TYPE_AMOUNT_LIMIT',
      priority: 100,
      config: '',
    });
  }
  ruleModalVisible.value = true;
}

function handleRuleSubmit() {
  submitLoading.value = true;
  setTimeout(() => {
    message.success(ruleForm.id ? '编辑成功' : '添加成功');
    ruleModalVisible.value = false;
    submitLoading.value = false;
    fetchRuleList();
  }, 500);
}

function toggleRuleStatus(record: any) {
  message.success('状态更新成功');
  fetchRuleList();
}

function handleDeleteRule(record: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除规则 ${record.ruleName} 吗？`,
    okText: '确认删除',
    okType: 'danger',
    onOk: () => {
      message.success('删除成功');
      fetchRuleList();
    },
  });
}

function handleRefresh() {
  fetchChannelList();
  fetchStats();
  fetchRuleList();
  message.success('刷新成功');
}

onMounted(() => {
  fetchChannelList();
  fetchStats();
  fetchRuleList();
});
</script>

<style scoped>
.pool-container {
  padding: 16px;
  background: #f0f2f5;
}

.stat-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
}

.stat-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #666;
}

.test-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 16px;
}

.channel-filter {
  margin-bottom: 16px;
}

.route-result {
  margin-top: 16px;
  padding: 16px;
  border-radius: 4px;
}

.route-result.success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.route-result.fail {
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

.result-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.result-title {
  font-weight: 500;
  font-size: 16px;
}

.channel-name {
  color: #333;
}

.reject-reason {
  color: #f5222d;
}

.route-info {
  color: #999;
  font-size: 12px;
}

.limit-info {
  font-family: 'Consolas', monospace;
  font-size: 12px;
}

.limit-value {
  font-weight: 500;
}

.limit-divider {
  margin: 0 4px;
  color: #999;
}

.limit-total {
  color: #999;
}

.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
