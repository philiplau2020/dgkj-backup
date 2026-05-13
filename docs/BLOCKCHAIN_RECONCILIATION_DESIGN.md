# DGKJ 支付平台 - 区块链对账模块设计

> 本文档定义基于区块链技术的支付对账系统架构设计方案

## 一、模块概述

### 1.1 背景
传统支付系统对账依赖于中心化数据库，存在以下问题：
- 数据可篡改性
- 对账双方信任问题
- 审计追溯困难

### 1.2 目标
引入区块链技术，实现：
- 交易数据不可篡改
- 对账双方共同见证
- 实时对账与争议解决
- 审计追溯自动化

---

## 二、技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         对账业务层                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ 通道对账    │  │ 商户对账    │  │ 资金对账    │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         └─────────────────┼─────────────────┘                         │
│                           ▼                                         │
│                  ┌─────────────────┐                                │
│                  │  区块链对账引擎  │                                │
│                  └────────┬────────┘                                │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────────┐
│                     区块链网络层                                     │
├───────────────────────────┼─────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────▼────────────────────────┐                │
│  │              区块链智能合约层                    │                │
│  │  - 交易哈希存证                               │                │
│  │  - 对账结果存证                               │                │
│  │  - 争议仲裁合约                               │                │
│  └───────────────────────────────────────────────┘                │
│                                                                     │
│  ┌───────────────────────────────────────────────┐                │
│  │              区块链节点网络                    │                │
│  │  - DGKJ 节点                                  │                │
│  │  - 合作通道节点                               │                │
│  │  - 监管节点 (可选)                            │                │
│  └───────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 区块链选型

| 方案 | 适用场景 | 优势 | 劣势 |
|------|---------|------|------|
| Hyperledger Fabric | 企业联盟链 | 隐私保护、性能高、可控 | 需要许可 |
| FISCO BCOS | 国内联盟链 | 国产化、社区活跃 | 生态相对较小 |
| 以太坊 | 公共链 | 去中心化程度高 | 性能较低、Gas费用 |

**推荐**: FISCO BCOS (国产化、符合监管、性能足够)

---

## 三、智能合约设计

