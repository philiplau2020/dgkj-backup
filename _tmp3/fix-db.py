#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

HOST = '120.78.7.180'
PORT = 22
USER = 'root'
PASSWORD = 'Dogootech88'

def run_cmd(client, cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out.strip(), err.strip()

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)

    print("=== 检查 citic_account 表结构 ===")
    out, _ = run_cmd(client, "mysql -udgkj -pDgkj@2024 dgkj -e 'DESCRIBE citic_account;' 2>&1")
    print(out[:500])

    print("\n=== 添加缺失的列 ===")
    sql = "ALTER TABLE citic_account ADD COLUMN biz_user_id VARCHAR(64) NULL UNIQUE AFTER id;"
    out, err = run_cmd(client, "mysql -udgkj -pDgkj@2024 dgkj -e '{}' 2>&1".format(sql))
    print("添加 biz_user_id:", out if out else "成功")
    if err:
        print("错误:", err[:200])

    sql = "ALTER TABLE citic_account ADD COLUMN available_balance DECIMAL(18,2) DEFAULT 0 AFTER balance;"
    out, err = run_cmd(client, "mysql -udgkj -pDgkj@2024 dgkj -e '{}' 2>&1".format(sql))
    print("添加 available_balance:", out if out else "成功")

    sql = "ALTER TABLE citic_account ADD COLUMN frozen_balance DECIMAL(18,2) DEFAULT 0 AFTER available_balance;"
    out, err = run_cmd(client, "mysql -udgkj -pDgkj@2024 dgkj -e '{}' 2>&1".format(sql))
    print("添加 frozen_balance:", out if out else "成功")

    sql = "ALTER TABLE citic_account ADD COLUMN pending_balance DECIMAL(18,2) DEFAULT 0 AFTER frozen_balance;"
    out, err = run_cmd(client, "mysql -udgkj -pDgkj@2024 dgkj -e '{}' 2>&1".format(sql))
    print("添加 pending_balance:", out if out else "成功")

    client.close()
    print("\n完成!")

if __name__ == '__main__':
    main()
