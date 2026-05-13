# DGKJ 支付平台 - AI 风控模块设计

> 本文档定义 AI 风控模块的架构设计和实现方案

## 一、模块概述

### 1.1 功能定位
基于机器学习的实时风控系统，对交易进行风险评估、欺诈检测和异常预警。

### 1.2 核心能力
- 实时风控决策（<100ms 响应）
- 机器学习模型服务
- 规则引擎 + AI 模型混合决策
- 风控画像和用户评分
- 异常交易检测

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         风控决策引擎                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ 规则引擎    │    │ AI 模型服务  │    │ 名单管理    │          │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘          │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             ▼                                    │
│                    ┌─────────────────┐                          │
│                    │   决策引擎       │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   放行      │    │   人工审核   │    │   拦截      │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        数据存储层                                │
├─────────────────────────────────────────────────────────────────┤
│  MySQL (风控规则、名单、案件)  │  Redis (缓存、限流)  │  文件   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、数据库设计

### 3.1 风控规则表

```sql
-- 风控规则表
CREATE TABLE `risk_rule` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `rule_code` VARCHAR(64) NOT NULL COMMENT '规则编码',
  `rule_name` VARCHAR(128) NOT NULL COMMENT '规则名称',
  `rule_type` VARCHAR(32) NOT NULL COMMENT '规则类型:amount/time/frequency/device/location/model',
  `rule_config` JSON NOT NULL COMMENT '规则配置',
  `risk_level` TINYINT NOT NULL COMMENT '风险等级:1-低,2-中,3-高,4-极高',
  `action` VARCHAR(32) NOT NULL COMMENT '处置动作:allow/review/block',
  `priority` INT DEFAULT 100 COMMENT '优先级(越小越高)',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-禁用,1-启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_rule_code`(`rule_code`)
);

-- 规则配置示例
-- amount: {"min": 50000, "max": 100000}
-- frequency: {"window": 3600, "maxCount": 5}
-- model: {"modelId": "fraud_detection_v1", "threshold": 0.8}
```

### 3.2 风险名单表

```sql
-- 风险名单表
CREATE TABLE `risk_blacklist` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `list_type` VARCHAR(32) NOT NULL COMMENT '名单类型:ip/device/phone/idcard/bankcard',
  `list_value` VARCHAR(256) NOT NULL COMMENT '名单值',
  `risk_level` TINYINT NOT NULL COMMENT '风险等级',
  `reason` VARCHAR(512) COMMENT '加入原因',
  `source` VARCHAR(64) COMMENT '来源',
  `expire_time` DATETIME COMMENT '过期时间(NULL表示永久)',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-移除,1-有效',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by` VARCHAR(64) COMMENT '创建人',
  UNIQUE KEY `uk_list_type_value`(`list_type`, `list_value`),
  KEY `idx_expire`(`expire_time`),
  KEY `idx_status`(`status`)
);
```

### 3.3 风控决策记录表

```sql
-- 风控决策记录表
CREATE TABLE `risk_decision` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `decision_id` VARCHAR(64) NOT NULL COMMENT '决策ID',
  `order_no` VARCHAR(64) COMMENT '关联订单号',
  `mch_no` VARCHAR(32) NOT NULL COMMENT '商户号',
  `risk_score` DECIMAL(5,2) COMMENT '风险评分(0-100)',
  `risk_level` TINYINT COMMENT '风险等级',
  `decision` VARCHAR(32) NOT NULL COMMENT '决策结果:allow/review/block',
  `matched_rules` JSON COMMENT '匹配的规则',
  `ai_score` DECIMAL(5,2) COMMENT 'AI模型评分',
  `features` JSON COMMENT '特征数据',
  `request_data` JSON COMMENT '请求数据',
  `response_time` INT COMMENT '决策耗时(ms)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_decision_id`(`decision_id`),
  KEY `idx_order_no`(`order_no`),
  KEY `idx_mch_no`(`mch_no`),
  KEY `idx_created_at`(`created_at`)
);
```

### 3.4 AI 模型配置表

```sql
-- AI 模型配置表
CREATE TABLE `ai_model_config` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `model_id` VARCHAR(64) NOT NULL COMMENT '模型ID',
  `model_name` VARCHAR(128) NOT NULL COMMENT '模型名称',
  `model_type` VARCHAR(32) NOT NULL COMMENT '模型类型:classification/regression/anomaly',
  `model_version` VARCHAR(32) NOT NULL COMMENT '模型版本',
  `model_path` VARCHAR(256) COMMENT '模型文件路径',
  `model_config` JSON COMMENT '模型配置',
  `threshold` DECIMAL(5,4) COMMENT '决策阈值',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-训练中,1-已部署,2-已下线',
  `accuracy` DECIMAL(5,4) COMMENT '准确率',
  `precision` DECIMAL(5,4) COMMENT '精确率',
  `recall` DECIMAL(5,4) COMMENT '召回率',
  `deployed_at` DATETIME COMMENT '部署时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_model_id_version`(`model_id`, `model_version`)
);
```

---

## 四、AI 模型设计

### 4.1 欺诈检测模型

**模型类型**: 二分类 + 概率输出

**输入特征**:
```json
{
  "amount": 10000.00,
  "device_fingerprint": "xxx",
  "ip": "192.168.1.1",
  "phone": "13800138000",
  "idcard_hash": "xxx",
  "hour_of_day": 14,
  "day_of_week": 3,
  "is_first_transaction": false,
  "transaction_frequency_1h": 3,
  "transaction_frequency_24h": 10,
  "avg_transaction_amount": 5000.00,
  "channel": "wechat",
  "mch_category": "retail",
  "historical_fraud_rate": 0.02
}
```

**输出**:
```json
{
  "fraud_probability": 0.85,
  "risk_level": "HIGH",
  "top_factors": [
    {"factor": "amount", "contribution": 0.3},
    {"factor": "frequency", "contribution": 0.25},
    {"factor": "device", "contribution": 0.2}
  ],
  "recommendation": "REVIEW"
}
```

### 4.2 异常检测模型

**模型类型**: 无监督异常检测 (Isolation Forest / LSTM)

**检测场景**:
- 交易金额异常（偏离历史均值）
- 交易频率异常
- 设备/位置异常
- 行为模式异常

---

## 五、核心服务实现

### 5.1 目录结构

```
server/src/modules/risk/
├── controller.ts          # 风控 API
├── routes.ts              # 路由定义
├── risk.service.ts        # 核心风控服务
├── rule-engine.ts         # 规则引擎
├── ai-model.service.ts    # AI 模型服务
├── blacklist.service.ts   # 名单服务
├── decision.service.ts    # 决策服务
├── entity/
│   ├── risk-rule.entity.ts
│   ├── risk-blacklist.entity.ts
│   ├── risk-decision.entity.ts
│   └── ai-model-config.entity.ts
└── types.ts               # 类型定义
```

### 5.2 核心服务代码结构

```typescript
// risk.service.ts

