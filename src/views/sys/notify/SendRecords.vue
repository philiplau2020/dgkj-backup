<template>
  <div class="send-records">
    <!-- 搜索栏 -->
    <Card class="search-card">
      <Form layout="inline" :model="queryParams">
        <FormItem label="通知类型">
          <Select v-model:value="queryParams.notifyType" placeholder="请选择" allowClear style="width: 120px">
            <SelectOption value="email">邮件</SelectOption>
            <SelectOption value="sms">短信</SelectOption>
            <SelectOption value="dingtalk">钉钉</SelectOption>
            <SelectOption value="wecom">企业微信</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="场景类型">
          <Select v-model:value="queryParams.sceneCode" placeholder="请选择" allowClear style="width: 150px">
            <SelectOption value="TRADE_SUCCESS">支付成功</SelectOption>
            <SelectOption value="TRADE_FAIL">支付失败</SelectOption>
            <SelectOption value="SETTLE_SUCCESS">结算成功</SelectOption>
            <SelectOption value="MERCHANT_AUDIT">商户审核</SelectOption>
            <SelectOption value="RISK_ALERT">风控预警</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="发送状态">
          <Select v-model:value="queryParams.sendStatus" placeholder="请选择" allowClear style="width: 120px">
            <SelectOption value="0">待发送</SelectOption>
            <SelectOption value="1">发送中</SelectOption>
            <SelectOption value="2">成功</SelectOption>
            <SelectOption value="3">失败</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="接收人">
          <Input v-model:value="queryParams.receiver" placeholder="请输入" allowClear style="width: 150px" />
        </FormItem>
        <FormItem label="发送时间">
          <RangePicker v-model:value="queryParams.dateRange" @change="handleDateChange" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>

    <!-- 表格 -->
    <Card class="table-card">
      <Table
        :data-source="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'notifyType'">
            <Tag :color="getTypeColor(record.notifyType)">
              {{ getTypeText(record.notifyType) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'sendStatus'">
            <Badge :status="getStatusBadge(record.sendStatus)" />
            <span>{{ getStatusText(record.sendStatus) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleView(record)">查看</Button>
              <Button
                v-if="record.sendStatus === 3"
                type="link" size="small"
                @click="handleRetry(record)"
                :loading="retryingId === record.notifyId"
              >
                重发
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal v-model:open="detailVisible" title="通知详情" :footer="null" width="600px">
      <Descriptions :column="1" bordered v-if="currentRecord">
        <DescriptionsItem label="通知ID">
          <span copyable>{{ currentRecord.notifyId }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="通知类型">{{ getTypeText(currentRecord.notifyType) }}</DescriptionsItem>
        <DescriptionsItem label="场景">{{ currentRecord.sceneCode }}</DescriptionsItem>
        <DescriptionsItem label="接收人">{{ currentRecord.receiver }}</DescriptionsItem>
        <DescriptionsItem label="接收人编号">{{ currentRecord.receiverNo || '-' }}</DescriptionsItem>
        <DescriptionsItem label="接收人类型">{{ currentRecord.receiverType || '-' }}</DescriptionsItem>
        <DescriptionsItem label="发送状态">
          <Badge :status="getStatusBadge(currentRecord.sendStatus)" />
          {{ getStatusText(currentRecord.sendStatus) }}
        </DescriptionsItem>
        <DescriptionsItem label="发送时间">{{ currentRecord.sendTime || '-' }}</DescriptionsItem>
        <DescriptionsItem label="重试次数">{{ currentRecord.retryCount || 0 }} 次</DescriptionsItem>
        <DescriptionsItem label="失败原因">{{ currentRecord.failReason || '-' }}</DescriptionsItem>
        <DescriptionsItem label="内容">
          <div style="max-height: 200px; overflow-y: auto; white-space: pre-wrap;" v-html="currentRecord.content"></div>
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentRecord.createdAt }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Card, Form, FormItem, Select, SelectOption, Input, RangePicker, Button, Space,
  Table, Tag, Badge, Modal, Descriptions, DescriptionsItem, message
} from 'ant-design-vue';
import { getRecordList, retryRecord } from '@/api/sys/notify';
import dayjs from 'dayjs';

const loading = ref(false);
const detailVisible = ref(false);
const currentRecord = ref<any>(null);
const retryingId = ref('');

const queryParams = reactive({
  notifyType: undefined as string | undefined,
  sceneCode: undefined as string | undefined,
  sendStatus: undefined as number | undefined,
  receiver: '',
  dateRange: undefined as any,
  startTime: '',
  endTime: '',
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const columns = [
  { title: '通知ID', dataIndex: 'notifyId', key: 'notifyId', width: 120, ellipsis: true },
  { title: '类型', key: 'notifyType', width: 80 },
  { title: '场景', dataIndex: 'sceneCode', key: 'sceneCode', width: 120 },
  { title: '接收人', dataIndex: 'receiver', key: 'receiver', width: 150, ellipsis: true },
  { title: '接收人编号', dataIndex: 'receiverNo', key: 'receiverNo', width: 120 },
  { title: '状态', key: 'sendStatus', width: 100 },
  { title: '发送时间', dataIndex: 'sendTime', key: 'sendTime', width: 160 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
];

const dataSource = ref<any[]>([]);

const getTypeColor = (type: string) => {
  const map: Record<string, string> = { email: 'blue', sms: 'green', dingtalk: 'orange', wecom: 'purple' };
  return map[type] || 'default';
};

const getTypeText = (type: string) => {
  const map: Record<string, string> = { email: '邮件', sms: '短信', dingtalk: '钉钉', wecom: '企业微信' };
  return map[type] || type;
};

const getStatusBadge = (status: number) => {
  const map: Record<number, string> = { 0: 'default', 1: 'processing', 2: 'success', 3: 'error' };
  return map[status] || 'default';
};

const getStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '待发送', 1: '发送中', 2: '成功', 3: '失败' };
  return map[status] || '-';
};

function handleDateChange() {
  if (queryParams.dateRange && queryParams.dateRange.length === 2) {
    queryParams.startTime = queryParams.dateRange[0]?.format('YYYY-MM-DD');
    queryParams.endTime = queryParams.dateRange[1]?.format('YYYY-MM-DD');
  } else {
    queryParams.startTime = '';
    queryParams.endTime = '';
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (queryParams.notifyType) params.notifyType = queryParams.notifyType;
    if (queryParams.sceneCode) params.sceneCode = queryParams.sceneCode;
    if (queryParams.sendStatus !== undefined) params.sendStatus = queryParams.sendStatus;
    if (queryParams.receiver) params.receiver = queryParams.receiver;
    if (queryParams.startTime) params.startTime = queryParams.startTime;
    if (queryParams.endTime) params.endTime = queryParams.endTime;

    const res = await getRecordList(params);
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
    console.error('获取发送记录失败', e);
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
  queryParams.notifyType = undefined;
  queryParams.sceneCode = undefined;
  queryParams.sendStatus = undefined;
  queryParams.receiver = '';
  queryParams.dateRange = undefined;
  queryParams.startTime = '';
  queryParams.endTime = '';
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function handleView(record: any) {
  currentRecord.value = record;
  detailVisible.value = true;
}

async function handleRetry(record: any) {
  retryingId.value = record.notifyId;
  try {
    const res = await retryRecord(record.notifyId);
    if (res?.code === 0) {
      message.success('重发成功');
      fetchData();
    } else {
      message.error(res?.message || '重发失败');
    }
  } catch (e) {
    message.error('重发失败');
  } finally {
    retryingId.value = '';
  }
}

onMounted(() => fetchData());
</script>

<style scoped>
.send-records { padding: 0; }
.search-card { margin-bottom: 16px; }
.table-card { margin-bottom: 16px; }
</style>
