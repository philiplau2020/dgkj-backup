@echo off
chcp 65001 >nul
echo ========================================
echo DGKJ 支付平台部署脚本
echo ========================================
echo.

echo [1/4] 打包前端文件...
cd /d D:\DGKJ
powershell -Command "Compress-Archive -Path 'dist\*' -DestinationPath 'deploy.zip' -Force"
echo 完成
echo.

echo [2/4] 上传到服务器...
echo 请在弹出窗口中输入密码: Dogootech88
scp deploy.zip root@120.78.7.180:/tmp/
if errorlevel 1 (
    echo 上传失败！
    pause
    exit /b 1
)
echo 完成
echo.

echo [3/4] 远程执行部署...
echo 请在弹出窗口中输入密码: Dogootech88
ssh root@120.78.7.180 "cd /www/dgkj && rm -rf admin/* && unzip -o /tmp/deploy.zip -d admin && rm /tmp/deploy.zip && echo '部署成功'"
if errorlevel 1 (
    echo 远程部署失败！
    pause
    exit /b 1
)
echo 完成
echo.

echo [4/4] 重启后端服务...
ssh root@120.78.7.180 "cd /opt/dgkj-server && pm2 restart dgkj-server && pm2 logs dgkj-server --lines 5"
echo 完成
echo.

echo ========================================
echo 部署完成！
echo ========================================
pause
