# 道谷科技聚合支付平台 (DGKJ Payment Platform)

基于 Vue Vben Admin 2.x 构建的聚合支付系统管理后台，支持多商户、多通道、智能路由、分润管理等完整功能。

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vue 3 + Vite)                  │
│   运营后台 │ 代理商后台 │ 商户后台 │ 会员后台               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx 反向代理                           │
│   /basic-api → 后端服务 (Node.js/Express)                  │
│   /upload    → 文件存储服务                                │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   MySQL 8.0     │ │   Redis 7.x     │ │   第三方支付通道 │
│   数据存储       │ │   缓存/会话     │ │   微信/支付宝/银联│
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 技术栈

### 前端
| 技术 | 版本 | 说明 |
|-----|------|------|
| Vue | 3.4+ | 渐进式 JavaScript 框架 |
| Vite | 5.x | 下一代前端构建工具 |
| TypeScript | 5.x | JavaScript 超集 |
| Ant Design Vue | 4.x | 企业级 UI 组件库 |
| Pinia | 2.x | Vue 状态管理 |
| Vue Router | 4.x | Vue.js 官方路由 |
| Axios | 1.x | HTTP 请求库 |
| ECharts | 5.x | 数据可视化图表库 |

### 后端
| 技术 | 版本 | 说明 |
|-----|------|------|
| Node.js | 18+ | JavaScript 运行时 |
| Express | 4.x | Web 框架 |
| TypeORM | 0.3 | ORM 框架 |
| MySQL | 8.0 | 关系型数据库 |
| Redis | 7.x | 内存数据库/缓存 |
| JWT | - | JSON Web Token 认证 |
| bcryptjs | - | 密码加密 |
| PM2 | - | 进程管理器 |

## 项目结构

```
DGKJ/
├── src/                          # 前端源码
│   ├── api/                      # API 接口定义 (35个文件)
│   │   ├── sys/                  # 系统管理 API
│   │   ├── mch/                  # 商户管理 API
│   │   ├── trade/                # 交易管理 API
│   │   ├── finance/              # 财务管理 API
│   │   ├── channel/              # 通道管理 API
│   │   ├── agent/                # 代理商 API
│   │   ├── citic/                # 中信银行 API
│   │   ├── device/               # 设备管理 API
│   │   ├── statistics/            # 统计分析 API
│   │   ├── check/                # 对账管理 API
│   │   ├── profit/               # 分润管理 API
│   │   └── pool/                 # 通道池 API
│   ├── views/                    # 页面组件 (258个Vue文件)
│   │   ├── dashboard/            # 仪表盘
│   │   ├── sys/                  # 系统管理页面
│   │   ├── mch/                  # 商户管理页面
│   │   ├── trade/                # 交易管理页面
│   │   ├── finance/              # 财务管理页面
│   │   ├── channel/              # 通道管理页面
│   │   ├── agent/                # 代理商页面
│   │   ├── citic/                # 中信银行页面
│   │   ├── device/               # 设备管理页面
│   │   ├── check/                # 对账管理页面
│   │   ├── statistics/            # 统计分析页面
│   │   ├── profit/               # 分润管理页面
│   │   └── pool/                 # 通道池页面
│   ├── components/               # 公共组件
│   ├── router/                   # 路由配置
│   ├── store/                   # 状态管理
│   ├── locales/                  # 国际化
│   └── settings/                # 应用配置
├── server/                       # 后端服务
│   ├── src/
│   │   ├── modules/              # 控制器模块
│   │   ├── database/             # 数据库实体
│   │   ├── config/               # 配置文件
│   │   └── common/               # 中间件/过滤器
│   └── package.json
├── docs/                         # 文档
├── mock/                         # Mock 数据
└── _tmp/                         # 临时脚本

## 功能模块

### 1. 仪表盘
- 今日/昨日/本月交易统计
- 交易趋势图表
- 支付方式分布
- 待处理事项
- 最新订单

### 2. 系统管理
- [x] 用户管理 - 操作用户 CRUD
- [x] 角色管理 - 角色权限分配
- [x] 部门管理 - 组织架构
- [x] 菜单管理 - 前端路由权限
- [x] 字典管理 - 枚举值配置
- [x] 通知管理 - 系统公告
- [x] 系统配置 - 全局参数
- [x] 操作日志 - 审计追踪

### 3. 商户管理
- [x] 商户列表 - 商户信息查看
- [x] 商户入驻 - 商户自助注册
- [x] 商户审核 - 资质审核流程
- [x] 门店管理 - 商户门店配置
- [x] 应用管理 - 商户应用创建
- [x] 费率配置 - 支付通道费率

### 4. 交易管理
- [x] 支付订单 - 扫码/刷卡/H5支付
- [x] 退款订单 - 退款申请处理
- [x] 转账订单 - 代付/批量转账
- [x] 订单通知 - 回调通知管理
- [x] 关闭订单 - 订单超时关闭

### 5. 财务管理
- [x] 账户信息 - 商户账户余额
- [x] 账户记录 - 资金流水明细
- [x] 结算管理 - T+N 自动结算
- [x] 提现管理 - 商户提现申请
- [x] 对账单 - 月度对账明细

### 6. 通道管理
- [x] 通道配置 - 支付通道接入
- [x] 通道商户 - 通道商户映射
- [x] 路由配置 - 智能路由规则
- [x] 路由策略 - 通道优先级

### 7. 代理商管理
- [x] 代理商列表 - 代理商信息
- [x] 代理商审核 - 资质审核
- [x] 佣金管理 - 分润比例配置
- [x] 提现申请 - 佣金提现
- [x] 统计报表 - 代理商业绩

### 8. 设备管理
- [x] 二维码管理 - 静态/动态二维码
- [x] 云喇叭 - 支付语音提醒
- [x] 云打印机 - 小票打印
- [x] 二维码POS - 扫码设备
- [x] 激活码管理 - 设备激活

### 9. 对账管理
- [x] 对账批次 - 日对账批次
- [x] 通道账单 - 通道对账文件
- [x] 差异账单 - 差异处理

### 10. 统计分析
- [x] 交易统计 - 交易数据分析
- [x] 商户统计 - 商户交易排行
- [x] 代理统计 - 代理商业绩
- [x] 通道统计 - 通道交易分析
- [x] 财务统计 - 收支分析

### 11. 分润管理
- [x] 账户组管理 - 分润账户分组
- [x] 接收账户 - 分润接收方
- [x] 分润记录 - 分润明细
- [x] 分润回退 - 异常回退处理

### 12. 通道池管理
- [x] 池配置 - 通道池设置
- [x] 通道管理 - 池内通道
- [x] 规则配置 - 路由规则
- [x] 策略管理 - 智能策略

### 13. 中信银行对接
- [x] 账户管理 - 中信账户
- [x] 银行卡管理 - 绑卡解绑
- [x] 结算管理 - 自动结算
- [x] 对账管理 - 差异处理

## 快速开始

### 环境要求
- Node.js >= 18.0
- MySQL >= 8.0
- Redis >= 6.0
- pnpm >= 8.0

### 安装依赖
```bash
pnpm install
```

### 开发环境启动
```bash
pnpm dev
```

### 生产环境构建
```bash
pnpm build
```

### 后端服务启动
```bash
cd server
pnpm install
pnpm dev
```

## 环境变量

### 前端 (.env)
```env
VITE_USE_MOCK=false              # 是否使用 Mock 数据
VITE_GLOB_API_URL=/basic-api     # API 基础路径
VITE_GLOB_APP_TITLE=DGKJ支付平台 # 应用标题
```

### 后端 (server/.env)
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=dgkj
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:5173
```

