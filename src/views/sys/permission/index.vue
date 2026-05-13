<template>
  <div class="sys-permission">
    <Card class="main-card">
      <Tabs v-model:activeKey="activeTab">
        <!-- 菜单权限树 -->
        <TabPane key="menu" tab="菜单权限">
          <div class="permission-container">
            <div class="menu-tree-panel">
              <div class="panel-header">
                <span class="panel-title">菜单权限树</span>
                <Space>
                  <Button type="primary" size="small" @click="openAddMenuModal(null)">新增</Button>
                  <Button size="small" @click="refreshMenus">刷新</Button>
                </Space>
              </div>
              <Tree
                v-if="menuList.length > 0"
                v-model:selectedKeys="selectedMenuKeys"
                v-model:expandedKeys="expandedMenuKeys"
                :tree-data="menuTreeData"
                @select="handleMenuSelect"
                @expand="handleMenuExpand"
                show-icon
                block-node
              >
                <template #icon="{ dataRef }">
                  <component :is="getMenuIcon(dataRef.icon)" v-if="dataRef.icon" />
                  <FolderOutlined v-else-if="dataRef.menuType === 'M'" />
                  <FileTextOutlined v-else-if="dataRef.menuType === 'C'" />
                  <SettingOutlined v-else />
                </template>
                <template #title="{ dataRef }">
                  <div class="menu-tree-node">
                    <span class="menu-name">{{ dataRef.menuName }}</span>
                    <Space size="small">
                      <Tag size="small" :color="getMenuTypeColor(dataRef.menuType)">{{ getMenuTypeName(dataRef.menuType) }}</Tag>
                      <Dropdown :trigger="['click']" @click.stop>
                        <Button type="text" size="small" class="node-action"><MoreOutlined /></Button>
                        <template #overlay>
                          <Menu @click="({ key }) => handleMenuAction(key, dataRef)">
                            <MenuItem key="add">新增子菜单</MenuItem>
                            <MenuItem key="edit">编辑</MenuItem>
                            <MenuItem key="copy">复制</MenuItem>
                            <MenuDivider />
                            <MenuItem key="delete" danger>删除</MenuItem>
                          </Menu>
                        </template>
                      </Dropdown>
                    </Space>
                  </div>
                </template>
              </Tree>
              <Empty v-else description="暂无菜单数据" />
            </div>

            <div class="menu-detail-panel">
              <template v-if="currentMenu">
                <div class="detail-header">
                  <div class="detail-title">
                    <h3>{{ currentMenu.menuName }}</h3>
                    <p class="detail-meta">
                      <Tag :color="getMenuTypeColor(currentMenu.menuType)">{{ getMenuTypeName(currentMenu.menuType) }}</Tag>
                      <span class="meta-item">{{ currentMenu.perms || '无权限标识' }}</span>
                    </p>
                  </div>
                  <Space>
                    <Button type="primary" @click="openEditMenuModal(currentMenu)">编辑</Button>
                    <Button @click="openAddMenuModal(currentMenu)">新增子菜单</Button>
                  </Space>
                </div>
                <Descriptions :column="2" bordered size="small">
                  <DescriptionsItem label="菜单名称">{{ currentMenu.menuName }}</DescriptionsItem>
                  <DescriptionsItem label="权限标识">{{ currentMenu.perms || '-' }}</DescriptionsItem>
                  <DescriptionsItem label="路由路径">{{ currentMenu.path || '-' }}</DescriptionsItem>
                  <DescriptionsItem label="组件路径">{{ currentMenu.component || '-' }}</DescriptionsItem>
                  <DescriptionsItem label="图标">{{ currentMenu.icon || '-' }}</DescriptionsItem>
                  <DescriptionsItem label="排序">{{ currentMenu.sort }}</DescriptionsItem>
                  <DescriptionsItem label="状态">
                    <Badge :status="currentMenu.status === 1 ? 'success' : 'default'" />
                    {{ currentMenu.status === 1 ? '启用' : '停用' }}
                  </DescriptionsItem>
                  <DescriptionsItem label="是否缓存">
                    <Tag :color="currentMenu.keepAlive ? 'green' : 'default'">{{ currentMenu.keepAlive ? '是' : '否' }}</Tag>
                  </DescriptionsItem>
                  <DescriptionsItem label="可见">隐藏</DescriptionsItem>
                  <DescriptionsItem label="创建时间">{{ currentMenu.createTime || '-' }}</DescriptionsItem>
                </Descriptions>

                <!-- 按钮权限配置 -->
                <div v-if="currentMenu.menuType === 'C'" class="button-perms-section">
                  <div class="section-header">
                    <span class="section-title">按钮权限配置</span>
                    <Button type="primary" size="small" @click="openAddPermModal">新增按钮</Button>
                  </div>
                  <Table :data-source="currentMenuPerms" :columns="permColumns" size="small" row-key="id">
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'action'">
                        <Space>
                          <Button type="link" size="small" @click="openEditPermModal(record)">编辑</Button>
                          <Button type="link" size="small" danger @click="deletePerm(record)">删除</Button>
                        </Space>
                      </template>
                    </template>
                  </Table>
                </div>
              </template>
              <Empty v-else description="请选择左侧菜单查看详情" />
            </div>
          </div>
        </TabPane>

        <!-- 角色权限矩阵 -->
        <TabPane key="matrix" tab="权限矩阵">
          <div class="matrix-container">
            <div class="matrix-toolbar">
              <Select v-model:value="matrixRoleId" placeholder="选择角色" style="width: 200px" @change="loadRolePermissions">
                <SelectOption v-for="role in roleList" :key="role.id" :value="role.id">{{ role.roleName }}</SelectOption>
              </Select>
              <Button @click="saveRolePermissions">保存权限配置</Button>
            </div>
            <Table
              :data-source="permissionMatrix"
              :columns="matrixColumns"
              :pagination="false"
              size="small"
              bordered
              :scroll="{ x: 1500, y: 500 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'menuName'">
                  <Space>
                    <Tag :color="getMenuTypeColor(record.menuType)">{{ getMenuTypeName(record.menuType) }}</Tag>
                    {{ record.menuName }}
                  </Space>
                </template>
                <template v-else-if="column.key === 'check'">
                  <Checkbox :checked="record.checked" @change="() => togglePermission(record)" />
                </template>
                <template v-else-if="column.key === 'perms'">
                  <Space wrap>
                    <Tag v-for="perm in record.perms" :key="perm" size="small">{{ perm }}</Tag>
                  </Space>
                </template>
              </template>
            </Table>
          </div>
        </TabPane>

        <!-- 权限分配记录 -->
        <TabPane key="logs" tab="分配记录">
          <Table :data-source="assignLogs" :columns="logColumns" size="small" :pagination="{ pageSize: 10 }" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'actionType'">
                <Tag :color="getActionColor(record.actionType)">{{ record.actionType }}</Tag>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 菜单编辑弹窗 -->
    <Modal v-model:open="menuFormVisible" :title="menuFormMode === 'add' ? '新增菜单' : '编辑菜单'" width="600px" @ok="handleMenuSubmit">
      <Form :model="menuFormData" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }" :rules="menuFormRules" ref="menuFormRef">
        <FormItem label="菜单类型">
          <RadioGroup v-model:value="menuFormData.menuType">
            <Radio value="M">目录</Radio>
            <Radio value="C">菜单</Radio>
            <Radio value="A">按钮</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="上级菜单">
          <TreeSelect v-model:value="menuFormData.parentId" :tree-data="menuTreeData" placeholder="顶级菜单" allow-clear tree-default-expand-all style="width: 100%">
            <template #title="node">{{ node.menuName || node.title }}</template>
          </TreeSelect>
        </FormItem>
        <FormItem label="菜单名称" name="menuName">
          <Input v-model:value="menuFormData.menuName" placeholder="请输入菜单名称" />
        </FormItem>
        <FormItem label="路由路径" name="path">
          <Input v-model:value="menuFormData.path" placeholder="请输入路由路径" />
        </FormItem>
        <FormItem v-if="menuFormData.menuType === 'C'" label="组件路径">
          <Input v-model:value="menuFormData.component" placeholder="如: system/user/index" />
        </FormItem>
        <FormItem label="权限标识">
          <Input v-model:value="menuFormData.perms" placeholder="如: sys:user:list" />
        </FormItem>
        <FormItem label="图标">
          <Input v-model:value="menuFormData.icon" placeholder="选择图标" />
        </FormItem>
        <FormItem label="排序">
          <InputNumber v-model:value="menuFormData.sort" :min="0" style="width: 100%" />
        </FormItem>
        <FormItem label="状态">
          <RadioGroup v-model:value="menuFormData.status">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">停用</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem v-if="menuFormData.menuType === 'C'" label="缓存">
          <Switch v-model:checked="menuFormData.keepAlive" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 按钮权限编辑弹窗 -->
    <Modal v-model:open="permFormVisible" :title="permFormMode === 'add' ? '新增按钮' : '编辑按钮'" @ok="handlePermSubmit">
      <Form :model="permFormData" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <FormItem label="按钮名称">
          <Input v-model:value="permFormData.menuName" placeholder="如: 新增" />
        </FormItem>
        <FormItem label="权限标识">
          <Input v-model:value="permFormData.perms" placeholder="如: sys:user:add" />
        </FormItem>
        <FormItem label="排序">
          <InputNumber v-model:value="permFormData.sort" :min="0" style="width: 100%" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  Card, Table, Form, FormItem, Input, InputNumber, Button, Space, Badge, Modal, Radio, RadioGroup,
  Tree, TreeSelect, Switch, Tag, Row, Col, Empty, Tabs, TabPane, Descriptions, DescriptionsItem, Checkbox,
  Dropdown, Menu, MenuItem, MenuDivider,
} from 'ant-design-vue';
import {
  FolderOutlined, FileTextOutlined, SettingOutlined, MoreOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';

const activeTab = ref('menu');
const menuList = ref<any[]>([]);
const selectedMenuKeys = ref<string[]>([]);
const expandedMenuKeys = ref<string[]>([]);
const currentMenu = ref<any>(null);
const currentMenuPerms = ref<any[]>([]);

const roleList = ref<any[]>([]);
const matrixRoleId = ref<string>('');
const permissionMatrix = ref<any[]>([]);

const assignLogs = ref<any[]>([]);

const menuTreeData = computed(() => buildMenuTree(menuList.value));

function buildMenuTree(list: any[], parentId = '0'): any[] {
  return list.filter(item => item.parentId === parentId).map(item => ({
    key: item.id,
    title: item.menuName,
    menuName: item.menuName,
    menuType: item.menuType,
    ...item,
    children: buildMenuTree(list, item.id),
  }));
}

function getMenuIcon(icon: string) {
  if (!icon) return null;
  const icons: Record<string, any> = {
    UserOutlined: 'UserOutlined',
    SettingOutlined: 'SettingOutlined',
    DashboardOutlined: 'DashboardOutlined',
  };
  return icons[icon] || 'SettingOutlined';
}

function getMenuTypeColor(type: string): string {
  const map: Record<string, string> = { M: 'blue', C: 'green', A: 'orange' };
  return map[type] || 'default';
}

function getMenuTypeName(type: string): string {
  const map: Record<string, string> = { M: '目录', C: '菜单', A: '按钮' };
  return map[type] || '未知';
}

// 菜单表单
const menuFormVisible = ref(false);
const menuFormMode = ref<'add' | 'edit'>('add');
const menuFormRef = ref();
const menuFormData = reactive({
  id: '',
  parentId: '0',
  menuName: '',
  menuType: 'C',
  path: '',
  component: '',
  perms: '',
  icon: '',
  sort: 0,
  status: 1,
  keepAlive: false,
  visible: true,
});
const menuFormRules = {
  menuName: [{ required: true, message: '请输入菜单名称' }],
  path: [{ required: true, message: '请输入路由路径' }],
};

// 按钮权限表单
const permFormVisible = ref(false);
const permFormMode = ref<'add' | 'edit'>('add');
const permFormData = reactive({ id: '', menuName: '', perms: '', sort: 0 });

const permColumns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '按钮名称', dataIndex: 'menuName', width: 120 },
  { title: '权限标识', dataIndex: 'perms', width: 200 },
  { title: '排序', dataIndex: 'sort', width: 80 },
  { title: '操作', key: 'action', width: 120 },
];

