import type {
  ProjectConfig,
  HeaderSetting,
  MenuSetting,
  TransitionSetting,
  MultiTabsSetting,
} from '#/config';
import type { BeforeMiniState, ApiAddress } from '#/store';

import { defineStore } from 'pinia';
import { store } from '@/store';

import { ThemeEnum } from '@/enums/appEnum';
import { APP_DARK_MODE_KEY, PROJ_CFG_KEY, API_ADDRESS } from '@/enums/cacheEnum';
import { Persistent } from '@/utils/cache/persistent';
import { darkMode } from '@/settings/designSetting';
import { resetRouter } from '@/router';
import { deepMerge } from '@/utils';
import projectSetting from '@/settings/projectSetting';

interface AppState {
  darkMode?: ThemeEnum;
  // Page loading status
  pageLoading: boolean;
  // project config
  projectConfig: ProjectConfig | null;
  // When the window shrinks, remember some states, and restore these states when the window is restored
  beforeMiniInfo: BeforeMiniState;
}
let timeId: TimeoutHandle;
export const useAppStore = defineStore({
  id: 'app',
  state: (): AppState => {
    const stored = Persistent.getLocal(PROJ_CFG_KEY);
    console.log('[DEBUG] Initial state - loaded from localStorage:', JSON.stringify(stored, null, 2));
    return {
      darkMode: undefined,
      pageLoading: false,
      projectConfig: stored,
      beforeMiniInfo: {},
    };
  },
  getters: {
    getPageLoading(state): boolean {
      return state.pageLoading;
    },
    getDarkMode(state): 'light' | 'dark' | string {
      return state.darkMode || localStorage.getItem(APP_DARK_MODE_KEY) || darkMode;
    },

    getBeforeMiniInfo(state): BeforeMiniState {
      return state.beforeMiniInfo;
    },

    getProjectConfig(state): ProjectConfig {
      // 如果缓存的配置不完整，使用默认值合并
      if (!state.projectConfig || Object.keys(state.projectConfig).length === 0) {
        return projectSetting;
      }
      return deepMerge(projectSetting, state.projectConfig);
    },

    getHeaderSetting(): HeaderSetting {
      return this.getProjectConfig.headerSetting;
    },
    getMenuSetting(): MenuSetting {
      return this.getProjectConfig.menuSetting;
    },
    getTransitionSetting(): TransitionSetting {
      return this.getProjectConfig.transitionSetting;
    },
    getMultiTabsSetting(): MultiTabsSetting {
      return this.getProjectConfig.multiTabsSetting;
    },
    getApiAddress() {
      return JSON.parse(localStorage.getItem(API_ADDRESS) || '{}');
    },
  },
  actions: {
    setPageLoading(loading: boolean): void {
      this.pageLoading = loading;
    },

    setDarkMode(mode: ThemeEnum): void {
      this.darkMode = mode;
      localStorage.setItem(APP_DARK_MODE_KEY, mode);
    },

    setBeforeMiniInfo(state: BeforeMiniState): void {
      this.beforeMiniInfo = state;
    },

    setProjectConfig(config: DeepPartial<ProjectConfig>): void {
      console.log('[DEBUG] setProjectConfig called with:', JSON.stringify(config, null, 2));
      this.projectConfig = deepMerge(this.projectConfig || {}, config) as ProjectConfig;
      console.log('[DEBUG] projectConfig after merge:', JSON.stringify(this.projectConfig, null, 2));
      // 立即写入 localStorage，确保刷新后设置保持
      Persistent.setLocal(PROJ_CFG_KEY, this.projectConfig, true);
      console.log('[DEBUG] Written to localStorage');
      // 验证写入
      const stored = Persistent.getLocal(PROJ_CFG_KEY);
      console.log('[DEBUG] Verified from localStorage:', JSON.stringify(stored, null, 2));
    },
    setMenuSetting(setting: Partial<MenuSetting>): void {
      this.projectConfig!.menuSetting = deepMerge(this.projectConfig!.menuSetting, setting);
      Persistent.setLocal(PROJ_CFG_KEY, this.projectConfig, true);
    },

    async resetAllState() {
      resetRouter();
      Persistent.clearAll();
    },
    async setPageLoadingAction(loading: boolean): Promise<void> {
      if (loading) {
        clearTimeout(timeId);
        // Prevent flicker
        timeId = setTimeout(() => {
          this.setPageLoading(loading);
        }, 50);
      } else {
        this.setPageLoading(loading);
        clearTimeout(timeId);
      }
    },
    setApiAddress(config: ApiAddress): void {
      localStorage.setItem(API_ADDRESS, JSON.stringify(config));
    },
  },
});

// Need to be used outside the setup
export function useAppStoreWithOut() {
  return useAppStore(store);
}
