/**
 * DGKJ 支付平台 - 通知配置管理路由
 */
import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/data-source';
import { SysConfig } from '../../database/entities/sys.entity';
import * as notificationService from './notification.service';

const router = Router();

// ==================== 辅助函数 ====================

function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: 400, message: errors.array()[0].msg, data: null });
  }
  next();
}

// ==================== 邮件配置 ====================

// 获取邮件配置
router.get('/config/email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    const config = await configRepo.findOne({ where: { configKey: 'email_config' } });
    
    let emailConfig = {
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      user: '',
      pass: '',
      from: 'noreply@dgkj.com',
      fromName: 'DGKJ支付平台',
      enabled: false,
    };

    if (config && config.configValue) {
      const savedConfig = JSON.parse(config.configValue);
      emailConfig = { ...emailConfig, ...savedConfig, pass: savedConfig.pass ? '******' : '' };
    }

    res.json({ code: 0, message: 'success', data: emailConfig });
  } catch (error) {
    next(error);
  }
});

// 保存邮件配置
router.post(
  '/config/email',
  [
    body('host').notEmpty().withMessage('SMTP服务器不能为空'),
    body('port').isInt({ min: 1, max: 65535 }).withMessage('端口号格式不正确'),
    body('user').notEmpty().withMessage('用户名不能为空'),
    body('pass').notEmpty().withMessage('密码不能为空'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { host, port, secure, user, pass, from, fromName, enabled } = req.body;
      const configRepo = AppDataSource.getRepository(SysConfig);

      let config = await configRepo.findOne({ where: { configKey: 'email_config' } });
      const configValue = JSON.stringify({ host, port, secure, user, pass, from, fromName });

      if (config) {
        await configRepo.update(config.id, { configValue, updateTime: new Date() });
      } else {
        config = configRepo.create({
          id: uuidv4(),
          configName: '邮件配置',
          configKey: 'email_config',
          configValue,
          configType: 'json',
          groupName: '通知',
          remark: '系统邮件发送配置',
          status: 1,
          createTime: new Date(),
          updateTime: new Date(),
        });
        await configRepo.save(config);
      }

      // 重新初始化邮件服务
      await notificationService.initializeNotificationConfig();

      res.json({ code: 0, message: '保存成功', data: null });
    } catch (error) {
      next(error);
    }
  }
);

// 测试邮件发送
router.post('/config/email/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ code: 400, message: '收件人不能为空', data: null });
    }

    const result = await notificationService.testEmail(to);
    res.json({ code: result.success ? 0 : 500, message: result.success ? '发送成功' : result.errorMsg, data: result });
  } catch (error) {
    next(error);
  }
});

// ==================== 短信配置 ====================

// 获取短信配置
router.get('/config/sms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    const config = await configRepo.findOne({ where: { configKey: 'sms_config' } });
    
    let smsConfig = {
      provider: 'mock',
      accessKeyId: '',
      accessKeySecret: '',
      signName: 'DGKJ支付',
      templateCode: '',
      enabled: false,
    };

    if (config && config.configValue) {
      const savedConfig = JSON.parse(config.configValue);
      smsConfig = { ...smsConfig, ...savedConfig, accessKeySecret: savedConfig.accessKeySecret ? '******' : '' };
    }

    res.json({ code: 0, message: 'success', data: smsConfig });
  } catch (error) {
    next(error);
  }
});

