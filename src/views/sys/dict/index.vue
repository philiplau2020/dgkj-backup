<template>
  <div class="sys-dict">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <!-- 基础字典管理 -->
        <TabPane key="dict" tab="基础字典">
          <Form layout="inline" class="search-form">
            <FormItem label="字典名称">
              <Input v-model:value="searchName" placeholder="请输入字典名称" allow-clear style="width: 150px" />
            </FormItem>
            <FormItem label="字典编码">
              <Input v-model:value="searchCode" placeholder="请输入字典编码" allow-clear style="width: 150px" />
            </FormItem>
            <FormItem>
              <Space>
                <Button type="primary" @click="fetchDictList">查询</Button>
                <Button @click="resetSearch">重置</Button>
              </Space>
            </FormItem>
          </Form>

          <div class="table-toolbar">
            <Space>
              <Button type="primary" @click="openDictModal('add')">新增字典</Button>
              <Button @click="handleExport">导出</Button>
              <Button type="primary" ghost @click="initSystemDicts">初始化系统字典</Button>
            </Space>
          </div>

          <Table :data-source="dictList" :columns="dictColumns" :loading="loading" :pagination="pagination"
            @change="handleTableChange" row-key="id" bordered size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Badge :status="record.status === 1 ? 'success' : 'default'" />
                <span style="margin-left: 6px">{{ record.status === 1 ? '正常' : '停用' }}</span>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space>
                  <Button type="link" size="small" @click="openDictModal('edit', record)">编辑</Button>
                  <Button type="link" size="small" @click="viewDictData(record)">数据</Button>
                  <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>

        <!-- 系统字段字典 -->
        <TabPane key="fields" tab="系统字段">
          <div class="table-toolbar">
            <Space>
              <Alert type="info" show-icon>
                <template #message>系统字段说明</template>
                <template #description>以下列出系统中所有模块的字段定义，可用于数据导入导出、接口文档等场景</template>
              </Alert>
            </Space>
          </div>

          <Table :data-source="fieldDictList" :columns="fieldColumns" :loading="loading" :pagination="{ pageSize: 20 }" 
            row-key="id" bordered size="small" :scroll="{ x: 1500, y: 500 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'required'">
                <Tag :color="record.required ? 'red' : 'default'">{{ record.required ? '是' : '否' }}</Tag>
              </template>
              <template v-else-if="column.key === 'editable'">
                <Tag :color="record.editable ? 'green' : 'default'">{{ record.editable ? '可编辑' : '只读' }}</Tag>
              </template>
            </template>
          </Table>
        </TabPane>

        <!-- API路由字典 -->
        <TabPane key="routes" tab="API路由">
          <div class="table-toolbar">
            <Space>
              <Input v-model:value="routeKeyword" placeholder="搜索路由/名称" allow-clear style="width: 200px">
                <template #prefix><SearchOutlined /></template>
              </Input>
              <Select v-model:value="routeModule" placeholder="选择模块" allow-clear style="width: 120px">
                <SelectOption value="">全部模块</SelectOption>
                <SelectOption value="auth">认证模块</SelectOption>
                <SelectOption value="sys">系统模块</SelectOption>
                <SelectOption value="merchant">商户模块</SelectOption>
                <SelectOption value="agent">代理模块</SelectOption>
                <SelectOption value="trade">交易模块</SelectOption>
                <SelectOption value="finance">财务模块</SelectOption>
                <SelectOption value="channel">通道模块</SelectOption>
                <SelectOption value="citic">兴业模块</SelectOption>
              </Select>
            </Space>
          </div>

          <Table :data-source="filteredRouteList" :columns="routeColumns" :loading="loading" 
            :pagination="{ pageSize: 15 }" row-key="path" bordered size="small" :scroll="{ x: 1200, y: 500 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'method'">
                <Tag :color="getMethodColor(record.method)">{{ record.method }}</Tag>
              </template>
              <template v-else-if="column.key === 'auth'">
                <Tag :color="record.auth ? 'blue' : 'default'">{{ record.auth ? '需要认证' : '公开' }}</Tag>
              </template>
            </template>
          </Table>
        </TabPane>

        <!-- 菜单路由字典 -->
        <TabPane key="menus" tab="菜单路由">
          <div class="table-toolbar">
            <Space>
              <Button type="primary" @click="syncMenus">同步菜单</Button>
              <Button @click="handleExportMenus">导出菜单</Button>
            </Space>
          </div>

          <Tree :data="menuTreeData" :load-data="loadMenuChildren" @select="onMenuSelect">
            <template #title="{ title, record }">
              <Space>
                <component :is="record.icon" v-if="record.icon" />
                <span>{{ title }}</span>
                <Tag size="small">{{ record.menuType === 'M' ? '目录' : record.menuType === 'C' ? '菜单' : '按钮' }}</Tag>
              </Space>
            </template>
          </Tree>
        </TabPane>

        <!-- 数据表字典 -->
        <TabPane key="tables" tab="数据表">
          <div class="table-toolbar">
            <Space>
              <Alert type="info" show-icon>
                <template #message>数据库表</template>
                <template #description>显示系统中所有数据表的字段信息</template>
              </Alert>
            </Space>
          </div>

          <Table :data-source="tableList" :columns="tableColumns" :loading="loading" row-key="tableName" 
            :pagination="{ pageSize: 10 }" bordered size="small" :scroll="{ x: 1200, y: 500 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <Button type="link" size="small" @click="viewTableFields(record)">查看字段</Button>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 字典编辑弹窗 -->
    <Modal v-model:open="dictModalVisible" :title="dictFormMode === 'add' ? '新增字典' : '编辑字典'" @ok="handleDictSubmit" width="500px">
      <Form :model="dictForm" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <FormItem label="字典名称">
          <Input v-model:value="dictForm.dictName" placeholder="请输入字典名称" />
        </FormItem>
        <FormItem label="字典编码">
          <Input v-model:value="dictForm.dictCode" placeholder="请输入字典编码" />
        </FormItem>
        <FormItem label="描述">
          <Input.TextArea v-model:value="dictForm.description" placeholder="请输入描述" :rows="3" />
        </FormItem>
        <FormItem label="状态">
          <RadioGroup v-model:value="dictForm.status">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">停用</Radio>
          </RadioGroup>
        </FormItem>
      </Form>
    </Modal>

    <!-- 字典数据弹窗 -->
    <Modal v-model:open="dictDataModalVisible" title="字典数据" width="800px" :footer="null">
      <div class="mb-4">
        <Button type="primary" size="small" @click="openDictDataModal('add')">新增数据</Button>
      </div>
      <Table :data-source="dictDataList" :columns="dictDataColumns" row-key="id" size="small" bordered>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDictDataModal('edit', record)">编辑</Button>
              <Button type="link" size="small" danger @click="deleteDictData(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Modal>

    <!-- 字典数据编辑弹窗 -->
    <Modal v-model:open="dictDataEditVisible" :title="dictDataFormMode === 'add' ? '新增数据' : '编辑数据'" @ok="handleDictDataSubmit">
      <Form :model="dictDataForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="数据标签">
          <Input v-model:value="dictDataForm.dictLabel" placeholder="请输入数据标签" />
        </FormItem>
        <FormItem label="数据值">
          <Input v-model:value="dictDataForm.dictValue" placeholder="请输入数据值" />
        </FormItem>
        <FormItem label="排序">
          <InputNumber v-model:value="dictDataForm.sort" :min="0" />
        </FormItem>
        <FormItem label="样式">
          <Input v-model:value="dictDataForm.cssClass" placeholder="自定义样式类" />
        </FormItem>
        <FormItem label="标签样式">
          <Select v-model:value="dictDataForm.listClass" placeholder="选择标签样式">
            <SelectOption value="">默认</SelectOption>
            <SelectOption value="default">默认</SelectOption>
            <SelectOption value="primary">主要</SelectOption>
            <SelectOption value="success">成功</SelectOption>
            <SelectOption value="danger">危险</SelectOption>
            <SelectOption value="warning">警告</SelectOption>
            <SelectOption value="info">信息</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <RadioGroup v-model:value="dictDataForm.status">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">停用</Radio>
          </RadioGroup>
        </FormItem>
      </Form>
    </Modal>

    <!-- 表字段详情弹窗 -->
    <Modal v-model:open="tableFieldsVisible" :title="`表结构: ${currentTable?.tableName}`" width="900px" :footer="null">
      <Table :data-source="tableFieldsList" :columns="tableFieldColumns" row-key="columnName" size="small" bordered 
        :pagination="false" :scroll="{ y: 400 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'nullable'">
            <Tag :color="record.nullable === 'YES' ? 'green' : 'red'">{{ record.nullable === 'YES' ? '是' : '否' }}</Tag>
          </template>
          <template v-else-if="column.key === 'primaryKey'">
            <Tag color="blue" v-if="record.primaryKey">PK</Tag>
            <Tag v-else>-</Tag>
          </template>
        </template>
      </Table>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Button, Space, Badge, Modal, Radio, RadioGroup, Select, SelectOption, 
         Tabs, TabPane, Tag, Alert, Tree, InputNumber, TreeSelect } from 'ant-design-vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import { defHttp } from '@/utils/http/axios';
