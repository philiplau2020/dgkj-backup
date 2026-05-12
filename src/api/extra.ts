// 补全所有缺失的 API 函数
import { defHttp } from '@/utils/http/axios';

// 代理 API
export const getAgentStats = () => defHttp.get({ url: '/basic-api/agent/stats' });
export const getAgentAuditList = (params: any) => defHttp.get({ url: '/basic-api/agent/audit/list', params });
export const auditAgent = (id: string, params: any) => defHttp.put({ url: `/basic-api/agent/audit/${id}`, params });
export const getAgentProfitList = (params: any) => defHttp.get({ url: '/basic-api/agent/profit/list', params });
export const getAgentWithdrawList = (params: any) => defHttp.get({ url: '/basic-api/agent/withdraw/list', params });
export const createAgentWithdraw = (params: any) => defHttp.post({ url: '/basic-api/agent/withdraw', params });
export const reviewAgentWithdraw = (id: string, params: any) => defHttp.put({ url: `/basic-api/agent/withdraw/review/${id}`, params });

// 商户 API
export const getMchList = (params: any) => defHttp.get({ url: '/basic-api/mch/list', params });
export const getMchDetail = (mchNo: string) => defHttp.get({ url: `/basic-api/mch/${mchNo}` });
export const createMch = (params: any) => defHttp.post({ url: '/basic-api/mch', params });
export const updateMch = (mchNo: string, params: any) => defHttp.put({ url: `/basic-api/mch/${mchNo}`, params });
export const reviewMch = (mchNo: string, params: any) => defHttp.put({ url: `/basic-api/mch/review/${mchNo}`, params });
export const getMchAppList = (params: any) => defHttp.get({ url: '/basic-api/mch/app/list', params });
export const getMchStoreList = (params: any) => defHttp.get({ url: '/basic-api/mch/store/list', params });
export const getMchRateConfig = (params: any) => defHttp.get({ url: '/basic-api/mch/rate/config', params });
export const updateMchRateConfig = (params: any) => defHttp.put({ url: '/basic-api/mch/rate/config', params });

// 通道 API
export const getChannelList = (params: any) => defHttp.get({ url: '/basic-api/channel/list', params });
export const getChannelConfig = (channelCode: string) => defHttp.get({ url: `/basic-api/channel/config/${channelCode}` });
export const updateChannelConfig = (channelCode: string, params: any) => defHttp.put({ url: `/basic-api/channel/config/${channelCode}`, params });
export const getChannelRouteList = (params: any) => defHttp.get({ url: '/basic-api/channel/route/list', params });
export const updateChannelRoute = (id: string, params: any) => defHttp.put({ url: `/basic-api/channel/route/${id}`, params });

// 交易 API
export const getTradeOrderList = (params: any) => defHttp.get({ url: '/basic-api/trade/order/list', params });
export const getTradeOrderDetail = (orderNo: string) => defHttp.get({ url: `/basic-api/trade/order/${orderNo}` });
export const getTradeRefundList = (params: any) => defHttp.get({ url: '/basic-api/trade/refund/list', params });
export const createRefund = (params: any) => defHttp.post({ url: '/basic-api/trade/refund', params });
export const getTradeCloseList = (params: any) => defHttp.get({ url: '/basic-api/trade/close/list', params });
export const getTradeTransferList = (params: any) => defHttp.get({ url: '/basic-api/trade/transfer/list', params });
export const getTradeWithdrawList = (params: any) => defHttp.get({ url: '/basic-api/trade/withdraw/list', params });
export const getTradeNotifyList = (params: any) => defHttp.get({ url: '/basic-api/trade/notify/list', params });
export const retryTradeNotify = (id: string) => defHttp.post({ url: `/basic-api/trade/notify/retry/${id}` });

// 财务 API
export const getAccountRecordList = (params: any) => defHttp.get({ url: '/basic-api/finance/account/record/list', params });
export const getSettlementList = (params: any) => defHttp.get({ url: '/basic-api/finance/settlement/list', params });
export const createSettlement = (params: any) => defHttp.post({ url: '/basic-api/finance/settlement', params });
export const reviewSettlement = (id: string, params: any) => defHttp.put({ url: `/basic-api/finance/settlement/review/${id}`, params });
export const getWithdrawApplyList = (params: any) => defHttp.get({ url: '/basic-api/finance/withdraw/list', params });
export const createWithdrawApply = (params: any) => defHttp.post({ url: '/basic-api/finance/withdraw', params });
export const reviewWithdraw = (id: string, params: any) => defHttp.put({ url: `/basic-api/finance/withdraw/review/${id}`, params });
export const getStatementList = (params: any) => defHttp.get({ url: '/basic-api/finance/statement/list', params });

// 设备 API
export const getDeviceList = (params: any) => defHttp.get({ url: '/basic-api/device/list', params });
export const getDeviceActivationList = (params: any) => defHttp.get({ url: '/basic-api/device/activation/list', params });
export const activateDevice = (params: any) => defHttp.post({ url: '/basic-api/device/activate', params });
export const getDevicePosList = (params: any) => defHttp.get({ url: '/basic-api/device/pos/list', params });
export const getDevicePrinterList = (params: any) => defHttp.get({ url: '/basic-api/device/printer/list', params });
export const getDeviceSpeakerList = (params: any) => defHttp.get({ url: '/basic-api/device/speaker/list', params });
export const getDeviceCodeList = (params: any) => defHttp.get({ url: '/basic-api/device/code/list', params });
export const generateDeviceCode = (params: any) => defHttp.post({ url: '/basic-api/device/code/generate', params });

