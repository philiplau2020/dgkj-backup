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

async function deploy() {
    console.log('='.repeat(50));
    console.log('DGKJ 后端部署');
    console.log('='.repeat(50) + '\n');

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('✓ 连接成功\n');

            try {
                // 1. 检查 PM2 状态
                console.log('[1/5] PM2 状态...');
                const pm2 = await execCommand(conn, 'pm2 status');
                console.log(pm2);

                // 2. 重启后端
                console.log('\n[2/5] 重启后端服务...');
                await execCommand(conn, 'cd /opt/dgkj-server && pm2 restart dgkj-server');
                console.log('✓ 重启完成');
                await new Promise(r => setTimeout(r, 2000));

                // 3. 查看日志
                console.log('\n[3/5] 后端日志...');
                const logs = await execCommand(conn, 'cd /opt/dgkj-server && pm2 logs dgkj-server --lines 30 --nostream');
                console.log(logs.slice(-2000));

                // 4. 测试 API
                console.log('\n[4/5] 测试 API...');
                const api = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/sys/config/list');
                console.log('API 响应:', api.substring(0, 300));

                // 5. PM2 保存
                console.log('\n[5/5] 保存 PM2 状态...');
                await execCommand(conn, 'pm2 save');
                console.log('✓ 保存完成');

            } catch (err) {
                console.error('错误:', err.message);
                conn.end();
                reject(err);
                return;
            }

            conn.end();
            console.log('\n' + '='.repeat(50));
            console.log('✓ 后端部署完成!');
            console.log('='.repeat(50));
            resolve();
        });

        conn.on('error', (err) => {
            console.error('连接错误:', err.message);
            reject(err);
        });

        console.log('连接服务器...');
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
    console.error('失败:', err);
    process.exit(1);
});
