# DGKJ 支付平台 - 商户轮转池管理系统

## 更新日期：2026-05-13

---

## 一、系统概述

### 1.1 业务背景

商户轮转池是聚合支付平台的核心能力，用于：
- **风险分散**: 避免单商户承接过多交易导致风控
- **通道冗余**: 某通道故障时自动切换到备用通道
- **负载均衡**: 按配置权重均匀分配交易
- **成本优化**: 选择最优费率的通道

### 1.2 核心问题

当前系统存在的问题：
1. `pay.service.ts` 中 `selectChannel()` 使用硬编码映射，未使用数据库配置
2. 商户额度/配额 (`maxAmount`) 存在但未被校验
3. 缺少健康检查和熔断机制
4. 缺少智能重试和降级策略
5. 通道策略 (`PoolStrategy`) 配置了但未被执行引擎使用

---

## 二、业务模型

### 2.1 通道层级结构

```
通道 (Channel)
  │
  ├── 通道商户 (ChannelMch)  ── 每个通道可以有多个商户号
  │     ├── mchNo: M001 (商户号)
  │     ├── mchName: "微信商户A"
  │     ├── appId: "wx123..."
  │     ├── mchId: "1234567890"
  │     ├── apiKey: "..."
  │     ├── status: 1 (启用)
  │     ├── quota: 1000000 (日限额)
  │     ├── usedQuota: 350000 (已用)
  │     └── weight: 70 (权重)
  │
  ├── 通道商户 (ChannelMch)  ── 同一通道的多个商户
  │     ├── mchNo: M002 (商户号)
  │     ├── mchName: "微信商户B"
  │     └── weight: 30
  │
  └── 路由策略 (ChannelRoute)
        ├── ruleName: "小额优先"
        ├── conditions: [{"field": "amount", "op": "<=", "value": 1000}]
        └── channels: ["WX_JSAPI"]
```

### 2.2 商户轮转模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **一对一** | 指定商户专门处理特定交易 | 高风险交易、特定商户合作 |
| **一对多** | 一个交易类别对应多个商户池 | 大多数常规交易 |
| **多对多** | 多个通道 + 多个商户智能分配 | 复杂业务场景 |
| **主备模式** | 主商户故障自动切换到备用 | 高可用要求 |
| **混合模式** | 根据金额/通道/商户组合策略 | 生产环境推荐 |

### 2.3 路由决策流程

