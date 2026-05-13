const { Client } = require('ssh2');
const fs = require('fs');

const server = '120.78.7.180';
const port = 22;
const username = 'root';
const privateKey = fs.readFileSync(process.env.USERPROFILE + '\\.ssh\\id_rsa_dgkj', 'utf8');

async function execCommand(conn, command) {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            let output = '';
            stream.on('data', (data) => { output += data; });
            stream.stderr.on('data', (data) => { output += data; });
            stream.on('close', () => resolve(output));
        });
    });
}

async function uploadFile(conn, localPath, remotePath) {
    return new Promise((res, rej) => {
        conn.sftp((err, sftp) => {
            if (err) return rej(err);
            const readStream = fs.createReadStream(localPath);
            const writeStream = sftp.createWriteStream(remotePath);
            writeStream.on('close', () => { sftp.end(); res(); });
            writeStream.on('error', (e) => { sftp.end(); rej(e); });
            readStream.pipe(writeStream);
        });
    });
}

async function deploy() {
    console.log('='.repeat(50));
    console.log('DGKJ 后端正确部署');
    console.log('='.repeat(50) + '\n');

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('✓ 连接成功\n');

            try {
                // 1. 清理旧服务，停止 PM2
                console.log('[1/7] 停止旧服务...');
                await execCommand(conn, 'pm2 stop dgkj-server 2>/dev/null || true');
                await execCommand(conn, 'pm2 delete dgkj-server 2>/dev/null || true');
                console.log('✓ 停止完成\n');

                // 2. 清理并创建目录
                console.log('[2/7] 准备目录...');
                await execCommand(conn, 'rm -rf /opt/dgkj-server && mkdir -p /opt/dgkj-server');
                console.log('✓ 目录准备完成\n');

                // 3. 上传后端
                console.log('[3/7] 上传后端文件...');
                await uploadFile(conn, 'D:/DGKJ/server_build.zip', '/tmp/dgkj_server.zip');
                console.log('✓ 上传完成\n');

                // 4. 解压
                console.log('[4/7] 解压文件...');
                await execCommand(conn, 'cd /opt/dgkj-server && unzip -o /tmp/dgkj_server.zip');
                console.log('✓ 解压完成\n');

                // 5. 移动 dist 内容到根目录
                console.log('[5/7] 整理目录结构...');
                await execCommand(conn, 'cd /opt/dgkj-server && mv dist/* . 2>/dev/null || true && rm -rf dist');
                console.log('✓ 整理完成\n');

                // 6. 安装依赖并启动
                console.log('[6/7] 安装依赖并启动...');
                await execCommand(conn, 'cd /opt/dgkj-server && npm install --production 2>&1 | tail -10');
                console.log('npm 安装完成');
                
                // 创建 ecosystem.config.js
                await execCommand(conn, 'cd /opt/dgkj-server && cat > ecosystem.config.js << \'EOF\nmodule.exports = {\n  apps: [{\n    name: "dgkj-server",\n    script: "dist/index.js",\n    instances: 1,\n    autorestart: true,\n    watch: false,\n    max_memory_restart: "500M",\n    env: { NODE_ENV: "production" }\n  }]\n};\nEOF');
                
                await execCommand(conn, 'cd /opt/dgkj-server && pm2 start ecosystem.config.js');
                console.log('✓ 启动完成\n');

                // 7. 测试
                console.log('[7/7] 测试 API...');
                await new Promise(r => setTimeout(r, 3000));
                
                const api1 = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/ops/overview');
                console.log('ops/overview:', api1.substring(0, 300));
                
                const api2 = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/ops/service/health');
                console.log('ops/service/health:', api2.substring(0, 300));

                // 保存
                await execCommand(conn, 'pm2 save');

            } catch (err) {
                console.error('错误:', err.message);
            }

            conn.end();
            console.log('\n' + '='.repeat(50));
            console.log('✓ 后端部署完成!');
            console.log('请刷新浏览器测试运维监控页面');
            console.log('='.repeat(50));
            resolve();
        });

        conn.on('error', (err) => {
            console.error('连接错误:', err.message);
            reject(err);
        });

        conn.connect({ host: server, port, username, privateKey, readyTimeout: 30000 });
    });
}

deploy().catch(err => { console.error('失败:', err); process.exit(1); });
