/**
 * DGKJ 支付平台 - 银联支付通道完整实现
 * 
 * 支持: 银联二维码、APP支付、网关支付、控件支付
 */

import axios, { AxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
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
    PayWay.UNION_JK,
  ];

  private config: ChannelConfig = {
    code: '',
    name: '',
    appId: '',
    appSecret: '',
    mchId: '',
    apiKey: '',
  };

  private certPath: string = '';
  private privateKey: string = '';
  private publicKey: string = '';

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

    // 加载证书
    if (config.certPath) {
      this.loadCertificates(config.certPath);
    }
  }

  private loadCertificates(certPath: string): void {
    try {
      if (fs.existsSync(path.join(certPath, 'acp_test_sign.pfx'))) {
        // 测试环境证书
        this.certPath = path.join(certPath, 'acp_test_sign.pfx');
      } else if (fs.existsSync(path.join(certPath, 'acp_prod_sign.pfx'))) {
        // 生产环境证书
        this.certPath = path.join(certPath, 'acp_prod_sign.pfx');
      }
    } catch (error) {
      console.error('加载银联证书失败:', error);
    }
  }

  /**
   * 执行支付
   */
  async pay(request: UnifiedPayRequest): Promise<UnifiedPayResponse> {
    try {
      const params = await this.buildPayParams(request);
      const response = await this.request('/trade/pay', params);

      if (response.respCode === '00') {
        return this.buildPaySuccessResponse(request, response);
      } else {
        return this.buildPayFailResponse(response);
      }
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'PAY_FAILED',
        errorMsg: error.message || '支付创建失败',
      };
    }
  }

  private buildPaySuccessResponse(request: UnifiedPayRequest, response: any): UnifiedPayResponse {
    let payUrl = '';
    let qrCode = '';
    let appParams: Record<string, any> | undefined;
    let h5Url = '';

    switch (request.payWay) {
      case PayWay.UNION_QR:
        payUrl = response.qrCode || response.payData;
        qrCode = payUrl;
        break;

      case PayWay.UNION_APP:
        appParams = this.buildAppPayParams(response);
        break;

      case PayWay.UNION_WAP:
      case PayWay.UNION_BANK:
        h5Url = response.payUrl || response.mwebUrl || response.payData;
        break;

      case PayWay.UNION_JK:
        appParams = this.buildSdkPayParams(response);
        break;
    }

    return {
      success: true,
      orderNo: request.orderNo,
      channelOrderNo: response.tn || response.orderId || response.queryId,
      payUrl,
      qrCode,
      appParams,
      h5Url,
      expireTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    };
  }

  private buildAppPayParams(response: any): Record<string, any> {
    return {
      version: response.version || '5.1.0',
      tn: response.tn,
      certId: response.certId,
      signature: response.signature,
      merchantId: response.merchantId,
      orderId: response.orderId,
      txnTime: response.txnTime,
      txnAmt: response.txnAmt,
    };
  }

  private buildSdkPayParams(response: any): Record<string, any> {
    return {
      version: response.version || '5.1.0',
      tn: response.tn,
      certId: response.certId,
      signature: response.signature,
    };
  }

  private buildPayFailResponse(response: any): UnifiedPayResponse {
    return {
      success: false,
      errorCode: response.respCode || 'UNKNOWN',
      errorMsg: response.respMsg || '支付创建失败',
    };
  }

  /**
   * 查询订单
   */
  async query(request: UnifiedQueryRequest): Promise<UnifiedQueryResponse> {
    try {
      const params = await this.buildQueryParams(request);
      const response = await this.request('/trade/query', params);

      if (response.respCode === '00') {
        return {
          success: true,
          status: this.mapQueryStatus(response.origRespCode),
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

  private mapQueryStatus(respCode: string): PayStatus {
    switch (respCode) {
      case '00':
        return PayStatus.SUCCESS;
      case '03':
      case '04':
      case '05':
        return PayStatus.PENDING;
      case '34':
        return PayStatus.REFUNDING;
      default:
        return PayStatus.FAILED;
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
          channelRefundNo: response.refundId || response.queryId,
          status: RefundStatus.SUCCESS,
          refundAmount: parseInt(response.refundAmt || response.txnAmt),
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
   * 转账 (银联云闪付不支持，代理到其他通道)
   */
  async transfer(request: UnifiedTransferRequest): Promise<UnifiedTransferResponse> {
    // 银联通道暂不支持直接转账，建议使用代付通道
    return {
      success: false,
      errorCode: 'UNSUPPORTED',
      errorMsg: '银联通道暂不支持转账功能，请使用代付通道',
      status: 'failed' as any,
    };
  }

  /**
   * 验证回调签名
   */
  async verifyCallback(data: any, headers: any): Promise<{ success: boolean; errorMsg?: string }> {
    try {
      if (!data.signature && !data.sign) {
        return { success: false, errorMsg: '缺少签名' };
      }

      const signature = data.signature || data.sign;
      const signData = { ...data };
      delete signData.signature;
      delete signData.sign;

      const signStr = this.getSignString(signData);
      const isValid = this.verifySign(signStr, signature);

      if (!isValid) {
        return { success: false, errorMsg: '签名验证失败' };
      }

      if (data.respCode && data.respCode !== '00') {
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
    let notifyType: 'pay' | 'refund' | 'transfer' = 'pay';

    // 根据交易类型判断
    const txnType = data.txnType || data.bizType;
    if (txnType === '04' || data.origTxnType === '01') {
      // 退款
      notifyType = 'refund';
      const refundStatus: RefundStatus = data.respCode === '00' ? RefundStatus.SUCCESS : RefundStatus.FAILED;
      status = refundStatus as unknown as PayStatus;
    } else {
      // 支付
      status = this.mapCallbackStatus(data.respCode);
    }

    return {
      channelCode: ChannelCode.UNIONPAY,
      notifyType,
      orderNo: data.orderId || data.origOrderId,
      channelOrderNo: data.queryId,
      status,
      amount: parseInt(data.txnAmt || '0'),
      paidAmount: data.receiveAmt ? parseInt(data.receiveAmt) : undefined,
      paidTime: data.payTime ? new Date(data.payTime) : undefined,
      attach: data.attach,
      rawData: data,
    };
  }

  private mapCallbackStatus(respCode: string): PayStatus {
    switch (respCode) {
      case '00':
        return PayStatus.SUCCESS;
      case '03':
      case '04':
      case '05':
        return PayStatus.PENDING;
      default:
        return PayStatus.FAILED;
    }
  }

  responseCallbackSuccess(): string {
    return JSON.stringify({ respCode: '00', respMsg: '成功' });
  }

  responseCallbackFail(): string {
    return JSON.stringify({ respCode: '01', respMsg: '失败' });
  }

  // ==================== 私有方法 ====================

  private async buildPayParams(request: UnifiedPayRequest): Promise<Record<string, string>> {
    const version = '5.1.0';
    const encoding = 'UTF-8';
    const bizType = this.getBizType(request.payWay);
    const txnType = '01'; // 消费
    const txnSubType = this.getTxnSubType(request.payWay);
    const channelType = '07'; // 互联网
    const currencyCode = '156';

    const params: Record<string, string> = {
      version,
      encoding,
      bizType,
      txnType,
      txnSubType,
      channelType,
      merId: this.config.mchId!,
      orderId: request.orderNo,
      txnTime: this.formatTime((request as any).orderTime || new Date()),
      txnAmt: request.amount.toString(),
      currencyCode,
      subject: request.subject,
      signatureAlgorithm: '01', // RSA
    };

    // 根据支付方式添加特定参数
    this.addPayWayParams(params, request);

    // 签名
    params.signature = await this.sign(params);
    return params;
  }

  private getBizType(payWay: PayWay): string {
    const bizTypeMap: Partial<Record<PayWay, string>> = {
      [PayWay.UNION_QR]: '000301',
      [PayWay.UNION_APP]: '000201',
      [PayWay.UNION_WAP]: '000202',
      [PayWay.UNION_BANK]: '000200',
      [PayWay.UNION_JK]: '000301',
    };
    return bizTypeMap[payWay] || '000301';
  }

  private getTxnSubType(payWay: PayWay): string {
    const txnSubTypeMap: Partial<Record<PayWay, string>> = {
      [PayWay.UNION_QR]: '06',
      [PayWay.UNION_APP]: '01',
      [PayWay.UNION_WAP]: '02',
      [PayWay.UNION_BANK]: '03',
      [PayWay.UNION_JK]: '06',
    };
    return txnSubTypeMap[payWay] || '06';
  }

  private addPayWayParams(params: Record<string, string>, request: UnifiedPayRequest): void {
    switch (request.payWay) {
      case PayWay.UNION_WAP:
      case PayWay.UNION_BANK:
        params.frontUrl = request.returnUrl || '';
        break;

      case PayWay.UNION_APP:
        params.signNo = request.openId || ''; // 令牌
        break;

      default:
        params.backUrl = request.notifyUrl || '';
    }

    if (request.notifyUrl) {
      params.backUrl = request.notifyUrl;
    }
  }

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
      signatureAlgorithm: '01',
    };

    if (request.channelOrderNo) {
      params.queryId = request.channelOrderNo;
      params.orderId = '';
    }

    params.signature = await this.sign(params);
    return params;
  }

  private async buildRefundParams(request: UnifiedRefundRequest): Promise<Record<string, string>> {
    const params: Record<string, string> = {
      version: '5.1.0',
      encoding: 'UTF-8',
      bizType: '000301',
      txnType: '04', // 退款
      txnSubType: '00',
      channelType: '07',
      merId: this.config.mchId!,
      orderId: request.orderNo,
      txnTime: '',
      txnAmt: request.refundAmount.toString(),
      refundAmt: request.refundAmount.toString(),
      outRefundId: request.refundNo,
      origTxnType: '01',
      signatureAlgorithm: '01',
    };

    params.signature = await this.sign(params);
    return params;
  }

  private async request(path: string, params: Record<string, string>): Promise<any> {
    const url = `${this.getBaseUrl()}${path}`;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      timeout: (this.config.timeout || 30) * 1000,
    };

    const response = await axios.post(url, this.buildFormData(params), config);
    return this.parseResponse(response.data);
  }

  private buildFormData(params: Record<string, string>): string {
    return Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
  }

  private parseResponse(data: string | any): Record<string, any> {
    if (typeof data === 'object') {
      return data;
    }

    if (typeof data === 'string' && data.includes('<')) {
      // XML 格式
      return this.parseXmlResponse(data);
    }

    try {
      return JSON.parse(data);
    } catch {
      return { respCode: 'UNKNOWN', respMsg: '响应解析失败' };
    }
  }

  private parseXmlResponse(xml: string): Record<string, any> {
    const result: Record<string, any> = {};
    const regex = /<(\w+)>([^<]*)/g;
    let match;

    while ((match = regex.exec(xml)) !== null) {
      const [, key, value] = match;
      result[key] = value;
    }

    return result;
  }

  private getSignString(params: Record<string, string>): string {
    const keys = Object.keys(params).sort();
    const pairs: string[] = [];

    for (const key of keys) {
      if (params[key] !== undefined && params[key] !== '' && key !== 'signature') {
        pairs.push(`${key}=${params[key]}`);
      }
    }

    return pairs.join('&');
  }

  private async sign(params: Record<string, string>): Promise<string> {
    const signStr = this.getSignString(params);

    if (this.privateKey) {
      return this.signWithPrivateKey(signStr);
    }

    // 使用 MD5 签名 (仅用于测试)
    return crypto
      .createHash('sha256')
      .update(signStr + '&key=' + this.config.apiKey)
      .digest('hex')
      .toUpperCase();
  }

  private signWithPrivateKey(data: string): string {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    return sign.sign(this.privateKey, 'base64');
  }

  private verifySign(data: string, signature: string): boolean {
    if (!this.publicKey) {
      // 使用 API Key 验签
      const expectedSign = crypto
        .createHash('sha256')
        .update(data + '&key=' + this.config.apiKey)
        .digest('hex')
        .toUpperCase();
      return signature === expectedSign;
    }

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    return verify.verify(this.publicKey, signature, 'base64');
  }

  private formatTime(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }
}

export default new UnionPayChannel();
