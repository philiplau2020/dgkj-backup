$sftpArgs = "-o StrictHostKeyChecking=no -o ConnectTimeout=10"
$remoteCmd = "rm -rf /www/dgkj/admin/* && mkdir -p /www/dgkj/admin && exit"

# 使用批处理文件进行SFTP
$batchContent = @"
rm -rf /www/dgkj/admin/*
mkdir /www/dgkj/admin
lcd D:\DGKJ\dist
cd /www/dgkj/admin
mput *
bye
"@

$batchContent | Out-File -FilePath "$env:TEMP\sftp_batch.txt" -Encoding ASCII

# 尝试通过管道输入
$sftp = Start-Process -FilePath "sftp" -ArgumentList "$sftpArgs root@120.78.7.180" -NoNewWindow -PassThru -RedirectStandardInput "$env:TEMP\sftp_batch.txt" -Wait -WindowStyle Hidden
