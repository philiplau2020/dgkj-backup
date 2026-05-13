#!/bin/bash
# ============================================================
# DGKJ 一键修复 + 部署脚本
# 适用: 阿里云服务器 120.78.7.180
# 域名: dghs.gddogootech.com
# ============================================================

set -e

echo "============================================"
echo "DGKJ 一键修复部署 $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

# ---- 0. 变量 ----
SERVER_IP="120.78.7.180"
DOMAIN="dghs.gddogootech.com"
ADMIN_DIR="/www/dgkj/admin"
BACKEND_DIR="/opt/dgkj-server"
NGINX_CONF="/etc/nginx/sites-available/dgkj-admin"
NGINX_ENABLED="/etc/nginx/sites-enabled/dgkj-admin"
DB_NAME="dgkj"
DB_USER="dgkj"
DB_PASS="Dgkj@2024"

# ---- 1. 检查 root 权限 ----
if [ "$EUID" -ne 0 ]; then
  echo "[ERROR] 请用 root 权限运行: sudo bash deploy-fix.sh"
  exit 1
fi

echo ""
echo "[1/7] 检查目录结构..."
mkdir -p "$ADMIN_DIR"
mkdir -p "$BACKEND_DIR/logs"
mkdir -p /www/cert

# ---- 2. 数据库检查 + 初始化 ----
echo ""
echo "[2/7] 检查数据库..."
if ! command -v mysql &> /dev/null; then
  echo "[WARN] MySQL 未安装，跳过数据库步骤"
else
  # 创建数据库和用户
  mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
  mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASS';"
  mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
  mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';"
  mysql -e "FLUSH PRIVILEGES;"
  echo "[OK] 数据库已就绪"
fi

# ---- 3. 后端环境变量 ----
echo ""
echo "[3/7] 配置后端环境变量..."
cat > "$BACKEND_DIR/.env" << 'EOF'
NODE_ENV=production
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=dgkj
DB_PASSWORD=Dgkj@2024
DB_DATABASE=dgkj
JWT_SECRET=dgkj-super-jwt-secret-2024-prod
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://dghs.gddogootech.com
EOF
echo "[OK] .env 已写入"

# ---- 4. 安装/重建后端 ----
echo ""
echo "[4/7] 重建后端 (server/)..."
if [ -d "/root/DGKJ/server" ]; then
  echo "  发现本地 server 源码，开始构建..."
  cd /root/DGKJ/server
  npm install
  npm run build
  echo "  复制构建产物到 $BACKEND_DIR"
  cp -r dist "$BACKEND_DIR/"
  cp -r package.json "$BACKEND_DIR/"
  cp -r package-lock.json "$BACKEND_DIR/"
else
  echo "  [WARN] 未找到 /root/DGKJ/server，跳过后端重建"
  echo "  请确保 $BACKEND_DIR/dist/index.js 已存在"
fi

# ---- 5. PM2 启动后端 ----
echo ""
echo "[5/7] 启动/重启后端服务..."
if ! command -v pm2 &> /dev/null; then
  echo "  安装 PM2..."
  npm install -g pm2
fi

# 检查后端 dist 是否存在
if [ ! -f "$BACKEND_DIR/dist/index.js" ]; then
  echo "[ERROR] 后端未构建: $BACKEND_DIR/dist/index.js 不存在"
  echo "  请先在本地构建: cd D:\\DGKJ\\server && npm run build"
  echo "  然后上传: scp -r D:\\DGKJ\\server\\* root@$SERVER_IP:/root/DGKJ/server"
  exit 1
fi

cd "$BACKEND_DIR"
npm ci --omit=dev --silent 2>/dev/null || npm install --omit=dev --silent 2>/dev/null || true

pm2 delete dgkj-server 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "  PM2 状态:"
pm2 status

# ---- 6. 部署前端 ----
echo ""
echo "[6/7] 部署前端静态文件..."
if [ ! -d "D:/DGKJ/dist" ]; then
  echo "[WARN] 未在本地找到 dist 目录"
  echo "  请先在本地执行: cd D:\\DGKJ && pnpm build"
  echo "  然后上传: scp -r D:\\DGKJ\\dist\\* root@$SERVER_IP:$ADMIN_DIR/"
else
  cp -r D:/DGKJ/dist/* "$ADMIN_DIR/"
  echo "[OK] 前端已部署到 $ADMIN_DIR"
fi

# ---- 7. Nginx 配置 (HTTP 模式，无 SSL) ----
echo ""
echo "[7/7] 配置 Nginx (HTTP 模式)..."

cat > "$NGINX_CONF" << 'EOF'
# DGKJ 支付平台 - Nginx 配置
# HTTP 模式，不强制跳转 HTTPS

server {
    listen 80;
    server_name dghs.gddogootech.com;

    root /www/dgkj/admin;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/json application/javascript;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /basic-api/ {
        proxy_pass http://127.0.0.1:3000/basic-api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Swagger
    location /api-docs/ {
        proxy_pass http://127.0.0.1:3000/api-docs/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 文件上传
    location /upload/ {
        proxy_pass http://127.0.0.1:3000/upload/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 100M;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    access_log /var/log/nginx/dgkj-admin.access.log;
    error_log /var/log/nginx/dgkj-admin.error.log;
}
EOF

# 启用站点
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
rm -f /etc/nginx/sites-enabled/default

# 测试 + 重载
nginx -t && systemctl reload nginx
echo "[OK] Nginx 已重载"

# ---- 完成 ----
echo ""
echo "============================================"
echo "部署完成!"
echo "============================================"
echo ""
echo "验证命令:"
echo "  curl http://127.0.0.1:3000/health"
echo "  curl http://127.0.0.1:3000/basic-api/auth/login -X POST -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"admin123\"}'"
echo ""
echo "访问地址:"
echo "  http://dghs.gddogootech.com"
echo "  用户名: admin  密码: admin123"
echo ""
echo "PM2 日志: pm2 logs dgkj-server --lines 50"
echo "Nginx 日志: tail -f /var/log/nginx/dgkj-admin.access.log"
echo ""