## API 接口

所有 API 通过 `/basic-api` 前缀访问：

| 模块 | 前缀 | 说明 |
|-----|------|------|
| 认证 | `/basic-api/login` | 登录/登出/用户信息 |
| 系统 | `/basic-api/sys` | 用户/角色/菜单/部门 |
| 商户 | `/basic-api/mch` | 商户/应用/门店/费率 |
| 交易 | `/basic-api/trade` | 订单/退款/转账 |
| 财务 | `/basic-api/finance` | 账户/结算/提现 |
| 通道 | `/basic-api/channel` | 通道配置/路由 |
| 代理 | `/basic-api/agent` | 代理商管理 |
| 设备 | `/basic-api/device` | 设备管理 |
| 对账 | `/basic-api/check` | 对账批次/差异 |
| 统计 | `/basic-api/statistics` | 数据统计 |
| 分润 | `/basic-api/profit` | 分润管理 |
| 中信 | `/basic-api/citic` | 中信银行对接 |

## 默认账号

| 角色 | 用户名 | 密码 |
|-----|--------|------|
| 运营管理员 | admin | admin123 |
| 代理商 | agent | agent123 |
| 测试商户 | mch_test | mch123 |

## 部署

### 生产环境部署
```bash
# 构建前端
pnpm build

# 部署到服务器
# 1. 上传 dist 目录到 /www/dgkj/merchant
# 2. 配置 Nginx
# 3. 重启 Nginx
```

### Nginx 配置示例
```nginx
server {
    listen 443 ssl;
    server_name dghs.gddogootech.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /www/dgkj/merchant;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /basic-api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 开发规范

详细规范请参考 [开发规范文档](./docs/DEVELOPMENT.md)

## API 文档

详细接口说明请参考 [API 文档](./docs/API.md)

## 云服务器部署

详细部署步骤请参考 [云服务器部署文档](./docs/CLOUD_DEPLOYMENT.md)

## License

MIT License
