import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../config/data-source';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Create admin user with correct hash
    const userRepo = AppDataSource.getRepository('SysUser');
    const existingAdmin = await userRepo.findOne({ where: { username: 'admin' } });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await userRepo.save({
        id: uuidv4(),
        username: 'admin',
        password: hashedPassword,
        nickname: 'Administrator',
        email: 'admin@example.com',
        mobile: '13800138000',
        userType: 0,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });
      console.log('Admin user created: admin / admin123');
    }

    // Create default role
    const roleRepo = AppDataSource.getRepository('SysRole');
    const existingRole = await roleRepo.findOne({ where: { roleCode: 'admin' } });

    if (!existingRole) {
      await roleRepo.save({
        id: uuidv4(),
        roleName: 'Administrator',
        roleCode: 'admin',
        roleDesc: 'System Administrator',
        status: 1,
        sort: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });
      console.log('Default role created');
    }

    // Create default menus
    const menuRepo = AppDataSource.getRepository('SysMenu');
    const menuCount = await menuRepo.count();

    if (menuCount === 0) {
      const dashboardId = uuidv4();
      const sysId = uuidv4();
      const mchId = uuidv4();
      const agentId = uuidv4();
      const tradeId = uuidv4();
      const financeId = uuidv4();
      const statisticsId = uuidv4();
      const channelId = uuidv4();
      const citicId = uuidv4();
      const deviceId = uuidv4();
      const profitId = uuidv4();

      const menus = [
        { id: dashboardId, parentId: '0', menuName: 'Dashboard', menuCode: 'dashboard', path: '/dashboard', component: '/dashboard/index', menuType: 1, status: 1, sort: 1 },
        { id: sysId, parentId: '0', menuName: 'System', menuCode: 'system', path: '/sys', redirect: '/sys/user', menuType: 0, status: 1, sort: 90 },
        { id: uuidv4(), parentId: sysId, menuName: 'User Management', menuCode: 'sys:user', path: '/sys/user', component: '/sys/user/index', menuType: 1, perms: 'sys:user:list', status: 1, sort: 1 },
        { id: uuidv4(), parentId: sysId, menuName: 'Role Management', menuCode: 'sys:role', path: '/sys/role', component: '/sys/role/index', menuType: 1, perms: 'sys:role:list', status: 1, sort: 2 },
        { id: uuidv4(), parentId: sysId, menuName: 'Menu Management', menuCode: 'sys:menu', path: '/sys/menu', component: '/sys/menu/index', menuType: 1, perms: 'sys:menu:list', status: 1, sort: 3 },
        { id: uuidv4(), parentId: sysId, menuName: 'Department', menuCode: 'sys:dept', path: '/sys/dept', component: '/sys/dept/index', menuType: 1, perms: 'sys:dept:list', status: 1, sort: 4 },
        { id: uuidv4(), parentId: sysId, menuName: 'Dictionary', menuCode: 'sys:dict', path: '/sys/dict', component: '/sys/dict/index', menuType: 1, perms: 'sys:dict:list', status: 1, sort: 5 },
        { id: uuidv4(), parentId: sysId, menuName: 'System Config', menuCode: 'sys:config', path: '/sys/config', component: '/sys/config/index', menuType: 1, perms: 'sys:config:list', status: 1, sort: 6 },
        { id: uuidv4(), parentId: sysId, menuName: 'System Log', menuCode: 'sys:log', path: '/sys/log', component: '/sys/log/index', menuType: 1, perms: 'sys:log:list', status: 1, sort: 7 },
        { id: mchId, parentId: '0', menuName: 'Merchant', menuCode: 'merchant', path: '/mch', redirect: '/mch/list', menuType: 0, status: 1, sort: 30 },
        { id: uuidv4(), parentId: mchId, menuName: 'Merchant List', menuCode: 'mch:list', path: '/mch/list', component: '/mch/list/index', menuType: 1, perms: 'mch:list:list', status: 1, sort: 1 },
        { id: uuidv4(), parentId: mchId, menuName: 'Merchant Audit', menuCode: 'mch:audit', path: '/mch/audit', component: '/mch/audit/index', menuType: 1, perms: 'mch:audit:list', status: 1, sort: 2 },
        { id: agentId, parentId: '0', menuName: 'Agent', menuCode: 'agent', path: '/agent', redirect: '/agent/list', menuType: 0, status: 1, sort: 35 },
        { id: uuidv4(), parentId: agentId, menuName: 'Agent List', menuCode: 'agent:list', path: '/agent/list', component: '/agent/list/index', menuType: 1, perms: 'agent:list:list', status: 1, sort: 1 },
        { id: uuidv4(), parentId: agentId, menuName: 'Agent Audit', menuCode: 'agent:audit', path: '/agent/audit', component: '/agent/audit/index', menuType: 1, perms: 'agent:audit:list', status: 1, sort: 2 },
        { id: tradeId, parentId: '0', menuName: 'Trade', menuCode: 'trade', path: '/trade', redirect: '/trade/order', menuType: 0, status: 1, sort: 40 },
        { id: uuidv4(), parentId: tradeId, menuName: 'Pay Order', menuCode: 'trade:order', path: '/trade/order', component: '/trade/order/index', menuType: 1, perms: 'trade:order:list', status: 1, sort: 1 },
        { id: uuidv4(), parentId: tradeId, menuName: 'Refund', menuCode: 'trade:refund', path: '/trade/refund', component: '/trade/refund/index', menuType: 1, perms: 'trade:refund:list', status: 1, sort: 2 },
        { id: financeId, parentId: '0', menuName: 'Finance', menuCode: 'finance', path: '/finance', redirect: '/finance/account', menuType: 0, status: 1, sort: 25 },
        { id: uuidv4(), parentId: financeId, menuName: 'Account', menuCode: 'finance:account', path: '/finance/account', component: '/finance/account/index', menuType: 1, perms: 'finance:account:list', status: 1, sort: 1 },
        { id: uuidv4(), parentId: financeId, menuName: 'Record', menuCode: 'finance:record', path: '/finance/record', component: '/finance/record/index', menuType: 1, perms: 'finance:record:list', status: 1, sort: 2 },
        { id: statisticsId, parentId: '0', menuName: 'Statistics', menuCode: 'statistics', path: '/statistics', redirect: '/statistics/trade', menuType: 0, status: 1, sort: 45 },
        { id: channelId, parentId: '0', menuName: 'Channel', menuCode: 'channel', path: '/channel', redirect: '/channel/config', menuType: 0, status: 1, sort: 60 },
        { id: citicId, parentId: '0', menuName: 'Citic', menuCode: 'citic', path: '/citic', redirect: '/citic/account', menuType: 0, status: 1, sort: 95 },
        { id: deviceId, parentId: '0', menuName: 'Device', menuCode: 'device', path: '/device', redirect: '/device/code', menuType: 0, status: 1, sort: 65 },
        { id: profitId, parentId: '0', menuName: 'Profit', menuCode: 'profit', path: '/profit', redirect: '/profit/account-group', menuType: 0, status: 1, sort: 55 },
      ];

      for (const menu of menus) {
        await menuRepo.save({
          ...menu,
          createTime: new Date(),
          updateTime: new Date(),
        });
      }
      console.log('Default menus created');
    }

    console.log('Seed completed successfully');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
