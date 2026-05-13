#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

HOST = '120.78.7.180'
PORT = 22
USER = 'root'
PASSWORD = 'Dogootech88'

def run_sql(client, sql, desc):
    cmd = 'mysql -udgkj -pDgkj@2024 dgkj -e "{}" 2>&1'.format(sql.replace('"', '\\"'))
    _, stdout, stderr = client.exec_command(cmd, timeout=10)
    err = stderr.read().decode('utf-8', errors='replace')
    if 'ERROR' in err:
        print("{}: ERROR - {}".format(desc, err[:100]))
    else:
        print("{}: OK".format(desc))

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)

    print("=== 添加缺失的列到 citic_account ===")

    columns = [
        ("ALTER TABLE citic_account ADD COLUMN agent_no VARCHAR(32) NULL AFTER mch_no", "agent_no"),
        ("ALTER TABLE citic_account ADD COLUMN root_id VARCHAR(64) NULL AFTER agent_no", "root_id"),
    ]

    for sql, name in columns:
        run_sql(client, sql, name)

    client.close()
    print("\n完成!")

if __name__ == '__main__':
    main()
