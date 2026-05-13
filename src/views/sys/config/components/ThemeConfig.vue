<template>
  <div class="theme-config">
    <Form :model="form" :label-col="{ span: 4 }" :wrapper-col="{ span: 16 }">
      <FormItem label="主题模式">
        <RadioGroup v-model:value="form.themeMode">
          <Radio value="light">亮色模式</Radio>
          <Radio value="dark">暗色模式</Radio>
          <Radio value="auto">跟随系统</Radio>
        </RadioGroup>
      </FormItem>

      <FormItem label="主题颜色">
        <div class="color-picker">
          <div class="color-presets">
            <div
              v-for="color in presetColors"
              :key="color.value"
              class="color-preset"
              :style="{ backgroundColor: color.value }"
              :class="{ active: form.primaryColor === color.value }"
              @click="form.primaryColor = color.value"
            >
              <CheckOutlined v-if="form.primaryColor === color.value" style="color: white" />
            </div>
          </div>
          <div class="custom-color">
            <Input v-model:value="form.primaryColor" placeholder="#1890ff" style="width: 120px" />
            <span class="color-value">{{ form.primaryColor }}</span>
          </div>
        </div>
      </FormItem>

      <FormItem label="固定头部">
        <Switch v-model:checked="form.fixedHeader" />
      </FormItem>

      <FormItem label="固定侧边栏">
        <Switch v-model:checked="form.fixedSidebar" />
      </FormItem>

      <FormItem label="混合菜单">
        <Switch v-model:checked="form.mixSidebar" />
      </FormItem>

      <FormItem label="分割菜单">
        <Switch v-model:checked="form.splitMenu" />
      </FormItem>

      <FormItem label="标签页缓存">
        <Switch v-model:checked="form.tabsCache" />
      </FormItem>

      <FormItem label="标签页">
        <Switch v-model:checked="form.showTabs" />
      </FormItem>

      <FormItem label="标签页图标">
        <Switch v-model:checked="form.tabsIcon" />
      </FormItem>

      <FormItem label="面包屑">
        <Switch v-model:checked="form.showBreadcrumb" />
      </FormItem>

      <FormItem label="面包屑图标">
        <Switch v-model:checked="form.breadcrumbIcon" />
      </FormItem>

      <FormItem label="进度条">
        <Switch v-model:checked="form.progress" />
      </FormItem>

      <FormItem label="锁屏">
        <Switch v-model:checked="form.lockScreen" />
      </FormItem>

      <FormItem label="灰色模式">
        <Switch v-model:checked="form.greyMode" />
      </FormItem>

      <FormItem label="色弱模式">
        <Switch v-model:checked="form.weakMode" />
      </FormItem>

      <FormItem label="动画效果">
        <Select v-model:value="form.animation" style="width: 200px">
          <SelectOption value="zoom-fade">渐变缩放</SelectOption>
          <SelectOption value="slide-fade">滑动渐变</SelectOption>
          <SelectOption value="fade">淡入淡出</SelectOption>
          <SelectOption value="none">关闭动画</SelectOption>
        </Select>
      </FormItem>

      <FormItem label="菜单宽度">
        <InputNumber v-model:value="form.menuWidth" :min="180" :max="400" style="width: 200px" />
        <span style="margin-left: 8px">px</span>
      </FormItem>

      <FormItem label="主菜单布局">
        <RadioGroup v-model:value="form.menuLayout">
          <Radio value="side">左侧菜单</Radio>
          <Radio value="top">顶部菜单</Radio>
          <Radio value="mix">混合菜单</Radio>
        </RadioGroup>
      </FormItem>

      <FormItem :wrapper-col="{ span: 16, offset: 4 }">
        <Space>
          <Button type="primary" @click="handleSave" :loading="loading">保存配置</Button>
          <Button @click="handleReset">重置</Button>
          <Button @click="handleRestore">恢复默认</Button>
        </Space>
      </FormItem>
    </Form>

    <Card title="主题预览" style="margin-top: 24px">
      <div class="theme-preview">
        <div class="preview-header" :style="{ backgroundColor: form.primaryColor }">
          <div class="preview-logo">
            <img :src="form.sidebarLogo || '/assets/logo.png'" class="logo-img" />
          </div>
          <div class="preview-menu">
            <div class="menu-item" :class="{ active: true }">首页</div>
            <div class="menu-item">系统管理</div>
            <div class="menu-item">商户管理</div>
          </div>
        </div>
        <div class="preview-content">
          <div class="preview-sidebar" :style="{ backgroundColor: form.primaryColor + '20' }">
            <div class="sidebar-item active">仪表盘</div>
            <div class="sidebar-item">用户管理</div>
            <div class="sidebar-item">角色管理</div>
          </div>
          <div class="preview-main">
            <div class="preview-breadcrumb">首页 / 系统管理 / 配置</div>
            <div class="preview-tabs">
              <div class="tab active">配置</div>
              <div class="tab">用户</div>
            </div>
            <div class="preview-page">
              <div class="page-card" :style="{ borderColor: form.primaryColor }">
                主题预览
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Form, FormItem, Input, InputNumber, Switch, Radio, RadioGroup, Select, SelectOption, Space, Button, Card, message } from 'ant-design-vue';
import { CheckOutlined } from '@ant-design/icons-vue';
import { useAppStoreWithOut } from '@/store/modules/app';

