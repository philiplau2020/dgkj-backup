<template>
  <div class="sys-menu">
    <Card>
      <div class="menu-container">
        <div class="menu-tree-panel">
          <div class="panel-header">
            <span class="panel-title">菜单列表</span>
            <Button type="primary" size="small" @click="openAddModal(null)">新增</Button>
          </div>
          <Tree
            v-if="menuTree.length > 0"
            :tree-data="menuTree"
            :selectedKeys="selectedKeys"
            :expandedKeys="expandedKeys"
            @select="handleSelect"
            @expand="handleExpand"
            show-icon
          >
            <template #icon><FolderOutlined /></template>
            <template #title="node">
              <span class="menu-node">
                <span>{{ node.menuName }}</span>
                <span class="node-actions">
                  <Button type="link" size="small" @click.stop="openAddModal(node)">添加</Button>
                  <Button type="link" size="small" @click.stop="openEditModal(node)">编辑</Button>
                  <Button type="link" size="small" danger @click.stop="handleDelete(node)">删除</Button>
                </span>
              </span>
            </template>
          </Tree>
          <Empty v-else description="暂无菜单数据" />
        </div>

        <div class="menu-info-panel">
          <template v-if="currentMenu">
            <div class="panel-header">
              <span class="panel-title">菜单详情</span>
            </div>
            <Descriptions :column="1" bordered size="small">
              <DescriptionsItem label="菜单名称">{{ currentMenu.menuName }}</DescriptionsItem>
              <DescriptionsItem label="菜单编码">{{ currentMenu.menuCode }}</DescriptionsItem>
              <DescriptionsItem label="菜单类型">
                <Tag :color="getMenuTypeColor(currentMenu.menuType)">
                  {{ getMenuTypeName(currentMenu.menuType) }}
                </Tag>
              </DescriptionsItem>
              <DescriptionsItem label="路由路径">{{ currentMenu.routePath }}</DescriptionsItem>
              <DescriptionsItem label="组件路径">{{ currentMenu.component || '-' }}</DescriptionsItem>
              <DescriptionsItem label="图标">{{ currentMenu.icon || '-' }}</DescriptionsItem>
              <DescriptionsItem label="排序">{{ currentMenu.sort }}</DescriptionsItem>
              <DescriptionsItem label="状态">
                <Badge :status="currentMenu.status === 1 ? 'success' : 'error'" :text="currentMenu.status === 1 ? '启用' : '停用'" />
              </DescriptionsItem>
              <DescriptionsItem label="是否缓存">
                <Tag :color="currentMenu.keepAlive ? 'blue' : 'default'">
                  {{ currentMenu.keepAlive ? '缓存' : '不缓存' }}
                </Tag>
              </DescriptionsItem>
              <DescriptionsItem label="是否隐藏">
                <Tag :color="currentMenu.hidden ? 'orange' : 'green'">
                  {{ currentMenu.hidden ? '隐藏' : '显示' }}
                </Tag>
              </DescriptionsItem>
            </Descriptions>
          </template>
          <Empty v-else description="请选择左侧菜单查看详情" />
        </div>
      </div>
    </Card>

    <!-- 新增/编辑弹窗 -->
    <Modal
      v-model:open="formVisible"
      :title="formMode === 'add' ? '新增菜单' : '编辑菜单'"
      width="600px"
      :maskClosable="false"
      @ok="handleSubmit"
      :confirm-loading="submitLoading"
    >
      <Form
        :model="formData"
        :label-col="{ span: 5 }"
        :wrapper-col="{ span: 18 }"
        :rules="formRules"
        ref="formRef"
      >
        <FormItem label="上级菜单">
          <TreeSelect
            v-model:value="formData.parentId"
            :tree-data="menuTreeSelect"
            placeholder="请选择上级菜单（顶级请选择'-')"
            allow-clear
            tree-default-expand-all
          >
            <template #title="node">
              <span>{{ node.menuName }}</span>
            </template>
          </TreeSelect>
        </FormItem>
        <FormItem label="菜单类型" name="menuType">
          <RadioGroup v-model:value="formData.menuType" @change="handleMenuTypeChange">
            <Radio :value="1">菜单</Radio>
            <Radio :value="2">按钮</Radio>
            <Radio :value="3">接口</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="菜单名称" name="menuName">
          <Input v-model:value="formData.menuName" placeholder="请输入菜单名称" />
        </FormItem>
        <FormItem v-if="formData.menuType === 1" label="路由路径" name="routePath">
          <Input v-model:value="formData.routePath" placeholder="请输入路由路径" />
        </FormItem>
        <FormItem v-if="formData.menuType === 1" label="组件路径" name="component">
          <Input v-model:value="formData.component" placeholder="如: system/user/index" />
        </FormItem>
        <FormItem v-if="formData.menuType === 2" label="权限标识" name="permission">
          <Input v-model:value="formData.permission" placeholder="如: system:user:list" />
        </FormItem>
        <FormItem v-if="formData.menuType === 3" label="接口路径" name="routePath">
          <Input v-model:value="formData.routePath" placeholder="如: /api/user/list" />
        </FormItem>
        <FormItem v-if="formData.menuType === 1" label="菜单图标">
          <Input v-model:value="formData.icon" placeholder="请输入图标名称" />
        </FormItem>
        <FormItem label="排序" name="sort">
          <InputNumber v-model:value="formData.sort" :min="0" style="width: 100%" />
        </FormItem>
        <FormItem v-if="formData.menuType === 1" label="是否缓存">
          <Switch v-model:checked="formData.keepAlive" />
        </FormItem>
        <FormItem v-if="formData.menuType === 1" label="是否隐藏">
          <Switch v-model:checked="formData.hidden" />
        </FormItem>
        <FormItem label="状态" name="status">
          <RadioGroup v-model:value="formData.status">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">停用</Radio>
          </RadioGroup>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  Card,
  Tree,
  TreeSelect,
  Form,
  FormItem,
  Input,
  InputNumber,
  Button,
  Space,
  Badge,
  Modal,
  Empty,
  Radio,
  RadioGroup,
  Switch,
  Tag,
  Descriptions,
  DescriptionsItem,
  message,
} from 'ant-design-vue';
import { FolderOutlined } from '@ant-design/icons-vue';
import { defHttp } from '@/utils/http/axios';

