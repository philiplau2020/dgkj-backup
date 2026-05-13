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

async function fix() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('修复数据库...\n');

            try {
                // 添加 group_name 列
                console.log('[1] 添加 group_name 列...');
                const result = await execCommand(conn, 'mysql -u dgkj -pDgkj@2024 -h localhost -e "ALTER TABLE dgkj.sys_config ADD COLUMN group_name VARCHAR(64) DEFAULT NULL AFTER config_type" 2>&1');
                console.log(result || '✓ 列已添加');

                // 验证
                console.log('\n[2] 验证表结构...');
                const table = await execCommand(conn, 'mysql -u dgkj -pDgkj@2024 -h localhost -e "DESCRIBE dgkj.sys_config" 2>&1');
                console.log(table);

                // 登录并测试配置 API
                console.log('\n[3] 测试 API...');
                const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
                const data = JSON.parse(login);
                const token = data.data.token;

                const configs = await execCommand(conn, `curl -s "http://localhost:3000/basic-api/sys/config/list" -H "Authorization: Bearer ${token}"`);
                console.log('配置列表响应:', configs.substring(0, 300));

            } catch (err) {
                console.error('错误:', err.message);
            }

            conn.end();
            console.log('\n✓ 修复完成!');
            resolve();
        });

        conn.on('error', (err) => {
            console.error('连接错误:', err.message);
            reject(err);
        });

        conn.connect({ host: server, port, username, privateKey, readyTimeout: 30000 });
    });
}

fix().catch(err => { console.error('失败:', err); process.exit(1); });