```
┌──────────────────────────────────────────────────────────────────┐
│                       支付请求进入                                 │
│   (payWay, amount, mchNo, cardInfo, userId, bizType, ...)        │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Step 1: API 强制指定检查                                          │
│  - 传入 merchant_id 参数? → 直接使用该商户                          │
│  - 未指定? → 进入自动路由                                           │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Step 2: 通道可用性过滤                                            │
│  - 通道状态是否启用                                                 │
│  - 通道是否支持当前支付方式 (payWay)                                │
│  - 通道是否支持当前卡类型 (BIN)                                     │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Step 3: 商户配额检查                                              │
│  - 日配额是否超限                                                  │
│  - 单笔限额检查 (minAmount ~ maxAmount)                            │
│  - 剩余配额是否足够支付当前金额                                     │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Step 4: 熔断器检查                                                │
│  - 商户当前健康状态? (成功率 >= 95%)                                │
│  - 响应延迟是否正常? (p99 < 3s)                                    │
│  - 连续失败次数是否超限? (>= 5次则熔断)                             │
│  - 熔断中? → 跳过该商户                                            │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Step 5: 业务规则匹配                                              │
│  - 金额范围规则 (amount < 1000 → 微信, amount >= 5000 → 银联)      │
│  - 时段规则 (工作时间 → A商户, 夜间 → B商户)                        │
│  - 星期规则 (工作日/周末不同策略)                                   │
│  - 通道互斥规则 (某些商户不能同时使用)                               │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Step 6: 特殊优先级                                                │
│  - BIN 黑名单 (某些 BIN 禁止某些商户)                                │
│  - 用户亲和性 (返回用户优先使用上次成功的商户)                        │
│  - 商户分组 (同一客户的交易尽量路由到同一商户组)                      │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Step 7: 轮转算法选择                                              │
│  - 平滑加权轮转 (Smooth Weighted Round Robin)                       │
│  - 最低成本选择 (Least Cost Routing)                               │
│  - 容量感知轮转 (Capacity-Aware)                                   │
│  - 随机加权 (当前已有实现)                                          │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Step 8: 执行 + 结果记录                                           │
│  - 调用选中商户                                                     │
│  - 成功? → 更新配额、记录成功、记录权重                             │
│  - 失败? → 熔断器计数、降级重试、记录失败                           │
│  - 拒付? → 标记商户、通知风控                                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 三、数据库设计

### 3.1 通道商户表 (已有，需扩展)

```sql
ALTER TABLE `pay_channel_mch` ADD COLUMN `daily_quota` DECIMAL(14,2) DEFAULT 0 COMMENT '日限额';
ALTER TABLE `pay_channel_mch` ADD COLUMN `daily_used` DECIMAL(14,2) DEFAULT 0 COMMENT '当日已用';
ALTER TABLE `pay_channel_mch` ADD COLUMN `single_min_amount` DECIMAL(14,2) DEFAULT 0 COMMENT '单笔最小限额';
ALTER TABLE `pay_channel_mch` ADD COLUMN `single_max_amount` DECIMAL(14,2) DEFAULT 0 COMMENT '单笔最大限额';
ALTER TABLE `pay_channel_mch` ADD COLUMN `weight` INT DEFAULT 100 COMMENT '轮转权重';
ALTER TABLE `pay_channel_mch` ADD COLUMN `priority` INT DEFAULT 100 COMMENT '优先级(越小越高)';
ALTER TABLE `pay_channel_mch` ADD COLUMN `biz_types` VARCHAR(256) DEFAULT NULL COMMENT '支持的业务类型(JSON)';
ALTER TABLE `pay_channel_mch` ADD COLUMN `exclude_bins` VARCHAR(512) DEFAULT NULL COMMENT '排除的BIN(JSON)';
ALTER TABLE `pay_channel_mch` ADD COLUMN `channel_status` TINYINT DEFAULT 1 COMMENT '通道状态:1-正常,2-熔断,3-维护';
```

### 3.2 商户健康状态表

```sql
CREATE TABLE `pay_channel_mch_health` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `mch_no` VARCHAR(64) NOT NULL COMMENT '商户号',
  `channel_code` VARCHAR(32) NOT NULL COMMENT '通道编码',
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `total_count` INT DEFAULT 0 COMMENT '总交易笔数',
  `success_count` INT DEFAULT 0 COMMENT '成功笔数',
  `fail_count` INT DEFAULT 0 COMMENT '失败笔数',
  `decline_count` INT DEFAULT 0 COMMENT '拒付笔数',
  `success_rate` DECIMAL(5,4) DEFAULT 0 COMMENT '成功率',
  `avg_latency` INT DEFAULT 0 COMMENT '平均延迟(ms)',
  `p99_latency` INT DEFAULT 0 COMMENT 'P99延迟(ms)',
  `last_success_time` DATETIME COMMENT '最后成功时间',
  `last_fail_time` DATETIME COMMENT '最后失败时间',
  `consecutive_fails` INT DEFAULT 0 COMMENT '连续失败次数',
  `circuit_status` TINYINT DEFAULT 1 COMMENT '熔断状态:1-关闭,2-半开,3-打开',
  `circuit_opened_at` DATETIME COMMENT '熔断打开时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_mch_date`(`mch_no`, `stat_date`),
  KEY `idx_circuit`(`circuit_status`),
  KEY `idx_success_rate`(`success_rate`)
);
```

### 3.3 路由策略表

```sql
CREATE TABLE `pay_route_strategy` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `strategy_code` VARCHAR(64) NOT NULL COMMENT '策略编码',
  `strategy_name` VARCHAR(128) NOT NULL COMMENT '策略名称',
  `strategy_type` VARCHAR(32) NOT NULL COMMENT '策略类型:amount/time/biztype/bin/roundrobin',
  `conditions` JSON NOT NULL COMMENT '匹配条件',
  `action_type` VARCHAR(32) NOT NULL COMMENT '动作类型:assign_channel/assign_mch/exclude_channel/exclude_mch',
  `action_value` VARCHAR(256) NOT NULL COMMENT '动作值(channel_code或mch_no列表)',
  `priority` INT DEFAULT 100 COMMENT '优先级(越小越高)',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-禁用,1-启用',
  `remark` VARCHAR(512) COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_strategy_code`(`strategy_code`)
);

-- 策略条件示例
-- amount: {"min": 0, "max": 1000, "op": "<="}
-- time: {"startHour": 22, "endHour": 6}
-- weekDay: {"days": [0, 6]}  // 周日、周六
-- bin: {"prefixes": ["4", "5"], "exclude": true}
-- bizType: {"types": ["gambling", "gaming"]}
```

