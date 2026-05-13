/**
 * DGKJ 支付平台 - 性能优化工具
 * 
 * 提供请求限流、响应缓存、压缩等性能优化功能
 */

import { Request, Response, NextFunction } from 'express';
import { rateLimitCache } from './cache.service';

// ==================== 请求限流 ====================

interface RateLimitOptions {
  windowMs?: number;      // 时间窗口（毫秒）
  maxRequests?: number;    // 最大请求数
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response, next: NextFunction) => void;
  skip?: (req: Request) => boolean;
}

export function createRateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = 60000,      // 默认 1 分钟
    maxRequests = 100,       // 默认 100 次
    keyGenerator = (req) => req.ip || 'unknown',
    handler,
    skip,
  } = options;

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    // 跳过特定请求
    if (skip?.(req)) {
      return next();
    }

    const key = `ratelimit:${keyGenerator(req)}`;
    
    try {
      const result = await rateLimitCache.checkLimit(key, maxRequests!, windowSeconds);

      // 设置限流头
      res.setHeader('X-RateLimit-Limit', maxRequests!.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

      if (!result.allowed) {
        if (handler) {
          return handler(req, res, next);
        }
        return res.status(429).json({
          code: 429,
          message: '请求过于频繁，请稍后再试',
          data: {
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
        });
      }

      next();
    } catch (error) {
      // 限流服务异常时，放行请求
      console.error('Rate limiter error:', error);
      next();
    }
  };
}

// ==================== API 限流特定实例 ====================

export const apiRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 100,
  keyGenerator: (req) => `api:${req.ip}`,
});

export const authRateLimiter = createRateLimiter({
  windowMs: 300000,  // 5 分钟
  maxRequests: 5,     // 5 次
  keyGenerator: (req) => `auth:${req.ip}`,
  handler: (req, res) => {
    res.status(429).json({
      code: 429,
      message: '登录尝试次数过多，请 5 分钟后再试',
    });
  },
});

export const payRateLimiter = createRateLimiter({
  windowMs: 1000,
  maxRequests: 10,
  keyGenerator: (req) => `pay:${req.body?.mchNo || req.ip}`,
});

// ==================== 响应缓存 ====================

interface CacheOptions {
  ttl?: number;           // 缓存时间（秒）
  condition?: (req: Request, res: Response) => boolean;
  keyGenerator?: (req: Request) => string;
}

export function responseCache(options: CacheOptions = {}) {
  const { ttl = 60, condition, keyGenerator } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // 只缓存 GET 请求
    if (req.method !== 'GET') {
      return next();
    }

    // 检查缓存条件
    if (condition && !condition(req, res)) {
      return next();
    }

    // 生成缓存键
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `cache:${req.originalUrl}`;

    try {
      // 从缓存获取
      const cached = await global.cacheService?.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.json(cached);
      }

      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      // 拦截响应
      const originalJson = res.json.bind(res);
      res.json = ((data: any) => {
        // 缓存成功的响应
        if (res.statusCode === 200 && data && data.code === 0) {
          global.cacheService?.set(cacheKey, data, { ttl }).catch(console.error);
        }
        return originalJson(data);
      });

      next();
    } catch (error) {
      console.error('Response cache error:', error);
      next();
    }
  };
}

// ==================== 请求压缩 ====================

interface CompressionOptions {
  level?: number;  // 压缩级别 1-9
  threshold?: number;  // 最小压缩大小（字节）
}

export function optimizeResponse(options: CompressionOptions = {}) {
  const { level = 6, threshold = 1024 } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // 根据 Accept-Encoding 设置压缩
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    if (acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
    } else if (acceptEncoding.includes('deflate')) {
      res.setHeader('Content-Encoding', 'deflate');
    }

    // 设置缓存控制头
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    next();
  };
}

// ==================== 性能监控 ====================

interface PerformanceMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
}

const performanceLog: PerformanceMetrics[] = [];
const MAX_LOG_SIZE = 1000;

export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on('finish', () => {
    const metrics: PerformanceMetrics = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: Date.now() - startTime,
      timestamp: Date.now(),
    };

    // 添加到日志
    performanceLog.push(metrics);
    if (performanceLog.length > MAX_LOG_SIZE) {
      performanceLog.shift();
    }

    // 慢请求警告（超过 1 秒）
    if (metrics.responseTime > 1000) {
      console.warn(`[SLOW] ${metrics.method} ${metrics.path} - ${metrics.responseTime}ms`);
    }
  });

  next();
}

// 获取性能指标
export function getPerformanceMetrics(): {
  recent: PerformanceMetrics[];
  summary: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    totalRequests: number;
  };
} {
  const summary = calculateSummary(performanceLog);
  return {
    recent: performanceLog.slice(-100),
    summary,
  };
}

function calculateSummary(log: PerformanceMetrics[]): any {
  if (log.length === 0) {
    return {
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      totalRequests: 0,
    };
  }

  const responseTimes = log.map(m => m.responseTime).sort((a, b) => a - b);
  const errors = log.filter(m => m.statusCode >= 400).length;

  return {
    avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
    p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
    p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
    errorRate: Math.round((errors / log.length) * 10000) / 100,
    totalRequests: log.length,
  };
}

// ==================== 全局限流配置 ====================

// 内存存储的限流器（备用方案）
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function memoryRateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    let record = requestCounts.get(key);
    
    if (!record || now >= record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      requestCounts.set(key, record);
      return next();
    }
    
    record.count++;
    
    if (record.count > maxRequests) {
      return res.status(429).json({
        code: 429,
        message: '请求过于频繁',
        data: { retryAfter: Math.ceil((record.resetTime - now) / 1000) },
      });
    }
    
    next();
  };
}

// ==================== 导出 ====================

export default {
  createRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  payRateLimiter,
  responseCache,
  optimizeResponse,
  performanceMonitor,
  getPerformanceMetrics,
  memoryRateLimit,
};
