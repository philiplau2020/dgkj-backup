#!/bin/bash
# ========================================
# DGKJ 支付平台 - 生产环境一键部署脚本
# ========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_warn "请使用 root 用户运行此脚本，或使用 sudo"
        exit 1
    fi
}

# 获取服务器 IP
get_server_ip() {
    SERVER_IP=$(hostname -I | awk '{print $1}')
    log_info "服务器 IP: $SERVER_IP"
}

# 安装 Node.js
install_nodejs() {
    log_info "检查 Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_info "Node.js 已安装: $NODE_VERSION"
    else
        log_info "安装 Node.js 18.x..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
        log_info "Node.js 安装完成: $(node -v)"
    fi
    
    # 安装 pnpm
    if ! command -v pnpm &> /dev/null; then
        log_info "安装 pnpm..."
        npm install -g pnpm
    fi
}

# 安装 MySQL
install_mysql() {
    log_info "检查 MySQL..."
    
    if command -v mysql &> /dev/null; then
        log_info "MySQL 已安装"
    else
        log_info "安装 MySQL 8.0..."
        apt-get update
        apt-get install -y mysql-server
        systemctl start mysql
        systemctl enable mysql
        log_info "MySQL 安装完成"
    fi
}

# 配置 MySQL
config_mysql() {
    log_info "配置 MySQL 数据库..."
    
    # 创建数据库和用户
    mysql << EOF
CREATE DATABASE IF NOT EXISTS dgkj DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'dgkj'@'localhost' IDENTIFIED BY 'Dgkj@2024';
CREATE USER IF NOT EXISTS 'dgkj'@'%' IDENTIFIED BY 'Dgkj@2024';
GRANT ALL PRIVILEGES ON dgkj.* TO 'dgkj'@'localhost';
GRANT ALL PRIVILEGES ON dgkj.* TO 'dgkj'@'%';
FLUSH PRIVILEGES;
EOF
    
    log_info "MySQL 配置完成"
}

# 安装 Nginx
install_nginx() {
    log_info "检查 Nginx..."
    
    if command -v nginx &> /dev/null; then
        log_info "Nginx 已安装: $(nginx -v 2>&1)"
    else
        log_info "安装 Nginx..."
        apt-get update
        apt-get install -y nginx certbot python3-certbot-nginx
        systemctl start nginx
        systemctl enable nginx
        log_info "Nginx 安装完成"
    fi
}

# 安装 PM2
install_pm2() {
    log_info "安装 PM2..."
    
    if command -v pm2 &> /dev/null; then
        log_info "PM2 已安装"
    else
        npm install -g pm2
    fi
    
    # 配置 PM2 开机自启
    pm2 startup
}

# 创建目录结构
create_dirs() {
    log_info "创建目录结构..."
    
    mkdir -p /opt/dgkj-server/{src,dist,logs}
    mkdir -p /www/dgkj/admin
    mkdir -p /www/dgkj/certs
    
    log_info "目录创建完成"
}

# 部署后端
deploy_backend() {
    log_info "开始部署后端服务..."
    
    cd /opt/dgkj-server
    
    # 创建 .env 文件
    cat > .env << EOF
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=dgkj
DB_PASSWORD=Dgkj@2024
DB_DATABASE=dgkj

# JWT 配置
JWT_SECRET=dgkj_jwt_secret_key_change_in_production_$(date +%s)
JWT_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=https://dghs.gddogootech.com

# 微信支付配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_MCH_ID=your_mch_id
WECHAT_API_KEY=your_api_key

# 支付宝配置
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key

# 中信银行配置
CITIC_PLATFORM_ID=your_platform_id
CITIC_APP_ID=your_app_id
CITIC_APP_SECRET=your_app_secret

# 短信配置
SMS_PROVIDER=aliyun
SMS_ACCESS_KEY_ID=your_access_key
SMS_ACCESS_KEY_SECRET=your_access_secret

# 邮件配置
EMAIL_HOST=smtp.example.com
EMAIL_PORT=465
EMAIL_USER=noreply@dgkj.com
EMAIL_PASS=your_email_password

# 支付回调地址
PAY_CALLBACK_URL=https://dghs.gddogootech.com
EOF
    
    # 安装依赖
    log_info "安装后端依赖..."
    pnpm install
    
    # 编译 TypeScript
    log_info "编译后端代码..."
    npx tsc -p tsconfig.json
    
    # 初始化数据库
    log_info "初始化数据库..."
    npx ts-node src/database/migrate.ts || log_warn "数据库迁移跳过（可能已存在）"
    
    # 创建 PM2 配置文件
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'dgkj-server',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: '/opt/dgkj-server/logs/error.log',
    out_file: '/opt/dgkj-server/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
  }],
};
EOF
    
    # 重启 PM2
    log_info "启动后端服务..."
    pm2 restart dgkj-server || pm2 start ecosystem.config.js --env production
    pm2 save
    
    log_info "后端部署完成"
}

