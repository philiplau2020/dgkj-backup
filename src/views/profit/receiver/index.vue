<template>
  <div class="profit-receiver">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="商户">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 100px">
            <SelectOption :value="1">正常</SelectOption>
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

      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openAddModal">
            <template #icon><PlusOutlined /></template>
            添加收款账号
          </Button>
        </Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1200 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'channelType'">
            <Tag :color="getChannelColor(record.channelType)">{{ record.channelTypeName }}</Tag>
          </template>
          <template v-else-if="column.key === 'relationType'">
            <Tag>{{ record.relationTypeName }}</Tag>
          </template>
          <template v-else-if="column.key === 'rate'">{{ (Number(record.rate) * 100).toFixed(2) }}%</template>
          <template v-else-if="column.key === 'isDefault'">
            <Tag :color="record.isDefault === 1 ? 'green' : 'default'">{{ record.isDefault === 1 ? '默认' : '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Switch :checked="record.status === 1" @change="(checked) => handleStatusChange(record, checked)" />
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

    <Modal v-model:open="formVisible" :title="formMode === 'add' ? '添加收款账号' : '编辑收款账号'" width="600px" @ok="handleFormSubmit">
      <Form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="formRules">
        <FormItem label="商户号" name="mchNo">
          <Input v-model:value="formData.mchNo" placeholder="请输入商户号" />
        </FormItem>
        <FormItem label="账号组" name="groupId">
          <Select v-model:value="formData.groupId" placeholder="请选择账号组">
            <SelectOption value="G001">默认分账组</SelectOption>
            <SelectOption value="G002">代理商分账</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="渠道类型" name="channelType">
          <Select v-model:value="formData.channelType" placeholder="请选择渠道">
            <SelectOption :value="1">微信</SelectOption>
            <SelectOption :value="2">支付宝</SelectOption>
            <SelectOption :value="3">通联</SelectOption>
            <SelectOption :value="4">中信银行</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="分账账号" name="receiverAccount">
          <Input v-model:value="formData.receiverAccount" placeholder="请输入分账接收账号" />
        </FormItem>
        <FormItem label="账号名称" name="receiverName">
          <Input v-model:value="formData.receiverName" placeholder="请输入账号名称" />
        </FormItem>
        <FormItem label="分账关系" name="relationType">
          <Select v-model:value="formData.relationType" placeholder="请选择分账关系">
            <SelectOption :value="1">代理商</SelectOption>
            <SelectOption :value="2">供应商</SelectOption>
            <SelectOption :value="3">员工</SelectOption>
            <SelectOption :value="4">其他</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="分账比例(%)" name="rate">
          <InputNumber v-model:value="formData.rate" :min="0" :max="100" :precision="2" style="width: 100%" />
        </FormItem>
        <FormItem label="设为默认">
          <Switch v-model:checked="formData.isDefault" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Switch, InputNumber, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ mchNo: '', status: undefined as number | undefined });
const columns = [
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 120 },
  { title: '组名称', dataIndex: 'groupName', key: 'groupName', width: 130 },
  { title: '渠道类型', key: 'channelType', width: 120 },
  { title: '分账账号', dataIndex: 'receiverAccount', key: 'receiverAccount', width: 160 },
  { title: '账号名称', dataIndex: 'receiverName', key: 'receiverName', width: 120 },
  { title: '分账关系', key: 'relationType', width: 100 },
  { title: '分账比例', key: 'rate', width: 100 },
  { title: '默认', key: 'isDefault', width: 80 },
  { title: '状态', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 120 },
];

const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formData = reactive({ mchNo: '', groupId: '', channelType: undefined as number | undefined, receiverAccount: '', receiverName: '', relationType: undefined as number | undefined, rate: 0, isDefault: false });
const formRules = { mchNo: [{ required: true, message: '请输入商户号' }], receiverAccount: [{ required: true, message: '请输入分账账号' }] };

function getChannelColor(type: number) { return { 1: 'green', 2: 'blue', 3: 'orange', 4: 'red' }[type] || 'default'; }

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = [
      { id: 1, mchNo: 'M10001', mchName: '测试商户001', groupName: '默认分账组', groupId: 'G001', channelType: 1, channelTypeName: '微信', receiverAccount: 'wx_1234567890', receiverName: '张三', relationType: 1, relationTypeName: '代理商', rate: '0.10', isDefault: 1, status: 1 },
      { id: 2, mchNo: 'M10001', mchName: '测试商户001', groupName: '默认分账组', groupId: 'G001', channelType: 2, channelTypeName: '支付宝', receiverAccount: 'ali_1234567890', receiverName: '李四', relationType: 1, relationTypeName: '代理商', rate: '0.08', isDefault: 0, status: 1 },
      { id: 3, mchNo: 'M10001', mchName: '测试商户001', groupName: '代理商分账', groupId: 'G002', channelType: 4, channelTypeName: '中信银行', receiverAccount: '621226****8888', receiverName: '王五', relationType: 1, relationTypeName: '代理商', rate: '0.05', isDefault: 1, status: 1 },
    ];
    pagination.total = dataSource.value.length;
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.mchNo = ''; searchForm.status = undefined; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function handleStatusChange(record: any, checked: boolean) { record.status = checked ? 1 : 0; message.success('状态更新成功'); }
function openAddModal() { formMode.value = 'add'; Object.assign(formData, { mchNo: '', groupId: '', channelType: undefined, receiverAccount: '', receiverName: '', relationType: undefined, rate: 0, isDefault: false }); formVisible.value = true; }
function openEditModal(record: any) { formMode.value = 'edit'; Object.assign(formData, record); formVisible.value = true; }
async function handleFormSubmit() { message.success(formMode.value === 'add' ? '添加成功' : '更新成功'); formVisible.value = false; fetchData(); }
function handleDelete(record: any) { message.warning('删除功能需要确认'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.profit-receiver { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
