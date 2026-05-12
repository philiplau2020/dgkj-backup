#!/bin/bash
# ========================================
# DGKJ 支付平台 - 一键部署脚本 (本地执行)
# ========================================
# 将本地构建的代码同步到服务器并验证

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVER_HOST="120.78.7.180"
SERVER_USER="root"
SERVER_PATH="/opt/dgkj-server"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   DGKJ 一键部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"

pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
info() { echo -e "${YELLOW}→ $1${NC}"; }

# 1. 本地构建
echo -e "\n${YELLOW}[1/5] 本地构建后端...${NC}"
cd "$(dirname "$0")/.."
npm run build
pass "后端构建完成"

# 2. 上传代码
echo -e "\n${YELLOW}[2/5] 上传代码到服务器...${NC}"
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='*.log' \
  -e "ssh -o StrictHostKeyChecking=no" \
  ./ \
  $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
pass "代码上传完成"

# 3. 服务器安装依赖和重启
echo -e "\n${YELLOW}[3/5] 服务器安装依赖...${NC}"
ssh $SERVER_USER@$SERVER_HOST "
  cd $SERVER_PATH
  npm ci --omit=dev
"
pass "依赖安装完成"

echo -e "\n${YELLOW}[4/5] 重启后端服务...${NC}"
ssh $SERVER_USER@$SERVER_HOST "
  cd $SERVER_PATH
  pm2 delete dgkj-server 2>/dev/null || true
  pm2 start ecosystem.config.js
  pm2 save
  pm2 status
"
pass "服务重启完成"

# 4. 等待服务启动
echo -e "\n${YELLOW}[5/5] 验证部署...${NC}"
sleep 5

# 检查健康
HEALTH=$(ssh $SERVER_USER@$SERVER_HOST "curl -s http://localhost:3000/health" 2>/dev/null || echo "")
if ! echo "$HEALTH" | grep -q '"status":"ok"'; then
  fail "健康检查失败: $HEALTH"
fi
pass "健康检查通过"

# 检查登录
LOGIN_RESP=$(ssh $SERVER_USER@$SERVER_HOST "curl -s -X POST http://localhost:3000/basic-api/login \
  -H 'Content-Type: application/json' \
  -d '{\"username\":\"admin\",\"password\":\"admin123\"}'" 2>/dev/null || echo "")

if ! echo "$LOGIN_RESP" | grep -q '"code":200'; then
  fail "登录接口失败: $LOGIN_RESP"
fi
pass "登录接口正常"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   部署成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n访问地址:"
echo -e "  运营后台: https://dghs.gddogootech.com"
echo -e "  默认账号: admin / admin123"
