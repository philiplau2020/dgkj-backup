# DGKJ 完整部署脚本
$server = "120.78.7.180"
$user = "root"
$password = "Dogootech88"

Write-Host "=== DGKJ 支付平台完整部署 ===" -ForegroundColor Cyan
Write-Host ""

# 打包
Write-Host "[1/5] 打包文件..." -ForegroundColor Yellow
Set-Location "D:\DGKJ"
Compress-Archive -Path "dist\*" -DestinationPath "frontend.zip" -Force
Compress-Archive -Path "server\dist\*" -DestinationPath "backend.zip" -Force
Write-Host "打包完成" -ForegroundColor Green

# 上传
Write-Host "[2/5] 上传后端..." -ForegroundColor Yellow
$cmd1 = "scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 `"D:\DGKJ\backend.zip`" `"$user@$server`:/tmp/"
echo $password | $cmd1

Write-Host "[3/5] 上传前端..." -ForegroundColor Yellow
$cmd2 = "scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 `"D:\DGKJ\frontend.zip`" `"$user@$server`:/tmp/"
echo $password | $cmd2

# 远程部署
Write-Host "[4/5] 执行远程部署..." -ForegroundColor Yellow
$remoteScript = @'
cd /tmp
rm -rf /www/dgkj/admin/*
rm -rf /opt/dgkj-server/dist/*
unzip -o frontend.zip -d /www/dgkj/admin/
unzip -o backend.zip -d /opt/dgkj-server/dist/
cd /opt/dgkj-server
pm2 restart dgkj-server
sleep 3
pm2 status
'@

$cmd3 = "echo '$password' | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=60 $user@$server"
$result = Invoke-Expression "$cmd3 `"$remoteScript`""
Write-Host $result

# 清理
Write-Host "[5/5] 清理本地文件..." -ForegroundColor Yellow
Remove-Item "frontend.zip", "backend.zip" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== 部署完成 ===" -ForegroundColor Cyan
Write-Host "前端地址: https://dghs.gddogootech.com" -ForegroundColor Green
