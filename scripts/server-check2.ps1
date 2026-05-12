$ErrorActionPreference = "Stop"
$server = "120.78.7.180"
$user = "root"
$pass = "Dogootech88"
$commands = @"
pm2 list 2>&1
echo "---"
netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000
echo "---"
systemctl status nginx 2>&1 | head -5
echo "---"
df -h /
echo "---"
node --version && npm --version
echo "---"
ls /opt/dgkj-server/ 2>&1
echo "---"
ls /www/dgkj/admin/ 2>&1 | head -10
"@

$script = @"
cd /root
$commands
"@

# Write commands to temp file
$tempFile = [System.IO.Path]::GetTempFileName() + ".sh"
[System.IO.File]::WriteAllText($tempFile, $commands, [System.Text.Encoding]::UTF8)

# Try SSH with password via stdin
try {
    $sshArgs = @(
        "-o", "StrictHostKeyChecking=no",
        "-o", "PreferredAuthentications=password",
        "-o", "PubkeyAuthentication=no",
        "-o", "ConnectTimeout=10",
        "-o", "BatchMode=no"
    )
    $sshProcess = Start-Process -FilePath "ssh" -ArgumentList ($sshArgs + @("$user@$server", "bash -s")) -NoNewWindow -Wait -PassThru -RedirectStandardInput $tempFile -RedirectStandardOutput "$env:TEMP\ssh_out.txt" -RedirectStandardError "$env:TEMP\ssh_err.txt"
    Write-Host "=== SSH Output ==="
    Get-Content "$env:TEMP\ssh_out.txt" | Select-Object -First 100
    Get-Content "$env:TEMP\ssh_err.txt" | Select-Object -First 20
} catch {
    Write-Host "[ERROR] SSH failed: $_"
}

Remove-Item $tempFile -Force -EA SilentlyContinue
Remove-Item "$env:TEMP\ssh_out.txt" -Force -EA SilentlyContinue
Remove-Item "$env:TEMP\ssh_err.txt" -Force -EA SilentlyContinue
