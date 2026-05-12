import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

enum Api {
  List = ApiPath.AgentList,
  Get = ApiPath.Agent,
  Create = ApiPath.Agent,
  Update = ApiPath.Agent,
  Review = `${ApiPath.Agent}/review`,
  ProfitList = ApiPath.AgentProfitList,
  WithdrawList = ApiPath.AgentWithdrawList,
  WithdrawCreate = ApiPath.AgentWithdraw,
  WithdrawReview = ApiPath.AgentWithdrawReview,
  AuditList = `${ApiPath.Agent}/audit/list`,
  Audit = `${ApiPath.Agent}/audit`,
}

export interface AgentItem {
  id: string;
  agentNo: string;
  agentName: string;
  parentId?: string;
  level: number;
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
  balance: number;
  frozenBalance: number;
  profitBalance: number;
  status: number;
  createTime: string;
}

export interface AgentListParams {
  page?: number;
  pageSize?: number;
  agentNo?: string;
  agentName?: string;
  status?: number;
}

export function getAgentList(params: AgentListParams) {
  return defHttp.get<{ list: AgentItem[]; total: number }>({ url: Api.List, params });
}

export function getAgent(id: string) {
  return defHttp.get<AgentItem>({ url: `${Api.Get}/${id}` });
}

export function createAgent(params: any) {
  return defHttp.post<AgentItem>({ url: Api.Create, params });
}

export function updateAgent(id: string, params: any) {
  return defHttp.put<AgentItem>({ url: `${Api.Update}/${id}`, params });
}

export function reviewAgent(id: string, params: { status: number; reviewRemark?: string }) {
  return defHttp.put({ url: `${Api.Review}/${id}`, params });
}

export function getProfitList(params: { page?: number; pageSize?: number; agentNo?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.ProfitList, params });
}

export function getWithdrawList(params: { page?: number; pageSize?: number; agentNo?: string; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.WithdrawList, params });
}

export function createWithdraw(params: any) {
  return defHttp.post({ url: Api.WithdrawCreate, params });
}

export function reviewWithdraw(id: string, params: { status: number; failReason?: string }) {
  return defHttp.put({ url: `${Api.WithdrawReview}/${id}`, params });
}

export function getAgentStats(params?: any) {
  return defHttp.get<any>({ url: Api.Stats, params });
}

export function getAgentAuditList(params: { page?: number; pageSize?: number; status?: number }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.AuditList, params });
}

export function auditAgent(id: string, params: { status: number; remark?: string }) {
  return defHttp.put({ url: `${Api.Audit}/${id}`, params });
}
