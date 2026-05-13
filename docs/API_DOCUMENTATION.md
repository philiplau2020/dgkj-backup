# DGKJ 支付平台 - 完整 API 文档

## 更新日期：2026-05-13

---

## 一、接口规范

### 1.1 基础信息

| 项目 | 说明 |
|------|------|
| 基础 URL | `https://dghs.gddogootech.com` |
| 接口前缀 | `/basic-api/` |
| 数据格式 | JSON |
| 编码 | UTF-8 |
| 认证方式 | Bearer Token (JWT) |

### 1.2 通用请求头

```
Content-Type: application/json
Authorization: Bearer <token>
```

### 1.3 通用响应格式

**成功响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**错误响应:**
```json
{
  "code": 400,
  "message": "参数错误",
  "data": null
}
```

### 1.4 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 参数错误 |
| 401 | 未授权/登录失败 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 二、认证模块 `/basic-api/auth`

### 2.1 用户登录

```
POST /basic-api/auth/login
```

**请求参数:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "role": "admin",
      "avatar": "https://example.com/avatar.png"
    }
  }
}
```

### 2.2 用户登出

```
POST /basic-api/auth/logout
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### 2.3 获取用户信息

```
GET /basic-api/auth/userinfo
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "role": "admin",
    "permissions": ["*/*"],
    "menus": [
      {
        "path": "/dashboard",
        "name": "Dashboard",
        "title": "仪表盘"
      }
    ]
  }
}
```

---

## 三、商户管理 `/basic-api/merchant` (别名: `/basic-api/mch`)

### 3.1 商户列表

