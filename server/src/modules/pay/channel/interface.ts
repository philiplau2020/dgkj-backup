/**
 * DGKJ 支付平台 - 支付通道基础设施
 * 
 * 定义统一的支付通道接口，所有第三方支付都实现此接口
 */

// ==================== 基础类型定义 ====================

/** 支付结果状态 */
export enum PayStatus {
  PENDING = 'pending',      // 待支付
  SUCCESS = 'success',       // 支付成功
  FAILED = 'failed',        // 支付失败
  CLOSED = 'closed',       // 订单关闭
  REFUNDING = 'refunding',  // 退款中
  REFUNDED = 'refunded',    // 已退款
}

/** 退款状态 */
export enum RefundStatus {
  PENDING = 'pending',     // 待处理
  PROCESSING = 'processing', // 处理中
  SUCCESS = 'success',      // 退款成功
  FAILED = 'failed',       // 退款失败
}

/** 转账状态 */
export enum TransferStatus {
  PENDING = 'pending',     // 待处理
  PROCESSING = 'processing', // 处理中
  SUCCESS = 'success',      // 转账成功
  FAILED = 'failed',        // 转账失败
}

/** 支付方式 */
export enum PayWay {
  // 微信
  WX_NATIVE = 'wx_native',     // 微信 Native扫码支付
  WX_JSAPI = 'wx_jsapi',       // 微信 JSAPI支付
  WX_APP = 'wx_app',           // 微信 APP支付
  WX_H5 = 'wx_h5',             // 微信 H5支付
  WX_LITE = 'wx_lite',         // 微信小程序支付

  // 支付宝
  ALI_QR = 'ali_qr',           // 支付宝扫码支付
  ALI_JSAPI = 'ali_jsapi',     // 支付宝 JSAPI支付
  ALI_APP = 'ali_app',         // 支付宝 APP支付
  ALI_WAP = 'ali_wap',         // 支付宝 WAP支付

  // 银联
  UNION_QR = 'union_qr',      // 银联扫码支付
  UNION_JK = 'union_jk',       // 银联网关支付
  UNION_APP = 'union_app',     // 银联 APP支付
  UNION_WAP = 'union_wap',     // 银联 WAP支付
  UNION_BANK = 'union_bank',   // 银联银行卡支付

  // 云闪付
  YSF_QR = 'ysf_qr',          // 云闪付扫码

  // 通联支付
  ALLINPAY_WX_QR = 'allinpay_wx_qr',     // 通联-微信扫码
  ALLINPAY_ALI_QR = 'allinpay_ali_qr',   // 通联-支付宝扫码
  ALLINPAY_YSF_QR = 'allinpay_ysf_qr',   // 通联-云闪付扫码
  ALLINPAY_WX_JSAPI = 'allinpay_wx_jsapi', // 通联-微信JSAPI
  ALLINPAY_ALI_JSAPI = 'allinpay_ali_jsapi', // 通联-支付宝JSAPI
  ALLINPAY_YSF_JSAPI = 'allinpay_ysf_jsapi', // 通联-云闪付JSAPI
  ALLINPAY_WX_APP = 'allinpay_wx_app',   // 通联-微信APP支付
  ALLINPAY_ALI_APP = 'allinpay_ali_app', // 通联-支付宝APP支付
  ALLINPAY_UNION_APP = 'allinpay_union_app', // 通联-银联APP支付

  // 汇付斗拱快捷支付
  HUIFU_QUICK = 'huifu_quick',           // 汇付-快捷支付
  HUIFU_PAGE = 'huifu_page',             // 汇付-快捷支付页面版

  // 银行
  BANK_CARD = 'bank_card',    // 银行卡支付

  // 其他
  CASH = 'cash',              // 现金
}

/** 支付通道编码 */
export enum ChannelCode {
  WECHAT = 'WX',              // 微信支付
  ALIPAY = 'ALI',             // 支付宝
  UNIONPAY = 'UNION',         // 银联支付
  UNION = 'UNION',            // 银联 (别名)
  YSF = 'YSF',               // 云闪付
  CITIC = 'CITIC',           // 中信银行
  ALLINPAY = 'ALLINPAY',     // 通联支付
  HUIFU = 'HUIFU',           // 汇付斗拱
}