interface MenuRecord {
  id: string;
  parentId: string;
  menuName: string;
  menuCode: string;
  menuType: number;
  routePath: string;
  component: string;
  icon: string;
  sort: number;
  status: number;
  keepAlive: boolean;
  hidden: boolean;
  children?: MenuRecord[];
}

const loading = ref(false);
const submitLoading = ref(false);
const menuList = ref<MenuRecord[]>([]);
const selectedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);
const currentMenu = ref<MenuRecord | null>(null);
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formRef = ref();

const formData = reactive({
  id: '',
  parentId: undefined as string | undefined,
  menuName: '',
  menuCode: '',
  menuType: 1 as number,
  routePath: '',
  component: '',
  icon: '',
  sort: 0,
  status: 1,
  keepAlive: false,
  hidden: false,
});

const formRules = {
  menuName: [{ required: true, message: '请输入菜单名称' }],
  menuType: [{ required: true, message: '请选择菜单类型' }],
  routePath: [{ required: true, message: '请输入路径' }],
};

function buildTree(list: MenuRecord[], parentId = '0'): any[] {
  return list
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      key: item.id,
      title: item.menuName,
      menuName: item.menuName,
      ...item,
      children: buildTree(list, item.id),
    }));
}

const menuTree = computed(() => buildTree(menuList.value));

const menuTreeSelect = computed(() => {
  const result = [{ key: '0', value: '0', menuName: '顶级菜单', title: '顶级菜单', children: [] as any[] }];
  const addToTree = (nodes: any[], parent: any[]) => {
    nodes.forEach((node) => {
      const item = {
        key: node.id,
        value: node.id,
        menuName: node.menuName,
        title: node.menuName,
        children: [] as any[],
      };
      parent.push(item);
      if (node.children?.length) {
        addToTree(node.children, item.children);
      }
    });
  };
  addToTree(menuTree.value, result[0].children);
  return result;
});

function getMenuTypeName(type: number): string {
  const map: Record<number, string> = { 1: '菜单', 2: '按钮', 3: '接口' };
  return map[type] || '-';
}

