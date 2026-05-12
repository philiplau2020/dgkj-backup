# DGKJ Server 部署指南

## 环境要求

- JDK 1.8+
- MySQL 5.7+ / 8.0+
- Maven 3.6+
- 服务器内存建议 2GB+

## 部署方式

### 方式一：Docker Compose 部署（推荐）

```bash
# 1. 上传整个项目到服务器
scp -r dgkj-server/ root@你的服务器IP:/opt/

# 2. SSH 登录服务器
ssh root@你的服务器IP

# 3. 进入项目目录
cd /opt/dgkj-server

# 4. 启动服务
docker-compose up -d

# 5. 查看日志
docker-compose logs -f
```

### 方式二：传统部署

```bash
# 1. 安装 JDK 和 MySQL
apt update && apt install -y openjdk-8-jdk mysql-server

# 2. 上传项目
scp -r dgkj-server/ root@你的服务器IP:/opt/

# 3. SSH 登录服务器
ssh root@你的服务器IP

# 4. 初始化数据库
mysql -uroot -p < /opt/dgkj-server/scripts/init.sql

# 5. 修改配置
vim /opt/dgkj-server/src/main/resources/application.yml

# 6. 打包
cd /opt/dgkj-server
mvn clean package -DskipTests

# 7. 启动服务
nohup java -jar target/dgkj-server.jar --spring.profiles.active=prod > app.log 2>&1 &
echo $! > running.pid

# 8. 检查状态
curl http://localhost:8080/api/auth/userinfo
```

## API 测试

```bash
# 登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 获取用户信息
curl http://localhost:8080/api/auth/userinfo

# 获取商户列表
curl http://localhost:8080/api/mch/merchant/list?pageNo=1&pageSize=10

# 获取订单列表
curl http://localhost:8080/api/trade/pay/order/list?pageNo=1&pageSize=10
```

## 目录结构

```
dgkj-server/
├── src/main/java/com/dgkj/server/
│   ├── controller/     # 控制器
│   ├── entity/         # 实体类
│   ├── mapper/        # Mapper接口
│   ├── config/         # 配置类
│   └── demo/           # 通用类
├── src/main/resources/
│   ├── application.yml         # 开发配置
│   └── application-prod.yml    # 生产配置
├── scripts/
│   ├── init.sql               # 数据库初始化脚本
│   └── deploy.sh              # 部署脚本
├── docker-compose.yml         # Docker编排
├── Dockerfile                # Docker镜像
└── pom.xml                   # Maven配置
```

## 注意事项

1. 首次部署请确保 MySQL 已安装并运行
2. 默认管理员账号: admin / admin123
3. 生产环境请修改 application-prod.yml 中的数据库密码
4. 建议使用 Nginx 反向代理并配置 HTTPS
