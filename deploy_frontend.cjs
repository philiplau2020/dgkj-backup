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
            let error = '';
            stream.on('data', (data) => { output += data; });
            stream.stderr.on('data', (data) => { error += data; });
            stream.on('close', () => {
                resolve({ output, error, code: stream.exitStatus });
            });
        });
    });
}

async function uploadFile(conn, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            const readStream = fs.createReadStream(localPath);
            const writeStream = sftp.createWriteStream(remotePath);
            
            writeStream.on('close', () => {
                sftp.end();
                resolve();
            });
            writeStream.on('error', (err) => {
                sftp.end();
                reject(err);
            });
            readStream.on('error', reject);
            readStream.pipe(writeStream);
        });
    });
}

async function deploy() {
    console.log('='.repeat(50));
    console.log('DGKJ 前端部署');
    console.log('='.repeat(50) + '\n');

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('[1/6] ✓ 连接成功\n');

            try {
                // 1. 清理旧文件
                console.log('[2/6] 清理旧文件...');
                await execCommand(conn, 'rm -rf /www/dgkj/admin/*');
                console.log('✓ 清理完成\n');

                // 2. 上传文件
                console.log('[3/6] 上传前端文件 (dist.zip)...');
                const distZip = 'D:/DGKJ/dist.zip';
                await uploadFile(conn, distZip, '/tmp/dgkj_deploy.zip');
                console.log('✓ 上传完成\n');

                // 3. 解压部署
                console.log('[4/6] 解压部署...');
                await execCommand(conn, 'cd /www/dgkj && unzip -o /tmp/dgkj_deploy.zip -d admin && rm /tmp/dgkj_deploy.zip');
                console.log('✓ 解压完成\n');

                // 4. 修复权限
                console.log('[5/6] 修复权限...');
                await execCommand(conn, 'chmod -R 755 /www/dgkj/admin/');
                await execCommand(conn, 'chown -R www-data:www-data /www/dgkj/admin/');
                console.log('✓ 权限修复完成\n');

                // 5. 检查文件
                console.log('[6/6] 验证部署...');
                const files = await execCommand(conn, 'ls -la /www/dgkj/admin/ | head -15');
                console.log(files.output);

                // 测试访问
                const test = await execCommand(conn, 'curl -s -o /dev/null -w "%{http_code}" http://localhost/');
                console.log('HTTP 状态码:', test.output.trim());

            } catch (err) {
                console.error('错误:', err.message);
                conn.end();
                reject(err);
                return;
            }

            conn.end();
            console.log('\n' + '='.repeat(50));
            console.log('✓ 部署完成! 请刷新浏览器:');
            console.log('https://dghs.gddogootech.com');
            console.log('='.repeat(50));
            resolve();
        });

        conn.on('error', (err) => {
            console.error('连接错误:', err.message);
            reject(err);
        });

        console.log('[1/6] 连接服务器...');
        conn.connect({
            host: server,
            port: port,
            username: username,
            privateKey: privateKey,
            readyTimeout: 30000,
        });
    });
}

deploy().catch(err => {
    console.error('部署失败:', err);
    process.exit(1);
});
