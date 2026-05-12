/**
 * 商户门店管理 API
 */
import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

/**
 * 获取门店列表
 */
export function getStoreList(params: { page: number; pageSize: number; mchNo?: string; storeId?: string; storeName?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: ApiPath.MchStoreList, params });
}

/**
 * 获取门店详情
 */
export function getStoreDetail(storeId: string) {
  return defHttp.get({ url: `${ApiPath.MchStore}/${storeId}` });
}

/**
 * 创建门店
 */
export function createStore(data: any) {
  return defHttp.post({ url: ApiPath.MchStore, params: data });
}

/**
 * 更新门店
 */
export function updateStore(storeId: string, data: any) {
  return defHttp.put({ url: `${ApiPath.MchStore}/${storeId}`, params: data });
}

/**
 * 删除门店
 */
export function deleteStore(storeId: string) {
  return defHttp.delete({ url: `${ApiPath.MchStore}/${storeId}` });
}
