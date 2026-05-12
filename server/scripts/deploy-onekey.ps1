# ========================================
# DGKJ 支付平台 - 一键部署脚本 (Windows)
# ========================================

$ServerHost = "120.78.7.180"
$ServerUser = "root"
$ServerPath = "/opt/dgkj-server"

function Write-Step { param($msg) Write-Host "→ $msg" -ForegroundColor Yellow }
function Write-Pass { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "✗ $msg" -ForegroundColor Red; exit 1 }

Write-Host "========================================" -ForegroundColor Green
Write-Host "   DGKJ 一键部署脚本" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# 1. 本地构建
Write-Step "本地构建后端..."
Set-Location "$PSScriptRoot\.."
npm run build
Write-Pass "后端构建完成"

# 2. 上传代码
Write-Step "上传代码到服务器..."
& scp -r --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '*.log' ./* ${ServerUser}@${ServerHost}:${ServerPath}/ 2>$null
Write-Pass "代码上传完成"

# 3. 服务器安装依赖和重启
Write-Step "服务器安装依赖..."
ssh $ServerUser@$ServerHost "cd $ServerPath && npm ci --omit=dev"
Write-Pass "依赖安装完成"

Write-Step "重启后端服务..."
ssh $ServerUser@$ServerHost "cd $ServerPath && pm2 delete dgkj-server 2>`$null || true && pm2 start ecosystem.config.js && pm2 save && pm2 status"
Write-Pass "服务重启完成"

# 4. 验证部署
Write-Step "验证部署 (等待5秒)..."
Start-Sleep -Seconds 5

$health = ssh $ServerUser@$ServerHost "curl -s http://localhost:3000/health" 2>$null
if ($health -notmatch '"status":"ok"') {
    Write-Fail "健康检查失败: $health"
}
Write-Pass "健康检查通过"

$loginResp = ssh $ServerUser@$ServerHost @"
curl -s -X POST http://localhost:3000/basic-api/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}'
"@ 2>$null

if ($loginResp -notmatch '"code":200') {
    Write-Fail "登录接口失败: $loginResp"
}
Write-Pass "登录接口正常"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   部署成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "访问地址: https://dghs.gddogootech.com"
Write-Host "默认账号: admin / admin123"