### 3.4 路由日志表

```sql
CREATE TABLE `pay_route_log` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `route_id` VARCHAR(64) NOT NULL COMMENT '路由ID',
  `order_no` VARCHAR(64) COMMENT '订单号',
  `biz_type` VARCHAR(32) COMMENT '业务类型',
  `amount` DECIMAL(14,2) COMMENT '交易金额',
  `pay_way` VARCHAR(32) COMMENT '支付方式',
  `requested_channel` VARCHAR(32) COMMENT '请求通道',
  `selected_channel` VARCHAR(32) COMMENT '选中通道',
  `selected_mch` VARCHAR(64) COMMENT '选中商户',
  `selection_reason` VARCHAR(256) COMMENT '选择原因',
  `candidates_count` INT DEFAULT 0 COMMENT '候选商户数',
  `route_time_ms` INT COMMENT '路由耗时(ms)',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-待支付,1-成功,2-失败,3-拒付',
  `fail_reason` VARCHAR(512) COMMENT '失败原因',
  `retry_count` INT DEFAULT 0 COMMENT '重试次数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_order_no`(`order_no`),
  KEY `idx_mch`(`selected_mch`),
  KEY `idx_created_at`(`created_at`),
  KEY `idx_status`(`status`)
);
```

### 3.5 用户-商户亲和表

```sql
CREATE TABLE `pay_user_mch_affinity` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` VARCHAR(64) NOT NULL COMMENT '用户ID',
  `user_id_type` VARCHAR(32) NOT NULL COMMENT '用户ID类型:device/customer/phone',
  `channel_code` VARCHAR(32) NOT NULL COMMENT '通道编码',
  `mch_no` VARCHAR(64) NOT NULL COMMENT '商户号',
  `success_count` INT DEFAULT 0 COMMENT '成功次数',
  `last_success_time` DATETIME COMMENT '最后成功时间',
  `affinity_score` DECIMAL(5,4) DEFAULT 0 COMMENT '亲和度分数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_channel`(`user_id`, `user_id_type`, `channel_code`),
  KEY `idx_affinity`(`affinity_score`)
);
```

### 3.6 商户分组表

```sql
CREATE TABLE `pay_mch_group` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `group_code` VARCHAR(64) NOT NULL COMMENT '分组编码',
  `group_name` VARCHAR(128) NOT NULL COMMENT '分组名称',
  `group_type` VARCHAR(32) NOT NULL COMMENT '分组类型:customer/product/risk_level',
  `description` VARCHAR(512) COMMENT '分组描述',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-禁用,1-启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_group_code`(`group_code`)
);

CREATE TABLE `pay_mch_group_member` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `group_code` VARCHAR(64) NOT NULL COMMENT '分组编码',
  `channel_code` VARCHAR(32) NOT NULL COMMENT '通道编码',
  `mch_no` VARCHAR(64) NOT NULL COMMENT '商户号',
  `member_weight` INT DEFAULT 100 COMMENT '组内权重',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_group_mch`(`group_code`, `mch_no`),
  KEY `idx_group`(`group_code`)
);
```

---

## 四、核心服务设计

### 4.1 目录结构

```
server/src/modules/pool/
├── controller.ts           # API 接口
├── routes.ts             # 路由定义
├── pool.service.ts       # 轮转池核心服务
├── router.service.ts     # 路由决策引擎
├── health.service.ts     # 健康检查服务
├── circuit-breaker.ts    # 熔断器实现
├── affinity.service.ts    # 亲和性服务
├── quota.service.ts      # 配额管理服务
├── entity/
│   ├── pool-strategy.entity.ts
│   ├── channel-mch-health.entity.ts
│   ├── route-strategy.entity.ts
│   ├── route-log.entity.ts
│   ├── user-mch-affinity.entity.ts
│   └── mch-group.entity.ts
└── types.ts              # 类型定义
```

### 4.2 熔断器实现

```typescript
// circuit-breaker.ts

