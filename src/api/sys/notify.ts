import { defHttp } from '@/utils/http/axios';

// 后端路由注册在 /basic-api/sys/notification
enum Api {
  // 邮件配置
  GetEmailConfig = '/basic-api/sys/notification/config/email',
  SaveEmailConfig = '/basic-api/sys/notification/config/email',
  TestEmail = '/basic-api/sys/notification/config/email/test',
  // 短信配置
  GetSmsConfig = '/basic-api/sys/notification/config/sms',
  SaveSmsConfig = '/basic-api/sys/notification/config/sms',
  TestSms = '/basic-api/sys/notification/config/sms/test',
  // 阿里云短信配置
  GetAliyunSmsConfig = '/basic-api/sys/notification/config/sms/aliyun',
  SaveAliyunSmsConfig = '/basic-api/sys/notification/config/sms/aliyun',
  // 钉钉配置
  GetDingTalkConfig = '/basic-api/sys/notification/config/dingtalk',
  SaveDingTalkConfig = '/basic-api/sys/notification/config/dingtalk',
  TestDingTalk = '/basic-api/sys/notification/config/dingtalk/test',
  // 企业微信配置
  GetWeComConfig = '/basic-api/sys/notification/config/wecom',
  SaveWeComConfig = '/basic-api/sys/notification/config/wecom',
  TestWeCom = '/basic-api/sys/notification/config/wecom/test',
  // 高德地图配置
  GetAmapConfig = '/basic-api/sys/notification/config/map/amap',
  SaveAmapConfig = '/basic-api/sys/notification/config/map/amap',
  // 百度地图配置
  GetBaiduMapConfig = '/basic-api/sys/notification/config/map/baidu',
  SaveBaiduMapConfig = '/basic-api/sys/notification/config/map/baidu',
  // 告警通知
  SendAlert = '/basic-api/sys/notification/alert',
  // 发送记录
  GetRecordList = '/basic-api/sys/notification/record/list',
  RetryRecord = '/basic-api/sys/notification/record/retry',
  // 模板管理
  GetTemplateList = '/basic-api/sys/notification/template/list',
  GetTemplateDetail = '/basic-api/sys/notification/template',
  CreateTemplate = '/basic-api/sys/notification/template',
  UpdateTemplate = '/basic-api/sys/notification/template',
  DeleteTemplate = '/basic-api/sys/notification/template',
  InitTemplate = '/basic-api/sys/notification/template/init',
  PreviewTemplate = '/basic-api/sys/notification/template/preview',
  // 订阅管理
  GetSubscriptionList = '/basic-api/sys/notification/subscription/list',
  CreateSubscription = '/basic-api/sys/notification/subscription',
  UpdateSubscription = '/basic-api/sys/notification/subscription',
  DeleteSubscription = '/basic-api/sys/notification/subscription',
  // 风控预警
  GetRiskAlertList = '/basic-api/sys/notification/risk-alert/list',
  CreateRiskAlert = '/basic-api/sys/notification/risk-alert',
  UpdateRiskAlert = '/basic-api/sys/notification/risk-alert',
  DeleteRiskAlert = '/basic-api/sys/notification/risk-alert',
}

// 邮件配置
export const getEmailConfig = () => defHttp.get({ url: Api.GetEmailConfig });
export const saveEmailConfig = (params) => defHttp.post({ url: Api.SaveEmailConfig, params });
export const testEmail = (params) => defHttp.post({ url: Api.TestEmail, params });

// 短信配置
export const getSmsConfig = () => defHttp.get({ url: Api.GetSmsConfig });
export const saveSmsConfig = (params) => defHttp.post({ url: Api.SaveSmsConfig, params });
export const testSms = (params) => defHttp.post({ url: Api.TestSms, params });

// 钉钉配置
export const getDingTalkConfig = () => defHttp.get({ url: Api.GetDingTalkConfig });
export const saveDingTalkConfig = (params) => defHttp.post({ url: Api.SaveDingTalkConfig, params });
export const testDingTalk = () => defHttp.post({ url: Api.TestDingTalk });

// 企业微信配置
export const getWeComConfig = () => defHttp.get({ url: Api.GetWeComConfig });
export const saveWeComConfig = (params) => defHttp.post({ url: Api.SaveWeComConfig, params });
export const testWeCom = () => defHttp.post({ url: Api.TestWeCom });

// 发送告警
export const sendAlert = (params) => defHttp.post({ url: Api.SendAlert, params });

// ==================== 阿里云短信配置 ====================
export const getAliyunSmsConfig = () => defHttp.get({ url: Api.GetAliyunSmsConfig });
export const saveAliyunSmsConfig = (params) => defHttp.post({ url: Api.SaveAliyunSmsConfig, params });

// ==================== 高德地图配置 ====================
export const getAmapConfig = () => defHttp.get({ url: Api.GetAmapConfig });
export const saveAmapConfig = (params) => defHttp.post({ url: Api.SaveAmapConfig, params });

// ==================== 百度地图配置 ====================
export const getBaiduMapConfig = () => defHttp.get({ url: Api.GetBaiduMapConfig });
export const saveBaiduMapConfig = (params) => defHttp.post({ url: Api.SaveBaiduMapConfig, params });

// ==================== 发送记录 ====================
export const getRecordList = (params) => defHttp.get({ url: Api.GetRecordList, params });
export const retryRecord = (notifyId) => defHttp.post({ url: `${Api.RetryRecord}/${notifyId}` });

// ==================== 模板管理 ====================
export const getTemplateList = (params) => defHttp.get({ url: Api.GetTemplateList, params });
export const getTemplateDetail = (id) => defHttp.get({ url: `${Api.GetTemplateDetail}/${id}` });
export const createTemplate = (params) => defHttp.post({ url: Api.CreateTemplate, params });
export const updateTemplate = (id, params) => defHttp.put({ url: `${Api.UpdateTemplate}/${id}`, params });
export const deleteTemplate = (id) => defHttp.delete({ url: `${Api.DeleteTemplate}/${id}` });
export const initTemplate = () => defHttp.post({ url: Api.InitTemplate });
export const previewTemplate = (params) => defHttp.post({ url: Api.PreviewTemplate, params });

// ==================== 订阅管理 ====================
export const getSubscriptionList = (params) => defHttp.get({ url: Api.GetSubscriptionList, params });
export const createSubscription = (params) => defHttp.post({ url: Api.CreateSubscription, params });
export const updateSubscription = (id, params) => defHttp.put({ url: `${Api.UpdateSubscription}/${id}`, params });
export const deleteSubscription = (id) => defHttp.delete({ url: `${Api.DeleteSubscription}/${id}` });

// ==================== 风控预警 ====================
export const getRiskAlertList = (params) => defHttp.get({ url: Api.GetRiskAlertList, params });
export const createRiskAlert = (params) => defHttp.post({ url: Api.CreateRiskAlert, params });
export const updateRiskAlert = (id, params) => defHttp.put({ url: `${Api.UpdateRiskAlert}/${id}`, params });
export const deleteRiskAlert = (id) => defHttp.delete({ url: `${Api.DeleteRiskAlert}/${id}` });
