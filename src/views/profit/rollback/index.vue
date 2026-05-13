<template>
  <div class="profit-rollback">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="回退单号">
          <Input v-model:value="searchForm.rollbackNo" placeholder="请输入回退单号" allow-clear style="width: 170px" />
        </FormItem>
        <FormItem label="原分账单号">
          <Input v-model:value="searchForm.profitNo" placeholder="请输入原分账单号" allow-clear style="width: 170px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 110px">
            <SelectOption :value="0">待处理</SelectOption>
            <SelectOption :value="1">回退中</SelectOption>
            <SelectOption :value="2">已回退</SelectOption>
            <SelectOption :value="3">回退失败</SelectOption>
          </Select>
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1500 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'rollbackAmount'"><span style="color: #f5222d; font-weight: 500;">¥{{ record.rollbackAmount }}</span></template>
          <template v-else-if="column.key === 'profitAmount'">¥{{ record.profitAmount }}</template>
          <template v-else-if="column.key === 'profitRate'">{{ (Number(record.profitRate) * 100).toFixed(2) }}%</template>
          <template v-else-if="column.key === 'status'"><Tag :color="getStatusColor(record.status)">{{ record.statusName }}</Tag></template>
          <template v-else-if="column.key === 'action'">
            <Space><Button type="link" size="small" @click="openDetailModal(record)">详情</Button></Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="detailVisible" title="回退详情" width="700px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="回退单号" :span="2">{{ currentRecord.rollbackNo }}</DescriptionsItem>
        <DescriptionsItem label="原分账单号">{{ currentRecord.profitNo }}</DescriptionsItem>
        <DescriptionsItem label="原退款单号">{{ currentRecord.refundNo }}</DescriptionsItem>
        <DescriptionsItem label="支付订单号">{{ currentRecord.orderNo }}</DescriptionsItem>
        <DescriptionsItem label="商户号">{{ currentRecord.mchNo }}</DescriptionsItem>
        <DescriptionsItem label="回退金额"><span style="color: #f5222d;">¥{{ currentRecord.rollbackAmount }}</span></DescriptionsItem>
        <DescriptionsItem label="原分账金额">¥{{ currentRecord.profitAmount }}</DescriptionsItem>
        <DescriptionsItem label="分账比例">{{ (Number(currentRecord.profitRate) * 100).toFixed(2) }}%</DescriptionsItem>
        <DescriptionsItem label="接收账号">{{ currentRecord.receiverAccount }}</DescriptionsItem>
        <DescriptionsItem label="账号名称">{{ currentRecord.receiverName }}</DescriptionsItem>
        <DescriptionsItem label="状态"><Tag :color="getStatusColor(currentRecord.status)">{{ currentRecord.statusName }}</Tag></DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createdAt }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Modal, Descriptions, DescriptionsItem } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ rollbackNo: '', profitNo: '', status: undefined as number | undefined });

const columns = [
  { title: '回退单号', dataIndex: 'rollbackNo', key: 'rollbackNo', width: 180 },
  { title: '原分账单号', dataIndex: 'profitNo', key: 'profitNo', width: 180 },
  { title: '退款单号', dataIndex: 'refundNo', key: 'refundNo', width: 180 },
  { title: '支付订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 120 },
  { title: '回退金额', key: 'rollbackAmount', width: 120 },
  { title: '原分账金额', key: 'profitAmount', width: 120 },
  { title: '分账比例', key: 'profitRate', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 80 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

async function fetchData() {
  loading.value = true;
  try {
    const params: any = { page: pagination.current, pageSize: pagination.pageSize };
    if (searchForm.rollbackNo) params.rollbackNo = searchForm.rollbackNo;
    if (searchForm.profitNo) params.profitNo = searchForm.profitNo;
    if (searchForm.status !== undefined) params.status = searchForm.status;
    
    const res = await defHttp.get({ url: '/basic-api/profit/rollback/list', params });
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
function handleReset() { searchForm.rollbackNo = ''; searchForm.profitNo = ''; searchForm.status = undefined; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openDetailModal(record: any) { currentRecord.value = record; detailVisible.value = true; }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.profit-rollback { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
</style>
