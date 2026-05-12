#!/bin/bash
# ========================================
# DGKJ 支付平台 - 部署验证脚本
# ========================================
# 确保部署后所有功能正常工作

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVER_HOST="120.78.7.180"
SERVER_USER="root"
API_BASE="http://localhost:3000"
ADMIN_URL="http://localhost"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   DGKJ 部署验证脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 颜色输出函数
pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
info() { echo -e "${YELLOW}→ $1${NC}"; }

# 1. 检查后端服务状态
echo -e "\n${YELLOW}[1/8] 检查后端服务状态...${NC}"
ssh $SERVER_USER@$SERVER_HOST "pm2 status" | grep -q "dgkj-server" && pass "PM2 进程运行中" || fail "PM2 进程未运行"

# 2. 检查端口监听
echo -e "\n${YELLOW}[2/8] 检查端口监听...${NC}"
ssh $SERVER_USER@$SERVER_HOST "netstat -tlnp" | grep -q ":3000" && pass "端口 3000 监听中" || fail "端口 3000 未监听"

# 3. 检查数据库连接
echo -e "\n${YELLOW}[3/8] 检查数据库连接...${NC}"
ssh $SERVER_USER@$SERVER_HOST "cd /opt/dgkj-server && node -e \"
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectTimeout: 5000
});
pool.query('SELECT 1').then(() => { console.log('OK'); process.exit(0); }).catch(() => { console.log('FAIL'); process.exit(1); });
\"" && pass "数据库连接正常" || fail "数据库连接失败"

# 4. 检查健康检查接口
echo -e "\n${YELLOW}[4/8] 检查健康检查接口...${NC}"
HEALTH=$(ssh $SERVER_USER@$SERVER_HOST "curl -s http://localhost:3000/health")
echo "$HEALTH" | grep -q '"status":"ok"' && pass "健康检查通过" || fail "健康检查失败"

# 5. 检查登录接口
echo -e "\n${YELLOW}[5/8] 检查登录接口...${NC}"
LOGIN_RESP=$(ssh $SERVER_USER@$SERVER_HOST "curl -s -X POST http://localhost:3000/basic-api/login \
  -H 'Content-Type: application/json' \
  -d '{\"username\":\"admin\",\"password\":\"admin123\"}'")
echo "$LOGIN_RESP" | grep -q '"code":200' && pass "登录接口正常" || fail "登录接口失败: $LOGIN_RESP"

# 提取 token
TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  fail "无法获取 Token"
fi
pass "Token 获取成功"

# 6. 检查用户信息接口
echo -e "\n${YELLOW}[6/8] 检查用户信息接口...${NC}"
USERINFO=$(ssh $SERVER_USER@$SERVER_HOST "curl -s http://localhost:3000/basic-api/getUserInfo \
  -H 'Authorization: $TOKEN'")
echo "$USERINFO" | grep -q '"code":200' && pass "用户信息接口正常" || fail "用户信息接口失败: $USERINFO"

# 7. 检查 Nginx 配置
echo -e "\n${YELLOW}[7/8] 检查 Nginx 配置...${NC}"
ssh $SERVER_USER@$SERVER_HOST "nginx -t" && pass "Nginx 配置正确" || fail "Nginx 配置错误"

# 8. 检查 API 代理
echo -e "\n${YELLOW}[8/8] 检查 API 代理...${NC}"
PROXY_RESP=$(ssh $SERVER_USER@$SERVER_HOST "curl -s -o /dev/null -w '%{http_code}' http://localhost/basic-api/login")
[ "$PROXY_RESP" = "404" ] && fail "API 代理返回 404，请检查 Nginx 配置" || pass "API 代理正常 (HTTP $PROXY_RESP)"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   所有检查通过！部署成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n访问地址:"
echo -e "  运营后台: https://dghs.gddogootech.com"
echo -e "  测试: curl -X POST https://dghs.gddogootech.com/basic-api/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"admin123\"}'"
