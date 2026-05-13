# 使用 SSH.NET 库进行部署
# 首先安装 SSH.NET
Install-Module -Name SSH-Sessions -Force -ErrorAction SilentlyContinue

# 如果上面的方法不行，创建一个 Python 脚本使用 paramiko
@'
#!/usr/bin/env python3
import sys
import paramiko
import zipfile
import os
from io import BytesIO

# 服务器信息
server = "120.78.7.180"
port = 22
username = "root"
password = "Dogootech88"

# 本地文件
local_zip = r"D:\DGKJ\dist.zip"

def deploy():
    print("连接服务器...")
    transport = paramiko.Transport((server, port))
    transport.connect(username=username, password=password)
    sftp = paramiko.SFTPClient.from_transport(transport)
    
    print("上传文件...")
    sftp.put(local_zip, "/tmp/dgkj_deploy.zip")
    
    print("执行部署命令...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(server, port, username, password)
    
    # 解压部署
    stdin, stdout, stderr = ssh.exec_command(
        "cd /www/dgkj && rm -rf admin/* && unzip -o /tmp/dgkj_deploy.zip -d admin && rm /tmp/dgkj_deploy.zip && echo 'Frontend deployed'"
    )
    print(stdout.read().decode())
    
    # 重启后端
    stdin, stdout, stderr = ssh.exec_command("cd /opt/dgkj-server && pm2 restart dgkj-server && pm2 logs dgkj-server --lines 5")
    print(stdout.read().decode())
    
    sftp.close()
    transport.close()
    print("部署完成!")

if __name__ == "__main__":
    deploy()
'@
