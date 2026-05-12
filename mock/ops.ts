/**
 * 运维监控 Mock 数据
 */
import { resultSuccess, resultPageSuccess, getRequestToken, requestParams } from './_util';
import type { MockMethod } from 'vite-plugin-mock';

// 辅助函数：生成随机数和趋势数据
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, precision = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(precision));
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 服务器列表
const serverList = [
  { id: 'srv-001', hostname: 'dgkj-api-01', ip: '192.168.1.101', port: 8080, os: 'Ubuntu 22.04 LTS', role: 'API Server', status: 'online' },
  { id: 'srv-002', hostname: 'dgkj-api-02', ip: '192.168.1.102', port: 8080, os: 'Ubuntu 22.04 LTS', role: 'API Server', status: 'online' },
  { id: 'srv-003', hostname: 'dgkj-db-01', ip: '192.168.1.111', port: 3306, os: 'CentOS 7.9', role: 'MySQL Master', status: 'online' },
  { id: 'srv-004', hostname: 'dgkj-db-02', ip: '192.168.1.112', port: 3306, os: 'CentOS 7.9', role: 'MySQL Slave', status: 'online' },
  { id: 'srv-005', hostname: 'dgkj-redis-01', ip: '192.168.1.121', port: 6379, os: 'Ubuntu 22.04 LTS', role: 'Redis Cluster', status: 'online' },
  { id: 'srv-006', hostname: 'dgkj-nginx-01', ip: '192.168.1.131', port: 80, os: 'Ubuntu 22.04 LTS', role: 'Nginx Gateway', status: 'online' },
  { id: 'srv-007', hostname: 'dgkj-mq-01', ip: '192.168.1.141', port: 5672, os: 'Ubuntu 22.04 LTS', role: 'RabbitMQ', status: 'warning' },
  { id: 'srv-008', hostname: 'dgkj-es-01', ip: '192.168.1.151', port: 9200, os: 'Ubuntu 22.04 LTS', role: 'Elasticsearch', status: 'online' },
];

// 服务列表
const serviceList = [
  { id: 'svc-001', name: 'payment-gateway', displayName: '支付网关服务', version: 'v2.3.1', host: '192.168.1.101', port: 8080, status: 'running', healthCheckUrl: '/actuator/health', healthStatus: 'healthy' },
  { id: 'svc-002', name: 'order-service', displayName: '订单服务', version: 'v1.8.5', host: '192.168.1.101', port: 8081, status: 'running', healthCheckUrl: '/actuator/health', healthStatus: 'healthy' },
  { id: 'svc-003', name: 'merchant-service', displayName: '商户服务', version: 'v1.6.2', host: '192.168.1.102', port: 8082, status: 'running', healthCheckUrl: '/actuator/health', healthStatus: 'healthy' },
  { id: 'svc-004', name: 'channel-service', displayName: '通道服务', version: 'v2.1.0', host: '192.168.1.102', port: 8083, status: 'running', healthCheckUrl: '/actuator/health', healthStatus: 'healthy' },
  { id: 'svc-005', name: 'settlement-service', displayName: '结算服务', version: 'v1.4.3', host: '192.168.1.101', port: 8084, status: 'running', healthCheckUrl: '/actuator/health', healthStatus: 'healthy' },
  { id: 'svc-006', name: 'agent-service', displayName: '代理服务', version: 'v1.2.1', host: '192.168.1.102', port: 8085, status: 'stopped', healthCheckUrl: '/actuator/health', healthStatus: 'unhealthy' },
  { id: 'svc-007', name: 'notify-service', displayName: '通知服务', version: 'v2.0.4', host: '192.168.1.101', port: 8086, status: 'running', healthCheckUrl: '/actuator/health', healthStatus: 'healthy' },
  { id: 'svc-008', name: 'recon-service', displayName: '对账服务', version: 'v1.1.0', host: '192.168.1.102', port: 8087, status: 'restarting', healthCheckUrl: '/actuator/health', healthStatus: 'unknown' },
  { id: 'svc-009', name: 'msg-queue-service', displayName: '消息队列服务', version: 'v1.5.0', host: '192.168.1.141', port: 8088, status: 'running', healthCheckUrl: '/actuator/health', healthStatus: 'healthy' },
  { id: 'svc-010', name: 'statistics-service', displayName: '统计服务', version: 'v1.3.2', host: '192.168.1.102', port: 8089, status: 'running', healthCheckUrl: '/actuator/health', healthStatus: 'healthy' },
];

