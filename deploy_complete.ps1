# DGKJ 完整部署脚本 - 使用密码登录
$server = "120.78.7.180"
$user = "root"
$pass = "Dogootech88"
$securePass = ConvertTo-SecureString $pass -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($user, $securePass)

Write-Host "=== DGKJ 支付平台完整部署 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 上传后端
Write-Host "[1/6] 打包后端..." -ForegroundColor Yellow
$backendZip = "$env:TEMP\dgkj_server.zip"
Compress-Archive -Path "D:\DGKJ\server\dist\*" -DestinationPath $backendZip -Force
Write-Host "后端打包完成" -ForegroundColor Green

Write-Host "[2/6] 上传后端到服务器..." -ForegroundColor Yellow
$session = New-PSSession -ComputerName $server -Credential $credential -Authentication Default
if ($session) {
    # 上传后端
    Copy-Item -ToSession $session -Path $backendZip -Destination "/tmp/dgkj_server.zip" -Force
    
    # 解压后端
    Invoke-Command -Session $session -ScriptBlock {
        Write-Host "解压后端..." -ForegroundColor Cyan
        Remove-Item -Path "/opt/dgkj-server/dist/*" -Recurse -Force -ErrorAction SilentlyContinue
        Expand-Archive -Path "/tmp/dgkj_server.zip" -DestinationPath "/opt/dgkj-server/dist" -Force
        Remove-Item -Path "/tmp/dgkj_server.zip" -Force
        Write-Host "后端解压完成" -ForegroundColor Green
    }
    
    # 3. 重启后端
    Write-Host "[3/6] 重启后端服务..." -ForegroundColor Yellow
    Invoke-Command -Session $session -ScriptBlock {
        Set-Location "/opt/dgkj-server"
        & pm2 restart dgkj-server
        Write-Host "后端重启完成" -ForegroundColor Green
    }
    
    # 4. 打包前端
    Write-Host "[4/6] 打包前端..." -ForegroundColor Yellow
    $frontendZip = "$env:TEMP\dgkj_admin.zip"
    Compress-Archive -Path "D:\DGKJ\dist\*" -DestinationPath $frontendZip -Force
    Write-Host "前端打包完成" -ForegroundColor Green
    
    # 5. 上传前端
    Write-Host "[5/6] 上传前端到服务器..." -ForegroundColor Yellow
    Copy-Item -ToSession $session -Path $frontendZip -Destination "/tmp/dgkj_admin.zip" -Force
    
    Invoke-Command -Session $session -ScriptBlock {
        Write-Host "解压前端..." -ForegroundColor Cyan
        Remove-Item -Path "/www/dgkj/admin/*" -Recurse -Force -ErrorAction SilentlyContinue
        Expand-Archive -Path "/tmp/dgkj_admin.zip" -DestinationPath "/www/dgkj/admin" -Force
        Remove-Item -Path "/tmp/dgkj_admin.zip" -Force
        Write-Host "前端解压完成" -ForegroundColor Green
    }
    
    # 6. 验证
    Write-Host "[6/6] 验证部署..." -ForegroundColor Yellow
    Invoke-Command -Session $session -ScriptBlock {
        Write-Host "检查后端状态..." -ForegroundColor Cyan
        & pm2 status dgkj-server
        
        Write-Host ""
        Write-Host "检查后端日志..." -ForegroundColor Cyan
        & pm2 logs dgkj-server --lines 10 --nostream
    }
    
    Remove-PSSession $session
} else {
    Write-Host "无法连接到服务器" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== 部署完成 ===" -ForegroundColor Cyan
Write-Host "后端地址: http://120.78.7.180:3000" -ForegroundColor Green
Write-Host "前端地址: https://dghs.gddogootech.com" -ForegroundColor Green
