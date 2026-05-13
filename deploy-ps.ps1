# DGKJ Deploy Script
$serverPath = "D:\DGKJ"
$remoteHost = "120.78.7.180"

Write-Host "Connecting to $remoteHost..."
$session = New-PSSession -ComputerName $remoteHost -Credential (Get-Credential -UserName "root" -Message "Enter root password")

Write-Host "Uploading server_build.zip..."
Copy-Item -ToSession $session -Path "$serverPath\server_build.zip" -Destination "/tmp/"

Write-Host "Uploading frontend_build.zip..."
Copy-Item -ToSession $session -Path "$serverPath\frontend_build.zip" -Destination "/tmp/"

Write-Host "Extracting and deploying backend..."
Invoke-Command -Session $session -ScriptBlock {
    Expand-Archive -Path "/tmp/server_build.zip" -DestinationPath "/opt/dgkj-server/dist" -Force
}

Write-Host "Extracting and deploying frontend..."
Invoke-Command -Session $session -ScriptBlock {
    Expand-Archive -Path "/tmp/frontend_build.zip" -DestinationPath "/www/dgkj/admin" -Force
}

Write-Host "Restarting PM2 service..."
Invoke-Command -Session $session -ScriptBlock {
    pm2 restart dgkj-server
}

Write-Host "Cleaning up..."
Invoke-Command -Session $session -ScriptBlock {
    Remove-Item "/tmp/server_build.zip" -Force -ErrorAction SilentlyContinue
    Remove-Item "/tmp/frontend_build.zip" -Force -ErrorAction SilentlyContinue
}

Write-Host "Done! Closing session..."
Remove-PSSession $session

Write-Host "Deployment complete!"
