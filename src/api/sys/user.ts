import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

const Api = {
  Login: ApiPath.Login,
  Logout: ApiPath.Logout,
  GetUserInfo: ApiPath.GetUserInfo,
  List: '/basic-api/sys/user/list',
  Get: '/basic-api/sys/user',
  Create: '/basic-api/sys/user',
  Update: '/basic-api/sys/user',
  Delete: '/basic-api/sys/user',
  ResetPassword: '/basic-api/sys/user/password',
} as const;

export interface LoginParams {
  username: string;
  password: string;
  role?: 'admin' | 'agent' | 'mch';
}

export interface LoginResultModel {
  token: string;
  userInfo: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
    email?: string;
    mobile?: string;
    userType: number;
    deptId?: string;
  };
  role: string;
  roleName: string;
  homePath: string;
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
    deptId?: string;
  };
  roles: string[];
  permissions: string[];
  menuList: any[];
  role: string;
  roleName: string;
  homePath: string;
}

export function loginApi(params: LoginParams) {
  return defHttp.post<LoginResultModel>(
    { url: Api.Login, params },
    { errorMessageMode: 'modal' }
  );
}

export function getUserInfo() {
  return defHttp.get<GetUserInfoModel>({ url: Api.GetUserInfo }, { errorMessageMode: 'none' });
}

export function doLogout() {
  return defHttp.post({ url: Api.Logout });
}

export function getPermCode() {
  return defHttp.get<string[]>({ url: '/basic-api/auth/perm' });
}

export function testRetry() {
  return defHttp.get({ url: '/basic-api/test/retry' });
}