/** 通道配置 */
export interface ChannelConfig {
  /** 通道编码 */
  code: string;
  /** 通道名称 */
  name: string;
  /** 应用ID */
  appId: string;
  /** 应用密钥 */
  appSecret: string;
  /** 商户号 */
  mchId: string;
  /** API密钥 */
  apiKey: string;
  /** 私钥 (RSA) */
  privateKey?: string;
  /** 公钥 (RSA) */
  publicKey?: string;
  /** 证书路径 */
  certPath?: string;
  /** 证书密钥 */
  certKey?: string;
  /** 沙箱模式 */
  sandbox?: boolean;
  /** 超时时间(秒) */
  timeout?: number;
  /** 额外配置 */
  extra?: Record<string, string>;
}

// ==================== 请求参数 ====================

/** 统一支付请求参数 */
export interface UnifiedPayRequest {
  /** 商户订单号 */
  orderNo: string;
  /** 订单金额(分) */
  amount: number;
  /** 支付方式 */
  payWay: PayWay;
  /** 订单标题 */
  subject: string;
  /** 订单描述 */
  body?: string;
  /** 客户端IP */
  clientIp?: string;
  /** 回调地址 */
  notifyUrl: string;
  /** 前端跳转地址 */
  returnUrl?: string;
  /** 附加数据 */
  attach?: string;
  /** 微信 OpenId (JSAPI) */
  openId?: string;
  /** 支付宝用户ID */
  buyerId?: string;
  /** 场景信息 */
  sceneInfo?: {
    type?: string;
    pubOpt?: string;
  };
  /** 银行卡信息 */
  bankCard?: {
    cardType: string;
    cardNo: string;
    holderName: string;
    certNo: string;
    phone: string;
  };
}

/** 统一支付响应 */
export interface UnifiedPayResponse {
  /** 是否成功 */
  success: boolean;
  /** 错误码 */
  errorCode?: string;
  /** 错误信息 */
  errorMsg?: string;
  /** 平台订单号 */
  orderNo?: string;
  /** 通道订单号 */
  channelOrderNo?: string;
  /** 支付链接 */
  payUrl?: string;
  /** 二维码内容 */
  qrCode?: string;
  /** Deeplink */
  deeplink?: string;
  /** JSAPI 调起参数 */
  jsapiParams?: Record<string, any>;
  /** APP 调起参数 */
  appParams?: Record<string, any>;
  /** H5 跳转链接 */
  h5Url?: string;
  /** 过期时间 */
  expireTime?: Date;
}

/** 统一查单请求 */
export interface UnifiedQueryRequest {
  /** 平台订单号 */
  orderNo: string;
  /** 通道订单号 */
  channelOrderNo?: string;
}

/** 统一查单响应 */
export interface UnifiedQueryResponse {
  /** 是否成功 */
  success: boolean;
  /** 错误码 */
  errorCode?: string;
  /** 错误信息 */
  errorMsg?: string;
  /** 订单状态 */
  status: PayStatus;
  /** 通道订单号 */
  channelOrderNo?: string;
  /** 支付时间 */
  paidTime?: Date;
  /** 原始响应 */
  rawResponse?: Record<string, any>;
}

/** 统一退款请求 */
export interface UnifiedRefundRequest {
  /** 平台退款单号 */
  refundNo: string;
  /** 原平台订单号 */
  orderNo: string;
  /** 原通道订单号 */
  channelOrderNo?: string;
  /** 退款金额(分) */
  refundAmount: number;
  /** 退款原因 */
  reason?: string;
  /** 回调地址 */
  notifyUrl?: string;
}

/** 统一退款响应 */
export interface UnifiedRefundResponse {
  /** 是否成功 */
  success: boolean;
  /** 错误码 */
  errorCode?: string;
  /** 错误信息 */
  errorMsg?: string;
  /** 退款单号 */
  refundNo?: string;
  /** 通道退款单号 */
  channelRefundNo?: string;
  /** 退款状态 */
  status: RefundStatus;
  /** 实际退款金额 */
  refundAmount?: number;
  /** 退款时间 */
  refundTime?: Date;
}

/** 统一转账请求 */
export interface UnifiedTransferRequest {
  /** 平台转账单号 */
  transferNo: string;
  /** 商户转账单号 */
  outNo: string;
  /** 转账金额(分) */
  amount: number;
  /** 收款人姓名 */
  payeeName: string;
  /** 收款人账号 */
  payeeAccount: string;
  /** 收款账户类型 */
  accountType: 'bank_card' | 'wechat_openid' | 'alipay_id';
  /** 银行名称 */
  bankName?: string;
  /** 银行编码 */
  bankCode?: string;
  /** 备注 */
  remark?: string;
  /** 回调地址 */
  notifyUrl?: string;
}

