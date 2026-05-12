<template>
  <div class="sys-log">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="操作人">
          <Input v-model:value="searchForm.operName" placeholder="请输入操作人" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="操作类型">
          <Select v-model:value="searchForm.action" placeholder="请选择操作类型" allow-clear style="width: 140px">
            <SelectOption value="CREATE">新增</SelectOption>
            <SelectOption value="UPDATE">修改</SelectOption>
            <SelectOption value="DELETE">删除</SelectOption>
            <SelectOption value="QUERY">查询</SelectOption>
            <SelectOption value="LOGIN">登录</SelectOption>
            <SelectOption value="LOGOUT">登出</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="操作模块">
          <Input v-model:value="searchForm.module" placeholder="请输入模块" allow-clear style="width: 140px" />
        </FormItem>
        <FormItem label="时间范围">
          <RangePicker v-model:value="dateRange" style="width: 240px" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch"><template #icon><SearchOutlined /></template>查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <div class="table-toolbar">
        <Space>
          <Button @click="handleExport">导出</Button>
          <Button @click="handleRefresh"><template #icon><ReloadOutlined /></template>刷新</Button>
        </Space>
      </div>

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
          <template v-if="column.key === 'action'">
            <Tag :color="getActionColor(record.action)">{{ getActionName(record.action) }}</Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Badge :status="record.status === 1 ? 'success' : 'error'" />
            <span style="margin-left: 6px">{{ record.status === 1 ? '成功' : '失败' }}</span>
          </template>
          <template v-else-if="column.key === 'duration'">{{ record.duration }}ms</template>
          <template v-else-if="column.key === 'actionCol'">
            <Space><Button type="link" size="small" @click="openDetailModal(record)">详情</Button></Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="detailVisible" title="日志详情" width="700px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentRecord">
        <DescriptionsItem label="操作人">{{ currentRecord.operName }}</DescriptionsItem>
        <DescriptionsItem label="操作类型">
          <Tag :color="getActionColor(currentRecord.action)">{{ getActionName(currentRecord.action) }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="操作模块">{{ currentRecord.module }}</DescriptionsItem>
        <DescriptionsItem label="执行方法">{{ currentRecord.method }}</DescriptionsItem>
        <DescriptionsItem label="请求地址" :span="2">{{ currentRecord.url }}</DescriptionsItem>
        <DescriptionsItem label="IP地址">{{ currentRecord.ip }}</DescriptionsItem>
        <DescriptionsItem label="操作地点">{{ currentRecord.location }}</DescriptionsItem>
        <DescriptionsItem label="执行状态">
          <Badge :status="currentRecord.status === 1 ? 'success' : 'error'" />
          <span style="margin-left: 6px">{{ currentRecord.status === 1 ? '成功' : '失败' }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="执行时长">{{ currentRecord.duration }}ms</DescriptionsItem>
        <DescriptionsItem label="请求参数" :span="2">
          <pre class="json-pre">{{ formatJson(currentRecord.params) }}</pre>
        </DescriptionsItem>
        <DescriptionsItem label="返回结果" :span="2" v-if="currentRecord.result">
          <pre class="json-pre">{{ formatJson(currentRecord.result) }}</pre>
        </DescriptionsItem>
        <DescriptionsItem label="错误信息" :span="2" v-if="currentRecord.errorMsg">
          <span style="color: #f5222d">{{ currentRecord.errorMsg }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="操作时间" :span="2">{{ currentRecord.createdAt }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space,
  Tag, Badge, Modal, Descriptions, DescriptionsItem, RangePicker,
} from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({
  current: 1, pageSize: 10, total: 0,
  showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条`,
});
const searchForm = reactive({ operName: '', action: '', module: '' });
const dateRange = ref<[any, any] | null>(null);

const columns = [
  { title: '操作人', dataIndex: 'operName', key: 'operName', width: 100 },
  { title: '操作类型', key: 'action', width: 90 },
  { title: '操作模块', dataIndex: 'module', key: 'module', width: 120 },
  { title: '执行方法', dataIndex: 'method', key: 'method', width: 180, ellipsis: true },
  { title: '请求地址', dataIndex: 'url', key: 'url', width: 200, ellipsis: true },
  { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130 },
  { title: '状态', key: 'status', width: 90 },
  { title: '耗时', key: 'duration', width: 90 },
  { title: '操作时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'actionCol', width: 80 },
];

const currentRecord = ref<any>(null);
const detailVisible = ref(false);

const actionMap: Record<string, string> = {
  CREATE: '新增', UPDATE: '修改', DELETE: '删除', QUERY: '查询', LOGIN: '登录', LOGOUT: '登出',
};

function getActionColor(action: string) {
  return { CREATE: 'green', UPDATE: 'blue', DELETE: 'red', QUERY: 'default', LOGIN: 'purple', LOGOUT: 'orange' }[action] || 'default';
}
function getActionName(action: string) { return actionMap[action] || action; }
function formatJson(str: string) {
  try { return JSON.stringify(JSON.parse(str), null, 2); }
  catch { return str; }
}

function generateMockData() {
  const data = [];
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'QUERY', 'LOGIN', 'LOGOUT'];
  const modules = ['商户管理', '代理商管理', '交易管理', '财务管理', '通道管理', '系统管理'];
  const methods = ['POST /api/merchant/create', 'GET /api/agent/list', 'PUT /api/trade/order', 'DELETE /api/channel/config', 'POST /api/sys/user', 'GET /api/finance/account'];
  const ips = ['192.168.1.100', '10.0.0.50', '172.16.0.25', '127.0.0.1'];
  const locations = ['广东省深圳市', '北京市海淀区', '上海市浦东新区', '本地'];
  for (let i = 1; i <= 80; i++) {
    const action = actions[i % 6];
    const status = Math.random() > 0.05 ? 1 : 0;
    data.push({
      id: i,
      operName: ['admin', 'operator', 'user_' + String(i % 10)][i % 3],
      action,
      module: modules[i % 6],
      method: methods[i % 6],
      url: '/api/' + ['merchant', 'agent', 'trade', 'finance', 'channel', 'sys'][i % 6] + '/' + ['list', 'create', 'update', 'delete'][i % 4],
      ip: ips[i % 4],
      location: locations[i % 4],
      status,
      duration: Math.floor(Math.random() * 500) + 10,
      params: JSON.stringify({ page: (i % 10) + 1, pageSize: 10 }),
      result: status === 1 ? JSON.stringify({ code: 0, msg: 'success' }) : null,
      errorMsg: status === 1 ? null : '数据库连接失败',
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString().replace('T', ' ').substring(0, 19),
    });
  }
  return data;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await fetch('/basic-api/sys/log/list?' + new URLSearchParams({ page: String(pagination.current), pageSize: String(pagination.pageSize) }));
    const json = await res.json();
    if (json.result) { dataSource.value = json.result.list || []; pagination.total = json.result.total || 0; }
    else { dataSource.value = generateMockData(); pagination.total = dataSource.value.length; }
  } catch { dataSource.value = generateMockData(); pagination.total = dataSource.value.length; }
  finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.operName = ''; searchForm.action = ''; searchForm.module = ''; dateRange.value = null; handleSearch(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openDetailModal(record: any) { currentRecord.value = record; detailVisible.value = true; }
function handleExport() { message.info('导出功能开发中'); }
function handleRefresh() { fetchData(); message.success('刷新成功'); }
onMounted(() => { fetchData(); });
</script>

<style scoped>
.sys-log { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
.json-pre {
  background: #f5f5f5; padding: 8px; border-radius: 4px;
  font-size: 12px; max-height: 200px; overflow: auto; margin: 0;
  white-space: pre-wrap; word-break: break-all;
}
</style>
