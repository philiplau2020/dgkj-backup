/**
 * DGKJ 支付平台 - 公开配置 API
 * 
 * 这些接口不需要登录即可访问，用于登录页面的动态配置
 */

import { Router } from 'express';
import { AppDataSource } from '../../config/data-source';
import { SysConfig } from '../../database/entities/sys.entity';

const router = Router();

// 默认配置（当数据库没有配置时使用）
const DEFAULT_LOGIN_CONFIG = {
  // 系统名称
  appTitle: process.env.VITE_GLOB_APP_TITLE || 'DGKJ支付平台',
  // 版本号
  version: process.env.APP_VERSION || '1.0.0',
  // 登录页Logo
  loginLogo: '/api/assets/logo.png',
  // 侧边栏Logo
  sidebarLogo: '/api/assets/logo.png',
  // 登录页背景图
  loginBackground: '/api/assets/login-bg.svg',
  // 登录页标题
  loginTitle: 'DGKJ支付平台',
  // 登录页副标题
  loginSubtitle: '安全、便捷、高效的支付解决方案',
  // 版权信息
  copyright: 'Copyright © 2024 DGKJ. All Rights Reserved.',
  // 公司名称
  companyName: 'DGKJ支付',
  // 备案号
  recordNumber: '',
  // 登录页主题: light | dark | gradient
  loginTheme: 'gradient',
  // 是否显示版权信息
  showCopyright: true,
  // 是否允许注册
  allowRegister: false,
  // 是否启用验证码
  enableCaptcha: false,
  // 登录超时时间（分钟）
  loginTimeout: 30,
};

/**
 * 获取公开配置（无需登录）
 * GET /api/public/config
 */
router.get('/config', async (req, res) => {
  try {
    // 从数据库获取配置
    const configRepo = AppDataSource.getRepository(SysConfig);
    
    // 尝试获取登录相关的配置
    const configs = await configRepo
      .createQueryBuilder('config')
      .where('config.groupName IN (:...groups)', { 
        groups: ['login', 'system', 'logo', 'theme'] 
      })
      .getMany();

    // 构建配置对象
    const configData: Record<string, string> = {};
    configs.forEach(c => {
      configData[c.configKey] = c.configValue;
    });

    // 合并默认配置和数据库配置
    const result = {
      ...DEFAULT_LOGIN_CONFIG,
      ...configData,
      // 确保关键配置有值
      appTitle: configData['sys.appTitle'] || DEFAULT_LOGIN_CONFIG.appTitle,
      loginLogo: configData['login.logo'] || DEFAULT_LOGIN_CONFIG.loginLogo,
      sidebarLogo: configData['logo.sidebar'] || DEFAULT_LOGIN_CONFIG.sidebarLogo,
      loginBackground: configData['login.background'] || DEFAULT_LOGIN_CONFIG.loginBackground,
      loginTitle: configData['login.title'] || DEFAULT_LOGIN_CONFIG.loginTitle,
      loginSubtitle: configData['login.subtitle'] || DEFAULT_LOGIN_CONFIG.loginSubtitle,
      copyright: configData['system.copyright'] || DEFAULT_LOGIN_CONFIG.copyright,
      companyName: configData['system.companyName'] || DEFAULT_LOGIN_CONFIG.companyName,
      recordNumber: configData['system.recordNumber'] || DEFAULT_LOGIN_CONFIG.recordNumber,
      loginTheme: configData['login.theme'] || DEFAULT_LOGIN_CONFIG.loginTheme,
      showCopyright: configData['system.showCopyright'] !== 'false',
      allowRegister: configData['login.allowRegister'] === 'true',
      enableCaptcha: configData['login.enableCaptcha'] === 'true',
      loginTimeout: parseInt(configData['login.timeout']) || DEFAULT_LOGIN_CONFIG.loginTimeout,
      // 版本号
      version: configData['system.version'] || process.env.APP_VERSION || '1.0.0',
    };

    res.json({ code: 0, message: 'ok', data: result });
  } catch (error) {
    console.error('获取公开配置失败:', error);
    // 即使出错也返回默认配置
    res.json({ code: 0, message: 'ok', data: DEFAULT_LOGIN_CONFIG });
  }
});

