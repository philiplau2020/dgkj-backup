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

async function uploadFile(conn, localPath, remotePath) {
    return new Promise((res, rej) => {
        conn.sftp((err, sftp) => {
            if (err) return rej(err);
            const readStream = fs.createReadStream(localPath);
            const writeStream = sftp.createWriteStream(remotePath);
            writeStream.on('close', () => { sftp.end(); res(); });
            writeStream.on('error', (e) => { sftp.end(); rej(e); });
            readStream.pipe(writeStream);
        });
    });
}

async function deploy() {
    console.log('部署最终版本...\n');

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            try {
                console.log('[1/4] 上传...');
                await uploadFile(conn, 'D:/DGKJ/server_build5.zip', '/tmp/dgkj_server5.zip');

                console.log('[2/4] 停止...');
                await execCommand(conn, 'pm2 stop dgkj-server 2>/dev/null || true');

                console.log('[3/4] 解压部署...');
                await execCommand(conn, 'cd /opt/dgkj-server && unzip -o /tmp/dgkj_server5.zip');
                await execCommand(conn, 'cd /opt/dgkj-server && pm2 start ecosystem.config.js');
                await new Promise(r => setTimeout(r, 4000));

                console.log('[4/4] 测试...');
                const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
                const data = JSON.parse(login);
                const token = data.data.token;

                const tests = [
                    ['/basic-api/channel/list', '通道列表'],
                    ['/basic-api/pool/channel/list', '通道池列表'],
                    ['/basic-api/citic/auto/configs', '银行配置'],
                ];

                let allPass = true;
                for (const [url, name] of tests) {
                    const result = await execCommand(conn, `curl -s "http://localhost:3000${url}" -H "Authorization: Bearer ${token}"`);
                    const ok = result.includes('"code":0') || result.includes('"code": 0');
                    if (!ok) allPass = false;
                    console.log(`${ok ? '✓' : '✗'} ${name}`);
                }

                await execCommand(conn, 'pm2 save');
                console.log('\n' + (allPass ? '✓ 所有测试通过!' : '✗ 部分测试失败'));

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
