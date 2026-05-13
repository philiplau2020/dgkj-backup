import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

const Api = {
  ChannelList: ApiPath.ChannelList,
  ChannelGet: ApiPath.Channel,
  ChannelCreate: ApiPath.Channel,
  ChannelUpdate: ApiPath.Channel,
  ChannelMchList: ApiPath.ChannelMchList,
  ChannelMchCreate: ApiPath.ChannelMch,
  RouteList: ApiPath.ChannelRouteList,
  RouteCreate: ApiPath.ChannelRoute,
  RouteUpdate: ApiPath.ChannelRoute,
  PoolList: ApiPath.ChannelPoolList,
  PoolCreate: ApiPath.ChannelPool,
  StrategyList: ApiPath.ChannelStrategyList,
  StrategyCreate: ApiPath.ChannelStrategy,
  StrategyUpdate: ApiPath.ChannelStrategy,
  Recommend: ApiPath.ChannelRecommend,
} as const;

type Api = typeof Api;

export interface ChannelItem {
  id: string;
  channelCode: string;
  channelName: string;
  channelShortName?: string;
  channelType: string;
  provider?: string;
  status: number;
  createTime: string;
}

export function getChannelList(params: { page?: number; pageSize?: number; channelCode?: string; channelName?: string; status?: number }) {
  return defHttp.get<{ list: ChannelItem[]; total: number }>({ url: Api.ChannelList, params });
}

export function getChannel(id: string) {
  return defHttp.get<ChannelItem>({ url: `${Api.ChannelGet}/${id}` });
}

export function createChannel(params: any) {
  return defHttp.post<ChannelItem>({ url: Api.ChannelCreate, params });
}

export function updateChannel(id: string, params: any) {
  return defHttp.put<ChannelItem>({ url: `${Api.ChannelUpdate}/${id}`, params });
}

export function getChannelMchList(params: { page?: number; pageSize?: number; channelCode?: string; mchNo?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.ChannelMchList, params });
}

export function createChannelMch(params: any) {
  return defHttp.post({ url: Api.ChannelMchCreate, params });
}

export function getRouteList(params: { page?: number; pageSize?: number; payType?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.RouteList, params });
}

export function createRoute(params: any) {
  return defHttp.post({ url: Api.RouteCreate, params });
}

export function updateRoute(id: string, params: any) {
  return defHttp.put({ url: `${Api.RouteUpdate}/${id}`, params });
}

export function getPoolList() {
  return defHttp.get<any[]>({ url: Api.PoolList });
}

export function createPool(params: any) {
  return defHttp.post({ url: Api.PoolCreate, params });
}

export function getStrategyList(params: { page?: number; pageSize?: number; channelCode?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.StrategyList, params });
}

export function createStrategy(params: any) {
  return defHttp.post({ url: Api.StrategyCreate, params });
}

export function updateStrategy(id: string, params: any) {
  return defHttp.put({ url: `${Api.StrategyUpdate}/${id}`, params });
}

export function getRecommendChannel(params: { payType: string; amount: number }) {
  return defHttp.get<ChannelItem | null>({ url: Api.Recommend, params });
}
