/**
 * 商户应用管理 API
 */
import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

/**
 * 获取商户应用列表
 */
export function getMchAppList(params: { page: number; pageSize: number; mchNo?: string; appId?: string; appName?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: `${ApiPath.MchAppList}`, params });
}

/**
 * 获取应用详情
 */
export function getMchAppDetail(appId: string) {
  return defHttp.get({ url: `${ApiPath.MchApp}/${appId}` });
}

/**
 * 创建应用
 */
export function createMchApp(data: any) {
  return defHttp.post({ url: ApiPath.MchApp, params: data });
}

/**
 * 更新应用
 */
export function updateMchApp(appId: string, data: any) {
  return defHttp.put({ url: `${ApiPath.MchApp}/${appId}`, params: data });
}

/**
 * 删除应用
 */
export function deleteMchApp(appId: string) {
  return defHttp.delete({ url: `${ApiPath.MchApp}/${appId}` });
}

/**
 * 获取商户下拉列表
 */
export function getMchSelectList() {
  return defHttp.get<any[]>({ url: `${ApiPath.MchList}/select-list` });
}

/**
 * 获取应用支付配置
 */
export function getMchAppPayConfig(appId: string) {
  return defHttp.get({ url: `${ApiPath.MchApp}/${appId}/pay-config` });
}

/**
 * 更新应用支付配置
 */
export function updateMchAppPayConfig(appId: string, data: any) {
  return defHttp.put({ url: `${ApiPath.MchApp}/${appId}/pay-config`, params: data });
}
