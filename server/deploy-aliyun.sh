#!/bin/bash
# ========================================
# DGKJ 支付平台 - 阿里云一键部署脚本
# 服务器: 120.78.7.180
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   DGKJ 支付平台 阿里云部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}服务器: 120.78.7.180${NC}"
echo ""

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 sudo 或 root 账户运行此脚本${NC}"
    exit 1
fi

# 1. 更新系统并安装基础工具
echo -e "\n${GREEN}[1/10] 更新系统并安装基础工具...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git unzip vim wget ca-certificates

# 2. 安装 Node.js 18
echo -e "\n${GREEN}[2/10] 安装 Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi
echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 3. 安装 MySQL
echo -e "\n${GREEN}[3/10] 安装 MySQL...${NC}"
if ! command -v mysql &> /dev/null; then
    apt install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
fi

# 4. 安装 Nginx
echo -e "\n${GREEN}[4/10] 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi

# 5. 配置 MySQL 数据库
echo -e "\n${GREEN}[5/10] 配置 MySQL 数据库...${NC}"
mysql -e "CREATE DATABASE IF NOT EXISTS dgkj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'dgkj'@'localhost' IDENTIFIED BY 'Dgkj@2024';"
mysql -e "CREATE USER IF NOT EXISTS 'dgkj'@'%' IDENTIFIED BY 'Dgkj@2024';"
mysql -e "GRANT ALL PRIVILEGES ON dgkj.* TO 'dgkj'@'localhost';"
mysql -e "GRANT ALL PRIVILEGES ON dgkj.* TO 'dgkj'@'%';"
mysql -e "FLUSH PRIVILEGES;"
echo "数据库配置完成"

# 6. 创建目录结构
echo -e "\n${GREEN}[6/10] 创建目录结构...${NC}"
mkdir -p /www/dgkj/{admin,agent,merchant,member}
mkdir -p /opt/dgkj-server/logs
mkdir -p /www/cert
echo "目录创建完成"

# 7. 初始化数据库表
echo -e "\n${GREEN}[7/10] 初始化数据库表...${NC}"
# 等待项目代码复制后再执行

# 8. 复制项目代码到服务器
echo -e "\n${GREEN}[8/10] 复制项目代码...${NC}"
echo -e "${YELLOW}请将本地项目代码复制到服务器:${NC}"
echo "  - 后端代码: /opt/dgkj-server/"
echo "  - 前端代码: /www/dgkj/admin/, /www/dgkj/agent/, /www/dgkj/merchant/, /www/dgkj/member/"
echo ""
echo -e "${YELLOW}或者使用以下命令下载代码:${NC}"
echo "  git clone <your-repo-url> /tmp/dgkj"
echo "  cp -r /tmp/dgkj/server /opt/"
echo "  cp -r /tmp/dgkj/admin/dist /www/dgkj/admin/"
echo "  cp -r /tmp/dgkj/agent/dist /www/dgkj/agent/"
echo "  cp -r /tmp/dgkj/merchant/dist /www/dgkj/merchant/"
echo "  cp -r /tmp/dgkj/member/dist /www/dgkj/member/"

# 9. 安装 PM2
echo -e "\n${GREEN}[9/10] 安装 PM2...${NC}"
npm install -g pm2
pm2 install pm2-logrotate

# 10. 创建 Nginx 配置
echo -e "\n${GREEN}[10/10] 创建 Nginx 多站点配置...${NC}"

# 运营后台
cat > /etc/nginx/sites-available/dgkj-admin << 'EOF'
server {
    listen 80;
    server_name dghs.gddogootech.com;
    
    root /www/dgkj/admin;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    access_log /var/log/nginx/dgkj-admin.access.log;
    error_log /var/log/nginx/dgkj-admin.error.log;
}
EOF

# 代理后台
cat > /etc/nginx/sites-available/dgkj-agent << 'EOF'
server {
    listen 80;
    server_name agent.gddogootech.com;
    
    root /www/dgkj/agent;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    access_log /var/log/nginx/dgkj-agent.access.log;
    error_log /var/log/nginx/dgkj-agent.error.log;
}
EOF

# 商家后台
cat > /etc/nginx/sites-available/dgkj-merchant << 'EOF'
server {
    listen 80;
    server_name merchant.gddogootech.com;
    
    root /www/dgkj/merchant;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    access_log /var/log/nginx/dgkj-merchant.access.log;
    error_log /var/log/nginx/dgkj-merchant.error.log;
}
EOF

# 会员H5
cat > /etc/nginx/sites-available/dgkj-member << 'EOF'
server {
    listen 80;
    server_name member.gddogootech.com;
    
    root /www/dgkj/member;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    access_log /var/log/nginx/dgkj-member.access.log;
    error_log /var/log/nginx/dgkj-member.error.log;
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/dgkj-admin /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/dgkj-agent /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/dgkj-merchant /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/dgkj-member /etc/nginx/sites-enabled/

# 移除默认站点
rm -f /etc/nginx/sites-enabled/default

# 测试并重载 Nginx
nginx -t
systemctl reload nginx

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   基础环境部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}下一步操作:${NC}"
echo "1. 复制项目代码到 /opt/dgkj-server 和 /www/dgkj/"
echo "2. 配置后端环境变量: /opt/dgkj-server/.env"
echo "3. 安装后端依赖并启动: cd /opt/dgkj-server && npm install && npm run build"
echo "4. 使用 PM2 启动后端: pm2 start ecosystem.config.js"
echo "5. 构建前端各端并复制到对应目录"
echo ""
echo -e "${YELLOW}后端环境变量示例 (.env):${NC}"
cat << 'ENVEXAMPLE'
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=dgkj
DB_PASSWORD=Dgkj@2024
DB_DATABASE=dgkj
JWT_SECRET=dgkj-secret-key-2024-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://dghs.gddogootech.com
ENVEXAMPLE
