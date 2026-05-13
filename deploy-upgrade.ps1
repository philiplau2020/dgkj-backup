# DGKJ 支付平台 - 服务器升级脚本
# 执行方式: 在项目根目录(D:\DGKJ)执行: .\deploy-upgrade.ps1

param(
    [string]$Server = "120.78.7.180",
    [string]$User = "root",
    [string]$Password = "Dogootech88"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  DGKJ 支付平台 - 服务器升级部署" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "D:\DGKJ"
Set-Location $projectRoot

# 1. 清理旧构建
Write-Host "[1/7] 清理旧构建文件..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "server\dist") { Remove-Item -Recurse -Force "server\dist" }
if (Test-Path "frontend.zip") { Remove-Item -Force "frontend.zip" }
if (Test-Path "backend.zip") { Remove-Item -Force "backend.zip" }
Write-Host "清理完成" -ForegroundColor Green

# 2. 构建前端
Write-Host "[2/7] 构建前端..." -ForegroundColor Yellow
$env:VITE_USE_MOCK = "false"
$env:VITE_GLOB_API_URL = "https://dghs.gddogootech.com"
npm run build -- --mode production
if (-not $?) { throw "前端构建失败" }
Write-Host "前端构建完成" -ForegroundColor Green

# 3. 构建后端
Write-Host "[3/7] 构建后端..." -ForegroundColor Yellow
Set-Location "$projectRoot\server"
npm run build
if (-not $?) { throw "后端构建失败" }
Set-Location $projectRoot
Write-Host "后端构建完成" -ForegroundColor Green

# 4. 打包文件
Write-Host "[4/7] 打包文件..." -ForegroundColor Yellow
Compress-Archive -Path "dist\*" -DestinationPath "frontend.zip" -Force
Compress-Archive -Path "server\dist\*" -DestinationPath "backend.zip" -Force
Write-Host "打包完成" -ForegroundColor Green

# 5. 上传后端
Write-Host "[5/7] 上传后端到服务器..." -ForegroundColor Yellow
$cmd = "scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 `"$projectRoot\backend.zip`" `"$User@$Server`:/tmp/backend.zip`"
Write-Host "  上传后端包..." -NoNewline
$output = echo $Password | cmd /c $cmd 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host " 失败" -ForegroundColor Red
    Write-Host $output
    throw "上传后端失败"
}
Write-Host " 完成" -ForegroundColor Green

# 6. 上传前端
Write-Host "[6/7] 上传前端到服务器..." -ForegroundColor Yellow
$cmd = "scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 `"$projectRoot\frontend.zip`" `"$User@$Server`:/tmp/frontend.zip`"
Write-Host "  上传前端包..." -NoNewline
$output = echo $Password | cmd /c $cmd 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host " 失败" -ForegroundColor Red
    Write-Host $output
    throw "上传前端失败"
}
Write-Host " 完成" -ForegroundColor Green

# 7. 远程部署
Write-Host "[7/7] 执行远程部署..." -ForegroundColor Yellow

$remoteScript = @"
cd /tmp

# 备份当前版本
if [ -d /opt/dgkj-server/dist ]; then
    tar -czf /tmp/backup_`$(date +%Y%m%d_%H%M%S).tar.gz -C / opt/dgkj-server/dist 2>/dev/null || true
fi

# 清理旧文件
rm -rf /www/dgkj/admin/*
rm -rf /opt/dgkj-server/dist/*

# 解压新版本
echo "解压前端..."
unzip -o frontend.zip -d /www/dgkj/admin/
echo "解压后端..."
unzip -o backend.zip -d /opt/dgkj-server/dist/

# 设置权限
chown -R www-data:www-data /www/dgkj/admin
chmod -R 755 /www/dgkj/admin

# 重启后端服务
echo "重启后端服务..."
cd /opt/dgkj-server
pm2 restart dgkj-server || pm2 start ecosystem.config.js --env production
pm2 save

# 等待服务启动
sleep 3

# 检查状态
echo ""
echo "=== 服务状态 ==="
pm2 status
echo ""
echo "=== 健康检查 ==="
curl -s http://localhost:3000/health | head -c 200
echo ""
echo ""

# 清理临时文件
rm -f /tmp/frontend.zip /tmp/backend.zip

echo ""
echo "=== 部署完成 ==="
"@

$cmd = "echo '$Password' | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=60 $User@$Server"
$output = Invoke-Expression "$cmd `"$remoteScript`""
Write-Host $output

# 8. 清理本地文件
Write-Host ""
Write-Host "[完成] 清理本地文件..." -ForegroundColor Yellow
Remove-Item "frontend.zip", "backend.zip" -Force -ErrorAction SilentlyContinue
Remove-Item "dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "server\dist" -Recurse -Force -ErrorAction SilentlyContinue

Set-Location $projectRoot

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  服务器升级完成!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "访问地址: https://dghs.gddogootech.com" -ForegroundColor Green
Write-Host "后端状态: pm2 status" -ForegroundColor Yellow
Write-Host ""
