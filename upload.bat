@echo off
chcp 65001 >nul
echo 上传前端文件到服务器...
echo 密码提示时输入: Dogootech88
echo.
scp -o StrictHostKeyChecking=no "D:\DGKJ\deploy.zip" root@120.78.7.180:/tmp/
echo.
echo 按任意键退出...
pause >nul
