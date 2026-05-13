<template>
  <div class="agent-withdraw">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="申请单号">
          <Input v-model:value="searchForm.withdrawNo" placeholder="请输入单号" allow-clear style="width: 170px" />
        </FormItem>
        <FormItem label="代理商">
          <Input v-model:value="searchForm.agentName" placeholder="请输入代理商名称" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 110px">
            <SelectOption :value="0">待处理</SelectOption>
            <SelectOption :value="1">审核通过</SelectOption>
            <SelectOption :value="2">已打款</SelectOption>
            <SelectOption :value="3">打款失败</SelectOption>
          </Select>
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <Row :gutter="16" class="stat-row">
        <Col :span="6"><Statistic title="待处理" :value="stats.pendingCount" :value-style="{ color: '#faad14' }" /></Col>
        <Col :span="6"><Statistic title="申请金额" :value="stats.totalAmount" :precision="2" prefix="¥" /></Col>
        <Col :span="6"><Statistic title="已打款" :value="stats.paidAmount" :precision="2" prefix="¥" :value-style="{ color: '#52c41a' }" /></Col>
        <Col :span="6"><Statistic title="失败金额" :value="stats.failAmount" :precision="2" prefix="¥" :value-style="{ color: '#f5222d' }" /></Col>
      </Row>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1300 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'amount'"><span style="color: #f5222d; font-weight: 500;">¥{{ record.amount }}</span></template>
          <template v-else-if="column.key === 'fee'">¥{{ record.fee }}</template>
          <template v-else-if="column.key === 'actualAmount'"><span style="color: #52c41a;">¥{{ record.actualAmount }}</span></template>
          <template v-else-if="column.key === 'status'"><Tag :color="getStatusColor(record.status)">{{ record.statusName }}</Tag></template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Button type="link" size="small" @click="handleProcess(record)" v-if="record.status === 0">处理</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="detailVisible" title="提现详情" width="600px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="申请单号" :span="2">{{ currentRecord.withdrawNo }}</DescriptionsItem>
        <DescriptionsItem label="代理商">{{ currentRecord.agentName }}</DescriptionsItem>
        <DescriptionsItem label="代理商号">{{ currentRecord.agentNo }}</DescriptionsItem>
        <DescriptionsItem label="申请金额"><span style="color: #f5222d;">¥{{ currentRecord.amount }}</span></DescriptionsItem>
        <DescriptionsItem label="手续费">¥{{ currentRecord.fee }}</DescriptionsItem>
        <DescriptionsItem label="到账金额"><span style="color: #52c41a;">¥{{ currentRecord.actualAmount }}</span></DescriptionsItem>
        <DescriptionsItem label="申请类型">{{ currentRecord.typeName }}</DescriptionsItem>
        <DescriptionsItem label="状态"><Tag :color="getStatusColor(currentRecord.status)">{{ currentRecord.statusName }}</Tag></DescriptionsItem>
        <DescriptionsItem label="申请备注" :span="2">{{ currentRecord.remark || '-' }}</DescriptionsItem>
        <DescriptionsItem label="申请时间">{{ currentRecord.createdAt }}</DescriptionsItem>
        <DescriptionsItem label="处理时间">{{ currentRecord.processTime || '-' }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Row, Col, Statistic, Modal, Descriptions, DescriptionsItem } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ withdrawNo: '', agentName: '', status: undefined as number | undefined });
const stats = reactive({ pendingCount: 0, totalAmount: 0, paidAmount: 0, failAmount: 0 });

const columns = [
  { title: '申请单号', dataIndex: 'withdrawNo', key: 'withdrawNo', width: 180 },
  { title: '代理商', dataIndex: 'agentName', key: 'agentName', width: 150 },
  { title: '代理商号', dataIndex: 'agentNo', key: 'agentNo', width: 120 },
  { title: '申请金额', key: 'amount', width: 120 },
  { title: '手续费', key: 'fee', width: 100 },
  { title: '到账金额', key: 'actualAmount', width: 120 },
  { title: '申请类型', dataIndex: 'typeName', key: 'typeName', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

function getStatusColor(status: number) { return { 0: 'default', 1: 'processing', 2: 'success', 3: 'error' }[status] || 'default'; }

async function fetchData() {
  loading.value = true;
  try {
    const params: any = { page: pagination.current, pageSize: pagination.pageSize };
    if (searchForm.withdrawNo) params.withdrawNo = searchForm.withdrawNo;
    if (searchForm.agentName) params.agentName = searchForm.agentName;
    if (searchForm.status !== undefined) params.status = searchForm.status;
    
    const res = await defHttp.get({ url: '/basic-api/agent/withdraw/list', params });
    if (res) {
      dataSource.value = res.list || [];
      pagination.total = res.total || 0;
      stats.pendingCount = dataSource.value.filter(item => item.status === 0).length;
      stats.totalAmount = dataSource.value.reduce((sum, item) => sum + Number(item.amount), 0);
      stats.paidAmount = dataSource.value.filter(item => item.status === 2).reduce((sum, item) => sum + Number(item.amount), 0);
      stats.failAmount = dataSource.value.filter(item => item.status === 3).reduce((sum, item) => sum + Number(item.amount), 0);
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
function handleReset() { searchForm.withdrawNo = ''; searchForm.agentName = ''; searchForm.status = undefined; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openDetailModal(record: any) { currentRecord.value = record; detailVisible.value = true; }
function handleProcess(record: any) { message.success('处理成功'); fetchData(); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.agent-withdraw { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
</style>