/** 统一转账响应 */
export interface UnifiedTransferResponse {
  /** 是否成功 */
  success: boolean;
  /** 错误码 */
  errorCode?: string;
  /** 错误信息 */
  errorMsg?: string;
  /** 转账单号 */
  transferNo?: string;
  /** 通道转账单号 */
  channelTransferNo?: string;
  /** 转账状态 */
  status: TransferStatus;
}

// ==================== 回调数据 ====================

/** 统一回调通知数据 */
export interface UnifiedCallbackData {
  /** 通道编码 */
  channelCode: string;
  /** 通知类型: pay/refund/transfer */
  notifyType: 'pay' | 'refund' | 'transfer';
  /** 平台订单号 */
  orderNo: string;
  /** 通道订单号 */
  channelOrderNo: string;
  /** 支付状态 */
  status: PayStatus | RefundStatus | TransferStatus;
  /** 订单金额 */
  amount: number;
  /** 实际支付金额 */
  paidAmount?: number;
  /** 支付时间 */
  paidTime?: Date;
  /** 附加数据 */
  attach?: string;
  /** 原始回调数据 */
  rawData: Record<string, any>;
}

/** 回调验签结果 */
export interface CallbackVerifyResult {
  /** 是否验签成功 */
  success: boolean;
  /** 错误信息 */
  errorMsg?: string;
  /** 解析后的数据 */
  data?: UnifiedCallbackData;
}

// ==================== 支付通道接口 ====================

/**
 * 支付通道接口
 * 所有支付通道必须实现此接口
 */
export interface IPaymentChannel {
  /** 通道编码 */
  readonly channelCode: string;
  /** 通道名称 */
  readonly channelName: string;
  /** 支持的支付方式 */
  readonly supportedPayWays: PayWay[];
  
  /**
   * 初始化通道配置
   * @param config 通道配置
   */
  initialize(config: ChannelConfig): void;
  
  /**
   * 执行支付
   * @param request 支付请求
   * @returns 支付响应
   */
  pay(request: UnifiedPayRequest): Promise<UnifiedPayResponse>;
  
  /**
   * 查询订单
   * @param request 查单请求
   * @returns 查单响应
   */
  query(request: UnifiedQueryRequest): Promise<UnifiedQueryResponse>;
  
  /**
   * 申请退款
   * @param request 退款请求
   * @returns 退款响应
   */
  refund(request: UnifiedRefundRequest): Promise<UnifiedRefundResponse>;
  
  /**
   * 转账
   * @param request 转账请求
   * @returns 转账响应
   */
  transfer(request: UnifiedTransferRequest): Promise<UnifiedTransferResponse>;
  
  /**
   * 验证回调签名
   * @param data 回调数据
   * @param headers 回调头
   * @returns 验签结果
   */
  verifyCallback(data: any, headers: any): Promise<CallbackVerifyResult>;
  
  /**
   * 解析回调数据
   * @param data 原始回调数据
   * @returns 解析后的数据
   */
  parseCallback(data: any): Promise<UnifiedCallbackData>;
  
  /**
   * 响应回调成功
   * @returns 响应字符串
   */
  responseCallbackSuccess(): string;
  
  /**
   * 响应回调失败
   * @returns 响应字符串
   */
  responseCallbackFail(): string;
}

// ==================== 通道管理器 ====================

/**
 * 通道管理器
 * 统一管理所有支付通道
 */
export class ChannelManager {
  private channels: Map<string, IPaymentChannel> = new Map();
  private static instance: ChannelManager;
  
  private constructor() {}
  
  static getInstance(): ChannelManager {
    if (!ChannelManager.instance) {
      ChannelManager.instance = new ChannelManager();
    }
    return ChannelManager.instance;
  }
  
  /**
   * 注册通道
   * @param channel 支付通道实例
   */
  register(channel: IPaymentChannel): void {
    this.channels.set(channel.channelCode, channel);
  }
  
  /**
   * 获取通道
   * @param channelCode 通道编码
   */
  get(channelCode: string): IPaymentChannel | undefined {
    return this.channels.get(channelCode);
  }
  
  /**
   * 获取所有通道
   */
  getAll(): IPaymentChannel[] {
    return Array.from(this.channels.values());
  }
  
  /**
   * 根据支付方式获取通道
   * @param payWay 支付方式
   */
  getByPayWay(payWay: PayWay): IPaymentChannel | undefined {
    for (const channel of this.channels.values()) {
      if (channel.supportedPayWays.includes(payWay)) {
        return channel;
      }
    }
    return undefined;
  }
  
  /**
   * 移除通道
   * @param channelCode 通道编码
   */
  unregister(channelCode: string): void {
    this.channels.delete(channelCode);
  }
}

export default ChannelManager;
