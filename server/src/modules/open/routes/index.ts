/**
 * 开放平台 API 路由
 */
import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { apiGateway } from '../middleware/api-gateway';
import {
  developerService,
  appService,
  apiKeyService,
  quotaService,
} from '../service/open-platform.service';
import { OpCode, opResult } from '../../../utils/op-code';
import { signHmacSha256 } from '../../../utils/signature';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../../config/data-source';
import { OpApp, PayOrder, RefundOrder, TransferOrder } from '../../../database/entities';

const router = Router();

// ==================== 中间件 ====================

/** 开发者认证中间件 */
async function devAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json(opResult(OpCode.AUTH_KEY_NOT_FOUND, null, '请先登录'));
  }
  // 简化验证，实际应使用 JWT
  next();
}

/** 验证中间件 */
function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(opResult(OpCode.AUTH_MISSING_PARAM, null, errors.array()[0].msg));
  }
  next();
}

// ==================== 开发者接口 ====================

// 注册
router.post(
  '/v1/dev/register',
  [
    body('developerName').notEmpty().withMessage('开发者名称不能为空'),
    body('username').notEmpty().isLength({ min: 4, max: 32 }).withMessage('用户名4-32位'),
    body('password').notEmpty().isLength({ min: 6, max: 32 }).withMessage('密码6-32位'),
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('mobile').notEmpty().withMessage('手机号不能为空'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await developerService.register(req.body);
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);

// 登录
router.post(
  '/v1/dev/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const result = await developerService.login(req.body.username, req.body.password, ip);
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);

// 获取开发者信息
router.get('/v1/dev/info', devAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const developerId = req.headers['x-developer-id'] as string;
    const info = await developerService.getInfo(developerId);
    if (!info) return res.status(404).json(opResult(OpCode.SYS_ERROR, null, '开发者不存在'));
    res.json(opResult(OpCode.SUCCESS, info));
  } catch (e) {
    next(e);
  }
});

// ==================== 应用管理接口 ====================

// 创建应用
router.post(
  '/v1/app',
  devAuth,
  [
    body('appName').notEmpty().withMessage('应用名称不能为空'),
    body('appType').isIn(['web', 'mobile', 'miniapp', 'api']).withMessage('应用类型不正确'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const developerId = req.headers['x-developer-id'] as string;
      const result = await appService.create({ ...req.body, developerId });
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);

// 获取应用列表
router.get('/v1/app/list', devAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const developerId = req.headers['x-developer-id'] as string;
    const result = await appService.list(developerId, {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      keyword: req.query.keyword as string,
      status: req.query.status as string,
    });
    res.json(opResult(OpCode.SUCCESS, result));
  } catch (e) {
    next(e);
  }
});

// 获取应用详情
router.get('/v1/app/:appId', devAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const developerId = req.headers['x-developer-id'] as string;
    const app = await appService.getApp(req.params.appId, developerId);
    if (!app) return res.status(404).json(opResult(OpCode.SYS_ERROR, null, '应用不存在'));
    res.json(opResult(OpCode.SUCCESS, app));
  } catch (e) {
    next(e);
  }
});

