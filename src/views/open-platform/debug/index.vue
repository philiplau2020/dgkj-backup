<template>
  <div class="api-debug">
    <Row :gutter="24">
      <!-- 左侧：API 测试 -->
      <Col :span="14">
        <Card title="API 在线调试" class="tester-card">
          <Form layout="vertical">
            <!-- 选择接口 -->
            <FormItem label="选择接口">
              <Select v-model:value="selectedApi" style="width: 100%" size="large" @change="onApiChange">
                <Select.OptGroup label="开发者接口">
                  <SelectOption value="POST|/api/v1/dev/register">POST /api/v1/dev/register - 注册</SelectOption>
                  <SelectOption value="POST|/api/v1/dev/login">POST /api/v1/dev/login - 登录</SelectOption>
                  <SelectOption value="GET|/api/v1/dev/info">GET /api/v1/dev/info - 开发者信息</SelectOption>
                </Select.OptGroup>
                <Select.OptGroup label="应用管理">
                  <SelectOption value="POST|/api/v1/app">POST /api/v1/app - 创建应用</SelectOption>
                  <SelectOption value="GET|/api/v1/app/list">GET /api/v1/app/list - 应用列表</SelectOption>
                  <SelectOption value="GET|/api/v1/app/:appId">GET /api/v1/app/:appId - 应用详情</SelectOption>
                </Select.OptGroup>
                <Select.OptGroup label="支付接口">
                  <SelectOption value="POST|/api/v1/pay/gateway">POST /api/v1/pay/gateway - 发起支付</SelectOption>
                  <SelectOption value="GET|/api/v1/query/order/:orderNo">GET /api/v1/query/order/:orderNo - 查询订单</SelectOption>
                  <SelectOption value="POST|/api/v1/order/:orderNo/close">POST /api/v1/order/:orderNo/close - 关闭订单</SelectOption>
                </Select.OptGroup>
                <Select.OptGroup label="退款接口">
                  <SelectOption value="POST|/api/v1/refund/apply">POST /api/v1/refund/apply - 申请退款</SelectOption>
                  <SelectOption value="GET|/api/v1/query/refund/:refundNo">GET /api/v1/query/refund/:refundNo - 查询退款</SelectOption>
                </Select.OptGroup>
                <Select.OptGroup label="转账接口">
                  <SelectOption value="POST|/api/v1/transfer/pay">POST /api/v1/transfer/pay - 发起转账</SelectOption>
                  <SelectOption value="GET|/api/v1/query/transfer/:transferNo">GET /api/v1/query/transfer/:transferNo - 查询转账</SelectOption>
                </Select.OptGroup>
                <Select.OptGroup label="账户接口">
                  <SelectOption value="GET|/api/v1/account/balance">GET /api/v1/account/balance - 查询余额</SelectOption>
                </Select.OptGroup>
              </Select>
            </FormItem>

            <!-- 认证参数 -->
            <div class="auth-section">
              <h4>认证参数</h4>
              <Row :gutter="12">
                <Col :span="12">
                  <FormItem label="AppKey">
                    <Input v-model:value="authParams.appKey" placeholder="DGKJxxx" />
                  </FormItem>
                </Col>
                <Col :span="12">
                  <FormItem label="AppSecret">
                    <InputPassword v-model:value="authParams.appSecret" placeholder="your_app_secret" />
                  </FormItem>
                </Col>
                <Col :span="12">
                  <FormItem label="签名算法">
                    <Select v-model:value="authParams.signType" style="width: 100%">
                      <SelectOption value="HMAC-SHA256">HMAC-SHA256 (推荐)</SelectOption>
                      <SelectOption value="MD5">MD5 (兼容)</SelectOption>
                    </Select>
                  </FormItem>
                </Col>
                <Col :span="12">
                  <FormItem label="时间戳">
                    <Input v-model:value="authParams.timestamp" />
                    <Button type="link" size="small" @click="refreshTimestamp">刷新</Button>
                  </FormItem>
                </Col>
              </Row>
            </div>

            <!-- 请求参数 -->
            <div class="params-section">
              <h4>请求参数 (JSON)</h4>
              <Input.TextArea v-model:value="requestBody" :rows="10" placeholder='{"mchNo": "Mxxx", "amount": 100}' style="font-family: monospace; font-size: 12px" />
            </div>

            <!-- 发送按钮 -->
            <FormItem>
              <Space>
                <Button type="primary" size="large" :loading="sending" @click="sendRequest">
                  <SendOutlined /> 发送请求
                </Button>
                <Button @click="generateSign">生成签名</Button>
                <Button @click="loadExample">加载示例</Button>
                <Button @click="requestBody = ''; response = ''">清空</Button>
              </Space>
            </FormItem>
          </Form>

          <!-- 响应 -->
          <div class="response-section">
            <h4>响应结果</h4>
            <div class="response-meta" v-if="responseMeta">
              <Tag :color="responseMeta.code === 'OP0000' ? 'green' : 'red'">
                HTTP {{ responseMeta.status }}
              </Tag>
              <Tag>耗时 {{ responseMeta.time }}ms</Tag>
              <Tag>大小 {{ responseMeta.size }}</Tag>
            </div>
            <pre class="response-block" :class="{ 'response-error': responseMeta?.code !== 'OP0000' }">{{ response || '响应结果将显示在这里' }}</pre>
          </div>
        </Card>
      </Col>

      <!-- 右侧：签名工具 -->
      <Col :span="10">
        <Card title="签名生成工具" class="sign-card">
          <Form layout="vertical">
            <FormItem label="签名密钥 (AppSecret)">
              <InputPassword v-model:value="signParams.secret" placeholder="输入密钥" />
            </FormItem>
            <FormItem label="签名算法">
              <RadioGroup v-model:value="signParams.algorithm">
                <Radio value="HMAC-SHA256">HMAC-SHA256</Radio>
                <Radio value="MD5">MD5</Radio>
              </RadioGroup>
            </FormItem>
            <FormItem label="参数列表 (JSON)">
              <Input.TextArea v-model:value="signParams.params" :rows="8" placeholder='{"appKey": "xxx", "timestamp": "xxx"}' style="font-family: monospace; font-size: 12px" />
            </FormItem>
            <FormItem>
              <Button type="primary" block @click="computeSign">计算签名</Button>
            </FormItem>
            <FormItem label="签名结果">
              <Input v-model:value="computedSign" readOnly style="font-family: monospace; color: #52c41a; font-weight: 600" />
              <Button type="link" @click="copyText(computedSign)"><CopyOutlined /> 复制</Button>
            </FormItem>
          </Form>
        </Card>

        <!-- 签名示例 -->
        <Card title="签名示例" class="sign-example-card" style="margin-top: 16px">
          <h4>HMAC-SHA256 签名流程</h4>
          <Steps direction="vertical" size="small" :current="0">
            <Step title="Step 1: 过滤参数" description="移除 sign 参数和空值参数" />
            <Step title="Step 2: 字典序排序" description="按参数名的 ASCII 码从小到大排序" />
            <Step title="Step 3: 拼接字符串" description="格式: key1=value1&key2=value2" />
            <Step title="Step 4: 计算签名" description="使用 HMAC-SHA256 算法，密钥为 AppSecret" />
            <Step title="Step 5: 转大写" description="将签名结果转为十六进制大写字符串" />
          </Steps>
          <pre class="sign-demo">{{ signDemo }}</pre>
        </Card>

        <!-- 常用示例 -->
        <Card title="支付签名示例" class="pay-example-card" style="margin-top: 16px">
          <h4>发起支付接口签名</h4>
          <pre class="code-block">{{ paySignExample }}</pre>
          <Button type="link" @click="copyText(paySignExample)"><CopyOutlined /> 复制</Button>
        </Card>
      </Col>
    </Row>

    <!-- 沙箱环境说明 -->
    <Card title="沙箱环境说明" style="margin-top: 16px">
      <Alert type="info" show-icon>
        <template #message>沙箱环境</template>
        <template #description>
          开发调试时请使用沙箱环境: <code>https://sandbox-api.dgkjpay.com</code>。沙箱环境的 AppKey/AppSecret 与生产环境隔离，支付均为模拟支付，不会产生真实交易。沙箱环境配置同生产环境，可在开发者中心创建测试应用。
        </template>
      </Alert>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Row, Col, Card, Form, FormItem, Input, InputPassword, Select, SelectOption, Button, Space, Tag, Alert, Steps, Step, Radio, RadioGroup } from 'ant-design-vue';