```
GET /basic-api/merchant/list?page=1&pageSize=20&status=1
Authorization: Bearer <token>
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页条数，默认 20 |
| status | int | 否 | 状态：0-待审核，1-正常，2-冻结 |
| mchName | string | 否 | 商户名称（模糊搜索） |
| mchNo | string | 否 | 商户号 |

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "mchNo": "M10001",
        "mchName": "测试商户",
        "mchType": 1,
        "contactName": "张三",
        "contactMobile": "13800138000",
        "rate": "0.0060",
        "status": 1,
        "createdAt": "2024-01-01 10:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### 3.2 创建商户

```
POST /basic-api/merchant
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "mchNo": "M10001",
  "mchName": "测试商户",
  "mchType": 1,
  "contactName": "张三",
  "contactMobile": "13800138000",
  "contactEmail": "zhangsan@example.com",
  "rate": "0.0060"
}
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "mchNo": "M10001"
  }
}
```

### 3.3 商户详情

```
GET /basic-api/merchant/:id
Authorization: Bearer <token>
```

### 3.4 更新商户

```
PUT /basic-api/merchant/:id
Authorization: Bearer <token>
```

### 3.5 删除商户

```
DELETE /basic-api/merchant/:id
Authorization: Bearer <token>
```

---

## 四、代理管理 `/basic-api/agent`

### 4.1 代理商列表

```
GET /basic-api/agent/list?page=1&pageSize=20
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "agentNo": "A10001",
        "agentName": "一级代理商",
        "profitRate": "0.0020",
        "status": 1,
        "totalMch": 50,
        "totalAmount": 1000000.00,
        "createdAt": "2024-01-01 10:00:00"
      }
    ],
    "total": 10
  }
}
```

### 4.2 代理商审核

```
POST /basic-api/agent/audit
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "agentNo": "A10001",
  "status": 1,
  "remark": "审核通过"
}
```

### 4.3 代理分润记录

```
GET /basic-api/agent/profit/list?page=1&pageSize=20&agentNo=A10001
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "profitNo": "PF2024010100001",
        "agentNo": "A10001",
        "orderNo": "OP1234567890",
        "amount": 100.00,
        "profitAmount": 2.00,
        "profitRate": "0.02",
        "status": 1,
        "createdAt": "2024-01-01 12:00:00"
      }
    ],
    "total": 100
  }
}
```

### 4.4 代理提现申请

```
POST /basic-api/agent/withdraw
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "agentNo": "A10001",
  "amount": 10000.00,
  "bankName": "中国银行",
  "bankAccount": "6217000010012345678"
}
```

### 4.5 代理提现审核

```
POST /basic-api/agent/withdraw/review
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "withdrawNo": "WD2024010100001",
  "status": 1,
  "remark": "审核通过"
}
```

---

## 五、交易管理 `/basic-api/order`

### 5.1 订单列表

```
GET /basic-api/order/list?page=1&pageSize=20&status=2&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| status | int | 否 | 状态：0-待支付，1-支付中，2-已支付，3-已取消，4-已退款 |
| mchNo | string | 否 | 商户号 |
| orderNo | string | 否 | 订单号 |
| startDate | string | 否 | 开始日期 (YYYY-MM-DD) |
| endDate | string | 否 | 结束日期 (YYYY-MM-DD) |
| channel | string | 否 | 支付通道 |

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "orderNo": "OP2024010112000001",
        "mchNo": "M10001",
        "mchName": "测试商户",
        "amount": 100.00,
        "realAmount": 99.40,
        "fee": 0.60,
        "channel": "wechat",
        "channelOrderNo": "WX1234567890",
        "status": 2,
        "payTime": "2024-01-01 12:00:00",
        "createdAt": "2024-01-01 11:59:00"
      }
    ],
    "total": 1000,
    "summary": {
      "totalAmount": 100000.00,
      "totalFee": 600.00
    }
  }
}
```

### 5.2 订单详情

```
GET /basic-api/order/:id
Authorization: Bearer <token>
```

### 5.3 发起支付

```
POST /basic-api/order/create
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "mchNo": "M10001",
  "orderNo": "ORDER123456",
  "amount": 100.00,
  "channel": "wechat",
  "payType": "native",
  "subject": "测试商品",
  "body": "这是一笔测试支付",
  "notifyUrl": "https://example.com/notify",
  "returnUrl": "https://example.com/return"
}
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "orderNo": "ORDER123456",
    "payUrl": "weixin://wxpay/...",
    "qrCode": "data:image/png;base64,...",
    "expireTime": "2024-01-01 12:30:00"
  }
}
```

### 5.4 关闭订单

```
POST /basic-api/order/:id/close
Authorization: Bearer <token>
```

---

## 六、退款管理 `/basic-api/refund`

### 6.1 退款列表

```
GET /basic-api/refund/list?page=1&pageSize=20
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "refundNo": "RF2024010112000001",
        "orderNo": "OP2024010112000001",
        "mchNo": "M10001",
        "amount": 100.00,
        "refundAmount": 100.00,
        "reason": "商品不满意",
        "status": 1,
        "refundTime": "2024-01-01 14:00:00"
      }
    ],
    "total": 50
  }
}
```

### 6.2 申请退款

```
POST /basic-api/refund/apply
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "orderNo": "OP2024010112000001",
  "refundAmount": 100.00,
  "reason": "商品不满意"
}
```

### 6.3 退款审核

```
POST /basic-api/refund/review
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "refundNo": "RF2024010112000001",
  "status": 1,
  "remark": "审核通过"
}
```

---

## 七、账户管理 `/basic-api/account`

### 7.1 账户列表

```
GET /basic-api/account/list?page=1&pageSize=20
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "accountNo": "ACC2024010100001",
        "mchNo": "M10001",
        "mchName": "测试商户",
        "balance": 10000.00,
        "frozenBalance": 1000.00,
        "availableBalance": 9000.00,
        "totalIncome": 50000.00,
        "totalExpense": 40000.00
      }
    ],
    "total": 50
  }
}
```

### 7.2 账户详情

```
GET /basic-api/account/:id
Authorization: Bearer <token>
```

### 7.3 账户流水

```
GET /basic-api/account/record?page=1&pageSize=20&accountNo=ACC2024010100001
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "recordNo": "AR2024010114000001",
        "accountNo": "ACC2024010100001",
        "type": 1,
        "typeName": "收入",
        "amount": 100.00,
        "balanceBefore": 9900.00,
        "balanceAfter": 10000.00,
        "remark": "订单支付",
        "orderNo": "OP2024010112000001",
        "createdAt": "2024-01-01 14:00:00"
      }
    ],
    "total": 500
  }
}
```

---

## 八、通道管理 `/basic-api/channel`

### 8.1 通道商户列表

```
GET /basic-api/channel/mch/list?page=1&pageSize=20
Authorization: Bearer <token>
```

### 8.2 通道路由配置

```
GET /basic-api/channel/route/list?page=1&pageSize=20
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "ruleName": "默认路由",
        "ruleType": "amount",
        "conditions": [
          {"field": "amount", "operator": "<=", "value": 1000},
          {"field": "amount", "operator": ">", "value": 0}
        ],
        "channel": "wechat",
        "priority": 1,
        "status": 1
      }
    ],
    "total": 10
  }
}
```

### 8.3 添加通道路由

```
POST /basic-api/channel/route
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "ruleName": "小额优先微信",
  "ruleType": "amount",
  "conditions": [
    {"field": "amount", "operator": "<=", "value": 1000}
  ],
  "channel": "wechat",
  "priority": 1
}
```

---

## 九、中信银行 `/basic-api/citic`

### 9.1 中信账户列表

```
GET /basic-api/citic/account/list?page=1&pageSize=20
Authorization: Bearer <token>
```

### 9.2 账户开户

```
POST /basic-api/citic/account/open
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "mchNo": "M10001",
  "accountName": "测试商户",
  "idcardNo": "440100199001011234",
  "bankNo": "308581005055"
}
```

### 9.3 结算记录

```
GET /basic-api/citic/settlement/list?page=1&pageSize=20
Authorization: Bearer <token>
```

### 9.4 发起结算

```
POST /basic-api/citic/settlement/apply
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "accountNo": "CT001",
  "amount": 10000.00,
  "remark": "日常结算"
}
```

### 9.5 对账记录

```
GET /basic-api/citic/check/list?page=1&pageSize=20&checkDate=2024-01-01
Authorization: Bearer <token>
```

### 9.6 转账

```
POST /basic-api/citic/transfer
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "fromAccountNo": "CT001",
  "toAccountNo": "CT002",
  "amount": 1000.00,
  "remark": "测试转账"
}
```

---

## 十、统计管理 `/basic-api/stat`

### 10.1 仪表盘数据

```
GET /basic-api/stat/dashboard
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "todayAmount": 50000.00,
    "todayCount": 120,
    "yesterdayAmount": 45000.00,
    "yesterdayCount": 100,
    "monthAmount": 1500000.00,
    "monthCount": 3500,
    "channelStats": [
      {"channel": "wechat", "amount": 30000.00, "count": 80},
      {"channel": "alipay", "amount": 20000.00, "count": 40}
    ]
  }
}
```

### 10.2 交易趋势

```
GET /basic-api/stat/trade/trend?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

