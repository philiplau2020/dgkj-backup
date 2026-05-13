import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../config/data-source';
import { SysUser, SysMenu, SysRole } from '../../database/entities/sys.entity';

export class AuthController {
  // 角色对应的用户类型
  private roleUserTypeMap: Record<string, number> = {
    admin: 1,   // 运营后台
    agent: 2,   // 代理商后台
    mch: 3,     // 商户后台
  };

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password, role } = req.body;
      const userRepo = AppDataSource.getRepository(SysUser);

      // 根据role参数确定用户类型
      const userType = role ? this.roleUserTypeMap[role] : undefined;

      // 构建查询条件
      const whereCondition: any = { username };
      if (userType) {
        whereCondition.userType = userType;
      }

      const user = await userRepo.findOne({
        where: whereCondition,
      });

      if (!user) {
        return res.status(401).json({
          code: 401,
          message: '用户名或密码错误',
          data: null,
          timestamp: new Date().toISOString(),
        });
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          code: 401,
          message: '用户名或密码错误',
          data: null,
          timestamp: new Date().toISOString(),
        });
      }

      // 检查账号状态
      if (user.status === 0) {
        return res.status(403).json({
          code: 403,
          message: '账号已被禁用',
          data: null,
          timestamp: new Date().toISOString(),
        });
      }

      // 生成JWT token，包含角色信息
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          userType: user.userType,
          role: role || this.getRoleByUserType(user.userType),
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // 更新最后登录信息
      await userRepo.update(user.id, {
        lastLoginIp: req.ip,
        lastLoginTime: new Date(),
      });

      // 根据角色返回不同的欢迎信息和首页
      const roleInfo = this.getRoleInfo(user.userType);

      res.json({
        code: 0,
        message: '登录成功',
        data: {
          token,
          userInfo: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            email: user.email,
            mobile: user.mobile,
            userType: user.userType,
            deptId: user.deptId,
          },
          role: roleInfo.role,
          roleName: roleInfo.roleName,
          homePath: roleInfo.homePath,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const userType = req.user?.userType || 1;
      const userRepo = AppDataSource.getRepository(SysUser);

      const user = await userRepo.findOne({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          code: 404,
          message: '用户不存在',
          data: null,
          timestamp: new Date().toISOString(),
        });
      }

      // 获取用户角色
      const userRoleRepo = AppDataSource.getRepository('SysUserRole');
      const roleRepo = AppDataSource.getRepository(SysRole);
      const menuRepo = AppDataSource.getRepository(SysMenu);
      const roleMenuRepo = AppDataSource.getRepository('SysRoleMenu');

      const userRoles = await userRoleRepo.find({
        where: { userId },
      });

      const roleIds = userRoles.map((ur: any) => ur.roleId);
      let roles: any[] = [];
      if (roleIds.length > 0) {
        roles = await roleRepo.find({
          where: roleIds.map((id) => ({ id })),
        });
      }

      // 根据用户类型获取菜单
      const roleInfo = this.getRoleInfo(userType);
      
      // 如果有角色权限，使用角色权限；否则使用用户类型对应的默认菜单
      let menus: any[] = [];
      if (roleIds.length > 0) {
        const roleMenus = await roleMenuRepo.find({
          where: roleIds.map((id) => ({ roleId: id })),
        });
        const menuIds = [...new Set(roleMenus.map((rm: any) => rm.menuId))];
        if (menuIds.length > 0) {
          menus = await menuRepo.find({
            where: menuIds.map((id) => ({ id })),
          });
        }
      }

      // 如果没有菜单，返回对应角色的默认菜单
      if (menus.length === 0) {
        menus = await this.getDefaultMenusByUserType(userType);
      }

      // 过滤菜单（只显示匹配用户类型的菜单）
      menus = menus.filter(m => {
        const menuType = m.menuType || 'C';
        if (menuType === 'M' || menuType === 'C') return true;
        return true;
      });

      res.json({
        code: 0,
        message: '获取成功',
        data: {
          userInfo: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            email: user.email,
            mobile: user.mobile,
            userType: user.userType,
            deptId: user.deptId,
          },
          roles: roles.map((r) => r.roleCode),
          permissions: menus.filter((m) => m.perms).map((m) => m.perms),
          menuList: menus,
          role: roleInfo.role,
          roleName: roleInfo.roleName,
          homePath: roleInfo.homePath,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        code: 0,
        message: '退出成功',
        data: null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  // 根据用户类型获取角色标识
  private getRoleByUserType(userType: number): string {
    const map: Record<number, string> = {
      1: 'admin',
      2: 'agent',
      3: 'mch',
    };
    return map[userType] || 'admin';
  }

  // 根据用户类型获取角色信息
  private getRoleInfo(userType: number): { role: string; roleName: string; homePath: string } {
    const map: Record<number, { role: string; roleName: string; homePath: string }> = {
      1: { role: 'admin', roleName: '运营管理员', homePath: '/dashboard' },
      2: { role: 'agent', roleName: '代理商', homePath: '/agent/dashboard' },
      3: { role: 'mch', roleName: '商户', homePath: '/mch/dashboard' },
    };
    return map[userType] || map[1];
  }

  // 根据用户类型获取默认菜单
  private async getDefaultMenusByUserType(userType: number): Promise<any[]> {
    const menuRepo = AppDataSource.getRepository(SysMenu);
    
    // 根据用户类型筛选菜单
    const whereCondition: any = { status: 1 };
    
    const menus = await menuRepo.find({
      where: whereCondition,
      order: { sort: 'ASC' },
    });

    // 根据用户类型过滤菜单
    switch (userType) {
      case 2: // 代理商
        return menus.filter(m => 
          m.path?.startsWith('/agent/') || 
          m.path === '/dashboard' ||
          m.path === '/profile' ||
          m.path === '/notice'
        );
      case 3: // 商户
        return menus.filter(m => 
          m.path?.startsWith('/mch/') || 
          m.path === '/dashboard' ||
          m.path === '/profile' ||
          m.path === '/notice'
        );
      default: // 运营
        return menus;
    }
  }
}

export default new AuthController();
