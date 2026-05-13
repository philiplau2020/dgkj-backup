@echo off
chcp 65001 > nul
REM DGKJ 支付平台 - 服务器升级部署脚本

echo ==============================================
echo   DGKJ 支付平台 - 服务器升级部署
echo ==============================================
echo.

setlocal enabledelayedexpansion

set "SERVER=120.78.7.180"
set "USER=root"
set "PASSWORD=Dogootech88"
set "PROJECT_ROOT=D:\DGKJ"

cd /d "%PROJECT_ROOT%"

echo [1/6] 清理旧构建文件...
if exist "dist" rmdir /s /q "dist"
if exist "server\dist" rmdir /s /q "server\dist"
if exist "frontend.zip" del /f /q "frontend.zip"
if exist "backend.zip" del /f /q "backend.zip"
echo 清理完成
echo.

echo [2/6] 构建前端...
set VITE_USE_MOCK=false
set VITE_GLOB_API_URL=https://dghs.gddogootech.com
call npm run build
if errorlevel 1 (
    echo 前端构建失败
    pause
    exit /b 1
)
echo 前端构建完成
echo.

echo [3/6] 构建后端...
cd server
call npm run build
if errorlevel 1 (
    echo 后端构建失败
    pause
    exit /b 1
)
cd ..
echo 后端构建完成
echo.

echo [4/6] 打包文件...
powershell -command "Compress-Archive -Path 'dist\*' -DestinationPath 'frontend.zip' -Force"
powershell -command "Compress-Archive -Path 'server\dist\*' -DestinationPath 'backend.zip' -Force"
echo 打包完成
echo.

echo [5/6] 上传到服务器...
echo 上传后端...
echo %PASSWORD% | scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 "backend.zip" %USER%@%SERVER%:/tmp/
echo 上传前端...
echo %PASSWORD% | scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 "frontend.zip" %USER%@%SERVER%:/tmp/
echo 上传完成
echo.

echo [6/6] 执行远程部署...
set REMOTE_SCRIPT=cd /tmp ^&^& cd /opt/dgkj-server ^&^& rm -rf dist/* ^&^& cd /tmp ^&^& unzip -o backend.zip -d /opt/dgkj-server/dist/ ^&^& unzip -o frontend.zip -d /www/dgkj/admin/ ^&^& cd /opt/dgkj-server ^&^& pm2 restart dgkj-server ^&^& pm2 save ^&^& curl -s http://localhost:3000/health

echo %PASSWORD% | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=60 %USER%@%SERVER% "!REMOTE_SCRIPT!"

echo.
echo [完成] 清理本地文件...
del /f /q "frontend.zip" 2>nul
del /f /q "backend.zip" 2>nul

echo.
echo ==============================================
echo   服务器升级完成!
echo ==============================================
echo.
echo 访问地址: https://dghs.gddogootech.com
echo.
pause
