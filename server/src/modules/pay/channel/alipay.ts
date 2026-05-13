/**
 * DGKJ 支付平台 - 支付宝支付通道实现
 * 
 * 支持: 扫码支付、JSAPI支付、APP支付、WAP支付
 */

import axios from 'axios';
import * as crypto from 'crypto';
import * as qs from 'querystring';
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

export class AlipayChannel implements IPaymentChannel {
  readonly channelCode = ChannelCode.ALIPAY;
  readonly channelName = '支付宝';
  readonly supportedPayWays: PayWay[] = [
    PayWay.ALI_QR,
    PayWay.ALI_JSAPI,
    PayWay.ALI_APP,
    PayWay.ALI_WAP,
  ];

  private config: ChannelConfig = {
    code: '',
    name: '',
    appId: '',
    appSecret: '',
    mchId: '',
    apiKey: '',
  };

  // 支付宝网关地址
  private getGateWay(): string {
    return this.config.sandbox
      ? 'https://openapi.alipaydev.com/gateway.do'
      : 'https://openapi.alipay.com/gateway.do';
  }

  initialize(config: ChannelConfig): void {
    this.config = {
      code: ChannelCode.ALIPAY,
      name: '支付宝',
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
      const bizContent: Record<string, any> = {
        out_trade_no: request.orderNo,
        total_amount: (request.amount / 100).toFixed(2), // 转换为元
        subject: request.subject,
        product_code: 'FAST_INSTANT_TRADE_PAY',
      };

      let method = '';
      let payUrl = '';
      let qrCode = '';
      let jsapiParams: Record<string, any> | undefined;
      let appParams: Record<string, any> | undefined;
      let h5Url = '';

      switch (request.payWay) {
        case PayWay.ALI_QR:
          // 扫码支付
          method = 'alipay.trade.precreate';
          bizContent.product_code = 'FAST_INSTANT_TRADE_PAY';
          const qrResult = await this.execute('alipay.trade.precreate', bizContent);
          if (qrResult.code === '10000') {
            payUrl = qrResult.qr_code;
            qrCode = await this.generateQRCode(qrResult.qr_code);
          } else {
            return {
              success: false,
              errorCode: qrResult.code,
              errorMsg: qrResult.sub_msg || qrResult.msg,
            };
          }
          break;

        case PayWay.ALI_JSAPI:
          // JSAPI支付
          if (!request.buyerId) {
            return {
              success: false,
              errorCode: 'MISSING_BUYER_ID',
              errorMsg: 'JSAPI支付需要传入buyerId(支付宝用户ID)',
            };
          }
          method = 'alipay.trade.pay';
          bizContent.buyer_id = request.buyerId;
          bizContent.product_code = 'JSAPI_PAY';
          
          const jsapiResult = await this.execute('alipay.trade.pay', bizContent);
          if (jsapiResult.code === '10000') {
            jsapiParams = {
              tradeNO: jsapiResult.trade_no,
            };
          } else {
            return {
              success: false,
              errorCode: jsapiResult.code,
              errorMsg: jsapiResult.sub_msg || jsapiResult.msg,
            };
          }
          break;

        case PayWay.ALI_APP:
          // APP支付
          method = 'alipay.trade.app.pay';
          const appResult = await this.execute('alipay.trade.app.pay', {
            ...bizContent,
            product_code: 'QUICK_MSECURITY_PAY',
          });
          if (appResult.code === '10000') {
            appParams = {
              orderString: appResult.orderString,
            };
          } else {
            return {
              success: false,
              errorCode: appResult.code,
              errorMsg: appResult.sub_msg || appResult.msg,
            };
          }
          break;

        case PayWay.ALI_WAP:
          // WAP支付
          method = 'alipay.trade.wap.pay';
          bizContent.product_code = 'QUICK_WAP_WAY';
          if (request.returnUrl) {
            bizContent.return_url = request.returnUrl;
          }
          
          const wapResult = await this.execute('alipay.trade.wap.pay', bizContent);
          if (wapResult.code === '10000') {
            h5Url = this.buildForm(wapResult);
          } else {
            return {
              success: false,
              errorCode: wapResult.code,
              errorMsg: wapResult.sub_msg || wapResult.msg,
            };
          }
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
        expireTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
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
      const bizContent = {
        out_trade_no: request.orderNo,
        ...(request.channelOrderNo && { trade_no: request.channelOrderNo }),
      };

      const result = await this.execute('alipay.trade.query', bizContent);

      if (result.code !== '10000') {
        return {
          success: false,
          errorCode: result.code,
          errorMsg: result.sub_msg || result.msg,
          status: PayStatus.PENDING,
        };
      }

      let status: PayStatus;
      switch (result.trade_status) {
        case 'WAIT_BUYER_PAY':
          status = PayStatus.PENDING;
          break;
        case 'TRADE_CLOSED':
          status = PayStatus.CLOSED;
          break;
        case 'TRADE_SUCCESS':
        case 'TRADE_FINISHED':
          status = PayStatus.SUCCESS;
          break;
        default:
          status = PayStatus.PENDING;
      }

      return {
        success: true,
        status,
        channelOrderNo: result.trade_no,
        paidTime: result.pay_time ? new Date(result.pay_time) : undefined,
        rawResponse: result,
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
      const bizContent = {
        trade_no: request.channelOrderNo,
        out_trade_no: request.orderNo,
        refund_amount: (request.refundAmount / 100).toFixed(2),
        refund_reason: request.reason || '用户申请退款',
        out_request_no: request.refundNo,
      };

      const result = await this.execute('alipay.trade.refund', bizContent);

      if (result.code === '10000') {
        return {
          success: true,
          refundNo: request.refundNo,
          channelRefundNo: result.trade_no,
          status: RefundStatus.SUCCESS,
          refundAmount: Math.round(parseFloat(result.refund_fee) * 100),
          refundTime: new Date(),
        };
      } else {
        return {
          success: false,
          errorCode: result.code,
          errorMsg: result.sub_msg || result.msg,
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
   * 转账
   */
  async transfer(request: UnifiedTransferRequest): Promise<UnifiedTransferResponse> {
    try {
      if (request.accountType !== 'alipay_id') {
        return {
          success: false,
          errorCode: 'UNSUPPORTED_ACCOUNT_TYPE',
          errorMsg: '支付宝转账只支持 alipay_id 类型账户',
          status: 'failed' as any,
        };
      }

      const bizContent = {
        out_biz_no: request.transferNo,
        product_code: 'TRANS_ACCOUNT_NO_PWD',
        amount: (request.amount / 100).toFixed(2),
        payee_account: request.payeeAccount,
        payee_type: 'ALIPAY_LOGONID',
        payer_show_name: 'DGKJ支付平台',
        payee_real_name: request.payeeName,
        remark: request.remark || '转账',
      };

      const result = await this.execute('alipay.fund.trans.toaccount.transfer', bizContent);

      if (result.code === '10000') {
        return {
          success: true,
          transferNo: request.transferNo,
          channelTransferNo: result.order_id,
          status: 'success' as any,
        };
      } else {
        return {
          success: false,
          errorCode: result.code,
          errorMsg: result.sub_msg || result.msg,
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
      // 支付宝回调数据格式: app_id=xxx&method=xxx&sign_type=xxx&sign=xxx&...
      const params = typeof data === 'string' ? qs.parse(data) : data;
      
      const { sign, sign_type, ...signParams } = params;

      if (!sign) {
        return { success: false, errorMsg: '缺少签名' };
      }

      // 验证签名
      const signStr = this.getSignContent(signParams);
      const isValid = this.verifySign(signStr, sign, sign_type || 'RSA2');

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
    const params = typeof data === 'string' ? qs.parse(data) : data;

    // 确定通知类型
    let notifyType: 'pay' | 'refund' | 'transfer' = 'pay';
    if (params.notify_type === 'trade_refund') {
      notifyType = 'refund';
    }

    // 解析状态
    let status: PayStatus | RefundStatus;
    switch (params.trade_status) {
      case 'TRADE_SUCCESS':
      case 'TRADE_FINISHED':
        status = PayStatus.SUCCESS;
        break;
      case 'TRADE_CLOSED':
        status = PayStatus.CLOSED;
        break;
      case 'WAIT_BUYER_PAY':
        status = PayStatus.PENDING;
        break;
      case 'REFUND_SUCCESS':
        status = RefundStatus.SUCCESS;
        break;
      default:
        status = PayStatus.PENDING;
    }

    return {
      channelCode: ChannelCode.ALIPAY,
      notifyType,
      orderNo: params.out_trade_no,
      channelOrderNo: params.trade_no,
      status,
      amount: Math.round(parseFloat(params.total_amount || params.total_fee || '0') * 100),
      paidAmount: params.receipt_amount ? Math.round(parseFloat(params.receipt_amount) * 100) : undefined,
      paidTime: params.gmt_payment ? new Date(params.gmt_payment) : undefined,
      attach: params.passback_params,
      rawData: params,
    };
  }

  /**
   * 响应回调成功
   */
  responseCallbackSuccess(): string {
    return 'success';
  }

  /**
   * 响应回调失败
   */
  responseCallbackFail(): string {
    return 'fail';
  }

  // ==================== 私有方法 ====================

  /**
   * 执行支付宝 API
   */
  private async execute(method: string, bizContent: Record<string, any>): Promise<any> {
    const params: Record<string, string> = {
      app_id: this.config.appId!,
      method,
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: this.formatDate(new Date()),
      version: '1.0',
      biz_content: JSON.stringify(bizContent),
    };

    // 签名
    params.sign = this.sign(this.getSignContent(params));

    try {
      const response = await axios.post(this.getGateWay(), qs.stringify(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: (this.config.timeout || 30) * 1000,
      });

      const responseData = qs.parse(response.data);
      const responseKey = method.replace(/\./g, '_') + '_response';
      
      return responseData[responseKey] || {};
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * 签名
   */
  private sign(signStr: string): string {
    if (!this.config.privateKey) {
      throw new Error('缺少私钥配置');
    }

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signStr);
    return sign.sign(this.config.privateKey, 'base64');
  }

  /**
   * 验签
   */
  private verifySign(signStr: string, sign: string, signType: string): boolean {
    if (!this.config.publicKey) {
      throw new Error('缺少公钥配置');
    }

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(signStr);
    return verify.verify(this.config.publicKey, sign, 'base64');
  }

  /**
   * 获取签名字符串
   */
  private getSignContent(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const pairs: string[] = [];
    
    for (const key of sortedKeys) {
      const value = params[key];
      if (value !== undefined && value !== '' && value !== null) {
        pairs.push(`${key}=${value}`);
      }
    }
    
    return pairs.join('&');
  }

  /**
   * 构建表单 (用于 WAP 支付)
   */
  private buildForm(htmlStr: string): string {
    // 支付宝 WAP 支付返回的是一段 HTML，提取 form action
    const match = htmlStr.match(/action="([^"]+)"/);
    return match ? match[1] : htmlStr;
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

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
}

export default new AlipayChannel();
