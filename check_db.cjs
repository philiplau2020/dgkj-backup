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
            console.log('检查后端日志...\n');

            try {
                // 查看 PM2 错误日志
                console.log('--- PM2 错误日志 ---');
                const logs = await execCommand(conn, 'pm2 logs dgkj-server --err --lines 50 --nostream 2>&1');
                console.log(logs);

                // 测试数据库连接
                console.log('\n--- 测试数据库连接 ---');
                const db = await execCommand(conn, 'mysql -u dgkj -p"Dgkj@2024" -h localhost -e "SELECT 1" dgkj 2>&1');
                console.log(db);

                // 检查数据库表
                console.log('\n--- 数据库表 ---');
                const tables = await execCommand(conn, 'mysql -u dgkj -p"Dgkj@2024" -h localhost -e "SHOW TABLES" dgkj 2>&1');
                console.log(tables);

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