const matrixColumns = computed(() => [
  { title: '菜单名称', key: 'menuName', width: 200, fixed: 'left' },
  { title: '路径', dataIndex: 'path', width: 150 },
  { title: '权限标识', key: 'perms', width: 200 },
  { title: '授权', key: 'check', width: 80 },
]);

const logColumns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '角色', dataIndex: 'roleName', width: 120 },
  { title: '菜单', dataIndex: 'menuName', width: 150 },
  { title: '操作', key: 'actionType', width: 100 },
  { title: '操作人', dataIndex: 'operator', width: 100 },
  { title: '时间', dataIndex: 'createTime', width: 170 },
];

function getActionColor(action: string): string {
  const map: Record<string, string> = { '授权': 'green', '撤销': 'red', '修改': 'blue' };
  return map[action] || 'default';
}

// 数据获取
async function fetchMenus() {
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/menu/list' });
    if (res?.data) {
      menuList.value = res.data;
    } else if (Array.isArray(res)) {
      menuList.value = res;
    } else {
      menuList.value = [];
    }
  } catch {
    menuList.value = [];
  }
}

async function fetchRoles() {
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/role/list', params: { page: 1, pageSize: 100 } });
    if (res?.data) {
      roleList.value = res.data.list || [];
    } else if (res?.list) {
      roleList.value = res.list;
    } else {
      roleList.value = [];
    }
  } catch {
    roleList.value = [];
  }
}