// 应用列表
const appList = [
  { id: 'app-001', name: 'DGKJ支付平台', group: 'payment', requests: 125680, errors: 23, avgResponseTime: 45, p99ResponseTime: 120, qps: 28.5, concurrency: 156 },
  { id: 'app-002', name: '商户后台', group: 'merchant', requests: 45230, errors: 8, avgResponseTime: 32, p99ResponseTime: 85, qps: 12.3, concurrency: 68 },
  { id: 'app-003', name: '代理商后台', group: 'agent', requests: 18240, errors: 5, avgResponseTime: 38, p99ResponseTime: 95, qps: 5.8, concurrency: 34 },
  { id: 'app-004', name: '运营后台', group: 'ops', requests: 35670, errors: 12, avgResponseTime: 55, p99ResponseTime: 140, qps: 9.2, concurrency: 52 },
  { id: 'app-005', name: '开放API', group: 'openapi', requests: 89200, errors: 156, avgResponseTime: 68, p99ResponseTime: 180, qps: 35.6, concurrency: 210 },
];

// 日志级别颜色映射
const logLevels = ['DEBUG', 'INFO', 'INFO', 'INFO', 'WARN', 'ERROR', 'INFO', 'INFO'] as const;
const logSources = ['payment-gateway', 'order-service', 'merchant-service', 'channel-service', 'notify-service', 'settlement-service', 'nginx', 'mysql'];

// 告警级别映射
const alertLevels = ['info', 'warning', 'warning', 'error', 'critical'] as const;
const alertStatuses = ['active', 'active', 'acknowledged', 'resolved'] as const;

// 端口协议
const protocols = ['TCP', 'TCP', 'TCP', 'UDP'] as const;
const portStates = ['LISTEN', 'ESTABLISHED', 'LISTEN', 'TIME_WAIT', 'CLOSE_WAIT'] as const;

function generateServerList() {
  return serverList.map((srv) => ({
    ...srv,
    cpuUsage: randomFloat(5, 85),
    cpuCores: randomItem([4, 8, 16, 32]),
    memTotal: randomItem([8192, 16384, 32768, 65536]),
    memUsed: randomFloat(1024, 32768),
    memUsage: randomFloat(12, 78),
    diskTotal: randomItem([100, 200, 500, 1000]),
    diskUsed: randomFloat(30, 450),
    diskUsage: randomFloat(15, 72),
    uptime: randomBetween(86400, 2592000),
    lastHeartbeat: new Date(Date.now() - randomBetween(1000, 30000)).toISOString(),
  }));
}

function generateServiceList() {
  return serviceList.map((svc) => ({
    ...svc,
    pid: randomBetween(1000, 65535),
    startTime: new Date(Date.now() - randomBetween(3600000, 86400000 * 30)).toISOString(),
    uptime: randomBetween(3600, 2592000),
    responseTime: randomBetween(5, 200),
    requests: randomBetween(10000, 500000),
    errors: randomBetween(0, 100),
    cpuUsage: randomFloat(5, 60),
    memUsage: randomFloat(128, 2048),
  }));
}

function generateAppMetrics() {
  return appList.map((app) => ({
    ...app,
    cpuUsage: randomFloat(10, 75),
    memUsage: randomFloat(256, 4096),
    jvmHeapUsed: randomFloat(512, 3072),
    jvmHeapMax: 4096,
    jvmHeapUsage: randomFloat(25, 75),
    jvmOldGenUsage: randomFloat(30, 85),
    jvmYoungGenUsage: randomFloat(20, 60),
    threadCount: randomBetween(50, 300),
    threadPeak: randomBetween(100, 500),
    dbActive: randomBetween(5, 50),
    dbIdle: randomBetween(5, 20),
    gcCount: randomBetween(10, 200),
    gcTime: randomBetween(100, 1000),
  }));
}

function generateNetworkList() {
  const interfaces = ['eth0', 'eth1', 'docker0', 'lo'];
  return interfaces.map((iface, i) => ({
    id: `net-${i}`,
    interfaceName: iface,
    ip: i === 3 ? '127.0.0.1' : `192.168.1.${131 + i}`,
    mac: `00:0c:29:${randomBetween(10, 99).toString(16).padStart(2, '0')}:${randomBetween(10, 99).toString(16).padStart(2, '0')}:${randomBetween(10, 99).toString(16).padStart(2, '0')}`,
    status: i === 2 ? 'down' : 'up',
    speed: i === 0 ? '1Gbps' : i === 1 ? '10Gbps' : 'N/A',
    rxBytes: randomBetween(1000000, 100000000),
    txBytes: randomBetween(1000000, 100000000),
    rxPackets: randomBetween(10000, 1000000),
    txPackets: randomBetween(10000, 1000000),
    rxErrors: randomBetween(0, 10),
    txErrors: randomBetween(0, 10),
    bandwidthIn: randomFloat(10, 800),
    bandwidthOut: randomFloat(10, 600),
  }));
}

