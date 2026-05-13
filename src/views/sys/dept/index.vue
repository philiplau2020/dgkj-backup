<template>
  <div class="sys-dept">
    <!-- 统计卡片 -->
    <Row :gutter="16" class="stat-row">
      <Col :span="6">
        <Card hoverable>
          <Statistic title="部门总数" :value="stats.total" :prefix="h(ClusterOutlined)" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="员工总数" :value="stats.userCount" :prefix="h(UserOutlined)" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="启用部门" :value="stats.enabled" :value-style="{ color: '#52c41a' }" />
        </Card>
      </Col>
      <Col :span="6">
        <Card hoverable>
          <Statistic title="平均人数" :value="stats.avgUsers" suffix="人/部门" />
        </Card>
      </Col>
    </Row>

    <Card class="main-card">
      <Tabs v-model:activeKey="activeTab">
        <!-- 组织架构 -->
        <TabPane key="org" tab="组织架构">
          <div class="org-container">
            <!-- 左侧树 -->
            <div class="dept-tree-panel">
              <div class="panel-header">
                <span class="panel-title">部门列表</span>
                <Space>
                  <Button type="primary" size="small" @click="openAddModal(null)">新增</Button>
                  <Button size="small" @click="refreshDept">刷新</Button>
                </Space>
              </div>
              <Tree
                v-if="deptList.length > 0"
                v-model:selectedKeys="selectedKeys"
                v-model:expandedKeys="expandedKeys"
                :tree-data="deptTree"
                @select="handleSelect"
                @expand="handleExpand"
                show-icon
                block-node
              >
                <template #icon="{ record }">
                  <ClusterOutlined v-if="record.children?.length" />
                  <BankOutlined v-else />
                </template>
                <template #title="{ dataRef }">
                  <div class="dept-tree-node">
                    <span class="dept-name">{{ dataRef.deptName }}</span>
                    <Space size="small">
                      <Badge :count="getDeptUserCount(dataRef.id)" :number-style="{ backgroundColor: '#52c41a' }" />
                      <Dropdown :trigger="['click']" @click.stop>
                        <Button type="text" size="small" class="node-action">
                          <MoreOutlined />
                        </Button>
                        <template #overlay>
                          <Menu>
                            <MenuItem key="add" @click="openAddModal(dataRef)">新增子部门</MenuItem>
                            <MenuItem key="edit" @click="openEditModal(dataRef)">编辑</MenuItem>
                            <MenuItem key="user" @click="viewDeptUsers(dataRef)">查看成员</MenuItem>
                            <MenuDivider />
                            <MenuItem key="delete" danger @click="handleDelete(dataRef)">删除</MenuItem>
                          </Menu>
                        </template>
                      </Dropdown>
                    </Space>
                  </div>
                </template>
              </Tree>
              <Empty v-else description="暂无部门数据" />
            </div>

            <!-- 右侧详情 -->
            <div class="dept-detail-panel">
              <template v-if="currentDept">
                <div class="detail-header">
                  <div class="detail-title">
                    <BankOutlined class="detail-icon" />
                    <div>
                      <h3>{{ currentDept.deptName }}</h3>
                      <p class="detail-info">
                        <Tag :color="currentDept.status === 1 ? 'green' : 'default'">
                          {{ currentDept.status === 1 ? '启用' : '停用' }}
                        </Tag>
                        <span class="info-item">
                          <TeamOutlined /> {{ getDeptUserCount(currentDept.id) }} 人
                        </span>
                        <span class="info-item">
                          <SortAscendingOutlined /> 排序: {{ currentDept.sort }}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Space>
                    <Button type="primary" @click="openEditModal(currentDept)">编辑</Button>
                    <Button @click="openAddModal(currentDept)">新增子部门</Button>
                  </Space>
                </div>

                <Descriptions :column="2" bordered size="small" class="detail-descriptions">
                  <DescriptionsItem label="部门编码">{{ currentDept.deptCode || '-' }}</DescriptionsItem>
                  <DescriptionsItem label="部门名称">{{ currentDept.deptName }}</DescriptionsItem>
                  <DescriptionsItem label="负责人">{{ currentDept.leader || '-' }}</DescriptionsItem>
                  <DescriptionsItem label="联系电话">{{ currentDept.phone || '-' }}</DescriptionsItem>
                  <DescriptionsItem label="邮箱">{{ currentDept.email || '-' }}</DescriptionsItem>
                  <DescriptionsItem label="排序">{{ currentDept.sort }}</DescriptionsItem>
                  <DescriptionsItem label="创建时间">{{ currentDept.createTime || '-' }}</DescriptionsItem>
                  <DescriptionsItem label="更新时间">{{ currentDept.updateTime || '-' }}</DescriptionsItem>
                  <DescriptionsItem label="备注" :span="2">{{ currentDept.remark || '-' }}</DescriptionsItem>
                </Descriptions>

                <!-- 部门成员 -->
                <div class="dept-users-section">
                  <div class="section-header">
                    <span class="section-title">部门成员 ({{ deptUsers.length }})</span>
                    <Space>
                      <Button size="small" @click="refreshDeptUsers">刷新</Button>
                      <Button type="primary" size="small" @click="openUserModal">添加成员</Button>
                    </Space>
                  </div>
                  <Table :data-source="deptUsers" :columns="userColumns" size="small" :pagination="{ pageSize: 5 }" row-key="id">
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'avatar'">
                        <Avatar :src="record.avatar" :size="28">
                          <template #icon><UserOutlined /></template>
                        </Avatar>
                      </template>
                      <template v-else-if="column.key === 'status'">
                        <Switch :checked="record.status === 1" size="small" disabled />
                      </template>
                      <template v-else-if="column.key === 'action'">
                        <Space>
                          <Button type="link" size="small" @click="removeFromDept(record)">移除</Button>
                        </Space>
                      </template>
                    </template>
                  </Table>
                </div>
              </template>
              <Empty v-else description="请选择左侧部门查看详情" />
            </div>
          </div>
        </TabPane>

        <!-- 人员分布 -->
        <TabPane key="distribution" tab="人员分布">
          <Row :gutter="16">
            <Col :span="12">
              <Card title="部门人数统计" size="small">
                <div v-for="item in deptDistribution" :key="item.id" class="dist-item">
                  <span class="dist-label">{{ item.deptName }}</span>
                  <Progress :percent="item.percent" :format="() => item.count + '人'" size="small" />
                </div>
              </Card>
            </Col>
            <Col :span="12">
              <Card title="组织架构图" size="small">
                <div class="org-chart">
                  <OrgChart :data="orgChartData" />
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 部门编辑弹窗 -->
    <Modal v-model:open="formVisible" :title="formMode === 'add' ? '新增部门' : '编辑部门'" width="550px" @ok="handleFormSubmit">
      <Form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }" :rules="formRules" ref="formRef">
        <FormItem label="上级部门">
          <TreeSelect v-model:value="formData.parentId" :tree-data="deptTree" placeholder="顶级部门" allow-clear tree-default-expand-all style="width: 100%">
            <template #title="node">
              <span>{{ node.deptName || node.title }}</span>
            </template>
          </TreeSelect>
        </FormItem>
        <FormItem label="部门名称" name="deptName">
          <Input v-model:value="formData.deptName" placeholder="请输入部门名称" />
        </FormItem>
        <FormItem label="部门编码" name="deptCode">
          <Input v-model:value="formData.deptCode" placeholder="请输入部门编码" />
        </FormItem>
        <FormItem label="负责人">
          <Input v-model:value="formData.leader" placeholder="请输入负责人" />
        </FormItem>
        <FormItem label="联系电话">
          <Input v-model:value="formData.phone" placeholder="请输入联系电话" />
        </FormItem>
        <FormItem label="邮箱">
          <Input v-model:value="formData.email" placeholder="请输入邮箱" />
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
        <FormItem label="备注">
          <Input.TextArea v-model:value="formData.remark" placeholder="请输入备注" :rows="2" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 添加成员弹窗 -->
    <Modal v-model:open="userModalVisible" title="添加成员" width="800px" @ok="handleAddUsers">
      <div class="user-select-toolbar">
        <Input v-model:value="userSearch" placeholder="搜索用户" size="small" style="width: 200px" allow-clear>
          <template #prefix><SearchOutlined /></template>
        </Input>
      </div>
      <Table
        :data-source="availableUsers"
        :columns="userColumns"
        :loading="userLoading"
        :pagination="{ pageSize: 10 }"
        :row-selection="{ selectedRowKeys: selectedUserKeys, onChange: (keys) => selectedUserKeys = keys }"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatar'">
            <Avatar :src="record.avatar" :size="28">
              <template #icon><UserOutlined /></template>
            </Avatar>
          </template>
        </template>
      </Table>
    </Modal>

    <!-- 部门成员查看弹窗 -->
    <Modal v-model:open="deptUsersVisible" :title="`${currentDept?.deptName} - 成员列表`" width="700px" :footer="null">
      <Table :data-source="deptUsers" :columns="userColumns" size="small" :pagination="{ pageSize: 10 }" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatar'">
            <Avatar :src="record.avatar" :size="28">
              <template #icon><UserOutlined /></template>
            </Avatar>
          </template>
          <template v-else-if="column.key === 'status'">
            <Switch :checked="record.status === 1" size="small" disabled />
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
  Tree, TreeSelect, Avatar, Switch, Tag, Row, Col, Alert, Statistic, Empty, Tabs, TabPane, Descriptions, DescriptionsItem,
  Progress, Dropdown, Menu, MenuItem, MenuDivider,
} from 'ant-design-vue';
import {
  ClusterOutlined, BankOutlined, UserOutlined, TeamOutlined, SortAscendingOutlined,
  MoreOutlined, SearchOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';

const loading = ref(false);
const activeTab = ref('org');
const stats = reactive({ total: 0, userCount: 0, enabled: 0, avgUsers: 0 });
const deptList = ref<any[]>([]);
const selectedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);
const currentDept = ref<any>(null);