async function loadRolePermissions() {
  if (!matrixRoleId.value) return;
  try {
    const res = await defHttp.get({ url: `/basic-api/sys/role/${matrixRoleId.value}/menus` });
    const checkedIds = res?.data || res || [];
    permissionMatrix.value = menuList.value.map(menu => ({
      ...menu,
      checked: checkedIds.includes(menu.id),
    }));
  } catch {
    permissionMatrix.value = menuList.value;
  }
}

function togglePermission(record: any) {
  record.checked = !record.checked;
}

async function saveRolePermissions() {
  if (!matrixRoleId.value) {
    message.warning('请选择角色');
    return;
  }
  const menuIds = permissionMatrix.value.filter(m => m.checked).map(m => m.id);
  try {
    await defHttp.put({
      url: `/basic-api/sys/role/${matrixRoleId.value}/menus`,
      data: { menuIds },
    });
    message.success('权限保存成功');
  } catch {
    message.error('保存失败');
  }
}

// 事件处理
function handleMenuSelect(keys: string[]) {
  selectedMenuKeys.value = keys;
  if (keys.length > 0) {
    currentMenu.value = menuList.value.find(m => m.id === keys[0]) || null;
    currentMenuPerms.value = menuList.value.filter(m => m.parentId === keys[0] && m.menuType === 'A');
  } else {
    currentMenu.value = null;
  }
}

