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
            console.log('检查所有 API...\n');
            console.log('='.repeat(50) + '\n');

            try {
                // 1. 系统管理 - 用户管理
                console.log('[1] GET /basic-api/sys/user/list');
                const users = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/sys/user/list');
                console.log(users.substring(0, 300));
                console.log();

                // 2. 系统管理 - 角色管理
                console.log('[2] GET /basic-api/sys/role/list');
                const roles = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/sys/role/list');
                console.log(roles.substring(0, 300));
                console.log();

                // 3. 系统管理 - 菜单管理
                console.log('[3] GET /basic-api/sys/menu/list');
                const menus = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/sys/menu/list');
                console.log(menus.substring(0, 300));
                console.log();

                // 4. 系统管理 - 部门管理
                console.log('[4] GET /basic-api/sys/dept/list');
                const depts = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/sys/dept/list');
                console.log(depts.substring(0, 300));
                console.log();

                // 5. 系统管理 - 岗位管理
                console.log('[5] GET /basic-api/sys/post/list');
                const posts = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/sys/post/list');
                console.log(posts.substring(0, 300));
                console.log();

                // 6. 系统管理 - 字典管理
                console.log('[6] GET /basic-api/sys/dict/type/list');
                const dicts = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/sys/dict/type/list');
                console.log(dicts.substring(0, 300));
                console.log();

                // 7. 系统管理 - 配置管理
                console.log('[7] GET /basic-api/sys/config/list');
                const configs = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/sys/config/list');
                console.log(configs.substring(0, 300));
                console.log();

                // 8. 运维监控 - 服务健康
                console.log('[8] GET /basic-api/ops/service/health');
                const health = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/ops/service/health');
                console.log(health.substring(0, 300));
                console.log();

                // 9. 运维监控 - 告警列表
                console.log('[9] GET /basic-api/ops/alert/list');
                const alerts = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/ops/alert/list');
                console.log(alerts.substring(0, 300));
                console.log();

                // 10. 运维监控 - 服务器列表
                console.log('[10] GET /basic-api/ops/server/list');
                const servers = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/ops/server/list');
                console.log(servers.substring(0, 300));
                console.log();

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
