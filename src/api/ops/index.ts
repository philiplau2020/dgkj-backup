/**
 * 运维监控 API
 */
import { defHttp } from '@/utils/http/axios';

export const API_BASE = '/basic-api';

export const OpsApiPath = {
  // 综合概览
  OpsOverview: `${API_BASE}/ops/overview`,
  OpsServerList: `${API_BASE}/ops/server/list`,
  OpsServerDetail: `${API_BASE}/ops/server/detail`,

  // 服务监控
  OpsServiceList: `${API_BASE}/ops/service/list`,
  OpsServiceDetail: `${API_BASE}/ops/service/detail`,
  OpsServiceHealth: `${API_BASE}/ops/service/health`,

  // 应用监控
  OpsAppMetrics: `${API_BASE}/ops/app/metrics`,
  OpsAppList: `${API_BASE}/ops/app/list`,
  OpsAppJVM: `${API_BASE}/ops/app/jvm`,
  OpsAppThread: `${API_BASE}/ops/app/thread`,
  OpsAppSql: `${API_BASE}/ops/app/sql`,

  // 网络监控
  OpsNetworkList: `${API_BASE}/ops/network/list`,
  OpsNetworkPort: `${API_BASE}/ops/network/port`,
  OpsNetworkBandwidth: `${API_BASE}/ops/network/bandwidth`,
  OpsNetworkConnection: `${API_BASE}/ops/network/connection`,

  // 业务指标
  OpsBusinessOverview: `${API_BASE}/ops/business/overview`,
  OpsBusinessTrend: `${API_BASE}/ops/business/trend`,
  OpsBusinessKpi: `${API_BASE}/ops/business/kpi`,

  // 日志监控
  OpsLogList: `${API_BASE}/ops/log/list`,
  OpsLogDetail: `${API_BASE}/ops/log/detail`,
  OpsLogStatistics: `${API_BASE}/ops/log/statistics`,

  // 告警中心
  OpsAlertList: `${API_BASE}/ops/alert/list`,
  OpsAlertDetail: `${API_BASE}/ops/alert/detail`,
  OpsAlertHandle: `${API_BASE}/ops/alert/handle`,
  OpsAlertRule: `${API_BASE}/ops/alert/rule`,
} as const;

export const Api = {
  OpsOverview: OpsApiPath.OpsOverview,
  OpsServerList: OpsApiPath.OpsServerList,
  OpsServerDetail: OpsApiPath.OpsServerDetail,
  OpsServiceList: OpsApiPath.OpsServiceList,
  OpsServiceDetail: OpsApiPath.OpsServiceDetail,
  OpsServiceHealth: OpsApiPath.OpsServiceHealth,
  OpsAppMetrics: OpsApiPath.OpsAppMetrics,
  OpsAppList: OpsApiPath.OpsAppList,
  OpsAppJVM: OpsApiPath.OpsAppJVM,
  OpsAppThread: OpsApiPath.OpsAppThread,
  OpsAppSql: OpsApiPath.OpsAppSql,
  OpsNetworkList: OpsApiPath.OpsNetworkList,
  OpsNetworkPort: OpsApiPath.OpsNetworkPort,
  OpsNetworkBandwidth: OpsApiPath.OpsNetworkBandwidth,
  OpsNetworkConnection: OpsApiPath.OpsNetworkConnection,
  OpsBusinessOverview: OpsApiPath.OpsBusinessOverview,
  OpsBusinessTrend: OpsApiPath.OpsBusinessTrend,
  OpsBusinessKpi: OpsApiPath.OpsBusinessKpi,
  OpsLogList: OpsApiPath.OpsLogList,
  OpsLogDetail: OpsApiPath.OpsLogDetail,
  OpsLogStatistics: OpsApiPath.OpsLogStatistics,
  OpsAlertList: OpsApiPath.OpsAlertList,
  OpsAlertDetail: OpsApiPath.OpsAlertDetail,
  OpsAlertHandle: OpsApiPath.OpsAlertHandle,
  OpsAlertRule: OpsApiPath.OpsAlertRule,
} as const;

// 通用分页参数
export interface OpsListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

// 服务器信息
export interface ServerInfo {
  id: string;
  hostname: string;
  ip: string;
  port: number;
  os: string;
  cpuUsage: number;
  cpuCores: number;
  memTotal: number;
  memUsed: number;
  memUsage: number;
  diskTotal: number;
  diskUsed: number;
  diskUsage: number;
  uptime: number;
  status: 'online' | 'offline' | 'warning';
  role: string;
  lastHeartbeat: string;
}

// 服务信息
export interface ServiceInfo {
  id: string;
  name: string;
  displayName: string;
  version: string;
  host: string;
  port: number;
  status: 'running' | 'stopped' | 'restarting' | 'warning';
  pid: number;
  startTime: string;
  uptime: number;
  healthCheckUrl: string;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  requests: number;
  errors: number;
  cpuUsage: number;
  memUsage: number;
}

// 应用指标
export interface AppMetrics {
  id: string;
  name: string;
  group: string;
  requests: number;
  errors: number;
  avgResponseTime: number;
  p99ResponseTime: number;
  qps: number;
  concurrency: number;
  cpuUsage: number;
  memUsage: number;
  jvmHeapUsed: number;
  jvmHeapMax: number;
  jvmHeapUsage: number;
  jvmOldGenUsage: number;
  jvmYoungGenUsage: number;
  threadCount: number;
  threadPeak: number;
  dbActive: number;
  dbIdle: number;
  gcCount: number;
  gcTime: number;
}

