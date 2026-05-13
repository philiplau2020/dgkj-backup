/**
 * DGKJ 支付平台 - 轮转池路由
 */

import { Router } from 'express';
import { PoolController } from './controller';

const router = Router();
const poolController = new PoolController();

/**
 * 通道商户管理
 */

// 获取通道商户列表
router.get('/channel-mch/list', poolController.listChannelMch.bind(poolController));

// 获取商户健康状态
router.get('/health/:channelCode/:mchNo', poolController.getMerchantHealth.bind(poolController));

// 切换商户状态
router.post('/channel-mch/:mchNo/switch', poolController.switchMerchantStatus.bind(poolController));

// 更新商户配置
router.put('/channel-mch/:id', poolController.updateMerchantConfig.bind(poolController));

// 重置商户统计
router.post('/health/:channelCode/:mchNo/reset', poolController.resetMerchantStats.bind(poolController));

/**
 * 熔断器管理
 */

// 重置熔断器
router.post('/circuit-breaker/:mchNo/reset', poolController.resetCircuitBreaker.bind(poolController));

// 获取熔断器状态
router.get('/circuit-breaker/list', (req, res) => {
  const { circuitBreaker } = require('../circuit-breaker');
  const states = circuitBreaker.getAllStates();
  res.json({
    code: 0,
    message: 'success',
    data: states,
  });
});

/**
 * 路由管理
 */

// 模拟路由选择
router.post('/simulate', poolController.simulateRoute.bind(poolController));

// 获取路由日志
router.get('/route-log/list', poolController.getRouteLogs.bind(poolController));

// 获取通道统计
router.get('/stats/channel', poolController.getChannelStats.bind(poolController));

// 获取轮转池概览
router.get('/overview', poolController.getPoolOverview.bind(poolController));

/**
 * 亲和性管理
 */

// 获取用户路由历史
router.get('/affinity/history', poolController.getUserRouteHistory.bind(poolController));

export default router;
