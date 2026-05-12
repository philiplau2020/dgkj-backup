<template>
  <div class="api-document">
    <Row :gutter="24">
      <!-- 左侧导航 -->
      <Col :span="5">
        <Card class="nav-card">
          <InputSearch v-model:value="searchKeyword" placeholder="搜索 API" style="margin-bottom: 16px" />
          <Menu v-model:selectedKeys="selectedKeys" mode="inline" @click="handleMenuClick">
            <SubMenu key="intro" title="概述">
              <MenuItem key="intro-overview">平台简介</MenuItem>
              <MenuItem key="intro-auth">认证说明</MenuItem>
              <MenuItem key="intro-sign">签名机制</MenuItem>
              <MenuItem key="intro-callback">回调通知</MenuItem>
              <MenuItem key="intro-error">错误码</MenuItem>
            </SubMenu>
            <SubMenu key="dev" title="开发者接口">
              <MenuItem key="dev-register">注册开发者</MenuItem>
              <MenuItem key="dev-login">开发者登录</MenuItem>
              <MenuItem key="dev-info">获取用户信息</MenuItem>
            </SubMenu>
            <SubMenu key="app" title="应用管理">
              <MenuItem key="app-create">创建应用</MenuItem>
              <MenuItem key="app-list">应用列表</MenuItem>
              <MenuItem key="app-detail">应用详情</MenuItem>
              <MenuItem key="app-update">更新应用</MenuItem>
              <MenuItem key="app-secret">重置密钥</MenuItem>
              <MenuItem key="app-ip">IP白名单</MenuItem>
              <MenuItem key="app-key">API Key管理</MenuItem>
            </SubMenu>
            <SubMenu key="pay" title="支付接口">
              <MenuItem key="pay-gateway">发起支付</MenuItem>
              <MenuItem key="pay-query">查询订单</MenuItem>
              <MenuItem key="pay-close">关闭订单</MenuItem>
            </SubMenu>
            <SubMenu key="refund" title="退款接口">
              <MenuItem key="refund-apply">申请退款</MenuItem>
              <MenuItem key="refund-query">查询退款</MenuItem>
            </SubMenu>
            <SubMenu key="transfer" title="转账接口">
              <MenuItem key="transfer-pay">发起转账</MenuItem>
              <MenuItem key="transfer-query">查询转账</MenuItem>
            </SubMenu>
            <SubMenu key="account" title="账户接口">
              <MenuItem key="account-balance">查询余额</MenuItem>
            </SubMenu>
            <SubMenu key="sdk" title="SDK下载">
              <MenuItem key="sdk-node">Node.js SDK</MenuItem>
              <MenuItem key="sdk-java">Java SDK</MenuItem>
              <MenuItem key="sdk-php">PHP SDK</MenuItem>
              <MenuItem key="sdk-python">Python SDK</MenuItem>
              <MenuItem key="sdk-go">Go SDK</MenuItem>
              <MenuItem key="sdk-csharp">C# SDK</MenuItem>
            </SubMenu>
          </Menu>
        </Card>
      </Col>

      <!-- 右侧内容 -->
      <Col :span="19">
        <Card class="content-card">
          <template v-if="selectedDoc">
            <div class="doc-header">
              <h2>{{ selectedDoc.title }}</h2>
              <Tag :color="selectedDoc.method ? 'blue' : 'green'">
                {{ selectedDoc.method || selectedDoc.type }}
              </Tag>
            </div>

            <Alert v-if="selectedDoc.desc" type="info" :message="selectedDoc.desc" show-icon style="margin-bottom: 16px" />

            <!-- 接口地址 -->
            <div v-if="selectedDoc.path" class="endpoint-block">
              <div class="endpoint-url">
                <span class="method-badge" :class="selectedDoc.method?.toLowerCase()">{{ selectedDoc.method }}</span>
                <code>{{ selectedDoc.path }}</code>
              </div>
            </div>

            <!-- 请求参数 -->
            <div v-if="selectedDoc.params && selectedDoc.params.length" class="params-section">
              <h3>请求参数</h3>
              <Table :data-source="selectedDoc.params" :columns="paramColumns" :pagination="false" size="small" bordered>
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'required'">
                    <Tag :color="record.required ? 'red' : 'default'">{{ record.required ? '是' : '否' }}</Tag>
                  </template>
                </template>
              </Table>
            </div>

            <!-- 请求示例 -->
            <div v-if="selectedDoc.requestExample" class="example-section">
              <h3>请求示例</h3>
              <pre class="code-block">{{ selectedDoc.requestExample }}</pre>
            </div>

            <!-- 响应参数 -->
            <div v-if="selectedDoc.response && selectedDoc.response.length" class="params-section">
              <h3>响应参数</h3>
              <Table :data-source="selectedDoc.response" :columns="responseColumns" :pagination="false" size="small" bordered>
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'type'">
                    <Tag color="purple">{{ record.type }}</Tag>
                  </template>
                </template>
              </Table>
            </div>

            <!-- 响应示例 -->
            <div v-if="selectedDoc.responseExample" class="example-section">
              <h3>响应示例</h3>
              <pre class="code-block">{{ selectedDoc.responseExample }}</pre>
            </div>

            <!-- 错误码 -->
            <div v-if="selectedDoc.errorCodes" class="params-section">
              <h3>错误码</h3>
              <Table :data-source="selectedDoc.errorCodes" :columns="errorColumns" :pagination="false" size="small" bordered>
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'code'">
                    <Tag color="orange">{{ record.code }}</Tag>
                  </template>
                </template>
              </Table>
            </div>

            <!-- SDK示例 -->
            <div v-if="selectedDoc.sdkExample" class="example-section">
              <h3>SDK 示例代码</h3>
              <Tabs v-if="selectedDoc.sdkExample.multiple">
                <TabPane v-for="(code, lang) in selectedDoc.sdkExample.codes" :key="lang" :tab="lang">
                  <pre class="code-block">{{ code }}</pre>
                  <Button type="primary" @click="copyCode(code)" style="margin-top: 8px"><CopyOutlined /> 复制代码</Button>
                </TabPane>
              </Tabs>
              <div v-else>
                <pre class="code-block">{{ selectedDoc.sdkExample.code }}</pre>
                <Button type="primary" @click="copyCode(selectedDoc.sdkExample.code)" style="margin-top: 8px"><CopyOutlined /> 复制代码</Button>
              </div>
            </div>

            <!-- 签名说明 -->
            <div v-if="selectedDoc.key === 'intro-sign'" class="example-section">
              <h3>签名算法 (HMAC-SHA256)</h3>
              <pre class="code-block">{{ signExample }}</pre>
            </div>
          </template>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Row, Col, Card, InputSearch, Menu, SubMenu, MenuItem, Tag, Alert, Table, Tabs, TabPane, Button } from 'ant-design-vue';
import { CopyOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const searchKeyword = ref('');
const selectedKeys = ref(['intro-overview']);

const paramColumns = [
  { title: '参数名', dataIndex: 'name', width: 150 },
  { title: '类型', dataIndex: 'type', width: 80 },
  { title: '必填', key: 'required', width: 70 },
  { title: '说明', dataIndex: 'desc' },
];
const responseColumns = [
  { title: '字段名', dataIndex: 'name', width: 150 },
  { title: '类型', key: 'type', width: 80 },
  { title: '说明', dataIndex: 'desc' },
];
const errorColumns = [
  { title: '错误码', key: 'code', width: 120 },
  { title: '说明', dataIndex: 'desc', width: 200 },
  { title: '解决方案', dataIndex: 'solution' },
];

const signExample = '// 1. 将所有参数按字典序排序\n' +
'// 2. 拼接成 key=value&key=value 格式\n' +
'// 3. 使用 AppSecret 作为密钥进行 HMAC-SHA256 签名\n' +
'// 4. 将签名结果转为大写\n' +
'\n' +
"const crypto = require('crypto');\n" +
'\n' +
'function sign(params, appSecret) {\n' +
"  const sorted = Object.keys(params)\n" +
"    .filter(k => k !== 'sign' && params[k] !== undefined)\n" +
'    .sort()\n' +
"    .map(k => k + '=' + params[k])\n" +
"    .join('&');\n" +
"  return crypto.createHmac('sha256', appSecret)\n" +
'    .update(sorted)\n' +
"    .digest('hex')\n" +
'    .toUpperCase();\n' +
'}\n' +
'\n' +
'// 示例参数\n' +
'const params = {\n' +
"  appKey: 'DGKJxxx',\n" +
"  timestamp: '20260512000000',\n" +
"  mchNo: 'Mxxx',\n" +
"  orderNo: 'ORDxxx',\n" +
"  payType: 'wx_native',\n" +
'  amount: 100,\n' +
"  subject: '测试商品',\n" +
"  notifyUrl: 'https://example.com/notify'\n" +
'};\n' +
'\n' +
"const sign = sign(params, 'your_app_secret');\n" +
'// 签名: 7B2C3D...';

// 完整文档数据
const docs: Record<string, any> = {
  'intro-overview': {
    key: 'intro-overview', title: '平台简介', type: 'document',
    desc: 'DGKJ 开放平台为第三方开发者提供标准化支付 API 接口，支持聚合支付、退款、转账、账户查询等功能。平台基于金融级安全标准构建，支持 HMAC-SHA256、RSA、SM2 等多种签名验签方式。',
    requestExample: `基础地址: https://api.dgkjpay.com

接口版本: v1

数据格式: JSON

编码: UTF-8

通信协议: HTTPS`,
  },
  'intro-auth': {
    key: 'intro-auth', title: '认证说明', type: 'document',
    desc: '所有 API 请求必须通过 AppKey + 签名进行身份认证。请求头中需要包含以下参数：',
    requestExample: `请求头 (Headers):
  X-App-Key: your_app_key
  X-Sign: generated_signature
  X-Sign-Type: HMAC-SHA256
  X-Timestamp: 20260512000000
  X-Nonce: random_string_32chars
  Content-Type: application/json

认证流程:
1. 在开放平台创建应用，获取 AppKey 和 AppSecret
2. 使用 AppSecret 对请求参数进行签名
3. 将签名结果和其他认证参数放入请求头
4. 发起 API 调用`,
  },
  'intro-sign': {
    key: 'intro-sign', title: '签名机制', type: 'document', desc: '采用 HMAC-SHA256 签名算法，签名过程如下：',
    requestExample: signExample,
  },
  'intro-callback': {
    key: 'intro-callback', title: '回调通知', type: 'document',
    desc: '支付结果、退款结果、转账结果会通过 HTTP POST 方式通知到应用配置的回调地址。回调地址需要在创建应用时配置。',
    requestExample: `回调地址: https://your-domain.com/notify (支付通知)
                   https://your-domain.com/refund-notify (退款通知)

回调请求头:
  Content-Type: application/json
  X-Sign: signature_from_platform

回调请求体:
{
  "code": "OP0000",
  "message": "success",
  "data": {
    "orderNo": "OPxxxx",
    "mchNo": "Mxxxx",
    "payType": "wx_native",
    "amount": 100,
    "status": "paid",
    "paidTime": "2026-05-12 10:30:00",
    "channelOrderNo": "Cxxxx"
  }
}

回调通知需返回: {"code": "OP0000", "message": "success"}`,
  },
  'intro-error': {
    key: 'intro-error', title: '错误码说明', type: 'document',
    desc: '所有 API 响应都包含 code 字段，当 code 为 OP0000 时表示成功，否则表示失败。',
    errorCodes: [
      { code: 'OP0000', desc: '操作成功', solution: '正常处理' },
      { code: 'OP1001', desc: '签名验证失败', solution: '检查签名算法和密钥' },
      { code: 'OP1002', desc: '时间戳过期', solution: '检查服务器时间' },
      { code: 'OP1003', desc: 'AppKey 不存在', solution: '检查 AppKey 是否正确' },
      { code: 'OP1004', desc: 'AppKey 已禁用', solution: '联系平台客服' },
      { code: 'OP1006', desc: 'IP 不在白名单', solution: '在应用配置中添加 IP 白名单' },
      { code: 'OP2001', desc: 'API 接口未授权', solution: '联系平台开通对应接口权限' },
      { code: 'OP3001', desc: '请求频率超限', solution: '降低请求频率' },
      { code: 'OP3002', desc: '日配额已用完', solution: '明日再试或升级套餐' },
      { code: 'OP4001', desc: '订单不存在', solution: '检查订单号是否正确' },
      { code: 'OP4002', desc: '订单已过期', solution: '重新创建订单' },
      { code: 'OP4004', desc: '订单已支付', solution: '订单不可重复支付' },
      { code: 'OP4008', desc: '退款金额超限', solution: '检查退款金额' },
      { code: 'OP5001', desc: '开发者未审核', solution: '等待审核或联系客服' },
    ],
  },
  'pay-gateway': {
    key: 'pay-gateway', title: '发起支付', method: 'POST', path: '/api/v1/pay/gateway',
    desc: '商户通过此接口发起支付请求，平台根据 payType 返回对应的支付链接或二维码。',
    params: [
      { name: 'mchNo', type: 'string', required: true, desc: '商户号' },
      { name: 'appId', type: 'string', required: true, desc: '应用ID' },
      { name: 'payType', type: 'string', required: true, desc: '支付方式: wx_native/wx_jsapi/wx_h5/alipay_qr/alipay/alipay_wap/unionpay/bank' },
      { name: 'amount', type: 'int', required: true, desc: '金额(单位: 分)' },
      { name: 'subject', type: 'string', required: true, desc: '商品标题(最多100字)' },
      { name: 'orderNo', type: 'string', required: true, desc: '商户订单号(唯一)' },
      { name: 'notifyUrl', type: 'string', required: true, desc: '异步通知地址' },
      { name: 'returnUrl', type: 'string', required: false, desc: '支付完成跳转地址(H5支付必填)' },
      { name: 'clientIp', type: 'string', required: false, desc: '客户端IP' },
      { name: 'attach', type: 'string', required: false, desc: '附加数据(透传)' },
    ],
    requestExample: `{
  "mchNo": "M1234567890",
  "appId": "APPxxx",
  "payType": "wx_native",
  "amount": 100,
  "subject": "测试商品",
  "orderNo": "ORD2026051200001",
  "notifyUrl": "https://example.com/notify",
  "clientIp": "1.2.3.4",
  "attach": "order_123"
}`,
    responseExample: `{
  "code": "OP0000",
  "message": "操作成功",
  "data": {
    "orderNo": "OPxxx",
    "payUrl": "weixin://wxpay/bizpayurl?pr=xxx",
    "qrCode": "https://api.dgkjpay.com/qr/OPxxx",
    "amount": 100,
    "status": "pending",
    "expireTime": "2026-05-12T12:00:00Z"
  }
}`,
    sdkExample: {
      multiple: true,
      codes: {
        'Node.js': `const DgkjPay = require('dgkj-pay-sdk');

const client = new DgkjPay({
  appId: 'APPxxx',
  appKey: 'DGKJxxx',
  appSecret: 'your_app_secret',
  mchNo: 'Mxxx'
});

// 发起支付
const result = await client.pay({
  payType: 'wx_native',
  amount: 100, // 分
  subject: '测试商品',
  orderNo: 'ORD' + Date.now(),
  notifyUrl: 'https://example.com/notify'
});

console.log(result.qrCode); // 二维码链接
console.log(result.orderNo); // 平台订单号`,
        'Java': `import com.dgkj.pay.*;

DgkjPayClient client = new DgkjPayClient(
  "APPxxx", "DGKJxxx", "app_secret", "Mxxx");

PayRequest request = PayRequest.builder()
  .payType("wx_native")
  .amount(100)
  .subject("测试商品")
  .orderNo("ORD" + System.currentTimeMillis())
  .notifyUrl("https://example.com/notify")
  .build();

PayResponse response = client.pay(request);
System.out.println(response.getQrCode());`,
        'PHP': `<?php
require_once 'DgkjPay.php';

$client = new DgkjPayClient([
  'app_id' => 'APPxxx',
  'app_key' => 'DGKJxxx',
  'app_secret' => 'your_secret',
  'mch_no' => 'Mxxx'
]);

$result = $client->pay([
  'pay_type' => 'wx_native',
  'amount' => 100,
  'subject' => '测试商品',
  'order_no' => 'ORD' . time(),
  'notify_url' => 'https://example.com/notify'
]);

echo $result['qr_code'];`,
      },
    },
  },
  'pay-query': {
    key: 'pay-query', title: '查询订单', method: 'GET', path: '/api/v1/query/order/:orderNo',
    desc: '通过平台订单号查询订单状态。',
    params: [
      { name: 'orderNo', type: 'string', required: true, desc: '平台订单号' },
    ],
    responseExample: `{
  "code": "OP0000",
  "data": {
    "orderNo": "OPxxx",
    "mchNo": "Mxxx",
    "payType": "wx_native",
    "amount": 100,
    "status": "paid",
    "paidTime": "2026-05-12 10:30:00",
    "createTime": "2026-05-12 10:00:00"
  }
}`,
  },
  'refund-apply': {
    key: 'refund-apply', title: '申请退款', method: 'POST', path: '/api/v1/refund/apply',
    desc: '商户通过此接口申请退款，支持全额或部分退款。',
    params: [
      { name: 'orderNo', type: 'string', required: true, desc: '原订单号' },
      { name: 'refundAmount', type: 'int', required: true, desc: '退款金额(分)' },
      { name: 'refundReason', type: 'string', required: true, desc: '退款原因' },
      { name: 'notifyUrl', type: 'string', required: false, desc: '退款通知地址' },
    ],
    requestExample: `{
  "orderNo": "OPxxx",
  "refundAmount": 100,
  "refundReason": "用户申请取消订单"
}`,
    responseExample: `{
  "code": "OP0000",
  "data": {
    "refundNo": "RFxxx",
    "orderNo": "OPxxx",
    "refundAmount": 100,
    "status": "pending"
  }
}`,
  },
  'transfer-pay': {
    key: 'transfer-pay', title: '发起转账', method: 'POST', path: '/api/v1/transfer/pay',
    desc: '商户通过此接口向用户银行卡或账户转账，支持实时到账。',
    params: [
      { name: 'outNo', type: 'string', required: true, desc: '商户转账单号' },
      { name: 'amount', type: 'int', required: true, desc: '转账金额(分)' },
      { name: 'accountType', type: 'string', required: true, desc: '账户类型: bank_card/bank_account' },
      { name: 'accountName', type: 'string', required: true, desc: '账户姓名(需实名)' },
      { name: 'accountNo', type: 'string', required: true, desc: '账户号/银行卡号' },
      { name: 'bankName', type: 'string', required: true, desc: '银行名称' },
      { name: 'remark', type: 'string', required: false, desc: '转账备注' },
    ],
    requestExample: `{
  "outNo": "T202605120001",
  "amount": 10000,
  "accountType": "bank_card",
  "accountName": "张三",
  "accountNo": "6222021234567890",
  "bankName": "中国工商银行",
  "remark": "佣金发放"
}`,
    responseExample: `{
  "code": "OP0000",
  "data": {
    "transferNo": "TRxxx",
    "outNo": "T202605120001",
    "amount": 10000,
    "fee": 10,
    "actualAmount": 9990,
    "status": "pending"
  }
}`,
  },
  'account-balance': {
    key: 'account-balance', title: '查询余额', method: 'GET', path: '/api/v1/account/balance',
    desc: '查询商户账户余额信息。',
    params: [
      { name: 'mchNo', type: 'string', required: false, desc: '商户号(不填默认应用绑定的商户)' },
    ],
    responseExample: `{
  "code": "OP0000",
  "data": {
    "mchNo": "Mxxx",
    "availableBalance": 100000.00,
    "frozenBalance": 5000.00,
    "totalBalance": 105000.00,
    "currency": "CNY"
  }
}`,
  },
};

const selectedDoc = computed(() => docs[selectedKeys.value[0]] || docs['intro-overview']);

function handleMenuClick({ key }: any) {
  selectedKeys.value = [key];
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code).then(() => message.success('代码已复制'));
}
</script>

<style scoped>
.api-document { padding: 16px; background: #f0f2f5; height: 100%; }
.nav-card { position: sticky; top: 0; max-height: calc(100vh - 32px); overflow-y: auto; }
.content-card { min-height: calc(100vh - 32px); }
.doc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.doc-header h2 { margin: 0; }
.endpoint-block { margin-bottom: 20px; }
.endpoint-url { display: flex; align-items: center; gap: 12px; background: #f5f5f5; padding: 12px 16px; border-radius: 6px; }
.endpoint-url code { font-family: monospace; font-size: 14px; color: #333; }
.method-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.method-badge.post { background: #fff7e6; color: #fa8c16; }
.method-badge.get { background: #e6f7ff; color: #1890ff; }
.method-badge.put { background: #f6ffed; color: #52c41a; }
.method-badge.delete { background: #fff2f0; color: #f5222d; }
.params-section { margin-bottom: 24px; }
.params-section h3 { font-size: 15px; margin-bottom: 12px; }
.example-section { margin-bottom: 24px; }
.example-section h3 { font-size: 15px; margin-bottom: 12px; }
.code-block { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; font-size: 12px; line-height: 1.6; overflow-x: auto; white-space: pre-wrap; word-break: break-all; margin: 0; }
</style>
