# DGKJ 开放平台 API 文档

> 版本: v1.0.0 | 更新日期: 2026-05-11 | 状态: 正式版

---

## 目录

1. [平台概述](#1-平台概述)
2. [快速开始](#2-快速开始)
3. [认证机制](#3-认证机制)
4. [签名机制](#4-签名机制)
5. [开发者接口](#5-开发者接口)
6. [应用管理接口](#6-应用管理接口)
7. [支付接口](#7-支付接口)
8. [退款接口](#8-退款接口)
9. [转账接口](#9-转账接口)
10. [账户接口](#10-账户接口)
11. [回调通知](#11-回调通知)
12. [错误码](#12-错误码)
13. [SDK下载](#13-sdk下载)
14. [沙箱环境](#14-沙箱环境)
15. [FAQ](#15-faq)

---

## 1. 平台概述

### 1.1 概述

DGKJ 开放平台为第三方开发者提供标准化支付 API 接口，支持聚合支付、退款、转账、账户查询等功能。平台基于金融级安全标准构建，支持 HMAC-SHA256、RSA、SM2 等多种签名验签方式。

### 1.2 基础信息

| 项目 | 地址 |
|------|------|
| API 基础地址 (生产) | `https://api.dgkjpay.com` |
| API 基础地址 (沙箱) | `https://sandbox-api.dgkjpay.com` |
| API 版本 | v1 |
| 数据格式 | JSON |
| 编码 | UTF-8 |
| 通信协议 | HTTPS |

### 1.3 支持的支付方式

| 支付方式 | 代码 | 场景说明 |
|----------|------|----------|
| 微信 Native | `wx_native` | 扫码支付，生成二维码 |
| 微信 JSAPI | `wx_jsapi` | 公众号/小程序支付 |
| 微信 H5 | `wx_h5` | 手机浏览器支付 |
| 微信 App | `wx_app` | APP内调起微信支付 |
| 支付宝扫码 | `alipay_qr` | 扫码支付 |
| 支付宝 JSAPI | `alipay` | 支付宝内支付 |
| 支付宝 PC | `alipay_pc` | 电脑网站支付 |
| 银联云闪付 | `unionpay` | 银联二维码 |
| 银行卡支付 | `bank` | 银行卡快捷支付 |

---

## 2. 快速开始

### 2.1 接入流程

```
1. 注册入驻  →  2. 实名认证  →  3. 创建应用  →  4. 开发调试  →  5. 上线审核  →  6. 正式接入
```

### 2.2 环境说明

| 环境 | 用途 | AppKey |
|------|------|--------|
| 沙箱环境 | 开发调试 | 与生产隔离，模拟支付 |
| 生产环境 | 正式接入 | 真实交易 |

### 2.3 接入步骤

**Step 1: 注册开发者账号**

```http
POST /api/v1/dev/register
Content-Type: application/json

{
  "developerName": "测试开发者",
  "username": "test_dev",
  "password": "your_password",
  "email": "dev@example.com",
  "mobile": "13800138000",
  "company": "测试公司"
}
```

**Step 2: 创建应用获取凭证**

```http
POST /api/v1/app
Authorization: Bearer {token}
Content-Type: application/json

{
  "appName": "我的商城",
  "appType": "web",
  "notifyUrl": "https://your-domain.com/notify"
}
```

返回:
```json
{
  "code": "OP0000",
  "data": {
    "appId": "APPxxxxxxxx",
    "appKey": "DGKJxxxxxxxx",
    "appSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

**Step 3: 开始调用 API**

```javascript
const DgkjPay = require('dgkj-pay-sdk');

const client = new DgkjPay({
  appId: 'APPxxx',
  appKey: 'DGKJxxx',
  appSecret: 'your_secret',
  mchNo: 'Mxxx'
});

// 发起支付
const result = await client.pay({
  payType: 'wx_native',
  amount: 100,
  subject: '测试商品',
  orderNo: 'ORD' + Date.now(),
  notifyUrl: 'https://your-domain.com/notify'
});

console.log(result.qrCode); // 二维码内容
```

---

## 3. 认证机制

### 3.1 认证参数

所有 API 请求必须通过 AppKey + 签名进行身份认证。请求头中需要包含以下参数：

| 参数名 | 说明 | 示例 |
|--------|------|------|
| X-App-Key | 应用标识 | DGKJxxxxxxxx |
| X-Sign | 签名值 | 7B2C3D4E... |
| X-Sign-Type | 签名算法 | HMAC-SHA256 |
| X-Timestamp | 时间戳 | 20260512000000 |
| X-Nonce | 随机字符串 | abc123... |

### 3.2 认证流程

```
1. 在开放平台创建应用，获取 AppKey 和 AppSecret
2. 使用 AppSecret 对请求参数进行签名
3. 将签名结果和其他认证参数放入请求头
4. 发起 API 调用
```

### 3.3 公共请求头

```
Content-Type: application/json
X-App-Key: DGKJxxxxxxxx
X-Sign: 7B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2
X-Sign-Type: HMAC-SHA256
X-Timestamp: 20260512000000
X-Nonce: abcdefghijklmnopqrstuvwxyz123456
User-Agent: YourApp/1.0
```

---

## 4. 签名机制

### 4.1 签名算法

采用 **HMAC-SHA256** 签名算法。

### 4.2 签名流程

```
Step 1: 过滤参数
  - 移除 sign 参数本身
  - 移除空值参数 (null, undefined, "")
  - 移除 signType 参数

Step 2: 字典序排序
  - 按参数名的 ASCII 码从小到大排序

Step 3: 拼接字符串
  - 格式: key1=value1&key2=value2

Step 4: 计算 HMAC-SHA256
  - 使用 AppSecret 作为密钥
  - 对拼接后的字符串进行签名

Step 5: 转换为十六进制大写
```

### 4.3 签名示例 (Node.js)

```javascript
const crypto = require('crypto');

function sign(params, appSecret) {
  // Step 1: 过滤
  const filtered = Object.keys(params)
    .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .filter(k => k !== 'sign' && k !== 'signType')

  // Step 2: 排序
  filtered.sort()

  // Step 3: 拼接
  const str = filtered.map(k => `${k}=${params[k]}`).join('&')

  // Step 4-5: HMAC-SHA256 并转大写
  return crypto.createHmac('sha256', appSecret)
    .update(str)
    .digest('hex')
    .toUpperCase()
}

// 示例参数
const params = {
  appKey: 'DGKJxxx',
  timestamp: '20260512000000',
  mchNo: 'Mxxx',
  orderNo: 'ORD001',
  payType: 'wx_native',
  amount: 100,
  subject: '测试商品'
}

const signature = sign(params, 'your_app_secret')
console.log(signature) // 7B2C3D4E5F6A7B8C9D0E1F2...
```

### 4.4 签名示例 (Python)

```python
import hmac
import hashlib

def sign(params: dict, app_secret: str) -> str:
    # 过滤并排序
    filtered = {k: v for k, v in params.items()
                if v is not None and v != '' and k not in ('sign', 'signType')}
    sorted_keys = sorted(filtered.keys())

    # 拼接
    str_to_sign = '&'.join(f'{k}={filtered[k]}' for k in sorted_keys)

    # HMAC-SHA256
    return hmac.new(
        app_secret.encode('utf-8'),
        str_to_sign.encode('utf-8'),
        hashlib.sha256
    ).hexdigest().upper()
```

### 4.5 签名示例 (Java)

```java
public String sign(Map<String, Object> params) throws Exception {
    // 过滤、排序、拼接
    Map<String, Object> filtered = new TreeMap<>();
    for (Map.Entry<String, Object> e : params.entrySet()) {
        if (e.getValue() != null && !"sign".equals(e.getKey())) {
            filtered.put(e.getKey(), e.getValue());
        }
    }
    String str = filtered.entrySet().stream()
        .map(e -> e.getKey() + "=" + e.getValue())
        .collect(Collectors.joining("&"));

    // HMAC-SHA256
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(appSecret.getBytes(), "HmacSHA256"));
    byte[] hash = mac.doFinal(str.getBytes());
    return bytesToHex(hash).toUpperCase();
}
```

---

## 5. 开发者接口

### 5.1 注册开发者

```
POST /api/v1/dev/register
```

**请求参数:**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| developerName | string | 是 | 开发者名称 |
| username | string | 是 | 登录账号 (4-32位) |
| password | string | 是 | 密码 (6-32位) |
| email | string | 是 | 邮箱 |
| mobile | string | 是 | 手机号 |
| company | string | 否 | 公司名称 |
| businessLicense | string | 否 | 统一社会信用代码 |
| description | string | 否 | 应用场景说明 |

**响应:**

```json
{
  "code": "OP0000",
  "message": "操作成功",
  "data": {
    "developerId": "DEVxxx",
    "status": "pending",
    "message": "注册成功，请等待审核"
  }
}
```

---

### 5.2 开发者登录

```
POST /api/v1/dev/login
```

**请求参数:**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 登录账号 |
| password | string | 是 | 密码 |

**响应:**

```json
{
  "code": "OP0000",
  "data": {
    "developerId": "DEVxxx",
    "developerName": "测试开发者",
    "level": "trial",
    "status": "active",
    "token": "mock_token"
  }
}
```

---

## 6. 应用管理接口

### 6.1 创建应用

```
POST /api/v1/app
```

**请求参数:**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| appName | string | 是 | 应用名称 |
| appType | string | 是 | 类型: web/mobile/miniapp/api |
| description | string | 否 | 应用描述 |
| domain | string | 否 | 正式域名 |
| notifyUrl | string | 是 | 支付通知地址 |
| refundNotifyUrl | string | 否 | 退款通知地址 |
| transferNotifyUrl | string | 否 | 转账通知地址 |
| enabledPayTypes | string[] | 否 | 授权支付方式 |

**响应:**

```json
{
  "code": "OP0000",
  "data": {
    "appId": "APPDGKJxxx",
    "appKey": "DGKJxxx",
    "appSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "mchNo": "Mxxx",
    "status": "pending",
    "message": "AppSecret仅显示一次，请立即复制并妥善保管！"
  }
}
```

---

### 6.2 应用列表

```
GET /api/v1/app/list
```

**请求参数:**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码 (默认1) |
| pageSize | int | 否 | 每页条数 (默认10) |
| keyword | string | 否 | 关键词搜索 |
| status | string | 否 | 状态筛选 |

---

### 6.3 重置 AppSecret

```
POST /api/v1/app/{appId}/reset-secret
```

**响应:**

```json
{
  "code": "OP0000",
  "data": {
    "appSecret": "new_secret_here",
    "message": "AppSecret已重置，请妥善保管！"
  }
}
```

---

## 7. 支付接口

### 7.1 发起支付

```
POST /api/v1/pay/gateway
```

**请求参数:**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| mchNo | string | 是 | 商户号 |
| appId | string | 是 | 应用ID |
| payType | string | 是 | 支付方式代码 |
| amount | int | 是 | 金额 (单位: 分) |
| subject | string | 是 | 商品标题 (最多100字) |
| orderNo | string | 是 | 商户订单号 (唯一) |
| notifyUrl | string | 是 | 异步通知地址 |
| body | string | 否 | 商品描述 |
| returnUrl | string | 条件 | H5支付跳转地址 |
| clientIp | string | 否 | 客户端IP |
| attach | string | 否 | 附加数据 (透传) |

**请求示例:**

```json
{
  "mchNo": "M1234567890",
  "appId": "APPDGKJxxx",
  "payType": "wx_native",
  "amount": 100,
  "subject": "测试商品",
  "orderNo": "ORD202605120001",
  "notifyUrl": "https://your-domain.com/notify",
  "clientIp": "1.2.3.4",
  "attach": "order_123"
}
```

**响应示例:**

```json
{
  "code": "OP0000",
  "message": "操作成功",
  "data": {
    "orderNo": "OP6ABC123DEF",
    "payUrl": "weixin://wxpay/bizpayurl?pr=xxx",
    "qrCode": "https://api.dgkjpay.com/qr/OP6ABC123DEF",
    "deeplink": "",
    "amount": 100,
    "mchNo": "M1234567890",
    "payType": "wx_native",
    "status": "pending",
    "expireTime": "2026-05-12T14:00:00Z"
  }
}
```

---

### 7.2 查询订单

```
GET /api/v1/query/order/{orderNo}
```

**响应示例:**

```json
{
  "code": "OP0000",
  "data": {
    "orderNo": "OP6ABC123DEF",
    "mchNo": "M1234567890",
    "payType": "wx_native",
    "amount": 100,
    "actualAmount": 100,
    "status": "paid",
    "subject": "测试商品",
    "paidTime": "2026-05-12 10:30:00",
    "channelOrderNo": "C1234567890",
    "createTime": "2026-05-12 10:00:00"
  }
}
```

**status 状态值:**

| 值 | 说明 |
|----|------|
| `pending` | 待支付 |
| `paid` | 已支付 |
| `paying` | 支付中 |
| `closed` | 已关闭 |
| `refunded` | 已退款 |

---

### 7.3 关闭订单

```
POST /api/v1/order/{orderNo}/close
```

> 只能关闭状态为 `pending` 的订单。

**响应:**

```json
{
  "code": "OP0000",
  "data": {
    "orderNo": "OPxxx",
    "status": "closed"
  }
}
```

---

## 8. 退款接口

### 8.1 申请退款

```
POST /api/v1/refund/apply
```

**请求参数:**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderNo | string | 是 | 原订单号 |
| refundAmount | int | 是 | 退款金额 (分) |
| refundReason | string | 是 | 退款原因 |

**请求示例:**

```json
{
  "orderNo": "OP6ABC123DEF",
  "refundAmount": 100,
  "refundReason": "用户申请取消订单"
}
```

**响应示例:**

```json
{
  "code": "OP0000",
  "data": {
    "refundNo": "RF6ABC123DEF",
    "orderNo": "OP6ABC123DEF",
    "refundAmount": 100,
    "status": "pending",
    "createTime": "2026-05-12 11:00:00"
  }
}
```

---

### 8.2 查询退款

```
GET /api/v1/query/refund/{refundNo}
```

---

## 9. 转账接口

### 9.1 发起转账

```
POST /api/v1/transfer/pay
```

**请求参数:**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| outNo | string | 是 | 商户转账单号 |
| amount | int | 是 | 转账金额 (分) |
| accountType | string | 是 | 账户类型: bank_card/bank_account |
| accountName | string | 是 | 账户姓名 (需实名) |
| accountNo | string | 是 | 账户号/银行卡号 |
| bankName | string | 是 | 银行名称 |
| remark | string | 否 | 转账备注 |

**请求示例:**

```json
{
  "outNo": "T20260512001",
  "amount": 10000,
  "accountType": "bank_card",
  "accountName": "张三",
  "accountNo": "6222021234567890",
  "bankName": "中国工商银行",
  "remark": "佣金发放"
}
```

**响应示例:**

```json
{
  "code": "OP0000",
  "data": {
    "transferNo": "TR6ABC123DEF",
    "outNo": "T20260512001",
    "amount": 10000,
    "fee": 10,
    "actualAmount": 9990,
    "status": "pending"
  }
}
```

---

## 10. 账户接口

### 10.1 查询余额

```
GET /api/v1/account/balance
```

**响应示例:**

```json
{
  "code": "OP0000",
  "data": {
    "mchNo": "Mxxx",
    "availableBalance": 100000.00,
    "frozenBalance": 5000.00,
    "totalBalance": 105000.00,
    "currency": "CNY",
    "updateTime": "2026-05-12T10:00:00Z"
  }
}
```

---

## 11. 回调通知

### 11.1 回调地址配置

在创建应用时配置通知地址：
- 支付通知: `notifyUrl` - 支付结果异步通知
- 退款通知: `refundNotifyUrl` - 退款结果异步通知
- 转账通知: `transferNotifyUrl` - 转账结果异步通知

### 11.2 回调请求格式

```
POST {notifyUrl}
Content-Type: application/json
X-Sign: signature_from_platform
X-Timestamp: 20260512000000
X-Nonce: random_string
```

**回调请求体 (支付通知):**

```json
{
  "code": "OP0000",
  "message": "success",
  "data": {
    "orderNo": "OP6ABC123DEF",
    "mchNo": "M1234567890",
    "appId": "APPDGKJxxx",
    "payType": "wx_native",
    "amount": 100,
    "status": "paid",
    "paidTime": "2026-05-12 10:30:00",
    "channelOrderNo": "C1234567890",
    "attach": "order_123",
    "sign": "7B2C3D4E..."
  }
}
```

### 11.3 回调响应

回调成功后，请返回以下 JSON:

```json
{
  "code": "OP0000",
  "message": "success"
}
```

> 系统会在 3 秒内未收到成功响应时进行重试，最多重试 5 次。

### 11.4 回调验签示例

**Node.js:**

```javascript
const crypto = require('crypto');

function verifyCallback(body, appSecret) {
  const { sign, ...data } = body;
  if (!sign) return false;

  const str = Object.keys(data)
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join('&');

  const expected = crypto.createHmac('sha256', appSecret)
    .update(str)
    .digest('hex')
    .toUpperCase();

  return expected === sign.toUpperCase();
}

// Express 回调处理
app.post('/notify', (req, res) => {
  const ok = verifyCallback(req.body, 'your_app_secret');
  if (ok && req.body.status === 'paid') {
    // TODO: 处理支付成功
    console.log('支付成功:', req.body.orderNo);
    res.json({ code: 'OP0000', message: 'success' });
  } else {
    res.json({ code: 'OP1001', message: '签名验证失败' });
  }
});
```

---

## 12. 错误码

### 12.1 认证授权错误 (OP1xxx)

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| OP1001 | 签名验证失败 | 检查签名算法和密钥 |
| OP1002 | 时间戳过期 | 检查服务器时间是否准确 |
| OP1003 | AppKey 不存在 | 检查 AppKey 是否正确 |
| OP1004 | AppKey 已禁用 | 联系平台客服 |
| OP1005 | AppKey 已过期 | 联系平台续期 |
| OP1006 | IP 不在白名单 | 在应用配置中添加 IP 白名单 |
| OP1007 | 签名类型不支持 | 使用支持的签名类型 |
| OP1008 | 缺少必要参数 | 检查请求参数完整性 |

### 12.2 权限错误 (OP2xxx)

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| OP2001 | API 接口未授权 | 联系平台开通对应接口 |
| OP2002 | 支付方式未开通 | 在应用中开通支付方式 |
| OP2003 | 未绑定商户 | 联系平台绑定商户 |

### 12.3 限流错误 (OP3xxx)

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| OP3001 | 请求频率超限 | 降低请求频率 |
| OP3002 | 日配额已用完 | 明日再试或升级套餐 |
| OP3003 | 月配额已用完 | 升级套餐 |

### 12.4 业务错误 (OP4xxx)

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| OP4001 | 订单不存在 | 检查订单号是否正确 |
| OP4002 | 订单已过期 | 重新创建订单 |
| OP4003 | 订单已关闭 | 订单不可重复使用 |
| OP4004 | 订单已支付 | 订单不可重复支付 |
| OP4005 | 金额无效 | 检查 amount 参数 |
| OP4006 | 金额太小 | 金额不能低于 0.01 元 |
| OP4007 | 金额超限 | 检查单笔限额 |
| OP4008 | 退款金额超限 | 退款金额不能超过订单金额 |
| OP4009 | 商户不存在 | 检查 mchNo 参数 |
| OP4010 | 商户已冻结 | 联系平台客服 |
| OP4011 | 通知地址无效 | 检查 notifyUrl 配置 |
| OP4012 | 支付方式不支持 | 检查 payType 参数 |
| OP4013 | 通道不可用 | 稍后重试或换通道 |

### 12.5 开发者错误 (OP5xxx)

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| OP5001 | 开发者账号待审核 | 等待审核或联系客服 |
| OP5002 | 开发者账号已停用 | 联系平台客服 |
| OP5003 | 应用待审核 | 等待审核 |
| OP5004 | 应用已停用 | 联系平台客服 |

### 12.6 系统错误 (OP9xxx)

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| OP9001 | 系统繁忙 | 稍后重试 |
| OP9002 | 系统维护中 | 关注平台公告 |
| OP9003 | 处理超时 | 稍后重试 |
| OP9004 | 签名生成失败 | 检查密钥配置 |

---

## 13. SDK下载

### 13.1 已提供的 SDK

| 语言 | 安装方式 | 仓库地址 |
|------|----------|----------|
| Node.js | `npm install dgkj-pay-sdk` | `open-platform/examples/node/` |
| Java | Maven/Gradle | `open-platform/examples/java/` |
| PHP | Composer (待发布) | `open-platform/examples/php/` |
| Python | `pip install dgkj-pay-sdk` | `open-platform/examples/python/` |
| Go | `go get github.com/dgkj/dgkj-pay-go` | `open-platform/examples/go/` |
| C# (.NET) | NuGet (待发布) | `open-platform/examples/csharp/` |

### 13.2 SDK 目录结构

```
open-platform/
├── examples/
│   ├── node/              # Node.js SDK
│   │   ├── dgkj-pay-sdk.js
│   │   └── package.json
│   ├── java/              # Java SDK
│   │   └── src/main/java/com/dgkj/pay/sdk/DgkjPayClient.java
│   ├── php/               # PHP SDK
│   │   └── DGKJPHP/DgkjPayClient.php
│   ├── python/            # Python SDK
│   │   └── dgkj_python/dgkj_pay.py
│   ├── go/               # Go SDK
│   │   └── dgkj_go/dgkj.go
│   └── csharp/           # C# SDK
│       └── DGKJCSharp/DgkjPayClient.cs
```

---

## 14. 沙箱环境

### 14.1 环境说明

沙箱环境 (`https://sandbox-api.dgkjpay.com`) 用于开发调试，所有交易均为模拟支付，不产生真实资金流动。

### 14.2 沙箱特点

- 与生产环境 AppKey/AppSecret 隔离
- 所有支付均为模拟支付
- 支付通知即时回调
- 不产生真实手续费
- 不影响生产数据

### 14.3 沙箱使用

```javascript
const client = new DgkjPay({
  // ... 其他配置
  baseUrl: 'https://sandbox-api.dgkjpay.com' // 沙箱环境
});
```

---

## 15. FAQ

### Q1: 签名一直失败怎么办？

1. 确认使用正确的 AppSecret
2. 确认时间戳格式为 `yyyyMMddHHmmss`（14位）
3. 确认所有参数都已包含在签名中（除了 sign 本身）
4. 确认参数值为空字符串时不参与签名
5. 确认签名为十六进制大写

### Q2: 回调通知收不到怎么办？

1. 确认 notifyUrl 可公网访问
2. 确认 notifyUrl 返回正确的 JSON 格式 `{"code":"OP0000"}`
3. 检查服务器防火墙/安全组是否放行了回调地址
4. 在开放平台后台查看通知发送记录

### Q3: 如何开通更多支付方式？

登录开放平台 → 我的应用 → 选择应用 → 应用配置 → 支付方式 → 申请开通

### Q4: 如何申请正式环境？

登录开放平台 → 开发者中心 → 实名认证 → 提交资质材料 → 审核通过后自动开通

### Q5: 退款多久到账？

- 微信支付: 即时到账
- 支付宝: 即时到账
- 银行卡: 1-3个工作日

### Q6: 单笔/日/月限额是多少？

| 套餐等级 | 单笔限额 | 日限额 | 月限额 |
|----------|----------|--------|--------|
| 体验版 | 1000元 | 1万元 | 10万元 |
| 基础版 | 5万元 | 50万元 | 200万元 |
| 专业版 | 20万元 | 200万元 | 1000万元 |
| 企业版 | 自定义 | 自定义 | 自定义 |

---

## 附录: 响应格式规范

所有 API 响应均为以下 JSON 格式:

```json
{
  "code": "OP0000",           // 响应码
  "message": "操作成功",        // 消息
  "data": { ... },            // 数据
  "requestId": "REQxxx",      // 请求ID (用于排查问题)
  "timestamp": "2026-05-12T10:00:00Z" // 服务器时间戳
}
```

---

*文档版本: v1.0.0 | 最后更新: 2026-05-11*
