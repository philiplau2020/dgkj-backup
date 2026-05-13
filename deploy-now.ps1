# DGKJ 部署脚本
$ErrorActionPreference = "Stop"

$server = "120.78.7.180"
$user = "root"
$pass = "Dogootech88"
$localZip = "$env:TEMP\dgkj_frontend.zip"
$backendZip = "$env:TEMP\dgkj_backend.zip"

Write-Host "=== DGKJ 支付平台部署 ===" -ForegroundColor Cyan
Write-Host ""

# 打包
Write-Host "[1/6] 打包前端..." -ForegroundColor Yellow
Compress-Archive -Path "D:\DGKJ\dist\*" -DestinationPath $localZip -Force

Write-Host "[2/6] 打包后端..." -ForegroundColor Yellow
Compress-Archive -Path "D:\DGKJ\server\dist\*" -DestinationPath $backendZip -Force

Write-Host "打包完成: $localZip" -ForegroundColor Green
Write-Host ""

# 上传前端
Write-Host "[3/6] 上传前端到服务器..." -ForegroundColor Yellow
$cmd = "scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 `"$localZip`" `"$user@$server`:/tmp/""
Write-Host "执行: $cmd"
cmd /c $cmd $pass

# 上传后端
Write-Host "[4/6] 上传后端到服务器..." -ForegroundColor Yellow
$cmd = "scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 `"$backendZip`" `"$user@$server`:/tmp/"
Write-Host "执行: $cmd"
cmd /c $cmd $pass

# SSH 执行部署命令
Write-Host "[5/6] 执行部署命令..." -ForegroundColor Yellow
$sshCmd = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=60 root@120.78.7.180 "rm -rf /www/dgkj/admin/* && unzip -o /tmp/dgkj_frontend.zip -d /www/dgkj/admin/ && rm -rf /opt/dgkj-server/dist/* && unzip -o /tmp/dgkj_backend.zip -d /opt/dgkj-server/dist/ && cd /opt/dgkj-server && pm2 restart dgkj-server && sleep 3 && pm2 status && curl -s http://localhost:3000/health"'
Write-Host "执行: $sshCmd"
cmd /c $sshCmd

# 清理
Write-Host "[6/6] 清理临时文件..." -ForegroundColor Yellow
Remove-Item $localZip -Force -ErrorAction SilentlyContinue
Remove-Item $backendZip -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== 部署完成 ===" -ForegroundColor Cyan
Write-Host "访问地址: https://dghs.gddogootech.com" -ForegroundColor Green
