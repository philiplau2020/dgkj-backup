<template>
  <div class="open-platform-docs">
    <Row :gutter="16">
      <!-- 左侧导航 -->
      <Col :span="5">
        <Card class="doc-nav-card" :bodyStyle="{ padding: '0' }">
          <template #title>
            <Space>
              <ApiOutlined />
              <span>API 文档</span>
            </Space>
          </template>
          <Menu v-model:selectedKeys="selectedKeys" mode="inline" class="doc-nav-menu">
            <template v-for="group in docGroups" :key="group.key">
              <MenuItemGroup :title="group.title">
                <template v-for="doc in group.children" :key="doc.id">
                  <MenuItem :value="doc.id" @click="selectDoc(doc.id)">
                    <Space>
                      <Tag v-if="doc.badge" :color="doc.badgeColor">{{ doc.badge }}</Tag>
                      <span>{{ doc.title }}</span>
                    </Space>
                  </MenuItem>
                </template>
              </MenuItemGroup>
            </template>
          </Menu>
        </Card>
      </Col>

      <!-- 右侧内容 -->
      <Col :span="19">
        <!-- 文档内容 -->
        <div v-if="currentDoc">
          <!-- 文档头部 -->
          <Card class="doc-header-card">
            <Row :gutter="16" align="middle">
              <Col :span="16">
                <h2 class="doc-title">{{ currentDoc.name }}</h2>
                <p class="doc-desc">{{ currentDoc.description }}</p>
                <Space class="doc-meta">
                  <Tag v-if="currentDoc.version">v{{ currentDoc.version }}</Tag>
                  <Tag :color="authColorMap[currentDoc.authType]">{{ authNameMap[currentDoc.authType] }}</Tag>
                  <span class="doc-endpoint-count">{{ currentDoc.endpoints.length }} 个接口</span>
                </Space>
              </Col>
              <Col :span="8" class="doc-header-right">
                <Space>
                  <Button @click="toggleDebugMode">
                    <template #icon><ThunderboltOutlined /></template>
                    {{ debugMode ? '查看文档' : '在线调试' }}
                  </Button>
                  <Button @click="handleSdkDownload">
                    <template #icon><DownloadOutlined /></template>
                    下载SDK
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <!-- 接口列表 -->
          <Card class="endpoint-list-card">
            <template #title>
              <Space>
                <BookOutlined />
                <span>接口列表</span>
              </Space>
            </template>

            <Collapse v-model:activeKey="activeEndpoints" :bordered="false" class="endpoint-collapse">
              <CollapsePanel 
                v-for="endpoint in currentDoc.endpoints" 
                :key="endpoint.id"
                :header="null"
              >
                <template #header>
                  <div class="endpoint-header" @click.stop="toggleEndpoint(endpoint.id)">
                    <Space>
                      <Tag :color="methodColorMap[endpoint.method]">{{ endpoint.method }}</Tag>
                      <span class="endpoint-path" :class="{ deprecated: endpoint.deprecated }">{{ endpoint.path }}</span>
                      <Tag v-if="endpoint.deprecated" color="orange">已废弃</Tag>
                      <Tag v-if="endpoint.auth" color="blue">需认证</Tag>
                    </Space>
                    <span class="endpoint-name">{{ endpoint.name }}</span>
                  </div>
                </template>

                <div class="endpoint-content">
                  <!-- 接口描述 -->
                  <Alert :message="endpoint.description" type="info" show-icon class="endpoint-desc" />

                  <!-- 调试模式 -->
                  <template v-if="debugMode">
                    <ApiDebugger :endpoint="endpoint" :base-url="currentDoc.baseUrl" />
                  </template>

                  <!-- 文档模式 -->
                  <template v-else>
                    <Tabs>
                      <TabPane key="params" tab="请求参数">
                        <ParamsTable :parameters="endpoint.parameters" :request-body="endpoint.requestBody" />
                      </TabPane>
                      <TabPane key="response" tab="响应示例">
                        <ResponseTable :response="endpoint.responseBody" />
                      </TabPane>
                      <TabPane key="example" tab="完整示例">
                        <CodeExample :examples="endpoint.examples" />
                      </TabPane>
                    </Tabs>
                  </template>
                </div>
              </CollapsePanel>
            </Collapse>
          </Card>
        </div>

        <!-- 默认页面 -->
        <Card v-else class="doc-empty-card">
          <div class="doc-empty">
            <ApiOutlined class="doc-empty-icon" />
            <h3>欢迎使用 DGKJ 开放平台 API</h3>
            <p>请从左侧选择要查看的 API 文档</p>
            <Button type="primary" @click="selectDoc('payment')">开始查看支付接口</Button>
          </div>
        </Card>
      </Col>
    </Row>

    <!-- SDK下载弹窗 -->
    <Modal v-model:open="sdkModalVisible" title="下载SDK" :footer="null" width="600px">
      <div class="sdk-list">
        <div v-for="sdk in sdkList" :key="sdk.language" class="sdk-item">
          <div class="sdk-info">
            <h4>{{ sdk.language }}</h4>
            <p>{{ sdk.description }}</p>
            <Tag>版本 {{ sdk.version }}</Tag>
          </div>
          <Space>
            <Button size="small" @click="handleDownloadSdk(sdk.language)">
              <template #icon><DownloadOutlined /></template>
              下载
            </Button>
            <Button size="small" type="link" @click="handleViewSdkDocs(sdk.language)">
              查看文档
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, markRaw } from 'vue';
import { Row, Col, Card, Menu, MenuItemGroup, MenuItem, Space, Tag, Button, Collapse, CollapsePanel, Alert, Tabs, TabPane, Modal } from 'ant-design-vue';
import { ApiOutlined, BookOutlined, ThunderboltOutlined, DownloadOutlined } from '@ant-design/icons-vue';
import { apiDocs, sdkList as sdkListData, type ApiEndpoint, type ApiDoc } from '@/api/open-platform/docs';