import { message } from 'ant-design-vue';

const loading = ref(false);
const activeTab = ref('dict');

// 字典相关
const dictList = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const searchName = ref('');
const searchCode = ref('');
const dictModalVisible = ref(false);
const dictFormMode = ref<'add' | 'edit'>('add');
const dictForm = reactive({ id: '', dictName: '', dictCode: '', description: '', status: 1 });

const dictColumns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '字典名称', dataIndex: 'dictName', width: 150 },
  { title: '字典编码', dataIndex: 'dictCode', width: 150 },
  { title: '描述', dataIndex: 'description', width: 200 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 180 },
];

// 字典数据相关
const dictDataModalVisible = ref(false);
const dictDataEditVisible = ref(false);
const dictDataFormMode = ref<'add' | 'edit'>('add');
const dictDataList = ref<any[]>([]);
const currentDictId = ref('');
const dictDataForm = reactive({ id: '', dictId: '', dictLabel: '', dictValue: '', sort: 0, cssClass: '', listClass: '', status: 1 });

const dictDataColumns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '标签', dataIndex: 'dictLabel', width: 120 },
  { title: '值', dataIndex: 'dictValue', width: 120 },
  { title: '排序', dataIndex: 'sort', width: 80 },
  { title: '样式', dataIndex: 'listClass', width: 100 },
  { title: '状态', dataIndex: 'status', width: 80, customRender: ({ text }) => text === 1 ? '启用' : '停用' },
  { title: '操作', key: 'action', width: 120 },
];