import { SendOutlined, CopyOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const selectedApi = ref('');
const sending = ref(false);
const requestBody = ref('');
const response = ref('');
const responseMeta = ref<any>(null);

const authParams = reactive({
  appKey: '',
  appSecret: '',
  signType: 'HMAC-SHA256',
  timestamp: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
});

const signParams = reactive({
  secret: '',
  algorithm: 'HMAC-SHA256',
  params: '{"appKey": "DGKJxxx", "timestamp": "20260512000000", "mchNo": "Mxxx", "payType": "wx_native", "amount": 100, "subject": "测试商品", "orderNo": "ORD001", "notifyUrl": "https://example.com/notify"}',
});

const computedSign = ref('');

const signDemo = `输入参数:
{
  "appKey": "DGKJxxx",
  "timestamp": "20260512000000",
  "mchNo": "Mxxx",
  "orderNo": "ORD001"
}

Step 1: 过滤空值和 sign 参数
Step 2: 按字典序排序
Step 3: 拼接
appKey=DGKJxxx&mchNo=Mxxx&orderNo=ORD001&timestamp=20260512000000

Step 4: HMAC-SHA256(AppSecret="your_secret")
= hex(hmac_sha256("appKey=DGKJxxx&mchNo=Mxxx&...", "your_secret"))

Step 5: 转大写
= 7B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2`;

const paySignExample = `// Node.js HMAC-SHA256 签名示例
const crypto = require('crypto');

function sign(params, appSecret) {
  const sorted = Object.keys(params)
    .filter(k => k !== 'sign' && params[k] !== undefined && params[k] !== '')
    .sort()
    .map(k => \`\${k}=\${params[k]}\`)
    .join('&');
  return crypto.createHmac('sha256', appSecret)
    .update(sorted)
    .digest('hex')
    .toUpperCase();
}

// 发起支付的签名参数
const params = {
  appKey: 'DGKJxxx',
  timestamp: '20260512000000',
  mchNo: 'Mxxx',
  appId: 'APPxxx',
  payType: 'wx_native',
  amount: 100,
  subject: '商品标题',
  orderNo: 'ORD20260512001',
  notifyUrl: 'https://example.com/notify'
};

const signature = sign(params, 'your_app_secret');
// 结果: 7B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0...`;

const apiExamples: Record<string, string> = {
  'POST|/api/v1/pay/gateway': `{
  "mchNo": "Mxxx",
  "appId": "APPxxx",
  "payType": "wx_native",
  "amount": 100,
  "subject": "测试商品",
  "orderNo": "ORD20260512001",
  "notifyUrl": "https://example.com/notify",
  "clientIp": "1.2.3.4",
  "attach": "测试订单"
}`,
  'POST|/api/v1/refund/apply': `{
  "orderNo": "OPxxx",
  "refundAmount": 100,
  "refundReason": "用户取消订单"
}`,
  'POST|/api/v1/transfer/pay': `{
  "outNo": "T20260512001",
  "amount": 10000,
  "accountType": "bank_card",
  "accountName": "张三",
  "accountNo": "6222021234567890",
  "bankName": "中国工商银行",
  "remark": "佣金发放"
}`,
};

function refreshTimestamp() {
  authParams.timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
}

function onApiChange() {
  if (apiExamples[selectedApi.value]) {
    requestBody.value = apiExamples[selectedApi.value];
  }
}

function loadExample() {
  if (apiExamples[selectedApi.value]) {
    requestBody.value = apiExamples[selectedApi.value];
    message.success('示例已加载');
  } else {
    message.info('该接口暂无示例');
  }
}

async function generateSign() {
  try {
    const params = JSON.parse(requestBody.value || '{}');
    const allParams = {
      ...params,
      appKey: authParams.appKey,
      timestamp: authParams.timestamp,
    };

    const crypto = require ? window.crypto : null;
    // 简化版签名计算
    const str = Object.keys(allParams)
      .filter(k => allParams[k] !== undefined && allParams[k] !== '')
      .sort()
      .map(k => `${k}=${allParams[k]}`)
      .join('&');

    // 使用 Web Crypto API (浏览器环境)
    if (typeof crypto !== 'undefined') {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', enc.encode(authParams.appSecret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(str));
      const hash = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      computedSign.value = hash;
      message.success('签名已计算，请复制到请求头');
    } else {
      computedSign.value = '需在浏览器环境计算';
    }
  } catch (e) {
    message.error('签名计算失败: ' + (e as Error).message);
  }
}

async function sendRequest() {
  if (!selectedApi.value) {
    message.warning('请先选择接口');
    return;
  }

  sending.value = true;
  const [method, path] = selectedApi.value.split('|');
  const startTime = Date.now();

  try {
    // 模拟请求
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    const mockResponse = getMockResponse(path);
    response.value = JSON.stringify(mockResponse, null, 2);
    responseMeta.value = {
      code: mockResponse.code,
      status: 200,
      time: Date.now() - startTime,
      size: new Blob([response.value]).size,
    };
  } catch (e: any) {
    response.value = JSON.stringify({ code: 'OP9001', message: e.message }, null, 2);
    responseMeta.value = { code: 'OP9001', status: 500, time: Date.now() - startTime, size: 0 };
  } finally {
    sending.value = false;
  }
}

function getMockResponse(path: string) {
  const mocks: Record<string, any> = {
    '/api/v1/dev/login': {
      code: 'OP0000', message: '操作成功', data: {
        developerId: 'DEVxxx', developerName: '测试开发者', token: 'mock_token_xxx', level: 'trial', status: 'active'
      }
    },
    '/api/v1/pay/gateway': {
      code: 'OP0000', message: '操作成功', data: {
        orderNo: 'OP' + Date.now().toString(36).toUpperCase(),
        payUrl: 'weixin://wxpay/bizpayurl?pr=' + Date.now(),
        qrCode: 'https://api.dgkjpay.com/qr/' + Date.now(),
        amount: 100, status: 'pending', expireTime: new Date(Date.now() + 7200000).toISOString()
      }
    },
    '/api/v1/query/order/:orderNo': {
      code: 'OP0000', data: {
        orderNo: 'OPxxx', mchNo: 'Mxxx', payType: 'wx_native',
        amount: 100, status: 'paid', paidTime: new Date().toISOString()
      }
    },
    '/api/v1/refund/apply': {
      code: 'OP0000', data: {
        refundNo: 'RF' + Date.now().toString(36).toUpperCase(),
        orderNo: 'OPxxx', refundAmount: 100, status: 'pending'
      }
    },
  };

  return mocks[path] || {
    code: 'OP0000', message: '操作成功', data: {
      success: true, message: 'Mock 响应'
    }
  };
}

function computeSign() {
  try {
    const params = JSON.parse(signParams.params);
    const str = Object.keys(params)
      .filter(k => params[k] !== undefined && params[k] !== '')
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');

    // 简单 SHA-256 实现 (用于演示)
    computedSign.value = '[使用浏览器 Web Crypto API 计算]' + str.slice(0, 50) + '...';
    message.info('请在浏览器控制台使用 crypto.subtle 计算实际签名');
  } catch (e) {
    message.error('参数 JSON 格式错误');
  }
}

function copyText(text: string) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => message.success('已复制'));
}

onMounted(() => refreshTimestamp());
</script>

<style scoped>
.api-debug { padding: 16px; background: #f0f2f5; }
.tester-card, .sign-card, .sign-example-card, .pay-example-card { margin-bottom: 0; }
.auth-section { background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.auth-section h4 { margin: 0 0 12px; font-size: 13px; color: #666; }
.params-section h4 { margin-bottom: 8px; }
.response-section h4 { margin-bottom: 8px; }
.response-meta { margin-bottom: 8px; display: flex; gap: 8px; }
.response-block { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; font-size: 12px; line-height: 1.6; overflow-x: auto; white-space: pre-wrap; word-break: break-all; min-height: 100px; margin: 0; }
.response-block.response-error { border-left: 3px solid #f5222d; }
.sign-demo { background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 12px; line-height: 1.6; white-space: pre-wrap; }
.code-block { background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 6px; font-size: 11px; line-height: 1.6; overflow-x: auto; white-space: pre-wrap; margin: 0; }
</style>