// 保存短信配置
router.post(
  '/config/sms',
  [
    body('provider').isIn(['aliyun', 'tencent', 'mock']).withMessage('服务商不正确'),
    body('signName').notEmpty().withMessage('签名不能为空'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { provider, accessKeyId, accessKeySecret, signName, templateCode, enabled } = req.body;
      const configRepo = AppDataSource.getRepository(SysConfig);

      let config = await configRepo.findOne({ where: { configKey: 'sms_config' } });
      const configValue = JSON.stringify({ provider, accessKeyId, accessKeySecret, signName, templateCode });

      if (config) {
        await configRepo.update(config.id, { configValue, updateTime: new Date() });
      } else {
        config = configRepo.create({
          id: uuidv4(),
          configName: '短信配置',
          configKey: 'sms_config',
          configValue,
          configType: 'json',
          groupName: '通知',
          remark: '短信发送配置',
          status: 1,
          createTime: new Date(),
          updateTime: new Date(),
        });
        await configRepo.save(config);
      }

      await notificationService.initializeNotificationConfig();

      res.json({ code: 0, message: '保存成功', data: null });
    } catch (error) {
      next(error);
    }
  }
);

// 测试短信发送
router.post('/config/sms/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ code: 400, message: '手机号不能为空', data: null });
    }

    const result = await notificationService.testSms(phone);
    res.json({ code: result.success ? 0 : 500, message: result.success ? '发送成功' : result.errorMsg, data: result });
  } catch (error) {
    next(error);
  }
});

// ==================== 钉钉配置 ====================

// 获取钉钉配置
router.get('/config/dingtalk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    const config = await configRepo.findOne({ where: { configKey: 'dingtalk_config' } });
    
    let dingtalkConfig = {
      enabled: false,
      webhook: '',
      secret: '',
    };

    if (config && config.configValue) {
      const savedConfig = JSON.parse(config.configValue);
      dingtalkConfig = { ...dingtalkConfig, ...savedConfig, secret: savedConfig.secret ? '******' : '' };
    }

    res.json({ code: 0, message: 'success', data: dingtalkConfig });
  } catch (error) {
    next(error);
  }
});

// 保存钉钉配置
router.post(
  '/config/dingtalk',
  [body('webhook').notEmpty().withMessage('Webhook地址不能为空')],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { enabled, webhook, secret } = req.body;
      const configRepo = AppDataSource.getRepository(SysConfig);

      let config = await configRepo.findOne({ where: { configKey: 'dingtalk_config' } });
      const configValue = JSON.stringify({ enabled, webhook, secret });

      if (config) {
        await configRepo.update(config.id, { configValue, updateTime: new Date() });
      } else {
        config = configRepo.create({
          id: uuidv4(),
          configName: '钉钉配置',
          configKey: 'dingtalk_config',
          configValue,
          configType: 'json',
          groupName: '通知',
          remark: '钉钉群机器人配置',
          status: 1,
          createTime: new Date(),
          updateTime: new Date(),
        });
        await configRepo.save(config);
      }

      await notificationService.initializeNotificationConfig();

      res.json({ code: 0, message: '保存成功', data: null });
    } catch (error) {
      next(error);
    }
  }
);

// 测试钉钉发送
router.post('/config/dingtalk/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.testDingTalk();
    res.json({ code: result.success ? 0 : 500, message: result.success ? '发送成功' : result.errorMsg, data: result });
  } catch (error) {
    next(error);
  }
});

// ==================== 企业微信配置 ====================

// 获取企业微信配置
router.get('/config/wecom', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    const config = await configRepo.findOne({ where: { configKey: 'wecom_config' } });
    
    let wecomConfig = {
      enabled: false,
      corpId: '',
      corpSecret: '',
      agentId: '',
      webhookUrl: '',
    };

    if (config && config.configValue) {
      const savedConfig = JSON.parse(config.configValue);
      wecomConfig = { ...wecomConfig, ...savedConfig, corpSecret: savedConfig.corpSecret ? '******' : '' };
    }

    res.json({ code: 0, message: 'success', data: wecomConfig });
  } catch (error) {
    next(error);
  }
});

