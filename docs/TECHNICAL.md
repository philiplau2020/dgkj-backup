# 道谷科技支付平台 - 技术方案

## 一、项目概述

### 1.1 项目定位
**道谷科技支付平台** - 面向服务商模式（ISV）的聚合支付系统，为电商平台、停车场、收银系统等提供统一支付接入解决方案。

### 1.2 核心功能
| 模块 | 说明 |
|-----|------|
| 服务商管理 | 服务商入驻、审核、费率配置 |
| 商户管理 | 商户入驻、审核、通道授权 |
| 支付通道 | 微信直连、通联支付、汇付支付、富友支付 |
| 交易管理 | 支付、退款、关闭、查询 |
| 资金管理 | 中信银行E管家账户体系 |
| 结算管理 | T+1自动结算、D+0实时结算 |
| 对账管理 | 自动化对账、差异处理 |

### 1.3 系统架构
```
┌─────────────────────────────────────────────────────────┐
│                    接入方（商城/停车场/收银）              │
└─────────────────────────┬───────────────────────────────┘
                          │ API接入
┌─────────────────────────▼───────────────────────────────┐
│                   道谷科技支付平台                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ 运营后台 │ │ 商户后台 │ │代理商后台│ │ API网关  │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
│       └──────────┬┴──────────┬┴──────────┘         │
│  ┌───────────────▼──────────────────────────────────┐ │
│  │              支付核心服务                          │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │ │
│  │  │订单服务│ │通道路由│ │账户服务│ │结算服务│ │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐   │
│  │              支付通道层                          │   │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────────┐     │   │
│  │  │微信│ │通联│ │汇付│ │富友│ │中信银行│     │   │
│  │  └────┘ └────┘ └────┘ └────┘ └────────┘     │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    中信银行E管家                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │账户管理│ │资金归集│ │代付打款│ │对账清算│   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────────────────┘
```

## 二、技术架构

### 2.1 技术栈
| 层级 | 技术选型 |
|-----|--------|
| 后端框架 | Spring Boot 3.x + MyBatis-Plus 3.5 |
| 数据库 | MySQL 8.0 + Redis 7.x |
| 消息队列 | RabbitMQ / RocketMQ |
| 支付网关 | CtPay (通联), HfPay (汇付), FyPay (富友) |
| 微信支付 | 微信直连服务商模式 |
| 资金账户 | 中信银行E管家API |
| 前端 | Vue 3 + Vben Admin + Ant Design Vue |
| 部署 | Docker + K8s |

### 2.2 数据库设计
```sql
-- 服务商表
CREATE TABLE `pay_isv_info` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `isv_no` VARCHAR(32) NOT NULL COMMENT '服务商编号',
  `isv_name` VARCHAR(128) NOT NULL COMMENT '服务商名称',
  `contact_name` VARCHAR(64) COMMENT '联系人',
  `contact_mobile` VARCHAR(20) COMMENT '联系电话',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-停用,1-正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_isv_no`(`isv_no`)
);