// 系统字段字典
const fieldDictList = ref<any[]>([
  { id: 1, module: 'sys', tableName: 'sys_user', fieldName: 'id', fieldLabel: '用户ID', fieldType: 'string', required: true, editable: false },
  { id: 2, module: 'sys', tableName: 'sys_user', fieldName: 'username', fieldLabel: '用户名', fieldType: 'string', required: true, editable: true },
  { id: 3, module: 'sys', tableName: 'sys_user', fieldName: 'password', fieldLabel: '密码', fieldType: 'string', required: true, editable: false },
  { id: 4, module: 'sys', tableName: 'sys_user', fieldName: 'nickname', fieldLabel: '昵称', fieldType: 'string', required: false, editable: true },
  { id: 5, module: 'sys', tableName: 'sys_user', fieldName: 'email', fieldLabel: '邮箱', fieldType: 'string', required: false, editable: true },
  { id: 6, module: 'sys', tableName: 'sys_user', fieldName: 'mobile', fieldLabel: '手机号', fieldType: 'string', required: false, editable: true },
  { id: 7, module: 'sys', tableName: 'sys_user', fieldName: 'status', fieldLabel: '状态', fieldType: 'number', required: true, editable: true },
  { id: 8, module: 'sys', tableName: 'sys_user', fieldName: 'dept_id', fieldLabel: '部门ID', fieldType: 'string', required: false, editable: true },
  { id: 9, module: 'sys', tableName: 'sys_user', fieldName: 'create_time', fieldLabel: '创建时间', fieldType: 'datetime', required: true, editable: false },
  { id: 10, module: 'sys', tableName: 'sys_role', fieldName: 'id', fieldLabel: '角色ID', fieldType: 'string', required: true, editable: false },
  { id: 11, module: 'sys', tableName: 'sys_role', fieldName: 'role_name', fieldLabel: '角色名称', fieldType: 'string', required: true, editable: true },
  { id: 12, module: 'sys', tableName: 'sys_role', fieldName: 'role_code', fieldLabel: '角色编码', fieldType: 'string', required: true, editable: true },
  { id: 13, module: 'sys', tableName: 'sys_menu', fieldName: 'id', fieldLabel: '菜单ID', fieldType: 'string', required: true, editable: false },
  { id: 14, module: 'sys', tableName: 'sys_menu', fieldName: 'menu_name', fieldLabel: '菜单名称', fieldType: 'string', required: true, editable: true },
  { id: 15, module: 'sys', tableName: 'sys_menu', fieldName: 'path', fieldLabel: '路由路径', fieldType: 'string', required: true, editable: true },
  { id: 16, module: 'sys', tableName: 'sys_menu', fieldName: 'component', fieldLabel: '组件路径', fieldType: 'string', required: false, editable: true },
  { id: 17, module: 'merchant', tableName: 'mch_info', fieldName: 'mch_id', fieldLabel: '商户ID', fieldType: 'string', required: true, editable: false },
  { id: 18, module: 'merchant', tableName: 'mch_info', fieldName: 'mch_name', fieldLabel: '商户名称', fieldType: 'string', required: true, editable: true },
  { id: 19, module: 'merchant', tableName: 'mch_info', fieldName: 'mch_type', fieldLabel: '商户类型', fieldType: 'number', required: true, editable: true },
  { id: 20, module: 'merchant', tableName: 'mch_info', fieldName: 'status', fieldLabel: '状态', fieldType: 'number', required: true, editable: true },
  { id: 21, module: 'agent', tableName: 'agent_info', fieldName: 'agent_id', fieldLabel: '代理ID', fieldType: 'string', required: true, editable: false },
  { id: 22, module: 'agent', tableName: 'agent_info', fieldName: 'agent_name', fieldLabel: '代理名称', fieldType: 'string', required: true, editable: true },
  { id: 23, module: 'trade', tableName: 'pay_order', fieldName: 'order_id', fieldLabel: '订单号', fieldType: 'string', required: true, editable: false },
  { id: 24, module: 'trade', tableName: 'pay_order', fieldName: 'mch_id', fieldLabel: '商户ID', fieldType: 'string', required: true, editable: false },
  { id: 25, module: 'trade', tableName: 'pay_order', fieldName: 'amount', fieldLabel: '金额(分)', fieldType: 'number', required: true, editable: false },
  { id: 26, module: 'trade', tableName: 'pay_order', fieldName: 'status', fieldLabel: '订单状态', fieldType: 'number', required: true, editable: false },
  { id: 27, module: 'trade', tableName: 'pay_order', fieldName: 'pay_time', fieldLabel: '支付时间', fieldType: 'datetime', required: false, editable: false },
  { id: 28, module: 'channel', tableName: 'channel_config', fieldName: 'channel_id', fieldLabel: '通道ID', fieldType: 'string', required: true, editable: false },
  { id: 29, module: 'channel', tableName: 'channel_config', fieldName: 'channel_name', fieldLabel: '通道名称', fieldType: 'string', required: true, editable: true },
  { id: 30, module: 'channel', tableName: 'channel_config', fieldName: 'channel_type', fieldLabel: '通道类型', fieldType: 'number', required: true, editable: true },
]);

