@echo off
chcp 65001 > nul

echo ==============================================
echo   DGKJ 支付平台 - 服务器升级部署
echo ==============================================
echo.

set SERVER=120.78.7.180
set USER=root
set PASSWORD=Dogootech88
set PROJECT=d:\DGKJ

echo [1/5] 检查文件...
if not exist "%PROJECT%\backend.zip" (
    echo 后端包不存在，正在打包...
    powershell -command "Set-Location '%PROJECT%'; Compress-Archive -Path 'server\dist\*' -DestinationPath 'backend.zip' -Force"
)
if not exist "%PROJECT%\frontend.zip" (
    echo 前端包不存在，正在打包...
    powershell -command "Set-Location '%PROJECT%'; Compress-Archive -Path 'dist\*' -DestinationPath 'frontend.zip' -Force"
)
echo 文件检查完成
echo.

echo [2/5] 上传后端...
echo | scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 -o BatchMode=yes "%PROJECT%\backend.zip" %USER%@%SERVER%:/tmp/
if errorlevel 1 (
    echo 上传后端失败，请检查服务器连接
    goto :end
)
echo 后端上传完成
echo.

echo [3/5] 上传前端...
echo | scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 -o BatchMode=yes "%PROJECT%\frontend.zip" %USER%@%SERVER%:/tmp/
if errorlevel 1 (
    echo 上传前端失败，请检查服务器连接
    goto :end
)
echo 前端上传完成
echo.

echo [4/5] 执行远程部署...
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=60 -o BatchMode=yes %USER%@%SERVER% "cd /tmp && cd /opt/dgkj-server && del /q dist\* 2>nul && cd /tmp && powershell -command Expand-Archive -Path backend.zip -DestinationPath /opt/dgkj-server/dist/ -Force && powershell -command Expand-Archive -Path frontend.zip -DestinationPath /www/dgkj/admin/ -Force && cd /opt/dgkj-server && pm2 restart dgkj-server && pm2 save && curl -s http://localhost:3000/health"
echo.

echo [5/5] 清理临时文件...
ssh -o StrictHostKeyChecking=no -o BatchMode=yes %USER%@%SERVER% "del /q /tmp/backend.zip /tmp/frontend.zip 2>nul"
echo.

echo ==============================================
echo   部署完成
echo ==============================================
echo.
echo 访问地址: https://dghs.gddogootech.com
echo.

:end
pause
