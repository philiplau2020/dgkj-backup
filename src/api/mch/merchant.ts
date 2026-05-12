import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

enum Api {
  List = ApiPath.MchList,
  Get = ApiPath.Mch,
  Create = ApiPath.Mch,
  Update = ApiPath.Mch,
  Review = ApiPath.MchReview,
  AppList = ApiPath.MchAppList,
  AppCreate = ApiPath.MchApp,
  AppUpdate = ApiPath.MchApp,
  StoreList = ApiPath.MchStoreList,
  StoreCreate = ApiPath.MchStore,
  StoreUpdate = ApiPath.MchStore,
  RateList = ApiPath.MchRateList,
  RateCreate = ApiPath.MchRate,
  RateUpdate = ApiPath.MchRate,
}

export interface MchItem {
  id: string;
  mchNo: string;
  mchName: string;
  mchShortName?: string;
  mchType: number;
  agentId?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  bankName?: string;
  bankAccount?: string;
  bankUsername?: string;
  status: number;
  balance: number;
  createTime: string;
}

export interface MchListParams {
  page?: number;
  pageSize?: number;
  mchNo?: string;
  mchName?: string;
  status?: number;
  agentId?: string;
}

export function getMchList(params: MchListParams) {
  return defHttp.get<{ list: MchItem[]; total: number }>({ url: Api.List, params });
}

export function getMch(id: string) {
  return defHttp.get<MchItem>({ url: `${Api.Get}/${id}` });
}

export function createMch(params: any) {
  return defHttp.post<MchItem>({ url: Api.Create, params });
}

export function updateMch(id: string, params: any) {
  return defHttp.put<MchItem>({ url: `${Api.Update}/${id}`, params });
}

export function reviewMch(id: string, params: { status: number; reviewRemark?: string }) {
  return defHttp.put({ url: `${Api.Review}/${id}`, params });
}

export function getAppList(params: { page?: number; pageSize?: number; mchNo?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.AppList, params });
}

export function createApp(params: any) {
  return defHttp.post({ url: Api.AppCreate, params });
}

export function updateApp(id: string, params: any) {
  return defHttp.put({ url: `${Api.AppUpdate}/${id}`, params });
}

export function getStoreList(params: { page?: number; pageSize?: number; mchNo?: string; storeName?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.StoreList, params });
}

export function createStore(params: any) {
  return defHttp.post({ url: Api.StoreCreate, params });
}

export function updateStore(id: string, params: any) {
  return defHttp.put({ url: `${Api.StoreUpdate}/${id}`, params });
}

export function getRateList(params: { mchNo?: string }) {
  return defHttp.get<any[]>({ url: Api.RateList, params });
}

export function createRate(params: any) {
  return defHttp.post({ url: Api.RateCreate, params });
}

export function updateRate(id: string, params: any) {
  return defHttp.put({ url: `${Api.RateUpdate}/${id}`, params });
}