const fieldColumns = [
  { title: '模块', dataIndex: 'module', width: 100, customRender: ({ text }) => getModuleName(text) },
  { title: '表名', dataIndex: 'tableName', width: 150 },
  { title: '字段名', dataIndex: 'fieldName', width: 150 },
  { title: '字段标签', dataIndex: 'fieldLabel', width: 150 },
  { title: '类型', dataIndex: 'fieldType', width: 100 },
  { title: '必填', key: 'required', width: 80 },
  { title: '可编辑', key: 'editable', width: 80 },
];

// API路由
const routeKeyword = ref('');
const routeModule = ref('');
const routeList = ref([
  { path: '/basic-api/auth/login', method: 'POST', module: 'auth', name: '用户登录', auth: false, desc: '登录接口，无需认证' },
  { path: '/basic-api/auth/logout', method: 'POST', module: 'auth', name: '用户登出', auth: true, desc: '退出登录' },
  { path: '/basic-api/auth/userinfo', method: 'GET', module: 'auth', name: '获取用户信息', auth: true, desc: '获取当前用户信息' },
  { path: '/basic-api/sys/user/list', method: 'GET', module: 'sys', name: '用户列表', auth: true, desc: '分页获取用户列表' },
  { path: '/basic-api/sys/user/:id', method: 'GET', module: 'sys', name: '用户详情', auth: true, desc: '获取指定用户信息' },
  { path: '/basic-api/sys/user', method: 'POST', module: 'sys', name: '创建用户', auth: true, desc: '创建新用户' },
  { path: '/basic-api/sys/user/:id', method: 'PUT', module: 'sys', name: '更新用户', auth: true, desc: '更新用户信息' },
  { path: '/basic-api/sys/user/:id', method: 'DELETE', module: 'sys', name: '删除用户', auth: true, desc: '删除用户' },
  { path: '/basic-api/sys/role/list', method: 'GET', module: 'sys', name: '角色列表', auth: true, desc: '获取角色列表' },
  { path: '/basic-api/sys/role', method: 'POST', module: 'sys', name: '创建角色', auth: true, desc: '创建新角色' },
  { path: '/basic-api/sys/menu/list', method: 'GET', module: 'sys', name: '菜单列表', auth: true, desc: '获取菜单树' },
  { path: '/basic-api/sys/dict/list', method: 'GET', module: 'sys', name: '字典列表', auth: true, desc: '分页获取字典' },
  { path: '/basic-api/sys/config/list', method: 'GET', module: 'sys', name: '配置列表', auth: true, desc: '分页获取配置' },
  { path: '/basic-api/merchant/list', method: 'GET', module: 'merchant', name: '商户列表', auth: true, desc: '分页获取商户列表' },
  { path: '/basic-api/merchant/:id', method: 'GET', module: 'merchant', name: '商户详情', auth: true, desc: '获取商户详情' },
  { path: '/basic-api/merchant', method: 'POST', module: 'merchant', name: '创建商户', auth: true, desc: '创建新商户' },
  { path: '/basic-api/agent/list', method: 'GET', module: 'agent', name: '代理列表', auth: true, desc: '分页获取代理列表' },
  { path: '/basic-api/agent/:id', method: 'GET', module: 'agent', name: '代理详情', auth: true, desc: '获取代理详情' },
  { path: '/basic-api/order/list', method: 'GET', module: 'trade', name: '订单列表', auth: true, desc: '分页获取订单' },
  { path: '/basic-api/order/:id', method: 'GET', module: 'trade', name: '订单详情', auth: true, desc: '获取订单详情' },
  { path: '/basic-api/refund/list', method: 'GET', module: 'trade', name: '退款列表', auth: true, desc: '分页获取退款' },
  { path: '/basic-api/account/list', method: 'GET', module: 'finance', name: '账户列表', auth: true, desc: '分页获取账户' },
  { path: '/basic-api/account/balance', method: 'GET', module: 'finance', name: '账户余额', auth: true, desc: '获取账户余额' },
  { path: '/basic-api/channel/list', method: 'GET', module: 'channel', name: '通道列表', auth: true, desc: '分页获取通道' },
  { path: '/basic-api/channel/config', method: 'GET', module: 'channel', name: '通道配置', auth: true, desc: '获取通道配置' },
  { path: '/basic-api/citic/account', method: 'GET', module: 'citic', name: '兴业账户', auth: true, desc: '获取兴业账户信息' },
  { path: '/basic-api/citic/balance', method: 'GET', module: 'citic', name: '兴业余额', auth: true, desc: '获取兴业账户余额' },
]);

