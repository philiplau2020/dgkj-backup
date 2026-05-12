<template>
  <div class="citic-collection">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="子账户">
          <Input v-model:value="searchForm.fromAccountNo" placeholder="请输入子账户" allow-clear style="width: 160px" />
        </FormItem>
        <FormItem label="主账户">
          <Input v-model:value="searchForm.toAccountNo" placeholder="请输入主账户" allow-clear style="width: 160px" />
        </FormItem>
        <FormItem label="归集类型">
          <Select v-model:value="searchForm.collectionType" allow-clear style="width: 120px">
            <SelectOption :value="1">全额归集</SelectOption>
            <SelectOption :value="2">定额归集</SelectOption>
            <SelectOption :value="3">保留余额归集</SelectOption>
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
            <Statistic title="归集关系数" :value="stats.totalCount" :value-style="{ color: '#1890ff' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="今日归集金额" :value="Number(stats.todayAmount)" :precision="2" prefix="¥" :value-style="{ color: '#52c41a' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="本月归集金额" :value="Number(stats.monthAmount)" :precision="2" prefix="¥" :value-style="{ color: '#722ed1' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small">
            <Statistic title="归集成功率" :value="stats.successRate" suffix="%" :value-style="{ color: '#faad14' }" />
          </Card>
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openSetModal">
            <template #icon><PlusOutlined /></template>
            设置归集
          </Button>
          <Button type="primary" @click="handleAutoCollection">
            <template #icon><ThunderboltOutlined /></template>
            执行归集
          </Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 归集列表 -->
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
          <template v-if="column.key === 'collectionType'">
            <Tag :color="getCollectionTypeColor(record.collectionType)">
              {{ record.collectionTypeName }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'collectionAmount'">
            <span class="amount-text">
              {{ record.collectionType === 2 ? '¥' + record.collectionAmount : record.collectionType === 3 ? '保留¥' + record.reservedAmount : '全额' }}
            </span>
          </template>
          <template v-else-if="column.key === 'relationStatus'">
            <Switch :checked="record.relationStatus === 1" @change="(checked) => handleToggle(record, checked)" />
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="getStatusBadge(record.status)" :text="record.statusName" />
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="openEditModal(record)">编辑</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 设置/编辑归集弹窗 -->
    <Modal
      v-model:open="setVisible"
      :title="isEdit ? '编辑归集关系' : '设置归集关系'"
      width="550px"
      @ok="handleSet"
      :confirm-loading="submitLoading"
    >
      <Form :model="setForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="setRules" ref="setFormRef">
        <FormItem label="子账户" name="fromAccountNo">
          <Select v-model:value="setForm.fromAccountNo" placeholder="请选择子账户" show-search style="width: 100%">
            <SelectOption v-for="acc in accountList" :key="acc.accountNo" :value="acc.accountNo">
              {{ acc.accountName }} ({{ acc.accountNo }})
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="主账户" name="toAccountNo">
          <Select v-model:value="setForm.toAccountNo" placeholder="请选择主账户" show-search style="width: 100%">
            <SelectOption v-for="acc in accountList" :key="acc.accountNo" :value="acc.accountNo">
              {{ acc.accountName }} ({{ acc.accountNo }})
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="归集类型" name="collectionType">
          <RadioGroup v-model:value="setForm.collectionType" @change="handleCollectionTypeChange">
            <Radio :value="1">全额归集</Radio>
            <Radio :value="2">定额归集</Radio>
            <Radio :value="3">保留余额归集</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="定额金额" name="collectionAmount" v-if="setForm.collectionType === 2" :required="true">
          <InputNumber v-model:value="setForm.collectionAmount" :min="0.01" :precision="2" style="width: 100%" placeholder="请输入定额归集金额" />
        </FormItem>
        <FormItem label="保留金额" name="reservedAmount" v-if="setForm.collectionType === 3" :required="true">
          <InputNumber v-model:value="setForm.reservedAmount" :min="0" :precision="2" style="width: 100%" placeholder="请输入保留余额" />
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="setForm.remark" placeholder="请输入备注" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 详情弹窗 -->
    <Modal v-model:open="detailVisible" title="归集详情" width="600px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="归集单号" :span="2">{{ currentRecord.collectionNo }}</DescriptionsItem>
        <DescriptionsItem label="子账户">{{ currentRecord.fromAccountNo }}</DescriptionsItem>
        <DescriptionsItem label="子账户名称">{{ currentRecord.fromAccountName }}</DescriptionsItem>
        <DescriptionsItem label="主账户">{{ currentRecord.toAccountNo }}</DescriptionsItem>
        <DescriptionsItem label="主账户名称">{{ currentRecord.toAccountName }}</DescriptionsItem>
        <DescriptionsItem label="归集类型">
          <Tag :color="getCollectionTypeColor(currentRecord.collectionType)">{{ currentRecord.collectionTypeName }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="归集金额/保留金额">
          {{ currentRecord.collectionType === 2 ? '¥' + currentRecord.collectionAmount : currentRecord.collectionType === 3 ? '保留¥' + currentRecord.reservedAmount : '全额' }}
        </DescriptionsItem>
        <DescriptionsItem label="关系状态">
          <Switch :checked="currentRecord.relationStatus === 1" disabled />
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="getStatusBadge(currentRecord.status)" :text="currentRecord.statusName" />
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createTime }}</DescriptionsItem>
        <DescriptionsItem label="备注" :span="2">{{ currentRecord.remark || '-' }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space,
  Tag, Badge, Row, Col, Statistic, Modal, Descriptions, DescriptionsItem,
  RadioGroup, Radio, InputNumber, Switch, message, Alert
} from 'ant-design-vue';
import { PlusOutlined, SearchOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons-vue';
import {
  getCiticCollectionList,
  setCiticCollection,
  deleteCiticCollection,
  activeCiticCollection,
  getCiticAccountList,
  executeAutoCollection,
} from '@/api/citic';

const loading = ref(false);
const submitLoading = ref(false);
const dataSource = ref<any[]>([]);
const accountList = ref<any[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  fromAccountNo: '',
  toAccountNo: '',
  collectionType: undefined as number | undefined,
  status: undefined as number | undefined,
});

const stats = reactive({
  totalCount: 0,
  todayAmount: '0.00',
  monthAmount: '0.00',
  successRate: 100,
});

const columns = [
  { title: '归集单号', dataIndex: 'collectionNo', key: 'collectionNo', width: 200 },
  { title: '子账户', dataIndex: 'fromAccountNo', key: 'fromAccountNo', width: 140 },
  { title: '子账户名称', dataIndex: 'fromAccountName', key: 'fromAccountName', width: 150 },
  { title: '主账户', dataIndex: 'toAccountNo', key: 'toAccountNo', width: 140 },
  { title: '主账户名称', dataIndex: 'toAccountName', key: 'toAccountName', width: 150 },
  { title: '归集类型', key: 'collectionType', width: 120 },
  { title: '金额/保留', key: 'collectionAmount', width: 130 },
  { title: '关系状态', key: 'relationStatus', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 180 },
];

const setVisible = ref(false);
const isEdit = ref(false);
const currentRecord = ref<any>(null);
const detailVisible = ref(false);
const setFormRef = ref();

const setForm = reactive({
  fromAccountNo: '',
  toAccountName: '',
  fromAccountName: '',
  toAccountNo: '',
  toAccountName: '',
  collectionType: 1,
  collectionAmount: 0,
  reservedAmount: 0,
  remark: '',
});

const setRules = {
  fromAccountNo: [{ required: true, message: '请选择子账户' }],
  toAccountNo: [{ required: true, message: '请选择主账户' }],
  collectionType: [{ required: true, message: '请选择归集类型' }],
};

function getCollectionTypeColor(type: number) {
  const map: Record<number, string> = { 1: 'blue', 2: 'purple', 3: 'orange' };
  return map[type] || 'default';
}

function getStatusBadge(status: number) {
  const map: Record<number, string> = { 0: 'error', 1: 'success', 2: 'warning', 3: 'processing' };
  return map[status] || 'default';
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.fromAccountNo) params.fromAccountNo = searchForm.fromAccountNo;
    if (searchForm.toAccountNo) params.toAccountNo = searchForm.toAccountNo;
    if (searchForm.collectionType !== undefined) params.collectionType = searchForm.collectionType;
    if (searchForm.status !== undefined) params.status = searchForm.status;

    const res = await getCiticCollectionList(params);
    if (res.result) {
      dataSource.value = res.result.list || [];
      pagination.total = res.result.total || 0;
      updateStats();
    }
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

async function fetchAccountList() {
  try {
    const res = await getCiticAccountList({ page: 1, pageSize: 100 });
    if (res.result) {
      accountList.value = res.result.list || [];
    }
  } catch (error) {
    console.error('获取账户列表失败', error);
  }
}

function updateStats() {
  stats.totalCount = dataSource.value.length;
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.fromAccountNo = '';
  searchForm.toAccountNo = '';
  searchForm.collectionType = undefined;
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openSetModal() {
  isEdit.value = false;
  Object.assign(setForm, {
    fromAccountNo: '',
    fromAccountName: '',
    toAccountNo: '',
    toAccountName: '',
    collectionType: 1,
    collectionAmount: 0,
    reservedAmount: 0,
    remark: '',
  });
  setVisible.value = true;
}

function openEditModal(record: any) {
  isEdit.value = true;
  currentRecord.value = record;
  Object.assign(setForm, {
    fromAccountNo: record.fromAccountNo,
    fromAccountName: record.fromAccountName,
    toAccountNo: record.toAccountNo,
    toAccountName: record.toAccountName,
    collectionType: record.collectionType,
    collectionAmount: record.collectionAmount,
    reservedAmount: record.reservedAmount,
    remark: record.remark || '',
  });
  setVisible.value = true;
}

function handleCollectionTypeChange() {
  setForm.collectionAmount = 0;
  setForm.reservedAmount = 0;
}

async function handleSet() {
  if (setForm.fromAccountNo === setForm.toAccountNo) {
    message.error('子账户和主账户不能相同');
    return;
  }
  submitLoading.value = true;
  try {
    const params = {
      fromAccountNo: setForm.fromAccountNo,
      fromAccountName: setForm.fromAccountName,
      toAccountNo: setForm.toAccountNo,
      toAccountName: setForm.toAccountName,
      collectionType: setForm.collectionType,
      collectionAmount: setForm.collectionAmount || undefined,
      reservedAmount: setForm.reservedAmount || undefined,
      remark: setForm.remark,
    };
    if (isEdit.value) {
      message.info('编辑功能开发中');
    } else {
      await setCiticCollection(params);
      message.success('归集关系设置成功');
    }
    setVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('操作失败');
  } finally {
    submitLoading.value = false;
  }
}

async function handleDelete(record: any) {
  try {
    await new Promise((resolve) => {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除归集关系 ${record.collectionNo} 吗？`,
        okText: '确认删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: resolve,
      });
    });
    await deleteCiticCollection(record.id);
    message.success('删除成功');
    fetchData();
  } catch (error) {
    // 用户取消
  }
}

async function handleToggle(record: any, checked: boolean) {
  try {
    message.info('启用/停用功能开发中');
  } catch (error) {
    console.error('切换状态失败', error);
  }
}

async function handleAutoCollection() {
  try {
    await new Promise((resolve) => {
      Modal.confirm({
        title: '执行归集',
        content: '确定要执行所有启用的归集关系吗？',
        okText: '确认执行',
        cancelText: '取消',
        onOk: resolve,
      });
    });
    const res = await executeAutoCollection();
    if (res.result?.success) {
      message.success(`归集完成，总金额：¥${res.result.totalCollected}`);
    } else {
      message.error(res.result?.error || '归集失败');
    }
    fetchData();
  } catch (error) {
    // 用户取消
  }
}

function openDetailModal(record: any) {
  currentRecord.value = record;
  detailVisible.value = true;
}

function handleRefresh() {
  fetchData();
  message.success('刷新成功');
}

onMounted(() => {
  fetchData();
  fetchAccountList();
});
</script>

<style scoped>
.citic-collection {
  padding: 16px;
  background: #f0f2f5;
}
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.amount-text { color: #f5222d; font-weight: 500; }
</style>
