/**
 * DGKJ 支付平台 - 通联支付通道实现
 *
 * 支持: 微信/支付宝/云闪付扫码支付、JSAPI支付、APP支付
 * 文档: https://prodoc.allinpay.com/doc/256/
 */

import axios from 'axios';
import * as crypto from 'crypto';
import * as xml2js from 'xml2js';
import * as qrcode from 'qrcode';
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

export class AllinpayChannel implements IPaymentChannel {
  readonly channelCode = ChannelCode.ALLINPAY;
  readonly channelName = '通联支付';

  readonly supportedPayWays: PayWay[] = [
    PayWay.ALLINPAY_WX_QR,
    PayWay.ALLINPAY_ALI_QR,
    PayWay.ALLINPAY_YSF_QR,
    PayWay.ALLINPAY_WX_JSAPI,
    PayWay.ALLINPAY_ALI_JSAPI,
    PayWay.ALLINPAY_YSF_JSAPI,
    PayWay.ALLINPAY_WX_APP,
    PayWay.ALLINPAY_ALI_APP,
    PayWay.ALLINPAY_UNION_APP,
  ];

  private config: ChannelConfig = {
    code: '',
    name: '',
    appId: '',
    appSecret: '',
    mchId: '',
    apiKey: '',
  };

  // 通联支付网关地址
  private getBaseUrl(): string {
    return this.config.sandbox
      ? 'https://syb-test.allinpay.com/apiweb/unitorder'
      : 'https://vsp.allinpay.com/apiweb/unitorder';
  }

  // 通联支付交易方式映射
  private payTypeMap: Record<string, string> = {
    [PayWay.ALLINPAY_WX_QR]: 'W01',     // 微信扫码
    [PayWay.ALLINPAY_ALI_QR]: 'A01',    // 支付宝扫码
    [PayWay.ALLINPAY_YSF_QR]: 'U01',    // 云闪付扫码
    [PayWay.ALLINPAY_WX_JSAPI]: 'W02',  // 微信JSAPI
    [PayWay.ALLINPAY_ALI_JSAPI]: 'A02', // 支付宝JSAPI
    [PayWay.ALLINPAY_YSF_JSAPI]: 'U02', // 云闪付JSAPI
    [PayWay.ALLINPAY_WX_APP]: 'W03',    // 微信APP
    [PayWay.ALLINPAY_ALI_APP]: 'A03',   // 支付宝APP
    [PayWay.ALLINPAY_UNION_APP]: 'S03', // 银联APP
  };

