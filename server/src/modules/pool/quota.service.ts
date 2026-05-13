/**
 * DGKJ 支付平台 - 配额管理服务
 * 
 * 管理通道商户的日限额、单笔限额等配额控制
 */

import dayjs from 'dayjs';

export enum QuotaType {
  /** 日限额 */
  DAILY = 'daily',
  /** 单笔最小限额 */
  SINGLE_MIN = 'single_min',
  /** 单笔最大限额 */
  SINGLE_MAX = 'single_max',
  /** 月限额 */
  MONTHLY = 'monthly',
}

export interface QuotaCheckResult {
  /** 是否通过检查 */
  passed: boolean;
  /** 错误信息 */
  error?: string;
  /** 错误码 */
  errorCode?: string;
  /** 剩余配额 */
  remaining?: number;
  /** 已用配额 */
  used?: number;
  /** 配额上限 */
  limit?: number;
}

export interface QuotaUsage {
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

export interface MerchantQuota {
  mchNo: string;
  channelCode: string;
  /** 日限额 (0 表示不限) */
  dailyLimit: number;
  /** 当日已用 */
  dailyUsed: number;
  /** 日限权重调整 (用于突发流量) */
  dailyLimitBuffer: number;
  /** 单笔最小限额 */
  singleMinAmount: number;
  /** 单笔最大限额 */
  singleMaxAmount: number;
  /** 月限额 (0 表示不限) */
  monthlyLimit: number;
  /** 当月已用 */
  monthlyUsed: number;
  /** 最后重置时间 (日) */
  dailyResetAt: string;
  /** 最后重置时间 (月) */
  monthlyResetAt: string;
  /** 最后使用时间 */
  lastUsageAt: string;
}

// 内存配额存储 (生产环境建议用 Redis)
const quotaStore = new Map<string, MerchantQuota>();

// 配置默认配额参数
const DEFAULT_SINGLE_MIN = 0.01;      // 默认单笔最小 0.01 元
const DEFAULT_DAILY_LIMIT = 1000000;  // 默认日限额 100 万
const DEFAULT_MONTHLY_LIMIT = 5000000; // 默认月限额 500 万

export class QuotaService {
  /**
   * 初始化商户配额
   */
  initQuota(params: {
    mchNo: string;
    channelCode: string;
    dailyLimit?: number;
    singleMinAmount?: number;
    singleMaxAmount?: number;
    monthlyLimit?: number;
  }): MerchantQuota {
    const key = this.getKey(params.mchNo, params.channelCode);
    const now = dayjs();
    const today = now.format('YYYY-MM-DD');
    const monthStart = now.startOf('month').format('YYYY-MM-DD');

    const existing = quotaStore.get(key);

    // 检查是否需要重置
    if (existing) {
      // 日重置
      if (existing.dailyResetAt !== today) {
        existing.dailyUsed = 0;
        existing.dailyResetAt = today;
      }

      // 月重置
      if (existing.monthlyResetAt !== monthStart) {
        existing.monthlyUsed = 0;
        existing.monthlyResetAt = monthStart;
      }

      return existing;
    }

    const quota: MerchantQuota = {
      mchNo: params.mchNo,
      channelCode: params.channelCode,
      dailyLimit: params.dailyLimit ?? DEFAULT_DAILY_LIMIT,
      dailyUsed: 0,
      dailyLimitBuffer: 0,
      singleMinAmount: params.singleMinAmount ?? DEFAULT_SINGLE_MIN,
      singleMaxAmount: params.singleMaxAmount ?? 0, // 0 表示不限
      monthlyLimit: params.monthlyLimit ?? DEFAULT_MONTHLY_LIMIT,
      monthlyUsed: 0,
      dailyResetAt: today,
      monthlyResetAt: monthStart,
      lastUsageAt: '',
    };

    quotaStore.set(key, quota);
    return quota;
  }

