<template>
  <div class="template-manage">
    <!-- 搜索栏 -->
    <Card class="search-card">
      <Form layout="inline" :model="queryParams">
        <FormItem label="通知类型">
          <Select v-model:value="queryParams.notifyType" placeholder="请选择" allowClear style="width: 120px">
            <SelectOption value="email">邮件</SelectOption>
            <SelectOption value="sms">短信</SelectOption>
            <SelectOption value="dingtalk">钉钉</SelectOption>
            <SelectOption value="wecom">企业微信</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="场景编码">
          <Input v-model:value="queryParams.sceneCode" placeholder="请输入" allowClear style="width: 150px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="queryParams.status" placeholder="请选择" allowClear style="width: 100px">
            <SelectOption :value="1">启用</SelectOption>
            <SelectOption :value="0">停用</SelectOption>
          </Select>
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>

    <!-- 工具栏 -->
    <Card class="table-card">
      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openModal('add')">
            <template #icon><PlusOutlined /></template>
            新增模板
          </Button>
          <Button @click="handleInitDefault">
            <template #icon><ThunderboltOutlined /></template>
            初始化默认模板
          </Button>
        </Space>
      </div>

      <!-- 表格 -->
      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'notifyType'">
            <Tag :color="getTypeColor(record.notifyType)">
              {{ getTypeText(record.notifyType) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="record.status === 1 ? 'success' : 'default'" />
            <span>{{ record.status === 1 ? '启用' : '停用' }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openModal('edit', record)">编辑</Button>
              <Button type="link" size="small" @click="handlePreview(record)">预览</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 新增/编辑弹窗 -->
    <Modal
      v-model:open="formVisible"
      :title="formMode === 'add' ? '新增模板' : '编辑模板'"
      width="700px"
      :maskClosable="false"
      @ok="handleSubmit"
      :confirm-loading="submitLoading"
    >
      <Form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }" ref="formRef">
        <FormItem label="模板编码" name="templateCode">
          <Input v-model:value="formData.templateCode" placeholder="如: email_TRADE_SUCCESS" :disabled="formMode === 'edit'" />
          <div class="field-tip">格式：{通知类型}_{场景编码}，如 email_TRADE_SUCCESS</div>
        </FormItem>
        <FormItem label="模板名称" name="templateName">
          <Input v-model:value="formData.templateName" placeholder="请输入模板名称" />
        </FormItem>
        <FormItem label="通知类型" name="notifyType">
          <Select v-model:value="formData.notifyType" placeholder="请选择">
            <SelectOption value="email">邮件</SelectOption>
            <SelectOption value="sms">短信</SelectOption>
            <SelectOption value="dingtalk">钉钉</SelectOption>
            <SelectOption value="wecom">企业微信</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="场景编码" name="sceneCode">
          <Input v-model:value="formData.sceneCode" placeholder="如: TRADE_SUCCESS" />
          <div class="field-tip">标识模板使用场景，如 TRADE_SUCCESS 表示支付成功</div>
        </FormItem>
        <FormItem label="邮件主题" name="subject" v-if="formData.notifyType === 'email'">
          <Input v-model:value="formData.subject" placeholder="邮件主题，支持变量 ${name}" />
        </FormItem>
        <FormItem label="模板内容" name="content">
          <Input.TextArea v-model:value="formData.content" placeholder="模板内容，支持变量 ${变量名} 语法" :rows="4" />
          <div class="field-tip">使用 ${变量名} 定义变量，如：您的订单 ${orderNo} 已支付成功</div>
        </FormItem>
        <FormItem label="变量配置" name="variables">
          <Input.TextArea v-model:value="formData.variables" placeholder='JSON格式，如: [{"name":"orderNo","desc":"订单号","required":true}]' :rows="3" />
        </FormItem>
        <FormItem label="状态" name="status">
          <RadioGroup v-model:value="formData.status">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">停用</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="备注" name="remark">
          <Input.TextArea v-model:value="formData.remark" placeholder="请输入备注" :rows="2" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 预览弹窗 -->
    <Modal
      v-model:open="previewVisible"
      title="模板预览"
      width="600px"
      :footer="null"
    >
      <Descriptions :column="1" bordered v-if="previewData">
        <DescriptionsItem label="模板名称">{{ previewData.templateName }}</DescriptionsItem>
        <DescriptionsItem label="通知类型">{{ getTypeText(previewData.notifyType) }}</DescriptionsItem>
        <DescriptionsItem label="场景">{{ previewData.sceneCode }}</DescriptionsItem>
        <DescriptionsItem label="主题" v-if="previewData.subject">{{ previewData.subject }}</DescriptionsItem>
        <DescriptionsItem label="内容">
          <div style="max-height: 200px; overflow-y: auto; white-space: pre-wrap;" v-html="previewData.content"></div>
        </DescriptionsItem>
      </Descriptions>

      <Divider />

      <h4>变量预览</h4>
      <Form :label-col="{ span: 4 }" :wrapper-col="{ span: 18 }">
        <FormItem label="变量示例">
          <Input.TextArea v-model:value="previewVariables" placeholder='JSON格式变量值，如: {"orderNo":"ORDER123456","amount":"100.00"}' :rows="3" />
        </FormItem>
        <FormItem>
          <Button type="primary" ghost @click="handleRenderPreview">渲染预览</Button>
        </FormItem>
      </Form>

      <Alert v-if="renderedResult" :message="renderedResult" type="success" show-icon />
    </Modal>

    <!-- 删除确认 -->
    <Modal
      v-model:open="deleteVisible"
      title="确认删除"
      @ok="confirmDelete"
      :confirm-loading="deleteLoading"
    >
      <p>确定要删除模板 "<strong>{{ deleteName }}</strong>" 吗？</p>
      <p style="color: #ff4d4f;">此操作不可恢复！</p>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Card, Form, FormItem, Input, Select, SelectOption, Button, Space, Table, Tag, Badge,
  Modal, Radio, RadioGroup, RadioButton, Descriptions, DescriptionsItem, Divider, Alert,
  message, Tabs, TabPane
} from 'ant-design-vue';
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons-vue';
import {
  getTemplateList, createTemplate, updateTemplate, deleteTemplate,
  initTemplate, previewTemplate
} from '@/api/sys/notify';

const loading = ref(false);
const submitLoading = ref(false);
const deleteLoading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });

