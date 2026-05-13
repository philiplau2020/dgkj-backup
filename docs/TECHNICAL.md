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
| 通知管理 | 邮件/短信通知、模板配置、发送记录 |
| 风控管理 | 异常交易监控、大额预警 |

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

## 七、通知管理模块

### 7.1 通知场景总览
| 场景编码 | 场景名称 | 通知方式 | 触发条件 |
|---------|---------|---------|---------|
| TRADE_SUCCESS | 支付成功通知 | 邮件/短信 | 支付回调成功 |
| TRADE_FAIL | 支付失败通知 | 邮件/短信 | 支付超时/失败 |
| TRADE_REFUND | 退款通知 | 邮件/短信 | 退款完成 |
| SETTLE_SUCCESS | 结算成功通知 | 邮件/短信 | 结算完成 |
| SETTLE_FAIL | 结算失败通知 | 邮件/短信 | 结算失败 |
| WITHDRAW_SUCCESS | 提现成功通知 | 邮件/短信 | 提现到账 |
| WITHDRAW_FAIL | 提现失败通知 | 邮件/短信 | 提现驳回 |
| RISK_ALERT | 风控预警通知 | 邮件/短信 | 异常交易/大额交易 |
| MERCHANT_AUDIT | 商户审核通知 | 邮件/短信 | 审核结果通知 |
| AGENT_AUDIT | 代理商审核通知 | 邮件/短信 | 审核结果通知 |
| CHANNEL_STATUS | 通道状态变更 | 邮件/短信 | 通道异常/恢复 |
| DAILY_BILL | 日账单推送 | 邮件 | 每日发送对账单 |
| MONTHLY_BILL | 月账单推送 | 邮件 | 每月发送汇总账单 |

### 7.2 运营后台菜单结构（系统管理下）

```
系统管理
├── 通知渠道配置
│   ├── 邮件配置
│   │   ├── SMTP服务器配置
│   │   ├── 发件人账号/密码
│   │   ├── 端口配置（25/465/587）
│   │   ├── SSL/TLS加密
│   │   └── 发送测试
│   └── 短信配置
│       ├── 短信服务商选择
│       ├── AppKey/AppSecret
│       ├── 签名配置
│       ├── 模板ID配置
│       └── 发送测试
├── 通知模板管理
│   ├── 邮件模板列表
│   │   ├── 模板名称
│   │   ├── 模板编码
│   │   ├── 模板内容（支持变量）
│   │   ├── 关联场景
│   │   ├── 状态（启用/禁用）
│   │   └── 操作（编辑/预览/删除）
│   └── 短信模板列表
│       ├── 模板名称
│       ├── 模板编码
│       ├── 模板内容（支持变量）
│       ├── 短信签名
│       ├── 关联场景
│       ├── 状态（启用/禁用）
│       └── 操作（编辑/预览/删除）
├── 通知记录查询
│   ├── 发送记录列表
│   │   ├── 通知类型（邮件/短信）
│   │   ├── 接收人
│   │   ├── 场景类型
│   │   ├── 发送状态（成功/失败/待发送）
│   │   ├── 发送时间
│   │   ├── 失败原因
│   │   └── 操作（重发/查看详情）
│   └── 导出功能
├── 订阅管理
│   ├── 商户订阅配置
│   │   ├── 商户号
│   │   ├── 通知场景（多选）
│   │   ├── 通知方式（邮件/短信）
│   │   ├── 接收邮箱
│   │   ├── 接收手机
│   │   └── 状态（启用/禁用）
│   └── 代理商订阅配置
└── 风控预警配置
    ├── 大额交易预警
    │   ├── 单笔金额阈值
    │   ├── 日累计金额阈值
    │   ├── 通知方式
    │   └── 通知接收人
    ├── 异常交易预警
    │   ├── 预警规则（频繁失败/短时多笔等）
    │   ├── 触发次数阈值
    │   ├── 通知方式
    │   └── 通知接收人
    └── 通道异常预警
        ├── 预警条件（连续失败N笔）
        ├── 预警间隔
        ├── 通知方式
        └── 通知接收人
```

### 7.3 数据库设计

```sql
-- 通知渠道配置表
CREATE TABLE `sys_notify_config` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `config_type` VARCHAR(32) NOT NULL COMMENT '配置类型:email/sms',
  `config_key` VARCHAR(64) NOT NULL COMMENT '配置项key',
  `config_value` VARCHAR(512) NOT NULL COMMENT '配置值',
  `remark` VARCHAR(256) COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_type_key`(`config_type`, `config_key`)
);