### 10.3 支付类型统计

```
GET /basic-api/stat/trade/pay-type
Authorization: Bearer <token>
```

---

## 十一、设备管理 `/basic-api/device`

### 11.1 设备列表

```
GET /basic-api/device/list?page=1&pageSize=20&type=pos
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "deviceNo": "DEV2024010100001",
        "deviceType": "pos",
        "deviceName": "POS-001",
        "mchNo": "M10001",
        "status": 1,
        "lastHeartbeat": "2024-01-01 12:00:00"
      }
    ],
    "total": 100
  }
}
```

### 11.2 设备激活

```
POST /basic-api/device/activate
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "deviceNo": "DEV2024010100001",
  "mchNo": "M10001"
}
```

---

## 十二、对账管理 `/basic-api/check`

### 12.1 批次对账

```
GET /basic-api/check/batch/list?page=1&pageSize=20&checkDate=2024-01-01
Authorization: Bearer <token>
```

### 12.2 发起对账

```
POST /basic-api/check/batch/create
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "checkDate": "2024-01-01",
  "channel": "wechat"
}
```

### 12.3 通道对账

```
GET /basic-api/check/channel-bill/list?page=1&pageSize=20&batchNo=BATCH20240101
Authorization: Bearer <token>
```

### 12.4 差异处理

