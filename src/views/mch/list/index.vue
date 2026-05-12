<template>
  <div class="mch-container">
    <Card>
      <!-- 搜索表单 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="商户名称">
          <Input v-model:value="searchForm.mchName" placeholder="请输入商户名称" allow-clear style="width: 180px" />
        </FormItem>
        <FormItem label="商户号">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear style="width: 120px">
            <SelectOption :value="0">待审核</SelectOption>
            <SelectOption :value="1">正常</SelectOption>
            <SelectOption :value="2">冻结</SelectOption>
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
          <Button type="primary" @click="openEntryModal">
            <template #icon><PlusOutlined /></template>
            商户入驻
          </Button>
          <Button @click="handleExport">导出</Button>
        </Space>
      </div>

      <!-- 商户列表 -->
      <Table 
        :data-source="dataSource" 
        :columns="columns" 
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: 1500 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'mchNo'">
            <a @click="openDetailModal(record)">{{ record.mchNo }}</a>
          </template>
          <template v-else-if="column.key === 'mchType'">
            <Tag :color="record.mchType === 1 ? 'blue' : 'green'">
              {{ record.mchType === 1 ? '个人' : '企业' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="getStatusBadge(record.status)" />
            <span>{{ getStatusName(record.status) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="openEditModal(record)" v-if="record.status === 0">编辑</Button>
              <Dropdown>
                <Button type="link" size="small">更多</Button>
                <template #overlay>
                  <Menu @click="({ key }) => handleMenuClick(key, record)">
                    <MenuItem key="enable" v-if="record.status !== 1">启用</MenuItem>
                    <MenuItem key="disable" v-if="record.status === 1">禁用</MenuItem>
                    <MenuItem key="delete">删除</MenuItem>
                  </Menu>
                </template>
              </Dropdown>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 商户详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="商户详情"
      width="800px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="商户号">{{ currentRecord.mchNo }}</DescriptionsItem>
        <DescriptionsItem label="商户名称">{{ currentRecord.mchName }}</DescriptionsItem>
        <DescriptionsItem label="商户类型">
          <Tag :color="currentRecord.mchType === 1 ? 'blue' : 'green'">
            {{ currentRecord.mchType === 1 ? '个人' : '企业' }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="联系人">{{ currentRecord.contactName }}</DescriptionsItem>
        <DescriptionsItem label="联系电话">{{ currentRecord.contactPhone }}</DescriptionsItem>
        <DescriptionsItem label="邮箱">{{ currentRecord.contactEmail }}</DescriptionsItem>
        <DescriptionsItem label="地址" :span="2">{{ currentRecord.province }}{{ currentRecord.city }}{{ currentRecord.district }}{{ currentRecord.address }}</DescriptionsItem>
        <DescriptionsItem label="银行卡">{{ currentRecord.bankAccount }}</DescriptionsItem>
        <DescriptionsItem label="开户行">{{ currentRecord.bankName }}</DescriptionsItem>
        <DescriptionsItem label="状态">
          <Badge :status="getStatusBadge(currentRecord.status)" />
          {{ getStatusName(currentRecord.status) }}
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createTime }}</DescriptionsItem>
      </Descriptions>
    </Modal>

    <!-- 编辑弹窗 -->
    <Modal
      v-model:open="editVisible"
      title="编辑商户"
      @ok="handleEdit"
    >
      <Form :model="editForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="商户名称" name="mchName">
          <Input v-model:value="editForm.mchName" placeholder="请输入商户名称" />
        </FormItem>
        <FormItem label="联系人" name="contactName">
          <Input v-model:value="editForm.contactName" placeholder="请输入联系人" />
        </FormItem>
        <FormItem label="联系电话" name="contactPhone">
          <Input v-model:value="editForm.contactPhone" placeholder="请输入联系电话" />
        </FormItem>
        <FormItem label="邮箱" name="contactEmail">
          <Input v-model:value="editForm.contactEmail" placeholder="请输入邮箱" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 商户入驻弹窗 -->
    <Modal
      v-model:open="entryVisible"
      title="商户入驻"
      width="700px"
      @ok="handleEntry"
    >
      <Form :model="entryForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="entryRules">
        <FormItem label="商户名称" name="mchName">
          <Input v-model:value="entryForm.mchName" placeholder="请输入商户名称" />
        </FormItem>
        <FormItem label="商户类型" name="mchType">
          <RadioGroup v-model:value="entryForm.mchType">
            <Radio :value="1">个人</Radio>
            <Radio :value="2">企业</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="联系人" name="contactName">
          <Input v-model:value="entryForm.contactName" placeholder="请输入联系人" />
        </FormItem>
        <FormItem label="联系电话" name="contactPhone">
          <Input v-model:value="entryForm.contactPhone" placeholder="请输入联系电话" />
        </FormItem>
        <FormItem label="邮箱" name="contactEmail">
          <Input v-model:value="entryForm.contactEmail" placeholder="请输入邮箱" />
        </FormItem>
        <FormItem label="银行卡号" name="bankAccount">
          <Input v-model:value="entryForm.bankAccount" placeholder="请输入银行卡号" />
        </FormItem>
        <FormItem label="开户行" name="bankName">
          <Input v-model:value="entryForm.bankName" placeholder="请输入开户行" />
        </FormItem>
        <FormItem label="持卡人" name="bankUsername">
          <Input v-model:value="entryForm.bankUsername" placeholder="请输入持卡人姓名" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Badge, Dropdown, Menu, MenuItem, Modal, Descriptions, DescriptionsItem, RadioGroup, Radio } from 'ant-design-vue';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { getMchList, createMch, updateMch } from '@/api/mch/merchant';

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
  mchName: '',
  mchNo: '',
  status: undefined as number | undefined,
});

