import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { StatTrade, StatMch, StatAgent, StatChannel, StatFinance } from '../../database/entities/statistics.entity';
import { PayOrder } from '../../database/entities/trade.entity';

export class StatisticsController {
  private tradeRepo = AppDataSource.getRepository(StatTrade);
  private mchRepo = AppDataSource.getRepository(StatMch);
  private agentRepo = AppDataSource.getRepository(StatAgent);
  private channelRepo = AppDataSource.getRepository(StatChannel);
  private financeRepo = AppDataSource.getRepository(StatFinance);

  // ============== Dashboard Stats ==============
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tradeRepo = AppDataSource.getRepository(PayOrder);

      // Today's trade stats
      const todayStats = await tradeRepo.createQueryBuilder('order')
        .select('COUNT(*)', 'totalCount')
        .addSelect('SUM(CASE WHEN order.status = 1 THEN 1 ELSE 0 END)', 'successCount')
        .addSelect('SUM(CASE WHEN order.status = 1 THEN order.amount ELSE 0 END)', 'successAmount')
        .where('order.createTime >= :today', { today })
        .getRawOne();

      // Yesterday's trade stats
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayStats = await tradeRepo.createQueryBuilder('order')
        .select('SUM(CASE WHEN order.status = 1 THEN 1 ELSE 0 END)', 'successCount')
        .addSelect('SUM(CASE WHEN order.status = 1 THEN order.amount ELSE 0 END)', 'successAmount')
        .where('order.createTime >= :yesterday AND order.createTime < :today', { yesterday, today })
        .getRawOne();

      // This month's stats
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const monthStats = await tradeRepo.createQueryBuilder('order')
        .select('SUM(CASE WHEN order.status = 1 THEN 1 ELSE 0 END)', 'successCount')
        .addSelect('SUM(CASE WHEN order.status = 1 THEN order.amount ELSE 0 END)', 'successAmount')
        .addSelect('SUM(CASE WHEN order.status = 5 THEN 1 ELSE 0 END)', 'refundCount')
        .addSelect('SUM(CASE WHEN order.status = 5 THEN order.amount ELSE 0 END)', 'refundAmount')
        .where('order.createTime >= :monthStart', { monthStart })
        .getRawOne();

      // Count stats
      const mchCount = await AppDataSource.getRepository('MchInfo').count();
      const agentCount = await AppDataSource.getRepository('AgentInfo').count();
      const orderCount = await tradeRepo.count();

      res.json({
        code: 0,
        message: 'success',
        data: {
          today: {
            totalCount: Number(todayStats.totalCount) || 0,
            successCount: Number(todayStats.successCount) || 0,
            successAmount: Number(todayStats.successAmount) || 0,
          },
          yesterday: {
            successCount: Number(yesterdayStats.successCount) || 0,
            successAmount: Number(yesterdayStats.successAmount) || 0,
          },
          month: {
            successCount: Number(monthStats.successCount) || 0,
            successAmount: Number(monthStats.successAmount) || 0,
            refundCount: Number(monthStats.refundCount) || 0,
            refundAmount: Number(monthStats.refundAmount) || 0,
          },
          counts: {
            mchCount,
            agentCount,
            orderCount,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  // ============== Trade Statistics ==============
  async getTradeStatList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, startDate, endDate, channelCode, payType } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.tradeRepo.createQueryBuilder('stat');

      if (startDate) queryBuilder.andWhere('stat.statDate >= :startDate', { startDate });
      if (endDate) queryBuilder.andWhere('stat.statDate <= :endDate', { endDate });
      if (channelCode) queryBuilder.andWhere('stat.channelCode = :channelCode', { channelCode });
      if (payType) queryBuilder.andWhere('stat.payType = :payType', { payType });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('stat.statDate', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Merchant Statistics ==============
  async getMchStatList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, startDate, endDate } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.mchRepo.createQueryBuilder('stat');

      if (startDate) queryBuilder.andWhere('stat.statDate >= :startDate', { startDate });
      if (endDate) queryBuilder.andWhere('stat.statDate <= :endDate', { endDate });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('stat.statDate', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Agent Statistics ==============
  async getAgentStatList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, startDate, endDate } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.agentRepo.createQueryBuilder('stat');

      if (startDate) queryBuilder.andWhere('stat.statDate >= :startDate', { startDate });
      if (endDate) queryBuilder.andWhere('stat.statDate <= :endDate', { endDate });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('stat.statDate', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Channel Statistics ==============
  async getChannelStatList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, startDate, endDate } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.channelRepo.createQueryBuilder('stat');

      if (startDate) queryBuilder.andWhere('stat.statDate >= :startDate', { startDate });
      if (endDate) queryBuilder.andWhere('stat.statDate <= :endDate', { endDate });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('stat.statDate', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Finance Statistics ==============
  async getFinanceStatList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, startDate, endDate } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.financeRepo.createQueryBuilder('stat');

      if (startDate) queryBuilder.andWhere('stat.statDate >= :startDate', { startDate });
      if (endDate) queryBuilder.andWhere('stat.statDate <= :endDate', { endDate });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('stat.statDate', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Trade Trend ==============
  async getTradeTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, type = 'daily' } = req.query;

      const orderRepo = AppDataSource.getRepository(PayOrder);

      let dateFormat = '%Y-%m-%d';
      if (type === 'weekly') dateFormat = '%Y-%u';
      if (type === 'monthly') dateFormat = '%Y-%m';

      const data = await orderRepo.createQueryBuilder('order')
        .select(`DATE_FORMAT(order.createTime, '${dateFormat}')`, 'date')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(CASE WHEN order.status = 1 THEN 1 ELSE 0 END)', 'successCount')
        .addSelect('SUM(CASE WHEN order.status = 1 THEN order.amount ELSE 0 END)', 'amount')
        .where('order.createTime >= :startDate', { startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
        .andWhere('order.createTime <= :endDate', { endDate: endDate || new Date() })
        .groupBy(`DATE_FORMAT(order.createTime, '${dateFormat}')`)
        .orderBy('date', 'ASC')
        .getRawMany();

      res.json({ code: 0, message: 'success', data, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Pay Type Stats ==============
  async getPayTypeStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      const orderRepo = AppDataSource.getRepository(PayOrder);

      const data = await orderRepo.createQueryBuilder('order')
        .select('order.payType', 'payType')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(CASE WHEN order.status = 1 THEN 1 ELSE 0 END)', 'successCount')
        .addSelect('SUM(CASE WHEN order.status = 1 THEN order.amount ELSE 0 END)', 'amount')
        .where('order.createTime >= :startDate', { startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
        .andWhere('order.createTime <= :endDate', { endDate: endDate || new Date() })
        .groupBy('order.payType')
        .getRawMany();

      res.json({ code: 0, message: 'success', data, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }
}

export default new StatisticsController();
