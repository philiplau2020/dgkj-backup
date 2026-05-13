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
    console.log('部署前端 (修复重复菜单)...\n');

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            try {
                console.log('[1/4] 上传...');
                await uploadFile(conn, 'D:/DGKJ/frontend_fix.zip', '/tmp/dgkj_frontend.zip');

                console.log('[2/4] 清理...');
                await execCommand(conn, 'rm -rf /www/dgkj/admin/*');

                console.log('[3/4] 解压...');
                await execCommand(conn, 'cd /www/dgkj && unzip -o /tmp/dgkj_frontend.zip -d admin');

                console.log('[4/4] 权限...');
                await execCommand(conn, 'chmod -R 755 /www/dgkj/admin/');
                await execCommand(conn, 'chown -R www-data:www-data /www/dgkj/admin/');

                // 验证
                const files = await execCommand(conn, 'ls /www/dgkj/admin/ | head -10');
                console.log('\n部署文件:', files);

            } catch (err) {
                console.error('错误:', err.message);
            }

            conn.end();
            console.log('\n✓ 完成! 请刷新浏览器');
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