export enum CircuitState {
  CLOSED = 1,   // 正常：流量正常通过
  HALF_OPEN = 2, // 半开：允许部分流量通过进行探测
  OPEN = 3,      // 打开：完全拒绝请求
}

interface CircuitConfig {
  failureThreshold: number;      // 失败阈值 (默认 5 次)
  successThreshold: number;      // 成功阈值 (默认 2 次) - 半开转关闭
  timeout: number;               // 熔断超时 (默认 60 秒)
  halfOpenMaxCalls: number;      // 半开状态最大并发 (默认 3 个)
}

interface CircuitMetrics {
  failures: number;
  successes: number;
  lastFailureTime: number;
  state: CircuitState;
  halfOpenCalls: number;
}

export class CircuitBreaker {
  private metrics = new Map<string, CircuitMetrics>();
  private config: CircuitConfig;

  constructor(config: Partial<CircuitConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 2,
      timeout: config.timeout ?? 60000,
      halfOpenMaxCalls: config.halfOpenMaxCalls ?? 3,
    };
  }

  // 检查是否可以执行
  async canExecute(mchNo: string): Promise<boolean> {
    const metrics = this.getMetrics(mchNo);

    switch (metrics.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // 检查超时是否到期
        if (Date.now() - metrics.lastFailureTime >= this.config.timeout) {
          this.transitionTo(mchNo, CircuitState.HALF_OPEN);
          return this.canExecute(mchNo);
        }
        return false;

      case CircuitState.HALF_OPEN:
        // 限制并发调用数
        if (metrics.halfOpenCalls >= this.config.halfOpenMaxCalls) {
          return false;
        }
        metrics.halfOpenCalls++;
        return true;

      default:
        return false;
    }
  }

  // 记录成功
  async recordSuccess(mchNo: string): Promise<void> {
    const metrics = this.getMetrics(mchNo);
    metrics.successes++;
    metrics.failures = 0;  // 重置失败计数

    if (metrics.state === CircuitState.HALF_OPEN) {
      if (metrics.successes >= this.config.successThreshold) {
        this.transitionTo(mchNo, CircuitState.CLOSED);
      }
    }
  }

  // 记录失败
  async recordFailure(mchNo: string): Promise<void> {
    const metrics = this.getMetrics(mchNo);
    metrics.failures++;
    metrics.successes = 0;
    metrics.lastFailureTime = Date.now();

    if (metrics.state === CircuitState.CLOSED) {
      if (metrics.failures >= this.config.failureThreshold) {
        this.transitionTo(mchNo, CircuitState.OPEN);
      }
    } else if (metrics.state === CircuitState.HALF_OPEN) {
      // 任何失败都立即回到 OPEN
      this.transitionTo(mchNo, CircuitState.OPEN);
    }
  }

  // 获取熔断状态
  getState(mchNo: string): CircuitState {
    return this.getMetrics(mchNo).state;
  }

  // 获取指标
  getMetrics(mchNo: string): CircuitMetrics {
    if (!this.metrics.has(mchNo)) {
      this.metrics.set(mchNo, {
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        state: CircuitState.CLOSED,
        halfOpenCalls: 0,
      });
    }
    return this.metrics.get(mchNo)!;
  }

  // 手动重置
  reset(mchNo: string): void {
    this.transitionTo(mchNo, CircuitState.CLOSED);
  }

  private transitionTo(mchNo: string, state: CircuitState): void {
    const metrics = this.getMetrics(mchNo);
    const prevState = metrics.state;
    metrics.state = state;

    if (state === CircuitState.HALF_OPEN) {
      metrics.halfOpenCalls = 0;
    } else if (state === CircuitState.CLOSED) {
      metrics.failures = 0;
      metrics.successes = 0;
      metrics.halfOpenCalls = 0;
    }

    // 发送状态变更通知
    if (prevState !== state) {
      console.log(`[CircuitBreaker] ${mchNo}: ${CircuitState[prevState]} → ${CircuitState[state]}`);
    }
  }
}
```

### 4.3 轮转池服务

```typescript
// pool.service.ts

