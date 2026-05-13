/**
 * 开放平台 API - 前端调用封装
 *
 * 使用独立的 axios 实例，避免 /basic-api 前缀和 JWT token 的干扰。
 */
import { deepMerge } from '@/utils';
import { VAxios } from '@/utils/http/axios/Axios';
import type { CreateAxiosOptions } from '@/utils/http/axios/axiosTransform';

const API_BASE = '/api/v1';
const ADMIN_BASE = '/basic-api/open';

/** 创建独立的 axios 实例 */
function createOpenHttp() {
  return new VAxios(
    deepMerge(
      {
        timeout: 10 * 1000,
        headers: { 'Content-Type': 'application/json' },
        requestOptions: {
          joinPrefix: false,
          apiUrl: '',
          urlPrefix: '',
          isReturnNativeResponse: false,
          isTransformResponse: false,
          joinParamsToUrl: false,
          formatDate: false,
          errorMessageMode: 'none',
          joinTime: true,
          ignoreCancelToken: true,
          withToken: false,
          retryRequest: { isOpenRetry: false },
        },
      } as Partial<CreateAxiosOptions>,
      {},
    ),
  );
}

const openHttp = createOpenHttp();

enum Api {
  DevRegister = `${API_BASE}/dev/register`,
  DevLogin = `${API_BASE}/dev/login`,
  DevInfo = `${API_BASE}/dev/info`,
  AppCreate = `${API_BASE}/app`,
  AppList = `${API_BASE}/app/list`,
  AppDetail = `${API_BASE}/app`,
  AppUpdate = `${API_BASE}/app`,
  AppResetSecret = `${API_BASE}/app/:appId/reset-secret`,
  AppIpWhitelist = `${API_BASE}/app/:appId/ip-whitelist`,
  KeyCreate = `${API_BASE}/app/:appId/key`,
  KeyList = `${API_BASE}/app/:appId/keys`,
  KeyDisable = `${API_BASE}/app/:appId/key/:keyId/disable`,
  KeyDelete = `${API_BASE}/app/:appId/key/:keyId`,
  Quota = `${API_BASE}/app/:appId/quota`,
  PayGateway = `${API_BASE}/pay/gateway`,
  QueryOrder = `${API_BASE}/query/order/:orderNo`,
  CloseOrder = `${API_BASE}/order/:orderNo/close`,
  RefundApply = `${API_BASE}/refund/apply`,
  QueryRefund = `${API_BASE}/query/refund/:refundNo`,
  TransferPay = `${API_BASE}/transfer/pay`,
  QueryTransfer = `${API_BASE}/query/transfer/:transferNo`,
  AccountBalance = `${API_BASE}/account/balance`,
}

// ==================== 开发者接口 ====================

export interface DevRegisterParams {
  developerName: string;
  username: string;
  password: string;
  email: string;
  mobile: string;
  company?: string;
  businessLicense?: string;
  contactPerson?: string;
  contactPhone?: string;
  description?: string;
  website?: string;
}

export interface DevLoginParams {
  username: string;
  password: string;
}

export function devRegister(params: DevRegisterParams) {
  return openHttp.post({ url: Api.DevRegister, data: params });
}

export function devLogin(params: DevLoginParams) {
  return openHttp.post({ url: Api.DevLogin, data: params });
}

export function getDevInfo() {
  return openHttp.get({ url: Api.DevInfo });
}

// ==================== 应用管理 ====================

export interface AppCreateParams {
  appName: string;
  appType: 'web' | 'mobile' | 'miniapp' | 'api';
  description?: string;
  appScenario?: string;
  domain?: string;
  notifyUrl?: string;
  refundNotifyUrl?: string;
  transferNotifyUrl?: string;
  enabledPayTypes?: string[];
}

export interface AppListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

export function createApp(params: AppCreateParams) {
  return openHttp.post({ url: Api.AppCreate, data: params });
}

export function getAppList(params: AppListParams = {}) {
  return openHttp.get({ url: Api.AppList, params });
}

export function getAppDetail(appId: string) {
  return openHttp.get({ url: `${Api.AppDetail}/${appId}` });
}

export function updateApp(appId: string, data: Partial<AppCreateParams>) {
  return openHttp.put({ url: `${Api.AppUpdate}/${appId}`, data });
}

export function resetAppSecret(appId: string) {
  return openHttp.post({ url: `${Api.AppResetSecret}`.replace(':appId', appId) });
}

export function updateIpWhitelist(appId: string, ips: string[]) {
  return openHttp.post({ url: `${Api.AppIpWhitelist}`.replace(':appId', appId), data: { ips } });
}

// ==================== API Key ====================

