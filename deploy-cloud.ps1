# DGKJ 完整部署脚本 - 一键部署到云服务器
# 使用前请确保已构建项目

$server = "120.78.7.180"
$user = "root"
$pass = "Dogootech88"
$securePass = ConvertTo-SecureString $pass -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($user, $securePass)

# 项目路径
$projectRoot = "d:\DGKJ_backup_20260513_165940"
$backendDir = "$projectRoot\server"
$frontendDir = "$projectRoot"

Write-Host "=== DGKJ 支付平台完整部署 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 构建后端
Write-Host "[1/8] 构建后端..." -ForegroundColor Yellow
Set-Location $backendDir
npx tsc -p tsconfig.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "后端构建失败!" -ForegroundColor Red
    exit 1
}
Write-Host "后端构建完成" -ForegroundColor Green

# 2. 打包后端
Write-Host "[2/8] 打包后端..." -ForegroundColor Yellow
$backendZip = "$env:TEMP\dgkj_server_$(Get-Date -Format 'yyyyMMddHHmmss').zip"
if (Test-Path "$backendDir\dist") {
    Compress-Archive -Path "$backendDir\dist\*" -DestinationPath $backendZip -Force
    Write-Host "后端打包完成" -ForegroundColor Green
} else {
    Write-Host "后端 dist 目录不存在!" -ForegroundColor Red
    exit 1
}

# 3. 构建前端
Write-Host "[3/8] 构建前端..." -ForegroundColor Yellow
Set-Location $frontendDir
pnpm vite build
if ($LASTEXITCODE -ne 0) {
    Write-Host "前端构建失败!" -ForegroundColor Red
    exit 1
}
Write-Host "前端构建完成" -ForegroundColor Green

# 4. 打包前端
Write-Host "[4/8] 打包前端..." -ForegroundColor Yellow
$frontendZip = "$env:TEMP\dgkj_admin_$(Get-Date -Format 'yyyyMMddHHmmss').zip"
if (Test-Path "$frontendDir\dist") {
    Compress-Archive -Path "$frontendDir\dist\*" -DestinationPath $frontendZip -Force
    Write-Host "前端打包完成" -ForegroundColor Green
} else {
    Write-Host "前端 dist 目录不存在!" -ForegroundColor Red
    exit 1
}

# 5. 连接服务器
Write-Host "[5/8] 连接服务器..." -ForegroundColor Yellow
$session = New-PSSession -ComputerName $server -Credential $credential -Authentication Default
if (-not $session) {
    Write-Host "无法连接到服务器" -ForegroundColor Red
    exit 1
}
Write-Host "连接成功" -ForegroundColor Green

# 6. 上传并部署后端
Write-Host "[6/8] 部署后端..." -ForegroundColor Yellow
Copy-Item -ToSession $session -Path $backendZip -Destination "/tmp/dgkj_server.zip" -Force
Invoke-Command -Session $session -ScriptBlock {
    Write-Host "  解压后端..." -ForegroundColor Cyan
    Remove-Item -Path "/opt/dgkj-server/dist/*" -Recurse -Force -ErrorAction SilentlyContinue
    Expand-Archive -Path "/tmp/dgkj_server.zip" -DestinationPath "/opt/dgkj-server/dist" -Force
    Remove-Item -Path "/tmp/dgkj_server.zip" -Force
    Write-Host "  后端解压完成" -ForegroundColor Green
}
Remove-Item $backendZip -Force

# 7. 上传并部署前端
Write-Host "[7/8] 部署前端..." -ForegroundColor Yellow
Copy-Item -ToSession $session -Path $frontendZip -Destination "/tmp/dgkj_admin.zip" -Force
Invoke-Command -Session $session -ScriptBlock {
    Write-Host "  解压前端..." -ForegroundColor Cyan
    Remove-Item -Path "/www/dgkj/admin/*" -Recurse -Force -ErrorAction SilentlyContinue
    Expand-Archive -Path "/tmp/dgkj_admin.zip" -DestinationPath "/www/dgkj/admin" -Force
    Remove-Item -Path "/tmp/dgkj_admin.zip" -Force
    Write-Host "  前端解压完成" -ForegroundColor Green
}
Remove-Item $frontendZip -Force

# 8. 重启服务
Write-Host "[8/8] 重启服务..." -ForegroundColor Yellow
Invoke-Command -Session $session -ScriptBlock {
    Set-Location "/opt/dgkj-server"
    & pm2 restart dgkj-server
    Start-Sleep -Seconds 3
    & pm2 status dgkj-server
}
Write-Host "服务重启完成" -ForegroundColor Green

# 验证
Write-Host ""
Write-Host "=== 验证部署 ===" -ForegroundColor Cyan
Invoke-Command -Session $session -ScriptBlock {
    Write-Host "后端状态:" -ForegroundColor Yellow
    & pm2 status dgkj-server
    Write-Host ""
    Write-Host "后端日志 (最后20行):" -ForegroundColor Yellow
    & pm2 logs dgkj-server --lines 20 --nostream
}

Remove-PSSession $session

Write-Host ""
Write-Host "=== 部署完成 ===" -ForegroundColor Green
Write-Host "后端地址: http://120.78.7.180:3000" -ForegroundColor Cyan
Write-Host "前端地址: https://dghs.gddogootech.com" -ForegroundColor Cyan
