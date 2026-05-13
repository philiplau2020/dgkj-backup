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

async function testAll() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('='.repeat(50));
            console.log('全面测试 API');
            console.log('='.repeat(50) + '\n');

            try {
                // 登录
                const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
                const data = JSON.parse(login);
                const token = data.data.token;

                const apis = [
                    { name: '用户列表', url: '/basic-api/sys/user/list' },
                    { name: '角色列表', url: '/basic-api/sys/role/list' },
                    { name: '菜单列表', url: '/basic-api/sys/menu/list' },
                    { name: '部门列表', url: '/basic-api/sys/dept/list' },
                    { name: '岗位列表', url: '/basic-api/sys/post/list' },
                    { name: '字典列表', url: '/basic-api/sys/dict/list' },
                    { name: '配置列表', url: '/basic-api/sys/config/list' },
                    { name: '日志列表', url: '/basic-api/sys/log/list' },
                    { name: '通知列表', url: '/basic-api/sys/notice/list' },
                    { name: '运维概览', url: '/basic-api/ops/overview' },
                    { name: '服务健康', url: '/basic-api/ops/service/health' },
                    { name: '告警列表', url: '/basic-api/ops/alert/list' },
                    { name: '服务器列表', url: '/basic-api/ops/server/list' },
                ];

                for (const api of apis) {
                    const result = await execCommand(conn, `curl -s "http://localhost:3000${api.url}" -H "Authorization: Bearer ${token}"`);
                    const status = result.includes('"code":0') ? '✓' : '✗';
                    console.log(`${status} ${api.name}: ${result.substring(0, 80)}`);
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

testAll().catch(err => { console.error('失败:', err); process.exit(1); });