// 部门树
const deptTree = computed(() => buildTree(deptList.value));

function buildTree(list: any[], parentId = '0'): any[] {
  return list.filter(item => item.parentId === parentId).map(item => ({
    key: item.id,
    title: item.deptName,
    deptName: item.deptName,
    ...item,
    children: buildTree(list, item.id),
  }));
}

function getDeptUserCount(deptId: string): number {
  return deptUsersMap[deptId]?.length || 0;
}

// 部门表单
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formRef = ref();
const formData = reactive({
  id: '',
  parentId: undefined as string | undefined,
  deptName: '',
  deptCode: '',
  leader: '',
  phone: '',
  email: '',
  sort: 0,
  status: 1,
  remark: '',
});
const formRules = {
  deptName: [{ required: true, message: '请输入部门名称' }],
  deptCode: [{ required: true, message: '请输入部门编码' }],
};

// 部门成员
const deptUsers = ref<any[]>([]);
const deptUsersMap = ref<Record<string, any[]>>({});
const deptUsersVisible = ref(false);

// 用户相关
const userModalVisible = ref(false);
const userLoading = ref(false);
const userSearch = ref('');
const selectedUserKeys = ref<string[]>([]);
const availableUsers = ref<any[]>([]);

const userColumns = [
  { title: '头像', key: 'avatar', width: 60 },
  { title: '用户名', dataIndex: 'username', width: 120 },
  { title: '昵称', dataIndex: 'nickname', width: 120 },
  { title: '部门', dataIndex: 'deptName', width: 120 },
  { title: '手机号', dataIndex: 'mobile', width: 130 },
  { title: '状态', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 80 },
];

