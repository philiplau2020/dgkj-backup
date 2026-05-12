/**
 * 开放平台签名工具
 *
 * 支持多种签名算法:
 * 1. HMAC-SHA256 (推荐) - 最常用，兼容性好
 * 2. RSA-SHA256 (2048位) - 非对称签名，安全性高
 * 3. SM2 (国密) - 国产密码算法
 */

import crypto from 'crypto';

/** 签名算法枚举 */
export const SignType = {
  HMAC_SHA256: 'HMAC-SHA256',
  RSA_SHA256: 'RSA-SHA256',
  SM2: 'SM2',
  MD5: 'MD5',
  SHA1: 'SHA1',
} as const;

export type SignType = (typeof SignType)[keyof typeof SignType];

/** 按字典序排序并拼接参数 */
export function sortParams(params: Record<string, any>): string {
  const sorted = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, any>);

  return Object.entries(sorted)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

/** 生成签名 (HMAC-SHA256) */
export function signHmacSha256(params: Record<string, any>, secret: string): string {
  const str = sortParams(params);
  return crypto.createHmac('sha256', secret).update(str).digest('hex').toUpperCase();
}

/** 验证签名 (HMAC-SHA256) */
export function verifyHmacSha256(params: Record<string, any>, sign: string, secret: string): boolean {
  const expected = signHmacSha256(params, secret);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sign)) ||
    expected === sign.toUpperCase();
}

/** 生成 RSA 签名 */
export function signRsaSha256(data: string, privateKey: string): string {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64');
}

/** 验证 RSA 签名 */
export function verifyRsaSha256(data: string, signature: string, publicKey: string): boolean {
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(data);
  return verify.verify(publicKey, signature, 'base64');
}

/** 生成 MD5 签名 (兼容老系统) */
export function signMd5(params: Record<string, any>, secret: string): string {
  const str = sortParams(params) + '&key=' + secret;
  return crypto.createHash('md5').update(str).digest('hex').toUpperCase();
}

/** 验证 MD5 签名 */
export function verifyMd5(params: Record<string, any>, sign: string, secret: string): boolean {
  const expected = signMd5(params, secret);
  return expected === sign.toUpperCase();
}

/** 根据签名类型签名 */
export function sign(params: Record<string, any>, secret: string, signType: SignType = SignType.HMAC_SHA256): string {
  switch (signType) {
    case SignType.HMAC_SHA256:
      return signHmacSha256(params, secret);
    case SignType.MD5:
      return signMd5(params, secret);
    case SignType.SHA1:
      return crypto.createHash('sha1').update(sortParams(params) + secret).digest('hex').toUpperCase();
    default:
      return signHmacSha256(params, secret);
  }
}

/** 通用验签 */
export function verifySign(
  params: Record<string, any>,
  sign: string,
  secret: string,
  signType: SignType = SignType.HMAC_SHA256,
): boolean {
  const signParam = { ...params };
  delete signParam.sign;
  delete signParam.signType;

  switch (signType) {
    case SignType.HMAC_SHA256:
      return verifyHmacSha256(signParam, sign, secret);
    case SignType.MD5:
      return verifyMd5(signParam, sign, secret);
    default:
      return verifyHmacSha256(signParam, sign, secret);
  }
}

/** 生成随机字符串 */
export function generateNonce(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/** 生成 AppKey (公开标识) */
export function generateAppKey(): string {
  return 'DGKJ' + Date.now().toString(36).toUpperCase() + generateNonce(8).toUpperCase();
}

/** 生成 AppSecret */
export function generateAppSecret(): string {
  return generateNonce(32) + Date.now().toString(36);
}

/** 生成 KeyId */
export function generateKeyId(): string {
  return 'KEY' + Date.now().toString(36).toUpperCase() + generateNonce(4).toUpperCase();
}

/** 生成商户号 */
export function generateMchNo(): string {
  const prefix = 'M';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = generateNonce(6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/** 生成应用ID */
export function generateAppId(): string {
  return 'APP' + Date.now().toString(36).toUpperCase() + generateNonce(4).toUpperCase();
}

/** AES 加密 */
export function aesEncrypt(data: string, key: string, iv: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.slice(0, 32)), Buffer.from(iv.slice(0, 16)));
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

/** AES 解密 */
export function aesDecrypt(data: string, key: string, iv: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.slice(0, 32)), Buffer.from(iv.slice(0, 16)));
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/** 加密敏感数据 (AppSecret 存储) */
export function encryptSecret(secret: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.slice(0, 32)), iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/** 解密敏感数据 */
export function decryptSecret(encrypted: string, key: string): string {
  const [ivHex, data] = encrypted.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.slice(0, 32)), Buffer.from(ivHex, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/** 脱敏处理 */
export function maskSecret(value: string, showLength = 4): string {
  if (!value || value.length <= showLength * 2) return '***';
  return value.slice(0, showLength) + '****' + value.slice(-showLength);
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return '***';
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return '***@' + domain;
  return name[0] + '***' + name.slice(-1) + '@' + domain;
}

export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 10) return '***';
  return idCard.slice(0, 4) + '**********' + idCard.slice(-4);
}

export function maskBankCard(cardNo: string): string {
  if (!cardNo || cardNo.length < 8) return '***';
  return cardNo.slice(0, 4) + ' **** **** ' + cardNo.slice(-4);
}
