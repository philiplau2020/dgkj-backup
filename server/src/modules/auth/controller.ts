import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../config/data-source';
import { SysUser } from '../../database/entities/sys.entity';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const userRepo = AppDataSource.getRepository(SysUser);

      const user = await userRepo.findOne({
        where: { username },
      });

      if (!user) {
        return res.status(401).json({
          code: 401,
          message: '用户名或密码错误',
          data: null,
          timestamp: new Date().toISOString(),
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          code: 401,
          message: '用户名或密码错误',
          data: null,
          timestamp: new Date().toISOString(),
        });
      }

      if (user.status === 0) {
        return res.status(403).json({
          code: 403,
          message: '账号已被禁用',
          data: null,
          timestamp: new Date().toISOString(),
        });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          userType: user.userType,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      await userRepo.update(user.id, {
        lastLoginIp: req.ip,
        lastLoginTime: new Date(),
      });

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
          },
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

      const userRoleRepo = AppDataSource.getRepository('SysUserRole');
      const roleRepo = AppDataSource.getRepository('SysRole');
      const menuRepo = AppDataSource.getRepository('SysMenu');
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
          },
          roles: roles.map((r) => r.roleCode),
          permissions: menus.filter((m) => m.perms).map((m) => m.perms),
          menuList: menus,
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
}

export default new AuthController();
