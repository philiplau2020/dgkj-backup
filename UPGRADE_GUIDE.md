# DGKJ 支付平台 - 服务器升级指南

## 准备工作

### 本地构建（已完成）
- [x] 前端构建完成：`d:\DGKJ\dist\`
- [x] 后端构建完成：`d:\DGKJ\server\dist\`
- [x] 打包文件：
  - `d:\DGKJ\backend.zip` (后端)
  - `d:\DGKJ\frontend.zip` (前端)

---

## 方案一：手动上传部署

### 步骤 1：上传文件

使用以下命令上传打包文件到服务器：

```bash
# 上传后端
scp d:\DGKJ\backend.zip root@120.78.7.180:/tmp/

# 上传前端
scp d:\DGKJ\frontend.zip root@120.78.7.180:/tmp/
```

或者使用 Windows 自带的远程桌面连接，手动复制粘贴文件。

### 步骤 2：SSH 连接服务器

```bash
ssh root@120.78.7.180
# 密码：Dogootech88
```

### 步骤 3：执行部署命令

```bash
# 进入后端目录
cd /opt/dgkj-server

# 清理旧文件
rm -rf dist/*

# 解压后端
cd /tmp
unzip -o backend.zip -d /opt/dgkj-server/dist/

# 解压前端
rm -rf /www/dgkj/admin/*
unzip -o frontend.zip -d /www/dgkj/admin/

# 设置权限
chown -R www-data:www-data /www/dgkj/admin
chmod -R 755 /www/dgkj/admin

# 重启后端服务
pm2 restart dgkj-server
pm2 save

# 检查服务状态
pm2 status
curl http://localhost:3000/health

# 清理临时文件
rm -f /tmp/backend.zip /tmp/frontend.zip
```

### 步骤 4：验证部署

打开浏览器访问：https://dghs.gddogootech.com

---

## 方案二：使用 Windows 远程桌面

1. 按 `Win + R` 打开运行窗口
2. 输入 `mstsc` 打开远程桌面连接
3. 输入服务器IP：`120.78.7.180`
4. 使用用户名密码登录：`root` / `Dogootech88`
5. 在服务器上执行以下命令：

```bash
# 上传文件后，在服务器终端执行
cd /tmp
unzip -o backend.zip -d /opt/dgkj-server/dist/
unzip -o frontend.zip -d /www/dgkj/admin/
cd /opt/dgkj-server
pm2 restart dgkj-server
pm2 save
```

---

## 方案三：使用 WinSCP

1. 下载 WinSCP：https://winscp.net/
2. 连接服务器：`root@120.78.7.180`
3. 上传 `backend.zip` 到 `/tmp/`
4. 上传 `frontend.zip` 到 `/tmp/`
5. 在 WinSCP 中打开终端（Ctrl+T）
6. 执行部署命令

---

## 故障排查

### 服务器无法连接
```bash
# 检查网络
ping 120.78.7.180

# 检查端口
telnet 120.78.7.180 22
```

### 后端无法启动
```bash
# 查看日志
pm2 logs dgkj-server --lines 50

# 检查端口占用
lsof -i:3000
```

### 数据库连接失败
```bash
# 测试数据库
mysql -u dgkj -p -h localhost dgkj
```

### 前端 404
```bash
# 检查文件
ls -la /www/dgkj/admin/

# 检查 Nginx
nginx -t
systemctl reload nginx
```

---

## 更新内容说明

本次更新包含：
1. **前端更新**：
   - 修复了公告管理页面的语法错误
   - 修复了系统日志页面的组件导入问题
   - 更新了开放平台文档页面

2. **后端更新**：
   - 修复了日志清理功能的类型错误
   - 添加了公告管理的新字段（scope, isTop, publisher）
   - 修复了银联支付通道的类型问题
   - 修复了性能监控服务的类型问题

---

## 联系支持

如有问题，请联系技术支持。
