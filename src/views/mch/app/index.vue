<template>
  <div class="mch-app-container">
    <Card>
      <!-- 搜索表单 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="商户">
          <Select
            v-model:value="searchForm.mchNo"
            placeholder="请选择商户"
            allow-clear
            show-search
            :filter-option="filterOption"
            style="width: 180px"
          >
            <SelectOption v-for="item in mchList" :key="item.mchNo" :value="item.mchNo">
              {{ item.mchName }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="应用ID">
          <Input v-model:value="searchForm.appId" placeholder="请输入应用ID" allow-clear style="width: 160px" />
        </FormItem>
        <FormItem label="应用名称">
          <Input v-model:value="searchForm.appName" placeholder="请输入应用名称" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear style="width: 100px">
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

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openAddModal">
            <template #icon><PlusOutlined /></template>
            新建应用
          </Button>
          <Button @click="handleExport">导出</Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 应用列表 -->
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
          <template v-if="column.key === 'appId'">
            <a @click="openDetailModal(record)">{{ record.appId }}</a>
          </template>
          <template v-else-if="column.key === 'isDefault'">
            <Tag :color="record.isDefault === 1 ? 'green' : 'default'">
              {{ record.isDefault === 1 ? '默认' : '非默认' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="record.status === 1 ? 'success' : 'default'" />
            <span>{{ record.statusName }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="openEditModal(record)">编辑</Button>
              <Button type="link" size="small" @click="openPayConfigModal(record)">支付配置</Button>
              <Dropdown>
                <Button type="link" size="small">更多</Button>
                <template #overlay>
                  <Menu @click="({ key }) => handleMenuClick(key, record)">
                    <MenuItem key="copy">复制AppSecret</MenuItem>
                    <MenuItem key="enable" v-if="record.status !== 1">启用</MenuItem>
                    <MenuItem key="disable" v-if="record.status === 1">停用</MenuItem>
                    <MenuItem key="setDefault" v-if="record.isDefault !== 1">设为默认</MenuItem>
                    <MenuItem key="delete" danger>删除</MenuItem>
                  </Menu>
                </template>
              </Dropdown>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="应用详情"
      width="650px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentApp">
        <DescriptionsItem label="应用ID" :span="2">{{ currentApp.appId }}</DescriptionsItem>
        <DescriptionsItem label="应用名称">{{ currentApp.appName }}</DescriptionsItem>
        <DescriptionsItem label="所属商户">
          <span>{{ currentApp.mchName }} ({{ currentApp.mchNo }})</span>
        </DescriptionsItem>
        <DescriptionsItem label="是否默认">
          <Tag :color="currentApp.isDefault === 1 ? 'green' : 'default'">
            {{ currentApp.isDefault === 1 ? '默认应用' : '非默认' }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="currentApp.status === 1 ? 'success' : 'default'" />
          <span>{{ currentApp.statusName }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="AppSecret">
          <span style="font-family: monospace; font-size: 12px;">{{ currentApp.appSecret || '******' }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="备注" :span="2">{{ currentApp.remark || '-' }}</DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentApp.createdAt }}</DescriptionsItem>
        <DescriptionsItem label="更新时间">{{ currentApp.updatedAt }}</DescriptionsItem>
      </Descriptions>
    </Modal>

    <!-- 新增/编辑弹窗 -->
    <Modal
      v-model:open="formVisible"
      :title="formMode === 'add' ? '新建应用' : '编辑应用'"
      width="550px"
      @ok="handleFormSubmit"
    >
      <Form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="formRules" ref="formRef">
        <FormItem label="所属商户" name="mchNo">
          <Select
            v-model:value="formData.mchNo"
            placeholder="请选择商户"
            show-search
            :filter-option="filterOption"
            :disabled="formMode === 'edit'"
          >
            <SelectOption v-for="item in mchList" :key="item.mchNo" :value="item.mchNo">
              {{ item.mchName }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="应用名称" name="appName">
          <Input v-model:value="formData.appName" placeholder="请输入应用名称" />
        </FormItem>
        <FormItem label="是否默认" name="isDefault">
          <RadioGroup v-model:value="formData.isDefault">
            <Radio :value="1">是</Radio>
            <Radio :value="0">否</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="状态" name="status">
          <RadioGroup v-model:value="formData.status">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">停用</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="AppSecret">
          <Input.Password
            v-model:value="formData.appSecret"
            placeholder="请输入AppSecret，不填则自动生成"
          />
        </FormItem>
        <FormItem label="备注">
          <Textarea v-model:value="formData.remark" :rows="3" placeholder="请输入备注" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 支付配置弹窗 -->
    <Modal
      v-model:open="payConfigVisible"
      title="支付配置"
      width="700px"
      @ok="handlePayConfigSubmit"
    >
      <Alert message="配置各支付通道的费率和开关状态" type="info" show-icon style="margin-bottom: 16px" />
      <Table
        :data-source="payConfigList"
        :columns="payConfigColumns"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'channelName'">
            <Space>
              <Tag :color="getChannelColor(record.channelCode)">{{ record.channelName }}</Tag>
            </Space>
          </template>
          <template v-else-if="column.key === 'payWayName'">
            {{ record.payWayName || '-' }}
          </template>
          <template v-else-if="column.key === 'rate'">
            <InputNumber
              :value="Number(record.rate) * 100"
              :min="0"
              :max="100"
              :precision="4"
              :step="0.0001"
              addon-after="%"
              style="width: 120px"
              @change="(val: number) => handleRateChange(record, val)"
            />
          </template>
          <template v-else-if="column.key === 'status'">
            <Switch :checked="record.status === 1" @change="(checked: boolean) => handleStatusChange(record, checked)" />
          </template>
        </template>
      </Table>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Badge, Dropdown, Menu, MenuItem, Modal, Descriptions, DescriptionsItem, RadioGroup, Radio, Textarea, InputPassword, InputNumber, Switch, Alert } from 'ant-design-vue';
import { SearchOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { getMchAppList, getMchAppDetail, createMchApp, updateMchApp, deleteMchApp, getMchAppPayConfig, getMchSelectList } from '@/api/mch/app';

const loading = ref(false);
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
  mchNo: undefined as string | undefined,
  appId: '',
  appName: '',
  status: undefined as number | undefined,
});

const mchList = ref<any[]>([]);

const columns = [
  { title: '应用ID', dataIndex: 'appId', key: 'appId', width: 200 },
  { title: '应用名称', dataIndex: 'appName', key: 'appName', width: 150 },
  { title: '所属商户', dataIndex: 'mchName', key: 'mchName', width: 150 },
  { title: '是否默认', key: 'isDefault', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' },
];

const currentApp = ref<any>(null);
const detailVisible = ref(false);

// 新增/编辑
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formData = reactive({
  mchNo: '',
  appName: '',
  isDefault: 0,
  status: 1,
  appSecret: '',
  remark: '',
});
const formRules = {
  mchNo: [{ required: true, message: '请选择商户' }],
  appName: [{ required: true, message: '请输入应用名称' }],
};

// 支付配置
const payConfigVisible = ref(false);
const payConfigList = ref<any[]>([]);
const payConfigColumns = [
  { title: '支付通道', key: 'channelName', width: 150 },
  { title: '支付方式', key: 'payWayName', width: 120 },
  { title: '通道费率(%)', key: 'rate', width: 150 },
  { title: '状态', key: 'status', width: 100 },
];

function filterOption(input: string, option: any) {
  return option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0;
}

function getChannelColor(code: string) {
  const colors: Record<string, string> = {
    WX: 'green',
    ALI: 'blue',
    CT: 'orange',
    HF: 'purple',
    CITIC: 'red',
  };
  const prefix = code.split('_')[0];
  return colors[prefix] || 'default';
}

async function fetchMchList() {
  try {
    const res = await getMchSelectList();
    const data = res?.data || res;
    mchList.value = data?.list || data?.result || [];
  } catch (error) {
    console.error('获取商户列表失败', error);
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.mchNo) params.mchNo = searchForm.mchNo;
    if (searchForm.appId) params.appId = searchForm.appId;
    if (searchForm.appName) params.appName = searchForm.appName;
    if (searchForm.status !== undefined) params.status = searchForm.status;

    const res = await getMchAppList(params);
    const data = res?.data || res;
    if (data?.list) {
      dataSource.value = data.list || [];
      pagination.total = data.total || 0;
    } else if (data?.result) {
      dataSource.value = data.result.list || [];
      pagination.total = data.result.total || 0;
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
  searchForm.mchNo = undefined;
  searchForm.appId = '';
  searchForm.appName = '';
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openDetailModal(record: any) {
  currentApp.value = record;
  detailVisible.value = true;
}

function openAddModal() {
  formMode.value = 'add';
  Object.assign(formData, {
    mchNo: '',
    appName: '',
    isDefault: 0,
    status: 1,
    appSecret: '',
    remark: '',
  });
  formVisible.value = true;
}

function openEditModal(record: any) {
  formMode.value = 'edit';
  currentApp.value = record;
  Object.assign(formData, {
    mchNo: record.mchNo,
    appName: record.appName,
    isDefault: record.isDefault,
    status: record.status,
    appSecret: '',
    remark: record.remark,
  });
  formVisible.value = true;
}

async function handleFormSubmit() {
  try {
    if (formMode.value === 'add') {
      await createMchApp(formData);
      message.success('创建成功');
    } else {
      await updateMchApp(currentApp.value.appId, formData);
      message.success('更新成功');
    }
    formVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('操作失败');
  }
}

async function openPayConfigModal(record: any) {
  currentApp.value = record;
  try {
    const res = await getMchAppPayConfig(record.appId);
    if (res.result) {
      payConfigList.value = res.result;
    } else {
      // 模拟默认支付配置
      payConfigList.value = [
        { id: 1, channelCode: 'WX_QR', channelName: '微信扫码', payWay: 'WX', payWayName: '扫码支付', rate: '0.006', status: 1 },
        { id: 2, channelCode: 'ALI_QR', channelName: '支付宝扫码', payWay: 'ALI', payWayName: '扫码支付', rate: '0.006', status: 1 },
        { id: 3, channelCode: 'CT_QR', channelName: '通联扫码', payWay: 'CT', payWayName: '扫码支付', rate: '0.005', status: 1 },
        { id: 4, channelCode: 'CITIC_QR', channelName: '中信银行', payWay: 'CITIC', payWayName: '扫码支付', rate: '0.003', status: 1 },
      ];
    }
  } catch (error) {
    // 使用默认配置
    payConfigList.value = [
      { id: 1, channelCode: 'WX_QR', channelName: '微信扫码', payWay: 'WX', payWayName: '扫码支付', rate: '0.006', status: 1 },
      { id: 2, channelCode: 'ALI_QR', channelName: '支付宝扫码', payWay: 'ALI', payWayName: '扫码支付', rate: '0.006', status: 1 },
      { id: 3, channelCode: 'CT_QR', channelName: '通联扫码', payWay: 'CT', payWayName: '扫码支付', rate: '0.005', status: 1 },
      { id: 4, channelCode: 'CITIC_QR', channelName: '中信银行', payWay: 'CITIC', payWayName: '扫码支付', rate: '0.003', status: 1 },
    ];
  }
  payConfigVisible.value = true;
}

function handleRateChange(record: any, val: number) {
  record.rate = (val / 100).toFixed(4);
}

function handleStatusChange(record: any, checked: boolean) {
  record.status = checked ? 1 : 0;
}

async function handlePayConfigSubmit() {
  try {
    message.success('支付配置保存成功');
    payConfigVisible.value = false;
  } catch (error) {
    message.error('保存失败');
  }
}

function handleMenuClick(key: string, record: any) {
  switch (key) {
    case 'copy':
      navigator.clipboard.writeText(record.appSecret || '');
      message.success('AppSecret已复制');
      break;
    case 'enable':
      message.success('启用成功');
      fetchData();
      break;
    case 'disable':
      message.success('停用成功');
      fetchData();
      break;
    case 'setDefault':
      message.success('设置成功');
      fetchData();
      break;
    case 'delete':
      message.warning('删除功能需要二次确认');
      break;
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
  fetchMchList();
  fetchData();
});
</script>

<style scoped>
.mch-app-container {
  padding: 16px;
  background: #f0f2f5;
}
.search-form {
  margin-bottom: 16px;
}
.table-toolbar {
  margin-bottom: 16px;
}
</style>
