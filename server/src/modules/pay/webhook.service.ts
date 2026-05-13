/**
 * DGKJ 支付平台 - Webhook 通知服务
 * 
 * 向商户系统发送支付结果通知
 */

import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { AppDataSource } from '../../config/data-source';
import { TradeNotify } from '../../database/entities/trade.entity';

const notifyRepo = AppDataSource.getRepository(TradeNotify);

// 最大重试次数
const MAX_RETRY_COUNT = 5;
// 重试间隔 (毫秒)
const RETRY_INTERVALS = [0, 30000, 60000, 300000, 900000, 1800000]; // 0, 30s, 1m, 5m, 15m, 30m

/**
 * Webhook 通知数据
 */
export interface WebhookData {
  /** 通知类型: pay | refund | transfer */
  type: 'pay' | 'refund' | 'transfer';
  /** 通知ID */
  notifyId: string;
  /** 商户订单号 */
  orderNo: string;
  /** 平台订单号 */
  platformOrderNo?: string;
  /** 通道订单号 */
  channelOrderNo?: string;
  /** 商户号 */
  mchNo: string;
  /** 订单金额 (分) */
  amount: number;
  /** 实际支付金额 (分) */
  paidAmount?: number;
  /** 状态 */
  status: string;
  /** 支付时间 */
  paidTime?: string;
  /** 附加数据 */
  attach?: string;
  /** 错误信息 */
  errorMsg?: string;
  /** 签名 */
  sign?: string;
  /** 时间戳 */
  timestamp: string;
}

/**
 * 发送 Webhook 通知
 */
export async function sendWebhookNotification(
  url: string,
  data: {
    type: 'pay' | 'refund' | 'transfer';
    orderNo: string;
    mchNo: string;
    amount: number;
    paidAmount?: number;
    status: string;
    paidTime?: string;
    attach?: string;
  },
  secret?: string
): Promise<{ success: boolean; notifyId: string }> {
  const notifyId = uuidv4();
  
  // 构建通知数据
  const notifyData: WebhookData = {
    type: data.type,
    notifyId,
    orderNo: data.orderNo,
    mchNo: data.mchNo,
    amount: data.amount,
    paidAmount: data.paidAmount,
    status: data.status,
    paidTime: data.paidTime,
    attach: data.attach,
    timestamp: new Date().toISOString(),
  };

  // 生成签名
  if (secret) {
    notifyData.sign = generateSign(notifyData, secret);
  }

  // 记录通知日志
  const notify = notifyRepo.create({
    id: uuidv4(),
    notifyId,
    orderNo: data.orderNo,
    mchNo: data.mchNo,
    appId: '', // 后续补充
    notifyUrl: url,
    notifyType: data.type === 'pay' ? 1 : data.type === 'refund' ? 2 : 3,
    status: 0,
    createTime: new Date(),
    updateTime: new Date(),
  });
  await notifyRepo.save(notify);

  // 异步发送通知
  sendNotifyAsync(url, notifyData, notifyId, 0);

  return { success: true, notifyId };
}

/**
 * 异步发送通知
 */
async function sendNotifyAsync(
  url: string,
  data: WebhookData,
  notifyId: string,
  retryCount: number
) {
  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Notify-Id': notifyId,
        'X-Timestamp': data.timestamp,
      },
      timeout: 30000, // 30秒超时
    });

    // 收到 "success" 响应表示成功
    if (response.data === 'success' || response.data?.code === 'SUCCESS') {
      await updateNotifyStatus(notifyId, 1, response.data);
      return;
    }

    // 需要重试
    throw new Error('商户返回失败');
  } catch (error) {
    const axiosError = error as AxiosError;
    const errorMsg = axiosError.message || '请求失败';
    
    if (retryCount < MAX_RETRY_COUNT) {
      // 更新重试次数
      await notifyRepo.update({ notifyId }, {
        notifyCount: retryCount + 1,
        lastNotifyTime: new Date(),
        nextNotifyTime: new Date(Date.now() + RETRY_INTERVALS[retryCount + 1]),
        responseResult: errorMsg,
        updateTime: new Date(),
      });

      // 延迟重试
      setTimeout(() => {
        sendNotifyAsync(url, data, notifyId, retryCount + 1);
      }, RETRY_INTERVALS[retryCount + 1]);
    } else {
      // 超过最大重试次数
      await notifyRepo.update({ notifyId }, {
        status: -1,
        lastNotifyTime: new Date(),
        responseResult: errorMsg,
        updateTime: new Date(),
      });
    }
  }
}

/**
 * 更新通知状态
 */
async function updateNotifyStatus(
  notifyId: string,
  status: number,
  responseResult?: any
) {
  await notifyRepo.update({ notifyId }, {
    status,
    lastNotifyTime: new Date(),
    nextNotifyTime: null,
    responseResult: typeof responseResult === 'string' 
      ? responseResult 
      : JSON.stringify(responseResult),
    updateTime: new Date(),
  });
}

/**
 * 生成签名
 */
function generateSign(data: WebhookData, secret: string): string {
  // 排除 sign 字段
  const signData = { ...data };
  delete signData.sign;

  // 按字典序排序
  const keys = Object.keys(signData).sort();
  const pairs: string[] = [];
  
  for (const key of keys) {
    const value = (signData as any)[key];
    if (value !== undefined && value !== null && value !== '') {
      pairs.push(`${key}=${value}`);
    }
  }

  // 拼接密钥并计算 MD5
  const signStr = pairs.join('&') + '&key=' + secret;
  return crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();
}

/**
 * 验证签名
 */
export function verifySign(
  data: Record<string, any>,
  sign: string,
  secret: string
): boolean {
  const calculatedSign = generateSign({ ...data, sign: undefined } as WebhookData, secret);
  return calculatedSign === sign;
}

/**
 * 查询通知状态
 */
export async function getNotifyStatus(notifyId: string) {
  const notify = await notifyRepo.findOne({ where: { notifyId } });
  if (!notify) return null;

  return {
    notifyId: notify.notifyId,
    orderNo: notify.orderNo,
    status: notify.status === 1 ? 'success' : notify.status === -1 ? 'failed' : 'pending',
    notifyCount: notify.notifyCount,
    lastNotifyTime: notify.lastNotifyTime,
    nextNotifyTime: notify.nextNotifyTime,
    responseResult: notify.responseResult,
  };
}

/**
 * 手动重试通知
 */
export async function retryNotify(notifyId: string): Promise<boolean> {
  const notify = await notifyRepo.findOne({ where: { notifyId } });
  if (!notify) return false;

  // 重置重试次数
  await notifyRepo.update({ notifyId }, {
    notifyCount: 0,
    nextNotifyTime: new Date(),
    updateTime: new Date(),
  });

  // 发送通知
  sendNotifyAsync(
    notify.notifyUrl,
    {
      type: notify.notifyType === 1 ? 'pay' : notify.notifyType === 2 ? 'refund' : 'transfer',
      notifyId: notify.notifyId,
      orderNo: notify.orderNo,
      mchNo: notify.mchNo,
      amount: 0,
      status: 'pending',
      timestamp: new Date().toISOString(),
    },
    notifyId,
    0
  );

  return true;
}

export default {
  sendWebhookNotification,
  verifySign,
  getNotifyStatus,
  retryNotify,
};
