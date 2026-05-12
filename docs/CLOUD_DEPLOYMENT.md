# DGKJ 支付平台 - 云服务器部署指南

## 一、环境要求

- Node.js 18+
- MySQL 8.0+
- Nginx
- PM2 (进程管理器)

## 二、部署步骤

### 1. 服务器环境准备

```bash
# 更新系统
apt update && apt upgrade -y

# 安装基础工具
apt install -y curl wget git unzip vim wget ca-certificates

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node -v  # 应显示 v18.x.x

# 安装 MySQL
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

# 安装 Nginx
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# 安装 PM2
npm install -g pm2
```

### 2. 数据库配置

```bash
# 登录 MySQL
mysql -u root -p

# 执行以下 SQL
CREATE DATABASE IF NOT EXISTS dgkj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'dgkj'@'localhost' IDENTIFIED BY 'Dgkj@2024';
CREATE USER IF NOT EXISTS 'dgkj'@'%' IDENTIFIED BY 'Dgkj@2024';
GRANT ALL PRIVILEGES ON dgkj.* TO 'dgkj'@'localhost';
GRANT ALL PRIVILEGES ON dgkj.* TO 'dgkj'@'%';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 创建目录结构

```bash
mkdir -p /www/dgkj/admin
mkdir -p /opt/dgkj-server/logs
mkdir -p /www/cert
```

### 4. 后端部署

```bash
# 进入后端目录
cd /opt/dgkj-server

# 创建环境变量文件
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=dgkj
DB_PASSWORD=Dgkj@2024
DB_DATABASE=dgkj
JWT_SECRET=your-super-secure-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://dghs.gddogootech.com
EOF

# 安装依赖
npm install

# 构建
npm run build

# 使用 PM2 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. 前端部署

```bash
# 在本地项目根目录执行
cd d:\DGKJ

# 构建生产版本
npm run build

# 将构建产物上传到服务器
scp -r dist/* root@120.78.7.180:/www/dgkj/admin/
```

### 6. Nginx 配置

```bash
# 复制 Nginx 配置
cp /path/to/server/nginx-cloud.conf /etc/nginx/sites-available/dgkj-admin

# 启用站点
ln -sf /etc/nginx/sites-available/dgkj-admin /etc/nginx/sites-enabled/

# 移除默认站点
rm -f /etc/nginx/sites-enabled/default

# 测试并重载
nginx -t
systemctl reload nginx
```

## 三、验证部署

### 1. 检查后端服务

```bash
# 检查 PM2 状态
pm2 status

# 检查后端日志
pm2 logs dgkj-server --lines 50

# 测试 API
curl http://localhost:3000/health
```

### 2. 检查前端访问

```
浏览器访问: http://dghs.gddogootech.com
```

### 3. 测试登录

```
用户名: admin
密码: admin123
```

## 四、常见问题排查

### 1. 后端无法启动

```bash
# 检查端口占用
lsof -i:3000

# 查看错误日志
pm2 logs dgkj-server --err
```

### 2. 数据库连接失败

```bash
# 测试数据库连接
mysql -u dgkj -p -h localhost dgkj
```

### 3. 前端 404 错误

```bash
# 检查 Nginx 日志
tail -f /var/log/nginx/dgkj-admin.error.log

# 检查文件权限
ls -la /www/dgkj/admin/
```

### 4. API 请求 404

```bash
# 检查 Nginx 代理配置
tail -f /var/log/nginx/dgkj-admin.access.log

# 检查后端路由
curl http://localhost:3000/basic-api/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
```

## 五、维护命令

```bash
# 重启后端
pm2 restart dgkj-server

# 重载 Nginx
nginx -t && systemctl reload nginx

# 查看 PM2 日志
pm2 logs dgkj-server

# 监控资源使用
pm2 monit
```

## 六、API 接口说明

后端 API 统一使用 `/basic-api` 前缀：

| 模块 | 接口前缀 | 示例 |
|------|---------|------|
| 认证 | `/basic-api/login` | POST /basic-api/login |
| 用户信息 | `/basic-api/getUserInfo` | GET /basic-api/getUserInfo |
| 系统管理 | `/basic-api/sys/*` | GET /basic-api/sys/user/list |
| 商户管理 | `/basic-api/mch/*` | GET /basic-api/mch/list |
| 交易管理 | `/basic-api/trade/*` | GET /basic-api/trade/order/list |
| 财务管理 | `/basic-api/finance/*` | GET /basic-api/finance/account/list |
| 通道管理 | `/basic-api/channel/*` | GET /basic-api/channel/channel/list |
| 统计管理 | `/basic-api/statistics/*` | GET /basic-api/statistics/dashboard |