// 部门分布
const deptDistribution = computed(() => {
  const total = deptUsersMap.value ? Object.values(deptUsersMap.value).flat().length : 0;
  return deptList.value.map(d => {
    const count = getDeptUserCount(d.id);
    return {
      id: d.id,
      deptName: d.deptName,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  }).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
});

// 组织架构图数据
const orgChartData = computed(() => {
  const root = deptList.value.find(d => d.parentId === '0' || !d.parentId);
  if (!root) return null;
  return buildOrgNode(root);
});

function buildOrgNode(dept: any): any {
  const children = deptList.value.filter(d => d.parentId === dept.id);
  return {
    name: dept.deptName,
    title: dept.leader || '负责人',
    count: getDeptUserCount(dept.id),
    children: children.map(c => buildOrgNode(c)),
  };
}

// 数据获取
async function fetchDept() {
  loading.value = true;
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/dept/list' });
    if (res?.data) {
      deptList.value = res.data;
    } else if (Array.isArray(res)) {
      deptList.value = res;
    } else {
      deptList.value = [];
    }
    stats.total = deptList.value.length;
    stats.enabled = deptList.value.filter(d => d.status === 1).length;
    await fetchAllDeptUsers();
  } catch {
    deptList.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchAllDeptUsers() {
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/user/list', params: { page: 1, pageSize: 1000 } });
    if (res?.data) {
      const users = res.data.list || [];
      stats.userCount = res.data.total || users.length;
      const map: Record<string, any[]> = {};
      users.forEach((u: any) => {
        if (u.deptId) {
          if (!map[u.deptId]) map[u.deptId] = [];
          map[u.deptId].push(u);
        }
      });
      deptUsersMap.value = map;
    } else if (res?.list) {
      stats.userCount = res.total || res.list.length;
    } else {
      stats.userCount = 0;
    }
    stats.avgUsers = stats.total > 0 ? Math.round(stats.userCount / stats.total) : 0;
  } catch {
    stats.userCount = 0;
  }
}

async function fetchDeptUsers(deptId: string) {
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/user/list', params: { deptId, page: 1, pageSize: 100 } });
    if (res?.data) {
      deptUsers.value = res.data.list || [];
    } else if (res?.list) {
      deptUsers.value = res.list;
    } else if (Array.isArray(res)) {
      deptUsers.value = res;
    } else {
      deptUsers.value = [];
    }
  } catch {
    deptUsers.value = [];
  }
}

