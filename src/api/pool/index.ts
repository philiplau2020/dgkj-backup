import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

enum Api {
  List = ApiPath.ChannelPoolList,
  Create = ApiPath.ChannelPool,
  StrategyList = ApiPath.ChannelStrategyList,
  StrategyCreate = ApiPath.ChannelStrategy,
  StrategyUpdate = ApiPath.ChannelStrategy,
  RouteList = ApiPath.ChannelRouteList,
  RouteCreate = ApiPath.ChannelRoute,
  RouteUpdate = ApiPath.ChannelRoute,
  Recommend = ApiPath.ChannelRecommend,
}

export interface PoolItem {
  id: string;
  poolName: string;
  poolCode: string;
  poolType: number;
  description?: string;
  status: number;
  createTime: string;
}

export function getPoolList() {
  return defHttp.get<PoolItem[]>({ url: Api.List });
}

export function createPool(params: any) {
  return defHttp.post<PoolItem>({ url: Api.Create, params });
}

export function getPoolStrategyList(params: { page?: number; pageSize?: number; channelCode?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.StrategyList, params });
}

export function createPoolStrategy(params: any) {
  return defHttp.post({ url: Api.StrategyCreate, params });
}

export function updatePoolStrategy(id: string, params: any) {
  return defHttp.put({ url: `${Api.StrategyUpdate}/${id}`, params });
}

export function getPoolRouteList(params: { page?: number; pageSize?: number; payType?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.RouteList, params });
}

export function createPoolRoute(params: any) {
  return defHttp.post({ url: Api.RouteCreate, params });
}

export function updatePoolRoute(id: string, params: any) {
  return defHttp.put({ url: `${Api.RouteUpdate}/${id}`, params });
}

export function getRecommendedChannel(params: { payType: string; amount: number }) {
  return defHttp.get<any | null>({ url: Api.Recommend, params });
}
