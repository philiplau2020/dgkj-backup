/**
 * DGKJ 支付平台 - 支付核心服务
 * 
 * 统一的支付服务，处理所有支付请求
 */

import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import axios from 'axios';
import { AppDataSource } from '../../config/data-source';
import { PayOrder, RefundOrder, TransferOrder, TradeNotify } from '../../database/entities';
import { MchInfo, MchApp, MchRate } from '../../database/entities/mch.entity';
import { ChannelInfo } from '../../database/entities/channel.entity';
import { ChannelManager, PayWay, ChannelCode, UnifiedCallbackData } from './channel/interface';
import wechatPay from './channel/wechat';
import alipay from './channel/alipay';
import allinpay from './channel/allinpay';
import huifu from './channel/huifu';
import { sendWebhookNotification } from './webhook.service';
import { OpCode, opResult } from '../../utils/op-code';

// 初始化通道管理器
const channelManager = ChannelManager.getInstance();
channelManager.register(wechatPay);
channelManager.register(alipay);
channelManager.register(allinpay);
channelManager.register(huifu);

/**
 * 支付服务
 */
export class PayService {
  private orderRepo = AppDataSource.getRepository(PayOrder);
  private refundRepo = AppDataSource.getRepository(RefundOrder);
  private transferRepo = AppDataSource.getRepository(TransferOrder);
  private notifyRepo = AppDataSource.getRepository(TradeNotify);
  private mchRepo = AppDataSource.getRepository(MchInfo);
  private appRepo = AppDataSource.getRepository(MchApp);
  private channelRepo = AppDataSource.getRepository(ChannelInfo);
  private rateRepo = AppDataSource.getRepository(MchRate);

  /**
   * 创建支付订单
   */
  async createOrder(params: {
    mchNo: string;
    appId: string;
    payWay: string;
    amount: number;
    subject: string;
    body?: string;
    clientIp?: string;
    attach?: string;
    notifyUrl?: string;
    returnUrl?: string;
    openId?: string;
    buyerId?: string;
  }) {
    // 1. 验证商户和应用
    const mch = await this.mchRepo.findOne({ where: { mchNo: params.mchNo } });
    if (!mch) {
      return opResult(OpCode.BIZ_MCH_NOT_EXIST, null, '商户不存在');
    }
    if (mch.status !== 1) {
      return opResult(OpCode.BIZ_MCH_STATUS_ABNORMAL, null, '商户状态异常');
    }

    const app = await this.appRepo.findOne({ where: { appId: params.appId, mchNo: params.mchNo } });
    if (!app) {
      return opResult(OpCode.BIZ_APP_NOT_EXIST, null, '应用不存在');
    }
    if (app.status !== 1) {
      return opResult(OpCode.BIZ_APP_STATUS_ABNORMAL, null, '应用状态异常');
    }

    // 2. 获取商户费率
    const rate = await this.rateRepo.findOne({ where: { mchNo: params.mchNo, payWay: params.payWay } });
    const feeRate = rate ? parseFloat(rate.rate.toString()) : 0.006; // 默认 0.6%
    const fee = Math.ceil(params.amount * feeRate);
    const minFee = rate?.minFee ? parseFloat(rate.minFee.toString()) : 0;
    const actualFee = Math.max(fee, minFee);

    // 3. 获取可用通道
    const channel = await this.selectChannel(params.payWay, params.amount);
    if (!channel) {
      return opResult(OpCode.BIZ_CHANNEL_NOT_AVAILABLE, null, '暂无可用支付通道');
    }

    // 4. 生成订单号
    const orderId = uuidv4();
    const orderNo = this.generateOrderNo();

    // 5. 创建订单记录
    const order = this.orderRepo.create({
      id: orderId,
      orderNo,
      mchNo: params.mchNo,
      mchName: mch.mchName,
      appId: params.appId,
      channelCode: channel.channelCode,
      payType: params.payWay as any,
      amount: params.amount,
      actualAmount: params.amount,
      fee: actualFee,
      subject: params.subject,
      body: params.body || params.subject,
      clientIp: params.clientIp,
      attach: params.attach,
      notifyUrl: params.notifyUrl || app.notifyUrl,
      status: 0, // PENDING
      expireTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时
      createTime: new Date(),
    });
    await this.orderRepo.save(order);

    // 6. 调用通道发起支付
    const payRequest = {
      orderNo,
      amount: params.amount,
      payWay: params.payWay as PayWay,
      subject: params.subject,
      body: params.body,
      clientIp: params.clientIp,
      notifyUrl: `${process.env.PAY_CALLBACK_URL || 'https://dghs.gddogootech.com'}/basic-api/pay/callback/${channel.channelCode}`,
      returnUrl: params.returnUrl,
      attach: params.attach,
      openId: params.openId,
      buyerId: params.buyerId,
    };

    const payResult = await channel.pay(payRequest);

    if (!payResult.success) {
      // 更新订单状态为失败
      await this.orderRepo.update(orderId, {
        status: 2 as any, // FAILED
        remark: payResult.errorMsg,
      });
      return opResult(OpCode.BIZ_PAY_CREATE_FAILED, null, payResult.errorMsg || '支付创建失败');
    }

    // 7. 更新通道订单号
    if (payResult.channelOrderNo) {
      await this.orderRepo.update(orderId, {
        channelOrderNo: payResult.channelOrderNo,
      });
    }

    // 8. 返回支付参数
    return opResult(OpCode.SUCCESS, {
      orderNo,
      amount: params.amount,
      fee: actualFee,
      payWay: params.payWay,
      status: 'pending',
      payUrl: payResult.payUrl,
      qrCode: payResult.qrCode,
      jsapiParams: payResult.jsapiParams,
      appParams: payResult.appParams,
      h5Url: payResult.h5Url,
      deeplink: payResult.deeplink,
      expireTime: order.expireTime,
    });
  }

