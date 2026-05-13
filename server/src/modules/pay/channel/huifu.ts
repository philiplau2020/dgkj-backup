/**
 * DGKJ 支付平台 - 汇付斗拱支付通道实现
 *
 * 支持: 快捷支付(绑卡+支付)、快捷支付页面版
 * 文档: https://paas.huifu.com/open/doc/api/#/kuaijie/api_kjym
 */

import axios from 'axios';
import * as crypto from 'crypto';
import * as cryptoJS from 'crypto-js';
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

export class HuifuChannel implements IPaymentChannel {
  readonly channelCode = ChannelCode.HUIFU;
  readonly channelName = '汇付斗拱';

  readonly supportedPayWays: PayWay[] = [
    PayWay.HUIFU_QUICK,
    PayWay.HUIFU_PAGE,
  ];

  private config: ChannelConfig = {
    code: '',
    name: '',
    appId: '',
    appSecret: '',
    mchId: '',
    apiKey: '',
  };

  // 汇付网关地址
  private getBaseUrl(): string {
    return this.config.sandbox
      ? 'https://paas.huifu.com'
      : 'https://paas.huifu.com';
  }

  // 商户信息
  private sysId: string = '';
  private productId: string = '';
  private privateKey: string = '';
  private publicKey: string = '';

  initialize(config: ChannelConfig): void {
    this.config = {
      code: ChannelCode.HUIFU,
      name: '汇付斗拱',
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

    // 从 extra 中获取汇付专用参数
    this.sysId = config.extra?.['sysId'] || '';
    this.productId = config.extra?.['productId'] || '';
    this.privateKey = config.privateKey || '';
    this.publicKey = config.publicKey || '';
  }

  /**
   * 执行支付
   * 汇付快捷支付支持两种模式:
   * 1. 页面版: 一次调用完成绑卡+支付
   * 2. 纯接口: 先绑卡，再支付 (两阶段)
   */
  async pay(request: UnifiedPayRequest): Promise<UnifiedPayResponse> {
    try {
      if (request.payWay === PayWay.HUIFU_PAGE) {
        // 页面版 - 跳转汇付页面
        return await this.payByPage(request);
      } else {
        // 纯接口模式 - 返回需要前端配合的支付参数
        return await this.payByApi(request);
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
   * 页面版快捷支付
   * 返回跳转地址，前端跳转到汇付页面完成支付
   */
  private async payByPage(request: UnifiedPayRequest): Promise<UnifiedPayResponse> {
    const orderId = request.orderNo;
    const merHildId = request.attach || ''; // 商户用户ID

    // 构建页面支付请求
    const params = {
      version: '1.0',
      cmd_id: '2031', // 快捷支付页面版命令码
      sys_id: this.sysId,
      product_id: this.productId,
      req_sn: orderId,
      mer_hild_id: merHildId,
      user_id: request.attach || orderId,
      order_amt: (request.amount / 100).toFixed(2), // 金额元
      order_currency: 'CNY',
      subject: request.subject.substring(0, 100),
      notify_url: request.notifyUrl,
      return_url: request.returnUrl || '',
      time_stamp: this.formatDate(new Date()),
    };

    // 签名
    params['sign'] = this.sign(params);

    // 构建跳转URL
    const payUrl = `${this.getBaseUrl()}/gateway?${this.buildQueryString(params)}`;

    return {
      success: true,
      orderNo: request.orderNo,
      payUrl,
      h5Url: payUrl,
      expireTime: new Date(Date.now() + 30 * 60 * 1000), // 30分钟
    };
  }

  /**
   * 纯接口快捷支付
   * 返回支付页面参数，前端调起汇付组件
   */
  private async payByApi(request: UnifiedPayRequest): Promise<UnifiedPayResponse> {
    // 返回前端需要的数据
    return {
      success: true,
      orderNo: request.orderNo,
      jsapiParams: {
        sysId: this.sysId,
        productId: this.productId,
        orderId: request.orderNo,
        amount: request.amount,
        subject: request.subject,
        notifyUrl: request.notifyUrl,
        returnUrl: request.returnUrl,
      },
    };
  }

  /**
   * 快捷绑卡申请
   * 用户输入银行卡信息，发起绑卡申请
   */
  async bindCardApply(params: {
    orderId: string;
    userId: string;
    cardNo: string; // 加密
    cardName: string; // 加密
    certId: string; // 加密
    mobile: string; // 加密
    cvv2?: string; // 加密，信用卡
    expiration?: string; // 加密，信用卡 MMYY
  }): Promise<{
    success: boolean;
    errorCode?: string;
    errorMsg?: string;
    orderId?: string;
    custId?: string;
    tokenNo?: string;
  }> {
    try {
      const requestParams = {
        version: '1.0',
        cmd_id: '3011', // 快捷绑卡申请
        sys_id: this.sysId,
        product_id: this.productId,
        req_sn: params.orderId,
        user_id: params.userId,
        card_id: params.cardNo,
        card_name: params.cardName,
        cert_id: params.certId,
        card_mp: params.mobile,
        dc_type: params.cvv2 ? 'C' : 'D',
        vip_code: params.cvv2 || '',
        expiration: params.expiration || '',
        sign_type: 'RSA',
      };

      requestParams['sign'] = this.sign(requestParams);

      const response = await this.request('/gateway', requestParams);

      if (response.resp_code === '00000000') {
        return {
          success: true,
          orderId: params.orderId,
          custId: response.cust_id,
          tokenNo: response.token_no,
        };
      } else {
        return {
          success: false,
          errorCode: response.resp_code,
          errorMsg: response.resp_desc,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'BIND_CARD_FAILED',
        errorMsg: error.message,
      };
    }
  }

  /**
   * 快捷绑卡确认
   * 用户输入验证码完成绑卡
   */
  async bindCardConfirm(params: {
    orderId: string;
    verifyCode: string;
  }): Promise<{
    success: boolean;
    errorCode?: string;
    errorMsg?: string;
    custId?: string;
    tokenNo?: string;
  }> {
    try {
      const requestParams = {
        version: '1.0',
        cmd_id: '3012', // 快捷绑卡确认
        sys_id: this.sysId,
        product_id: this.productId,
        req_sn: params.orderId,
        verify_code: params.verifyCode,
        sign_type: 'RSA',
      };

      requestParams['sign'] = this.sign(requestParams);

      const response = await this.request('/gateway', requestParams);

      if (response.resp_code === '00000000' && response.trans_status === 'S') {
        return {
          success: true,
          custId: response.cust_id,
          tokenNo: response.token_no,
        };
      } else {
        return {
          success: false,
          errorCode: response.resp_code || response.trans_status,
          errorMsg: response.resp_desc || '绑卡失败',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'BIND_CARD_FAILED',
        errorMsg: error.message,
      };
    }
  }

  /**
   * 快捷支付申请
   * 绑定卡后发起支付申请
   */
  async quickPayApply(params: {
    orderId: string;
    userId: string;
    custId: string;
    tokenNo: string;
    amount: number;
    notifyUrl: string;
  }): Promise<{
    success: boolean;
    errorCode?: string;
    errorMsg?: string;
    avoidSmsFlag?: string; // 免短标签，如为3则无需确认
    reqSn?: string;
  }> {
    try {
      const requestParams = {
        version: '1.0',
        cmd_id: '3021', // 快捷支付申请
        sys_id: this.sysId,
        product_id: this.productId,
        req_sn: params.orderId,
        user_huifu_id: params.custId,
        card_bind_id: params.tokenNo,
        ord_amt: (params.amount / 100).toFixed(2),
        notify_url: params.notifyUrl,
        time_stamp: this.formatDate(new Date()),
        sign_type: 'RSA',
      };

      requestParams['sign'] = this.sign(requestParams);

      const response = await this.request('/gateway', requestParams);

      if (response.resp_code === '00000000') {
        return {
          success: true,
          avoidSmsFlag: response.avoid_sms_flag,
          reqSn: response.req_sn,
        };
      } else {
        return {
          success: false,
          errorCode: response.resp_code,
          errorMsg: response.resp_desc,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'PAY_APPLY_FAILED',
        errorMsg: error.message,
      };
    }
  }

  /**
   * 快捷支付确认
   * 输入验证码完成支付
   */
  async quickPayConfirm(params: {
    orderId: string;
    verifyCode: string;
  }): Promise<{
    success: boolean;
    errorCode?: string;
    errorMsg?: string;
    hfSeqId?: string;
    chnSeqId?: string;
  }> {
    try {
      const requestParams = {
        version: '1.0',
        cmd_id: '3022', // 快捷支付确认
        sys_id: this.sysId,
        product_id: this.productId,
        req_sn: params.orderId,
        verify_code: params.verifyCode,
        sign_type: 'RSA',
      };

      requestParams['sign'] = this.sign(requestParams);

      const response = await this.request('/gateway', requestParams);

      if (response.resp_code === '00000000') {
        return {
          success: true,
          hfSeqId: response.hf_seq_id,
          chnSeqId: response.chn_seq_id,
        };
      } else {
        return {
          success: false,
          errorCode: response.resp_code,
          errorMsg: response.resp_desc,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        errorCode: 'PAY_CONFIRM_FAILED',
        errorMsg: error.message,
      };
    }
  }

  /**
   * 查询订单
   */
  async query(request: UnifiedQueryRequest): Promise<UnifiedQueryResponse> {
    try {
      const params = {
        version: '1.0',
        cmd_id: '2021', // 线上交易查询
        sys_id: this.sysId,
        product_id: this.productId,
        req_sn: request.orderNo,
        req_date: this.formatDate(new Date()).substring(0, 8), // yyyyMMdd
        hf_seq_id: request.channelOrderNo || '',
        sign_type: 'RSA',
      };

      params['sign'] = this.sign(params);

      const response = await this.request('/gateway', params);

      if (response.resp_code !== '00000000') {
        return {
          success: false,
          errorCode: response.resp_code,
          errorMsg: response.resp_desc,
          status: PayStatus.PENDING,
        };
      }

      let status: PayStatus;
      const transStat = response.trans_stat;
      switch (transStat) {
        case 'S':
          status = PayStatus.SUCCESS;
          break;
        case 'F':
          status = PayStatus.FAILED;
          break;
        case 'I':
        case 'P':
        default:
          status = PayStatus.PENDING;
          break;
      }

      return {
        success: true,
        status,
        channelOrderNo: response.hf_seq_id,
        paidTime: response.finish_time ? new Date(response.finish_time) : undefined,
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
      const params = {
        version: '1.0',
        cmd_id: '4021', // 线上交易退款
        sys_id: this.sysId,
        product_id: this.productId,
        req_sn: request.refundNo,
        org_req_date: new Date().toISOString().substring(0, 10).replace(/-/g, ''),
        org_req_seq_id: request.orderNo,
        org_hf_seq_id: request.channelOrderNo || '',
        ord_amt: (request.refundAmount / 100).toFixed(2),
        reason: request.reason || '用户申请退款',
        sign_type: 'RSA',
      };

      params['sign'] = this.sign(params);

      const response = await this.request('/gateway', params);

      if (response.resp_code === '00000000') {
        return {
          success: true,
          refundNo: request.refundNo,
          channelRefundNo: response.hf_seq_id,
          status: RefundStatus.SUCCESS,
          refundAmount: request.refundAmount,
          refundTime: new Date(),
        };
      } else {
        return {
          success: false,
          errorCode: response.resp_code,
          errorMsg: response.resp_desc,
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
   * 转账 (代付) - 汇付斗拱不支持，由商户侧处理
   */
  async transfer(request: UnifiedTransferRequest): Promise<UnifiedTransferResponse> {
    return {
      success: false,
      errorCode: 'UNSUPPORTED',
      errorMsg: '汇付斗拱通道暂不支持转账功能',
      status: 'failed' as any,
    };
  }

  /**
   * 验证回调签名
   */
  async verifyCallback(data: any, headers: any): Promise<{ success: boolean; errorMsg?: string }> {
    try {
      const params = typeof data === 'string' ? JSON.parse(data) : data;

      const sign = params.sign;
      if (!sign) {
        return { success: false, errorMsg: '缺少签名' };
      }

      // 移除 sign 字段后验签
      const signData = { ...params };
      delete signData.sign;
      delete signData.sign_type;

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
    const params = typeof data === 'string' ? JSON.parse(data) : data;

    // 解析状态
    let status: PayStatus;
    const transStat = params.trans_stat;
    const notifyType = params.notify_type;

    if (notifyType === '2') {
      // 账务异步通知
      if (params.acct_stat === 'S') {
        status = PayStatus.SUCCESS;
      } else if (params.acct_stat === 'F') {
        status = PayStatus.FAILED;
      } else {
        status = PayStatus.PENDING;
      }
    } else {
      // 交易异步通知
      switch (transStat) {
        case 'S':
          status = PayStatus.SUCCESS;
          break;
        case 'F':
          status = PayStatus.FAILED;
          break;
        case 'I':
        case 'P':
        default:
          status = PayStatus.PENDING;
          break;
      }
    }

    return {
      channelCode: ChannelCode.HUIFU,
      notifyType: params.notify_type === 'refund' ? 'refund' : 'pay',
      orderNo: params.req_sn,
      channelOrderNo: params.hf_seq_id,
      status,
      amount: Math.round(parseFloat(params.ord_amt || '0') * 100),
      paidAmount: params.ord_amt ? Math.round(parseFloat(params.ord_amt) * 100) : undefined,
      paidTime: params.finish_time ? new Date(params.finish_time) : undefined,
      attach: params.mer_hild_id,
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
   * 发送请求
   */
  private async request(path: string, params: Record<string, string>): Promise<Record<string, any>> {
    try {
      const url = `${this.getBaseUrl()}${path}`;
      const response = await axios.post(url, JSON.stringify(params), {
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
        timeout: (this.config.timeout || 30) * 1000,
      });

      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * 签名
   */
  private sign(params: Record<string, string>): string {
    // 排序并拼接
    const sortedKeys = Object.keys(params)
      .filter((k) => k !== 'sign' && k !== 'sign_type' && params[k] !== undefined && params[k] !== '')
      .sort();

    const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');

    if (this.privateKey) {
      // RSA 签名
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signStr);
      return sign.sign(this.privateKey, 'base64');
    } else {
      // MD5 签名 (备用)
      const signContent = signStr + this.config.apiKey;
      return crypto.createHash('md5').update(signContent, 'utf8').digest('hex').toUpperCase();
    }
  }

  /**
   * 验签
   */
  private verifySign(params: Record<string, any>, sign: string): boolean {
    // 排序并拼接
    const sortedKeys = Object.keys(params)
      .filter((k) => k !== 'sign' && k !== 'sign_type' && params[k] !== undefined && params[k] !== '')
      .sort();

    const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');

    if (this.publicKey) {
      // RSA 验签
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(signStr);
      return verify.verify(this.publicKey, sign, 'base64');
    } else {
      // MD5 验签
      const signContent = signStr + this.config.apiKey;
      const calculatedSign = crypto.createHash('md5').update(signContent, 'utf8').digest('hex').toUpperCase();
      return sign === calculatedSign;
    }
  }

  /**
   * 加密银行卡信息 (使用汇付RSA公钥)
   */
  encryptCardInfo(cardNo: string): string {
    if (!this.publicKey) {
      throw new Error('缺少汇付公钥配置');
    }
    // RSA加密 - 实际使用时需要分段加密
    const encrypted = crypto.publicEncrypt(
      {
        key: this.publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(cardNo)
    );
    return encrypted.toString('base64');
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  /**
   * 构建查询字符串
   */
  private buildQueryString(params: Record<string, string>): string {
    return Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
  }
}

export default new HuifuChannel();
