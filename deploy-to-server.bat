@echo off
chcp 65001 > nul

set SERVER=120.78.7.180
set USER=root
set PASSWORD=Dogootech88

echo === 打包前后端 ===
cd /d d:\DGKJ

echo 删除旧包...
del /f /q backend.zip 2>nul
del /f /q frontend.zip 2>nul

echo 打包后端...
powershell -command "Compress-Archive -Path 'server\dist\*' -DestinationPath 'backend.zip' -Force"

echo 打包前端...
powershell -command "Compress-Archive -Path 'dist\*' -DestinationPath 'frontend.zip' -Force"

echo 打包完成
echo.
echo === 上传文件到服务器 ===
echo 上传后端...
echo %PASSWORD% | scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 "backend.zip" %USER%@%SERVER%:/tmp/

echo 上传前端...
echo %PASSWORD% | scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 "frontend.zip" %USER%@%SERVER%:/tmp/

echo.
echo === 执行远程部署 ===
set REMOTE_SCRIPT=cd /tmp ^&^& cd /opt/dgkj-server ^&^& del /q dist\* 2^>nul ^&^& cd /tmp ^&^& powershell -command \"Expand-Archive -Path backend.zip -DestinationPath /opt/dgkj-server/dist/ -Force\" ^&^& powershell -command \"Expand-Archive -Path frontend.zip -DestinationPath /www/dgkj/admin/ -Force\" ^&^& cd /opt/dgkj-server ^&^& pm2 restart dgkj-server ^&^& pm2 save ^&^& curl -s http://localhost:3000/health

echo %PASSWORD% | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=60 %USER%@%SERVER% "%REMOTE_SCRIPT%"

echo.
echo === 清理 ===
del /f /q backend.zip 2>nul
del /f /q frontend.zip 2>nul

echo.
echo === 部署完成 ===
echo 访问地址: https://dghs.gddogootech.com
pause
