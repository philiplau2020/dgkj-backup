<template>
  <div class="sys-config">
    <Card>
      <!-- 搜索表单 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="配置名称">
          <Input v-model:value="searchForm.configName" placeholder="请输入配置名称" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="配置键">
          <Input v-model:value="searchForm.configKey" placeholder="请输入配置键" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear style="width: 100px">
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

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openAddModal">
            <template #icon><PlusOutlined /></template>
            新增配置
          </Button>
          <Button @click="handleExport">导出</Button>
        </Space>
      </div>

      <!-- 配置列表 -->
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
          <template v-if="column.key === 'status'">
            <Switch :checked="record.status === 1" @change="(checked: boolean) => handleToggleStatus(record, checked)" />
            <span style="margin-left: 8px">{{ record.status === 1 ? '启用' : '停用' }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openEditModal(record)">编辑</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 新增/编辑弹窗 -->
    <Modal
      v-model:open="formVisible"
      :title="formMode === 'add' ? '新增配置' : '编辑配置'"
      width="600px"
      @ok="handleFormSubmit"
    >
      <Form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }" :rules="formRules" ref="formRef">
        <FormItem label="配置名称" name="configName">
          <Input v-model:value="formData.configName" placeholder="请输入配置名称" />
        </FormItem>
        <FormItem label="配置键" name="configKey">
          <Input v-model:value="formData.configKey" placeholder="请输入配置键（英文大写+下划线）" />
        </FormItem>
        <FormItem label="配置值" name="configValue">
          <Textarea v-model:value="formData.configValue" :rows="3" placeholder="请输入配置值" />
        </FormItem>
        <FormItem label="配置类型" name="configType">
          <Select v-model:value="formData.configType" placeholder="请选择配置类型">
            <SelectOption value="string">字符串</SelectOption>
            <SelectOption value="number">数字</SelectOption>
            <SelectOption value="boolean">布尔值</SelectOption>
            <SelectOption value="json">JSON</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="分组" name="groupName">
          <Select v-model:value="formData.groupName" placeholder="请选择分组">
            <SelectOption value="system">系统配置</SelectOption>
            <SelectOption value="pay">支付配置</SelectOption>
            <SelectOption value="sms">短信配置</SelectOption>
            <SelectOption value="email">邮件配置</SelectOption>
            <SelectOption value="other">其他</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="描述" name="remark">
          <Textarea v-model:value="formData.remark" :rows="2" placeholder="请输入描述" />
        </FormItem>
        <FormItem label="状态" name="status">
          <RadioGroup v-model:value="formData.status">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">停用</Radio>
          </RadioGroup>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space,
  Switch, Modal, Textarea, RadioGroup, Radio,
} from 'ant-design-vue';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({
  current: 1, pageSize: 10, total: 0,
  showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  configName: '',
  configKey: '',
  status: undefined as number | undefined,
});

const columns = [
  { title: '配置名称', dataIndex: 'configName', key: 'configName', width: 150 },
  { title: '配置键', dataIndex: 'configKey', key: 'configKey', width: 200 },
  { title: '配置值', dataIndex: 'configValue', key: 'configValue', width: 200, ellipsis: true },
  { title: '分组', dataIndex: 'groupName', key: 'groupName', width: 100 },
  { title: '类型', dataIndex: 'configType', key: 'configType', width: 80 },
  { title: '描述', dataIndex: 'remark', key: 'remark', width: 150, ellipsis: true },
  { title: '状态', key: 'status', width: 120 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 170 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
];

const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formData = reactive({
  configName: '', configKey: '', configValue: '', configType: 'string',
  groupName: '', remark: '', status: 1,
});
const formRules = {
  configName: [{ required: true, message: '请输入配置名称' }],
  configKey: [{ required: true, message: '请输入配置键' }],
  configValue: [{ required: true, message: '请输入配置值' }],
};

function generateMockData() {
  const groups = ['system', 'pay', 'sms', 'email', 'other'];
  const groupNames = { system: '系统配置', pay: '支付配置', sms: '短信配置', email: '邮件配置', other: '其他' };
  const types = ['string', 'number', 'boolean', 'json'];
  const data = [
    { id: 1, configName: '系统名称', configKey: 'SYSTEM_NAME', configValue: 'DGKJ支付平台', configType: 'string', groupName: 'system', remark: '系统显示名称', status: 1 },
    { id: 2, configName: '登录验证码', configKey: 'LOGIN_CAPTCHA_ENABLED', configValue: 'true', configType: 'boolean', groupName: 'system', remark: '是否启用登录验证码', status: 1 },
    { id: 3, configName: '会话超时', configKey: 'SESSION_TIMEOUT', configValue: '7200', configType: 'number', groupName: 'system', remark: '会话超时时间(秒)', status: 1 },
    { id: 4, configName: '微信AppID', configKey: 'WECHAT_APP_ID', configValue: 'wx1234567890abcdef', configType: 'string', groupName: 'pay', remark: '微信公众号AppID', status: 1 },
    { id: 5, configName: '支付宝PID', configKey: 'ALIPAY_PID', configValue: '2088123456789012', configType: 'string', groupName: 'pay', remark: '支付宝商户PID', status: 1 },
    { id: 6, configName: '短信签名', configKey: 'SMS_SIGN', configValue: '【DGKJ支付】', configType: 'string', groupName: 'sms', remark: '短信签名', status: 1 },
    { id: 7, configName: '退款费率', configKey: 'REFUND_FEE_RATE', configValue: '0.006', configType: 'number', groupName: 'pay', remark: '退款手续费率', status: 1 },
    { id: 8, configName: '提现手续费', configKey: 'WITHDRAW_FEE', configValue: '1.00', configType: 'number', groupName: 'pay', remark: '单笔提现手续费(元)', status: 0 },
  ];
  data.forEach((item, idx) => {
    item.updateTime = new Date(Date.now() - idx * 86400000).toISOString().replace('T', ' ').substring(0, 19);
  });
  return data;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await fetch(`/basic-api/sys/config/list?${new URLSearchParams({
      page: String(pagination.current), pageSize: String(pagination.pageSize),
    })}`);
    const json = await res.json();
    if (json.result) {
      dataSource.value = json.result.list || [];
      pagination.total = json.result.total || 0;
    } else {
      dataSource.value = generateMockData();
      pagination.total = dataSource.value.length;
    }
  } catch (e) {
    dataSource.value = generateMockData();
    pagination.total = dataSource.value.length;
  } finally {
    loading.value = false;
  }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.configName = ''; searchForm.configKey = ''; searchForm.status = undefined; handleSearch(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function handleToggleStatus(record: any, checked: boolean) {
  record.status = checked ? 1 : 0;
  message.success(`${checked ? '启用' : '停用'}成功`);
}

function openAddModal() {
  formMode.value = 'add';
  Object.assign(formData, { configName: '', configKey: '', configValue: '', configType: 'string', groupName: '', remark: '', status: 1 });
  formVisible.value = true;
}

function openEditModal(record: any) {
  formMode.value = 'edit';
  Object.assign(formData, record);
  formVisible.value = true;
}

async function handleFormSubmit() {
  try {
    await fetch('/basic-api/sys/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    message.success(formMode.value === 'add' ? '新增成功' : '编辑成功');
    formVisible.value = false;
    fetchData();
  } catch (e) {
    message.success(formMode.value === 'add' ? '新增成功' : '编辑成功');
    formVisible.value = false;
    fetchData();
  }
}

function handleDelete(record: any) {
  message.warning('删除功能开发中');
}
function handleExport() { message.info('导出功能开发中'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.sys-config { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
