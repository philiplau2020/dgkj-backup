import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/data-source';
import { ProfitAccountGroup, ProfitReceiver, ProfitRecord, ProfitRollback } from '../../database/entities/profit.entity';

export class ProfitController {
  private groupRepo = AppDataSource.getRepository(ProfitAccountGroup);
  private receiverRepo = AppDataSource.getRepository(ProfitReceiver);
  private recordRepo = AppDataSource.getRepository(ProfitRecord);
  private rollbackRepo = AppDataSource.getRepository(ProfitRollback);

  // ============== Account Group ==============
  async getAccountGroupList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, groupNo, groupName } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.groupRepo.createQueryBuilder('group');
      if (groupNo) queryBuilder.andWhere('group.groupNo LIKE :groupNo', { groupNo: `%${groupNo}%` });
      if (groupName) queryBuilder.andWhere('group.groupName LIKE :groupName', { groupName: `%${groupName}%` });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('group.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createAccountGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupName, agentNo, mchNo, remark } = req.body;

      const groupNo = 'PG' + Date.now();
      const group = this.groupRepo.create({
        id: uuidv4(),
        groupNo,
        groupName,
        agentNo,
        mchNo,
        remark,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.groupRepo.save(group);
      res.json({ code: 0, message: '创建成功', data: group, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateAccountGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updateTime = new Date();
      await this.groupRepo.update(id, updateData);
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Receiver ==============
  async getReceiverList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, groupNo, receiverType } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.receiverRepo.createQueryBuilder('receiver');
      if (groupNo) queryBuilder.andWhere('receiver.groupNo = :groupNo', { groupNo });
      if (receiverType !== undefined) queryBuilder.andWhere('receiver.receiverType = :receiverType', { receiverType });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('receiver.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createReceiver(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupNo, receiverType, receiverName, receiverAccount, bankName, profitRatio, fixedAmount, remark } = req.body;

      const receiverNo = 'PR' + Date.now();
      const receiver = this.receiverRepo.create({
        id: uuidv4(),
        receiverNo,
        groupNo,
        receiverType,
        receiverName,
        receiverAccount,
        bankName,
        profitRatio,
        fixedAmount,
        remark,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.receiverRepo.save(receiver);
      res.json({ code: 0, message: '创建成功', data: receiver, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateReceiver(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updateTime = new Date();
      await this.receiverRepo.update(id, updateData);
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Profit Record ==============
  async getRecordList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, orderNo, mchNo, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.recordRepo.createQueryBuilder('record');
      if (orderNo) queryBuilder.andWhere('record.orderNo = :orderNo', { orderNo });
      if (mchNo) queryBuilder.andWhere('record.mchNo = :mchNo', { mchNo });
      if (status !== undefined) queryBuilder.andWhere('record.status = :status', { status });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('record.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderNo, mchNo, channelCode, tradeAmount, profitAmount, profitType } = req.body;

      const profitNo = 'PF' + Date.now();
      const record = this.recordRepo.create({
        id: uuidv4(),
        profitNo,
        orderNo,
        mchNo,
        channelCode,
        tradeAmount,
        profitAmount,
        profitType,
        status: 0,
        createTime: new Date(),
      });

      await this.recordRepo.save(record);
      res.json({ code: 0, message: '创建成功', data: record, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async settleRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await this.recordRepo.update(id, {
        status: 1,
        settleTime: new Date(),
      });

      res.json({ code: 0, message: '结算成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Rollback ==============
  async getRollbackList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, profitNo, mchNo, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.rollbackRepo.createQueryBuilder('rollback');
      if (profitNo) queryBuilder.andWhere('rollback.profitNo = :profitNo', { profitNo });
      if (mchNo) queryBuilder.andWhere('rollback.mchNo = :mchNo', { mchNo });
      if (status !== undefined) queryBuilder.andWhere('rollback.status = :status', { status });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('rollback.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createRollback(req: Request, res: Response, next: NextFunction) {
    try {
      const { profitNo, orderNo, mchNo, receiverNo, receiverName, amount, rollbackType, reason, remark } = req.body;

      const rollbackNo = 'RB' + Date.now();
      const rollback = this.rollbackRepo.create({
        id: uuidv4(),
        rollbackNo,
        profitNo,
        orderNo,
        mchNo,
        receiverNo,
        receiverName,
        amount,
        rollbackType,
        reason,
        remark,
        status: 0,
        createTime: new Date(),
      });

      await this.rollbackRepo.save(rollback);
      res.json({ code: 0, message: '创建成功', data: rollback, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async completeRollback(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await this.rollbackRepo.update(id, {
        status: 1,
        completeTime: new Date(),
      });

      res.json({ code: 0, message: '完成成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProfitController();
