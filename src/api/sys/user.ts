import { defHttp } from '@/utils/http/axios';
import { ApiPath, API_BASE } from '../config';

enum Api {
  Login = ApiPath.Login,
  Logout = ApiPath.Logout,
  GetUserInfo = ApiPath.GetUserInfo,
}

export interface LoginParams {
  username: string;
  password: string;
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
  };
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
  return defHttp.get<string[]>({ url: `${API_BASE}/auth/perm` });
}

export function testRetry() {
  return defHttp.get({ url: `${API_BASE}/test/retry` });
}
