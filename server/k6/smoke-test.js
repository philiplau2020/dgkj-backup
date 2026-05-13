/**
 * DGKJ 支付平台 - K6 冒烟测试脚本
 * 
 * 快速验证系统基本功能
 * 运行: k6 run k6-smoke-test.js
 */

import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://dghs.gddogootech.com';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function() {
  let token = null;
  
  // 1. 健康检查
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health endpoint available': (r) => r.status === 200,
      'health response is JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });
  });
  
  // 2. 登录
  group('Authentication', () => {
    const loginRes = http.post(
      `${BASE_URL}/basic-api/auth/login`,
      JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    check(loginRes, {
      'login successful': (r) => r.status === 200,
      'has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          token = body.data?.token;
          return !!token;
        } catch {
          return false;
        }
      },
    });
  });
  
  if (!token) {
    return;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  
  // 3. 商户管理
  group('Merchant Management', () => {
    const res = http.get(`${BASE_URL}/basic-api/merchant/list`, { headers });
    check(res, {
      'merchant list accessible': (r) => r.status === 200,
      'merchant list has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.code === 0;
        } catch {
          return false;
        }
      },
    });
  });
  
  // 4. 订单查询
  group('Order Management', () => {
    const res = http.get(`${BASE_URL}/basic-api/order/list`, { headers });
    check(res, {
      'order list accessible': (r) => r.status === 200,
    });
  });
  
  // 5. 账户查询
  group('Account Management', () => {
    const res = http.get(`${BASE_URL}/basic-api/account/list`, { headers });
    check(res, {
      'account list accessible': (r) => r.status === 200,
    });
  });
  
  // 6. 统计面板
  group('Statistics', () => {
    const res = http.get(`${BASE_URL}/basic-api/stat/dashboard`, { headers });
    check(res, {
      'dashboard accessible': (r) => r.status === 200,
    });
  });
}
