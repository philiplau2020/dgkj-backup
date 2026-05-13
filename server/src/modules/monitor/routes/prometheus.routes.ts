/**
 * DGKJ 支付平台 - Prometheus 监控指标
 * 
 * 提供 /metrics 端点用于 Prometheus 抓取
 */

import { Router, Request, Response } from 'express';
import { performanceMonitor, getPerformanceMetrics } from '../../../services/performance.service';
import { cacheService } from '../../../services/cache.service';

const router = Router();

// 指标收集器
interface MetricCollector {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number | Map<string, number>;
  labels?: Record<string, string>;
}

// 指标存储
const metrics: Map<string, MetricCollector> = new Map();

// ==================== 指标定义 ====================

// HTTP 请求计数器
metrics.set('http_requests_total', {
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  type: 'counter',
  value: 0,
  labels: { method: '', path: '', status: '' },
});

// HTTP 请求延迟
metrics.set('http_request_duration_seconds', {
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  type: 'histogram',
  value: new Map<string, number>(),
});

// 活跃请求数
metrics.set('http_active_requests', {
  name: 'http_active_requests',
  help: 'Number of active HTTP requests',
  type: 'gauge',
  value: 0,
});

// 数据库连接状态
metrics.set('database_connection_status', {
  name: 'database_connection_status',
  help: 'Database connection status (1 = connected, 0 = disconnected)',
  type: 'gauge',
  value: 1,
});

// 数据库查询延迟
metrics.set('database_query_duration_seconds', {
  name: 'database_query_duration_seconds',
  help: 'Database query duration in seconds',
  type: 'histogram',
  value: new Map<string, number>(),
});

// 缓存命中/未命中
metrics.set('cache_hits_total', {
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  type: 'counter',
  value: 0,
});

metrics.set('cache_misses_total', {
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  type: 'counter',
  value: 0,
});

// 支付交易计数
metrics.set('payment_transactions_total', {
  name: 'payment_transactions_total',
  help: 'Total number of payment transactions',
  type: 'counter',
  value: 0,
  labels: { channel: '', status: '' },
});

// 支付交易金额
metrics.set('payment_transactions_amount_total', {
  name: 'payment_transactions_amount_total',
  help: 'Total amount of payment transactions in CNY',
  type: 'counter',
  value: 0,
  labels: { channel: '' },
});

// 错误计数
metrics.set('errors_total', {
  name: 'errors_total',
  help: 'Total number of errors',
  type: 'counter',
  value: 0,
  labels: { type: '' },
});

// 认证失败计数
metrics.set('auth_failures_total', {
  name: 'auth_failures_total',
  help: 'Total number of authentication failures',
  type: 'counter',
  value: 0,
});

// 限流触发计数
metrics.set('rate_limit_hits_total', {
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  type: 'counter',
  value: 0,
});

// ==================== 指标收集函数 ====================

