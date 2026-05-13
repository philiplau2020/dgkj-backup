<template>
  <div class="params-table">
    <Table 
      :columns="columns" 
      :data-source="paramsData" 
      :pagination="false"
      size="small"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'required'">
          <Tag :color="record.required ? 'red' : 'default'">
            {{ record.required ? '必填' : '选填' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'type'">
          <code class="param-type">{{ record.type }}</code>
        </template>
        <template v-else-if="column.key === 'enum'">
          <Tag v-for="e in record.enum" :key="e" size="small">{{ e }}</Tag>
        </template>
        <template v-else-if="column.key === 'defaultValue'">
          <code v-if="record.defaultValue" class="param-default">{{ record.defaultValue }}</code>
          <span v-else>-</span>
        </template>
      </template>
    </Table>

    <!-- 请求示例 -->
    <div v-if="requestBody" class="request-body-section">
      <h4>请求 Body</h4>
      <p v-if="requestBody.description" class="section-desc">{{ requestBody.description }}</p>
      <div class="code-block">
        <div class="code-header">
          <span class="code-lang">JSON</span>
          <Button size="small" type="text" @click="copyCode">
            <template #icon><CopyOutlined /></template>
          </Button>
        </div>
        <pre class="code-content"><code>{{ JSON.stringify(requestBody.example || buildExample(requestBody.schema), null, 2) }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Table, Tag, Button, message } from 'ant-design-vue';
import { CopyOutlined } from '@ant-design/icons-vue';
import type { ApiParameter, ApiRequestBody, ApiSchema } from '@/api/open-platform/docs';

interface Props {
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
}

const props = defineProps<Props>();

const columns = [
  { title: '参数名', dataIndex: 'name', key: 'name', width: 150 },
  { title: '位置', dataIndex: 'in', key: 'in', width: 80 },
  { title: '类型', key: 'type', width: 100 },
  { title: '必填', key: 'required', width: 60 },
  { title: '说明', dataIndex: 'description', key: 'description' },
  { title: '枚举值', key: 'enum' },
  { title: '默认值', key: 'defaultValue', width: 100 },
];

const paramsData = computed(() => {
  return props.parameters.map(p => ({
    ...p,
    in: p.in === 'header' ? 'Header' : p.in === 'path' ? 'Path' : 'Query',
  }));
});

function buildExample(schema: ApiSchema): Record<string, any> {
  const example: Record<string, any> = {};
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (prop.example !== undefined) {
      example[key] = prop.example;
    } else if (prop.type === 'string') {
      example[key] = prop.description + '示例';
    } else if (prop.type === 'number') {
      example[key] = 100;
    } else if (prop.type === 'boolean') {
      example[key] = true;
    } else if (prop.type === 'array') {
      example[key] = [];
    } else {
      example[key] = null;
    }
  }
  return example;
}

function copyCode() {
  if (!props.requestBody) return;
  const example = JSON.stringify(props.requestBody.example || buildExample(props.requestBody.schema), null, 2);
  navigator.clipboard.writeText(example);
  message.success('已复制到剪贴板');
}
</script>

<style scoped>
.params-table {
  margin-top: 16px;
}

.param-type {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.param-default {
  background: #e6f7ff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #1890ff;
}

.request-body-section {
  margin-top: 24px;
}

.request-body-section h4 {
  margin-bottom: 8px;
}

.section-desc {
  color: #666;
  margin-bottom: 12px;
}

.code-block {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
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
</style>
