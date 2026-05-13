/**
 * DGKJ 支付平台 - 轮转池核心服务
 * 
 * 整合熔断器、配额、健康检查、亲和性，实现智能商户选择
 */

import { circuitBreaker, CircuitState, CircuitAction } from './circuit-breaker';
import { SmoothWeightedRoundRobin, PoolItem, poolManager } from './smooth-weighted-rr';
import { quotaService, QuotaType } from './quota.service';
import { healthService, HealthStatus } from './health.service';
import { affinityService, AffinityType } from './affinity.service';
import dayjs from 'dayjs';

// ==================== 类型定义 ====================

export interface SelectParams {
  /** 通道编码 */
  channelCode: string;
  /** 支付方式 */
  payWay?: string;
  /** 交易金额 */
  amount: number;
  /** 银行卡 BIN */
  bin?: string;
  /** 业务类型 */
  bizType?: string;
  /** 用户标识 */
  userId?: string;
  /** 用户标识类型 */
  userIdType?: AffinityType;
  /** 排除的商户号列表 (用于重试时排除) */
  excludeMchNos?: string[];
  /** 强制指定的商户号 (优先级最高) */
  forceMchNo?: string;
}

export interface SelectResult {
  /** 是否成功 */
  success: boolean;
  /** 选中的商户号 */
  mchNo?: string;
  /** 选中的通道编码 */
  channelCode?: string;
  /** 错误码 */
  errorCode?: string;
  /** 错误信息 */
  error?: string;
  /** 路由耗时 (ms) */
  routeTime?: number;
  /** 选择原因 */
  reason?: string;
  /** 候选商户列表 */
  candidates?: PoolItem[];
  /** 排除的商户列表 */
  excluded?: Array<{ mchNo: string; reason: string }>;
}

export interface RouteRecord {
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

export interface PoolConfig {
  /** 是否启用熔断器 */
  enableCircuitBreaker?: boolean;
  /** 是否启用配额检查 */
  enableQuotaCheck?: boolean;
  /** 是否启用健康检查 */
  enableHealthCheck?: boolean;
  /** 是否启用亲和性 */
  enableAffinity?: boolean;
  /** 最小成功率阈值 (%) */
  minSuccessRate?: number;
  /** 最大连续失败次数 */
  maxConsecutiveFails?: number;
  /** 熔断超时 (ms) */
  circuitTimeout?: number;
}

// 路由日志
const routeLogs: RouteRecord[] = [];
const MAX_LOG_SIZE = 10000;

export class PoolService {
  private config: PoolConfig = {
    enableCircuitBreaker: true,
    enableQuotaCheck: true,
    enableHealthCheck: true,
    enableAffinity: true,
    minSuccessRate: 95,
    maxConsecutiveFails: 5,
    circuitTimeout: 60000,
  };

  /**
   * 更新配置
   */
  setConfig(config: Partial<PoolConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): PoolConfig {
    return { ...this.config };
  }

  /**
   * 选择最优商户
   */
  async selectMerchant(params: SelectParams): Promise<SelectResult> {
    const startTime = Date.now();
    const result: SelectResult = {
      success: false,
      routeTime: 0,
      candidates: [],
      excluded: [],
    };

    try {
      // 0. 强制指定商户 (最高优先级)
      if (params.forceMchNo) {
        result.mchNo = params.forceMchNo;
        result.channelCode = params.channelCode;
        result.reason = '强制指定商户';
        result.success = true;
        result.routeTime = Date.now() - startTime;
        return result;
      }

      // 1. 获取候选商户
      const candidates = await this.getAvailableMerchants(params);
      result.candidates = candidates;

      if (candidates.length === 0) {
        result.errorCode = 'NO_AVAILABLE_MERCHANT';
        result.error = '没有可用的商户';
        result.routeTime = Date.now() - startTime;
        return result;
      }

      // 2. 亲和性检查
      let preferredMchNo: string | null = null;
      if (this.config.enableAffinity && params.userId && params.userIdType) {
        preferredMchNo = affinityService.getPreferredMerchant({
          userId: params.userId,
          userIdType: params.userIdType,
          channelCode: params.channelCode,
        });

        if (preferredMchNo) {
          // 检查亲和商户是否在候选列表中
          const preferred = candidates.find(c => c.mchNo === preferredMchNo);
          if (preferred) {
            result.mchNo = preferredMchNo;
            result.channelCode = params.channelCode;
            result.reason = '用户亲和性匹配';
            result.success = true;
            result.routeTime = Date.now() - startTime;
            return result;
          }
        }
      }

      // 3. 使用加权轮转选择
      const pool = new SmoothWeightedRoundRobin<PoolItem>({ minWeight: 1, precision: 4 });
      pool.setItems(candidates.map(c => ({
        ...c,
        id: c.mchNo,
        weight: c.weight ?? 100,
      })));

      const selected = pool.select();

      if (!selected) {
        result.errorCode = 'SELECT_FAILED';
        result.error = '商户选择失败';
        result.routeTime = Date.now() - startTime;
        return result;
      }

      result.mchNo = selected.mchNo;
      result.channelCode = params.channelCode;
      result.reason = `加权轮转选中 (权重 ${selected.weight})`;
      result.success = true;
      result.routeTime = Date.now() - startTime;

      return result;
    } catch (error) {
      result.errorCode = 'INTERNAL_ERROR';
      result.error = (error as Error).message;
      result.routeTime = Date.now() - startTime;
      return result;
    }
  }

