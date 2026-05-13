import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { AppDataSource } from './config/data-source';
import { errorHandler } from './common/filters/global-exception.filter';
import { responseInterceptor } from './common/interceptors/response.interceptor';
import setupSwagger from './config/swagger';
import authRoutes from './modules/auth/routes';
import sysRoutes from './modules/sys/routes';
import publicRoutes from './modules/sys/public.routes';
import mchRoutes from './modules/mch/routes';
import agentRoutes from './modules/agent/routes';
import tradeRoutes from './modules/trade/routes';
import financeRoutes from './modules/finance/routes';
import channelRoutes from './modules/channel/routes';
import citicRoutes from './modules/citic/routes';
import statisticsRoutes from './modules/statistics/routes';
import deviceRoutes from './modules/device/routes';
import checkRoutes from './modules/check/routes';
import profitRoutes from './modules/profit/routes';
import opsRoutes from './modules/ops/routes';
import monitorRoutes from './modules/monitor/routes';
import payCallbackRoutes from './modules/pay/callback.routes';
import openRoutes from './modules/open/routes';
import openAdminRoutes from './modules/open/routes/admin';
import notificationRoutes from './modules/notification/notification.routes';
import { initializeNotificationConfig } from './modules/notification/notification.service';
import { cacheService } from './services/cache.service';
import { messageQueueService } from './services/queue.service';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Response interceptor
app.use(responseInterceptor);

// Error handler (must be after responseInterceptor and all routes)
app.use(errorHandler);

// Swagger API Documentation
setupSwagger(app);

// Health check (支持 K8s liveness/readiness probes)
app.get('/health', async (req, res) => {
  const health: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
  
  // 检查数据库连接
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.query('SELECT 1');
      health.database = 'connected';
    } else {
      health.database = 'disconnected';
    }
  } catch (error) {
    health.database = 'error';
    health.databaseError = (error as Error).message;
  }
  
  const isHealthy = health.database === 'connected';
  res.status(isHealthy ? 200 : 503).json(health);
});

// 详细健康检查 (K8s readiness probe)
app.get('/ready', async (req, res) => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.query('SELECT 1');
    }
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: (error as Error).message });
  }
});

// API Routes - 统一使用 /basic-api 前缀
app.use('/basic-api/auth', authRoutes);
app.use('/basic-api/sys', sysRoutes);

// 公开配置 API (/api/public/*) - 无需登录
app.use('/api/public', publicRoutes);

// 静态资源 - Logo 等
app.use('/api/assets', express.static(path.join(__dirname, '../public/assets')));
app.use('/basic-api/merchant', mchRoutes);  // 商户管理
app.use('/basic-api/mch', mchRoutes);       // 商户管理 (别名)
app.use('/basic-api/agent', agentRoutes);    // 代理管理
app.use('/basic-api/order', tradeRoutes);   // 交易订单
app.use('/basic-api/refund', tradeRoutes);  // 退款 (复用 tradeRoutes)
app.use('/basic-api/account', financeRoutes); // 账户管理
app.use('/basic-api/finance', financeRoutes); // 财务管理
app.use('/basic-api/channel', channelRoutes); // 通道管理
app.use('/basic-api/pool', channelRoutes);   // 通道池 (复用 channelRoutes)
app.use('/basic-api/citic', citicRoutes);   // 中信银行E管家管理
app.use('/basic-api/stat', statisticsRoutes); // 统计管理
app.use('/basic-api/device', deviceRoutes); // 设备管理
app.use('/basic-api/check', checkRoutes);   // 对账管理
app.use('/basic-api/profit', profitRoutes);  // 分润管理
app.use('/basic-api/ops', opsRoutes);      // 运维监控
app.use('/basic-api/monitor', monitorRoutes); // 系统监控
app.use('/basic-api/pay', payCallbackRoutes); // 支付回调

// 开放平台 API (/api/v1/*) - 商户接入
app.use('/api/v1', openRoutes);

// 开放平台管理 API (/basic-api/open/*) - 后台管理
app.use('/basic-api/open', openAdminRoutes);

// 通知配置 API (/basic-api/sys/notification/*) - 通知服务配置
app.use('/basic-api/sys/notification', notificationRoutes);

// Start server
AppDataSource.initialize()
  .then(async () => {
    console.log('Database connection established');
    
    // 初始化通知服务
    await initializeNotificationConfig();
    
    // 初始化缓存服务
    const useRedis = process.env.USE_REDIS === 'true';
    await cacheService.initialize({ type: useRedis ? 'redis' : 'memory' });
    
    // 初始化消息队列服务
    const useRabbitMQ = process.env.USE_RABBITMQ === 'true';
    await messageQueueService.initialize(useRabbitMQ ? 'rabbitmq' : 'memory');
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;
