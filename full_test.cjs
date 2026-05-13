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

async function fullTest() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('重启服务...\n');
            await execCommand(conn, 'pm2 restart dgkj-server');
            await new Promise(r => setTimeout(r, 4000));

            // 登录
            const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
            const data = JSON.parse(login);
            const token = data.data.token;

            console.log('='.repeat(60));
            console.log('系统管理 + 运维监控 API 测试结果');
            console.log('='.repeat(60));

            const apis = [
                // 系统管理
                ['系统管理-用户列表', '/basic-api/sys/user/list'],
                ['系统管理-角色列表', '/basic-api/sys/role/list'],
                ['系统管理-菜单列表', '/basic-api/sys/menu/list'],
                ['系统管理-部门列表', '/basic-api/sys/dept/list'],
                ['系统管理-岗位列表', '/basic-api/sys/post/list'],
                ['系统管理-字典列表', '/basic-api/sys/dict/list'],
                ['系统管理-配置列表', '/basic-api/sys/config/list'],
                ['系统管理-日志列表', '/basic-api/sys/log/list'],
                ['系统管理-通知列表', '/basic-api/sys/notice/list'],
                // 运维监控
                ['运维-综合概览', '/basic-api/ops/overview'],
                ['运维-服务列表', '/basic-api/ops/service/list'],
                ['运维-服务健康', '/basic-api/ops/service/health'],
                ['运维-告警列表', '/basic-api/ops/alert/list'],
                ['运维-服务器列表', '/basic-api/ops/server/list'],
                ['运维-网络列表', '/basic-api/ops/network/list'],
                ['运维-业务概览', '/basic-api/ops/business/overview'],
                ['运维-日志列表', '/basic-api/ops/log/list'],
                ['运维-日志统计', '/basic-api/ops/log/statistics'],
            ];

            for (const [name, url] of apis) {
                const result = await execCommand(conn, `curl -s "http://localhost:3000${url}" -H "Authorization: Bearer ${token}"`);
                const ok = result.includes('"code":0') || result.includes('"code": 0');
                console.log(`${ok ? '✓' : '✗'} ${name}`);
                if (!ok) console.log(`  错误: ${result.substring(0, 100)}`);
            }

            conn.end();
            console.log('\n' + '='.repeat(60));
        });

        conn.on('error', (err) => {
            console.error('连接错误:', err.message);
            reject(err);
        });

        conn.connect({ host: server, port, username, privateKey, readyTimeout: 30000 });
    });
}

fullTest().catch(err => { console.error('失败:', err); process.exit(1); });