  /**
   * 查询订单
   */
  async queryOrder(orderNo: string) {
    const order = await this.orderRepo.findOne({ where: { orderNo } });
    if (!order) {
      return opResult(OpCode.BIZ_ORDER_NOT_FOUND, null, '订单不存在');
    }

    // 如果订单已成功或失败，直接返回
    if (order.status === 1 || order.status === 2) {
      return opResult(OpCode.SUCCESS, this.formatOrder(order));
    }

    // 查询通道状态
    const channel = channelManager.get(order.channelCode);
    if (channel) {
      const queryResult = await channel.query({ orderNo: order.orderNo });
      
      if (queryResult.success && queryResult.status !== 'pending') {
        // 更新订单状态
        const statusMap: Record<string, number> = {
          'pending': 0,
          'success': 1,
          'failed': 2,
          'closed': 3,
          'refunding': 4,
          'refunded': 5,
        };
        const newStatus = statusMap[queryResult.status] ?? 0;
        await this.orderRepo.update(order.id, {
          status: newStatus,
          channelOrderNo: queryResult.channelOrderNo || order.channelOrderNo,
          payTime: queryResult.paidTime,
        });

        order.status = newStatus as any;
        order.payTime = queryResult.paidTime;
      }
    }

    return opResult(OpCode.SUCCESS, this.formatOrder(order));
  }

  /**
   * 关闭订单
   */
  async closeOrder(orderNo: string) {
    const order = await this.orderRepo.findOne({ where: { orderNo } });
    if (!order) {
      return opResult(OpCode.BIZ_ORDER_NOT_FOUND, null, '订单不存在');
    }

    if (order.status !== 0) {
      return opResult(OpCode.BIZ_ORDER_STATUS_ERROR, null, '订单状态不允许关闭');
    }

    // 调用通道关闭订单
    const channel = channelManager.get(order.channelCode);
    if (channel) {
      await channel.query({ orderNo: order.orderNo });
    }

    // 更新订单状态
    await this.orderRepo.update(order.id, {
      status: 3, // CLOSED
    });

    return opResult(OpCode.SUCCESS, { orderNo, status: 'closed' });
  }

