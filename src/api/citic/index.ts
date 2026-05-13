/**
 * 中信银行E管家 - 前端 API 接口层
 * 完整覆盖所有后端 Controller 方法
 */
import { defHttp } from '@/utils/http/axios';
import { ApiPath } from '../config';

// ========== API 路径定义 ==========

const CITIC_BASE = ApiPath.CiticAccount.split('/citic')[0] + '/citic';

const Api = {
  // 账户管理
  AccountList: `${CITIC_BASE}/account/list`,
  AccountInfo: `${CITIC_BASE}/account/info`,
  AccountStats: `${CITIC_BASE}/account/stats`,
  AccountBalance: `${CITIC_BASE}/account/balance`,
  AccountRecords: `${CITIC_BASE}/account/records`,
  AccountRegister: `${CITIC_BASE}/account/register`,
  AccountUpdate: `${CITIC_BASE}/account`,

  // 银行卡管理
  CardList: `${CITIC_BASE}/card/list`,
  CardBind: `${CITIC_BASE}/card/bind`,
  CardUnbind: `${CITIC_BASE}/card/unbind`,
  CardDelete: `${CITIC_BASE}/card`,

  // 资金归集
  CollectionList: `${CITIC_BASE}/collection/list`,
  CollectionSet: `${CITIC_BASE}/collection/set`,
  CollectionActive: `${CITIC_BASE}/collection/active`,
  CollectionDelete: `${CITIC_BASE}/collection`,

  // 余额分账
  ProfitShareList: `${CITIC_BASE}/profit-share/list`,
  ProfitShareExecute: `${CITIC_BASE}/profit-share/execute`,
  ProfitShareDelete: `${CITIC_BASE}/profit-share`,

  // 代付打款
  TransferList: `${CITIC_BASE}/transfer/list`,
  TransferPay: `${CITIC_BASE}/transfer/pay`,
  TransferQuery: `${CITIC_BASE}/transfer/query`,
  TransferConfirm: `${CITIC_BASE}/transfer/confirm`,

  // 结算管理
  SettlementList: `${CITIC_BASE}/settlement/list`,
  SettlementApply: `${CITIC_BASE}/settlement/apply`,
  SettlementConfirm: `${CITIC_BASE}/settlement/confirm`,
  SettlementCancel: `${CITIC_BASE}/settlement/cancel`,

  // 对账管理
  CheckList: `${CITIC_BASE}/check/list`,
  CheckTrigger: `${CITIC_BASE}/check/trigger`,
  CheckDownload: `${CITIC_BASE}/check/download`,
  CheckDiffList: `${CITIC_BASE}/check/diff/list`,
  CheckDiffConfirm: `${CITIC_BASE}/check/diff/confirm`,
} as const;

// ========== 类型定义 ==========

export interface CiticAccountItem {
  id: string;
  bizUserId?: string;
  accountNo: string;
  accountName: string;
  accountType: number;
  accountAttr?: number;
  balance: number;
  availableBalance: number;
  frozenBalance: number;
  pendingBalance?: number;
  status: number;
  statusName?: string;
  auditStatus?: number;
  channel?: string;
  mchNo?: string;
  agentNo?: string;
  remark?: string;
  createTime: string;
  updateTime?: string;
}

export interface CiticCardItem {
  id: string;
  bizUserId?: string;
  accountNo: string;
  cardNo: string;
  cardType: number;
  cardTypeName?: string;
  bankName: string;
  bankCode?: string;
  branchName?: string;
  branchCode?: string;
  cardHolder?: string;
  certNo?: string;
  phone?: string;
  status: number;
  statusName?: string;
  bindTime?: string;
  unbindTime?: string;
  unbindReason?: string;
  remark?: string;
  createTime: string;
}

export interface CiticCollectionItem {
  id: string;
  collectionNo: string;
  fromAccountNo: string;
  fromAccountName: string;
  toAccountNo: string;
  toAccountName: string;
  collectionType: number;
  collectionTypeName?: string;
  collectionAmount?: number;
  reservedAmount?: number;
  status: number;
  statusName?: string;
  relationStatus: number;
  failReason?: string;
  remark?: string;
  createTime: string;
  updateTime?: string;
}