  /**
   * 检查金额是否满足商户配额限制
   */
  checkQuota(params: {
    mchNo: string;
    channelCode: string;
    amount: number;
    dailyLimit?: number;
    singleMinAmount?: number;
    singleMaxAmount?: number;
    monthlyLimit?: number;
  }): QuotaCheckResult {
    const key = this.getKey(params.mchNo, params.channelCode);
    let quota = quotaStore.get(key);
    const amount = params.amount;

    // 如果不存在，初始化
    if (!quota) {
      quota = this.initQuota({
        mchNo: params.mchNo,
        channelCode: params.channelCode,
        dailyLimit: params.dailyLimit,
        singleMinAmount: params.singleMinAmount,
        singleMaxAmount: params.singleMaxAmount,
        monthlyLimit: params.monthlyLimit,
      });
    }

    // 检查单笔最小限额
    if (params.singleMinAmount !== undefined && params.singleMinAmount > 0) {
      quota.singleMinAmount = params.singleMinAmount;
    }
    if (amount < quota.singleMinAmount) {
      return {
        passed: false,
        error: `交易金额 ${amount} 低于单笔最小限额 ${quota.singleMinAmount}`,
        errorCode: 'SINGLE_MIN_EXCEEDED',
        remaining: 0,
        used: amount,
        limit: quota.singleMinAmount,
      };
    }

    // 检查单笔最大限额
    if (params.singleMaxAmount !== undefined && params.singleMaxAmount > 0) {
      quota.singleMaxAmount = params.singleMaxAmount;
    }
    if (quota.singleMaxAmount > 0 && amount > quota.singleMaxAmount) {
      return {
        passed: false,
        error: `交易金额 ${amount} 超过单笔最大限额 ${quota.singleMaxAmount}`,
        errorCode: 'SINGLE_MAX_EXCEEDED',
        remaining: 0,
        used: amount,
        limit: quota.singleMaxAmount,
      };
    }

    // 日限额检查
    const effectiveDailyLimit = quota.dailyLimit + quota.dailyLimitBuffer;
    const remainingDaily = effectiveDailyLimit - quota.dailyUsed;

    if (effectiveDailyLimit > 0 && amount > remainingDaily) {
      return {
        passed: false,
        error: `交易金额 ${amount} 超过日剩余配额 ${remainingDaily} (日限额 ${effectiveDailyLimit})`,
        errorCode: 'DAILY_QUOTA_EXCEEDED',
        remaining: remainingDaily,
        used: quota.dailyUsed,
        limit: effectiveDailyLimit,
      };
    }

    // 月限额检查
    const remainingMonthly = quota.monthlyLimit - quota.monthlyUsed;
    if (quota.monthlyLimit > 0 && amount > remainingMonthly) {
      return {
        passed: false,
        error: `交易金额 ${amount} 超过月剩余配额 ${remainingMonthly} (月限额 ${quota.monthlyLimit})`,
        errorCode: 'MONTHLY_QUOTA_EXCEEDED',
        remaining: remainingMonthly,
        used: quota.monthlyUsed,
        limit: quota.monthlyLimit,
      };
    }

    return {
      passed: true,
      remaining: remainingDaily,
      used: quota.dailyUsed,
      limit: effectiveDailyLimit,
    };
  }

  /**
   * 消费配额 (扣减)
   */
  consumeQuota(params: {
    mchNo: string;
    channelCode: string;
    amount: number;
    rollback?: boolean; // 是否回滚
  }): boolean {
    const key = this.getKey(params.mchNo, params.channelCode);
    const quota = quotaStore.get(key);

    if (!quota) {
      console.warn(`[QuotaService] Quota not found for ${key}`);
      return false;
    }

    const amount = params.rollback ? -params.amount : params.amount;

    quota.dailyUsed = Math.max(0, quota.dailyUsed + amount);
    quota.monthlyUsed = Math.max(0, quota.monthlyUsed + amount);
    quota.lastUsageAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

    return true;
  }

  /**
   * 获取配额使用情况
   */
  getUsage(mchNo: string, channelCode: string): QuotaUsage | null {
    const key = this.getKey(mchNo, channelCode);
    const quota = quotaStore.get(key);

    if (!quota) {
      return null;
    }

    return {
      mchNo: quota.mchNo,
      channelCode: quota.channelCode,
      dailyUsed: quota.dailyUsed,
      dailyLimit: quota.dailyLimit + quota.dailyLimitBuffer,
      dailyRemaining: Math.max(0, (quota.dailyLimit + quota.dailyLimitBuffer) - quota.dailyUsed),
      monthlyUsed: quota.monthlyUsed,
      monthlyLimit: quota.monthlyLimit,
      monthlyRemaining: Math.max(0, quota.monthlyLimit - quota.monthlyUsed),
      lastResetTime: quota.dailyResetAt,
      lastUsageTime: quota.lastUsageAt,
    };
  }

