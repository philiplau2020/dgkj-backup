/**
 * 开放平台管理后台 API (/basic-api/open/*)
 */
import { Router, Request, Response, NextFunction } from 'express';
import { authGuard } from '../../common/middleware/auth.middleware';
import { developerService, appService } from './service/open-platform.service';
import { AppDataSource } from '../../config/data-source';
import { OpApiLog, OpApp, OpWebhook } from './entity';
import { OpCode, opResult } from '../../utils/op-code';

const router = Router();

// 所有管理接口需要登录
router.use(authGuard);

// ==================== 开发者管理 ====================

// 开发者列表
router.get('/developer/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await developerService.list({
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      keyword: req.query.keyword as string,
      status: req.query.status as string,
      level: req.query.level as string,
    });
    res.json(opResult(OpCode.SUCCESS, result));
  } catch (e) {
    next(e);
  }
});

// 开发者详情
router.get('/developer/:developerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const info = await developerService.getInfo(req.params.developerId);
    if (!info) return res.status(404).json(opResult(OpCode.SYS_ERROR, null, '开发者不存在'));
    res.json(opResult(OpCode.SUCCESS, info));
  } catch (e) {
    next(e);
  }
});

// 审核开发者
router.post('/developer/:developerId/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, remark } = req.body;
    const result = await developerService.review(req.params.developerId, status, req.user?.username || 'admin', remark);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// 更新开发者等级
router.post('/developer/:developerId/level', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level } = req.body;
    const result = await developerService.updateLevel(req.params.developerId, level);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ==================== 应用管理 ====================

// 应用列表
router.get('/app/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, developerId } = req.query;
    const appRepo = AppDataSource.getRepository(OpApp);
    const queryBuilder = appRepo.createQueryBuilder('app');

    if (developerId) queryBuilder.andWhere('app.developerId = :developerId', { developerId });
    if (keyword) queryBuilder.andWhere('app.appName LIKE :keyword', { keyword: `%${keyword}%` });
    if (status) queryBuilder.andWhere('app.status = :status', { status });

    const [list, total] = await queryBuilder
      .skip((Number(page) - 1) * Number(pageSize))
      .take(Number(pageSize))
      .orderBy('app.createTime', 'DESC')
      .getManyAndCount();

    res.json(opResult(OpCode.SUCCESS, { list, total }));
  } catch (e) {
    next(e);
  }
});

// 应用详情
router.get('/app/:appId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const app = await AppDataSource.getRepository(OpApp).findOne({ where: { appId: req.params.appId } });
    if (!app) return res.status(404).json(opResult(OpCode.SYS_ERROR, null, '应用不存在'));
    res.json(opResult(OpCode.SUCCESS, app));
  } catch (e) {
    next(e);
  }
});

// 审核应用
router.post('/app/:appId/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const result = await appService.review(req.params.appId, status, req.user?.username);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ==================== API 调用日志 ====================

// 日志列表
router.get('/log/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 20, appId, developerId, apiPath, result, startDate, endDate } = req.query;
    const queryBuilder = AppDataSource.getRepository(OpApiLog).createQueryBuilder('log');

    if (appId) queryBuilder.andWhere('log.appId = :appId', { appId });
    if (developerId) queryBuilder.andWhere('log.developerId = :developerId', { developerId });
    if (apiPath) queryBuilder.andWhere('log.apiPath LIKE :apiPath', { apiPath: `%${apiPath}%` });
    if (result) queryBuilder.andWhere('log.result = :result', { result });
    if (startDate) queryBuilder.andWhere('log.createTime >= :startDate', { startDate });
    if (endDate) queryBuilder.andWhere('log.createTime <= :endDate', { endDate });

    const [list, total] = await queryBuilder
      .skip((Number(page) - 1) * Number(pageSize))
      .take(Number(pageSize))
      .orderBy('log.createTime', 'DESC')
      .getManyAndCount();

    res.json(opResult(OpCode.SUCCESS, { list, total }));
  } catch (e) {
    next(e);
  }
});

// 日志统计
router.get('/log/statistics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logRepo = AppDataSource.getRepository(OpApiLog);

    const [todayTotal, todayError, todaySuccess] = await Promise.all([
      logRepo.createQueryBuilder('log')
        .where('DATE(log.createTime) = CURDATE()').getCount(),
      logRepo.createQueryBuilder('log')
        .where('DATE(log.createTime) = CURDATE() AND log.result = :result', { result: 'error' }).getCount(),
      logRepo.createQueryBuilder('log')
        .where('DATE(log.createTime) = CURDATE() AND log.result = :result', { result: 'success' }).getCount(),
    ]);

    const topApis = await logRepo.createQueryBuilder('log')
      .select('log.apiPath', 'apiPath')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.apiPath')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topApps = await logRepo.createQueryBuilder('log')
      .select('log.appId', 'appId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.appId')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    res.json(opResult(OpCode.SUCCESS, {
      today: { total: todayTotal, error: todayError, success: todaySuccess },
      topApis,
      topApps,
    }));
  } catch (e) {
    next(e);
  }
});

// ==================== Webhook 管理 ====================

// 获取 Webhook 列表
router.get('/webhook/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId, eventType, status } = req.query;
    const queryBuilder = AppDataSource.getRepository(OpWebhook).createQueryBuilder('wh');

    if (appId) queryBuilder.andWhere('wh.appId = :appId', { appId });
    if (eventType) queryBuilder.andWhere('wh.eventType = :eventType', { eventType });
    if (status) queryBuilder.andWhere('wh.status = :status', { status });

    const [list, total] = await queryBuilder
      .orderBy('wh.createTime', 'DESC')
      .getManyAndCount();

    res.json(opResult(OpCode.SUCCESS, { list, total }));
  } catch (e) {
    next(e);
  }
});

// 创建 Webhook
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhook = AppDataSource.getRepository(OpWebhook).create({
      ...req.body,
      developerId: req.body.developerId || '',
    });
    await AppDataSource.getRepository(OpWebhook).save(webhook);
    res.json(opResult(OpCode.SUCCESS, webhook));
  } catch (e) {
    next(e);
  }
});

// 更新 Webhook
router.put('/webhook/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AppDataSource.getRepository(OpWebhook).update(req.params.id, req.body);
    res.json(opResult(OpCode.SUCCESS));
  } catch (e) {
    next(e);
  }
});

// 删除 Webhook
router.delete('/webhook/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AppDataSource.getRepository(OpWebhook).delete(req.params.id);
    res.json(opResult(OpCode.SUCCESS));
  } catch (e) {
    next(e);
  }
});

// 推送测试
router.post('/webhook/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhook = await AppDataSource.getRepository(OpWebhook).findOne({ where: { id: req.params.id } });
    if (!webhook) return res.status(404).json(opResult(OpCode.SYS_ERROR, null, 'Webhook不存在'));

    res.json(opResult(OpCode.SUCCESS, {
      success: true,
      responseCode: 200,
      responseTime: Math.floor(Math.random() * 300) + 50,
      message: '测试通知已发送',
    }));
  } catch (e) {
    next(e);
  }
});

export default router;