  /**
   * 获取可用商户列表
   */
  private async getAvailableMerchants(params: SelectParams): Promise<PoolItem[]> {
    const available: PoolItem[] = [];
    const excluded: Array<{ mchNo: string; reason: string }> = [];

    // TODO: 从数据库获取商户列表
    // 这里先用内存数据模拟
    const allMerchants = this.getMockMerchants(params.channelCode);

    for (const mch of allMerchants) {
      let excludedReason: string | null = null;

      // 检查是否在排除列表
      if (params.excludeMchNos?.includes(mch.mchNo)) {
        excludedReason = '在重试排除列表中';
      }

      // 熔断器检查
      else if (this.config.enableCircuitBreaker) {
        const state = circuitBreaker.getState(mch.mchNo);
        if (state === CircuitState.OPEN) {
          excludedReason = '熔断器已打开';
        }
      }

      // 配额检查
      else if (this.config.enableQuotaCheck) {
        const quotaResult = quotaService.checkQuota({
          mchNo: mch.mchNo,
          channelCode: params.channelCode,
          amount: params.amount,
          dailyLimit: mch.dailyLimit,
          singleMinAmount: mch.singleMinAmount,
          singleMaxAmount: mch.singleMaxAmount,
        });

        if (!quotaResult.passed) {
          excludedReason = quotaResult.error || '配额不足';
        }
      }

      // 健康检查
      else if (this.config.enableHealthCheck) {
        const health = healthService.getHealth(mch.mchNo, params.channelCode);
        if (health) {
          if (health.status === HealthStatus.DOWN) {
            excludedReason = '商户健康状态异常';
          } else if (health.successRate < (this.config.minSuccessRate || 95)) {
            excludedReason = `成功率 ${health.successRate}% 低于阈值`;
          } else if (health.consecutiveFails >= (this.config.maxConsecutiveFails || 5)) {
            excludedReason = `连续失败 ${health.consecutiveFails} 次`;
          }
        }
      }

      // BIN 过滤
      else if (params.bin && mch.excludeBins?.length) {
        for (const prefix of mch.excludeBins) {
          if (params.bin.startsWith(prefix)) {
            excludedReason = `BIN ${params.bin} 在排除列表中`;
            break;
          }
        }
      }

      // 单笔限额检查
      else if (mch.singleMinAmount && params.amount < mch.singleMinAmount) {
        excludedReason = `金额 ${params.amount} 低于最小限额 ${mch.singleMinAmount}`;
      } else if (mch.singleMaxAmount && params.amount > mch.singleMaxAmount) {
        excludedReason = `金额 ${params.amount} 超过最大限额 ${mch.singleMaxAmount}`;
      }

      if (excludedReason) {
        excluded.push({ mchNo: mch.mchNo, reason: excludedReason });
      } else {
        available.push(mch);
      }
    }

    // 存储排除的商户信息
    return available;
  }

