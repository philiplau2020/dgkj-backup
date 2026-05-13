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

async function debug() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            // 检查 index.js 中的 channel 挂载
            console.log('检查 index.js...');
            const index = await execCommand(conn, 'grep -n "channel" /opt/dgkj-server/dist/index.js');
            console.log(index);

            // 测试不同的路径
            const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
            const data = JSON.parse(login);
            const token = data.data.token;

            console.log('\n测试路径:');
            const tests = [
                '/basic-api/channel/channel/list',
                '/basic-api/channel/list',
                '/basic-api/channel',
            ];

            for (const path of tests) {
                const result = await execCommand(conn, `curl -s "http://localhost:3000${path}" -H "Authorization: Bearer ${token}"`);
                console.log(`${path}: ${result.substring(0, 100)}`);
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

debug().catch(err => { console.error('失败:', err); process.exit(1); });
