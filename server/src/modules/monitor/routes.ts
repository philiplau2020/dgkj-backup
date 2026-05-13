/**
 * DGKJ 支付平台 - 运维监控路由
 */

import { Router } from 'express';
import monitorService from './monitor.service';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();

// ==================== 系统监控 ====================

/**
 * GET /basic-api/monitor/server/overview
 * 获取服务器概览
 */
router.get('/server/overview', authGuard, async (req, res) => {
  try {
    const data = await monitorService.getServerOverview();
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/monitor/server/list
 * 获取服务器列表
 */
router.get('/server/list', authGuard, async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const data = await monitorService.getServerList({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    });
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/monitor/server/detail
 * 获取服务器详情
 */
router.get('/server/detail', authGuard, async (req, res) => {
  try {
    const { id } = req.query;
    const data = await monitorService.getServerDetail(id as string);
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 服务监控 ====================

/**
 * GET /basic-api/monitor/service/list
 * 获取服务列表
 */
router.get('/service/list', authGuard, async (req, res) => {
  try {
    const data = await monitorService.getServiceList();
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/monitor/service/detail
 * 获取服务详情
 */
router.get('/service/detail', authGuard, async (req, res) => {
  try {
    const { id } = req.query;
    const data = await monitorService.getServiceDetail(id as string);
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 应用指标 ====================

/**
 * GET /basic-api/monitor/metrics
 * 获取应用指标
 */
router.get('/metrics', authGuard, async (req, res) => {
  try {
    const data = await monitorService.getAppMetrics();
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 网络监控 ====================

/**
 * GET /basic-api/monitor/network/list
 * 获取网络接口列表
 */
router.get('/network/list', authGuard, async (req, res) => {
  try {
    const data = await monitorService.getNetworkList();
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 日志管理 ====================

/**
 * GET /basic-api/monitor/log/list
 * 获取日志列表
 */
router.get('/log/list', authGuard, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, level, serviceName, keyword, startTime, endTime } = req.query;
    const data = await monitorService.getLogList({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      level: level as string,
      serviceName: serviceName as string,
      keyword: keyword as string,
      startTime: startTime as string,
      endTime: endTime as string,
    });
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/monitor/log/statistics
 * 获取日志统计
 */
router.get('/log/statistics', authGuard, async (req, res) => {
  try {
    const data = await monitorService.getLogStatistics();
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 告警管理 ====================

/**
 * GET /basic-api/monitor/alert/list
 * 获取告警列表
 */
router.get('/alert/list', authGuard, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, level, status } = req.query;
    const data = await monitorService.getAlertList({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      level: level as string,
      status: status as string,
    });
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/monitor/alert/rules
 * 获取告警规则
 */
router.get('/alert/rules', authGuard, async (req, res) => {
  try {
    const data = await monitorService.getAlertRules();
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 业务概览 ====================

/**
 * GET /basic-api/monitor/business/overview
 * 获取业务概览
 */
router.get('/business/overview', authGuard, async (req, res) => {
  try {
    const data = await monitorService.getBusinessOverview();
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/monitor/business/trend
 * 获取业务趋势
 */
router.get('/business/trend', authGuard, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const data = await monitorService.getBusinessTrend({
      days: parseInt(days as string),
    });
    res.json({ code: 0, message: 'ok', data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

export default router;
