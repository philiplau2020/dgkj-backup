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
            console.log('测试 API...\n');

            try {
                // 1. 登录获取 token
                console.log('[1] 登录获取 token...');
                const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
                console.log('登录响应:', login.substring(0, 500));

                // 提取 token
                const tokenMatch = login.match(/"token"\\s*:\\s*"([^"]+)"/);
                if (tokenMatch) {
                    const token = tokenMatch[1];
                    console.log('\nToken:', token.substring(0, 50) + '...');

                    // 2. 使用 token 测试用户列表
                    console.log('\n[2] 测试用户列表...');
                    const users = await execCommand(conn, `curl -s http://localhost:3000/basic-api/sys/user/list -H "Authorization: Bearer ${token}"`);
                    console.log('用户列表:', users.substring(0, 500));

                    // 3. 测试配置列表
                    console.log('\n[3] 测试配置列表...');
                    const configs = await execCommand(conn, `curl -s http://localhost:3000/basic-api/sys/config/list -H "Authorization: Bearer ${token}"`);
                    console.log('配置列表:', configs.substring(0, 500));
                } else {
                    console.log('无法获取 token');
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

test().catch(err => { console.error('失败:', err); process.exit(1); });
