<template>
  <div class="sys-log">
    <Card>
      <!-- 搜索区域 -->
      <Form layout="inline" class="search-form">
        <FormItem label="操作人">
          <Input v-model:value="searchForm.username" placeholder="请输入操作人" allow-clear style="width: 120px" />
        </FormItem>
        <FormItem label="操作类型">
          <Select v-model:value="searchForm.operationType" placeholder="请选择" allow-clear style="width: 120px">
            <SelectOption value="登录">登录</SelectOption>
            <SelectOption value="操作">操作</SelectOption>
            <SelectOption value="创建">创建</SelectOption>
            <SelectOption value="更新">更新</SelectOption>
            <SelectOption value="删除">删除</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="操作时间">
          <RangePicker 
            v-model:value="searchForm.dateRange" 
            :placeholder="['开始时间', '结束时间']"
            format="YYYY-MM-DD"
            style="width: 240px"
          />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.status" placeholder="请选择" allow-clear style="width: 100px">
            <SelectOption :value="1">成功</SelectOption>
            <SelectOption :value="0">失败</SelectOption>
          </Select>
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="resetSearch">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <!-- 工具栏 -->
      <div class="table-toolbar">
        <Space>
          <Button @click="handleExport" :loading="exportLoading">
            <template #icon><DownloadOutlined /></template>
            导出日志
          </Button>
          <Button danger @click="handleClean" :loading="cleanLoading">
            <template #icon><DeleteOutlined /></template>
            清理日志
          </Button>
        </Space>
      </div>

      <!-- 表格 -->
      <Table 
        :data-source="dataSource" 
        :columns="columns" 
        :loading="loading" 
        :pagination="pagination"
        @change="handleTableChange" 
        row-key="id" 
        bordered
        :scroll="{ x: 1400, y: 500 }"
        :size="'middle'"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operationType'">
            <Tag :color="getTypeColor(record.operation)">
              {{ record.operation }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="record.status === 1 ? 'success' : 'error'" />
            <span>{{ record.status === 1 ? '成功' : '失败' }}</span>
          </template>
          <template v-else-if="column.key === 'ip'">
            <Tooltip :title="`${record.ip}${record.location ? ' - ' + record.location : ''}`">
              <span>{{ record.ip }}</span>
            </Tooltip>
          </template>
          <template v-else-if="column.key === 'duration'">
            <span :style="{ color: record.duration > 1000 ? '#ff4d4f' : record.duration > 500 ? '#faad14' : '#52c41a' }">
              {{ record.duration }}ms
            </span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="日志详情"
      width="700px"
      :footer="null"
    >
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="操作人" :span="1">{{ currentRecord.username || '-' }}</DescriptionsItem>
        <DescriptionsItem label="操作类型" :span="1">
          <Tag :color="getTypeColor(currentRecord.operation)">{{ currentRecord.operation }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="请求方法" :span="1">{{ currentRecord.method || '-' }}</DescriptionsItem>
        <DescriptionsItem label="请求URL" :span="1">
          <Text>{{ currentRecord.url || '-' }}</Text>
        </DescriptionsItem>
        <DescriptionsItem label="IP地址" :span="1">{{ currentRecord.ip || '-' }}</DescriptionsItem>
        <DescriptionsItem label="地理位置" :span="1">{{ currentRecord.location || '-' }}</DescriptionsItem>
        <DescriptionsItem label="执行状态" :span="1">
          <Badge :status="currentRecord.status === 1 ? 'success' : 'error'" :text="currentRecord.status === 1 ? '成功' : '失败'" />
        </DescriptionsItem>
        <DescriptionsItem label="执行时长" :span="1">
          <span :style="{ color: currentRecord.duration > 1000 ? '#ff4d4f' : currentRecord.duration > 500 ? '#faad14' : '#52c41a' }">
            {{ currentRecord.duration }}ms
          </span>
        </DescriptionsItem>
        <DescriptionsItem label="操作时间" :span="2">{{ currentRecord.createTime || '-' }}</DescriptionsItem>
        <DescriptionsItem label="请求参数" :span="2">
          <pre class="json-content">{{ formatJson(currentRecord.params) }}</pre>
        </DescriptionsItem>
        <DescriptionsItem label="返回结果" :span="2">
          <pre class="json-content" :style="{ color: currentRecord.status === 0 ? '#ff4d4f' : 'inherit' }">
            {{ formatJson(currentRecord.result || currentRecord.errorMsg) }}
          </pre>
        </DescriptionsItem>
      </Descriptions>
    </Modal>

    <!-- 清理确认弹窗 -->
    <Modal
      v-model:open="cleanVisible"
      title="清理日志"
      @ok="confirmClean"
      :confirm-loading="cleanConfirmLoading"
    >
      <Form :model="cleanForm" layout="vertical">
        <FormItem label="清理方式">
          <RadioGroup v-model:value="cleanForm.type">
            <Radio value="days">清理多少天前的日志</Radio>
            <Radio value="size">保留多少条记录</Radio>
            <Radio value="all">清理所有日志</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem v-if="cleanForm.type === 'days'" label="保留天数">
          <InputNumber v-model:value="cleanForm.days" :min="1" :max="365" style="width: 200px" />
          <span style="margin-left: 8px">天</span>
        </FormItem>
        <FormItem v-if="cleanForm.type === 'size'" label="保留条数">
          <InputNumber v-model:value="cleanForm.keepCount" :min="100" :max="100000" :step="100" style="width: 200px" />
          <span style="margin-left: 8px">条</span>
        </FormItem>
        <Alert v-if="cleanForm.type === 'all'" type="warning" show-icon>
          <template #message>警告</template>
          <template #description>清理所有日志将删除全部操作记录，此操作不可恢复！</template>
        </Alert>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, Dayjs } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Badge, Tag, Modal, Tooltip, Typography, Descriptions, DescriptionsItem, RangePicker, Alert, InputNumber, message } from 'ant-design-vue';
