/**
 * DGKJ 支付平台 - 中信银行 E+管家 API 对接服务
 * 
 * 实现与中信银行 E+管家系统的完整对接
 */

import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
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
} from '../../database/entities/citic.entity';
import { OpCode, opResult } from '../../utils/op-code';

// 中信银行 API 配置
interface CiticConfig {
  platformId: string;        // 平台编号
  appId: string;           // 应用ID
  appSecret: string;        // 应用密钥
  privateKey: string;       // 平台私钥 (RSA)
  publicKey: string;        // 中信公钥 (RSA)
  apiUrl: string;          // API 地址
  notifyUrl: string;        // 回调地址
}

// API 地址
const CITIC_API_URL = {
  // 测试环境
  sandbox: 'https://i.citiccloud.com/citic-b2b-gateway/sandbox',
  // 生产环境
  production: 'https://i.citiccloud.com/citic-b2b-gateway/prod',
};

/**
 * 中信银行 API 服务
 */
export class CiticBankService {
  private config: CiticConfig = {
    platformId: process.env.CITIC_PLATFORM_ID || '',
    appId: process.env.CITIC_APP_ID || '',
    appSecret: process.env.CITIC_APP_SECRET || '',
    privateKey: process.env.CITIC_PRIVATE_KEY || '',
    publicKey: process.env.CITIC_PUBLIC_KEY || '',
    apiUrl: process.env.CITIC_API_URL || CITIC_API_URL.sandbox,
    notifyUrl: process.env.CITIC_NOTIFY_URL || '',
  };

  private http: AxiosInstance;

  // Repository
  private accountRepo = AppDataSource.getRepository(CiticAccount);
  private cardRepo = AppDataSource.getRepository(CiticCard);
  private collectionRepo = AppDataSource.getRepository(CiticCollection);
  private profitShareRepo = AppDataSource.getRepository(CiticProfitShare);
  private transferRepo = AppDataSource.getRepository(CiticTransfer);
  private settlementRepo = AppDataSource.getRepository(CiticSettlement);
  private recordRepo = AppDataSource.getRepository(CiticAccountRecord);

