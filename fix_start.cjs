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

async function fix() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('修复配置并启动服务...\n');

            try {
                // 1. 修复 ecosystem.config.js
                console.log('[1] 修复 ecosystem.config.js...');
                await execCommand(conn, `cat > /opt/dgkj-server/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: "dgkj-server",
    script: "index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "500M",
    env: { NODE_ENV: "production" }
  }]
};
EOF`);
                console.log('✓ 配置修复完成');

                // 2. 删除旧的 PM2 进程
                console.log('\n[2] 删除旧 PM2 进程...');
                await execCommand(conn, 'pm2 delete dgkj-server 2>/dev/null || true');
                console.log('✓ 删除完成');

                // 3. 启动服务
                console.log('\n[3] 启动服务...');
                await execCommand(conn, 'cd /opt/dgkj-server && pm2 start ecosystem.config.js');
                console.log('✓ 启动完成');

                // 4. 等待启动
                console.log('\n[4] 等待服务启动...');
                await new Promise(r => setTimeout(r, 5000));

                // 5. 检查状态
                console.log('\n[5] 检查状态...');
                const pm2 = await execCommand(conn, 'pm2 status');
                console.log(pm2);

                // 6. 测试 API
                console.log('\n[6] 测试 API...');
                const health = await execCommand(conn, 'curl -s http://localhost:3000/health');
                console.log('Health:', health);

                const ops = await execCommand(conn, 'curl -s http://localhost:3000/basic-api/ops/overview');
                console.log('Ops Overview:', ops.substring(0, 300));

                // 7. 保存
                await execCommand(conn, 'pm2 save');

            } catch (err) {
                console.error('错误:', err.message);
            }

            conn.end();
            console.log('\n✓ 完成!');
            resolve();
        });

        conn.on('error', (err) => {
            console.error('连接错误:', err.message);
            reject(err);
        });

        conn.connect({ host: server, port, username, privateKey, readyTimeout: 30000 });
    });
}

fix().catch(err => { console.error('失败:', err); process.exit(1); });