-- 通知模板表
CREATE TABLE `sys_notify_template` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `template_code` VARCHAR(64) NOT NULL COMMENT '模板编码',
  `template_name` VARCHAR(128) NOT NULL COMMENT '模板名称',
  `notify_type` VARCHAR(16) NOT NULL COMMENT '通知类型:email/sms',
  `scene_code` VARCHAR(64) NOT NULL COMMENT '场景编码',
  `subject` VARCHAR(256) COMMENT '邮件主题（邮件模板专用）',
  `content` TEXT NOT NULL COMMENT '模板内容，支持${变量}语法',
  `variables` VARCHAR(512) COMMENT '变量列表，JSON格式',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-禁用,1-启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_template_code`(`template_code`),
  KEY `idx_scene`(`scene_code`)
);

-- 通知发送记录表
CREATE TABLE `sys_notify_record` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `notify_id` VARCHAR(64) NOT NULL COMMENT '通知ID',
  `notify_type` VARCHAR(16) NOT NULL COMMENT '通知类型:email/sms',
  `scene_code` VARCHAR(64) NOT NULL COMMENT '场景编码',
  `receiver` VARCHAR(128) NOT NULL COMMENT '接收人',
  `receiver_type` VARCHAR(32) COMMENT '接收人类型:merchant/agent/admin',
  `receiver_no` VARCHAR(64) COMMENT '接收人编号',
  `subject` VARCHAR(256) COMMENT '邮件主题',
  `content` TEXT COMMENT '发送内容',
  `send_status` TINYINT DEFAULT 0 COMMENT '发送状态:0-待发送,1-发送中,2-成功,3-失败',
  `send_time` DATETIME COMMENT '发送时间',
  `fail_reason` VARCHAR(512) COMMENT '失败原因',
  `retry_count` INT DEFAULT 0 COMMENT '重试次数',
  `ext_data` VARCHAR(1024) COMMENT '扩展数据(JSON)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_receiver`(`receiver`),
  KEY `idx_scene`(`scene_code`),
  KEY `idx_status`(`send_status`),
  KEY `idx_created`(`created_at`)
);

-- 订阅配置表
CREATE TABLE `sys_notify_subscription` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `subscribe_type` VARCHAR(32) NOT NULL COMMENT '订阅类型:merchant/agent',
  `subscribe_no` VARCHAR(64) NOT NULL COMMENT '订阅人编号',
  `subscribe_name` VARCHAR(128) COMMENT '订阅人名称',
  `scene_codes` VARCHAR(512) NOT NULL COMMENT '订阅场景，逗号分隔',
  `notify_email` VARCHAR(128) COMMENT '通知邮箱',
  `notify_mobile` VARCHAR(32) COMMENT '通知手机',
  `email_status` TINYINT DEFAULT 1 COMMENT '邮件通知状态:0-禁用,1-启用',
  `sms_status` TINYINT DEFAULT 1 COMMENT '短信通知状态:0-禁用,1-启用',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-禁用,1-启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_subscribe`(`subscribe_type`, `subscribe_no`)
);

-- 风控预警配置表
CREATE TABLE `sys_risk_alert_config` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `alert_type` VARCHAR(64) NOT NULL COMMENT '预警类型:large_amount/daily_total/abnormal/channel',
  `alert_name` VARCHAR(128) NOT NULL COMMENT '预警名称',
  `threshold_amount` DECIMAL(14,2) COMMENT '金额阈值',
  `threshold_count` INT COMMENT '次数阈值',
  `threshold_period` INT COMMENT '周期（分钟）',
  `notify_types` VARCHAR(64) COMMENT '通知方式:email,sms',
  `notify_receivers` VARCHAR(512) COMMENT '通知接收人，逗号分隔',
  `notify_emails` VARCHAR(512) COMMENT '通知邮箱，逗号分隔',
  `notify_mobiles` VARCHAR(256) COMMENT '通知手机，逗号分隔',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-禁用,1-启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_alert_type`(`alert_type`)
);

-- 商户扩展表（添加通知字段）
ALTER TABLE `pay_merchant` ADD COLUMN `notify_email` VARCHAR(128) COMMENT '通知邮箱';
ALTER TABLE `pay_merchant` ADD COLUMN `notify_mobile` VARCHAR(32) COMMENT '通知手机';

