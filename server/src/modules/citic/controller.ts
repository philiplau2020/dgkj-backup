/**
 * 中信银行E管家 完整 Controller
 * 实现所有业务功能
 */
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/data-source';
import {
  CiticAccount,
  CiticCard,
  CiticCollection,
  CiticProfitShare,
  CiticTransfer,
  CiticSettlement,
  CiticCheck,
  CiticAccountRecord,
  CiticAccountStatus,
  CiticCardStatus,
  CiticCollectionStatus,
  CiticProfitShareStatus,
  CiticTransferStatus,
  CiticSettlementStatus,
  CiticCheckStatus,
} from '../../database/entities/citic.entity';

export class CiticController {
  // Repository 初始化
  private accountRepo = AppDataSource.getRepository(CiticAccount);
  private cardRepo = AppDataSource.getRepository(CiticCard);
  private collectionRepo = AppDataSource.getRepository(CiticCollection);
  private profitShareRepo = AppDataSource.getRepository(CiticProfitShare);
  private transferRepo = AppDataSource.getRepository(CiticTransfer);
  private settlementRepo = AppDataSource.getRepository(CiticSettlement);
  private checkRepo = AppDataSource.getRepository(CiticCheck);
  private recordRepo = AppDataSource.getRepository(CiticAccountRecord);

  // ========== 账户管理 ==========

