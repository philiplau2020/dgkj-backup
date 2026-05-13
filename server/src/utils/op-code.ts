/**
 * DGKJ 支付平台 - 操作码定义
 * 
 * 统一管理所有业务错误码
 */

// ==================== 系统级错误码 (10000-19999) ====================
export enum OpCode {
  // 成功
  SUCCESS = 0,

  // 系统错误 (10000-10999)
  SYS_ERROR = 10000,
  SYS_DB_ERROR = 10001,
  SYS_PARAM_ERROR = 10002,
  SYS_TIMEOUT = 10003,
  SYS_NO_PERMISSION = 10004,
  SYS_RESOURCE_NOT_FOUND = 10005,
  SYS_RESOURCE_EXISTED = 10006,
  SYS_SERVICE_UNAVAILABLE = 10007,
  SYS_INTERNAL_ERROR = 10008,

  // 认证授权错误 (11000-11999)
  AUTH_ERROR = 11000,
  AUTH_TOKEN_INVALID = 11001,
  AUTH_TOKEN_EXPIRED = 11002,
  AUTH_PASSWORD_ERROR = 11003,
  AUTH_ACCOUNT_DISABLED = 11004,
  AUTH_ACCOUNT_LOCKED = 11005,
  AUTH_CAPTCHA_ERROR = 11006,

  // 开放平台认证错误 (11500-11999)
  AUTH_KEY_NOT_FOUND = 11500,
  AUTH_SIGN_INVALID = 11501,
  AUTH_TIMESTAMP_EXPIRED = 11502,
  AUTH_KEY_DISABLED = 11503,
  AUTH_IP_NOT_ALLOWED = 11504,
  AUTH_MISSING_PARAM = 11505,

  // 开放平台开发者错误 (12000-12999)
  DEV_NOT_APPROVED = 12000,
  DEV_SUSPENDED = 12001,

  // 开放平台限流错误 (13000-13999)
  RATE_LIMIT_EXCEEDED = 13000,
  QUOTA_DAILY_EXCEEDED = 13001,
  QUOTA_MONTHLY_EXCEEDED = 13002,
  PERM_API_NOT_ENABLED = 13003,

  // ==================== 业务级错误码 (20000-99999) ====================

  // 商户管理 (20000-20999)
  BIZ_MCH_NOT_EXIST = 20000,
  BIZ_MCH_STATUS_ABNORMAL = 20001,
  BIZ_MCH_AUDIT_REJECTED = 20002,
  BIZ_MCH_EXISTED = 20003,

  // 应用管理 (21000-21999)
  BIZ_APP_NOT_EXIST = 21000,
  BIZ_APP_STATUS_ABNORMAL = 21001,
  BIZ_APP_EXISTED = 21002,

  // 支付相关 (22000-22999)
  BIZ_PAY_CREATE_FAILED = 22000,
  BIZ_PAY_SIGN_FAILED = 22001,
  BIZ_PAY_CHANNEL_ERROR = 22002,
  BIZ_PAY_AMOUNT_ERROR = 22003,
  BIZ_PAY_NOTIFY_ERROR = 22004,
  BIZ_CHANNEL_NOT_AVAILABLE = 22005,
  BIZ_PAY_WAY_NOT_SUPPORT = 22006,

  // 订单相关 (23000-23999)
  BIZ_ORDER_NOT_FOUND = 23000,
  BIZ_ORDER_STATUS_ERROR = 23001,
  BIZ_ORDER_EXPIRED = 23002,
  BIZ_ORDER_AMOUNT_ERROR = 23003,
  BIZ_ORDER_CLOSED = 23004,

  // 退款相关 (24000-24999)
  BIZ_REFUND_NOT_FOUND = 24000,
  BIZ_REFUND_EXISTS = 24001,
  BIZ_REFUND_EXCEED = 24002,
  BIZ_REFUND_STATUS_ERROR = 24003,

  // 账户相关 (25000-25999)
  BIZ_ACCOUNT_NOT_EXIST = 25000,
  BIZ_ACCOUNT_BALANCE_NOT_ENOUGH = 25001,
  BIZ_ACCOUNT_FROZEN = 25002,
  BIZ_ACCOUNT_STATUS_ABNORMAL = 25003,

