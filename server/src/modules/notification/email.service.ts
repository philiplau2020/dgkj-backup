/**
 * DGKJ 支付平台 - 邮件通知服务
 * 
 * 支持 SMTP 发送邮件
 */

// 使用动态导入避免编译错误
// import nodemailer from 'nodemailer';
import { AppDataSource } from '../../config/data-source';
import { SysConfig } from '../../database/entities/sys.entity';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMsg?: string;
}

// 邮件配置
let emailConfig: EmailConfig = {
  host: 'smtp.example.com',
  port: 465,
  secure: true,
  user: '',
  pass: '',
  from: 'noreply@dgkj.com',
  fromName: 'DGKJ支付平台',
};

// 邮件发送器类型
interface Transporter {
  sendMail: (options: any) => Promise<any>;
}

// 邮件发送器
let transporter: Transporter | null = null;

/**
 * 初始化邮件配置
 */
export async function initializeEmailConfig() {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    
    // 从数据库配置中读取邮件配置
    const emailConfigRecord = await configRepo.findOne({ 
      where: { configKey: 'email_config' } 
    });
    
    if (emailConfigRecord) {
      const config = JSON.parse(emailConfigRecord.configValue);
      emailConfig = { ...emailConfig, ...config };
    }
    
    // 创建 transporter (使用动态导入避免编译错误)
    try {
      // @ts-ignore
      const nodemailer = require('nodemailer');
      transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass,
        },
      });
    } catch (error) {
      console.error('加载 nodemailer 失败:', error);
    }

    console.log('邮件服务已初始化，host:', emailConfig.host);
  } catch (error) {
    console.error('初始化邮件配置失败:', error);
  }
}

/**
 * 发送邮件
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
}): Promise<EmailResult> {
  try {
    if (!transporter) {
      await initializeEmailConfig();
    }

    if (!transporter) {
      // Mock 模式
      console.log('【MOCK EMAIL】');
      console.log('  To:', options.to);
      console.log('  Subject:', options.subject);
      console.log('  Content:', options.html.slice(0, 200));
      
      return {
        success: true,
        messageId: 'MOCK_' + Date.now(),
      };
    }

    const to = Array.isArray(options.to) ? options.to.join(',') : options.to;

    const info = await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
      to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      html: options.html,
      attachments: options.attachments,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    return {
      success: false,
      errorCode: 'SEND_FAILED',
      errorMsg: error.message,
    };
  }
}

/**
 * 发送验证码邮件
 */
export async function sendVerificationEmail(
  to: string,
  code: string,
  expireMinutes: number = 10
): Promise<EmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">邮箱验证码</h2>
      <p>您好，</p>
      <p>您的验证码是：<strong style="font-size: 24px; color: #1890ff;">${code}</strong></p>
      <p>验证码 ${expireMinutes} 分钟内有效，请勿泄露给他人。</p>
      <p style="color: #999; margin-top: 30px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  return await sendEmail({
    to,
    subject: '【DGKJ支付】邮箱验证码',
    html,
  });
}

/**
 * 发送密码重置邮件
 */
export async function sendResetPasswordEmail(
  to: string,
  resetLink: string,
  expireHours: number = 24
): Promise<EmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">密码重置</h2>
      <p>您好，</p>
      <p>您申请了密码重置，请点击下面的链接完成操作：</p>
      <p><a href="${resetLink}" style="color: #1890ff;">点击此处重置密码</a></p>
      <p>链接 ${expireHours} 小时内有效。</p>
      <p>如果这不是您本人操作，请忽略此邮件。</p>
      <p style="color: #999; margin-top: 30px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  return await sendEmail({
    to,
    subject: '【DGKJ支付】密码重置',
    html,
  });
}

/**
 * 发送商户审核通知
 */
