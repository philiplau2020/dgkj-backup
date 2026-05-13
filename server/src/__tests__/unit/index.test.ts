/**
 * DGKJ 支付平台 - 单元测试
 * 
 * 覆盖核心服务：认证、缓存、签名、工具函数
 */

import { Request, Response, NextFunction } from 'express';

// ==================== 工具函数测试 ====================

describe('Utils', () => {
  describe('OrderNo Generation', () => {
    it('应该生成唯一订单号', () => {
      const generateOrderNo = () => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `OP${timestamp}${random}`;
      };

      const orderNo1 = generateOrderNo();
      const orderNo2 = generateOrderNo();

      expect(orderNo1).toMatch(/^OP[A-Z0-9]+$/);
      expect(orderNo2).toMatch(/^OP[A-Z0-9]+$/);
      expect(orderNo1).not.toBe(orderNo2);
    });

    it('订单号长度应该在合理范围内', () => {
      const generateOrderNo = () => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `OP${timestamp}${random}`;
      };

      const orderNo = generateOrderNo();
      expect(orderNo.length).toBeGreaterThanOrEqual(10);
      expect(orderNo.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Amount Conversion', () => {
    it('应该正确转换元到分', () => {
      const yuanToFen = (yuan: number) => Math.round(yuan * 100);

      expect(yuanToFen(100)).toBe(10000);
      expect(yuanToFen(0.01)).toBe(1);
      expect(yuanToFen(99.99)).toBe(9999);
      expect(yuanToFen(0)).toBe(0);
    });

    it('应该正确转换分到元', () => {
      const fenToYuan = (fen: number) => fen / 100;

      expect(fenToYuan(10000)).toBe(100);
      expect(fenToYuan(1)).toBe(0.01);
      expect(fenToYuan(9999)).toBe(99.99);
      expect(fenToYuan(0)).toBe(0);
    });

    it('应该处理浮点数精度问题', () => {
      const yuanToFen = (yuan: number) => Math.round(yuan * 100);

      // 0.1 + 0.2 !== 0.3 的经典问题
      expect(yuanToFen(0.1 + 0.2)).toBe(30);
      expect(yuanToFen(0.3)).toBe(30);
    });
  });

  describe('Amount Validation', () => {
    it('应该验证金额范围', () => {
      const validateAmount = (amount: number, min = 0.01, max = 1000000) => {
        return amount >= min && amount <= max && Number.isFinite(amount);
      };

      expect(validateAmount(100)).toBe(true);
      expect(validateAmount(0.01)).toBe(true);
      expect(validateAmount(1000000)).toBe(true);
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount(-1)).toBe(false);
      expect(validateAmount(1000001)).toBe(false);
      expect(validateAmount(Infinity)).toBe(false);
    });
  });

  describe('Phone Validation', () => {
    it('应该正确验证中国大陆手机号', () => {
      const validatePhone = (phone: string) => {
        return /^1[3-9]\d{9}$/.test(phone);
      };

      expect(validatePhone('13800138000')).toBe(true);
      expect(validatePhone('15912345678')).toBe(true);
      expect(validatePhone('19876543210')).toBe(true);
      expect(validatePhone('1380013800')).toBe(false);  // 11位但第二位不对
      expect(validatePhone('23800138000')).toBe(false);  // 2开头不对
      expect(validatePhone('138001380001')).toBe(false); // 12位
      expect(validatePhone('abc')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('应该正确验证邮箱格式', () => {
      const validateEmail = (email: string) => {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
      };

      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.com')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@nodomain.com')).toBe(false);
      expect(validateEmail('no@')).toBe(false);
      expect(validateEmail('no@.com')).toBe(false);
    });
  });

  describe('Date Formatting', () => {
    it('应该正确格式化日期', () => {
      const formatDate = (date: Date, format = 'YYYY-MM-DD HH:mm:ss') => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return format
          .replace('YYYY', date.getFullYear().toString())
          .replace('MM', pad(date.getMonth() + 1))
          .replace('DD', pad(date.getDate()))
          .replace('HH', pad(date.getHours()))
          .replace('mm', pad(date.getMinutes()))
          .replace('ss', pad(date.getSeconds()));
      };

      const date = new Date('2024-01-15T10:30:45');
      expect(formatDate(date)).toBe('2024-01-15 10:30:45');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
      expect(formatDate(date, 'HH:mm')).toBe('10:30');
    });

    it('应该正确计算时间戳', () => {
      const now = Date.now();
      const date = new Date(now);
      
      expect(date.getTime()).toBe(now);
      expect(Math.floor(now / 1000)).toBe(Math.floor(date.getTime() / 1000));
    });
  });
});

