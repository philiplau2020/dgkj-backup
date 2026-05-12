import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

enum Api {
  List = ApiPath.DeviceList,
  Get = ApiPath.Device,
  Create = ApiPath.Device,
  Update = ApiPath.Device,
  Bind = ApiPath.DeviceBind,
  CodeList = ApiPath.DeviceCodeList,
  CodeCreate = ApiPath.DeviceCode,
  QrCodeList = ApiPath.DeviceQrcodeList,
  SpeakerList = ApiPath.DeviceSpeakerList,
  PrinterList = ApiPath.DevicePrinterList,
  PosList = ApiPath.DevicePosList,
}

export interface DeviceItem {
  id: string;
  deviceNo: string;
  deviceType: number;
  deviceName: string;
  deviceModel?: string;
  mchNo?: string;
  storeId?: string;
  sn?: string;
  status: number;
  activateTime?: string;
  createTime: string;
}

export function getDeviceList(params: { page?: number; pageSize?: number; deviceNo?: string; deviceType?: number; status?: number }) {
  return defHttp.get<{ list: DeviceItem[]; total: number }>({ url: Api.List, params });
}

export function getDevice(id: string) {
  return defHttp.get<DeviceItem>({ url: `${Api.Get}/${id}` });
}

export function createDevice(params: any) {
  return defHttp.post<DeviceItem>({ url: Api.Create, params });
}

export function updateDevice(id: string, params: any) {
  return defHttp.put<DeviceItem>({ url: `${Api.Update}/${id}`, params });
}

export function bindDevice(id: string, params: { mchNo: string; storeId?: string }) {
  return defHttp.put({ url: `${Api.Bind}/${id}`, params });
}

export function getActivationCodeList(params: { page?: number; pageSize?: number; code?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.CodeList, params });
}

export function createActivationCode(params: any) {
  return defHttp.post({ url: Api.CodeCreate, params });
}

export function getQrCodeList(params: { page?: number; pageSize?: number; deviceNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.QrCodeList, params });
}

export function getSpeakerList(params: { page?: number; pageSize?: number; deviceNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.SpeakerList, params });
}

export function getPrinterList(params: { page?: number; pageSize?: number; deviceNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.PrinterList, params });
}

export function getPosList(params: { page?: number; pageSize?: number; deviceNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.PosList, params });
}
