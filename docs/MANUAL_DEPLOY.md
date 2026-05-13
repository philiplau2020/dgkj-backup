# DGKJ 支付平台 - 手动部署指南

## 需要上传的文件

1. **前端文件**: `D:\DGKJ\deploy.zip`
2. **后端文件**: `D:\DGKJ\server\dist` 整个目录

## 服务器操作步骤

### 1. 连接服务器
```bash
ssh root@120.78.7.180
# 密码: Dogootech88
```

### 2. 上传前端文件
在本地执行（打开新的命令窗口）：
```bash
scp D:\DGKJ\deploy.zip root@120.78.7.180:/tmp/
```

### 3. 部署前端
在服务器执行：
```bash
cd /www/dgkj
rm -rf admin/*
unzip -o /tmp/deploy.zip -d admin
rm /tmp/deploy.zip
ls -la admin/
```

### 4. 更新后端代码
在本地执行：
```bash
scp -r D:\DGKJ\server\dist/* root@120.78.7.180:/opt/dgkj-server/dist/
```

### 5. 重启后端服务
在服务器执行：
```bash
cd /opt/dgkj-server
pm2 restart dgkj-server
pm2 logs dgkj-server --lines 20
```

### 6. 更新数据库
在服务器执行：
```bash
mysql -u dgkj -p Dgkj@2024 dgkj -e "
ALTER TABLE sys_config ADD COLUMN IF NOT EXISTS group_name VARCHAR(64) DEFAULT NULL;
ALTER TABLE sys_config ADD COLUMN IF NOT EXISTS status INT DEFAULT 1;
"
```

### 7. 验证部署
```bash
curl -s http://localhost:3000/basic-api/sys/config/list | head -c 200
```

## 部署完成

访问地址: https://dghs.gddogootech.com

## 快速部署脚本

在服务器上创建 `deploy.sh`：
```bash
#!/bin/bash
cd /www/dgkj
rm -rf admin/*
unzip -o /tmp/deploy.zip -d admin
rm /tmp/deploy.zip
cd /opt/dgkj-server
pm2 restart dgkj-server
echo "部署完成!"
```

执行：
```bash
chmod +x deploy.sh
./deploy.sh
```