export interface KeyCreateParams {
  alias?: string;
  signType?: 'hmac_sha256' | 'rsa_2048' | 'sm2';
  boundIp?: string;
  expireDays?: number;
}

export function createApiKey(appId: string, params: KeyCreateParams = {}) {
  return openHttp.post({ url: `${Api.KeyCreate}`.replace(':appId', appId), data: params });
}

export function getKeyList(appId: string) {
  return openHttp.get({ url: `${Api.KeyList}`.replace(':appId', appId) });
}

export function disableKey(appId: string, keyId: string) {
  return openHttp.post({ url: `${Api.KeyDisable}`.replace(':appId', appId).replace(':keyId', keyId) });
}

export function deleteKey(appId: string, keyId: string) {
  return openHttp.delete({ url: `${Api.KeyDelete}`.replace(':appId', appId).replace(':keyId', keyId) });
}

// ==================== 配额 ====================

export function getQuota(appId: string) {
  return openHttp.get({ url: `${Api.Quota}`.replace(':appId', appId) });
}

// ==================== 支付接口 ====================

export interface PayParams {
  mchNo: string;
  appId: string;
  payType: string;
  amount: number;
  subject: string;
  body?: string;
  orderNo: string;
  clientIp?: string;
  attach?: string;
  notifyUrl: string;
  returnUrl?: string;
}

export interface PayResult {
  orderNo: string;
  payUrl: string;
  qrCode?: string;
  deeplink?: string;
  amount: number;
  mchNo: string;
  payType: string;
  status: string;
  expireTime: string;
}

export function pay(params: PayParams) {
  return openHttp.post<PayResult>({ url: Api.PayGateway, data: params });
}

export function queryOrder(orderNo: string) {
  return openHttp.get({ url: `${API_BASE}/query/order/${orderNo}` });
}

export function closeOrder(orderNo: string) {
  return openHttp.post({ url: `${API_BASE}/order/${orderNo}/close` });
}

// ==================== 退款接口 ====================

export interface RefundParams {
  orderNo: string;
  refundAmount: number;
  refundReason: string;
  notifyUrl?: string;
}

export function applyRefund(params: RefundParams) {
  return openHttp.post({ url: Api.RefundApply, data: params });
}

export function queryRefund(refundNo: string) {
  return openHttp.get({ url: `${API_BASE}/query/refund/${refundNo}` });
}

// ==================== 转账接口 ====================

export interface TransferParams {
  outNo: string;
  amount: number;
  accountType: string;
  accountName: string;
  accountNo: string;
  bankName: string;
  remark?: string;
  notifyUrl?: string;
}

export function transferPay(params: TransferParams) {
  return openHttp.post({ url: Api.TransferPay, data: params });
}

export function queryTransfer(transferNo: string) {
  return openHttp.get({ url: `${API_BASE}/query/transfer/${transferNo}` });
}

// ==================== 账户接口 ====================

export function getAccountBalance(mchNo?: string) {
  return openHttp.get({ url: Api.AccountBalance, params: { mchNo } });
}

// ==================== 管理后台接口 ====================

export interface AdminDevListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  level?: string;
}

export interface AdminAppListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  developerId?: string;
}

export interface AdminLogListParams {
  page?: number;
  pageSize?: number;
  appId?: string;
  developerId?: string;
  apiPath?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
}

export function adminGetDevList(params: AdminDevListParams) {
  return openHttp.get({ url: `${ADMIN_BASE}/developer/list`, params });
}

export function adminGetDevDetail(developerId: string) {
  return openHttp.get({ url: `${ADMIN_BASE}/developer/${developerId}` });
}

export function adminReviewDev(developerId: string, data: { status: 'active' | 'rejected'; remark?: string }) {
  return openHttp.post({ url: `${ADMIN_BASE}/developer/${developerId}/review`, data });
}

export function adminUpdateDevLevel(developerId: string, level: string) {
  return openHttp.post({ url: `${ADMIN_BASE}/developer/${developerId}/level`, data: { level } });
}

export function adminGetAppList(params: AdminAppListParams) {
  return openHttp.get({ url: `${ADMIN_BASE}/app/list`, params });
}

export function adminGetAppDetail(appId: string) {
  return openHttp.get({ url: `${ADMIN_BASE}/app/${appId}` });
}

export function adminReviewApp(appId: string, status: 'active' | 'suspended') {
  return openHttp.post({ url: `${ADMIN_BASE}/app/${appId}/review`, data: { status } });
}

export function adminGetLogList(params: AdminLogListParams) {
  return openHttp.get({ url: `${ADMIN_BASE}/log/list`, params });
}

export function adminGetLogStatistics() {
  return openHttp.get({ url: `${ADMIN_BASE}/log/statistics` });
}
