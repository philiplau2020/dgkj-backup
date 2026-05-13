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

async function checkAll() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('='.repeat(60));
            console.log('全面检查所有菜单 API');
            console.log('='.repeat(60) + '\n');

            // 登录
            const login = await execCommand(conn, 'curl -s -X POST http://localhost:3000/basic-api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"');
            const data = JSON.parse(login);
            const token = data.data.token;

            const apis = [
                // ========== 系统管理 ==========
                ['[系统管理] 用户列表', '/basic-api/sys/user/list'],
                ['[系统管理] 角色列表', '/basic-api/sys/role/list'],
                ['[系统管理] 菜单列表', '/basic-api/sys/menu/list'],
                ['[系统管理] 部门列表', '/basic-api/sys/dept/list'],
                ['[系统管理] 字典列表', '/basic-api/sys/dict/list'],
                ['[系统管理] 配置列表', '/basic-api/sys/config/list'],
                ['[系统管理] 日志列表', '/basic-api/sys/log/list'],
                ['[系统管理] 通知列表', '/basic-api/sys/notice/list'],
                // ========== 运维监控 ==========
                ['[运维] 综合概览', '/basic-api/ops/overview'],
                ['[运维] 服务列表', '/basic-api/ops/service/list'],
                ['[运维] 服务健康', '/basic-api/ops/service/health'],
                ['[运维] 告警列表', '/basic-api/ops/alert/list'],
                ['[运维] 服务器列表', '/basic-api/ops/server/list'],
                ['[运维] 网络列表', '/basic-api/ops/network/list'],
                ['[运维] 业务概览', '/basic-api/ops/business/overview'],
                ['[运维] 日志列表', '/basic-api/ops/log/list'],
                // ========== 中信银行 ==========
                ['[中信] 账户列表', '/basic-api/citic/account/list'],
                ['[中信] 银行卡列表', '/basic-api/citic/card/list'],
                ['[中信] 资金归集列表', '/basic-api/citic/collection/list'],
                ['[中信] 余额分账列表', '/basic-api/citic/profit-share/list'],
                ['[中信] 代付列表', '/basic-api/citic/transfer/list'],
                ['[中信] 结算列表', '/basic-api/citic/settlement/list'],
                ['[中信] 对账列表', '/basic-api/citic/check/list'],
                ['[中信] 银行配置', '/basic-api/citic/auto/configs'],
                // ========== 商户管理 ==========
                ['[商户] 商户列表', '/basic-api/merchant/list'],
                ['[商户] 应用列表', '/basic-api/merchant/app/list'],
                ['[商户] 门店列表', '/basic-api/merchant/store/list'],
                // ========== 代理管理 ==========
                ['[代理] 代理列表', '/basic-api/agent/list'],
                // ========== 交易管理 ==========
                ['[交易] 订单列表', '/basic-api/order/list'],
                ['[交易] 退款列表', '/basic-api/refund/list'],
                // ========== 财务管理 ==========
                ['[财务] 账户列表', '/basic-api/account/list'],
                ['[财务] 结算列表', '/basic-api/finance/settlement/list'],
                // ========== 通道管理 ==========
                ['[通道] 通道列表', '/basic-api/channel/list'],
                ['[通道] 通道池列表', '/basic-api/pool/list'],
                // ========== 设备管理 ==========
                ['[设备] 设备列表', '/basic-api/device/list'],
                // ========== 对账管理 ==========
                ['[对账] 对账批次', '/basic-api/check/list'],
                // ========== 分润管理 ==========
                ['[分润] 分润记录', '/basic-api/profit/list'],
                // ========== 统计 ==========
                ['[统计] 仪表盘', '/basic-api/stat/dashboard'],
            ];

            let passCount = 0;
            let failCount = 0;

            for (const [name, url] of apis) {
                const result = await execCommand(conn, `curl -s "http://localhost:3000${url}" -H "Authorization: Bearer ${token}"`);
                const ok = result.includes('"code":0') || result.includes('"code": 0');
                
                if (ok) {
                    passCount++;
                    console.log(`✓ ${name}`);
                } else {
                    failCount++;
                    const errMsg = result.includes('Cannot GET') ? '404' : '错误';
                    console.log(`✗ ${name} (${errMsg})`);
                }
            }

            console.log('\n' + '='.repeat(60));
            console.log(`检查完成: ✓ ${passCount} 个通过, ✗ ${failCount} 个失败`);
            console.log('='.repeat(60));

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

checkAll().catch(err => { console.error('失败:', err); process.exit(1); });
