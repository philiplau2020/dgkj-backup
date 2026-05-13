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
            try {
                // PM2 状态
                console.log('--- PM2 状态 ---');
                const pm2 = await execCommand(conn, 'pm2 status');
                console.log(pm2);

                // 日志
                console.log('\n--- PM2 日志 ---');
                const logs = await execCommand(conn, 'pm2 logs dgkj-server --lines 50 --nostream 2>&1');
                console.log(logs);

                // 测试 health
                console.log('\n--- 测试 health ---');
                const health = await execCommand(conn, 'curl -v http://localhost:3000/health 2>&1');
                console.log(health);

                // 检查端口
                console.log('\n--- 检查端口 ---');
                const port = await execCommand(conn, 'netstat -tlnp | grep 3000');
                console.log(port);

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
