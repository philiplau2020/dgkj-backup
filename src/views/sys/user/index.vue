<template>
  <div class="sys-user">
    <!-- 统计卡片 -->
    <Row :gutter="16" class="stat-row">
      <Col :span="6">
        <Card hoverable>
          <Statistic title="总人数" :value="stats.total" :prefix="h(UserOutlined)">
            <template #suffix><span class="stat-suffix">人</span></template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="启用人数" :value="stats.enabled" :prefix="h(CheckCircleOutlined)">
            <template #suffix><span class="stat-suffix success">人</span></template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="停用人数" :value="stats.disabled" :prefix="h(StopOutlined)">
            <template #suffix><span class="stat-suffix danger">人</span></template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="部门数量" :value="stats.deptCount" :prefix="h(ClusterOutlined)">
            <template #suffix><span class="stat-suffix">个</span></template>
          </Statistic>
        </Card>
      </Col>
    </Row>

    <Card class="main-card">
      <Tabs v-model:activeKey="activeTab">
        <!-- 用户列表 -->
        <TabPane key="list" tab="用户列表">
          <div class="list-container">
            <!-- 左侧部门树 -->
            <div class="dept-tree-panel">
              <div class="panel-header">
                <span class="panel-title">部门树</span>
                <Button type="link" size="small" @click="refreshDept">刷新</Button>
              </div>
              <Tree
                v-if="deptTree.length > 0"
                :tree-data="deptTree"
                :selected-keys="selectedDeptKeys"
                :expanded-keys="expandedDeptKeys"
                @select="handleDeptSelect"
                @expand="handleDeptExpand"
                show-icon
                block-node
              >
                <template #icon><ClusterOutlined /></template>
                <template #title="node">
                  <Space>
                    <span>{{ node.title }}</span>
                    <Badge :count="getDeptUserCount(node.key)" :number-style="{ backgroundColor: '#52c41a' }" />
                  </Space>
                </template>
              </Tree>
              <Empty v-else description="暂无部门数据" />
            </div>

            <!-- 右侧用户列表 -->
            <div class="user-list-panel">
              <Form layout="inline" :model="searchForm" class="search-form">
                <FormItem label="用户名">
                  <Input v-model:value="searchForm.username" placeholder="请输入用户名" allow-clear style="width: 120px" />
                </FormItem>
                <FormItem label="昵称">
                  <Input v-model:value="searchForm.nickname" placeholder="请输入昵称" allow-clear style="width: 120px" />
                </FormItem>
                <FormItem label="角色">
                  <Select v-model:value="searchForm.roleId" placeholder="选择角色" allow-clear style="width: 120px">
                    <SelectOption v-for="role in roleList" :key="role.id" :value="role.id">{{ role.roleName }}</SelectOption>
                  </Select>
                </FormItem>
                <FormItem label="状态">
                  <Select v-model:value="searchForm.status" placeholder="状态" allow-clear style="width: 80px">
                    <SelectOption :value="1">启用</SelectOption>
                    <SelectOption :value="0">停用</SelectOption>
                  </Select>
                </FormItem>
                <FormItem>
                  <Space>
                    <Button type="primary" @click="handleSearch">查询</Button>
                    <Button @click="handleReset">重置</Button>
                  </Space>
                </FormItem>
              </Form>

              <div class="table-toolbar">
                <Space>
                  <Button type="primary" @click="openAddModal">新增用户</Button>
                  <Button @click="handleExport">导出</Button>
                  <Button danger @click="handleBatchDelete" :disabled="selectedRowKeys.length === 0">批量删除</Button>
                </Space>
                <Space>
                  <span class="selected-info" v-if="selectedRowKeys.length > 0">已选择 {{ selectedRowKeys.length }} 项</span>
                </Space>
              </div>

              <Table
                :data-source="dataSource"
                :columns="columns"
                :loading="loading"
                :pagination="pagination"
                :row-selection="{ selectedRowKeys, onChange: handleSelectionChange }"
                @change="handleTableChange"
                row-key="id"
                :scroll="{ x: 1400 }"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'avatar'">
                    <Avatar :src="record.avatar" :size="32">
                      <template #icon><UserOutlined /></template>
                    </Avatar>
                  </template>
                  <template v-else-if="column.key === 'deptName'">
                    <Tag color="blue">{{ record.deptName || '未分配' }}</Tag>
                  </template>
                  <template v-else-if="column.key === 'roles'">
                    <Space wrap>
                      <Tag v-for="role in record.roles" :key="role.id" :color="getRoleColor(role.roleCode)">
                        {{ role.roleName }}
                      </Tag>
                      <span v-if="!record.roles || record.roles.length === 0" class="text-gray">-</span>
                    </Space>
                  </template>
                  <template v-else-if="column.key === 'status'">
                    <Switch :checked="record.status === 1" size="small" @change="(checked) => handleStatusChange(record, checked)" />
                    <span style="margin-left: 8px">{{ record.status === 1 ? '启用' : '停用' }}</span>
                  </template>
                  <template v-else-if="column.key === 'lastLoginTime'">
                    <span class="text-gray">{{ formatDate(record.lastLoginTime) }}</span>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <Space>
                      <Button type="link" size="small" @click="openEditModal(record)">编辑</Button>
                      <Button type="link" size="small" @click="openRoleModal(record)">角色</Button>
                      <Button type="link" size="small" @click="openDeptModal(record)">部门</Button>
                      <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
                    </Space>
                  </template>
                </template>
              </Table>
            </div>
          </div>
        </TabPane>

        <!-- 回收站 -->
        <TabPane key="trash" tab="回收站">
          <Table
            :data-source="trashList"
            :columns="trashColumns"
            :loading="loading"
            :pagination="trashPagination"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <Space>
                  <Button type="link" size="small" @click="handleRestore(record)">恢复</Button>
                  <Button type="link" size="small" danger @click="handlePermanentDelete(record)">永久删除</Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 用户编辑弹窗 -->
    <Modal v-model:open="formVisible" :title="formMode === 'add' ? '新增用户' : '编辑用户'" width="650px" @ok="handleFormSubmit">
      <Form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }" :rules="formRules" ref="formRef">
        <FormItem label="用户名" name="username">
          <Input v-model:value="formData.username" placeholder="请输入用户名" :disabled="formMode === 'edit'" />
        </FormItem>
        <FormItem v-if="formMode === 'add'" label="密码" name="password">
          <InputPassword v-model:value="formData.password" placeholder="请输入密码（至少6位）" />
        </FormItem>
        <FormItem label="昵称" name="nickname">
          <Input v-model:value="formData.nickname" placeholder="请输入昵称" />
        </FormItem>
        <FormItem label="部门" name="deptId">
          <TreeSelect v-model:value="formData.deptId" :tree-data="deptTree" placeholder="请选择部门" allow-clear tree-default-expand-all style="width: 100%" />
        </FormItem>
        <FormItem label="手机号" name="mobile">
          <Input v-model:value="formData.mobile" placeholder="请输入手机号" />
        </FormItem>
        <FormItem label="邮箱" name="email">
          <Input v-model:value="formData.email" placeholder="请输入邮箱" />
        </FormItem>
        <FormItem label="性别">
          <RadioGroup v-model:value="formData.gender">
            <Radio :value="1">男</Radio>
            <Radio :value="0">女</Radio>
            <Radio :value="2">未知</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="状态">
          <RadioGroup v-model:value="formData.status">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">停用</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="备注">
          <Input.TextArea v-model:value="formData.remark" placeholder="请输入备注" :rows="2" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 角色分配弹窗 -->
    <Modal v-model:open="roleVisible" title="分配角色" width="500px" @ok="handleRoleSubmit">
      <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <FormItem label="用户">{{ currentUser?.username }}</FormItem>
        <FormItem label="当前角色">
          <Space wrap>
            <Tag v-for="role in currentUser?.roles" :key="role.id" color="blue">{{ role.roleName }}</Tag>
            <span v-if="!currentUser?.roles?.length" class="text-gray">未分配角色</span>
          </Space>
        </FormItem>
        <FormItem label="选择角色">
          <CheckboxGroup v-model:value="roleData.roleIds">
            <Row :gutter="[0, 8]">
              <Col v-for="role in roleList" :key="role.id" :span="12">
                <Checkbox :value="role.id">
                  {{ role.roleName }}
                  <span class="role-desc">({{ role.roleCode }})</span>
                </Checkbox>
              </Col>
            </Row>
          </CheckboxGroup>
        </FormItem>
      </Form>
      <Alert type="info" show-icon style="margin-top: 16px">
        <template #message>说明</template>
        <template #description>选择角色后，用户将获得该角色对应的菜单和API权限</template>
      </Alert>
    </Modal>

    <!-- 部门分配弹窗 -->
    <Modal v-model:open="deptVisible" title="分配部门" width="400px" @ok="handleDeptSubmit">
      <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <FormItem label="用户">{{ currentUser?.username }}</FormItem>
        <FormItem label="当前部门">
          <Tag color="blue">{{ currentUser?.deptName || '未分配' }}</Tag>
        </FormItem>
        <FormItem label="选择部门">
          <TreeSelect v-model:value="deptData.deptId" :tree-data="deptTree" placeholder="请选择部门" allow-clear tree-default-expand-all style="width: 100%" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 批量编辑弹窗 -->
    <Modal v-model:open="batchVisible" title="批量操作" width="400px" @ok="handleBatchSubmit">
      <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <FormItem label="已选用户">
          <Tag color="blue">{{ selectedRowKeys.length }} 人</Tag>
        </FormItem>
        <FormItem label="批量操作">
          <RadioGroup v-model:value="batchData.action">
            <Radio value="enable">批量启用</Radio>
            <Radio value="disable">批量停用</Radio>
            <Radio value="role">批量分配角色</Radio>
            <Radio value="dept">批量分配部门</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem v-if="batchData.action === 'role'" label="选择角色">
          <Select v-model:value="batchData.roleId" placeholder="选择角色" style="width: 100%">
            <SelectOption v-for="role in roleList" :key="role.id" :value="role.id">{{ role.roleName }}</SelectOption>
          </Select>
        </FormItem>
        <FormItem v-if="batchData.action === 'dept'" label="选择部门">
          <TreeSelect v-model:value="batchData.deptId" :tree-data="deptTree" placeholder="选择部门" style="width: 100%" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue';
