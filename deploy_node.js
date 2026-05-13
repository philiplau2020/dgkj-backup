/**
 * DGKJ 部署脚本 - 使用 ssh2 库
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  host: '120.78.7.180',
  port: 22,
  username: 'root',
  password: 'Dogootech88',
  localDist: 'D:/DGKJ/dist',
  remoteDir: '/www/dgkj/admin',
};

function connect() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => resolve(conn));
    conn.on('error', (err) => {
      console.error('SSH 连接错误:', err.message);
      reject(err);
    });
    conn.connect({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      password: CONFIG.password,
      readyTimeout: 30000,
    });
  });
}

async function uploadAndDeploy() {
  console.log('=== DGKJ 部署脚本 ===\n');
  
  // 检查 dist 目录
  if (!fs.existsSync(CONFIG.localDist)) {
    console.error('错误: dist 目录不存在，请先运行 pnpm build');
    process.exit(1);
  }
  
  // 创建 zip 文件
  const archiver = require('archiver') || null;
  const zipPath = 'D:/DGKJ/frontend_deploy.zip';
  
  console.log('[1/4] 创建压缩包...');
  const { execSync } = require('child_process');
  try {
    execSync(`powershell -Command "Compress-Archive -Path '${CONFIG.localDist}\\*' -DestinationPath '${zipPath}' -Force"`, { stdio: 'inherit' });
    console.log('  压缩包创建成功:', zipPath);
  } catch (e) {
    console.error('  压缩失败');
    process.exit(1);
  }
  
  console.log('\n[2/4] 连接服务器...');
  let conn;
  try {
    conn = await connect();
    console.log('  连接成功!');
  } catch (e) {
    console.error('  连接失败:', e.message);
    process.exit(1);
  }
  
  console.log('\n[3/4] 上传文件...');
  try {
    await new Promise((resolve, reject) => {
      conn.sftp((err, sftp) => {
        if (err) return reject(err);
        sftp.fastPut(zipPath, '/tmp/dgkj_frontend.zip', (err) => {
          if (err) return reject(err);
          console.log('  上传成功!');
          resolve();
        });
      });
    });
  } catch (e) {
    console.error('  上传失败:', e.message);
    conn.end();
    process.exit(1);
  }
  
  console.log('\n[4/4] 执行部署命令...');
  try {
    await new Promise((resolve, reject) => {
      conn.exec(`
        cd /www/dgkj/admin
        rm -rf *
        unzip -o /tmp/dgkj_frontend.zip -d .
        ls -la
        echo "=== 部署完成 ==="
      `, (err, stream) => {
        if (err) return reject(err);
        stream.on('close', () => resolve());
        stream.on('data', (data) => console.log('  ' + data.toString()));
        stream.stderr.on('data', (data) => console.error('  ERROR:', data.toString()));
      });
    });
  } catch (e) {
    console.error('  部署命令执行失败:', e.message);
  }
  
  // 清理
  conn.end();
  try {
    fs.unlinkSync(zipPath);
  } catch (e) {}
  
  console.log('\n=== 部署完成 ===');
  console.log('访问地址: https://dghs.gddogootech.com');
}

uploadAndDeploy().catch(console.error);
