$sshDir = "$env:USERPROFILE\.ssh"
$keyFile = "$sshDir\id_rsa_dgkj"

# 创建 .ssh 目录
if (!(Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
}

# 如果密钥存在，读取公钥
if (Test-Path $keyFile) {
    $pubKey = Get-Content "$keyFile.pub" -Raw
    if ($pubKey) {
        Write-Host "已找到 SSH 公钥:" -ForegroundColor Yellow
        Write-Host $pubKey
        Write-Host ""
        Write-Host "请将上述公钥添加到服务器 /root/.ssh/authorized_keys" -ForegroundColor Cyan
        Write-Host "然后我可以继续部署。" -ForegroundColor Green
    }
} else {
    Write-Host "正在生成 SSH 密钥..." -ForegroundColor Yellow
    # 使用 Bash 来生成密钥
    $bashCmd = "ssh-keygen -t rsa -b 4096 -f `"$keyFile`" -C `"dgkj-deploy`" -N `""""
    bash -c $bashCmd 2>&1
}