const filteredRouteList = computed(() => {
  let list = routeList.value;
  if (routeModule.value) {
    list = list.filter(r => r.module === routeModule.value);
  }
  if (routeKeyword.value) {
    const kw = routeKeyword.value.toLowerCase();
    list = list.filter(r => 
      r.path.toLowerCase().includes(kw) || 
      r.name.toLowerCase().includes(kw) ||
      r.desc.toLowerCase().includes(kw)
    );
  }
  return list;
});

const routeColumns = [
  { title: '方法', key: 'method', width: 100 },
  { title: '路径', dataIndex: 'path', width: 250 },
  { title: '名称', dataIndex: 'name', width: 150 },
  { title: '模块', dataIndex: 'module', width: 100, customRender: ({ text }) => getModuleName(text) },
  { title: '认证', key: 'auth', width: 100 },
  { title: '说明', dataIndex: 'desc', ellipsis: true },
];

// 菜单树
const menuTreeData = ref<any[]>([]);

const menuColumns = [
  { title: '菜单名称', dataIndex: 'menuName', width: 200 },
  { title: '路由路径', dataIndex: 'path', width: 200 },
  { title: '组件', dataIndex: 'component', width: 200 },
  { title: '图标', dataIndex: 'icon', width: 100 },
  { title: '类型', dataIndex: 'menuType', width: 80 },
  { title: '排序', dataIndex: 'sort', width: 80 },
  { title: '状态', dataIndex: 'status', width: 80 },
];

