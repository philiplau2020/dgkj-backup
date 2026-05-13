import { Router } from 'express';
import os from 'os';
import { AppDataSource } from '../../config/data-source';

const router = Router();

// Helper function for unified response
function resOk(res: any, data: any, message = 'ok') {
  res.json({ code: 0, message, data });
}

function resError(res: any, message: string, code = 500) {
  res.json({ code, message, data: null });
}

// 模拟数据
const mockServers = [
  {
    id: 'srv-001',
    hostname: process.env.SERVER_HOSTNAME || 'dgkj-server',
    ip: process.env.SERVER_IP || '127.0.0.1',
    port: 22,
    os: 'Ubuntu 22.04',
    cpuUsage: os.loadavg()[0] * 10,
    cpuCores: os.cpus().length,
    memTotal: os.totalmem(),
    memUsed: os.totalmem() - os.freemem(),
    memUsage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1),
    diskTotal: 51200,
    diskUsed: 20480,
    diskUsage: 40,
    uptime: os.uptime(),
    status: 'online',
    role: 'Primary',
    lastHeartbeat: new Date().toISOString()
  }
];

const mockServices = [
  {
    id: 'svc-001',
    name: 'dgkj-server',
    displayName: 'DGKJ 后端服务',
    version: '1.0.0',
    host: '127.0.0.1',
    port: parseInt(process.env.PORT || '3000'),
    status: 'running',
    pid: process.pid,
    startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    uptime: Math.floor(process.uptime()),
    healthCheckUrl: '/health',
    healthStatus: 'healthy',
    responseTime: Math.floor(Math.random() * 50 + 10),
    requests: Math.floor(Math.random() * 10000),
    errors: 0,
    cpuUsage: process.cpuUsage().user / 1000000,
    memUsage: process.memoryUsage().heapUsed / 1024 / 1024
  },
  {
    id: 'svc-002',
    name: 'nginx',
    displayName: 'Nginx Web 服务',
    version: '1.18.0',
    host: '127.0.0.1',
    port: 80,
    status: 'running',
    pid: 1,
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    uptime: 24 * 60 * 60,
    healthCheckUrl: '',
    healthStatus: 'healthy',
    responseTime: 5,
    requests: 45678,
    errors: 0,
    cpuUsage: 1.2,
    memUsage: 45
  },
  {
    id: 'svc-003',
    name: 'mysql',
    displayName: 'MySQL 数据库',
    version: '8.0.36',
    host: '127.0.0.1',
    port: 3306,
    status: 'running',
    pid: 1234,
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    uptime: 24 * 60 * 60,
    healthCheckUrl: '',
    healthStatus: 'healthy',
    responseTime: 10,
    requests: 8956,
    errors: 0,
    cpuUsage: 5.8,
    memUsage: 512
  }
];

const mockAlerts = [
  {
    id: 'alert-001',
    level: 'info',
    title: '服务正常运行',
    content: '所有监控指标正常，系统运行稳定',
    source: 'system',
    host: process.env.SERVER_IP || '127.0.0.1',
    metric: 'system.health',
    value: 100,
    threshold: 90,
    unit: '%',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    duration: 0,
    count: 1
  }
];

// 综合概览
router.get('/overview', (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const overview = {
      serverCount: 1,
      serverOnline: 1,
      serviceCount: mockServices.length,
      serviceRunning: mockServices.filter(s => s.status === 'running').length,
      alertCount: mockAlerts.filter(a => a.status === 'active').length,
      cpuUsage: parseFloat((os.loadavg()[0] * 10).toFixed(1)),
      memUsage: parseFloat(((usedMem / totalMem) * 100).toFixed(1)),
      diskUsage: 40,
      networkIn: Math.floor(Math.random() * 10000),
      networkOut: Math.floor(Math.random() * 8000),
      uptime: os.uptime(),
      timestamp: new Date().toISOString()
    };

    resOk(res, overview);
  } catch (error) {
    resError(res, '获取概览失败');
  }
});

