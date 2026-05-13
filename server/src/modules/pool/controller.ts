/**
 * DGKJ 支付平台 - 轮转池控制器
 */

import { Request, Response } from 'express';
import { poolService } from './pool.service';
import { circuitBreaker, CircuitState } from './circuit-breaker';
import { healthService } from './health.service';
import { quotaService } from './quota.service';
import { affinityService, AffinityType } from './affinity.service';
import { poolManager } from './smooth-weighted-rr';
import dayjs from 'dayjs';

export class PoolController {
  /**
   * 获取通道商户列表
   */
  async listChannelMch(req: Request, res: Response) {
    try {
      const { channelCode, status, page = 1, pageSize = 20 } = req.query;

      // TODO: 从数据库查询，这里用模拟数据
      const merchants = [
        {
          id: '1',
          channelCode: channelCode || 'WX_JSAPI',
          mchNo: 'M001',
          mchName: '微信商户A',
          appId: 'wx1234567890',
          weight: 70,
          status: Number(status) || 1,
          dailyLimit: 1000000,
          dailyUsed: 350000,
          singleMinAmount: 1,
          singleMaxAmount: 50000,
          bizTypes: ['retail', 'food'],
          excludeBins: ['620000'],
        },
        {
          id: '2',
          channelCode: channelCode || 'WX_JSAPI',
          mchNo: 'M002',
          mchName: '微信商户B',
          appId: 'wx9876543210',
          weight: 30,
          status: 1,
          dailyLimit: 500000,
          dailyUsed: 200000,
          singleMinAmount: 1,
          singleMaxAmount: 30000,
          bizTypes: ['retail'],
          excludeBins: [],
        },
        {
          id: '3',
          channelCode: 'ALI_QR',
          mchNo: 'A001',
          mchName: '支付宝商户A',
          appId: 'ali1234567890',
          weight: 100,
          status: 1,
          dailyLimit: 800000,
          dailyUsed: 400000,
          singleMinAmount: 1,
          singleMaxAmount: 100000,
          bizTypes: ['retail'],
          excludeBins: [],
        },
      ];

      // 添加实时状态
      const merchantsWithStatus = merchants.map(m => {
        const health = healthService.getHealth(m.mchNo, m.channelCode);
        const quota = quotaService.getUsage(m.mchNo, m.channelCode);
        const circuit = circuitBreaker.getHealthSummary(m.mchNo);

        return {
          ...m,
          successRate: health?.successRate || 100,
          avgLatency: health?.avgLatency || 0,
          consecutiveFails: health?.consecutiveFails || 0,
          circuitState: circuit.state,
          dailyQuotaUsed: quota?.dailyUsed || 0,
          dailyQuotaRemaining: quota?.dailyRemaining || m.dailyLimit,
          dailyQuotaUsageRate: quota?.dailyLimit ? (quota.dailyUsed / quota.dailyLimit) * 100 : 0,
        };
      });

      res.json({
        code: 0,
        message: 'success',
        data: {
          list: merchantsWithStatus,
          total: merchantsWithStatus.length,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: (error as Error).message,
        data: null,
      });
    }
  }

  /**
   * 获取商户健康状态
   */
  async getMerchantHealth(req: Request, res: Response) {
    try {
      const { mchNo, channelCode } = req.params;

      const health = healthService.getHealth(mchNo, channelCode);
      const quota = quotaService.getUsage(mchNo, channelCode);
      const circuit = circuitBreaker.getHealthSummary(mchNo);

      res.json({
        code: 0,
        message: 'success',
        data: {
          health,
          quota,
          circuit,
          latencyDistribution: healthService.getLatencyDistribution(mchNo, channelCode),
        },
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: (error as Error).message,
        data: null,
      });
    }
  }

  /**
   * 切换商户状态
   */
  async switchMerchantStatus(req: Request, res: Response) {
    try {
      const { mchNo } = req.params;
      const { action } = req.body;

      const success = poolService.switchMerchant(mchNo, action);

      res.json({
        code: success ? 0 : 1,
        message: success ? '操作成功' : '操作失败',
        data: null,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: (error as Error).message,
        data: null,
      });
    }
  }

  /**
   * 重置熔断器
   */
  async resetCircuitBreaker(req: Request, res: Response) {
    try {
      const { mchNo } = req.params;

      circuitBreaker.reset(mchNo);

      res.json({
        code: 0,
        message: '重置成功',
        data: {
          mchNo,
          state: CircuitState[circuitBreaker.getState(mchNo)],
        },
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: (error as Error).message,
        data: null,
      });
    }
  }

  /**
   * 更新商户配置
   */
  async updateMerchantConfig(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const config = req.body;

      // TODO: 更新数据库
      // await ChannelMch.update(id, config);

      // 更新内存中的轮转池
      if (config.weight !== undefined) {
        poolManager.updateWeight(id, config.weight);
      }

      // 更新配额
      if (config.dailyLimit !== undefined || config.singleMinAmount !== undefined || config.singleMaxAmount !== undefined) {
        quotaService.updateQuota({
          mchNo: id,
          channelCode: config.channelCode || '',
          dailyLimit: config.dailyLimit,
          singleMinAmount: config.singleMinAmount,
          singleMaxAmount: config.singleMaxAmount,
        });
      }

      res.json({
        code: 0,
        message: '更新成功',
        data: config,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: (error as Error).message,
        data: null,
      });
    }
  }

