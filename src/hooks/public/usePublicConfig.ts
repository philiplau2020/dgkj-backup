/**
 * 公开配置 Hook
 * 用于加载登录页面的动态配置
 */
import { ref, computed } from 'vue';
import { getPublicConfig, type PublicConfig } from '@/api/public';
import { useGlobSetting } from '@/hooks/setting';

// 默认配置
const DEFAULT_CONFIG: PublicConfig = {
  appTitle: 'DGKJ支付平台',
  loginLogo: '/assets/logo.png',
  sidebarLogo: '/assets/logo.png',
  loginBackground: '/assets/login-bg.svg',
  loginTitle: 'DGKJ支付平台',
  loginSubtitle: '安全、便捷、高效的支付解决方案',
  copyright: 'Copyright © 2024 DGKJ. All Rights Reserved.',
  companyName: 'DGKJ支付',
  recordNumber: '',
  loginTheme: 'gradient',
  showCopyright: true,
  allowRegister: false,
  enableCaptcha: false,
  loginTimeout: 30,
};

// 全局配置状态
const publicConfig = ref<PublicConfig>(DEFAULT_CONFIG);
const configLoaded = ref(false);
const configLoading = ref(false);
const configError = ref<string | null>(null);

/**
 * 加载公开配置
 */
export async function loadPublicConfig(): Promise<PublicConfig> {
  if (configLoaded.value) {
    return publicConfig.value;
  }

  if (configLoading.value) {
    // 等待加载完成
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (configLoaded.value) {
          clearInterval(checkInterval);
          resolve(publicConfig.value);
        }
      }, 100);
    });
  }

  configLoading.value = true;
  configError.value = null;

  try {
    const res = await getPublicConfig();
    // 处理 axios 响应格式
    const data = (res as any)?.data?.data || (res as any)?.data || res;
    
    if (data && typeof data === 'object') {
      publicConfig.value = { ...DEFAULT_CONFIG, ...data };
    }
    
    configLoaded.value = true;
    return publicConfig.value;
  } catch (error: any) {
    console.error('加载公开配置失败:', error);
    configError.value = error?.message || '加载配置失败';
    // 使用默认配置
    return DEFAULT_CONFIG;
  } finally {
    configLoading.value = false;
  }
}

/**
 * 获取登录Logo
 */
export function useLoginLogo() {
  return computed(() => {
    const logo = publicConfig.value.loginLogo;
    // 如果是相对路径，添加API前缀
    if (logo && !logo.startsWith('http') && !logo.startsWith('/')) {
      return `/api/assets/${logo}`;
    }
    return logo || '/assets/logo.png';
  });
}

/**
 * 获取侧边栏Logo
 */
export function useSidebarLogo() {
  return computed(() => {
    const logo = publicConfig.value.sidebarLogo;
    if (logo && !logo.startsWith('http') && !logo.startsWith('/')) {
      return `/api/assets/${logo}`;
    }
    return logo || '/assets/logo.png';
  });
}

/**
 * 获取登录背景图
 */
export function useLoginBackground() {
  return computed(() => {
    const bg = publicConfig.value.loginBackground;
    if (bg && !bg.startsWith('http') && !bg.startsWith('/')) {
      return `/api/assets/${bg}`;
    }
    return bg || '/assets/login-bg.svg';
  });
}

/**
 * 获取登录标题
 */
export function useLoginTitle() {
  return computed(() => {
    return publicConfig.value.loginTitle || publicConfig.value.appTitle || 'DGKJ支付平台';
  });
}

/**
 * 获取登录副标题
 */
export function useLoginSubtitle() {
  return computed(() => {
    return publicConfig.value.loginSubtitle || '';
  });
}

/**
 * 获取登录主题
 */
export function useLoginTheme() {
  return computed(() => {
    return publicConfig.value.loginTheme || 'gradient';
  });
}

/**
 * 获取版权信息
 */
export function useCopyright() {
  return computed(() => {
    return publicConfig.value.showCopyright ? publicConfig.value.copyright : '';
  });
}

/**
 * 获取公司名称
 */
export function useCompanyName() {
  return computed(() => {
    return publicConfig.value.companyName || '';
  });
}

/**
 * 获取系统标题
 */
export function useAppTitle() {
  const globSetting = useGlobSetting();
  return computed(() => {
    return publicConfig.value.appTitle || globSetting.title || 'DGKJ支付平台';
  });
}

/**
 * 判断是否允许注册
 */
export function useAllowRegister() {
  return computed(() => {
    return publicConfig.value.allowRegister || false;
  });
}

/**
 * 判断是否启用验证码
 */
export function useEnableCaptcha() {
  return computed(() => {
    return publicConfig.value.enableCaptcha || false;
  });
}

/**
 * 重置配置状态（用于退出登录后重新加载）
 */
export function resetPublicConfig() {
  configLoaded.value = false;
  configError.value = null;
}

export default {
  loadPublicConfig,
  useLoginLogo,
  useSidebarLogo,
  useLoginBackground,
  useLoginTitle,
  useLoginSubtitle,
  useLoginTheme,
  useCopyright,
  useCompanyName,
  useAppTitle,
  useAllowRegister,
  useEnableCaptcha,
  resetPublicConfig,
  publicConfig,
  configLoaded,
  configError,
};