// 数据表
const tableList = ref([
  { tableName: 'sys_user', tableComment: '系统用户表', recordCount: 0 },
  { tableName: 'sys_role', tableComment: '系统角色表', recordCount: 0 },
  { tableName: 'sys_menu', tableComment: '系统菜单表', recordCount: 0 },
  { tableName: 'sys_dept', tableComment: '系统部门表', recordCount: 0 },
  { tableName: 'sys_dict', tableComment: '系统字典表', recordCount: 0 },
  { tableName: 'sys_dict_data', tableComment: '字典数据表', recordCount: 0 },
  { tableName: 'sys_config', tableComment: '系统配置表', recordCount: 0 },
  { tableName: 'sys_log', tableComment: '系统日志表', recordCount: 0 },
  { tableName: 'sys_notice', tableComment: '系统公告表', recordCount: 0 },
  { tableName: 'mch_info', tableComment: '商户信息表', recordCount: 0 },
  { tableName: 'agent_info', tableComment: '代理商信息表', recordCount: 0 },
  { tableName: 'pay_order', tableComment: '支付订单表', recordCount: 0 },
  { tableName: 'refund_order', tableComment: '退款订单表', recordCount: 0 },
  { tableName: 'channel_config', tableComment: '通道配置表', recordCount: 0 },
  { tableName: 'account_info', tableComment: '账户信息表', recordCount: 0 },
]);