  /**
   * 模拟路由选择
   */
  async simulateRoute(req: Request, res: Response) {
    try {
      const params = req.body;

      const result = await poolService.simulate({
        channelCode: params.channelCode,
        payWay: params.payWay,
        amount: params.amount,
        bin: params.bin,
        bizType: params.bizType,
        userId: params.userId,
        userIdType: params.userIdType as AffinityType,
        excludeMchNos: params.excludeMchNos,
        forceMchNo: params.forceMchNo,
      });

      res.json({
        code: result.success ? 0 : 1,
        message: result.success ? '模拟成功' : result.error,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: (error as Error).message,
        data: null,
      });
    }
  }

  /**
   * 获取路由日志
   */
  async getRouteLogs(req: Request, res: Response) {
    try {
      const { page = 1, pageSize = 20, startDate, endDate, channelCode, status } = req.query;

      let logs = poolService.getRouteLogs(1000);

      // 过滤
      if (startDate) {
        logs = logs.filter(l => dayjs(l.timestamp).isAfter(dayjs(startDate as string)));
      }
      if (endDate) {
        logs = logs.filter(l => dayjs(l.timestamp).isBefore(dayjs(endDate as string)));
      }
      if (channelCode) {
        logs = logs.filter(l => l.channelCode === channelCode);
      }
      if (status !== undefined) {
        logs = logs.filter(l => l.success === (status === '1'));
      }

      // 分页
      const total = logs.length;
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      const pagedLogs = logs.slice(start, end);

      res.json({
        code: 0,
        message: 'success',
        data: {
          list: pagedLogs,
          total,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: (error as Error).message,
        data: null,
      });
    }
  }

  /**
   * 获取通道统计
   */
  async getChannelStats(req: Request, res: Response) {
    try {
      const { channelCode } = req.query;

      const stats = poolService.getChannelStats(channelCode as string || 'WX_JSAPI');
      const healthSummary = healthService.getSummary();
      const poolStats = poolManager.getStats();

      res.json({
        code: 0,
        message: 'success',
        data: {
          ...stats,
          globalHealth: healthSummary,
          poolStats,
        },
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: (error as Error).message,
        data: null,
      });
    }
  }

  /**
   * 获取轮转池状态概览
   */
  async getPoolOverview(req: Request, res: Response) {
    try {
      const healthSummary = healthService.getSummary();
      const allUsage = quotaService.getAllUsage();
      const circuitStates = circuitBreaker.getAllStates();
      const poolStats = poolManager.getStats();

      const totalDailyQuota = allUsage.reduce((sum, u) => sum + u.dailyLimit, 0);
      const totalDailyUsed = allUsage.reduce((sum, u) => sum + u.dailyUsed, 0);

      res.json({
        code: 0,
        message: 'success',
        data: {
          health: healthSummary,
          quota: {
            totalDailyQuota,
            totalDailyUsed,
            quotaUsageRate: totalDailyQuota > 0 ? (totalDailyUsed / totalDailyQuota) * 100 : 0,
          },
          circuit: {
            total: circuitStates.length,
            closed: circuitStates.filter(c => c.state === CircuitState.CLOSED).length,
            halfOpen: circuitStates.filter(c => c.state === CircuitState.HALF_OPEN).length,
            open: circuitStates.filter(c => c.state === CircuitState.OPEN).length,
          },
          pool: {
            totalWeight: poolManager.getTotalWeight(),
            merchantCount: poolManager.getPoolSize(),
            stats: poolStats,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: (error as Error).message,
        data: null,
      });
    }
  }

  /**
   * 重置商户统计
   */
  async resetMerchantStats(req: Request, res: Response) {
    try {
      const { mchNo, channelCode } = req.params;

      healthService.resetHealth(mchNo, channelCode);
      quotaService.resetQuota(mchNo, channelCode);
      circuitBreaker.reset(mchNo);

      res.json({
        code: 0,
        message: '重置成功',
        data: null,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: (error as Error).message,
        data: null,
      });
    }
  }

  /**
   * 获取商户路由历史
   */
  async getUserRouteHistory(req: Request, res: Response) {
    try {
      const { userId, userIdType, channelCode } = req.query;

      const history = affinityService.getUserHistory({
        userId: userId as string,
        userIdType: userIdType as AffinityType,
        channelCode: channelCode as string,
      });

      res.json({
        code: 0,
        message: 'success',
        data: history,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: (error as Error).message,
        data: null,
      });
    }
  }
}

export const poolController = new PoolController();
