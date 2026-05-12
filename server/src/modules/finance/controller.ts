import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/data-source';
import { AccountInfo, AccountRecord, AccountSettlement, AccountWithdraw, AccountStatement } from '../../database/entities/finance.entity';

export class FinanceController {
  private accountRepo = AppDataSource.getRepository(AccountInfo);
  private recordRepo = AppDataSource.getRepository(AccountRecord);
  private settlementRepo = AppDataSource.getRepository(AccountSettlement);
  private withdrawRepo = AppDataSource.getRepository(AccountWithdraw);
  private statementRepo = AppDataSource.getRepository(AccountStatement);

  // ============== Account Info ==============
  async getAccountList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, accountNo, ownerName, accountType } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.accountRepo.createQueryBuilder('account');
      if (accountNo) queryBuilder.andWhere('account.accountNo LIKE :accountNo', { accountNo: `%${accountNo}%` });
      if (ownerName) queryBuilder.andWhere('account.ownerName LIKE :ownerName', { ownerName: `%${ownerName}%` });
      if (accountType !== undefined) queryBuilder.andWhere('account.accountType = :accountType', { accountType });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('account.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getAccountById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const account = await this.accountRepo.findOne({ where: { id } });
      if (!account) return res.status(404).json({ code: 404, message: '账户不存在', data: null, timestamp: new Date().toISOString() });
      res.json({ code: 0, message: 'success', data: account, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Account Record ==============
  async getRecordList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, accountNo, bizType, changeType, startDate, endDate } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.recordRepo.createQueryBuilder('record');
      if (accountNo) queryBuilder.andWhere('record.accountNo = :accountNo', { accountNo });
      if (bizType !== undefined) queryBuilder.andWhere('record.bizType = :bizType', { bizType });
      if (changeType !== undefined) queryBuilder.andWhere('record.changeType = :changeType', { changeType });
      if (startDate) queryBuilder.andWhere('record.createTime >= :startDate', { startDate });
      if (endDate) queryBuilder.andWhere('record.createTime <= :endDate', { endDate });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('record.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Settlement ==============
  async getSettlementList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, settleNo, accountNo, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.settlementRepo.createQueryBuilder('settlement');
      if (settleNo) queryBuilder.andWhere('settlement.settleNo LIKE :settleNo', { settleNo: `%${settleNo}%` });
      if (accountNo) queryBuilder.andWhere('settlement.accountNo = :accountNo', { accountNo });
      if (status !== undefined) queryBuilder.andWhere('settlement.status = :status', { status });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('settlement.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountNo, bankName, bankAccount, bankUsername, amount, settleType, settleCycle } = req.body;

      const account = await this.accountRepo.findOne({ where: { accountNo } });
      if (!account) return res.status(404).json({ code: 404, message: '账户不存在', data: null, timestamp: new Date().toISOString() });
      if (account.availableBalance < amount) return res.status(400).json({ code: 400, message: '余额不足', data: null, timestamp: new Date().toISOString() });

      const settleNo = 'S' + Date.now();
      const fee = amount * 0.001; // 0.1% fee
      const actualAmount = amount - fee;

      const settlement = this.settlementRepo.create({
        id: uuidv4(),
        settleNo,
        accountNo,
        ownerNo: account.ownerNo,
        ownerName: account.ownerName,
        bankName,
        bankAccount,
        bankUsername,
        amount,
        fee,
        actualAmount,
        settleType,
        settleCycle,
        status: 0,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.settlementRepo.save(settlement);

      // Freeze balance
      await this.accountRepo.update(account.id, {
        availableBalance: account.availableBalance - amount,
        frozenBalance: account.frozenBalance + amount,
        updateTime: new Date(),
      });

      res.json({ code: 0, message: '申请成功', data: settlement, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async reviewSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, failReason } = req.body;

      const settlement = await this.settlementRepo.findOne({ where: { id } });
      if (!settlement) return res.status(404).json({ code: 404, message: '结算记录不存在', data: null, timestamp: new Date().toISOString() });

      const account = await this.accountRepo.findOne({ where: { accountNo: settlement.accountNo } });

      if (status === 2) { // Success
        await this.settlementRepo.update(id, { status: 2, completeTime: new Date(), updateTime: new Date() });
        if (account) {
          await this.accountRepo.update(account.id, {
            frozenBalance: account.frozenBalance - settlement.amount,
            updateTime: new Date(),
          });
        }
      } else if (status === 3) { // Failed
        await this.settlementRepo.update(id, { status: 3, failReason, updateTime: new Date() });
        if (account) {
          await this.accountRepo.update(account.id, {
            availableBalance: account.availableBalance + settlement.amount,
            frozenBalance: account.frozenBalance - settlement.amount,
            updateTime: new Date(),
          });
        }
      }

      res.json({ code: 0, message: '审核成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Withdraw ==============
  async getWithdrawList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, withdrawNo, accountNo, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.withdrawRepo.createQueryBuilder('withdraw');
      if (withdrawNo) queryBuilder.andWhere('withdraw.withdrawNo LIKE :withdrawNo', { withdrawNo: `%${withdrawNo}%` });
      if (accountNo) queryBuilder.andWhere('withdraw.accountNo = :accountNo', { accountNo });
      if (status !== undefined) queryBuilder.andWhere('withdraw.status = :status', { status });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('withdraw.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createWithdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountNo, amount, bankName, bankAccount, bankUsername } = req.body;

      const account = await this.accountRepo.findOne({ where: { accountNo } });
      if (!account) return res.status(404).json({ code: 404, message: '账户不存在', data: null, timestamp: new Date().toISOString() });
      if (account.availableBalance < amount) return res.status(400).json({ code: 400, message: '余额不足', data: null, timestamp: new Date().toISOString() });

      const withdrawNo = 'W' + Date.now();
      const fee = amount * 0.006; // 0.6% fee
      const actualAmount = amount - fee;

      const withdraw = this.withdrawRepo.create({
        id: uuidv4(),
        withdrawNo,
        accountNo,
        ownerNo: account.ownerNo,
        ownerName: account.ownerName,
        amount,
        fee,
        actualAmount,
        bankName,
        bankAccount,
        bankUsername,
        status: 0,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.withdrawRepo.save(withdraw);

      // Freeze balance
      await this.accountRepo.update(account.id, {
        availableBalance: account.availableBalance - amount,
        frozenBalance: account.frozenBalance + amount,
        updateTime: new Date(),
      });

      res.json({ code: 0, message: '申请成功', data: withdraw, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Statement ==============
  async getStatementList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, accountNo, startDate, endDate } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.statementRepo.createQueryBuilder('statement');
      if (accountNo) queryBuilder.andWhere('statement.accountNo = :accountNo', { accountNo });
      if (startDate) queryBuilder.andWhere('statement.statementDate >= :startDate', { startDate });
      if (endDate) queryBuilder.andWhere('statement.statementDate <= :endDate', { endDate });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('statement.statementDate', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }
}

export default new FinanceController();
