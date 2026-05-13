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
    console.log('部署新前端...\n');

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            try {
                // 上传
                console.log('[1/4] 上传前端...');
                await uploadFile(conn, 'D:/DGKJ/dist_new.zip', '/tmp/dgkj_dist.zip');

                // 清理并解压
                console.log('[2/4] 解压部署...');
                await execCommand(conn, 'rm -rf /www/dgkj/admin/*');
                await execCommand(conn, 'cd /www/dgkj && unzip -o /tmp/dgkj_dist.zip -d admin');

                // 修复权限
                console.log('[3/4] 修复权限...');
                await execCommand(conn, 'chmod -R 755 /www/dgkj/admin/');
                await execCommand(conn, 'chown -R www-data:www-data /www/dgkj/admin/');

                // 测试
                console.log('[4/4] 测试访问...');
                const test = await execCommand(conn, 'curl -s -o /dev/null -w "%{http_code}" http://localhost/');
                console.log('HTTP 状态码:', test.trim());

            } catch (err) {
                console.error('错误:', err.message);
            }

            conn.end();
            console.log('\n✓ 前端部署完成!');
            console.log('请刷新浏览器: https://dghs.gddogootech.com');
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