-- 代理商扩展表（添加通知字段）
ALTER TABLE `pay_agent` ADD COLUMN `notify_email` VARCHAR(128) COMMENT '通知邮箱';
ALTER TABLE `pay_agent` ADD COLUMN `notify_mobile` VARCHAR(32) COMMENT '通知手机';
```

### 7.4 邮件服务商对接

#### 7.4.1 SMTP配置项
| 配置项 | 说明 | 示例值 |
|-------|------|-------|
| smtp_host | SMTP服务器地址 | smtp.qq.com / smtp.163.com |
| smtp_port | 端口号 | 25 / 465(SSL) / 587(TLS) |
| smtp_username | 发件人账号 | example@qq.com |
| smtp_password | 授权码/密码 | xxxxxxxx |
| smtp_from_name | 发件人昵称 | 道谷科技支付平台 |
| smtp_encrypt | 加密方式 | none / ssl / tls |

#### 7.4.2 支持的邮件服务商
- QQ邮箱（smtp.qq.com）
- 163邮箱（smtp.163.com）
- 企业邮箱（自定义SMTP）
- SendGrid（国际）
- Amazon SES

### 7.5 短信服务商对接

#### 7.5.1 短信服务商配置
| 厂商 | 配置项 | 说明 |
|-----|-------|------|
| 阿里云短信 | AccessKeyId, AccessKeySecret, SignName | 国内主流 |
| 腾讯云短信 | SecretId, SecretKey, SignName, AppId | 国内主流 |
| 华为云短信 | App_Key, App_Secret, Signature | 国内企业 |
| 短信宝 | Username, Password | 成本优先 |
| Twilio | AccountSid, AuthToken, From | 国际短信 |

#### 7.5.2 短信模板变量
```
交易通知模板:
【{signName}】尊敬的商户{mchName}，您有一笔{amount}元的支付订单{orderNo}已{status}。

退款通知模板:
【{signName}】尊敬的商户{mchName}，您的退款申请{refundNo}，金额{amount}元，已{status}。

结算通知模板:
【{signName}】尊敬的商户{mchName}，您的账户于{settleDate}日结算{amount}元，已{status}。

风控预警模板:
【{signName}】预警通知：检测到异常交易，商户{mchName}，订单{orderNo}，金额{amount}元，请及时处理。
```

### 7.6 邮件模板变量

#### 7.6.1 支付成功通知模板
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1890ff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .info-table td { padding: 8px; border: 1px solid #ddd; }
        .label { font-weight: bold; width: 120px; background: #f5f5f5; }
        .footer { padding: 15px; text-align: center; color: #666; font-size: 12px; }
        .amount { color: #f5222d; font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>支付成功通知</h2>
        </div>
        <div class="content">
            <p>尊敬的 <strong>${mchName}</strong>：</p>
            <p>您好！您有一笔交易已完成支付，详情如下：</p>
            <table class="info-table">
                <tr>
                    <td class="label">订单号</td>
                    <td>${orderNo}</td>
                </tr>
                <tr>
                    <td class="label">支付金额</td>
                    <td class="amount">¥${amount}</td>
                </tr>
                <tr>
                    <td class="label">支付通道</td>
                    <td>${channelName}</td>
                </tr>
                <tr>
                    <td class="label">支付时间</td>
                    <td>${payTime}</td>
                </tr>
                <tr>
                    <td class="label">交易状态</td>
                    <td><span style="color: green;">支付成功</span></td>
                </tr>
            </table>
        </div>
        <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>如有疑问请联系客服。</p>
        </div>
    </div>
</body>
</html>
```