function getMenuTypeColor(type: number): string {
  const map: Record<number, string> = { 1: 'blue', 2: 'green', 3: 'orange' };
  return map[type] || 'default';
}

function findMenuById(list: MenuRecord[], id: string): MenuRecord | null {
  for (const item of list) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findMenuById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

async function fetchMenu() {
  loading.value = true;
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/menu/list' });
    if (res && res.data) {
      menuList.value = res.data;
      expandedKeys.value = res.data.map((m: MenuRecord) => m.id);
    } else if (res && res.list) {
      menuList.value = res.list;
      expandedKeys.value = res.list.map((m: MenuRecord) => m.id);
    } else {
      menuList.value = [];
    }
  } catch {
    menuList.value = [];
  } finally {
    loading.value = false;
  }
}

function handleSelect(keys: string[]) {
  selectedKeys.value = keys;
  if (keys.length > 0) {
    currentMenu.value = findMenuById(menuList.value, keys[0]);
  } else {
    currentMenu.value = null;
  }
}

function handleExpand(keys: string[]) {
  expandedKeys.value = keys;
}

function handleMenuTypeChange() {
  if (formData.menuType !== 1) {
    formData.component = '';
    formData.icon = '';
    formData.keepAlive = false;
    formData.hidden = false;
  }
}

function openAddModal(node: any) {
  formMode.value = 'add';
  Object.assign(formData, {
    id: '',
    parentId: node?.id || '0',
    menuName: '',
    menuCode: '',
    menuType: 1,
    routePath: '',
    component: '',
    icon: '',
    sort: 0,
    status: 1,
    keepAlive: false,
    hidden: false,
  });
  formVisible.value = true;
}

function openEditModal(node: any) {
  formMode.value = 'edit';
  Object.assign(formData, {
    id: node.id,
    parentId: node.parentId === '0' ? undefined : node.parentId,
    menuName: node.menuName,
    menuCode: node.menuCode || '',
    menuType: node.menuType || 1,
    routePath: node.routePath || '',
    component: node.component || '',
    icon: node.icon || '',
    sort: node.sort || 0,
    status: node.status || 1,
    keepAlive: node.keepAlive || false,
    hidden: node.hidden || false,
  });
  formVisible.value = true;
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitLoading.value = true;
  try {
    const data = {
      ...formData,
      parentId: formData.parentId || '0',
      keepAlive: formData.keepAlive ? 1 : 0,
      hidden: formData.hidden ? 1 : 0,
    };

    if (formMode.value === 'add') {
      await defHttp.post({ url: '/basic-api/sys/menu', data });
      message.success('新增成功');
    } else {
      await defHttp.put({ url: `/basic-api/sys/menu/${formData.id}`, data });
      message.success('更新成功');
    }

    formVisible.value = false;
    fetchMenu();
  } catch (e: any) {
    message.error(e?.message || '操作失败');
  } finally {
    submitLoading.value = false;
  }
}

function handleDelete(node: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除菜单 "${node.menuName}" 吗？${node.children?.length ? '（包含子菜单，将一并删除）' : ''}`,
    okText: '确认',
    okType: 'danger',
    onOk: async () => {
      try {
        await defHttp.delete({ url: `/basic-api/sys/menu/${node.id}` });
        message.success('删除成功');
        if (selectedKeys.value.includes(node.id)) {
          selectedKeys.value = [];
          currentMenu.value = null;
        }
        fetchMenu();
      } catch (e) {
        message.error('删除失败');
      }
    },
  });
}

onMounted(() => {
  fetchMenu();
});
</script>

<style scoped>
.sys-menu {
  padding: 16px;
  background: #f0f2f5;
}

.menu-container {
  display: flex;
  gap: 16px;
  min-height: 500px;
}

.menu-tree-panel {
  width: 400px;
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  flex-shrink: 0;
}

.menu-info-panel {
  flex: 1;
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-title {
  font-weight: 500;
  font-size: 15px;
}

.menu-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.node-actions {
  display: none;
  gap: 4px;
}

:deep(.ant-tree-title:hover .node-actions) {
  display: flex;
}

:deep(.ant-tree-title) {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
