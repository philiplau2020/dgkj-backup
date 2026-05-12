#!/bin/bash

# ========================================
# DGKJ 支付平台部署脚本
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   DGKJ 支付平台 部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 1. 检查必要工具
echo -e "\n${YELLOW}[1/8] 检查必要工具...${NC}"

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}错误: $1 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ $1 已安装${NC}"
}

check_command node
check_command npm
check_command mysql

echo -e "\n${YELLOW}[2/8] 更新服务器...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. 安装 Node.js (如果需要)
echo -e "\n${YELLOW}[3/8] 安装 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi
node --version
npm --version

# 3. 安装 PM2
echo -e "\n${YELLOW}[4/8] 安装 PM2...${NC}"
sudo npm install -g pm2

# 4. 创建目录
echo -e "\n${YELLOW}[5/8] 创建目录...${NC}"
sudo mkdir -p /var/www/dgkj
sudo mkdir -p /var/log/nginx
sudo mkdir -p /opt/dgkj-server/logs

# 5. 配置数据库
echo -e "\n${YELLOW}[6/8] 配置数据库...${NC}"
echo -e "${YELLOW}请输入 MySQL 连接信息:${NC}"
read -p "MySQL 主机 [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}
read -p "MySQL 端口 [3306]: " DB_PORT
DB_PORT=${DB_PORT:-3306}
read -p "MySQL 用户名 [root]: " DB_USER
DB_USER=${DB_USER:-root}
read -p "MySQL 密码: " DB_PASS
read -p "数据库名 [dgkj]: " DB_NAME
DB_NAME=${DB_NAME:-dgkj}

# 创建数据库
mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASS -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 6. 配置后端
echo -e "\n${YELLOW}[7/8] 配置后端...${NC}"
cd /opt/dgkj-server

# 复制环境变量文件
sudo cp .env.production .env

# 更新环境变量
sudo sed -i "s/your-mysql-host/$DB_HOST/g" .env
sudo sed -i "s/3306/$DB_PORT/g" .env
sudo sed -i "s/your-mysql-username/$DB_USER/g" .env
sudo sed -i "s/your-mysql-password/$DB_PASS/g" .env
sudo sed -i "s/dgkj/$DB_NAME/g" .env

# 安装依赖并构建
sudo npm install
sudo npm run build

# 使用 PM2 启动
sudo pm2 start ecosystem.config.js --env production
sudo pm2 save

# 7. 配置前端
echo -e "\n${YELLOW}[8/8] 配置前端...${NC}"
cd /var/www/dgkj

# 构建前端
sudo npm install
sudo npm run build

# 复制构建产物
sudo cp -r dist/* /var/www/dgkj/

# 配置 Nginx
sudo cp /opt/dgkj-server/nginx.conf /etc/nginx/sites-available/dgkj
sudo ln -sf /etc/nginx/sites-available/dgkj /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 设置权限
sudo chown -R www-data:www-data /var/www/dgkj

# 完成
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}访问地址:${NC}"
echo -e "  前端: http://your-server-ip"
echo -e "  后端API: http://your-server-ip/api"
echo -e "  API文档: http://your-server-ip/api-docs"
echo -e "\n${YELLOW}管理命令:${NC}"
echo -e "  重启后端: sudo pm2 restart dgkj-server"
echo -e "  查看日志: sudo pm2 logs dgkj-server"
echo -e "  查看状态: sudo pm2 status"
