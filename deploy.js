const { NodeSSH } = require('ssh2');
const fs = require('fs');
const path = require('path');

const server = '120.78.7.180';
const port = 22;
const username = 'root';
const password = 'Dogootech88';

async function deploy() {
    console.log('=== DGKJ 部署脚本 ===\n');
    
    const ssh = new NodeSSH();
    
    try {
        // 1. 连接服务器
        console.log('[1/5] 连接服务器...');
        await ssh.connect({
            host: server,
            port: port,
            username: username,
            password: password,
            readyTimeout: 30000,
        });
        console.log('连接成功\n');
        
        // 2. 清理旧文件
        console.log('[2/5] 清理旧文件...');
        await ssh.execCommand('rm -rf /www/dgkj/admin/*');
        console.log('清理完成\n');
        
        // 3. 上传文件
        console.log('[3/5] 上传前端文件...');
        await ssh.putFiles([
            { local: 'D:/DGKJ/dist.zip', remote: '/tmp/dgkj_deploy.zip' }
        ]);
        console.log('上传完成\n');
        
        // 4. 解压部署
        console.log('[4/5] 解压部署...');
        const unzipResult = await ssh.execCommand('cd /www/dgkj && unzip -o /tmp/dgkj_deploy.zip -d admin && rm /tmp/dgkj_deploy.zip');
        console.log(unzipResult);
        console.log('解压完成\n');
        
        // 5. 重启后端
        console.log('[5/5] 重启后端服务...');
        const restartResult = await ssh.execCommand('cd /opt/dgkj-server && pm2 restart dgkj-server && pm2 logs dgkj-server --lines 10');
        console.log(restartResult);
        console.log('后端重启完成\n');
        
        // 验证
        console.log('验证 API...');
        const verifyResult = await ssh.execCommand('curl -s http://localhost:3000/basic-api/sys/config/list | head -c 200');
        console.log('API 响应:', verifyResult || '成功\n');
        
    } catch (err) {
        console.error('部署失败:', err.message);
        process.exit(1);
    } finally {
        ssh.dispose();
    }
    
    console.log('=== 部署完成 ===');
    console.log('访问地址: https://dghs.gddogootech.com');
}

deploy();