-- 商户表
CREATE TABLE `pay_merchant` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `mch_no` VARCHAR(32) NOT NULL COMMENT '商户号',
  `mch_name` VARCHAR(128) NOT NULL COMMENT '商户名称',
  `mch_type` TINYINT NOT NULL COMMENT '商户类型:1-个人,2-企业',
  `isv_no` VARCHAR(32) NOT NULL COMMENT '所属服务商',
  `agent_no` VARCHAR(32) COMMENT '所属代理商',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-待审核,1-正常,2-冻结',
  `audit_status` TINYINT DEFAULT 0 COMMENT '审核状态:0-待审核,1-已通过,2-已拒绝',
  `rate` DECIMAL(8,4) DEFAULT 0 COMMENT '商户费率',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_mch_no`(`mch_no`)
);

-- 支付通道配置
CREATE TABLE `pay_channel_config` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `channel_code` VARCHAR(32) NOT NULL COMMENT '通道编码',
  `channel_name` VARCHAR(64) NOT NULL COMMENT '通道名称',
  `channel_type` VARCHAR(32) NOT NULL COMMENT '通道类型:wechat/alipay/citic/ctpay/hfpay/fypay',
  `isv_no` VARCHAR(32) COMMENT '所属服务商',
  `app_id` VARCHAR(128) COMMENT '应用ID',
  `mch_id` VARCHAR(64) COMMENT '商户ID',
  `api_key` VARCHAR(256) COMMENT 'API密钥',
  `cert_path` VARCHAR(256) COMMENT '证书路径',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-停用,1-正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 支付订单
CREATE TABLE `pay_order` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `order_no` VARCHAR(64) NOT NULL COMMENT '订单号',
  `mch_no` VARCHAR(32) NOT NULL COMMENT '商户号',
  `isv_no` VARCHAR(32) NOT NULL COMMENT '服务商编号',
  `agent_no` VARCHAR(32) COMMENT '代理商编号',
  `amount` DECIMAL(12,2) NOT NULL COMMENT '订单金额',
  `currency` VARCHAR(8) DEFAULT 'CNY' COMMENT '币种',
  `pay_channel` VARCHAR(32) NOT NULL COMMENT '支付通道',
  `pay_channel_order_no` VARCHAR(128) COMMENT '通道订单号',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-待支付,1-支付中,2-已支付,3-已取消,4-已退款',
  `subject` VARCHAR(128) COMMENT '订单标题',
  `body` VARCHAR(256) COMMENT '订单描述',
  `notify_url` VARCHAR(256) COMMENT '异步通知地址',
  `return_url` VARCHAR(256) COMMENT '同步跳转地址',
  `pay_time` DATETIME COMMENT '支付时间',
  `expire_time` DATETIME COMMENT '过期时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_order_no`(`order_no`)
);

-- 退款订单
CREATE TABLE `pay_refund` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `refund_no` VARCHAR(64) NOT NULL COMMENT '退款单号',
  `order_no` VARCHAR(64) NOT NULL COMMENT '原订单号',
  `mch_no` VARCHAR(32) NOT NULL COMMENT '商户号',
  `amount` DECIMAL(12,2) NOT NULL COMMENT '订单金额',
  `refund_amount` DECIMAL(12,2) NOT NULL COMMENT '退款金额',
  `refund_reason` VARCHAR(256) COMMENT '退款原因',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-待处理,1-已退款,2-已拒绝',
  `refund_time` DATETIME COMMENT '退款时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 账户表
CREATE TABLE `pay_account` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `account_no` VARCHAR(32) NOT NULL COMMENT '账户号',
  `mch_no` VARCHAR(32) NOT NULL COMMENT '商户号',
  `balance` DECIMAL(14,2) DEFAULT 0 COMMENT '账户余额',
  `frozen_balance` DECIMAL(14,2) DEFAULT 0 COMMENT '冻结金额',
  `available_balance` DECIMAL(14,2) GENERATED ALWAYS AS (balance - frozen_balance) STORED COMMENT '可用余额',
  `total_income` DECIMAL(14,2) DEFAULT 0 COMMENT '累计收入',
  `total_expense` DECIMAL(14,2) DEFAULT 0 COMMENT '累计支出',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 结算记录
CREATE TABLE `pay_settlement` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `settle_no` VARCHAR(64) NOT NULL COMMENT '结算单号',
  `mch_no` VARCHAR(32) NOT NULL COMMENT '商户号',
  `amount` DECIMAL(12,2) NOT NULL COMMENT '结算金额',
  `fee` DECIMAL(12,2) DEFAULT 0 COMMENT '手续费',
  `actual_amount` DECIMAL(12,2) NOT NULL COMMENT '实际到账',
  `bank_name` VARCHAR(64) COMMENT '银行名称',
  `bank_account` VARCHAR(32) COMMENT '银行账号',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-待结算,1-已结算',
  `settle_time` DATETIME COMMENT '结算时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 代理商表
