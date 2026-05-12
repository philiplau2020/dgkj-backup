/**
 * 中信银行E管家 配置管理
 *
 * 配置信息（开发完成后修改）
 * 正式环境请将这些配置移到环境变量或配置中心
 */

// 正式API地址
export const CITIC_API_URL = 'https://api.aipgd.com/management/gateway.do';

// 用户信息
export const CITIC_CONFIG = {
  // 用户bizUserId
  bizUserId: '39GPPP54RR8QO',

  // 平台应用号appId
  appId: 'JST_19GPPP545A5MO',

  // 平台ID
  platformId: '3903860587',

  // 商户RSA私钥
  merchantRsaPrivateKey: `MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBALkL6hVbgm+9QaDU/dActpUTfUGRt2/UDzPd3kOM/MsuK36IT8UF7sqiEI3/MCai+GPsTL2ntZ1an/a24p0YRigI4wU9Gf5S7EnQH8Uvc+xMrU1JJfFrdbZkSHEPcxIp1FrUAGd+DHiRG3CU5ZptWc8uftzl855hIHw6Xisvi82bAgMBAAECgYAJEEZU6XiIFJMEV6pe6SkgQCYgcgy0E4TzG2jpkhxHr2k991tA4TuC/VEmQ1uOaOkVq9tOZsqEfI3dPbP30dqNwgctxwpr1Y4GvYsFMUXR0o1QYiYVEKcTMpG93gt39zvgsl482c8oc8fPj/n2cSFBsAh4P3f1YOzTb4kN6/9ZwQJBAO8kiYlQJZLGHhjlztSczZ3zpLOPEn0/n3SkWG/WX0iFz0TG5ZAhx+lGcidquMvSY8+jnJSRec6yVqbb6hNNUEsCQQDGFy58bPJup6mYx9wsWDqQzswyLsds2Ce2ThcLpcocfo+HA/owlnPPhuP3pW9XOa1NI6R9Y6uZbpi1H+KZ/UXxAkA8Bo3HO6jSuIvhb/2EfH9YAEn9EBJyAcBChOX13Hc6OuwVtV712KTXNul8X1tXPc3z1nt9By7t5PG/HEAa7DMVAkBKazkWm6N0eN6ZPDR2IGtYLai/DZ30QTyiG7JCuPU2QUHQmmjqygsWIvoP9oHexhdaTJKmXMSB7u/F1AXAjksxAkEAzq7BCAcJjL5wplq+J91t1OdoSE7EPX2QPC95fdGThNjSr99dfFSgRWH/2YsHixGF0vKteqhZu5+iiXRKNZmvng==`,

  // 商户RSA公钥
  merchantRsaPublicKey: `MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC5C+oVW4JvvUGg1P3QHLaVE31Bkbdv1A8z3d5DjPzLLit+iE/FBe7KohCN/zAmovhj7Ey9p7WdWp/2tuKdGEYoCOMFPRn+UuxJ0B/FL3PsTK1NSSXxa3W2ZEhxD3MSKdRa1ABnfgx4kRtwlOWabVnPLn7c5fOeYSB8Ol4rL4vNmwIDAQAB`,

  // 商户SM2私钥
  merchantSm2PrivateKey: `MIGTAgEAMBMGByqGSM49AgEGCCqBHM9VAYItBHkwdwIBAQQgeL5mc77KgOMxB4ruuYgr4BQHvYsTOXdLNWrz9BVgh1OgCgYIKoEcz1UBgi2hRANCAARi5KcYtbTCyoUZ7XVejJaYE9YfG0ZsW/CQdKFcRxJAQCYBH2+6Hm7fX6OPZEO1s5iCuP9eIp0WT/9q2JXY9ute`,

  // 商户SM2公钥
  merchantSm2PublicKey: `MFkwEwYHKoZIzj0CAQYIKoEcz1UBgi0DQgAEYuSnGLW0wsqFGe11XoyWmBPWHxtGbFvwkHShXEcSQEAmAR9vuh5u31+jj2RDtbOYgrj/XiKdFk//atiV2PbrXg==`,

  // 平台RSA公钥
  platformRsaPublicKey: `MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCgElLNC0W1TBlxgYqoDc6otg9Jg3Jhntmac+RVElYZmfMQ+w9FmTC9II0K5tR5u5XdtG/hmElWCCW6r3pwjV6SdCEdKA5xGJ2CMtzcKTILU0Vu/uv+MEIB+saoiiolWQoZEKvLuQOCihV/867pOXreb42wWf0HVvmMfgW8rlxv0wIDAQAB`,

  // 平台SM2公钥
  platformSm2PublicKey: `MFkwEwYHKoZIzj0CAQYIKoEcz1UBgi0DQgAEjxjLY5SoMkG+vG+tFgDLwgHjlfpwP0Z04kBQ7stjo4Vk5k2CzWbsdQTuqGPir37XmImtgnYbMrDds3U2akQRtA==`,
} as const;

