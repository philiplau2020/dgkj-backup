<template>
  <div class="sys-notice">
    <Card>
      <template #title>
        <Space>
          <Form layout="inline" :model="searchForm">
            <FormItem label="公告标题">
              <Input v-model:value="searchForm.title" placeholder="请输入公告标题" allow-clear style="width: 180px" />
            </FormItem>
            <FormItem label="公告范围">
              <Select v-model:value="searchForm.scope" placeholder="请选择" allow-clear style="width: 120px">
                <SelectOption :value="1">商户平台</SelectOption>
                <SelectOption :value="2">代理商平台</SelectOption>
                <SelectOption :value="3">运营平台</SelectOption>
                <SelectOption :value="4">全部</SelectOption>
              </Select>
            </FormItem>
            <FormItem label="状态">
              <Select v-model:value="searchForm.status" placeholder="请选择" allow-clear style="width: 100px">
                <SelectOption :value="1">已发布</SelectOption>
                <SelectOption :value="0">草稿</SelectOption>
              </Select>
            </FormItem>
            <FormItem>
              <Space>
                <Button type="primary" @click="handleSearch">查询</Button>
                <Button @click="handleReset">重置</Button>
              </Space>
            </FormItem>
          </Form>
        </Space>
      </template>

      <template #extra>
        <Button type="primary" @click="openAddModal">
          <template #icon><PlusOutlined /></template>
          发布公告
        </Button>
      </template>

      <Table 
        :data-source="dataSource" 
        :columns="columns" 
        :loading="loading" 
        :pagination="pagination" 
        @change="handleTableChange" 
        row-key="id"
        :scroll="{ x: 1200 }"
        :row-selection="{ selectedRowKeys, onChange: (keys) => selectedRowKeys = keys }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'noticeTitle'">
            <a @click="openDetailModal(record)">{{ record.noticeTitle }}</a>
          </template>
          <template v-else-if="column.key === 'noticeType'">
            <Tag :color="record.noticeType === 1 ? 'blue' : record.noticeType === 2 ? 'green' : 'orange'">
              {{ record.noticeType === 1 ? '系统通知' : record.noticeType === 2 ? '活动公告' : '更新日志' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'scope'">
            <Space wrap>
              <Tag v-for="s in getScopeList(record.scope)" :key="s" :color="getScopeColor(s)">{{ getScopeName(s) }}</Tag>
            </Space>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="record.status === 1 ? 'success' : 'default'" :text="record.status === 1 ? '已发布' : '草稿'" />
          </template>
          <template v-else-if="column.key === 'isTop'">
            <Tag v-if="record.isTop === 1" color="red">置顶</Tag>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openEditModal(record)">编辑</Button>
              <Button type="link" size="small" @click="toggleTop(record)" v-if="record.status === 1">
                {{ record.isTop === 1 ? '取消置顶' : '置顶' }}
              </Button>
              <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 新增/编辑弹窗 -->
    <Modal
      v-model:open="formVisible"
      :title="formMode === 'add' ? '发布公告' : '编辑公告'"
      width="700px"
      :maskClosable="false"
      @ok="handleFormSubmit"
      :confirm-loading="submitLoading"
    >
      <Form 
        :model="formData" 
        :label-col="{ span: 4 }" 
        :wrapper-col="{ span: 20 }" 
        :rules="formRules"
        ref="formRef"
      >
        <FormItem label="公告标题" name="noticeTitle">
          <Input v-model:value="formData.noticeTitle" placeholder="请输入公告标题" show-count :maxlength="100" />
        </FormItem>
        <FormItem label="公告类型" name="noticeType">
          <RadioGroup v-model:value="formData.noticeType">
            <Radio :value="1">系统通知</Radio>
            <Radio :value="2">活动公告</Radio>
            <Radio :value="3">更新日志</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="公告范围" name="scope">
          <CheckboxGroup v-model:value="formData.scope">
            <Checkbox :value="1">商户平台</Checkbox>
            <Checkbox :value="2">代理商平台</Checkbox>
            <Checkbox :value="3">运营平台</Checkbox>
          </CheckboxGroup>
        </FormItem>
        <FormItem label="置顶">
          <Switch v-model:checked="formData.isTop" />
        </FormItem>
        <FormItem label="状态">
          <RadioGroup v-model:value="formData.status">
            <Radio :value="1">立即发布</Radio>
            <Radio :value="0">存为草稿</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="公告内容" name="noticeContent">
          <Textarea v-model:value="formData.noticeContent" :rows="8" placeholder="请输入公告内容，支持富文本" show-count :maxlength="5000" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="公告详情"
      width="700px"
      :footer="null"
    >
      <Descriptions :column="1" bordered v-if="currentRecord">
        <DescriptionsItem label="公告标题">{{ currentRecord.noticeTitle }}</DescriptionsItem>
        <DescriptionsItem label="公告类型">
          <Tag :color="currentRecord.noticeType === 1 ? 'blue' : currentRecord.noticeType === 2 ? 'green' : 'orange'">
            {{ currentRecord.noticeType === 1 ? '系统通知' : currentRecord.noticeType === 2 ? '活动公告' : '更新日志' }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="公告范围">
          <Space wrap>
            <Tag v-for="s in getScopeList(currentRecord.scope)" :key="s" :color="getScopeColor(s)">{{ getScopeName(s) }}</Tag>
          </Space>
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="currentRecord.status === 1 ? 'success' : 'default'" :text="currentRecord.status === 1 ? '已发布' : '草稿'" />
        </DescriptionsItem>
        <DescriptionsItem label="是否置顶">{{ currentRecord.isTop === 1 ? '是' : '否' }}</DescriptionsItem>
        <DescriptionsItem label="发布人">{{ currentRecord.publisher || '管理员' }}</DescriptionsItem>
        <DescriptionsItem label="发布时间">{{ currentRecord.createTime || '-' }}</DescriptionsItem>
        <DescriptionsItem label="公告内容">
          <div style="white-space: pre-wrap; line-height: 1.8;">{{ currentRecord.noticeContent }}</div>
        </DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Button, Space, Tag, Checkbox, CheckboxGroup, Textarea, Modal, Descriptions, DescriptionsItem, Select, SelectOption, Radio, RadioGroup, Switch, Badge, message, ModalFunc } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { defHttp } from '@/utils/http/axios';

interface NoticeRecord {
  id: string;
  noticeTitle: string;
  noticeType: number;
  noticeContent: string;
  scope: number;
  status: number;
  isTop: number;
  publisher: string;
  createTime: string;
}

const loading = ref(false);
const submitLoading = ref(false);
const dataSource = ref<NoticeRecord[]>([]);
const pagination = reactive({ 
  current: 1, 
  pageSize: 10, 
  total: 0, 
  showSizeChanger: true, 
  showTotal: (total: number) => `共 ${total} 条`,
});
const selectedRowKeys = ref<string[]>([]);

const searchForm = reactive({
  title: '',
  scope: undefined as number | undefined,
  status: undefined as number | undefined,
});

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '公告标题', dataIndex: 'noticeTitle', key: 'noticeTitle', width: 250, ellipsis: true },
  { title: '类型', dataIndex: 'noticeType', key: 'noticeType', width: 100 },
  { title: '范围', key: 'scope', width: 180 },
  { title: '置顶', key: 'isTop', width: 80 },
  { title: '状态', key: 'status', width: 100 },
  { title: '发布时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
];

const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formRef = ref();
const formData = reactive({
  id: '',
  noticeTitle: '',
  noticeType: 1 as number,
  noticeContent: '',
  scope: [1] as number[],
  status: 1 as number,
  isTop: false,
});
const formRules = {
  noticeTitle: [{ required: true, message: '请输入公告标题' }],
  noticeContent: [{ required: true, message: '请输入公告内容' }],
  scope: [{ required: true, message: '请选择公告范围', type: 'array', min: 1 }],
};

const currentRecord = ref<NoticeRecord | null>(null);
const detailVisible = ref(false);

// 获取公告范围列表
function getScopeList(scope: number): number[] {
  const list: number[] = [];
  if (scope & 1) list.push(1);
  if (scope & 2) list.push(2);
  if (scope & 4) list.push(3);
  return list;
}

// 获取范围名称
function getScopeName(scope: number): string {
  const map: Record<number, string> = { 1: '商户', 2: '代理', 3: '运营' };
  return map[scope] || '';
}

// 获取范围颜色
function getScopeColor(scope: number): string {
  const map: Record<number, string> = { 1: 'blue', 2: 'green', 3: 'orange' };
  return map[scope] || 'default';
}

// 计算范围值
function calcScope(scopes: number[]): number {
  return scopes.reduce((acc, s) => acc | (1 << (s - 1)), 0);
}

async function fetchData() {
  loading.value = true;
  try {
    const params: Record<string, any> = { 
      page: pagination.current, 
      pageSize: pagination.pageSize 
    };
    if (searchForm.title) params.title = searchForm.title;
    if (searchForm.scope !== undefined) params.scope = searchForm.scope;
    if (searchForm.status !== undefined) params.status = searchForm.status;

    const res = await defHttp.get({ url: '/basic-api/sys/notice/list', params });
    if (res && res.data) {
      dataSource.value = res.data.list || [];
      pagination.total = res.data.total || 0;
    } else {
      dataSource.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    console.error('获取公告列表失败:', error);
    dataSource.value = [];
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.title = '';
  searchForm.scope = undefined;
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openAddModal() {
  formMode.value = 'add';
  Object.assign(formData, {
    id: '',
    noticeTitle: '',
    noticeType: 1,
    noticeContent: '',
    scope: [1],
    status: 1,
    isTop: false,
  });
  formVisible.value = true;
}

function openEditModal(record: NoticeRecord) {
  formMode.value = 'edit';
  Object.assign(formData, {
    id: record.id,
    noticeTitle: record.noticeTitle,
    noticeType: record.noticeType,
    noticeContent: record.noticeContent,
    scope: getScopeList(record.scope),
    status: record.status,
    isTop: record.isTop === 1,
  });
  formVisible.value = true;
}

function openDetailModal(record: NoticeRecord) {
  currentRecord.value = record;
  detailVisible.value = true;
}

async function handleFormSubmit() {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  
  submitLoading.value = true;
  try {
    const data = {
      noticeTitle: formData.noticeTitle,
      noticeType: formData.noticeType,
      noticeContent: formData.noticeContent,
      scope: calcScope(formData.scope),
      status: formData.status,
      isTop: formData.isTop ? 1 : 0,
    };

    if (formMode.value === 'add') {
      await defHttp.post({ url: '/basic-api/sys/notice', data });
      message.success('发布成功');
    } else {
      await defHttp.put({ url: `/basic-api/sys/notice/${formData.id}`, data });
      message.success('更新成功');
    }
    
    formVisible.value = false;
    fetchData();
  } catch (error: any) {
    if (error?.errorFields) {
      return; // 表单验证失败
    }
    message.error(error?.message || '操作失败');
  } finally {
    submitLoading.value = false;
  }
}

function handleDelete(record: NoticeRecord) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除公告 "${record.noticeTitle}" 吗？`,
    okText: '确认',
    okType: 'danger',
    onOk: async () => {
      try {
        await defHttp.delete({ url: `/basic-api/sys/notice/${record.id}` });
        message.success('删除成功');
        fetchData();
      } catch (error) {
        message.error('删除失败');
      }
    },
  });
}

async function toggleTop(record: NoticeRecord) {
  try {
    await defHttp.put({ url: `/basic-api/sys/notice/${record.id}`, data: { isTop: record.isTop === 1 ? 0 : 1 } });
    message.success(record.isTop === 1 ? '已取消置顶' : '已置顶');
    fetchData();
  } catch (error) {
    message.error('操作失败');
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.sys-notice {
  padding: 16px;
  background: #f0f2f5;
}

.table-toolbar {
  margin-bottom: 16px;
}
</style>
