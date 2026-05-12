import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { AppDataSource } from './config/data-source';
import { errorHandler } from './common/filters/global-exception.filter';
import { responseInterceptor } from './common/interceptors/response.interceptor';
import setupSwagger from './config/swagger';
import authRoutes from './modules/auth/routes';
import authController from './modules/auth/controller';
import sysRoutes from './modules/sys/routes';
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
// import openRoutes from './modules/open/routes';

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

// Swagger API Documentation
setupSwagger(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes - 统一使用 /basic-api 前缀
app.use('/basic-api/auth', authRoutes);
app.use('/basic-api/sys', sysRoutes);
app.use('/basic-api/merchant', mchRoutes);  // 商户管理
app.use('/basic-api/agent', agentRoutes);    // 代理管理
app.use('/basic-api/order', tradeRoutes);   // 交易订单
app.use('/basic-api/refund', tradeRoutes);  // 退款 (复用 tradeRoutes)
app.use('/basic-api/account', financeRoutes); // 账户管理
app.use('/basic-api/finance', financeRoutes); // 财务管理
app.use('/basic-api/channel', channelRoutes); // 通道管理
app.use('/basic-api/pool', channelRoutes);   // 通道池 (复用 channelRoutes)
app.use('/basic-api/citic', citicRoutes);   // 兴业管理
app.use('/basic-api/stat', statisticsRoutes); // 统计管理
app.use('/basic-api/device', deviceRoutes); // 设备管理
app.use('/basic-api/check', checkRoutes);   // 对账管理
app.use('/basic-api/profit', profitRoutes);  // 分润管理

// app.use('/api/v1', openRoutes);

// 开放平台管理 API (/basic-api/open/*) - 后台管理使用
// app.use('/basic-api/open', openRoutes);

// Start server
AppDataSource.initialize()
  .then(async () => {
    console.log('Database connection established');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;