// 更新应用
router.put('/v1/app/:appId', devAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const developerId = req.headers['x-developer-id'] as string;
    const result = await appService.update(req.params.appId, developerId, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// 重置 AppSecret
router.post('/v1/app/:appId/reset-secret', devAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const developerId = req.headers['x-developer-id'] as string;
    const result = await appService.resetSecret(req.params.appId, developerId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// 更新IP白名单
router.post('/v1/app/:appId/ip-whitelist', devAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const developerId = req.headers['x-developer-id'] as string;
    const result = await appService.updateIpWhitelist(req.params.appId, developerId, req.body.ips || []);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ==================== API Key 管理 ====================

// 创建 API Key
router.post('/v1/app/:appId/key', devAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const developerId = req.headers['x-developer-id'] as string;
    const result = await apiKeyService.createKey({
      ...req.body,
      appId: req.params.appId,
      developerId,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// 获取 Key 列表
router.get('/v1/app/:appId/keys', devAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await apiKeyService.listKeys(req.params.appId);
    res.json(opResult(OpCode.SUCCESS, keys));
  } catch (e) {
    next(e);
  }
});

// 禁用 Key
router.post('/v1/app/:appId/key/:keyId/disable', devAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const developerId = req.headers['x-developer-id'] as string;
    const result = await apiKeyService.disableKey(req.params.keyId, developerId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// 删除 Key
router.delete('/v1/app/:appId/key/:keyId', devAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const developerId = req.headers['x-developer-id'] as string;
    const result = await apiKeyService.deleteKey(req.params.keyId, developerId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ==================== 配额查询 ====================

// 获取配额
router.get('/v1/app/:appId/quota', devAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quota = await quotaService.getQuota(req.params.appId);
    res.json(opResult(OpCode.SUCCESS, quota));
  } catch (e) {
    next(e);
  }
});

// ==================== 支付接口 (需API网关认证) ====================

// 发起支付
router.post(
  '/v1/pay/gateway',
  apiGateway,
  [
    body('mchNo').notEmpty().withMessage('商户号不能为空'),
    body('appId').notEmpty().withMessage('应用ID不能为空'),
    body('payType').notEmpty().withMessage('支付方式不能为空'),
    body('amount').isInt({ min: 1, max: 5000000 }).withMessage('金额范围1-5000000分'),
    body('subject').notEmpty().withMessage('商品标题不能为空'),
    body('orderNo').notEmpty().withMessage('商户订单号不能为空'),
    body('notifyUrl').notEmpty().withMessage('回调地址不能为空'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mchNo, appId, payType, amount, subject, body: orderBody, clientIp, attach, notifyUrl, returnUrl } = req.body;

      // 生成平台订单号
      const orderId = uuidv4();
      const orderNo = 'OP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

      // 保存订单
      const orderRepo = AppDataSource.getRepository(PayOrder);
      const order = orderRepo.create({
        id: orderId,
        orderNo,
        mchNo,
        appId,
        payType: payType as any,
        amount: parseInt(amount) / 100, // 分转元
        actualAmount: parseInt(amount) / 100,
        subject,
        body: orderBody || subject,
        clientIp,
        attach,
        notifyUrl,
        status: 0,
        expireTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        createTime: new Date(),
      });
      await orderRepo.save(order);

      // 构造支付链接 (模拟)
      const payUrl = buildPayUrl(payType, orderNo, parseInt(amount), returnUrl);

      res.json(opResult(OpCode.SUCCESS, {
        orderNo,
        payUrl,
        qrCode: payType === 'wx_native' || payType === 'alipay_qr' ? `https://api.dgkjpay.com/qr/${orderNo}` : null,
        deeplink: buildDeeplink(payType, orderNo, parseInt(amount)),
        amount: parseInt(amount),
        mchNo,
        payType,
        status: 'pending',
        expireTime: order.expireTime,
      }));
    } catch (e) {
      next(e);
    }
  },
);

// 查询订单
router.get('/v1/query/order/:orderNo', apiGateway, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNo } = req.params;
    const orderRepo = AppDataSource.getRepository(PayOrder);
    const order = await orderRepo.findOne({ where: { orderNo } });

    if (!order) {
      return res.json(opResult(OpCode.BIZ_ORDER_NOT_FOUND, null, '订单不存在'));
    }

    const statusMap: Record<number, string> = {
      0: 'pending', 1: 'paid', 2: 'paying', 3: 'closed', 4: 'refunded',
    };

    res.json(opResult(OpCode.SUCCESS, {
      orderNo: order.orderNo,
      mchNo: order.mchNo,
      appId: order.appId,
      payType: order.payType,
      amount: Math.round(order.amount * 100), // 元转分
      actualAmount: Math.round(order.actualAmount * 100),
      status: statusMap[order.status] || 'unknown',
      subject: order.subject,
      attach: order.attach,
      channelOrderNo: order.channelOrderNo,
      paidTime: order.payTime,
      createTime: order.createTime,
      expireTime: order.expireTime,
    }));
  } catch (e) {
    next(e);
  }
});

// 关闭订单
router.post('/v1/order/:orderNo/close', apiGateway, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNo } = req.params;
    const orderRepo = AppDataSource.getRepository(PayOrder);
    const order = await orderRepo.findOne({ where: { orderNo } });

    if (!order) return res.json(opResult(OpCode.BIZ_ORDER_NOT_FOUND, null, '订单不存在'));
    if (order.status !== 0) return res.json(opResult(OpCode.BIZ_ORDER_CLOSED, null, '订单状态不允许关闭'));

    await orderRepo.update({ orderNo }, { status: 3, updateTime: new Date() });
    res.json(opResult(OpCode.SUCCESS, { orderNo, status: 'closed' }));
  } catch (e) {
    next(e);
  }
});

// ==================== 退款接口 ====================

// 申请退款
router.post(
  '/v1/refund/apply',
  apiGateway,
  [
    body('orderNo').notEmpty().withMessage('原订单号不能为空'),
    body('refundAmount').isInt({ min: 1 }).withMessage('退款金额必须大于0'),
    body('refundReason').notEmpty().withMessage('退款原因不能为空'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderNo, refundAmount, refundReason, notifyUrl } = req.body;

      const orderRepo = AppDataSource.getRepository(PayOrder);
      const order = await orderRepo.findOne({ where: { orderNo } });

      if (!order) return res.json(opResult(OpCode.BIZ_ORDER_NOT_FOUND, null, '订单不存在'));
      if (order.status !== 1) return res.json(opResult(OpCode.BIZ_ORDER_CLOSED, null, '订单未支付，无法退款'));

      const refundAmountYuan = parseInt(refundAmount) / 100;
      if (refundAmountYuan > order.amount) {
        return res.json(opResult(OpCode.BIZ_REFUND_EXCEED, null, '退款金额超过订单金额'));
      }

      const refundId = uuidv4();
      const refundNo = 'RF' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

      const refundRepo = AppDataSource.getRepository(RefundOrder);
      const refund = refundRepo.create({
        id: refundId,
        refundNo,
        orderNo,
        mchNo: order.mchNo,
        appId: order.appId,
        payType: order.payType,
        amount: order.amount,
        refundAmount: refundAmountYuan,
        refundReason,
        status: 0,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await refundRepo.save(refund);

      res.json(opResult(OpCode.SUCCESS, {
        refundNo,
        orderNo,
        refundAmount: parseInt(refundAmount),
        status: 'pending',
        createTime: refund.createTime,
      }));
    } catch (e) {
      next(e);
    }
  },
);

// 查询退款
router.get('/v1/query/refund/:refundNo', apiGateway, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refundNo } = req.params;
    const refundRepo = AppDataSource.getRepository(RefundOrder);
    const refund = await refundRepo.findOne({ where: { refundNo } });

    if (!refund) return res.json(opResult(OpCode.BIZ_ORDER_NOT_FOUND, null, '退款单不存在'));

    res.json(opResult(OpCode.SUCCESS, {
      refundNo: refund.refundNo,
      orderNo: refund.orderNo,
      mchNo: refund.mchNo,
      refundAmount: Math.round(refund.refundAmount * 100),
      status: ['pending', 'processing', 'success', 'failed'][refund.status] || 'unknown',
      refundReason: refund.refundReason,
      createTime: refund.createTime,
      updateTime: refund.updateTime,
    }));
  } catch (e) {
    next(e);
  }
});

