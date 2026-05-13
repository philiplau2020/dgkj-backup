/**
 * DGKJ 支付平台 - 健康监控服务
 * 
 * 监控通道商户的健康状态，包括成功率、延迟等
 */

import dayjs from 'dayjs';

export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  DOWN = 'down',
}

export interface HealthMetrics {
  /** 商户号 */
  mchNo: string;
  /** 通道编码 */
  channelCode: string;
  /** 健康状态 */
  status: HealthStatus;
  /** 统计日期 */
  date: string;
  /** 总交易笔数 */
  totalCount: number;
  /** 成功笔数 */
  successCount: number;
  /** 失败笔数 */
  failCount: number;
  /** 拒付笔数 */
  declineCount: number;
  /** 成功率 (%) */
  successRate: number;
  /** 平均延迟 (ms) */
  avgLatency: number;
  /** P50 延迟 */
  p50Latency: number;
  /** P95 延迟 */
  p95Latency: number;
  /** P99 延迟 */
  p99Latency: number;
  /** 最后成功时间 */
  lastSuccessTime: string;
  /** 最后失败时间 */
  lastFailTime: string;
  /** 连续失败次数 */
  consecutiveFails: number;
  /** 熔断状态 */
  circuitState: number;
  /** 熔断打开时间 */
  circuitOpenedAt: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

export interface LatencyRecord {
  timestamp: number;
  latency: number;
}

// 健康指标配置
const HEALTH_CONFIG = {
  // 成功率阈值
  successRate: {
    healthy: 98,    // >= 98% 健康
    warning: 95,    // 95-98% 警告
    critical: 90,   // 90-95% 危险
  },
  // 延迟阈值 (ms)
  latency: {
    healthy: 1000,  // P99 < 1s 健康
    warning: 2000,  // P99 < 2s 警告
    critical: 3000, // P99 < 3s 危险
  },
  // 连续失败阈值
  consecutiveFails: {
    healthy: 0,
    warning: 3,
    critical: 5,
  },
};

// 内存健康数据存储
const healthStore = new Map<string, HealthMetrics>();
const latencyRecords = new Map<string, LatencyRecord[]>();
const MAX_LATENCY_RECORDS = 1000;

export class HealthService {
  /**
   * 初始化商户健康记录
   */
  initHealth(params: {
    mchNo: string;
    channelCode: string;
  }): HealthMetrics {
    const key = this.getKey(params.mchNo, params.channelCode);

    if (healthStore.has(key)) {
      return healthStore.get(key)!;
    }

    const today = dayjs().format('YYYY-MM-DD');
    const health: HealthMetrics = {
      mchNo: params.mchNo,
      channelCode: params.channelCode,
      status: HealthStatus.HEALTHY,
      date: today,
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      declineCount: 0,
      successRate: 100,
      avgLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      lastSuccessTime: '',
      lastFailTime: '',
      consecutiveFails: 0,
      circuitState: 1, // CLOSED
      circuitOpenedAt: '',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };

    healthStore.set(key, health);
    return health;
  }

  /**
   * 记录成功交易
   */
  recordSuccess(params: {
    mchNo: string;
    channelCode: string;
    latency?: number;
  }): void {
    const key = this.getKey(params.mchNo, params.channelCode);
    const health = healthStore.get(key) || this.initHealth(params);

    health.totalCount++;
    health.successCount++;
    health.consecutiveFails = 0;
    health.lastSuccessTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    health.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // 更新延迟
    if (params.latency !== undefined) {
      this.recordLatency(key, params.latency);
    }

    // 更新成功率
    this.updateSuccessRate(key);

    // 更新健康状态
    this.updateStatus(key);
  }

  /**
   * 记录失败交易
   */
  recordFailure(params: {
    mchNo: string;
    channelCode: string;
    latency?: number;
    isDecline?: boolean;
    failType?: string;
  }): void {
    const key = this.getKey(params.mchNo, params.channelCode);
    const health = healthStore.get(key) || this.initHealth(params);

    health.totalCount++;
    health.failCount++;
    health.consecutiveFails++;

    if (params.isDecline) {
      health.declineCount++;
    }

    health.lastFailTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    health.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // 更新延迟
    if (params.latency !== undefined) {
      this.recordLatency(key, params.latency);
    }

    // 更新成功率
    this.updateSuccessRate(key);

    // 更新健康状态
    this.updateStatus(key);
  }

  /**
   * 获取商户健康状态
   */
  getHealth(mchNo: string, channelCode: string): HealthMetrics | null {
    const key = this.getKey(mchNo, channelCode);
    return healthStore.get(key) || null;
  }

  /**
   * 获取所有商户健康状态
   */
  getAllHealth(): HealthMetrics[] {
    return Array.from(healthStore.values());
  }

  /**
   * 获取健康状态摘要
   */
  getSummary(): {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    down: number;
    avgSuccessRate: number;
  } {
    const all = this.getAllHealth();

    return {
      total: all.length,
      healthy: all.filter(h => h.status === HealthStatus.HEALTHY).length,
      warning: all.filter(h => h.status === HealthStatus.WARNING).length,
      critical: all.filter(h => h.status === HealthStatus.CRITICAL).length,
      down: all.filter(h => h.status === HealthStatus.DOWN).length,
      avgSuccessRate: all.length > 0
        ? all.reduce((sum, h) => sum + h.successRate, 0) / all.length
        : 100,
    };
  }