async function fetchAvailableUsers() {
  userLoading.value = true;
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/user/list', params: { page: 1, pageSize: 100 } });
    if (res?.data) {
      availableUsers.value = (res.data.list || []).filter((u: any) => !u.deptId);
    } else if (res?.list) {
      availableUsers.value = res.list.filter((u: any) => !u.deptId);
    } else {
      availableUsers.value = [];
    }
  } catch {
    availableUsers.value = [];
  } finally {
    userLoading.value = false;
  }
}

// 事件处理
function handleSelect(keys: string[]) {
  selectedKeys.value = keys;
  if (keys.length > 0) {
    currentDept.value = deptList.value.find(d => d.id === keys[0]) || null;
    if (currentDept.value) {
      fetchDeptUsers(currentDept.value.id);
    }
  } else {
    currentDept.value = null;
  }
}

function handleExpand(keys: string[]) {
  expandedKeys.value = keys;
}

function refreshDept() {
  fetchDept();
}

function refreshDeptUsers() {
  if (currentDept.value) {
    fetchDeptUsers(currentDept.value.id);
  }
}

function openAddModal(node: any) {
  formMode.value = 'add';
  Object.assign(formData, {
    id: '',
    parentId: node?.id || undefined,
    deptName: '',
    deptCode: '',
    leader: '',
    phone: '',
    email: '',
    sort: 0,
    status: 1,
    remark: '',
  });
  formVisible.value = true;
}

