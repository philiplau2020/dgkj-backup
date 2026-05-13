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
            console.log('检查服务器...\n');

            try {
                // 检查目录结构
                console.log('--- 目录结构 ---');
                const dirs = await execCommand(conn, 'ls -la /opt/');
                console.log(dirs);

                // 检查旧服务目录
                console.log('\n--- 旧服务目录 (/opt/dgkj-server) ---');
                const oldDir = await execCommand(conn, 'ls -la /opt/dgkj-server/dist/modules/ 2>/dev/null | head -20 || echo "目录不存在"');
                console.log(oldDir);

                // 检查新服务目录
                console.log('\n--- 新服务目录 (/opt/dgkj-server-new) ---');
                const newDir = await execCommand(conn, 'ls -la /opt/dgkj-server-new/dist/modules/ 2>/dev/null | head -20 || echo "目录不存在"');
                console.log(newDir);

                // 检查 ops 模块是否存在
                console.log('\n--- 检查 ops 模块 ---');
                const opsCheck = await execCommand(conn, 'find /opt -name "ops*" 2>/dev/null');
                console.log(opsCheck || '未找到 ops 相关文件');

                // PM2 状态
                console.log('\n--- PM2 状态 ---');
                const pm2 = await execCommand(conn, 'pm2 status');
                console.log(pm2);

                // 日志
                console.log('\n--- 启动日志 ---');
                const logs = await execCommand(conn, 'pm2 logs dgkj-server-new --lines 20 --nostream 2>/dev/null || pm2 logs --lines 20 --nostream');
                console.log(logs);

                // 测试 index.ts 是否包含 ops
                console.log('\n--- 检查 index.ts 是否包含 ops ---');
                const indexCheck = await execCommand(conn, 'grep -n "ops" /opt/dgkj-server-new/dist/index.js 2>/dev/null || grep -n "ops" /opt/dgkj-server/dist/index.js 2>/dev/null || echo "未找到"');
                console.log(indexCheck || '未找到');

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