const tableColumns = [
  { title: '表名', dataIndex: 'tableName', width: 200 },
  { title: '说明', dataIndex: 'tableComment', width: 200 },
  { title: '操作', key: 'action', width: 100 },
];

const tableFieldsVisible = ref(false);
const currentTable = ref<any>(null);
const tableFieldsList = ref<any[]>([]);

const tableFieldColumns = [
  { title: '字段名', dataIndex: 'columnName', width: 150 },
  { title: '类型', dataIndex: 'columnType', width: 120 },
  { title: '说明', dataIndex: 'columnComment', width: 150 },
  { title: '可空', key: 'nullable', width: 80 },
  { title: '主键', key: 'primaryKey', width: 80 },
  { title: '默认值', dataIndex: 'columnDefault', width: 120 },
];

// 方法
function getModuleName(module: string): string {
  const map: Record<string, string> = {
    sys: '系统',
    auth: '认证',
    merchant: '商户',
    agent: '代理',
    trade: '交易',
    finance: '财务',
    channel: '通道',
    citic: '兴业',
  };
  return map[module] || module;
}

function getMethodColor(method: string): string {
  const map: Record<string, string> = {
    GET: 'green',
    POST: 'blue',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple',
  };
  return map[method] || 'default';
}

async function fetchDictList() {
  loading.value = true;
  try {
    const params: any = { page: pagination.current, pageSize: pagination.pageSize };
    if (searchName.value) params.dictName = searchName.value;
    if (searchCode.value) params.dictCode = searchCode.value;
    const res = await defHttp.get({ url: '/basic-api/sys/dict/list', params });
    if (res?.data) {
      dictList.value = res.data.list || [];
      pagination.total = res.data.total || 0;
    }
  } catch { dictList.value = []; } 
  finally { loading.value = false; }
}