function generatePortList(serverId: string) {
  const ports = [
    { port: 22, protocol: 'TCP', state: 'LISTEN', processName: 'sshd', pid: 1234 },
    { port: 80, protocol: 'TCP', state: 'LISTEN', processName: 'nginx', pid: 2345 },
    { port: 443, protocol: 'TCP', state: 'LISTEN', processName: 'nginx', pid: 2345 },
    { port: 3306, protocol: 'TCP', state: 'LISTEN', processName: 'mysqld', pid: 3456 },
    { port: 6379, protocol: 'TCP', state: 'LISTEN', processName: 'redis-server', pid: 4567 },
    { port: 8080, protocol: 'TCP', state: 'LISTEN', processName: 'java', pid: 5678 },
    { port: 8081, protocol: 'TCP', state: 'LISTEN', processName: 'java', pid: 5679 },
    { port: 8082, protocol: 'TCP', state: 'ESTABLISHED', processName: 'nginx', pid: 2345 },
    { port: 5432, protocol: 'TCP', state: 'LISTEN', processName: 'postgres', pid: 6789 },
    { port: 5672, protocol: 'TCP', state: 'LISTEN', processName: 'beam.smp', pid: 7890 },
    { port: 9200, protocol: 'TCP', state: 'LISTEN', processName: 'java', pid: 8901 },
    { port: 27017, protocol: 'TCP', state: 'LISTEN', processName: 'mongod', pid: 9012 },
    { port: 2375, protocol: 'TCP', state: 'TIME_WAIT', processName: 'docker', pid: 1012 },
    { port: 11211, protocol: 'TCP', state: 'LISTEN', processName: 'memcached', pid: 1112 },
    { port: 15672, protocol: 'TCP', state: 'LISTEN', processName: 'beam.smp', pid: 7890 },
  ];
  return ports.map((p, i) => ({
    id: `port-${serverId}-${i}`,
    serverId,
    connections: p.state === 'ESTABLISHED' ? randomBetween(10, 200) : 0,
    bindAddress: '0.0.0.0',
    ...p,
  }));
}

