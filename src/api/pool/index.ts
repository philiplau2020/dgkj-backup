/**
 * DGKJ 支付平台 - 轮转池 API
 */

import { defHttp } from '@/utils/http/axios';

const API_BASE = '/basic-api/pool';

/**
 * 轮转池 API
 */
export const PoolApi = {
  // ==================== 商户管理 ====================

  /** 获取通道商户列表 */
  listChannelMch: (params?: {
    channelCode?: string;
    status?: number;
    page?: number;
    pageSize?: number;
  }) => {
    return defHttp.get<{
      list: ChannelMchItem[];
      total: number;
      page: number;
      pageSize: number;
    }>({
      url: `${API_BASE}/channel-mch/list`,
      params,
    });
  },

  /** 更新商户配置 */
  updateMerchantConfig: (id: string, data: Partial<ChannelMchItem>) => {
    return defHttp.put<any>({
      url: `${API_BASE}/channel-mch/${id}`,
      data,
    });
  },

  /** 切换商户状态 */
  switchMerchantStatus: (mchNo: string, action: 'enable' | 'disable' | 'maintenance' | 'reset') => {
    return defHttp.post<any>({
      url: `${API_BASE}/channel-mch/${mchNo}/switch`,
      data: { action },
    });
  },

  // ==================== 健康监控 ====================

  /** 获取商户健康状态 */
  getMerchantHealth: (channelCode: string, mchNo: string) => {
    return defHttp.get<{
      health: HealthInfo;
      quota: QuotaInfo;
      circuit: CircuitInfo;
      latencyDistribution: LatencyDist;
    }>({
      url: `${API_BASE}/health/${channelCode}/${mchNo}`,
    });
  },

  /** 重置商户统计 */
  resetMerchantStats: (channelCode: string, mchNo: string) => {
    return defHttp.post<any>({
      url: `${API_BASE}/health/${channelCode}/${mchNo}/reset`,
    });
  },

  // ==================== 熔断器 ====================

  /** 重置熔断器 */
  resetCircuitBreaker: (mchNo: string) => {
    return defHttp.post<any>({
      url: `${API_BASE}/circuit-breaker/${mchNo}/reset`,
    });
  },

  /** 获取熔断器状态列表 */
  listCircuitBreaker: () => {
    return defHttp.get<Array<{ mchNo: string; state: number; health: any }>>({
      url: `${API_BASE}/circuit-breaker/list`,
    });
  },

  // ==================== 路由管理 ====================

  /** 模拟路由选择 */
  simulateRoute: (params: SimulateParams) => {
    return defHttp.post<SimulateResult>({
      url: `${API_BASE}/simulate`,
      data: params,
    });
  },

  /** 获取路由日志 */
  listRouteLogs: (params?: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    channelCode?: string;
    status?: string;
  }) => {
    return defHttp.get<{
      list: RouteLogItem[];
      total: number;
      page: number;
      pageSize: number;
    }>({
      url: `${API_BASE}/route-log/list`,
      params,
    });
  },

  /** 获取通道统计 */
  getChannelStats: (channelCode: string) => {
    return defHttp.get<ChannelStats>({
      url: `${API_BASE}/stats/channel`,
      params: { channelCode },
    });
  },

  /** 获取轮转池概览 */
  getPoolOverview: () => {
    return defHttp.get<PoolOverview>({
      url: `${API_BASE}/overview`,
    });
  },

  // ==================== 亲和性 ====================

  /** 获取用户路由历史 */
  getUserRouteHistory: (params: {
    userId: string;
    userIdType: string;
    channelCode?: string;
  }) => {
    return defHttp.get<AffinityRecord[]>({
      url: `${API_BASE}/affinity/history`,
      params,
    });
  },
};

/**
 * 类型定义
 */

export interface ChannelMchItem {
  id: string;
  channelCode: string;
  mchNo: string;
  mchName: string;
  appId?: string;
  weight: number;
  status: number;
  dailyLimit: number;
  dailyUsed: number;
  singleMinAmount: number;
  singleMaxAmount: number;
  bizTypes?: string[];
  excludeBins?: string[];
  // 实时状态
  successRate?: number;
  avgLatency?: number;
  consecutiveFails?: number;
  circuitState?: number;
  dailyQuotaUsed?: number;
  dailyQuotaRemaining?: number;
  dailyQuotaUsageRate?: number;
}

export interface HealthInfo {
  mchNo: string;
  channelCode: string;
  status: string;
  date: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  declineCount: number;
  successRate: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  lastSuccessTime: string;
  lastFailTime: string;
  consecutiveFails: number;
  circuitState: number;
  circuitOpenedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotaInfo {
  mchNo: string;
  channelCode: string;
  dailyUsed: number;
  dailyLimit: number;
  dailyRemaining: number;
  monthlyUsed: number;
  monthlyLimit: number;
  monthlyRemaining: number;
  lastResetTime: string;
  lastUsageTime: string;
}

export interface CircuitInfo {
  state: number;
  successRate: number;
  consecutiveFails: number;
  isHealthy: boolean;
  canRecover: boolean;
}

export interface LatencyDist {
  p50: number;
  p95: number;
  p99: number;
  max: number;
  avg: number;
}

export interface SimulateParams {
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

export interface SimulateResult {
  success: boolean;
  mchNo?: string;
  channelCode?: string;
  errorCode?: string;
  error?: string;
  routeTime: number;
  reason?: string;
  candidates?: ChannelMchItem[];
  excluded?: Array<{ mchNo: string; reason: string }>;
}

export interface RouteLogItem {
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

export interface ChannelStats {
  channelCode: string;
  totalMerchants: number;
  healthy: number;
  warning: number;
  critical: number;
  down: number;
  avgSuccessRate: number;
  poolStats: Array<{
    id: string;
    weight: number;
    currentWeight: number;
    expectedRatio: number;
  }>;
  circuitStates: Array<{ mchNo: string; state: number; health: any }>;
}

export interface PoolOverview {
  health: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    down: number;
    avgSuccessRate: number;
  };
  quota: {
    totalDailyQuota: number;
    totalDailyUsed: number;
    quotaUsageRate: number;
  };
  circuit: {
    total: number;
    closed: number;
    halfOpen: number;
    open: number;
  };
  pool: {
    totalWeight: number;
    merchantCount: number;
    stats: Array<{
      id: string;
      weight: number;
      currentWeight: number;
      expectedRatio: number;
    }>;
  };
}

export interface AffinityRecord {
  userId: string;
  userIdType: string;
  channelCode: string;
  mchNo: string;
  successCount: number;
  failCount: number;
  affinityScore: number;
  lastUsedTime: string;
}

export default PoolApi;
