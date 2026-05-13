/**
 * DGKJ 支付平台 - 分润计算服务
 * 
 * 自动计算并执行交易分润
 */

import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/data-source';
import { 
  ProfitAccountGroup, 
  ProfitReceiver, 
  ProfitRecord, 
  ProfitRollback,
} from '../../database/entities/profit.entity';
import { PayOrder, OrderStatus } from '../../database/entities/trade.entity';
import { MchRate } from '../../database/entities/mch.entity';
import { AgentInfo, AgentProfit } from '../../database/entities/agent.entity';
import { AccountInfo } from '../../database/entities/finance.entity';
import citicService from '../citic/citic-bank.service';
import { OpCode, opResult } from '../../utils/op-code';

// 分润状态枚举
enum ProfitStatus {
  PENDING = 0,
  CALCULATED = 1,
  SUCCESS = 2,
  FAILED = 3,
  ROLLED_BACK = 4,
}

// 接收方类型
enum ReceiverType {
  PLATFORM = 1,
  AGENT = 2,
  MCH = 3,
  MERCHANT = 4,
}

export class ProfitService {
  private groupRepo = AppDataSource.getRepository(ProfitAccountGroup);
  private receiverRepo = AppDataSource.getRepository(ProfitReceiver);
  private recordRepo = AppDataSource.getRepository(ProfitRecord);
  private rollbackRepo = AppDataSource.getRepository(ProfitRollback);
  private orderRepo = AppDataSource.getRepository(PayOrder);
  private rateRepo = AppDataSource.getRepository(MchRate);
  private agentRepo = AppDataSource.getRepository(AgentInfo);
  private agentProfitRepo = AppDataSource.getRepository(AgentProfit);
  private accountRepo = AppDataSource.getRepository(AccountInfo);

