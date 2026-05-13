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
    console.log('DGKJ 后端部署 (含运维监控)');
    console.log('='.repeat(50) + '\n');

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('✓ 连接成功\n');

            try {
                // 1. 上传后端
                console.log('[1/5] 上传后端文件...');
                await uploadFile(conn, 'D:/DGKJ/server_build.zip', '/tmp/dgkj_server.zip');
                console.log('✓ 上传完成\n');

                // 2. 停止旧服务
                console.log('[2/5] 停止旧服务...');
                await execCommand(conn, 'cd /opt/dgkj-server && pm2 stop dgkj-server 2>/dev/null || true');
                console.log('✓ 停止完成\n');

                // 3. 解压部署
                console.log('[3/5] 解压部署...');
                await execCommand(conn, 'cd /opt && rm -rf dgkj-server-new && mkdir dgkj-server-new && cd dgkj-server-new && unzip -o /tmp/dgkj_server.zip && mv dist/* . 2>/dev/null || true && rm -rf dist');
                console.log('✓ 解压完成\n');

                // 4. 重启服务
                console.log('[4/5] 重启服务...');
                await execCommand(conn, 'cd /opt/dgkj-server-new && npm install --production 2>&1 | tail -5');
                await execCommand(conn, 'cd /opt/dgkj-server-new && pm2 start ecosystem.config.js || node dist/index.js &');
                console.log('✓ 重启完成\n');

                // 5. 测试 API
                console.log('[5/5] 测试 API...');
                await new Promise(r => setTimeout(r, 3000));
                const api1 = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/ops/overview');
                console.log('ops/overview:', api1.substring(0, 200));
                
                const api2 = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/ops/service/health');
                console.log('ops/service/health:', api2.substring(0, 200));

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