function generateLogList(pageNo = 1, pageSize = 20) {
  const logs = [];
  const count = randomBetween(50, 100);
  for (let i = 0; i < count; i++) {
    const level = randomItem(logLevels);
    const messages: Record<string, string[]> = {
      DEBUG: ['Request received', 'Cache hit', 'Query executed', 'Thread pool acquired'],
      INFO: ['Request processed', 'Service started', 'Connection established', 'Task completed', 'Health check passed', 'Transaction committed'],
      WARN: ['Slow query detected', 'High memory usage', 'Connection pool nearing limit', 'Rate limit approaching', 'Retry attempt'],
      ERROR: ['Connection timeout', 'Database error', 'Service unavailable', 'Invalid request', 'Authentication failed'],
    };
    logs.push({
      id: `log-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - randomBetween(0, 86400000)).toISOString(),
      level,
      source: randomItem(logSources),
      serviceName: randomItem(serviceList).displayName,
      host: randomItem(serverList).ip,
      message: randomItem(messages[level]),
      traceId: `trace-${randomBetween(100000, 999999)}`,
      spanId: `span-${randomBetween(1000, 9999)}`,
      exception: level === 'ERROR' ? 'java.net.ConnectException: Connection refused' : undefined,
      stackTrace: level === 'ERROR' ? 'at java.net.Socket.connect(Socket.java:589)\\n  at com.dgkj.service.HTTPClient.doRequest' : undefined,
    });
  }
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return resultPageSuccess(pageNo, pageSize, logs);
}

function generateAlertList(pageNo = 1, pageSize = 20) {
  const alerts = [];
  const titles = [
    'CPU使用率过高', '内存使用率过高', '磁盘空间不足', '服务响应超时',
    '数据库连接池耗尽', '错误率异常升高', 'QPS突增', '网络延迟过高',
    'JVM堆内存不足', 'GC频率异常', '接口响应时间过长', '活跃连接数过多',
    'Redis连接异常', '消息队列堆积', '日志写入失败',
  ];
  const metrics = ['cpu.usage', 'mem.usage', 'disk.usage', 'service.response_time', 'db.connections', 'error.rate', 'qps', 'network.latency', 'jvm.heap', 'gc.frequency'];
  const hosts = serverList.map((s) => s.hostname);

  for (let i = 0; i < 30; i++) {
    const level = randomItem(alertLevels);
    const metric = randomItem(metrics);
    const threshold = metric.includes('usage') || metric.includes('rate') ? 80 : 500;
    const value = threshold * randomFloat(0.8, 1.5);
    const createdAt = new Date(Date.now() - randomBetween(0, 86400000 * 7)).toISOString();

    alerts.push({
      id: `alert-${i + 1}`,
      level,
      title: randomItem(titles),
      content: `指标 ${metric} 当前值 ${value.toFixed(2)} 超过阈值 ${threshold}`,
      source: 'prometheus',
      host: randomItem(hosts),
      metric,
      value: parseFloat(value.toFixed(2)),
      threshold,
      unit: metric.includes('rate') || metric.includes('usage') ? '%' : 'ms',
      status: randomItem(alertStatuses),
      createdAt,
      updatedAt: new Date(new Date(createdAt).getTime() + randomBetween(0, 3600000)).toISOString(),
      acknowledgedAt: Math.random() > 0.5 ? new Date(new Date(createdAt).getTime() + randomBetween(0, 1800000)).toISOString() : undefined,
      acknowledgedBy: Math.random() > 0.5 ? randomItem(['admin', 'ops_user', 'dev_user']) : undefined,
      resolvedAt: Math.random() > 0.6 ? new Date(Date.now() - randomBetween(0, 86400000)).toISOString() : undefined,
      duration: randomBetween(60, 86400),
      count: randomBetween(1, 50),
    });
  }
  alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return resultPageSuccess(pageNo, pageSize, alerts);
}

function generateTrendData(days = 7) {
  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trend.push({
      date: date.toISOString().split('T')[0],
      cpu: randomFloat(20, 75),
      memory: randomFloat(30, 80),
      disk: randomFloat(25, 65),
      responseTime: randomBetween(20, 150),
      qps: randomFloat(5, 80),
      errorRate: randomFloat(0, 5),
      orderCount: randomBetween(5000, 50000),
      orderAmount: randomFloat(50000, 500000),
      activeUsers: randomBetween(100, 2000),
    });
  }
  return trend;
}

export default [
  // 综合概览
  {
    url: '/basic-api/ops/overview',
    timeout: 300,
    method: 'get',
    response: () => {
      return resultSuccess({
        servers: {
          total: 8,
          online: 7,
          offline: 1,
          avgCpu: 42.5,
          avgMemory: 58.3,
          avgDisk: 45.2,
        },
        services: {
          total: 10,
          running: 8,
          stopped: 1,
          restarting: 1,
          avgResponseTime: 35,
          totalRequests: 1256800,
          totalErrors: 234,
        },
        apps: {
          total: 5,
          healthy: 4,
          unhealthy: 1,
          totalRequests: 315020,
          totalErrors: 204,
          avgResponseTime: 47.6,
        },
        business: {
          orderCount: 8567,
          orderAmount: 158680.5,
          successRate: 99.85,
          avgResponseTime: 45,
          activeUsers: 1256,
          activeConnections: 342,
        },
        alerts: {
          total: 23,
          critical: 2,
          error: 5,
          warning: 8,
          info: 8,
          pending: 3,
        },
        logs: {
          todayTotal: 125680,
          errorCount: 234,
          warnCount: 1523,
          avgPerMinute: 87,
        },
        trend: generateTrendData(24),
      });
    },
  },

  // 服务器列表
  {
    url: '/basic-api/ops/server/list',
    timeout: 300,
    method: 'get',
    response: ({ query }: requestParams) => {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      return resultPageSuccess(page, pageSize, generateServerList());
    },
  },

  // 服务器详情
  {
    url: '/basic-api/ops/server/detail/:id',
    timeout: 300,
    method: 'get',
    response: () => {
      const srv = generateServerList()[0];
      return resultSuccess({
        ...srv,
        cpuHistory: Array.from({ length: 60 }, (_, i) => ({ time: i, value: randomFloat(10, 90) })),
        memHistory: Array.from({ length: 60 }, (_, i) => ({ time: i, value: randomFloat(30, 80) })),
        diskHistory: Array.from({ length: 60 }, (_, i) => ({ time: i, value: randomFloat(20, 70) })),
        networkHistory: Array.from({ length: 60 }, (_, i) => ({
          time: i,
          rx: randomFloat(100, 5000),
          tx: randomFloat(100, 5000),
        })),
        processes: [
          { pid: 1, name: 'systemd', cpu: 0.1, mem: 120, state: 'sleeping' },
          { pid: randomBetween(1000, 2000), name: 'java', cpu: randomFloat(5, 40), mem: randomFloat(500, 3000), state: 'running' },
          { pid: randomBetween(2000, 3000), name: 'nginx', cpu: randomFloat(1, 10), mem: randomFloat(50, 200), state: 'sleeping' },
          { pid: randomBetween(3000, 4000), name: 'mysqld', cpu: randomFloat(2, 20), mem: randomFloat(300, 2000), state: 'sleeping' },
          { pid: randomBetween(4000, 5000), name: 'redis-server', cpu: randomFloat(1, 5), mem: randomFloat(100, 500), state: 'sleeping' },
        ],
        mountPoints: [
          { path: '/', total: 100, used: randomFloat(30, 80), usage: randomFloat(30, 80) },
          { path: '/data', total: 500, used: randomFloat(100, 400), usage: randomFloat(20, 80) },
          { path: '/var/log', total: 50, used: randomFloat(10, 40), usage: randomFloat(20, 80) },
        ],
      });
    },
  },

  // 服务列表
  {
    url: '/basic-api/ops/service/list',
    timeout: 300,
    method: 'get',
    response: ({ query }: requestParams) => {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      return resultPageSuccess(page, pageSize, generateServiceList());
    },
  },

  // 服务详情
  {
    url: '/basic-api/ops/service/detail/:id',
    timeout: 300,
    method: 'get',
    response: () => {
      const svc = generateServiceList()[0];
      return resultSuccess({
        ...svc,
        endpoints: [
          { path: '/api/pay', method: 'POST', avgResponseTime: 45, qps: 28.5, errorRate: 0.05 },
          { path: '/api/query', method: 'GET', avgResponseTime: 12, qps: 85.2, errorRate: 0.02 },
          { path: '/api/refund', method: 'POST', avgResponseTime: 120, qps: 5.3, errorRate: 0.15 },
          { path: '/api/notify', method: 'POST', avgResponseTime: 35, qps: 15.8, errorRate: 0.08 },
          { path: '/api/close', method: 'POST', avgResponseTime: 28, qps: 3.2, errorRate: 0.03 },
        ],
        dependencies: [
          { name: 'mysql', status: 'healthy', avgResponseTime: 5 },
          { name: 'redis', status: 'healthy', avgResponseTime: 1 },
          { name: 'rabbitmq', status: 'warning', avgResponseTime: 15 },
          { name: 'elasticsearch', status: 'healthy', avgResponseTime: 8 },
        ],
        requestHistory: Array.from({ length: 60 }, (_, i) => ({ time: i, requests: randomBetween(100, 2000), errors: randomBetween(0, 20) })),
      });
    },
  },

  // 服务健康状态
  {
    url: '/basic-api/ops/service/health',
    timeout: 300,
    method: 'get',
    response: () => {
      return resultSuccess({
        healthy: 8,
        unhealthy: 1,
        unknown: 1,
        total: 10,
        details: generateServiceList().map((s) => ({
          name: s.displayName,
          status: s.healthStatus,
          responseTime: randomBetween(5, 200),
          lastCheck: new Date(Date.now() - randomBetween(0, 30000)).toISOString(),
        })),
      });
    },
  },

  // 应用指标列表
  {
    url: '/basic-api/ops/app/list',
    timeout: 300,
    method: 'get',
    response: ({ query }: requestParams) => {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      return resultPageSuccess(page, pageSize, generateAppMetrics());
    },
  },

  // 应用指标概览
  {
    url: '/basic-api/ops/app/metrics',
    timeout: 300,
    method: 'get',
    response: () => resultSuccess(generateAppMetrics()),
  },

  // JVM 指标
  {
    url: '/basic-api/ops/app/jvm/:id',
    timeout: 300,
    method: 'get',
    response: () => {
      return resultSuccess({
        heapUsed: randomFloat(1024, 3072),
        heapMax: 4096,
        heapUsage: randomFloat(25, 75),
        oldGenUsed: randomFloat(512, 2048),
        oldGenMax: 3072,
        oldGenUsage: randomFloat(30, 85),
        youngGenUsed: randomFloat(128, 512),
        youngGenMax: 1024,
        youngGenUsage: randomFloat(20, 60),
        metaspaceUsed: randomFloat(50, 200),
        metaspaceMax: 512,
        metaspaceUsage: randomFloat(10, 40),
        heapHistory: Array.from({ length: 60 }, (_, i) => ({ time: i, used: randomFloat(512, 3072), max: 4096 })),
        gcHistory: Array.from({ length: 60 }, (_, i) => ({ time: i, count: randomBetween(0, 10), time: randomBetween(0, 100) })),
      });
    },
  },

  // 线程信息
  {
    url: '/basic-api/ops/app/thread/:id',
    timeout: 300,
    method: 'get',
    response: () => {
      return resultSuccess({
        threadCount: randomBetween(80, 300),
        threadPeak: randomBetween(200, 600),
        daemonCount: randomBetween(50, 200),
        runnableCount: randomBetween(20, 100),
        blockedCount: randomBetween(0, 5),
        waitingCount: randomBetween(30, 150),
        timedWaitingCount: randomBetween(20, 100),
        threadHistory: Array.from({ length: 60 }, (_, i) => ({ time: i, count: randomBetween(80, 300) })),
        topThreads: [
          { name: 'http-nio-8080-exec-1', state: 'RUNNABLE', cpu: randomFloat(0, 5), mem: randomFloat(50, 200), deltaCpu: randomFloat(0, 2) },
          { name: 'http-nio-8080-exec-2', state: 'RUNNABLE', cpu: randomFloat(0, 5), mem: randomFloat(50, 200), deltaCpu: randomFloat(0, 2) },
          { name: 'pool-1-thread-1', state: 'WAITING', cpu: randomFloat(0, 1), mem: randomFloat(20, 100), deltaCpu: randomFloat(0, 0.5) },
          { name: 'C2 CompilerThread0', state: 'RUNNABLE', cpu: randomFloat(0, 3), mem: randomFloat(10, 50), deltaCpu: randomFloat(0, 1) },
          { name: 'GC task thread', state: 'RUNNABLE', cpu: randomFloat(0, 10), mem: randomFloat(5, 30), deltaCpu: randomFloat(0, 5) },
        ],
      });
    },
  },

  // SQL 统计
  {
    url: '/basic-api/ops/app/sql/:id',
    timeout: 300,
    method: 'get',
    response: () => {
      return resultSuccess({
        activeCount: randomBetween(5, 30),
        idleCount: randomBetween(5, 20),
        waitingCount: randomBetween(0, 5),
        maxActive: 50,
        maxWait: randomFloat(0, 50),
        slowQueries: [
          { sql: 'SELECT * FROM pay_order WHERE create_time > ? ORDER BY id DESC LIMIT 100', execTime: 1256, count: 15, lastExec: new Date(Date.now() - 60000).toISOString() },
          { sql: 'SELECT u.*, m.* FROM sys_user u LEFT JOIN mch_merchant m ON u.id = m.user_id', execTime: 856, count: 8, lastExec: new Date(Date.now() - 120000).toISOString() },
          { sql: 'UPDATE pay_order SET status = ? WHERE order_no = ?', execTime: 45, count: 3568, lastExec: new Date(Date.now() - 5000).toISOString() },
          { sql: 'SELECT COUNT(*) FROM trade_record WHERE DATE(create_time) = CURDATE()', execTime: 523, count: 24, lastExec: new Date(Date.now() - 300000).toISOString() },
          { sql: 'INSERT INTO sys_log (user_id, action, detail) VALUES (?, ?, ?)', execTime: 8, count: 125680, lastExec: new Date(Date.now() - 1000).toISOString() },
        ],
        sqlHistory: Array.from({ length: 60 }, (_, i) => ({ time: i, active: randomBetween(5, 30), slow: randomBetween(0, 5) })),
      });
    },
  },

  // 网络接口列表
  {
    url: '/basic-api/ops/network/list',
    timeout: 300,
    method: 'get',
    response: ({ query }: requestParams) => {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      return resultPageSuccess(page, pageSize, generateNetworkList());
    },
  },

  // 端口列表
  {
    url: '/basic-api/ops/network/port/:serverId',
    timeout: 300,
    method: 'get',
    response: ({ query }: requestParams) => {
      return resultSuccess(generatePortList(query.serverId || 'srv-001'));
    },
  },

  // 带宽历史
  {
    url: '/basic-api/ops/network/bandwidth/:serverId',
    timeout: 300,
    method: 'get',
    response: () => {
      return resultSuccess({
        in: Array.from({ length: 60 }, (_, i) => ({ time: i, value: randomFloat(100, 800) })),
        out: Array.from({ length: 60 }, (_, i) => ({ time: i, value: randomFloat(50, 600) })),
        maxIn: 1000,
        maxOut: 1000,
      });
    },
  },

  // 连接状态
  {
    url: '/basic-api/ops/network/connection/:serverId',
    timeout: 300,
    method: 'get',
    response: () => {
      return resultSuccess({
        total: randomBetween(100, 500),
        established: randomBetween(50, 200),
        timeWait: randomBetween(20, 100),
        closeWait: randomBetween(5, 30),
        synRecv: randomBetween(0, 20),
        finWait1: randomBetween(0, 10),
        finWait2: randomBetween(0, 10),
        lastAck: randomBetween(0, 10),
        connectionHistory: Array.from({ length: 60 }, (_, i) => ({ time: i, established: randomBetween(50, 200), total: randomBetween(100, 500) })),
        topConnections: [
          { remoteIp: '192.168.1.200', port: 443, state: 'ESTABLISHED', count: randomBetween(5, 30), firstSeen: '2026-05-10 08:00:00' },
          { remoteIp: '192.168.1.201', port: 443, state: 'ESTABLISHED', count: randomBetween(5, 30), firstSeen: '2026-05-10 09:00:00' },
          { remoteIp: '192.168.1.202', port: 8080, state: 'ESTABLISHED', count: randomBetween(5, 30), firstSeen: '2026-05-10 10:00:00' },
          { remoteIp: '10.0.0.50', port: 3306, state: 'ESTABLISHED', count: randomBetween(1, 10), firstSeen: '2026-05-10 06:00:00' },
          { remoteIp: '10.0.0.51', port: 3306, state: 'ESTABLISHED', count: randomBetween(1, 10), firstSeen: '2026-05-10 06:00:00' },
        ],
      });
    },
  },

  // 业务概览
  {
    url: '/basic-api/ops/business/overview',
    timeout: 300,
    method: 'get',
    response: () => {
      return resultSuccess({
        orderCount: randomBetween(5000, 15000),
        orderAmount: randomFloat(50000, 500000),
        successRate: randomFloat(99.5, 99.99),
        avgResponseTime: randomBetween(30, 80),
        activeUsers: randomBetween(500, 3000),
        activeConnections: randomBetween(100, 500),
        queueLength: randomBetween(0, 100),
        cacheHitRate: randomFloat(85, 99),
        todayGrowth: randomFloat(-5, 20),
        yesterdayAmount: randomFloat(50000, 500000),
      });
    },
  },

  // 业务趋势
  {
    url: '/basic-api/ops/business/trend',
    timeout: 300,
    method: 'get',
    response: ({ query }: requestParams) => {
      const days = Number(query.days) || 7;
      return resultSuccess(generateTrendData(days));
    },
  },

  // KPI 指标
  {
    url: '/basic-api/ops/business/kpi',
    timeout: 300,
    method: 'get',
    response: () => {
      return resultSuccess({
        tps: randomFloat(50, 200),
        qps: randomFloat(100, 500),
        avgRt: randomFloat(20, 80),
        maxRt: randomFloat(200, 500),
        p99Rt: randomFloat(100, 300),
        errorRate: randomFloat(0, 2),
        successRate: randomFloat(98, 99.99),
        activeUsers: randomBetween(500, 3000),
        newUsers: randomBetween(50, 500),
        retention: randomFloat(70, 95),
        conversion: randomFloat(2, 10),
      });
    },
  },

  // 日志列表
  {
    url: '/basic-api/ops/log/list',
    timeout: 300,
    method: 'get',
    response: ({ query }: requestParams) => {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 20;
      return generateLogList(page, pageSize);
    },
  },

  // 日志详情
  {
    url: '/basic-api/ops/log/detail/:id',
    timeout: 300,
    method: 'get',
    response: () => {
      const log = generateLogList(1, 1).result;
      return resultSuccess(log[0]);
    },
  },

  // 日志统计
  {
    url: '/basic-api/ops/log/statistics',
    timeout: 300,
    method: 'get',
    response: () => {
      return resultSuccess({
        today: { total: randomBetween(80000, 150000), error: randomBetween(100, 500), warn: randomBetween(500, 2000), info: randomBetween(70000, 140000), debug: randomBetween(10000, 50000) },
        yesterday: { total: randomBetween(80000, 150000), error: randomBetween(100, 500), warn: randomBetween(500, 2000), info: randomBetween(70000, 140000), debug: randomBetween(10000, 50000) },
        trend: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: randomBetween(1000, 10000), error: randomBetween(5, 50) })),
        byService: serviceList.map((s) => ({ name: s.displayName, count: randomBetween(5000, 50000), error: randomBetween(10, 100) })),
        byLevel: [
          { level: 'DEBUG', count: randomBetween(10000, 50000), color: '#909399' },
          { level: 'INFO', count: randomBetween(70000, 140000), color: '#409EFF' },
          { level: 'WARN', count: randomBetween(500, 2000), color: '#E6A23C' },
          { level: 'ERROR', count: randomBetween(100, 500), color: '#F56C6C' },
          { level: 'FATAL', count: randomBetween(0, 20), color: '#8B0000' },
        ],
      });
    },
  },

  // 告警列表
  {
    url: '/basic-api/ops/alert/list',
    timeout: 300,
    method: 'get',
    response: ({ query }: requestParams) => {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 20;
      return generateAlertList(page, pageSize);
    },
  },

  // 告警详情
  {
    url: '/basic-api/ops/alert/detail/:id',
    timeout: 300,
    method: 'get',
    response: () => {
      const alert = generateAlertList(1, 1).result;
      return resultSuccess({
        ...alert[0],
        history: [
          { time: new Date(Date.now() - 3600000).toISOString(), event: 'triggered', desc: '告警触发' },
          { time: new Date(Date.now() - 1800000).toISOString(), event: 'acknowledged', desc: 'admin 确认告警' },
          { time: new Date(Date.now() - 600000).toISOString(), event: 'resolved', desc: '告警自动恢复' },
        ],
        rule: {
          name: 'CPU使用率告警',
          expr: 'cpu_usage > 80',
          severity: 'warning',
          duration: '5m',
          interval: '1m',
          notifyChannels: ['email', 'webhook'],
          notifyGroups: ['ops-team'],
        },
      });
    },
  },

  // 告警处理
  {
    url: '/basic-api/ops/alert/handle/:id',
    timeout: 300,
    method: 'post',
    response: () => resultSuccess({ success: true }),
  },

  // 告警规则列表
  {
    url: '/basic-api/ops/alert/rule',
    timeout: 300,
    method: 'get',
    response: ({ query }: requestParams) => {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const rules = [
        { id: 'rule-001', name: 'CPU使用率告警', metric: 'cpu.usage', expr: '> 80%', severity: 'warning', duration: '5m', status: 'enabled', alerts: 12, lastAlert: new Date(Date.now() - 3600000).toISOString() },
        { id: 'rule-002', name: '内存使用率告警', metric: 'mem.usage', expr: '> 85%', severity: 'warning', duration: '5m', status: 'enabled', alerts: 8, lastAlert: new Date(Date.now() - 7200000).toISOString() },
        { id: 'rule-003', name: '磁盘空间不足', metric: 'disk.usage', expr: '> 90%', severity: 'critical', duration: '10m', status: 'enabled', alerts: 3, lastAlert: new Date(Date.now() - 86400000).toISOString() },
        { id: 'rule-004', name: '服务响应超时', metric: 'service.response_time', expr: '> 500ms', severity: 'error', duration: '2m', status: 'enabled', alerts: 25, lastAlert: new Date(Date.now() - 600000).toISOString() },
        { id: 'rule-005', name: '错误率异常', metric: 'error.rate', expr: '> 1%', severity: 'error', duration: '3m', status: 'enabled', alerts: 18, lastAlert: new Date(Date.now() - 1800000).toISOString() },
        { id: 'rule-006', name: '数据库连接池耗尽', metric: 'db.connections', expr: '> 45', severity: 'critical', duration: '5m', status: 'enabled', alerts: 5, lastAlert: new Date(Date.now() - 172800000).toISOString() },
        { id: 'rule-007', name: 'QPS突增告警', metric: 'qps', expr: '> 500', severity: 'info', duration: '1m', status: 'disabled', alerts: 35, lastAlert: new Date(Date.now() - 604800000).toISOString() },
        { id: 'rule-008', name: 'JVM堆内存不足', metric: 'jvm.heap.usage', expr: '> 80%', severity: 'warning', duration: '5m', status: 'enabled', alerts: 10, lastAlert: new Date(Date.now() - 43200000).toISOString() },
        { id: 'rule-009', name: '活跃连接数过多', metric: 'connection.active', expr: '> 300', severity: 'warning', duration: '5m', status: 'enabled', alerts: 7, lastAlert: new Date(Date.now() - 10800000).toISOString() },
        { id: 'rule-010', name: '网络延迟过高', metric: 'network.latency', expr: '> 200ms', severity: 'error', duration: '3m', status: 'enabled', alerts: 15, lastAlert: new Date(Date.now() - 2700000).toISOString() },
      ];
      return resultPageSuccess(page, pageSize, rules);
    },
  },
] as MockMethod[];
