/**
 * DGKJ 支付平台 - 短信通知服务
 * 
 * 支持阿里云短信、腾讯云短信等主流短信服务商
 */

import axios from 'axios';
import crypto from 'crypto';
import { AppDataSource } from '../../config/data-source';
import { SysConfig } from '../../database/entities/sys.entity';

interface SmsConfig {
  provider: 'aliyun' | 'tencent' | 'mock';
  accessKeyId?: string;
  accessKeySecret?: string;
  signName: string;
  templateCode?: string;
}

interface SmsResult {
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMsg?: string;
}

// 短信配置
let smsConfig: SmsConfig = {
  provider: 'mock',
  signName: 'DGKJ支付',
};

/**
 * 初始化短信配置
 */
export async function initializeSmsConfig() {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    
    // 从数据库配置中读取短信配置
    const smsConfigRecord = await configRepo.findOne({ 
      where: { configKey: 'sms_config' } 
    });
    
    if (smsConfigRecord) {
      const config = JSON.parse(smsConfigRecord.configValue);
      smsConfig = { ...smsConfig, ...config };
    }
    
    console.log('短信服务已初始化， provider:', smsConfig.provider);
  } catch (error) {
    console.error('初始化短信配置失败:', error);
  }
}

/**
 * 发送短信验证码
 */
export async function sendVerificationCode(
  phone: string, 
  code: string,
  expireMinutes: number = 5
): Promise<SmsResult> {
  try {
    const template = smsConfig.provider === 'aliyun' 
      ? 'SMS_XXX'  // 阿里云模板
      : smsConfig.provider === 'tencent'
      ? 'TPL_XXX'  // 腾讯云模板
      : 'VERIFY_CODE'; // Mock 模板

    const params = {
      code,
      expire: expireMinutes.toString(),
    };

    return await sendSms(phone, template, params);
  } catch (error: any) {
    return {
      success: false,
      errorCode: 'SEND_FAILED',
      errorMsg: error.message,
    };
  }
}

/**
 * 发送通知短信
 */
export async function sendNotification(
  phone: string,
  template: string,
  params: Record<string, string>
): Promise<SmsResult> {
  return await sendSms(phone, template, params);
}

/**
 * 发送营销短信
 */
export async function sendMarketing(
  phone: string,
  template: string,
  params: Record<string, string>
): Promise<SmsResult> {
  return await sendSms(phone, template, params);
}

/**
 * 批量发送短信
 */
export async function sendBatchSms(
  phones: string[],
  template: string,
  params: Record<string, string>
): Promise<SmsResult[]> {
  const results: SmsResult[] = [];
  
  for (const phone of phones) {
    const result = await sendSms(phone, template, params);
    results.push(result);
  }
  
  return results;
}

/**
 * 核心发送方法
 */
async function sendSms(
  phone: string,
  template: string,
  params: Record<string, string>
): Promise<SmsResult> {
  switch (smsConfig.provider) {
    case 'aliyun':
      return await sendAliyunSms(phone, template, params);
    case 'tencent':
      return await sendTencentSms(phone, template, params);
    case 'mock':
    default:
      return await sendMockSms(phone, template, params);
  }
}

/**
 * 阿里云短信发送
 */
