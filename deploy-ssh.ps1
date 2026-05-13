$password = "Dogootech88"
$server = "120.78.7.180"
$user = "root"

Write-Host "=== DGKJ 部署脚本 ===" -ForegroundColor Cyan
Write-Host ""

# 打包
Write-Host "[1/5] 打包前端和后端..." -ForegroundColor Yellow
Set-Location D:\DGKJ
Compress-Archive -Path dist/* -DestinationPath frontend.zip -Force
Compress-Archive -Path server/dist/* -DestinationPath backend.zip -Force
Write-Host "打包完成" -ForegroundColor Green

# 创建远程部署脚本
$remoteScript = @"
cd /tmp
rm -rf dgkj-admin/* dgkj-server-dist/*
unzip -o frontend.zip -d /www/dgkj/admin/
unzip -o backend.zip -d /opt/dgkj-server/dist/
cd /opt/dgkj-server
pm2 restart dgkj-server
sleep 3
pm2 status
curl -s http://localhost:3000/health
"@

Write-Host "[2/5] 上传前端..." -ForegroundColor Yellow
$cmd1 = "echo 'y' | scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 D:/DGKJ/frontend.zip $user@$server:/tmp/"
Invoke-Expression $cmd1

Write-Host "[3/5] 上传后端..." -ForegroundColor Yellow
$cmd2 = "echo 'y' | scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 D:/DGKJ/backend.zip $user@$server:/tmp/"
Invoke-Expression $cmd2

Write-Host "[4/5] 执行部署命令..." -ForegroundColor Yellow
$cmd3 = "echo '$password' | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=60 $user@$server '$remoteScript'"
Invoke-Expression $cmd3

Write-Host "[5/5] 清理本地文件..." -ForegroundColor Yellow
Remove-Item frontend.zip, backend.zip -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== 部署完成 ===" -ForegroundColor Cyan
Write-Host "访问: https://dghs.gddogootech.com" -ForegroundColor Green
