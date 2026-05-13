/**
 * DGKJ 支付平台 - 轮转池类型定义
 */

export enum PoolStatus {
  DISABLED = 0,
  ENABLED = 1,
  CIRCUIT_OPEN = 2,
  MAINTENANCE = 3,
}

export enum RouteStrategyType {
  /** 金额策略 */
  AMOUNT = 'amount',
  /** 时段策略 */
  TIME = 'time',
  /** 星期策略 */
  WEEKDAY = 'weekday',
  /** BIN 策略 */
  BIN = 'bin',
  /** 业务类型策略 */
  BIZ_TYPE = 'biz_type',
  /** 加权轮转 */
  WEIGHTED_RR = 'weighted_rr',
  /** 平滑加权轮转 */
  SMOOTH_WEIGHTED_RR = 'smooth_weighted_rr',
  /** 最低成本 */
  LEAST_COST = 'least_cost',
  /** 健康感知 */
  HEALTH_AWARE = 'health_aware',
}

export enum RouteAction {
  /** 分配到指定通道 */
  ASSIGN_CHANNEL = 'assign_channel',
  /** 分配到指定商户 */
  ASSIGN_MCH = 'assign_mch',
  /** 排除指定通道 */
  EXCLUDE_CHANNEL = 'exclude_channel',
  /** 排除指定商户 */
  EXCLUDE_MCH = 'exclude_mch',
  /** 使用加权轮转 */
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  /** 使用亲和性 */
  USE_AFFINITY = 'use_affinity',
}

export interface StrategyCondition {
  /** 字段名 */
  field: string;
  /** 操作符 */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'like' | 'between';
  /** 值 */
  value: any;
  /** 结束值 (用于 between) */
  valueEnd?: any;
}

export interface RouteStrategy {
  id: string;
  strategyCode: string;
  strategyName: string;
  strategyType: RouteStrategyType;
  conditions: StrategyCondition[];
  actionType: RouteAction;
  actionValue: string;
  priority: number;
  status: PoolStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PoolStats {
  channelCode: string;
  totalMerchants: number;
  enabledMerchants: number;
  disabledMerchants: number;
  circuitOpenMerchants: number;
  avgSuccessRate: number;
  totalQuota: number;
  usedQuota: number;
  quotaUsageRate: number;
}

export interface MchHealth {
  mchNo: string;
  channelCode: string;
  status: PoolStatus;
  successRate: number;
  avgLatency: number;
  p99Latency: number;
  consecutiveFails: number;
  circuitState: number;
  lastSuccessTime: string;
  lastFailTime: string;
}

export interface SelectOptions {
  channelCode: string;
  payWay?: string;
  amount: number;
  bin?: string;
  bizType?: string;
  userId?: string;
  userIdType?: string;
  excludeMchNos?: string[];
  forceMchNo?: string;
}

export interface SelectResponse {
  success: boolean;
  mchNo?: string;
  channelCode?: string;
  errorCode?: string;
  error?: string;
  routeTime: number;
  reason?: string;
  candidates?: PoolItem[];
  excluded?: Array<{ mchNo: string; reason: string }>;
}

export interface PoolItem {
  id: string;
  channelCode: string;
  mchNo: string;
  mchName: string;
  weight: number;
  status: PoolStatus;
  dailyLimit?: number;
  dailyUsed?: number;
  singleMinAmount?: number;
  singleMaxAmount?: number;
  payWays?: string[];
  excludeBins?: string[];
  priority?: number;
}

export interface RouteLog {
  routeId: string;
  orderNo?: string;
  channelCode: string;
  selectedMchNo: string;
  amount: number;
  success: boolean;
  latency?: number;
  failReason?: string;
  routeTime: number;
  reason: string;
  timestamp: string;
}
