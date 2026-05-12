# Payment Platform Backend

支付平台后端服务

## 技术栈

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: TypeORM
- **Database**: MySQL 8.0
- **Authentication**: JWT
- **Validation**: class-validator
- **Language**: TypeScript

## 项目结构

```
server/
├── src/
│   ├── config/           # 配置文件
│   ├── modules/          # 业务模块
│   │   ├── sys/         # 系统管理
│   │   ├── mch/         # 商户管理
│   │   ├── agent/       # 代理商管理
│   │   ├── trade/       # 交易管理
│   │   ├── finance/     # 财务管理
│   │   ├── channel/     # 渠道管理
│   │   ├── citic/       # 中信银行
│   │   ├── statistics/  # 数据统计
│   │   ├── device/      # 设备管理
│   │   ├── check/       # 对账管理
│   │   └── profit/      # 分账管理
│   ├── common/          # 公共模块
│   │   ├── decorators/ # 装饰器
│   │   ├── filters/     # 异常过滤器
│   │   ├── guards/      # 路由守卫
│   │   ├── interceptors/# 拦截器
│   │   └── middleware/  # 中间件
│   ├── database/        # 数据库
│   │   └── entities/    # 实体
│   └── utils/           # 工具函数
├── package.json
└── tsconfig.json
```

## 快速开始

```bash
# 安装依赖
npm install

# 配置数据库
cp .env.example .env
# 编辑 .env 文件配置数据库连接

# 运行数据库迁移
npm run migration:run

# 启动开发服务器
npm run dev

# 生产环境构建
npm run build

# 生产环境运行
npm run start
```

## API 文档

启动服务后访问: http://localhost:3000/api-docs

## 默认管理员账号

- 用户名: admin
- 密码: admin123