function handleMenuExpand(keys: string[]) {
  expandedMenuKeys.value = keys;
}

function handleMenuAction(key: string, menu: any) {
  switch (key) {
    case 'add': openAddMenuModal(menu); break;
    case 'edit': openEditMenuModal(menu); break;
    case 'delete': deleteMenu(menu); break;
    case 'copy': copyMenu(menu); break;
  }
}

function refreshMenus() {
  fetchMenus();
}

function openAddMenuModal(parent: any) {
  menuFormMode.value = 'add';
  Object.assign(menuFormData, {
    id: '',
    parentId: parent?.id || '0',
    menuName: '',
    menuType: parent?.menuType === 'A' ? 'A' : 'C',
    path: '',
    component: '',
    perms: '',
    icon: '',
    sort: 0,
    status: 1,
    keepAlive: false,
    visible: true,
  });
  menuFormVisible.value = true;
}

function openEditMenuModal(menu: any) {
  menuFormMode.value = 'edit';
  Object.assign(menuFormData, {
    id: menu.id,
    parentId: menu.parentId,
    menuName: menu.menuName,
    menuType: menu.menuType,
    path: menu.path || '',
    component: menu.component || '',
    perms: menu.perms || '',
    icon: menu.icon || '',
    sort: menu.sort || 0,
    status: menu.status,
    keepAlive: menu.keepAlive || false,
    visible: menu.visible !== false,
  });
  menuFormVisible.value = true;
}

