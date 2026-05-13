<template>
  <div class="sys-role">
    <!-- 统计卡片 -->
    <Row :gutter="16" class="stat-row">
      <Col :span="6">
        <Card hoverable>
          <Statistic title="角色总数" :value="stats.total" :prefix="h(SafetyOutlined)" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="启用角色" :value="stats.enabled" :value-style="{ color: '#52c41a' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="系统角色" :value="stats.system" :value-style="{ color: '#1890ff' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="用户总数" :value="stats.userCount" :prefix="h(UserOutlined)" />
        </Card>
      </Col>
    </Row>

    <Card class="main-card">
      <div class="role-container">
        <!-- 左侧角色列表 -->
        <div class="role-list-panel">
          <div class="panel-header">
            <span class="panel-title">角色列表</span>
            <Button type="primary" size="small" @click="openAddModal">新增</Button>
          </div>
          <Input v-model:value="roleSearch" placeholder="搜索角色" size="small" class="mb-8" allow-clear>
            <template #prefix><SearchOutlined /></template>
          </Input>
          <div class="role-list">
            <div
              v-for="role in filteredRoleList"
              :key="role.id"
              class="role-item"
              :class="{ active: currentRole?.id === role.id }"
              @click="selectRole(role)"
            >
              <div class="role-info">
                <Tag :color="role.status === 1 ? 'green' : 'default'" size="small">
                  {{ role.status === 1 ? '启用' : '停用' }}
                </Tag>
                <span class="role-name">{{ role.roleName }}</span>
              </div>
              <span class="role-code">{{ role.roleCode }}</span>
            </div>
            <Empty v-if="filteredRoleList.length === 0" description="暂无角色" />
          </div>
        </div>

        <!-- 右侧权限配置 -->
        <div class="permission-config-panel">
          <template v-if="currentRole">
            <div class="config-header">
              <div class="config-title">
                <h3>{{ currentRole.roleName }}</h3>
                <p class="text-gray">{{ currentRole.roleDesc || '暂无描述' }}</p>
              </div>
              <Space>
                <Button type="primary" @click="savePermissions">保存权限</Button>
                <Button @click="openEditModal(currentRole)">编辑</Button>
                <Button danger @click="handleDelete(currentRole)">删除</Button>
              </Space>
            </div>

            <Tabs v-model:activeKey="permissionTab">
              <!-- 菜单权限 -->
              <TabPane key="menu" tab="菜单权限">
                <div class="permission-tree-container">
                  <div class="tree-toolbar">
                    <Checkbox v-model:checked="checkAllMenus" :indeterminate="menuIndeterminate" @change="handleCheckAllMenus">
                      全选/取消
                    </Checkbox>
                    <Button size="small" @click="expandAllMenus">展开全部</Button>
                    <Button size="small" @click="collapseAllMenus">收起全部</Button>
                  </div>
                  <Tree
                    v-model:checkedKeys="menuCheckedKeys"
                    v-model:expandedKeys="menuExpandedKeys"
                    :tree-data="menuTreeData"
                    checkable
                    default-expand-all
                    :selectable="false"
                  >
                    <template #title="node">
                      <Space>
                        <component :is="node.icon || 'FileOutlined'" v-if="node.icon" />
                        <span>{{ node.title }}</span>
                        <Tag size="small" :color="getMenuTypeColor(node.menuType)">
                          {{ getMenuTypeName(node.menuType) }}
                        </Tag>
                      </Space>
                    </template>
                  </Tree>
                </div>
              </TabPane>

              <!-- 按钮权限 -->
              <TabPane key="button" tab="按钮权限">
                <div class="permission-tree-container">
                  <Alert type="info" show-icon style="margin-bottom: 16px">
                    <template #message>按钮权限说明</template>
                    <template #description>根据选中的菜单显示该菜单下的所有按钮操作权限</template>
                  </Alert>
                  <Row :gutter="[16, 16]">
                    <Col v-for="menu in menuWithButtons" :key="menu.id" :span="12">
                      <Card size="small" :title="menu.menuName">
                        <CheckboxGroup v-model:value="buttonCheckedKeys" style="display: flex; flex-direction: column; gap: 8px;">
                          <Checkbox v-for="btn in menu.buttons" :key="btn.perms" :value="btn.perms">
                            {{ btn.menuName }}
                            <span class="perms-code">{{ btn.perms }}</span>
                          </Checkbox>
                        </CheckboxGroup>
                      </Card>
                    </Col>
                  </Row>
                </div>
              </TabPane>

              <!-- API权限 -->
              <TabPane key="api" tab="API权限">
                <div class="permission-tree-container">
                  <div class="tree-toolbar">
                    <Input v-model:value="apiKeyword" placeholder="搜索API路径" size="small" style="width: 200px" allow-clear>
                      <template #prefix><SearchOutlined /></template>
                    </Input>
                    <Select v-model:value="apiModule" placeholder="模块筛选" size="small" style="width: 120px" allow-clear>
                      <SelectOption value="">全部</SelectOption>
                      <SelectOption value="sys">系统</SelectOption>
                      <SelectOption value="merchant">商户</SelectOption>
                      <SelectOption value="agent">代理</SelectOption>
                      <SelectOption value="trade">交易</SelectOption>
                      <SelectOption value="finance">财务</SelectOption>
                    </Select>
                  </div>
                  <div class="api-permission-list">
                    <CheckboxGroup v-model:value="apiCheckedKeys">
                      <Row :gutter="[8, 8]">
                        <Col v-for="api in filteredApiList" :key="api.path" :span="12">
                          <div class="api-item">
                            <Checkbox :value="api.path">
                              <Tag :color="getMethodColor(api.method)">{{ api.method }}</Tag>
                              <span class="api-path">{{ api.path }}</span>
                            </Checkbox>
                          </div>
                        </Col>
                      </Row>
                    </CheckboxGroup>
                  </div>
                </div>
              </TabPane>

              <!-- 数据权限 -->
              <TabPane key="data" tab="数据权限">
                <div class="data-permission-config">
                  <Alert type="info" show-icon style="margin-bottom: 16px">
                    <template #message>数据权限说明</template>
                    <template #description>控制角色可访问的数据范围</template>
                  </Alert>
                  <Form :label-col="{ span: 4 }" :wrapper-col="{ span: 18 }">
                    <FormItem label="权限范围">
                      <RadioGroup v-model:value="dataPermissionScope">
                        <Radio value="all">全部数据</Radio>
                        <Radio value="dept">本部门数据</Radio>
                        <Radio value="deptAndChild">本部门及以下数据</Radio>
                        <Radio value="self">仅本人数据</Radio>
                        <Radio value="custom">自定义</Radio>
                      </RadioGroup>
                    </FormItem>
                    <FormItem v-if="dataPermissionScope === 'custom'" label="自定义部门">
                      <TreeSelect
                        v-model:value="customDeptIds"
                        :tree-data="deptTreeData"
                        multiple
                        placeholder="选择可见部门"
                        tree-default-expand-all
                        style="width: 100%"
                      />
                    </FormItem>
                  </Form>
                </div>
              </TabPane>

              <!-- 角色成员 -->
              <TabPane key="members" tab="角色成员">
                <div class="role-members">
                  <div class="members-toolbar">
                    <span>成员数量: {{ roleMembers.length }}</span>
                    <Button size="small" @click="addRoleMember">添加成员</Button>
                  </div>
                  <Table :data-source="roleMembers" :columns="memberColumns" size="small" :pagination="{ pageSize: 10 }" row-key="id">
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'avatar'">
                        <Avatar :src="record.avatar" :size="24">
                          <template #icon><UserOutlined /></template>
                        </Avatar>
                      </template>
                      <template v-else-if="column.key === 'action'">
                        <Button type="link" size="small" danger @click="removeRoleMember(record)">移除</Button>
                      </template>
                    </template>
                  </Table>
                </div>
              </TabPane>
            </Tabs>
          </template>
          <Empty v-else description="请选择左侧角色进行权限配置" />
        </div>
      </div>
    </Card>

    <!-- 角色编辑弹窗 -->
    <Modal v-model:open="formVisible" :title="formMode === 'add' ? '新增角色' : '编辑角色'" @ok="handleFormSubmit">
      <Form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }" :rules="formRules" ref="formRef">
        <FormItem label="角色名称" name="roleName">
          <Input v-model:value="formData.roleName" placeholder="请输入角色名称" />
        </FormItem>
        <FormItem label="角色编码" name="roleCode">
          <Input v-model:value="formData.roleCode" placeholder="请输入角色编码" :disabled="formMode === 'edit'" />
        </FormItem>
        <FormItem label="角色类型">
          <RadioGroup v-model:value="formData.roleType">
            <Radio value="system">系统角色</Radio>
            <Radio value="custom">自定义角色</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="描述">
          <Input.TextArea v-model:value="formData.roleDesc" placeholder="请输入描述" :rows="3" />
        </FormItem>
        <FormItem label="排序">
          <InputNumber v-model:value="formData.sort" :min="0" style="width: 100%" />
        </FormItem>
        <FormItem label="状态">
          <RadioGroup v-model:value="formData.status">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">停用</Radio>
          </RadioGroup>
        </FormItem>
      </Form>
    </Modal>

    <!-- 添加成员弹窗 -->
    <Modal v-model:open="memberVisible" title="添加成员" width="800px" @ok="handleAddMember">
      <div class="add-member-toolbar">
        <Input v-model:value="memberSearch" placeholder="搜索用户" size="small" style="width: 200px" allow-clear>
          <template #prefix><SearchOutlined /></template>
        </Input>
      </div>
      <Table
        :data-source="availableUsers"
        :columns="memberColumns"
        :loading="memberLoading"
        :pagination="{ pageSize: 10 }"
        :row-selection="{ selectedRowKeys: selectedMemberKeys, onChange: (keys) => selectedMemberKeys = keys }"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatar'">
            <Avatar :src="record.avatar" :size="24">
              <template #icon><UserOutlined /></template>
            </Avatar>
          </template>
        </template>
      </Table>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue';
