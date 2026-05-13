<template>
  <div class="channel-config-container">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="通道编码">
          <Input v-model:value="searchForm.channelCode" placeholder="请输入通道编码" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="通道类型">
          <Select v-model:value="searchForm.channelType" allow-clear style="width: 120px">
            <SelectOption value="wechat">微信</SelectOption>
            <SelectOption value="alipay">支付宝</SelectOption>
            <SelectOption value="ctpay">通联</SelectOption>
            <SelectOption value="hfpay">汇付</SelectOption>
            <SelectOption value="fypay">富友</SelectOption>
            <SelectOption value="citic">中信银行</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 100px">
            <SelectOption :value="1">正常</SelectOption>
            <SelectOption :value="0">停用</SelectOption>
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
          <Card size="small">
            <Statistic title="通道总数" :value="stats.totalChannel" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="在线通道" :value="stats.activeChannel" :value-style="{ color: '#52c41a' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="今日交易额" :value="Number(stats.todayTotalAmount)" :precision="2" prefix="¥" :value-style="{ color: '#f5222d' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="平均成功率" :value="Number(stats.avgSuccessRate)" suffix="%" :precision="2" />
          </Card>
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openAddModal">
            <template #icon><PlusOutlined /></template>
            新增通道
          </Button>
          <Button @click="handleExport">
            <template #icon><DownloadOutlined /></template>
            导出
          </Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 通道列表 -->
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
          <template v-if="column.key === 'channelCode'">
            <a @click="openDetailModal(record)">
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
            <span style="color: #f5222d">¥{{ record.todayAmount?.toFixed(2) || '0.00' }}</span>
          </template>
          <template v-else-if="column.key === 'successRate'">
            <Progress 
              :percent="Number(record.successRate || 0)" 
              :status="record.successRate >= 95 ? 'success' : record.successRate >= 90 ? 'active' : 'exception'" 
              size="small" 
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="openEditModal(record)">编辑</Button>
              <Button type="link" size="small" @click="handleToggle(record)">
                {{ record.status === 1 ? '停用' : '启用' }}
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="通道详情"
      width="700px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentChannel">
        <DescriptionsItem label="通道编码">
          <Tag :color="getTypeColor(currentChannel.channelType)">{{ currentChannel.channelCode }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="通道名称">{{ currentChannel.channelName }}</DescriptionsItem>
        <DescriptionsItem label="通道类型">
          <Tag :color="getTypeColor(currentChannel.channelType)">
            {{ getTypeName(currentChannel.channelType) }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="currentChannel.status === 1 ? 'success' : 'default'" />
          {{ currentChannel.status === 1 ? '正常' : '停用' }}
        </DescriptionsItem>
        <DescriptionsItem label="优先级">{{ currentChannel.priority }}</DescriptionsItem>
        <DescriptionsItem label="权重">{{ currentChannel.weight }}</DescriptionsItem>
        <DescriptionsItem label="日限额">{{ currentChannel.dailyLimit?.toLocaleString() || '无限制' }}</DescriptionsItem>
        <DescriptionsItem label="月限额">{{ currentChannel.monthlyLimit?.toLocaleString() || '无限制' }}</DescriptionsItem>
        <DescriptionsItem label="单笔最小限额">¥{{ currentChannel.singleMinAmt }}</DescriptionsItem>
        <DescriptionsItem label="单笔最大限额">¥{{ currentChannel.singleMaxAmt }}</DescriptionsItem>
        <DescriptionsItem label="日笔数限制">{{ currentChannel.dailyCountLimit || '无限制' }}</DescriptionsItem>
        <DescriptionsItem label="月笔数限制">{{ currentChannel.monthlyCountLimit || '无限制' }}</DescriptionsItem>
        <DescriptionsItem label="交易时间段" :span="2">
          {{ currentChannel.startTime }} - {{ currentChannel.endTime }}
        </DescriptionsItem>
        <DescriptionsItem label="今日交易额">¥{{ currentChannel.todayAmount?.toFixed(2) || '0.00' }}</DescriptionsItem>
        <DescriptionsItem label="今日交易笔数">{{ currentChannel.todayCount || 0 }}</DescriptionsItem>
        <DescriptionsItem label="本月交易额">¥{{ currentChannel.monthAmount?.toFixed(2) || '0.00' }}</DescriptionsItem>
        <DescriptionsItem label="本月交易笔数">{{ currentChannel.monthCount || 0 }}</DescriptionsItem>
        <DescriptionsItem label="成功率">{{ currentChannel.successRate || 0 }}%</DescriptionsItem>
        <DescriptionsItem label="平均响应时间">{{ currentChannel.avgResponseTime || 0 }}ms</DescriptionsItem>
      </Descriptions>
    </Modal>

    <!-- 新增/编辑弹窗 -->
    <Modal
      v-model:open="formVisible"
      :title="formMode === 'add' ? '新增通道' : '编辑通道'"
      width="600px"
      @ok="handleFormSubmit"
      :confirm-loading="submitLoading"
    >
      <Form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="formRules">
        <FormItem label="通道编码" name="channelCode">
          <Input v-model:value="formData.channelCode" placeholder="请输入通道编码" :disabled="formMode === 'edit'" />
        </FormItem>
        <FormItem label="通道名称" name="channelName">
          <Input v-model:value="formData.channelName" placeholder="请输入通道名称" />
        </FormItem>
        <FormItem label="通道类型" name="channelType">
          <Select v-model:value="formData.channelType" placeholder="请选择通道类型">
            <SelectOption value="wechat">微信</SelectOption>
            <SelectOption value="alipay">支付宝</SelectOption>
            <SelectOption value="ctpay">通联</SelectOption>
            <SelectOption value="hfpay">汇付</SelectOption>
            <SelectOption value="fypay">富友</SelectOption>
            <SelectOption value="citic">中信银行</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="优先级" name="priority">
          <InputNumber v-model:value="formData.priority" :min="1" :max="100" style="width: 100%" />
          <div class="form-tip">数字越小优先级越高</div>
        </FormItem>
        <FormItem label="权重" name="weight">
          <InputNumber v-model:value="formData.weight" :min="1" :max="1000" style="width: 100%" />
          <div class="form-tip">权重越高被选中概率越大</div>
        </FormItem>
        <FormItem label="日限额">
          <InputNumber v-model:value="formData.dailyLimit" :min="0" style="width: 100%" placeholder="0表示不限" />
        </FormItem>
        <FormItem label="月限额">
          <InputNumber v-model:value="formData.monthlyLimit" :min="0" style="width: 100%" placeholder="0表示不限" />
        </FormItem>
        <FormItem label="单笔最小限额">
          <InputNumber v-model:value="formData.singleMinAmt" :min="0" style="width: 100%" />
        </FormItem>
        <FormItem label="单笔最大限额">
          <InputNumber v-model:value="formData.singleMaxAmt" :min="0" style="width: 100%" />
        </FormItem>
        <FormItem label="日笔数限制">
          <InputNumber v-model:value="formData.dailyCountLimit" :min="0" style="width: 100%" placeholder="0表示不限" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { 
  Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, 
  Tag, Badge, Progress, Row, Col, Statistic, Modal, Descriptions, 
  DescriptionsItem, InputNumber, message 
} from 'ant-design-vue';
import { PlusOutlined, ReloadOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons-vue';

const loading = ref(false);
const submitLoading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  channelCode: '',
  channelType: '',
  status: undefined as number | undefined,
});

const stats = reactive({
  totalChannel: 0,
  activeChannel: 0,
  todayTotalAmount: 0,
  avgSuccessRate: 0,
});

const columns = [
  { title: '通道编码', key: 'channelCode', width: 140 },
  { title: '通道名称', dataIndex: 'channelName', key: 'channelName', width: 150 },
  { title: '通道类型', key: 'channelType', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
  { title: '权重', dataIndex: 'weight', key: 'weight', width: 80 },
  { title: '今日交易额', key: 'todayAmount', width: 130 },
  { title: '今日笔数', dataIndex: 'todayCount', key: 'todayCount', width: 100 },
  { title: '成功率', key: 'successRate', width: 150 },
  { title: '平均响应', dataIndex: 'avgResponseTime', key: 'avgResponseTime', width: 100, customRender: ({ text }) => `${text || 0}ms` },
  { title: '操作', key: 'action', width: 180 },
];

const currentChannel = ref<any>(null);
const detailVisible = ref(false);

const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formData = reactive({
  channelCode: '',
  channelName: '',
  channelType: 'wechat',
  priority: 10,
  weight: 100,
  dailyLimit: 0,
  monthlyLimit: 0,
  singleMinAmt: 0,
  singleMaxAmt: 5000,
  dailyCountLimit: 0,
  monthlyCountLimit: 0,
});
const formRules = {
  channelCode: [{ required: true, message: '请输入通道编码' }],
  channelName: [{ required: true, message: '请输入通道名称' }],
  channelType: [{ required: true, message: '请选择通道类型' }],
};

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

async function fetchData() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.append('page', pagination.current.toString());
    params.append('pageSize', pagination.pageSize.toString());
    if (searchForm.channelCode) params.append('channelCode', searchForm.channelCode);
    if (searchForm.channelType) params.append('channelType', searchForm.channelType);
    if (searchForm.status !== undefined) params.append('status', searchForm.status.toString());

    const res = await fetch(`/basic-api/channel/channel/list?${params}`);
    const data = await res.json();
    if (data.result) {
      dataSource.value = data.result.list || [];
      pagination.total = data.result.total || 0;
    } else if (data.data) {
      dataSource.value = data.data.list || [];
      pagination.total = data.data.total || 0;
    }

    // 获取统计数据
    const statsRes = await fetch('/basic-api/channel/channel/stats');
    const statsData = await statsRes.json();
    if (statsData.result) {
      Object.assign(stats, statsData.result);
    } else if (statsData.data) {
      Object.assign(stats, statsData.data);
    }
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.channelCode = '';
  searchForm.channelType = '';
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openDetailModal(record: any) {
  currentChannel.value = record;
  detailVisible.value = true;
}

function openAddModal() {
  formMode.value = 'add';
  Object.assign(formData, {
    channelCode: '',
    channelName: '',
    channelType: 'wechat',
    priority: 10,
    weight: 100,
    dailyLimit: 0,
    monthlyLimit: 0,
    singleMinAmt: 0,
    singleMaxAmt: 5000,
    dailyCountLimit: 0,
    monthlyCountLimit: 0,
  });
  formVisible.value = true;
}

function openEditModal(record: any) {
  formMode.value = 'edit';
  currentChannel.value = record;
  Object.assign(formData, {
    channelCode: record.channelCode,
    channelName: record.channelName,
    channelType: record.channelType,
    priority: record.priority,
    weight: record.weight,
    dailyLimit: record.dailyLimit,
    monthlyLimit: record.monthlyLimit,
    singleMinAmt: record.singleMinAmt,
    singleMaxAmt: record.singleMaxAmt,
    dailyCountLimit: record.dailyCountLimit,
    monthlyCountLimit: record.monthlyCountLimit,
  });
  formVisible.value = true;
}

async function handleFormSubmit() {
  submitLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    message.success(formMode.value === 'add' ? '新增成功' : '编辑成功');
    formVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('操作失败');
  } finally {
    submitLoading.value = false;
  }
}

async function handleToggle(record: any) {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    message.success(record.status === 1 ? '停用成功' : '启用成功');
    fetchData();
  } catch (error) {
    message.error('操作失败');
  }
}

function handleExport() {
  message.info('导出功能开发中');
}

function handleRefresh() {
  fetchData();
  message.success('刷新成功');
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.channel-config-container {
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

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