### 3.1 交易存证合约

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TradeEvidence {
    // 交易记录结构
    struct TradeRecord {
        bytes32 tradeHash;        // 交易数据哈希
        string orderNo;           // 订单号
        address from;             // 发起方
        uint256 amount;           // 金额
        uint256 timestamp;        // 时间戳
        bytes signature;          // 签名
        uint8 status;             // 状态: 0-待确认, 1-已确认, 2-有争议
    }
    
    // 存储
    mapping(string => TradeRecord) public trades;
    mapping(string => bool) public tradeExists;
    
    // 事件
    event TradeSubmitted(string orderNo, bytes32 hash, uint256 timestamp);
    event TradeConfirmed(string orderNo, uint256 timestamp);
    event TradeDisputed(string orderNo, string reason, uint256 timestamp);
    
    // 提交交易存证
    function submitTrade(
        string calldata orderNo,
        bytes32 tradeHash,
        bytes calldata signature
    ) external {
        require(!tradeExists[orderNo], "Trade already exists");
        
        trades[orderNo] = TradeRecord({
            tradeHash: tradeHash,
            orderNo: orderNo,
            from: msg.sender,
            amount: 0,
            timestamp: block.timestamp,
            signature: signature,
            status: 0
        });
        tradeExists[orderNo] = true;
        
        emit TradeSubmitted(orderNo, tradeHash, block.timestamp);
    }
    
    // 确认交易
    function confirmTrade(string calldata orderNo) external {
        require(tradeExists[orderNo], "Trade not found");
        require(trades[orderNo].status == 0, "Invalid status");
        
        trades[orderNo].status = 1;
        emit TradeConfirmed(orderNo, block.timestamp);
    }
    
    // 发起争议
    function disputeTrade(string calldata orderNo, string calldata reason) external {
        require(tradeExists[orderNo], "Trade not found");
        require(trades[orderNo].status != 2, "Already disputed");
        
        trades[orderNo].status = 2;
        emit TradeDisputed(orderNo, reason, block.timestamp);
    }
    
    // 查询交易存证
    function getTrade(string calldata orderNo) external view returns (TradeRecord memory) {
        require(tradeExists[orderNo], "Trade not found");
        return trades[orderNo];
    }
}
```

### 3.2 对账结果合约

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReconciliationResult {
    // 对账批次
    struct Batch {
        bytes32 batchHash;        // 批次哈希
        uint256 totalCount;       // 总笔数
        uint256 totalAmount;      // 总金额
        uint256 agreeCount;       // 一致笔数
        uint256 diffCount;        // 差异笔数
        uint256 timestamp;
        uint8 status;             // 0-进行中, 1-已完成, 2-有争议
    }
    
    // 差异记录
    struct DiffRecord {
        string orderNo;
        bytes32 ourHash;          // 我方哈希
        bytes32 theirHash;        // 对方哈希
        bytes32 arbiterHash;      // 仲裁哈希
        uint8 result;              // 0-待仲裁, 1-我方正确, 2-对方正确
        string reason;
    }
    
    mapping(bytes32 => Batch) public batches;
    mapping(string => DiffRecord) public diffRecords;
    
    event BatchCreated(bytes32 batchHash, uint256 count, uint256 amount);
    event BatchCompleted(bytes32 batchHash, uint256 agreeCount, uint256 diffCount);
    event DiffResolved(string orderNo, uint8 result);
    
    // 创建对账批次
    function createBatch(
        bytes32 batchHash,
        uint256 totalCount,
        uint256 totalAmount,
        bytes32[] calldata tradeHashes
    ) external {
        batches[batchHash] = Batch({
            batchHash: batchHash,
            totalCount: totalCount,
            totalAmount: totalAmount,
            agreeCount: 0,
            diffCount: 0,
            timestamp: block.timestamp,
            status: 0
        });
        
        emit BatchCreated(batchHash, totalCount, totalAmount);
    }
    
    // 记录对账结果
    function recordResult(
        bytes32 batchHash,
        uint256 agreeCount,
        uint256 diffCount
    ) external {
        require(batches[batchHash].batchHash == batchHash, "Batch not found");
        
        batches[batchHash].agreeCount = agreeCount;
        batches[batchHash].diffCount = diffCount;
        batches[batchHash].status = diffCount > 0 ? 0 : 1;
        
        emit BatchCompleted(batchHash, agreeCount, diffCount);
    }
    
    // 记录差异
    function recordDiff(
        string calldata orderNo,
        bytes32 ourHash,
        bytes32 theirHash
    ) external {
        diffRecords[orderNo] = DiffRecord({
            orderNo: orderNo,
            ourHash: ourHash,
            theirHash: theirHash,
            arbiterHash: bytes32(0),
            result: 0,
            reason: ""
        });
    }
    
    // 仲裁差异
    function resolveDiff(
        string calldata orderNo,
        bytes32 arbiterHash,
        uint8 result,
        string calldata reason
    ) external onlyArbiter {
        require(diffRecords[orderNo].result == 0, "Already resolved");
        
        diffRecords[orderNo].arbiterHash = arbiterHash;
        diffRecords[orderNo].result = result;
        diffRecords[orderNo].reason = reason;
        
        emit DiffResolved(orderNo, result);
    }
}
```

---

## 四、业务流程

### 4.1 交易上链流程

```
┌─────────────────────────────────────────────────────────────────┐
│                       交易上链流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 发起支付                                                      │
│       │                                                          │
│       ▼                                                          │
│  2. 生成交易数据                                                  │
│       │                                                          │
│       ▼                                                          │
│  3. 计算 SHA-256 哈希                                            │
│     hash = SHA256(orderNo + amount + channel + timestamp)         │
│       │                                                          │
│       ▼                                                          │
│  4. 使用私钥签名                                                  │
│     signature = sign(hash, privateKey)                           │
│       │                                                          │
│       ▼                                                          │
│  5. 提交到区块链                                                  │
│     contract.submitTrade(orderNo, hash, signature)               │
│       │                                                          │
│       ▼                                                          │
│  6. 链上存证，返回交易哈希                                        │
│       │                                                          │
│       ▼                                                          │
│  7. 交易完成                                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 对账流程

```
┌─────────────────────────────────────────────────────────────────┐
│                       区块链对账流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 定时任务触发对账 (T+1 00:00)                                  │
│       │                                                          │
│       ▼                                                          │
│  2. 获取本地交易数据                                              │
│       │                                                          │
│       ▼                                                          │
│  3. 从区块链查询交易哈希                                          │
│       │                                                          │
│       ▼                                                          │
│  4. 比对哈希是否一致                                              │
│       │                                                          │
│       ├──── 哈希一致 ────► 记录对账成功                            │
│       │                                                          │
│       └──── 哈希不一致 ──► 记录差异                               │
│                            │                                     │
│                            ▼                                     │
│                       发起仲裁                                   │
│                            │                                     │
│                            ▼                                     │
│                    链上仲裁结果                                   │
│                            │                                     │
│                            ▼                                     │
│                      差异处理                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、数据库设计

