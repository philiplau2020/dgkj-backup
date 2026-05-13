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
            // 登录获取 token
            const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
            const data = JSON.parse(login);
            const token = data.data.token;

            // 测试不同的路径
            const tests = [
                // 通道相关
                ['/basic-api/channel/mch/list', 'channel/mch/list'],
                ['/basic-api/channel/channel/list', 'channel/channel/list'],
                ['/basic-api/channel/list', 'channel/list'],
                // 对账相关
                ['/basic-api/check/list', 'check/list'],
                ['/basic-api/check/batch/list', 'check/batch/list'],
                // 分润相关
                ['/basic-api/profit/list', 'profit/list'],
                ['/basic-api/profit/record/list', 'profit/record/list'],
            ];

            console.log('测试路径:');
            for (const [url, name] of tests) {
                const result = await execCommand(conn, `curl -s "http://localhost:3000${url}" -H "Authorization: Bearer ${token}"`);
                const ok = result.includes('"code":0') || result.includes('"code": 0');
                console.log(`${ok ? '✓' : '✗'} ${name}`);
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
