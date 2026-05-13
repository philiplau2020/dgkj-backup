import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/data-source';
import { ChannelInfo, ChannelMch, ChannelRoute, PoolStrategy, PoolChannel, PoolConfig } from '../../database/entities/channel.entity';

export class ChannelController {
  private channelRepo = AppDataSource.getRepository(ChannelInfo);
  private channelMchRepo = AppDataSource.getRepository(ChannelMch);
  private channelRouteRepo = AppDataSource.getRepository(ChannelRoute);
  private strategyRepo = AppDataSource.getRepository(PoolStrategy);
  private poolChannelRepo = AppDataSource.getRepository(PoolChannel);
  private poolConfigRepo = AppDataSource.getRepository(PoolConfig);

  // ============== Channel Info ==============
  async getChannelList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, channelCode, channelName, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.channelRepo.createQueryBuilder('channel');
      if (channelCode) queryBuilder.andWhere('channel.channelCode LIKE :channelCode', { channelCode: `%${channelCode}%` });
      if (channelName) queryBuilder.andWhere('channel.channelName LIKE :channelName', { channelName: `%${channelName}%` });
      if (status !== undefined) queryBuilder.andWhere('channel.status = :status', { status });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('channel.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getChannelById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const channel = await this.channelRepo.findOne({ where: { id } });
      if (!channel) return res.status(404).json({ code: 404, message: '通道不存在', data: null, timestamp: new Date().toISOString() });
      res.json({ code: 0, message: 'success', data: channel, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelCode, channelName, channelShortName, channelType, provider, appId, appSecret, mchId, apiKey, payUrl, notifyUrl, remark } = req.body;

      const channel = this.channelRepo.create({
        id: uuidv4(),
        channelCode,
        channelName,
        channelShortName,
        channelType,
        provider,
        appId,
        appSecret,
        mchId,
        apiKey,
        payUrl,
        notifyUrl,
        remark,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.channelRepo.save(channel);
      res.json({ code: 0, message: '创建成功', data: channel, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updateTime = new Date();
      await this.channelRepo.update(id, updateData);
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Channel Mch ==============
  async getChannelMchList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, channelCode, mchNo } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.channelMchRepo.createQueryBuilder('cm');
      if (channelCode) queryBuilder.andWhere('cm.channelCode = :channelCode', { channelCode });
      if (mchNo) queryBuilder.andWhere('cm.mchNo = :mchNo', { mchNo });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('cm.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createChannelMch(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelCode, channelMchId, mchNo, mchName, appId, appSecret, remark } = req.body;

      const channelMch = this.channelMchRepo.create({
        id: uuidv4(),
        channelCode,
        channelMchId,
        mchNo,
        mchName,
        appId,
        appSecret,
        remark,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.channelMchRepo.save(channelMch);
      res.json({ code: 0, message: '创建成功', data: channelMch, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateChannelMch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updateTime = new Date();
      await this.channelMchRepo.update(id, updateData);
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async deleteChannelMch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.channelMchRepo.delete(id);
      res.json({ code: 0, message: '删除成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Channel Route ==============
  async getRouteList(req: Request, res: Response, next: NextFunction) {
    return this.getChannelRouteList(req, res, next);
  }

  async createRoute(req: Request, res: Response, next: NextFunction) {
    return this.createChannelRoute(req, res, next);
  }

  async updateRoute(req: Request, res: Response, next: NextFunction) {
    return this.updateChannelRoute(req, res, next);
  }

  async getChannelRouteList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, payType } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.channelRouteRepo.createQueryBuilder('route');
      if (payType) queryBuilder.andWhere('route.payType = :payType', { payType });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('route.priority', 'ASC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createChannelRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const { routeName, routeCode, payType, priority, channelCodes, routeType, routeRule, remark } = req.body;

      const route = this.channelRouteRepo.create({
        id: uuidv4(),
        routeName,
        routeCode,
        payType,
        priority,
        channelCodes: JSON.stringify(channelCodes),
        routeType,
        routeRule,
        remark,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.channelRouteRepo.save(route);
      res.json({ code: 0, message: '创建成功', data: route, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateChannelRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      if (updateData.channelCodes && typeof updateData.channelCodes === 'object') {
        updateData.channelCodes = JSON.stringify(updateData.channelCodes);
      }
      updateData.updateTime = new Date();
      await this.channelRouteRepo.update(id, updateData);
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Pool Config ==============
  async getPoolList(req: Request, res: Response, next: NextFunction) {
    try {
      const pools = await this.poolConfigRepo.find({ order: { createTime: 'DESC' } });
      res.json({ code: 0, message: 'success', data: pools, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createPool(req: Request, res: Response, next: NextFunction) {
    try {
      const { poolName, poolCode, poolType, description } = req.body;

      const pool = this.poolConfigRepo.create({
        id: uuidv4(),
        poolName,
        poolCode,
        poolType,
        description,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.poolConfigRepo.save(pool);
      res.json({ code: 0, message: '创建成功', data: pool, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Pool Strategy ==============
  async getStrategyList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, channelCode } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.strategyRepo.createQueryBuilder('strategy');
      if (channelCode) queryBuilder.andWhere('strategy.channelCode = :channelCode', { channelCode });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('strategy.weight', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createStrategy(req: Request, res: Response, next: NextFunction) {
    try {
      const { strategyName, strategyCode, strategyType, channelCode, weight, maxAmount, minAmount, timeRange, weekDays, remark } = req.body;

      const strategy = this.strategyRepo.create({
        id: uuidv4(),
        strategyName,
        strategyCode,
        strategyType,
        channelCode,
        weight,
        maxAmount,
        minAmount,
        timeRange,
        weekDays,
        remark,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.strategyRepo.save(strategy);
      res.json({ code: 0, message: '创建成功', data: strategy, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateStrategy(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updateTime = new Date();
      await this.strategyRepo.update(id, updateData);
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getRecommendedChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { payType, amount } = req.query;

      if (!payType) {
        // 返回所有可用通道
        const channels = await this.channelRepo.find({ where: { status: 1 }, take: 10 });
        return res.json({ code: 0, message: 'success', data: channels.length > 0 ? channels[0] : null, timestamp: new Date().toISOString() });
      }

      const strategies = await this.strategyRepo.createQueryBuilder('strategy')
        .where('strategy.status = 1')
        .andWhere('strategy.payType = :payType', { payType })
        .andWhere('strategy.channelCode IS NOT NULL')
        .orderBy('strategy.weight', 'DESC')
        .getMany();

      if (strategies.length === 0) {
        return res.json({ code: 0, message: 'success', data: null, timestamp: new Date().toISOString() });
      }

      const validStrategies = strategies.filter(s => {
        if (s.minAmount && Number(amount) < Number(s.minAmount)) return false;
        if (s.maxAmount && Number(amount) > Number(s.maxAmount)) return false;
        return true;
      });

      if (validStrategies.length === 0) {
        return res.json({ code: 0, message: 'success', data: null, timestamp: new Date().toISOString() });
      }

      const totalWeight = validStrategies.reduce((sum, s) => sum + s.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedStrategy = validStrategies[0];

      for (const strategy of validStrategies) {
        random -= strategy.weight;
        if (random <= 0) {
          selectedStrategy = strategy;
          break;
        }
      }

      const channel = await this.channelRepo.findOne({ where: { channelCode: selectedStrategy.channelCode } });

      res.json({ code: 0, message: 'success', data: channel, timestamp: new Date().toISOString() });
    } catch (error) {
      // 出错时返回空数据而不是500
      res.json({ code: 0, message: 'success', data: null, timestamp: new Date().toISOString() });
    }
  }

  // ============== Pool/Channel Stats ==============
  async getChannelStats(req: Request, res: Response, next: NextFunction) {
    try {
      const totalChannel = await this.channelRepo.count({ where: { status: 1 } });
      const allChannels = await this.channelRepo.find({ where: { status: 1 } });

      res.json({
        code: 0,
        message: 'success',
        data: {
          totalChannel,
          activeChannel: totalChannel,
          todayTotalAmount: 0,
          todayTotalCount: 0,
          avgSuccessRate: 0,
          avgResponseTime: 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.json({
        code: 0,
        message: 'success',
        data: { totalChannel: 0, activeChannel: 0, todayTotalAmount: 0, todayTotalCount: 0, avgSuccessRate: 0, avgResponseTime: 0 },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default new ChannelController();
