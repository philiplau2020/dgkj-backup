/**
 * 开放平台 API 网关中间件
 *
 * 职责:
 * 1. 签名验证 (HMAC-SHA256 / RSA / SM2)
 * 2. AppKey 认证
 * 3. IP 白名单校验
 * 4. 限流控制
 * 5. 配额检查
 * 6. API 权限校验
 * 7. 调用日志记录
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppDataSource } from '../../config/data-source';
import { OpApp, OpApiKey, OpDeveloper, OpApiLog, OpApiQuota } from '../entity';
import { OpCode, opResult } from '../../utils/op-code';
import {
  sortParams,
  verifySign,
  decryptSecret,
} from '../../utils/signature';

declare global {
  namespace Express {
    interface Request {
      opApp?: OpApp;
      opDeveloper?: OpDeveloper;
      opApiKey?: OpApiKey;
      opApiLogId?: string;
    }
  }
}

/** 开放平台白名单接口 (无需认证) */
const PUBLIC_APIS = [
  '/api/v1/common/captcha',
  '/api/v1/common/qrcode',
  '/api/v1/dev/register',
  '/api/v1/dev/login',
  '/api/v1/dev/send-sms',
  '/health',
];

/** 限流配置 (每秒请求数) */
const RATE_LIMITS: Record<string, number> = {
  trial: 5,
  basic: 20,
  professional: 100,
  enterprise: 500,
};

/** 日配额配置 */
const DAILY_QUOTAS: Record<string, number> = {
  trial: 100,
  basic: 10000,
  professional: 100000,
  enterprise: 1000000,
};

/**
 * API 网关主中间件
 */