  // 结算相关 (26000-26999)
  BIZ_SETTLE_NOT_FOUND = 26000,
  BIZ_SETTLE_STATUS_ERROR = 26001,
  BIZ_SETTLE_AMOUNT_ERROR = 26002,
  BIZ_SETTLE_NOT_SUPPORT = 26003,

  // 提现相关 (27000-27999)
  BIZ_WITHDRAW_NOT_FOUND = 27000,
  BIZ_WITHDRAW_STATUS_ERROR = 27001,
  BIZ_WITHDRAW_AMOUNT_ERROR = 27002,
  BIZ_WITHDRAW_FEE_ERROR = 27003,

  // 代理相关 (28000-28999)
  BIZ_AGENT_NOT_EXIST = 28000,
  BIZ_AGENT_STATUS_ABNORMAL = 28001,
  BIZ_AGENT_EXISTED = 28002,
  BIZ_AGENT_LEVEL_ERROR = 28003,

  // 通道相关 (29000-29999)
  BIZ_CHANNEL_NOT_EXIST = 29000,
  BIZ_CHANNEL_STATUS_ABNORMAL = 29001,
  BIZ_CHANNEL_CONFIG_ERROR = 29002,

  // 设备相关 (30000-30999)
  BIZ_DEVICE_NOT_EXIST = 30000,
  BIZ_DEVICE_ACTIVATED = 30001,
  BIZ_DEVICE_EXISTED = 30002,
  BIZ_DEVICE_BIND_FAILED = 30003,
  BIZ_DEVICE_OFFLINE = 30004,

  // 中信银行相关 (31000-31999)
  BIZ_CITIC_ACCOUNT_NOT_EXIST = 31000,
  BIZ_CITIC_CARD_NOT_EXIST = 31001,
  BIZ_CITIC_BALANCE_NOT_ENOUGH = 31002,
  BIZ_CITIC_TRANSFER_FAILED = 31003,
  BIZ_CITIC_SETTLE_FAILED = 31004,

  // 分润相关 (32000-32999)
  BIZ_PROFIT_NOT_CONFIG = 32000,
  BIZ_PROFIT_CALC_FAILED = 32001,
  BIZ_PROFIT_EXEC_FAILED = 32002,

  // 对账相关 (33000-33999)
  BIZ_CHECK_BATCH_EXISTED = 33000,
  BIZ_CHECK_BATCH_NOT_FOUND = 33001,
  BIZ_CHECK_DIFF_EXISTED = 33002,

  // 开放平台相关 (34000-34999)
  BIZ_DEV_NOT_EXIST = 34000,
  BIZ_DEV_STATUS_ABNORMAL = 34001,
  BIZ_API_KEY_INVALID = 34002,
  BIZ_API_QUOTA_EXCEEDED = 34003,
  BIZ_API_SIGN_ERROR = 34004,
}

