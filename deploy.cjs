const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const server = '120.78.7.180';
const port = 22;
const username = 'root';
const password = 'Dogootech88';

function deploy() {
    return new Promise((resolve, reject) => {
        console.log('=== DGKJ 部署脚本 ===\n');
        
        const conn = new Client();
        
        conn.on('ready', () => {
            console.log('[1/5] 连接服务器成功\n');
            
            // 2. 清理旧文件
            console.log('[2/5] 清理旧文件...');
            conn.exec('rm -rf /www/dgkj/admin/*', (err, stream) => {
                if (err) { conn.end(); return reject(err); }
                stream.on('close', () => {
                    console.log('清理完成\n');
                    
                    // 3. 上传文件 - 使用 sftp
                    console.log('[3/5] 上传前端文件...');
                    conn.sftp((err, sftp) => {
                        if (err) { conn.end(); return reject(err); }
                        
                        sftp.fastPut('D:/DGKJ/dist.zip', '/tmp/dgkj_deploy.zip', (err) => {
                            if (err) { conn.end(); return reject(err); }
                            console.log('上传完成\n');
                            
                            // 4. 解压部署
                            console.log('[4/5] 解压部署...');
                            conn.exec('cd /www/dgkj && unzip -o /tmp/dgkj_deploy.zip -d admin && rm /tmp/dgkj_deploy.zip', (err, stream) => {
                                if (err) { conn.end(); return reject(err); }
                                let output = '';
                                stream.on('data', (data) => { output += data; });
                                stream.stderr.on('data', (data) => { output += data; });
                                stream.on('close', () => {
                                    console.log(output || '解压完成');
                                    console.log('解压完成\n');
                                    
                                    // 5. 重启后端
                                    console.log('[5/5] 重启后端服务...');
                                    conn.exec('cd /opt/dgkj-server && pm2 restart dgkj-server && pm2 logs dgkj-server --lines 10', (err, stream) => {
                                        if (err) { conn.end(); return reject(err); }
                                        let output = '';
                                        stream.on('data', (data) => { output += data; });
                                        stream.stderr.on('data', (data) => { output += data; });
                                        stream.on('close', () => {
                                            console.log(output);
                                            console.log('后端重启完成\n');
                                            
                                            // 验证
                                            console.log('验证 API...');
                                            conn.exec('curl -s http://localhost:3000/basic-api/sys/config/list', (err, stream) => {
                                                if (err) { conn.end(); return reject(err); }
                                                let output = '';
                                                stream.on('data', (data) => { output += data; });
                                                stream.on('close', () => {
                                                    console.log('API 响应:', output ? output.substring(0, 200) : '成功');
                                                    conn.end();
                                                    console.log('\n=== 部署完成 ===');
                                                    console.log('访问地址: https://dghs.gddogootech.com');
                                                    resolve();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
        
        conn.on('error', (err) => {
            console.error('连接错误:', err.message);
            reject(err);
        });
        
        console.log('[1/5] 连接服务器...');
        conn.connect({
            host: server,
            port: port,
            username: username,
            password: password,
            readyTimeout: 30000,
        });
    });
}

deploy().catch(err => {
    console.error('部署失败:', err);
    process.exit(1);
});
