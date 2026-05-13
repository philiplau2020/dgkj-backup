/**
 * DGKJ 支付平台 - 统一通知服务
 * 
 * 支持: 邮件、短信、钉钉、企业微信
 */

import axios from 'axios';
import crypto from 'crypto';
import { AppDataSource } from '../../config/data-source';
import { SysConfig } from '../../database/entities/sys.entity';

// ==================== 配置类型 ====================

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

interface SmsConfig {
  provider: 'aliyun' | 'tencent' | 'mock';
  accessKeyId?: string;
  accessKeySecret?: string;
  signName: string;
  templateCode?: string;
}

interface DingTalkConfig {
  enabled: boolean;
  webhook: string;
  secret?: string;
}

interface WeComConfig {
  enabled: boolean;
  corpId: string;
  corpSecret: string;
  agentId: string;
  webhookUrl?: string;
}

interface NotificationConfig {
  email: EmailConfig;
  sms: SmsConfig;
  dingtalk: DingTalkConfig;
  wecom: WeComConfig;
}

// ==================== 通知结果类型 ====================

interface NotificationResult {
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMsg?: string;
}

// ==================== 配置管理 ====================

let notificationConfig: NotificationConfig = {
  email: {
    host: 'smtp.example.com',
    port: 465,
    secure: true,
    user: '',
    pass: '',
    from: 'noreply@dgkj.com',
    fromName: 'DGKJ支付平台',
  },
  sms: {
    provider: 'mock',
    signName: 'DGKJ支付',
  },
  dingtalk: {
    enabled: false,
    webhook: '',
  },
  wecom: {
    enabled: false,
    corpId: '',
    corpSecret: '',
    agentId: '',
  },
};

let emailTransporter: any = null;
let wecomAccessToken: string = '';
let wecomTokenExpireTime: number = 0;

/**
 * 初始化所有通知配置
 */
export async function initializeNotificationConfig() {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    
    // 加载邮件配置
    const emailConfigRecord = await configRepo.findOne({ 
      where: { configKey: 'email_config' } 
    });
    if (emailConfigRecord && emailConfigRecord.configValue) {
      const config = JSON.parse(emailConfigRecord.configValue);
      notificationConfig.email = { ...notificationConfig.email, ...config };
    }

    // 加载短信配置
    const smsConfigRecord = await configRepo.findOne({ 
      where: { configKey: 'sms_config' } 
    });
    if (smsConfigRecord && smsConfigRecord.configValue) {
      const config = JSON.parse(smsConfigRecord.configValue);
      notificationConfig.sms = { ...notificationConfig.sms, ...config };
    }

    // 加载钉钉配置
    const dingtalkConfigRecord = await configRepo.findOne({ 
      where: { configKey: 'dingtalk_config' } 
    });
    if (dingtalkConfigRecord && dingtalkConfigRecord.configValue) {
      const config = JSON.parse(dingtalkConfigRecord.configValue);
      notificationConfig.dingtalk = { ...notificationConfig.dingtalk, ...config };
    }

    // 加载企业微信配置
    const wecomConfigRecord = await configRepo.findOne({ 
      where: { configKey: 'wecom_config' } 
    });
    if (wecomConfigRecord && wecomConfigRecord.configValue) {
      const config = JSON.parse(wecomConfigRecord.configValue);
      notificationConfig.wecom = { ...notificationConfig.wecom, ...config };
    }

    // 初始化邮件发送器
    await initializeEmailTransporter();
    
    console.log('通知服务已初始化:', {
      email: notificationConfig.email.host,
      sms: notificationConfig.sms.provider,
      dingtalk: notificationConfig.dingtalk.enabled,
      wecom: notificationConfig.wecom.enabled,
    });
  } catch (error) {
    console.error('初始化通知配置失败:', error);
  }
}

/**
 * 初始化邮件发送器
 */
