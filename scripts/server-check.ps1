$ErrorActionPreference = "Stop"
$server = "120.78.7.180"
$user = "root"
$pass = "Dogootech88"

# Create a secure password
$secPass = ConvertTo-SecureString $pass -AsPlainText -Force
$creds = New-Object System.Management.Automation.PSCredential($user, $secPass)

# Create SSH session using CredSSP or basic auth
$session = New-PSSession -ComputerName $server -Credential $creds -Authentication Basic -ConnectionUri "http://$server`:5985/WSMAN" -SessionOption (New-PSSessionOption -SkipCACheck -SkipCNCheck -SkipRevocationCheck) -ErrorAction SilentlyContinue

if ($session) {
    Write-Host "[OK] Connected via WinRM"
    Invoke-Command -Session $session -ScriptBlock {
        Write-Host "=== PM2 Status ==="
        pm2 list 2>&1
        Write-Host "=== Port 3000 ==="
        netstat -tlnp 2>/dev/null | grep 3000
        ss -tlnp 2>/dev/null | grep 3000
        Write-Host "=== Nginx ==="
        systemctl status nginx 2>&1 | head -3
        Write-Host "=== Disk ==="
        df -h /
        Write-Host "=== Node ==="
        node --version
        npm --version
    }
    Remove-PSSession $session
} else {
    Write-Host "[FAIL] WinRM not available, trying SSH pipe..."
    # Alternative: echo password to SSH
    $cmd = @"
echo 'connected'
node --version
npm --version
pm2 list 2>&1 || echo 'pm2 not running'
"@
    $cmd | ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no -o BatchMode=no $user@$server 2>&1
}
