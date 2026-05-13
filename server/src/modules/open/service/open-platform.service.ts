/**
 * 开放平台核心服务
 */
import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { OpDeveloper, OpApp, OpApiKey, OpApiQuota, AppStatus } from '../entity';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  generateAppKey,
  generateAppSecret,
  generateKeyId,
  generateMchNo,
  generateAppId,
  generateNonce,
  encryptSecret,
  decryptSecret,
  maskSecret,
  maskPhone,
  maskEmail,
} from '../../../utils/signature';
import { OpCode, opResult } from '../../../utils/op-code';

/** 开发者等级配额 */
const LEVEL_QUOTAS = {
  trial: { daily: 100, monthly: 1000, rateLimit: 5, appLimit: 1 },
  basic: { daily: 10000, monthly: 100000, rateLimit: 20, appLimit: 3 },
  professional: { daily: 100000, monthly: 1000000, rateLimit: 100, appLimit: 10 },
  enterprise: { daily: 1000000, monthly: 10000000, rateLimit: 500, appLimit: 50 },
} as const;

/**
 * 开发者服务
 */
export class DeveloperService {
  private repo: Repository<OpDeveloper>;

  constructor() {
    this.repo = AppDataSource.getRepository(OpDeveloper);
  }

  /** 注册开发者 */
  async register(params: {
    developerName: string;
    username: string;
    password: string;
    email: string;
    mobile: string;
    company?: string;
    businessLicense?: string;
    contactPerson?: string;
    contactPhone?: string;
    description?: string;
    website?: string;
  }) {
    // 检查重复
    const exist = await this.repo.findOne({
      where: [
        { username: params.username },
        { email: params.email },
      ],
    });
    if (exist) {
      return opResult(OpCode.SYS_ERROR, null, '用户名或邮箱已存在');
    }

    const developerId = 'DEV' + Date.now().toString(36).toUpperCase() + generateNonce(4).toUpperCase();
    const hashedPassword = await bcrypt.hash(params.password, 10);

    const developer = this.repo.create({
      ...params,
      developerId,
      password: hashedPassword,
      status: 'pending',
      level: 'trial',
    });

    await this.repo.save(developer);

    return opResult(OpCode.SUCCESS, {
      developerId,
      status: 'pending',
      message: '注册成功，请等待审核',
    });
  }

  /** 开发者登录 */
  async login(username: string, password: string, ip: string) {
    const developer = await this.repo.findOne({ where: { username } });
    if (!developer) {
      return opResult(OpCode.AUTH_KEY_NOT_FOUND, null, '用户名或密码错误');
    }

    const valid = await bcrypt.compare(password, developer.password);
    if (!valid) {
      return opResult(OpCode.AUTH_KEY_NOT_FOUND, null, '用户名或密码错误');
    }

    // 更新登录信息
    developer.lastLoginTime = new Date();
    developer.lastLoginIp = ip;
    await this.repo.save(developer);

    // 生成访问令牌 (简化版，实际应使用 JWT)
    const token = this.generateToken(developer);

    return opResult(OpCode.SUCCESS, {
      developerId: developer.developerId,
      developerName: developer.developerName,
      email: maskEmail(developer.email),
      mobile: maskPhone(developer.mobile),
      company: developer.company,
      level: developer.level,
      status: developer.status,
      token,
    });
  }

  /** 获取开发者信息 */
  async getInfo(developerId: string) {
    const developer = await this.repo.findOne({ where: { developerId } });
    if (!developer) return null;

    return {
      developerId: developer.developerId,
      developerName: developer.developerName,
      email: maskEmail(developer.email),
      mobile: maskPhone(developer.mobile),
      company: developer.company,
      level: developer.level,
      status: developer.status,
      appCount: developer.appCount,
      totalCallCount: developer.totalCallCount,
      lastLoginTime: developer.lastLoginTime,
      lastLoginIp: developer.lastLoginIp,
      createTime: developer.createTime,
    };
  }