import {
  Card, Table, Form, FormItem, Input, InputNumber, Button, Space, Badge, Modal, Radio, RadioGroup,
  Checkbox, CheckboxGroup, Tree, TreeSelect, Avatar, Switch, Tag, Row, Col, Alert, Statistic, Empty, Tabs, TabPane,
} from 'ant-design-vue';
import { SafetyOutlined, UserOutlined, SearchOutlined, FileOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const stats = reactive({ total: 0, enabled: 0, system: 0, userCount: 0 });
const roleList = ref<any[]>([]);
const roleSearch = ref('');
const currentRole = ref<any>(null);
const permissionTab = ref('menu');

// 角色表单
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formRef = ref();
const formData = reactive({
  id: '',
  roleName: '',
  roleCode: '',
  roleType: 'custom',
  roleDesc: '',
  sort: 0,
  status: 1,
});
const formRules = {
  roleName: [{ required: true, message: '请输入角色名称' }],
  roleCode: [{ required: true, message: '请输入角色编码' }],
};

// 菜单权限
const menuTreeData = ref<any[]>([]);
const menuCheckedKeys = ref<string[]>([]);
const menuExpandedKeys = ref<string[]>([]);
const checkAllMenus = ref(false);
const menuIndeterminate = ref(false);

// 按钮权限
const buttonCheckedKeys = ref<string[]>([]);
const menuWithButtons = ref<any[]>([]);

// API权限
const apiKeyword = ref('');
const apiModule = ref('');
const apiCheckedKeys = ref<string[]>([]);
const apiList = ref([
  { path: '/basic-api/sys/user/list', method: 'GET', module: 'sys', name: '用户列表' },
  { path: '/basic-api/sys/user/:id', method: 'GET', module: 'sys', name: '用户详情' },
  { path: '/basic-api/sys/user', method: 'POST', module: 'sys', name: '创建用户' },
  { path: '/basic-api/sys/user/:id', method: 'PUT', module: 'sys', name: '更新用户' },
  { path: '/basic-api/sys/user/:id', method: 'DELETE', module: 'sys', name: '删除用户' },
  { path: '/basic-api/sys/role/list', method: 'GET', module: 'sys', name: '角色列表' },
  { path: '/basic-api/sys/menu/list', method: 'GET', module: 'sys', name: '菜单列表' },
  { path: '/basic-api/merchant/list', method: 'GET', module: 'merchant', name: '商户列表' },
  { path: '/basic-api/merchant/:id', method: 'GET', module: 'merchant', name: '商户详情' },
  { path: '/basic-api/agent/list', method: 'GET', module: 'agent', name: '代理列表' },
  { path: '/basic-api/order/list', method: 'GET', module: 'trade', name: '订单列表' },
  { path: '/basic-api/account/list', method: 'GET', module: 'finance', name: '账户列表' },
]);

// 数据权限
const dataPermissionScope = ref('all');
const customDeptIds = ref<string[]>([]);
const deptTreeData = ref<any[]>([]);

// 角色成员
const roleMembers = ref<any[]>([]);
const memberVisible = ref(false);
const memberLoading = ref(false);
const memberSearch = ref('');
const selectedMemberKeys = ref<string[]>([]);
const availableUsers = ref<any[]>([]);

const memberColumns = [
  { title: '头像', key: 'avatar', width: 60 },
  { title: '用户名', dataIndex: 'username', width: 120 },
  { title: '昵称', dataIndex: 'nickname', width: 120 },
  { title: '部门', dataIndex: 'deptName', width: 120 },
  { title: '操作', key: 'action', width: 80 },
];

const filteredRoleList = computed(() => {
  if (!roleSearch.value) return roleList.value;
  return roleList.value.filter(r =>
    r.roleName.includes(roleSearch.value) || r.roleCode.includes(roleSearch.value)
  );
});

const filteredApiList = computed(() => {
  let list = apiList.value;
  if (apiModule.value) {
    list = list.filter(a => a.module === apiModule.value);
  }
  if (apiKeyword.value) {
    list = list.filter(a => a.path.includes(apiKeyword.value) || a.name.includes(apiKeyword.value));
  }
  return list;
});

// 方法
function getMethodColor(method: string): string {
  const map: Record<string, string> = {
    GET: 'green', POST: 'blue', PUT: 'orange', DELETE: 'red',
  };
  return map[method] || 'default';
}

function getMenuTypeColor(type: string): string {
  const map: Record<string, string> = { M: 'blue', C: 'green', A: 'orange' };
  return map[type] || 'default';
}

function getMenuTypeName(type: string): string {
  const map: Record<string, string> = { M: '目录', C: '菜单', A: '按钮' };
  return map[type] || '未知';
}

function handleCheckAllMenus(e: any) {
  if (e.target.checked) {
    menuCheckedKeys.value = getAllMenuKeys(menuTreeData.value);
  } else {
    menuCheckedKeys.value = [];
  }
}

function getAllMenuKeys(tree: any[]): string[] {
  const keys: string[] = [];
  for (const node of tree) {
    keys.push(node.key);
    if (node.children) {
      keys.push(...getAllMenuKeys(node.children));
    }
  }
  return keys;
}

function expandAllMenus() {
  menuExpandedKeys.value = getAllMenuKeys(menuTreeData.value);
}

function collapseAllMenus() {
  menuExpandedKeys.value = [];
}

// 数据获取
async function fetchRoleList() {
  loading.value = true;
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/role/list', params: { page: 1, pageSize: 100 } });
    if (res?.data) {
      roleList.value = res.data.list || [];
      stats.total = res.data.total || 0;
      stats.enabled = (res.data.list || []).filter((r: any) => r.status === 1).length;
      stats.system = (res.data.list || []).filter((r: any) => r.roleType === 'system').length;
    } else if (res?.list) {
      roleList.value = res.list;
    } else {
      roleList.value = [];
    }
  } catch {
    roleList.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchMenuTree() {
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/menu/list' });
    if (res?.data) {
      menuTreeData.value = buildMenuTree(res.data);
    } else if (res) {
      menuTreeData.value = buildMenuTree(Array.isArray(res) ? res : []);
    } else {
      menuTreeData.value = [];
    }
  } catch {
    menuTreeData.value = [];
  }
}

function buildMenuTree(list: any[], parentId = '0'): any[] {
  return list.filter(item => item.parentId === parentId).map(item => ({
    key: item.id,
    title: item.menuName,
    icon: item.icon,
    menuType: item.menuType,
    children: buildMenuTree(list, item.id),
  }));
}

async function fetchRolePermissions(roleId: string) {
  try {
    const res = await defHttp.get({ url: `/basic-api/sys/role/${roleId}/menus` });
    if (res?.data) {
      menuCheckedKeys.value = res.data;
    } else if (res?.menuIds) {
      menuCheckedKeys.value = res.menuIds;
    } else if (Array.isArray(res)) {
      menuCheckedKeys.value = res;
    } else {
      menuCheckedKeys.value = [];
    }
  } catch {
    menuCheckedKeys.value = [];
  }
}

async function fetchRoleMembers(roleId: string) {
  try {
    const res = await defHttp.get({ url: `/basic-api/sys/role/${roleId}/users` });
    if (res?.data) {
      roleMembers.value = res.data;
      stats.userCount = res.data.length;
    } else if (Array.isArray(res)) {
      roleMembers.value = res;
    } else {
      roleMembers.value = [];
    }
  } catch {
    roleMembers.value = [];
  }
}

async function fetchAvailableUsers() {
  memberLoading.value = true;
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/user/list', params: { page: 1, pageSize: 100 } });
    if (res?.data) {
      availableUsers.value = res.data.list || [];
    } else if (res?.list) {
      availableUsers.value = res.list;
    } else {
      availableUsers.value = [];
    }
  } catch {
    availableUsers.value = [];
  } finally {
    memberLoading.value = false;
  }
}

