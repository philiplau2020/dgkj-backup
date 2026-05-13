#!/bin/bash
# ============================================================
# DGKJ 服务器端一键修复 (精简版)
# 适用于: 后端源码已在 /root/DGKJ/server
#         前端 dist 已上传到 /www/dgkj/admin
# ============================================================

set -e

echo "============================================"
echo "DGKJ 服务器端修复 $(date)"
echo "============================================"

if [ "$EUID" -ne 0 ]; then
  echo "[ERROR] 请用 root 权限运行: sudo bash server-fix.sh"
  exit 1
fi

echo ""
echo "[1/5] 修复 Nginx 配置 (HTTP, 不跳转 HTTPS)..."
cat > /etc/nginx/sites-available/dgkj-admin << 'EOF'
server {
    listen 80;
    server_name dghs.gddogootech.com;

    root /www/dgkj/admin;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/json application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

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

    location /api-docs/ {
        proxy_pass http://127.0.0.1:3000/api-docs/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /upload/ {
        proxy_pass http://127.0.0.1:3000/upload/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 100M;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    access_log /var/log/nginx/dgkj-admin.access.log;
    error_log /var/log/nginx/dgkj-admin.error.log;
}
EOF

ln -sf /etc/nginx/sites-available/dgkj-admin /etc/nginx/sites-enabled/dgkj-admin
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "[OK] Nginx 已修复并重载"

echo ""
echo "[2/5] 配置后端环境变量..."
mkdir -p /opt/dgkj-server/logs
cat > /opt/dgkj-server/.env << 'EOF'
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

echo ""
echo "[3/5] 重建后端 (backend routes 修复后)..."
cd /opt/dgkj-server
npm install --omit=dev --silent 2>/dev/null || npm install
npm run build
echo "[OK] 后端已重建"

echo ""
echo "[4/5] 重启 PM2..."
pm2 delete dgkj-server 2>/dev/null || true
cd /opt/dgkj-server
pm2 start ecosystem.config.js
pm2 save
pm2 startup
echo "[OK] PM2 已重启"
pm2 status

echo ""
echo "[5/5] 验证..."
echo ""
echo "  后端健康检查:"
curl -s http://127.0.0.1:3000/health || echo "  [FAIL] 后端未响应，查看: pm2 logs dgkj-server"
echo ""
echo "  登录接口测试:"
curl -s -X POST http://127.0.0.1:3000/basic-api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' || echo "  [FAIL] 登录接口失败"

echo ""
echo "============================================"
echo "修复完成!"
echo "============================================"
echo ""
echo "访问: http://dghs.gddogootech.com"
echo "账号: admin / admin123"
echo ""
echo "PM2 日志: pm2 logs dgkj-server --lines 30"
echo "Nginx 错误: tail -f /var/log/nginx/dgkj-admin.error.log"
echo ""
