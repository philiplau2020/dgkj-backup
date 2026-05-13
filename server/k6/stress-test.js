/**
 * DGKJ 支付平台 - K6 性能测试脚本
 * 
 * 安装 k6: https://k6.io/docs/getting-started/installation/
 * 运行: k6 run k6-stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 自定义指标
const loginDuration = new Trend('login_duration');
const orderListDuration = new Trend('order_list_duration');
const errorRate = new Rate('error_rate');

// 测试配置
const BASE_URL = __ENV.BASE_URL || 'https://dghs.gddogootech.com';
const TEST_DURATION = '2m';
const VUS = 50;

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // 预热: 30秒内增加到20用户
    { duration: '1m', target: 50 },     // 稳定: 1分钟内增加到50用户
    { duration: '30s', target: 100 },   // 压力: 30秒内增加到100用户
    { duration: '1m', target: 100 },    // 高压: 保持100用户1分钟
    { duration: '30s', target: 0 },     // 冷却: 30秒内降到0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95%请求<500ms, 99%<1000ms
    http_req_failed: ['rate<0.05'],                    // 失败率<5%
    error_rate: ['rate<0.05'],
  },
};

// 模拟用户数据
const testUsers = [
  { username: 'admin', password: 'admin123' },
];

export function setup() {
  console.log(`Starting stress test against ${BASE_URL}`);
  
  // 执行一次登录获取 token
  const loginRes = http.post(
    `${BASE_URL}/basic-api/auth/login`,
    JSON.stringify({ username: 'admin', password: 'admin123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  let token = null;
  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    token = body.data?.token;
  }
  
  return { token };
}

// 默认测试函数
export default function(data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  
  // 1. 首页仪表盘
  const dashboardRes = http.get(
    `${BASE_URL}/basic-api/stat/dashboard`,
    { headers }
  );
  const dashboardSuccess = check(dashboardRes, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.code === 0 && body.data;
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!dashboardSuccess);
  
  // 2. 商户列表
  const mchRes = http.get(
    `${BASE_URL}/basic-api/merchant/list?page=1&pageSize=20`,
    { headers }
  );
  const mchSuccess = check(mchRes, {
    'merchant list status is 200': (r) => r.status === 200,
  });
  errorRate.add(!mchSuccess);
  
  // 3. 订单列表
  const orderStart = Date.now();
  const orderRes = http.get(
    `${BASE_URL}/basic-api/order/list?page=1&pageSize=20`,
    { headers }
  );
  orderListDuration.add(Date.now() - orderStart);
  const orderSuccess = check(orderRes, {
    'order list status is 200': (r) => r.status === 200,
  });
  errorRate.add(!orderSuccess);
  
  // 4. 账户列表
  const accountRes = http.get(
    `${BASE_URL}/basic-api/account/list`,
    { headers }
  );
  check(accountRes, {
    'account list status is 200': (r) => r.status === 200,
  });
  
  // 5. 代理列表
  const agentRes = http.get(
    `${BASE_URL}/basic-api/agent/list`,
    { headers }
  );
  check(agentRes, {
    'agent list status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}

// 健康检查测试
export function healthCheck() {
  const res = http.get(`${BASE_URL}/health`);
  check(res, {
    'health check passed': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}

// 登录性能测试
export function loginPerformance() {
  const start = Date.now();
  
  const res = http.post(
    `${BASE_URL}/basic-api/auth/login`,
    JSON.stringify({ username: 'admin', password: 'admin123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  loginDuration.add(Date.now() - start);
  
  check(res, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data?.token;
      } catch {
        return false;
      }
    },
  });
}

// 批量查询测试
export function batchQuery() {
  const batch = [
    `${BASE_URL}/basic-api/merchant/list`,
    `${BASE_URL}/basic-api/agent/list`,
    `${BASE_URL}/basic-api/order/list`,
    `${BASE_URL}/basic-api/account/list`,
    `${BASE_URL}/basic-api/stat/dashboard`,
  ];
  
  const responses = http.batch(batch.map(url => ({
    url,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token',
    },
  })));
  
  responses.forEach(res => {
    check(res, {
      'batch request successful': (r) => r.status === 200,
    });
  });
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  const { metrics } = data;
  
  let summary = '\n';
  summary += '='.repeat(60) + '\n';
  summary += '  DGKJ 支付平台 - 性能测试报告\n';
  summary += '='.repeat(60) + '\n\n';
  
  // HTTP 指标
  summary += 'HTTP 请求指标:\n';
  summary += '-'.repeat(40) + '\n';
  
  const httpMetrics = [
    { name: 'http_reqs', label: '总请求数' },
    { name: 'http_req_duration', label: '平均响应时间' },
    { name: 'http_req_failed', label: '失败率' },
  ];
  
  httpMetrics.forEach(m => {
    if (metrics[m.name]) {
      const value = metrics[m.name].values;
      if (m.name === 'http_req_duration') {
        summary += `  ${m.label}: ${value.mean.toFixed(2)}ms (p95: ${value['p(95)'].toFixed(2)}ms, p99: ${value['p(99)'].toFixed(2)}ms)\n`;
      } else if (m.name === 'http_req_failed') {
        summary += `  ${m.label}: ${(value.rate * 100).toFixed(2)}%\n`;
      } else {
        summary += `  ${m.label}: ${value.count}\n`;
      }
    }
  });
  
  summary += '\n';
  
  // 自定义指标
  summary += '自定义指标:\n';
  summary += '-'.repeat(40) + '\n';
  
  if (metrics.login_duration) {
    summary += `  登录平均耗时: ${metrics.login_duration.values.mean.toFixed(2)}ms\n`;
  }
  if (metrics.order_list_duration) {
    summary += `  订单列表平均耗时: ${metrics.order_list_duration.values.mean.toFixed(2)}ms\n`;
  }
  if (metrics.error_rate) {
    summary += `  错误率: ${(metrics.error_rate.values.rate * 100).toFixed(2)}%\n`;
  }
  
  summary += '\n';
  summary += '='.repeat(60) + '\n';
  
  return summary;
}
