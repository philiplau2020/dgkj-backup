/**
 * DGKJ Open Platform SDK - Node.js
 *
 * @example
 * ```bash
 * npm install dgkj-pay-sdk
 * ```
 *
 * @example
 * ```javascript
 * const DgkjPay = require('dgkj-pay-sdk');
 *
 * const client = new DgkjPay({
 *   appId: 'APPxxx',
 *   appKey: 'DGKJxxx',
 *   appSecret: 'your_secret',
 *   mchNo: 'Mxxx',
 *   baseUrl: 'https://api.dgkjpay.com', // 生产
 *   // baseUrl: 'https://sandbox-api.dgkjpay.com', // 沙箱
 * });
 *
 * // 发起支付
 * const result = await client.pay({
 *   payType: 'wx_native',
 *   amount: 100,
 *   subject: '测试商品',
 *   orderNo: 'ORD' + Date.now(),
 *   notifyUrl: 'https://your-domain.com/notify',
 * });
 *
 * // 查询订单
 * const order = await client.queryOrder(result.orderNo);
 *
 * // 申请退款
 * const refund = await client.refund({
 *   orderNo: result.orderNo,
 *   refundAmount: 100,
 *   refundReason: '用户取消',
 * });
 * ```
 */

const crypto = require('crypto');
const http = require('axios');

const DEFAULT_BASE_URL = 'https://api.dgkjpay.com';
const SANDBOX_BASE_URL = 'https://sandbox-api.dgkjpay.com';
const VERSION = '1.0.0';

/**
 * DGKJ 支付客户端
 */
class DgkjPayClient {
  constructor(options = {}) {
    if (!options.appId) throw new Error('appId is required');
    if (!options.appKey) throw new Error('appKey is required');
    if (!options.appSecret) throw new Error('appSecret is required');
    if (!options.mchNo) throw new Error('mchNo is required');

    this.appId = options.appId;
    this.appKey = options.appKey;
    this.appSecret = options.appSecret;
    this.mchNo = options.mchNo;
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.timeout = options.timeout || 30000;
    this.debug = options.debug || false;
    this.http = http.createInstance ? http.createInstance({
      baseURL: this.baseUrl,
      timeout: this.timeout,
    }) : http;
  }

  /**
   * 签名参数
   * @param {Object} params - 原始参数
   * @returns {Object} - 加上签名的参数
   */
  signParams(params = {}) {
    const timestamp = this.getTimestamp();
    const nonce = this.generateNonce();

    const allParams = {
      ...params,
      appKey: this.appKey,
      timestamp,
      nonce,
    };

    const sign = this.sign(allParams);
    return {
      ...allParams,
      sign,
      signType: 'HMAC-SHA256',
    };
  }