  /**
   * 获取延迟分布
   */
  getLatencyDistribution(mchNo: string, channelCode: string): {
    p50: number;
    p95: number;
    p99: number;
    max: number;
    avg: number;
  } {
    const key = this.getKey(mchNo, channelCode);
    const records = latencyRecords.get(key) || [];

    if (records.length === 0) {
      return { p50: 0, p95: 0, p99: 0, max: 0, avg: 0 };
    }

    const sorted = records.map(r => r.latency).sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
      max: sorted[sorted.length - 1],
      avg: Math.round(sum / sorted.length),
    };
  }

  /**
   * 更新熔断状态
   */
  updateCircuitState(mchNo: string, channelCode: string, state: number): void {
    const key = this.getKey(mchNo, channelCode);
    const health = healthStore.get(key) || this.initHealth({ mchNo, channelCode });

    health.circuitState = state;
    if (state === 3) {
      // OPEN
      health.circuitOpenedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    }
    health.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  }

  /**
   * 重置健康统计
   */
  resetHealth(mchNo: string, channelCode: string): boolean {
    const key = this.getKey(mchNo, channelCode);

    if (!healthStore.has(key)) {
      return false;
    }

    const health = healthStore.get(key)!;
    health.totalCount = 0;
    health.successCount = 0;
    health.failCount = 0;
    health.declineCount = 0;
    health.successRate = 100;
    health.avgLatency = 0;
    health.p50Latency = 0;
    health.p95Latency = 0;
    health.p99Latency = 0;
    health.lastSuccessTime = '';
    health.lastFailTime = '';
    health.consecutiveFails = 0;
    health.circuitState = 1;
    health.circuitOpenedAt = '';
    health.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // 清理延迟记录
    latencyRecords.delete(key);

    return true;
  }

  /**
   * 删除健康记录
   */
  deleteHealth(mchNo: string, channelCode: string): boolean {
    const key = this.getKey(mchNo, channelCode);
    healthStore.delete(key);
    latencyRecords.delete(key);
    return true;
  }

  /**
   * 日终清理
   */
  dailyCleanup(): number {
    const today = dayjs().format('YYYY-MM-DD');
    let cleaned = 0;

    for (const [key, health] of healthStore.entries()) {
      // 重置日期数据
      if (health.date !== today) {
        health.date = today;
        health.totalCount = 0;
        health.successCount = 0;
        health.failCount = 0;
        health.declineCount = 0;
        health.successRate = 100;
        health.consecutiveFails = 0;
      }

      // 清理长期无活动的记录
      if (!health.lastSuccessTime && !health.lastFailTime) {
        continue;
      }

      const lastTime = dayjs(
        health.lastSuccessTime > health.lastFailTime
          ? health.lastSuccessTime
          : health.lastFailTime
      );

      if (dayjs().diff(lastTime, 'day') > 30) {
        healthStore.delete(key);
        latencyRecords.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  private recordLatency(key: string, latency: number): void {
    if (!latencyRecords.has(key)) {
      latencyRecords.set(key, []);
    }

    const records = latencyRecords.get(key)!;
    records.push({ timestamp: Date.now(), latency });

    // 限制记录数量
    if (records.length > MAX_LATENCY_RECORDS) {
      records.shift();
    }

    // 更新延迟指标
    const health = healthStore.get(key)!;
    const dist = this.getLatencyDistribution(
      health.mchNo,
      health.channelCode
    );
    health.p50Latency = dist.p50;
    health.p95Latency = dist.p95;
    health.p99Latency = dist.p99;
    health.avgLatency = dist.avg;
  }

  private updateSuccessRate(key: string): void {
    const health = healthStore.get(key)!;
    health.successRate = health.totalCount > 0
      ? Math.round((health.successCount / health.totalCount) * 10000) / 100
      : 100;
  }

  private updateStatus(key: string): void {
    const health = healthStore.get(key)!;

    // 检查成功率
    if (health.successRate < HEALTH_CONFIG.successRate.critical) {
      health.status = HealthStatus.CRITICAL;
      return;
    }

    // 检查连续失败
    if (health.consecutiveFails >= HEALTH_CONFIG.consecutiveFails.critical) {
      health.status = HealthStatus.DOWN;
      return;
    }

    // 检查延迟
    if (health.p99Latency > HEALTH_CONFIG.latency.critical) {
      health.status = HealthStatus.CRITICAL;
      return;
    }

    // 检查警告
    if (
      health.successRate < HEALTH_CONFIG.successRate.warning ||
      health.consecutiveFails >= HEALTH_CONFIG.consecutiveFails.warning ||
      health.p99Latency > HEALTH_CONFIG.latency.warning
    ) {
      health.status = HealthStatus.WARNING;
      return;
    }

    health.status = HealthStatus.HEALTHY;
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  private getKey(mchNo: string, channelCode: string): string {
    return `${channelCode}:${mchNo}`;
  }
}

// 单例
export const healthService = new HealthService();