### 5.1 链上交易记录表

```sql
-- 区块链交易存证表
CREATE TABLE `blockchain_trade` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `order_no` VARCHAR(64) NOT NULL COMMENT '订单号',
  `trade_hash` VARCHAR(128) NOT NULL COMMENT '交易哈希',
  `block_hash` VARCHAR(128) COMMENT '区块哈希',
  `block_number` BIGINT COMMENT '区块高度',
  `tx_hash` VARCHAR(128) COMMENT '交易哈希',
  `from_address` VARCHAR(64) COMMENT '发起地址',
  `amount` DECIMAL(14,2) COMMENT '金额',
  `channel` VARCHAR(32) COMMENT '通道',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-待确认,1-已确认,2-有争议',
  `signature` TEXT COMMENT '签名',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at` DATETIME COMMENT '确认时间',
  UNIQUE KEY `uk_order_no`(`order_no`),
  UNIQUE KEY `uk_trade_hash`(`trade_hash`),
  KEY `idx_block_number`(`block_number`),
  KEY `idx_status`(`status`),
  KEY `idx_created_at`(`created_at`)
);
```

### 5.2 对账批次表

```sql
-- 对账批次表
CREATE TABLE `recon_batch` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `batch_no` VARCHAR(64) NOT NULL COMMENT '批次号',
  `batch_hash` VARCHAR(128) NOT NULL COMMENT '批次哈希',
  `channel` VARCHAR(32) COMMENT '通道',
  `recon_date` DATE NOT NULL COMMENT '对账日期',
  `total_count` INT DEFAULT 0 COMMENT '总笔数',
  `total_amount` DECIMAL(14,2) DEFAULT 0 COMMENT '总金额',
  `agree_count` INT DEFAULT 0 COMMENT '一致笔数',
  `agree_amount` DECIMAL(14,2) DEFAULT 0 COMMENT '一致金额',
  `diff_count` INT DEFAULT 0 COMMENT '差异笔数',
  `diff_amount` DECIMAL(14,2) DEFAULT 0 COMMENT '差异金额',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-进行中,1-已完成,2-有争议',
  `start_time` DATETIME COMMENT '开始时间',
  `end_time` DATETIME COMMENT '结束时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_batch_no`(`batch_no`),
  UNIQUE KEY `uk_batch_hash`(`batch_hash`),
  KEY `idx_recon_date`(`recon_date`),
  KEY `idx_channel`(`channel`),
  KEY `idx_status`(`status`)
);
```

### 5.3 对账差异表

```sql
-- 对账差异记录表
CREATE TABLE `recon_diff` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `batch_no` VARCHAR(64) NOT NULL COMMENT '批次号',
  `order_no` VARCHAR(64) NOT NULL COMMENT '订单号',
  `our_hash` VARCHAR(128) COMMENT '我方哈希',
  `our_amount` DECIMAL(14,2) COMMENT '我方金额',
  `their_hash` VARCHAR(128) COMMENT '对方哈希',
  `their_amount` DECIMAL(14,2) COMMENT '对方金额',
  `arbiter_hash` VARCHAR(128) COMMENT '仲裁哈希',
  `diff_type` VARCHAR(32) COMMENT '差异类型:amount/order_status/not_found',
  `result` TINYINT DEFAULT 0 COMMENT '仲裁结果:0-待仲裁,1-我方正确,2-对方正确',
  `reason` VARCHAR(512) COMMENT '原因',
  `resolved_at` DATETIME COMMENT '解决时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_batch_no`(`batch_no`),
  KEY `idx_order_no`(`order_no`),
  KEY `idx_result`(`result`)
);
```

---

## 六、服务实现

### 6.1 目录结构

```
server/src/modules/blockchain/
├── controller.ts              # 区块链 API
├── routes.ts                 # 路由定义
├── service/
│   ├── blockchain.service.ts  # 区块链交互服务
│   ├── contract.service.ts   # 智能合约服务
│   ├── recon.service.ts       # 对账服务
│   └── signature.service.ts  # 签名服务
├── client/
│   └── web3.client.ts        # Web3 客户端
├── entity/
│   ├── blockchain-trade.entity.ts
│   ├── recon-batch.entity.ts
│   └── recon-diff.entity.ts
└── types.ts                  # 类型定义
```

### 6.2 核心服务接口

```typescript
// blockchain.service.ts

