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
      const configs = await this.configRepo.find();
      res.json({ code: 0, message: 'success', data: configs, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { configKey, configValue } = req.body;
      const config = await this.configRepo.findOne({ where: { configKey } });
      if (config) {
        await this.configRepo.update(config.id, { configValue, updateTime: new Date() });
      }
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Log Management ==============
  async getLogList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, username, operation } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const queryBuilder = this.logRepo.createQueryBuilder('log');
      if (username) queryBuilder.andWhere('log.username LIKE :username', { username: `%${username}%` });
      if (operation) queryBuilder.andWhere('log.operation LIKE :operation', { operation: `%${operation}%` });
      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('log.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Notice Management ==============
  async getNoticeList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const [list, total] = await this.noticeRepo.findAndCount({ skip, take: Number(pageSize), order: { createTime: 'DESC' } });
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { noticeTitle, noticeType, noticeContent, status } = req.body;
      const notice = this.noticeRepo.create({ id: uuidv4(), noticeTitle, noticeType, noticeContent, status, createTime: new Date(), updateTime: new Date() });
      await this.noticeRepo.save(notice);
      res.json({ code: 0, message: '创建成功', data: notice, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { noticeTitle, noticeType, noticeContent, status } = req.body;
      await this.noticeRepo.update(id, { noticeTitle, noticeType, noticeContent, status, updateTime: new Date() });
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
}

export default new SysController();
