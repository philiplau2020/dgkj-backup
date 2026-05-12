import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/data-source';
import { CheckBatch, CheckChannelBill, CheckDiffBill } from '../../database/entities/check.entity';

export class CheckController {
  private batchRepo = AppDataSource.getRepository(CheckBatch);
  private channelBillRepo = AppDataSource.getRepository(CheckChannelBill);
  private diffBillRepo = AppDataSource.getRepository(CheckDiffBill);

  // ============== Batch ==============
  async getBatchList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, batchNo, status, startDate, endDate } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.batchRepo.createQueryBuilder('batch');
      if (batchNo) queryBuilder.andWhere('batch.batchNo LIKE :batchNo', { batchNo: `%${batchNo}%` });
      if (status !== undefined) queryBuilder.andWhere('batch.status = :status', { status });
      if (startDate) queryBuilder.andWhere('batch.checkDate >= :startDate', { startDate });
      if (endDate) queryBuilder.andWhere('batch.checkDate <= :endDate', { endDate });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('batch.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { checkDate, checkType, channelCode } = req.body;

      const batchNo = 'CB' + Date.now();
      const batch = this.batchRepo.create({
        id: uuidv4(),
        batchNo,
        checkDate,
        checkType,
        channelCode,
        status: 0,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.batchRepo.save(batch);
      res.json({ code: 0, message: '创建成功', data: batch, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async reviewBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, remark } = req.body;

      await this.batchRepo.update(id, {
        status,
        remark,
        completeTime: status === 1 ? new Date() : null,
        updateTime: new Date(),
      });

      res.json({ code: 0, message: '审核成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Channel Bill ==============
  async getChannelBillList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, batchNo, channelCode, orderNo } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.channelBillRepo.createQueryBuilder('bill');
      if (batchNo) queryBuilder.andWhere('bill.batchNo = :batchNo', { batchNo });
      if (channelCode) queryBuilder.andWhere('bill.channelCode = :channelCode', { channelCode });
      if (orderNo) queryBuilder.andWhere('bill.orderNo = :orderNo', { orderNo });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('bill.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createChannelBill(req: Request, res: Response, next: NextFunction) {
    try {
      const { batchNo, channelCode, channelOrderNo, mchNo, orderNo, payType, amount, fee, status, tradeTime } = req.body;

      const billNo = 'BB' + Date.now();
      const bill = this.channelBillRepo.create({
        id: uuidv4(),
        billNo,
        batchNo,
        channelCode,
        channelOrderNo,
        mchNo,
        orderNo,
        payType,
        amount,
        fee,
        status,
        tradeTime,
        createTime: new Date(),
      });

      await this.channelBillRepo.save(bill);
      res.json({ code: 0, message: '创建成功', data: bill, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Diff Bill ==============
  async getDiffBillList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, batchNo, diffType, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.diffBillRepo.createQueryBuilder('diff');
      if (batchNo) queryBuilder.andWhere('diff.batchNo = :batchNo', { batchNo });
      if (diffType !== undefined) queryBuilder.andWhere('diff.diffType = :diffType', { diffType });
      if (status !== undefined) queryBuilder.andWhere('diff.status = :status', { status });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('diff.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async handleDiffBill(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, handleRemark } = req.body;

      await this.diffBillRepo.update(id, {
        status,
        handleRemark,
        handleTime: new Date(),
        handleUserId: req.user?.userId,
        updateTime: new Date(),
      });

      res.json({ code: 0, message: '处理成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }
}

export default new CheckController();