// ==================== 转账接口 ====================

// 发起转账
router.post(
  '/v1/transfer/pay',
  apiGateway,
  [
    body('outNo').notEmpty().withMessage('商户转账单号不能为空'),
    body('amount').isInt({ min: 1 }).withMessage('转账金额必须大于0'),
    body('accountType').notEmpty().withMessage('账户类型不能为空'),
    body('accountName').notEmpty().withMessage('账户名不能为空'),
    body('accountNo').notEmpty().withMessage('账户号不能为空'),
    body('bankName').notEmpty().withMessage('银行名称不能为空'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transferRepo = AppDataSource.getRepository(TransferOrder);
      const transferNo = 'TR' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
      const amountYuan = parseInt(req.body.amount) / 100;
      const fee = amountYuan * 0.001; // 0.1% 手续费

      const transfer = transferRepo.create({
        id: uuidv4(),
        transferNo,
        mchNo: req.opApp?.mchNo || req.body.mchNo,
        appId: req.opApp?.appId || req.body.appId,
        outNo: req.body.outNo,
        amount: amountYuan,
        fee,
        actualAmount: amountYuan - fee,
        payType: 'bank',
        accountType: req.body.accountType,
        accountName: req.body.accountName,
        accountNo: req.body.accountNo,
        bankName: req.body.bankName,
        remark: req.body.remark,
        status: 0,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await transferRepo.save(transfer);

      res.json(opResult(OpCode.SUCCESS, {
        transferNo,
        outNo: req.body.outNo,
        amount: parseInt(req.body.amount),
        fee: Math.round(fee * 100),
        actualAmount: Math.round((amountYuan - fee) * 100),
        status: 'pending',
        createTime: transfer.createTime,
      }));
    } catch (e) {
      next(e);
    }
  },
);

// 查询转账
router.get('/v1/query/transfer/:transferNo', apiGateway, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transferNo } = req.params;
    const transferRepo = AppDataSource.getRepository(TransferOrder);
    const transfer = await transferRepo.findOne({ where: { transferNo } });

    if (!transfer) return res.json(opResult(OpCode.BIZ_ORDER_NOT_FOUND, null, '转账单不存在'));

    res.json(opResult(OpCode.SUCCESS, {
      transferNo: transfer.transferNo,
      outNo: transfer.outNo,
      mchNo: transfer.mchNo,
      amount: Math.round(transfer.amount * 100),
      fee: Math.round(transfer.fee * 100),
      actualAmount: Math.round(transfer.actualAmount * 100),
      status: ['pending', 'processing', 'success', 'failed'][transfer.status] || 'unknown',
      accountName: transfer.accountName,
      bankName: transfer.bankName,
      createTime: transfer.createTime,
      updateTime: transfer.updateTime,
    }));
  } catch (e) {
    next(e);
  }
});

