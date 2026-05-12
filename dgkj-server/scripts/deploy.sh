#!/bin/bash
# ===========================================
# DGKJ Server 部署脚本
# ===========================================

set -e

# 配置变量
APP_NAME="dgkj-server"
APP_VERSION="1.0.0"
JAR_FILE="${APP_NAME}.jar"
REMOTE_USER="root"
REMOTE_HOST="你的服务器IP"
REMOTE_DIR="/opt/${APP_NAME}"
SSH_PORT="22"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查本地构建
check_build() {
    if [ ! -f "target/${JAR_FILE}" ]; then
        log_warn "本地未找到打包文件，开始构建..."
        mvn clean package -DskipTests
    fi
    log_info "找到打包文件: target/${JAR_FILE}"
}

# 上传到服务器
upload_to_server() {
    log_info "上传文件到服务器..."
    ssh -p ${SSH_PORT} ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_DIR}"
    scp -P ${SSH_PORT} target/${JAR_FILE} scripts/init.sql ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/
    log_info "上传完成"
}

# 在服务器上执行部署
deploy_on_server() {
    log_info "开始部署到服务器..."

    ssh -p ${SSH_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
        set -e
        APP_NAME="dgkj-server"
        APP_DIR="/opt/${APP_NAME}"
        JAR_FILE="${APP_NAME}.jar"

        cd ${APP_DIR}

        # 停止旧服务
        if [ -f "running.pid" ]; then
            PID=$(cat running.pid)
            if kill -0 ${PID} 2>/dev/null; then
                echo "停止旧服务 PID: ${PID}"
                kill ${PID} || true
                sleep 3
            fi
            rm -f running.pid
        fi

        # 停止可能存在的旧进程
        pkill -f ${JAR_FILE} || true
        sleep 2

        # 初始化数据库（如果需要）
        echo "请确保MySQL已安装并运行..."
        echo "执行: mysql -uroot -p < ${APP_DIR}/init.sql"

        # 启动新服务
        echo "启动服务..."
        nohup java -jar ${JAR_FILE} --server.port=8080 > app.log 2>&1 &
        echo $! > running.pid
        echo "服务已启动 PID: $(cat running.pid)"

        # 等待启动
        sleep 10

        # 检查启动状态
        if curl -s http://localhost:8080/api/auth/userinfo > /dev/null; then
            echo "=========================================="
            echo "  服务部署成功!"
            echo "  访问地址: http://你的服务器IP:8080"
            echo "  API文档: http://你的服务器IP:8080/swagger-ui.html"
            echo "=========================================="
        else
            echo "服务可能正在启动中，请检查日志: tail -f ${APP_DIR}/app.log"
        fi
ENDSSH
}

# 主流程
main() {
    log_info "=== DGKJ Server 部署脚本 ==="

    # 检查SSH连接
    log_info "检查服务器连接..."
    ssh -p ${SSH_PORT} -o ConnectTimeout=5 ${REMOTE_USER}@${REMOTE_HOST} "echo '服务器连接成功'" || {
        log_error "无法连接到服务器，请检查SSH配置"
        exit 1
    }

    check_build
    upload_to_server
    deploy_on_server

    log_info "部署完成!"
}

# 执行
main "$@"
