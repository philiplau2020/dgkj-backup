/**
 * 中信银行E管家 - 自动调度服务
 *
 * 核心功能：
 * 1. 自动对账 (Auto Reconciliation)
 *    - 每日凌晨自动对账，比对平台交易与中信银行通道交易
 *    - 支持多通道对账，识别长款/短款差异
 *    - 自动生成差异报告并通知
 *
 * 2. 自动分账 (Auto Profit Sharing)
 *    - 交易成功后自动分账
 *    - 支持比例分账和定额分账
 *    - 支持多级分账（平台->代理->商户）
 *
 * 3. 自动结算 (Auto Settlement)
 *    - D0 实时结算（交易成功后即时结算）
 *    - T1 次日结算（每日凌晨批量处理）
 *    - 支持最低结算限额
 *    - 支持结算时间段控制
 */
import { AppDataSource } from '../../config/data-source';
import {
  CiticAccount,
  CiticCheck,
  CiticSettlement,
  CiticProfitShare,
  CiticCollection,
  CiticAccountRecord,
  CiticCheckStatus,
  CiticSettlementStatus,
  CiticProfitShareStatus,
  CiticCollectionStatus,
} from '../../database/entities/citic.entity';
import { v4 as uuidv4 } from 'uuid';
import { Between } from 'typeorm';

export interface AutoCheckConfig {
  enabled: boolean;
  checkTime: string; // e.g., "02:00" 每日凌晨2点
  channels: string[]; // 要对账的通道列表
  autoConfirmDiff: boolean; // 是否自动确认小额差异
  diffThreshold: number; // 自动确认差异阈值(分)
}

export interface AutoSettlementConfig {
  enabled: boolean;
  settleType: 1 | 2; // 1=D0实时, 2=T1批量
  minAmount: number; // 最低结算金额
  maxAmount: number; // 单次最高结算金额
  settleTimeStart: string; // e.g., "09:00"
  settleTimeEnd: string; // e.g., "17:00"
  feeRates: {
    d0: number; // D0费率, e.g., 0.0035
    t1: number; // T1费率, e.g., 0.0025
  };
}

export interface AutoProfitShareConfig {
  enabled: boolean;
  shareType: 1 | 2; // 1=比例分账, 2=金额分账
  platformShareRate: number; // 平台分账比例 (0-100)
  agentShareRates: Record<string, number>; // 各代理分账比例
  autoShareOnTrade: boolean; // 交易成功自动分账
}

export interface AutoCollectionConfig {
  enabled: boolean;
  collectionType: 1 | 2 | 3; // 1=全额, 2=定额, 3=保留余额
  collectionAmount?: number; // 定额归集金额
  reservedAmount?: number; // 保留余额
  collectionTime: string; // 归集时间
  accounts: Array<{
    fromAccountNo: string;
    toAccountNo: string;
  }>;
}

export class CiticAutoService {
  private accountRepo = AppDataSource.getRepository(CiticAccount);
  private checkRepo = AppDataSource.getRepository(CiticCheck);
  private settlementRepo = AppDataSource.getRepository(CiticSettlement);
  private profitShareRepo = AppDataSource.getRepository(CiticProfitShare);
  private collectionRepo = AppDataSource.getRepository(CiticCollection);
  private recordRepo = AppDataSource.getRepository(CiticAccountRecord);

  private autoCheckConfig: AutoCheckConfig = {
    enabled: true,
    checkTime: '02:00',
    channels: ['CITIC_QR', 'WX_QR', 'ALI_QR'],
    autoConfirmDiff: true,
    diffThreshold: 100, // 1元以内自动确认
  };

  private autoSettlementConfig: AutoSettlementConfig = {
    enabled: true,
    settleType: 2,
    minAmount: 100,
    maxAmount: 500000,
    settleTimeStart: '09:00',
    settleTimeEnd: '17:00',
    feeRates: { d0: 0.0035, t1: 0.0025 },
  };

  private autoProfitShareConfig: AutoProfitShareConfig = {
    enabled: true,
    shareType: 1,
    platformShareRate: 20,
    agentShareRates: {},
    autoShareOnTrade: true,
  };

  private autoCollectionConfig: AutoCollectionConfig = {
    enabled: true,
    collectionType: 1,
    collectionTime: '23:00',
    accounts: [],
  };

  /**
   * ========== 自动对账核心逻辑 ==========
   */