async function sendAliyunSms(
  phone: string,
  template: string,
  params: Record<string, string>
): Promise<SmsResult> {
  try {
    const accessKeyId = smsConfig.accessKeyId;
    const accessKeySecret = smsConfig.accessKeySecret;
    
    if (!accessKeyId || !accessKeySecret) {
      return {
        success: false,
        errorCode: 'CONFIG_ERROR',
        errorMsg: '短信配置不完整',
      };
    }

    const host = 'dysmsapi.aliyuncs.com';
    const path = '/';
    
    // 构建参数
    const queryParams: Record<string, string> = {
      AccessKeyId: accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      SignatureVersion: '1.0',
      SignatureNonce: crypto.randomBytes(16).toString('hex'),
      Timestamp: new Date().toISOString(),
      Format: 'JSON',
      Action: 'SendSms',
      Version: '2017-05-25',
      PhoneNumbers: phone,
      SignName: smsConfig.signName,
      TemplateCode: template,
      TemplateParam: JSON.stringify(params),
    };

    // 计算签名
    const signature = calculateAliyunSignature(queryParams, accessKeySecret);
    queryParams['Signature'] = signature;

    // 发送请求
    const url = `https://${host}${path}?${buildQueryString(queryParams)}`;
    const response = await axios.post(url);

    const data = response.data;
    
    if (data.Code === 'OK') {
      return {
        success: true,
        messageId: data.MessageId,
      };
    } else {
      return {
        success: false,
        errorCode: data.Code,
        errorMsg: data.Message,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      errorCode: 'REQUEST_FAILED',
      errorMsg: error.message,
    };
  }
}

/**
 * 腾讯云短信发送
 */
async function sendTencentSms(
  phone: string,
  template: string,
  params: Record<string, string>
): Promise<SmsResult> {
  try {
    const appId = smsConfig.accessKeyId;
    const appKey = smsConfig.accessKeySecret;
    
    if (!appId || !appKey) {
      return {
        success: false,
        errorCode: 'CONFIG_ERROR',
        errorMsg: '短信配置不完整',
      };
    }

    const random = Math.floor(Math.random() * 1000000).toString();
    const now = Math.floor(Date.now() / 1000);
    
    // 拼接签名原文字符串
    const sigText = `appkey=${appKey}&random=${random}&time=${now}&mobile=${phone}`;
    const signature = crypto.createHash('sha256').update(sigText).digest('hex');

    const url = 'https://yun.tim.qq.com/v5/tlssmssvr/sendsms';
    const body = {
      tel: [{ nationcode: '86', mobile: phone.replace(/^86/, '') }],
      type: 0,
      appid: parseInt(appId),
      sign: smsConfig.signName,
      tpl_id: parseInt(template),
      params: Object.values(params),
      sig: signature,
      time: now,
      random,
    };

    const response = await axios.post(url, body);
    const data = response.data;

    if (data.result === 0) {
      return {
        success: true,
        messageId: data.sid,
      };
    } else {
      return {
        success: false,
        errorCode: data.result.toString(),
        errorMsg: data.errmsg,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      errorCode: 'REQUEST_FAILED',
      errorMsg: error.message,
    };
  }
}

/**
 * Mock 短信发送 (开发环境使用)
 */
async function sendMockSms(
  phone: string,
  template: string,
  params: Record<string, string>
): Promise<SmsResult> {
  // 开发环境下，直接打印到控制台
  console.log('【MOCK SMS】');
  console.log('  Phone:', phone);
  console.log('  Template:', template);
  console.log('  Params:', params);

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    success: true,
    messageId: 'MOCK_' + Date.now(),
  };
}

/**
 * 计算阿里云签名
 */
function calculateAliyunSignature(params: Record<string, string>, secret: string): string {
  // 按字典序排序参数
  const sortedKeys = Object.keys(params).sort();
  const canonicalizedQueryString = sortedKeys
    .map(key => {
      const value = encodeURIComponent(params[key]);
      return `${encodeURIComponent(key)}=${value}`;
    })
    .join('&');

  // 构建待签名字符串
  const stringToSign = `POST&${encodeURIComponent('/')}&${encodeURIComponent(canonicalizedQueryString)}`;

  // 计算 HMAC-SHA1 签名
  const hmac = crypto.createHmac('sha1', secret + '&');
  hmac.update(stringToSign);
  const signature = hmac.digest('base64');

  return signature;
}

/**
 * 构建查询字符串
 */
function buildQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

/**
 * 验证手机号格式
 */
export function validatePhone(phone: string): boolean {
  // 中国大陆手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 发送短信验证码 (带验证)
 */
export async function sendCodeWithValidation(
  phone: string,
  code: string,
  expireMinutes: number = 5
): Promise<SmsResult> {
  if (!validatePhone(phone)) {
    return {
      success: false,
      errorCode: 'INVALID_PHONE',
      errorMsg: '手机号格式不正确',
    };
  }

  return await sendVerificationCode(phone, code, expireMinutes);
}

export default {
  initializeSmsConfig,
  sendVerificationCode,
  sendNotification,
  sendMarketing,
  sendBatchSms,
  validatePhone,
  sendCodeWithValidation,
};