const { Text } = Typography;
import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { defHttp } from '@/utils/http/axios';
import dayjs, { Dayjs as DayjsType } from 'dayjs';

interface LogRecord {
  id: string;
  userId: string;
  username: string;
  operation: string;
  method: string;
  url: string;
  ip: string;
  location: string;
  params: string;
  result: string;
  status: number;
  errorMsg: string;
  duration: number;
  createTime: string;
}

const loading = ref(false);
const exportLoading = ref(false);
const cleanLoading = ref(false);
const cleanConfirmLoading = ref(false);
const dataSource = ref<LogRecord[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });

const searchForm = reactive({
  username: '',
  operationType: undefined as string | undefined,
  dateRange: null as [DayjsType | null, DayjsType | null] | null,
  status: undefined as number | undefined,
});

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80, ellipsis: true },
  { title: '操作人', dataIndex: 'username', width: 100 },
  { title: '操作类型', key: 'operationType', width: 100 },
  { title: '操作内容', dataIndex: 'operation', width: 120, ellipsis: true },
  { title: '请求方法', dataIndex: 'method', width: 80 },
  { title: '请求URL', dataIndex: 'url', width: 200, ellipsis: true },
  { title: 'IP地址', key: 'ip', width: 130 },
  { title: '状态', key: 'status', width: 80 },
  { title: '耗时', key: 'duration', width: 80 },
  { title: '操作时间', dataIndex: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
];

const detailVisible = ref(false);
const cleanVisible = ref(false);
const currentRecord = ref<LogRecord | null>(null);

const cleanForm = reactive({
  type: 'days' as 'days' | 'size' | 'all',
  days: 30,
  keepCount: 10000,
});

function getTypeColor(operation: string): string {
  const map: Record<string, string> = {
    '登录': 'blue',
    '登出': 'cyan',
    '创建': 'green',
    '更新': 'orange',
    '删除': 'red',
    '查询': 'purple',
    '操作': 'geekblue',
  };
  return map[operation] || 'default';
}

function formatJson(str: string | undefined): string {
  if (!str) return '-';
  try {
    const obj = typeof str === 'string' ? JSON.parse(str) : str;
    return JSON.stringify(obj, null, 2);
  } catch {
    return str;
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = { page: pagination.current, pageSize: pagination.pageSize };
    if (searchForm.username) params.username = searchForm.username;
    if (searchForm.operationType) params.operation = searchForm.operationType;
    if (searchForm.status !== undefined) params.status = searchForm.status;
    if (searchForm.dateRange && searchForm.dateRange[0] && searchForm.dateRange[1]) {
      params.startTime = searchForm.dateRange[0].format('YYYY-MM-DD');
      params.endTime = searchForm.dateRange[1].format('YYYY-MM-DD');
    }

    const res = await defHttp.get({ url: '/basic-api/sys/log/list', params });
    if (res && res.data) {
      dataSource.value = res.data.list || [];
      pagination.total = res.data.total || 0;
    } else if (res && res.list) {
      dataSource.value = res.list || [];
      pagination.total = res.total || 0;
    } else {
      dataSource.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    console.error('获取日志列表失败:', error);
    dataSource.value = [];
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function resetSearch() {
  searchForm.username = '';
  searchForm.operationType = undefined;
  searchForm.dateRange = null;
  searchForm.status = undefined;
  handleSearch();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}

function openDetailModal(record: LogRecord) {
  currentRecord.value = record;
  detailVisible.value = true;
}

function handleExport() {
  message.info('导出功能开发中');
}

function handleClean() {
  cleanVisible.value = true;
}

async function confirmClean() {
  cleanConfirmLoading.value = true;
  try {
    let params: any = { type: cleanForm.type };
    if (cleanForm.type === 'days') params.days = cleanForm.days;
    if (cleanForm.type === 'size') params.keepCount = cleanForm.keepCount;
    
    await defHttp.post({ url: '/basic-api/sys/log/clean', data: params });
    message.success('清理成功');
    cleanVisible.value = false;
    fetchData();
  } catch (error) {
    message.error('清理失败');
  } finally {
    cleanConfirmLoading.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.sys-log {
  padding: 16px;
  background: #f0f2f5;
}

.search-form {
  margin-bottom: 16px;
}

.table-toolbar {
  margin-bottom: 16px;
}

.json-content {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}
</style>
