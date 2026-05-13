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

async function restart() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            try {
                // 强制停止
                console.log('停止服务...');
                await execCommand(conn, 'pm2 delete dgkj-server 2>/dev/null || true');
                await execCommand(conn, 'pkill -f "node.*dgkj-server" 2>/dev/null || true');
                await new Promise(r => setTimeout(r, 2000));

                // 清理日志
                await execCommand(conn, 'pm2 flush');

                // 启动
                console.log('启动服务...');
                await execCommand(conn, 'cd /opt/dgkj-server && pm2 start ecosystem.config.js');
                await new Promise(r => setTimeout(r, 5000));

                // 检查状态
                console.log('\nPM2 状态:');
                const status = await execCommand(conn, 'pm2 status');
                console.log(status);

                // 检查日志
                console.log('\n启动日志:');
                const logs = await execCommand(conn, 'pm2 logs dgkj-server --out --lines 10 --nostream 2>&1');
                console.log(logs);

                // 测试
                console.log('\n测试:');
                const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
                const data = JSON.parse(login);
                const token = data.data.token;

                const result1 = await execCommand(conn, `curl -s "http://localhost:3000/basic-api/channel/list" -H "Authorization: Bearer ${token}"`);
                console.log('/basic-api/channel/list:', result1.substring(0, 100));

                const result2 = await execCommand(conn, `curl -s "http://localhost:3000/basic-api/channel/channel/list" -H "Authorization: Bearer ${token}"`);
                console.log('/basic-api/channel/channel/list:', result2.substring(0, 100));

                await execCommand(conn, 'pm2 save');

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

restart().catch(err => { console.error('失败:', err); process.exit(1); });