  /**
   * 执行自动对账
   * @param checkDate 对账日期，格式 YYYY-MM-DD
   * @param channelCode 通道编号，为空则对账所有通道
   */
  async executeAutoCheck(checkDate: string, channelCode?: string): Promise<{
    success: boolean;
    checkNo: string;
    totalCount: number;
    successCount: number;
    failCount: number;
    diffCount: number;
    diffAmount: number;
    error?: string;
  }> {
    try {
      console.log(`[自动对账] 开始执行对账任务, 日期: ${checkDate}, 通道: ${channelCode || '全部'}`);

      // 生成对账单号
      const checkNo = 'CHK' + checkDate.replace(/-/g, '') + (channelCode || 'ALL');

      // 检查是否已存在对账记录
      const existing = await this.checkRepo.findOne({ where: { checkNo } });
      if (existing) {
        console.log(`[自动对账] 对账记录已存在: ${checkNo}`);
        return {
          success: false,
          checkNo,
          totalCount: existing.totalCount,
          successCount: existing.successCount,
          failCount: existing.failCount,
          diffCount: existing.diffCount,
          diffAmount: Number(existing.diffAmount),
          error: '对账记录已存在',
        };
      }

      // 获取对账日期范围
      const startTime = new Date(checkDate + ' 00:00:00');
      const endTime = new Date(checkDate + ' 23:59:59');

      // 模拟从各通道获取对账数据
      // 实际场景中，这里应该调用各支付通道的对账API获取文件
      const channelData = await this.fetchChannelCheckData(checkDate, channelCode);

      // 获取平台交易数据
      const platformData = await this.fetchPlatformTradeData(startTime, endTime, channelCode);

      // 执行对账比对
      const checkResult = await this.compareData(platformData, channelData);

      // 创建对账记录
      const check = this.checkRepo.create({
        id: uuidv4(),
        checkNo,
        checkDate: new Date(checkDate),
        checkType: 1,
        channelCode,
        channelName: channelCode || '全部',
        totalCount: checkResult.totalCount,
        totalAmount: checkResult.totalAmount,
        successCount: checkResult.successCount,
        successAmount: checkResult.successAmount,
        failCount: checkResult.failCount,
        failAmount: checkResult.failAmount,
        diffCount: checkResult.diffCount,
        diffAmount: checkResult.diffAmount,
        status: checkResult.diffCount > 0 ? CiticCheckStatus.DIFF : CiticCheckStatus.BALANCED,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.checkRepo.save(check);

      console.log(`[自动对账] 对账完成, 结果: 总笔数=${checkResult.totalCount}, 成功=${checkResult.successCount}, 失败=${checkResult.failCount}, 差异=${checkResult.diffCount}, 差异金额=${checkResult.diffAmount}`);

      return {
        success: true,
        checkNo,
        totalCount: checkResult.totalCount,
        successCount: checkResult.successCount,
        failCount: checkResult.failCount,
        diffCount: checkResult.diffCount,
        diffAmount: checkResult.diffAmount,
      };
    } catch (error: any) {
      console.error('[自动对账] 对账失败:', error);
      return {
        success: false,
        checkNo: '',
        totalCount: 0,
        successCount: 0,
        failCount: 0,
        diffCount: 0,
        diffAmount: 0,
        error: error.message,
      };
    }
  }

  /**
   * 获取通道对账数据
   * 实际场景中，这里应该调用中信银行或其他支付通道的对账API
   */
  private async fetchChannelCheckData(
    checkDate: string,
    channelCode?: string
  ): Promise<Array<{
    orderNo: string;
    channelOrderNo: string;
    amount: number;
    status: 'SUCCESS' | 'FAILED' | 'REFUND';
    tradeTime: Date;
    refundAmount?: number;
  }>> {
    // 模拟通道数据
    const mockData = [];
    const count = Math.floor(Math.random() * 50) + 10;

    for (let i = 0; i < count; i++) {
      const status = Math.random() > 0.95 ? 'FAILED' : (Math.random() > 0.9 ? 'REFUND' : 'SUCCESS');
      mockData.push({
        orderNo: `ORD${checkDate.replace(/-/g, '')}${String(i + 1).padStart(6, '0')}`,
        channelOrderNo: `CHN${Date.now()}${String(i).padStart(4, '0')}`,
        amount: Math.floor(Math.random() * 10000) + 100,
        status,
        tradeTime: new Date(checkDate + ' ' + `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`),
        refundAmount: status === 'REFUND' ? Math.floor(Math.random() * 5000) + 100 : 0,
      });
    }

    return mockData;
  }

  /**
   * 获取平台交易数据
   * 从本地数据库查询
   */
  private async fetchPlatformTradeData(
    startTime: Date,
    endTime: Date,
    channelCode?: string
  ): Promise<Array<{
    orderNo: string;
    channelOrderNo: string;
    amount: number;
    status: 'SUCCESS' | 'FAILED' | 'REFUND';
    tradeTime: Date;
    refundAmount?: number;
  }>> {
    // 实际场景中，应该从 Trade 实体查询
    // 这里返回模拟数据
    const mockData = [];
    const count = Math.floor(Math.random() * 50) + 10;

    for (let i = 0; i < count; i++) {
      const status = Math.random() > 0.95 ? 'FAILED' : (Math.random() > 0.9 ? 'REFUND' : 'SUCCESS');
      mockData.push({
        orderNo: `ORD${startTime.toISOString().slice(0, 10).replace(/-/g, '')}${String(i + 1).padStart(6, '0')}`,
        channelOrderNo: `CHN${Date.now()}${String(i).padStart(4, '0')}`,
        amount: Math.floor(Math.random() * 10000) + 100,
        status,
        tradeTime: new Date(startTime.getTime() + Math.random() * (endTime.getTime() - startTime.getTime())),
        refundAmount: status === 'REFUND' ? Math.floor(Math.random() * 5000) + 100 : 0,
      });
    }

    return mockData;
  }

  /**
   * 比对平台数据与通道数据
   */
  private async compareData(
    platformData: Array<{
      orderNo: string;
      channelOrderNo: string;
      amount: number;
      status: 'SUCCESS' | 'FAILED' | 'REFUND';
      tradeTime: Date;
      refundAmount?: number;
    }>,
    channelData: Array<{
      orderNo: string;
      channelOrderNo: string;
      amount: number;
      status: 'SUCCESS' | 'FAILED' | 'REFUND';
      tradeTime: Date;
      refundAmount?: number;
    }>
  ): Promise<{
    totalCount: number;
    totalAmount: number;
    successCount: number;
    successAmount: number;
    failCount: number;
    failAmount: number;
    diffCount: number;
    diffAmount: number;
  }> {
    const result = {
      totalCount: 0,
      totalAmount: 0,
      successCount: 0,
      successAmount: 0,
      failCount: 0,
      failAmount: 0,
      diffCount: 0,
      diffAmount: 0,
    };

    // 创建订单映射
    const platformMap = new Map<string, typeof platformData[0]>();
    const channelMap = new Map<string, typeof channelData[0]>();

    for (const item of platformData) {
      platformMap.set(item.orderNo, item);
    }
    for (const item of channelData) {
      channelMap.set(item.orderNo, item);
    }

    // 遍历平台数据比对
    for (const [orderNo, platformItem] of platformMap) {
      result.totalCount++;
      result.totalAmount += platformItem.amount;

      const channelItem = channelMap.get(orderNo);

      if (!channelItem) {
        // 平台有，通道没有 -> 平台长款
        result.diffCount++;
        result.diffAmount += platformItem.amount;
        console.log(`[对账差异] 平台长款, 订单: ${orderNo}, 金额: ${platformItem.amount}`);
      } else if (platformItem.status !== channelItem.status) {
        // 状态不一致
        result.diffCount++;
        result.diffAmount += Math.abs(platformItem.amount - channelItem.amount);
        console.log(`[对账差异] 状态不一致, 订单: ${orderNo}, 平台状态: ${platformItem.status}, 通道状态: ${channelItem.status}`);
      } else if (Math.abs(platformItem.amount - channelItem.amount) > 0.01) {
        // 金额不一致
        result.diffCount++;
        result.diffAmount += Math.abs(platformItem.amount - channelItem.amount);
        console.log(`[对账差异] 金额不一致, 订单: ${orderNo}, 平台: ${platformItem.amount}, 通道: ${channelItem.amount}`);
      } else if (platformItem.status === 'SUCCESS') {
        result.successCount++;
        result.successAmount += platformItem.amount;
      } else {
        result.failCount++;
        result.failAmount += platformItem.amount;
      }
    }

    // 遍历通道数据，检查是否有通道有但平台没有的 -> 平台短款
    for (const [orderNo, channelItem] of channelMap) {
      if (!platformMap.has(orderNo)) {
        result.diffCount++;
        result.diffAmount += channelItem.amount;
        console.log(`[对账差异] 平台短款, 订单: ${orderNo}, 金额: ${channelItem.amount}`);
      }
    }

    return result;
  }

  /**
   * ========== 自动分账核心逻辑 ==========
   */

  /**
   * 执行自动分账
   * @param orderNo 原订单号
   * @param tradeAmount 交易金额
   * @param accountNo 账户编号
   */
  async executeAutoProfitShare(
    orderNo: string,
    tradeAmount: number,
    accountNo: string,
    receivers: Array<{
      accountNo: string;
      accountName: string;
      shareType: 1 | 2;
      shareRate?: number;
      shareAmount?: number;
    }>
  ): Promise<{
    success: boolean;
    shareNo: string;
    totalShareAmount: number;
    results: Array<{
      receiverAccountNo: string;
      shareAmount: number;
      status: string;
      error?: string;
    }>;
    error?: string;
  }> {
    try {
      console.log(`[自动分账] 开始执行分账, 订单: ${orderNo}, 金额: ${tradeAmount}`);

      // 获取账户信息
      const account = await this.accountRepo.findOne({ where: { accountNo } });
      if (!account) {
        return { success: false, shareNo: '', totalShareAmount: 0, results: [], error: '账户不存在' };
      }

      // 检查余额
      const totalShareAmount = receivers.reduce((sum, r) => {
        if (r.shareType === 1) {
          return sum + (tradeAmount * (r.shareRate || 0) / 100);
        } else {
          return sum + (r.shareAmount || 0);
        }
      }, 0);

      if (account.availableBalance < totalShareAmount) {
        return { success: false, shareNo: '', totalShareAmount, results: [], error: '账户余额不足' };
      }

      const shareNo = 'PS' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
      const results: Array<{
        receiverAccountNo: string;
        shareAmount: number;
        status: string;
        error?: string;
      }> = [];

      let beforeBalance = account.availableBalance;

      // 遍历各接收方执行分账
      for (const receiver of receivers) {
        let shareAmount = 0;

        if (receiver.shareType === 1) {
          // 比例分账
          shareAmount = tradeAmount * (receiver.shareRate || 0) / 100;
        } else {
          // 金额分账
          shareAmount = receiver.shareAmount || 0;
        }

        shareAmount = Math.floor(shareAmount * 100) / 100; // 保留2位小数

        if (shareAmount <= 0) continue;

        // 获取接收方账户
        const receiverAccount = await this.accountRepo.findOne({ where: { accountNo: receiver.accountNo } });

        try {
          // 扣减原账户余额
          beforeBalance = beforeBalance - shareAmount;
          account.availableBalance = beforeBalance;
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
            accountName: account.accountName,
            receiverAccountNo: receiver.accountNo,
            receiverName: receiver.accountName,
            shareType: receiver.shareType,
            shareRate: receiver.shareRate,
            shareAmount,
            orderAmount: tradeAmount,
            status: CiticProfitShareStatus.SUCCESS,
            shareTime: new Date(),
            createTime: new Date(),
            updateTime: new Date(),
          });
          await this.profitShareRepo.save(profitShare);

          // 记录流水 - 扣款账户
          await this.recordRepo.save({
            id: uuidv4(),
            recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
            accountNo,
            accountName: account.accountName,
            bizType: 6,
            bizTypeName: '分账支出',
            amount: -shareAmount,
            balanceBefore: beforeBalance + shareAmount,
            balanceAfter: beforeBalance,
            orderNo: shareNo,
            oppositeAccountNo: receiver.accountNo,
            oppositeAccountName: receiver.accountName,
            createTime: new Date(),
          });

          // 记录流水 - 入账账户
          if (receiverAccount) {
            await this.recordRepo.save({
              id: uuidv4(),
              recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 7).toUpperCase(),
              accountNo: receiver.accountNo,
              accountName: receiver.accountName,
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

          results.push({
            receiverAccountNo: receiver.accountNo,
            shareAmount,
            status: 'SUCCESS',
          });

          console.log(`[自动分账] 分账成功, 接收方: ${receiver.accountNo}, 金额: ${shareAmount}`);
        } catch (err: any) {
          results.push({
            receiverAccountNo: receiver.accountNo,
            shareAmount,
            status: 'FAILED',
            error: err.message,
          });
          console.error(`[自动分账] 分账失败, 接收方: ${receiver.accountNo}, 错误: ${err.message}`);
        }
      }

      console.log(`[自动分账] 分账完成, 分账单号: ${shareNo}, 总金额: ${totalShareAmount}`);

      return {
        success: true,
        shareNo,
        totalShareAmount,
        results,
      };
    } catch (error: any) {
      console.error('[自动分账] 分账失败:', error);
      return {
        success: false,
        shareNo: '',
        totalShareAmount: 0,
        results: [],
        error: error.message,
      };
    }
  }

  /**
   * ========== 自动结算核心逻辑 ==========
   */

  /**
   * 执行自动结算
   * @param accountNo 账户编号
   * @param settleType 结算类型 1=D0, 2=T1
   */
  async executeAutoSettlement(
    accountNo: string,
    settleType: 1 | 2
  ): Promise<{
    success: boolean;
    settleNo: string;
    amount: number;
    fee: number;
    actualAmount: number;
    error?: string;
  }> {
    try {
      console.log(`[自动结算] 开始执行结算, 账户: ${accountNo}, 类型: ${settleType === 1 ? 'D0' : 'T1'}`);

      const config = this.autoSettlementConfig;

      // 检查结算时间段
      if (!this.isInSettleTimeWindow()) {
        return {
          success: false,
          settleNo: '',
          amount: 0,
          fee: 0,
          actualAmount: 0,
          error: '不在结算时间范围内',
        };
      }

      // 获取账户信息
      const account = await this.accountRepo.findOne({ where: { accountNo } });
      if (!account) {
        return { success: false, settleNo: '', amount: 0, fee: 0, actualAmount: 0, error: '账户不存在' };
      }

      // 检查余额是否满足最低结算限额
      if (account.availableBalance < config.minAmount) {
        return {
          success: false,
          settleNo: '',
          amount: 0,
          fee: 0,
          actualAmount: 0,
          error: `可用余额 ${account.availableBalance} 低于最低结算限额 ${config.minAmount}`,
        };
      }

      // 计算结算金额（不超过最高限额）
      let settleAmount = Math.min(account.availableBalance, config.maxAmount);

      // 计算手续费
      const feeRate = settleType === 1 ? config.feeRates.d0 : config.feeRates.t1;
      const fee = Math.floor(settleAmount * feeRate * 100) / 100;
      const actualAmount = Math.floor((settleAmount - fee) * 100) / 100;

      if (actualAmount <= 0) {
        return {
          success: false,
          settleNo: '',
          amount: 0,
          fee: 0,
          actualAmount: 0,
          error: '实结金额为0或负数',
        };
      }

      const settleNo = 'STL' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
      const beforeBalance = account.availableBalance;

      // 冻结金额
      account.availableBalance = account.availableBalance - settleAmount;
      account.frozenBalance = account.frozenBalance + settleAmount;
      account.updateTime = new Date();
      await this.accountRepo.save(account);

      // 创建结算记录
      const settlement = this.settlementRepo.create({
        id: uuidv4(),
        settleNo,
        accountNo,
        accountName: account.accountName,
        settleType,
        amount: settleAmount,
        fee,
        actualAmount,
        status: CiticSettlementStatus.PROCESSING,
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
        bizTypeName: settleType === 1 ? 'D0自动结算申请' : 'T1自动结算申请',
        amount: -settleAmount,
        balanceBefore: beforeBalance,
        balanceAfter: account.availableBalance,
        orderNo: settleNo,
        remark: `自动结算申请，金额：${settleAmount}，手续费：${fee}`,
        createTime: new Date(),
      });

      // 模拟中信银行处理（实际应调用银行API）
      setTimeout(async () => {
        await this.settlementCallback(settleNo, true);
      }, 2000);

      console.log(`[自动结算] 结算申请已提交, 单号: ${settleNo}, 金额: ${settleAmount}, 手续费: ${fee}`);

      return {
        success: true,
        settleNo,
        amount: settleAmount,
        fee,
        actualAmount,
      };
    } catch (error: any) {
      console.error('[自动结算] 结算失败:', error);
      return {
        success: false,
        settleNo: '',
        amount: 0,
        fee: 0,
        actualAmount: 0,
        error: error.message,
      };
    }
  }

  /**
   * 批量执行T1结算
   * 每日凌晨调用，对所有满足条件的账户执行T1结算
   */
  async executeBatchT1Settlement(): Promise<{
    totalAccounts: number;
    successCount: number;
    failCount: number;
    totalAmount: number;
    results: Array<{
      accountNo: string;
      settleNo: string;
      amount: number;
      status: string;
      error?: string;
    }>;
  }> {
    try {
      console.log('[自动结算] 开始批量T1结算任务');

      // 获取所有启用状态的账户
      const accounts = await this.accountRepo.find();
      const results = [];
      let successCount = 0;
      let failCount = 0;
      let totalAmount = 0;

      for (const account of accounts) {
        if (account.status !== 1) continue; // 只处理启用状态的账户
        if (account.availableBalance < this.autoSettlementConfig.minAmount) continue;

        const result = await this.executeAutoSettlement(account.accountNo, 2);

        if (result.success) {
          successCount++;
          totalAmount += result.amount;
        } else {
          failCount++;
        }

        results.push({
          accountNo: account.accountNo,
          settleNo: result.settleNo,
          amount: result.amount,
          status: result.success ? 'SUCCESS' : 'FAILED',
          error: result.error,
        });
      }

      console.log(`[自动结算] 批量T1结算完成, 总账户: ${accounts.length}, 成功: ${successCount}, 失败: ${failCount}, 总金额: ${totalAmount}`);

      return {
        totalAccounts: accounts.length,
        successCount,
        failCount,
        totalAmount,
        results,
      };
    } catch (error: any) {
      console.error('[自动结算] 批量T1结算失败:', error);
      return {
        totalAccounts: 0,
        successCount: 0,
        failCount: 0,
        totalAmount: 0,
        results: [],
      };
    }
  }

  /**
   * 结算回调处理
   * 模拟中信银行异步通知
   */
  private async settlementCallback(settleNo: string, success: boolean, failReason?: string): Promise<void> {
    try {
      const settlement = await this.settlementRepo.findOne({ where: { settleNo } });
      if (!settlement) {
        console.error(`[结算回调] 结算记录不存在: ${settleNo}`);
        return;
      }

      const account = await this.accountRepo.findOne({ where: { accountNo: settlement.accountNo } });
      if (!account) return;

      if (success) {
        settlement.status = CiticSettlementStatus.SUCCESS;
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

        console.log(`[结算回调] 结算成功: ${settleNo}`);
      } else {
        settlement.status = CiticSettlementStatus.FAILED;
        settlement.failReason = failReason || '银行处理失败';

        // 解冻并返还
        account.availableBalance = account.availableBalance + Number(settlement.amount);
        account.frozenBalance = account.frozenBalance - Number(settlement.amount);
        account.updateTime = new Date();

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

        console.log(`[结算回调] 结算失败: ${settleNo}, 原因: ${failReason}`);
      }

      await this.accountRepo.save(account);
      await this.settlementRepo.save(settlement);
    } catch (error) {
      console.error(`[结算回调] 处理失败: ${settleNo}`, error);
    }
  }

  /**
   * ========== 自动资金归集核心逻辑 ==========
   */

  /**
   * 执行自动资金归集
   */
  async executeAutoCollection(): Promise<{
    success: boolean;
    totalCollected: number;
    results: Array<{
      collectionNo: string;
      fromAccountNo: string;
      toAccountNo: string;
      amount: number;
      status: string;
      error?: string;
    }>;
  }> {
    try {
      console.log('[自动归集] 开始执行资金归集任务');

      // 获取所有启用的归集关系
      const collections = await this.collectionRepo.find({
        where: { relationStatus: 1 },
      });

      const results = [];
      let totalCollected = 0;

      for (const collection of collections) {
        const result = await this.executeCollection(collection);
        if (result.success) {
          totalCollected += result.amount;
        }
        results.push({
          collectionNo: collection.collectionNo,
          fromAccountNo: collection.fromAccountNo,
          toAccountNo: collection.toAccountNo,
          amount: result.amount,
          status: result.success ? 'SUCCESS' : 'FAILED',
          error: result.error,
        });
      }

      console.log(`[自动归集] 归集完成, 总金额: ${totalCollected}`);

      return {
        success: true,
        totalCollected,
        results,
      };
    } catch (error: any) {
      console.error('[自动归集] 归集失败:', error);
      return {
        success: false,
        totalCollected: 0,
        results: [],
      };
    }
  }

  private async executeCollection(collection: any): Promise<{
    success: boolean;
    amount: number;
    error?: string;
  }> {
    try {
      const fromAccount = await this.accountRepo.findOne({ where: { accountNo: collection.fromAccountNo } });
      const toAccount = await this.accountRepo.findOne({ where: { accountNo: collection.toAccountNo } });

      if (!fromAccount || !toAccount) {
        return { success: false, amount: 0, error: '账户不存在' };
      }

      if (fromAccount.availableBalance <= 0) {
        return { success: false, amount: 0, error: '余额为0' };
      }

      let collectAmount = 0;

      switch (collection.collectionType) {
        case 1: // 全额归集
          collectAmount = fromAccount.availableBalance;
          break;
        case 2: // 定额归集
          collectAmount = collection.collectionAmount || 0;
          break;
        case 3: // 保留余额归集
          collectAmount = fromAccount.availableBalance - (collection.reservedAmount || 0);
          break;
        default:
          return { success: false, amount: 0, error: '未知的归集类型' };
      }

      if (collectAmount <= 0) {
        return { success: false, amount: 0, error: '归集金额<=0' };
      }

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

      // 记录流水
      await this.recordRepo.save({
        id: uuidv4(),
        recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
        accountNo: fromAccount.accountNo,
        accountName: fromAccount.accountName,
        bizType: 5,
        bizTypeName: '自动资金归集',
        amount: -collectAmount,
        balanceBefore: beforeBalance,
        balanceAfter: fromAccount.availableBalance,
        orderNo: collection.collectionNo,
        oppositeAccountNo: toAccount.accountNo,
        oppositeAccountName: toAccount.accountName,
        createTime: new Date(),
      });

      await this.recordRepo.save({
        id: uuidv4(),
        recordNo: 'REC' + Date.now() + Math.random().toString(36).substr(2, 7).toUpperCase(),
        accountNo: toAccount.accountNo,
        accountName: toAccount.accountName,
        bizType: 5,
        bizTypeName: '自动资金归集',
        amount: collectAmount,
        balanceBefore: toAccount.availableBalance - collectAmount,
        balanceAfter: toAccount.availableBalance,
        orderNo: collection.collectionNo,
        oppositeAccountNo: fromAccount.accountNo,
        oppositeAccountName: fromAccount.accountName,
        createTime: new Date(),
      });

      return { success: true, amount: collectAmount };
    } catch (error: any) {
      return { success: false, amount: 0, error: error.message };
    }
  }

  /**
   * ========== 辅助方法 ==========
   */

  private isInSettleTimeWindow(): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const config = this.autoSettlementConfig;

    const [startHour, startMin] = config.settleTimeStart.split(':').map(Number);
    const [endHour, endMin] = config.settleTimeEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * 更新自动对账配置
   */
  updateCheckConfig(config: Partial<AutoCheckConfig>): void {
    this.autoCheckConfig = { ...this.autoCheckConfig, ...config };
    console.log('[自动对账] 配置已更新:', this.autoCheckConfig);
  }

  /**
   * 更新自动结算配置
   */
  updateSettlementConfig(config: Partial<AutoSettlementConfig>): void {
    this.autoSettlementConfig = { ...this.autoSettlementConfig, ...config };
    console.log('[自动结算] 配置已更新:', this.autoSettlementConfig);
  }

  /**
   * 更新自动分账配置
   */
  updateProfitShareConfig(config: Partial<AutoProfitShareConfig>): void {
    this.autoProfitShareConfig = { ...this.autoProfitShareConfig, ...config };
    console.log('[自动分账] 配置已更新:', this.autoProfitShareConfig);
  }

  /**
   * 更新自动归集配置
   */
  updateCollectionConfig(config: Partial<AutoCollectionConfig>): void {
    this.autoCollectionConfig = { ...this.autoCollectionConfig, ...config };
    console.log('[自动归集] 配置已更新:', this.autoCollectionConfig);
  }

  /**
   * 获取当前配置
   */
  getConfigs() {
    return {
      checkConfig: this.autoCheckConfig,
      settlementConfig: this.autoSettlementConfig,
      profitShareConfig: this.autoProfitShareConfig,
      collectionConfig: this.autoCollectionConfig,
    };
  }
}

export default new CiticAutoService();
