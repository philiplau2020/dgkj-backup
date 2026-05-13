<template>
  <div class="sys-config">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="login" tab="登录配置">
          <LoginConfig />
        </TabPane>
        <TabPane key="logo" tab="Logo配置">
          <LogoConfig />
        </TabPane>
        <TabPane key="theme" tab="主题配置">
          <ThemeConfig />
        </TabPane>
        <TabPane key="system" tab="系统信息">
          <SystemConfig />
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Card, Tabs, TabPane } from 'ant-design-vue';
import LoginConfig from './components/LoginConfig.vue';
import LogoConfig from './components/LogoConfig.vue';
import ThemeConfig from './components/ThemeConfig.vue';
import SystemConfig from './components/SystemConfig.vue';

const activeTab = ref('login');
</script>

<style scoped>
.sys-config {
  padding: 16px;
  background: #f0f2f5;
}
</style>