const queryParams = reactive({
  notifyType: undefined as string | undefined,
  sceneCode: '',
  status: undefined as number | undefined,
});

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '模板编码', dataIndex: 'templateCode', width: 180 },
  { title: '模板名称', dataIndex: 'templateName', width: 150 },
  { title: '类型', key: 'notifyType', width: 100 },
  { title: '场景', dataIndex: 'sceneCode', width: 120 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
];

const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const previewVisible = ref(false);
const deleteVisible = ref(false);
const deleteId = ref('');
const deleteName = ref('');
const formRef = ref();

const formData = reactive({
  templateCode: '',
  templateName: '',
  notifyType: 'email',
  sceneCode: '',
  subject: '',
  content: '',
  variables: '',
  status: 1,
  remark: '',
});

const previewData = ref<any>(null);
const previewVariables = ref('{"orderNo":"ORDER123456","amount":"100.00","mchName":"测试商户"}');
const renderedResult = ref('');

const getTypeColor = (type: string) => {
  const map: Record<string, string> = { email: 'blue', sms: 'green', dingtalk: 'orange', wecom: 'purple' };
  return map[type] || 'default';
};

const getTypeText = (type: string) => {
  const map: Record<string, string> = { email: '邮件', sms: '短信', dingtalk: '钉钉', wecom: '企业微信' };
  return map[type] || type;
};

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (queryParams.notifyType) params.notifyType = queryParams.notifyType;
    if (queryParams.sceneCode) params.sceneCode = queryParams.sceneCode;
    if (queryParams.status !== undefined) params.status = queryParams.status;

    const res = await getTemplateList(params);
    if (res?.data) {
      dataSource.value = res.data.list || [];
      pagination.total = res.data.total || 0;
    } else if (res?.list) {
      dataSource.value = res.list || [];
      pagination.total = res.total || 0;
    }
  } catch (e) {
    console.error('获取模板列表失败', e);
  } finally {
    loading.value = false;
  }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() {
  queryParams.notifyType = undefined;
  queryParams.sceneCode = '';
  queryParams.status = undefined;
  handleSearch();
}
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }

function openModal(mode: 'add' | 'edit', record?: any) {
  formMode.value = mode;
  if (mode === 'add') {
    Object.assign(formData, { templateCode: '', templateName: '', notifyType: 'email', sceneCode: '', subject: '', content: '', variables: '', status: 1, remark: '' });
  } else if (record) {
    Object.assign(formData, {
      ...record,
      variables: record.variables || '',
      subject: record.subject || '',
    });
  }
  formVisible.value = true;
}

async function handleSubmit() {
  submitLoading.value = true;
  try {
    if (formMode.value === 'add') {
      await createTemplate(formData);
      message.success('创建成功');
    } else {
      await updateTemplate(formData.id, formData);
      message.success('更新成功');
    }
    formVisible.value = false;
    fetchData();
  } catch (e) {
    message.error('操作失败');
  } finally {
    submitLoading.value = false;
  }
}

function handlePreview(record: any) {
  previewData.value = record;
  previewVariables.value = record.variables || '{"orderNo":"ORDER123456","amount":"100.00"}';
  renderedResult.value = '';
  previewVisible.value = true;
}

async function handleRenderPreview() {
  try {
    const variables = JSON.parse(previewVariables.value);
    const res = await previewTemplate({ templateId: previewData.value.id, variables });
    if (res?.data?.success) {
      renderedResult.value = res.data.content;
    } else {
      renderedResult.value = res?.data?.error || '渲染失败';
    }
  } catch (e) {
    renderedResult.value = 'JSON 格式错误，请检查';
  }
}

function handleDelete(record: any) {
  deleteId.value = record.id;
  deleteName.value = record.templateName;
  deleteVisible.value = true;
}

async function confirmDelete() {
  deleteLoading.value = true;
  try {
    await deleteTemplate(deleteId.value);
    message.success('删除成功');
    deleteVisible.value = false;
    fetchData();
  } catch (e) {
    message.error('删除失败');
  } finally {
    deleteLoading.value = false;
  }
}

async function handleInitDefault() {
  try {
    await initTemplate();
    message.success('初始化成功');
    fetchData();
  } catch (e) {
    message.error('初始化失败');
  }
}

onMounted(() => fetchData());
</script>

<style scoped>
.template-manage { padding: 0; }
.search-card { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.field-tip { font-size: 12px; color: #999; margin-top: 4px; }
</style>
