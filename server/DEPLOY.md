# DGKJ 支付平台 - 部署指南

## 一键部署命令 (在本地终端执行)

### 1. 本地构建
```bash
cd D:\DGKJ\server
npm run build
```

### 2. 上传到服务器
```bash
# 使用 scp 上传 (排除 node_modules, dist 等)
scp -r * root@120.78.7.180:/opt/dgkj-server/
```

### 3. 服务器端执行
```bash
# SSH 登录服务器
ssh root@120.78.7.180

# 进入目录
cd /opt/dgkj-server

# 安装依赖 (生产环境)
npm ci --omit=dev

# 重新构建 (确保使用生产环境)
npm run build

# 重启 PM2
pm2 delete dgkj-server 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

### 4. 验证部署
```bash
# 健康检查
curl http://localhost:3000/health

# 测试登录
curl -X POST http://localhost:3000/basic-api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'

# 应该返回: {"code":200,"message":"登录成功",...}
```

## 常见问题排查

### 1. 404 错误
检查 Nginx 是否正确代理 `/basic-api/` 到 `http://127.0.0.1:3000`

### 2. 500 错误
检查数据库连接配置 (.env 文件)

### 3. 端口未监听
```bash
pm2 logs dgkj-server
```

## 快速重启
```bash
ssh root@120.78.7.180 "cd /opt/dgkj-server && pm2 restart dgkj-server && pm2 logs --lines 20"
```
