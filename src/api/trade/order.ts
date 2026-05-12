import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

enum Api {
  List = ApiPath.TradeOrderList,
  Get = ApiPath.TradeOrder,
  Create = ApiPath.TradeOrder,
  Close = ApiPath.TradeOrderClose,
  RefundList = ApiPath.TradeRefundList,
  RefundCreate = ApiPath.TradeRefund,
  TransferList = ApiPath.TradeTransferList,
  TransferCreate = ApiPath.TradeTransfer,
  NotifyList = ApiPath.TradeNotifyList,
  NotifyResend = ApiPath.TradeNotifyResend,
}

export interface OrderItem {
  id: string;
  orderNo: string;
  mchNo: string;
  mchName?: string;
  appId: string;
  payType: string;
  amount: number;
  actualAmount: number;
  fee: number;
  subject?: string;
  body?: string;
  status: number;
  payTime?: string;
  createTime: string;
}

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  orderNo?: string;
  mchNo?: string;
  status?: number;
  payType?: string;
  startDate?: string;
  endDate?: string;
}

export function getOrderList(params: OrderListParams) {
  return defHttp.get<{ list: OrderItem[]; total: number }>({ url: Api.List, params });
}

export function getOrder(id: string) {
  return defHttp.get<OrderItem>({ url: `${Api.Get}/${id}` });
}

export function createOrder(params: any) {
  return defHttp.post<OrderItem>({ url: Api.Create, params });
}

export function closeOrder(id: string) {
  return defHttp.put({ url: `${Api.Close}/${id}` });
}

export function getRefundList(params: { page?: number; pageSize?: number; refundNo?: string; orderNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.RefundList, params });
}

export function createRefund(params: any) {
  return defHttp.post({ url: Api.RefundCreate, params });
}

export function getTransferList(params: { page?: number; pageSize?: number; transferNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.TransferList, params });
}

export function createTransfer(params: any) {
  return defHttp.post({ url: Api.TransferCreate, params });
}

export function getNotifyList(params: { page?: number; pageSize?: number; orderNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.NotifyList, params });
}

export function resendNotify(id: string) {
  return defHttp.post({ url: `${Api.NotifyResend}/${id}` });
}