  /**
   * 记录交易结果
   */
  recordResult(params: {
    mchNo: string;
    channelCode: string;
    success: boolean;
    amount?: number;
    latency?: number;
    failReason?: string;
    failType?: string;
    userId?: string;
    userIdType?: AffinityType;
    orderNo?: string;
  }): void {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (params.success) {
      // 记录成功
      if (this.config.enableCircuitBreaker) {
        circuitBreaker.recordSuccess(params.mchNo);
      }

      if (this.config.enableQuotaCheck && params.amount) {
        quotaService.consumeQuota({
          mchNo: params.mchNo,
          channelCode: params.channelCode,
          amount: params.amount,
        });
      }

      if (this.config.enableHealthCheck) {
        healthService.recordSuccess({
          mchNo: params.mchNo,
          channelCode: params.channelCode,
          latency: params.latency,
        });
      }

      if (this.config.enableAffinity && params.userId && params.userIdType) {
        affinityService.recordSuccess({
          userId: params.userId,
          userIdType: params.userIdType,
          channelCode: params.channelCode,
          mchNo: params.mchNo,
        });
      }
    } else {
      // 记录失败
      if (this.config.enableCircuitBreaker) {
        circuitBreaker.recordFailure(params.mchNo, params.failType);
      }

      if (this.config.enableHealthCheck) {
        healthService.recordFailure({
          mchNo: params.mchNo,
          channelCode: params.channelCode,
          latency: params.latency,
          failType: params.failType,
        });
      }

      if (this.config.enableAffinity && params.userId && params.userIdType) {
        affinityService.recordFailure({
          userId: params.userId,
          userIdType: params.userIdType,
          channelCode: params.channelCode,
          mchNo: params.mchNo,
          failType: params.failType,
        });
      }
    }

    // 记录路由日志
    this.addRouteLog({
      routeId: `R${Date.now()}`,
      orderNo: params.orderNo,
      channelCode: params.channelCode,
      selectedMchNo: params.mchNo,
      amount: params.amount || 0,
      success: params.success,
      latency: params.latency,
      failReason: params.failReason,
      routeTime: 0,
      reason: params.success ? '交易成功' : `失败: ${params.failReason}`,
      timestamp: now,
    });
  }

  /**
   * 获取商户健康状态
   */
  getMerchantHealth(mchNo: string, channelCode: string) {
    const health = healthService.getHealth(mchNo, channelCode);
    const circuit = circuitBreaker.getHealthSummary(mchNo);
    const quota = quotaService.getUsage(mchNo, channelCode);

    return {
      health,
      circuit,
      quota,
    };
  }

  /**
   * 获取通道统计
   */
  getChannelStats(channelCode: string) {
    const healthSummary = healthService.getSummary();
    const allHealth = healthService.getAllHealth().filter(h => h.channelCode === channelCode);
    const circuitStates = circuitBreaker.getAllStates();
    const poolStats = poolManager.getStats();

    return {
      channelCode,
      totalMerchants: allHealth.length,
      healthy: allHealth.filter(h => h.status === HealthStatus.HEALTHY).length,
      warning: allHealth.filter(h => h.status === HealthStatus.WARNING).length,
      critical: allHealth.filter(h => h.status === HealthStatus.CRITICAL).length,
      down: allHealth.filter(h => h.status === HealthStatus.DOWN).length,
      avgSuccessRate: allHealth.length > 0
        ? allHealth.reduce((sum, h) => sum + h.successRate, 0) / allHealth.length
        : 100,
      poolStats,
      circuitStates: circuitStates.filter(c =>
        allHealth.some(h => h.mchNo === c.mchNo)
      ),
    };
  }

  /**
   * 手动切换商户状态
   */
  switchMerchant(mchNo: string, action: 'enable' | 'disable' | 'maintenance' | 'reset'): boolean {
    switch (action) {
      case 'disable':
      case 'maintenance':
        circuitBreaker.forceOpen(mchNo, `手动${action === 'maintenance' ? '维护' : '禁用'}`);
        return true;

      case 'enable':
      case 'reset':
        circuitBreaker.reset(mchNo);
        return true;

      default:
        return false;
    }
  }

  /**
   * 模拟路由选择
   */
  async simulate(params: SelectParams): Promise<SelectResult> {
    const result = await this.selectMerchant(params);
    return result;
  }

  /**
   * 获取路由日志
   */
  getRouteLogs(limit: number = 100): RouteRecord[] {
    return routeLogs.slice(-limit);
  }

  private addRouteLog(log: RouteRecord): void {
    routeLogs.push(log);
    if (routeLogs.length > MAX_LOG_SIZE) {
      routeLogs.shift();
    }
  }

  /**
   * 获取模拟商户数据
   */
  private getMockMerchants(channelCode: string): PoolItem[] {
    // TODO: 从数据库读取
    return [
      {
        id: 'M001',
        channelCode,
        mchNo: 'M001',
        mchName: '微信商户A',
        weight: 70,
        status: 1,
        dailyLimit: 1000000,
        dailyUsed: 350000,
        singleMinAmount: 1,
        singleMaxAmount: 50000,
        payWays: ['WX_JSAPI', 'WX_NATIVE'],
        excludeBins: ['620000'],
      },
      {
        id: 'M002',
        channelCode,
        mchNo: 'M002',
        mchName: '微信商户B',
        weight: 30,
        status: 1,
        dailyLimit: 500000,
        dailyUsed: 200000,
        singleMinAmount: 1,
        singleMaxAmount: 30000,
        payWays: ['WX_JSAPI', 'WX_NATIVE', 'WX_APP'],
        excludeBins: [],
      },
    ];
  }
}

// 单例
export const poolService = new PoolService();
