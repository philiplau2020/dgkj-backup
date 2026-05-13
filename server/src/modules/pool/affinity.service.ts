/**
 * DGKJ 支付平台 - 亲和性服务
 * 
 * 管理用户-商户亲和性，实现用户偏好路由
 */

import dayjs from 'dayjs';

export enum AffinityType {
  /** 设备 ID */
  DEVICE = 'device',
  /** 客户 ID */
  CUSTOMER = 'customer',
  /** 手机号 */
  PHONE = 'phone',
  /** IP 地址 */
  IP = 'ip',
}

export interface UserAffinity {
  /** 唯一标识 */
  id: number;
  /** 用户标识 */
  userId: string;
  /** 用户标识类型 */
  userIdType: AffinityType;
  /** 通道编码 */
  channelCode: string;
  /** 商户号 */
  mchNo: string;
  /** 成功次数 */
  successCount: number;
  /** 失败次数 */
  failCount: number;
  /** 最后成功时间 */
  lastSuccessTime: string;
  /** 最后失败时间 */
  lastFailTime: string;
  /** 亲和度分数 (0-1) */
  affinityScore: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

export interface AffinityRecord {
  /** 用户标识 */
  userId: string;
  /** 用户标识类型 */
  userIdType: AffinityType;
  /** 通道编码 */
  channelCode: string;
  /** 商户号 */
  mchNo: string;
  /** 成功次数 */
  successCount: number;
  /** 失败次数 */
  failCount: number;
  /** 亲和度分数 */
  affinityScore: number;
  /** 最后使用时间 */
  lastUsedTime: string;
}

// 内存存储
const affinityStore = new Map<string, UserAffinity>();
const userChannelHistory = new Map<string, AffinityRecord[]>();

// 亲和度计算配置
const AFFINITY_CONFIG = {
  /** 最小样本数，低于此值不考虑亲和性 */
  minSampleSize: 3,
  /** 成功次数权重 */
  successWeight: 0.7,
  /** 失败次数权重 */
  failWeight: 0.3,
  /** 亲和度衰减因子 (每天) */
  decayFactor: 0.01,
  /** 最大亲和度 */
  maxAffinityScore: 1.0,
  /** 最小亲和度 */
  minAffinityScore: 0,
};

export class AffinityService {
  /**
   * 获取用户偏好的商户
   */
  getPreferredMerchant(params: {
    userId: string;
    userIdType: AffinityType;
    channelCode: string;
  }): string | null {
    const key = this.getKey(params.userId, params.userIdType, params.channelCode);

    // 获取该用户在该通道的所有商户记录
    const records = userChannelHistory.get(key) || [];

    if (records.length < AFFINITY_CONFIG.minSampleSize) {
      return null; // 样本太少，不考虑
    }

    // 找到亲和度最高的商户
    let bestRecord: AffinityRecord | null = null;
    let bestScore = -1;

    for (const record of records) {
      // 考虑时间衰减
      const age = dayjs().diff(dayjs(record.lastUsedTime), 'day');
      const decayedScore = record.affinityScore * Math.pow(1 - AFFINITY_CONFIG.decayFactor, age);

      if (decayedScore > bestScore) {
        bestScore = decayedScore;
        bestRecord = record;
      }
    }

    return bestRecord?.mchNo || null;
  }

  /**
   * 获取用户历史使用的商户列表
   */
  getUserHistory(params: {
    userId: string;
    userIdType: AffinityType;
    channelCode?: string;
  }): AffinityRecord[] {
    const baseKey = `${params.userId}:${params.userIdType}`;

    if (params.channelCode) {
      const key = `${baseKey}:${params.channelCode}`;
      return userChannelHistory.get(key) || [];
    }

    // 返回所有通道的历史
    const allHistory: AffinityRecord[] = [];
    for (const [key, records] of userChannelHistory.entries()) {
      if (key.startsWith(baseKey)) {
        allHistory.push(...records);
      }
    }

    return allHistory.sort((a, b) =>
      dayjs(b.lastUsedTime).valueOf() - dayjs(a.lastUsedTime).valueOf()
    );
  }

  /**
   * 记录成功交易
   */
  recordSuccess(params: {
    userId: string;
    userIdType: AffinityType;
    channelCode: string;
    mchNo: string;
    amount?: number;
  }): void {
    const key = this.getKey(params.userId, params.userIdType, params.channelCode);

    // 获取或创建记录
    let records = userChannelHistory.get(key);
    if (!records) {
      records = [];
      userChannelHistory.set(key, records);
    }

    // 查找该商户的记录
    let record = records.find(r => r.mchNo === params.mchNo);
    if (!record) {
      record = {
        userId: params.userId,
        userIdType: params.userIdType,
        channelCode: params.channelCode,
        mchNo: params.mchNo,
        successCount: 0,
        failCount: 0,
        affinityScore: 0,
        lastUsedTime: '',
      };
      records.push(record);
    }

    // 更新统计
    record.successCount++;
    record.lastUsedTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // 重新计算亲和度
    record.affinityScore = this.calculateAffinityScore(
      record.successCount,
      record.failCount
    );

    // 保存到完整存储
    this.saveAffinityRecord(record);
  }

  /**
   * 记录失败交易
   */
  recordFailure(params: {
    userId: string;
    userIdType: AffinityType;
    channelCode: string;
    mchNo: string;
    failType?: string;
  }): void {
    const key = this.getKey(params.userId, params.userIdType, params.channelCode);

    const records = userChannelHistory.get(key);
    if (!records) {
      return;
    }

    const record = records.find(r => r.mchNo === params.mchNo);
    if (!record) {
      return;
    }

    // 更新失败次数
    record.failCount++;
    record.lastUsedTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // 重新计算亲和度
    record.affinityScore = this.calculateAffinityScore(
      record.successCount,
      record.failCount
    );

    this.saveAffinityRecord(record);
  }

