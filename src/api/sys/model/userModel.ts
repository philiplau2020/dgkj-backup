import { defHttp } from '@/utils/http/axios';

enum Api {
  List = '/basic-api/sys/user/list',
  Get = '/basic-api/sys/user',
  Create = '/basic-api/sys/user',
  Update = '/basic-api/sys/user',
  Delete = '/basic-api/sys/user',
  ResetPassword = '/basic-api/sys/user/password',
}

export interface RoleInfo {
  roleName?: string;
  value: string;
}

// Re-export RoleEnum for backward compatibility
export { RoleEnum } from '@/enums/roleEnum';

export interface LoginParams {
  username: string;
  password: string;
}

export interface GetUserInfoModel {
  userInfo: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
    email?: string;
    mobile?: string;
    userType: number;
  };
  roles: string[];
  permissions: string[];
  menuList: any[];
}

export interface UserItem {
  id: string;
  username: string;
  nickname: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  deptId?: string;
  userType: number;
  status: number;
  createTime: string;
  updateTime: string;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  username?: string;
  nickname?: string;
  status?: number;
}

export interface UserListResult {
  list: UserItem[];
  total: number;
}

export function getUserList(params: UserListParams) {
  return defHttp.get<UserListResult>({ url: Api.List, params });
}

export function getUser(id: string) {
  return defHttp.get<UserItem>({ url: `${Api.Get}/${id}` });
}

export function createUser(params: any) {
  return defHttp.post<UserItem>({ url: Api.Create, params });
}

export function updateUser(id: string, params: any) {
  return defHttp.put<UserItem>({ url: `${Api.Update}/${id}`, params });
}

export function deleteUser(id: string) {
  return defHttp.delete({ url: `${Api.Delete}/${id}` });
}

export function resetPassword(id: string, password: string) {
  return defHttp.put({ url: `${Api.ResetPassword}/${id}`, params: { password } });
}
