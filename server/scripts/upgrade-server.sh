#!/bin/bash
# DGKJ 支付平台 - 服务器升级脚本
# 在服务器上执行此脚本

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 项目路径
PROJECT_ROOT="/opt/dgkj-server"
BACKUP_DIR="/tmp/dgkj_backup"

log_info "开始升级 DGKJ 支付平台..."

# 1. 备份当前版本
log_info "1. 备份当前版本..."
mkdir -p $BACKUP_DIR
if [ -d "$PROJECT_ROOT/dist" ]; then
    BACKUP_FILE="$BACKUP_DIR/dist_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf $BACKUP_FILE -C $PROJECT_ROOT dist
    log_info "备份已保存: $BACKUP_FILE"
fi

# 2. 清理旧文件
log_info "2. 清理旧文件..."
rm -rf $PROJECT_ROOT/dist/*
rm -rf /www/dgkj/admin/*
rm -rf /tmp/frontend.zip /tmp/backend.zip

# 3. 上传新版本 (在本地执行)
log_info "3. 请在本地执行以下命令上传文件:"
log_info "   scp backend.zip root@120.78.7.180:/tmp/"
log_info "   scp frontend.zip root@120.78.7.180:/tmp/"

# 4. 解压后端
if [ -f /tmp/backend.zip ]; then
    log_info "4. 解压后端..."
    unzip -o /tmp/backend.zip -d $PROJECT_ROOT/dist/
    log_info "后端解压完成"
fi

# 5. 解压前端
if [ -f /tmp/frontend.zip ]; then
    log_info "5. 解压前端..."
    unzip -o /tmp/frontend.zip -d /www/dgkj/admin/
    log_info "前端解压完成"
fi

# 6. 设置权限
log_info "6. 设置权限..."
chown -R www-data:www-data /www/dgkj/admin
chmod -R 755 /www/dgkj/admin

# 7. 重启服务
log_info "7. 重启后端服务..."
cd $PROJECT_ROOT
pm2 restart dgkj-server || pm2 start ecosystem.config.js --env production
pm2 save

# 8. 健康检查
log_info "8. 健康检查..."
sleep 3
curl -s http://localhost:3000/health

# 9. 清理临时文件
log_info "9. 清理临时文件..."
rm -f /tmp/frontend.zip /tmp/backend.zip

# 10. 显示状态
log_info "10. 服务状态:"
pm2 status

echo ""
echo "=============================================="
log_info "升级完成!"
echo "=============================================="
echo ""
log_info "访问地址: https://dghs.gddogootech.com"
echo ""
