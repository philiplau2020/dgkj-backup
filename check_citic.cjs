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

async function checkCitic() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('检查中信银行 API...\n');

            try {
                // 登录
                const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
                const data = JSON.parse(login);
                const token = data.data.token;

                const apis = [
                    ['中信-账户列表', '/basic-api/citic/account/list'],
                    ['中信-银行卡列表', '/basic-api/citic/card/list'],
                    ['中信-代收列表', '/basic-api/citic/collection/list'],
                    ['中信-代付列表', '/basic-api/citic/payment/list'],
                    ['中信-分润列表', '/basic-api/citic/profit-share/list'],
                    ['中信-对账列表', '/basic-api/citic/check/list'],
                    ['中信-结算列表', '/basic-api/citic/settlement/list'],
                    ['中信-商户配置', '/basic-api/citic/config/list'],
                ];

                for (const [name, url] of apis) {
                    const result = await execCommand(conn, `curl -s "http://localhost:3000${url}" -H "Authorization: Bearer ${token}"`);
                    const ok = result.includes('"code":0') || result.includes('"code": 0');
                    console.log(`${ok ? '✓' : '✗'} ${name}`);
                    if (!ok) console.log(`  ${result.substring(0, 150)}`);
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

checkCitic().catch(err => { console.error('失败:', err); process.exit(1); });