/**
 * 获取登录页配置（别名）
 * GET /api/public/login-config
 */
router.get('/login-config', async (req, res) => {
  // Redirect to /config handler
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    const configs = await configRepo
      .createQueryBuilder('config')
      .where('config.groupName IN (:...groups)', { groups: ['login', 'system', 'logo', 'theme'] })
      .getMany();

    const configData: Record<string, string> = {};
    configs.forEach(c => {
      configData[c.configKey] = c.configValue;
    });

    res.json({
      code: 0,
      message: 'ok',
      data: {
        ...DEFAULT_LOGIN_CONFIG,
        ...configData,
        appTitle: configData['sys.appTitle'] || DEFAULT_LOGIN_CONFIG.appTitle,
        loginLogo: configData['login.logo'] || DEFAULT_LOGIN_CONFIG.loginLogo,
        loginTitle: configData['login.title'] || DEFAULT_LOGIN_CONFIG.loginTitle,
        loginTheme: configData['login.theme'] || DEFAULT_LOGIN_CONFIG.loginTheme,
      }
    });
  } catch (error) {
    res.json({ code: 0, message: 'ok', data: DEFAULT_LOGIN_CONFIG });
  }
});

/**
 * 获取系统信息（无需登录）
 * GET /api/public/system-info
 */
router.get('/system-info', async (req, res) => {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    
    const configs = await configRepo
      .createQueryBuilder('config')
      .where('config.groupName = :group', { group: 'system' })
      .getMany();

    const info: Record<string, string> = {
      appTitle: process.env.VITE_GLOB_APP_TITLE || 'DGKJ支付平台',
      version: process.env.APP_VERSION || '1.0.0',
      copyright: 'Copyright © 2024 DGKJ. All Rights Reserved.',
      companyName: 'DGKJ支付',
    };

    configs.forEach(c => {
      if (c.configValue) {
        info[c.configKey.replace('system.', '')] = c.configValue;
      }
    });

    res.json({ code: 0, message: 'ok', data: info });
  } catch (error) {
    res.json({
      code: 0,
      message: 'ok',
      data: {
        appTitle: process.env.VITE_GLOB_APP_TITLE || 'DGKJ支付平台',
        version: process.env.APP_VERSION || '1.0.0',
      }
    });
  }
});

/**
 * 获取Logo配置
 * GET /api/public/logo
 */
router.get('/logo', async (req, res) => {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    
    const configs = await configRepo
      .createQueryBuilder('config')
      .where('config.groupName IN (:...groups)', { groups: ['logo', 'login'] })
      .getMany();

    const logos: Record<string, string> = {
      login: process.env.LOGIN_LOGO_URL || '/api/assets/logo.png',
      sidebar: process.env.SIDEBAR_LOGO_URL || '/api/assets/logo.png',
      favicon: process.env.FAVICON_URL || '/api/assets/favicon.ico',
    };

    configs.forEach(c => {
      if (c.configValue) {
        logos[c.configKey.replace('logo.', '').replace('login.', '')] = c.configValue;
      }
    });

    res.json({ code: 0, message: 'ok', data: logos });
  } catch (error) {
    res.json({
      code: 0,
      message: 'ok',
      data: {
        login: '/api/assets/logo.png',
        sidebar: '/api/assets/logo.png',
        favicon: '/api/assets/favicon.ico',
      }
    });
  }
});

/**
 * 获取主题配置
 * GET /api/public/theme
 */
router.get('/theme', async (req, res) => {
  try {
    const configRepo = AppDataSource.getRepository(SysConfig);
    
    const configs = await configRepo
      .createQueryBuilder('config')
      .where('config.groupName = :group', { group: 'theme' })
      .getMany();

    const theme: Record<string, string> = {
      primaryColor: '#1890ff',
      logo: '/api/assets/logo.png',
      favicon: '/api/assets/favicon.ico',
    };

    configs.forEach(c => {
      if (c.configValue) {
        theme[c.configKey.replace('theme.', '')] = c.configValue;
      }
    });

    res.json({ code: 0, message: 'ok', data: theme });
  } catch (error) {
    res.json({
      code: 0,
      message: 'ok',
      data: {
        primaryColor: '#1890ff',
        logo: '/api/assets/logo.png',
      }
    });
  }
});

export default router;
