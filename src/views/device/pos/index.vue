<template>
  <div class="device-pos">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="设备号">
          <Input v-model:value="searchForm.deviceNo" placeholder="请输入设备号" allow-clear style="width: 150px" />
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
          <Button type="primary" @click="openAddModal"><PlusOutlined />设备入库</Button>
        </Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1100 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'green' : 'default'">{{ record.statusName }}</Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openBindModal(record)">绑定</Button>
              <Button type="link" size="small" @click="handleUnbind(record)" v-if="record.mchNo">解绑</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ deviceNo: '', status: undefined as number | undefined });

const columns = [
  { title: '设备号', dataIndex: 'deviceNo', key: 'deviceNo', width: 150 },
  { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 120 },
  { title: '支付接口', dataIndex: 'ifCodeName', key: 'ifCodeName', width: 120 },
  { title: '绑定商户', dataIndex: 'mchName', key: 'mchName', width: 130 },
  { title: '代理商', dataIndex: 'agentName', key: 'agentName', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = [
      { id: 1, deviceNo: 'POS20240001', batchNo: 'BATCH001', ifCode: 'CITIC_QR', ifCodeName: '中信银行', mchNo: 'M10001', mchName: '测试商户001', agentName: '代理商A', status: 1, statusName: '正常', createdAt: '2024-01-01 10:00:00' },
    ];
    pagination.total = dataSource.value.length;
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.deviceNo = ''; searchForm.status = undefined; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openAddModal() { message.info('设备入库功能开发中'); }
function openBindModal(record: any) { message.info('绑定功能开发中'); }
function handleUnbind(record: any) { message.success('解绑成功'); fetchData(); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.device-pos { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