// 服务器列表
router.get('/server/list', (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const start = (Number(page) - 1) * Number(pageSize);
    const list = mockServers.slice(start, start + Number(pageSize));
    resOk(res, { list, total: mockServers.length, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    resError(res, '获取服务器列表失败');
  }
});

// 服务器详情
router.get('/server/detail/:id', (req, res) => {
  try {
    const server = mockServers.find(s => s.id === req.params.id) || mockServers[0];
    resOk(res, server);
  } catch (error) {
    resError(res, '获取服务器详情失败');
  }
});

// 服务列表
router.get('/service/list', (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const start = (Number(page) - 1) * Number(pageSize);
    const list = mockServices.slice(start, start + Number(pageSize));
    resOk(res, { list, total: mockServices.length, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    resError(res, '获取服务列表失败');
  }
});

// 服务详情
router.get('/service/detail/:id', (req, res) => {
  try {
    const service = mockServices.find(s => s.id === req.params.id) || mockServices[0];
    resOk(res, service);
  } catch (error) {
    resError(res, '获取服务详情失败');
  }
});

// 服务健康检查
router.get('/service/health', (req, res) => {
  try {
    const health = {
      status: 'healthy',
      services: mockServices.map(s => ({
        name: s.name,
        status: s.healthStatus,
        responseTime: s.responseTime + Math.floor(Math.random() * 10)
      })),
      timestamp: new Date().toISOString()
    };
    resOk(res, health);
  } catch (error) {
    resError(res, '健康检查失败');
  }
});

// 应用指标
router.get('/app/metrics', (req, res) => {
  try {
    const metrics = [{
      id: 'app-001',
      name: 'dgkj-api',
      group: 'api',
      requests: Math.floor(Math.random() * 10000),
      errors: Math.floor(Math.random() * 10),
      avgResponseTime: Math.floor(Math.random() * 100 + 20),
      p99ResponseTime: Math.floor(Math.random() * 200 + 50),
      qps: parseFloat((Math.random() * 5 + 1).toFixed(2)),
      concurrency: Math.floor(Math.random() * 20 + 5),
      cpuUsage: parseFloat((Math.random() * 30 + 5).toFixed(1)),
      memUsage: parseFloat((Math.random() * 50 + 20).toFixed(1)),
      jvmHeapUsed: Math.floor(Math.random() * 256 + 128),
      jvmHeapMax: 512,
      jvmHeapUsage: parseFloat((Math.random() * 30 + 40).toFixed(1)),
      jvmOldGenUsage: parseFloat((Math.random() * 20 + 30).toFixed(1)),
      jvmYoungGenUsage: parseFloat((Math.random() * 30 + 50).toFixed(1)),
      threadCount: Math.floor(Math.random() * 20 + 30),
      threadPeak: Math.floor(Math.random() * 30 + 40),
      dbActive: Math.floor(Math.random() * 15 + 5),
      dbIdle: Math.floor(Math.random() * 10 + 10),
      gcCount: Math.floor(Math.random() * 100 + 50),
      gcTime: Math.floor(Math.random() * 500 + 200)
    }];
    resOk(res, metrics);
  } catch (error) {
    resError(res, '获取应用指标失败');
  }
});

// 应用列表
router.get('/app/list', (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const start = (Number(page) - 1) * Number(pageSize);
    const list = mockServices.slice(start, start + Number(pageSize));
    resOk(res, { list, total: mockServices.length, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    resError(res, '获取应用列表失败');
  }
});

// 网络列表
router.get('/network/list', (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    const list = Object.entries(interfaces).map(([name, addrs]) => {
      const addr = addrs?.find(a => !a.internal && a.family === 'IPv4');
      return {
        id: `net-${name}`,
        interfaceName: name,
        ip: addr?.address || '127.0.0.1',
        mac: addr?.mac || '00:00:00:00:00:00',
        status: 'up',
        speed: '1Gbps',
        rxBytes: Math.floor(Math.random() * 1000000000),
        txBytes: Math.floor(Math.random() * 500000000),
        rxPackets: Math.floor(Math.random() * 1000000),
        txPackets: Math.floor(Math.random() * 800000),
        rxErrors: 0,
        txErrors: 0,
        bandwidthIn: Math.floor(Math.random() * 100),
        bandwidthOut: Math.floor(Math.random() * 80)
      };
    });
    resOk(res, { list, total: list.length });
  } catch (error) {
    resError(res, '获取网络列表失败');
  }
});

// 网络端口
router.get('/network/port/:serverId', (req, res) => {
  try {
    const ports = [
      { id: 'p-1', serverId: 'srv-001', port: 22, protocol: 'TCP', state: 'LISTEN', processName: 'sshd', pid: 1234, connections: 1, bindAddress: '0.0.0.0' },
      { id: 'p-2', serverId: 'srv-001', port: 80, protocol: 'TCP', state: 'LISTEN', processName: 'nginx', pid: 5678, connections: 12, bindAddress: '0.0.0.0' },
      { id: 'p-3', serverId: 'srv-001', port: 443, protocol: 'TCP', state: 'LISTEN', processName: 'nginx', pid: 5678, connections: 8, bindAddress: '0.0.0.0' },
      { id: 'p-4', serverId: 'srv-001', port: 3000, protocol: 'TCP', state: 'LISTEN', processName: 'node', pid: process.pid, connections: 3, bindAddress: '127.0.0.1' }
    ];
    resOk(res, { list: ports, total: ports.length });
  } catch (error) {
    resError(res, '获取端口列表失败');
  }
});

// 业务概览
router.get('/business/overview', (req, res) => {
  try {
    const overview = {
      orderCount: Math.floor(Math.random() * 10000 + 5000),
      orderAmount: Math.floor(Math.random() * 1000000 + 500000),
      successRate: parseFloat((98 + Math.random() * 2).toFixed(2)),
      avgResponseTime: Math.floor(Math.random() * 50 + 80),
      activeUsers: Math.floor(Math.random() * 100 + 50),
      activeConnections: Math.floor(Math.random() * 30 + 10),
      queueLength: 0,
      cacheHitRate: parseFloat((94 + Math.random() * 5).toFixed(1))
    };
    resOk(res, overview);
  } catch (error) {
    resError(res, '获取业务概览失败');
  }
});

// 业务趋势
router.get('/business/trend', (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trend.push({
        date: date.toISOString().split('T')[0],
        orderCount: Math.floor(Math.random() * 2000 + 1000),
        orderAmount: Math.floor(Math.random() * 500000 + 100000),
        successRate: parseFloat((98 + Math.random() * 2).toFixed(2)),
        avgResponseTime: Math.floor(Math.random() * 50 + 80)
      });
    }
    resOk(res, trend);
  } catch (error) {
    resError(res, '获取业务趋势失败');
  }
});