// 子组件
import ParamsTable from './components/ParamsTable.vue';
import ResponseTable from './components/ResponseTable.vue';
import CodeExample from './components/CodeExample.vue';
import ApiDebugger from './components/ApiDebugger.vue';

const selectedKeys = ref<string[]>([]);
const activeEndpoints = ref<string[]>([]);
const debugMode = ref(false);
const sdkModalVisible = ref(false);

const authColorMap: Record<string, string> = {
  none: 'default',
  apiKey: 'green',
  jwt: 'blue',
  signature: 'purple',
};

const authNameMap: Record<string, string> = {
  none: '无需认证',
  apiKey: 'API Key',
  jwt: 'JWT Token',
  signature: '签名认证',
};

const methodColorMap: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'purple',
};

const docGroups = reactive([
  {
    key: 'getting-started',
    title: '快速开始',
    children: [
      { id: 'developer', title: '开发者接口', badge: '基础', badgeColor: 'cyan' },
    ],
  },
  {
    key: 'app',
    title: '应用管理',
    children: [
      { id: 'app', title: '应用管理' },
      { id: 'apikey', title: 'API Key管理' },
    ],
  },
  {
    key: 'trade',
    title: '交易接口',
    children: [
      { id: 'payment', title: '支付接口', badge: '核心', badgeColor: 'red' },
      { id: 'refund', title: '退款接口' },
      { id: 'transfer', title: '转账接口' },
    ],
  },
  {
    key: 'finance',
    title: '财务接口',
    children: [
      { id: 'account', title: '账户接口' },
    ],
  },
]);

const currentDoc = computed(() => {
  if (selectedKeys.value.length === 0) return null;
  return apiDocs.find(doc => doc.id === selectedKeys.value[0]) || null;
});

function selectDoc(id: string) {
  selectedKeys.value = [id];
  activeEndpoints.value = [];
  debugMode.value = false;
}

function toggleEndpoint(id: string) {
  const index = activeEndpoints.value.indexOf(id);
  if (index > -1) {
    activeEndpoints.value.splice(index, 1);
  } else {
    activeEndpoints.value = [id];
  }
}

function toggleDebugMode() {
  debugMode.value = !debugMode.value;
  if (debugMode.value && activeEndpoints.value.length === 0 && currentDoc.value) {
    activeEndpoints.value = [currentDoc.value.endpoints[0]?.id].filter(Boolean);
  }
}

function handleSdkDownload() {
  sdkModalVisible.value = true;
}

function handleDownloadSdk(language: string) {
  console.log('Download SDK for', language);
}

function handleViewSdkDocs(language: string) {
  console.log('View SDK docs for', language);
}
</script>

<style scoped>
.open-platform-docs {
  padding: 16px;
  background: #f0f2f5;
  min-height: calc(100vh - 100px);
}

.doc-nav-card {
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.doc-nav-menu {
  border-right: none;
}

.doc-header-card {
  margin-bottom: 16px;
}

.doc-title {
  margin: 0 0 8px;
  font-size: 20px;
}

.doc-desc {
  color: #666;
  margin-bottom: 12px;
}

.doc-meta {
  color: #999;
}

.doc-endpoint-count {
  font-size: 12px;
}

.doc-header-right {
  text-align: right;
}

.endpoint-list-card {
  margin-bottom: 16px;
}

.endpoint-collapse :deep(.ant-collapse-item) {
  border: 1px solid #f0f0f0;
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
}

.endpoint-collapse :deep(.ant-collapse-header) {
  padding: 12px 16px !important;
  background: #fafafa;
}

.endpoint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.endpoint-path {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #333;
}

.endpoint-path.deprecated {
  text-decoration: line-through;
  color: #999;
}

.endpoint-name {
  color: #666;
  font-size: 13px;
}

.endpoint-content {
  padding: 16px;
}

.endpoint-desc {
  margin-bottom: 16px;
}

.doc-empty-card :deep(.ant-card-body) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.doc-empty {
  text-align: center;
}

.doc-empty-icon {
  font-size: 64px;
  color: #ccc;
  margin-bottom: 16px;
}

.doc-empty h3 {
  margin-bottom: 8px;
  color: #333;
}

.doc-empty p {
  color: #999;
  margin-bottom: 24px;
}

.sdk-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sdk-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.sdk-info h4 {
  margin: 0 0 4px;
}

.sdk-info p {
  margin: 0 0 8px;
  color: #666;
  font-size: 12px;
}
</style>