async function fetchDeptTree() {
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/dept/list' });
    if (res?.data) {
      deptTreeData.value = buildDeptTree(res.data);
    } else if (res) {
      deptTreeData.value = buildDeptTree(Array.isArray(res) ? res : []);
    } else {
      deptTreeData.value = [];
    }
  } catch {
    deptTreeData.value = [];
  }
}

function buildDeptTree(list: any[], parentId = '0'): any[] {
  return list.filter(item => item.parentId === parentId).map(item => ({
    label: item.deptName,
    value: item.id,
    children: buildDeptTree(list, item.id),
  }));
}

// 事件处理
async function selectRole(role: any) {
  currentRole.value = role;
  await Promise.all([
    fetchRolePermissions(role.id),
    fetchRoleMembers(role.id),
  ]);
}

function openAddModal() {
  formMode.value = 'add';
  Object.assign(formData, {
    id: '', roleName: '', roleCode: '', roleType: 'custom',
    roleDesc: '', sort: 0, status: 1,
  });
  formVisible.value = true;
}

function openEditModal(role: any) {
  formMode.value = 'edit';
  Object.assign(formData, role);
  formVisible.value = true;
}

async function handleFormSubmit() {
  try {
    if (formMode.value === 'add') {
      await defHttp.post({ url: '/basic-api/sys/role', data: formData });
      message.success('创建成功');
    } else {
      await defHttp.put({ url: `/basic-api/sys/role/${formData.id}`, data: formData });
      message.success('更新成功');
    }
    formVisible.value = false;
    fetchRoleList();
  } catch {
    message.error('操作失败');
  }
}