CREATE TABLE `pay_agent` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `agent_no` VARCHAR(32) NOT NULL COMMENT '代理商编号',
  `agent_name` VARCHAR(128) NOT NULL COMMENT '代理商名称',
  `isv_no` VARCHAR(32) NOT NULL COMMENT '所属服务商',
  `profit_rate` DECIMAL(6,4) DEFAULT 0 COMMENT '分润比例',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-待审核,1-正常,2-冻结',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 三、支付通道对接

### 3.1 通道编码
| 通道编码 | 通道名称 | 说明 |
|---------|---------|------|
| WX_JSAPI | 微信Native | 微信扫码支付 |
| WX_APP | 微信APP | 微信APP支付 |
| WX_H5 | 微信H5 | 微信H5支付 |
| WX_LITE | 微信小程序 | 微信小程序支付 |
| ALI_QR | 支付宝扫码 | 支付宝扫码 |
| ALI_WAP | 支付宝WAP | 支付宝手机网站 |
| ALI_APP | 支付宝APP | 支付宝APP支付 |
| CT_QR | 通联扫码 | 通联扫码支付 |
| CT_WAP | 通联WAP | 通联手机支付 |
| HF_QR | 汇付扫码 | 汇付扫码支付 |
| HF_WAP | 汇付WAP | 汇付手机支付 |
| FY_QR | 富友扫码 | 富友扫码支付 |
| CITIC_QR | 中信扫码 | 中信银行扫码 |

### 3.2 通道路由规则
```
1. 按金额路由: 大额走银联/中信, 小额走微信/支付宝
2. 按渠道可用性: 检查通道状态, 自动切换
3. 按商户授权: 只展示商户已开通的通道
```

## 四、中信银行E管家对接

### 4.1 对接接口
| 接口 | 说明 |
|-----|------|
| 账户开户 | 为商户开立资金账户 |
| 账户查询 | 查询账户余额、流水 |
| 资金归集 | 收入自动归集到主账户 |
| 代付打款 | 商户提现、D+0结算 |
| 对账文件 | 获取对账文件进行核对 |

### 4.2 账户体系
```
服务商账户 (主账户)
    ├── 商户账户1
    │   ├── 收入
    │   ├── 冻结
    │   └── 可用
    ├── 商户账户2
    └── 代理商账户
        └── 分润
```

## 五、API接口规范

### 5.1 统一下单
```
POST /api/pay/unified
{
  "mchNo": "M10001",
  "orderNo": "ORDER123456",
  "amount": "100.00",
  "payChannel": "WX_JSAPI",
  "subject": "商品订单",
  "body": "测试商品",
  "notifyUrl": "https://example.com/notify",
  "returnUrl": "https://example.com/return"
}
```

### 5.2 统一响应
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "orderNo": "ORDER123456",
    "payUrl": "weixin://wxpay/...",
    "qrCode": "base64...",
    "expireTime": "2024-01-01 12:00:00"
  }
}
```

## 六、安全规范

### 6.1 签名机制
```java
// 签名算法: MD5(排序参数 + key)
// 或: RSA2(参数JSON, 商户私钥)
```

### 6.2 敏感数据
- API密钥加密存储
- 银行卡号脱敏显示
- 日志脱敏处理
- HTTPS传输

## 七、部署架构
```
┌─────────────────────────────────────────┐
│            Nginx (负载均衡)              │
│    ┌─────────┐ ┌─────────┐            │
│    │ API 1   │ │ API 2   │            │
│    └────┬────┘ └────┬────┘            │
│         │           │                  │
│    ┌────▼───────────▼────┐             │
│    │    Redis集群       │             │
│    └────────────────────┘             │
│    ┌────────────────────┐             │
│    │    MySQL主从       │             │
│    └────────────────────┘             │
│    ┌────────────────────┐             │
│    │    MQ消息队列      │             │
│    └────────────────────┘             │
└─────────────────────────────────────────┘
```
