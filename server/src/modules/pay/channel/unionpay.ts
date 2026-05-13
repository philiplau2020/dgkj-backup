/**
 * DGKJ 支付平台 - 银联支付通道实现
 * 
 * 支持: 银联二维码、APP支付、网关支付
 */

import axios from 'axios';
import * as crypto from 'crypto';
import * as xml2js from 'xml2js';
import {
  IPaymentChannel,
  ChannelConfig,
  UnifiedPayRequest,
  UnifiedPayResponse,
  UnifiedQueryRequest,
  UnifiedQueryResponse,
  UnifiedRefundRequest,
  UnifiedRefundResponse,
  UnifiedTransferRequest,
  UnifiedTransferResponse,
  UnifiedCallbackData,
  PayWay,
  PayStatus,
  RefundStatus,
  ChannelCode,
} from './interface';

export class UnionPayChannel implements IPaymentChannel {
  readonly channelCode = ChannelCode.UNIONPAY;
  readonly channelName = '银联支付';
  readonly supportedPayWays: PayWay[] = [
    PayWay.UNION_QR,
    PayWay.UNION_APP,
    PayWay.UNION_WAP,
    PayWay.UNION_BANK,
  ];

  private config: ChannelConfig = {
    code: '',
    name: '',
    appId: '',
    appSecret: '',
    mchId: '',
    apiKey: '',
  };

  // 银联支付 API 地址
  private getBaseUrl(): string {
    return this.config.sandbox
      ? 'https://gateway.95516.com/sandbox/api'
      : 'https://gateway.95516.com/api';
  }

  initialize(config: ChannelConfig): void {
    this.config = {
      code: ChannelCode.UNIONPAY,
      name: '银联支付',
      appId: config.appId,
      appSecret: config.appSecret,
      mchId: config.mchId,
      apiKey: config.apiKey,
      privateKey: config.privateKey,
      publicKey: config.publicKey,
      sandbox: config.sandbox,
      timeout: config.timeout || 30,
      extra: config.extra,
    };
  }

