/**
 * DGKJ 支付平台 - Redis 缓存服务
 * 
 * 提供统一的缓存接口，支持本地缓存和 Redis 缓存
 */

import { AppDataSource } from '../config/data-source';

// ==================== 配置 ====================

interface CacheConfig {
  type: 'memory' | 'redis';
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
  memory?: {
    maxSize?: number;
    ttl?: number;
  };
}

interface CacheOptions {
  ttl?: number;        // 过期时间（秒）
  prefix?: string;      // 键前缀
}

// ==================== 内存缓存实现 ====================

class MemoryCache {
  private cache: Map<string, { value: any; expireTime: number }> = new Map();
  private maxSize: number;
  private defaultTtl: number;

  constructor(maxSize = 1000, defaultTtl = 3600) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expireTime) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // 删除最老的项
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expireTime = Date.now() + (ttl || this.defaultTtl) * 1000;
    this.cache.set(key, { value, expireTime });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    if (Date.now() > item.expireTime) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return -1;
    if (Date.now() > item.expireTime) {
      this.cache.delete(key);
      return -2;
    }
    return Math.ceil((item.expireTime - Date.now()) / 1000);
  }
}

// ==================== Redis 缓存实现 ====================

class RedisCache {
  private client: any = null;
  private keyPrefix: string;
  private connected: boolean = false;

  constructor(keyPrefix = 'dgkj:') {
    this.keyPrefix = keyPrefix;
  }

  private async getClient() {
    if (this.client && this.connected) {
      return this.client;
    }

    try {
      const redis = require('ioredis');
      const config = AppDataSource.options as any;
      
      this.client = new redis({
        host: config.redisHost || process.env.REDIS_HOST || '127.0.0.1',
        port: config.redisPort || parseInt(process.env.REDIS_PORT || '6379'),
        password: config.redisPassword || process.env.REDIS_PASSWORD || undefined,
        db: config.redisDb || parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.connected = true;
        console.log('Redis 连接成功');
      });

      this.client.on('error', (err: Error) => {
        console.error('Redis 连接错误:', err.message);
        this.connected = false;
      });

      await this.client.connect();
      this.connected = true;
      return this.client;
    } catch (error) {
      console.error('Redis 初始化失败:', error);
      this.connected = false;
      return null;
    }
  }

