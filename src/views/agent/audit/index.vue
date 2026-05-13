<template>
  <div class="agent-audit">
    <Card>
      <!-- 搜索表单 -->
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="代理商号">
          <Input v-model:value="searchForm.agentNo" placeholder="请输入代理商号" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="代理商名称">
          <Input v-model:value="searchForm.agentName" placeholder="请输入代理商名称" allow-clear style="width: 160px" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              查询
            </Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <!-- 统计 -->
      <Row :gutter="16" class="stat-row">
        <Col :span="8">
          <Statistic title="待审核数量" :value="stats.pendingCount" :value-style="{ color: '#faad14' }" />
        </Col>
        <Col :span="8">
          <Statistic title="今日已审核" :value="stats.todayApproved" :value-style="{ color: '#52c41a' }" />
        </Col>
        <Col :span="8">
          <Statistic title="本月已审核" :value="stats.monthApproved" :value-style="{ color: '#1890ff' }" />
        </Col>
      </Row>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button type="primary" :disabled="selectedRows.length === 0" @click="handleBatchAudit">
            批量审核
          </Button>
        </Space>
      </div>

      <!-- 表格 -->
      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :row-selection="{ onChange: (keys: any, rows: any[]) => (selectedRows = rows) }"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'agentType'">
            <Tag :color="record.agentType === 1 ? 'blue' : 'green'">
              {{ record.agentType === 1 ? '一级代理' : '二级代理' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'auditStatus'">
            <Tag color="orange">待审核</Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openAuditModal(record)">审核</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 审核弹窗 -->
    <Modal
      v-model:open="auditVisible"
      title="代理商审核"
      width="500px"
      @ok="handleAuditSubmit"
    >
      <Form :model="auditForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="代理商号">{{ currentRecord?.agentNo }}</FormItem>
        <FormItem label="代理商名称">{{ currentRecord?.agentName }}</FormItem>
        <FormItem label="代理类型">
          <Tag :color="currentRecord?.agentType === 1 ? 'blue' : 'green'">
            {{ currentRecord?.agentType === 1 ? '一级代理' : '二级代理' }}
          </Tag>
        </FormItem>
        <FormItem label="联系人">{{ currentRecord?.contactName }}</FormItem>
        <FormItem label="联系电话">{{ currentRecord?.contactMobile }}</FormItem>
        <FormItem label="审核结果" required>
          <RadioGroup v-model:value="auditForm.status">
            <Radio :value="1">通过</Radio>
            <Radio :value="2">拒绝</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="审核备注">
          <Textarea v-model:value="auditForm.remark" :rows="3" placeholder="请输入审核备注" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 批量审核弹窗 -->
    <Modal
      v-model:open="batchVisible"
      title="批量审核"
      width="500px"
      @ok="handleBatchSubmit"
    >
      <Form :model="batchForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="已选数量">{{ selectedRows.length }} 条</FormItem>
        <FormItem label="审核结果" required>
          <RadioGroup v-model:value="batchForm.status">
            <Radio :value="1">全部通过</Radio>
            <Radio :value="2">全部拒绝</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="审核备注">
          <Textarea v-model:value="batchForm.remark" :rows="3" placeholder="请输入审核备注" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Button, Space, Tag, Row, Col, Statistic, RadioGroup, Radio, Textarea, Modal } from 'ant-design-vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const selectedRows = ref<any[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  agentNo: '',
  agentName: '',
});

const stats = reactive({
  pendingCount: 0,
  todayApproved: 0,
  monthApproved: 0,
});

const columns = [
  { title: '审核单号', dataIndex: 'auditNo', key: 'auditNo', width: 140 },
  { title: '代理商号', dataIndex: 'agentNo', key: 'agentNo', width: 120 },
  { title: '代理商名称', dataIndex: 'agentName', key: 'agentName', width: 160 },
  { title: '代理类型', key: 'agentType', width: 100 },
  { title: '联系人', dataIndex: 'contactName', key: 'contactName', width: 100 },
  { title: '联系电话', dataIndex: 'contactMobile', key: 'contactMobile', width: 130 },
  { title: '审核状态', key: 'auditStatus', width: 100 },
  { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 80 },
];

const currentRecord = ref<any>(null);
const auditVisible = ref(false);
const auditForm = reactive({
  status: 1,
  remark: '',
});

const batchVisible = ref(false);
const batchForm = reactive({
  status: 1,
  remark: '',
});

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.agentNo) params.agentNo = searchForm.agentNo;
    if (searchForm.agentName) params.agentName = searchForm.agentName;

    const res = await defHttp.get({ url: '/basic-api/agent/audit/list', params });
    if (res) {
      dataSource.value = res.list || [];
      pagination.total = res.total || 0;
      stats.pendingCount = res.total || 0;
    }
  } catch (error) {
    console.error('获取数据失败', error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.agentNo = '';
  searchForm.agentName = '';
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openAuditModal(record: any) {
  currentRecord.value = record;
  auditForm.status = 1;
  auditForm.remark = '';
  auditVisible.value = true;
}

async function handleAuditSubmit() {
  try {
    await defHttp.post({ url: '/basic-api/agent/audit', data: {
      agentNo: currentRecord.value?.agentNo,
      status: auditForm.status,
      remark: auditForm.remark,
    }});
    message.success('审核成功');
    auditVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('审核失败');
  }
}

function handleBatchAudit() {
  batchForm.status = 1;
  batchForm.remark = '';
  batchVisible.value = true;
}

async function handleBatchSubmit() {
  try {
    message.success('批量审核成功');
    batchVisible.value = false;
    selectedRows.value = [];
    fetchData();
  } catch (error) {
    message.error('批量审核失败');
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.agent-audit {
  padding: 16px;
  background: #f0f2f5;
}
.search-form {
  margin-bottom: 16px;
}
.stat-row {
  margin-bottom: 16px;
}
.table-toolbar {
  margin-bottom: 16px;
}
</style>