export class PoolService {
  private circuitBreaker = new CircuitBreaker();
  private roundRobinCounters = new Map<string, number>();  // 平滑加权计数

  /**
   * 选择最优商户
   */
  async selectMerchant(params: SelectMerchantParams): Promise<SelectResult> {
    const startTime = Date.now();
    const candidates = await this.getAvailableMerchants(params);
    
    if (candidates.length === 0) {
      return { success: false, error: 'NO_AVAILABLE_MERCHANT' };
    }

    // 根据策略排序
    const sorted = this.applySorting(params, candidates);
    
    // 选择最优商户
    const selected = sorted[0];
    
    // 更新轮转计数
    this.updateRoundRobinCounter(selected.mchNo, selected.weight);
    
    return {
      success: true,
      channelCode: selected.channelCode,
      mchNo: selected.mchNo,
      routeTime: Date.now() - startTime,
    };
  }

  /**
   * 获取可用商户列表
   */
  private async getAvailableMerchants(params: SelectMerchantParams): Promise<ChannelMch[]> {
    const { payWay, amount, bin, bizType, excludeMchNos = [] } = params;
    
    // 1. 从数据库获取所有启用的商户
    const allMerchants = await ChannelMch.find({ where: { status: 1 } });
    
    const available: ChannelMch[] = [];
    
    for (const mch of allMerchants) {
      // 2. 检查熔断器
      if (this.circuitBreaker.getState(mch.mchNo) === CircuitState.OPEN) {
        continue;
      }
      
      // 3. 检查配额
      if (mch.dailyUsed + amount > mch.dailyQuota) {
        continue;
      }
      
      // 4. 检查单笔限额
      if (amount < mch.singleMinAmount || amount > mch.singleMaxAmount) {
        continue;
      }
      
      // 5. 检查 BIN 排除
      if (mch.excludeBins && this.isBinExcluded(bin, mch.excludeBins)) {
        continue;
      }
      
      // 6. 检查业务类型
      if (mch.bizTypes && !this.isBizTypeSupported(bizType, mch.bizTypes)) {
        continue;
      }
      
      // 7. 排除指定商户
      if (excludeMchNos.includes(mch.mchNo)) {
        continue;
      }
      
      available.push(mch);
    }
    
    return available;
  }

  /**
   * 平滑加权轮转算法
   * 
   * 原理：
   * - 每个商户有一个"当前权重"，初始等于配置权重
   * - 每次选择时，选当前权重最高的商户
   * - 选中后，当前权重 -= 所有商户权重之和
   * - 这样保证长期来看，每个商户被选中的概率 = weight / sum(weights)
   */
  private applySorting(params: SelectMerchantParams, candidates: ChannelMch[]): ChannelMch[] {
    const sumWeight = candidates.reduce((sum, m) => sum + m.weight, 0);
    
    // 更新并计算每个商户的当前权重
    return candidates
      .map(mch => {
        const currentWeight = this.getCurrentWeight(mch.mchNo) + mch.weight;
        this.setCurrentWeight(mch.mchNo, currentWeight);
        return { mch, currentWeight };
      })
      .sort((a, b) => b.currentWeight - a.currentWeight)
      .map(item => {
        // 选中后减去总权重
        const newWeight = item.currentWeight - sumWeight;
        this.setCurrentWeight(item.mch.mchNo, newWeight);
        return item.mch;
      });
  }