  private formatKey(key: string): string {
    return this.keyPrefix + key;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient();
      if (!client) return null;

      const value = await client.get(this.formatKey(key));
      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      console.error('Redis GET 错误:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) return;

      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        await client.setex(this.formatKey(key), ttl, serialized);
      } else {
        await client.set(this.formatKey(key), serialized);
      }
    } catch (error) {
      console.error('Redis SET 错误:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) return;
      await client.del(this.formatKey(key));
    } catch (error) {
      console.error('Redis DEL 错误:', error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) return;

      const keys = await client.keys(this.formatKey(pattern));
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      console.error('Redis DEL pattern 错误:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) return;

      const keys = await client.keys(this.keyPrefix + '*');
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      console.error('Redis CLEAR 错误:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;
      return (await client.exists(this.formatKey(key))) === 1;
    } catch (error) {
      console.error('Redis EXISTS 错误:', error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      if (!client) return -1;
      return await client.ttl(this.formatKey(key));
    } catch (error) {
      console.error('Redis TTL 错误:', error);
      return -1;
    }
  }
}

// ==================== 缓存服务主类 ====================

class CacheService {
  private memoryCache: MemoryCache;
  private redisCache: RedisCache;
  private useRedis: boolean = false;

  constructor() {
    this.memoryCache = new MemoryCache(1000, 3600);
    this.redisCache = new RedisCache('dgkj:');
  }

  /**
   * 初始化缓存服务
   */
  async initialize(config?: CacheConfig): Promise<void> {
    if (config?.type === 'redis') {
      this.useRedis = true;
      console.log('缓存服务已初始化为 Redis 模式');
    } else {
      console.log('缓存服务已初始化为内存模式');
    }
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.useRedis) {
      return await this.redisCache.get<T>(key);
    }
    return await this.memoryCache.get<T>(key);
  }

  /**
   * 设置缓存
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    if (this.useRedis) {
      await this.redisCache.set(key, value, options?.ttl);
    } else {
      await this.memoryCache.set(key, value, options?.ttl);
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    if (this.useRedis) {
      await this.redisCache.del(key);
    } else {
      await this.memoryCache.del(key);
    }
  }

  /**
   * 删除匹配模式的缓存
   */
  async delPattern(pattern: string): Promise<void> {
    if (this.useRedis) {
      await this.redisCache.delPattern(pattern);
    } else {
      await this.memoryCache.delPattern(pattern);
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    if (this.useRedis) {
      await this.redisCache.clear();
    } else {
      await this.memoryCache.clear();
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (this.useRedis) {
      return await this.redisCache.exists(key);
    }
    return await this.memoryCache.exists(key);
  }

  /**
   * 获取缓存剩余 TTL
   */
  async ttl(key: string): Promise<number> {
    if (this.useRedis) {
      return await this.redisCache.ttl(key);
    }
    return await this.memoryCache.ttl(key);
  }

  /**
   * 获取或设置缓存（如果不存在则设置）
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * 批量获取缓存
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = [];
    for (const key of keys) {
      results.push(await this.get<T>(key));
    }
    return results;
  }

  /**
   * 批量设置缓存
   */
  async mset(items: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<void> {
    for (const item of items) {
      await this.set(item.key, item.value, item.options);
    }
  }
}

// ==================== 特定场景缓存辅助 ====================

export class TokenCache {
  constructor(private cache: CacheService) {}

  async getToken(key: string): Promise<string | null> {
    return await this.cache.get<string>(`token:${key}`);
  }

  async setToken(key: string, token: string, ttl: number = 7200): Promise<void> {
    await this.cache.set(`token:${key}`, token, { ttl });
  }

  async delToken(key: string): Promise<void> {
    await this.cache.del(`token:${key}`);
  }
}

export class RateLimitCache {
  constructor(private cache: CacheService) {}

  async checkLimit(key: string, maxRequests: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const cacheKey = `ratelimit:${key}`;
    const data = await this.cache.get<{ count: number; resetTime: number }>(cacheKey);
    const now = Date.now();

    if (!data || now >= data.resetTime) {
      // 新窗口
      const resetTime = now + windowSeconds * 1000;
      await this.cache.set(cacheKey, { count: 1, resetTime }, { ttl: windowSeconds });
      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    if (data.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: data.resetTime };
    }

    await this.cache.set(cacheKey, { count: data.count + 1, resetTime: data.resetTime }, { 
      ttl: Math.ceil((data.resetTime - now) / 1000) 
    });
    return { allowed: true, remaining: maxRequests - data.count - 1, resetTime: data.resetTime };
  }
}

export class SessionCache {
  constructor(private cache: CacheService) {}

  async getSession<T>(sessionId: string): Promise<T | null> {
    return await this.cache.get<T>(`session:${sessionId}`);
  }

  async setSession(sessionId: string, data: any, ttl: number = 1800): Promise<void> {
    await this.cache.set(`session:${sessionId}`, data, { ttl });
  }

  async delSession(sessionId: string): Promise<void> {
    await this.cache.del(`session:${sessionId}`);
  }

  async refreshSession(sessionId: string, ttl: number = 1800): Promise<void> {
    const data = await this.getSession(sessionId);
    if (data) {
      await this.setSession(sessionId, data, ttl);
    }
  }
}

// ==================== 导出实例 ====================

export const cacheService = new CacheService();
export const tokenCache = new TokenCache(cacheService);
export const rateLimitCache = new RateLimitCache(cacheService);
export const sessionCache = new SessionCache(cacheService);

export default cacheService;