const loading = ref(false);
const appStore = useAppStoreWithOut();

const presetColors = [
  { name: '拂晓蓝', value: '#1890ff' },
  { name: '火山红', value: '#f5222d' },
  { name: '日暮棕', value: '#fa541c' },
  { name: '薄暮橙', value: '#fa8c16' },
  { name: '明黄', value: '#fadb14' },
  { name: '极光绿', value: '#52c41a' },
  { name: '明青', value: '#13c2c2' },
  { name: '极客蓝', value: '#1890ff' },
  { name: '酱紫', value: '#722ed1' },
  { name: '洋红', value: '#eb2f96' },
];

const form = reactive({
  themeMode: 'light',
  primaryColor: '#1890ff',
  fixedHeader: true,
  fixedSidebar: true,
  mixSidebar: false,
  splitMenu: false,
  tabsCache: true,
  showTabs: true,
  tabsIcon: true,
  showBreadcrumb: true,
  breadcrumbIcon: true,
  progress: true,
  lockScreen: false,
  greyMode: false,
  weakMode: false,
  animation: 'zoom-fade',
  menuWidth: 210,
  menuLayout: 'side',
  sidebarLogo: '/assets/logo.png',
});

const defaultForm = { ...form };

async function loadConfig() {
  const config = appStore.getProjectConfig;
  if (config.headerSetting) {
    form.fixedHeader = config.headerSetting.fixed;
  }
}

async function handleSave() {
  loading.value = true;
  try {
    // 保存到本地存储
    appStore.setProjectConfig({
      headerSetting: { fixed: form.fixedHeader },
      menuSetting: { splitMenu: form.splitMenu },
    });
    message.success('保存成功，刷新后生效');
  } catch (e) {
    message.error('保存失败');
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  loadConfig();
}

function handleRestore() {
  Object.assign(form, defaultForm);
}

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.theme-config {
  max-width: 900px;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 24px;
}

.color-presets {
  display: flex;
  gap: 8px;
}

.color-preset {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.color-preset:hover {
  transform: scale(1.1);
}

.color-preset.active {
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px currentColor;
}

.custom-color {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-value {
  font-family: monospace;
  color: #999;
}

.theme-preview {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: white;
}

.preview-logo {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 4px;
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
}

.preview-menu {
  display: flex;
  gap: 16px;
  margin-left: 24px;
}

.menu-item {
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
}

.menu-item.active {
  color: white;
  font-weight: bold;
}

.preview-content {
  display: flex;
  height: 300px;
}

.preview-sidebar {
  width: 180px;
  padding: 12px;
}

.sidebar-item {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 4px;
}

.sidebar-item.active {
  background: v-bind('form.primaryColor + "30"');
  color: v-bind('form.primaryColor');
}

.preview-main {
  flex: 1;
  padding: 12px;
}

.preview-breadcrumb {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.preview-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tab {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.tab.active {
  background: v-bind('form.primaryColor');
  color: white;
  border-color: v-bind('form.primaryColor');
}

.preview-page {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
}

.page-card {
  background: white;
  border-radius: 4px;
  padding: 16px;
  border-left: 3px solid v-bind('form.primaryColor');
}
</style>
