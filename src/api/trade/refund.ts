import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

const Api = {
  List: ApiPath.TradeRefundList,
  Create: ApiPath.TradeRefund,
} as const;

export function getRefundList(params: { page?: number; pageSize?: number; refundNo?: string; orderNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.List, params });
}

export function createRefund(params: { orderNo: string; mchNo: string; appId: string; refundAmount: number; refundReason?: string }) {
  return defHttp.post({ url: Api.Create, params });
}