  constructor() {
    this.http = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 初始化配置
   */
  initialize(config: Partial<CiticConfig>) {
    this.config = { ...this.config, ...config };
    if (config.apiUrl) {
      this.http = axios.create({
        baseURL: this.config.apiUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }

  // ==================== 账户管理 ====================

  /**
   * 创建子账户 (开户)
   */
  async createAccount(params: {
    bizUserId: string;       // 业务用户ID
    accountNo: string;      // 子账户号
    accountName: string;     // 账户名称
    accountType: number;     // 账户类型: 1-个人, 2-企业
    mchNo?: string;        // 商户号
    agentNo?: string;       // 代理商号
  }) {
    try {
      // 构建请求参数
      const requestData = {
        platformId: this.config.platformId,
        requestId: uuidv4(),
        timestamp: Date.now(),
        bizUserId: params.bizUserId,
        accountNo: params.accountNo,
        accountName: params.accountName,
        accountType: params.accountType,
        mchNo: params.mchNo,
        agentNo: params.agentNo,
      };

      // 签名
      const sign = this.sign(requestData);
      requestData['sign'] = sign;

      // 发送请求
      const response = await this.request('/account/create', requestData);

      if (response.code === 'SUCCESS') {
        // 保存账户记录
        const account = this.accountRepo.create({
          id: uuidv4(),
          bizUserId: params.bizUserId,
          accountNo: params.accountNo,
          accountName: params.accountName,
          accountType: params.accountType,
          mchNo: params.mchNo,
          agentNo: params.agentNo,
          balance: 0,
          availableBalance: 0,
          frozenBalance: 0,
          pendingBalance: 0,
          status: CiticAccountStatus.ENABLED,
          auditStatus: 1,
          createTime: new Date(),
          updateTime: new Date(),
        });
        await this.accountRepo.save(account);

        return opResult(OpCode.SUCCESS, {
          accountNo: params.accountNo,
          accountName: params.accountName,
          status: 'success',
        });
      } else {
        return opResult(OpCode.SYS_ERROR, null, response.message || '开户失败');
      }
    } catch (error: any) {
      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  /**
   * 查询账户余额
   */
  async queryBalance(accountNo: string) {
    try {
      const requestData = {
        platformId: this.config.platformId,
        requestId: uuidv4(),
        timestamp: Date.now(),
        accountNo,
      };

      const sign = this.sign(requestData);
      requestData['sign'] = sign;

      const response = await this.request('/account/balance/query', requestData);

      if (response.code === 'SUCCESS') {
        // 更新本地账户余额
        const account = await this.accountRepo.findOne({ where: { accountNo } });
        if (account) {
          account.balance = parseFloat(response.data.balance || '0');
          account.availableBalance = parseFloat(response.data.availableBalance || '0');
          account.frozenBalance = parseFloat(response.data.frozenBalance || '0');
          account.pendingBalance = parseFloat(response.data.pendingBalance || '0');
          account.updateTime = new Date();
          await this.accountRepo.save(account);
        }

        return opResult(OpCode.SUCCESS, {
          accountNo,
          balance: parseFloat(response.data.balance || '0'),
          availableBalance: parseFloat(response.data.availableBalance || '0'),
          frozenBalance: parseFloat(response.data.frozenBalance || '0'),
          pendingBalance: parseFloat(response.data.pendingBalance || '0'),
        });
      } else {
        return opResult(OpCode.SYS_ERROR, null, response.message);
      }
    } catch (error: any) {
      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  /**
   * 查询账户详情
   */
  async queryAccount(accountNo: string) {
    try {
      const requestData = {
        platformId: this.config.platformId,
        requestId: uuidv4(),
        timestamp: Date.now(),
        accountNo,
      };

      const sign = this.sign(requestData);
      requestData['sign'] = sign;

      const response = await this.request('/account/query', requestData);

      if (response.code === 'SUCCESS') {
        return opResult(OpCode.SUCCESS, response.data);
      } else {
        return opResult(OpCode.SYS_ERROR, null, response.message);
      }
    } catch (error: any) {
      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  // ==================== 银行卡管理 ====================

  /**
   * 绑定银行卡
   */
  async bindCard(params: {
    accountNo: string;
    cardNo: string;
    cardType: number;      // 1-借记卡, 2-贷记卡
    bankName: string;
    bankCode: string;
    cardHolder: string;
    certNo: string;       // 身份证号
    phone: string;         // 银行预留手机号
  }) {
    try {
      const requestData = {
        platformId: this.config.platformId,
        requestId: uuidv4(),
        timestamp: Date.now(),
        accountNo: params.accountNo,
        cardNo: params.cardNo,
        cardType: params.cardType,
        bankName: params.bankName,
        bankCode: params.bankCode,
        cardHolder: params.cardHolder,
        certNo: params.certNo,
        phone: params.phone,
        notifyUrl: this.config.notifyUrl + '/citic/card/callback',
      };

      const sign = this.sign(requestData);
      requestData['sign'] = sign;

      const response = await this.request('/card/bind', requestData);

      if (response.code === 'SUCCESS') {
        // 保存银行卡记录
        const card = this.cardRepo.create({
          id: uuidv4(),
          bizUserId: '',
          accountNo: params.accountNo,
          cardNo: params.cardNo,
          cardType: params.cardType,
          bankName: params.bankName,
          bankCode: params.bankCode,
          cardHolder: params.cardHolder,
          certNo: this.encryptCertNo(params.certNo),
          phone: this.maskPhone(params.phone),
          status: CiticCardStatus.BIND,
          bindTime: new Date(),
          createTime: new Date(),
          updateTime: new Date(),
        });
        await this.cardRepo.save(card);

        return opResult(OpCode.SUCCESS, {
          cardNo: this.maskCardNo(params.cardNo),
          status: 'bind_success',
        });
      } else {
        return opResult(OpCode.SYS_ERROR, null, response.message);
      }
    } catch (error: any) {
      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  /**
   * 解绑银行卡
   */
  async unbindCard(params: {
    accountNo: string;
    cardNo: string;
    unbindReason?: string;
  }) {
    try {
      const requestData = {
        platformId: this.config.platformId,
        requestId: uuidv4(),
        timestamp: Date.now(),
        accountNo: params.accountNo,
        cardNo: params.cardNo,
        unbindReason: params.unbindReason || '用户主动解绑',
      };

      const sign = this.sign(requestData);
      requestData['sign'] = sign;

      const response = await this.request('/card/unbind', requestData);

      if (response.code === 'SUCCESS') {
        // 更新银行卡状态
        const card = await this.cardRepo.findOne({ where: { cardNo: params.cardNo } });
        if (card) {
          card.status = CiticCardStatus.UNBIND;
          card.unbindTime = new Date();
          card.unbindReason = params.unbindReason;
          card.updateTime = new Date();
          await this.cardRepo.save(card);
        }

        return opResult(OpCode.SUCCESS, { status: 'unbind_success' });
      } else {
        return opResult(OpCode.SYS_ERROR, null, response.message);
      }
    } catch (error: any) {
      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  // ==================== 资金归集 ====================

  /**
   * 设置归集关系
   */
  async setCollection(params: {
    fromAccountNo: string;
    toAccountNo: string;
    collectionType: number;  // 1-全额, 2-定额, 3-保留余额
    collectionAmount?: number; // 定额归集金额
    reservedAmount?: number;  // 保留余额
  }) {
    try {
      const requestData = {
        platformId: this.config.platformId,
        requestId: uuidv4(),
        timestamp: Date.now(),
        fromAccountNo: params.fromAccountNo,
        toAccountNo: params.toAccountNo,
        collectionType: params.collectionType,
        collectionAmount: params.collectionAmount,
        reservedAmount: params.reservedAmount,
      };

      const sign = this.sign(requestData);
      requestData['sign'] = sign;

      const response = await this.request('/collection/set', requestData);

      if (response.code === 'SUCCESS') {
        // 保存归集关系
        const collectionNo = response.data?.collectionNo || 'COL' + Date.now();
        
        const fromAccount = await this.accountRepo.findOne({ where: { accountNo: params.fromAccountNo } });
        const toAccount = await this.accountRepo.findOne({ where: { accountNo: params.toAccountNo } });

        const collection = this.collectionRepo.create({
          id: uuidv4(),
          collectionNo,
          fromAccountNo: params.fromAccountNo,
          fromAccountName: fromAccount?.accountName || '',
          toAccountNo: params.toAccountNo,
          toAccountName: toAccount?.accountName || '',
          collectionType: params.collectionType,
          collectionAmount: params.collectionAmount,
          reservedAmount: params.reservedAmount,
          status: CiticCollectionStatus.PENDING,
          relationStatus: 1,
          createTime: new Date(),
          updateTime: new Date(),
        });
        await this.collectionRepo.save(collection);

        return opResult(OpCode.SUCCESS, {
          collectionNo,
          status: 'set_success',
        });
      } else {
        return opResult(OpCode.SYS_ERROR, null, response.message);
      }
    } catch (error: any) {
      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  /**
   * 执行主动归集
   */
  async executeCollection(collectionNo: string, amount?: number) {
    try {
      const collection = await this.collectionRepo.findOne({ where: { collectionNo } });
      if (!collection) {
        return opResult(OpCode.SYS_ERROR, null, '归集关系不存在');
      }

      // 获取账户余额
      const fromAccount = await this.accountRepo.findOne({ where: { accountNo: collection.fromAccountNo } });
      const toAccount = await this.accountRepo.findOne({ where: { accountNo: collection.toAccountNo } });

      if (!fromAccount || !toAccount) {
        return opResult(OpCode.SYS_ERROR, null, '账户不存在');
      }

      // 计算归集金额
      let collectAmount = 0;
      switch (collection.collectionType) {
        case 1: // 全额归集
          collectAmount = fromAccount.availableBalance;
          break;
        case 2: // 定额归集
          collectAmount = collection.collectionAmount || amount || 0;
          break;
        case 3: // 保留余额归集
          collectAmount = fromAccount.availableBalance - (collection.reservedAmount || 0);
          break;
      }

      if (collectAmount <= 0) {
        return opResult(OpCode.SYS_ERROR, null, '归集金额必须大于0');
      }

      const requestData = {
        platformId: this.config.platformId,
        requestId: uuidv4(),
        timestamp: Date.now(),
        collectionNo,
        amount: collectAmount,
      };

      const sign = this.sign(requestData);
      requestData['sign'] = sign;

      const response = await this.request('/collection/execute', requestData);

      if (response.code === 'SUCCESS') {
        const beforeBalance = fromAccount.availableBalance;

        // 更新本地账户余额
        fromAccount.availableBalance = fromAccount.availableBalance - collectAmount;
        toAccount.availableBalance = toAccount.availableBalance + collectAmount;
        fromAccount.updateTime = new Date();
        toAccount.updateTime = new Date();
        await this.accountRepo.save([fromAccount, toAccount]);

        // 更新归集状态
        collection.status = CiticCollectionStatus.SUCCESS;
        collection.collectionAmount = collectAmount;
        collection.completeTime = new Date();
        collection.updateTime = new Date();
        await this.collectionRepo.save(collection);

        // 记录流水
        await this.recordAccountFlow({
          accountNo: fromAccount.accountNo,
          bizType: 5,
          bizTypeName: '资金归集-转出',
          amount: -collectAmount,
          balanceBefore: beforeBalance,
          balanceAfter: fromAccount.availableBalance,
          orderNo: collectionNo,
          oppositeAccountNo: toAccount.accountNo,
          oppositeAccountName: toAccount.accountName,
        });

        await this.recordAccountFlow({
          accountNo: toAccount.accountNo,
          bizType: 5,
          bizTypeName: '资金归集-转入',
          amount: collectAmount,
          balanceBefore: toAccount.availableBalance - collectAmount,
          balanceAfter: toAccount.availableBalance,
          orderNo: collectionNo,
          oppositeAccountNo: fromAccount.accountNo,
          oppositeAccountName: fromAccount.accountName,
        });

        return opResult(OpCode.SUCCESS, {
          collectionNo,
          amount: collectAmount,
          status: 'success',
        });
      } else {
        return opResult(OpCode.SYS_ERROR, null, response.message);
      }
    } catch (error: any) {
      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  // ==================== 分账 ====================

  /**
   * 执行分账
   */
  async executeProfitShare(params: {
    orderNo: string;
    accountNo: string;
    receiverAccountNo: string;
    shareType: number;      // 1-比例分账, 2-金额分账
    shareRate?: number;     // 分账比例 (0.01 = 1%)
    shareAmount?: number;    // 分账金额
    shareRemark?: string;
  }) {
    try {
      const requestData = {
        platformId: this.config.platformId,
        requestId: uuidv4(),
        timestamp: Date.now(),
        orderNo: params.orderNo,
        accountNo: params.accountNo,
        receiverList: [{
          receiverAccountNo: params.receiverAccountNo,
          shareType: params.shareType,
          shareRate: params.shareRate,
          shareAmount: params.shareAmount,
        }],
        shareRemark: params.shareRemark,
      };

      const sign = this.sign(requestData);
      requestData['sign'] = sign;

      const response = await this.request('/profit/share', requestData);

      if (response.code === 'SUCCESS') {
        const shareNo = response.data?.shareNo || 'PS' + Date.now();

        // 获取账户信息
        const account = await this.accountRepo.findOne({ where: { accountNo: params.accountNo } });
        const receiverAccount = await this.accountRepo.findOne({ where: { accountNo: params.receiverAccountNo } });

        const shareAmount = params.shareAmount || (params.shareRate ? params.shareAmount : 0);

        // 保存分账记录
        const profitShare = this.profitShareRepo.create({
          id: uuidv4(),
          shareNo,
          orderNo: params.orderNo,
          accountNo: params.accountNo,
          accountName: account?.accountName || '',
          receiverAccountNo: params.receiverAccountNo,
          receiverName: receiverAccount?.accountName || '',
          shareType: params.shareType,
          shareRate: params.shareRate,
          shareAmount,
          orderAmount: 0,
          status: CiticProfitShareStatus.SUCCESS,
          shareTime: new Date(),
          createTime: new Date(),
          updateTime: new Date(),
        });
        await this.profitShareRepo.save(profitShare);

        // 更新账户余额
        if (account && receiverAccount) {
          const beforeBalance = account.availableBalance;
          account.availableBalance = account.availableBalance - shareAmount;
          receiverAccount.availableBalance = receiverAccount.availableBalance + shareAmount;
          account.updateTime = new Date();
          receiverAccount.updateTime = new Date();
          await this.accountRepo.save([account, receiverAccount]);

          // 记录流水
          await this.recordAccountFlow({
            accountNo: account.accountNo,
            bizType: 6,
            bizTypeName: '分账支出',
            amount: -shareAmount,
            balanceBefore: beforeBalance,
            balanceAfter: account.availableBalance,
            orderNo: shareNo,
            oppositeAccountNo: receiverAccount.accountNo,
            oppositeAccountName: receiverAccount.accountName,
          });

          await this.recordAccountFlow({
            accountNo: receiverAccount.accountNo,
            bizType: 6,
            bizTypeName: '分账收入',
            amount: shareAmount,
            balanceBefore: receiverAccount.availableBalance - shareAmount,
            balanceAfter: receiverAccount.availableBalance,
            orderNo: shareNo,
            oppositeAccountNo: account.accountNo,
            oppositeAccountName: account.accountName,
          });
        }

        return opResult(OpCode.SUCCESS, {
          shareNo,
          shareAmount,
          status: 'success',
        });
      } else {
        return opResult(OpCode.SYS_ERROR, null, response.message);
      }
    } catch (error: any) {
      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  // ==================== 代付 ====================

  /**
   * 申请代付
   */
  async applyTransfer(params: {
    accountNo: string;
    receiverCardNo: string;
    receiverName: string;
    receiverBank: string;
    receiverBankCode: string;
    amount: number;
    fee?: number;
    bizContent?: string;
    notifyUrl?: string;
  }) {
    try {
      const requestData = {
        platformId: this.config.platformId,
        requestId: uuidv4(),
        timestamp: Date.now(),
        accountNo: params.accountNo,
        receiverCardNo: params.receiverCardNo,
        receiverName: params.receiverName,
        receiverBank: params.receiverBank,
        receiverBankCode: params.receiverBankCode,
        amount: params.amount,
        fee: params.fee || 0,
        bizContent: params.bizContent || '代付',
        notifyUrl: params.notifyUrl || this.config.notifyUrl + '/citic/transfer/callback',
      };

      const sign = this.sign(requestData);
      requestData['sign'] = sign;

      const response = await this.request('/transfer/apply', requestData);

      if (response.code === 'SUCCESS') {
        const transferNo = response.data?.transferNo || 'TRF' + Date.now();

        // 获取账户信息
        const account = await this.accountRepo.findOne({ where: { accountNo: params.accountNo } });

        // 保存代付记录
        const transfer = this.transferRepo.create({
          id: uuidv4(),
          transferNo,
          accountNo: params.accountNo,
          accountName: account?.accountName || '',
          receiverCardNo: params.receiverCardNo,
          receiverBankName: params.receiverBank,
          receiverBankCode: params.receiverBankCode,
          amount: params.amount,
          fee: params.fee || 0,
          actualAmount: params.amount - (params.fee || 0),
          transferType: 1,
          status: CiticTransferStatus.PROCESSING,
          createTime: new Date(),
          updateTime: new Date(),
        });
        await this.transferRepo.save(transfer);

        // 冻结金额
        if (account) {
          const beforeBalance = account.availableBalance;
          account.availableBalance = account.availableBalance - params.amount - (params.fee || 0);
          account.frozenBalance = account.frozenBalance + params.amount + (params.fee || 0);
          account.updateTime = new Date();
          await this.accountRepo.save(account);

          // 记录流水
          await this.recordAccountFlow({
            accountNo: account.accountNo,
            bizType: 7,
            bizTypeName: '代付冻结',
            amount: -(params.amount + (params.fee || 0)),
            balanceBefore: beforeBalance,
            balanceAfter: account.availableBalance,
            orderNo: transferNo,
          });
        }

        return opResult(OpCode.SUCCESS, {
          transferNo,
          amount: params.amount,
          fee: params.fee || 0,
          status: 'processing',
        });
      } else {
        return opResult(OpCode.SYS_ERROR, null, response.message);
      }
    } catch (error: any) {
      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  /**
   * 代付回调处理
   */
  async handleTransferCallback(data: any) {
    try {
      const { transferNo, status, failReason } = data;

      const transfer = await this.transferRepo.findOne({ where: { transferNo } });
      if (!transfer) {
        return opResult(OpCode.SYS_ERROR, null, '代付记录不存在');
      }

      const account = await this.accountRepo.findOne({ where: { accountNo: transfer.accountNo } });

      if (status === 'SUCCESS') {
        // 代付成功
        transfer.status = CiticTransferStatus.SUCCESS;
        transfer.successTime = new Date();
        transfer.notifyTime = new Date();
        await this.transferRepo.save(transfer);

        // 解冻金额
        if (account) {
          const totalAmount = transfer.amount + transfer.fee;
          account.frozenBalance = account.frozenBalance - totalAmount;
          account.updateTime = new Date();
          await this.accountRepo.save(account);

          // 记录流水
          await this.recordAccountFlow({
            accountNo: account.accountNo,
            bizType: 7,
            bizTypeName: '代付成功',
            amount: -totalAmount,
            balanceBefore: account.frozenBalance + totalAmount,
            balanceAfter: account.frozenBalance,
            orderNo: transferNo,
            remark: `代付成功，金额：${transfer.amount}，手续费：${transfer.fee}`,
          });
        }
      } else {
        // 代付失败
        transfer.status = CiticTransferStatus.FAILED;
        transfer.failReason = failReason;
        transfer.notifyTime = new Date();
        await this.transferRepo.save(transfer);

        // 解冻并返还金额
        if (account) {
          const totalAmount = transfer.amount + transfer.fee;
          account.availableBalance = account.availableBalance + totalAmount;
          account.frozenBalance = account.frozenBalance - totalAmount;
          account.updateTime = new Date();
          await this.accountRepo.save(account);

          // 记录流水
          await this.recordAccountFlow({
            accountNo: account.accountNo,
            bizType: 7,
            bizTypeName: '代付失败-返还',
            amount: totalAmount,
            balanceBefore: account.frozenBalance,
            balanceAfter: account.availableBalance,
            orderNo: transferNo,
            remark: `代付失败，金额返还：${totalAmount}，原因：${failReason}`,
          });
        }
      }

      return opResult(OpCode.SUCCESS, { transferNo, status });
    } catch (error: any) {
      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  // ==================== 结算 ====================

  /**
   * 申请结算
   */
  async applySettlement(params: {
    accountNo: string;
    settleType: number;     // 1-D+0, 2-T+1
    amount: number;
    targetCardNo: string;
    targetBank: string;
    targetBankCode: string;
  }) {
    try {
      // 计算手续费
      const feeRate = params.settleType === 1 ? 0.0035 : 0.0025; // D+0: 0.35%, T+1: 0.25%
      const fee = Math.ceil(params.amount * feeRate * 100) / 100;
      const actualAmount = params.amount - fee;

      // 获取账户
      const account = await this.accountRepo.findOne({ where: { accountNo: params.accountNo } });
      if (!account) {
        return opResult(OpCode.SYS_ERROR, null, '账户不存在');
      }

      if (account.availableBalance < params.amount) {
        return opResult(OpCode.SYS_ERROR, null, '余额不足');
      }

      const requestData = {
        platformId: this.config.platformId,
        requestId: uuidv4(),
        timestamp: Date.now(),
        accountNo: params.accountNo,
        settleType: params.settleType,
        amount: params.amount,
        fee,
        actualAmount,
        targetCardNo: params.targetCardNo,
        targetBank: params.targetBank,
        targetBankCode: params.targetBankCode,
        notifyUrl: this.config.notifyUrl + '/citic/settlement/callback',
      };

      const sign = this.sign(requestData);
      requestData['sign'] = sign;

      const response = await this.request('/settlement/apply', requestData);

      if (response.code === 'SUCCESS') {
        const settleNo = response.data?.settleNo || 'STL' + Date.now();

        // 保存结算记录
        const settlement = this.settlementRepo.create({
          id: uuidv4(),
          settleNo,
          accountNo: params.accountNo,
          accountName: account.accountName,
          settleType: params.settleType,
          amount: params.amount,
          fee,
          actualAmount,
          targetCardNo: params.targetCardNo,
          targetBankName: params.targetBank,
          targetBankCode: params.targetBankCode,
          status: CiticSettlementStatus.PROCESSING,
          createTime: new Date(),
          updateTime: new Date(),
        });
        await this.settlementRepo.save(settlement);

        // 冻结金额
        const beforeBalance = account.availableBalance;
        account.availableBalance = account.availableBalance - params.amount;
        account.frozenBalance = account.frozenBalance + params.amount;
        account.updateTime = new Date();
        await this.accountRepo.save(account);

        // 记录流水
        await this.recordAccountFlow({
          accountNo: account.accountNo,
          bizType: 8,
          bizTypeName: params.settleType === 1 ? 'D+0结算申请' : 'T+1结算申请',
          amount: -params.amount,
          balanceBefore: beforeBalance,
          balanceAfter: account.availableBalance,
          orderNo: settleNo,
          remark: `结算申请，金额：${params.amount}，手续费：${fee}`,
        });

        return opResult(OpCode.SUCCESS, {
          settleNo,
          amount: params.amount,
          fee,
          actualAmount,
          status: 'processing',
        });
      } else {
        return opResult(OpCode.SYS_ERROR, null, response.message);
      }
    } catch (error: any) {
      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  // ==================== 对账 ====================

  /**
   * 下载对账单
   */
  async downloadBill(params: {
    checkDate: string;      // 格式: YYYYMMDD
    accountNo?: string;
  }) {
    try {
      const requestData = {
        platformId: this.config.platformId,
        requestId: uuidv4(),
        timestamp: Date.now(),
        checkDate: params.checkDate,
        accountNo: params.accountNo,
      };

      const sign = this.sign(requestData);
      requestData['sign'] = sign;

      const response = await this.request('/check/bill/download', requestData);

      if (response.code === 'SUCCESS') {
        return opResult(OpCode.SUCCESS, {
          fileUrl: response.data?.fileUrl,
          fileName: `中信银行对账单_${params.checkDate}.xlsx`,
        });
      } else {
        return opResult(OpCode.SYS_ERROR, null, response.message);
      }
    } catch (error: any) {
      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 发送 API 请求
   */
  private async request(path: string, data: any): Promise<any> {
    try {
      const response = await this.http.post(path, data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * 签名
   */
  private sign(data: any): string {
    if (!this.config.privateKey) {
      // 如果没有私钥，使用简单的签名
      const str = JSON.stringify(data) + this.config.appSecret;
      return crypto.createHash('md5').update(str).digest('hex');
    }

    // RSA 签名
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(JSON.stringify(data));
    return sign.sign(this.config.privateKey, 'base64');
  }

  /**
   * 记录账户流水
   */
  private async recordAccountFlow(params: {
    accountNo: string;
    bizType: number;
    bizTypeName: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    orderNo: string;
    oppositeAccountNo?: string;
    oppositeAccountName?: string;
    remark?: string;
  }) {
    const record = this.recordRepo.create({
      id: uuidv4(),
      recordNo: 'REC' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase(),
      accountNo: params.accountNo,
      bizType: params.bizType,
      bizTypeName: params.bizTypeName,
      amount: params.amount,
      balanceBefore: params.balanceBefore,
      balanceAfter: params.balanceAfter,
      orderNo: params.orderNo,
      oppositeAccountNo: params.oppositeAccountNo,
      oppositeAccountName: params.oppositeAccountName,
      remark: params.remark,
      createTime: new Date(),
    });
    await this.recordRepo.save(record);
  }

  /**
   * 加密身份证号
   */
  private encryptCertNo(certNo: string): string {
    // 使用 AES 加密 (实际应使用配置的密钥)
    const key = crypto.scryptSync(this.config.appSecret, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(certNo, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 加密手机号
   */
  private maskPhone(phone: string): string {
    if (phone.length >= 7) {
      return phone.slice(0, 3) + '****' + phone.slice(-4);
    }
    return '****';
  }

  /**
   * 脱敏银行卡号
   */
  private maskCardNo(cardNo: string): string {
    if (cardNo.length >= 8) {
      return cardNo.slice(0, 4) + '****' + cardNo.slice(-4);
    }
    return '****';
  }
}

export default new CiticBankService();