  /**
   * 记录交易结果
   */
  async recordResult(params: RecordResultParams): Promise<void> {
    const { mchNo, success, latency, failReason } = params;
    
    // 更新配额
    if (success) {
      await this.quotaService.consume(mchNo, params.amount);
      await this.circuitBreaker.recordSuccess(mchNo);
      await this.affinityService.recordSuccess(params);
    } else {
      await this.circuitBreaker.recordFailure(mchNo);
      await this.healthService.recordFailure(mchNo, latency, failReason);
    }
    
    // 更新健康状态
    await this.healthService.updateStats(mchNo, { success, latency });
  }

  private getCurrentWeight(mchNo: string): number {
    return this.roundRobinCounters.get(mchNo) || 0;
  }

  private setCurrentWeight(mchNo: string, weight: number): void {
    this.roundRobinCounters.set(mchNo, weight);
  }
}
```

### 4.4 智能重试策略

```typescript
// retry.service.ts

export class RetryStrategy {
  /**
   * 获取重试时的商户排除列表
   */
  async getExcludedMerchants(params: RetryParams): Promise<string[]> {
    const { failedMchNo, channelCode, failType, retryCount } = params;
    const excluded: Set<string> = new Set();

    // 1. 排除刚才失败的商户
    excluded.add(failedMchNo);

    // 2. 排除相同通道的商户 (如果失败原因是通道级问题)
    if (this.isChannelLevelFailure(failType)) {
      const sameChannelMchs = await this.getMerchantsByChannel(channelCode);
      sameChannelMchs.forEach(m => excluded.add(m));
    }

    // 3. 重试次数越多，排除越多的商户 (防止"retry bombing")
    if (retryCount >= 2) {
      const failedChannel = await this.getChannelInfo(channelCode);
      if (failedChannel.processor) {
        // 排除同一 processor 的所有商户
        const sameProcessorMchs = await this.getMerchantsByProcessor(failedChannel.processor);
        sameProcessorMchs.forEach(m => excluded.add(m));
      }
    }

    // 4. 高风险重试只允许"高可靠性"商户
    if (failType === FailType.FRAUD || failType === FailType.RISK) {
      const safeMerchants = await this.getSafeMerchants();
      // 只允许这些商户
      const allMerchants = await this.getAllMerchants();
      allMerchants.forEach(m => {
        if (!safeMerchants.includes(m.mchNo)) {
          excluded.add(m.mchNo);
        }
      });
    }

    return Array.from(excluded);
  }

  private isChannelLevelFailure(failType: FailType): boolean {
    // 这些失败类型通常是通道级别的问题，换商户可能没用
    return [
      FailType.CHANNEL_UNAVAILABLE,
      FailType.CHANNEL_TIMEOUT,
      FailType.CHANNEL_ERROR,
      FailType.DAILY_LIMIT_EXCEEDED,
    ].includes(failType);
  }
}
```

### 4.5 亲和性服务

```typescript
// affinity.service.ts

export class AffinityService {
  /**
   * 获取用户偏好的商户
   */
  async getPreferredMerchant(params: AffinityParams): Promise<string | null> {
    const { userId, userIdType, channelCode } = params;
    
    // 查询亲和表
    const affinity = await UserMchAffinity.findOne({
      where: { userId, userIdType, channelCode },
      order: { affinityScore: 'DESC' },
    });
    
    if (!affinity || affinity.successCount < 3) {
      return null;  // 样本太少，不考虑亲和性
    }
    
    // 检查该商户当前是否可用
    const isAvailable = await this.isMerchantAvailable(affinity.mchNo);
    if (!isAvailable) {
      return null;  // 商户不可用，跳过
    }
    
    return affinity.mchNo;
  }

  /**
   * 记录成功交易，更新亲和度
   */
  async recordSuccess(params: RecordParams): Promise<void> {
    const { userId, userIdType, channelCode, mchNo, amount } = params;
    
    // 查找或创建亲和记录
    let affinity = await UserMchAffinity.findOne({
      where: { userId, userIdType, channelCode, mchNo },
    });
    
    if (!affinity) {
      affinity = UserMchAffinity.create({
        userId,
        userIdType,
        channelCode,
        mchNo,
        successCount: 0,
        affinityScore: 0,
      });
    }
    
    // 更新统计
    affinity.successCount++;
    affinity.lastSuccessTime = new Date();
    
    // 亲和度 = 成功次数 / (成功次数 + 失败次数)，归一化到 0-1
    const totalAttempts = affinity.successCount; // 简化计算
    affinity.affinityScore = Math.min(affinity.successCount / 10, 1);  // 上限 1.0
    
    await affinity.save();
  }