  /**
   * 申请退款
   */
  async applyRefund(params: {
    orderNo: string;
    refundAmount: number;
    refundReason?: string;
  }) {
    const order = await this.orderRepo.findOne({ where: { orderNo: params.orderNo } });
    if (!order) {
      return opResult(OpCode.BIZ_ORDER_NOT_FOUND, null, '订单不存在');
    }

    if (order.status !== 1) {
      return opResult(OpCode.BIZ_ORDER_STATUS_ERROR, null, '订单未支付，无法退款');
    }

    if (params.refundAmount > order.amount) {
      return opResult(OpCode.BIZ_REFUND_EXCEED, null, '退款金额超过订单金额');
    }

    // 检查是否有进行中的退款
    const existingRefund = await this.refundRepo.findOne({
      where: { orderNo: params.orderNo },
    });
    if (existingRefund && existingRefund.status === 0) {
      return opResult(OpCode.BIZ_REFUND_EXISTS, null, '存在进行中的退款申请');
    }

    // 生成退款单号
    const refundId = uuidv4();
    const refundNo = this.generateRefundNo();

    // 创建退款记录
    const refund = this.refundRepo.create({
      id: refundId,
      refundNo,
      orderNo: params.orderNo,
      mchNo: order.mchNo,
      appId: order.appId,
      channelCode: order.channelCode,
      payType: order.payType,
      amount: order.amount,
      refundAmount: params.refundAmount,
      refundReason: params.refundReason,
      status: 0, // PENDING
      createTime: new Date(),
      updateTime: new Date(),
    });
    await this.refundRepo.save(refund);

    // 更新原订单状态
    await this.orderRepo.update(order.id, {
      status: 4, // REFUNDING
    });

    // 调用通道退款
    const channel = channelManager.get(order.channelCode);
    if (channel) {
      const refundResult = await channel.refund({
        refundNo,
        orderNo: order.orderNo,
        channelOrderNo: order.channelOrderNo || undefined,
        refundAmount: params.refundAmount,
        reason: params.refundReason,
      });

      if (refundResult.success) {
        await this.refundRepo.update(refundId, {
          status: 1 as any, // SUCCESS
          channelRefundNo: refundResult.channelRefundNo,
          refundTime: refundResult.refundTime,
        });
      } else {
        await this.refundRepo.update(refundId, {
          status: 2 as any, // FAILED
          remark: refundResult.errorMsg,
        });
      }
    }

    // 发送商户通知
    if (order.notifyUrl) {
      await this.sendMchNotify(order, 'refund');
    }

    return opResult(OpCode.SUCCESS, {
      refundNo,
      orderNo: params.orderNo,
      refundAmount: params.refundAmount,
      status: 'pending',
    });
  }

  /**
   * 支付回调处理
   */
  async handleCallback(channelCode: string, data: any) {
    const channel = channelManager.get(channelCode);
    if (!channel) {
      return { success: false, message: '通道不存在' };
    }

    // 1. 验证签名
    const verifyResult = await channel.verifyCallback(data, {});
    if (!verifyResult.success) {
      return { success: false, message: verifyResult.errorMsg };
    }

    // 2. 解析回调数据
    const callbackData = await channel.parseCallback(data);

    // 3. 更新订单状态
    if (callbackData.notifyType === 'pay') {
      await this.handlePayCallback(callbackData);
    } else if (callbackData.notifyType === 'refund') {
      await this.handleRefundCallback(callbackData);
    }

    return { success: true, message: '处理成功' };
  }

  /**
   * 处理支付回调
   */
  private async handlePayCallback(data: UnifiedCallbackData) {
    const order = await this.orderRepo.findOne({ where: { orderNo: data.orderNo } });
    if (!order) return;

    if (data.status === 'success') {
      // 更新订单为成功
      await this.orderRepo.update(order.id, {
        status: 1, // SUCCESS
        channelOrderNo: data.channelOrderNo,
        payTime: data.paidTime || new Date(),
        actualAmount: data.paidAmount || order.amount,
      });

      // 计算分润 (待实现)
      // await this.calculateProfit(order);

      // 发送商户通知
      await this.sendMchNotify(order, 'pay');
    } else if (data.status === 'failed' || data.status === 'closed') {
      const failStatus = data.status === 'failed' ? 2 : 3;
      await this.orderRepo.update(order.id, {
        status: failStatus,
      });
    }
  }

