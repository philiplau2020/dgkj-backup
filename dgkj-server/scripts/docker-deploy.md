# ===========================================
# Docker 部署方式 (推荐)
# ===========================================

# 1. 构建本地镜像
docker build -t dgkj-server:1.0.0 .

# 2. 上传镜像到服务器 (或者使用镜像仓库)
# docker save dgkj-server:1.0.0 | gzip > dgkj-server.tar.gz
# scp dgkj-server.tar.gz root@你的服务器IP:/opt/

# 3. 在服务器上运行
docker run -d \
  --name dgkj-server \
  -p 8080:8080 \
  -v /opt/dgkj-server/logs:/app/logs \
  -e SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/dgkj" \
  -e SPRING_DATASOURCE_USERNAME="root" \
  -e SPRING_DATASOURCE_PASSWORD="your_password" \
  dgkj-server:1.0.0

# 4. 使用 docker-compose 部署 (推荐)
# docker-compose up -d
