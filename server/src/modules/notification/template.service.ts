/**
 * 通知模板服务
 */

import { AppDataSource } from '../../config/data-source';
import { NotifyTemplate, NotifyRecord, NotifySubscription, RiskAlertConfig } from '../../database/entities';
import notificationService from './notification.service';
import { v4 as uuidv4 } from 'uuid';

const templateRepo = AppDataSource.getRepository(NotifyTemplate);
const recordRepo = AppDataSource.getRepository(NotifyRecord);
const subscriptionRepo = AppDataSource.getRepository(NotifySubscription);
const riskAlertRepo = AppDataSource.getRepository(RiskAlertConfig);

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  example: string;
}

export interface RenderResult {
  subject?: string;
  content: string;
  success: boolean;
  error?: string;
}

/**
 * 通知模板服务
 */
class NotifyTemplateService {
  /**
   * 获取所有模板列表
   */
  async getTemplateList(params: {
    notifyType?: string;
    sceneCode?: string;
    status?: number;
    page?: number;
    pageSize?: number;
  }) {
    const { notifyType, sceneCode, status, page = 1, pageSize = 20 } = params;

    const queryBuilder = templateRepo.createQueryBuilder('t');

    if (notifyType) {
      queryBuilder.andWhere('t.notifyType = :notifyType', { notifyType });
    }
    if (sceneCode) {
      queryBuilder.andWhere('t.sceneCode LIKE :sceneCode', { sceneCode: `%${sceneCode}%` });
    }
    if (status !== undefined) {
      queryBuilder.andWhere('t.status = :status', { status });
    }

    const [list, total] = await queryBuilder
      .orderBy('t.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  /**
   * 获取模板详情
   */
  async getTemplateById(id: number) {
    return templateRepo.findOne({ where: { id } });
  }

  /**
   * 根据编码获取模板
   */
  async getTemplateByCode(templateCode: string) {
    return templateRepo.findOne({ where: { templateCode, status: 1 } });
  }

  /**
   * 创建模板
   */
  async createTemplate(data: Partial<NotifyTemplate>) {
    const template = templateRepo.create(data);
    return templateRepo.save(template);
  }

  /**
   * 更新模板
   */
  async updateTemplate(id: number, data: Partial<NotifyTemplate>) {
    await templateRepo.update(id, data);
    return this.getTemplateById(id);
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: number) {
    return templateRepo.delete(id);
  }

  /**
   * 获取所有启用的模板（按场景分组）
   */
  async getEnabledTemplatesByScene() {
    const templates = await templateRepo.find({
      where: { status: 1 },
      order: { notifyType: 'ASC' },
    });

    const grouped: Record<string, NotifyTemplate[]> = {};
    for (const t of templates) {
      if (!grouped[t.sceneCode]) {
        grouped[t.sceneCode] = [];
      }
      grouped[t.sceneCode].push(t);
    }

    return grouped;
  }

  /**
   * 渲染模板
   */
  renderTemplate(template: NotifyTemplate, variables: Record<string, string>): RenderResult {
    try {
      let content = template.content;
      let subject = template.subject;

      // 解析变量列表
      const definedVariables = template.variables ? JSON.parse(template.variables) : [];

      // 替换内容中的变量
      for (const key of Object.keys(variables)) {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        content = content.replace(regex, variables[key] || '');
        if (subject) {
          subject = subject.replace(regex, variables[key] || '');
        }
      }

      return { content, subject, success: true };
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : '渲染失败',
      };
    }
  }

  /**
   * 发送通知（使用模板）
   */
  async sendNotification(params: {
    notifyType: string;
    sceneCode: string;
    receiver: string;
    receiverType?: string;
    receiverNo?: string;
    variables: Record<string, string>;
    sync?: boolean;
  }): Promise<{ success: boolean; notifyId?: string; error?: string }> {
    const { notifyType, sceneCode, receiver, receiverType, receiverNo, variables, sync = false } = params;

    const template = await this.getTemplateByCode(`${notifyType}_${sceneCode}`);
    if (!template) {
      return { success: false, error: `未找到模板: ${notifyType}_${sceneCode}` };
    }

    const renderResult = this.renderTemplate(template, variables);
    if (!renderResult.success) {
      return { success: false, error: renderResult.error };
    }

    const notifyId = uuidv4();

    // 创建发送记录
    const record = recordRepo.create({
      notifyId,
      notifyType,
      sceneCode,
      receiver,
      receiverType,
      receiverNo,
      subject: renderResult.subject,
      content: renderResult.content,
      sendStatus: 0,
    });
    await recordRepo.save(record);

    if (sync) {
      // 同步发送
      try {
        let result;
        if (notifyType === 'email') {
          result = await notificationService.sendEmail({
            to: receiver,
            subject: renderResult.subject,
            html: renderResult.content,
          });
        } else if (notifyType === 'sms') {
          result = await notificationService.sendSmsNotification(receiver, 'TEMPLATE', {});
        } else {
          result = { success: false, errorCode: 'UNSUPPORTED', errorMsg: '不支持的通知类型' };
        }

        if (result.success) {
          record.sendStatus = 2;
          record.sendTime = new Date();
          await recordRepo.save(record);
          return { success: true, notifyId };
        } else {
          throw new Error(result.errorMsg || '发送失败');
        }
      } catch (error) {
        record.sendStatus = 3;
        record.failReason = error instanceof Error ? error.message : '发送失败';
        await recordRepo.save(record);

        return { success: false, error: record.failReason };
      }
    } else {
      // 异步发送（通过消息队列）
      await this.queueNotification(notifyId);
      return { success: true, notifyId };
    }
  }

  /**
   * 将通知加入队列
   */
  private async queueNotification(notifyId: string) {
    // 更新状态为发送中
    await recordRepo.update({ notifyId }, { sendStatus: 1 });
    // TODO: 实际应该发送到消息队列
    // 这里简化为直接处理
    setImmediate(() => this.processNotification(notifyId));
  }

  /**
   * 处理队列中的通知
   */
  private async processNotification(notifyId: string) {
    const record = await recordRepo.findOne({ where: { notifyId } });
    if (!record) return;

    try {
      if (record.notifyType === 'email') {
        await notificationService.sendEmail({
          to: record.receiver,
          subject: record.subject || '',
          html: record.content,
        });
      } else if (record.notifyType === 'sms') {
        await notificationService.sendSmsNotification(record.receiver, 'TEMPLATE', {});
      }

      record.sendStatus = 2;
      record.sendTime = new Date();
    } catch (error) {
      record.sendStatus = 3;
      record.failReason = error instanceof Error ? error.message : '发送失败';
      record.retryCount += 1;
    }

    await recordRepo.save(record);
  }

  /**
   * 获取发送记录列表
   */
  async getRecordList(params: {
    notifyType?: string;
    sceneCode?: string;
    sendStatus?: number;
    receiver?: string;
    startTime?: string;
    endTime?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { notifyType, sceneCode, sendStatus, receiver, startTime, endTime, page = 1, pageSize = 20 } = params;

    const queryBuilder = recordRepo.createQueryBuilder('r');

    if (notifyType) {
      queryBuilder.andWhere('r.notifyType = :notifyType', { notifyType });
    }
    if (sceneCode) {
      queryBuilder.andWhere('r.sceneCode = :sceneCode', { sceneCode });
    }
    if (sendStatus !== undefined) {
      queryBuilder.andWhere('r.sendStatus = :sendStatus', { sendStatus });
    }
    if (receiver) {
      queryBuilder.andWhere('r.receiver LIKE :receiver', { receiver: `%${receiver}%` });
    }
    if (startTime) {
      queryBuilder.andWhere('r.createdAt >= :startTime', { startTime });
    }
    if (endTime) {
      queryBuilder.andWhere('r.createdAt <= :endTime', { endTime });
    }

    const [list, total] = await queryBuilder
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  /**
   * 重试发送失败的通知
   */
  async retryNotification(notifyId: string) {
    const record = await recordRepo.findOne({ where: { notifyId } });
    if (!record) {
      return { success: false, error: '通知记录不存在' };
    }

    if (record.sendStatus !== 3) {
      return { success: false, error: '只能重试发送失败的通知' };
    }

    record.sendStatus = 1;
    record.retryCount += 1;
    await recordRepo.save(record);

    await this.processNotification(notifyId);

    const updatedRecord = await recordRepo.findOne({ where: { notifyId } });
    return {
      success: updatedRecord?.sendStatus === 2,
      error: updatedRecord?.sendStatus === 3 ? updatedRecord.failReason : undefined,
    };
  }

  /**
   * 订阅管理 - 获取订阅列表
   */
  async getSubscriptionList(params: {
    subscribeType?: string;
    subscribeNo?: string;
    status?: number;
    page?: number;
    pageSize?: number;
  }) {
    const { subscribeType, subscribeNo, status, page = 1, pageSize = 20 } = params;

    const queryBuilder = subscriptionRepo.createQueryBuilder('s');

    if (subscribeType) {
      queryBuilder.andWhere('s.subscribeType = :subscribeType', { subscribeType });
    }
    if (subscribeNo) {
      queryBuilder.andWhere('s.subscribeNo = :subscribeNo', { subscribeNo });
    }
    if (status !== undefined) {
      queryBuilder.andWhere('s.status = :status', { status });
    }

    const [list, total] = await queryBuilder
      .orderBy('s.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  /**
   * 创建订阅
   */
  async createSubscription(data: Partial<NotifySubscription>) {
    const subscription = subscriptionRepo.create(data);
    return subscriptionRepo.save(subscription);
  }

  /**
   * 更新订阅
   */
  async updateSubscription(id: number, data: Partial<NotifySubscription>) {
    await subscriptionRepo.update(id, data);
    return subscriptionRepo.findOne({ where: { id } });
  }

  /**
   * 删除订阅
   */
  async deleteSubscription(id: number) {
    return subscriptionRepo.delete(id);
  }

  /**
   * 风控配置 - 获取列表
   */
  async getRiskAlertList(params: {
    alertType?: string;
    status?: number;
    page?: number;
    pageSize?: number;
  }) {
    const { alertType, status, page = 1, pageSize = 20 } = params;

    const queryBuilder = riskAlertRepo.createQueryBuilder('r');

    if (alertType) {
      queryBuilder.andWhere('r.alertType = :alertType', { alertType });
    }
    if (status !== undefined) {
      queryBuilder.andWhere('r.status = :status', { status });
    }

    const [list, total] = await queryBuilder
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  /**
   * 创建风控配置
   */
  async createRiskAlert(data: Partial<RiskAlertConfig>) {
    const config = riskAlertRepo.create(data);
    return riskAlertRepo.save(config);
  }

  /**
   * 更新风控配置
   */
  async updateRiskAlert(id: number, data: Partial<RiskAlertConfig>) {
    await riskAlertRepo.update(id, data);
    return riskAlertRepo.findOne({ where: { id } });
  }

  /**
   * 删除风控配置
   */
  async deleteRiskAlert(id: number) {
    return riskAlertRepo.delete(id);
  }

  /**
   * 检查风控规则并触发预警
   */
  async checkAndTriggerRiskAlert(alertType: string, params: Record<string, any>) {
    const configs = await riskAlertRepo.find({ where: { alertType, status: 1 } });

    for (const config of configs) {
      let triggered = false;

      switch (alertType) {
        case 'large_amount':
          triggered = params.amount >= config.thresholdAmount;
          break;
        case 'daily_total':
          triggered = params.dailyTotal >= config.thresholdAmount;
          break;
        case 'abnormal':
          triggered = params.failCount >= config.thresholdCount;
          break;
        case 'channel':
          triggered = params.failCount >= config.thresholdCount;
          break;
      }

      if (triggered) {
        await this.sendRiskAlert(config, params);
      }
    }
  }

  /**
   * 发送风控预警通知
   */
  private async sendRiskAlert(config: RiskAlertConfig, params: Record<string, any>) {
    const notifyTypes = config.notifyTypes?.split(',') || ['email'];

    for (const notifyType of notifyTypes) {
      const receivers = this.getAlertReceivers(config, notifyType.trim() as 'email' | 'sms');

      for (const receiver of receivers) {
        await this.sendNotification({
          notifyType,
          sceneCode: 'RISK_ALERT',
          receiver,
          variables: {
            alertName: config.alertName,
            alertType: config.alertType,
            ...params,
          },
        });
      }
    }
  }

  /**
   * 获取预警接收人列表
   */
  private getAlertReceivers(config: RiskAlertConfig, notifyType: 'email' | 'sms'): string[] {
    if (notifyType === 'email') {
      return config.notifyEmails?.split(',').filter(Boolean) || [];
    } else {
      return config.notifyMobiles?.split(',').filter(Boolean) || [];
    }
  }

  /**
   * 初始化默认模板
   */
  async initDefaultTemplates() {
    const defaultTemplates = [
      // 邮件模板
      {
        templateCode: 'email_TRADE_SUCCESS',
        templateName: '支付成功通知(邮件)',
        notifyType: 'email',
        sceneCode: 'TRADE_SUCCESS',
        subject: '【${appName}】支付成功通知',
        content: `<h2>支付成功通知</h2>
<p>尊敬的 ${'$'}{mchName || '商户'}：</p>
<p>您好！您有一笔交易已完成支付，详情如下：</p>
<table>
  <tr><td>订单号</td><td>${'$'}{orderNo || ''}</td></tr>
  <tr><td>支付金额</td><td>¥${'$'}{amount || ''}</td></tr>
  <tr><td>支付通道</td><td>${'$'}{channelName || ''}</td></tr>
  <tr><td>支付时间</td><td>${'$'}{payTime || ''}</td></tr>
</table>`,
        variables: JSON.stringify([
          { name: 'mchName', description: '商户名称', required: true, example: '测试商户' },
          { name: 'orderNo', description: '订单号', required: true, example: 'ORDER123456' },
          { name: 'amount', description: '支付金额', required: true, example: '100.00' },
          { name: 'channelName', description: '支付通道', required: false, example: '微信支付' },
          { name: 'payTime', description: '支付时间', required: false, example: '2024-01-01 12:00:00' },
          { name: 'appName', description: '应用名称', required: false, example: 'DGKJ支付' },
        ]),
        status: 1,
      },
      // 短信模板
      {
        templateCode: 'sms_TRADE_SUCCESS',
        templateName: '支付成功通知(短信)',
        notifyType: 'sms',
        sceneCode: 'TRADE_SUCCESS',
        subject: '',
        content: '【${signName}】尊敬的${mchName}，您有一笔${amount}元的支付订单${orderNo}已成功。',
        variables: JSON.stringify([
          { name: 'signName', description: '签名', required: true, example: 'DGKJ' },
          { name: 'mchName', description: '商户名称', required: true, example: '测试商户' },
          { name: 'amount', description: '支付金额', required: true, example: '100.00' },
          { name: 'orderNo', description: '订单号', required: true, example: 'ORDER123456' },
        ]),
        status: 1,
      },
      // 更多模板...
    ];

    for (const template of defaultTemplates) {
      const exist = await templateRepo.findOne({ where: { templateCode: template.templateCode } });
      if (!exist) {
        await templateRepo.save(templateRepo.create(template));
      }
    }
  }
}

export const notifyTemplateService = new NotifyTemplateService();
