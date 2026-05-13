<template>
  <div class="code-example">
    <div v-if="examples && examples.length > 0">
      <Collapse v-model:activeKey="activeExample" :bordered="false">
        <CollapsePanel 
          v-for="(example, index) in examples" 
          :key="index"
          :header="example.title || `示例 ${index + 1}`"
        >
          <Tabs>
            <TabPane key="request" tab="请求">
              <div class="example-section">
                <div class="example-info">
                  <Tag :color="methodColorMap[example.request.method]">{{ example.request.method }}</Tag>
                  <code class="example-url">{{ baseUrl }}{{ example.request.url }}</code>
                </div>

                <div v-if="example.request.headers" class="example-headers">
                  <h5>请求头</h5>
                  <div class="code-block dark">
                    <pre><code>{{ formatJson(example.request.headers) }}</code></pre>
                  </div>
                </div>

                <div v-if="example.request.body" class="example-body">
                  <h5>请求体</h5>
                  <div class="code-block dark">
                    <div class="code-header">
                      <span class="code-lang">JSON</span>
                      <Button size="small" type="text" @click="copyCode(example.request.body)">
                        <template #icon><CopyOutlined /></template>
                      </Button>
                    </div>
                    <pre><code>{{ formatJson(example.request.body) }}</code></pre>
                  </div>
                </div>
              </div>
            </TabPane>

            <TabPane key="response" tab="响应">
              <div class="example-section">
                <div class="code-block dark">
                  <div class="code-header">
                    <span class="code-lang">JSON</span>
                    <Button size="small" type="text" @click="copyCode(example.response)">
                      <template #icon><CopyOutlined /></template>
                    </Button>
                  </div>
                  <pre><code>{{ formatJson(example.response) }}</code></pre>
                </div>
              </div>
            </TabPane>

            <TabPane key="curl" tab="cURL">
              <div class="example-section">
                <div class="code-block dark">
                  <div class="code-header">
                    <span class="code-lang">Bash</span>
                    <Button size="small" type="text" @click="copyCode(buildCurl(example))">
                      <template #icon><CopyOutlined /></template>
                    </Button>
                  </div>
                  <pre><code>{{ buildCurl(example) }}</code></pre>
                </div>
              </div>
            </TabPane>

            <TabPane key="java" tab="Java">
              <div class="code-block dark">
                <div class="code-header">
                  <span class="code-lang">Java</span>
                  <Button size="small" type="text" @click="copyCode(buildJava(example))">
                    <template #icon><CopyOutlined /></template>
                  </Button>
                </div>
                <pre><code>{{ buildJava(example) }}</code></pre>
              </div>
            </TabPane>

            <TabPane key="php" tab="PHP">
              <div class="code-block dark">
                <div class="code-header">
                  <span class="code-lang">PHP</span>
                  <Button size="small" type="text" @click="copyCode(buildPhp(example))">
                    <template #icon><CopyOutlined /></template>
                  </Button>
                </div>
                <pre><code>{{ buildPhp(example) }}</code></pre>
              </div>
            </TabPane>

            <TabPane key="python" tab="Python">
              <div class="example-section">
                <div class="code-block dark">
                  <div class="code-header">
                    <span class="code-lang">Python</span>
                    <Button size="small" type="text" @click="copyCode(buildPython(example))">
                      <template #icon><CopyOutlined /></template>
                    </Button>
                  </div>
                  <pre><code>{{ buildPython(example) }}</code></pre>
                </div>
              </div>
            </TabPane>
          </Tabs>
        </CollapsePanel>
      </Collapse>
    </div>

    <Alert v-else message="暂无示例" type="info" show-icon />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Collapse, CollapsePanel, Tabs, TabPane, Tag, Button, Alert, message } from 'ant-design-vue';
import { CopyOutlined } from '@ant-design/icons-vue';
import type { ApiExample } from '@/api/open-platform/docs';

interface Props {
  examples?: ApiExample[];
  baseUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  baseUrl: '/api/v1',
});

const activeExample = ref<number[]>([0]);

const methodColorMap: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
};

function formatJson(data: any): string {
  return JSON.stringify(data, null, 2);
}

function copyCode(data: any) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  navigator.clipboard.writeText(text);
  message.success('已复制到剪贴板');
}

function buildCurl(example: ApiExample): string {
  const { method = 'GET', url, headers, body } = example.request;
  let curl = `curl -X ${method} '${props.baseUrl}${url}'`;
  
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      curl += ` \\\n  -H '${key}: ${value}'`;
    }
  }
  
  if (body) {
    curl += ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(body)}'`;
  }
  
  return curl;
}

function buildJava(example: ApiExample): string {
  const { method = 'GET', url, body } = example.request;
  const javaMethod = method.toLowerCase();
  const bodyJson = body ? `String body = "${JSON.stringify(body).replace(/"/g, '\\"')}";` : '';
  const requestBody = body ? `\n    .body(RequestBody.create(body, MediaType.APPLICATION_JSON))` : '';
  
  return `import okhttp3.*;
import java.io.IOException;

public class ApiExample {
    public static void main(String[] args) throws IOException {
        OkHttpClient client = new OkHttpClient();
        ${bodyJson}
        
        Request request = new Request.Builder()
            .url("${props.baseUrl}${url}")
            .${javaMethod}()${requestBody}
            .addHeader("Content-Type", "application/json")
            .build();
        
        try (Response response = client.newCall(request).execute()) {
            System.out.println(response.body().string());
        }
    }
}`;
}

function buildPhp(example: ApiExample): string {
  const { method = 'GET', url, body } = example.request;
  const bodyStr = body ? `\n$data = '${JSON.stringify(body)}';\n$options['http']['content'] = $data;` : '';
  
  return `<?php
$url = '${props.baseUrl}${url}';${bodyStr}

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo $result;
`;
}

function buildPython(example: ApiExample): string {
  const { method = 'GET', url, body } = example.request;
  const bodyJson = body ? `\ndata = ${JSON.stringify(body, null, 4)}` : '';
  
  return `import requests
import json
${bodyJson}

url = '${props.baseUrl}${url}'
headers = {
    'Content-Type': 'application/json'
}

response = requests.${method.toLowerCase()}(url, headers=headers${body ? ', json=data' : ''})
print(response.json())
`;
}
</script>

<style scoped>
.code-example {
  margin-top: 16px;
}

.example-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.example-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.example-url {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #333;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.example-headers h5,
.example-body h5 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #666;
}

.code-block {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.code-block.dark {
  background: #1e1e1e;
  border-color: #333;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #2d2d2d;
  border-bottom: 1px solid #333;
}

.code-lang {
  font-size: 12px;
  color: #888;
}

.code-block pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
}

.code-block.dark pre {
  color: #d4d4d4;
  font-size: 13px;
  line-height: 1.5;
}
</style>