// 保存企业微信配置
router.post(
  '/config/wecom',
  [
    body('corpId').notEmpty().withMessage('企业ID不能为空'),
    body('corpSecret').notEmpty().withMessage('应用Secret不能为空'),
    body('agentId').notEmpty().withMessage('应用AgentId不能为空'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { enabled, corpId, corpSecret, agentId, webhookUrl } = req.body;
      const configRepo = AppDataSource.getRepository(SysConfig);

      let config = await configRepo.findOne({ where: { configKey: 'wecom_config' } });
      const configValue = JSON.stringify({ enabled, corpId, corpSecret, agentId, webhookUrl });

      if (config) {
        await configRepo.update(config.id, { configValue, updateTime: new Date() });
      } else {
        config = configRepo.create({
          id: uuidv4(),
          configName: '企业微信配置',
          configKey: 'wecom_config',
          configValue,
          configType: 'json',
          groupName: '通知',
          remark: '企业微信应用配置',
          status: 1,
          createTime: new Date(),
          updateTime: new Date(),
        });
        await configRepo.save(config);
      }

      await notificationService.initializeNotificationConfig();

      res.json({ code: 0, message: '保存成功', data: null });
    } catch (error) {
      next(error);
    }
  }
);

// 测试企业微信发送
router.post('/config/wecom/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.testWeCom();
    res.json({ code: result.success ? 0 : 500, message: result.success ? '发送成功' : result.errorMsg, data: result });
  } catch (error) {
    next(error);
  }
});

// ==================== 发送告警通知 ====================

// 发送告警通知
router.post('/alert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level, title, content, channels, targets } = req.body;

    if (!title || !content) {
      return res.status(400).json({ code: 400, message: '标题和内容不能为空', data: null });
    }

    const result = await notificationService.sendAlertNotification({
      level: level || 'info',
      title,
      content,
      timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      channels: channels || ['email'],
      targets,
    });

    const allSuccess = Object.values(result).every((r: any) => r?.success);
    res.json({ code: allSuccess ? 0 : 500, message: allSuccess ? '发送成功' : '部分发送失败', data: result });
  } catch (error) {
    next(error);
  }
});

// ==================== 发送记录管理 ====================
import { notifyTemplateService } from './template.service';

// 获取发送记录列表
router.get('/record/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notifyType, sceneCode, sendStatus, receiver, startTime, endTime, page = '1', pageSize = '20' } = req.query;

    const result = await notifyTemplateService.getRecordList({
      notifyType: notifyType as string,
      sceneCode: sceneCode as string,
      sendStatus: sendStatus !== undefined ? parseInt(sendStatus as string) : undefined,
      receiver: receiver as string,
      startTime: startTime as string,
      endTime: endTime as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    });

    res.json({ code: 0, message: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

// 重试发送失败的通知
router.post('/record/retry/:notifyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notifyId } = req.params;
    const result = await notifyTemplateService.retryNotification(notifyId);

    if (result.success) {
      res.json({ code: 0, message: '重发成功', data: result });
    } else {
      res.status(400).json({ code: 400, message: result.error || '重发失败', data: null });
    }
  } catch (error) {
    next(error);
  }
});

// ==================== 通知模板管理 ====================

// 获取模板列表
router.get('/template/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notifyType, sceneCode, status, page = '1', pageSize = '20' } = req.query;

    const result = await notifyTemplateService.getTemplateList({
      notifyType: notifyType as string,
      sceneCode: sceneCode as string,
      status: status !== undefined ? parseInt(status as string) : undefined,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    });

    res.json({ code: 0, message: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

// 获取模板详情
router.get('/template/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await notifyTemplateService.getTemplateById(parseInt(req.params.id));
    if (!template) {
      return res.status(404).json({ code: 404, message: '模板不存在', data: null });
    }
    res.json({ code: 0, message: 'success', data: template });
  } catch (error) {
    next(error);
  }
});

// 创建模板
router.post('/template', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await notifyTemplateService.createTemplate(req.body);
    res.json({ code: 0, message: '创建成功', data: template });
  } catch (error) {
    next(error);
  }
});

