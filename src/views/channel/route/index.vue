<template>
  <div class="channel-route">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="路由名称">
          <Input v-model:value="searchForm.routeName" placeholder="请输入路由名称" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem label="路由类型">
          <Select v-model:value="searchForm.routeType" allow-clear style="width: 120px">
            <SelectOption value="AMOUNT">金额路由</SelectOption>
            <SelectOption value="TIME">时间路由</SelectOption>
            <SelectOption value="CHANNEL">通道路由</SelectOption>
            <SelectOption value="STRATEGY">策略路由</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 100px">
            <SelectOption :value="1">启用</SelectOption>
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
            <Statistic title="路由规则总数" :value="stats.totalCount" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="启用规则" :value="stats.activeCount" :value-style="{ color: '#52c41a' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="今日路由次数" :value="stats.todayRouteCount" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="路由成功率" :value="stats.successRate" suffix="%" :precision="2" :value-style="{ color: '#faad14' }" />
          </Card>
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openAddModal">
            <template #icon><PlusOutlined /></template>
            新增路由
          </Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 路由列表 -->
      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'routeType'">
            <Tag :color="getTypeColor(record.routeType)">
              {{ getTypeName(record.routeType) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="record.status === 1 ? 'success' : 'default'" />
            <span>{{ record.status === 1 ? '启用' : '停用' }}</span>
          </template>
          <template v-else-if="column.key === 'priority'">
            <Tag color="blue">{{ record.priority }}</Tag>
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
      title="路由详情"
      width="700px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="路由名称" :span="2">{{ currentRecord.routeName }}</DescriptionsItem>
        <DescriptionsItem label="路由编码">{{ currentRecord.routeCode }}</DescriptionsItem>
        <DescriptionsItem label="路由类型">
          <Tag :color="getTypeColor(currentRecord.routeType)">
            {{ getTypeName(currentRecord.routeType) }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="优先级">
          <Tag color="blue">{{ currentRecord.priority }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="currentRecord.status === 1 ? 'success' : 'default'" />
          {{ currentRecord.status === 1 ? '启用' : '停用' }}
        </DescriptionsItem>
        <DescriptionsItem label="匹配条件" :span="2">
          <pre class="config-json">{{ currentRecord.matchCondition }}</pre>
        </DescriptionsItem>
        <DescriptionsItem label="目标通道" :span="2">
          <Space wrap>
            <Tag v-for="ch in currentRecord.channels" :key="ch" :color="getChannelColor(ch)">
              {{ ch }}
            </Tag>
          </Space>
        </DescriptionsItem>
        <DescriptionsItem label="备注" :span="2">{{ currentRecord.remark || '-' }}</DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createdAt }}</DescriptionsItem>
        <DescriptionsItem label="更新时间">{{ currentRecord.updatedAt }}</DescriptionsItem>
      </Descriptions>
    </Modal>

    <!-- 新增/编辑弹窗 -->
    <Modal
      v-model:open="formVisible"
      :title="formMode === 'add' ? '新增路由' : '编辑路由'"
      width="650px"
      @ok="handleFormSubmit"
      :confirm-loading="submitLoading"
    >
      <Form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="formRules">
        <FormItem label="路由名称" name="routeName">
          <Input v-model:value="formData.routeName" placeholder="请输入路由名称" />
        </FormItem>
        <FormItem label="路由编码" name="routeCode">
          <Input v-model:value="formData.routeCode" placeholder="请输入路由编码" :disabled="formMode === 'edit'" />
        </FormItem>
        <FormItem label="路由类型" name="routeType">
          <Select v-model:value="formData.routeType" placeholder="请选择路由类型">
            <SelectOption value="AMOUNT">金额路由</SelectOption>
            <SelectOption value="TIME">时间路由</SelectOption>
            <SelectOption value="CHANNEL">通道路由</SelectOption>
            <SelectOption value="STRATEGY">策略路由</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="优先级">
          <InputNumber v-model:value="formData.priority" :min="1" :max="999" style="width: 100%" />
          <div class="form-tip">数字越小优先级越高</div>
        </FormItem>
        
        <!-- 金额路由配置 -->
        <template v-if="formData.routeType === 'AMOUNT'">
          <FormItem label="最小金额">
            <InputNumber v-model:value="formData.minAmount" :min="0" :precision="2" style="width: 100%" placeholder="0表示不限" />
          </FormItem>
          <FormItem label="最大金额">
            <InputNumber v-model:value="formData.maxAmount" :min="0" :precision="2" style="width: 100%" placeholder="0表示不限" />
          </FormItem>
        </template>
        
        <!-- 时间路由配置 -->
        <template v-if="formData.routeType === 'TIME'">
          <FormItem label="生效时间段">
            <TimePicker.RangePicker v-model:value="timeRange" format="HH:mm:ss" style="width: 100%" />
          </FormItem>
        </template>
        
        <!-- 目标通道 -->
        <FormItem label="目标通道">
          <Select v-model:value="formData.targetChannels" mode="multiple" placeholder="请选择目标通道" style="width: 100%">
            <SelectOption value="WX_QR_01">微信扫码通道01</SelectOption>
            <SelectOption value="WX_QR_02">微信扫码通道02</SelectOption>
            <SelectOption value="ALI_QR_01">支付宝扫码01</SelectOption>
            <SelectOption value="CT_QR_01">通联扫码01</SelectOption>
            <SelectOption value="CITIC_QR_01">中信银行01</SelectOption>
          </Select>
        </FormItem>
        
        <!-- 分配策略 -->
        <FormItem label="分配策略">
          <RadioGroup v-model:value="formData.strategy">
            <Radio value="PRIORITY">优先级优先</Radio>
            <Radio value="WEIGHT">权重随机</Radio>
            <Radio value="ROUND">轮询</Radio>
          </RadioGroup>
        </FormItem>
        
        <FormItem label="备注">
          <Input.TextArea v-model:value="formData.remark" :rows="2" placeholder="请输入备注" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { 
  Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, 
  Tag, Badge, Row, Col, Statistic, Modal, Descriptions, DescriptionsItem, 
  TimePicker, RadioGroup, Radio, InputNumber, message 
} from 'ant-design-vue';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue';

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
  routeName: '',
  routeType: '',
  status: undefined as number | undefined,
});

