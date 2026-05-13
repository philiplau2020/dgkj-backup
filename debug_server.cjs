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

async function deploy() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('连接成功\n');

            try {
                // 检查 dist/index.js 是否存在
                console.log('检查文件...');
                const check = await execCommand(conn, 'ls -la /opt/dgkj-server/dist/index.js');
                console.log(check);

                // 直接用 node 运行看错误
                console.log('\n启动服务 (查看错误)...');
                const output = await execCommand(conn, 'cd /opt/dgkj-server && node dist/index.js 2>&1 &');
                console.log(output);

                await new Promise(r => setTimeout(r, 5000));

                // 检查
                const logs = await execCommand(conn, 'pm2 logs --lines 30 --nostream 2>&1');
                console.log('\nPM2 日志:\n', logs);

                // 测试
                const health = await execCommand(conn, 'curl -s http://localhost:3000/health 2>&1');
                console.log('\nHealth:', health);

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

deploy().catch(err => { console.error('失败:', err); process.exit(1); });