// 签名类型
export const SIGN_TYPE = {
  RSA: 'RSA',
  SM2: 'SM2',
  MD5: 'MD5',
} as const;

// API接口列表
export const CITIC_API = {
  // ========== 账户管理 ==========
  // 用户注册（开户）
  USER_REGISTER: '/user/register',
  // 用户查询
  USER_QUERY: '/user/query',
  // 用户绑卡
  USER_BIND_CARD: '/user/bindCard',
  // 用户绑卡查询
  USER_BIND_CARD_QUERY: '/user/bindCardQuery',
  // 用户解绑卡
  USER_UNBIND_CARD: '/user/unbindCard',

  // ========== 余额查询 ==========
  // 账户余额查询
  ACCOUNT_BALANCE_QUERY: '/account/balanceQuery',
  // 账户历史交易查询
  ACCOUNT_HISTORY_QUERY: '/account/historyQuery',
  // 账户冻结金额查询
  ACCOUNT_FREEZE_QUERY: '/account/freezeQuery',

  // ========== 资金归集 ==========
  // 归集关系设置
  COLLECTION_SET: '/collection/set',
  // 归集关系查询
  COLLECTION_QUERY: '/collection/query',
  // 归集关系删除
  COLLECTION_DELETE: '/collection/delete',
  // 主动归集
  COLLECTION_ACTIVE: '/collection/active',
  // 归集结果查询
  COLLECTION_RESULT_QUERY: '/collection/resultQuery',

  // ========== 余额分账 ==========
  // 分账关系设置
  PROFIT_SHARE_SET: '/profitShare/set',
  // 分账关系查询
  PROFIT_SHARE_QUERY: '/profitShare/query',
  // 分账关系删除
  PROFIT_SHARE_DELETE: '/profitShare/delete',
  // 分账执行
  PROFIT_SHARE_EXECUTE: '/profitShare/execute',
  // 分账结果查询
  PROFIT_SHARE_RESULT_QUERY: '/profitShare/resultQuery',

  // ========== 代付打款 ==========
  // 代付下单
  TRANSFER_PAY: '/transfer/pay',
  // 代付查询
  TRANSFER_QUERY: '/transfer/query',
  // 代付结果查询
  TRANSFER_RESULT_QUERY: '/transfer/resultQuery',

  // ========== 结算 ==========
  // 结算下单
  SETTLEMENT_PAY: '/settlement/pay',
  // 结算查询
  SETTLEMENT_QUERY: '/settlement/query',
  // 结算结果查询
  SETTLEMENT_RESULT_QUERY: '/settlement/resultQuery',

  // ========== 对账 ==========
  // 对账单下载
  RECONCILE_DOWNLOAD: '/reconcile/download',
  // 对账结果查询
  RECONCILE_RESULT_QUERY: '/reconcile/resultQuery',
} as const;

export default {
  CITIC_API_URL,
  CITIC_CONFIG,
  SIGN_TYPE,
  CITIC_API,
};