export class BlockchainService {
  // 提交交易存证
  async submitTradeEvidence(params: TradeEvidenceParams): Promise<SubmitResult> {
    // 1. 计算交易哈希
    const hash = this.calculateTradeHash(params);
    
    // 2. 签名
    const signature = await this.signatureService.sign(hash);
    
    // 3. 提交到区块链
    const txHash = await this.contract.submitTrade(
      params.orderNo,
      hash,
      signature
    );
    
    // 4. 保存本地记录
    await this.saveTradeRecord(params, hash, txHash);
    
    return { hash, txHash, status: 'submitted' };
  }
  
  // 批量查询存证状态
  async batchQueryStatus(orderNos: string[]): Promise<StatusResult[]> {
    const results = await Promise.all(
      orderNos.map(async (orderNo) => {
        const record = await this.contract.getTrade(orderNo);
        return {
          orderNo,
          status: record.status,
          hash: record.tradeHash,
          timestamp: record.timestamp,
        };
      })
    );
    return results;
  }
  
  // 执行区块链对账
  async reconcile(date: string, channel: string): Promise<ReconResult> {
    // 1. 获取本地交易
    const localTrades = await this.getLocalTrades(date, channel);
    
    // 2. 批量查询链上状态
    const chainResults = await this.batchQueryStatus(
      localTrades.map(t => t.orderNo)
    );
    
    // 3. 比对结果
    const { agree, diff } = this.compareResults(localTrades, chainResults);
    
    // 4. 记录差异
    await this.recordDifferences(diff);
    
    // 5. 提交对账批次
    await this.submitReconBatch(date, channel, agree.length, diff.length);
    
    return {
      total: localTrades.length,
      agree: agree.length,
      diff: diff.length,
      diffOrders: diff.map(d => d.orderNo),
    };
  }
}
```

---

## 七、API 接口

### 7.1 交易存证

```
POST /basic-api/blockchain/trade/submit
{
  "orderNo": "ORDER123456",
  "amount": 10000.00,
  "channel": "wechat",
  "timestamp": 1704067200000
}

响应:
{
  "code": 0,
  "data": {
    "orderNo": "ORDER123456",
    "tradeHash": "0xabc123...",
    "txHash": "0xdef456...",
    "blockNumber": 12345678
  }
}
```

### 7.2 查询存证

```
GET /basic-api/blockchain/trade/:orderNo

响应:
{
  "code": 0,
  "data": {
    "orderNo": "ORDER123456",
    "tradeHash": "0xabc123...",
    "blockNumber": 12345678,
    "status": 1,
    "timestamp": 1704067200
  }
}
```

### 7.3 执行对账

```
POST /basic-api/blockchain/recon
{
  "date": "2024-01-01",
  "channel": "wechat"
}

响应:
{
  "code": 0,
  "data": {
    "batchNo": "RECON20240101001",
    "total": 1000,
    "agree": 998,
    "diff": 2,
    "diffOrders": ["ORDER001", "ORDER002"]
  }
}
```

### 7.4 查询对账结果

```
GET /basic-api/blockchain/recon/:batchNo

响应:
{
  "code": 0,
  "data": {
    "batchNo": "RECON20240101001",
    "status": 1,
    "total": 1000,
    "agree": 998,
    "diff": 2
  }
}
```

---

## 八、实施计划

### Phase 1: 区块链集成 (4周)
- 区块链网络搭建
- 智能合约开发
- SDK 集成
- 本地存证服务

### Phase 2: 对账功能 (4周)
- 对账服务开发
- 差异处理
- 仲裁流程
- 报表功能

### Phase 3: 运营支持 (2周)
- 监控告警
- 运维工具
- 文档完善
- 培训支持

---

## 九、合规说明

1. **数据合规**: 链上只存储哈希值，不存储敏感个人信息
2. **隐私保护**: 使用零知识证明技术保护交易详情
3. **监管合规**: 支持监管节点接入，提供审计接口