  /** 获取开发者列表 (后台管理) */
  async list(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
    level?: string;
  }) {
    const { page = 1, pageSize = 10, keyword, status, level } = params;
    const queryBuilder = this.repo.createQueryBuilder('dev');

    if (keyword) {
      queryBuilder.andWhere(
        '(dev.developerName LIKE :keyword OR dev.username LIKE :keyword OR dev.company LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (status) queryBuilder.andWhere('dev.status = :status', { status });
    if (level) queryBuilder.andWhere('dev.level = :level', { level });

    const [list, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('dev.createTime', 'DESC')
      .getManyAndCount();

    return {
      list: list.map((d) => ({
        developerId: d.developerId,
        developerName: d.developerName,
        username: d.username,
        email: maskEmail(d.email),
        mobile: maskPhone(d.mobile),
        company: d.company,
        level: d.level,
        status: d.status,
        appCount: d.appCount,
        totalCallCount: d.totalCallCount,
        lastLoginTime: d.lastLoginTime,
        createTime: d.createTime,
      })),
      total,
    };
  }

  /** 审核开发者 */
  async review(developerId: string, status: 'active' | 'rejected', reviewBy: string, remark?: string) {
    await this.repo.update({ developerId }, {
      status,
      reviewTime: new Date(),
      reviewBy,
      reviewRemark: remark,
    });
    return opResult(OpCode.SUCCESS, null);
  }

  /** 更新开发者等级 */
  async updateLevel(developerId: string, level: 'trial' | 'basic' | 'professional' | 'enterprise') {
    await this.repo.update({ developerId }, { level });
    return opResult(OpCode.SUCCESS, null);
  }

  private generateToken(developer: OpDeveloper): string {
    const payload = {
      developerId: developer.developerId,
      username: developer.username,
      level: developer.level,
    };
    const secret = process.env.JWT_SECRET || 'dgkj-open-platform-secret';
    return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  }
}

/**
 * 应用服务
 */
export class AppService {
  private repo: Repository<OpApp>;
  private devRepo: Repository<OpDeveloper>;

  constructor() {
    this.repo = AppDataSource.getRepository(OpApp);
    this.devRepo = AppDataSource.getRepository(OpDeveloper);
  }

  /** 创建应用 */
  async create(params: {
    developerId: string;
    appName: string;
    appType: 'web' | 'mobile' | 'miniapp' | 'api';
    description?: string;
    appScenario?: string;
    domain?: string;
    notifyUrl?: string;
    refundNotifyUrl?: string;
    transferNotifyUrl?: string;
    enabledPayTypes?: string[];
  }) {
    const developer = await this.devRepo.findOne({ where: { developerId: params.developerId } });
    if (!developer) {
      return opResult(OpCode.DEV_NOT_APPROVED, null, '开发者不存在');
    }
    if (developer.status !== 'active') {
      return opResult(OpCode.DEV_NOT_APPROVED, null, '开发者账号未激活');
    }

    // 检查应用数量限制
    const levelConfig = LEVEL_QUOTAS[developer.level as keyof typeof LEVEL_QUOTAS] || LEVEL_QUOTAS.trial;
    const appCount = await this.repo.count({ where: { developerId: params.developerId } });
    if (appCount >= levelConfig.appLimit) {
      return opResult(OpCode.SYS_ERROR, null, `应用数量已达上限(${levelConfig.appLimit}个)，请升级套餐`);
    }

    const appId = generateAppId();
    const appKey = generateAppKey();
    const appSecret = generateAppSecret();

    // 分配商户号
    const mchNo = generateMchNo();

    // 加密存储 AppSecret
    const encryptKey = process.env.ENCRYPT_KEY || 'dgkj-open-platform-secret';
    const encryptedSecret = encryptSecret(appSecret, encryptKey);

    // 默认授权全部API
    const defaultApis = ['pay', 'query', 'refund', 'transfer', 'account'];
    // 默认授权全部支付方式
    const defaultPayTypes = ['wx_jsapi', 'wx_native', 'wx_h5', 'alipay', 'alipay_qr', 'unionpay', 'bank'];

    const app = this.repo.create({
      ...params,
      appId,
      appKey,
      appSecret: encryptedSecret,
      mchNo,
      status: AppStatus.PENDING,
      appType: params.appType as any,
      enabledApis: params.enabledPayTypes ? defaultApis : defaultApis,
      enabledPayTypes: params.enabledPayTypes || defaultPayTypes,
    });

    await this.repo.save(app);

    // 更新开发者应用计数
    await this.devRepo.increment({ developerId: params.developerId }, 'appCount', 1);

    return opResult(OpCode.SUCCESS, {
      appId,
      appKey,
      appSecret, // 仅在创建时返回一次，之后不再显示
      appName: params.appName,
      mchNo,
      status: 'pending',
      message: '应用创建成功，请等待审核。AppSecret仅显示一次，请妥善保管！',
    });
  }

  /** 获取应用详情 */
  async getApp(appId: string, developerId: string) {
    const app = await this.repo.findOne({ where: { appId, developerId } });
    if (!app) return null;

    const encryptKey = process.env.ENCRYPT_KEY || 'dgkj-open-platform-secret';
    let displaySecret = '******';
    try {
      if (app.appSecret.includes(':')) {
        displaySecret = maskSecret(decryptSecret(app.appSecret, encryptKey), 4);
      } else {
        displaySecret = maskSecret(app.appSecret, 4);
      }
    } catch (e) {
      // 忽略
    }

    return {
      appId: app.appId,
      appKey: app.appKey,
      appSecret: displaySecret,
      appName: app.appName,
      appType: app.appType,
      description: app.description,
      mchNo: app.mchNo,
      domain: app.domain,
      notifyUrl: app.notifyUrl,
      refundNotifyUrl: app.refundNotifyUrl,
      transferNotifyUrl: app.transferNotifyUrl,
      enabledPayTypes: app.enabledPayTypes,
      enabledApis: app.enabledApis,
      status: app.status,
      todayCallCount: app.todayCallCount,
      totalCallCount: app.totalCallCount,
      monthCallCount: app.monthCallCount,
      monthTradeAmount: app.monthTradeAmount,
      secretUpdateTime: app.secretUpdateTime,
      createTime: app.createTime,
    };
  }

  /** 获取应用列表 */
  async list(developerId: string, params: { page?: number; pageSize?: number; keyword?: string; status?: string }) {
    const { page = 1, pageSize = 10, keyword, status } = params;
    const queryBuilder = this.repo.createQueryBuilder('app').where('app.developerId = :developerId', { developerId });

    if (keyword) queryBuilder.andWhere('app.appName LIKE :keyword', { keyword: `%${keyword}%` });
    if (status) queryBuilder.andWhere('app.status = :status', { status });

    const [list, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('app.createTime', 'DESC')
      .getManyAndCount();

    return { list, total };
  }

  /** 更新应用 */
  async update(appId: string, developerId: string, data: Partial<OpApp>) {
    const app = await this.repo.findOne({ where: { appId, developerId } });
    if (!app) return opResult(OpCode.SYS_ERROR, null, '应用不存在');

    const allowedFields = ['appName', 'description', 'appScenario', 'domain', 'notifyUrl', 'refundNotifyUrl', 'transferNotifyUrl'];
    const updateData: any = {};
    for (const key of allowedFields) {
      if (data[key as keyof typeof data] !== undefined) {
        updateData[key] = data[key as keyof typeof data];
      }
    }

    await this.repo.update({ appId }, updateData);
    return opResult(OpCode.SUCCESS, null);
  }

  /** 重置 AppSecret */
  async resetSecret(appId: string, developerId: string) {
    const app = await this.repo.findOne({ where: { appId, developerId } });
    if (!app) return opResult(OpCode.SYS_ERROR, null, '应用不存在');

    const newSecret = generateAppSecret();
    const encryptKey = process.env.ENCRYPT_KEY || 'dgkj-open-platform-secret';
    const encryptedSecret = encryptSecret(newSecret, encryptKey);

    await this.repo.update({ appId }, {
      appSecret: encryptedSecret,
      secretUpdateTime: new Date(),
    });

    return opResult(OpCode.SUCCESS, {
      appSecret: newSecret,
      message: 'AppSecret已重置，请妥善保管！',
    });
  }

  /** 更新IP白名单 */
  async updateIpWhitelist(appId: string, developerId: string, ips: string[]) {
    await this.repo.update({ appId, developerId }, {
      ipWhitelist: JSON.stringify(ips),
      ipWhitelistCount: ips.length,
    });
    return opResult(OpCode.SUCCESS, null);
  }

  /** 审核应用 */
  async review(appId: string, status: 'active' | 'suspended', reviewBy?: string) {
    const appStatus = status === 'active' ? AppStatus.ACTIVE : AppStatus.SUSPENDED;
    await this.repo.update({ appId }, { status: appStatus });
    return opResult(OpCode.SUCCESS, null);
  }

  /** 获取应用配置信息 (供前端调试使用) */
  async getAppConfig(appId: string) {
    const app = await this.repo.findOne({ where: { appId } });
    if (!app) return null;

    return {
      appId: app.appKey,
      mchNo: app.mchNo,
      enabledApis: app.enabledApis,
      enabledPayTypes: app.enabledPayTypes,
    };
  }
}

/**
 * API Key 管理服务
 */
export class ApiKeyService {
  private repo: Repository<OpApiKey>;

  constructor() {
    this.repo = AppDataSource.getRepository(OpApiKey);
  }

  /** 创建 API Key */
  async createKey(params: {
    appId: string;
    developerId: string;
    alias?: string;
    signType?: 'hmac_sha256' | 'rsa_2048' | 'sm2';
    boundIp?: string;
    expireDays?: number;
  }) {
    const keyId = generateKeyId();
    const keyValue = 'AK' + generateNonce(16).toUpperCase();
    const keySecret = generateNonce(32);
    const encryptKey = process.env.ENCRYPT_KEY || 'dgkj-open-platform-secret';
    const encryptedSecret = encryptSecret(keySecret, encryptKey);

    const expireTime = params.expireDays
      ? new Date(Date.now() + params.expireDays * 24 * 60 * 60 * 1000)
      : null;

    const key = this.repo.create({
      keyId,
      appId: params.appId,
      developerId: params.developerId,
      keyValue,
      keySecret: encryptedSecret,
      signType: params.signType || 'hmac_sha256',
      alias: params.alias,
      boundIp: params.boundIp,
      expireTime,
    });

    await this.repo.save(key);

    return opResult(OpCode.SUCCESS, {
      keyId,
      keyValue,
      keySecret, // 仅创建时返回一次
      signType: params.signType || 'hmac_sha256',
      expireTime,
      message: 'API Key创建成功，请妥善保管KeySecret！',
    });
  }

  /** 获取 Key 列表 */
  async listKeys(appId: string) {
    const keys = await this.repo.find({ where: { appId }, order: { createTime: 'DESC' } });

    const encryptKey = process.env.ENCRYPT_KEY || 'dgkj-open-platform-secret';

    return keys.map((k) => {
      let displaySecret = '******';
      try {
        if (k.keySecret.includes(':')) {
          displaySecret = maskSecret(decryptSecret(k.keySecret, encryptKey), 4);
        }
      } catch (e) {
        // 忽略
      }

      return {
        keyId: k.keyId,
        keyValue: k.keyValue,
        keySecret: displaySecret,
        signType: k.signType,
        alias: k.alias,
        boundIp: k.boundIp,
        status: k.status,
        expireTime: k.expireTime,
        usedCount: k.usedCount,
        lastUsedTime: k.lastUsedTime,
        lastUsedIp: k.lastUsedIp,
        createTime: k.createTime,
      };
    });
  }

  /** 禁用 Key */
  async disableKey(keyId: string, developerId: string) {
    await this.repo.update({ keyId, developerId }, { status: 'disabled' });
    return opResult(OpCode.SUCCESS, null);
  }

  /** 启用 Key */
  async enableKey(keyId: string, developerId: string) {
    await this.repo.update({ keyId, developerId }, { status: 'active' });
    return opResult(OpCode.SUCCESS, null);
  }

  /** 删除 Key */
  async deleteKey(keyId: string, developerId: string) {
    await this.repo.delete({ keyId, developerId });
    return opResult(OpCode.SUCCESS, null);
  }
}

/**
 * 配额服务
 */
export class QuotaService {
  private repo: Repository<OpApiQuota>;
  private appRepo: Repository<OpApp>;

  constructor() {
    this.repo = AppDataSource.getRepository(OpApiQuota);
    this.appRepo = AppDataSource.getRepository(OpApp);
  }

  /** 获取配额信息 */
  async getQuota(appId: string) {
    const quotas = await this.repo.find({ where: { appId } });
    const app = await this.appRepo.findOne({ where: { appId } });
    const developer = await AppDataSource.getRepository(OpDeveloper).findOne({ where: { developerId: app?.developerId } });

    const levelConfig = LEVEL_QUOTAS[developer?.level as keyof typeof LEVEL_QUOTAS] || LEVEL_QUOTAS.trial;

    return {
      daily: {
        used: quotas.find((q) => q.quotaType === 'daily')?.quotaUsed || 0,
        limit: levelConfig.daily,
      },
      monthly: {
        used: quotas.find((q) => q.quotaType === 'monthly')?.quotaUsed || 0,
        limit: levelConfig.monthly,
      },
      rateLimit: levelConfig.rateLimit,
      appLimit: levelConfig.appLimit,
    };
  }
}

export const developerService = new DeveloperService();
export const appService = new AppService();
export const apiKeyService = new ApiKeyService();
export const quotaService = new QuotaService();
