<template>
  <div class="api-debugger">
    <Alert 
      message="在线调试模式" 
      description="在此填写参数并发送请求，实时查看接口响应"
      type="info" 
      show-icon 
      class="debugger-alert"
    />

    <!-- 认证配置 -->
    <Card title="认证配置" size="small" class="auth-card">
      <Form layout="vertical" :model="authForm">
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="认证方式">
              <Select v-model:value="authForm.type">
                <SelectOption value="none">无需认证</SelectOption>
                <SelectOption value="apiKey">API Key</SelectOption>
                <SelectOption value="signature">签名认证</SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="12" v-if="authForm.type !== 'none'">
            <FormItem label="API Key">
              <Input v-model:value="authForm.apiKey" placeholder="请输入 API Key" />
            </FormItem>
          </Col>
        </Row>
        <Row :gutter="16" v-if="authForm.type === 'signature'">
          <Col :span="12">
            <FormItem label="App Secret">
              <Input v-model:value="authForm.appSecret" placeholder="请输入 App Secret" />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="商户号">
              <Input v-model:value="authForm.mchNo" placeholder="请输入商户号" />
            </FormItem>
          </Col>
        </Row>
      </Form>
    </Card>

    <!-- 请求配置 -->
    <Card title="请求配置" size="small" class="request-card">
      <Form layout="vertical" :model="requestForm">
        <Row :gutter="16">
          <Col :span="4">
            <FormItem label="请求方法">
              <Select v-model:value="requestForm.method">
                <SelectOption value="GET">GET</SelectOption>
                <SelectOption value="POST">POST</SelectOption>
                <SelectOption value="PUT">PUT</SelectOption>
                <SelectOption value="DELETE">DELETE</SelectOption>
              </Select>
            </FormItem>
          </Col>
          <Col :span="20">
            <FormItem label="请求路径">
              <Input v-model:value="requestForm.path" placeholder="/pay/gateway" />
            </FormItem>
          </Col>
        </Row>

        <!-- Query 参数 -->
        <div v-if="queryParams.length > 0" class="params-section">
          <h4>Query 参数</h4>
          <Form layout="vertical">
            <Row :gutter="12" v-for="(param, index) in queryParams" :key="'query-' + index">
              <Col :span="6">
                <Input v-model:value="param.name" placeholder="参数名" disabled />
              </Col>
              <Col :span="12">
                <Input v-model:value="param.value" placeholder="参数值" />
              </Col>
              <Col :span="4">
                <Tag :color="param.required ? 'red' : 'default'">{{ param.required ? '必填' : '选填' }}</Tag>
              </Col>
            </Row>
          </Form>
        </div>

        <!-- Path 参数 -->
        <div v-if="pathParams.length > 0" class="params-section">
          <h4>Path 参数</h4>
          <Form layout="vertical">
            <Row :gutter="12" v-for="(param, index) in pathParams" :key="'path-' + index">
              <Col :span="6">
                <Input :value="'路径中的 ' + param.name" disabled />
              </Col>
              <Col :span="12">
                <Input v-model:value="param.value" placeholder="请填写路径参数" />
              </Col>
              <Col :span="4">
                <Tag color="red">必填</Tag>
              </Col>
            </Row>
          </Form>
        </div>

        <!-- Body 参数 -->
        <div v-if="endpoint.requestBody" class="params-section">
          <h4>请求 Body <Tag>JSON</Tag></h4>
          <Input.TextArea 
            v-model:value="requestForm.body" 
            :rows="10" 
            placeholder="请输入 JSON 格式的请求体"
            class="body-textarea"
          />
          <Space class="body-actions">
            <Button @click="formatBody">格式化</Button>
            <Button @click="loadBodyExample">加载示例</Button>
            <Button @click="clearBody">清空</Button>
          </Space>
        </div>
      </Form>
    </Card>

    <!-- 发送请求 -->
    <div class="debugger-actions">
      <Button type="primary" size="large" :loading="loading" @click="sendRequest">
        <template #icon><SendOutlined /></template>
        发送请求
      </Button>
      <Button size="large" @click="resetRequest">
        <template #icon><ReloadOutlined /></template>
        重置
      </Button>
    </div>

    <!-- 响应结果 -->
    <Card title="响应结果" size="small" class="response-card">
      <template #extra>
        <Space>
          <Tag v-if="responseTime" :color="responseTime < 500 ? 'green' : responseTime < 1000 ? 'orange' : 'red'">
            {{ responseTime }}ms
          </Tag>
          <Tag v-if="responseStatus" :color="responseStatus < 400 ? 'green' : 'red'">
            HTTP {{ responseStatus }}
          </Tag>
          <Button size="small" @click="copyResponse" :disabled="!responseData">
            <template #icon><CopyOutlined /></template>
            复制
          </Button>
        </Space>
      </template>

      <Tabs v-model:activeKey="responseTab">
        <TabPane key="body" tab="响应体">
          <div class="response-body" v-if="responseData">
            <pre><code :class="{ 'json-success': responseSuccess, 'json-error': !responseSuccess }">{{ JSON.stringify(responseData, null, 2) }}</code></pre>
          </div>
          <div class="response-empty" v-else>
            <InboxOutlined class="empty-icon" />
            <p>暂无响应数据</p>
          </div>
        </TabPane>
        <TabPane key="headers" tab="响应头">
          <Table 
            v-if="responseHeaders" 
            :columns="headerColumns" 
            :dataSource="responseHeadersData"
            :pagination="false"
            size="small"
          />
          <div v-else class="response-empty">
            <InboxOutlined class="empty-icon" />
            <p>暂无响应头</p>
          </div>
        </TabPane>
        <TabPane key="curl" tab="cURL">
          <div class="curl-block" v-if="curlCommand">
            <div class="code-header">
              <span>Bash</span>
              <Button size="small" type="text" @click="copyCurl">
                <template #icon><CopyOutlined /></template>
              </Button>
            </div>
            <pre><code>{{ curlCommand }}</code></pre>
          </div>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 历史记录 -->
    <Card title="请求历史" size="small" class="history-card">
      <template #extra>
        <Button size="small" type="link" @click="clearHistory" v-if="history.length > 0">清空</Button>
      </template>
      <List 
        v-if="history.length > 0"
        :dataSource="history"
        size="small"
        class="history-list"
      >
        <template #renderItem="{ item, index }">
          <ListItem class="history-item">
            <ListItemMeta>
              <template #title>
                <Space>
                  <Tag :color="methodColorMap[item.method]">{{ item.method }}</Tag>
                  <span class="history-path">{{ item.path }}</span>
                  <Tag :color="item.success ? 'green' : 'red'" size="small">
                    {{ item.success ? '成功' : '失败' }}
                  </Tag>
                </Space>
              </template>
              <template #description>
                <Space>
                  <span>{{ item.time }}</span>
                  <span v-if="item.duration">{{ item.duration }}ms</span>
                </Space>
              </template>
            </ListItemMeta>
            <template #actions>
              <Button type="link" size="small" @click="loadFromHistory(item)">重新加载</Button>
            </template>
          </ListItem>
        </template>
      </List>
      <div v-else class="history-empty">
        <HistoryOutlined class="empty-icon" />
        <p>暂无请求历史</p>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { Card, Form, FormItem, Input, Select, SelectOption, Row, Col, Button, Space, Tag, Alert, Tabs, TabPane, Table, List, ListItem, ListItemMeta, message } from 'ant-design-vue';