// 更新模板
router.put('/template/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await notifyTemplateService.updateTemplate(parseInt(req.params.id), req.body);
    res.json({ code: 0, message: '更新成功', data: template });
  } catch (error) {
    next(error);
  }
});

// 删除模板
router.delete('/template/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notifyTemplateService.deleteTemplate(parseInt(req.params.id));
    res.json({ code: 0, message: '删除成功', data: null });
  } catch (error) {
    next(error);
  }
});

// 初始化默认模板
router.post('/template/init', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notifyTemplateService.initDefaultTemplates();
    res.json({ code: 0, message: '初始化成功', data: null });
  } catch (error) {
    next(error);
  }
});

// 渲染模板预览
router.post('/template/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { templateId, variables } = req.body;
    const template = await notifyTemplateService.getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({ code: 404, message: '模板不存在', data: null });
    }
    const result = notifyTemplateService.renderTemplate(template, variables);
    res.json({ code: result.success ? 0 : 400, message: result.success ? '渲染成功' : result.error, data: result });
  } catch (error) {
    next(error);
  }
});

// ==================== 订阅管理 ====================

// 获取订阅列表
router.get('/subscription/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subscribeType, subscribeNo, status, page = '1', pageSize = '20' } = req.query;

    const result = await notifyTemplateService.getSubscriptionList({
      subscribeType: subscribeType as string,
      subscribeNo: subscribeNo as string,
      status: status !== undefined ? parseInt(status as string) : undefined,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    });

    res.json({ code: 0, message: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

// 创建订阅
router.post('/subscription', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await notifyTemplateService.createSubscription(req.body);
    res.json({ code: 0, message: '创建成功', data: subscription });
  } catch (error) {
    next(error);
  }
});

// 更新订阅
router.put('/subscription/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await notifyTemplateService.updateSubscription(parseInt(req.params.id), req.body);
    res.json({ code: 0, message: '更新成功', data: subscription });
  } catch (error) {
    next(error);
  }
});

// 删除订阅
router.delete('/subscription/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notifyTemplateService.deleteSubscription(parseInt(req.params.id));
    res.json({ code: 0, message: '删除成功', data: null });
  } catch (error) {
    next(error);
  }
});

// ==================== 风控预警配置 ====================

// 获取风控配置列表
router.get('/risk-alert/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { alertType, status, page = '1', pageSize = '20' } = req.query;

    const result = await notifyTemplateService.getRiskAlertList({
      alertType: alertType as string,
      status: status !== undefined ? parseInt(status as string) : undefined,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    });

    res.json({ code: 0, message: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

// 创建风控配置
router.post('/risk-alert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await notifyTemplateService.createRiskAlert(req.body);
    res.json({ code: 0, message: '创建成功', data: config });
  } catch (error) {
    next(error);
  }
});

// 更新风控配置
router.put('/risk-alert/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await notifyTemplateService.updateRiskAlert(parseInt(req.params.id), req.body);
    res.json({ code: 0, message: '更新成功', data: config });
  } catch (error) {
    next(error);
  }
});

// 删除风控配置
router.delete('/risk-alert/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notifyTemplateService.deleteRiskAlert(parseInt(req.params.id));
    res.json({ code: 0, message: '删除成功', data: null });
  } catch (error) {
    next(error);
  }
});

// ==================== 阿里云短信配置 ====================

// 获取阿里云短信配置
router.get('/config/sms/aliyun', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    const config = await configRepo.findOne({ where: { configKey: 'sms_aliyun_config' } });

    let aliyunConfig = {
      accessKeyId: '',
      accessKeySecret: '',
      signName: 'DGKJ支付',
      templateCode: '',
      enabled: false,
    };

    if (config && config.configValue) {
      const savedConfig = JSON.parse(config.configValue);
      aliyunConfig = {
        ...aliyunConfig,
        ...savedConfig,
        accessKeySecret: savedConfig.accessKeySecret ? '******' : '',
      };
    }

    res.json({ code: 0, message: 'success', data: aliyunConfig });
  } catch (error) {
    next(error);
  }
});