  /**
   * 获取所有配额使用情况
   */
  getAllUsage(): QuotaUsage[] {
    const usages: QuotaUsage[] = [];

    for (const quota of quotaStore.values()) {
      usages.push({
        mchNo: quota.mchNo,
        channelCode: quota.channelCode,
        dailyUsed: quota.dailyUsed,
        dailyLimit: quota.dailyLimit + quota.dailyLimitBuffer,
        dailyRemaining: Math.max(0, (quota.dailyLimit + quota.dailyLimitBuffer) - quota.dailyUsed),
        monthlyUsed: quota.monthlyUsed,
        monthlyLimit: quota.monthlyLimit,
        monthlyRemaining: Math.max(0, quota.monthlyLimit - quota.monthlyUsed),
        lastResetTime: quota.dailyResetAt,
        lastUsageTime: quota.lastUsageAt,
      });
    }

    return usages;
  }

  /**
   * 更新配额配置
   */
  updateQuota(params: {
    mchNo: string;
    channelCode: string;
    dailyLimit?: number;
    singleMinAmount?: number;
    singleMaxAmount?: number;
    monthlyLimit?: number;
    dailyLimitBuffer?: number;
  }): boolean {
    const key = this.getKey(params.mchNo, params.channelCode);
    const quota = quotaStore.get(key);

    if (!quota) {
      return false;
    }

    if (params.dailyLimit !== undefined) {
      quota.dailyLimit = params.dailyLimit;
    }
    if (params.singleMinAmount !== undefined) {
      quota.singleMinAmount = params.singleMinAmount;
    }
    if (params.singleMaxAmount !== undefined) {
      quota.singleMaxAmount = params.singleMaxAmount;
    }
    if (params.monthlyLimit !== undefined) {
      quota.monthlyLimit = params.monthlyLimit;
    }
    if (params.dailyLimitBuffer !== undefined) {
      quota.dailyLimitBuffer = params.dailyLimitBuffer;
    }

    return true;
  }

  /**
   * 重置配额
   */
  resetQuota(mchNo: string, channelCode: string, type: 'daily' | 'monthly' | 'all' = 'daily'): boolean {
    const key = this.getKey(mchNo, channelCode);
    const quota = quotaStore.get(key);

    if (!quota) {
      return false;
    }

    const today = dayjs().format('YYYY-MM-DD');
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');

    if (type === 'daily' || type === 'all') {
      quota.dailyUsed = 0;
      quota.dailyResetAt = today;
    }

    if (type === 'monthly' || type === 'all') {
      quota.monthlyUsed = 0;
      quota.monthlyResetAt = monthStart;
    }

    return true;
  }

  /**
   * 删除配额记录
   */
  deleteQuota(mchNo: string, channelCode: string): boolean {
    const key = this.getKey(mchNo, channelCode);
    return quotaStore.delete(key);
  }

  /**
   * 获取日配额使用率 (百分比)
   */
  getDailyUsageRate(mchNo: string, channelCode: string): number {
    const usage = this.getUsage(mchNo, channelCode);
    if (!usage || usage.dailyLimit === 0) {
      return 0;
    }
    return (usage.dailyUsed / usage.dailyLimit) * 100;
  }

  /**
   * 获取月配额使用率 (百分比)
   */
  getMonthlyUsageRate(mchNo: string, channelCode: string): number {
    const usage = this.getUsage(mchNo, channelCode);
    if (!usage || usage.monthlyLimit === 0) {
      return 0;
    }
    return (usage.monthlyUsed / usage.monthlyLimit) * 100;
  }

  /**
   * 清理过期记录 (日终任务)
   */
  cleanup(): number {
    const today = dayjs().format('YYYY-MM-DD');
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    let cleaned = 0;

    for (const [key, quota] of quotaStore.entries()) {
      // 重置日配额
      if (quota.dailyResetAt !== today) {
        quota.dailyUsed = 0;
        quota.dailyResetAt = today;
      }

      // 重置月配额
      if (quota.monthlyResetAt !== monthStart) {
        quota.monthlyUsed = 0;
        quota.monthlyResetAt = monthStart;
      }

      // 清理长期无活动的记录
      if (quota.lastUsageAt) {
        const lastUsage = dayjs(quota.lastUsageAt);
        if (dayjs().diff(lastUsage, 'day') > 30) {
          quotaStore.delete(key);
          cleaned++;
        }
      }
    }

    return cleaned;
  }

  private getKey(mchNo: string, channelCode: string): string {
    return `${channelCode}:${mchNo}`;
  }
}

// 单例
export const quotaService = new QuotaService();