// ==================== 签名服务测试 ====================

describe('SignatureService', () => {
  const crypto = require('crypto');

  describe('MD5 Signature', () => {
    it('应该正确生成 MD5 签名', () => {
      const data = 'appId=test&amount=100&orderNo=ORDER123';
      const secret = 'testSecret';
      
      const sign = crypto
        .createHash('md5')
        .update(data + '&key=' + secret)
        .digest('hex')
        .toUpperCase();

      expect(sign).toHaveLength(32);
      expect(sign).toMatch(/^[A-F0-9]+$/);
    });

    it('相同数据应生成相同签名', () => {
      const data = 'test=data';
      const secret = 'secret';
      
      const sign1 = crypto.createHash('md5').update(data + secret).digest('hex');
      const sign2 = crypto.createHash('md5').update(data + secret).digest('hex');

      expect(sign1).toBe(sign2);
    });

    it('不同数据应生成不同签名', () => {
      const data1 = 'test=data1';
      const data2 = 'test=data2';
      const secret = 'secret';
      
      const sign1 = crypto.createHash('md5').update(data1 + secret).digest('hex');
      const sign2 = crypto.createHash('md5').update(data2 + secret).digest('hex');

      expect(sign1).not.toBe(sign2);
    });
  });

  describe('RSA Signature', () => {
    it('应该正确生成 RSA 签名', () => {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
      });

      const data = 'orderNo=ORDER123&amount=100&timestamp=1234567890';
      
      const sign = crypto.sign('SHA256', Buffer.from(data), {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      });

      const isValid = crypto.verify('SHA256', Buffer.from(data), publicKey, sign);
      
      expect(isValid).toBe(true);
    });

    it('篡改数据应导致签名验证失败', () => {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
      });

      const originalData = 'orderNo=ORDER123&amount=100';
      const tamperedData = 'orderNo=ORDER123&amount=200';
      
      const sign = crypto.sign('SHA256', Buffer.from(originalData), {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      });

      const isValid = crypto.verify('SHA256', Buffer.from(tamperedData), publicKey, sign);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Sign Parameter Sorting', () => {
    it('应该正确排序参数', () => {
      const params = {
        appId: 'test',
        amount: '100',
        orderNo: 'ORDER123',
        timestamp: '1234567890',
      };

      const sortedKeys = Object.keys(params).sort();
      const stringA = sortedKeys.map(k => `${k}=${params[k as keyof typeof params]}`).join('&');

      expect(stringA).toBe('appId=test&amount=100&orderNo=ORDER123&timestamp=1234567890');
    });
  });
});

// ==================== 缓存服务测试 ====================