// ==================== 账户接口 ====================

// 查询余额
router.get('/v1/account/balance', apiGateway, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mchNo = (req.query.mchNo as string) || req.opApp?.mchNo;

    res.json(opResult(OpCode.SUCCESS, {
      mchNo,
      availableBalance: 0.00,
      frozenBalance: 0.00,
      totalBalance: 0.00,
      currency: 'CNY',
      updateTime: new Date().toISOString(),
    }));
  } catch (e) {
    next(e);
  }
});

// ==================== 辅助函数 ====================

/** 构建支付链接 */
function buildPayUrl(payType: string, orderNo: string, amount: number, returnUrl?: string): string {
  const baseUrls: Record<string, string> = {
    wx_native: `https://api.dgkjpay.com/gateway/wx/native?orderNo=${orderNo}&amount=${amount}`,
    wx_jsapi: `https://api.dgkjpay.com/gateway/wx/jsapi?orderNo=${orderNo}&amount=${amount}`,
    wx_h5: `https://api.dgkjpay.com/gateway/wx/h5?orderNo=${orderNo}&amount=${amount}`,
    alipay_qr: `https://api.dgkjpay.com/gateway/alipay/qr?orderNo=${orderNo}&amount=${amount}`,
    alipay_wap: `https://api.dgkjpay.com/gateway/alipay/wap?orderNo=${orderNo}&amount=${amount}&returnUrl=${returnUrl || ''}`,
    unionpay: `https://api.dgkjpay.com/gateway/unionpay?orderNo=${orderNo}&amount=${amount}`,
  };
  return baseUrls[payType] || `https://api.dgkjpay.com/gateway?orderNo=${orderNo}&amount=${amount}`;
}

/** 构建 Deeplink */
function buildDeeplink(payType: string, orderNo: string, amount: number): string {
  if (payType === 'wx_jsapi') {
    return `weixin://wxpay/bizpayurl?pr=${encodeURIComponent(Date.now().toString())}`;
  }
  if (payType === 'alipay_wap') {
    return `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(buildPayUrl(payType, orderNo, amount))}`;
  }
  return '';
}

export default router;
