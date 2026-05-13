#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko, os, time, json

HOST = '120.78.7.180'
PORT = 22
USER = 'root'
PASSWORD = 'Dogootech88'
LOCAL_DIST = 'D:/DGKJ/server/dist'
REMOTE_DIR = '/opt/dgkj-server/dist'

def run_cmd(client, cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    return out.strip()

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)

    print("=== 停止 PM2 ===")
    run_cmd(client, "pm2 stop dgkj-server")

    print("=== 上传 dist ===")
    sftp = client.open_sftp()
    count = 0
    for root, dirs, files in os.walk(LOCAL_DIST):
        for f in files:
            fp = os.path.join(root, f)
            rel = os.path.relpath(fp, LOCAL_DIST).replace('\\', '/')
            rd = REMOTE_DIR + '/' + os.path.dirname(rel).replace('\\', '/')
            parts = rd.strip('/').split('/')
            cur = ''
            for p in parts:
                if not p or p == '.':
                    cur = '/'
                    continue
                cur = cur + '/' + p
                try:
                    sftp.stat(cur)
                except:
                    sftp.mkdir(cur)
            rp = REMOTE_DIR + '/' + rel
            sftp.put(fp, rp)
            count += 1
    sftp.close()
    print("上传了 {} 个文件".format(count))

    print("=== 启动 PM2 ===")
    out = run_cmd(client, "cd /opt/dgkj-server && pm2 start ecosystem.config.js 2>&1")
    print(out[:300])

    print("等待 5 秒...")
    time.sleep(5)

    print("=== 测试 /basic-api/order/list ===")
    login_cmd = 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\\"username\\\":\\\"admin\\\",\\\"password\\\":\\\"admin123\\\"}" --max-time 5'
    _, stdout, _ = client.exec_command(login_cmd, timeout=10)
    login_resp = json.loads(stdout.read().decode('utf-8', errors='replace'))
    token = login_resp.get('data', {}).get('token', '')
    print("Token:", token[:30] + '...')

    test_cmd = 'curl -s "http://localhost:3000/basic-api/order/list?page=1&pageSize=10" -H "Authorization: Bearer {}" --max-time 5'.format(token)
    _, stdout, _ = client.exec_command(test_cmd, timeout=10)
    resp = stdout.read().decode('utf-8', errors='replace')
    print("Response:", resp[:400])

    client.close()
    print("完成!")

if __name__ == '__main__':
    main()
