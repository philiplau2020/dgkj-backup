/**
 * Jest 测试环境配置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '3306';
process.env.DATABASE_USER = 'root';
process.env.DATABASE_PASSWORD = 'root';
process.env.DATABASE_NAME = 'dgkj_test';

// 设置超时
jest.setTimeout(10000);

// 全局变量
global.cacheService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
  clear: jest.fn().mockResolvedValue(true),
};

// Mock console.error 在测试中减少噪音
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // 忽略特定的警告信息
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('React'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
