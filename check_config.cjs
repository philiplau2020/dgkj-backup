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

async function test() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            try {
                // 登录
                const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
                const data = JSON.parse(login);
                const token = data.data.token;

                // 清空日志
                await execCommand(conn, 'pm2 flush');

                // 测试配置列表
                console.log('测试配置列表...');
                const configs = await execCommand(conn, `curl -s "http://localhost:3000/basic-api/sys/config/list" -H "Authorization: Bearer ${token}"`);
                console.log('响应:', configs.substring(0, 500));

                // 等待日志写入
                await new Promise(r => setTimeout(r, 1000));

                // 查看错误日志
                console.log('\n--- 错误日志 ---');
                const logs = await execCommand(conn, 'pm2 logs dgkj-server --err --lines 10 --nostream 2>&1');
                console.log(logs);

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

test().catch(err => { console.error('失败:', err); process.exit(1); });
