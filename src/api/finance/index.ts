import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

enum Api {
  AccountList = ApiPath.FinanceAccountList,
  AccountGet = ApiPath.FinanceAccount,
  RecordList = ApiPath.FinanceRecordList,
  SettlementList = ApiPath.FinanceSettlementList,
  SettlementCreate = ApiPath.FinanceSettlement,
  SettlementReview = ApiPath.FinanceSettlementReview,
  WithdrawList = ApiPath.FinanceWithdrawList,
  WithdrawCreate = ApiPath.FinanceWithdraw,
  StatementList = ApiPath.FinanceStatementList,
}

export interface AccountItem {
  id: string;
  accountNo: string;
  ownerNo: string;
  ownerName: string;
  accountType: number;
  balance: number;
  frozenBalance: number;
  availableBalance: number;
  status: number;
  createTime: string;
}

export function getAccountList(params: { page?: number; pageSize?: number; accountNo?: string; accountType?: number }) {
  return defHttp.get<{ list: AccountItem[]; total: number }>({ url: Api.AccountList, params });
}

export function getAccount(id: string) {
  return defHttp.get<AccountItem>({ url: `${Api.AccountGet}/${id}` });
}

export function getRecordList(params: { page?: number; pageSize?: number; accountNo?: string; bizType?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.RecordList, params });
}

export function getSettlementList(params: { page?: number; pageSize?: number; settleNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.SettlementList, params });
}

export function createSettlement(params: any) {
  return defHttp.post({ url: Api.SettlementCreate, params });
}

export function reviewSettlement(id: string, params: { status: number; failReason?: string }) {
  return defHttp.put({ url: `${Api.SettlementReview}/${id}`, params });
}

export function getFinanceWithdrawList(params: { page?: number; pageSize?: number; withdrawNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.WithdrawList, params });
}

export function createFinanceWithdraw(params: any) {
  return defHttp.post({ url: Api.WithdrawCreate, params });
}

export function getStatementList(params: { page?: number; pageSize?: number; accountNo?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.StatementList, params });
}

// Aliases
export const getAccountRecord = getRecordList;
export const getAccountRecordList = getRecordList;
export const getWithdrawApplyList = getFinanceWithdrawList;
export const createWithdrawApply = createFinanceWithdraw;
export const reviewWithdraw = reviewSettlement;