  /**
   * 处理退款回调
   */
  private async handleRefundCallback(data: UnifiedCallbackData) {
    const refund = await this.refundRepo.findOne({ where: { refundNo: data.orderNo } });
    if (!refund) return;

    if (data.status === 'success') {
      await this.refundRepo.update(refund.id, {
        status: 1, // SUCCESS
        channelRefundNo: data.channelOrderNo,
        refundTime: data.paidTime || new Date(),
      });

      // 更新原订单状态
      const order = await this.orderRepo.findOne({ where: { orderNo: refund.orderNo } });
      if (order) {
        await this.orderRepo.update(order.id, {
          status: 5, // REFUNDED
        });
      }
    }
  }

  /**
   * 发送商户通知
   */
  private async sendMchNotify(order: PayOrder, type: 'pay' | 'refund') {
    if (!order.notifyUrl) return;

    const notifyData = {
      type,
      orderNo: order.orderNo,
      mchNo: order.mchNo,
      amount: order.amount,
      status: order.status === 1 ? 'paid' : 'refunded',
      paidTime: order.payTime ? String(order.payTime) : undefined,
      attach: order.attach,
    };

    // 发送 webhook
    await sendWebhookNotification(order.notifyUrl, notifyData);

    // 记录通知日志
    const notify = this.notifyRepo.create({
      id: uuidv4(),
      notifyId: uuidv4(),
      orderNo: order.orderNo,
      mchNo: order.mchNo,
      appId: order.appId,
      notifyUrl: order.notifyUrl,
      notifyType: type === 'pay' ? 1 : 2,
      status: 0,
      createTime: new Date(),
    });
    await this.notifyRepo.save(notify);
  }

  /**
   * 选择支付通道
   */
  private async selectChannel(payWay: string, amount: number): Promise<any> {
    // 根据支付方式选择通道
    const channelMap: Record<string, string> = {
      wx_native: ChannelCode.WECHAT,
      wx_jsapi: ChannelCode.WECHAT,
      wx_app: ChannelCode.WECHAT,
      wx_h5: ChannelCode.WECHAT,
      wx_lite: ChannelCode.WECHAT,
      ali_qr: ChannelCode.ALIPAY,
      ali_jsapi: ChannelCode.ALIPAY,
      ali_app: ChannelCode.ALIPAY,
      ali_wap: ChannelCode.ALIPAY,
      // 通联支付
      allinpay_wx_qr: ChannelCode.ALLINPAY,
      allinpay_ali_qr: ChannelCode.ALLINPAY,
      allinpay_ysf_qr: ChannelCode.ALLINPAY,
      allinpay_wx_jsapi: ChannelCode.ALLINPAY,
      allinpay_ali_jsapi: ChannelCode.ALLINPAY,
      allinpay_ysf_jsapi: ChannelCode.ALLINPAY,
      allinpay_wx_app: ChannelCode.ALLINPAY,
      allinpay_ali_app: ChannelCode.ALLINPAY,
      allinpay_union_app: ChannelCode.ALLINPAY,
      // 汇付斗拱
      huifu_quick: ChannelCode.HUIFU,
      huifu_page: ChannelCode.HUIFU,
    };

    const channelCode = channelMap[payWay];
    if (!channelCode) return null;

    const channel = channelManager.get(channelCode);
    if (!channel) return null;

    // TODO: 从数据库获取通道配置并初始化
    // 目前返回默认通道
    return channel;
  }

  /**
   * 生成订单号
   */
  private generateOrderNo(): string {
    return `P${dayjs().format('YYYYMMDDHHmmss')}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  /**
   * 生成退款单号
   */
  private generateRefundNo(): string {
    return `R${dayjs().format('YYYYMMDDHHmmss')}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  /**
   * 格式化订单
   */
  private formatOrder(order: PayOrder) {
    const statusMap: Record<number, string> = {
      0: 'pending',
      1: 'paid',
      2: 'failed',
      3: 'closed',
      4: 'refunding',
      5: 'refunded',
    };

    return {
      orderNo: order.orderNo,
      mchNo: order.mchNo,
      mchName: order.mchName,
      appId: order.appId,
      payWay: order.payType,
      amount: order.amount,
      actualAmount: order.actualAmount,
      fee: order.fee,
      status: statusMap[order.status] || 'unknown',
      subject: order.subject,
      attach: order.attach,
      channelOrderNo: order.channelOrderNo,
      paidTime: order.payTime,
      createTime: order.createTime,
      expireTime: order.expireTime,
    };
  }
}

export default new PayService();