// 业务 KPI
router.get('/business/kpi', (req, res) => {
  try {
    const kpi = {
      totalOrders: Math.floor(Math.random() * 50000 + 10000),
      totalAmount: Math.floor(Math.random() * 5000000 + 1000000),
      todayOrders: Math.floor(Math.random() * 1000 + 500),
      todayAmount: Math.floor(Math.random() * 200000 + 50000),
      yesterdayOrders: Math.floor(Math.random() * 1000 + 500),
      yesterdayAmount: Math.floor(Math.random() * 200000 + 50000),
      weekGrowth: parseFloat((Math.random() * 10 - 2).toFixed(1)),
      monthGrowth: parseFloat((Math.random() * 20 - 5).toFixed(1)),
      avgOrderAmount: parseFloat((Math.random() * 100 + 100).toFixed(2)),
      conversionRate: parseFloat((60 + Math.random() * 20).toFixed(1))
    };
    resOk(res, kpi);
  } catch (error) {
    resError(res, '获取业务KPI失败');
  }
});

// 日志列表
router.get('/log/list', (req, res) => {
  try {
    const { page = 1, pageSize = 20, level, serviceName } = req.query;
    const logs = [
      { id: 'log-001', timestamp: new Date().toISOString(), level: 'INFO', source: 'app', serviceName: 'dgkj-server', host: process.env.SERVER_IP || '127.0.0.1', message: '服务启动成功', traceId: 'trace-001', spanId: 'span-001' },
      { id: 'log-002', timestamp: new Date(Date.now() - 60000).toISOString(), level: 'INFO', source: 'app', serviceName: 'dgkj-server', host: process.env.SERVER_IP || '127.0.0.1', message: '数据库连接成功', traceId: 'trace-002', spanId: 'span-002' },
      { id: 'log-003', timestamp: new Date(Date.now() - 120000).toISOString(), level: 'WARN', source: 'app', serviceName: 'dgkj-server', host: process.env.SERVER_IP || '127.0.0.1', message: '请求响应时间较长', traceId: 'trace-003', spanId: 'span-003' },
      { id: 'log-004', timestamp: new Date(Date.now() - 180000).toISOString(), level: 'ERROR', source: 'app', serviceName: 'dgkj-server', host: process.env.SERVER_IP || '127.0.0.1', message: '第三方支付接口调用失败', traceId: 'trace-004', spanId: 'span-004' },
      { id: 'log-005', timestamp: new Date(Date.now() - 240000).toISOString(), level: 'INFO', source: 'nginx', serviceName: 'nginx', host: process.env.SERVER_IP || '127.0.0.1', message: '新的连接建立', traceId: '', spanId: '' }
    ];

    let filtered = logs;
    if (level) filtered = filtered.filter(l => l.level === String(level).toUpperCase());
    if (serviceName) filtered = filtered.filter(l => l.serviceName === String(serviceName));

    const start = (Number(page) - 1) * Number(pageSize);
    resOk(res, { list: filtered.slice(start, start + Number(pageSize)), total: filtered.length, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    resError(res, '获取日志列表失败');
  }
});

// 日志详情
router.get('/log/detail/:id', (req, res) => {
  try {
    const log = {
      id: req.params.id,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      source: 'app',
      serviceName: 'dgkj-server',
      host: process.env.SERVER_IP || '127.0.0.1',
      message: '详细的日志内容...',
      traceId: 'trace-001',
      spanId: 'span-001',
      exception: null,
      stackTrace: null
    };
    resOk(res, log);
  } catch (error) {
    resError(res, '获取日志详情失败');
  }
});

// 日志统计
router.get('/log/statistics', (req, res) => {
  try {
    const stats = {
      totalCount: Math.floor(Math.random() * 100000 + 50000),
      todayCount: Math.floor(Math.random() * 1000 + 500),
      errorCount: Math.floor(Math.random() * 20 + 5),
      warnCount: Math.floor(Math.random() * 50 + 20),
      infoCount: Math.floor(Math.random() * 1000 + 500),
      levels: { DEBUG: 0, INFO: 799, WARN: 45, ERROR: 12, FATAL: 0 },
      services: { 'dgkj-server': 856, 'nginx': 0, 'mysql': 0 }
    };
    resOk(res, stats);
  } catch (error) {
    resError(res, '获取日志统计失败');
  }
});

// 告警列表
router.get('/alert/list', (req, res) => {
  try {
    const { page = 1, pageSize = 10, level, status } = req.query;
    let filtered = mockAlerts;
    if (level) filtered = filtered.filter(a => a.level === level);
    if (status) filtered = filtered.filter(a => a.status === status);

    const start = (Number(page) - 1) * Number(pageSize);
    resOk(res, { list: filtered.slice(start, start + Number(pageSize)), total: filtered.length, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    resError(res, '获取告警列表失败');
  }
});

// 告警详情
router.get('/alert/detail/:id', (req, res) => {
  try {
    const alert = mockAlerts.find(a => a.id === req.params.id) || mockAlerts[0];
    resOk(res, alert);
  } catch (error) {
    resError(res, '获取告警详情失败');
  }
});

// 处理告警
router.post('/alert/handle/:id', (req, res) => {
  try {
    const { action, note } = req.body;
    resOk(res, { id: req.params.id, action, note, handledAt: new Date().toISOString() }, '处理成功');
  } catch (error) {
    resError(res, '处理告警失败');
  }
});

// 告警规则
router.get('/alert/rule', (req, res) => {
  try {
    const rules = [
      { id: 'rule-001', name: 'CPU 使用率告警', metric: 'system.cpu.usage', threshold: 80, level: 'warning', enabled: true },
      { id: 'rule-002', name: '内存使用率告警', metric: 'system.mem.usage', threshold: 85, level: 'warning', enabled: true },
      { id: 'rule-003', name: '磁盘使用率告警', metric: 'system.disk.usage', threshold: 90, level: 'error', enabled: true },
      { id: 'rule-004', name: '服务响应时间告警', metric: 'service.response.time', threshold: 500, level: 'warning', enabled: true }
    ];
    resOk(res, { list: rules, total: rules.length });
  } catch (error) {
    resError(res, '获取告警规则失败');
  }
});

export default router;
