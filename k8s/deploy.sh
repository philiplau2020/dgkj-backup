#!/bin/bash
# DGKJ K8s 部署脚本

set -e

NAMESPACE="dgkj"
REGISTRY="registry.cn-hangzhou.aliyuncs.com/dgkj"

echo "======================================"
echo "  DGKJ K8s 部署脚本"
echo "======================================"

# 1. 创建命名空间
echo "[1/7] 创建命名空间..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# 2. 应用基础设施配置
echo "[2/7] 部署基础设施 (MySQL, Redis, RabbitMQ)..."
kubectl apply -f infra-deployment.yaml

# 3. 等待基础设施就绪
echo "[3/7] 等待 MySQL 就绪..."
kubectl wait --for=condition=ready pod -l app=mysql -n $NAMESPACE --timeout=300s

echo "[4/7] 等待 Redis 就绪..."
kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s

echo "[5/7] 等待 RabbitMQ 就绪..."
kubectl wait --for=condition=ready pod -l app=rabbitmq -n $NAMESPACE --timeout=300s

# 4. 部署后端服务
echo "[6/7] 部署后端服务..."
kubectl apply -f server-deployment.yaml

# 5. 部署前端服务
echo "[7/7] 部署前端服务..."
kubectl apply -f frontend-deployment.yaml

# 等待服务就绪
echo "等待服务启动..."
kubectl rollout status deployment/dgkj-server -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/dgkj-admin -n $NAMESPACE --timeout=300s

# 显示状态
echo ""
echo "======================================"
echo "  部署完成！"
echo "======================================"
echo ""
kubectl get pods -n $NAMESPACE
echo ""
kubectl get services -n $NAMESPACE
echo ""
kubectl get ingress -n $NAMESPACE
