/**
 * 系统管理 - Mock 数据
 */
import { MockMethod } from 'vite-plugin-mock';
import { resultError, resultSuccess, getRequestToken, requestParams } from '../_util';

// 用户列表数据
const userList = [
  { userId: '1', username: 'admin', password: 'admin123', realName: '管理员', avatar: '', desc: '系统管理员', token: 'dg_token_admin', roles: [{ roleName: '超级管理员', value: 'super_admin' }], status: 1 },
  { userId: '2', username: 'operator', password: '123456', realName: '运营专员', avatar: '', desc: '运营人员', token: 'dg_token_operator', roles: [{ roleName: '运营管理员', value: 'operator' }], status: 1 },
  { userId: '3', username: 'finance', password: '123456', realName: '财务专员', avatar: '', desc: '财务人员', token: 'dg_token_finance', roles: [{ roleName: '财务管理员', value: 'finance' }], status: 1 },
  { userId: '4', username: 'risk', password: '123456', realName: '风控专员', avatar: '', desc: '风控人员', token: 'dg_token_risk', roles: [{ roleName: '风控管理员', value: 'risk' }], status: 1 },
];

// 角色列表
const roleList = [
  { id: '1', roleName: '超级管理员', roleValue: 'super_admin', description: '拥有系统所有权限', status: 1, sort: 1 },
  { id: '2', roleName: '运营管理员', roleValue: 'operator', description: '负责日常运营管理', status: 1, sort: 2 },
  { id: '3', roleName: '财务管理员', roleValue: 'finance', description: '负责财务操作', status: 1, sort: 3 },
  { id: '4', roleName: '风控管理员', roleValue: 'risk', description: '负责风控管理', status: 1, sort: 4 },
];

// 部门列表
const deptList = [
  { id: '1', parentId: '0', deptName: '道谷科技', deptNo: 'DGHQ', sort: 1, status: 1 },
  { id: '2', parentId: '1', deptName: '技术部', deptNo: 'TECH', sort: 1, status: 1 },
  { id: '3', parentId: '1', deptName: '运营部', deptNo: 'OP', sort: 2, status: 1 },
  { id: '4', parentId: '1', deptName: '财务部', deptNo: 'FIN', sort: 3, status: 1 },
  { id: '5', parentId: '1', deptName: '风控部', deptNo: 'RISK', sort: 4, status: 1 },
];

// 权限码列表
const permCodeList: Record<string, string[]> = {
  '1': ['*'], // 超级管理员拥有所有权限
  '2': ['sys:user:*', 'sys:role:*', 'mch:*', 'trade:*'],
  '3': ['sys:user:view', 'finance:*', 'trade:*'],
  '4': ['sys:user:view', 'risk:*'],
};

export default [
  // 登录
  {
    url: '/basic-api/auth/login',
    timeout: 200,
    method: 'post',
    response: ({ body }) => {
      const { username, password } = body;
      const user = userList.find((item) => item.username === username && password === item.password);
      if (!user) {
        return resultError('用户名或密码错误');
      }
      return resultSuccess({
        userId: user.userId,
        username: user.username,
        realName: user.realName,
        avatar: user.avatar,
        roles: user.roles,
        token: user.token,
        homePath: '/dashboard',
      });
    },
  },

  // 获取用户信息
  {
    url: '/basic-api/auth/userinfo',
    method: 'get',
    response: (request: requestParams) => {
      const token = getRequestToken(request);
      if (!token) return resultError('未登录');
      const user = userList.find((item) => item.token === token);
      if (!user) return resultError('用户不存在');
      return resultSuccess(user);
    },
  },

  // 获取权限码
  {
    url: '/basic-api/auth/perm',
    method: 'get',
    response: (request: requestParams) => {
      const token = getRequestToken(request);
      if (!token) return resultError('未登录');
      const user = userList.find((item) => item.token === token);
      if (!user) return resultError('用户不存在');
      return resultSuccess(permCodeList[user.userId] || []);
    },
  },

  // 退出登录
  {
    url: '/basic-api/auth/logout',
    method: 'post',
    response: () => resultSuccess('退出成功'),
  },

  // 用户管理 - 列表
  {
    url: '/basic-api/sys/user/list',
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, username, status } = query;
      let filteredList = [...userList];
      if (username) filteredList = filteredList.filter((u) => u.username.includes(username));
      if (status !== undefined) filteredList = filteredList.filter((u) => u.status === Number(status));
      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      return resultSuccess({
        list: filteredList.slice(start, end),
        total: filteredList.length,
      });
    },
  },

  // 用户管理 - 新增
  {
    url: '/basic-api/sys/user',
    method: 'post',
    response: ({ body }) => {
      const newUser = { ...body, userId: String(Date.now()), token: `dg_token_${Date.now()}` };
      userList.push(newUser);
      return resultSuccess(newUser);
    },
  },

  // 用户管理 - 编辑
  {
    url: '/basic-api/sys/user/:id',
    method: 'put',
    response: ({ body }) => resultSuccess(body),
  },

  // 用户管理 - 删除
  {
    url: '/basic-api/sys/user/:id',
    method: 'delete',
    response: () => resultSuccess('删除成功'),
  },

  // 角色管理 - 列表
  {
    url: '/basic-api/sys/role/list',
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, roleName } = query;
      let filteredList = [...roleList];
      if (roleName) filteredList = filteredList.filter((r) => r.roleName.includes(roleName));
      const start = (Number(page) - 1) * Number(pageSize);
      return resultSuccess({
        list: filteredList.slice(start, start + Number(pageSize)),
        total: filteredList.length,
      });
    },
  },

  // 角色管理 - 新增
  {
    url: '/basic-api/sys/role',
    method: 'post',
    response: ({ body }) => {
      const newRole = { ...body, id: String(Date.now()) };
      roleList.push(newRole);
      return resultSuccess(newRole);
    },
  },

  // 角色管理 - 编辑
  {
    url: '/basic-api/sys/role/:id',
    method: 'put',
    response: ({ body }) => resultSuccess(body),
  },

  // 角色管理 - 删除
  {
    url: '/basic-api/sys/role/:id',
    method: 'delete',
    response: () => resultSuccess('删除成功'),
  },

  // 部门管理 - 列表
  {
    url: '/basic-api/sys/dept/list',
    method: 'get',
    response: () => resultSuccess(deptList),
  },

  // 部门管理 - 新增
  {
    url: '/basic-api/sys/dept',
    method: 'post',
    response: ({ body }) => resultSuccess({ ...body, id: String(Date.now()) }),
  },

  // 部门管理 - 编辑
  {
    url: '/basic-api/sys/dept/:id',
    method: 'put',
    response: ({ body }) => resultSuccess(body),
  },

  // 部门管理 - 删除
  {
    url: '/basic-api/sys/dept/:id',
    method: 'delete',
    response: () => resultSuccess('删除成功'),
  },
] as MockMethod[];