export interface CiticProfitShareItem {
  id: string;
  shareNo: string;
  orderNo?: string;
  accountNo: string;
  accountName: string;
  receiverAccountNo: string;
  receiverName: string;
  shareType: number;
  shareTypeName?: string;
  shareRate?: number;
  shareAmount: number;
  orderAmount?: number;
  status: number;
  statusName?: string;
  shareTime?: string;
  failReason?: string;
  remark?: string;
  createTime: string;
}

export interface CiticTransferItem {
  id: string;
  transferNo: string;
  citicOrderNo?: string;
  accountNo: string;
  accountName: string;
  receiverCardNo: string;
  receiverBankName: string;
  receiverBankCode?: string;
  receiverBranchName?: string;
  receiverBranchCode?: string;
  receiverName: string;
  receiverPhone?: string;
  amount: number;
  fee: number;
  actualAmount: number;
  transferType: number;
  transferTypeName?: string;
  status: number;
  statusName?: string;
  successTime?: string;
  failReason?: string;
  notifyTime?: string;
  remark?: string;
  createTime: string;
}

export interface CiticSettlementItem {
  id: string;
  settleNo: string;
  citicOrderNo?: string;
  accountNo: string;
  accountName: string;
  settleType: number;
  settleTypeName?: string;
  amount: number;
  fee: number;
  actualAmount: number;
  targetCardNo?: string;
  targetBankName?: string;
  targetBankCode?: string;
  targetBranchName?: string;
  targetBranchCode?: string;
  status: number;
  statusName?: string;
  settleTime?: string;
  completeTime?: string;
  failReason?: string;
  remark?: string;
  createTime: string;
}

export interface CiticCheckItem {
  id: string;
  checkNo: string;
  checkDate: string;
  checkType: number;
  checkTypeName?: string;
  channelCode?: string;
  channelName?: string;
  totalCount: number;
  totalAmount: number;
  successCount: number;
  successAmount: number;
  failCount: number;
  failAmount: number;
  refundCount?: number;
  refundAmount?: number;
  diffCount: number;
  diffAmount: number;
  status: number;
  statusName?: string;
  filePath?: string;
  fileUrl?: string;
  remark?: string;
  createTime: string;
}