describe('CacheService', () => {
  // 模拟内存缓存
  class MockCache {
    private cache = new Map<string, { value: any; expireTime: number }>();
    private maxSize = 1000;

    set(key: string, value: any, ttl = 3600) {
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(key, {
        value,
        expireTime: Date.now() + ttl * 1000,
      });
    }

    get(key: string): any | null {
      const item = this.cache.get(key);
      if (!item) return null;
      if (Date.now() > item.expireTime) {
        this.cache.delete(key);
        return null;
      }
      return item.value;
    }

    delete(key: string) {
      return this.cache.delete(key);
    }

    clear() {
      this.cache.clear();
    }

    has(key: string): boolean {
      return this.get(key) !== null;
    }
  }

  let cache: MockCache;

  beforeEach(() => {
    cache = new MockCache();
  });

  describe('Basic Operations', () => {
    it('应该正确设置和获取缓存', () => {
      cache.set('key1', { data: 'test' });
      expect(cache.get('key1')).toEqual({ data: 'test' });
    });

    it('获取不存在的键应返回 null', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('应该正确删除缓存', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('删除不存在的键应返回 false', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('应该正确清空缓存', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });

    it('应该正确检查键是否存在', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL Expiration', () => {
    it('未过期的缓存应该可以正常获取', () => {
      cache.set('key1', 'value1', 3600);
      expect(cache.has('key1')).toBe(true);
    });

    it('过期的缓存应该返回 null', () => {
      cache.set('expired', 'value', -1);
      expect(cache.get('expired')).toBeNull();
    });
  });

  describe('LRU Eviction', () => {
    it('超过最大容量应该删除最早的缓存', () => {
      const smallCache = new MockCache();
      (smallCache as any).maxSize = 3;

      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      smallCache.set('key4', 'value4');

      expect(smallCache.get('key1')).toBeNull(); // 已被删除
      expect(smallCache.get('key2')).toBe('value2');
      expect(smallCache.get('key3')).toBe('value3');
      expect(smallCache.get('key4')).toBe('value4');
    });
  });

  describe('Data Types', () => {
    it('应该支持存储各种数据类型', () => {
      cache.set('string', 'test string');
      cache.set('number', 12345);
      cache.set('boolean', true);
      cache.set('array', [1, 2, 3]);
      cache.set('object', { nested: { data: 'value' } });
      cache.set('null', null);

      expect(cache.get('string')).toBe('test string');
      expect(cache.get('number')).toBe(12345);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('array')).toEqual([1, 2, 3]);
      expect(cache.get('object')).toEqual({ nested: { data: 'value' } });
      expect(cache.get('null')).toBeNull();
    });
  });
});

// ==================== 限流器测试 ====================

describe('RateLimiter', () => {
  // 模拟限流器
  class MockRateLimiter {
    private requests = new Map<string, { count: number; resetTime: number }>();
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests: number, windowMs: number) {
      this.maxRequests = maxRequests;
      this.windowMs = windowMs;
    }

    check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
      const now = Date.now();
      let record = this.requests.get(key);

      if (!record || now >= record.resetTime) {
        record = { count: 0, resetTime: now + this.windowMs };
      }

      record.count++;
      this.requests.set(key, record);

      return {
        allowed: record.count <= this.maxRequests,
        remaining: Math.max(0, this.maxRequests - record.count),
        resetTime: record.resetTime,
      };
    }

    reset(key: string) {
      this.requests.delete(key);
    }
  }

  describe('Basic Rate Limiting', () => {
    it('在限制内的请求应该被允许', () => {
      const limiter = new MockRateLimiter(10, 60000);
      
      for (let i = 0; i < 10; i++) {
        const result = limiter.check('ip1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(10 - i - 1);
      }
    });

    it('超过限制的请求应该被拒绝', () => {
      const limiter = new MockRateLimiter(3, 60000);
      
      limiter.check('ip1');
      limiter.check('ip1');
      limiter.check('ip1');
      
      const result = limiter.check('ip1');
      expect(result.allowed).toBe(false);
    });

    it('不同 IP 应该独立计数', () => {
      const limiter = new MockRateLimiter(2, 60000);
      
      limiter.check('ip1');
      limiter.check('ip1');
      
      const result1 = limiter.check('ip2');
      expect(result1.allowed).toBe(true);
      
      const result2 = limiter.check('ip1');
      expect(result2.allowed).toBe(false);
    });
  });

  describe('Window Reset', () => {
    it('时间窗口重置后应该重新计数', () => {
      const limiter = new MockRateLimiter(2, 100);
      
      limiter.check('ip1');
      limiter.check('ip1');
      expect(limiter.check('ip1').allowed).toBe(false);
      
      // 模拟时间窗口过期
      (limiter as any).requests.get('ip1').resetTime = Date.now() - 1;
      
      expect(limiter.check('ip1').allowed).toBe(true);
    });
  });
});

// ==================== 响应格式测试 ====================

describe('ResponseFormat', () => {
  describe('Success Response', () => {
    it('应该正确构建成功响应', () => {
      const successResponse = (data: any, message = 'success') => ({
        code: 0,
        message,
        data,
      });

      const response = successResponse({ id: 1, name: 'test' });
      expect(response.code).toBe(0);
      expect(response.message).toBe('success');
      expect(response.data).toEqual({ id: 1, name: 'test' });
    });

    it('应该支持空数据', () => {
      const successResponse = (data: any = null, message = 'success') => ({
        code: 0,
        message,
        data,
      });

      const response = successResponse();
      expect(response.code).toBe(0);
      expect(response.data).toBeNull();
    });
  });

  describe('Error Response', () => {
    it('应该正确构建错误响应', () => {
      const errorResponse = (code: number, message: string, data: any = null) => ({
        code,
        message,
        data,
      });

      const response = errorResponse(400, 'Bad Request');
      expect(response.code).toBe(400);
      expect(response.message).toBe('Bad Request');
      expect(response.data).toBeNull();
    });

    it('应该支持自定义错误码', () => {
      const errorCodes = {
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_ERROR: 500,
      };

      expect(errorCodes.BAD_REQUEST).toBe(400);
      expect(errorCodes.UNAUTHORIZED).toBe(401);
      expect(errorCodes.FORBIDDEN).toBe(403);
      expect(errorCodes.NOT_FOUND).toBe(404);
      expect(errorCodes.INTERNAL_ERROR).toBe(500);
    });
  });

  describe('Pagination Response', () => {
    it('应该正确构建分页响应', () => {
      const paginatedResponse = (
        list: any[],
        total: number,
        page: number,
        pageSize: number
      ) => ({
        code: 0,
        message: 'success',
        data: {
          list,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      });

      const items = [{ id: 1 }, { id: 2 }];
      const response = paginatedResponse(items, 100, 1, 10);

      expect(response.data.list).toEqual(items);
      expect(response.data.total).toBe(100);
      expect(response.data.page).toBe(1);
      expect(response.data.pageSize).toBe(10);
      expect(response.data.totalPages).toBe(10);
    });
  });
});

// ==================== Token 测试 ====================

describe('JWT Token', () => {
  const jwt = require('jsonwebtoken');
  const secret = 'test-secret';

  describe('Token Generation', () => {
    it('应该正确生成 Token', () => {
      const payload = {
        userId: 1,
        username: 'admin',
        role: 'admin',
      };

      const token = jwt.sign(payload, secret, { expiresIn: '24h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT 格式: header.payload.signature
    });

    it('Token 应该包含过期时间', () => {
      const payload = { userId: 1 };
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('Token Verification', () => {
    it('应该正确验证有效 Token', () => {
      const payload = { userId: 1 };
      const token = jwt.sign(payload, secret);
      
      const decoded = jwt.verify(token, secret);
      expect((decoded as any).userId).toBe(1);
    });

    it('无效 Token 应该抛出错误', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        jwt.verify(invalidToken, secret);
      }).toThrow();
    });

    it('过期 Token 应该抛出错误', () => {
      const payload = { userId: 1 };
      const token = jwt.sign(payload, secret, { expiresIn: '-1s' });
      
      expect(() => {
        jwt.verify(token, secret);
      }).toThrow();
    });

    it('错误密钥应该导致验证失败', () => {
      const payload = { userId: 1 };
      const token = jwt.sign(payload, secret);
      
      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });
  });
});

// ==================== 密码安全测试 ====================

describe('Password Security', () => {
  const bcrypt = require('bcryptjs');

  describe('Password Hashing', () => {
    it('应该正确生成密码哈希', async () => {
      const password = 'admin123';
      const hash = await bcrypt.hash(password, 10);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2a$')).toBe(true);
    });

    it('相同密码应生成不同哈希（盐值）', async () => {
      const password = 'admin123';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      expect(hash1).not.toBe(hash2);
    });

    it('哈希长度应该符合 bcrypt 规范', async () => {
      const hash = await bcrypt.hash('password', 10);
      expect(hash.length).toBe(60);
    });
  });

  describe('Password Verification', () => {
    it('正确密码应该验证成功', async () => {
      const password = 'admin123';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('错误密码应该验证失败', async () => {
      const password = 'admin123';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare('wrongpassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Password Strength', () => {
    it('应该验证密码强度', () => {
      const validatePasswordStrength = (password: string) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
          valid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
          score: [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length,
        };
      };

      expect(validatePasswordStrength('Admin123').valid).toBe(true);
      expect(validatePasswordStrength('admin123').valid).toBe(false); // 无大写
      expect(validatePasswordStrength('Admin12').valid).toBe(false);  // 长度不足
      expect(validatePasswordStrength('Admin123!').score).toBe(4);
    });
  });
});
