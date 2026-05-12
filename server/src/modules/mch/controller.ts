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
      const { page = 1, pageSize = 10, mchNo, mchName, status, agentId } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.mchRepo.createQueryBuilder('mch');

      if (mchNo) queryBuilder.andWhere('mch.mchNo LIKE :mchNo', { mchNo: `%${mchNo}%` });
      if (mchName) queryBuilder.andWhere('mch.mchName LIKE :mchName', { mchName: `%${mchName}%` });
      if (status !== undefined) queryBuilder.andWhere('mch.status = :status', { status });
      if (agentId) queryBuilder.andWhere('mch.agentId = :agentId', { agentId });

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
      const { page = 1, pageSize = 10, mchNo, storeName } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.storeRepo.createQueryBuilder('store');
      if (mchNo) queryBuilder.andWhere('store.mchNo = :mchNo', { mchNo });
      if (storeName) queryBuilder.andWhere('store.storeName LIKE :storeName', { storeName: `%${storeName}%` });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('store.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
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

  // ============== Rate Management ==============
  async getRateList(req: Request, res: Response, next: NextFunction) {
    try {
      const { mchNo } = req.query;
      const queryBuilder = this.rateRepo.createQueryBuilder('rate');
      if (mchNo) queryBuilder.andWhere('rate.mchNo = :mchNo', { mchNo });
      const list = await queryBuilder.orderBy('rate.createTime', 'DESC').getMany();
      res.json({ code: 0, message: 'success', data: list, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createRate(req: Request, res: Response, next: NextFunction) {
    try {
      const { mchNo, payWay, rateType, rate, minFee, maxFee } = req.body;
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
}

export default new MchController();
