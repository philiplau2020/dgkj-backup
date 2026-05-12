# 道谷科技支付平台 - 开发规范

## 一、项目概述

### 1.1 项目信息
| 项目 | 说明 |
|-----|------|
| 项目名称 | DGKJ - 道谷支付 |
| 技术栈 | Vue3 + Vben Admin + Ant Design Vue |
| 后端 | Spring Boot 3.x + MyBatis-Plus |
| 数据库 | MySQL 8.0 + Redis 7.x |
| 目标 | 聚合支付系统（运营后台 + 商户后台 + 代理商后台） |

### 1.2 项目结构
```
DGKJ/
├── apps/
│   ├── web/                    # 主应用（运营后台）
│   └── test-server/            # Mock 测试服务器
├── src/
│   ├── api/                    # API 接口定义
│   │   ├── sys/               # 系统管理
│   │   ├── mch/               # 商户管理
│   │   ├── trade/             # 交易管理
│   │   ├── finance/           # 财务管理
│   │   └── channel/           # 渠道管理
│   ├── components/             # 公共组件
│   ├── views/                 # 页面视图
│   │   ├── dashboard/          # 仪表盘
│   │   ├── sys/               # 系统管理
│   │   ├── mch/               # 商户管理
│   │   ├── trade/             # 交易管理
│   │   └── finance/           # 财务管理
│   ├── store/                 # 状态管理
│   ├── router/                # 路由配置
│   ├── utils/                 # 工具函数
│   └── settings/              # 配置项
└── docs/                      # 开发文档
```

---

## 二、技术规范

### 2.1 命名规范

| 类型 | 规范 | 示例 |
|-----|------|------|
| **组件** | PascalCase | `PaymentOrder.vue`, `MerchantForm.vue` |
| **方法/函数** | camelCase | `fetchOrderList()`, `handleSubmit()` |
| **常量** | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| **变量** | camelCase | `orderList`, `loadingState` |
| **CSS 类名** | kebab-case | `.order-list`, `.merchant-card` |
| **API 文件** | camelCase + `.ts` | `orderApi.ts`, `merchantApi.ts` |
| **类型定义** | PascalCase + `.ts` | `types/order.ts`, `types/user.ts` |

### 2.2 API 接口规范

#### 请求格式
```typescript
// src/api/trade/order.ts
import { request } from '@/utils/http';

export interface OrderListParams {
  pageNo: number;
  pageSize: number;
  orderNo?: string;
  mchNo?: string;
  status?: number;
  dateRange?: [string, string];
}

export interface OrderItem {
  id: number;
  orderNo: string;
  mchNo: string;
  mchName: string;
  amount: string;
  status: number;
  payChannel: string;
  createdAt: string;
}

export function getOrderList(params: OrderListParams) {
  return request.get<{ list: OrderItem[]; total: number }>('/trade/order/list', { params });
}

export function getOrderDetail(id: number) {
  return request.get<OrderItem>(`/trade/order/${id}`);
}

export function refundOrder(data: { orderNo: string; amount: string; reason: string }) {
  return request.post('/trade/order/refund', data);
}
```

#### 响应格式
```typescript
// 统一响应格式
interface ApiResponse<T = any> {
  code: number;      // 状态码：0=成功，其他=失败
  msg: string;       // 消息
  data: T;           // 数据
  time?: number;     // 时间戳
}
```

### 2.3 组件规范

#### 标准页面结构
```vue
<template>
  <PageWrapper title="页面标题">
    <!-- 搜索表单 -->
    <template #headerSearch>
      <SearchForm :schema="searchSchema" @search="handleSearch" />
    </template>

    <!-- 操作按钮 -->
    <template #toolbar>
      <a-button type="primary" @click="handleAdd">新增</a-button>
    </template>

    <!-- 数据表格 -->
    <Table :columns="columns" :dataSource="tableData" :loading="loading" />

    <!-- 分页 -->
    <Pagination
      :current="pagination.page"
      :pageSize="pagination.pageSize"
      :total="pagination.total"
      @change="handlePageChange"
    />

    <!-- 弹窗 -->
    <Modal v-model:visible="modalVisible" :title="modalTitle">
      <Form ref="formRef" :schema="formSchema" />
    </Modal>
  </PageWrapper>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';

// 1. 导入
import { useMessage } from '@/hooks/web/useMessage';
import { getOrderList } from '@/api/trade/order';

// 2. 状态定义
const loading = ref(false);
const tableData = ref([]);
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });
const modalVisible = ref(false);

// 3. 表格列定义
const columns = [
  { title: '订单号', dataIndex: 'orderNo', width: 180 },
  { title: '商户', dataIndex: 'mchName', width: 150 },
  { title: '金额', dataIndex: 'amount', width: 120 },
  { title: '状态', dataIndex: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', width: 180 },
  { title: '操作', width: 150 },
];

// 4. 方法
async function fetchData() {
  loading.value = true;
  try {
    const res = await getOrderList({ pageNo: pagination.page, pageSize: pagination.pageSize });
    tableData.value = res.data.list;
    pagination.total = res.data.total;
  } finally {
    loading.value = false;
  }
}

// 5. 初始化
fetchData();
</script>
```

### 2.4 状态管理规范