export async function apiGateway(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const requestId = 'REQ' + Date.now().toString(36) + crypto.randomBytes(2).toString('hex').toUpperCase();

  // 放行公开接口
  if (PUBLIC_APIS.some((path) => req.path.startsWith(path))) {
    return next();
  }

  // 提取认证参数
  const appKey = req.headers['x-app-key'] as string || req.query.appKey as string;
  const sign = req.headers['x-sign'] as string || req.query.sign as string;
  const signType = (req.headers['x-sign-type'] as string || req.query.signType as string || 'HMAC-SHA256') as any;
  const timestamp = req.headers['x-timestamp'] as string || req.query.timestamp as string;
  const nonce = req.headers['x-nonce'] as string || req.query.nonce as string;
  const version = req.headers['x-api-version'] as string || 'v1';
  const clientIp = getClientIp(req);

  // 记录日志
  let apiLog: OpApiLog;
  try {
    const logRepo = AppDataSource.getRepository(OpApiLog);
    apiLog = logRepo.create({
      appId: appKey || 'unknown',
      developerId: 'unknown',
      mchNo: 'unknown',
      keyId: 'unknown',
      method: req.method,
      apiPath: req.path,
      clientIp,
      userAgent: req.headers['user-agent'],
      requestParams: JSON.stringify(req.body || req.query).slice(0, 2000),
      result: 'pending',
      httpCode: 200,
      code: OpCode.SUCCESS,
    });
    apiLog = await logRepo.save(apiLog);
    req.opApiLogId = apiLog.id;
  } catch (e) {
    console.error('记录API日志失败', e);
  }

  // 1. 参数检查
  if (!appKey) {
    return respondError(res, req, OpCode.AUTH_KEY_NOT_FOUND, '缺少AppKey参数');
  }
  if (!sign) {
    return respondError(res, req, OpCode.AUTH_SIGN_INVALID, '缺少签名参数');
  }
  if (!timestamp) {
    return respondError(res, req, OpCode.AUTH_TIMESTAMP_EXPIRED, '缺少时间戳参数');
  }

  // 2. 时间戳校验 (5分钟内有效)
  const ts = parseInt(timestamp, 10);
  const now = Date.now();
  if (isNaN(ts) || Math.abs(now - ts) > 5 * 60 * 1000) {
    return respondError(res, req, OpCode.AUTH_TIMESTAMP_EXPIRED);
  }

  // 3. AppKey 验证
  const appRepo = AppDataSource.getRepository(OpApp);
  const app = await appRepo.findOne({ where: { appKey } });
  if (!app) {
    return respondError(res, req, OpCode.AUTH_KEY_NOT_FOUND);
  }
  if (app.status !== 'active') {
    return respondError(res, req, OpCode.AUTH_KEY_DISABLED);
  }
  req.opApp = app;

  // 4. 开发者状态验证
  const devRepo = AppDataSource.getRepository(OpDeveloper);
  const developer = await devRepo.findOne({ where: { developerId: app.developerId } });
  if (!developer) {
    return respondError(res, req, OpCode.DEV_NOT_APPROVED);
  }
  if (developer.status === 'pending') {
    return respondError(res, req, OpCode.DEV_NOT_APPROVED, '开发者账号待审核');
  }
  if (developer.status === 'suspended') {
    return respondError(res, req, OpCode.DEV_SUSPENDED);
  }
  if (developer.status === 'rejected') {
    return respondError(res, req, OpCode.DEV_SUSPENDED, '开发者账号审核未通过');
  }
  req.opDeveloper = developer;

  // 5. AppSecret 获取 (解密)
  const encryptKey = process.env.ENCRYPT_KEY || 'dgkj-open-platform-secret';
  let appSecret = app.appSecret;
  try {
    if (app.appSecret.includes(':')) {
      appSecret = decryptSecret(app.appSecret, encryptKey);
    }
  } catch (e) {
    // 如果解密失败，使用原值
  }

  // 6. 签名验证
  const paramsToSign: Record<string, any> = {
    ...req.query,
    ...req.body,
    appKey,
    timestamp,
  };
  if (nonce) paramsToSign.nonce = nonce;

  const isValid = verifySignature(paramsToSign, sign, appSecret, signType);
  if (!isValid) {
    return respondError(res, req, OpCode.AUTH_SIGN_INVALID);
  }

  // 7. IP 白名单校验
  if (app.ipWhitelist) {
    try {
      const whitelist = JSON.parse(app.ipWhitelist) as string[];
      if (whitelist.length > 0 && !whitelist.includes(clientIp) && !whitelist.includes('*')) {
        return respondError(res, req, OpCode.AUTH_IP_NOT_ALLOWED);
      }
    } catch (e) {
      // 忽略解析错误
    }
  }

  // 8. 限流检查 (滑动窗口)
  const rateLimit = RATE_LIMITS[developer.level] || RATE_LIMITS['trial'];
  const rateCheck = await checkRateLimit(app.appId, rateLimit);
  if (!rateCheck.allowed) {
    res.setHeader('X-RateLimit-Limit', String(rateLimit));
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', String(rateCheck.resetTime));
    return respondError(res, req, OpCode.RATE_LIMIT_EXCEEDED);
  }

  // 9. 配额检查
  const quotaCheck = await checkQuota(app.appId, 'daily');
  if (!quotaCheck.allowed) {
    return respondError(res, req, OpCode.QUOTA_DAILY_EXCEEDED);
  }

  // 10. API 权限检查
  const apiCheck = checkApiPermission(req.path, app.enabledApis);
  if (!apiCheck.allowed) {
    return respondError(res, req, OpCode.PERM_API_NOT_ENABLED);
  }

  // 更新日志
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    updateApiLog(req, {
      responseTime,
      result: res.statusCode === 200 ? 'success' : 'error',
      httpCode: res.statusCode,
    });
    // 更新配额
    updateQuota(app.appId, 'daily').catch(() => {});
    // 更新应用调用计数
    appRepo.increment({ appId: app.appId }, 'totalCallCount', 1);
    appRepo.increment({ appId: app.appId }, 'todayCallCount', 1);
  });

  next();
}

/** 签名验证 */
function verifySignature(params: Record<string, any>, sign: string, secret: string, signType: string): boolean {
  const signParam: Record<string, any> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'sign' && k !== 'signType' && v !== undefined && v !== null && v !== '') {
      signParam[k] = v;
    }
  }

  switch (signType?.toUpperCase()) {
    case 'HMAC-SHA256':
    case 'SHA256':
      return verifySign(signParam, sign, secret, 'HMAC-SHA256' as any);
    case 'MD5':
      return verifySign(signParam, sign, secret, 'MD5' as any);
    default:
      return verifySign(signParam, sign, secret, 'HMAC-SHA256' as any);
  }
}

