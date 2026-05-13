# DGKJ 支付平台 - 生产环境部署指南

## 一、部署架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          用户浏览器                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ HTTPS (443)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Nginx 反向代理                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   静态资源    │  │  /basic-api  │  │    /api-docs         │  │
│  │   /www/dgkj  │  │  → 3000端口  │  │    → 3000端口        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ HTTP (3000)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Node.js 后端服务                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Express + TypeORM + MySQL                                 │ │
│  │  - /basic-api/* 支付 API                                  │ │
│  │  - /basic-api/* 管理 API                                  │ │
│  │  - /basic-api/* 监控 API                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ MySQL (3306)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MySQL 8.0 数据库                           │
│  - dgkj 数据库                                                   │
│  - 46张业务表                                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 二、快速部署

### 方式一：一键部署 (推荐用于新服务器)

```bash
# 1. 连接到服务器
ssh root@120.78.7.180

# 2. 创建并执行部署脚本
cat > /tmp/deploy.sh << 'SCRIPT'
# 在此粘贴 deploy-production.sh 的内容
SCRIPT

chmod +x /tmp/deploy.sh
/tmp/deploy.sh
```

### 方式二：手动部署

#### 1. 安装环境

```bash
# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
npm install -g pnpm pm2

# 安装 MySQL
apt-get install -y mysql-server
systemctl start mysql
systemctl enable mysql

# 安装 Nginx
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
```

#### 2. 配置 MySQL

```bash
# 登录 MySQL
mysql

# 执行以下 SQL
CREATE DATABASE IF NOT EXISTS dgkj DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'dgkj'@'localhost' IDENTIFIED BY 'Dgkj@2024';
GRANT ALL PRIVILEGES ON dgkj.* TO 'dgkj'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. 上传并配置后端

```bash
# 创建目录
mkdir -p /opt/dgkj-server/{src,dist,logs}
mkdir -p /www/dgkj/admin

# 上传项目 (使用 scp 或 git clone)
cd /opt/dgkj-server

# 创建 .env.production
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=dgkj
DB_PASSWORD=Dgkj@2024
DB_DATABASE=dgkj

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://dghs.gddogootech.com

# 微信支付配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_MCH_ID=your_mch_id
WECHAT_API_KEY=your_api_key

# 支付宝配置
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key

# 中信银行配置
CITIC_PLATFORM_ID=your_platform_id
CITIC_APP_ID=your_app_id
CITIC_APP_SECRET=your_app_secret

PAY_CALLBACK_URL=https://dghs.gddogootech.com
EOF

# 安装依赖并构建
pnpm install
npx tsc -p server/tsconfig.json

# 初始化数据库
cd server
npx ts-node src/database/migrate.ts
```

#### 4. 配置 PM2

```bash
cat > /opt/dgkj-server/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'dgkj-server',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/opt/dgkj-server/logs/error.log',
    out_file: '/opt/dgkj-server/logs/out.log',
    max_memory_restart: '1G',
    autorestart: true,
  }],
};
EOF

pm2 start /opt/dgkj-server/ecosystem.config.js
pm2 save
pm2 startup
```

#### 5. 部署前端

```bash
# 在本地执行构建
cd dgkj
pnpm install
pnpm build

# 上传到服务器
scp -r dist/* root@120.78.7.180:/www/dgkj/admin/
```

#### 6. 配置 Nginx

```bash
cat > /etc/nginx/sites-available/dgkj-admin << 'EOF'
server {
    listen 80;
    server_name dghs.gddogootech.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dghs.gddogootech.com;

    ssl_certificate /www/dgkj/certs/cert.pem;
    ssl_certificate_key /www/dgkj/certs/key.pem;

    root /www/dgkj/admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /basic-api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

ln -sf /etc/nginx/sites-available/dgkj-admin /etc/nginx/sites-enabled/
nginx -t && nginx -s reload
```

## 三、部署后配置

### 1. 配置 SSL 证书

#### 使用 Let's Encrypt (推荐)

```bash
# 安装 certbot
apt-get install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d dghs.gddogootech.com

# 自动续期测试
certbot renew --dry-run
```

#### 手动配置证书

```bash
# 将证书文件复制到服务器
scp cert.pem root@120.78.7.180:/www/dgkj/certs/
scp key.pem root@120.78.7.180:/www/dgkj/certs/

# 设置权限
chmod 600 /www/dgkj/certs/key.pem
```

### 2. 配置支付通道

登录管理后台，进入「系统管理 > 通道配置」，配置：

- **微信支付**: AppID、商户号、API密钥
- **支付宝**: AppID、私钥、公钥
- **中信银行**: 平台ID、应用ID、应用密钥

### 3. 配置短信/邮件

进入「系统管理 > 通知配置」：

- **短信**: 配置阿里云/腾讯云短信 AccessKey
- **邮件**: 配置 SMTP 服务器信息

## 四、日常运维

### 查看服务状态

```bash
# 查看所有服务状态
pm2 status

# 查看后端日志
pm2 logs dgkj-server --lines 100

# 查看 Nginx 状态
systemctl status nginx

# 查看 MySQL 状态
systemctl status mysql
```

### 重启服务

```bash
# 重启后端
pm2 restart dgkj-server

# 重启 Nginx
nginx -s reload

# 重启 MySQL
systemctl restart mysql
```

### 备份数据库

```bash
# 创建备份目录
mkdir -p /opt/backups/dgkj

# 备份数据库
mysqldump -udgkj -pDgkj@2024 dgkj > /opt/backups/dgkj/backup_$(date +%Y%m%d).sql

# 压缩备份
gzip /opt/backups/dgkj/backup_$(date +%Y%m%d).sql

# 删除7天前的备份
find /opt/backups/dgkj -name "*.sql.gz" -mtime +7 -delete
```

### 查看日志

```bash
# 后端日志
pm2 logs dgkj-server --lines 200

# Nginx 访问日志
tail -f /var/log/nginx/dgkj-admin.access.log

# Nginx 错误日志
tail -f /var/log/nginx/dgkj-admin.error.log
```

## 五、故障排查

### 后端无法启动

```bash
# 检查端口占用
lsof -i:3000

# 检查配置文件
cat /opt/dgkj-server/.env

# 查看详细错误
pm2 logs dgkj-server --err --lines 50
```

### 前端 502 Bad Gateway

```bash
# 检查后端是否运行
pm2 status

# 检查 Nginx 日志
tail -f /var/log/nginx/error.log

# 重启后端
pm2 restart dgkj-server
```

### 数据库连接失败

```bash
# 检查 MySQL
systemctl status mysql

# 测试连接
mysql -udgkj -pDgkj@2024 dgkj

# 检查后端配置
grep DB_ /opt/dgkj-server/.env
```

## 六、性能优化

### 启用 Redis 缓存 (可选)

```bash
# 安装 Redis
apt-get install -y redis-server
systemctl start redis-server

# 在 .env 中添加
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 启用 PM2 集群模式

```bash
# 修改 ecosystem.config.js
cat > /opt/dgkj-server/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'dgkj-server',
    script: 'dist/index.js',
    instances: 'max',  // 使用所有 CPU 核心
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
EOF

pm2 restart dgkj-server
```

## 七、安全建议

1. **修改默认密码**: 首次登录后立即修改 admin 密码
2. **配置防火墙**: 只开放 22, 80, 443 端口
3. **禁用 MySQL 远程访问**: 设置 `bind-address = 127.0.0.1`
4. **定期更新**: 保持 Node.js 和依赖包最新
5. **启用 SSL**: 使用 HTTPS 加密传输
6. **备份**: 定期备份数据库和重要文件

## 八、联系方式

如有问题，请检查：

- 后端日志: `pm2 logs dgkj-server`
- Nginx 日志: `/var/log/nginx/`
- MySQL 日志: `/var/log/mysql/`
