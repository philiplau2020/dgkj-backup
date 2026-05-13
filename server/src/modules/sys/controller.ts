import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../../config/data-source';
import { SysUser, SysRole, SysMenu, SysDept, SysDict, SysDictData, SysConfig, SysLog, SysNotice } from '../../database/entities/sys.entity';

export class SysController {
  private userRepo = AppDataSource.getRepository(SysUser);
  private roleRepo = AppDataSource.getRepository(SysRole);
  private menuRepo = AppDataSource.getRepository(SysMenu);
  private deptRepo = AppDataSource.getRepository(SysDept);
  private dictRepo = AppDataSource.getRepository(SysDict);
  private dictDataRepo = AppDataSource.getRepository(SysDictData);
  private configRepo = AppDataSource.getRepository(SysConfig);
  private logRepo = AppDataSource.getRepository(SysLog);
  private noticeRepo = AppDataSource.getRepository(SysNotice);

  // ============== User Management ==============
  async getUserList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, username, nickname, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.userRepo.createQueryBuilder('user');

      if (username) queryBuilder.andWhere('user.username LIKE :username', { username: `%${username}%` });
      if (nickname) queryBuilder.andWhere('user.nickname LIKE :nickname', { nickname: `%${nickname}%` });
      if (status !== undefined) queryBuilder.andWhere('user.status = :status', { status });

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('user.createTime', 'DESC')
        .getManyAndCount();