// 中信银行 API
export const getCiticAccountInfo = () => defHttp.get({ url: '/basic-api/citic/account/info' });
export const getCiticAccountRecords = (params: any) => defHttp.get({ url: '/basic-api/citic/account/records', params });
export const getCiticAccountStats = () => defHttp.get({ url: '/basic-api/citic/account/stats' });
export const getCiticCardList = (params: any) => defHttp.get({ url: '/basic-api/citic/card/list', params });
export const bindCiticCard = (params: any) => defHttp.post({ url: '/basic-api/citic/card/bind', params });
export const unbindCiticCard = (cardNo: string) => defHttp.post({ url: `/basic-api/citic/card/unbind/${cardNo}` });
export const getCiticCheckList = (params: any) => defHttp.get({ url: '/basic-api/citic/check/list', params });
export const triggerCiticCheck = (params: any) => defHttp.post({ url: '/basic-api/citic/check/trigger', params });
export const confirmCiticCheck = (id: string) => defHttp.post({ url: `/basic-api/citic/check/confirm/${id}` });
export const getCiticCheckDiffList = (params: any) => defHttp.get({ url: '/basic-api/citic/check/diff/list', params });
export const confirmCheckDiff = (id: string) => defHttp.post({ url: `/basic-api/citic/check/diff/confirm/${id}` });
export const getCiticSettleList = (params: any) => defHttp.get({ url: '/basic-api/citic/settle/list', params });
export const applyCiticSettle = (params: any) => defHttp.post({ url: '/basic-api/citic/settle/apply', params });
export const confirmCiticSettle = (id: string) => defHttp.post({ url: `/basic-api/citic/settle/confirm/${id}` });
export const cancelCiticSettle = (id: string) => defHttp.post({ url: `/basic-api/citic/settle/cancel/${id}` });
export const downloadCiticCheckBill = (params: any) => defHttp.get({ url: '/basic-api/citic/check/download', params, responseType: 'blob' });

// 代理商分润 API
export const getProfitAccountList = (params: any) => defHttp.get({ url: '/basic-api/profit/account/list', params });
export const getProfitReceiverList = (params: any) => defHttp.get({ url: '/basic-api/profit/receiver/list', params });
export const addProfitReceiver = (params: any) => defHttp.post({ url: '/basic-api/profit/receiver', params });
export const updateProfitReceiver = (id: string, params: any) => defHttp.put({ url: `/basic-api/profit/receiver/${id}`, params });
export const deleteProfitReceiver = (id: string) => defHttp.delete({ url: `/basic-api/profit/receiver/${id}` });
export const getProfitRecordList = (params: any) => defHttp.get({ url: '/basic-api/profit/record/list', params });
export const getProfitRollbackList = (params: any) => defHttp.get({ url: '/basic-api/profit/rollback/list', params });
export const rollbackProfit = (id: string) => defHttp.post({ url: `/basic-api/profit/rollback/${id}` });

// 统计 API
export const getStatisticsTrade = (params: any) => defHttp.get({ url: '/basic-api/statistics/trade', params });
export const getStatisticsMerchant = (params: any) => defHttp.get({ url: '/basic-api/statistics/merchant', params });
export const getStatisticsChannel = (params: any) => defHttp.get({ url: '/basic-api/statistics/channel', params });
export const getStatisticsAgent = (params: any) => defHttp.get({ url: '/basic-api/statistics/agent', params });
export const getStatisticsFinance = (params: any) => defHttp.get({ url: '/basic-api/statistics/finance', params });

// 聚合支付池 API
export const getPoolList = (params: any) => defHttp.get({ url: '/basic-api/pool/list', params });
export const addToPool = (params: any) => defHttp.post({ url: '/basic-api/pool', params });
export const removeFromPool = (id: string) => defHttp.delete({ url: `/basic-api/pool/${id}` });

// 对账 API
export const getChannelBillList = (params: any) => defHttp.get({ url: '/basic-api/check/channel-bill/list', params });
export const getDiffBillList = (params: any) => defHttp.get({ url: '/basic-api/check/diff-bill/list', params });
export const handleDiffBill = (id: string, params: any) => defHttp.put({ url: `/basic-api/check/diff-bill/${id}`, params });

// 系统 API
export const getSysConfig = () => defHttp.get({ url: '/basic-api/sys/config' });
export const updateSysConfig = (params: any) => defHttp.put({ url: '/basic-api/sys/config', params });
export const getDictList = (params: any) => defHttp.get({ url: '/basic-api/sys/dict/list', params });
export const getDictData = (dictType: string) => defHttp.get({ url: `/basic-api/sys/dict/${dictType}` });
export const getNoticeList = (params: any) => defHttp.get({ url: '/basic-api/sys/notice/list', params });
export const createNotice = (params: any) => defHttp.post({ url: '/basic-api/sys/notice', params });
export const updateNotice = (id: string, params: any) => defHttp.put({ url: `/basic-api/sys/notice/${id}`, params });
export const deleteNotice = (id: string) => defHttp.delete({ url: `/basic-api/sys/notice/${id}` });
export const getLogList = (params: any) => defHttp.get({ url: '/basic-api/sys/log/list', params });


// Aliases
export const getCheckList = getCiticCheckList;