export class RiskService {
  // 实时风控决策
  async evaluateRisk(params: RiskEvaluateParams): Promise<RiskDecision> {
    const startTime = Date.now();
    
    // 1. 名单检查 (最快)
    const listCheck = await this.blacklistService.check(params);
    if (listCheck.blocked) {
      return this.makeDecision('BLOCK', 100, ['blacklist'], startTime);
    }
    
    // 2. 规则引擎评估
    const ruleResults = await this.ruleEngine.evaluate(params);
    if (ruleResults.shouldBlock) {
      return this.makeDecision('BLOCK', ruleResults.score, ruleResults.matchedRules, startTime);
    }
    if (ruleResults.shouldReview) {
      return this.makeDecision('REVIEW', ruleResults.score, ruleResults.matchedRules, startTime);
    }
    
    // 3. AI 模型评估 (异步，可选)
    const aiResult = await this.aiModelService.predict(params);
    
    // 4. 综合决策
    const finalScore = this.calculateFinalScore(ruleResults, aiResult);
    const finalDecision = this.makeFinalDecision(finalScore);
    
    return this.makeDecision(finalDecision, finalScore, [], startTime);
  }
  
  // 计算最终风险评分
  private calculateFinalScore(rules: RuleResult, ai: AIResult): number {
    // 加权平均: 规则 40% + AI 60%
    const ruleWeight = 0.4;
    const aiWeight = 0.6;
    return rules.score * ruleWeight + ai.score * aiWeight;
  }
}
```

---

## 六、API 接口

### 6.1 风控评估

```
POST /basic-api/risk/evaluate
{
  "orderNo": "ORDER123456",
  "mchNo": "M10001",
  "amount": 10000.00,
  "channel": "wechat",
  "payer": {
    "phone": "13800138000",
    "ip": "192.168.1.1",
    "deviceId": "device_xxx"
  }
}
```

响应:
```json
{
  "code": 0,
  "data": {
    "decisionId": "RD2024010100001",
    "decision": "ALLOW",
    "riskScore": 25,
    "riskLevel": "LOW",
    "decisionTime": 45
  }
}
```

### 6.2 名单管理

```
POST /basic-api/risk/blacklist/add
GET /basic-api/risk/blacklist/list
DELETE /basic-api/risk/blacklist/:id
```

### 6.3 规则管理

```
POST /basic-api/risk/rule
GET /basic-api/risk/rule/list
PUT /basic-api/risk/rule/:id
DELETE /basic-api/risk/rule/:id
```

---

## 七、规则模板

### 7.1 内置规则

| 规则编码 | 规则名称 | 条件 | 动作 |
|---------|---------|------|------|
| AMOUNT_SINGLE_MAX | 单笔金额上限 | amount > 50000 | REVIEW |
| AMOUNT_DAY_MAX | 当日累计金额 | dayAmount > 200000 | BLOCK |
| FREQ_HOUR_MAX | 小时频率限制 | 1h内 > 10笔 | BLOCK |
| DEVICE_DIFF_IP | 设备多IP | 同设备 > 3个IP | REVIEW |
| IP_DIFF_DEVICE | IP多设备 | 同IP > 5个设备 | REVIEW |
| NEW_DEVICE | 新设备首笔 | 首次交易设备 | REVIEW |
| HIGH_RISK_AREA | 高风险地区 | 名单地区 | BLOCK |
| NIGHT_TRANSACTION | 夜间交易 | 23:00-05:00 & amount > 5000 | REVIEW |

---

## 八、性能要求

- 决策延迟: P99 < 100ms
- 可用性: 99.9%
- 日处理量: 100万+ 笔
- 模型更新: 支持热更新

---

## 九、实施计划

### Phase 1: 基础风控 (2周)
- 规则引擎实现
- 名单管理
- 基础规则配置
- 决策记录

### Phase 2: AI 模型 (4周)
- 特征工程
- 模型训练
- 模型部署
- A/B 测试

### Phase 3: 持续优化 (持续)
- 模型迭代
- 规则优化
- 监控告警
- 报表分析