  /**
   * 批量获取用户偏好
   */
  batchGetPreferredMerchants(requests: Array<{
    userId: string;
    userIdType: AffinityType;
    channelCode: string;
  }>): Map<string, string | null> {
    const results = new Map<string, string | null>();

    for (const req of requests) {
      const key = `${req.userId}:${req.userIdType}:${req.channelCode}`;
      results.set(key, this.getPreferredMerchant(req));
    }

    return results;
  }

  /**
   * 清除用户亲和性数据
   */
  clearUserAffinity(userId: string, userIdType?: AffinityType): number {
    let cleared = 0;

    if (userIdType) {
      const pattern = `${userId}:${userIdType}:`;
      for (const key of userChannelHistory.keys()) {
        if (key.startsWith(pattern)) {
          userChannelHistory.delete(key);
          cleared++;
        }
      }
    } else {
      const pattern = `${userId}:`;
      for (const key of userChannelHistory.keys()) {
        if (key.startsWith(pattern)) {
          userChannelHistory.delete(key);
          cleared++;
        }
      }
    }

    return cleared;
  }

  /**
   * 获取商户的用户统计
   */
  getMerchantStats(mchNo: string): {
    totalUsers: number;
    avgAffinity: number;
    topUsers: Array<{ userId: string; userIdType: AffinityType; affinityScore: number }>;
  } {
    const userStats = new Map<string, { userId: string; userIdType: AffinityType; totalScore: number; count: number }>();

    for (const records of userChannelHistory.values()) {
      for (const record of records) {
        if (record.mchNo !== mchNo) continue;

        const key = `${record.userId}:${record.userIdType}`;
        const existing = userStats.get(key);

        if (existing) {
          existing.totalScore += record.affinityScore;
          existing.count++;
        } else {
          userStats.set(key, {
            userId: record.userId,
            userIdType: record.userIdType,
            totalScore: record.affinityScore,
            count: 1,
          });
        }
      }
    }

    const topUsers: Array<{ userId: string; userIdType: AffinityType; affinityScore: number }> = [];
    let totalScore = 0;

    for (const stat of userStats.values()) {
      const avgScore = stat.totalScore / stat.count;
      topUsers.push({
        userId: stat.userId,
        userIdType: stat.userIdType,
        affinityScore: avgScore,
      });
      totalScore += avgScore;
    }

    topUsers.sort((a, b) => b.affinityScore - a.affinityScore);

    return {
      totalUsers: userStats.size,
      avgAffinity: userStats.size > 0 ? totalScore / userStats.size : 0,
      topUsers: topUsers.slice(0, 10),
    };
  }

  /**
   * 获取亲和性摘要
   */
  getSummary(): {
    totalRecords: number;
    totalUsers: number;
    totalMerchants: number;
    avgAffinity: number;
  } {
    const users = new Set<string>();
    const merchants = new Set<string>();
    let totalScore = 0;
    let totalRecords = 0;

    for (const records of userChannelHistory.values()) {
      for (const record of records) {
        users.add(`${record.userId}:${record.userIdType}`);
        merchants.add(record.mchNo);
        totalScore += record.affinityScore;
        totalRecords++;
      }
    }

    return {
      totalRecords,
      totalUsers: users.size,
      totalMerchants: merchants.size,
      avgAffinity: totalRecords > 0 ? totalScore / totalRecords : 0,
    };
  }

  /**
   * 清理过期数据
   */
  cleanup(daysToKeep: number = 90): number {
    const cutoff = dayjs().subtract(daysToKeep, 'day');
    let cleaned = 0;

    for (const [key, records] of userChannelHistory.entries()) {
      const filtered = records.filter(r =>
        dayjs(r.lastUsedTime).isAfter(cutoff)
      );

      if (filtered.length === 0) {
        userChannelHistory.delete(key);
      } else if (filtered.length !== records.length) {
        userChannelHistory.set(key, filtered);
        cleaned += records.length - filtered.length;
      }
    }

    return cleaned;
  }

  private calculateAffinityScore(successCount: number, failCount: number): number {
    if (successCount + failCount < AFFINITY_CONFIG.minSampleSize) {
      return 0;
    }

    const successRate = successCount / (successCount + failCount);
    const score = successRate * AFFINITY_CONFIG.successWeight +
      (1 - failCount / Math.max(successCount + failCount, 1)) * AFFINITY_CONFIG.failWeight * successRate;

    return Math.max(
      AFFINITY_CONFIG.minAffinityScore,
      Math.min(AFFINITY_CONFIG.maxAffinityScore, score)
    );
  }

  private saveAffinityRecord(record: AffinityRecord): void {
    const key = this.getKey(record.userId, record.userIdType, record.channelCode);
    const id = `${key}:${record.mchNo}`;

    const existing = affinityStore.get(id);
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (existing) {
      existing.successCount = record.successCount;
      existing.failCount = record.failCount;
      existing.affinityScore = record.affinityScore;
      existing.lastSuccessTime = record.lastUsedTime;
      existing.updatedAt = now;
    } else {
      affinityStore.set(id, {
        id: Date.now(),
        userId: record.userId,
        userIdType: record.userIdType,
        channelCode: record.channelCode,
        mchNo: record.mchNo,
        successCount: record.successCount,
        failCount: record.failCount,
        lastSuccessTime: record.lastUsedTime,
        lastFailTime: '',
        affinityScore: record.affinityScore,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  private getKey(userId: string, userIdType: AffinityType, channelCode: string): string {
    return `${userId}:${userIdType}:${channelCode}`;
  }
}

// 单例
export const affinityService = new AffinityService();