```
GET /basic-api/check/diff-bill/list?page=1&pageSize=20&batchNo=BATCH20240101
Authorization: Bearer <token>
```

---

## 十三、分润管理 `/basic-api/profit`

### 13.1 分润记录

```
GET /basic-api/profit/record/list?page=1&pageSize=20
Authorization: Bearer <token>
```

### 13.2 分润回滚

```
GET /basic-api/profit/rollback/list?page=1&pageSize=20
Authorization: Bearer <token>
```

---

## 十四、开放平台 API `/api/v1`

### 14.1 统一下单

```
POST /api/v1/pay/unified
```

**请求参数:**
```json
{
  "mchNo": "M10001",
  "appId": "APP2024010100001",
  "orderNo": "ORDER123456",
  "amount": "100.00",
  "payChannel": "WX_JSAPI",
  "subject": "测试商品",
  "body": "测试商品描述",
  "notifyUrl": "https://example.com/notify",
  "returnUrl": "https://example.com/return",
  "sign": "MD5签名"
}
```

**响应示例:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "orderNo": "ORDER123456",
    "payUrl": "weixin://wxpay/...",
    "qrCode": "base64...",
    "expireTime": "2024-01-01 12:30:00"
  }
}
```

### 14.2 支付查询

```
POST /api/v1/pay/query
```

**请求参数:**
```json
{
  "mchNo": "M10001",
  "appId": "APP2024010100001",
  "orderNo": "ORDER123456",
  "sign": "MD5签名"
}
```

### 14.3 退款申请

```
POST /api/v1/refund/apply
```

**请求参数:**
```json
{
  "mchNo": "M10001",
  "appId": "APP2024010100001",
  "orderNo": "ORDER123456",
  "refundNo": "REFUND123456",
  "refundAmount": "100.00",
  "refundReason": "用户取消",
  "sign": "MD5签名"
}
```

---

## 十五、健康检查

### 15.1 基础健康检查

```
GET /health
```

**响应示例:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

### 15.2 Prometheus 指标

```
GET /basic-api/monitor/metrics
```

---

## 附录：错误码对照表

| 错误码 | 错误信息 | 说明 |
|--------|----------|------|
| 0 | success | 成功 |
| 400 | 参数错误 | 请求参数不正确 |
| 401 | 未授权 | Token 无效或已过期 |
| 403 | 无权限 | 没有访问权限 |
| 404 | 资源不存在 | 请求的资源不存在 |
| 500 | 服务器错误 | 服务器内部错误 |
| 1001 | 余额不足 | 账户余额不足 |
| 1002 | 订单不存在 | 订单号不存在 |
| 1003 | 订单已支付 | 订单已支付，不能重复操作 |
| 1004 | 订单已关闭 | 订单已超时关闭 |
| 1005 | 退款金额超限 | 退款金额超过可退金额 |
| 2001 | 商户不存在 | 商户号不存在 |
| 2002 | 商户已冻结 | 商户状态异常 |
| 3001 | 通道不可用 | 支付通道暂时不可用 |
| 3002 | 通道不支持 | 支付通道不支持该类型 |
| 4001 | 签名错误 | 请求签名验证失败 |
| 4002 | 签名超时 | 签名已过期 |
