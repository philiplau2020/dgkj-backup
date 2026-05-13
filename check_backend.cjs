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

async function check() {
    console.log('检查后端服务...\n');

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('✓ 连接成功\n');

            try {
                // 1. PM2 状态
                console.log('--- PM2 状态 ---');
                const pm2 = await execCommand(conn, 'pm2 status');
                console.log(pm2);

                // 2. 后端日志
                console.log('--- 后端日志 (最后50行) ---');
                const logs = await execCommand(conn, 'cd /opt/dgkj-server && pm2 logs dgkj-server --lines 50 --nostream');
                console.log(logs.slice(-3000));

                // 3. 测试 API
                console.log('--- 测试 API ---');
                const api = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/sys/config/list');
                console.log('API 响应:', api.substring(0, 500));

            } catch (err) {
                console.error('错误:', err.message);
            }

            conn.end();
            resolve();
        });

        conn.on('error', (err) => {
            console.error('连接错误:', err.message);
            reject(err);
        });

        conn.connect({
            host: server,
            port: port,
            username: username,
            privateKey: privateKey,
            readyTimeout: 30000,
        });
    });
}

check().catch(err => {
    console.error('失败:', err);
    process.exit(1);
});