const stats = reactive({
  totalCount: 0,
  activeCount: 0,
  todayRouteCount: 0,
  successRate: 0,
});

const columns = [
  { title: '路由名称', dataIndex: 'routeName', key: 'routeName', width: 150 },
  { title: '路由编码', dataIndex: 'routeCode', key: 'routeCode', width: 140 },
  { title: '路由类型', key: 'routeType', width: 100 },
  { title: '优先级', key: 'priority', width: 80 },
  { title: '状态', key: 'status', width: 80 },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '操作', key: 'action', width: 180 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formData = reactive({
  routeName: '',
  routeCode: '',
  routeType: 'AMOUNT',
  priority: 100,
  minAmount: 0,
  maxAmount: 0,
  targetChannels: [] as string[],
  strategy: 'PRIORITY',
  remark: '',
});
const timeRange = ref<[any, any] | null>(null);
const formRules = {
  routeName: [{ required: true, message: '请输入路由名称' }],
  routeCode: [{ required: true, message: '请输入路由编码' }],
  routeType: [{ required: true, message: '请选择路由类型' }],
};

function getTypeColor(type: string) {
  const map: Record<string, string> = {
    AMOUNT: 'blue',
    TIME: 'green',
    CHANNEL: 'orange',
    STRATEGY: 'purple',
  };
  return map[type] || 'default';
}

function getTypeName(type: string) {
  const map: Record<string, string> = {
    AMOUNT: '金额路由',
    TIME: '时间路由',
    CHANNEL: '通道路由',
    STRATEGY: '策略路由',
  };
  return map[type] || type;
}

function getChannelColor(channel: string) {
  if (channel.startsWith('WX')) return 'green';
  if (channel.startsWith('ALI')) return 'blue';
  if (channel.startsWith('CT')) return 'orange';
  if (channel.startsWith('CITIC')) return 'red';
  return 'default';
}

const mockRouteList = [
  {
    id: 1,
    routeName: '小额微信优先',
    routeCode: 'ROUTE_WX_SMALL',
    routeType: 'AMOUNT',
    priority: 10,
    status: 1,
    matchCondition: '{"minAmount": 0, "maxAmount": 500}',
    channels: ['WX_QR_01', 'WX_QR_02'],
    strategy: 'WEIGHT',
    remark: '金额0-500元优先走微信',
    createdAt: '2024-01-15 10:00:00',
    updatedAt: '2024-01-15 10:00:00',
  },
  {
    id: 2,
    routeName: '大额中信银行',
    routeCode: 'ROUTE_CITIC_LARGE',
    routeType: 'AMOUNT',
    priority: 20,
    status: 1,
    matchCondition: '{"minAmount": 5000, "maxAmount": 0}',
    channels: ['CITIC_QR_01'],
    strategy: 'PRIORITY',
    remark: '金额5000以上走中信银行',
    createdAt: '2024-01-15 10:00:00',
    updatedAt: '2024-01-15 10:00:00',
  },
  {
    id: 3,
    routeName: '通联备用',
    routeCode: 'ROUTE_CT_BACKUP',
    routeType: 'CHANNEL',
    priority: 30,
    status: 1,
    matchCondition: '{"channels": ["CT_QR_01"]}',
    channels: ['CT_QR_01'],
    strategy: 'ROUND',
    remark: '通联作为备用通道',
    createdAt: '2024-01-15 10:00:00',
    updatedAt: '2024-01-15 10:00:00',
  },
  {
    id: 4,
    routeName: '夜间禁用规则',
    routeCode: 'ROUTE_NIGHT_OFF',
    routeType: 'TIME',
    priority: 50,
    status: 0,
    matchCondition: '{"timeStart": "22:00:00", "timeEnd": "08:00:00"}',
    channels: ['WX_QR_01', 'ALI_QR_01'],
    strategy: 'PRIORITY',
    remark: '夜间禁用部分通道',
    createdAt: '2024-01-15 10:00:00',
    updatedAt: '2024-01-15 10:00:00',
  },
];

async function fetchData() {
  loading.value = true;
  try {
    // 模拟数据
    dataSource.value = mockRouteList;
    pagination.total = mockRouteList.length;
    
    stats.totalCount = mockRouteList.length;
    stats.activeCount = mockRouteList.filter(item => item.status === 1).length;
    stats.todayRouteCount = 12856;
    stats.successRate = 98.56;
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
  searchForm.routeName = '';
  searchForm.routeType = '';
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
    routeName: '',
    routeCode: '',
    routeType: 'AMOUNT',
    priority: 100,
    minAmount: 0,
    maxAmount: 0,
    targetChannels: [],
    strategy: 'PRIORITY',
    remark: '',
  });
  timeRange.value = null;
  formVisible.value = true;
}

function openEditModal(record: any) {
  formMode.value = 'edit';
  currentRecord.value = record;
  Object.assign(formData, {
    routeName: record.routeName,
    routeCode: record.routeCode,
    routeType: record.routeType,
    priority: record.priority,
    targetChannels: record.channels,
    strategy: record.strategy,
    remark: record.remark,
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

function handleRefresh() {
  fetchData();
  message.success('刷新成功');
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.channel-route {
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

.config-json {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  margin: 0;
  font-size: 12px;
  font-family: 'Consolas', monospace;
}
</style>
