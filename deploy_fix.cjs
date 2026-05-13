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
    console.log('部署后端...\n');

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            try {
                // 上传
                console.log('[1/5] 上传...');
                await uploadFile(conn, 'D:/DGKJ/server_build.zip', '/tmp/dgkj_server.zip');

                // 停止旧服务
                console.log('[2/5] 停止服务...');
                await execCommand(conn, 'pm2 stop dgkj-server 2>/dev/null || true');

                // 解压
                console.log('[3/5] 解压...');
                await execCommand(conn, 'cd /opt/dgkj-server && unzip -o /tmp/dgkj_server.zip');

                // 重启
                console.log('[4/5] 重启服务...');
                await execCommand(conn, 'cd /opt/dgkj-server && pm2 start ecosystem.config.js');

                await new Promise(r => setTimeout(r, 3000));

                // 测试
                console.log('[5/5] 测试 API...');
                const users = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/sys/user/list');
                console.log('sys/user/list:', users.substring(0, 300));

                const ops = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/ops/overview');
                console.log('ops/overview:', ops.substring(0, 200));

                await execCommand(conn, 'pm2 save');

            } catch (err) {
                console.error('错误:', err.message);
            }

            conn.end();
            console.log('\n✓ 完成!');
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
