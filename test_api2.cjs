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
                // 登录
                console.log('[1] 登录...');
                const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
                const data = JSON.parse(login);
                const token = data.data.token;
                console.log('✓ 登录成功, token:', token.substring(0, 30) + '...');

                // 测试用户列表
                console.log('\n[2] 用户列表...');
                const users = await execCommand(conn, `curl -s "http://localhost:3000/basic-api/sys/user/list" -H "Authorization: Bearer ${token}"`);
                console.log(users.substring(0, 500));

                // 测试角色列表
                console.log('\n[3] 角色列表...');
                const roles = await execCommand(conn, `curl -s "http://localhost:3000/basic-api/sys/role/list" -H "Authorization: Bearer ${token}"`);
                console.log(roles.substring(0, 500));

                // 测试菜单列表
                console.log('\n[4] 菜单列表...');
                const menus = await execCommand(conn, `curl -s "http://localhost:3000/basic-api/sys/menu/list" -H "Authorization: Bearer ${token}"`);
                console.log(menus.substring(0, 500));

                // 测试配置列表
                console.log('\n[5] 配置列表...');
                const configs = await execCommand(conn, `curl -s "http://localhost:3000/basic-api/sys/config/list" -H "Authorization: Bearer ${token}"`);
                console.log(configs.substring(0, 500));

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
