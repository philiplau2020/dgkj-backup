# DGKJ 支付平台 - 生产环境部署指南

## 更新日期：2026-05-13

---

## 一、环境要求

### 1.1 硬件配置

| 环境 | CPU | 内存 | 磁盘 | 说明 |
|------|-----|------|------|------|
| 开发环境 | 2核 | 4GB | 50GB | 本地开发 |
| 测试环境 | 4核 | 8GB | 100GB | 功能测试 |
| 生产环境 | 8核 | 16GB | 200GB | 正式生产 |

### 1.2 软件要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18.x | 后端运行环境 |
| MySQL | >= 8.0 | 数据库 |
| Redis | >= 6.x | 缓存（可选） |
| RabbitMQ | >= 3.x | 消息队列（可选） |
| Nginx | >= 1.20 | Web 服务器 |
| PM2 | >= 5.x | 进程管理器 |

---

## 二、快速部署

### 2.1 一键部署脚本

```bash
# 下载部署脚本
curl -O https://raw.githubusercontent.com/your-org/dgkj/main/deploy.sh

# 添加执行权限
chmod +x deploy.sh

# 执行部署（需要配置 SSH 密钥）
./deploy.sh prod
```

### 2.2 GitHub Actions 自动部署

推送到 `main` 分支自动触发部署：

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Build Backend
        run: |
          cd server
          npm install
          npm run build
          
      - name: Build Frontend
        run: |
          npm install
          npm run build
          
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: root
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/dgkj-server
            pm2 restart dgkj-server
            cd /www/dgkj/admin
            rm -rf *
            cp -r /tmp/dist/* .
```

---

## 三、手动部署步骤

### 3.1 服务器初始化

```bash
# 1. 更新系统
apt update && apt upgrade -y

# 2. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# 3. 安装 PM2
npm install -g pm2

# 4. 安装 Nginx
apt install -y nginx

# 5. 安装 MySQL
apt install -y mysql-server

# 6. 安装 Redis（可选）
apt install -y redis-server

# 7. 创建目录
mkdir -p /opt/dgkj-server
mkdir -p /www/dgkj/admin
mkdir -p /var/log/dgkj
```

### 3.2 数据库配置

```sql
-- 创建数据库
CREATE DATABASE dgkj_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'dgkj'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON dgkj_prod.* TO 'dgkj'@'%';
FLUSH PRIVILEGES;

-- 导入数据
mysql -u dgkj -p dgkj_prod < backup.sql
```

### 3.3 后端部署

```bash
# 1. 上传代码
scp -r server/ root@your-server:/opt/dgkj-server/

# 2. 安装依赖
cd /opt/dgkj-server
npm install --production

# 3. 配置环境变量
cat > .env << EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=dgkj
DATABASE_PASSWORD=your_password
DATABASE_NAME=dgkj_prod
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=https://dghs.gddogootech.com
EOF

# 4. 构建
npm run build

# 5. 启动服务
pm2 start dist/index.js --name dgkj-server

# 6. 保存进程列表
pm2 save

# 7. 设置开机自启
pm2 startup
```

### 3.4 Nginx 配置

```nginx
# /etc/nginx/sites-available/dgkj-admin

server {
    listen 80;
    server_name dghs.gddogootech.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dghs.gddogootech.com;
    
    # SSL 配置
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    
    # 前端静态文件
    root /www/dgkj/admin;
    index index.html;
    
    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # API 代理
    location /basic-api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API 文档
    location /api-docs/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
    }
    
    # 日志
    access_log /var/log/nginx/dgkj-admin.access.log;
    error_log /var/log/nginx/dgkj-admin.error.log;
}

# 重启 Nginx
nginx -t && nginx -s reload
```

### 3.5 前端部署

```bash
# 1. 配置环境变量
cat > .env.production << EOF
VITE_USE_MOCK=false
VITE_GLOB_APP_TITLE=DGKJ支付平台
VITE_GLOB_API_URL=https://dghs.gddogootech.com
VITE_GLOB_API_URL_PREFIX=
EOF

# 2. 构建
npm install
npm run build

# 3. 上传到服务器
scp -r dist/* root@your-server:/www/dgkj/admin/
```

---

## 四、PM2 进程管理

### 4.1 常用命令

```bash
# 查看进程状态
pm2 list

# 查看日志
pm2 logs dgkj-server --lines 50

# 重启服务
pm2 restart dgkj-server

# 重新加载（零停机）
pm2 reload dgkj-server

# 停止服务
pm2 stop dgkj-server

# 删除进程
pm2 delete dgkj-server

# 监控面板
pm2 monit
```

### 4.2 PM2 配置文件

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'dgkj-server',
      script: 'dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/dgkj/server-error.log',
      out_file: '/var/log/dgkj/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
    },
  ],
};
```

---

## 五、Docker 部署（可选）

### 5.1 Dockerfile

```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 5.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
  
  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
  
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: dgkj
    volumes:
      - mysql_data:/var/lib/mysql
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

---

## 六、Kubernetes 部署（可选）

### 6.1 部署清单

```yaml
# server-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dgkj-server
  namespace: dgkj
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dgkj-server
  template:
    metadata:
      labels:
        app: dgkj-server
    spec:
      containers:
        - name: server
          image: your-registry/dgkj-server:v1.0.0
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: DATABASE_HOST
              valueFrom:
                configMapKeyRef:
                  name: dgkj-config
                  key: database.host
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: dgkj-server-svc
  namespace: dgkj
spec:
  selector:
    app: dgkj-server
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: dgkj-server-hpa
  namespace: dgkj
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: dgkj-server
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## 七、监控配置

### 7.1 Prometheus 配置

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'dgkj-server'
    static_configs:
      - targets: ['dgkj-server-svc:80']
    metrics_path: '/basic-api/monitor/metrics'
```

### 7.2 Grafana 看板

导入预置的 DGKJ 看板 JSON 配置。

---

## 八、备份与恢复

### 8.1 数据库备份

```bash
# 每天凌晨 3 点执行备份
0 3 * * * mysqldump -u dgkj -p dgkj_prod > /var/backup/dgkj_$(date +\%Y\%m\%d).sql

# 压缩备份
0 3 * * * mysqldump -u dgkj -p dgkj_prod | gzip > /var/backup/dgkj_$(date +\%Y\%m\%d).sql.gz

# 保留 30 天备份
0 4 * * * find /var/backup -name "dgkj_*.sql.gz" -mtime +30 -delete
```

### 8.2 数据恢复

```bash
# 解压备份
gunzip dgkj_20240101.sql.gz

# 恢复数据
mysql -u dgkj -p dgkj_prod < dgkj_20240101.sql
```

---

## 九、安全配置

### 9.1 防火墙配置

```bash
# 开放必要端口
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# 启用防火墙
ufw enable
```

### 9.2 SSL 证书（Let's Encrypt）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d dghs.gddogootech.com

# 自动续期
certbot renew --dry-run
```

### 9.3 安全 Headers

```nginx
# Nginx 配置添加
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

---

## 十、故障排查

### 10.1 服务无法启动

```bash
# 查看日志
pm2 logs dgkj-server --lines 100

# 检查端口占用
netstat -tlnp | grep 3000

# 检查环境变量
cat /opt/dgkj-server/.env
```

### 10.2 数据库连接失败

```bash
# 测试数据库连接
mysql -u dgkj -p -h localhost

# 检查连接数
mysql -u root -p -e "SHOW PROCESSLIST;"
```

### 10.3 前端 502 Bad Gateway

```bash
# 检查后端是否运行
pm2 list

# 检查 Nginx 日志
tail -f /var/log/nginx/dgkj-admin.error.log

# 重启 Nginx
nginx -s reload
```

---

## 十一、部署检查清单

部署完成后，验证以下项目：

- [ ] 服务启动成功：`pm2 list`
- [ ] 健康检查通过：`curl https://dghs.gddogootech.com/health`
- [ ] 登录功能正常
- [ ] 所有菜单页面可访问
- [ ] API 请求正常（检查 Network 面板）
- [ ] 错误日志无异常
