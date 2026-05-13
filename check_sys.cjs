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
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('检查服务器状态...\n');

            try {
                // PM2 状态
                console.log('--- PM2 状态 ---');
                const status = await execCommand(conn, 'pm2 status');
                console.log(status);

                // 检查最新日志
                console.log('\n--- 最新错误日志 ---');
                const logs = await execCommand(conn, 'pm2 logs dgkj-server --err --lines 20 --nostream 2>&1');
                console.log(logs);

                // 测试系统管理 API
                console.log('\n--- 测试系统管理 API ---');
                const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
                const data = JSON.parse(login);
                const token = data.data.token;

                const tests = [
                    '/basic-api/sys/user/list',
                    '/basic-api/sys/role/list',
                    '/basic-api/sys/menu/list',
                    '/basic-api/sys/config/list',
                ];

                for (const url of tests) {
                    const result = await execCommand(conn, `curl -s "http://localhost:3000${url}" -H "Authorization: Bearer ${token}"`);
                    const ok = result.includes('"code":0') || result.includes('"code": 0');
                    console.log(`${ok ? '✓' : '✗'} ${url}: ${result.substring(0, 150)}`);
                }

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

        conn.connect({ host: server, port, username, privateKey, readyTimeout: 30000 });
    });
}

check().catch(err => { console.error('失败:', err); process.exit(1); });
