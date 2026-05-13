$ErrorActionPreference = "Continue"

Write-Host "=== DGKJ 支付平台部署 ===" -ForegroundColor Cyan

# 服务器配置
$server = "120.78.7.180"
$user = "root"
$password = "Dogootech88"

# 项目路径
$projectRoot = "d:\DGKJ"

# 1. 打包后端
Write-Host "[1/5] 打包后端..." -ForegroundColor Yellow
Set-Location $projectRoot
if (Test-Path "backend.zip") { Remove-Item "backend.zip" -Force }
Compress-Archive -Path "server\dist\*" -DestinationPath "backend.zip" -Force
Write-Host "后端打包完成" -ForegroundColor Green

# 2. 打包前端
Write-Host "[2/5] 打包前端..." -ForegroundColor Yellow
if (Test-Path "frontend.zip") { Remove-Item "frontend.zip" -Force }
Compress-Archive -Path "dist\*" -DestinationPath "frontend.zip" -Force
Write-Host "前端打包完成" -ForegroundColor Green

# 3. 上传后端
Write-Host "[3/5] 上传后端到服务器..." -ForegroundColor Yellow
$cmd = "scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 `"$projectRoot\backend.zip`" `"$user@$server`:/tmp/"
$output = & cmd /c ("echo $password | " + $cmd) 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "后端上传成功" -ForegroundColor Green
} else {
    Write-Host "后端上传失败: $output" -ForegroundColor Red
}

# 4. 上传前端
Write-Host "[4/5] 上传前端到服务器..." -ForegroundColor Yellow
$cmd = "scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 `"$projectRoot\frontend.zip`" `"$user@$server`:/tmp/"
$output = & cmd /c ("echo $password | " + $cmd) 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "前端上传成功" -ForegroundColor Green
} else {
    Write-Host "前端上传失败: $output" -ForegroundColor Red
}

# 5. 执行远程部署
Write-Host "[5/5] 执行远程部署..." -ForegroundColor Yellow
$remoteScript = @"
cd /tmp
cd /opt/dgkj-server
del /q dist\* 2>nul
cd /tmp
powershell -command "Expand-Archive -Path backend.zip -DestinationPath /opt/dgkj-server/dist/ -Force"
powershell -command "Expand-Archive -Path frontend.zip -DestinationPath /www/dgkj/admin/ -Force"
cd /opt/dgkj-server
pm2 restart dgkj-server
pm2 save
curl -s http://localhost:3000/health
"@

$cmd = "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 $user@$server"
$output = & cmd /c ("echo $password | " + $cmd + " `"$remoteScript`"") 2>&1
Write-Host $output

# 清理
Remove-Item "backend.zip" -Force -ErrorAction SilentlyContinue
Remove-Item "frontend.zip" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== 部署完成 ===" -ForegroundColor Cyan
Write-Host "访问地址: https://dghs.gddogootech.com" -ForegroundColor Green
Write-Host ""
