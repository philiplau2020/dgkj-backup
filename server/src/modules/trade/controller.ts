import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/data-source';
import { PayOrder, RefundOrder, TransferOrder, TradeNotify } from '../../database/entities/trade.entity';

export class TradeController {
  private orderRepo = AppDataSource.getRepository(PayOrder);
  private refundRepo = AppDataSource.getRepository(RefundOrder);
  private transferRepo = AppDataSource.getRepository(TransferOrder);
  private notifyRepo = AppDataSource.getRepository(TradeNotify);

  // ============== Pay Order ==============
  async getOrderList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, orderNo, mchNo, status, payType, startDate, endDate } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.orderRepo.createQueryBuilder('order');

      if (orderNo) queryBuilder.andWhere('order.orderNo LIKE :orderNo', { orderNo: `%${orderNo}%` });
      if (mchNo) queryBuilder.andWhere('order.mchNo = :mchNo', { mchNo });
      if (status !== undefined) queryBuilder.andWhere('order.status = :status', { status });
      if (payType) queryBuilder.andWhere('order.payType = :payType', { payType });
      if (startDate) queryBuilder.andWhere('order.createTime >= :startDate', { startDate });
      if (endDate) queryBuilder.andWhere('order.createTime <= :endDate', { endDate });

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('order.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await this.orderRepo.findOne({ where: { id } });
      if (!order) return res.status(404).json({ code: 404, message: '订单不存在', data: null, timestamp: new Date().toISOString() });
      res.json({ code: 0, message: 'success', data: order, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { mchNo, appId, payType, amount, subject, body, clientIp, attach, notifyUrl } = req.body;

      const orderNo = 'P' + Date.now();
      const order = this.orderRepo.create({
        id: uuidv4(),
        orderNo,
        mchNo,
        appId,
        payType,
        amount,
        actualAmount: amount,
        subject,
        body,
        clientIp,
        attach,
        notifyUrl,
        status: 0,
        expireTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.orderRepo.save(order);
      res.json({ code: 0, message: '创建成功', data: order, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async closeOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.orderRepo.update(id, { status: 3, updateTime: new Date() });
      res.json({ code: 0, message: '关闭成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Refund Order ==============
  async getRefundList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, refundNo, orderNo, mchNo, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.refundRepo.createQueryBuilder('refund');
      if (refundNo) queryBuilder.andWhere('refund.refundNo LIKE :refundNo', { refundNo: `%${refundNo}%` });
      if (orderNo) queryBuilder.andWhere('refund.orderNo = :orderNo', { orderNo });
      if (mchNo) queryBuilder.andWhere('refund.mchNo = :mchNo', { mchNo });
      if (status !== undefined) queryBuilder.andWhere('refund.status = :status', { status });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('refund.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderNo, mchNo, appId, refundAmount, refundReason } = req.body;

      const order = await this.orderRepo.findOne({ where: { orderNo } });
      if (!order) return res.status(404).json({ code: 404, message: '原订单不存在', data: null, timestamp: new Date().toISOString() });
      if (order.status !== 1) return res.status(400).json({ code: 400, message: '订单状态不可退款', data: null, timestamp: new Date().toISOString() });

      const refundNo = 'R' + Date.now();
      const refund = this.refundRepo.create({
        id: uuidv4(),
        refundNo,
        orderNo,
        mchNo,
        appId,
        payType: order.payType,
        amount: order.amount,
        refundAmount,
        refundReason,
        status: 0,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.refundRepo.save(refund);

      // Update original order status
      await this.orderRepo.update(order.id, { status: 4, updateTime: new Date() });

      res.json({ code: 0, message: '申请成功', data: refund, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Transfer Order ==============
  async getTransferList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, transferNo, mchNo, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.transferRepo.createQueryBuilder('transfer');
      if (transferNo) queryBuilder.andWhere('transfer.transferNo LIKE :transferNo', { transferNo: `%${transferNo}%` });
      if (mchNo) queryBuilder.andWhere('transfer.mchNo = :mchNo', { mchNo });
      if (status !== undefined) queryBuilder.andWhere('transfer.status = :status', { status });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('transfer.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const { mchNo, appId, outNo, amount, payType, accountType, accountName, accountNo, bankName, remark } = req.body;

      const transferNo = 'T' + Date.now();
      const fee = amount * 0.01; // 1% fee
      const actualAmount = amount - fee;

      const transfer = this.transferRepo.create({
        id: uuidv4(),
        transferNo,
        mchNo,
        appId,
        outNo,
        amount,
        fee,
        actualAmount,
        payType,
        accountType,
        accountName,
        accountNo,
        bankName,
        remark,
        status: 0,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.transferRepo.save(transfer);
      res.json({ code: 0, message: '创建成功', data: transfer, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Notify Management ==============
  async getNotifyList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, orderNo, mchNo, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.notifyRepo.createQueryBuilder('notify');
      if (orderNo) queryBuilder.andWhere('notify.orderNo = :orderNo', { orderNo });
      if (mchNo) queryBuilder.andWhere('notify.mchNo = :mchNo', { mchNo });
      if (status !== undefined) queryBuilder.andWhere('notify.status = :status', { status });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('notify.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async resendNotify(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.notifyRepo.update(id, {
        notifyCount: () => 'notifyCount + 1',
        lastNotifyTime: new Date(),
        updateTime: new Date(),
      });
      res.json({ code: 0, message: '发送成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }
}

export default new TradeController();
