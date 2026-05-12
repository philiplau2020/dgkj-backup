# 道谷支付平台 - API 接口文档

## 一、接口规范

### 1.1 基础信息
| 项目 | 说明 |
|-----|------|
| 基础路径 | `/api` |
| 数据格式 | JSON |
| 编码格式 | UTF-8 |
| 认证方式 | Bearer Token |

### 1.2 统一响应格式
```json
{
  "code": 0,
  "msg": "success",
  "data": {},
  "time": 1704067200000
}
```

### 1.3 错误码定义
| 错误码 | 说明 |
|-------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 签名错误 |
| 2001 | 未登录 |
| 2002 | 登录过期 |
| 2003 | 无权限 |
| 3001 | 业务异常 |
| 5000 | 系统异常 |

---

## 二、认证模块

### 2.1 用户登录
```
POST /api/auth/login
```

**请求参数**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**响应示例**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expireTime": 1704153600000,
    "userInfo": {
      "userId": 1,
      "username": "admin",
      "nickname": "管理员",
      "avatar": "https://xxx.jpg",
      "roles": ["super_admin"]
    }
  }
}
```

### 2.2 获取用户信息
```
GET /api/auth/userinfo
```

**响应示例**
```json
{
  "code": 0,
  "data": {
    "userId": 1,
    "username": "admin",
    "nickname": "管理员",
    "avatar": "https://xxx.jpg",
    "roles": ["super_admin"],
    "permissions": ["*"]
  }
}
```

### 2.3 退出登录
```
POST /api/auth/logout
```

---

## 三、系统管理

### 3.1 菜单管理

#### 获取菜单列表
```
GET /api/sys/menu/list
```

**响应示例**
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "parentId": 0,
      "path": "/system",
      "name": "system",
      "component": "system/index",
      "meta": {
        "title": "系统管理",
        "icon": "SettingOutlined",
        "hidden": false,
        "keepAlive": false
      },
      "children": [
        {
          "id": 2,
          "parentId": 1,
          "path": "/system/user",
          "name": "systemUser",
          "component": "system/user/index",
          "meta": {
            "title": "用户管理",
            "icon": "UserOutlined"
          }
        }
      ]
    }
  ]
}
```

#### 获取路由列表
```
GET /api/sys/menu/routes
```

### 3.2 用户管理

#### 用户列表
```
GET /api/sys/user/list
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| pageNo | int | 是 | 页码 |
| pageSize | int | 是 | 每页条数 |
| username | string | 否 | 用户名 |
| status | int | 否 | 状态 |

**响应**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "nickname": "管理员",
        "email": "admin@example.com",
        "mobile": "13800138000",
        "status": 1,
        "roles": ["super_admin"],
        "createdAt": "2024-01-01 10:00:00"
      }
    ],
    "total": 100
  }
}
```

#### 新增用户
```
POST /api/sys/user
```

#### 编辑用户
```
PUT /api/sys/user/{id}
```

#### 删除用户
```
DELETE /api/sys/user/{id}
```

### 3.3 角色管理

#### 角色列表
```
GET /api/sys/role/list
```

#### 角色详情
```
GET /api/sys/role/{id}
```

#### 新增角色
```
POST /api/sys/role
```

#### 编辑角色
```
PUT /api/sys/role/{id}
```

#### 删除角色
```
DELETE /api/sys/role/{id}
```

---

## 四、商户管理

### 4.1 商户列表
```
GET /api/mch/merchant/list
```

**参数**
| 参数 | 类型 | 说明 |
|-----|------|------|
| pageNo | int | 页码 |
| pageSize | int | 每页条数 |
| mchNo | string | 商户号 |
| mchName | string | 商户名称 |
| status | int | 状态：0-待审核 1-正常 2-冻结 |
| auditStatus | int | 审核状态 |

