#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko
HOST, PORT, USER, PASSWORD = '120.78.7.180', 22, 'root', 'Dogootech88'
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
_, stdout, _ = client.exec_command('cat /opt/dgkj-server/dist/index.js | head -100', timeout=10)
content = stdout.read().decode('utf-8', errors='replace')
for line in content.split('\n'):
    if 'order' in line.lower():
        print(line)
client.close()
