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
            console.log('检查服务器目录结构...\n');

            // 检查解压后的结构
            console.log('--- /opt/dgkj-server 内容 ---');
            const ls = await execCommand(conn, 'ls -la /opt/dgkj-server/');
            console.log(ls);

            console.log('\n--- 检查压缩包结构 ---');
            await execCommand(conn, 'unzip -l /tmp/dgkj_server.zip | head -50');

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
