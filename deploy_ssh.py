#!/usr/bin/env python3
"""
DGKJ 部署脚本 - 使用 SSH 密钥登录
"""
import paramiko
import zipfile
import os
import time

# 服务器信息
server = "120.78.7.180"
port = 22
username = "root"
key_path = os.path.expanduser("~/.ssh/id_rsa_dgkj")

# 本地文件
local_zip = r"D:\DGKJ\deploy.zip"

def deploy():
    print('=' * 50)
    print('DGKJ 支付平台 - SSH 密钥部署')
    print('=' * 50)
    print()
    
    # 连接服务器
    print('[1/5] 连接服务器 (SSH 密钥)...')
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(
            hostname=server,
            port=port,
            username=username,
            key_filename=key_path,
            timeout=30
        )
        print('✓ 连接成功')
    except Exception as e:
        print(f'✗ 连接失败: {e}')
        return False
    
    try:
        # 清理旧文件
        print()
        print('[2/5] 清理旧文件...')
        stdin, stdout, stderr = client.exec_command('rm -rf /www/dgkj/admin/*')
        stdout.channel.recv_exit_status()
        print('✓ 清理完成')
        
        # 上传文件
        print()
        print('[3/5] 上传前端文件...')
        sftp = client.open_sftp()
        sftp.put(local_zip, '/tmp/dgkj_deploy.zip')
        sftp.close()
        print('✓ 上传完成')
        
        # 解压部署
        print()
        print('[4/5] 解压部署...')
        stdin, stdout, stderr = client.exec_command(
            'cd /www/dgkj && unzip -o /tmp/dgkj_deploy.zip -d admin && rm /tmp/dgkj_deploy.zip'
        )
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode()
        if exit_status == 0:
            print('✓ 解压完成')
        else:
            print(f'✗ 解压失败: {stderr.read().decode()}')
        
        # 重启后端
        print()
        print('[5/5] 重启后端服务...')
        stdin, stdout, stderr = client.exec_command(
            'cd /opt/dgkj-server && pm2 restart dgkj-server && pm2 logs dgkj-server --lines 15'
        )
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode()
        print('✓ 后端重启完成')
        print()
        print('--- 后端日志 ---')
        print(output[-1000:] if len(output) > 1000 else output)
        
        # 验证
        print()
        print('验证 API...')
        stdin, stdout, stderr = client.exec_command(
            'curl -s http://localhost:3000/basic-api/sys/config/list | head -c 300'
        )
        result = stdout.read().decode()
        print(f'API 响应: {result[:200]}...')
        
    finally:
        client.close()
    
    print()
    print('=' * 50)
    print('✓ 部署完成!')
    print('访问地址: https://dghs.gddogootech.com')
    print('=' * 50)
    return True

if __name__ == "__main__":
    deploy()
