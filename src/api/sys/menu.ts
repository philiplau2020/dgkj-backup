import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

const Api = {
  List: ApiPath.SysMenuList,
} as const;

export function getMenuList() {
  return defHttp.get<any[]>({ url: Api.List });
}