// 记录 HTTP 请求
export function recordHttpRequest(method: string, path: string, status: number, duration: number) {
  // 更新请求计数
  const counter = metrics.get('http_requests_total');
  if (counter) {
    (counter.value as number)++;
  }

  // 记录延迟分布
  const durationHist = metrics.get('http_request_duration_seconds');
  if (durationHist) {
    const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
    const durationMs = duration / 1000;
    for (const bucket of buckets) {
      if (durationMs <= bucket) {
        const map = durationHist.value as Map<string, number>;
        const key = `le_${bucket}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
  }
}

// 记录支付交易
export function recordPayment(channel: string, status: string, amount: number) {
  const counter = metrics.get('payment_transactions_total');
  if (counter) {
    (counter.value as number)++;
  }

  const amountMetric = metrics.get('payment_transactions_amount_total');
  if (amountMetric) {
    (amountMetric.value as number) += amount;
  }
}

// 记录错误
export function recordError(type: string) {
  const counter = metrics.get('errors_total');
  if (counter) {
    (counter.value as number)++;
  }
}

// 记录认证失败
export function recordAuthFailure() {
  const counter = metrics.get('auth_failures_total');
  if (counter) {
    (counter.value as number)++;
  }
}

// 记录限流
export function recordRateLimit() {
  const counter = metrics.get('rate_limit_hits_total');
  if (counter) {
    (counter.value as number)++;
  }
}

// ==================== Prometheus 格式输出 ====================

function formatPrometheusMetrics(): string {
  const lines: string[] = [];
  
  lines.push('# HELP nodejs_version_info Node.js version info');
  lines.push('# TYPE nodejs_version_info gauge');
  lines.push(`nodejs_version_info{version="${process.version}",major="${process.version.split('.')[0].slice(1)}"} 1`);
  
  lines.push('');
  lines.push('# HELP process_uptime_seconds Process uptime in seconds');
  lines.push('# TYPE process_uptime_seconds gauge');
  lines.push(`process_uptime_seconds ${process.uptime()}`);
  
  lines.push('');
  lines.push('# HELP process_memory_usage_bytes Process memory usage in bytes');
  lines.push('# TYPE process_memory_usage_bytes gauge');
  const memUsage = process.memoryUsage();
  lines.push(`process_memory_usage_bytes{type="rss"} ${memUsage.rss}`);
  lines.push(`process_memory_usage_bytes{type="heapTotal"} ${memUsage.heapTotal}`);
  lines.push(`process_memory_usage_bytes{type="heapUsed"} ${memUsage.heapUsed}`);
  lines.push(`process_memory_usage_bytes{type="external"} ${memUsage.external}`);
  
  lines.push('');
  lines.push('# HELP process_cpu_usage_percent Process CPU usage percent');
  lines.push('# TYPE process_cpu_usage_percent gauge');
  const cpuUsage = process.cpuUsage();
  lines.push(`process_cpu_usage_percent{type="user"} ${cpuUsage.user}`);
  lines.push(`process_cpu_usage_percent{type="system"} ${cpuUsage.system}`);
  
  // HTTP 请求指标
  lines.push('');
  const httpCounter = metrics.get('http_requests_total');
  if (httpCounter) {
    lines.push(`# HELP ${httpCounter.name} ${httpCounter.help}`);
    lines.push(`# TYPE ${httpCounter.name} counter`);
    lines.push(`${httpCounter.name} ${httpCounter.value}`);
  }
  
  // HTTP 延迟分布
  lines.push('');
  const httpDuration = metrics.get('http_request_duration_seconds');
  if (httpDuration) {
    lines.push(`# HELP ${httpDuration.name} ${httpDuration.help}`);
    lines.push(`# TYPE ${httpDuration.name} histogram`);
    const durationMap = httpDuration.value as Map<string, number>;
    const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
    buckets.forEach(bucket => {
      const count = durationMap.get(`le_${bucket}`) || 0;
      lines.push(`${httpDuration.name}_bucket{le="${bucket}"} ${count}`);
    });
    lines.push(`${httpDuration.name}_bucket{le="+Inf"} ${durationMap.get('le_10') || 0}`);
    lines.push(`${httpDuration.name}_sum ${Array.from(durationMap.values()).reduce((a, b) => a + b, 0)}`);
    lines.push(`${httpDuration.name}_count ${Array.from(durationMap.values()).reduce((a, b) => a + b, 0)}`);
  }
  
  // 活跃请求
  lines.push('');
  const activeRequests = metrics.get('http_active_requests');
  if (activeRequests) {
    lines.push(`# HELP ${activeRequests.name} ${activeRequests.help}`);
    lines.push(`# TYPE ${activeRequests.name} gauge`);
    lines.push(`${activeRequests.name} ${activeRequests.value}`);
  }
  
  // 数据库连接状态
  lines.push('');
  const dbStatus = metrics.get('database_connection_status');
  if (dbStatus) {
    lines.push(`# HELP ${dbStatus.name} ${dbStatus.help}`);
    lines.push(`# TYPE ${dbStatus.name} gauge`);
    lines.push(`${dbStatus.name} ${dbStatus.value}`);
  }
  
  // 缓存命中
  lines.push('');
  const cacheHits = metrics.get('cache_hits_total');
  if (cacheHits) {
    lines.push(`# HELP ${cacheHits.name} ${cacheHits.help}`);
    lines.push(`# TYPE ${cacheHits.name} counter`);
    lines.push(`${cacheHits.name} ${cacheHits.value}`);
  }
  
  const cacheMisses = metrics.get('cache_misses_total');
  if (cacheMisses) {
    lines.push(`# HELP ${cacheMisses.name} ${cacheMisses.help}`);
    lines.push(`# TYPE ${cacheMisses.name} counter`);
    lines.push(`${cacheMisses.name} ${cacheMisses.value}`);
  }
  
  // 支付交易
  lines.push('');
  const paymentCounter = metrics.get('payment_transactions_total');
  if (paymentCounter) {
    lines.push(`# HELP ${paymentCounter.name} ${paymentCounter.help}`);
    lines.push(`# TYPE ${paymentCounter.name} counter`);
    lines.push(`${paymentCounter.name} ${paymentCounter.value}`);
  }
  
  const paymentAmount = metrics.get('payment_transactions_amount_total');
  if (paymentAmount) {
    lines.push(`# HELP ${paymentAmount.name} ${paymentAmount.help}`);
    lines.push(`# TYPE ${paymentAmount.name} counter`);
    lines.push(`${paymentAmount.name} ${paymentAmount.value}`);
  }
  
  // 错误计数
  lines.push('');
  const errorCounter = metrics.get('errors_total');
  if (errorCounter) {
    lines.push(`# HELP ${errorCounter.name} ${errorCounter.help}`);
    lines.push(`# TYPE ${errorCounter.name} counter`);
    lines.push(`${errorCounter.name}{type="server_error"} ${errorCounter.value}`);
  }
  
  // 认证失败
  lines.push('');
  const authCounter = metrics.get('auth_failures_total');
  if (authCounter) {
    lines.push(`# HELP ${authCounter.name} ${authCounter.help}`);
    lines.push(`# TYPE ${authCounter.name} counter`);
    lines.push(`${authCounter.name} ${authCounter.value}`);
  }
  
  // 限流
  lines.push('');
  const rateLimitCounter = metrics.get('rate_limit_hits_total');
  if (rateLimitCounter) {
    lines.push(`# HELP ${rateLimitCounter.name} ${rateLimitCounter.help}`);
    lines.push(`# TYPE ${rateLimitCounter.name} counter`);
    lines.push(`${rateLimitCounter.name} ${rateLimitCounter.value}`);
  }
  
  return lines.join('\n');
}

// ==================== 路由 ====================

// Prometheus 指标端点
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(formatPrometheusMetrics());
  } catch (error) {
    res.status(500).send('Error collecting metrics');
  }
});

// 详细健康状态
router.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      performance: getPerformanceMetrics(),
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: (error as Error).message,
    });
  }
});

export default router;