```typescript
// src/store/modules/order.ts
import { defineStore } from 'pinia';
import { getOrderList } from '@/api/trade/order';

export const useOrderStore = defineStore('order', () => {
  // 状态
  const list = ref<OrderItem[]>([]);
  const loading = ref(false);
  const pagination = reactive({ page: 1, pageSize: 10, total: 0 });

  // 计算属性
  const hasOrders = computed(() => list.value.length > 0);

  // 方法
  async function fetchList(params?: any) {
    loading.value = true;
    try {
      const res = await getOrderList({ pageNo: pagination.page, pageSize: pagination.pageSize, ...params });
      list.value = res.data.list;
      pagination.total = res.data.total;
    } finally {
      loading.value = false;
    }
  }

  return { list, loading, pagination, hasOrders, fetchList };
});
```

---

## 三、目录结构规范

### 3.1 页面目录
```
src/views/
├── dashboard/                  # 仪表盘
│   └── index.vue
├── sys/                       # 系统管理
│   ├── user/                  # 用户管理
│   │   ├── index.vue
│   │   └── UserModal.vue
│   ├── role/                  # 角色管理
│   ├── menu/                  # 菜单管理
│   └── config/                # 系统配置
├── mch/                       # 商户管理
│   ├── list/                  # 商户列表
│   ├── audit/                 # 商户审核
│   └── entry/                 # 商户进件
├── trade/                     # 交易管理
│   ├── order/                 # 支付订单
│   └── refund/                 # 退款订单
├── finance/                    # 财务管理
│   ├── settlement/             # 结算管理
│   └── statement/              # 对账管理
└── channel/                   # 渠道管理
    ├── config/                # 渠道配置
    └── merchant/              # 通道商户
```

### 3.2 API 目录
```
src/api/
├── sys/                       # 系统管理 API
│   ├── user.ts
│   ├── role.ts
│   ├── menu.ts
│   └── dict.ts
├── mch/                       # 商户管理 API
│   ├── merchant.ts
│   └── audit.ts
├── trade/                     # 交易管理 API
│   ├── order.ts
│   └── refund.ts
├── finance/                   # 财务管理 API
│   ├── settlement.ts
│   └── account.ts
└── channel/                   # 渠道管理 API
    ├── config.ts
    └── merchant.ts
```

---

## 四、权限设计

### 4.1 角色定义
| 角色 | 说明 | 权限范围 |
|-----|------|---------|
| 超级管理员 | 系统最高权限 | 全部功能 |
| 运营管理员 | 日常运营 | 商户管理、交易管理、财务管理 |
| 风控管理员 | 风控管理 | 风控规则、交易监控 |
| 财务管理员 | 财务操作 | 结算、代付、对账 |
| 商户 | 商户后台 | 查看自己的数据 |
| 代理商 | 代理商后台 | 发展商户、查看分润 |

### 4.2 按钮权限
```typescript
// 使用 v-auth 指令
<template>
  <a-button v-auth="['sys:user:add']">新增用户</a-button>
  <a-button v-auth="['sys:user:edit']">编辑</a-button>
  <a-button v-auth="['sys:user:delete']" danger>删除</a-button>
</template>

// 或使用 usePermission
const { hasPermission } = usePermission();
const canEdit = hasPermission('sys:user:edit');
```

---

## 五、Git 提交规范

### 5.1 提交格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 5.2 Type 类型
| Type | 说明 |
|-----|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 代码格式（不影响功能） |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试相关 |
| chore | 构建/工具相关 |

### 5.3 示例
```bash
# 新功能
git commit -m "feat(trade): 添加订单退款功能"

# Bug修复
git commit -m "fix(mch): 修复商户审核状态显示错误"

# 重构
git commit -m "refactor(order): 重构订单查询接口"
```

---

## 六、代码审查清单

### 6.1 功能检查
- [ ] 功能完整，符合需求
- [ ] 边界条件处理正确
- [ ] 错误处理完善
- [ ] 加载状态正确显示

### 6.2 代码质量
- [ ] 无硬编码值
- [ ] 无重复代码
- [ ] 命名规范
- [ ] 注释清晰（复杂逻辑）

### 6.3 安全检查
- [ ] 无敏感信息泄露
- [ ] XSS 防护
- [ ] CSRF 防护
- [ ] SQL 注入防护（后端）

### 6.4 性能检查
- [ ] 列表分页加载
- [ ] 无不必要的请求
- [ ] 图片懒加载
- [ ] 大数据虚拟滚动

---

## 七、环境配置

### 7.1 环境变量
| 环境 | 说明 | Mock |
|-----|------|------|
| development | 开发环境 | true |
| test | 测试环境 | false |
| production | 生产环境 | false |

### 7.2 API 地址
| 环境 | 地址 |
|-----|------|
| 开发环境 | /basic-api (Mock) |
| 测试环境 | https://api-test.dgutech.cn |
| 生产环境 | https://api.dgutech.cn |

---

## 八、开发流程

### 8.1 开发步骤
1. 创建分支 `git checkout -b feature/xxx`
2. 开发功能
3. 本地测试通过
4. 提交代码 `git commit`
5. 推送分支 `git push`
6. 创建 Pull Request
7. 代码审查
8. 合并到主分支

### 8.2 分支命名
```
feature/xxx          # 新功能
fix/xxx              # Bug 修复
refactor/xxx         # 重构
docs/xxx             # 文档
hotfix/xxx           # 紧急修复
```