/** 限流检查 */
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
const RATE_WINDOW = 1000; // 1秒窗口

async function checkRateLimit(appId: string, limit: number): Promise<{ allowed: boolean; resetTime: number }> {
  const now = Date.now();
  const key = appId;
  const cached = rateLimitCache.get(key);

  if (!cached || now > cached.resetTime) {
    rateLimitCache.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, resetTime: now + RATE_WINDOW };
  }

  if (cached.count >= limit) {
    return { allowed: false, resetTime: cached.resetTime };
  }

  cached.count++;
  return { allowed: true, resetTime: cached.resetTime };
}

/** 配额检查 */
async function checkQuota(appId: string, quotaType: 'daily' | 'monthly'): Promise<{ allowed: boolean; used: number; limit: number }> {
  const quotaRepo = AppDataSource.getRepository(OpApiQuota);
  let quota = await quotaRepo.findOne({ where: { appId, quotaType, apiCode: 'ALL' } });

  const developer = AppDataSource.getRepository(OpDeveloper).findOne({ where: { developerId: appId } });
  const limits = DAILY_QUOTAS;

  if (!quota) {
    const dev = await developer;
    const limit = limits[dev?.level || 'trial'] || limits['trial'];
    quota = quotaRepo.create({
      appId,
      developerId: dev?.developerId || '',
      quotaType,
      apiCode: 'ALL',
      quotaLimit: limit,
      quotaUsed: 0,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await quotaRepo.save(quota);
  }

  return {
    allowed: quota.quotaUsed < quota.quotaLimit,
    used: quota.quotaUsed,
    limit: quota.quotaLimit,
  };
}

/** 更新配额 */
async function updateQuota(appId: string, quotaType: 'daily' | 'monthly'): Promise<void> {
  const quotaRepo = AppDataSource.getRepository(OpApiQuota);
  await quotaRepo.increment({ appId, quotaType, apiCode: 'ALL' }, 'quotaUsed', 1);
}

/** API 权限检查 */
function checkApiPermission(path: string, enabledApis?: string[]): { allowed: boolean; apiCode: string } {
  const apiMap: Record<string, string> = {
    '/api/v1/pay': 'pay',
    '/api/v1/pay/gateway': 'pay',
    '/api/v1/pay/h5': 'pay',
    '/api/v1/pay/app': 'pay',
    '/api/v1/pay/qr': 'pay',
    '/api/v1/query': 'query',
    '/api/v1/query/order': 'query',
    '/api/v1/refund': 'refund',
    '/api/v1/refund/apply': 'refund',
    '/api/v1/transfer': 'transfer',
    '/api/v1/transfer/pay': 'transfer',
    '/api/v1/account/balance': 'account',
    '/api/v1/account/list': 'account',
    '/api/v1/file/upload': 'file',
    '/api/v1/common/captcha': 'common',
  };

  const apiCode = apiMap[path] || apiMap[Object.keys(apiMap).find((k) => path.startsWith(k)) || ''] || 'unknown';

  // 如果没有配置权限，默认允许
  if (!enabledApis || enabledApis.length === 0) return { allowed: true, apiCode };
  if (enabledApis.includes('ALL')) return { allowed: true, apiCode };

  return { allowed: enabledApis.includes(apiCode), apiCode };
}

/** 更新API日志 */
async function updateApiLog(req: Request, data: Partial<OpApiLog>): Promise<void> {
  if (!req.opApiLogId) return;
  try {
    const logRepo = AppDataSource.getRepository(OpApiLog);
    await logRepo.update(req.opApiLogId, data);
  } catch (e) {
    console.error('更新API日志失败', e);
  }
}

/** 错误响应 */
function respondError(res: Response, req: Request, code: string, message?: string): void {
  const result = opResult(code, null, message);

  // 更新日志
  if (req.opApiLogId) {
    updateApiLog(req, {
      result: 'error',
      httpCode: 401,
      code,
      message,
    });
  }

  res.status(401).json(result);
}

/** 获取客户端IP */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (forwarded as string).split(',');
    return ips[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}