// ==================== 错误消息映射 ====================
const OpCodeMessage: Record<number, string> = {
  // 系统错误
  [OpCode.SUCCESS]: '操作成功',
  [OpCode.SYS_ERROR]: '系统错误',
  [OpCode.SYS_DB_ERROR]: '数据库错误',
  [OpCode.SYS_PARAM_ERROR]: '参数错误',
  [OpCode.SYS_TIMEOUT]: '请求超时',
  [OpCode.SYS_NO_PERMISSION]: '没有权限',
  [OpCode.SYS_RESOURCE_NOT_FOUND]: '资源不存在',
  [OpCode.SYS_RESOURCE_EXISTED]: '资源已存在',
  [OpCode.SYS_SERVICE_UNAVAILABLE]: '服务不可用',
  [OpCode.SYS_INTERNAL_ERROR]: '内部错误',

  // 认证授权错误
  [OpCode.AUTH_ERROR]: '认证失败',
  [OpCode.AUTH_TOKEN_INVALID]: 'Token无效',
  [OpCode.AUTH_TOKEN_EXPIRED]: 'Token已过期',
  [OpCode.AUTH_PASSWORD_ERROR]: '密码错误',
  [OpCode.AUTH_ACCOUNT_DISABLED]: '账号已禁用',
  [OpCode.AUTH_ACCOUNT_LOCKED]: '账号已锁定',
  [OpCode.AUTH_CAPTCHA_ERROR]: '验证码错误',

  // 开放平台认证错误
  [OpCode.AUTH_KEY_NOT_FOUND]: 'AppKey不存在',
  [OpCode.AUTH_SIGN_INVALID]: '签名无效',
  [OpCode.AUTH_TIMESTAMP_EXPIRED]: '时间戳已过期',
  [OpCode.AUTH_KEY_DISABLED]: 'AppKey已禁用',
  [OpCode.AUTH_IP_NOT_ALLOWED]: 'IP地址不允许访问',
  [OpCode.AUTH_MISSING_PARAM]: '缺少参数',

  // 开放平台开发者错误
  [OpCode.DEV_NOT_APPROVED]: '开发者账号未审核通过',
  [OpCode.DEV_SUSPENDED]: '开发者账号已停用',

  // 开放平台限流错误
  [OpCode.RATE_LIMIT_EXCEEDED]: '请求频率超限',
  [OpCode.QUOTA_DAILY_EXCEEDED]: '日配额已用完',
  [OpCode.QUOTA_MONTHLY_EXCEEDED]: '月配额已用完',
  [OpCode.PERM_API_NOT_ENABLED]: 'API权限未开通',

  // 商户管理
  [OpCode.BIZ_MCH_NOT_EXIST]: '商户不存在',
  [OpCode.BIZ_MCH_STATUS_ABNORMAL]: '商户状态异常',
  [OpCode.BIZ_MCH_AUDIT_REJECTED]: '商户审核被拒绝',
  [OpCode.BIZ_MCH_EXISTED]: '商户已存在',

  // 应用管理
  [OpCode.BIZ_APP_NOT_EXIST]: '应用不存在',
  [OpCode.BIZ_APP_STATUS_ABNORMAL]: '应用状态异常',
  [OpCode.BIZ_APP_EXISTED]: '应用已存在',

  // 支付相关
  [OpCode.BIZ_PAY_CREATE_FAILED]: '支付创建失败',
  [OpCode.BIZ_PAY_SIGN_FAILED]: '支付签名失败',
  [OpCode.BIZ_PAY_CHANNEL_ERROR]: '支付通道错误',
  [OpCode.BIZ_PAY_AMOUNT_ERROR]: '支付金额错误',
  [OpCode.BIZ_PAY_NOTIFY_ERROR]: '支付回调处理失败',
  [OpCode.BIZ_CHANNEL_NOT_AVAILABLE]: '暂无可用支付通道',
  [OpCode.BIZ_PAY_WAY_NOT_SUPPORT]: '不支持该支付方式',

  // 订单相关
  [OpCode.BIZ_ORDER_NOT_FOUND]: '订单不存在',
  [OpCode.BIZ_ORDER_STATUS_ERROR]: '订单状态不允许此操作',
  [OpCode.BIZ_ORDER_EXPIRED]: '订单已过期',
  [OpCode.BIZ_ORDER_AMOUNT_ERROR]: '订单金额不匹配',
  [OpCode.BIZ_ORDER_CLOSED]: '订单已关闭',

  // 退款相关
  [OpCode.BIZ_REFUND_NOT_FOUND]: '退款记录不存在',
  [OpCode.BIZ_REFUND_EXISTS]: '存在进行中的退款申请',
  [OpCode.BIZ_REFUND_EXCEED]: '退款金额超过订单金额',
  [OpCode.BIZ_REFUND_STATUS_ERROR]: '退款状态不允许此操作',

  // 账户相关
  [OpCode.BIZ_ACCOUNT_NOT_EXIST]: '账户不存在',
  [OpCode.BIZ_ACCOUNT_BALANCE_NOT_ENOUGH]: '账户余额不足',
  [OpCode.BIZ_ACCOUNT_FROZEN]: '账户已冻结',
  [OpCode.BIZ_ACCOUNT_STATUS_ABNORMAL]: '账户状态异常',

  // 结算相关
  [OpCode.BIZ_SETTLE_NOT_FOUND]: '结算记录不存在',
  [OpCode.BIZ_SETTLE_STATUS_ERROR]: '结算状态不允许此操作',
  [OpCode.BIZ_SETTLE_AMOUNT_ERROR]: '结算金额错误',
  [OpCode.BIZ_SETTLE_NOT_SUPPORT]: '不支持该结算方式',

  // 提现相关
  [OpCode.BIZ_WITHDRAW_NOT_FOUND]: '提现记录不存在',
  [OpCode.BIZ_WITHDRAW_STATUS_ERROR]: '提现状态不允许此操作',
  [OpCode.BIZ_WITHDRAW_AMOUNT_ERROR]: '提现金额错误',
  [OpCode.BIZ_WITHDRAW_FEE_ERROR]: '提现手续费错误',

  // 代理相关
  [OpCode.BIZ_AGENT_NOT_EXIST]: '代理商不存在',
  [OpCode.BIZ_AGENT_STATUS_ABNORMAL]: '代理商状态异常',
  [OpCode.BIZ_AGENT_EXISTED]: '代理商已存在',
  [OpCode.BIZ_AGENT_LEVEL_ERROR]: '代理级别错误',

  // 通道相关
  [OpCode.BIZ_CHANNEL_NOT_EXIST]: '支付通道不存在',
  [OpCode.BIZ_CHANNEL_STATUS_ABNORMAL]: '支付通道状态异常',
  [OpCode.BIZ_CHANNEL_CONFIG_ERROR]: '支付通道配置错误',

  // 设备相关
  [OpCode.BIZ_DEVICE_NOT_EXIST]: '设备不存在',
  [OpCode.BIZ_DEVICE_ACTIVATED]: '设备已激活',
  [OpCode.BIZ_DEVICE_EXISTED]: '设备已注册',
  [OpCode.BIZ_DEVICE_BIND_FAILED]: '设备绑定失败',
  [OpCode.BIZ_DEVICE_OFFLINE]: '设备离线',

  // 中信银行相关
  [OpCode.BIZ_CITIC_ACCOUNT_NOT_EXIST]: '中信银行账户不存在',
  [OpCode.BIZ_CITIC_CARD_NOT_EXIST]: '中信银行卡不存在',
  [OpCode.BIZ_CITIC_BALANCE_NOT_ENOUGH]: '中信银行余额不足',
  [OpCode.BIZ_CITIC_TRANSFER_FAILED]: '中信银行转账失败',
  [OpCode.BIZ_CITIC_SETTLE_FAILED]: '中信银行结算失败',

  // 分润相关
  [OpCode.BIZ_PROFIT_NOT_CONFIG]: '分润配置未设置',
  [OpCode.BIZ_PROFIT_CALC_FAILED]: '分润计算失败',
  [OpCode.BIZ_PROFIT_EXEC_FAILED]: '分润执行失败',

  // 对账相关
  [OpCode.BIZ_CHECK_BATCH_EXISTED]: '对账批次已存在',
  [OpCode.BIZ_CHECK_BATCH_NOT_FOUND]: '对账批次不存在',
  [OpCode.BIZ_CHECK_DIFF_EXISTED]: '对账差异已存在',

  // 开放平台相关
  [OpCode.BIZ_DEV_NOT_EXIST]: '开发者不存在',
  [OpCode.BIZ_DEV_STATUS_ABNORMAL]: '开发者状态异常',
  [OpCode.BIZ_API_KEY_INVALID]: 'API密钥无效',
  [OpCode.BIZ_API_QUOTA_EXCEEDED]: 'API配额已用完',
  [OpCode.BIZ_API_SIGN_ERROR]: 'API签名错误',
};

/**
 * 获取错误码对应的消息
 */
export function getOpCodeMessage(code: number): string {
  return OpCodeMessage[code] || '未知错误';
}

/**
 * 返回结果封装
 */
export interface OpResult<T = any> {
  code: number;
  message: string;
  data: T | null;
}

/**
 * 创建成功结果
 */
export function opSuccess<T = any>(data?: T, message?: string): OpResult<T> {
  return {
    code: OpCode.SUCCESS,
    message: message || OpCodeMessage[OpCode.SUCCESS],
    data: data !== undefined ? data : null,
  };
}

/**
 * 创建错误结果
 */
export function opResult<T = any>(code: number, data: T | null, message?: string): OpResult<T> {
  return {
    code,
    message: message || OpCodeMessage[code] || '未知错误',
    data,
  };
}

export default {
  OpCode,
  getOpCodeMessage,
  opResult,
  opSuccess,
};