async function savePermissions() {
  if (!currentRole.value) return;
  try {
    await defHttp.put({
      url: `/basic-api/sys/role/${currentRole.value.id}/menus`,
      data: { menuIds: menuCheckedKeys.value },
    });
    message.success('权限保存成功');
  } catch {
    message.error('保存失败');
  }
}

function handleDelete(role: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除角色 ${role.roleName} 吗？`,
    onOk: async () => {
      try {
        await defHttp.delete({ url: `/basic-api/sys/role/${role.id}` });
        message.success('删除成功');
        if (currentRole.value?.id === role.id) {
          currentRole.value = null;
        }
        fetchRoleList();
      } catch {
        message.error('删除失败');
      }
    },
  });
}

function addRoleMember() {
  selectedMemberKeys.value = [];
  fetchAvailableUsers();
  memberVisible.value = true;
}

async function handleAddMember() {
  if (selectedMemberKeys.value.length === 0) {
    message.warning('请选择要添加的成员');
    return;
  }
  try {
    await defHttp.post({
      url: `/basic-api/sys/role/${currentRole.value.id}/users`,
      data: { userIds: selectedMemberKeys.value },
    });
    message.success('添加成功');
    memberVisible.value = false;
    fetchRoleMembers(currentRole.value.id);
  } catch {
    message.error('添加失败');
  }
}

async function removeRoleMember(user: any) {
  try {
    await defHttp.delete({
      url: `/basic-api/sys/role/${currentRole.value.id}/users/${user.id}`,
    });
    message.success('移除成功');
    fetchRoleMembers(currentRole.value.id);
  } catch {
    message.error('移除失败');
  }
}

onMounted(async () => {
  await Promise.all([fetchRoleList(), fetchMenuTree(), fetchDeptTree()]);
});
</script>

<style scoped>
.sys-role { padding: 16px; }
.stat-row { margin-bottom: 16px; }
.main-card { min-height: calc(100vh - 200px); }
.role-container { display: flex; gap: 16px; height: calc(100vh - 280px); }
.role-list-panel { width: 280px; background: #fafafa; border-radius: 4px; padding: 12px; flex-shrink: 0; overflow: auto; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.panel-title { font-weight: 500; font-size: 14px; }
.mb-8 { margin-bottom: 8px; }
.role-list { max-height: calc(100vh - 380px); overflow: auto; }
.role-item { padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-bottom: 4px; transition: all 0.2s; }
.role-item:hover { background: #e6f7ff; }
.role-item.active { background: #bae7ff; border-left: 3px solid #1890ff; }
.role-info { display: flex; align-items: center; gap: 8px; }
.role-name { font-weight: 500; }
.role-code { font-size: 12px; color: #999; }
.permission-config-panel { flex: 1; background: #fff; border-radius: 4px; padding: 16px; overflow: auto; }
.config-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0; }
.config-title h3 { margin: 0 0 4px 0; }
.text-gray { color: #999; margin: 0; }
.permission-tree-container { background: #fafafa; border-radius: 4px; padding: 16px; }
.tree-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.api-permission-list { max-height: 400px; overflow: auto; }
.api-item { padding: 4px 0; }
.api-path { font-size: 12px; color: #666; margin-left: 8px; }
.perms-code { font-size: 11px; color: #999; margin-left: 4px; }
.data-permission-config { padding: 16px; }
.role-members { padding: 16px; }
.members-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.add-member-toolbar { margin-bottom: 12px; }
</style>
