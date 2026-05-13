import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/data-source';
import { MchInfo, MchApp, MchStore, MchRate } from '../../database/entities/mch.entity';

export class MchController {
  private mchRepo = AppDataSource.getRepository(MchInfo);
  private appRepo = AppDataSource.getRepository(MchApp);
  private storeRepo = AppDataSource.getRepository(MchStore);
  private rateRepo = AppDataSource.getRepository(MchRate);

  // ============== Merchant Info ==============
  async getMchList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, mchNo, mchName, mchType, status, agentId, startTime, endTime } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.mchRepo.createQueryBuilder('mch');

      if (mchNo) queryBuilder.andWhere('mch.mchNo LIKE :mchNo', { mchNo: `%${mchNo}%` });
      if (mchName) queryBuilder.andWhere('mch.mchName LIKE :mchName', { mchName: `%${mchName}%` });
      if (mchType !== undefined) queryBuilder.andWhere('mch.mchType = :mchType', { mchType });
      if (status !== undefined) queryBuilder.andWhere('mch.status = :status', { status });
      if (agentId) queryBuilder.andWhere('mch.agentId = :agentId', { agentId });
      if (startTime) queryBuilder.andWhere('mch.createTime >= :startTime', { startTime });
      if (endTime) queryBuilder.andWhere('mch.createTime <= :endTime', { endTime });

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('mch.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getMchById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const mch = await this.mchRepo.findOne({ where: { id } });
      if (!mch) return res.status(404).json({ code: 404, message: '商户不存在', data: null, timestamp: new Date().toISOString() });
      res.json({ code: 0, message: 'success', data: mch, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getMchByMchNo(req: Request, res: Response, next: NextFunction) {
    try {
      const { mchNo } = req.params;
      const mch = await this.mchRepo.findOne({ where: { mchNo } });
      if (!mch) return res.status(404).json({ code: 404, message: '商户不存在', data: null, timestamp: new Date().toISOString() });
      res.json({ code: 0, message: 'success', data: mch, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createMch(req: Request, res: Response, next: NextFunction) {
    try {
      const { mchName, mchShortName, mchType, agentId, contactName, contactPhone, contactEmail, province, city, district, address, bankName, bankAccount, bankUsername } = req.body;

      const mchNo = 'M' + Date.now();
      const mch = this.mchRepo.create({
        id: uuidv4(),
        mchNo,
        mchName,
        mchShortName,
        mchType,
        agentId,
        contactName,
        contactPhone,
        contactEmail,
        province,
        city,
        district,
        address,
        bankName,
        bankAccount,
        bankUsername,
        status: 2, // Pending review
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.mchRepo.save(mch);
      res.json({ code: 0, message: '创建成功', data: mch, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateMch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updateTime = new Date();
      await this.mchRepo.update(id, updateData);
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async deleteMch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const mch = await this.mchRepo.findOne({ where: { id } });
      if (!mch) {
        return res.status(404).json({ code: 404, message: '商户不存在', data: null, timestamp: new Date().toISOString() });
      }
      if (mch.status === 1) {
        return res.status(400).json({ code: 400, message: '已启用的商户不能删除', data: null, timestamp: new Date().toISOString() });
      }
      await this.mchRepo.delete(id);
      res.json({ code: 0, message: '删除成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async reviewMch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, reviewRemark } = req.body;
      await this.mchRepo.update(id, {
        status,
        reviewRemark,
        reviewTime: new Date(),
        reviewUserId: req.user?.userId,
        updateTime: new Date(),
      });
      res.json({ code: 0, message: '审核成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async enableMch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.mchRepo.update(id, { status: 1, updateTime: new Date() });
      res.json({ code: 0, message: '启用成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async disableMch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.mchRepo.update(id, { status: 2, updateTime: new Date() });
      res.json({ code: 0, message: '禁用成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== App Management ==============
  async getAppList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, mchNo } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.appRepo.createQueryBuilder('app');
      if (mchNo) queryBuilder.andWhere('app.mchNo = :mchNo', { mchNo });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('app.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createApp(req: Request, res: Response, next: NextFunction) {
    try {
      const { mchNo, appName, notifyUrl, returnUrl } = req.body;
      const appId = 'APP' + Date.now();
      const appSecret = uuidv4().replace(/-/g, '');

      const app = this.appRepo.create({
        id: uuidv4(),
        appId,
        mchNo,
        appName,
        appSecret,
        notifyUrl,
        returnUrl,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.appRepo.save(app);
      res.json({ code: 0, message: '创建成功', data: app, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateApp(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updateTime = new Date();
      await this.appRepo.update(id, updateData);
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Store Management ==============
  async getStoreList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, mchNo, storeId, storeName, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.storeRepo.createQueryBuilder('store');
      if (mchNo) queryBuilder.andWhere('store.mchNo = :mchNo', { mchNo });
      if (storeId) queryBuilder.andWhere('store.storeId LIKE :storeId', { storeId: `%${storeId}%` });
      if (storeName) queryBuilder.andWhere('store.storeName LIKE :storeName', { storeName: `%${storeName}%` });
      if (status !== undefined) queryBuilder.andWhere('store.status = :status', { status });

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('store.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getStoreById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const store = await this.storeRepo.findOne({ where: { id } });
      if (!store) {
        return res.status(404).json({ code: 404, message: '门店不存在', data: null, timestamp: new Date().toISOString() });
      }
      res.json({ code: 0, message: 'success', data: store, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createStore(req: Request, res: Response, next: NextFunction) {
    try {
      const { mchNo, storeName, storeNo, contactName, contactPhone, province, city, district, address, latitude, longitude } = req.body;
      const storeId = 'S' + Date.now();

      const store = this.storeRepo.create({
        id: uuidv4(),
        storeId,
        mchNo,
        storeName,
        storeNo,
        contactName,
        contactPhone,
        province,
        city,
        district,
        address,
        latitude,
        longitude,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.storeRepo.save(store);
      res.json({ code: 0, message: '创建成功', data: store, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateStore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updateTime = new Date();
      await this.storeRepo.update(id, updateData);
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async deleteStore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const store = await this.storeRepo.findOne({ where: { id } });
      if (!store) {
        return res.status(404).json({ code: 404, message: '门店不存在', data: null, timestamp: new Date().toISOString() });
      }
      await this.storeRepo.delete(id);
      res.json({ code: 0, message: '删除成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async enableStore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.storeRepo.update(id, { status: 1, updateTime: new Date() });
      res.json({ code: 0, message: '启用成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async disableStore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.storeRepo.update(id, { status: 0, updateTime: new Date() });
      res.json({ code: 0, message: '禁用成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Rate Management ==============
  async getRateList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, mchNo, payWay, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const queryBuilder = this.rateRepo.createQueryBuilder('rate');

      if (mchNo) queryBuilder.andWhere('rate.mchNo = :mchNo', { mchNo });
      if (payWay) queryBuilder.andWhere('rate.payWay = :payWay', { payWay });
      if (status !== undefined) queryBuilder.andWhere('rate.status = :status', { status });

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('rate.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getRateById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const rate = await this.rateRepo.findOne({ where: { id } });
      if (!rate) {
        return res.status(404).json({ code: 404, message: '费率配置不存在', data: null, timestamp: new Date().toISOString() });
      }
      res.json({ code: 0, message: 'success', data: rate, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createRate(req: Request, res: Response, next: NextFunction) {
    try {
      const { mchNo, payWay, rateType, rate, minFee, maxFee } = req.body;
      
      // 检查是否已存在相同商户和支付方式的费率配置
      const existing = await this.rateRepo.findOne({ where: { mchNo, payWay } });
      if (existing) {
        return res.status(400).json({ code: 400, message: '该商户已配置此支付方式的费率', data: null, timestamp: new Date().toISOString() });
      }

      const rateRecord = this.rateRepo.create({
        id: uuidv4(),
        mchNo,
        payWay,
        rateType,
        rate,
        minFee,
        maxFee,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await this.rateRepo.save(rateRecord);
      res.json({ code: 0, message: '创建成功', data: rateRecord, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateRate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updateTime = new Date();
      await this.rateRepo.update(id, updateData);
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async deleteRate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const rate = await this.rateRepo.findOne({ where: { id } });
      if (!rate) {
        return res.status(404).json({ code: 404, message: '费率配置不存在', data: null, timestamp: new Date().toISOString() });
      }
      await this.rateRepo.delete(id);
      res.json({ code: 0, message: '删除成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async enableRate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.rateRepo.update(id, { status: 1, updateTime: new Date() });
      res.json({ code: 0, message: '启用成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async disableRate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.rateRepo.update(id, { status: 0, updateTime: new Date() });
      res.json({ code: 0, message: '禁用成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 批量配置费率
  async batchCreateRate(req: Request, res: Response, next: NextFunction) {
    try {
      const { rates } = req.body;
      if (!rates || !Array.isArray(rates) || rates.length === 0) {
        return res.status(400).json({ code: 400, message: '费率配置不能为空', data: null, timestamp: new Date().toISOString() });
      }

      const rateRecords = rates.map((rate: any) => this.rateRepo.create({
        id: uuidv4(),
        mchNo: rate.mchNo,
        payWay: rate.payWay,
        rateType: rate.rateType,
        rate: rate.rate,
        minFee: rate.minFee,
        maxFee: rate.maxFee,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      }));

      await this.rateRepo.save(rateRecords);
      res.json({ code: 0, message: '批量创建成功', data: { count: rateRecords.length }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }
}

export default new MchController();
