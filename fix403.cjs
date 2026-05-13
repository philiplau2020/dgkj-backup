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

async function fix403() {
    console.log('连接服务器检查 403 错误...\n');

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('✓ 连接成功\n');

            try {
                // 1. 检查 Nginx 配置
                console.log('--- Nginx 配置 ---');
                const nginxConf = await execCommand(conn, 'cat /etc/nginx/sites-enabled/dgkj-admin 2>/dev/null || cat /etc/nginx/conf.d/dgkj-admin.conf 2>/dev/null || cat /etc/nginx/nginx.conf | grep -A 50 "server {"');
                console.log(nginxConf.output || '未找到配置文件');

                // 2. 检查文件权限
                console.log('\n--- 文件权限 ---');
                const perms = await execCommand(conn, 'ls -la /www/dgkj/admin/ | head -20');
                console.log(perms.output);

                // 3. 检查 Nginx 错误日志
                console.log('\n--- Nginx 错误日志 ---');
                const errorLog = await execCommand(conn, 'tail -20 /var/log/nginx/error.log 2>/dev/null || tail -20 /var/log/nginx/dgkj-admin.error.log 2>/dev/null');
                console.log(errorLog.output || errorLog.error);

                // 4. 修复权限
                console.log('\n--- 修复权限 ---');
                await execCommand(conn, 'chmod -R 755 /www/dgkj/admin/');
                await execCommand(conn, 'chown -R www-data:www-data /www/dgkj/admin/');
                console.log('✓ 权限已修复');

                // 5. 检查 index.html 是否存在
                console.log('\n--- 检查 index.html ---');
                const indexCheck = await execCommand(conn, 'test -f /www/dgkj/admin/index.html && echo "index.html 存在" || echo "index.html 不存在"');
                console.log(indexCheck.output);

                // 6. 重载 Nginx
                console.log('\n--- 重载 Nginx ---');
                const reload = await execCommand(conn, 'nginx -t && systemctl reload nginx');
                console.log(reload.output || 'Nginx 重载成功');

                // 7. 测试访问
                console.log('\n--- 测试访问 ---');
                const test = await execCommand(conn, 'curl -s -o /dev/null -w "%{http_code}" http://localhost/');
                console.log('HTTP 状态码:', test.output.trim());

            } catch (err) {
                console.error('错误:', err.message);
            }

            conn.end();
            console.log('\n请刷新浏览器重试!');
            resolve();
        });

        conn.on('error', (err) => {
            console.error('连接错误:', err.message);
            reject(err);
        });

        conn.connect({
            host: server,
            port: port,
            username: username,
            privateKey: privateKey,
            readyTimeout: 30000,
        });
    });
}

fix403().catch(err => {
    console.error('失败:', err);
    process.exit(1);
});
