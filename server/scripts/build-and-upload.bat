@echo off
chcp 65001 >nul
REM ============================================================
REM DGKJ 本地一键构建 + 上传到服务器
REM 1. 构建前端 (pnpm build)
REM 2. 构建后端 (server npm run build)
REM 3. 上传前端 dist/* 到服务器 /www/dgkj/admin/
REM 4. 上传后端 dist/* 到服务器 /opt/dgkj-server/
REM ============================================================

setlocal enabledelayedexpansion

set SERVER_IP=120.78.7.180
set SERVER_USER=root
set FRONTEND_DIR=%~dp0..\dist
set BACKEND_SRC=%~dp0..\dist
set SERVER_FRONTEND_PATH=/www/dgkj/admin
set SERVER_BACKEND_PATH=/root/DGKJ/server

echo ============================================================
echo DGKJ 本地一键构建 + 上传
echo 服务器: %SERVER_IP%
echo ============================================================

REM ---- 步骤 1: 构建前端 ----
echo.
echo [1/5] 构建前端 (pnpm build)...
cd /d "%~dp0.."
call pnpm build
if errorlevel 1 (
    echo [ERROR] 前端构建失败
    pause
    exit /b 1
)
echo [OK] 前端构建完成

REM ---- 步骤 2: 构建后端 ----
echo.
echo [2/5] 构建后端 (server npm run build)...
cd /d "%~dp0..\server"
call npm run build
if errorlevel 1 (
    echo [ERROR] 后端构建失败
    pause
    exit /b 1
)
echo [OK] 后端构建完成

REM ---- 步骤 3: 上传前端 ----
echo.
echo [3/5] 上传前端到服务器...
echo    目标: %SERVER_USER%@%SERVER_IP%:%SERVER_FRONTEND_PATH%/

REM 创建远程目录
plink -batch %SERVER_USER%@%SERVER_IP% "mkdir -p %SERVER_FRONTEND_PATH%"
if errorlevel 1 (
    echo [ERROR] 无法连接服务器，请确保已配置 SSH 密钥
    echo [提示] 运行: ssh-copy-id %SERVER_USER%@%SERVER_IP%
    pause
    exit /b 1
)

REM 上传前端
pscp -r -p -batch "%FRONTEND_DIR%\*" %SERVER_USER%@%SERVER_IP%:%SERVER_FRONTEND_PATH%/
if errorlevel 1 (
    echo [ERROR] 前端上传失败
    pause
    exit /b 1
)
echo [OK] 前端上传完成

REM ---- 步骤 4: 上传后端源码 ----
echo.
echo [4/5] 上传后端源码到服务器...
pscp -r -p -batch "%BACKEND_SRC%\dist" %SERVER_USER%@%SERVER_IP%:%SERVER_BACKEND_PATH%\dist
pscp -r -p -batch "%BACKEND_SRC%\package.json" %SERVER_USER%@%SERVER_IP%:%SERVER_BACKEND_PATH%\
pscp -r -p -batch "%BACKEND_SRC%\tsconfig.json" %SERVER_USER%@%SERVER_IP%:%SERVER_BACKEND_PATH%\
pscp -r -p -batch "%BACKEND_SRC%\ecosystem.config.js" %SERVER_USER%@%SERVER_IP%:%SERVER_BACKEND_PATH%\
if errorlevel 1 (
    echo [WARN] 后端部分上传失败，但前端已可用
)
echo [OK] 后端上传完成

REM ---- 步骤 5: 服务器执行部署脚本 ----
echo.
echo [5/5] 在服务器执行部署脚本...
echo.

plink -batch %SERVER_USER%@%SERVER_IP% "bash /root/DGKJ/server/scripts/deploy-fix.sh"

echo.
echo ============================================================
echo 构建 + 上传完成!
echo ============================================================
echo 访问: http://dghs.gddogootech.com
echo 用户名: admin  密码: admin123
echo.
echo 常用命令:
echo   服务器查看日志: pm2 logs dgkj-server --lines 50
echo   服务器重启后端: pm2 restart dgkj-server
echo   服务器检查端口: netstat -tlnp | grep 3000
echo.
pause
