/**
 * 公开配置 API - 无需登录即可访问
 * 用于登录页面的动态配置
 */
import { defHttp } from '@/utils/http/axios';

export interface PublicConfig {
  // 系统名称
  appTitle: string;
  // 登录页Logo
  loginLogo: string;
  // 侧边栏Logo
  sidebarLogo: string;
  // 登录页背景图
  loginBackground: string;
  // 登录页标题
  loginTitle: string;
  // 登录页副标题
  loginSubtitle: string;
  // 版权信息
  copyright: string;
  // 公司名称
  companyName: string;
  // 备案号
  recordNumber: string;
  // 登录页主题: light | dark | gradient
  loginTheme: 'light' | 'dark' | 'gradient';
  // 是否显示版权信息
  showCopyright: boolean;
  // 是否允许注册
  allowRegister: boolean;
  // 是否启用验证码
  enableCaptcha: boolean;
  // 登录超时时间（分钟）
  loginTimeout: number;
}

export interface LogoConfig {
  login: string;
  sidebar: string;
  favicon: string;
}

export interface ThemeConfig {
  primaryColor: string;
  logo: string;
  favicon: string;
}

export interface SystemInfo {
  appTitle: string;
  version: string;
  copyright: string;
  companyName: string;
}

/**
 * 获取公开配置
 */
export function getPublicConfig() {
  return defHttp.get<PublicConfig>({ url: '/api/public/config' }, { isReturnNativeResponse: true });
}

/**
 * 获取登录页配置
 */
export function getLoginConfig() {
  return defHttp.get<PublicConfig>({ url: '/api/public/login-config' }, { isReturnNativeResponse: true });
}

/**
 * 获取系统信息
 */
export function getSystemInfo() {
  return defHttp.get<SystemInfo>({ url: '/api/public/system-info' });
}

/**
 * 获取Logo配置
 */
export function getLogoConfig() {
  return defHttp.get<LogoConfig>({ url: '/api/public/logo' });
}

/**
 * 获取主题配置
 */
export function getThemeConfig() {
  return defHttp.get<ThemeConfig>({ url: '/api/public/theme' });
}
