# DGKJ 简单部署脚本
$ErrorActionPreference = "Stop"

$server = "120.78.7.180"
$user = "root"
$pass = "Dogootech88"

Write-Host "=== DGKJ 部署脚本 ===" -ForegroundColor Cyan

# 检查 dist 目录
if (-not (Test-Path "D:\DGKJ\dist")) {
    Write-Host "错误: dist 目录不存在，请先运行 pnpm build" -ForegroundColor Red
    exit 1
}

# 打包
Write-Host "[1/3] 创建压缩包..." -ForegroundColor Yellow
$zipPath = "$env:TEMP\dgkj_frontend_new.zip"
Compress-Archive -Path "D:\DGKJ\dist\*" -DestinationPath $zipPath -Force
Write-Host "  打包完成" -ForegroundColor Green

# 上传
Write-Host "[2/3] 上传文件到服务器..." -ForegroundColor Yellow
$uploadCmd = "scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 `"$zipPath`" `"$user@$server`:/tmp/dgkj_frontend_new.zip"
Write-Host "  执行: $uploadCmd"

try {
    $result = & cmd /c "echo $pass | $uploadCmd" 2>&1
    Write-Host "  上传结果: $result"
} catch {
    Write-Host "  上传失败: $_" -ForegroundColor Red
}

# 执行部署命令
Write-Host "[3/3] 执行部署命令..." -ForegroundColor Yellow
$deployCmd = "cd /www/dgkj/admin && rm -rf * && unzip -o /tmp/dgkj_frontend_new.zip -d . && ls -la"
try {
    $result = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 "$user@$server" $deployCmd 2>&1
    Write-Host $result
} catch {
    Write-Host "  SSH 执行失败: $_" -ForegroundColor Red
}

# 清理
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== 部署完成 ===" -ForegroundColor Cyan
Write-Host "请访问 https://dghs.gddogootech.com 验证" -ForegroundColor Green