  /**
   * 更新失败记录
   */
  async recordFailure(params: RecordParams): Promise<void> {
    // 降低亲和度，但不影响成功次数
    const affinity = await UserMchAffinity.findOne({
      where: { userId: params.userId, channelCode: params.channelCode, mchNo: params.mchNo },
    });
    
    if (affinity) {
      affinity.affinityScore = Math.max(affinity.affinityScore - 0.1, 0);
      await affinity.save();
    }
  }
}
```

---

## 五、API 接口

### 5.1 轮转池管理

```
# 获取通道商户列表
GET /basic-api/pool/channel-mch/list

# 更新通道商户配置
PUT /basic-api/pool/channel-mch/:id

# 手动切换商户状态
POST /basic-api/pool/channel-mch/:mchNo/switch
{
  "status": 1  // 1-启用, 2-熔断, 3-维护
}

# 获取商户健康状态
GET /basic-api/pool/health/:mchNo

# 重置熔断器
POST /basic-api/pool/circuit-breaker/:mchNo/reset

# 获取路由日志
GET /basic-api/pool/route-log/list?page=1&pageSize=20&startDate=2024-01-01&endDate=2024-01-31
```

### 5.2 路由策略管理

```
# 获取路由策略列表
GET /basic-api/pool/strategy/list

# 创建路由策略
POST /basic-api/pool/strategy
{
  "strategyCode": "AMOUNT_WECHAT",
  "strategyName": "小额微信优先",
  "strategyType": "amount",
  "conditions": {"min": 0, "max": 1000},
  "actionType": "assign_channel",
  "actionValue": "WX_JSAPI",
  "priority": 10
}

# 更新路由策略
PUT /basic-api/pool/strategy/:id

# 删除路由策略
DELETE /basic-api/pool/strategy/:id
```

### 5.3 商户分组管理

```
# 获取分组列表
GET /basic-api/pool/group/list

# 创建分组
POST /basic-api/pool/group
{
  "groupCode": "VIP_MERCHANTS",
  "groupName": "VIP 商户组",
  "groupType": "customer",
  "members": [
    {"channelCode": "WX_JSAPI", "mchNo": "M001", "memberWeight": 100},
    {"channelCode": "WX_JSAPI", "mchNo": "M002", "memberWeight": 50}
  ]
}

# 分配商户到分组
POST /basic-api/pool/group/:groupCode/members
{
  "members": [{"channelCode": "ALI_QR", "mchNo": "M003"}]
}
```

### 5.4 模拟路由

```
# 模拟路由选择
POST /basic-api/pool/simulate
{
  "payWay": "WX_JSAPI",
  "amount": 500,
  "bin": "621234",
  "bizType": "retail",
  "userId": "user_123",
  "userIdType": "device"
}

# 响应
{
  "code": 0,
  "data": {
    "selectedMchNo": "M001",
    "selectedChannel": "WX_JSAPI",
    "candidates": [
      {"mchNo": "M001", "weight": 70, "reason": "平滑加权选中"},
      {"mchNo": "M002", "weight": 30, "reason": "权重较低"}
    ],
    "excluded": [
      {"mchNo": "M003", "reason": "配额已满"},
      {"mchNo": "M004", "reason": "熔断中"}
    ]
  }
}
```

---

## 六、前端页面设计

### 6.1 通道商户管理页面

```
路径: /pool/channel-mch
功能:
- 商户列表 (分页、筛选)
- 商户配置 (权重、配额、限额)
- 健康状态监控 (成功率、延迟、熔断状态)
- 快速操作 (启用/熔断/维护)
```

**状态指示**:
- 🟢 正常: 绿色标签，成功率 >= 98%
- 🟡 预警: 黄色标签，成功率 95-98%
- 🔴 熔断: 红色标签，已自动熔断
- ⚙️ 维护: 灰色标签，手动维护中

### 6.2 路由策略配置页面

```
路径: /pool/strategy
功能:
- 策略列表
- 策略可视化编辑器
- 条件预览
```

**策略配置示例**:
```
规则 1: 金额 < 1000
  → 优先使用微信 (权重 80) + 支付宝 (权重 20)

