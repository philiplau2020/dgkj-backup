# DGKJ 部署脚本 - 使用密码登录
$server = "120.78.7.180"
$user = "root"
$pass = "Dogootech88"
$securePass = ConvertTo-SecureString $pass -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($user, $securePass)

Write-Host "=== DGKJ 支付平台部署脚本 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 上传文件
Write-Host "[1/4] 上传前端文件..." -ForegroundColor Yellow
$session = New-PSSession -ComputerName $server -Credential $credential -Authentication Default
if ($session) {
    # 创建临时zip上传
    $localZip = "$env:TEMP\dgkj_deploy.zip"
    Compress-Archive -Path "D:\DGKJ\dist\*" -DestinationPath $localZip -Force
    
    # 上传到服务器
    Copy-Item -ToSession $session -Path $localZip -Destination "/tmp/dgkj_deploy.zip" -Force
    Write-Host "文件上传成功" -ForegroundColor Green
    
    # 2. 远程部署
    Write-Host "[2/4] 解压部署..." -ForegroundColor Yellow
    Invoke-Command -Session $session -ScriptBlock {
        Remove-Item -Path "/www/dgkj/admin/*" -Recurse -Force -ErrorAction SilentlyContinue
        Expand-Archive -Path "/tmp/dgkj_deploy.zip" -DestinationPath "/www/dgkj/admin" -Force
        Remove-Item -Path "/tmp/dgkj_deploy.zip" -Force
        Write-Host "解压完成" -ForegroundColor Green
    }
    
    # 3. 重启后端
    Write-Host "[3/4] 重启后端服务..." -ForegroundColor Yellow
    Invoke-Command -Session $session -ScriptBlock {
        Set-Location "/opt/dgkj-server"
        & pm2 restart dgkj-server
        Write-Host "后端重启完成" -ForegroundColor Green
    }
    
    # 4. 验证
    Write-Host "[4/4] 验证部署..." -ForegroundColor Yellow
    Invoke-Command -Session $session -ScriptBlock {
        $config = Invoke-RestMethod -Uri "http://localhost:3000/basic-api/sys/config/list" -Method GET
        Write-Host "API 响应: $($config.message)" -ForegroundColor Cyan
    }
    
    Remove-PSSession $session
} else {
    Write-Host "无法连接到服务器" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== 部署完成 ===" -ForegroundColor Cyan
Write-Host "访问地址: https://dghs.gddogootech.com" -ForegroundColor Green
