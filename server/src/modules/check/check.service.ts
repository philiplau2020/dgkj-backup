/**
 * DGKJ 支付平台 - 对账自动化服务
 * 
 * 自动对账、差错处理
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import dayjs from 'dayjs';
import { AppDataSource } from '../../config/data-source';
import { 
  CheckBatch, 
  CheckChannelBill, 
  CheckDiffBill,
  CheckBatchStatus,
} from '../../database/entities/check.entity';
import { PayOrder, RefundOrder } from '../../database/entities/trade.entity';
import { ChannelManager, ChannelCode } from '../pay/channel/interface';
import channelWechat from '../pay/channel/wechat';
import channelAlipay from '../pay/channel/alipay';
import { OpCode, opResult } from '../../utils/op-code';

// 初始化通道管理器
const channelManager = ChannelManager.getInstance();
channelManager.register(channelWechat);
channelManager.register(channelAlipay);

export class CheckService {
  private batchRepo = AppDataSource.getRepository(CheckBatch);
  private channelBillRepo = AppDataSource.getRepository(CheckChannelBill);
  private diffRepo = AppDataSource.getRepository(CheckDiffBill);
  private orderRepo = AppDataSource.getRepository(PayOrder);
  private refundRepo = AppDataSource.getRepository(RefundOrder);

  /**
   * 创建对账批次
   */
  async createBatch(params: {
    checkDate: string;     // 格式: YYYYMMDD
    channelCode?: string;
  }): Promise<any> {
    const { checkDate, channelCode } = params;

    // 检查是否已存在对账批次
    const existing = await this.batchRepo.findOne({ where: { checkDate, channelCode: channelCode || '' } });
    if (existing) {
      return opResult(OpCode.SYS_ERROR, null, '对账批次已存在');
    }

    // 创建批次
    const batch = this.batchRepo.create({
      id: uuidv4(),
      batchNo: `CHK${checkDate}${channelCode || 'ALL'}${Date.now().toString(36).toUpperCase()}`,
      checkDate,
      channelCode: channelCode || '',
      channelName: channelCode ? this.getChannelName(channelCode) : '全部通道',
      platformOrderCount: 0,
      platformTotalAmount: 0,
      channelOrderCount: 0,
      channelTotalAmount: 0,
      diffOrderCount: 0,
      diffAmount: 0,
      status: CheckBatchStatus.PROCESSING,
      createTime: new Date(),
      updateTime: new Date(),
    });
    await this.batchRepo.save(batch);

    return opResult(OpCode.SUCCESS, {
      batchNo: batch.batchNo,
      checkDate,
      channelCode,
      status: 'processing',
    });
  }

  /**
   * 执行对账
   */
  async executeCheck(batchNo: string): Promise<any> {
    const batch = await this.batchRepo.findOne({ where: { batchNo } });
    if (!batch) {
      return opResult(OpCode.SYS_ERROR, null, '对账批次不存在');
    }

    if (batch.status !== CheckBatchStatus.PROCESSING) {
      return opResult(OpCode.SYS_ERROR, null, '对账批次状态不允许执行');
    }

    try {
      // 1. 查询平台订单
      const startDate = dayjs(batch.checkDate).startOf('day').toDate();
      const endDate = dayjs(batch.checkDate).endOf('day').toDate();

      const platformOrders = await this.orderRepo.createQueryBuilder('order')
        .where('order.createTime >= :startDate', { startDate })
        .andWhere('order.createTime <= :endDate', { endDate })
        .andWhere('order.status IN (:...statuses)', { statuses: ['SUCCESS', 'REFUNDED'] })
        .andWhere(batch.channelCode ? 'order.channelCode = :channelCode' : '1=1', 
          batch.channelCode ? { channelCode: batch.channelCode } : {})
        .getMany();

      const platformRefunds = await this.refundRepo.createQueryBuilder('refund')
        .where('refund.createTime >= :startDate', { startDate })
        .andWhere('refund.createTime <= :endDate', { endDate })
        .andWhere('refund.status IN (:...statuses)', { statuses: [1, 2] }) // SUCCESS, FAILED
        .getMany();

      // 2. 获取通道对账单
      const channelBills = await this.downloadChannelBill(batch);

      // 3. 对账比对
      const diffs = await this.compareBills(batch, platformOrders, platformRefunds, channelBills);

      // 4. 更新批次状态
      batch.platformOrderCount = platformOrders.length + platformRefunds.length;
      batch.platformTotalAmount = platformOrders.reduce((sum, o) => sum + o.amount, 0);
      batch.channelOrderCount = channelBills.length;
      batch.channelTotalAmount = channelBills.reduce((sum, b) => sum + b.amount, 0);
      batch.diffOrderCount = diffs.length;
      batch.diffAmount = diffs.reduce((sum, d) => sum + d.diffAmount, 0);
      batch.status = diffs.length > 0 ? CheckBatchStatus.DIFF_FOUND : CheckBatchStatus.SUCCESS;
      batch.completeTime = new Date();
      batch.updateTime = new Date();
      await this.batchRepo.save(batch);

      return opResult(OpCode.SUCCESS, {
        batchNo,
        checkDate: batch.checkDate,
        platformOrderCount: batch.platformOrderCount,
        platformTotalAmount: batch.platformTotalAmount,
        channelOrderCount: batch.channelOrderCount,
        channelTotalAmount: batch.channelTotalAmount,
        diffOrderCount: batch.diffOrderCount,
        diffAmount: batch.diffAmount,
        status: batch.status,
      });
    } catch (error: any) {
      batch.status = CheckBatchStatus.FAILED;
      batch.remark = error.message;
      batch.updateTime = new Date();
      await this.batchRepo.save(batch);

      return opResult(OpCode.SYS_ERROR, null, error.message);
    }
  }

  /**
   * 下载通道对账单
   */
  private async downloadChannelBill(batch: CheckBatch): Promise<any[]> {
    const bills: any[] = [];

    // 如果指定了通道，只对账该通道
    const channels = batch.channelCode ? [batch.channelCode] : [
      ChannelCode.WECHAT,
      ChannelCode.ALIPAY,
    ];

    for (const channelCode of channels) {
      try {
        const channel = channelManager.get(channelCode);
        if (!channel) continue;

        // 模拟从通道获取对账单 (实际应该调用通道 API)
        // 这里使用模拟数据
        const channelBills = await this.fetchChannelBill(channelCode, batch.checkDate);
        bills.push(...channelBills);
      } catch (error) {
        console.error(`获取通道 ${channelCode} 对账单失败:`, error);
      }
    }

    return bills;
  }

  /**
   * 获取通道对账单 (模拟)
   */
  private async fetchChannelBill(channelCode: string, checkDate: string): Promise<any[]> {
    // 实际实现中，应该调用各通道的下载对账单 API
    // 这里返回空数组，实际使用时需要实现
    
    // 模拟：根据通道获取订单数据
    const startDate = dayjs(checkDate).startOf('day').toDate();
    const endDate = dayjs(checkDate).endOf('day').toDate();

    const orders = await this.orderRepo.createQueryBuilder('order')
      .where('order.createTime >= :startDate', { startDate })
      .andWhere('order.createTime <= :endDate', { endDate })
      .andWhere('order.channelCode = :channelCode', { channelCode })
      .andWhere('order.status = :status', { status: 'SUCCESS' })
      .getMany();

    return orders.map(order => ({
      channelOrderNo: order.channelOrderNo,
      orderNo: order.orderNo,
      amount: order.amount,
      fee: order.fee,
      status: 'SUCCESS',
    }));
  }

  /**
   * 比对账单
   */
  private async compareBills(
    batch: CheckBatch,
    platformOrders: PayOrder[],
    platformRefunds: RefundOrder[],
    channelBills: any[]
  ): Promise<any[]> {
    const diffs: any[] = [];

    // 创建通道账单索引
    const channelBillMap = new Map<string, any>();
    for (const bill of channelBills) {
      channelBillMap.set(bill.orderNo, bill);
    }

    // 创建平台订单索引
    const platformOrderMap = new Map<string, any>();
    for (const order of platformOrders) {
      platformOrderMap.set(order.orderNo, order);
    }

    // 1. 检查平台有、通道没有的订单
    for (const order of platformOrders) {
      const channelBill = channelBillMap.get(order.orderNo);
      if (!channelBill) {
        // 平台有，通道没有
        diffs.push({
          id: uuidv4(),
          batchNo: batch.batchNo,
          orderNo: order.orderNo,
          channelOrderNo: order.channelOrderNo,
          diffType: 1, // 平台多
          platformAmount: order.amount,
          channelAmount: 0,
          diffAmount: order.amount,
          platformStatus: order.status,
          channelStatus: '',
          remark: '通道无此订单',
          createTime: new Date(),
          updateTime: new Date(),
        });
      } else if (channelBill.amount !== order.amount) {
        // 金额不一致
        diffs.push({
          id: uuidv4(),
          batchNo: batch.batchNo,
          orderNo: order.orderNo,
          channelOrderNo: order.channelOrderNo,
          diffType: 3, // 金额差异
          platformAmount: order.amount,
          channelAmount: channelBill.amount,
          diffAmount: Math.abs(order.amount - channelBill.amount),
          platformStatus: order.status,
          channelStatus: channelBill.status,
          remark: '金额不一致',
          createTime: new Date(),
          updateTime: new Date(),
        });
      }
    }

    // 2. 检查通道有、平台没有的订单
    for (const bill of channelBills) {
      const platformOrder = platformOrderMap.get(bill.orderNo);
      if (!platformOrder) {
        diffs.push({
          id: uuidv4(),
          batchNo: batch.batchNo,
          orderNo: bill.orderNo,
          channelOrderNo: bill.channelOrderNo,
          diffType: 2, // 通道多
          platformAmount: 0,
          channelAmount: bill.amount,
          diffAmount: bill.amount,
          platformStatus: '',
          channelStatus: bill.status,
          remark: '平台无此订单',
          createTime: new Date(),
          updateTime: new Date(),
        });
      }
    }

    // 保存差异记录
    if (diffs.length > 0) {
      for (const diff of diffs) {
        const entity = this.diffRepo.create(diff);
        await this.diffRepo.save(entity);
      }
    }

    return diffs;
  }

  /**
   * 获取对账批次列表
   */
  async getBatchList(params: {
    page?: number;
    pageSize?: number;
    checkDate?: string;
    channelCode?: string;
    status?: number;
  }): Promise<any> {
    const { page = 1, pageSize = 20, checkDate, channelCode, status } = params;

    const query = this.batchRepo.createQueryBuilder('batch')
      .where('1=1');

    if (checkDate) {
      query.andWhere('batch.checkDate = :checkDate', { checkDate });
    }
    if (channelCode) {
      query.andWhere('batch.channelCode = :channelCode', { channelCode });
    }
    if (status !== undefined) {
      query.andWhere('batch.status = :status', { status });
    }

    const [list, total] = await query
      .orderBy('batch.checkDate', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list: list.map(b => ({
        batchNo: b.batchNo,
        checkDate: b.checkDate,
        channelCode: b.channelCode,
        channelName: b.channelName,
        platformOrderCount: b.platformOrderCount,
        platformTotalAmount: b.platformTotalAmount,
        channelOrderCount: b.channelOrderCount,
        channelTotalAmount: b.channelTotalAmount,
        diffOrderCount: b.diffOrderCount,
        diffAmount: b.diffAmount,
        status: b.status,
        completeTime: b.completeTime,
        createTime: b.createTime,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取对账差异列表
   */
  async getDiffList(params: {
    page?: number;
    pageSize?: number;
    batchNo?: string;
    diffType?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<any> {
    const { page = 1, pageSize = 20, batchNo, diffType, startTime, endTime } = params;

    const query = this.diffRepo.createQueryBuilder('diff')
      .where('1=1');

    if (batchNo) {
      query.andWhere('diff.batchNo = :batchNo', { batchNo });
    }
    if (diffType !== undefined) {
      query.andWhere('diff.diffType = :diffType', { diffType });
    }
    if (startTime) {
      query.andWhere('diff.createTime >= :startTime', { startTime });
    }
    if (endTime) {
      query.andWhere('diff.createTime <= :endTime', { endTime });
    }

    const [list, total] = await query
      .orderBy('diff.createTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list: list.map(d => ({
        id: d.id,
        batchNo: d.batchNo,
        orderNo: d.orderNo,
        channelOrderNo: d.channelOrderNo,
        diffType: d.diffType,
        diffTypeName: this.getDiffTypeName(d.diffType),
        platformAmount: d.platformAmount,
        channelAmount: d.channelAmount,
        diffAmount: d.diffAmount,
        platformStatus: d.platformStatus,
        channelStatus: d.channelStatus,
        handleStatus: d.handleStatus,
        handleRemark: d.handleRemark,
        createTime: d.createTime,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 处理差异
   */
  async handleDiff(params: {
    id: string;
    handleType: number;   // 1-平台补调, 2-通道补调, 3-人工处理, 4-确认无误
    handleRemark?: string;
  }): Promise<any> {
    const diff = await this.diffRepo.findOne({ where: { id: params.id } });
    if (!diff) {
      return opResult(OpCode.SYS_ERROR, null, '差异记录不存在');
    }

    diff.handleStatus = params.handleType;
    diff.handleRemark = params.handleRemark;
    diff.handleTime = new Date();
    diff.updateTime = new Date();
    await this.diffRepo.save(diff);

    return opResult(OpCode.SUCCESS, {
      id: diff.id,
      orderNo: diff.orderNo,
      handleType: params.handleType,
      handleStatus: params.handleType,
    });
  }

  /**
   * 获取通道账单列表
   */
  async getChannelBillList(params: {
    page?: number;
    pageSize?: number;
    batchNo?: string;
    channelCode?: string;
  }): Promise<any> {
    const { page = 1, pageSize = 20, batchNo, channelCode } = params;

    const query = this.channelBillRepo.createQueryBuilder('bill')
      .where('1=1');

    if (batchNo) {
      query.andWhere('bill.batchNo = :batchNo', { batchNo });
    }
    if (channelCode) {
      query.andWhere('bill.channelCode = :channelCode', { channelCode });
    }

    const [list, total] = await query
      .orderBy('bill.createTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list: list.map(b => ({
        id: b.id,
        batchNo: b.batchNo,
        channelCode: b.channelCode,
        orderNo: b.orderNo,
        channelOrderNo: b.channelOrderNo,
        amount: b.amount,
        fee: b.fee,
        status: b.status,
        createTime: b.createTime,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 自动对账任务 (每日定时执行)
   */
  async autoDailyCheck(): Promise<any> {
    const yesterday = dayjs().subtract(1, 'day').format('YYYYMMDD');

    // 创建并执行对账批次
    const result = await this.createBatch({ checkDate: yesterday });
    if (result.code !== 0) {
      return result;
    }

    const batchNo = result.data.batchNo;
    return await this.executeCheck(batchNo);
  }

  /**
   * 获取对账汇总
   */
  async getCheckSummary(params: {
    startDate: string;
    endDate: string;
  }): Promise<any> {
    const batches = await this.batchRepo.createQueryBuilder('batch')
      .where('batch.checkDate >= :startDate', { startDate: params.startDate })
      .andWhere('batch.checkDate <= :endDate', { endDate: params.endDate })
      .orderBy('batch.checkDate', 'ASC')
      .getMany();

    const totalPlatformAmount = batches.reduce((sum, b) => sum + b.platformTotalAmount, 0);
    const totalChannelAmount = batches.reduce((sum, b) => sum + b.channelTotalAmount, 0);
    const totalDiffAmount = batches.reduce((sum, b) => sum + b.diffAmount, 0);
    const successCount = batches.filter(b => b.status === CheckBatchStatus.SUCCESS).length;

    return {
      totalDays: batches.length,
      successDays: successCount,
      totalPlatformAmount,
      totalChannelAmount,
      totalDiffAmount,
      amountDiff: totalPlatformAmount - totalChannelAmount,
      daily: batches.map(b => ({
        checkDate: b.checkDate,
        channelName: b.channelName,
        platformOrderCount: b.platformOrderCount,
        platformTotalAmount: b.platformTotalAmount,
        channelOrderCount: b.channelOrderCount,
        channelTotalAmount: b.channelTotalAmount,
        diffOrderCount: b.diffOrderCount,
        diffAmount: b.diffAmount,
        status: b.status,
      })),
    };
  }

  // ==================== 私有方法 ====================

  private getChannelName(code: string): string {
    const names: Record<string, string> = {
      [ChannelCode.WECHAT]: '微信支付',
      [ChannelCode.ALIPAY]: '支付宝',
      [ChannelCode.UNIONPAY]: '银联支付',
      [ChannelCode.YSF]: '云闪付',
    };
    return names[code] || code;
  }

  private getDiffTypeName(type: number): string {
    const names: Record<number, string> = {
      1: '平台多账',
      2: '通道多账',
      3: '金额差异',
      4: '状态差异',
    };
    return names[type] || '未知';
  }
}

export default new CheckService();
