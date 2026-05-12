<template>
  <div class="account-container">
    <Card>
      <Row :gutter="16" class="stat-row">
        <Col :span="6">
          <Card>
            <Statistic title="总账户数" :value="stats.totalCount" />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic title="总余额" :value="stats.totalBalance" :precision="2" prefix="¥" :value-style="{ color: '#1890ff' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic title="冻结金额" :value="stats.frozenBalance" :precision="2" prefix="¥" :value-style="{ color: '#faad14' }" />
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic title="可用余额" :value="stats.availableBalance" :precision="2" prefix="¥" :value-style="{ color: '#52c41a' }" />
          </Card>
        </Col>
      </Row>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'balance'">
            <span style="color: #f5222d">¥{{ record.balance }}</span>
          </template>
          <template v-else-if="column.key === 'availableBalance'">
            <span style="color: #52c41a">¥{{ record.availableBalance }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openRecordModal(record)">明细</Button>
              <Button type="link" size="small" @click="openAdjustModal(record, 'add')">加款</Button>
              <Button type="link" size="small" @click="openAdjustModal(record, 'sub')">扣款</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Row, Col, Statistic, Space, Button } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const stats = reactive({
  totalCount: 0,
  totalBalance: 0,
  frozenBalance: 0,
  availableBalance: 0,
});

const columns = [
  { title: '账户号', dataIndex: 'accountNo', key: 'accountNo' },
  { title: '商户号', dataIndex: 'mchNo', key: 'mchNo' },
  { title: '商户名称', dataIndex: 'mchName', key: 'mchName' },
  { title: '账户余额', key: 'balance' },
  { title: '冻结金额', dataIndex: 'frozenBalance', key: 'frozenBalance' },
  { title: '可用余额', key: 'availableBalance' },
  { title: '累计收入', dataIndex: 'totalIncome', key: 'totalIncome' },
  { title: '累计支出', dataIndex: 'totalExpense', key: 'totalExpense' },
  { title: '操作', key: 'action', width: 180 },
];

function openRecordModal(record: any) {
  console.log('查看明细', record);
}

function openAdjustModal(record: any, type: string) {
  console.log('调整', type, record);
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await fetch('/basic-api/account/list?page=1&pageSize=100');
    const data = await res.json();
    if (data.result) {
      dataSource.value = data.result.list || [];
      stats.totalCount = data.result.total || 0;
      stats.totalBalance = dataSource.value.reduce((sum: number, item: any) => sum + Number(item.balance), 0);
      stats.frozenBalance = dataSource.value.reduce((sum: number, item: any) => sum + Number(item.frozenBalance), 0);
      stats.availableBalance = dataSource.value.reduce((sum: number, item: any) => sum + Number(item.availableBalance), 0);
    }
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.account-container {
  padding: 16px;
  background: #f0f2f5;
}
.stat-row {
  margin-bottom: 16px;
}
</style>
