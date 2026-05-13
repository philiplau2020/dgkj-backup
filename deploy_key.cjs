const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const server = '120.78.7.180';
const port = 22;
const username = 'root';
const privateKey = fs.readFileSync(process.env.USERPROFILE + '\\.ssh\\id_rsa_dgkj', 'utf8');

const distZip = path.join(__dirname, 'dist.zip');

async function execCommand(conn, command) {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            let output = '';
            let error = '';
            stream.on('data', (data) => { output += data; });
            stream.stderr.on('data', (data) => { error += data; });
            stream.on('close', () => {
                resolve({ output, error, code: stream.exitStatus });
            });
        });
    });
}

async function deploy() {
    console.log('='.repeat(50));
    console.log('DGKJ 支付平台 - SSH 密钥部署');
    console.log('='.repeat(50));
    console.log();

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('[1/5] 连接服务器成功 (SSH 密钥)');
            console.log();

            try {
                // 清理旧文件
                console.log('[2/5] 清理旧文件...');
                const clean = await execCommand(conn, 'rm -rf /www/dgkj/admin/*');
                console.log('✓ 清理完成');
                console.log();

                // 上传文件
                console.log('[3/5] 上传前端文件...');
                await new Promise((res, rej) => {
                    conn.sftp((err, sftp) => {
                        if (err) return rej(err);
                        sftp.fastPut(distZip, '/tmp/dgkj_deploy.zip', (err) => {
                            if (err) return rej(err);
                            sftp.close();
                            res();
                        });
                    });
                });
                console.log('✓ 上传完成');
                console.log();

                // 解压部署
                console.log('[4/5] 解压部署...');
                const unzip = await execCommand(conn, 'cd /www/dgkj && unzip -o /tmp/dgkj_deploy.zip -d admin && rm /tmp/dgkj_deploy.zip');
                console.log('✓ 解压完成');
                console.log();

                // 重启后端
                console.log('[5/5] 重启后端服务...');
                const restart = await execCommand(conn, 'cd /opt/dgkj-server && pm2 restart dgkj-server && pm2 logs dgkj-server --lines 15');
                console.log('✓ 后端重启完成');
                console.log();
                console.log('--- 后端日志 ---');
                console.log(restart.output.slice(-1000));
                console.log();

                // 验证
                console.log('验证 API...');
                const verify = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/sys/config/list | head -c 300');
                console.log('API 响应:', verify.output.substring(0, 200));

            } catch (err) {
                console.error('错误:', err.message);
                conn.end();
                reject(err);
                return;
            }

            conn.end();
            console.log();
            console.log('='.repeat(50));
            console.log('✓ 部署完成!');
            console.log('访问地址: https://dghs.gddogootech.com');
            console.log('='.repeat(50));
            resolve();
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
            privateKey: privateKey,
            readyTimeout: 30000,
        });
    });
}

deploy().catch(err => {
    console.error('部署失败:', err);
    process.exit(1);
});
