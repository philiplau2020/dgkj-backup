<template>
  <div class="stat-agent">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="日期">
          <DatePicker v-model:value="searchForm.date" style="width: 120px" />
        </FormItem>
        <FormItem label="代理商">
          <Input v-model:value="searchForm.agentName" placeholder="请输入代理商名称" allow-clear style="width: 150px" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <Row :gutter="16" class="stat-row">
        <Col :span="6"><Statistic title="代理商数" :value="stats.totalAgent" /></Col>
        <Col :span="6"><Statistic title="交易金额" :value="stats.totalAmount" :precision="2" prefix="¥" /></Col>
        <Col :span="6"><Statistic title="退款金额" :value="stats.refundAmount" :precision="2" prefix="¥" /></Col>
        <Col :span="6"><Statistic title="成功率" :value="stats.successRate" suffix="%" :value-style="{ color: '#52c41a' }" /></Col>
      </Row>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1200 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'tradeAmount'"><span style="color: #f5222d;">¥{{ Number(record.tradeAmount).toLocaleString() }}</span></template>
          <template v-else-if="column.key === 'refundAmount'"><span style="color: #faad14;">¥{{ Number(record.refundAmount).toLocaleString() }}</span></template>
          <template v-else-if="column.key === 'successRate'"><span :style="{ color: Number(record.successRate) >= 95 ? '#52c41a' : '#faad14' }">{{ record.successRate }}%</span></template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="openMerchantStat(record)">商户统计</Button>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Button, Space, Row, Col, Statistic, DatePicker } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ date: null as any, agentName: '' });
const stats = reactive({ totalAgent: 0, totalAmount: 0, refundAmount: 0, successRate: 0 });

const columns = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
  { title: '代理商名称', dataIndex: 'agentName', key: 'agentName', width: 150 },
  { title: '代理商号', dataIndex: 'agentNo', key: 'agentNo', width: 120 },
  { title: '交易金额', key: 'tradeAmount', width: 140 },
  { title: '退款金额', key: 'refundAmount', width: 140 },
  { title: '交易笔数', dataIndex: 'tradeCount', key: 'tradeCount', width: 100 },
  { title: '成功笔数', dataIndex: 'successCount', key: 'successCount', width: 100 },
  { title: '成功率', key: 'successRate', width: 100 },
  { title: '操作', key: 'action', width: 100 },
];

async function fetchData() {
  loading.value = true;
  try {
    const params: any = { page: pagination.current, pageSize: pagination.pageSize };
    if (searchForm.agentName) params.agentName = searchForm.agentName;
    
    const res = await defHttp.get({ url: '/basic-api/stat/agent/list', params });
    if (res && res.data) {
      dataSource.value = res.data;
      pagination.total = res.total || 0;
      stats.totalAgent = dataSource.value.length;
      stats.totalAmount = dataSource.value.reduce((sum, item) => sum + Number(item.tradeAmount), 0);
      stats.refundAmount = dataSource.value.reduce((sum, item) => sum + Number(item.refundAmount), 0);
      const totalCount = dataSource.value.reduce((sum, item) => sum + item.tradeCount, 0);
      const successCount = dataSource.value.reduce((sum, item) => sum + item.successCount, 0);
      stats.successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(2) : 0;
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
function handleReset() { searchForm.date = null; searchForm.agentName = ''; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openMerchantStat(record: any) { message.info('跳转商户统计页面'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.stat-agent { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
</style>