#### 7.6.2 结算通知模板
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #52c41a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .info-table td { padding: 8px; border: 1px solid #ddd; }
        .label { font-weight: bold; width: 120px; background: #f5f5f5; }
        .footer { padding: 15px; text-align: center; color: #666; font-size: 12px; }
        .amount { color: #52c41a; font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>结算成功通知</h2>
        </div>
        <div class="content">
            <p>尊敬的 <strong>${mchName}</strong>：</p>
            <p>您好！您的账户已成功结算，详情如下：</p>
            <table class="info-table">
                <tr>
                    <td class="label">结算单号</td>
                    <td>${settleNo}</td>
                </tr>
                <tr>
                    <td class="label">结算金额</td>
                    <td class="amount">¥${amount}</td>
                </tr>
                <tr>
                    <td class="label">手续费</td>
                    <td>¥${fee}</td>
                </tr>
                <tr>
                    <td class="label">实际到账</td>
                    <td class="amount">¥${actualAmount}</td>
                </tr>
                <tr>
                    <td class="label">银行账号</td>
                    <td>${bankAccount}（${bankName}）</td>
                </tr>
                <tr>
                    <td class="label">结算时间</td>
                    <td>${settleTime}</td>
                </tr>
            </table>
        </div>
        <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
        </div>
    </div>
</body>
</html>
```

### 7.7 定时任务配置

```yaml
# 通知相关定时任务
notify:
  tasks:
    # 日账单生成与发送（每日凌晨2点）
    daily-bill:
      cron: "0 0 2 * * ?"
      biz-date: yesterday  # 发送昨日账单
    
    # 月账单生成与发送（每月1日凌晨3点）
    monthly-bill:
      cron: "0 0 3 1 * ?"
      biz-date: last-month  # 发送上月账单
    
    # 发送失败重试（每5分钟）
    retry-failed:
      cron: "0 */5 * * * ?"
      max-retry: 3
      retry-interval: 300  # 秒
    
    # 通知记录清理（每月1日）
    cleanup:
      cron: "0 0 4 1 * ?"
      retain-days: 90  # 保留90天
```

### 7.8 通知API接口

#### 7.8.1 发送通知接口
```
POST /api/admin/notify/send
{
  "notifyType": "email",        // email/sms
  "sceneCode": "TRADE_SUCCESS",
  "receiverNo": "M10001",
  "receiverType": "merchant",
  "params": {
    "mchName": "测试商户",
    "orderNo": "ORDER123456",
    "amount": "100.00",
    "payTime": "2024-01-01 12:00:00"
  }
}
```

#### 7.8.2 批量发送接口
```
POST /api/admin/notify/batch-send
{
  "notifyType": "email",
  "sceneCode": "DAILY_BILL",
  "receivers": [
    {"no": "M10001", "type": "merchant"},
    {"no": "A10001", "type": "agent"}
  ],
  "params": {...}
}
```

#### 7.8.3 查询发送记录
```
GET /api/admin/notify/record/list
?notifyType=email
&sceneCode=TRADE_SUCCESS
&sendStatus=2
&startTime=2024-01-01
&endTime=2024-01-31
&pageNum=1
&pageSize=20
```

### 7.9 通知流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        通知触发流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  业务事件触发                                                    │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐    否    ┌────────────┐                       │
│  │ 检查订阅配置 │ ──────► │  不发送     │                       │
│  └──────┬──────┘         └────────────┘                       │
│         │ 是                                                      │
│         ▼                                                         │
│  ┌─────────────┐    否    ┌────────────┐                       │
│  │ 检查模板配置 │ ──────► │  记录错误   │                       │
│  └──────┬──────┘         └────────────┘                       │
│         │ 是                                                      │
│         ▼                                                         │
│  ┌─────────────┐    否    ┌────────────┐                       │
│  │ 检查渠道配置 │ ──────► │  记录错误   │                       │
│  └──────┬──────┘         └────────────┘                       │
│         │ 是                                                      │
│         ▼                                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │         渲染模板（填充变量）              │                   │
│  └──────────────────┬──────────────────────┘                   │
│                     ▼                                            │
│  ┌─────────────────────────────────────────┐                   │
│  │         调用邮件/短信服务商API            │                   │
│  └──────────────────┬──────────────────────┘                   │
│                     │                                            │
│         ┌───────────┴───────────┐                               │
│         ▼                       ▼                                │
│    ┌─────────┐            ┌─────────┐                          │
│    │  发送成功 │            │  发送失败 │                          │
│    └────┬────┘            └────┬────┘                          │
│         │                      │                                │
│         ▼                      ▼                                │
│  ┌─────────────┐         ┌─────────────┐                       │
│  │ 更新状态成功 │         │ 重试(N次)    │──┐                     │
│  └─────────────┘         └─────────────┘  │                     │
│                                       │                     │
│                                    超过N次                    │
│                                       │                      │
│                                       ▼                      │
│                                  ┌─────────────┐              │
│                                  │ 更新状态失败 │              │
│                                  │ 记录失败原因  │              │
│                                  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## 八、风控预警模块

### 8.1 预警规则配置

| 预警类型 | 触发条件 | 默认阈值 | 通知方式 |
|---------|---------|---------|---------|
| 单笔大额 | 单笔金额超过阈值 | 50000元 | 邮件+短信 |
| 日累计大额 | 当日累计金额超过阈值 | 200000元 | 邮件+短信 |
| 频繁失败 | N分钟内失败超过M次 | 5分钟内3次 | 邮件+短信 |
| 短时多笔 | N分钟内支付超过M笔 | 1分钟内5笔 | 邮件+短信 |
| 通道异常 | 连续失败N笔 | 10笔 | 邮件+短信 |
| 通道恢复 | 通道恢复通知 | - | 邮件+短信 |

### 8.2 预警处理流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      风控预警处理流程                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  交易事件                                                         │
│      │                                                           │
│      ▼                                                           │
│  ┌──────────────┐                                               │
│  │  规则引擎     │ ←── 加载预警规则配置                           │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  条件匹配     │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│    ┌────┴────┐                                                  │
│    │ 匹配结果  │                                                  │
│    └────┬────┘                                                  │
│    是   │   否                                                  │
│    ▼    │                                                       │
│  ┌──────────────┐                                               │
│  │  触发预警     │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────┐                  │
│  │  发送通知（邮件/短信）                     │                  │
│  │  记录预警日志                              │                  │
│  │  可选：冻结交易/延迟处理                   │                  │
│  └──────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

## 九、部署架构
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