async function initializeEmailTransporter() {
  try {
    const nodemailer = require('nodemailer');
    emailTransporter = nodemailer.createTransport({
      host: notificationConfig.email.host,
      port: notificationConfig.email.port,
      secure: notificationConfig.email.secure,
      auth: {
        user: notificationConfig.email.user,
        pass: notificationConfig.email.pass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  } catch (error) {
    console.error('初始化邮件发送器失败:', error);
    emailTransporter = null;
  }
}

// ==================== 邮件通知 ====================

/**
 * 发送邮件
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
}): Promise<NotificationResult> {
  try {
    if (!emailTransporter) {
      await initializeEmailTransporter();
    }

    if (!emailTransporter) {
      console.log('【MOCK EMAIL】');
      console.log('  To:', options.to);
      console.log('  Subject:', options.subject);
      return { success: true, messageId: 'MOCK_' + Date.now() };
    }

    const to = Array.isArray(options.to) ? options.to.join(',') : options.to;

    const info = await emailTransporter.sendMail({
      from: `"${notificationConfig.email.fromName}" <${notificationConfig.email.from}>`,
      to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      html: options.html,
      attachments: options.attachments,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('发送邮件失败:', error);
    return { success: false, errorCode: 'SEND_FAILED', errorMsg: error.message };
  }
}

/**
 * 发送验证码邮件
 */
export async function sendVerificationEmail(to: string, code: string, expireMinutes: number = 10): Promise<NotificationResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1890ff; border-bottom: 2px solid #1890ff; padding-bottom: 10px;">邮箱验证码</h2>
      <p style="font-size: 16px;">尊敬的用户，您好！</p>
      <p style="font-size: 16px;">您的验证码是：</p>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <span style="font-size: 32px; font-weight: bold; color: #1890ff; letter-spacing: 8px;">${code}</span>
      </div>
      <p style="color: #666;">验证码 <strong>${expireMinutes}</strong> 分钟内有效，请勿泄露给他人。</p>
      <p style="color: #999; margin-top: 30px; font-size: 12px;">此邮件由系统自动发送，请勿回复。如非本人操作，请忽略此邮件。</p>
    </div>
  `;

  return await sendEmail({ to, subject: '【DGKJ支付】邮箱验证码', html });
}

/**
 * 发送密码重置邮件
 */
export async function sendResetPasswordEmail(to: string, resetLink: string, expireHours: number = 24): Promise<NotificationResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1890ff; border-bottom: 2px solid #1890ff; padding-bottom: 10px;">密码重置</h2>
      <p style="font-size: 16px;">尊敬的用户，您好！</p>
      <p style="font-size: 16px;">您申请了密码重置，请点击下面的链接完成操作：</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="display: inline-block; background: #1890ff; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-size: 16px;">点击此处重置密码</a>
      </div>
      <p style="color: #666;">链接 <strong>${expireHours}</strong> 小时内有效。</p>
      <p style="color: #ff4d4f;">如果这不是您本人操作，请忽略此邮件。</p>
      <p style="color: #999; margin-top: 30px; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  return await sendEmail({ to, subject: '【DGKJ支付】密码重置', html });
}

/**
 * 发送商户审核通知
 */
export async function sendMerchantAuditEmail(
  to: string,
  merchantName: string,
  status: 'approved' | 'rejected',
  reason?: string
): Promise<NotificationResult> {
  const statusText = status === 'approved' ? '已通过' : '已拒绝';
  const statusColor = status === 'approved' ? '#52c41a' : '#ff4d4f';
  
  let content = `<p>您的商户 "<strong>${merchantName}</strong>" 审核${statusText}。</p>`;
  if (status === 'rejected' && reason) {
    content += `<p style="color: #ff4d4f;">拒绝原因：${reason}</p>`;
  }
  if (status === 'approved') {
    content += `<p style="color: #52c41a;">恭喜！您可以开始使用我们的服务了。</p>`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1890ff; border-bottom: 2px solid #1890ff; padding-bottom: 10px;">商户审核结果通知</h2>
      <p style="font-size: 16px;">尊敬的用户，您好！</p>
      ${content}
      <p style="color: #999; margin-top: 30px; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  return await sendEmail({ to, subject: `【DGKJ支付】商户 "${merchantName}" 审核${statusText}`, html });
}

/**
 * 发送交易通知
 */
export async function sendTradeNotificationEmail(
  to: string,
  data: { orderNo: string; amount: number; status: string; paidTime?: string; payWay: string }
): Promise<NotificationResult> {
  const statusText = { paid: '已支付', refunded: '已退款', closed: '已关闭' }[data.status] || data.status;
  const statusColor = { paid: '#52c41a', refunded: '#faad14', closed: '#999' }[data.status] || '#666';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1890ff; border-bottom: 2px solid #1890ff; padding-bottom: 10px;">交易通知</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 12px; border: 1px solid #eee; width: 30%;">订单号</td><td style="padding: 12px; border: 1px solid #eee;">${data.orderNo}</td></tr>
        <tr><td style="padding: 12px; border: 1px solid #eee;">订单金额</td><td style="padding: 12px; border: 1px solid #eee; font-weight: bold; color: #1890ff;">¥${(data.amount / 100).toFixed(2)}</td></tr>
        <tr><td style="padding: 12px; border: 1px solid #eee;">支付方式</td><td style="padding: 12px; border: 1px solid #eee;">${data.payWay}</td></tr>
        <tr><td style="padding: 12px; border: 1px solid #eee;">状态</td><td style="padding: 12px; border: 1px solid #eee; color: ${statusColor}; font-weight: bold;">${statusText}</td></tr>
        ${data.paidTime ? `<tr><td style="padding: 12px; border: 1px solid #eee;">支付时间</td><td style="padding: 12px; border: 1px solid #eee;">${data.paidTime}</td></tr>` : ''}
      </table>
      <p style="color: #999; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  return await sendEmail({ to, subject: `【DGKJ支付】交易${statusText}通知`, html });
}

/**
 * 发送结算到账通知
 */
export async function sendSettlementEmail(
  to: string,
  data: { settleNo: string; amount: number; fee: number; actualAmount: number; arriveTime?: string }
): Promise<NotificationResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #52c41a; border-bottom: 2px solid #52c41a; padding-bottom: 10px;">结算到账通知</h2>
      <p style="font-size: 16px;">尊敬的用户，您好！</p>
      <p style="font-size: 16px; color: #52c41a;">您的结算已处理完成，资金已到账！</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 12px; border: 1px solid #eee;">结算单号</td><td style="padding: 12px; border: 1px solid #eee;">${data.settleNo}</td></tr>
        <tr><td style="padding: 12px; border: 1px solid #eee;">结算金额</td><td style="padding: 12px; border: 1px solid #eee;">¥${(data.amount / 100).toFixed(2)}</td></tr>
        <tr><td style="padding: 12px; border: 1px solid #eee;">手续费</td><td style="padding: 12px; border: 1px solid #eee; color: #ff4d4f;">-¥${(data.fee / 100).toFixed(2)}</td></tr>
        <tr><td style="padding: 12px; border: 1px solid #eee; font-weight: bold;">实际到账</td><td style="padding: 12px; border: 1px solid #eee; font-weight: bold; color: #52c41a; font-size: 18px;">¥${(data.actualAmount / 100).toFixed(2)}</td></tr>
        ${data.arriveTime ? `<tr><td style="padding: 12px; border: 1px solid #eee;">到账时间</td><td style="padding: 12px; border: 1px solid #eee;">${data.arriveTime}</td></tr>` : ''}
      </table>
      <p style="color: #999; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  return await sendEmail({ to, subject: '【DGKJ支付】结算到账通知', html });
}

// ==================== 短信通知 ====================

/**
 * 发送短信验证码
 */
export async function sendVerificationCode(
  phone: string, 
  code: string,
  expireMinutes: number = 5
): Promise<NotificationResult> {
  try {
    if (!validatePhone(phone)) {
      return { success: false, errorCode: 'INVALID_PHONE', errorMsg: '手机号格式不正确' };
    }

    switch (notificationConfig.sms.provider) {
      case 'aliyun':
        return await sendAliyunSms(phone, notificationConfig.sms.templateCode || 'SMS_XXX', { code, expire: expireMinutes.toString() });
      case 'tencent':
        return await sendTencentSms(phone, '1', [code, expireMinutes.toString()]);
      case 'mock':
      default:
        console.log('【MOCK SMS】Phone:', phone, 'Code:', code);
        return { success: true, messageId: 'MOCK_' + Date.now() };
    }
  } catch (error: any) {
    return { success: false, errorCode: 'SEND_FAILED', errorMsg: error.message };
  }
}

/**
 * 发送短信通知
 */
export async function sendSmsNotification(phone: string, template: string, params: Record<string, string>): Promise<NotificationResult> {
  try {
    if (!validatePhone(phone)) {
      return { success: false, errorCode: 'INVALID_PHONE', errorMsg: '手机号格式不正确' };
    }

    switch (notificationConfig.sms.provider) {
      case 'aliyun':
        return await sendAliyunSms(phone, template, params);
      case 'tencent':
        return await sendTencentSms(phone, template, Object.values(params));
      case 'mock':
      default:
        console.log('【MOCK SMS】Phone:', phone, 'Template:', template, 'Params:', params);
        return { success: true, messageId: 'MOCK_' + Date.now() };
    }
  } catch (error: any) {
    return { success: false, errorCode: 'SEND_FAILED', errorMsg: error.message };
  }
}

/**
 * 阿里云短信发送
 */
async function sendAliyunSms(
  phone: string,
  template: string,
  params: Record<string, string>
): Promise<NotificationResult> {
  try {
    const { accessKeyId, accessKeySecret } = notificationConfig.sms;
    
    if (!accessKeyId || !accessKeySecret) {
      return { success: false, errorCode: 'CONFIG_ERROR', errorMsg: '短信配置不完整' };
    }

    const host = 'dysmsapi.aliyuncs.com';
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
      SignName: notificationConfig.sms.signName,
      TemplateCode: template,
      TemplateParam: JSON.stringify(params),
    };

    const signature = calculateAliyunSignature(queryParams, accessKeySecret);
    queryParams['Signature'] = signature;

    const url = `https://${host}/?${buildQueryString(queryParams)}`;
    const response = await axios.post(url);

    if (response.data.Code === 'OK') {
      return { success: true, messageId: response.data.MessageId };
    } else {
      return { success: false, errorCode: response.data.Code, errorMsg: response.data.Message };
    }
  } catch (error: any) {
    return { success: false, errorCode: 'REQUEST_FAILED', errorMsg: error.message };
  }
}

/**
 * 腾讯云短信发送
 */
async function sendTencentSms(phone: string, templateId: string, params: string[]): Promise<NotificationResult> {
  try {
    const { accessKeyId: appId, accessKeySecret: appKey } = notificationConfig.sms;
    
    if (!appId || !appKey) {
      return { success: false, errorCode: 'CONFIG_ERROR', errorMsg: '短信配置不完整' };
    }

    const random = Math.floor(Math.random() * 1000000).toString();
    const now = Math.floor(Date.now() / 1000);
    const sigText = `appkey=${appKey}&random=${random}&time=${now}&mobile=${phone}`;
    const signature = crypto.createHash('sha256').update(sigText).digest('hex');

    const url = 'https://yun.tim.qq.com/v5/tlssmssvr/sendsms';
    const body = {
      tel: [{ nationcode: '86', mobile: phone.replace(/^86/, '') }],
      type: 0,
      appid: parseInt(appId),
      sign: notificationConfig.sms.signName,
      tpl_id: parseInt(templateId),
      params,
      sig: signature,
      time: now,
      random,
    };

    const response = await axios.post(url, body);

    if (response.data.result === 0) {
      return { success: true, messageId: response.data.sid };
    } else {
      return { success: false, errorCode: response.data.result.toString(), errorMsg: response.data.errmsg };
    }
  } catch (error: any) {
    return { success: false, errorCode: 'REQUEST_FAILED', errorMsg: error.message };
  }
}

// ==================== 钉钉通知 ====================

/**
 * 发送钉钉消息
 */
export async function sendDingTalkMessage(options: {
  msgtype: 'text' | 'markdown' | 'link' | 'actionCard';
  content: {
    text?: string;
    title?: string;
    messageUrl?: string;
    picUrl?: string;
    btns?: Array<{ title: string; actionURL: string }>;
    btnOrientation?: string;
  };
  atMobiles?: string[];
}): Promise<NotificationResult> {
  try {
    if (!notificationConfig.dingtalk.enabled || !notificationConfig.dingtalk.webhook) {
      console.log('【MOCK DINGTALK】', JSON.stringify(options.content).slice(0, 100));
      return { success: true, messageId: 'MOCK_' + Date.now() };
    }

    let webhookUrl = notificationConfig.dingtalk.webhook;

    // 如果配置了加签密钥，需要计算签名
    if (notificationConfig.dingtalk.secret) {
      const timestamp = Date.now();
      const sign = crypto.createHmac('sha256', notificationConfig.dingtalk.secret)
        .update(`${timestamp}\n${notificationConfig.dingtalk.secret}`)
        .digest('base64');
      webhookUrl += `&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
    }

    const body: any = {
      msgtype: options.msgtype,
      [options.msgtype]: options.content,
    };

    if (options.atMobiles && options.atMobiles.length > 0) {
      body.at = { atMobiles: options.atMobiles, isAtAll: false };
    }

    const response = await axios.post(webhookUrl, body);

    if (response.data.errcode === 0) {
      return { success: true, messageId: response.data.msg_id };
    } else {
      return { success: false, errorCode: response.data.errcode.toString(), errorMsg: response.data.errmsg };
    }
  } catch (error: any) {
    return { success: false, errorCode: 'REQUEST_FAILED', errorMsg: error.message };
  }
}

/**
 * 发送钉钉文本消息
 */
export async function sendDingTalkText(text: string, atMobiles?: string[]): Promise<NotificationResult> {
  return sendDingTalkMessage({ msgtype: 'text', content: { text }, atMobiles });
}

/**
 * 发送钉钉 Markdown 消息
 */
export async function sendDingTalkMarkdown(title: string, text: string): Promise<NotificationResult> {
  return sendDingTalkMessage({ msgtype: 'markdown', content: { title, text } });
}

/**
 * 发送钉钉告警通知
 */
export async function sendDingTalkAlert(data: {
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  content: string;
  timestamp: string;
}): Promise<NotificationResult> {
  const levelEmoji = { info: 'ℹ️', warning: '⚠️', error: '❌', critical: '🚨' };
  const levelColor = { info: 'blue', warning: 'orange', error: 'red', critical: 'red' };

  const text = `
### ${levelEmoji[data.level]} ${data.title}

**级别**: ${data.level.toUpperCase()}

**内容**:
${data.content}

**时间**: ${data.timestamp}
  `.trim();

  return await sendDingTalkMarkdown(`【${data.level.toUpperCase()}】${data.title}`, text);
}

// ==================== 企业微信通知 ====================

/**
 * 获取企业微信 Access Token
 */
async function getWecomAccessToken(): Promise<string | null> {
  try {
    // 检查缓存
    if (wecomAccessToken && Date.now() < wecomTokenExpireTime) {
      return wecomAccessToken;
    }

    if (!notificationConfig.wecom.corpId || !notificationConfig.wecom.corpSecret) {
      console.error('企业微信配置不完整');
      return null;
    }

    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${notificationConfig.wecom.corpId}&corpsecret=${notificationConfig.wecom.corpSecret}`;
    const response = await axios.get(url);

    if (response.data.errcode === 0) {
      wecomAccessToken = response.data.access_token;
      wecomTokenExpireTime = Date.now() + (response.data.expires_in - 200) * 1000;
      return wecomAccessToken;
    } else {
      console.error('获取企业微信 Access Token 失败:', response.data.errmsg);
      return null;
    }
  } catch (error) {
    console.error('获取企业微信 Access Token 异常:', error);
    return null;
  }
}

/**
 * 发送企业微信消息
 */
export async function sendWeComMessage(options: {
  msgtype: 'text' | 'markdown' | 'image' | 'news' | 'template_card';
  content: any;
  toUser?: string;
  toParty?: string;
  toTag?: string;
}): Promise<NotificationResult> {
  try {
    if (!notificationConfig.wecom.enabled) {
      console.log('【MOCK WECOM】', JSON.stringify(options.content).slice(0, 100));
      return { success: true, messageId: 'MOCK_' + Date.now() };
    }

    const accessToken = await getWecomAccessToken();
    if (!accessToken) {
      return { success: false, errorCode: 'TOKEN_ERROR', errorMsg: '获取 Access Token 失败' };
    }

    const body: any = {
      msgtype: options.msgtype,
      [options.msgtype]: options.content,
      agentid: notificationConfig.wecom.agentId,
      to_user: options.toUser || '@all',
      to_party: options.toParty || '',
      to_tag: options.toTag || '',
    };

    const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`;
    const response = await axios.post(url, body);

    if (response.data.errcode === 0) {
      return { success: true, messageId: response.data.msgid?.toString() };
    } else {
      return { success: false, errorCode: response.data.errcode.toString(), errorMsg: response.data.errmsg };
    }
  } catch (error: any) {
    return { success: false, errorCode: 'REQUEST_FAILED', errorMsg: error.message };
  }
}

/**
 * 发送企业微信文本消息
 */
export async function sendWeComText(text: string, toUser?: string): Promise<NotificationResult> {
  return sendWeComMessage({ msgtype: 'text', content: { content: text }, toUser });
}

/**
 * 发送企业微信 Markdown 消息
 */
export async function sendWeComMarkdown(content: string, toUser?: string): Promise<NotificationResult> {
  return sendWeComMessage({ msgtype: 'markdown', content: { content }, toUser });
}

/**
 * 发送企业微信告警通知
 */
export async function sendWeComAlert(data: {
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  content: string;
  timestamp: string;
}): Promise<NotificationResult> {
  const levelText = { info: '通知', warning: '警告', error: '错误', critical: '严重' };

  const content = `
> **【${levelText[data.level]}】${data.title}**

**内容**: ${data.content}

**时间**: ${data.timestamp}
  `.trim();

  return await sendWeComMarkdown(content);
}

// ==================== 统一告警通知 ====================

/**
 * 发送告警通知 (同时发送到所有配置的渠道)
 */
export async function sendAlertNotification(data: {
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  content: string;
  timestamp: string;
  channels?: ('email' | 'sms' | 'dingtalk' | 'wecom')[];
  targets?: {
    emails?: string[];
    phones?: string[];
    dingtalkAtMobiles?: string[];
  };
}): Promise<{ email?: NotificationResult; sms?: NotificationResult; dingtalk?: NotificationResult; wecom?: NotificationResult }> {
  const channels = data.channels || ['email'];
  const results: any = {};
  const timestamp = data.timestamp || new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: ${data.level === 'critical' ? '#d4380d' : data.level === 'error' ? '#ff4d4f' : data.level === 'warning' ? '#faad14' : '#1890ff'};">
        【${data.level.toUpperCase()}】${data.title}
      </h2>
      <p>系统检测到以下问题：</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #1890ff;">
        ${data.content}
      </div>
      <p style="color: #666;">时间：${timestamp}</p>
      <p style="color: #999; margin-top: 20px; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  if (channels.includes('email') && data.targets?.emails) {
    for (const email of data.targets.emails) {
      results.email = await sendEmail({ to: email, subject: `【DGKJ告警】${data.title}`, html: emailHtml });
    }
  }

  if (channels.includes('dingtalk')) {
    results.dingtalk = await sendDingTalkAlert({ ...data, timestamp });
  }

  if (channels.includes('wecom')) {
    results.wecom = await sendWeComAlert({ ...data, timestamp });
  }

  if (channels.includes('sms') && data.targets?.phones) {
    for (const phone of data.targets.phones) {
      results.sms = await sendSmsNotification(phone, 'ALERT_TEMPLATE', { 
        level: data.level, 
        title: data.title,
        content: data.content.slice(0, 50) 
      });
    }
  }

  return results;
}

// ==================== 辅助函数 ====================

function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

function calculateAliyunSignature(params: Record<string, string>, secret: string): string {
  const sortedKeys = Object.keys(params).sort();
  const canonicalizedQueryString = sortedKeys
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const stringToSign = `POST&${encodeURIComponent('/')}&${encodeURIComponent(canonicalizedQueryString)}`;
  const hmac = crypto.createHmac('sha1', secret + '&');
  hmac.update(stringToSign);
  return hmac.digest('base64');
}

function buildQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

/**
 * 测试邮件服务
 */
export async function testEmail(to: string): Promise<NotificationResult> {
  return await sendEmail({
    to,
    subject: '【DGKJ支付】测试邮件',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1890ff;">邮件服务测试</h2>
        <p>这是一封测试邮件。</p>
        <p>如果收到此邮件，说明邮件服务配置正确。</p>
        <p style="color: #999; margin-top: 30px; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `,
  });
}

/**
 * 测试短信服务
 */
export async function testSms(phone: string): Promise<NotificationResult> {
  return await sendVerificationCode(phone, '888888', 5);
}

/**
 * 测试钉钉服务
 */
export async function testDingTalk(): Promise<NotificationResult> {
  return await sendDingTalkMarkdown('测试消息', '这是一条来自 DGKJ 支付平台的测试消息。\n\n如果收到此消息，说明钉钉配置正确。');
}

/**
 * 测试企业微信服务
 */
export async function testWeCom(): Promise<NotificationResult> {
  return await sendWeComMarkdown('这是一条来自 DGKJ 支付平台的测试消息。\n\n如果收到此消息，说明企业微信配置正确。');
}

// ==================== 导出 ====================

export default {
  initializeNotificationConfig,
  // 邮件
  sendEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendMerchantAuditEmail,
  sendTradeNotificationEmail,
  sendSettlementEmail,
  testEmail,
  // 短信
  sendVerificationCode,
  sendSmsNotification,
  testSms,
  // 钉钉
  sendDingTalkMessage,
  sendDingTalkText,
  sendDingTalkMarkdown,
  sendDingTalkAlert,
  testDingTalk,
  // 企业微信
  sendWeComMessage,
  sendWeComText,
  sendWeComMarkdown,
  sendWeComAlert,
  testWeCom,
  // 统一告警
  sendAlertNotification,
};