  /**
   * 执行支付
   */
  async pay(request: UnifiedPayRequest): Promise<UnifiedPayResponse> {
    try {
      const params = await this.buildPayParams(request);
      const response = await this.request('/trade/pay', params);

      if (response.respCode === '00') {
        let payUrl = '';
        let qrCode = '';
        let appParams: Record<string, any> | undefined;
        let h5Url = '';

        switch (request.payWay) {
          case PayWay.UNION_QR:
            payUrl = response.qrCode;
            qrCode = await this.generateQRCode(payUrl);
            break;

          case PayWay.UNION_APP:
            appParams = {
              tn: response.tn,
              certId: response.certId,
              sign: response.sign,
            };
            break;

          case PayWay.UNION_WAP:
          case PayWay.UNION_BANK:
            h5Url = response.payUrl || response.mwebUrl;
            break;
        }

        return {
          success: true,
          orderNo: request.orderNo,
          channelOrderNo: response.tn || response.orderId,
          payUrl,
          qrCode,
          appParams,
          h5Url,
          expireTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        };
      } else {
        return {
          success: false,
          errorCode: response.respCode,
          errorMsg: response.respMsg || '支付创建失败',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'PAY_FAILED',
        errorMsg: error.message || '支付创建失败',
      };
    }
  }

  /**
   * 查询订单
   */
  async query(request: UnifiedQueryRequest): Promise<UnifiedQueryResponse> {
    try {
      const params = await this.buildQueryParams(request);
      const response = await this.request('/trade/query', params);

      if (response.respCode === '00') {
        let status: PayStatus = PayStatus.PENDING;

        switch (response.origRespCode) {
          case '00':
            status = PayStatus.SUCCESS;
            break;
          case '03':
          case '04':
          case '05':
            status = PayStatus.PENDING;
            break;
          case '34':
            status = PayStatus.REFUNDING;
            break;
          default:
            status = PayStatus.FAILED;
        }

        return {
          success: true,
          status,
          channelOrderNo: response.queryId,
          paidTime: response.payTime ? new Date(response.payTime) : undefined,
          rawResponse: response,
        };
      } else {
        return {
          success: false,
          errorCode: response.respCode,
          errorMsg: response.respMsg,
          status: PayStatus.PENDING,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'QUERY_FAILED',
        errorMsg: error.message,
        status: PayStatus.PENDING,
      };
    }
  }

  /**
   * 申请退款
   */
  async refund(request: UnifiedRefundRequest): Promise<UnifiedRefundResponse> {
    try {
      const params = await this.buildRefundParams(request);
      const response = await this.request('/trade/refund', params);

      if (response.respCode === '00') {
        return {
          success: true,
          refundNo: request.refundNo,
          channelRefundNo: response.refundId,
          status: RefundStatus.SUCCESS,
          refundAmount: parseInt(response.refundAmt),
          refundTime: new Date(),
        };
      } else {
        return {
          success: false,
          errorCode: response.respCode,
          errorMsg: response.respMsg || '退款失败',
          status: RefundStatus.FAILED,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'REFUND_FAILED',
        errorMsg: error.message,
        status: RefundStatus.FAILED,
      };
    }
  }

  /**
   * 转账 (暂不支持)
   */
  async transfer(request: UnifiedTransferRequest): Promise<UnifiedTransferResponse> {
    return {
      success: false,
      errorCode: 'UNSUPPORTED',
      errorMsg: '银联通道暂不支持转账功能',
      status: 'failed' as any,
    };
  }

  /**
   * 验证回调签名
   */
  async verifyCallback(data: any, headers: any): Promise<{ success: boolean; errorMsg?: string }> {
    try {
      if (!data.signature) {
        return { success: false, errorMsg: '缺少签名' };
      }

      const signData = { ...data };
      delete signData.signature;

      const signStr = this.getSignString(signData);
      const isValid = this.verifySign(signStr, data.signature);

      if (!isValid) {
        return { success: false, errorMsg: '签名验证失败' };
      }

      if (data.respCode !== '00') {
        return { success: false, errorMsg: data.respMsg };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, errorMsg: error.message };
    }
  }

  /**
   * 解析回调数据
   */
  async parseCallback(data: any): Promise<UnifiedCallbackData> {
    let status: PayStatus;

    switch (data.respCode) {
      case '00':
        status = PayStatus.SUCCESS;
        break;
      case '03':
      case '04':
      case '05':
        status = PayStatus.PENDING;
        break;
      default:
        status = PayStatus.FAILED;
    }

    return {
      channelCode: ChannelCode.UNIONPAY,
      notifyType: 'pay',
      orderNo: data.orderId,
      channelOrderNo: data.queryId,
      status,
      amount: parseInt(data.totalAmount || '0'),
      paidAmount: data.receiveAmt ? parseInt(data.receiveAmt) : undefined,
      paidTime: data.payTime ? new Date(data.payTime) : undefined,
      attach: data.attach,
      rawData: data,
    };
  }

  /**
   * 响应回调成功
   */
  responseCallbackSuccess(): string {
    return JSON.stringify({ respCode: '00', respMsg: '成功' });
  }

  /**
   * 响应回调失败
   */
  responseCallbackFail(): string {
    return JSON.stringify({ respCode: '01', respMsg: '失败' });
  }

  // ==================== 私有方法 ====================

  /**
   * 构建支付参数
   */
  private async buildPayParams(request: UnifiedPayRequest): Promise<Record<string, string>> {
    const version = '5.1.0';
    const encoding = 'UTF-8';
    const bizType = '000301'; // 二维码支付
    const txnType = '01'; // 消费
    const txnSubType = '06'; // 二维码支付
    const channelType = '07'; // 互联网
    const currencyCode = '156';

    let txnSubTypeMap: Record<string, string> = {
      [PayWay.UNION_QR]: '06',
      [PayWay.UNION_APP]: '01',
      [PayWay.UNION_WAP]: '02',
      [PayWay.UNION_BANK]: '03',
    };

    const params: Record<string, string> = {
      version,
      encoding,
      bizType,
      txnType,
      txnSubType: txnSubTypeMap[request.payWay] || '06',
      channelType,
      merId: this.config.mchId!,
      orderId: request.orderNo,
      txnTime: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
      txnAmt: request.amount.toString(),
      currencyCode,
      subject: request.subject,
      signatureAlgorithm: '01', // RSA
    };

    if (request.payWay === PayWay.UNION_WAP || request.payWay === PayWay.UNION_BANK) {
      params.frontUrl = request.returnUrl || '';
    } else {
      params.backUrl = request.notifyUrl || '';
    }

    if (request.payWay === PayWay.UNION_APP) {
      params.signNo = request.openId || ''; // 令牌
    }

    params.signature = this.sign(params);
    return params;
  }

  /**
   * 构建查询参数
   */
  private async buildQueryParams(request: UnifiedQueryRequest): Promise<Record<string, string>> {
    const params: Record<string, string> = {
      version: '5.1.0',
      encoding: 'UTF-8',
      bizType: '000301',
      txnType: '00',
      txnSubType: '06',
      channelType: '07',
      merId: this.config.mchId!,
      orderId: request.orderNo,
      txnTime: '',
      signatureAlgorithm: '01',
    };

    if (request.channelOrderNo) {
      params.queryId = request.channelOrderNo;
    }

    params.signature = this.sign(params);
    return params;
  }

  /**
   * 构建退款参数
   */
  private async buildRefundParams(request: UnifiedRefundRequest): Promise<Record<string, string>> {
    const params: Record<string, string> = {
      version: '5.1.0',
      encoding: 'UTF-8',
      bizType: '000301',
      txnType: '04',
      txnSubType: '00',
      channelType: '07',
      merId: this.config.mchId!,
      orderId: request.orderNo,
      txnTime: '',
      txnAmt: request.refundAmount.toString(),
      refundAmt: request.refundAmount.toString(),
      outRefundId: request.refundNo,
      signatureAlgorithm: '01',
    };

    params.signature = this.sign(params);
    return params;
  }

  /**
   * 发送请求
   */
  private async request(path: string, params: Record<string, string>): Promise<any> {
    try {
      const url = `${this.getBaseUrl()}${path}`;
      const response = await axios.post(url, this.buildFormData(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        timeout: (this.config.timeout || 30) * 1000,
      });

      // 解析响应
      const dataStr = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);

      return this.parseResponse(dataStr);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * 构建 Form Data
   */
  private buildFormData(params: Record<string, string>): string {
    return Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
  }

  /**
   * 解析响应
   */
  private parseResponse(data: string): Record<string, string> {
    // 支持 XML 和 JSON 格式
    if (data.includes('<')) {
      const parser = new xml2js.Parser({ explicitArray: false });
      // 简化处理
      const result: Record<string, string> = {};
      const matches = data.match(/<(\w+)>([^<]*)/g);
      if (matches) {
        for (const match of matches) {
          const [_, key, value] = match.match(/<(\w+)>([^<]*)/) || [];
          if (key && value) {
            result[key] = value;
          }
        }
      }
      return result;
    }
    return JSON.parse(data);
  }

  /**
   * 获取签名字符串
   */
  private getSignString(params: Record<string, string>): string {
    const keys = Object.keys(params).sort();
    const pairs: string[] = [];
    for (const key of keys) {
      if (params[key] !== undefined && params[key] !== '') {
        pairs.push(`${key}=${params[key]}`);
      }
    }
    return pairs.join('&');
  }

  /**
   * 签名
   */
  private sign(params: Record<string, string>): string {
    const signStr = this.getSignString(params);

    if (this.config.privateKey) {
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signStr);
      return sign.sign(this.config.privateKey, 'base64');
    }

    // 如果没有私钥，使用简单的 MD5 签名 (仅用于测试)
    return crypto.createHash('sha256').update(signStr + '&key=' + this.config.apiKey).digest('hex').toUpperCase();
  }

  /**
   * 验签
   */
  private verifySign(data: string, signature: string): boolean {
    if (!this.config.publicKey) {
      return false;
    }

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    return verify.verify(this.config.publicKey, signature, 'base64');
  }

  /**
   * 生成二维码
   */
  private async generateQRCode(content: string): Promise<string> {
    try {
      const QRCode = require('qrcode');
      return await QRCode.toDataURL(content, {
        width: 300,
        margin: 2,
      });
    } catch {
      return '';
    }
  }
}

export default new UnionPayChannel();
