<template>
  <div class="response-table">
    <Alert v-if="response?.description" :message="response.description" type="success" show-icon class="response-desc" />

    <!-- 响应示例 -->
    <div class="code-block">
      <div class="code-header">
        <span class="code-lang">JSON</span>
        <Space>
          <Button size="small" :type="tab === 'success' ? 'primary' : 'text'" @click="tab = 'success'">成功</Button>
          <Button size="small" :type="tab === 'error' ? 'primary' : 'text'" @click="tab = 'error'">失败</Button>
          <Button size="small" type="text" @click="copyCode">
            <template #icon><CopyOutlined /></template>
          </Button>
        </Space>
      </div>
      <pre class="code-content"><code>{{ displayedCode }}</code></pre>
    </div>

    <!-- 响应字段说明 -->
    <Table 
      v-if="response?.schema?.properties"
      :columns="columns" 
      :data-source="fieldData" 
      :pagination="false"
      size="small"
      bordered
      class="field-table"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <code class="field-type">{{ record.type }}</code>
        </template>
        <template v-else-if="column.key === 'description'">
          <span v-html="formatDescription(record.description)"></span>
        </template>
      </template>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Table, Alert, Button, Space, message } from 'ant-design-vue';
import { CopyOutlined } from '@ant-design/icons-vue';
import type { ApiResponseBody } from '@/api/open-platform/docs';

interface Props {
  response?: ApiResponseBody;
}

const props = defineProps<Props>();

const tab = ref<'success' | 'error'>('success');

const columns = [
  { title: '字段名', dataIndex: 'name', key: 'name', width: 150 },
  { title: '类型', key: 'type', width: 100 },
  { title: '说明', key: 'description' },
  { title: '示例', dataIndex: 'example', key: 'example', width: 120 },
];

const fieldData = computed(() => {
  if (!props.response?.schema?.properties) return [];
  return Object.entries(props.response.schema.properties).map(([name, prop]) => ({
    name,
    type: prop.type,
    description: prop.description || '',
    example: prop.example !== undefined ? JSON.stringify(prop.example) : '-',
  }));
});

const errorExample = {
  code: 400,
  message: '参数错误',
  data: null,
};

const displayedCode = computed(() => {
  const code = tab.value === 'success' 
    ? props.response?.example 
    : errorExample;
  return JSON.stringify(code, null, 2);
});

function formatDescription(desc: string): string {
  return desc;
}

function copyCode() {
  navigator.clipboard.writeText(displayedCode.value);
  message.success('已复制到剪贴板');
}
</script>

<style scoped>
.response-table {
  margin-top: 16px;
}

.response-desc {
  margin-bottom: 16px;
}

.code-block {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.code-lang {
  font-size: 12px;
  color: #666;
}

.code-content {
  margin: 0;
  padding: 16px;
  background: #1e1e1e;
  color: #d4d4d4;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 400px;
}

.field-table {
  margin-top: 16px;
}

.field-type {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
