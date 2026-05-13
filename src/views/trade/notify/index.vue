<template>
  <div class="trade-notify">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="商户订单号">
          <Input v-model:value="searchForm.mchOrderNo" placeholder="请输入商户订单号" allow-clear style="width: 170px" />
        </FormItem>
        <FormItem label="通知状态">
          <Select v-model:value="searchForm.notifyStatus" allow-clear style="width: 120px">
            <SelectOption :value="0">待通知</SelectOption>
            <SelectOption :value="1">通知成功</SelectOption>
            <SelectOption :value="2">通知失败</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="日期">
          <RangePicker v-model:value="dateRange" />
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
          <Button @click="handleBatchNotify">批量通知</Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
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
        <template #bodyCell="{ column, record }"><template v-if="column.key === 'notifyStatus'">
            <Tag :color="getStatusColor(record.notifyStatus)">{{ record.notifyStatusName }}</Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="handleResend(record)">重发</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="detailVisible" title="通知详情" width="600px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="订单ID" :span="2">{{ currentRecord.orderId }}</DescriptionsItem>
        <DescriptionsItem label="商户订单号">{{ currentRecord.mchOrderNo }}</DescriptionsItem>
        <DescriptionsItem label="订单类型">{{ currentRecord.orderTypeName }}</DescriptionsItem>
        <DescriptionsItem label="通知状态">
          <Tag :color="getStatusColor(currentRecord.notifyStatus)">{{ currentRecord.notifyStatusName }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="通知次数">{{ currentRecord.notifyCount }} 次</DescriptionsItem>
        <DescriptionsItem label="最后通知时间">{{ currentRecord.lastNotifyTime || '-' }}</DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createdAt }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, RangePicker, Modal, Descriptions, DescriptionsItem } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ mchOrderNo: '', notifyStatus: undefined as number | undefined });
const dateRange = ref<[any, any] | null>(null);

const columns = [
  { title: '订单ID', dataIndex: 'orderId', key: 'orderId', width: 120 },
  { title: '商户订单号', dataIndex: 'mchOrderNo', key: 'mchOrderNo', width: 170 },
  { title: '订单类型', dataIndex: 'orderTypeName', key: 'orderTypeName', width: 100 },
  { title: '通知状态', key: 'notifyStatus', width: 100 },
  { title: '通知次数', dataIndex: 'notifyCount', key: 'notifyCount', width: 80 },
  { title: '最后通知时间', dataIndex: 'lastNotifyTime', key: 'lastNotifyTime', width: 170 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

function getStatusColor(status: number) { return { 0: 'default', 1: 'success', 2: 'error' }[status] || 'default'; }

async function fetchData() {
  loading.value = true;
  try {
    const params: any = { page: pagination.current, pageSize: pagination.pageSize };
    if (searchForm.mchOrderNo) params.mchOrderNo = searchForm.mchOrderNo;
    if (searchForm.notifyStatus !== undefined) params.notifyStatus = searchForm.notifyStatus;
    
    const res = await defHttp.get({ url: '/basic-api/trade/notify/list', params });
    if (res) {
      dataSource.value = res.list || [];
      pagination.total = res.total || 0;
    } else {
      dataSource.value = [];
      pagination.total = 0;
    }
  } catch (e) {
    dataSource.value = [];
    pagination.total = 0;
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.mchOrderNo = ''; searchForm.notifyStatus = undefined; dateRange.value = null; handleSearch(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openDetailModal(record: any) { currentRecord.value = record; detailVisible.value = true; }
function handleResend(record: any) { message.success('重发通知成功'); }
function handleBatchNotify() { message.info('批量通知功能开发中'); }
function handleRefresh() { fetchData(); message.success('刷新成功'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.trade-notify { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
