<template>
  <div class="check-channel-bill">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="对账批次">
          <Input v-model:value="searchForm.batchNo" placeholder="请输入批次号" allow-clear style="width: 170px" />
        </FormItem>
        <FormItem label="支付接口">
          <Select v-model:value="searchForm.ifCode" allow-clear style="width: 140px">
            <SelectOption value="CITIC_QR">中信银行</SelectOption>
            <SelectOption value="WX_QR">微信</SelectOption>
            <SelectOption value="ALI_QR">支付宝</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="账单类型">
          <Select v-model:value="searchForm.billType" allow-clear style="width: 110px">
            <SelectOption :value="1">交易</SelectOption>
            <SelectOption :value="2">退款</SelectOption>
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
          <Button @click="handleExport">导出</Button>
          <Button @click="handleRefresh"><ReloadOutlined />刷新</Button>
        </Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1200 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'amount'"><span style="color: #1890ff;">¥{{ record.amount }}</span></template>
          <template v-else-if="column.key === 'fee'">¥{{ record.fee }}</template>
          <template v-else-if="column.key === 'billType'"><Tag>{{ record.billTypeName }}</Tag></template>
          <template v-else-if="column.key === 'tradeStatus'"><Tag :color="record.tradeStatus === 1 ? 'success' : 'error'">{{ record.tradeStatusName }}</Tag></template>
        </template>
      </Table>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Pagination } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ batchNo: '', ifCode: '', billType: undefined as number | undefined });

const columns = [
  { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 180 },
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
  { title: '支付接口', dataIndex: 'ifCodeName', key: 'ifCodeName', width: 120 },
  { title: '账单类型', key: 'billType', width: 100 },
  { title: '交易金额', key: 'amount', width: 120 },
  { title: '手续费', key: 'fee', width: 100 },
  { title: '交易状态', key: 'tradeStatus', width: 100 },
  { title: '交易时间', dataIndex: 'tradeTime', key: 'tradeTime', width: 170 },
];

async function fetchData() {
  loading.value = true;
  try {
    const mockData = [];
    for (let i = 1; i <= 50; i++) {
      const billType = Math.random() > 0.9 ? 2 : 1;
      mockData.push({
        id: i, batchNo: 'BATCH' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '001',
        orderNo: 'P' + Date.now().toString().slice(0, 10) + i,
        ifCode: ['CITIC_QR', 'WX_QR', 'ALI_QR'][i % 3], ifCodeName: ['中信银行', '微信', '支付宝'][i % 3],
        billType, billTypeName: billType === 1 ? '交易' : '退款',
        amount: (Math.random() * 1000 + 10).toFixed(2), fee: (Math.random() * 10 + 1).toFixed(2),
        tradeStatus: Math.random() > 0.05 ? 1 : 0, tradeStatusName: Math.random() > 0.05 ? '成功' : '失败',
        tradeTime: new Date(Date.now() - Math.random() * 86400000).toISOString().replace('T', ' ').slice(0, 19),
      });
    }
    dataSource.value = mockData; pagination.total = mockData.length;
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.batchNo = ''; searchForm.ifCode = ''; searchForm.billType = undefined; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function handleExport() { message.info('导出功能开发中'); }
function handleRefresh() { fetchData(); message.success('刷新成功'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.check-channel-bill { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