import { SendOutlined, ReloadOutlined, CopyOutlined, InboxOutlined, HistoryOutlined } from '@ant-design/icons-vue';
import type { ApiEndpoint, ApiParameter } from '@/api/open-platform/docs';

interface Props {
  endpoint: ApiEndpoint;
  baseUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  baseUrl: '/api/v1',
});

interface HistoryItem {
  id: string;
  method: string;
  path: string;
  body: string;
  auth: { type: string; apiKey?: string; appSecret?: string; mchNo?: string };
  success: boolean;
  time: string;
  duration?: number;
  response?: any;
}

const authForm = reactive({
  type: 'signature' as 'none' | 'apiKey' | 'signature',
  apiKey: '',
  appSecret: '',
  mchNo: '',
});

const requestForm = reactive({
  method: props.endpoint.method,
  path: props.endpoint.path,
  body: '',
});

const queryParams = ref<Array<{ name: string; value: string; required: boolean }>>([]);
const pathParams = ref<Array<{ name: string; value: string; required: boolean }>>([]);

const loading = ref(false);
const responseData = ref<any>(null);
const responseHeaders = ref<any>(null);
const responseHeadersData = ref<any[]>([]);
const responseStatus = ref<number | null>(null);
const responseTime = ref<number | null>(null);
const responseSuccess = ref(true);
const responseTab = ref('body');
const history = ref<HistoryItem[]>([]);

const headerColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '值', dataIndex: 'value', key: 'value' },
];

const methodColorMap: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
};

watch(() => props.endpoint, () => {
  requestForm.method = props.endpoint.method;
  requestForm.path = props.endpoint.path;
  parseParams();
  if (props.endpoint.requestBody?.example) {
    requestForm.body = JSON.stringify(props.endpoint.requestBody.example, null, 2);
  } else {
    requestForm.body = '';
  }
}, { immediate: true });

onMounted(() => {
  const savedHistory = localStorage.getItem('api-debugger-history');
  if (savedHistory) {
    try {
      history.value = JSON.parse(savedHistory);
    } catch (e) {
      console.error('Failed to parse history', e);
    }
  }
  parseParams();
  if (props.endpoint.requestBody?.example) {
    requestForm.body = JSON.stringify(props.endpoint.requestBody.example, null, 2);
  }
});

function parseParams() {
  queryParams.value = props.endpoint.parameters
    .filter(p => p.in === 'query')
    .map(p => ({ name: p.name, value: p.defaultValue || '', required: p.required }));

  pathParams.value = props.endpoint.parameters
    .filter(p => p.in === 'path')
    .map(p => ({ name: p.name, value: '', required: true }));
}

function formatBody() {
  try {
    const parsed = JSON.parse(requestForm.body);
    requestForm.body = JSON.stringify(parsed, null, 2);
    message.success('格式化成功');
  } catch (e) {
    message.error('JSON 格式错误');
  }
}

function loadBodyExample() {
  if (props.endpoint.requestBody?.example) {
    requestForm.body = JSON.stringify(props.endpoint.requestBody.example, null, 2);
    message.success('已加载示例');
  }
}

function clearBody() {
  requestForm.body = '';
}

function buildRequestUrl(): string {
  let path = props.baseUrl + requestForm.path;
  
  for (const param of pathParams.value) {
    path = path.replace(`{${param.name}}`, param.value || `:${param.name}`);
  }
  
  const queryParts: string[] = [];
  for (const param of queryParams.value) {
    if (param.value) {
      queryParts.push(`${param.name}=${encodeURIComponent(param.value)}`);
    }
  }
  
  if (queryParts.length > 0) {
    path += '?' + queryParts.join('&');
  }
  
  return path;
}

function buildCurl(): string {
  const url = buildRequestUrl();
  let curl = `curl -X ${requestForm.method} '${url}'`;
  
  if (authForm.type === 'apiKey' && authForm.apiKey) {
    curl += ` \\\n  -H 'X-API-Key: ${authForm.apiKey}'`;
  } else if (authForm.type === 'signature') {
    curl += ` \\\n  -H 'Content-Type: application/json'`;
  }
  
  if (['POST', 'PUT'].includes(requestForm.method) && requestForm.body) {
    curl += ` \\\n  -d '${requestForm.body}'`;
  }
  
  return curl;
}

const curlCommand = computed(() => buildCurl());

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (authForm.type === 'apiKey' && authForm.apiKey) {
    headers['X-API-Key'] = authForm.apiKey;
  } else if (authForm.type === 'signature' && authForm.apiKey) {
    headers['X-API-Key'] = authForm.apiKey;
    headers['X-MchNo'] = authForm.mchNo || '';
  }
  
  return headers;
}

