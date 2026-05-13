import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

const Api = {
  Dashboard: ApiPath.StatisticsDashboard,
  TradeList: ApiPath.StatisticsTradeList,
  TradeTrend: ApiPath.StatisticsTradeTrend,
  PayTypeStats: ApiPath.StatisticsTradePayType,
  MerchantList: ApiPath.StatisticsMerchantList,
  AgentList: ApiPath.StatisticsAgentList,
  ChannelList: ApiPath.StatisticsChannelList,
  FinanceList: ApiPath.StatisticsFinanceList,
} as const;

export interface DashboardStats {
  today: {
    totalCount: number;
    successCount: number;
    successAmount: number;
  };
  yesterday: {
    successCount: number;
    successAmount: number;
  };
  month: {
    successCount: number;
    successAmount: number;
    refundCount: number;
    refundAmount: number;
  };
  counts: {
    mchCount: number;
    agentCount: number;
    orderCount: number;
  };
}

export function getDashboardStats() {
  return defHttp.get<DashboardStats>({ url: Api.Dashboard });
}

export function getTradeStatList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.TradeList, params });
}

export function getTradeTrend(params: { startDate?: string; endDate?: string; type?: string }) {
  return defHttp.get<any[]>({ url: Api.TradeTrend, params });
}

export function getPayTypeStats(params: { startDate?: string; endDate?: string }) {
  return defHttp.get<any[]>({ url: Api.PayTypeStats, params });
}

export function getMerchantStatList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.MerchantList, params });
}

export function getAgentStatList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.AgentList, params });
}

export function getChannelStatList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.ChannelList, params });
}

export function getFinanceStatList(params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
  return defHttp.get<{ list: any[]; total: number }>({ url: Api.FinanceList, params });
}
