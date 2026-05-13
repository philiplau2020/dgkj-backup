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
        ("ALTER TABLE citic_account ADD COLUMN account_attr TINYINT DEFAULT 1 AFTER account_type", "account_attr"),
        ("ALTER TABLE citic_account ADD COLUMN pending_balance DECIMAL(18,2) DEFAULT 0 AFTER frozen_balance", "pending_balance"),
        ("ALTER TABLE citic_account ADD COLUMN audit_status TINYINT DEFAULT 0 AFTER status", "audit_status"),
        ("ALTER TABLE citic_account ADD COLUMN channel VARCHAR(32) NULL AFTER audit_status", "channel"),
        ("ALTER TABLE citic_account ADD COLUMN mch_no VARCHAR(32) NULL AFTER channel", "mch_no"),
    ]

    for sql, name in columns:
        run_sql(client, sql, name)

    print("\n=== 验证表结构 ===")
    _, stdout, _ = client.exec_command("mysql -udgkj -pDgkj@2024 dgkj -e 'DESCRIBE citic_account;' 2>&1", timeout=10)
    print(stdout.read().decode('utf-8', errors='replace'))

    client.close()
    print("\n完成!")

if __name__ == '__main__':
    main()