function resetSearch() { searchName.value = ''; searchCode.value = ''; fetchDictList(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchDictList(); }

function openDictModal(mode: 'add' | 'edit', record?: any) {
  dictFormMode.value = mode;
  if (mode === 'add') {
    Object.assign(dictForm, { id: '', dictName: '', dictCode: '', description: '', status: 1 });
  } else {
    Object.assign(dictForm, { ...record, status: record.status });
  }
  dictModalVisible.value = true;
}

async function handleDictSubmit() {
  try {
    const data = { ...dictForm };
    if (dictFormMode.value === 'add') {
      await defHttp.post({ url: '/basic-api/sys/dict', data });
    } else {
      await defHttp.put({ url: `/basic-api/sys/dict/${dictForm.id}`, data });
    }
    message.success('操作成功');
    dictModalVisible.value = false;
    fetchDictList();
  } catch { message.error('操作失败'); }
}

function handleDelete(record: any) {
  Modal.confirm({ 
    title: '确认删除', 
    content: `确定要删除字典 ${record.dictName} 吗？`, 
    onOk: async () => {
      try { 
        await defHttp.delete({ url: `/basic-api/sys/dict/${record.id}` }); 
        message.success('删除成功'); 
        fetchDictList(); 
      }
      catch { message.error('删除失败'); }
    }
  });
}

async function viewDictData(record: any) {
  currentDictId.value = record.id;
  try {
    const res = await defHttp.get({ url: `/basic-api/sys/dict/${record.dictCode}/data` });
    if (res?.data) {
      dictDataList.value = res.data;
    } else {
      dictDataList.value = [];
    }
  } catch { dictDataList.value = []; }
  dictDataModalVisible.value = true;
}

function openDictDataModal(mode: 'add' | 'edit', record?: any) {
  dictDataFormMode.value = mode;
  if (mode === 'add') {
    Object.assign(dictDataForm, { id: '', dictId: currentDictId.value, dictLabel: '', dictValue: '', sort: 0, cssClass: '', listClass: '', status: 1 });
  } else {
    Object.assign(dictDataForm, { ...record });
  }
  dictDataEditVisible.value = true;
}

async function handleDictDataSubmit() {
  try {
    const data = { ...dictDataForm };
    await defHttp.post({ url: '/basic-api/sys/dict/data', data });
    message.success('操作成功');
    dictDataEditVisible.value = false;
    viewDictData({ id: currentDictId.value, dictCode: '' });
  } catch { message.error('操作失败'); }
}

async function deleteDictData(record: any) {
  try {
    await defHttp.delete({ url: `/basic-api/sys/dict/data/${record.id}` });
    message.success('删除成功');
    viewDictData({ id: currentDictId.value, dictCode: '' });
  } catch { message.error('删除失败'); }
}

function handleExport() { message.info('导出功能开发中'); }

async function initSystemDicts() {
  message.loading('正在初始化系统字典...');
  // 模拟初始化
  setTimeout(() => {
    message.success('系统字典初始化成功');
    fetchDictList();
  }, 1000);
}

async function syncMenus() {
  loading.value = true;
  try {
    const res = await defHttp.get({ url: '/basic-api/sys/menu/list' });
    if (res?.data) {
      menuTreeData.value = buildMenuTree(res.data);
      message.success('菜单同步成功');
    }
  } catch { 
    menuTreeData.value = [];
  }
  loading.value = false;
}

function buildMenuTree(menus: any[]): any[] {
  return menus.filter(m => m.parentId === '0' || m.parentId === null).map(m => ({
    title: m.menuName,
    key: m.id,
    icon: m.icon,
    menuType: m.menuType,
    path: m.path,
    component: m.component,
    children: menus.filter(c => c.parentId === m.id).map(c => ({
      title: c.menuName,
      key: c.id,
      icon: c.icon,
      menuType: c.menuType,
      path: c.path,
      component: c.component,
    })),
  }));
}

function loadMenuChildren(treeNode: any) {
  return new Promise<void>((resolve) => {
    setTimeout(async () => {
      if (treeNode.dataRef.children) {
        resolve();
        return;
      }
      try {
        const res = await defHttp.get({ url: '/basic-api/sys/menu/list' });
        if (res?.data) {
          const children = res.data.filter((m: any) => m.parentId === treeNode.key);
          treeNode.dataRef.children = children.map((m: any) => ({
            title: m.menuName,
            key: m.id,
            icon: m.icon,
            isLeaf: true,
          }));
          menuTreeData.value = [...menuTreeData.value];
        }
      } catch {}
      resolve();
    }, 300);
  });
}

function onMenuSelect(keys: any) {
  if (keys.length > 0) {
    console.log('Selected menu:', keys[0]);
  }
}

function handleExportMenus() { message.info('导出菜单功能开发中'); }

function viewTableFields(record: any) {
  currentTable.value = record;
  // 模拟表字段
  tableFieldsList.value = [
    { columnName: 'id', columnType: 'varchar(36)', columnComment: '主键ID', nullable: 'NO', primaryKey: true, columnDefault: null },
    { columnName: 'create_time', columnType: 'datetime', columnComment: '创建时间', nullable: 'NO', primaryKey: false, columnDefault: 'CURRENT_TIMESTAMP' },
    { columnName: 'update_time', columnType: 'datetime', columnComment: '更新时间', nullable: 'YES', primaryKey: false, columnDefault: 'CURRENT_TIMESTAMP' },
  ];
  tableFieldsVisible.value = true;
}

onMounted(() => {
  fetchDictList();
  syncMenus();
});
</script>

<style scoped>
.sys-dict { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; display: flex; align-items: center; }
.mb-4 { margin-bottom: 16px; }
</style>