// 保存阿里云短信配置
router.post('/config/sms/aliyun', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessKeyId, accessKeySecret, signName, templateCode, enabled } = req.body;
    const configRepo = AppDataSource.getRepository(SysConfig);

    let config = await configRepo.findOne({ where: { configKey: 'sms_aliyun_config' } });
    const configValue = JSON.stringify({ accessKeyId, accessKeySecret, signName, templateCode, enabled });

    if (config) {
      await configRepo.update(config.id, { configValue, updateTime: new Date() });
    } else {
      config = configRepo.create({
        id: uuidv4(),
        configName: '阿里云短信配置',
        configKey: 'sms_aliyun_config',
        configValue,
        configType: 'json',
        groupName: '通知',
        remark: '阿里云短信发送配置',
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await configRepo.save(config);
    }

    res.json({ code: 0, message: '保存成功', data: null });
  } catch (error) {
    next(error);
  }
});

// ==================== 高德地图配置 ====================

// 获取高德地图配置
router.get('/config/map/amap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    const config = await configRepo.findOne({ where: { configKey: 'map_amap_config' } });

    let amapConfig = {
      key: '',
      securityJsCode: '',
      enabled: false,
    };

    if (config && config.configValue) {
      const savedConfig = JSON.parse(config.configValue);
      amapConfig = { ...amapConfig, ...savedConfig, key: savedConfig.key ? '******' : '' };
    }

    res.json({ code: 0, message: 'success', data: amapConfig });
  } catch (error) {
    next(error);
  }
});

// 保存高德地图配置
router.post('/config/map/amap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, securityJsCode, enabled } = req.body;
    const configRepo = AppDataSource.getRepository(SysConfig);

    let config = await configRepo.findOne({ where: { configKey: 'map_amap_config' } });
    const configValue = JSON.stringify({ key, securityJsCode, enabled });

    if (config) {
      await configRepo.update(config.id, { configValue, updateTime: new Date() });
    } else {
      config = configRepo.create({
        id: uuidv4(),
        configName: '高德地图配置',
        configKey: 'map_amap_config',
        configValue,
        configType: 'json',
        groupName: '地图',
        remark: '高德地图 API 配置',
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await configRepo.save(config);
    }

    res.json({ code: 0, message: '保存成功', data: null });
  } catch (error) {
    next(error);
  }
});

// ==================== 百度地图配置 ====================

// 获取百度地图配置
router.get('/config/map/baidu', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    const config = await configRepo.findOne({ where: { configKey: 'map_baidu_config' } });

    let baiduConfig = {
      ak: '',
      enabled: false,
    };

    if (config && config.configValue) {
      const savedConfig = JSON.parse(config.configValue);
      baiduConfig = { ...baiduConfig, ...savedConfig, ak: savedConfig.ak ? '******' : '' };
    }

    res.json({ code: 0, message: 'success', data: baiduConfig });
  } catch (error) {
    next(error);
  }
});

// 保存百度地图配置
router.post('/config/map/baidu', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ak, enabled } = req.body;
    const configRepo = AppDataSource.getRepository(SysConfig);

    let config = await configRepo.findOne({ where: { configKey: 'map_baidu_config' } });
    const configValue = JSON.stringify({ ak, enabled });

    if (config) {
      await configRepo.update(config.id, { configValue, updateTime: new Date() });
    } else {
      config = configRepo.create({
        id: uuidv4(),
        configName: '百度地图配置',
        configKey: 'map_baidu_config',
        configValue,
        configType: 'json',
        groupName: '地图',
        remark: '百度地图 API 配置',
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await configRepo.save(config);
    }

    res.json({ code: 0, message: '保存成功', data: null });
  } catch (error) {
    next(error);
  }
});

export default router;