  /**
   * 计算订单分润
   */
  async calculateProfit(orderNo: string): Promise<any> {
    const order = await this.orderRepo.findOne({ where: { orderNo } });
    if (!order) {
      return opResult(OpCode.BIZ_ORDER_NOT_FOUND, null, '订单不存在');
    }

    if (order.status !== OrderStatus.SUCCESS) {
      return opResult(OpCode.BIZ_ORDER_STATUS_ERROR, null, '订单未支付成功');
    }

    // 获取商户分润分组
    const group = await this.groupRepo.findOne({ 
      where: { mchNo: order.mchNo, status: 1 },
    });

    if (!group) {
      // 没有配置分润分组，使用默认分润
      return await this.defaultProfit(order);
    }

    // 获取分润接收方列表
    const receivers = await this.receiverRepo.find({ 
      where: { groupNo: group.groupNo, status: 1 },
      order: { profitRatio: 'DESC' },
    });

    if (receivers.length === 0) {
      return await this.defaultProfit(order);
    }

    // 获取商户费率
    const rate = await this.rateRepo.findOne({ 
      where: { mchNo: order.mchNo, payWay: order.payType } 
    });
    const feeRate = rate ? parseFloat(rate.rate.toString()) : 0.006;
    const totalFee = order.fee;

    // 计算分润
    const profitDetails: any[] = [];
    let remainingFee = totalFee;

    for (const receiver of receivers) {
      if (remainingFee <= 0) break;

      let shareAmount = 0;

      // 使用 profitRatio (比例) 或 fixedAmount (固定金额)
      if (receiver.profitRatio > 0) {
        // 比例分润
        shareAmount = Math.floor(remainingFee * receiver.profitRatio);
      } else if (receiver.fixedAmount > 0) {
        // 固定金额分润
        shareAmount = Number(receiver.fixedAmount);
      }

      // 确保不超过剩余金额
      shareAmount = Math.min(shareAmount, remainingFee);

      if (shareAmount > 0) {
        // 创建分润记录
        const record = this.recordRepo.create({
          id: uuidv4(),
          profitNo: `PR${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          orderNo: order.orderNo,
          mchNo: order.mchNo,
          channelCode: order.channelCode,
          tradeAmount: order.amount,
          profitAmount: shareAmount,
          profitType: receiver.receiverType,
          status: ProfitStatus.PENDING,
          createTime: new Date(),
        });
        await this.recordRepo.save(record);

        profitDetails.push({
          receiverNo: receiver.receiverNo,
          receiverName: receiver.receiverName,
          receiverType: receiver.receiverType,
          profitAmount: shareAmount,
        });

        remainingFee -= shareAmount;
      }
    }

    // 如果有剩余未分配金额，返还给商户
    if (remainingFee > 0) {
      const mchRecord = this.recordRepo.create({
        id: uuidv4(),
        profitNo: `PR${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        orderNo: order.orderNo,
        mchNo: order.mchNo,
        channelCode: order.channelCode,
        tradeAmount: order.amount,
        profitAmount: remainingFee,
        profitType: ReceiverType.MCH,
        status: ProfitStatus.PENDING,
        createTime: new Date(),
      });
      await this.recordRepo.save(mchRecord);
    }

    // 更新分润状态为计算完成
    await this.recordRepo.update(
      { orderNo },
      { status: ProfitStatus.CALCULATED }
    );

    return opResult(OpCode.SUCCESS, {
      orderNo,
      tradeAmount: order.amount,
      totalFee,
      profitDetails,
      remainingFee,
    });
  }

  /**
   * 执行分润 (实际转账)
   */
  async executeProfit(orderNo: string): Promise<any> {
    const records = await this.recordRepo.find({ 
      where: { orderNo, status: ProfitStatus.CALCULATED } 
    });

    if (records.length === 0) {
      return opResult(OpCode.SYS_ERROR, null, '没有待执行的分润记录');
    }

    const results: any[] = [];

    for (const record of records) {
      try {
        // 调用中信银行执行分润
        const citicResult = await citicService.executeProfitShare({
          orderNo: record.orderNo,
          accountNo: process.env.CITIC_PLATFORM_ACCOUNT || '',
          receiverAccountNo: '', // 需要根据 receiverType 获取
          shareType: 2, // 金额分润
          shareAmount: record.profitAmount,
          shareRemark: `订单分润 - ${record.orderNo}`,
        });

        if (citicResult.code === 0) {
          // 更新分润记录
          await this.recordRepo.update(record.id, {
            status: ProfitStatus.SUCCESS,
            settleTime: new Date(),
            remark: citicResult.data?.shareNo,
            updateTime: new Date(),
          });

          results.push({
            profitNo: record.profitNo,
            profitAmount: record.profitAmount,
            status: 'success',
          });
        } else {
          await this.recordRepo.update(record.id, {
            status: ProfitStatus.FAILED,
            remark: citicResult.message,
            updateTime: new Date(),
          });

          results.push({
            profitNo: record.profitNo,
            profitAmount: record.profitAmount,
            status: 'failed',
            errorMsg: citicResult.message,
          });
        }
      } catch (error: any) {
        await this.recordRepo.update(record.id, {
          status: ProfitStatus.FAILED,
          remark: error.message,
          updateTime: new Date(),
        });

        results.push({
          profitNo: record.profitNo,
          profitAmount: record.profitAmount,
          status: 'failed',
          errorMsg: error.message,
        });
      }
    }

    return opResult(OpCode.SUCCESS, {
      orderNo,
      totalRecords: records.length,
      results,
    });
  }

  /**
   * 默认分润 (无配置时)
   */
  private async defaultProfit(order: PayOrder): Promise<any> {
    // 获取商户费率
    const rate = await this.rateRepo.findOne({ 
      where: { mchNo: order.mchNo, payWay: order.payType } 
    });
    const feeRate = rate ? parseFloat(rate.rate.toString()) : 0.006;
    const totalFee = order.fee;

    // 默认：平台收取全部手续费
    const platformFee = totalFee;

    // 创建平台分润记录
    const record = this.recordRepo.create({
      id: uuidv4(),
      profitNo: `PR${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      orderNo: order.orderNo,
      mchNo: order.mchNo,
      channelCode: order.channelCode,
      tradeAmount: order.amount,
      profitAmount: platformFee,
      profitType: ReceiverType.PLATFORM,
      status: ProfitStatus.SUCCESS,
      settleTime: new Date(),
      createTime: new Date(),
    });
    await this.recordRepo.save(record);

    return opResult(OpCode.SUCCESS, {
      orderNo: order.orderNo,
      tradeAmount: order.amount,
      totalFee,
      profitDetails: [{
        receiverType: ReceiverType.PLATFORM,
        profitAmount: platformFee,
      }],
      remainingFee: 0,
    });
  }

  /**
   * 回滚分润
   */
  async rollbackProfit(profitNo: string, reason: string): Promise<any> {
    const record = await this.recordRepo.findOne({ where: { profitNo } });
    if (!record) {
      return opResult(OpCode.SYS_ERROR, null, '分润记录不存在');
    }

    if (record.status !== ProfitStatus.SUCCESS) {
      return opResult(OpCode.SYS_ERROR, null, '分润记录状态不允许回滚');
    }

    // 创建回滚记录
    const rollback = this.rollbackRepo.create({
      id: uuidv4(),
      rollbackNo: `RB${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      profitNo: record.profitNo,
      orderNo: record.orderNo,
      mchNo: record.mchNo,
      receiverNo: '', // 需要根据 profitType 获取
      receiverName: '',
      amount: record.profitAmount,
      rollbackType: record.profitType,
      reason,
      status: 1,
      createTime: new Date(),
    });
    await this.rollbackRepo.save(rollback);

    // 执行回滚 (从接收方账户扣回)
    try {
      const citicResult = await citicService.executeProfitShare({
        orderNo: rollback.rollbackNo,
        accountNo: '', // 需要根据 receiverNo 获取
        receiverAccountNo: process.env.CITIC_PLATFORM_ACCOUNT || '',
        shareType: 2,
        shareAmount: record.profitAmount,
        shareRemark: `分润回滚 - ${reason}`,
      });

      if (citicResult.code === 0) {
        await this.rollbackRepo.update(rollback.id, {
          status: 2, // 回滚成功
          completeTime: new Date(),
          updateTime: new Date(),
        });

        await this.recordRepo.update(record.id, {
          status: ProfitStatus.ROLLED_BACK,
          updateTime: new Date(),
        });

        return opResult(OpCode.SUCCESS, {
          rollbackNo: rollback.rollbackNo,
          profitNo,
          rollbackAmount: record.profitAmount,
          status: 'success',
        });
      } else {
        await this.rollbackRepo.update(rollback.id, {
          status: 3, // 回滚失败
          remark: citicResult.message,
          updateTime: new Date(),
        });

        return opResult(OpCode.SYS_ERROR, null, citicResult.message);
      }
    } catch (error: any) {
      await this.rollbackRepo.update(rollback.id, {
        status: 3,
        remark: error.message,
        updateTime: new Date(),
      });

      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  /**
   * 获取分润记录列表
   */
  async getProfitRecords(params: {
    page?: number;
    pageSize?: number;
    mchNo?: string;
    orderNo?: string;
    status?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<any> {
    const { page = 1, pageSize = 20, mchNo, orderNo, status, startTime, endTime } = params;

    const query = this.recordRepo.createQueryBuilder('record')
      .where('1=1');

    if (mchNo) {
      query.andWhere('record.mchNo = :mchNo', { mchNo });
    }
    if (orderNo) {
      query.andWhere('record.orderNo = :orderNo', { orderNo });
    }
    if (status !== undefined) {
      query.andWhere('record.status = :status', { status });
    }
    if (startTime) {
      query.andWhere('record.createTime >= :startTime', { startTime });
    }
    if (endTime) {
      query.andWhere('record.createTime <= :endTime', { endTime });
    }

    const [list, total] = await query
      .orderBy('record.createTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list: list.map(r => ({
        profitNo: r.profitNo,
        orderNo: r.orderNo,
        mchNo: r.mchNo,
        channelCode: r.channelCode,
        tradeAmount: r.tradeAmount,
        profitAmount: r.profitAmount,
        profitType: r.profitType,
        status: r.status,
        settleTime: r.settleTime,
        createTime: r.createTime,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取回滚记录列表
   */
  async getRollbackRecords(params: {
    page?: number;
    pageSize?: number;
    mchNo?: string;
    orderNo?: string;
    status?: number;
  }): Promise<any> {
    const { page = 1, pageSize = 20, mchNo, orderNo, status } = params;

    const query = this.rollbackRepo.createQueryBuilder('rollback')
      .where('1=1');

    if (mchNo) {
      query.andWhere('rollback.mchNo = :mchNo', { mchNo });
    }
    if (orderNo) {
      query.andWhere('rollback.orderNo = :orderNo', { orderNo });
    }
    if (status !== undefined) {
      query.andWhere('rollback.status = :status', { status });
    }

    const [list, total] = await query
      .orderBy('rollback.createTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list: list.map(r => ({
        rollbackNo: r.rollbackNo,
        profitNo: r.profitNo,
        orderNo: r.orderNo,
        mchNo: r.mchNo,
        receiverName: r.receiverName,
        amount: r.amount,
        rollbackType: r.rollbackType,
        reason: r.reason,
        status: r.status,
        completeTime: r.completeTime,
        createTime: r.createTime,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 创建分润分组
   */
  async createAccountGroup(params: {
    groupName: string;
    mchNo: string;
    receivers: Array<{
      receiverName: string;
      receiverType: number;
      receiverAccount: string;
      profitRatio?: number;
      fixedAmount?: number;
      priority?: number;
    }>;
  }): Promise<any> {
    // 创建分组
    const group = this.groupRepo.create({
      id: uuidv4(),
      groupNo: `G${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      groupName: params.groupName,
      mchNo: params.mchNo,
      status: 1,
      createTime: new Date(),
      updateTime: new Date(),
    });
    await this.groupRepo.save(group);

    // 创建接收方
    for (const receiver of params.receivers) {
      const entity = this.receiverRepo.create({
        id: uuidv4(),
        receiverNo: `R${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        groupNo: group.groupNo,
        receiverName: receiver.receiverName,
        receiverType: receiver.receiverType,
        receiverAccount: receiver.receiverAccount,
        profitRatio: receiver.profitRatio || 0,
        fixedAmount: receiver.fixedAmount || 0,
        priority: receiver.priority || 0,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await this.receiverRepo.save(entity);
    }

    return opResult(OpCode.SUCCESS, {
      groupId: group.id,
      groupName: params.groupName,
    });
  }

  /**
   * 获取分润分组详情
   */
  async getAccountGroup(mchNo: string): Promise<any> {
    const group = await this.groupRepo.findOne({ 
      where: { mchNo, status: 1 },
    });

    if (!group) {
      return opResult(OpCode.SYS_ERROR, null, '分润分组不存在');
    }

    const receivers = await this.receiverRepo.find({
      where: { groupNo: group.groupNo, status: 1 },
      order: { priority: 'ASC' },
    });

    return opResult(OpCode.SUCCESS, {
      groupId: group.id,
      groupNo: group.groupNo,
      groupName: group.groupName,
      mchNo: group.mchNo,
      receivers: receivers.map(r => ({
        id: r.id,
        receiverNo: r.receiverNo,
        receiverName: r.receiverName,
        receiverType: r.receiverType,
        receiverAccount: r.receiverAccount,
        profitRatio: r.profitRatio,
        fixedAmount: r.fixedAmount,
        priority: r.priority,
      })),
    });
  }
}

export default new ProfitService();