      res.json({
        code: 0,
        message: 'success',
        data: { list, total },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await this.userRepo.findOne({ where: { id } });

      if (!user) {
        return res.status(404).json({ code: 404, message: '用户不存在', data: null, timestamp: new Date().toISOString() });
      }

      res.json({ code: 0, message: 'success', data: user, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password, nickname, email, mobile, deptId, userType, status } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepo.create({
        id: uuidv4(),
        username,
        password: hashedPassword,
        nickname,
        email,
        mobile,
        deptId,
        userType,
        status,
        createTime: new Date(),
        updateTime: new Date(),
      } as SysUser);

      await this.userRepo.save(user);

      res.json({ code: 0, message: '创建成功', data: user, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { password, nickname, email, mobile, deptId, userType, status, remark } = req.body;

      const updateData: any = { updateTime: new Date() };
      if (nickname) updateData.nickname = nickname;
      if (email) updateData.email = email;
      if (mobile) updateData.mobile = mobile;
      if (deptId) updateData.deptId = deptId;
      if (userType !== undefined) updateData.userType = userType;
      if (status !== undefined) updateData.status = status;
      if (remark !== undefined) updateData.remark = remark;
      if (password) updateData.password = await bcrypt.hash(password, 10);

      await this.userRepo.update(id, updateData);

      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.userRepo.delete(id);
      res.json({ code: 0, message: '删除成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.userRepo.update(id, { password: hashedPassword, updateTime: new Date() });
      res.json({ code: 0, message: '密码重置成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Role Management ==============
  async getRoleList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, roleName, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.roleRepo.createQueryBuilder('role');

      if (roleName) queryBuilder.andWhere('role.roleName LIKE :roleName', { roleName: `%${roleName}%` });
      if (status !== undefined) queryBuilder.andWhere('role.status = :status', { status });

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('role.sort', 'ASC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { roleName, roleCode, roleDesc, status, sort } = req.body;
      const role = this.roleRepo.create({
        id: uuidv4(),
        roleName,
        roleCode,
        roleDesc,
        status,
        sort,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await this.roleRepo.save(role);
      res.json({ code: 0, message: '创建成功', data: role, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { roleName, roleDesc, status, sort } = req.body;
      await this.roleRepo.update(id, { roleName, roleDesc, status, sort, updateTime: new Date() });
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.roleRepo.delete(id);
      res.json({ code: 0, message: '删除成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getRoleMenus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const roleMenuRepo = AppDataSource.getRepository('SysRoleMenu');
      const roleMenus = await roleMenuRepo.find({ where: { roleId: id } });
      const menuIds = roleMenus.map((rm: any) => rm.menuId);
      const menus = await this.menuRepo.find({ where: menuIds.map((id) => ({ id })) });
      res.json({ code: 0, message: 'success', data: menuIds, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async assignRoleMenus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { menuIds } = req.body;
      const roleMenuRepo = AppDataSource.getRepository('SysRoleMenu');
      await roleMenuRepo.delete({ roleId: id });
      if (menuIds && menuIds.length > 0) {
        const roleMenus = menuIds.map((menuId: string) => ({ roleId: id, menuId }));
        await roleMenuRepo.save(roleMenus);
      }
      res.json({ code: 0, message: '分配成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Menu Management ==============
  async getMenuList(req: Request, res: Response, next: NextFunction) {
    try {
      const menus = await this.menuRepo.find({ order: { sort: 'ASC' } });
      res.json({ code: 0, message: 'success', data: menus, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { parentId, menuName, menuCode, icon, path, component, redirect, menuType, visible, perms, sort, keepAlive } = req.body;
      const menu = this.menuRepo.create({
        id: uuidv4(),
        parentId: parentId || '0',
        menuName,
        menuCode,
        icon,
        path,
        component,
        redirect,
        menuType,
        visible,
        perms,
        sort,
        keepAlive,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await this.menuRepo.save(menu);
      res.json({ code: 0, message: '创建成功', data: menu, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { parentId, menuName, menuCode, icon, path, component, redirect, menuType, visible, perms, sort, keepAlive } = req.body;
      await this.menuRepo.update(id, {
        parentId, menuName, menuCode, icon, path, component, redirect, menuType, visible, perms, sort, keepAlive, updateTime: new Date()
      });
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async deleteMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.menuRepo.delete(id);
      res.json({ code: 0, message: '删除成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Dept Management ==============
  async getDeptList(req: Request, res: Response, next: NextFunction) {
    try {
      const depts = await this.deptRepo.find({ order: { sort: 'ASC' } });
      res.json({ code: 0, message: 'success', data: depts, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createDept(req: Request, res: Response, next: NextFunction) {
    try {
      const { parentId, deptName, deptCode, leader, phone, email, status, sort } = req.body;
      const dept = this.deptRepo.create({
        id: uuidv4(),
        parentId: parentId || '0',
        deptName,
        deptCode,
        leader,
        phone,
        email,
        status,
        sort,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await this.deptRepo.save(dept);
      res.json({ code: 0, message: '创建成功', data: dept, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateDept(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { parentId, deptName, deptCode, leader, phone, email, status, sort } = req.body;
      await this.deptRepo.update(id, { parentId, deptName, deptCode, leader, phone, email, status, sort, updateTime: new Date() });
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async deleteDept(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.deptRepo.delete(id);
      res.json({ code: 0, message: '删除成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Dict Management ==============
  async getDictList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, dictName, dictCode } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const queryBuilder = this.dictRepo.createQueryBuilder('dict');
      if (dictName) queryBuilder.andWhere('dict.dictName LIKE :dictName', { dictName: `%${dictName}%` });
      if (dictCode) queryBuilder.andWhere('dict.dictCode LIKE :dictCode', { dictCode: `%${dictCode}%` });
      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('dict.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getDictData(req: Request, res: Response, next: NextFunction) {
    try {
      const { dictCode } = req.params;
      const dict = await this.dictRepo.findOne({ where: { dictCode } });
      if (!dict) return res.status(404).json({ code: 404, message: '字典不存在', data: null, timestamp: new Date().toISOString() });
      const data = await this.dictDataRepo.find({ where: { dictId: dict.id }, order: { sort: 'ASC' } });
      res.json({ code: 0, message: 'success', data, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createDict(req: Request, res: Response, next: NextFunction) {
    try {
      const { dictName, dictCode, description, status } = req.body;
      const dict = this.dictRepo.create({ id: uuidv4(), dictName, dictCode, description, status, createTime: new Date(), updateTime: new Date() });
      await this.dictRepo.save(dict);
      res.json({ code: 0, message: '创建成功', data: dict, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createDictData(req: Request, res: Response, next: NextFunction) {
    try {
      const { dictId, dictLabel, dictValue, dictType, sort, cssClass, listClass, isDefault, status } = req.body;
      const data = this.dictDataRepo.create({ id: uuidv4(), dictId, dictLabel, dictValue, dictType, sort, cssClass, listClass, isDefault, status, createTime: new Date(), updateTime: new Date() });
      await this.dictDataRepo.save(data);
      res.json({ code: 0, message: '创建成功', data, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Config Management ==============
  async getConfigList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, configName, configKey, groupName, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const queryBuilder = this.configRepo.createQueryBuilder('config');

      if (configName) queryBuilder.andWhere('config.configName LIKE :configName', { configName: `%${configName}%` });
      if (configKey) queryBuilder.andWhere('config.configKey LIKE :configKey', { configKey: `%${configKey}%` });
      if (groupName) queryBuilder.andWhere('config.groupName = :groupName', { groupName });
      if (status !== undefined) queryBuilder.andWhere('config.status = :status', { status });

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('config.updateTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 获取所有分组列表
  async getConfigGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const groups = await this.configRepo
        .createQueryBuilder('config')
        .select('DISTINCT config.groupName', 'groupName')
        .getRawMany();
      
      const groupList = groups.map(g => g.groupName).filter(Boolean);
      res.json({ code: 0, message: 'success', data: groupList, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 根据键名获取配置
  async getConfigByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { configKey } = req.params;
      const config = await this.configRepo.findOne({ where: { configKey } });
      
      if (!config) {
        return res.status(404).json({ code: 404, message: '配置不存在', data: null, timestamp: new Date().toISOString() });
      }

      res.json({ code: 0, message: 'success', data: config, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { configName, configKey, configValue, configType, groupName, remark, status } = req.body;
      
      // 检查键名是否已存在
      const existing = await this.configRepo.findOne({ where: { configKey } });
      if (existing) {
        return res.status(400).json({ code: 400, message: '配置键名已存在', data: null, timestamp: new Date().toISOString() });
      }

      const config = this.configRepo.create({
        id: uuidv4(),
        configName,
        configKey,
        configValue,
        configType,
        groupName,
        remark,
        status: status ?? 1,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await this.configRepo.save(config);
      res.json({ code: 0, message: '创建成功', data: config, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateConfigById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { configName, configKey, configValue, configType, groupName, remark, status } = req.body;
      
      const existing = await this.configRepo.findOne({ where: { id } });
      if (!existing) {
        return res.status(404).json({ code: 404, message: '配置不存在', data: null, timestamp: new Date().toISOString() });
      }

      await this.configRepo.update(id, {
        configName, configKey, configValue, configType, groupName, remark, status, updateTime: new Date()
      });
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async deleteConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.configRepo.delete(id);
      res.json({ code: 0, message: '删除成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 批量删除配置
  async batchDeleteConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ code: 400, message: '请选择要删除的配置', data: null, timestamp: new Date().toISOString() });
      }
      await this.configRepo.delete(ids);
      res.json({ code: 0, message: '批量删除成功', data: { count: ids.length }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 根据键名更新配置值（内置配置）
  async updateConfigByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { configKey } = req.params;
      const { configValue } = req.body;

      const config = await this.configRepo.findOne({ where: { configKey } });
      if (!config) {
        return res.status(404).json({ code: 404, message: '配置不存在', data: null, timestamp: new Date().toISOString() });
      }

      await this.configRepo.update(config.id, { configValue, updateTime: new Date() });
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Log Management ==============
  async getLogList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, username, operation, status, startTime, endTime } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const queryBuilder = this.logRepo.createQueryBuilder('log');

      if (username) queryBuilder.andWhere('log.username LIKE :username', { username: `%${username}%` });
      if (operation) queryBuilder.andWhere('log.operation LIKE :operation', { operation: `%${operation}%` });
      if (status !== undefined) queryBuilder.andWhere('log.status = :status', { status });
      if (startTime) queryBuilder.andWhere('log.createTime >= :startTime', { startTime });
      if (endTime) queryBuilder.andWhere('log.createTime <= :endTime', { endTime });

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('log.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 获取日志详情
  async getLogById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const log = await this.logRepo.findOne({ where: { id } });

      if (!log) {
        return res.status(404).json({ code: 404, message: '日志不存在', data: null, timestamp: new Date().toISOString() });
      }

      res.json({ code: 0, message: 'success', data: log, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 清理日志
  async cleanLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, days, keepCount } = req.body;

      let deletedCount = 0;

      switch (type) {
        case 'days':
          // 删除多少天前的日志
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - (days || 30));
          const deleteResult = await this.logRepo.createQueryBuilder('log')
            .where('log.createTime < :daysAgo', { daysAgo })
            .delete()
            .execute();
          deletedCount = deleteResult.affected || 0;
          break;
        case 'size':
          // 保留多少条记录，删除多余的
          const totalCount = await this.logRepo.count();
          if (totalCount > (keepCount || 10000)) {
            const idsToDelete = await this.logRepo
              .createQueryBuilder('log')
              .select('log.id')
              .orderBy('log.createTime', 'DESC')
              .skip(keepCount || 10000)
              .getMany();
            const ids = idsToDelete.map(l => l.id);
            if (ids.length > 0) {
              const result = await this.logRepo.delete(ids);
              deletedCount = result.affected || 0;
            }
          }
          break;
        case 'all':
          // 删除所有日志
          const allResult = await this.logRepo.delete({});
          deletedCount = allResult.affected || 0;
          break;
        default:
          return res.status(400).json({ code: 400, message: '无效的清理类型', data: null, timestamp: new Date().toISOString() });
      }

      res.json({ code: 0, message: '清理成功', data: { deletedCount }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 导出日志
  async exportLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, operation, status, startTime, endTime, format = 'json' } = req.query;
      const queryBuilder = this.logRepo.createQueryBuilder('log');

      if (username) queryBuilder.andWhere('log.username LIKE :username', { username: `%${username}%` });
      if (operation) queryBuilder.andWhere('log.operation LIKE :operation', { operation: `%${operation}%` });
      if (status !== undefined) queryBuilder.andWhere('log.status = :status', { status });
      if (startTime) queryBuilder.andWhere('log.createTime >= :startTime', { startTime });
      if (endTime) queryBuilder.andWhere('log.createTime <= :endTime', { endTime });

      const logs = await queryBuilder.orderBy('log.createTime', 'DESC').limit(10000).getMany();

      if (format === 'csv') {
        const headers = ['ID', '用户名', '操作', '方法', 'URL', 'IP', '状态', '耗时(ms)', '创建时间'];
        const csvRows = [headers.join(',')];
        for (const log of logs) {
          csvRows.push([
            log.id,
            log.username,
            log.operation,
            log.method,
            log.url,
            log.ip,
            log.status,
            log.duration,
            log.createTime,
          ].map(v => `"${v || ''}"`).join(','));
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=sys_log_${Date.now()}.csv`);
        res.send(csvRows.join('\n'));
      } else {
        res.json({ code: 0, message: 'success', data: logs, timestamp: new Date().toISOString() });
      }
    } catch (error) {
      next(error);
    }
  }

  // 获取操作类型统计
  async getLogStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await this.logRepo
        .createQueryBuilder('log')
        .select('log.operation', 'operation')
        .addSelect('COUNT(*)', 'count')
        .groupBy('log.operation')
        .getRawMany();

      res.json({ code: 0, message: 'success', data: stats, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Notice Management ==============
  async getNoticeList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, title, noticeType, scope, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const queryBuilder = this.noticeRepo.createQueryBuilder('notice');

      if (title) queryBuilder.andWhere('notice.noticeTitle LIKE :title', { title: `%${title}%` });
      if (noticeType !== undefined) queryBuilder.andWhere('notice.noticeType = :noticeType', { noticeType });
      if (scope !== undefined) queryBuilder.andWhere('notice.scope & :scope > 0', { scope: Number(scope) });
      if (status !== undefined) queryBuilder.andWhere('notice.status = :status', { status });

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('notice.isTop', 'DESC')
        .addOrderBy('notice.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 获取公告详情
  async getNoticeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const notice = await this.noticeRepo.findOne({ where: { id } });

      if (!notice) {
        return res.status(404).json({ code: 404, message: '公告不存在', data: null, timestamp: new Date().toISOString() });
      }

      res.json({ code: 0, message: 'success', data: notice, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { noticeTitle, noticeType, noticeContent, scope, status, isTop } = req.body;
      const notice = this.noticeRepo.create({
        id: uuidv4(),
        noticeTitle,
        noticeType,
        noticeContent,
        scope: scope || 1,
        status: status ?? 1,
        isTop: isTop ? 1 : 0,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await this.noticeRepo.save(notice);
      res.json({ code: 0, message: '创建成功', data: notice, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { noticeTitle, noticeType, noticeContent, scope, status, isTop } = req.body;
      
      const notice = await this.noticeRepo.findOne({ where: { id } });
      if (!notice) {
        return res.status(404).json({ code: 404, message: '公告不存在', data: null, timestamp: new Date().toISOString() });
      }

      await this.noticeRepo.update(id, {
        noticeTitle,
        noticeType,
        noticeContent,
        scope,
        status,
        isTop: isTop ? 1 : 0,
        updateTime: new Date(),
      });
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.noticeRepo.delete(id);
      res.json({ code: 0, message: '删除成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 批量删除公告
  async batchDeleteNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ code: 400, message: '请选择要删除的公告', data: null, timestamp: new Date().toISOString() });
      }
      await this.noticeRepo.delete(ids);
      res.json({ code: 0, message: '批量删除成功', data: { count: ids.length }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 切换置顶状态
  async toggleTop(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const notice = await this.noticeRepo.findOne({ where: { id } });
      
      if (!notice) {
        return res.status(404).json({ code: 404, message: '公告不存在', data: null, timestamp: new Date().toISOString() });
      }

      await this.noticeRepo.update(id, { isTop: notice.isTop === 1 ? 0 : 1, updateTime: new Date() });
      res.json({ code: 0, message: '操作成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 发布公告
  async publishNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.noticeRepo.update(id, { status: 1, updateTime: new Date() });
      res.json({ code: 0, message: '发布成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 撤回公告
  async revokeNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.noticeRepo.update(id, { status: 0, updateTime: new Date() });
      res.json({ code: 0, message: '撤回成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // 获取已发布的公告（商户/代理端使用）
  async getPublishedNotices(req: Request, res: Response, next: NextFunction) {
    try {
      const { scope, page = 1, pageSize = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      
      const queryBuilder = this.noticeRepo.createQueryBuilder('notice');
      queryBuilder.where('notice.status = :status', { status: 1 });
      
      if (scope !== undefined) {
        queryBuilder.andWhere('notice.scope & :scope > 0', { scope: Number(scope) });
      }

      const [list, total] = await queryBuilder
        .skip(skip)
        .take(Number(pageSize))
        .orderBy('notice.isTop', 'DESC')
        .addOrderBy('notice.createTime', 'DESC')
        .getManyAndCount();

      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }
}

export default new SysController();
