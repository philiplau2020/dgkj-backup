import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

enum Api {
  BatchList = ApiPath.CheckBatchList,
  BatchCreate = ApiPath.CheckBatch,
  BatchReview = ApiPath.CheckBatchReview,
  ChannelBillList = ApiPath.CheckChannelBillList,
  ChannelBillCreate = ApiPath.CheckChannelBill,
  DiffBillList = ApiPath.CheckDiffBillList,
  DiffBillHandle = ApiPath.CheckDiffBillHandle,
}

export interface CheckBatchItem {
  id: string;
  batchNo: string;
  checkDate: string;
  checkType: number;
  channelCode?: string;
  status: number;
  totalCount: number;
  successCount: number;
  failCount: number;
  diffCount: number;
  createTime: string;
}

export function getCheckBatchList(params: { page?: number; pageSize?: number; batchNo?: string; status?: number }) {
  return defHttp.get<{ list: CheckBatchItem[]; total: number }>({ url: Api.BatchList, params });
}

export function createCheckBatch(params: any) {
  return defHttp.post({ url: Api.BatchCreate, params });
}

export function reviewCheckBatch(id: string, params: { status: number; remark?: string }) {
  return defHttp.put({ url: `${Api.BatchReview}/${id}`, params });
}

export function getChannelBillList(params: { page?: number; pageSize?: number; batchNo?: string; channelCode?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.ChannelBillList, params });
}

export function createChannelBill(params: any) {
  return defHttp.post({ url: Api.ChannelBillCreate, params });
}

export function getDiffBillList(params: { page?: number; pageSize?: number; batchNo?: string; diffType?: number; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.DiffBillList, params });
}

export function handleDiffBill(id: string, params: { status: number; handleRemark?: string }) {
  return defHttp.put({ url: `${Api.DiffBillHandle}/${id}`, params });
}