async function sendRequest() {
  if (authForm.type !== 'none' && !authForm.apiKey) {
    message.error('请填写认证信息');
    return;
  }
  
  if (pathParams.value.some(p => !p.value)) {
    message.error('请填写路径参数');
    return;
  }
  
  if (['POST', 'PUT'].includes(requestForm.method) && !requestForm.body && props.endpoint.requestBody) {
    message.error('请填写请求体');
    return;
  }
  
  loading.value = true;
  const startTime = Date.now();
  
  try {
    let body = undefined;
    if (['POST', 'PUT'].includes(requestForm.method) && requestForm.body) {
      try {
        body = JSON.parse(requestForm.body);
      } catch (e) {
        message.error('请求体 JSON 格式错误');
        loading.value = false;
        return;
      }
    }
    
    // 构建 URL
    const url = buildRequestUrl();
    
    // 模拟请求
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    
    // 模拟响应
    const isSuccess = Math.random() > 0.2;
    
    if (isSuccess) {
      if (props.endpoint.responseBody?.example) {
        responseData.value = { code: 0, message: 'success', data: props.endpoint.responseBody.example };
      } else {
        responseData.value = {
          code: 0,
          message: 'success',
          data: {
            orderNo: 'OP' + Date.now().toString(36).toUpperCase(),
            status: 'pending',
            timestamp: new Date().toISOString(),
          },
        };
      }
      responseSuccess.value = true;
      responseStatus.value = 200;
    } else {
      responseData.value = {
        code: 400,
        message: '请求失败，请检查参数',
        data: null,
      };
      responseSuccess.value = false;
      responseStatus.value = 400;
    }
    
    responseHeaders.value = {
      'Content-Type': 'application/json',
      'X-Request-Id': 'req_' + Date.now(),
      'X-Rate-Limit': '1000',
      'X-Rate-Remaining': '999',
    };
    
    responseHeadersData.value = Object.entries(responseHeaders.value).map(([name, value]) => ({
      name,
      value: String(value),
    }));
    
    responseTime.value = Date.now() - startTime;
    
    // 保存历史
    const historyItem: HistoryItem = {
      id: 'h_' + Date.now(),
      method: requestForm.method,
      path: requestForm.path,
      body: requestForm.body,
      auth: { type: authForm.type, apiKey: authForm.apiKey, appSecret: authForm.appSecret, mchNo: authForm.mchNo },
      success: responseSuccess.value,
      time: new Date().toLocaleString(),
      duration: responseTime.value,
      response: responseData.value,
    };
    
    history.value.unshift(historyItem);
    if (history.value.length > 20) {
      history.value = history.value.slice(0, 20);
    }
    
    localStorage.setItem('api-debugger-history', JSON.stringify(history.value));
    
  } catch (error: any) {
    responseData.value = {
      code: 500,
      message: error.message || '请求异常',
      data: null,
    };
    responseSuccess.value = false;
    responseStatus.value = 500;
    responseTime.value = Date.now() - startTime;
  } finally {
    loading.value = false;
  }
}

function resetRequest() {
  authForm.apiKey = '';
  authForm.appSecret = '';
  authForm.mchNo = '';
  requestForm.method = props.endpoint.method;
  requestForm.path = props.endpoint.path;
  requestForm.body = '';
  queryParams.value.forEach(p => (p.value = ''));
  pathParams.value.forEach(p => (p.value = ''));
  responseData.value = null;
  responseHeaders.value = null;
  responseHeadersData.value = [];
  responseStatus.value = null;
  responseTime.value = null;
  responseSuccess.value = true;
}

function loadFromHistory(item: HistoryItem) {
  authForm.type = item.auth.type;
  authForm.apiKey = item.auth.apiKey || '';
  authForm.appSecret = item.auth.appSecret || '';
  authForm.mchNo = item.auth.mchNo || '';
  requestForm.method = item.method;
  requestForm.path = item.path;
  requestForm.body = item.body;
  
  parseParams();
  
  if (item.response) {
    responseData.value = item.response;
    responseSuccess.value = item.success;
  }
}

function clearHistory() {
  history.value = [];
  localStorage.removeItem('api-debugger-history');
  message.success('历史已清空');
}

function copyResponse() {
  if (responseData.value) {
    navigator.clipboard.writeText(JSON.stringify(responseData.value, null, 2));
    message.success('已复制到剪贴板');
  }
}

function copyCurl() {
  navigator.clipboard.writeText(curlCommand.value);
  message.success('已复制到剪贴板');
}
</script>

<style scoped>
.api-debugger {
  margin-top: 16px;
}

.debugger-alert {
  margin-bottom: 16px;
}

.auth-card,
.request-card {
  margin-bottom: 16px;
}

.params-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #d9d9d9;
}

.params-section h4 {
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.body-textarea {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.body-actions {
  margin-top: 8px;
}

.debugger-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.response-card {
  margin-bottom: 16px;
}

.response-body {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
  max-height: 400px;
  overflow: auto;
}

.response-body pre {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

.json-success {
  color: #4ec9b0;
}

.json-error {
  color: #f14c4c;
}

.response-empty,
.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.curl-block {
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}

.curl-block pre {
  margin: 0;
  padding: 16px;
  color: #d4d4d4;
  font-size: 13px;
  overflow-x: auto;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #2d2d2d;
  color: #888;
  font-size: 12px;
}

.history-card {
  margin-bottom: 16px;
}

.history-list :deep(.ant-list-item) {
  padding: 8px 0;
}

.history-path {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.history-empty {
  padding: 24px;
}
</style>
