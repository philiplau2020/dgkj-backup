<template>
  <div class="trade-transfer">
    <Card>
      <!-- 搜索 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="转账单号">
          <Input v-model:value="searchForm.transferNo" placeholder="请输入转账单号" allow-clear style="width: 170px" />
        </FormItem>
        <FormItem label="商户号">
          <Input v-model:value="searchForm.mchNo" placeholder="请输入商户号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" allow-clear style="width: 100px">
            <SelectOption :value="0">待转账</SelectOption>
            <SelectOption :value="1">转账中</SelectOption>
            <SelectOption :value="2">已成功</SelectOption>
            <SelectOption :value="3">已失败</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="日期">
          <RangePicker v-model:value="dateRange" style="width: 240px" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <!-- 统计 -->
      <Row :gutter="16" class="stat-row">
        <Col :span="6">
          <Statistic title="总笔数" :value="stats.totalCount" />
        </Col>
        <Col :span="6">
          <Statistic title="总金额" :value="stats.totalAmount" :precision="2" prefix="¥" />
        </Col>
        <Col :span="6">
          <Statistic title="成功金额" :value="stats.successAmount" :precision="2" prefix="¥" :value-style="{ color: '#52c41a' }" />
        </Col>
        <Col :span="6">
          <Statistic title="失败金额" :value="stats.failAmount" :precision="2" prefix="¥" :value-style="{ color: '#f5222d' }" />
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button @click="handleExport">导出</Button>
          <Button @click="handleRefresh">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </Space>
      </div>

      <!-- 列表 -->
      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: 1400 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'amount'">
            <span style="color: #f5222d; font-weight: 500;">¥{{ record.amount }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="getStatusColor(record.status)">
              {{ record.statusName }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal v-model:open="detailVisible" title="转账详情" width="600px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="转账单号" :span="2">{{ currentRecord.transferNo }}</DescriptionsItem>
        <DescriptionsItem label="商户号">{{ currentRecord.mchNo }}</DescriptionsItem>
        <DescriptionsItem label="商户名称">{{ currentRecord.mchName }}</DescriptionsItem>
        <DescriptionsItem label="转账金额">
          <span style="color: #f5222d; font-weight: 500;">¥{{ currentRecord.amount }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="收款账号">{{ currentRecord.payeeAccount }}</DescriptionsItem>
        <DescriptionsItem label="收款人">{{ currentRecord.payeeName }}</DescriptionsItem>
        <DescriptionsItem label="状态">
          <Tag :color="getStatusColor(currentRecord.status)">{{ currentRecord.statusName }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="转账备注">{{ currentRecord.remark || '-' }}</DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createdAt }}</DescriptionsItem>
        <DescriptionsItem label="完成时间">{{ currentRecord.finishTime || '-' }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Row, Col, Statistic, RangePicker, Modal, Descriptions, DescriptionsItem } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({
  current: 1, pageSize: 10, total: 0,
  showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  transferNo: '', mchNo: '', status: undefined as number | undefined,
});
const dateRange = ref<[any, any] | null>(null);

const stats = reactive({ totalCount: 0, totalAmount: 0, successAmount: 0, failAmount: 0 });

const columns = [
  { title: '转账单号', dataIndex: 'transferNo', key: 'transferNo', width: 180 },
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo', width: 120 },
  { title: '商户名称', dataIndex: 'mchName', key: 'mchName', width: 140 },
  { title: '转账金额', key: 'amount', width: 120 },
  { title: '收款账号', dataIndex: 'payeeAccount', key: 'payeeAccount', width: 160 },
  { title: '收款人', dataIndex: 'payeeName', key: 'payeeName', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 80 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

function getStatusColor(status: number) {
  const map: Record<number, string> = { 0: 'default', 1: 'processing', 2: 'success', 3: 'error' };
  return map[status] || 'default';
}

async function fetchData() {
  loading.value = true;
  try {
    const mockData = [];
    for (let i = 1; i <= 20; i++) {
      const status = [0, 1, 2, 3][Math.floor(Math.random() * 4)];
      const statusNames = ['待转账', '转账中', '已成功', '已失败'];
      mockData.push({
        id: i,
        transferNo: 'TF' + Date.now().toString().slice(0, 10) + i.toString().padStart(4, '0'),
        mchNo: i % 2 === 0 ? 'M10001' : 'M10002',
        mchName: i % 2 === 0 ? '测试商户001' : '测试商户002',
        amount: (Math.random() * 10000 + 100).toFixed(2),
        payeeAccount: '621226****' + (1000 + i),
        payeeName: ['张三', '李四', '王五'][i % 3],
        status,
        statusName: statusNames[status],
        remark: '转账备注' + i,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString().replace('T', ' ').slice(0, 19),
        finishTime: status === 2 ? new Date(Date.now() - Math.random() * 86400000).toISOString().replace('T', ' ').slice(0, 19) : null,
      });
    }
    dataSource.value = mockData;
    pagination.total = mockData.length;
    stats.totalCount = mockData.length;
    stats.totalAmount = mockData.reduce((sum, item) => sum + Number(item.amount), 0);
    stats.successAmount = mockData.filter(item => item.status === 2).reduce((sum, item) => sum + Number(item.amount), 0);
    stats.failAmount = mockData.filter(item => item.status === 3).reduce((sum, item) => sum + Number(item.amount), 0);
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.transferNo = ''; searchForm.mchNo = ''; searchForm.status = undefined; dateRange.value = null; handleSearch(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openDetailModal(record: any) { currentRecord.value = record; detailVisible.value = true; }
function handleExport() { message.info('导出功能开发中'); }
function handleRefresh() { fetchData(); message.success('刷新成功'); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.trade-transfer { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
