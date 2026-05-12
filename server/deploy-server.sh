#!/bin/bash
# DGKJ 支付平台 - 阿里云一键部署脚本
# 在服务器上以 root 用户执行

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   DGKJ 支付平台 阿里云一键部署${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 更新系统
echo -e "${GREEN}[1/10] 更新系统...${NC}"
apt update && apt upgrade -y

# 2. 安装基础工具
echo -e "\n${GREEN}[2/10] 安装基础工具...${NC}"
apt install -y curl wget git unzip vim wget ca-certificates lsof net-tools

# 3. 安装 Node.js 18
echo -e "\n${GREEN}[3/10] 安装 Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 4. 安装 MySQL
echo -e "\n${GREEN}[4/10] 安装 MySQL...${NC}"
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql
echo "MySQL 安装完成"

# 5. 安装 Nginx
echo -e "\n${GREEN}[5/10] 安装 Nginx...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx
echo "Nginx 安装完成"

# 6. 配置 MySQL 数据库
echo -e "\n${GREEN}[6/10] 配置 MySQL 数据库...${NC}"
mysql -e "CREATE DATABASE IF NOT EXISTS dgkj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'dgkj'@'localhost' IDENTIFIED BY 'Dgkj@2024';"
mysql -e "CREATE USER IF NOT EXISTS 'dgkj'@'%' IDENTIFIED BY 'Dgkj@2024';"
mysql -e "GRANT ALL PRIVILEGES ON dgkj.* TO 'dgkj'@'localhost';"
mysql -e "GRANT ALL PRIVILEGES ON dgkj.* TO 'dgkj'@'%';"
mysql -e "FLUSH PRIVILEGES;"
echo "数据库创建完成 (dgkj/dgkj@2024)"

# 7. 创建目录结构
echo -e "\n${GREEN}[7/10] 创建目录结构...${NC}"
mkdir -p /www/dgkj/{admin,agent,merchant,member}
mkdir -p /opt/dgkj-server/logs
mkdir -p /www/cert
chmod -R 755 /www
chmod -R 755 /opt
echo "目录创建完成"

# 8. 安装 PM2
echo -e "\n${GREEN}[8/10] 安装 PM2...${NC}"
npm install -g pm2
pm2 install pm2-logrotate
echo "PM2 安装完成"

# 9. 配置防火墙
echo -e "\n${GREEN}[9/10] 配置防火墙...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "防火墙规则配置完成"

# 10. 创建后端目录标记
echo -e "\n${GREEN}[10/10] 创建部署标记文件...${NC}"
cat > /opt/dgkj-server/.env << 'EOF'
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=dgkj
DB_PASSWORD=Dgkj@2024
DB_DATABASE=dgkj
JWT_SECRET=dgkj-secret-key-$(date +%s)
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://dghs.gddogootech.com
EOF
echo "环境变量模板已创建"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   基础环境部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}下一步操作:${NC}"
echo "1. 上传项目代码到 /opt/dgkj-server/"
echo "2. 安装后端依赖: cd /opt/dgkj-server && npm install"
echo "3. 构建后端: npm run build"
echo "4. 启动后端: pm2 start ecosystem.config.js --env production"
echo "5. 构建前端并复制到 /www/dgkj/"
echo "6. 配置 Nginx 多站点"
echo ""
echo -e "${BLUE}数据库信息:${NC}"
echo "  数据库名: dgkj"
echo "  用户名: dgkj"
echo "  密码: Dgkj@2024"
