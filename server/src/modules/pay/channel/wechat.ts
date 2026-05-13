/**
 * DGKJ 支付平台 - 微信支付通道实现
 * 
 * 支持: Native扫码支付、JSAPI支付、APP支付、H5支付、小程序支付
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

export class WechatPayChannel implements IPaymentChannel {
  readonly channelCode = ChannelCode.WECHAT;
  readonly channelName = '微信支付';
  readonly supportedPayWays: PayWay[] = [
    PayWay.WX_NATIVE,
    PayWay.WX_JSAPI,
    PayWay.WX_APP,
    PayWay.WX_H5,
    PayWay.WX_LITE,
  ];

  private config: ChannelConfig = {
    code: '',
    name: '',
    appId: '',
    appSecret: '',
    mchId: '',
    apiKey: '',
  };

  // 微信支付 API 地址
  private getBaseUrl(): string {
    return this.config.sandbox 
      ? 'https://api.mch.weixin.qq.com/sandboxnew'
      : 'https://api.mch.weixin.qq.com';
  }

  initialize(config: ChannelConfig): void {
    this.config = {
      code: ChannelCode.WECHAT,
      name: '微信支付',
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
      const apiUrl = this.getBaseUrl();
      let payUrl = '';
      let qrCode = '';
      let jsapiParams: Record<string, any> | undefined;
      let appParams: Record<string, any> | undefined;
      let h5Url = '';

      // 根据支付方式选择不同的 API
      switch (request.payWay) {
        case PayWay.WX_NATIVE:
          // Native扫码支付
          const nativeResult = await this.nativePay(request);
          payUrl = nativeResult.codeUrl || '';
          qrCode = await this.generateQRCode(payUrl);
          break;

        case PayWay.WX_JSAPI:
          // JSAPI支付
          if (!request.openId) {
            return {
              success: false,
              errorCode: 'MISSING_OPENID',
              errorMsg: 'JSAPI支付需要传入openId',
            };
          }
          jsapiParams = await this.jsapiPay(request);
          break;

        case PayWay.WX_APP:
          // APP支付
          appParams = await this.appPay(request);
          break;

        case PayWay.WX_H5:
          // H5支付
          h5Url = await this.h5Pay(request);
          break;

        case PayWay.WX_LITE:
          // 小程序支付 (与JSAPI相同)
          if (!request.openId) {
            return {
              success: false,
              errorCode: 'MISSING_OPENID',
              errorMsg: '小程序支付需要传入openId',
            };
          }
          jsapiParams = await this.jsapiPay(request);
          break;

        default:
          return {
            success: false,
            errorCode: 'UNSUPPORTED_PAY_WAY',
            errorMsg: `不支持的支付方式: ${request.payWay}`,
          };
      }

      return {
        success: true,
        orderNo: request.orderNo,
        payUrl,
        qrCode,
        jsapiParams,
        appParams,
        h5Url,
        expireTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时过期
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
   * Native扫码支付
   */
  private async nativePay(request: UnifiedPayRequest): Promise<{ codeUrl: string }> {
    const url = `${this.getBaseUrl()}/pay/unifiedorder`;
    
    const params = await this.buildUnifiedOrderParams({
      tradeType: 'NATIVE',
      orderNo: request.orderNo,
      amount: request.amount,
      description: request.subject,
      notifyUrl: request.notifyUrl,
      clientIp: request.clientIp,
      attach: request.attach,
    });

    const response = await this.requestWithCert(url, params);
    
    if (response.return_code === 'SUCCESS' && response.result_code === 'SUCCESS') {
      return { codeUrl: response.code_url };
    } else {
      throw new Error(response.err_code_des || response.return_msg || 'Native支付失败');
    }
  }

  /**
   * JSAPI支付
   */
  private async jsapiPay(request: UnifiedPayRequest): Promise<Record<string, any>> {
    const url = `${this.getBaseUrl()}/pay/unifiedorder`;
    
    const params = await this.buildUnifiedOrderParams({
      tradeType: 'JSAPI',
      orderNo: request.orderNo,
      amount: request.amount,
      description: request.subject,
      notifyUrl: request.notifyUrl,
      clientIp: request.clientIp,
      attach: request.attach,
      openId: request.openId,
    });

    const response = await this.requestWithCert(url, params);
    
    if (response.return_code === 'SUCCESS' && response.result_code === 'SUCCESS') {
      // 生成调起支付的参数
      const timeStamp = Math.floor(Date.now() / 1000).toString();
      const nonceStr = this.generateNonce();
      const packageStr = `prepay_id=${response.prepay_id}`;
      
      const signParams = {
        appId: this.config.appId,
        timeStamp,
        nonceStr,
        package: packageStr,
        signType: 'RSA',
      };
      
      const paySign = this.sign(signParams, 'RSA');

      return {
        appId: this.config.appId,
        timeStamp,
        nonceStr,
        package: packageStr,
        signType: 'RSA',
        paySign,
      };
    } else {
      throw new Error(response.err_code_des || 'JSAPI支付失败');
    }
  }

  /**
   * APP支付
   */
  private async appPay(request: UnifiedPayRequest): Promise<Record<string, any>> {
    const url = `${this.getBaseUrl()}/pay/unifiedorder`;
    
    const params = await this.buildUnifiedOrderParams({
      tradeType: 'APP',
      orderNo: request.orderNo,
      amount: request.amount,
      description: request.subject,
      notifyUrl: request.notifyUrl,
      clientIp: request.clientIp,
      attach: request.attach,
    });

    const response = await this.requestWithCert(url, params);
    
    if (response.return_code === 'SUCCESS' && response.result_code === 'SUCCESS') {
      const timeStamp = Math.floor(Date.now() / 1000).toString();
      const nonceStr = this.generateNonce();
      const packageStr = `Sign=WXPay`;
      
      const signParams = {
        appid: this.config.appId,
        partnerid: this.config.mchId,
        prepayid: response.prepay_id,
        package: packageStr,
        nonceStr,
        timestamp: timeStamp,
      };
      
      const sign = this.sign(signParams, 'MD5');

      return {
        appid: this.config.appId,
        partnerid: this.config.mchId,
        prepayid: response.prepay_id,
        package: packageStr,
        noncestr: nonceStr,
        timestamp: timeStamp,
        sign,
      };
    } else {
      throw new Error(response.err_code_des || 'APP支付失败');
    }
  }

  /**
   * H5支付
   */
  private async h5Pay(request: UnifiedPayRequest): Promise<string> {
    const url = `${this.getBaseUrl()}/pay/unifiedorder`;
    
    const params = await this.buildUnifiedOrderParams({
      tradeType: 'MWEB',
      orderNo: request.orderNo,
      amount: request.amount,
      description: request.subject,
      notifyUrl: request.notifyUrl,
      clientIp: request.clientIp,
      attach: request.attach,
      sceneInfo: request.sceneInfo,
    });

    const response = await this.requestWithCert(url, params);
    
    if (response.return_code === 'SUCCESS' && response.result_code === 'SUCCESS') {
      return response.mweb_url;
    } else {
      throw new Error(response.err_code_des || 'H5支付失败');
    }
  }

  /**
   * 查询订单
   */
  async query(request: UnifiedQueryRequest): Promise<UnifiedQueryResponse> {
    try {
      const url = `${this.getBaseUrl()}/pay/orderquery`;
      
      const params: Record<string, string> = {
        appid: this.config.appId,
        mch_id: this.config.mchId,
        out_trade_no: request.orderNo,
        nonce_str: this.generateNonce(),
      };
      params.sign = this.sign(params, 'MD5');

      const response = await this.requestWithCert(url, params);

      if (response.return_code !== 'SUCCESS') {
        return {
          success: false,
          errorCode: response.return_code,
          errorMsg: response.return_msg,
          status: PayStatus.FAILED,
        };
      }

      let status: PayStatus = PayStatus.PENDING;
      switch (response.trade_state) {
        case 'SUCCESS':
          status = PayStatus.SUCCESS;
          break;
        case 'REFUND':
          status = PayStatus.REFUNDING;
          break;
        case 'NOTPAY':
        case 'USERPAYING':
          status = PayStatus.PENDING;
          break;
        case 'CLOSED':
          status = PayStatus.CLOSED;
          break;
        case 'PAYERROR':
        default:
          status = PayStatus.FAILED;
          break;
      }

      return {
        success: true,
        status,
        channelOrderNo: response.transaction_id,
        paidTime: response.time_end ? new Date(response.time_end) : undefined,
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
      const url = `${this.getBaseUrl()}/secapi/pay/refund`;
      
      const params: Record<string, string> = {
        appid: this.config.appId,
        mch_id: this.config.mchId,
        out_refund_no: request.refundNo,
        out_trade_no: request.orderNo,
        total_fee: request.refundAmount.toString(),
        refund_fee: request.refundAmount.toString(),
        refund_desc: request.reason || '用户申请退款',
        nonce_str: this.generateNonce(),
      };
      params.sign = this.sign(params, 'MD5');

      const response = await this.requestWithCert(url, params);

      if (response.return_code === 'SUCCESS' && response.result_code === 'SUCCESS') {
        return {
          success: true,
          refundNo: request.refundNo,
          channelRefundNo: response.refund_id,
          status: RefundStatus.SUCCESS,
          refundAmount: parseInt(response.refund_fee),
          refundTime: new Date(),
        };
      } else {
        return {
          success: false,
          errorCode: response.err_code || 'REFUND_FAILED',
          errorMsg: response.err_code_des || response.return_msg || '退款失败',
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
   * 转账 (企业付款到零钱)
   */
  async transfer(request: UnifiedTransferRequest): Promise<UnifiedTransferResponse> {
    try {
      if (request.accountType !== 'wechat_openid') {
        return {
          success: false,
          errorCode: 'UNSUPPORTED_ACCOUNT_TYPE',
          errorMsg: '微信转账只支持 openid 类型账户',
          status: 'failed' as any,
        };
      }

      const url = `${this.getBaseUrl()}/mmpaymkttransfers/promotion/transfers`;
      
      const params: Record<string, string> = {
        mch_appid: this.config.appId,
        mchid: this.config.mchId,
        partner_trade_no: request.transferNo,
        openid: request.payeeAccount,
        check_name: 'FORCE_CHECK',
        re_user_name: request.payeeName,
        amount: request.amount.toString(),
        desc: request.remark || '转账',
        spbill_create_ip: '127.0.0.1',
        nonce_str: this.generateNonce(),
      };
      params.sign = this.sign(params, 'MD5');

      const response = await this.requestWithCert(url, params);

      if (response.return_code === 'SUCCESS' && response.result_code === 'SUCCESS') {
        return {
          success: true,
          transferNo: request.transferNo,
          channelTransferNo: response.payment_no,
          status: 'success' as any,
        };
      } else {
        return {
          success: false,
          errorCode: response.err_code || 'TRANSFER_FAILED',
          errorMsg: response.err_code_des || response.return_msg || '转账失败',
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
      // 微信回调可能是 XML 或 JSON
      let parsedData: Record<string, string>;
      
      if (typeof data === 'string') {
        if (data.includes('<xml')) {
          parsedData = await this.parseXml(data);
        } else {
          parsedData = JSON.parse(data);
        }
      } else {
        parsedData = data;
      }

      // 验证签名
      const sign = parsedData.sign;
      if (!sign) {
        return { success: false, errorMsg: '缺少签名' };
      }

      // 移除 sign 字段后重新计算签名
      const signData = { ...parsedData };
      delete signData.sign;
      const calculatedSign = this.sign(signData, 'MD5');

      if (sign !== calculatedSign) {
        return { success: false, errorMsg: '签名验证失败' };
      }

      if (parsedData.return_code !== 'SUCCESS') {
        return { success: false, errorMsg: parsedData.return_msg };
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
    let parsedData: Record<string, string>;
    
    if (typeof data === 'string') {
      if (data.includes('<xml')) {
        parsedData = await this.parseXml(data);
      } else {
        parsedData = JSON.parse(data);
      }
    } else {
      parsedData = data;
    }

    // 确定通知类型
    let notifyType: 'pay' | 'refund' | 'transfer' = 'pay';
    if (parsedData.return_code === 'SUCCESS' && parsedData.refund_status) {
      notifyType = 'refund';
    }

    // 解析状态
    let status: PayStatus | RefundStatus;
    if (notifyType === 'refund') {
      switch (parsedData.refund_status) {
        case 'SUCCESS':
          status = RefundStatus.SUCCESS;
          break;
        case 'REFUNDDECLINE':
        case 'CHANGE':
          status = RefundStatus.FAILED;
          break;
        default:
          status = RefundStatus.PROCESSING;
      }
    } else {
      switch (parsedData.trade_state) {
        case 'SUCCESS':
          status = PayStatus.SUCCESS;
          break;
        case 'REFUND':
          status = PayStatus.REFUNDING;
          break;
        case 'CLOSED':
          status = PayStatus.CLOSED;
          break;
        default:
          status = PayStatus.PENDING;
      }
    }

    return {
      channelCode: ChannelCode.WECHAT,
      notifyType,
      orderNo: parsedData.out_trade_no || parsedData.out_refund_no,
      channelOrderNo: parsedData.transaction_id || parsedData.refund_id,
      status,
      amount: parseInt(parsedData.total_fee || parsedData.refund_fee || '0'),
      paidAmount: parsedData.cash_fee ? parseInt(parsedData.cash_fee) : undefined,
      paidTime: parsedData.time_end ? new Date(parsedData.time_end) : undefined,
      attach: parsedData.attach,
      rawData: parsedData,
    };
  }

  /**
   * 响应回调成功
   */
  responseCallbackSuccess(): string {
    return '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>';
  }

  /**
   * 响应回调失败
   */
  responseCallbackFail(): string {
    return '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[ERROR]]></return_msg></xml>';
  }

  // ==================== 私有方法 ====================

  /**
   * 构建统一下单参数
   */
  private async buildUnifiedOrderParams(params: {
    tradeType: string;
    orderNo: string;
    amount: number;
    description: string;
    notifyUrl: string;
    clientIp?: string;
    attach?: string;
    openId?: string;
    sceneInfo?: any;
  }): Promise<Record<string, string>> {
    const data: Record<string, string> = {
      appid: this.config.appId,
      mch_id: this.config.mchId,
      nonce_str: this.generateNonce(),
      body: params.description,
      out_trade_no: params.orderNo,
      total_fee: params.amount.toString(),
      spbill_create_ip: params.clientIp || '127.0.0.1',
      notify_url: params.notifyUrl,
      trade_type: params.tradeType,
    };

    if (params.openId) {
      data.openid = params.openId;
    }

    if (params.attach) {
      data.attach = params.attach;
    }

    if (params.sceneInfo) {
      data.scene_info = JSON.stringify(params.sceneInfo);
    }

    data.sign = this.sign(data, 'MD5');
    return data;
  }

  /**
   * 签名
   */
  private sign(params: Record<string, string | number>, signType: 'MD5' | 'HMAC-SHA256' | 'RSA'): string {
    // 排序并拼接
    const sortedKeys = Object.keys(params).sort();
    const signStr = sortedKeys
      .filter((k) => params[k] !== '' && params[k] !== undefined && params[k] !== null)
      .map((k) => `${k}=${params[k]}`)
      .join('&');

    const signContent = `${signStr}&key=${this.config.apiKey}`;

    if (signType === 'RSA' && this.config.privateKey) {
      // RSA 签名
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signContent);
      return sign.sign(this.config.privateKey, 'base64');
    } else if (signType === 'HMAC-SHA256') {
      // HMAC-SHA256 签名
      return crypto.createHmac('sha256', this.config.apiKey).update(signContent).digest('hex').toUpperCase();
    } else {
      // MD5 签名
      return crypto.createHash('md5').update(signContent, 'utf8').digest('hex').toUpperCase();
    }
  }

  /**
   * 发送带证书的请求
   */
  private async requestWithCert(
    url: string,
    params: Record<string, string>
  ): Promise<Record<string, string>> {
    try {
      // 将参数转换为 XML
      const xmlData = this.buildXml(params);

      const response = await axios.post(url, xmlData, {
        headers: {
          'Content-Type': 'text/xml;charset=utf-8',
        },
        timeout: (this.config.timeout || 30) * 1000,
        // HTTPS 证书验证 (生产环境应配置为 true)
        httpsAgent: undefined, // 需要配置证书
      });

      // 解析 XML 响应
      return await this.parseXml(response.data);
    } catch (error: any) {
      if (error.response) {
        return await this.parseXml(error.response.data);
      }
      throw error;
    }
  }

  /**
   * 构建 XML
   */
  private buildXml(params: Record<string, string>): string {
    let xml = '<xml>';
    for (const [key, value] of Object.entries(params)) {
      xml += `<${key}><![CDATA[${value}]]></${key}>`;
    }
    xml += '</xml>';
    return xml;
  }

  /**
   * 解析 XML
   */
  private async parseXml(xml: string): Promise<Record<string, string>> {
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);
    
    // 扁平化结果
    const flatten = (obj: any): Record<string, string> => {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(obj.xml || obj)) {
        result[key] = Array.isArray(value) ? value[0] : value;
      }
      return result;
    };
    
    return flatten(result);
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
}

export default new WechatPayChannel();