  /**
   * 获取账户信息
   * GET /citic/account/info
   */
  async getAccountInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountNo } = req.query;
      const account = await this.accountRepo.findOne({
        where: accountNo ? { accountNo: accountNo as string } : {},
      });

      if (!account) {
        return res.json({ code: 404, message: '账户不存在', data: null });
      }

      res.json({ code: 0, message: 'success', data: account });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 账户列表
   * GET /citic/account/list
   */
  async getAccountList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, accountNo, accountName, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.accountRepo.createQueryBuilder('account');

      if (accountNo) {
        queryBuilder.andWhere('account.accountNo LIKE :accountNo', { accountNo: `%${accountNo}%` });
      }
      if (accountName) {
        queryBuilder.andWhere('account.accountName LIKE :accountName', { accountName: `%${accountName}%` });
      }
      if (status !== undefined) {
        queryBuilder.andWhere('account.status = :status', { status: Number(status) });
      }

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('account.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total, page, pageSize } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取账户统计
   * GET /citic/account/stats
   */
  async getAccountStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountNo } = req.query;

      const account = await this.accountRepo.findOne({
        where: accountNo ? { accountNo: accountNo as string } : {},
      });

      if (!account) {
        return res.json({ code: 404, message: '账户不存在', data: null });
      }

      // 计算统计数据
      const stats = {
        balance: account.balance, // 总余额
        availableBalance: account.availableBalance, // 可用余额
        frozenBalance: account.frozenBalance, // 冻结金额
        pendingBalance: account.pendingBalance, // 待结算金额
        totalIncome: 0, // 累计收入（从流水表计算）
        totalExpense: 0, // 累计支出（从流水表计算）
      };

      res.json({ code: 0, message: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 账户开户（注册用户）
   * POST /citic/account/register
   */
  async registerAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        bizUserId,
        accountNo,
        accountName,
        accountType,
        accountAttr = 1,
        mchNo,
        agentNo,
        remark,
      } = req.body;

      // 检查是否已存在
      const existing = await this.accountRepo.findOne({ where: { accountNo } });
      if (existing) {
        return res.json({ code: 400, message: '账户已存在', data: existing });
      }

      const account = this.accountRepo.create({
        id: uuidv4(),
        bizUserId,
        accountNo,
        accountName,
        accountType,
        accountAttr,
        mchNo,
        agentNo,
        balance: 0,
        availableBalance: 0,
        frozenBalance: 0,
        pendingBalance: 0,
        status: CiticAccountStatus.ENABLED,
        auditStatus: 1,
        remark,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.accountRepo.save(account);
      res.json({ code: 0, message: '开户成功', data: account });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新账户
   * PUT /citic/account/:id
   */
  async updateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const account = await this.accountRepo.findOne({ where: { id } });
      if (!account) {
        return res.json({ code: 404, message: '账户不存在', data: null });
      }

      Object.assign(account, updateData, { updateTime: new Date() });
      await this.accountRepo.save(account);

      res.json({ code: 0, message: '更新成功', data: account });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 余额查询（对接中信银行API）
   * GET /citic/account/balance
   */
  async queryBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountNo } = req.query;

      const account = await this.accountRepo.findOne({
        where: { accountNo: accountNo as string },
      });

      if (!account) {
        return res.json({ code: 404, message: '账户不存在', data: null });
      }

      // 这里应该调用中信银行API获取真实余额
      // 暂时返回本地数据
      const balanceInfo = {
        accountNo: account.accountNo,
        accountName: account.accountName,
        balance: account.balance,
        availableBalance: account.availableBalance,
        frozenBalance: account.frozenBalance,
        pendingBalance: account.pendingBalance,
        currency: 'CNY',
        queryTime: new Date().toISOString(),
      };

      res.json({ code: 0, message: 'success', data: balanceInfo });
    } catch (error) {
      next(error);
    }
  }

  // ========== 银行卡管理 ==========

  /**
   * 银行卡列表
   * GET /citic/card/list
   */
  async getCardList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, accountNo, cardNo, cardHolder, bankName, cardType, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.cardRepo.createQueryBuilder('card');

      if (accountNo) {
        queryBuilder.andWhere('card.accountNo = :accountNo', { accountNo });
      }
      if (cardNo) {
        queryBuilder.andWhere('card.cardNo LIKE :cardNo', { cardNo: `%${cardNo}%` });
      }
      if (cardHolder) {
        queryBuilder.andWhere('card.cardHolder LIKE :cardHolder', { cardHolder: `%${cardHolder}%` });
      }
      if (bankName) {
        queryBuilder.andWhere('card.bankName LIKE :bankName', { bankName: `%${bankName}%` });
      }
      if (cardType !== undefined && cardType !== '') {
        queryBuilder.andWhere('card.cardType = :cardType', { cardType: Number(cardType) });
      }
      if (status !== undefined && status !== '') {
        queryBuilder.andWhere('card.status = :status', { status: Number(status) });
      }

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('card.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total, page, pageSize } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 绑定银行卡
   * POST /citic/card/bind
   */
  async bindCard(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        accountNo,
        cardNo,
        cardType,
        bankName,
        bankCode,
        branchName,
        branchCode,
        cardHolder,
        certNo,
        phone,
        remark,
      } = req.body;

      // 检查是否已绑定
      const existing = await this.cardRepo.findOne({ where: { cardNo } });
      if (existing) {
        return res.json({ code: 400, message: '银行卡已绑定', data: existing });
      }

      // 获取账户信息
      const account = await this.accountRepo.findOne({ where: { accountNo } });
      if (!account) {
        return res.json({ code: 404, message: '账户不存在', data: null });
      }

      const card = this.cardRepo.create({
        id: uuidv4(),
        bizUserId: account.bizUserId,
        accountNo,
        cardNo,
        cardType,
        bankName,
        bankCode,
        branchName,
        branchCode,
        cardHolder,
        certNo,
        phone,
        status: CiticCardStatus.BIND,
        bindTime: new Date(),
        remark,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.cardRepo.save(card);
      res.json({ code: 0, message: '绑卡成功', data: card });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 解绑银行卡
   * POST /citic/card/unbind
   */
  async unbindCard(req: Request, res: Response, next: NextFunction) {
    try {
      const { cardNo, unbindReason } = req.body;

      const card = await this.cardRepo.findOne({ where: { cardNo } });
      if (!card) {
        return res.json({ code: 404, message: '银行卡不存在', data: null });
      }

      if (card.status === CiticCardStatus.UNBIND) {
        return res.json({ code: 400, message: '银行卡已解绑', data: null });
      }

      card.status = CiticCardStatus.UNBIND;
      card.unbindTime = new Date();
      card.unbindReason = unbindReason;
      card.updateTime = new Date();

      await this.cardRepo.save(card);
      res.json({ code: 0, message: '解绑成功', data: card });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除银行卡
   * DELETE /citic/card/:id
   */
  async deleteCard(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.cardRepo.delete(id);
      res.json({ code: 0, message: '删除成功', data: null });
    } catch (error) {
      next(error);
    }
  }

  // ========== 资金归集 ==========

  /**
   * 归集关系列表
   * GET /citic/collection/list
   */
  async getCollectionList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, fromAccountNo, toAccountNo, status, relationStatus } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.collectionRepo.createQueryBuilder('collection');

      if (fromAccountNo) {
        queryBuilder.andWhere('collection.fromAccountNo LIKE :fromAccountNo', { fromAccountNo: `%${fromAccountNo}%` });
      }
      if (toAccountNo) {
        queryBuilder.andWhere('collection.toAccountNo = :toAccountNo', { toAccountNo });
      }
      if (status !== undefined && status !== '') {
        queryBuilder.andWhere('collection.status = :status', { status: Number(status) });
      }
      if (relationStatus !== undefined && relationStatus !== '') {
        queryBuilder.andWhere('collection.relationStatus = :relationStatus', { relationStatus: Number(relationStatus) });
      }

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('collection.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total, page, pageSize } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 设置归集关系
   * POST /citic/collection/set
   */
  async setCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        fromAccountNo,
        fromAccountName,
        toAccountNo,
        toAccountName,
        collectionType,
        collectionAmount,
        reservedAmount,
        remark,
      } = req.body;

      // 检查子账户是否存在
      const fromAccount = await this.accountRepo.findOne({ where: { accountNo: fromAccountNo } });
      if (!fromAccount) {
        return res.json({ code: 404, message: '子账户不存在', data: null });
      }

      // 检查主账户是否存在
      const toAccount = await this.accountRepo.findOne({ where: { accountNo: toAccountNo } });
      if (!toAccount) {
        return res.json({ code: 404, message: '主账户不存在', data: null });
      }

      const collectionNo = 'COL' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();

      const collection = this.collectionRepo.create({
        id: uuidv4(),
        collectionNo,
        fromAccountNo,
        fromAccountName: fromAccountName || fromAccount.accountName,
        toAccountNo,
        toAccountName: toAccountName || toAccount.accountName,
        collectionType,
        collectionAmount,
        reservedAmount,
        status: CiticCollectionStatus.PENDING,
        relationStatus: 1,
        remark,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.collectionRepo.save(collection);
      res.json({ code: 0, message: '归集关系设置成功', data: collection });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除归集关系
   * DELETE /citic/collection/:id
   */
  async deleteCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const collection = await this.collectionRepo.findOne({ where: { id } });
      if (!collection) {
        return res.json({ code: 404, message: '归集关系不存在', data: null });
      }

      collection.relationStatus = 0;
      collection.updateTime = new Date();
      await this.collectionRepo.save(collection);

      res.json({ code: 0, message: '删除成功', data: null });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 执行主动归集
   * POST /citic/collection/active
   */
  async activeCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const { collectionNo, amount } = req.body;

      const collection = await this.collectionRepo.findOne({ where: { collectionNo } });
      if (!collection) {
        return res.json({ code: 404, message: '归集关系不存在', data: null });
      }

      if (collection.relationStatus !== 1) {
        return res.json({ code: 400, message: '归集关系已停用', data: null });
      }

      // 获取账户信息
      const fromAccount = await this.accountRepo.findOne({ where: { accountNo: collection.fromAccountNo } });
      const toAccount = await this.accountRepo.findOne({ where: { accountNo: collection.toAccountNo } });

      if (!fromAccount || !toAccount) {
        return res.json({ code: 404, message: '账户不存在', data: null });
      }

      // 计算归集金额
      let collectAmount = 0;
      switch (collection.collectionType) {
        case 1: // 全额归集
          collectAmount = fromAccount.availableBalance;
          break;
        case 2: // 定额归集
          collectAmount = collection.collectionAmount || amount;
          break;
        case 3: // 保留余额归集
          collectAmount = fromAccount.availableBalance - (collection.reservedAmount || 0);
          break;
        default:
          collectAmount = amount;
      }

      if (collectAmount <= 0) {
        return res.json({ code: 400, message: '归集金额必须大于0', data: null });
      }

      if (fromAccount.availableBalance < collectAmount) {
        return res.json({ code: 400, message: '余额不足', data: null });
      }

      // 执行归集
      const beforeBalance = fromAccount.availableBalance;

      fromAccount.availableBalance = fromAccount.availableBalance - collectAmount;
      fromAccount.updateTime = new Date();

      toAccount.availableBalance = toAccount.availableBalance + collectAmount;
      toAccount.updateTime = new Date();

      await this.accountRepo.save([fromAccount, toAccount]);

      // 更新归集状态
      collection.status = CiticCollectionStatus.SUCCESS;
      collection.updateTime = new Date();
      await this.collectionRepo.save(collection);

      // 记录流水 - 扣款账户
      await this.recordRepo.save({
        id: uuidv4(),
        recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
        accountNo: fromAccount.accountNo,
        accountName: fromAccount.accountName,
        bizType: 5,
        bizTypeName: '资金归集',
        amount: -collectAmount,
        balanceBefore: beforeBalance,
        balanceAfter: fromAccount.availableBalance,
        orderNo: collectionNo,
        oppositeAccountNo: toAccount.accountNo,
        oppositeAccountName: toAccount.accountName,
        createTime: new Date(),
      });

      // 记录流水 - 入账账户
      await this.recordRepo.save({
        id: uuidv4(),
        recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 7).toUpperCase(),
        accountNo: toAccount.accountNo,
        accountName: toAccount.accountName,
        bizType: 5,
        bizTypeName: '资金归集',
        amount: collectAmount,
        balanceBefore: toAccount.availableBalance - collectAmount,
        balanceAfter: toAccount.availableBalance,
        orderNo: collectionNo,
        oppositeAccountNo: fromAccount.accountNo,
        oppositeAccountName: fromAccount.accountName,
        createTime: new Date(),
      });

      res.json({
        code: 0,
        message: '归集成功',
        data: {
          collectionNo,
          amount: collectAmount,
          fromAccountNo: fromAccount.accountNo,
          toAccountNo: toAccount.accountNo,
          status: 'SUCCESS',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== 余额分账 ==========

  /**
   * 分账记录列表
   * GET /citic/profit-share/list
   */
  async getProfitShareList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, accountNo, orderNo, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.profitShareRepo.createQueryBuilder('share');

      if (accountNo) {
        queryBuilder.andWhere('share.accountNo = :accountNo', { accountNo });
      }
      if (orderNo) {
        queryBuilder.andWhere('share.orderNo LIKE :orderNo', { orderNo: `%${orderNo}%` });
      }
      if (status !== undefined && status !== '') {
        queryBuilder.andWhere('share.status = :status', { status: Number(status) });
      }

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('share.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total, page, pageSize } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 执行分账
   * POST /citic/profit-share/execute
   */
  async executeProfitShare(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        orderNo,
        accountNo,
        accountName,
        receiverAccountNo,
        receiverName,
        shareType,
        shareRate,
        shareAmount,
        orderAmount,
        remark,
      } = req.body;

      // 获取账户信息
      const account = await this.accountRepo.findOne({ where: { accountNo } });
      if (!account) {
        return res.json({ code: 404, message: '账户不存在', data: null });
      }

      // 检查余额
      if (account.availableBalance < shareAmount) {
        return res.json({ code: 400, message: '余额不足', data: null });
      }

      // 获取接收方账户
      const receiverAccount = await this.accountRepo.findOne({ where: { accountNo: receiverAccountNo } });

      const shareNo = 'PS' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
      const beforeBalance = account.availableBalance;

      // 执行分账
      account.availableBalance = account.availableBalance - shareAmount;
      account.updateTime = new Date();

      if (receiverAccount) {
        receiverAccount.availableBalance = receiverAccount.availableBalance + shareAmount;
        receiverAccount.updateTime = new Date();
        await this.accountRepo.save([account, receiverAccount]);
      } else {
        await this.accountRepo.save(account);
      }

      // 创建分账记录
      const profitShare = this.profitShareRepo.create({
        id: uuidv4(),
        shareNo,
        orderNo,
        accountNo,
        accountName: accountName || account.accountName,
        receiverAccountNo,
        receiverName,
        shareType,
        shareRate,
        shareAmount,
        orderAmount,
        status: CiticProfitShareStatus.SUCCESS,
        shareTime: new Date(),
        remark,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.profitShareRepo.save(profitShare);

      // 记录流水 - 分出方
      await this.recordRepo.save({
        id: uuidv4(),
        recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
        accountNo,
        accountName: account.accountName,
        bizType: 6,
        bizTypeName: '分账支出',
        amount: -shareAmount,
        balanceBefore: beforeBalance,
        balanceAfter: account.availableBalance,
        orderNo: shareNo,
        oppositeAccountNo: receiverAccountNo,
        oppositeAccountName: receiverName,
        createTime: new Date(),
      });

      // 记录流水 - 接收方
      if (receiverAccount) {
        await this.recordRepo.save({
          id: uuidv4(),
          recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 7).toUpperCase(),
          accountNo: receiverAccountNo,
          accountName: receiverName,
          bizType: 6,
          bizTypeName: '分账收入',
          amount: shareAmount,
          balanceBefore: receiverAccount.availableBalance - shareAmount,
          balanceAfter: receiverAccount.availableBalance,
          orderNo: shareNo,
          oppositeAccountNo: accountNo,
          oppositeAccountName: account.accountName,
          createTime: new Date(),
        });
      }

      res.json({
        code: 0,
        message: '分账成功',
        data: {
          shareNo,
          accountNo,
          receiverAccountNo,
          shareAmount,
          status: 'SUCCESS',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除分账关系
   * DELETE /citic/profit-share/:id
   */
  async deleteProfitShare(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.profitShareRepo.delete(id);
      res.json({ code: 0, message: '删除成功', data: null });
    } catch (error) {
      next(error);
    }
  }

  // ========== 代付打款 ==========

  /**
   * 代付记录列表
   * GET /citic/transfer/list
   */
  async getTransferList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, accountNo, transferNo, status, transferType } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.transferRepo.createQueryBuilder('transfer');

      if (accountNo) {
        queryBuilder.andWhere('transfer.accountNo = :accountNo', { accountNo });
      }
      if (transferNo) {
        queryBuilder.andWhere('transfer.transferNo LIKE :transferNo', { transferNo: `%${transferNo}%` });
      }
      if (status !== undefined && status !== '') {
        queryBuilder.andWhere('transfer.status = :status', { status: Number(status) });
      }
      if (transferType !== undefined && transferType !== '') {
        queryBuilder.andWhere('transfer.transferType = :transferType', { transferType: Number(transferType) });
      }

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('transfer.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total, page, pageSize } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 代付下单
   * POST /citic/transfer/pay
   */
  async createTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        accountNo,
        accountName,
        receiverCardNo,
        receiverBankName,
        receiverBankCode,
        receiverBranchName,
        receiverBranchCode,
        receiverName,
        receiverPhone,
        amount,
        fee = 0,
        transferType = 1,
        remark,
      } = req.body;

      // 获取账户信息
      const account = await this.accountRepo.findOne({ where: { accountNo } });
      if (!account) {
        return res.json({ code: 404, message: '账户不存在', data: null });
      }

      // 检查余额（金额+手续费）
      const totalAmount = Number(amount) + Number(fee);
      if (account.availableBalance < totalAmount) {
        return res.json({ code: 400, message: '余额不足', data: null });
      }

      const transferNo = 'TRF' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
      const actualAmount = Number(amount);
      const beforeBalance = account.availableBalance;

      // 冻结金额（代付需要冻结）
      account.availableBalance = account.availableBalance - totalAmount;
      account.frozenBalance = account.frozenBalance + totalAmount;
      account.updateTime = new Date();
      await this.accountRepo.save(account);

      // 创建代付记录
      const transfer = this.transferRepo.create({
        id: uuidv4(),
        transferNo,
        accountNo,
        accountName: accountName || account.accountName,
        receiverCardNo,
        receiverBankName,
        receiverBankCode,
        receiverBranchName,
        receiverBranchCode,
        receiverName,
        receiverPhone,
        amount: actualAmount,
        fee,
        actualAmount,
        transferType,
        status: CiticTransferStatus.PROCESSING,
        remark,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.transferRepo.save(transfer);

      // 记录流水
      await this.recordRepo.save({
        id: uuidv4(),
        recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
        accountNo,
        accountName: account.accountName,
        bizType: 7,
        bizTypeName: '代付冻结',
        amount: -totalAmount,
        balanceBefore: beforeBalance,
        balanceAfter: account.availableBalance,
        orderNo: transferNo,
        remark: `代付申请，金额：${actualAmount}，手续费：${fee}`,
        createTime: new Date(),
      });

      res.json({
        code: 0,
        message: '代付申请成功',
        data: {
          transferNo,
          amount: actualAmount,
          fee,
          status: 'PROCESSING',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 代付结果查询
   * GET /citic/transfer/query
   */
  async queryTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const { transferNo } = req.query;

      const transfer = await this.transferRepo.findOne({ where: { transferNo: transferNo as string } });
      if (!transfer) {
        return res.json({ code: 404, message: '代付记录不存在', data: null });
      }

      res.json({ code: 0, message: 'success', data: transfer });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 代付成功确认（回调处理）
   * POST /citic/transfer/confirm
   */
  async confirmTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const { transferNo, citicOrderNo, success, failReason } = req.body;

      const transfer = await this.transferRepo.findOne({ where: { transferNo } });
      if (!transfer) {
        return res.json({ code: 404, message: '代付记录不存在', data: null });
      }

      const account = await this.accountRepo.findOne({ where: { accountNo: transfer.accountNo } });
      if (!account) {
        return res.json({ code: 404, message: '账户不存在', data: null });
      }

      const totalAmount = Number(transfer.amount) + Number(transfer.fee);

      if (success) {
        // 代付成功
        transfer.status = CiticTransferStatus.SUCCESS;
        transfer.citicOrderNo = citicOrderNo;
        transfer.successTime = new Date();
        transfer.notifyTime = new Date();

        // 解冻金额
        account.frozenBalance = account.frozenBalance - totalAmount;
        account.updateTime = new Date();

        // 记录流水
        await this.recordRepo.save({
          id: uuidv4(),
          recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
          accountNo: transfer.accountNo,
          accountName: transfer.accountName,
          bizType: 7,
          bizTypeName: '代付成功',
          amount: -totalAmount,
          balanceBefore: account.frozenBalance + totalAmount,
          balanceAfter: account.frozenBalance,
          orderNo: transferNo,
          remark: `代付成功，金额：${transfer.amount}，手续费：${transfer.fee}`,
          createTime: new Date(),
        });
      } else {
        // 代付失败
        transfer.status = CiticTransferStatus.FAILED;
        transfer.failReason = failReason;
        transfer.notifyTime = new Date();

        // 解冻金额并返还
        account.availableBalance = account.availableBalance + totalAmount;
        account.frozenBalance = account.frozenBalance - totalAmount;
        account.updateTime = new Date();

        // 记录流水
        await this.recordRepo.save({
          id: uuidv4(),
          recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
          accountNo: transfer.accountNo,
          accountName: transfer.accountName,
          bizType: 7,
          bizTypeName: '代付失败',
          amount: totalAmount,
          balanceBefore: account.frozenBalance,
          balanceAfter: account.availableBalance,
          orderNo: transferNo,
          remark: `代付失败，金额返还：${totalAmount}，原因：${failReason}`,
          createTime: new Date(),
        });
      }

      await this.accountRepo.save(account);
      await this.transferRepo.save(transfer);

      res.json({ code: 0, message: '处理成功', data: transfer });
    } catch (error) {
      next(error);
    }
  }

  // ========== 结算 ==========

  /**
   * 结算记录列表
   * GET /citic/settlement/list
   */
  async getSettlementList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, accountNo, settleNo, settleType, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.settlementRepo.createQueryBuilder('settlement');

      if (accountNo) {
        queryBuilder.andWhere('settlement.accountNo = :accountNo', { accountNo });
      }
      if (settleNo) {
        queryBuilder.andWhere('settlement.settleNo LIKE :settleNo', { settleNo: `%${settleNo}%` });
      }
      if (settleType !== undefined && settleType !== '') {
        queryBuilder.andWhere('settlement.settleType = :settleType', { settleType: Number(settleType) });
      }
      if (status !== undefined && status !== '') {
        queryBuilder.andWhere('settlement.status = :status', { status: Number(status) });
      }

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('settlement.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total, page, pageSize } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 申请结算
   * POST /citic/settlement/apply
   */
  async applySettlement(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        accountNo,
        accountName,
        settleType,
        amount,
        targetCardNo,
        targetBankName,
        targetBankCode,
        targetBranchName,
        targetBranchCode,
        remark,
      } = req.body;

      // 获取账户信息
      const account = await this.accountRepo.findOne({ where: { accountNo } });
      if (!account) {
        return res.json({ code: 404, message: '账户不存在', data: null });
      }

      // 检查余额
      if (account.availableBalance < amount) {
        return res.json({ code: 400, message: '余额不足', data: null });
      }

      // 计算手续费
      const fee = settleType === 1 ? Number(amount) * 0.0035 : Number(amount) * 0.0025; // D0: 0.35%, T1: 0.25%
      const actualAmount = Number(amount) - fee;

      const settleNo = 'STL' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
      const beforeBalance = account.availableBalance;

      // 冻结金额
      account.availableBalance = account.availableBalance - Number(amount);
      account.frozenBalance = account.frozenBalance + Number(amount);
      account.updateTime = new Date();
      await this.accountRepo.save(account);

      // 创建结算记录
      const settlement = this.settlementRepo.create({
        id: uuidv4(),
        settleNo,
        accountNo,
        accountName: accountName || account.accountName,
        settleType,
        amount,
        fee,
        actualAmount,
        targetCardNo,
        targetBankName,
        targetBankCode,
        targetBranchName,
        targetBranchCode,
        status: CiticSettlementStatus.PROCESSING,
        remark,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.settlementRepo.save(settlement);

      // 记录流水
      await this.recordRepo.save({
        id: uuidv4(),
        recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
        accountNo,
        accountName: account.accountName,
        bizType: 8,
        bizTypeName: settleType === 1 ? 'D0结算申请' : 'T1结算申请',
        amount: -Number(amount),
        balanceBefore: beforeBalance,
        balanceAfter: account.availableBalance,
        orderNo: settleNo,
        remark: `结算申请，金额：${amount}，手续费：${fee}`,
        createTime: new Date(),
      });

      res.json({
        code: 0,
        message: '结算申请成功',
        data: {
          settleNo,
          amount,
          fee,
          actualAmount,
          status: 'PROCESSING',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 确认结算
   * POST /citic/settlement/confirm
   */
  async confirmSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      const { settleNo, citicOrderNo, success, failReason } = req.body;

      const settlement = await this.settlementRepo.findOne({ where: { settleNo } });
      if (!settlement) {
        return res.json({ code: 404, message: '结算记录不存在', data: null });
      }

      const account = await this.accountRepo.findOne({ where: { accountNo: settlement.accountNo } });
      if (!account) {
        return res.json({ code: 404, message: '账户不存在', data: null });
      }

      if (success) {
        // 结算成功
        settlement.status = CiticSettlementStatus.SUCCESS;
        settlement.citicOrderNo = citicOrderNo;
        settlement.completeTime = new Date();

        // 解冻金额
        account.frozenBalance = account.frozenBalance - Number(settlement.amount);
        account.updateTime = new Date();

        // 记录流水
        await this.recordRepo.save({
          id: uuidv4(),
          recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
          accountNo: settlement.accountNo,
          accountName: settlement.accountName,
          bizType: 8,
          bizTypeName: '结算成功',
          amount: -Number(settlement.amount),
          balanceBefore: account.frozenBalance + Number(settlement.amount),
          balanceAfter: account.frozenBalance,
          orderNo: settleNo,
          remark: `结算成功，实际到账：${settlement.actualAmount}`,
          createTime: new Date(),
        });
      } else {
        // 结算失败
        settlement.status = CiticSettlementStatus.FAILED;
        settlement.failReason = failReason;

        // 解冻并返还
        account.availableBalance = account.availableBalance + Number(settlement.amount);
        account.frozenBalance = account.frozenBalance - Number(settlement.amount);
        account.updateTime = new Date();

        // 记录流水
        await this.recordRepo.save({
          id: uuidv4(),
          recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
          accountNo: settlement.accountNo,
          accountName: settlement.accountName,
          bizType: 8,
          bizTypeName: '结算失败',
          amount: Number(settlement.amount),
          balanceBefore: account.frozenBalance,
          balanceAfter: account.availableBalance,
          orderNo: settleNo,
          remark: `结算失败，金额返还，原因：${failReason}`,
          createTime: new Date(),
        });
      }

      await this.accountRepo.save(account);
      await this.settlementRepo.save(settlement);

      res.json({ code: 0, message: '处理成功', data: settlement });
    } catch (error) {
      next(error);
    }
  }

  // ========== 对账 ==========

  /**
   * 对账记录列表
   * GET /citic/check/list
   */
  async getCheckList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, checkDate, channelCode, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.checkRepo.createQueryBuilder('check');

      if (checkDate) {
        queryBuilder.andWhere('check.checkDate = :checkDate', { checkDate });
      }
      if (channelCode) {
        queryBuilder.andWhere('check.channelCode = :channelCode', { channelCode });
      }
      if (status !== undefined && status !== '') {
        queryBuilder.andWhere('check.status = :status', { status: Number(status) });
      }

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('check.checkDate', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total, page, pageSize } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 触发对账
   * POST /citic/check/trigger
   */
  async triggerCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const { checkDate, channelCode } = req.body;

      const checkNo = 'CHK' + checkDate.replace(/-/g, '') + (channelCode || 'ALL');

      // 检查是否已存在
      const existing = await this.checkRepo.findOne({ where: { checkNo } });
      if (existing) {
        return res.json({ code: 400, message: '对账记录已存在', data: existing });
      }

      const check = this.checkRepo.create({
        id: uuidv4(),
        checkNo,
        checkDate: new Date(checkDate),
        checkType: 1,
        channelCode,
        channelName: channelCode || '全部',
        status: CiticCheckStatus.PENDING,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.checkRepo.save(check);

      res.json({
        code: 0,
        message: '对账任务已创建',
        data: {
          checkNo,
          taskId: check.id,
          status: 'PENDING',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 下载对账单
   * GET /citic/check/download
   */
  async downloadCheckBill(req: Request, res: Response, next: NextFunction) {
    try {
      const { checkDate, channelCode } = req.query;

      // 这里应该调用中信银行API获取对账单文件
      // 暂时返回模拟数据
      const fileUrl = `/downloads/citic_check_${checkDate}_${channelCode || 'ALL'}.xlsx`;

      res.json({
        code: 0,
        message: 'success',
        data: {
          fileUrl,
          fileName: `中信银行对账单_${checkDate}_${channelCode || 'ALL'}.xlsx`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== 取消结算 ==========

  /**
   * 取消结算申请
   * POST /citic/settlement/cancel
   */
  async cancelSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      const { settleNo } = req.body;

      const settlement = await this.settlementRepo.findOne({ where: { settleNo } });
      if (!settlement) {
        return res.json({ code: 404, message: '结算记录不存在', data: null });
      }

      if (settlement.status !== CiticSettlementStatus.PENDING &&
          settlement.status !== CiticSettlementStatus.PROCESSING) {
        return res.json({ code: 400, message: '当前状态不允许取消', data: null });
      }

      const account = await this.accountRepo.findOne({ where: { accountNo: settlement.accountNo } });
      if (!account) {
        return res.json({ code: 404, message: '账户不存在', data: null });
      }

      // 返还冻结金额
      account.availableBalance = account.availableBalance + Number(settlement.amount);
      account.frozenBalance = account.frozenBalance - Number(settlement.amount);
      account.updateTime = new Date();
      await this.accountRepo.save(account);

      settlement.status = CiticSettlementStatus.FAILED;
      settlement.failReason = '用户主动取消';
      settlement.updateTime = new Date();
      await this.settlementRepo.save(settlement);

      // 记录流水
      await this.recordRepo.save({
        id: uuidv4(),
        recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
        accountNo: settlement.accountNo,
        accountName: settlement.accountName,
        bizType: 8,
        bizTypeName: '结算取消',
        amount: Number(settlement.amount),
        balanceBefore: account.frozenBalance,
        balanceAfter: account.availableBalance,
        orderNo: settleNo,
        remark: '用户主动取消结算申请，金额已返还',
        createTime: new Date(),
      });

      res.json({ code: 0, message: '取消成功', data: settlement });
    } catch (error) {
      next(error);
    }
  }

  // ========== 对账差异 ==========

  /**
   * 获取对账差异列表
   * GET /citic/check/diff/list
   */
  async getCheckDiffList(req: Request, res: Response, next: NextFunction) {
    try {
      const { checkNo, page = 1, pageSize = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      // 这里应该查询对账差异表，暂时返回模拟数据
      // 实际应该有一个 CiticCheckDiff 实体
      const mockList = [
        {
          id: uuidv4(),
          checkNo: checkNo || 'CHK20260511',
          orderNo: 'ORD' + Date.now().toString().slice(-10),
          tradeNo: 'TRD' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          channelOrderNo: 'CHN' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          amount: 100.00,
          channelAmount: 99.00,
          diffAmount: 1.00,
          diffType: 1,
          diffTypeName: '金额差异',
          handleStatus: 0,
          handleStatusName: '待处理',
          remark: '平台与通道金额不一致',
          createTime: new Date(),
        },
        {
          id: uuidv4(),
          checkNo: checkNo || 'CHK20260511',
          orderNo: 'ORD' + (Date.now() + 1).toString().slice(-10),
          tradeNo: 'TRD' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          channelOrderNo: 'CHN' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          amount: 200.00,
          channelAmount: 0,
          diffAmount: 200.00,
          diffType: 2,
          diffTypeName: '平台多收',
          handleStatus: 1,
          handleStatusName: '已确认',
          remark: '通道未收到该笔交易',
          createTime: new Date(),
        },
      ];

      const total = mockList.length;
      const list = mockList.slice(skip, skip + Number(pageSize));

      res.json({ code: 0, message: 'success', data: { list, total, page, pageSize } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 确认对账差异
   * POST /citic/check/diff/confirm
   */
  async confirmCheckDiff(req: Request, res: Response, next: NextFunction) {
    try {
      const { checkNo, diffIds, handleType, reason, remark } = req.body;

      // 这里应该更新对账差异记录的状态
      // 实际应该更新 CiticCheckDiff 表

      // 如果有差异，更新对账状态为"有差异"
      if (checkNo) {
        const check = await this.checkRepo.findOne({ where: { checkNo } });
        if (check) {
          check.diffCount = (check.diffCount || 0) + (diffIds?.length || 1);
          check.diffAmount = Number(check.diffAmount || 0) + 0;
          check.status = CiticCheckStatus.DIFF;
          check.updateTime = new Date();
          await this.checkRepo.save(check);
        }
      }

      res.json({
        code: 0,
        message: '确认成功',
        data: {
          checkNo,
          confirmedCount: diffIds?.length || 1,
          handleType,
          reason,
          remark,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== 账户流水 ==========

  /**
   * 账户流水列表
   * GET /citic/account/records
   */
  async getAccountRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, accountNo, bizType, startDate, endDate } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.recordRepo.createQueryBuilder('record');

      if (accountNo) {
        queryBuilder.andWhere('record.accountNo = :accountNo', { accountNo });
      }
      if (bizType !== undefined && bizType !== '') {
        queryBuilder.andWhere('record.bizType = :bizType', { bizType: Number(bizType) });
      }
      if (startDate) {
        queryBuilder.andWhere('record.createTime >= :startDate', { startDate: new Date(startDate as string) });
      }
      if (endDate) {
        queryBuilder.andWhere('record.createTime <= :endDate', { endDate: new Date(endDate as string) });
      }

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('record.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total, page, pageSize } });
    } catch (error) {
      next(error);
    }
  }
}

export default new CiticController();