**响应**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "mchNo": "M10001",
        "mchName": "测试商户",
        "mchType": 2,
        "status": 1,
        "auditStatus": 1,
        "balance": "10000.00",
        "rate": "0.0060",
        "createdAt": "2024-01-01 10:00:00"
      }
    ],
    "total": 100
  }
}
```

### 4.2 商户详情
```
GET /api/mch/merchant/{id}
```

### 4.3 新增商户
```
POST /api/mch/merchant
```

### 4.4 商户审核
```
POST /api/mch/merchant/audit
```

---

## 五、交易管理

### 5.1 支付订单

#### 订单列表
```
GET /api/trade/pay/order/list
```

**参数**
| 参数 | 类型 | 说明 |
|-----|------|------|
| pageNo | int | 页码 |
| pageSize | int | 每页条数 |
| orderNo | string | 订单号 |
| mchNo | string | 商户号 |
| status | int | 状态 |
| payChannel | string | 支付渠道 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |

**响应**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "orderNo": "P2024010110000001",
        "mchNo": "M10001",
        "mchName": "测试商户",
        "amount": "100.00",
        "currency": "CNY",
        "status": 2,
        "statusText": "已支付",
        "payChannel": "alipay",
        "payChannelText": "支付宝",
        "channelOrderNo": "20240101234567890",
        "payTime": "2024-01-01 10:05:00",
        "createdAt": "2024-01-01 10:00:00"
      }
    ],
    "total": 1000
  }
}
```

**订单状态**
| 状态 | 说明 |
|-----|------|
| 0 | 待支付 |
| 1 | 支付中 |
| 2 | 已支付 |
| 3 | 已取消 |
| 4 | 已退款 |

#### 订单详情
```
GET /api/trade/pay/order/{id}
```

#### 订单退款
```
POST /api/trade/pay/order/refund
```

**请求参数**
```json
{
  "orderNo": "P2024010110000001",
  "refundAmount": "50.00",
  "refundReason": "用户申请退款"
}
```

### 5.2 退款订单

#### 退款列表
```
GET /api/trade/refund/list
```

#### 退款详情
```
GET /api/trade/refund/{id}
```

---

## 六、财务管理

### 6.1 账户管理

#### 账户信息
```
GET /api/finance/account/{mchNo}
```

**响应**
```json
{
  "code": 0,
  "data": {
    "accountNo": "A20240101001",
    "mchNo": "M10001",
    "mchName": "测试商户",
    "balance": "10000.00",
    "frozenBalance": "1000.00",
    "availableBalance": "9000.00",
    "totalIncome": "50000.00",
    "totalExpense": "40000.00"
  }
}
```

### 6.2 结算管理

#### 结算列表
```
GET /api/finance/settlement/list
```

**参数**
| 参数 | 类型 | 说明 |
|-----|------|------|
| mchNo | string | 商户号 |
| status | int | 状态 |

**响应**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "settleNo": "S20240101001",
        "mchNo": "M10001",
        "mchName": "测试商户",
        "amount": "5000.00",
        "fee": "30.00",
        "actualAmount": "4970.00",
        "status": 1,
        "statusText": "已结算",
        "settleTime": "2024-01-01 18:00:00",
        "createdAt": "2024-01-01 00:00:00"
      }
    ],
    "total": 100
  }
}
```

---

## 七、数据统计

### 7.1 交易统计

#### 今日概览
```
GET /api/stat/trade/today
```

**响应**
```json
{
  "code": 0,
  "data": {
    "totalAmount": "100000.00",
    "totalCount": 1000,
    "successAmount": "98000.00",
    "successCount": 980,
    "refundAmount": "2000.00",
    "refundCount": 20,
    "successRate": "98.00%"
  }
}
```

#### 交易趋势
```
GET /api/stat/trade/trend
```

**参数**
| 参数 | 类型 | 说明 |
|-----|------|------|
| type | string | day/week/month |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |

---

## 八、支付渠道

### 8.1 渠道配置

#### 渠道列表
```
GET /api/channel/config/list
```

#### 渠道详情
```
GET /api/channel/config/{id}
```

#### 新增渠道
```
POST /api/channel/config
```

#### 编辑渠道
```
PUT /api/channel/config/{id}
```

#### 渠道开关
```
POST /api/channel/config/{id}/toggle
```