  /**
   * HMAC-SHA256 签名
   */
  sign(params) {
    const str = Object.keys(params)
      .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.appSecret)
      .update(str)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * 验签
   */
  verify(params, sign) {
    const expected = this.sign(params);
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(sign)
    );
  }

  /**
   * 生成时间戳 (yyyyMMddHHmmss)
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);
  }

  /**
   * 生成随机字符串
   */
  generateNonce(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  /**
   * 发送请求
   */
  async request(method, path, params = {}, data = null) {
    const url = `${this.baseUrl}${path}`;

    if (this.debug) {
      console.log(`[DgkjPay] ${method} ${url}`);
      console.log(`[DgkjPay] Params:`, params);
    }

    const signedParams = method === 'GET' ? this.signParams(params) : this.signParams({ ...data });
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Key': this.appKey,
        'X-Sign-Type': 'HMAC-SHA256',
        'X-Timestamp': signedParams.timestamp,
        'X-Nonce': signedParams.nonce,
        'User-Agent': `dgkj-pay-sdk-nodejs/${VERSION}`,
      },
      timeout: this.timeout,
    };

    if (method === 'GET') {
      config.params = signedParams;
    } else {
      config.data = signedParams;
    }

    const startTime = Date.now();
    try {
      const response = await this.http(config);
      const elapsed = Date.now() - startTime;

      if (this.debug) {
        console.log(`[DgkjPay] Response (${elapsed}ms):`, JSON.stringify(response.data, null, 2));
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new DgkjPayException(error.response.status, error.response.data);
      }
      throw new DgkjPayException(-1, { code: 'OP9001', message: error.message });
    }
  }

  // ==================== 支付接口 ====================

  /**
   * 发起支付
   * @param {Object} params
   * @param {string} params.payType - 支付方式 wx_native/wx_jsapi/wx_h5/alipay_qr/alipay/alipay_wap/unionpay/bank
   * @param {number} params.amount - 金额(分)
   * @param {string} params.subject - 商品标题
   * @param {string} params.orderNo - 商户订单号
   * @param {string} params.notifyUrl - 回调通知地址
   * @param {string} [params.body] - 商品描述
   * @param {string} [params.returnUrl] - 支付完成跳转地址(H5支付必填)
   * @param {string} [params.clientIp] - 客户端IP
   * @param {string} [params.attach] - 附加数据
   */
  async pay(params) {
    if (!params.payType) throw new Error('payType is required');
    if (!params.amount || params.amount < 1) throw new Error('amount must be >= 1 (fen)');
    if (!params.subject) throw new Error('subject is required');
    if (!params.orderNo) throw new Error('orderNo is required');
    if (!params.notifyUrl) throw new Error('notifyUrl is required');

    const data = {
      mchNo: this.mchNo,
      appId: this.appId,
      ...params,
    };

    return this.request('POST', '/api/v1/pay/gateway', {}, data);
  }

  /**
   * JSAPI 支付 (微信小程序/App支付需统一下单)
   */
  async payJsapi(params) {
    return this.pay({ ...params, payType: 'wx_jsapi' });
  }

  /**
   * Native 二维码支付
   */
  async payNative(params) {
    return this.pay({ ...params, payType: 'wx_native' });
  }

  /**
   * H5 支付
   */
  async payH5(params) {
    return this.pay({ ...params, payType: 'wx_h5' });
  }

  /**
   * 支付宝扫码支付
   */
  async payAlipayQr(params) {
    return this.pay({ ...params, payType: 'alipay_qr' });
  }

  /**
   * 查询订单
   */
  async queryOrder(orderNo) {
    return this.request('GET', `/api/v1/query/order/${orderNo}`);
  }

  /**
   * 关闭订单
   */
  async closeOrder(orderNo) {
    return this.request('POST', `/api/v1/order/${orderNo}/close`);
  }

  // ==================== 退款接口 ====================

  /**
   * 申请退款
   * @param {Object} params
   * @param {string} params.orderNo - 原订单号
   * @param {number} params.refundAmount - 退款金额(分)
   * @param {string} params.refundReason - 退款原因
   * @param {string} [params.notifyUrl] - 退款通知地址
   */
  async refund(params) {
    if (!params.orderNo) throw new Error('orderNo is required');
    if (!params.refundAmount || params.refundAmount < 1) throw new Error('refundAmount must be >= 1');
    if (!params.refundReason) throw new Error('refundReason is required');

    return this.request('POST', '/api/v1/refund/apply', {}, params);
  }

  /**
   * 查询退款
   */
  async queryRefund(refundNo) {
    return this.request('GET', `/api/v1/query/refund/${refundNo}`);
  }

  // ==================== 转账接口 ====================

  /**
   * 发起转账
   * @param {Object} params
   * @param {string} params.outNo - 商户转账单号
   * @param {number} params.amount - 转账金额(分)
   * @param {string} params.accountType - 账户类型 bank_card/bank_account
   * @param {string} params.accountName - 账户姓名
   * @param {string} params.accountNo - 账户号
   * @param {string} params.bankName - 银行名称
   * @param {string} [params.remark] - 备注
   */
  async transfer(params) {
    if (!params.outNo) throw new Error('outNo is required');
    if (!params.amount || params.amount < 1) throw new Error('amount must be >= 1');
    if (!params.accountType) throw new Error('accountType is required');
    if (!params.accountName) throw new Error('accountName is required');
    if (!params.accountNo) throw new Error('accountNo is required');
    if (!params.bankName) throw new Error('bankName is required');

    return this.request('POST', '/api/v1/transfer/pay', {}, params);
  }

  /**
   * 查询转账
   */
  async queryTransfer(transferNo) {
    return this.request('GET', `/api/v1/query/transfer/${transferNo}`);
  }

  // ==================== 账户接口 ====================

  /**
   * 查询余额
   */
  async getBalance(mchNo) {
    return this.request('GET', '/api/v1/account/balance', { mchNo: mchNo || this.mchNo });
  }

  // ==================== 工具方法 ====================

  /**
   * 验证回调通知签名
   * @param {Object} data - 回调数据
   * @param {string} sign - 平台签名
   */
  verifyCallback(data, sign) {
    const params = { ...data };
    delete params.sign;
    return this.verify(params, sign);
  }

  /**
   * 构造支付链接 (前端使用)
   */
  buildPayUrl(payType, orderNo, amount, returnUrl) {
    const params = {
      appId: this.appId,
      mchNo: this.mchNo,
      orderNo,
      amount,
      returnUrl,
      timestamp: this.getTimestamp(),
    };
    const sign = this.sign(params);
    return `${this.baseUrl}/h5/pay?appId=${this.appId}&orderNo=${orderNo}&sign=${sign}`;
  }
}

/**
 * 支付异常
 */
class DgkjPayException extends Error {
  constructor(code, data) {
    super(data?.message || `API Error: ${code}`);
    this.code = code;
    this.data = data;
    this.name = 'DgkjPayException';
  }
}

// ==================== 回调通知处理工具 ====================

/**
 * 处理支付回调通知
 * @param {Object} body - 请求体
 * @param {string} secret - AppSecret
 * @returns {Object|null} - 验签成功返回解析后的数据，否则返回 null
 */
DgkjPayClient.verifyPayNotify = function(body, secret) {
  const { sign, ...data } = body;
  if (!sign) return null;

  const str = Object.keys(data)
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join('&');

  const expected = crypto.createHmac('sha256', secret).update(str).digest('hex').toUpperCase();

  if (expected === sign.toUpperCase()) {
    return data;
  }
  return null;
};

module.exports = { DgkjPayClient, DgkjPayException };