// 网络连接
export interface NetworkInfo {
  id: string;
  interfaceName: string;
  ip: string;
  mac: string;
  status: 'up' | 'down';
  speed: string;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  rxErrors: number;
  txErrors: number;
  bandwidthIn: number;
  bandwidthOut: number;
}

// 端口信息
export interface PortInfo {
  id: string;
  serverId: string;
  port: number;
  protocol: string;
  state: 'LISTEN' | 'ESTABLISHED' | 'TIME_WAIT' | 'CLOSE_WAIT';
  processName: string;
  pid: number;
  connections: number;
  bindAddress: string;
}

// 业务指标
export interface BusinessMetrics {
  orderCount: number;
  orderAmount: number;
  successRate: number;
  avgResponseTime: number;
  activeUsers: number;
  activeConnections: number;
  queueLength: number;
  cacheHitRate: number;
}

// 日志条目
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  source: string;
  serviceName: string;
  host: string;
  message: string;
  traceId: string;
  spanId: string;
  exception?: string;
  stackTrace?: string;
}

// 告警记录
export interface AlertEntry {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  content: string;
  source: string;
  host: string;
  metric: string;
  value: number;
  threshold: number;
  unit: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'silenced';
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  duration: number;
  count: number;
}

// ==================== API Functions ====================

export function getOpsOverview() {
  return defHttp.get<Recordable>({ url: Api.OpsOverview });
}

export function getServerList(params: OpsListParams = {}) {
  return defHttp.get<{ list: ServerInfo[]; total: number }>({ url: Api.OpsServerList, params });
}

export function getServerDetail(id: string) {
  return defHttp.get<ServerInfo>({ url: `${Api.OpsServerDetail}/${id}` });
}

export function getServiceList(params: OpsListParams = {}) {
  return defHttp.get<{ list: ServiceInfo[]; total: number }>({ url: Api.OpsServiceList, params });
}

export function getServiceDetail(id: string) {
  return defHttp.get<ServiceInfo>({ url: `${Api.OpsServiceDetail}/${id}` });
}

export function getServiceHealth() {
  return defHttp.get<Recordable>({ url: Api.OpsServiceHealth });
}

export function getAppMetrics() {
  return defHttp.get<AppMetrics[]>({ url: Api.OpsAppMetrics });
}

export function getAppList(params: OpsListParams = {}) {
  return defHttp.get<{ list: AppMetrics[]; total: number }>({ url: Api.OpsAppList, params });
}

export function getAppJVM(id: string) {
  return defHttp.get<Recordable>({ url: `${Api.OpsAppJVM}/${id}` });
}

export function getAppThread(id: string) {
  return defHttp.get<Recordable>({ url: `${Api.OpsAppThread}/${id}` });
}

export function getAppSql(id: string) {
  return defHttp.get<Recordable>({ url: `${Api.OpsAppSql}/${id}` });
}

export function getNetworkList(params: OpsListParams = {}) {
  return defHttp.get<{ list: NetworkInfo[]; total: number }>({ url: Api.OpsNetworkList, params });
}

export function getNetworkPort(serverId: string) {
  return defHttp.get<PortInfo[]>({ url: `${Api.OpsNetworkPort}/${serverId}` });
}

export function getNetworkBandwidth(serverId: string) {
  return defHttp.get<Recordable>({ url: `${Api.OpsNetworkBandwidth}/${serverId}` });
}

export function getNetworkConnection(serverId: string) {
  return defHttp.get<Recordable>({ url: `${Api.OpsNetworkConnection}/${serverId}` });
}

export function getBusinessOverview() {
  return defHttp.get<Recordable>({ url: Api.OpsBusinessOverview });
}

export function getBusinessTrend(params: { days?: number }) {
  return defHttp.get<Recordable[]>({ url: Api.OpsBusinessTrend, params });
}

export function getBusinessKpi() {
  return defHttp.get<Recordable>({ url: Api.OpsBusinessKpi });
}

export function getLogList(params: OpsListParams & { level?: string; serviceName?: string }) {
  return defHttp.get<{ list: LogEntry[]; total: number }>({ url: Api.OpsLogList, params });
}

export function getLogDetail(id: string) {
  return defHttp.get<LogEntry>({ url: `${Api.OpsLogDetail}/${id}` });
}

export function getLogStatistics() {
  return defHttp.get<Recordable>({ url: Api.OpsLogStatistics });
}

export function getAlertList(params: OpsListParams & { level?: string; status?: string }) {
  return defHttp.get<{ list: AlertEntry[]; total: number }>({ url: Api.OpsAlertList, params });
}

export function getAlertDetail(id: string) {
  return defHttp.get<AlertEntry>({ url: `${Api.OpsAlertDetail}/${id}` });
}

export function handleAlert(id: string, action: 'ack' | 'resolve' | 'silence', note?: string) {
  return defHttp.post<void>({ url: `${Api.OpsAlertHandle}/${id}`, data: { action, note } });
}

export function getAlertRuleList(params: OpsListParams = {}) {
  return defHttp.get<{ list: Recordable[]; total: number }>({ url: Api.OpsAlertRule, params });
}