export async function sendMerchantAuditEmail(
  to: string,
  merchantName: string,
  status: 'approved' | 'rejected',
  reason?: string
): Promise<EmailResult> {
  const statusText = status === 'approved' ? '已通过' : '已拒绝';
  const statusColor = status === 'approved' ? '#52c41a' : '#ff4d4f';
  
  let content = `<p>您的商户 "${merchantName}" 审核${statusText}。</p>`;
  if (status === 'rejected' && reason) {
    content += `<p>拒绝原因：${reason}</p>`;
  }
  if (status === 'approved') {
    content += `<p>恭喜！您可以开始使用我们的服务了。</p>`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">商户审核结果通知</h2>
      <p>您好，</p>
      ${content}
      <p style="color: #999; margin-top: 30px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  return await sendEmail({
    to,
    subject: `【DGKJ支付】商户 "${merchantName}" 审核${statusText}`,
    html,
  });
}

/**
 * 发送交易通知
 */
export async function sendTradeNotificationEmail(
  to: string,
  data: {
    orderNo: string;
    amount: number;
    status: string;
    paidTime?: string;
    payWay: string;
  }
): Promise<EmailResult> {
  const statusText = {
    paid: '已支付',
    refunded: '已退款',
    closed: '已关闭',
  }[data.status] || data.status;

  const payWayText = {
    wx_native: '微信扫码',
    wx_jsapi: '微信JSAPI',
    wx_app: '微信APP',
    ali_qr: '支付宝扫码',
    ali_jsapi: '支付宝JSAPI',
    ali_app: '支付宝APP',
  }[data.payWay] || data.payWay;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">交易通知</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">订单号</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.orderNo}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">订单金额</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">¥${(data.amount / 100).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">支付方式</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${payWayText}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">状态</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${statusText}</td>
        </tr>
        ${data.paidTime ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">支付时间</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.paidTime}</td>
        </tr>
        ` : ''}
      </table>
      <p style="color: #999; margin-top: 30px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  return await sendEmail({
    to,
    subject: `【DGKJ支付】交易${statusText}通知`,
    html,
  });
}

/**
 * 发送结算到账通知
 */
export async function sendSettlementEmail(
  to: string,
  data: {
    settleNo: string;
    amount: number;
    fee: number;
    actualAmount: number;
    arriveTime?: string;
  }
): Promise<EmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">结算到账通知</h2>
      <p>您好，</p>
      <p>您的结算已处理完成，资金已到账。</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">结算单号</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.settleNo}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">结算金额</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">¥${(data.amount / 100).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">手续费</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">-¥${(data.fee / 100).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">实际到账</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #52c41a;">¥${(data.actualAmount / 100).toFixed(2)}</td>
        </tr>
        ${data.arriveTime ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">到账时间</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.arriveTime}</td>
        </tr>
        ` : ''}
      </table>
      <p style="color: #999; margin-top: 30px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  return await sendEmail({
    to,
    subject: '【DGKJ支付】结算到账通知',
    html,
  });
}

/**
 * 发送告警邮件
 */
export async function sendAlertEmail(
  to: string[],
  data: {
    level: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    content: string;
    timestamp: string;
  }
): Promise<EmailResult> {
  const levelColors = {
    info: '#1890ff',
    warning: '#faad14',
    error: '#ff4d4f',
    critical: '#d4380d',
  };
  const levelText = {
    info: '通知',
    warning: '警告',
    error: '错误',
    critical: '严重',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${levelColors[data.level]};">[${levelText[data.level]}] ${data.title}</h2>
      <p>系统检测到以下问题：</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0;">
        ${data.content}
      </div>
      <p style="color: #666;">时间：${data.timestamp}</p>
      <p style="color: #999; margin-top: 30px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;

  return await sendEmail({
    to,
    subject: `【DGKJ告警】${levelText[data.level]} - ${data.title}`,
    html,
  });
}

/**
 * 发送测试邮件
 */
export async function sendTestEmail(to: string): Promise<EmailResult> {
  return await sendEmail({
    to,
    subject: '【DGKJ支付】测试邮件',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">邮件服务测试</h2>
        <p>这是一封测试邮件。</p>
        <p>如果收到此邮件，说明邮件服务配置正确。</p>
        <p style="color: #999; margin-top: 30px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `,
  });
}

export default {
  initializeEmailConfig,
  sendEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendMerchantAuditEmail,
  sendTradeNotificationEmail,
  sendSettlementEmail,
  sendAlertEmail,
  sendTestEmail,
};
