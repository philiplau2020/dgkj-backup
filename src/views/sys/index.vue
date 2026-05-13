<template>
  <div class="sys-admin-container">
    <Layout class="sys-admin-layout">
      <Sider :width="220" class="sys-admin-sider">
        <div class="sider-header">
          <AppLogo :alwaysShowTitle="true" />
        </div>
        <Menu v-model:selectedKeys="selectedKeys" mode="inline" theme="dark" :items="menuItems" @click="handleMenuClick" />
      </Sider>
      <Content class="sys-admin-content">
        <router-view />
      </Content>
    </Layout>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Layout, Menu } from 'ant-design-vue';
import { AppLogo } from '@/components/Application';
import {
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  ClusterOutlined,
  SettingOutlined,
  FileTextOutlined,
  GlobalOutlined,
} from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
const selectedKeys = ref<string[]>([route.name as string || 'user']);

const menuItems = [
  {
    key: 'user',
    icon: () => h(UserOutlined),
    label: '操作员管理',
    path: '/sys/user',
  },
  {
    key: 'role',
    icon: () => h(SafetyOutlined),
    label: '角色管理',
    path: '/sys/role',
  },
  {
    key: 'dept',
    icon: () => h(ClusterOutlined),
    label: '团队管理',
    path: '/sys/dept',
  },
  {
    key: 'permission',
    icon: () => h(SettingOutlined),
    label: '权限配置',
    path: '/sys/permission',
  },
  {
    key: 'menu',
    icon: () => h(FileTextOutlined),
    label: '菜单管理',
    path: '/sys/menu',
  },
  {
    key: 'dict',
    icon: () => h(GlobalOutlined),
    label: '字典管理',
    path: '/sys/dict',
  },
  {
    key: 'config',
    icon: () => h(SettingOutlined),
    label: '系统配置',
    path: '/sys/config',
  },
];

function handleMenuClick({ key }: { key: string }) {
  const menuItem = menuItems.find(item => item.key === key);
  if (menuItem?.path) {
    router.push(menuItem.path);
  }
}
</script>

<style scoped>
.sys-admin-container {
  height: 100vh;
  width: 100%;
}

.sys-admin-layout {
  height: 100%;
}

.sys-admin-sider {
  background: linear-gradient(180deg, #001529 0%, #000c17 100%);
  overflow: auto;
}

.sider-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sys-admin-content {
  background: #f0f2f5;
  overflow: auto;
}
</style>