  initialize(config: ChannelConfig): void {
    this.config = {
      code: ChannelCode.ALLINPAY,
      name: '通联支付',
      appId: config.appId,
      appSecret: config.appSecret,
      mchId: config.mchId,
      apiKey: config.apiKey,
      privateKey: config.privateKey,
      publicKey: config.publicKey,
      certPath: config.certPath,
      certKey: config.certKey,
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
      const payType = this.payTypeMap[request.payWay];
      if (!payType) {
        return {
          success: false,
          errorCode: 'UNSUPPORTED_PAY_WAY',
          errorMsg: `不支持的支付方式: ${request.payWay}`,
        };
      }

      // 检查 JSAPI 支付需要的用户标识
      if (request.payWay.includes('jsapi') && !request.openId && !request.buyerId) {
        return {
          success: false,
          errorCode: 'MISSING_USER_ID',
          errorMsg: 'JSAPI支付需要传入openId(微信/云闪付)或buyerId(支付宝)',
        };
      }

      const params = await this.buildPayParams(request, payType);
      const response = await this.request(params);

      if (response.retcode !== 'SUCCESS') {
        return {
          success: false,
          errorCode: response.retcode,
          errorMsg: response.retmsg || response.errmsg || '支付创建失败',
        };
      }

      // 根据交易状态判断结果
      const trxstatus = response.trxstatus;
      if (trxstatus !== '0000' && trxstatus !== '0001') {
        return {
          success: false,
          errorCode: trxstatus,
          errorMsg: response.errmsg || '支付失败',
        };
      }

      let payUrl = '';
      let qrCode = '';
      let jsapiParams: Record<string, any> | undefined;
      let appParams: Record<string, any> | undefined;
      let deeplink = '';

      // 根据支付类型处理响应
      const isJsApi = ['W02', 'A02', 'U02'].includes(payType);
      const isApp = ['W03', 'A03', 'S03'].includes(payType);

      if (isJsApi) {
        // JSAPI 支付返回支付链接或调起参数
        if (response.payinfo) {
          if (payType === 'U02') {
            // 云闪付 JS 返回支付链接
            deeplink = response.payinfo;
          } else {
            // 微信/支付宝 JS 返回 JSON 字符串
            try {
              jsapiParams = JSON.parse(response.payinfo);
            } catch {
              deeplink = response.payinfo;
            }
          }
        }
      } else if (isApp) {
        // APP 支付返回支付信息串
        appParams = { payinfo: response.payinfo };
      } else {
        // 扫码支付返回二维码串
        payUrl = response.payinfo || '';
        if (payUrl) {
          qrCode = await this.generateQRCode(payUrl);
        }
      }

      return {
        success: true,
        orderNo: request.orderNo,
        channelOrderNo: response.trxid,
        payUrl,
        qrCode,
        jsapiParams,
        appParams,
        deeplink,
        expireTime: new Date(Date.now() + 5 * 60 * 1000), // 默认5分钟
      };
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
      const params: Record<string, string> = {
        cusid: this.config.mchId,
        appid: this.config.appId,
        trxid: request.channelOrderNo || '',
        reqsn: request.orderNo,
        randomstr: this.generateNonce(),
        signtype: this.getSignType(),
      };

      params.sign = this.sign(params);

      const response = await this.request(params, '/query');

      if (response.retcode !== 'SUCCESS') {
        return {
          success: false,
          errorCode: response.retcode,
          errorMsg: response.retmsg,
          status: PayStatus.PENDING,
        };
      }

      let status: PayStatus;
      const trxstatus = response.trxstatus;

      // 通联交易状态码
      // 0000: 交易成功(已清算)
      // 0001: 交易成功(未清算)
      // 0002: 商户订单号重复
      // 0003: 交易失败
      // 0004: 交易关闭
      // 0005: 交易取消
      // 0006: 交易处理中
      switch (trxstatus) {
        case '0000':
        case '0001':
          status = PayStatus.SUCCESS;
          break;
        case '0004':
        case '0005':
          status = PayStatus.CLOSED;
          break;
        case '0003':
          status = PayStatus.FAILED;
          break;
        case '0006':
        default:
          status = PayStatus.PENDING;
          break;
      }

      return {
        success: true,
        status,
        channelOrderNo: response.trxid,
        paidTime: response.fintime ? this.parseDate(response.fintime) : undefined,
        rawResponse: response,
      };
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
      const params: Record<string, string> = {
        cusid: this.config.mchId,
        appid: this.config.appId,
        reqsn: request.refundNo,
        trxid: request.channelOrderNo || '',
        oldreqsn: request.orderNo,
        trxamt: request.refundAmount.toString(),
        reason: request.reason || '用户申请退款',
        randomstr: this.generateNonce(),
        signtype: this.getSignType(),
      };

      params.sign = this.sign(params);

      const response = await this.request(params, '/refund');

      if (response.retcode !== 'SUCCESS') {
        return {
          success: false,
          errorCode: response.retcode,
          errorMsg: response.retmsg || response.errmsg,
          status: RefundStatus.FAILED,
        };
      }

      const trxstatus = response.trxstatus;
      if (trxstatus === '0000' || trxstatus === '0001') {
        return {
          success: true,
          refundNo: request.refundNo,
          channelRefundNo: response.trxid,
          status: RefundStatus.SUCCESS,
          refundAmount: parseInt(response.trxamt),
          refundTime: new Date(),
        };
      } else {
        return {
          success: false,
          errorCode: trxstatus,
          errorMsg: response.errmsg || '退款失败',
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
   * 转账 (代付)
   */
  async transfer(request: UnifiedTransferRequest): Promise<UnifiedTransferResponse> {
    try {
      const params: Record<string, string> = {
        cusid: this.config.mchId,
        appid: this.config.appId,
        reqsn: request.transferNo,
        outreqsn: request.outNo,
        trxamt: request.amount.toString(),
        remark: request.remark || '转账',
        randomstr: this.generateNonce(),
        signtype: this.getSignType(),
      };

      // 根据账户类型选择不同的收款账户字段
      if (request.accountType === 'bank_card') {
        params.accntno = request.payeeAccount;
        params.accntnm = request.payeeName;
        if (request.bankCode) params.bankcode = request.bankCode;
      } else if (request.accountType === 'wechat_openid') {
        params.openid = request.payeeAccount;
        params.accntnm = request.payeeName;
      } else if (request.accountType === 'alipay_id') {
        params.aliuserid = request.payeeAccount;
        params.accntnm = request.payeeName;
      }

      params.sign = this.sign(params);

      const response = await this.request(params, '/transfer');

      if (response.retcode !== 'SUCCESS') {
        return {
          success: false,
          errorCode: response.retcode,
          errorMsg: response.retmsg || response.errmsg,
          status: 'failed' as any,
        };
      }

      const trxstatus = response.trxstatus;
      if (trxstatus === '0000' || trxstatus === '0001') {
        return {
          success: true,
          transferNo: request.transferNo,
          channelTransferNo: response.trxid,
          status: 'success' as any,
        };
      } else {
        return {
          success: false,
          errorCode: trxstatus,
          errorMsg: response.errmsg || '转账失败',
          status: 'failed' as any,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'TRANSFER_FAILED',
        errorMsg: error.message,
        status: 'failed' as any,
      };
    }
  }

  /**
   * 验证回调签名
   */
  async verifyCallback(data: any, headers: any): Promise<{ success: boolean; errorMsg?: string }> {
    try {
      const params = typeof data === 'string' ? this.parseQueryString(data) : data;

      const sign = params.sign;
      if (!sign) {
        return { success: false, errorMsg: '缺少签名' };
      }

      // 移除 sign 字段后验签
      const signData = { ...params };
      delete signData.sign;

      const isValid = this.verifySign(signData, sign);
      if (!isValid) {
        return { success: false, errorMsg: '签名验证失败' };
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
    const params = typeof data === 'string' ? this.parseQueryString(data) : data;

    // 解析状态
    let status: PayStatus;
    const trxstatus = params.trxstatus;
    switch (trxstatus) {
      case '0000':
      case '0001':
        status = PayStatus.SUCCESS;
        break;
      case '0004':
      case '0005':
        status = PayStatus.CLOSED;
        break;
      case '0003':
        status = PayStatus.FAILED;
        break;
      default:
        status = PayStatus.PENDING;
    }

    return {
      channelCode: ChannelCode.ALLINPAY,
      notifyType: 'pay',
      orderNo: params.reqsn,
      channelOrderNo: params.trxid,
      status,
      amount: parseInt(params.trxamt || '0'),
      paidAmount: params.fintime ? parseInt(params.trxamt) : undefined,
      paidTime: params.fintime ? this.parseDate(params.fintime) : undefined,
      attach: params.attach,
      rawData: params,
    };
  }

  /**
   * 响应回调成功
   */
  responseCallbackSuccess(): string {
    return 'SUCCESS';
  }

  /**
   * 响应回调失败
   */
  responseCallbackFail(): string {
    return 'FAIL';
  }

  // ==================== 私有方法 ====================

  /**
   * 构建支付参数
   */
  private async buildPayParams(request: UnifiedPayRequest, payType: string): Promise<Record<string, string>> {
    const params: Record<string, string> = {
      cusid: this.config.mchId,
      appid: this.config.appId,
      version: '11',
      trxamt: request.amount.toString(),
      reqsn: request.orderNo,
      paytype: payType,
      randomstr: this.generateNonce(),
      body: request.subject.substring(0, 100), // 最大100字节
      remark: (request.body || '').substring(0, 300), // 最大300字节
      notify_url: request.notifyUrl,
    };

    // 设置有效时间 (默认5分钟)
    params.validtime = '5';

    // JSAPI 支付需要用户标识
    if (request.openId || request.buyerId) {
      if (payType === 'W02') {
        params.acct = request.openId!; // 微信 openid
      } else if (payType === 'A02') {
        params.acct = request.buyerId!; // 支付宝 user_id
      } else if (payType === 'U02') {
        params.acct = request.openId!; // 云闪付 userId
      }
    }

    // 客户端IP
    if (request.clientIp) {
      params.cusip = request.clientIp;
    }

    // 前端跳转地址
    if (request.returnUrl) {
      params.front_url = request.returnUrl;
    }

    // 附加数据
    if (request.attach) {
      params.attach = request.attach;
    }

    // 签名类型
    params.signtype = this.getSignType();

    // 签名
    params.sign = this.sign(params);

    return params;
  }

  /**
   * 发送请求
   */
  private async request(params: Record<string, string>, path: string = '/pay'): Promise<Record<string, string>> {
    try {
      const url = `${this.getBaseUrl()}${path}`;
      const response = await axios.post(url, this.buildFormData(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: (this.config.timeout || 30) * 1000,
      });

      if (typeof response.data === 'string') {
        return this.parseQueryString(response.data);
      }
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          return this.parseQueryString(error.response.data);
        }
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * 构建 Form Data
   */
  private buildFormData(params: Record<string, string>): string {
    const pairs: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
    return pairs.join('&');
  }

  /**
   * 解析查询字符串
   */
  private parseQueryString(str: string): Record<string, string> {
    const params: Record<string, string> = {};
    const pairs = str.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    }
    return params;
  }

  /**
   * 获取签名类型
   */
  private getSignType(): string {
    // 默认使用 RSA 签名
    return this.config.privateKey ? 'RSA' : 'MD5';
  }

  /**
   * 签名
   */
  private sign(params: Record<string, string>): string {
    // 排序并拼接 (排除 sign 和空值)
    const sortedKeys = Object.keys(params)
      .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== '')
      .sort();

    const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('');

    if (this.config.privateKey) {
      // RSA 签名
      const sign = crypto.createSign('RSA-SHA1');
      sign.update(signStr);
      return sign.sign(this.config.privateKey, 'base64');
    } else {
      // MD5 签名
      const signContent = signStr + this.config.apiKey;
      return crypto.createHash('md5').update(signContent, 'utf8').digest('hex').toUpperCase();
    }
  }

  /**
   * 验签
   */
  private verifySign(params: Record<string, string>, sign: string): boolean {
    // 排序并拼接
    const sortedKeys = Object.keys(params)
      .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== '')
      .sort();

    const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('');

    if (this.config.publicKey) {
      // RSA 验签
      const verify = crypto.createVerify('RSA-SHA1');
      verify.update(signStr);
      return verify.verify(this.config.publicKey, sign, 'base64');
    } else {
      // MD5 验签
      const signContent = signStr + this.config.apiKey;
      const calculatedSign = crypto.createHash('md5').update(signContent, 'utf8').digest('hex').toUpperCase();
      return sign === calculatedSign;
    }
  }

  /**
   * 生成随机字符串
   */
  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 生成二维码
   */
  private async generateQRCode(content: string): Promise<string> {
    try {
      return await qrcode.toDataURL(content, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch {
      return '';
    }
  }

  /**
   * 解析通联日期格式 (yyyyMMddHHmmss)
   */
  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr || dateStr.length !== 14) {
      return undefined;
    }
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(dateStr.substring(8, 10));
    const minute = parseInt(dateStr.substring(10, 12));
    const second = parseInt(dateStr.substring(12, 14));
    return new Date(year, month, day, hour, minute, second);
  }
}

export default new AllinpayChannel();