export interface CiticRecordItem {
  id: string;
  recordNo: string;
  accountNo: string;
  accountName?: string;
  bizType: number;
  bizTypeName: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  orderNo?: string;
  oppositeAccountNo?: string;
  oppositeAccountName?: string;
  remark?: string;
  createTime: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ========== 账户管理 API ==========

export function getCiticAccountList(params: {
  page?: number;
  pageSize?: number;
  accountNo?: string;
  accountName?: string;
  status?: number;
}) {
  return defHttp.get<PageResult<CiticAccountItem>>({ url: Api.AccountList, params });
}

export function getCiticAccountInfo(params?: { accountNo?: string }) {
  return defHttp.get<CiticAccountItem>({ url: Api.AccountInfo, params });
}

export function getCiticAccountStats(params?: { accountNo?: string }) {
  return defHttp.get({ url: Api.AccountStats, params });
}

export function getCiticAccountBalance(params: { accountNo: string }) {
  return defHttp.get({ url: Api.AccountBalance, params });
}

export function getCiticAccountRecords(params: {
  page?: number;
  pageSize?: number;
  accountNo?: string;
  bizType?: number;
  startDate?: string;
  endDate?: string;
}) {
  return defHttp.get<PageResult<CiticRecordItem>>({ url: Api.AccountRecords, params });
}

export function createCiticAccount(params: Partial<CiticAccountItem>) {
  return defHttp.post<CiticAccountItem>({ url: Api.AccountRegister, params });
}

export function updateCiticAccount(id: string, params: Partial<CiticAccountItem>) {
  return defHttp.put<CiticAccountItem>({ url: `${Api.AccountUpdate}/${id}`, params });
}

// ========== 银行卡管理 API ==========

export function getCiticCardList(params: {
  page?: number;
  pageSize?: number;
  accountNo?: string;
  cardNo?: string;
  cardHolder?: string;
  bankName?: string;
  cardType?: number;
  status?: number;
}) {
  return defHttp.get<PageResult<CiticCardItem>>({ url: Api.CardList, params });
}

export function bindCiticCard(params: {
  accountNo: string;
  cardNo: string;
  cardType: number;
  bankName: string;
  bankCode?: string;
  branchName?: string;
  branchCode?: string;
  cardHolder?: string;
  certNo?: string;
  phone?: string;
  remark?: string;
}) {
  return defHttp.post<CiticCardItem>({ url: Api.CardBind, params });
}

export function unbindCiticCard(params: { cardNo: string; unbindReason?: string }) {
  return defHttp.post({ url: Api.CardUnbind, params });
}

export function deleteCiticCard(id: string) {
  return defHttp.delete({ url: `${Api.CardDelete}/${id}` });
}

// ========== 资金归集 API ==========

export function getCiticCollectionList(params: {
  page?: number;
  pageSize?: number;
  fromAccountNo?: string;
  toAccountNo?: string;
  status?: number;
  relationStatus?: number;
}) {
  return defHttp.get<PageResult<CiticCollectionItem>>({ url: Api.CollectionList, params });
}

export function setCiticCollection(params: {
  fromAccountNo: string;
  fromAccountName?: string;
  toAccountNo: string;
  toAccountName?: string;
  collectionType: number;
  collectionAmount?: number;
  reservedAmount?: number;
  remark?: string;
}) {
  return defHttp.post<CiticCollectionItem>({ url: Api.CollectionSet, params });
}

export function activeCiticCollection(params: { collectionNo: string; amount?: number }) {
  return defHttp.post({ url: Api.CollectionActive, params });
}

export function deleteCiticCollection(id: string) {
  return defHttp.delete({ url: `${Api.CollectionDelete}/${id}` });
}

// ========== 余额分账 API ==========

export function getCiticProfitShareList(params: {
  page?: number;
  pageSize?: number;
  accountNo?: string;
  orderNo?: string;
  status?: number;
}) {
  return defHttp.get<PageResult<CiticProfitShareItem>>({ url: Api.ProfitShareList, params });
}

export function executeCiticProfitShare(params: {
  orderNo?: string;
  accountNo: string;
  accountName?: string;
  receiverAccountNo: string;
  receiverName?: string;
  shareType: number;
  shareRate?: number;
  shareAmount: number;
  orderAmount?: number;
  remark?: string;
}) {
  return defHttp.post({ url: Api.ProfitShareExecute, params });
}

export function deleteCiticProfitShare(id: string) {
  return defHttp.delete({ url: `${Api.ProfitShareDelete}/${id}` });
}

// ========== 代付打款 API ==========

export function getCiticTransferList(params: {
  page?: number;
  pageSize?: number;
  accountNo?: string;
  transferNo?: string;
  status?: number;
  transferType?: number;
}) {
  return defHttp.get<PageResult<CiticTransferItem>>({ url: Api.TransferList, params });
}

export function createCiticTransfer(params: {
  accountNo: string;
  accountName?: string;
  receiverCardNo: string;
  receiverBankName: string;
  receiverBankCode?: string;
  receiverBranchName?: string;
  receiverBranchCode?: string;
  receiverName: string;
  receiverPhone?: string;
  amount: number;
  fee?: number;
  transferType?: number;
  remark?: string;
}) {
  return defHttp.post({ url: Api.TransferPay, params });
}

export function queryCiticTransfer(params: { transferNo: string }) {
  return defHttp.get<CiticTransferItem>({ url: Api.TransferQuery, params });
}

export function confirmCiticTransfer(params: {
  transferNo: string;
  citicOrderNo?: string;
  success: boolean;
  failReason?: string;
}) {
  return defHttp.post({ url: Api.TransferConfirm, params });
}

// ========== 结算管理 API ==========

export function getCiticSettlementList(params: {
  page?: number;
  pageSize?: number;
  accountNo?: string;
  settleNo?: string;
  settleType?: number;
  status?: number;
  startDate?: string;
  endDate?: string;
}) {
  return defHttp.get<PageResult<CiticSettlementItem>>({ url: Api.SettlementList, params });
}

export function applyCiticSettlement(params: {
  accountNo: string;
  accountName?: string;
  settleType: number;
  amount: number;
  targetCardNo?: string;
  targetBankName?: string;
  targetBankCode?: string;
  targetBranchName?: string;
  targetBranchCode?: string;
  remark?: string;
}) {
  return defHttp.post({ url: Api.SettlementApply, params });
}

export function confirmCiticSettlement(params: {
  settleNo: string;
  citicOrderNo?: string;
  success: boolean;
  failReason?: string;
}) {
  return defHttp.post({ url: Api.SettlementConfirm, params });
}

export function cancelCiticSettlement(params: { settleNo: string }) {
  return defHttp.post({ url: Api.SettlementCancel, params });
}

// ========== 对账管理 API ==========

export function getCiticCheckList(params: {
  page?: number;
  pageSize?: number;
  checkDate?: string;
  channelCode?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
}) {
  return defHttp.get<PageResult<CiticCheckItem>>({ url: Api.CheckList, params });
}

export function triggerCiticCheck(params: { checkDate: string; channelCode?: string }) {
  return defHttp.post({ url: Api.CheckTrigger, params });
}

export function downloadCiticCheckBill(params: { checkDate: string; channelCode?: string }) {
  return defHttp.get({ url: Api.CheckDownload, params });
}

export function getCiticCheckDiffList(params: {
  checkNo: string;
  page?: number;
  pageSize?: number;
}) {
  return defHttp.get({ url: Api.CheckDiffList, params });
}

export function confirmCiticCheckDiff(params: {
  checkNo: string;
  diffIds?: string[];
  handleType?: number;
  reason?: string;
  remark?: string;
}) {
  return defHttp.post({ url: Api.CheckDiffConfirm, params });
}

// ========== 兼容旧版 API 别名 ==========

export const getCardList = getCiticCardList;
export const getCiticSettleList = getCiticSettlementList;
export const getCheckList = getCiticCheckList;
export const getAccountRecords = getCiticAccountRecords;
export const getAccountStats = getCiticAccountStats;
export const bindCard = bindCiticCard;
export const unbindCard = unbindCiticCard;
export const triggerCheck = triggerCiticCheck;
export const confirmCheckDiff = confirmCiticCheckDiff;
export const downloadCheckBill = downloadCiticCheckBill;
export const getCheckDiffList = getCiticCheckDiffList;
export const applyCiticSettle = applyCiticSettlement;
export const confirmCiticSettle = confirmCiticSettlement;
export const cancelCiticSettle = cancelCiticSettlement;
export const getCiticAccountInfo_legacy = (params?: { accountNo?: string }) =>
  defHttp.get({ url: Api.AccountInfo, params });
export const getAccountStats_legacy = () => defHttp.get({ url: Api.AccountStats });

// ========== 自动调度服务 API ==========

export function executeAutoCheck(params: { checkDate: string; channelCode?: string }) {
  return defHttp.post({ url: `${CITIC_BASE}/auto/check`, params });
}

export function executeAutoSettlement(params: { accountNo: string; settleType: number }) {
  return defHttp.post({ url: `${CITIC_BASE}/auto/settlement`, params });
}

export function executeAutoProfitShare(params: {
  orderNo: string;
  tradeAmount: number;
  accountNo: string;
  receivers: Array<{
    accountNo: string;
    accountName: string;
    shareType: 1 | 2;
    shareRate?: number;
    shareAmount?: number;
  }>;
}) {
  return defHttp.post({ url: `${CITIC_BASE}/auto/profit-share`, params });
}

export function executeAutoCollection() {
  return defHttp.post({ url: `${CITIC_BASE}/auto/collection` });
}

export function getAutoConfigs() {
  return defHttp.get({ url: `${CITIC_BASE}/auto/configs` });
}

export function updateAutoConfigs(params: {
  checkConfig?: any;
  settlementConfig?: any;
  profitShareConfig?: any;
  collectionConfig?: any;
}) {
  return defHttp.post({ url: `${CITIC_BASE}/auto/configs`, params });
}
