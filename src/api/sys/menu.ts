import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

enum Api {
  List = ApiPath.SysMenuList,
}

export function getMenuList() {
  return defHttp.get<any[]>({ url: Api.List });
}
