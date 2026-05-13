@echo off
chcp 65001 > nul

cd /d d:\DGKJ

echo 打包后端...
powershell -command "Compress-Archive -Path 'server\dist\*' -DestinationPath 'backend.zip' -Force"

echo 打包前端...
powershell -command "Compress-Archive -Path 'dist\*' -DestinationPath 'frontend.zip' -Force"

echo 打包完成
dir *.zip
