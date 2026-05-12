/**
 * 开放平台响应码定义
 */

export const OpCode = {
  // 成功
  SUCCESS: 'OP0000',

  // 认证授权错误 (OP1xxx)
  AUTH_SIGN_INVALID: 'OP1001',       // 签名验证失败
  AUTH_TIMESTAMP_EXPIRED: 'OP1002', // 时间戳过期
  AUTH_KEY_NOT_FOUND: 'OP1003',     // AppKey不存在
  AUTH_KEY_DISABLED: 'OP1004',      // AppKey已禁用
  AUTH_KEY_EXPIRED: 'OP1005',       // AppKey已过期
  AUTH_IP_NOT_ALLOWED: 'OP1006',    // IP不在白名单
  AUTH_SIGN_TYPE_UNSUPPORTED: 'OP1007', // 签名类型不支持
  AUTH_MISSING_PARAM: 'OP1008',     // 缺少必要参数

  // 权限错误 (OP2xxx)
  PERM_API_NOT_ENABLED: 'OP2001',   // API接口未授权
  PERM_PAY_TYPE_NOT_ENABLED: 'OP2002', // 支付方式未开通
  PERM_MCH_NOT_BIND: 'OP2003',      // 未绑定商户

  // 限流错误 (OP3xxx)
  RATE_LIMIT_EXCEEDED: 'OP3001',    // 请求频率超限
  QUOTA_DAILY_EXCEEDED: 'OP3002',   // 日配额已用完
  QUOTA_MONTHLY_EXCEEDED: 'OP3003', // 月配额已用完

  // 业务错误 (OP4xxx)
  BIZ_ORDER_NOT_FOUND: 'OP4001',    // 订单不存在
  BIZ_ORDER_EXPIRED: 'OP4002',      // 订单已过期
  BIZ_ORDER_CLOSED: 'OP4003',       // 订单已关闭
  BIZ_ORDER_PAID: 'OP4004',         // 订单已支付
  BIZ_AMOUNT_INVALID: 'OP4005',      // 金额无效
  BIZ_AMOUNT_TOO_SMALL: 'OP4006',   // 金额太小
  BIZ_AMOUNT_TOO_LARGE: 'OP4007',   // 金额超限
  BIZ_REFUND_EXCEED: 'OP4008',      // 退款金额超限
  BIZ_MCH_NOT_EXIST: 'OP4009',      // 商户不存在
  BIZ_MCH_FROZEN: 'OP4010',         // 商户已冻结
  BIZ_NOTIFY_URL_INVALID: 'OP4011', // 通知地址无效
  BIZ_PAY_TYPE_NOT_SUPPORT: 'OP4012', // 支付方式不支持
  BIZ_CHANNEL_UNAVAILABLE: 'OP4013', // 通道不可用

  // 开发者错误 (OP5xxx)
  DEV_NOT_APPROVED: 'OP5001',       // 开发者未审核
  DEV_SUSPENDED: 'OP5002',          // 开发者已停用
  DEV_APP_NOT_APPROVED: 'OP5003',   // 应用未审核
  DEV_APP_SUSPENDED: 'OP5004',       // 应用已停用

  // 系统错误 (OP9xxx)
  SYS_ERROR: 'OP9001',              // 系统错误
  SYS_MAINTAINING: 'OP9002',        // 系统维护中
  SYS_TIMEOUT: 'OP9003',            // 处理超时
  SYS_SIGNATURE_FAILED: 'OP9004',   // 签名生成失败
} as const;

export type OpCodeType = (typeof OpCode)[keyof typeof OpCode];

/** 响应码中文描述 */
export const OpCodeMsg: Record<OpCodeType, string> = {
  [OpCode.SUCCESS]: '操作成功',

  [OpCode.AUTH_SIGN_INVALID]: '签名验证失败',
  [OpCode.AUTH_TIMESTAMP_EXPIRED]: '请求已过期，请检查本地时间',
  [OpCode.AUTH_KEY_NOT_FOUND]: 'AppKey不存在',
  [OpCode.AUTH_KEY_DISABLED]: 'AppKey已禁用，请联系服务商',
  [OpCode.AUTH_KEY_EXPIRED]: 'AppKey已过期',
  [OpCode.AUTH_IP_NOT_ALLOWED]: 'IP不在白名单允许范围内',
  [OpCode.AUTH_SIGN_TYPE_UNSUPPORTED]: '签名类型不支持',
  [OpCode.AUTH_MISSING_PARAM]: '缺少必要参数',

  [OpCode.PERM_API_NOT_ENABLED]: 'API接口未授权，请联系服务商开通',
  [OpCode.PERM_PAY_TYPE_NOT_ENABLED]: '支付方式未开通',
  [OpCode.PERM_MCH_NOT_BIND]: '未绑定商户',

  [OpCode.RATE_LIMIT_EXCEEDED]: '请求过于频繁，请稍后重试',
  [OpCode.QUOTA_DAILY_EXCEEDED]: '日配额已用完，请明日再试',
  [OpCode.QUOTA_MONTHLY_EXCEEDED]: '月配额已用完',

  [OpCode.BIZ_ORDER_NOT_FOUND]: '订单不存在',
  [OpCode.BIZ_ORDER_EXPIRED]: '订单已过期',
  [OpCode.BIZ_ORDER_CLOSED]: '订单已关闭',
  [OpCode.BIZ_ORDER_PAID]: '订单已支付',
  [OpCode.BIZ_AMOUNT_INVALID]: '金额无效',
  [OpCode.BIZ_AMOUNT_TOO_SMALL]: '金额低于最低限制',
  [OpCode.BIZ_AMOUNT_TOO_LARGE]: '金额超过单笔限额',
  [OpCode.BIZ_REFUND_EXCEED]: '退款金额超过可退金额',
  [OpCode.BIZ_MCH_NOT_EXIST]: '商户不存在',
  [OpCode.BIZ_MCH_FROZEN]: '商户已冻结',
  [OpCode.BIZ_NOTIFY_URL_INVALID]: '通知地址无效或不可访问',
  [OpCode.BIZ_PAY_TYPE_NOT_SUPPORT]: '支付方式暂不支持',
  [OpCode.BIZ_CHANNEL_UNAVAILABLE]: '支付通道暂不可用',

  [OpCode.DEV_NOT_APPROVED]: '开发者账号待审核',
  [OpCode.DEV_SUSPENDED]: '开发者账号已停用',
  [OpCode.DEV_APP_NOT_APPROVED]: '应用待审核',
  [OpCode.DEV_APP_SUSPENDED]: '应用已停用',

  [OpCode.SYS_ERROR]: '系统繁忙，请稍后重试',
  [OpCode.SYS_MAINTAINING]: '系统维护中，请稍后访问',
  [OpCode.SYS_TIMEOUT]: '请求处理超时',
  [OpCode.SYS_SIGNATURE_FAILED]: '签名生成失败',
};

/** 构建开放平台响应 */
export function opResult<T = any>(
  code: OpCodeType = OpCode.SUCCESS,
  data?: T,
  message?: string,
) {
  return {
    code,
    message: message || OpCodeMsg[code] || '未知错误',
    data,
    requestId: generateRequestId(),
    timestamp: new Date().toISOString(),
  };
}

function generateRequestId(): string {
  return 'REQ' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}
