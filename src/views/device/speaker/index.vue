<template>
  <div class="device-speaker">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="设备编号">
          <Input v-model:value="searchForm.deviceNo" placeholder="请输入设备编号" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem label="商户">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 100px" placeholder="请选择">
            <SelectOption :value="1">已启用</SelectOption>
            <SelectOption :value="2">已激活</SelectOption>
            <SelectOption :value="0">已禁用</SelectOption>
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
            注册设备
          </Button>
        </Space>
      </div>

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
            <Badge :status="getStatusBadge(record.status)" />
            <span>{{ record.statusName }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openBindModal(record)">绑定商户</Button>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" danger @click="handleDisable(record)" v-if="record.status === 1">禁用</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 注册设备弹窗 -->
    <Modal v-model:open="addVisible" title="注册设备" width="500px" @ok="handleAdd" :confirm-loading="addLoading">
      <Form :model="addForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="设备编号">
          <Input v-model:value="addForm.deviceNo" placeholder="请输入设备编号" />
        </FormItem>
        <FormItem label="设备型号">
          <Input v-model:value="addForm.deviceModel" placeholder="请输入设备型号" />
        </FormItem>
        <FormItem label="厂商">
          <Input v-model:value="addForm.manufacturer" placeholder="请输入厂商" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 绑定商户弹窗 -->
    <Modal v-model:open="bindVisible" title="绑定商户" width="400px" @ok="handleBind" :confirm-loading="bindLoading">
      <Form :model="bindForm" :label-col="{ span: 5 }" :wrapper-col="{ span: 17 }">
        <FormItem label="设备编号">{{ bindForm.deviceNo }}</FormItem>
        <FormItem label="商户号">
          <Input v-model:value="bindForm.mchNo" placeholder="请输入商户号" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 详情弹窗 -->
    <Modal v-model:open="detailVisible" title="设备详情" width="600px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentDevice">
        <DescriptionsItem label="设备ID">{{ currentDevice.id }}</DescriptionsItem>
        <DescriptionsItem label="设备编号">{{ currentDevice.deviceNo }}</DescriptionsItem>
        <DescriptionsItem label="设备名称">{{ currentDevice.deviceName }}</DescriptionsItem>
        <DescriptionsItem label="设备类型">云喇叭</DescriptionsItem>
        <DescriptionsItem label="设备型号">{{ currentDevice.deviceModel || '-' }}</DescriptionsItem>
        <DescriptionsItem label="商户号">{{ currentDevice.mchNo || '-' }}</DescriptionsItem>
        <DescriptionsItem label="状态">{{ currentDevice.statusName }}</DescriptionsItem>
        <DescriptionsItem label="最后心跳">{{ currentDevice.lastHeartbeat || '-' }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Badge,
  Modal, Descriptions, DescriptionsItem, message
} from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const addLoading = ref(false);
const bindLoading = ref(false);
const dataSource = ref<any[]>([]);
const currentDevice = ref<any>(null);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
});

const searchForm = reactive({
  deviceNo: '',
  mchNo: '',
  status: undefined as number | undefined,
});

const columns = [
  { title: '设备编号', dataIndex: 'deviceNo', key: 'deviceNo', width: 150 },
  { title: '设备名称', dataIndex: 'deviceName', key: 'deviceName', width: 150 },
  { title: '设备型号', dataIndex: 'deviceModel', key: 'deviceModel', width: 120 },
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '最后心跳', dataIndex: 'lastHeartbeat', key: 'lastHeartbeat', width: 170 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
];

const addVisible = ref(false);
const bindVisible = ref(false);
const detailVisible = ref(false);

const addForm = reactive({
  deviceNo: '',
  deviceModel: '',
  manufacturer: '',
});

const bindForm = reactive({
  id: '',
  deviceNo: '',
  mchNo: '',
});

const getStatusBadge = (status: number) => {
  const map: Record<number, string> = { 0: 'default', 1: 'success', 2: 'processing', 3: 'error' };
  return map[status] || 'default';
};

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      deviceType: 2, // 云喇叭
    };
    if (searchForm.deviceNo) params.deviceNo = searchForm.deviceNo;
    if (searchForm.mchNo) params.mchNo = searchForm.mchNo;
    if (searchForm.status !== undefined) params.status = searchForm.status;

    const res = await defHttp.get({ url: '/basic-api/device/speaker/list', params });
    if (res?.data) {
      dataSource.value = res.data.list || [];
      pagination.total = res.data.total || 0;
    } else if (res?.list) {
      dataSource.value = res.list || [];
      pagination.total = res.total || 0;
    } else {
      dataSource.value = [];
      pagination.total = 0;
    }
  } catch (e) {
    console.error('获取设备列表失败', e);
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
  searchForm.deviceNo = '';
  searchForm.mchNo = '';
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openAddModal() {
  addForm.deviceNo = '';
  addForm.deviceModel = '';
  addForm.manufacturer = '';
  addVisible.value = true;
}

async function handleAdd() {
  addLoading.value = true;
  try {
    await defHttp.post({
      url: '/basic-api/device/register',
      params: {
        deviceNo: addForm.deviceNo,
        deviceType: 2,
        deviceModel: addForm.deviceModel,
        manufacturer: addForm.manufacturer,
      }
    });
    message.success('注册成功');
    addVisible.value = false;
    fetchData();
  } catch (e) {
    message.error('注册失败');
  } finally {
    addLoading.value = false;
  }
}

function openBindModal(record: any) {
  bindForm.id = record.id;
  bindForm.deviceNo = record.deviceNo;
  bindForm.mchNo = '';
  bindVisible.value = true;
}

async function handleBind() {
  if (!bindForm.mchNo) {
    message.warning('请输入商户号');
    return;
  }
  bindLoading.value = true;
  try {
    await defHttp.put({ url: '/basic-api/device/bind', params: { id: bindForm.id, mchNo: bindForm.mchNo } });
    message.success('绑定成功');
    bindVisible.value = false;
    fetchData();
  } catch (e) {
    message.error('绑定失败');
  } finally {
    bindLoading.value = false;
  }
}

function openDetailModal(record: any) {
  currentDevice.value = record;
  detailVisible.value = true;
}

async function handleDisable(record: any) {
  try {
    await defHttp.put({ url: '/basic-api/device/disable', params: { id: record.id, reason: '手动禁用' } });
    message.success('禁用成功');
    fetchData();
  } catch (e) {
    message.error('禁用失败');
  }
}

onMounted(() => { fetchData(); });
</script>

<style scoped>
.device-speaker { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
