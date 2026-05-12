import { Request } from 'express';

// 获取当前登录用户
export function CurrentUser(req: Request): any {
  return req.user;
}

// 简化版本，用于类型装饰
export function getCurrentUser(req: Request) {
  return req.user;
}