import {
  Card, Table, Form, FormItem, Input, InputPassword, Select, SelectOption, Button, Space, Badge, Modal,
  Radio, RadioGroup, Checkbox, CheckboxGroup, Tree, TreeSelect, Avatar, Switch, Tag, Row, Col, Alert, Statistic, Empty,
} from 'ant-design-vue';
import { UserOutlined, CheckCircleOutlined, StopOutlined, ClusterOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const activeTab = ref('list');
const dataSource = ref<any[]>([]);
const trashList = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` });
const trashPagination = reactive({ current: 1, pageSize: 10, total: 0 });

// 统计数据
const stats = reactive({ total: 0, enabled: 0, disabled: 0, deptCount: 0 });

// 部门相关
const deptList = ref<any[]>([]);
const selectedDeptKeys = ref<string[]>([]);
const expandedDeptKeys = ref<string[]>([]);

const deptTree = computed(() => buildDeptTree(deptList.value));

function buildDeptTree(list: any[], parentId = '0'): any[] {
  return list.filter(item => item.parentId === parentId).map(item => ({
    key: item.id,
    title: item.deptName,
    ...item,
    children: buildDeptTree(list, item.id),
  }));
}

function getDeptUserCount(deptId: string): number {
  return dataSource.value.filter(u => u.deptId === deptId).length;
}

function handleDeptSelect(keys: string[]) {
  selectedDeptKeys.value = keys;
  if (keys.length > 0) {
    searchForm.deptId = keys[0];
  } else {
    searchForm.deptId = undefined;
  }
  handleSearch();
}

function handleDeptExpand(keys: string[]) {
  expandedDeptKeys.value = keys;
}

async function refreshDept() {
  await fetchDept();
}

// 角色列表
const roleList = ref<any[]>([]);

function getRoleColor(roleCode: string): string {
  const colors: Record<string, string> = {
    admin: 'red',
    manager: 'orange',
    operator: 'blue',
    viewer: 'green',
    agent: 'purple',
    merchant: 'cyan',
  };
  return colors[roleCode] || 'default';
}

// 搜索表单
const searchForm = reactive({
  username: '',
  nickname: '',
  roleId: undefined as number | undefined,
  deptId: undefined as string | undefined,
  status: undefined as number | undefined,
});

// 表格列定义
const columns = [
  { title: '头像', key: 'avatar', width: 60 },
  { title: '用户ID', dataIndex: 'id', width: 80 },
  { title: '用户名', dataIndex: 'username', width: 120 },
  { title: '昵称', dataIndex: 'nickname', width: 120 },
  { title: '部门', key: 'deptName', width: 120 },
  { title: '手机号', dataIndex: 'mobile', width: 130 },
  { title: '角色', key: 'roles', width: 200 },
  { title: '状态', key: 'status', width: 120 },
  { title: '最后登录', key: 'lastLoginTime', width: 160 },
  { title: '创建时间', dataIndex: 'createTime', width: 160 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' },
];

const trashColumns = [
  { title: '用户ID', dataIndex: 'id', width: 80 },
  { title: '用户名', dataIndex: 'username', width: 120 },
  { title: '昵称', dataIndex: 'nickname', width: 120 },
  { title: '删除时间', dataIndex: 'deleteTime', width: 160 },
  { title: '操作', key: 'action', width: 180 },
];

const selectedRowKeys = ref<string[]>([]);

// 用户表单
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formRef = ref();
const formData = reactive({
  id: '',
  username: '',
  password: '',
  nickname: '',
  deptId: undefined as string | undefined,
  mobile: '',
  email: '',
  gender: 2,
  status: 1,
  remark: '',
});

const formRules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码', min: 6 }],
  nickname: [{ required: true, message: '请输入昵称' }],
  mobile: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }],
  email: [{ type: 'email', message: '请输入正确的邮箱' }],
};

// 角色分配
const roleVisible = ref(false);
const currentUser = ref<any>(null);
const roleData = reactive({ roleIds: [] as string[] });

// 部门分配
const deptVisible = ref(false);
const deptData = reactive({ deptId: undefined as string | undefined });

// 批量操作
const batchVisible = ref(false);
const batchData = reactive({
  action: 'enable',
  roleId: undefined as number | undefined,
  deptId: undefined as string | undefined,
});

// 辅助方法
function formatDate(date: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
}

// 数据获取
async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (searchForm.username) params.username = searchForm.username;
    if (searchForm.nickname) params.nickname = searchForm.nickname;
    if (searchForm.roleId) params.roleId = searchForm.roleId;
    if (searchForm.deptId) params.deptId = searchForm.deptId;
    if (searchForm.status !== undefined) params.status = searchForm.status;

    const res = await defHttp.get({ url: '/basic-api/sys/user/list', params });
    if (res?.data) {
      dataSource.value = res.data.list || [];
      pagination.total = res.data.total || 0;
      stats.total = res.data.total || 0;
      stats.enabled = (res.data.list || []).filter((u: any) => u.status === 1).length;
      stats.disabled = (res.data.list || []).filter((u: any) => u.status === 0).length;
    } else if (res?.list) {
      dataSource.value = res.list;
      pagination.total = res.total || 0;
    } else {
      dataSource.value = [];
      pagination.total = 0;
    }
  } catch (e) {
    dataSource.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchDept() {
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/dept/list' });
    if (res?.data) {
      deptList.value = res.data;
      stats.deptCount = res.data.length;
    } else if (res) {
      deptList.value = Array.isArray(res) ? res : [];
      stats.deptCount = deptList.value.length;
    } else {
      deptList.value = [];
    }
  } catch {
    deptList.value = [];
  }
}

async function fetchRoleList() {
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/role/all' });
    if (res?.data) {
      roleList.value = res.data;
    } else if (res?.list) {
      roleList.value = res.list;
    } else {
      roleList.value = Array.isArray(res) ? res : [];
    }
  } catch {
    roleList.value = [];
  }
}

// 事件处理
function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() {
  searchForm.username = '';
  searchForm.nickname = '';
  searchForm.roleId = undefined;
  searchForm.deptId = undefined;
  searchForm.status = undefined;
  selectedDeptKeys.value = [];
  handleSearch();
}
function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
}
function handleSelectionChange(keys: string[]) {
  selectedRowKeys.value = keys;
}

function openAddModal() {
  formMode.value = 'add';
  Object.assign(formData, {
    id: '', username: '', password: '', nickname: '', deptId: undefined,
    mobile: '', email: '', gender: 2, status: 1, remark: '',
  });
  formVisible.value = true;
}

function openEditModal(record: any) {
  formMode.value = 'edit';
  Object.assign(formData, {
    id: record.id,
    username: record.username,
    password: '',
    nickname: record.nickname,
    deptId: record.deptId,
    mobile: record.mobile || '',
    email: record.email || '',
    gender: record.gender ?? 2,
    status: record.status,
    remark: record.remark || '',
  });
  formVisible.value = true;
}

async function openRoleModal(record: any) {
  currentUser.value = record;
  roleData.roleIds = record.roles?.map((r: any) => r.id) || [];
  await fetchRoleList();
  roleVisible.value = true;
}

async function openDeptModal(record: any) {
  currentUser.value = record;
  deptData.deptId = record.deptId;
  await fetchDept();
  deptVisible.value = true;
}

async function handleFormSubmit() {
  try {
    const data: any = { ...formData };
    if (!data.password) delete data.password;
    if (formMode.value === 'add') {
      await defHttp.post({ url: '/basic-api/sys/user', data });
      message.success('新增成功');
    } else {
      await defHttp.put({ url: `/basic-api/sys/user/${formData.id}`, data });
      message.success('更新成功');
    }
    formVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e?.message || '操作失败');
  }
}

async function handleRoleSubmit() {
  try {
    await defHttp.put({
      url: `/basic-api/sys/user/${currentUser.value.id}/roles`,
      data: { roleIds: roleData.roleIds },
    });
    message.success('角色分配成功');
    roleVisible.value = false;
    fetchData();
  } catch {
    message.error('操作失败');
  }
}

async function handleDeptSubmit() {
  try {
    await defHttp.put({
      url: `/basic-api/sys/user/${currentUser.value.id}/dept`,
      data: { deptId: deptData.deptId },
    });
    message.success('部门分配成功');
    deptVisible.value = false;
    fetchData();
  } catch {
    message.error('操作失败');
  }
}

async function handleStatusChange(record: any, checked: boolean) {
  try {
    await defHttp.put({
      url: `/basic-api/sys/user/${record.id}`,
      data: { status: checked ? 1 : 0 },
    });
    message.success(checked ? '已启用' : '已停用');
    fetchData();
  } catch {
    message.error('操作失败');
  }
}

function handleDelete(record: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除用户 ${record.username} 吗？删除后可从回收站恢复`,
    onOk: async () => {
      try {
        await defHttp.delete({ url: `/basic-api/sys/user/${record.id}` });
        message.success('删除成功');
        fetchData();
      } catch {
        message.error('删除失败');
      }
    },
  });
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的用户');
    return;
  }
  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 个用户吗？`,
    onOk: async () => {
      try {
        await Promise.all(selectedRowKeys.value.map((id) => defHttp.delete({ url: `/basic-api/sys/user/${id}` })));
        message.success('批量删除成功');
        selectedRowKeys.value = [];
        fetchData();
      } catch {
        message.error('批量删除失败');
      }
    },
  });
}

function handleBatchSubmit() {
  message.info('批量操作功能开发中');
  batchVisible.value = false;
}

async function handleRestore(record: any) {
  try {
    await defHttp.put({ url: `/basic-api/sys/user/${record.id}/restore` });
    message.success('恢复成功');
    fetchData();
  } catch {
    message.error('恢复失败');
  }
}

async function handlePermanentDelete(record: any) {
  Modal.confirm({
    title: '确认永久删除',
    content: '此操作不可恢复，确定要永久删除吗？',
    onOk: async () => {
      try {
        await defHttp.delete({ url: `/basic-api/sys/user/${record.id}/permanent` });
        message.success('永久删除成功');
        fetchData();
      } catch {
        message.error('删除失败');
      }
    },
  });
}

function handleExport() { message.info('导出功能开发中'); }

onMounted(async () => {
  await Promise.all([fetchData(), fetchDept(), fetchRoleList()]);
});
</script>

<style scoped>
.sys-user { padding: 16px; }
.stat-row { margin-bottom: 16px; }
.stat-suffix { font-size: 14px; color: #999; margin-left: 4px; }
.stat-suffix.success { color: #52c41a; }
.stat-suffix.danger { color: #ff4d4f; }
.main-card { min-height: calc(100vh - 200px); }
.list-container { display: flex; gap: 16px; }
.dept-tree-panel { width: 260px; background: #fafafa; border-radius: 4px; padding: 12px; flex-shrink: 0; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.panel-title { font-weight: 500; }
.user-list-panel { flex: 1; min-width: 0; }
.search-form { margin-bottom: 12px; }
.table-toolbar { display: flex; justify-content: space-between; margin-bottom: 12px; }
.selected-info { color: #1890ff; font-size: 12px; }
.text-gray { color: #999; }
.role-desc { color: #999; font-size: 12px; }
</style>