async function handleMenuSubmit() {
  try {
    if (menuFormMode.value === 'add') {
      await defHttp.post({ url: '/basic-api/sys/menu', data: menuFormData });
      message.success('创建成功');
    } else {
      await defHttp.put({ url: `/basic-api/sys/menu/${menuFormData.id}`, data: menuFormData });
      message.success('更新成功');
    }
    menuFormVisible.value = false;
    fetchMenus();
  } catch {
    message.error('操作失败');
  }
}

function deleteMenu(menu: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除菜单 ${menu.menuName} 吗？`,
    onOk: async () => {
      try {
        await defHttp.delete({ url: `/basic-api/sys/menu/${menu.id}` });
        message.success('删除成功');
        fetchMenus();
      } catch {
        message.error('删除失败');
      }
    },
  });
}

function copyMenu(menu: any) {
  message.info('复制功能开发中');
}

function openAddPermModal() {
  if (!currentMenu.value) return;
  permFormMode.value = 'add';
  Object.assign(permFormData, { id: '', menuName: '', perms: currentMenu.value.perms ? currentMenu.value.perms + ':' : '', sort: 0 });
  permFormVisible.value = true;
}

function openEditPermModal(perm: any) {
  permFormMode.value = 'edit';
  Object.assign(permFormData, perm);
  permFormVisible.value = true;
}

async function handlePermSubmit() {
  if (!currentMenu.value) return;
  try {
    const data = {
      ...permFormData,
      parentId: currentMenu.value.id,
      menuType: 'A',
      path: '',
      status: 1,
    };
    if (permFormMode.value === 'add') {
      await defHttp.post({ url: '/basic-api/sys/menu', data });
    } else {
      await defHttp.put({ url: `/basic-api/sys/menu/${permFormData.id}`, data });
    }
    message.success('保存成功');
    permFormVisible.value = false;
    fetchMenus();
  } catch {
    message.error('操作失败');
  }
}

async function deletePerm(perm: any) {
  try {
    await defHttp.delete({ url: `/basic-api/sys/menu/${perm.id}` });
    message.success('删除成功');
    fetchMenus();
  } catch {
    message.error('删除失败');
  }
}

onMounted(async () => {
  await Promise.all([fetchMenus(), fetchRoles()]);
});
</script>

<style scoped>
.sys-permission { padding: 16px; }
.main-card { min-height: calc(100vh - 100px); }
.permission-container { display: flex; gap: 16px; height: calc(100vh - 250px); }
.menu-tree-panel { width: 350px; background: #fafafa; border-radius: 4px; padding: 12px; flex-shrink: 0; overflow: auto; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.panel-title { font-weight: 500; }
.menu-tree-node { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.menu-name { flex: 1; }
.node-action { padding: 0 4px; }
.menu-detail-panel { flex: 1; background: #fff; border-radius: 4px; padding: 16px; overflow: auto; }
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0; }
.detail-title h3 { margin: 0 0 8px 0; }
.detail-meta { display: flex; align-items: center; gap: 8px; }
.meta-item { color: #666; font-size: 12px; }
.button-perms-section { margin-top: 24px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-title { font-weight: 500; }
.matrix-container { padding: 16px; }
.matrix-toolbar { display: flex; justify-content: space-between; margin-bottom: 16px; }
</style>
