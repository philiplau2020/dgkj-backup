# DGKJ 开放平台 - SDK 与示例代码

本目录包含 DGKJ 开放平台各语言 SDK 及完整示例代码。

## 目录结构

```
open-platform/
├── examples/
│   ├── node/          # Node.js SDK (npm: dgkj-pay-sdk)
│   ├── java/          # Java SDK (Maven/Gradle)
│   ├── php/            # PHP SDK (Composer)
│   ├── python/         # Python SDK (pip)
│   ├── go/             # Go SDK (go get)
│   └── csharp/         # C# SDK (NuGet)
└── README.md           # 本文件
```

## 快速安装

### Node.js

```bash
npm install dgkj-pay-sdk
```

```javascript
const { DgkjPayClient } = require('dgkj-pay-sdk');
```

### Java (Maven)

```xml
<dependency>
  <groupId>com.dgkj</groupId>
  <artifactId>dgkj-pay-sdk</artifactId>
  <version>1.0.0</version>
</dependency>
```

### Python

```bash
pip install dgkj-pay-sdk
```

```python
from dgkj_pay import DgkjPayClient
```

### Go

```bash
go get github.com/dgkj/dgkj-pay-go
```

```go
import dgkj "github.com/dgkj/dgkj-pay-go"
```

## 快速开始

```javascript
// Node.js 示例
const { DgkjPayClient } = require('dgkj-pay-sdk');

const client = new DgkjPayClient({
  appId: 'APPxxx',
  appKey: 'DGKJxxx',
  appSecret: 'your_secret',
  mchNo: 'Mxxx',
  baseUrl: 'https://sandbox-api.dgkjpay.com', // 沙箱
});

// 发起支付
const result = await client.pay({
  payType: 'wx_native',
  amount: 100,
  subject: '测试商品',
  orderNo: 'ORD' + Date.now(),
  notifyUrl: 'https://your-domain.com/notify',
});

console.log(result.qrCode); // 二维码链接
```

## API 列表

| 方法 | 说明 |
|------|------|
| `client.pay(params)` | 发起支付 |
| `client.payNative(...)` | Native 二维码支付 |
| `client.payJsapi(...)` | JSAPI 支付 |
| `client.queryOrder(orderNo)` | 查询订单 |
| `client.closeOrder(orderNo)` | 关闭订单 |
| `client.refund(params)` | 申请退款 |
| `client.queryRefund(refundNo)` | 查询退款 |
| `client.transfer(params)` | 发起转账 |
| `client.queryTransfer(transferNo)` | 查询转账 |
| `client.getBalance()` | 查询余额 |

## 回调处理

```javascript
// Node.js 回调处理
app.post('/notify', (req, res) => {
  const ok = client.verifyCallback(req.body);
  if (ok && req.body.status === 'paid') {
    // 处理支付成功
    res.json({ code: 'OP0000', message: 'success' });
  } else {
    res.json({ code: 'OP1001', message: '签名验证失败' });
  }
});
```

## 技术支持

- 技术支持邮箱: support@dgkjpay.com
- 技术支持电话: 400-xxx-xxxx
- 在线文档: https://docs.dgkjpay.com