const columns = [
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 150 },
  { title: '商户名称', dataIndex: 'mchName', key: 'mchName', width: 180 },
  { title: '类型', key: 'mchType', width: 80 },
  { title: '联系人', dataIndex: 'contactName', key: 'contactName', width: 100 },
  { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
];

const currentRecord = ref<any>(null);

// 详情弹窗
const detailVisible = ref(false);

// 编辑弹窗
const editVisible = ref(false);
const editForm = reactive({
  mchName: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
});

// 入驻弹窗
const entryVisible = ref(false);
const entryForm = reactive({
  mchName: '',
  mchType: 2,
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  bankAccount: '',
  bankName: '',
  bankUsername: '',
});
const entryRules = {
  mchName: [{ required: true, message: '请输入商户名称' }],
  mchType: [{ required: true, message: '请选择商户类型' }],
  contactName: [{ required: true, message: '请输入联系人' }],
  contactPhone: [{ required: true, message: '请输入联系电话' }],
};

function getStatusBadge(status: number) {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'error' };
  return map[status] || 'default';
}

function getStatusName(status: number) {
  const map: Record<number, string> = { 0: '待审核', 1: '正常', 2: '冻结' };
  return map[status] || '未知';
}

async function fetchData() {
  loading.value = true;
  try {
    const result = await getMchList({
      page: pagination.current,
      pageSize: pagination.pageSize,
      mchName: searchForm.mchName || undefined,
      mchNo: searchForm.mchNo || undefined,
      status: searchForm.status,
    });
    
    dataSource.value = result.list || [];
    pagination.total = result.total || 0;
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
  searchForm.mchName = '';
  searchForm.mchNo = '';
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

function openEditModal(record: any) {
  currentRecord.value = record;
  Object.assign(editForm, {
    mchName: record.mchName,
    contactName: record.contactName,
    contactPhone: record.contactPhone,
    contactEmail: record.contactEmail,
  });
  editVisible.value = true;
}

async function handleEdit() {
  try {
    await updateMch(currentRecord.value.id, editForm);
    message.success('更新成功');
    editVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('更新失败');
  }
}

function openEntryModal() {
  Object.assign(entryForm, {
    mchName: '',
    mchType: 2,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    bankAccount: '',
    bankName: '',
    bankUsername: '',
  });
  entryVisible.value = true;
}

async function handleEntry() {
  try {
    await createMch(entryForm);
    message.success('商户入驻申请已提交');
    entryVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('入驻申请提交失败');
  }
}

function handleMenuClick(key: string, record: any) {
  switch (key) {
    case 'enable':
      message.success('启用成功');
      fetchData();
      break;
    case 'disable':
      message.success('禁用成功');
      fetchData();
      break;
    case 'delete':
      message.success('删除成功');
      fetchData();
      break;
  }
}

function handleExport() {
  message.info('导出功能开发中');
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.mch-container {
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
