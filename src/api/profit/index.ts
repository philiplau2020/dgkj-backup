import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

enum Api {
  AccountGroupList = `${ApiPath.ProfitAccountGroup}`,
  AccountGroupCreate = ApiPath.ProfitAccountGroup,
  AccountGroupUpdate = ApiPath.ProfitAccountGroup,
  ReceiverList = `${ApiPath.ProfitReceiver}`,
  ReceiverCreate = ApiPath.ProfitReceiver,
  ReceiverUpdate = ApiPath.ProfitReceiver,
  RecordList = `${ApiPath.ProfitRecord}`,
  RecordCreate = `${ApiPath.ProfitRecord}`,
  RecordSettle = `${ApiPath.ProfitRecord}/settle`,
  RollbackList = `${ApiPath.ProfitRollback}`,
  RollbackCreate = ApiPath.ProfitRollback,
  RollbackComplete = `${ApiPath.ProfitRollback}/complete`,
}

export interface AccountGroupItem {
  id: string;
  groupNo: string;
  groupName: string;
  agentNo?: string;
  mchNo?: string;
  status: number;
  createTime: string;
}

export interface ReceiverItem {
  id: string;
  receiverNo: string;
  groupNo: string;
  receiverType: number;
  receiverName: string;
  receiverAccount: string;
  bankName?: string;
  profitRatio: number;
  fixedAmount?: number;
  status: number;
  createTime: string;
}

export function getAccountGroupList(params: { page?: number; pageSize?: number; groupNo?: string }) {
  return defHttp.get<{ list: AccountGroupItem[]; total: number }>({ url: Api.AccountGroupList, params });
}

export function createAccountGroup(params: any) {
  return defHttp.post({ url: Api.AccountGroupCreate, params });
}

export function updateAccountGroup(id: string, params: any) {
  return defHttp.put({ url: `${Api.AccountGroupUpdate}/${id}`, params });
}

export function getReceiverList(params: { page?: number; pageSize?: number; groupNo?: string; receiverType?: number }) {
  return defHttp.get<{ list: ReceiverItem[]; total: number }>({ url: Api.ReceiverList, params });
}

export function createReceiver(params: any) {
  return defHttp.post({ url: Api.ReceiverCreate, params });
}

export function updateReceiver(id: string, params: any) {
  return defHttp.put({ url: `${Api.ReceiverUpdate}/${id}`, params });
}

export function getProfitRecordList(params: { page?: number; pageSize?: number; orderNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.RecordList, params });
}

export function createProfitRecord(params: any) {
  return defHttp.post({ url: Api.RecordCreate, params });
}

export function settleProfitRecord(id: string) {
  return defHttp.put({ url: `${Api.RecordSettle}/${id}` });
}

export function getRollbackList(params: { page?: number; pageSize?: number; profitNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.RollbackList, params });
}

export function createRollback(params: any) {
  return defHttp.post({ url: Api.RollbackCreate, params });
}

export function completeRollback(id: string) {
  return defHttp.put({ url: `${Api.RollbackComplete}/${id}` });
}