function openEditModal(node: any) {
  formMode.value = 'edit';
  Object.assign(formData, {
    id: node.id,
    parentId: node.parentId === '0' ? undefined : node.parentId,
    deptName: node.deptName,
    deptCode: node.deptCode || '',
    leader: node.leader || '',
    phone: node.phone || '',
    email: node.email || '',
    sort: node.sort || 0,
    status: node.status,
    remark: node.remark || '',
  });
  formVisible.value = true;
}

async function handleFormSubmit() {
  try {
    const data = { ...formData };
    if (formMode.value === 'add') {
      await defHttp.post({ url: '/basic-api/sys/dept', data });
      message.success('创建成功');
    } else {
      await defHttp.put({ url: `/basic-api/sys/dept/${formData.id}`, data });
      message.success('更新成功');
    }
    formVisible.value = false;
    fetchDept();
  } catch {
    message.error('操作失败');
  }
}

function handleDelete(dept: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除部门 ${dept.deptName} 吗？`,
    onOk: async () => {
      try {
        await defHttp.delete({ url: `/basic-api/sys/dept/${dept.id}` });
        message.success('删除成功');
        if (currentDept.value?.id === dept.id) {
          currentDept.value = null;
        }
        fetchDept();
      } catch {
        message.error('删除失败');
      }
    },
  });
}

function viewDeptUsers(dept: any) {
  currentDept.value = dept;
  fetchDeptUsers(dept.id);
  deptUsersVisible.value = true;
}

function openUserModal() {
  selectedUserKeys.value = [];
  fetchAvailableUsers();
  userModalVisible.value = true;
}

async function handleAddUsers() {
  if (selectedUserKeys.value.length === 0) {
    message.warning('请选择要添加的用户');
    return;
  }
  try {
    await Promise.all(selectedUserKeys.value.map(userId =>
      defHttp.put({ url: `/basic-api/sys/user/${userId}/dept`, data: { deptId: currentDept.value.id } })
    ));
    message.success('添加成功');
    userModalVisible.value = false;
    refreshDeptUsers();
    fetchAllDeptUsers();
  } catch {
    message.error('添加失败');
  }
}

async function removeFromDept(user: any) {
  try {
    await defHttp.put({ url: `/basic-api/sys/user/${user.id}/dept`, data: { deptId: null } });
    message.success('移除成功');
    refreshDeptUsers();
    fetchAllDeptUsers();
  } catch {
    message.error('移除失败');
  }
}

onMounted(() => {
  fetchDept();
});
</script>

<style scoped>
.sys-dept { padding: 16px; }
.stat-row { margin-bottom: 16px; }
.main-card { min-height: calc(100vh - 200px); }
.org-container { display: flex; gap: 16px; height: calc(100vh - 300px); }
.dept-tree-panel { width: 300px; background: #fafafa; border-radius: 4px; padding: 12px; flex-shrink: 0; overflow: auto; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.panel-title { font-weight: 500; }
.dept-tree-node { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.dept-name { flex: 1; }
.node-action { padding: 0 4px; }
.dept-detail-panel { flex: 1; background: #fff; border-radius: 4px; padding: 16px; overflow: auto; }
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0; }
.detail-title { display: flex; align-items: flex-start; gap: 12px; }
.detail-icon { font-size: 32px; color: #1890ff; }
.detail-title h3 { margin: 0 0 8px 0; }
.detail-info { display: flex; align-items: center; gap: 12px; }
.info-item { display: flex; align-items: center; gap: 4px; color: #666; font-size: 12px; }
.detail-descriptions { margin-bottom: 16px; }
.dept-users-section { margin-top: 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-title { font-weight: 500; }
.dist-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.dist-label { width: 120px; flex-shrink: 0; }
.org-chart { height: 400px; display: flex; justify-content: center; align-items: center; }
.user-select-toolbar { margin-bottom: 12px; }
</style>