# 部署前端
deploy_frontend() {
    log_info "开始部署前端..."
    
    # 创建 .env.production 文件
    cat > .env.production << 'EOF'
# 是否开启 Mock - 永远禁用
VITE_USE_MOCK=false

# App title
VITE_GLOB_APP_TITLE=DGKJ支付平台

# API 基础地址 - 指向云端后端
VITE_GLOB_API_URL=https://dghs.gddogootech.com

# 文件上传地址
VITE_GLOB_UPLOAD_URL=/upload

# 接口前缀
VITE_GLOB_API_URL_PREFIX=
EOF
    
    # 安装依赖
    log_info "安装前端依赖..."
    pnpm install
    
    # 构建
    log_info "构建前端..."
    pnpm build
    
    # 复制到部署目录
    log_info "复制到部署目录..."
    rm -rf /www/dgkj/admin/*
    cp -r dist/* /www/dgkj/admin/
    
    log_info "前端部署完成"
}

# 配置 Nginx
config_nginx() {
    log_info "配置 Nginx..."
    
    cat > /etc/nginx/sites-available/dgkj-admin << 'EOF'
server {
    listen 80;
    server_name dghs.gddogootech.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dghs.gddogootech.com;

    # SSL 证书配置 (请替换为您的证书路径)
    ssl_certificate /www/dgkj/certs/cert.pem;
    ssl_certificate_key /www/dgkj/certs/key.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 添加 HSTS 头
    add_header Strict-Transport-Security "max-age=63072000" always;

    # 前端静态文件
    root /www/dgkj/admin;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API 代理到后端
    location /basic-api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API 文档
    location /api-docs/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 文件上传
    location /upload/ {
        proxy_pass http://127.0.0.1:3000;
        client_max_body_size 100m;
        proxy_set_header Host $host;
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;
}
EOF
    
    # 启用站点
    ln -sf /etc/nginx/sites-available/dgkj-admin /etc/nginx/sites-enabled/
    
    # 测试配置
    nginx -t
    
    # 重启 Nginx
    systemctl restart nginx
    
    log_info "Nginx 配置完成"
}

# 配置 SSL 证书
config_ssl() {
    log_info "配置 SSL 证书..."
    
    # 检查证书是否存在
    if [ -f "/www/dgkj/certs/cert.pem" ] && [ -f "/www/dgkj/certs/key.pem" ]; then
        log_info "SSL 证书已存在"
    else
        log_warn "请将 SSL 证书放置在 /www/dgkj/certs/ 目录下"
        log_warn "文件名为 cert.pem 和 key.pem"
        log_warn "或者使用 Let's Encrypt 自动获取证书:"
        log_warn "  certbot --nginx -d dghs.gddogootech.com"
    fi
}

# 配置防火墙
config_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        ufw allow 22/tcp    # SSH
        ufw allow 80/tcp    # HTTP
        ufw allow 443/tcp   # HTTPS
        ufw --force enable
        log_info "防火墙配置完成"
    else
        log_warn "UFW 未安装，跳过防火墙配置"
    fi
}

# 设置目录权限
set_permissions() {
    log_info "设置目录权限..."
    
    chown -R www-data:www-data /www/dgkj
    chown -R www-data:www-data /opt/dgkj-server
    chmod +x /opt/dgkj-server/ecosystem.config.js
    
    log_info "权限设置完成"
}

# 显示部署信息
show_info() {
    echo ""
    echo "=============================================="
    echo -e "${GREEN} DGKJ 支付平台部署完成!${NC}"
    echo "=============================================="
    echo ""
    echo "后端服务:"
    echo "  地址: http://127.0.0.1:3000"
    echo "  API文档: http://127.0.0.1:3000/api-docs"
    echo ""
    echo "前端管理后台:"
    echo "  地址: https://dghs.gddogootech.com"
    echo ""
    echo "默认账号:"
    echo "  用户名: admin"
    echo "  密码: admin123"
    echo ""
    echo "常用命令:"
    echo "  查看日志: pm2 logs dgkj-server"
    echo "  重启服务: pm2 restart dgkj-server"
    echo "  查看状态: pm2 status"
    echo ""
    echo "=============================================="
}

# 主函数
main() {
    echo ""
    echo "=============================================="
    echo -e "${BLUE} DGKJ 支付平台 - 生产环境部署脚本${NC}"
    echo "=============================================="
    echo ""
    
    check_root
    get_server_ip
    
    log_info "开始安装环境..."
    install_nodejs
    install_mysql
    config_mysql
    install_nginx
    install_pm2
    
    log_info "创建目录结构..."
    create_dirs
    
    log_info "部署服务..."
    deploy_backend
    
    log_info "配置 Nginx..."
    config_nginx
    config_ssl
    
    log_info "配置系统..."
    set_permissions
    config_firewall
    
    show_info
}

# 执行主函数
main "$@"