规则 2: 金额 1000-5000
  → 银联 (权重 60) + 微信 (权重 40)

规则 3: 夜间 22:00-06:00
  → 只使用银联 (费率低、风控宽松)

规则 4: BIN 以 4 开头 (Visa)
  → 只使用支持 Visa 的商户

规则 5: 大额 > 50000
  → 使用中信银行直连
```

### 6.3 路由监控页面

```
路径: /pool/monitor
功能:
- 实时路由统计
- 通道健康状态大屏
- 成功率趋势图
- 延迟分布图
- 配额使用率
```

---

## 七、实现计划

### Phase 1: 核心框架 (1周)

| 任务 | 说明 | 文件 |
|------|------|------|
| 熔断器 | CircuitBreaker 类 | `pool/circuit-breaker.ts` |
| 配额服务 | 配额检查和扣减 | `pool/quota.service.ts` |
| 基础轮转 | 平滑加权算法 | `pool/pool.service.ts` |
| 路由决策 | 决策流程实现 | `pool/router.service.ts` |
| API 接口 | CRUD + 查询 | `pool/controller.ts` |

### Phase 2: 高级功能 (1周)

| 任务 | 说明 |
|------|------|
| 策略引擎 | 金额/时间/BIN 规则匹配 |
| 亲和性 | 用户-商户亲和表 |
| 智能重试 | 失败后排除策略 |
| 健康监控 | 实时成功率/延迟 |

### Phase 3: 监控页面 (1周)

| 任务 | 说明 |
|------|------|
| 商户管理页面 | VxeTable 实现 |
| 策略配置页面 | 可视化编辑器 |
| 监控大屏 | 实时数据展示 |

### Phase 4: 优化上线 (持续)

| 任务 | 说明 |
|------|------|
| 性能优化 | 缓存热点数据 |
| 灰度发布 | 新商户逐步放量 |
| A/B 测试 | 不同策略效果对比 |

---

## 八、关键指标监控

### 8.1 核心指标

| 指标 | 告警阈值 | 说明 |
|------|----------|------|
| 商户成功率 | < 95% | 单个商户 |
| 通道成功率 | < 97% | 整个通道 |
| P99 延迟 | > 3000ms | 单笔 |
| 熔断触发 | > 3次/小时 | 任何商户 |
| 配额使用率 | > 90% | 日配额 |

### 8.2 告警规则

```yaml
# Prometheus 告警
- alert: DGKJMerchantSuccessRateLow
  expr: merchant_success_rate < 0.95
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "商户 {{ $labels.mch_no }} 成功率过低"
    description: "当前成功率: {{ $value | humanizePercentage }}"

- alert: DGKJMerchantCircuitOpen
  expr: merchant_circuit_breaker_state == 3
  for: 1m
  labels:
    severity: warning
  annotations:
    summary: "商户 {{ $labels.mch_no }} 熔断已打开"
```

---

## 九、总结

商户轮转池是支付平台的核心能力，本设计实现了：

1. **完整的路由决策流程**: 从可用性检查 → 配额校验 → 熔断器 → 业务规则 → 轮转算法
2. **智能熔断机制**: 防止单商户故障影响整体
3. **平滑加权轮转**: 均匀分配流量，防止商户过载
4. **亲和性路由**: 提升用户体验，减少拒付
5. **智能重试**: 避免 retry bombing 和通道级失败
6. **完整的监控体系**: 健康状态、成功率、延迟、配额使用

核心原则:
- **高可用**: 任何单点故障不应导致整体不可用
- **可观测**: 所有决策都有日志和指标
- **可配置**: 业务规则可通过数据库配置调整，无需代码修改
- **可回滚**: 任何商户问题可快速手动干预
