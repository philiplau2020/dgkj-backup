/**
 * 开放平台 API 文档定义
 */

export interface ApiDoc {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  baseUrl: string;
  authType: 'apiKey' | 'jwt' | 'signature';
  endpoints: ApiEndpoint[];
}

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  name: string;
  description: string;
  auth: boolean;
  deprecated?: boolean;
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responseBody?: ApiResponseBody;
  examples?: ApiExample[];
}

export interface ApiParameter {
  name: string;
  in: 'query' | 'path' | 'header';
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  enum?: string[];
}

export interface ApiRequestBody {
  description: string;
  contentType: string;
  schema: ApiSchema;
  example?: any;
}

export interface ApiSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties: {
    [key: string]: {
      type: string;
      description?: string;
      required?: boolean;
      enum?: string[];
      default?: any;
      example?: any;
    };
  };
}

export interface ApiResponseBody {
  description: string;
  schema: {
    type: string;
    properties: {
      [key: string]: {
        type: string;
        description?: string;
        example?: any;
      };
    };
  };
  example?: any;
}

export interface ApiExample {
  title: string;
  request: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response: any;
}

/**
 * API 文档数据
 */
export const apiDocs: ApiDoc[] = [
  {
    id: 'developer',
    name: '开发者接口',
    version: 'v1',
    description: '开发者注册、登录、信息管理等接口',
    category: 'dev',
    baseUrl: '/api/v1',
    authType: 'none',
    endpoints: [
      {
        id: 'dev-register',
        method: 'POST',
        path: '/dev/register',
        name: '开发者注册',
        description: '注册成为开放平台开发者',
        auth: false,
        parameters: [],
        requestBody: {
          description: '开发者注册信息',
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              developerName: { type: 'string', description: '开发者名称', required: true, example: '张三' },
              username: { type: 'string', description: '登录用户名(4-32位)', required: true, example: 'dev_zhangsan' },
              password: { type: 'string', description: '登录密码(6-32位)', required: true, example: '******' },
              email: { type: 'string', description: '邮箱地址', required: true, example: 'zhangsan@example.com' },
              mobile: { type: 'string', description: '手机号', required: true, example: '13800138000' },
              company: { type: 'string', description: '公司名称(选填)', example: '某某科技有限公司' },
              contactPerson: { type: 'string', description: '联系人(选填)', example: '李四' },
              contactPhone: { type: 'string', description: '联系电话(选填)', example: '010-12345678' },
            },
          },
          example: {
            developerName: '张三',
            username: 'dev_zhangsan',
            password: '******',
            email: 'zhangsan@example.com',
            mobile: '13800138000',
            company: '某某科技有限公司',
          },
        },
        responseBody: {
          description: '注册成功返回开发者信息',
          schema: {
            type: 'object',
            properties: {
              code: { type: 'number', description: '状态码，0表示成功', example: 0 },
              message: { type: 'string', description: '响应消息', example: '注册成功' },
              data: {
                type: 'object',
                description: '开发者信息',
                properties: {
                  developerId: { type: 'string', description: '开发者ID', example: 'DEV1234567890' },
                  developerName: { type: 'string', description: '开发者名称', example: '张三' },
                  appLimit: { type: 'number', description: '应用数量限制', example: 10 },
                  apiQuota: { type: 'number', description: 'API日调用配额', example: 100000 },
                },
              },
            },
          },
          example: {
            code: 0,
            message: '注册成功',
            data: {
              developerId: 'DEV1234567890',
              developerName: '张三',
              appLimit: 10,
              apiQuota: 100000,
            },
          },
        },
      },
      {
        id: 'dev-login',
        method: 'POST',
        path: '/dev/login',
        name: '开发者登录',
        description: '开发者登录获取Token',
        auth: false,
        parameters: [],
        requestBody: {
          description: '登录凭证',
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: '用户名', required: true, example: 'dev_zhangsan' },
              password: { type: 'string', description: '密码', required: true, example: '******' },
            },
          },
          example: { username: 'dev_zhangsan', password: '******' },
        },
        responseBody: {
          description: '登录成功返回Token',
          schema: { type: 'object', properties: {} },
        },
        example: {
          request: { url: '/api/v1/dev/login', method: 'POST', body: { username: 'dev_zhangsan', password: '******' } },
          response: { code: 0, message: '登录成功', data: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', expiresIn: 86400 } },
        },
      },
      {
        id: 'dev-info',
        method: 'GET',
        path: '/dev/info',
        name: '获取开发者信息',
        description: '获取当前登录开发者的详细信息',
        auth: true,
        parameters: [
          { name: 'Authorization', in: 'header', type: 'string', required: true, description: 'Bearer Token' },
        ],
        responseBody: {
          description: '开发者详细信息',
          schema: { type: 'object', properties: {} },
        },
      },
    ],
  },
  {
    id: 'app',
    name: '应用管理',
    version: 'v1',
    description: '应用创建、配置、管理等接口',
    category: 'app',
    baseUrl: '/api/v1',
    authType: 'jwt',
    endpoints: [
      {
        id: 'app-create',
        method: 'POST',
        path: '/app',
        name: '创建应用',
        description: '创建一个新的应用',
        auth: true,
        parameters: [],
        requestBody: {
          description: '应用配置信息',
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              appName: { type: 'string', description: '应用名称', required: true, example: '我的支付应用' },
              appType: { type: 'string', description: '应用类型', required: true, enum: ['web', 'mobile', 'miniapp', 'api'], example: 'web' },
              description: { type: 'string', description: '应用描述', example: '用于线上商城的支付功能' },
              notifyUrl: { type: 'string', description: '支付回调地址', example: 'https://example.com/pay/notify' },
              refundNotifyUrl: { type: 'string', description: '退款回调地址', example: 'https://example.com/pay/refund' },
              enabledPayTypes: { type: 'array', description: '启用的支付方式', example: ['wx_native', 'alipay_qr'] },
            },
          },
          example: {
            appName: '我的支付应用',
            appType: 'web',
            description: '用于线上商城的支付功能',
            notifyUrl: 'https://example.com/pay/notify',
            enabledPayTypes: ['wx_native', 'alipay_qr'],
          },
        },
        responseBody: {
          description: '创建成功返回应用信息',
          schema: { type: 'object', properties: {} },
        },
      },
      {
        id: 'app-list',
        method: 'GET',
        path: '/app/list',
        name: '获取应用列表',
        description: '获取当前开发者的所有应用',
        auth: true,
        parameters: [
          { name: 'page', in: 'query', type: 'number', required: false, description: '页码', defaultValue: '1' },
          { name: 'pageSize', in: 'query', type: 'number', required: false, description: '每页数量', defaultValue: '10' },
          { name: 'keyword', in: 'query', type: 'string', required: false, description: '搜索关键词' },
          { name: 'status', in: 'query', type: 'string', required: false, description: '应用状态', enum: ['active', 'suspended'] },
        ],
        responseBody: { description: '应用列表', schema: { type: 'object', properties: {} } },
      },
      {
        id: 'app-detail',
        method: 'GET',
        path: '/app/:appId',
        name: '获取应用详情',
        description: '获取指定应用的详细信息',
        auth: true,
        parameters: [
          { name: 'appId', in: 'path', type: 'string', required: true, description: '应用ID' },
        ],
        responseBody: { description: '应用详情', schema: { type: 'object', properties: {} } },
      },
      {
        id: 'app-update',
        method: 'PUT',
        path: '/app/:appId',
        name: '更新应用',
        description: '更新应用配置信息',
        auth: true,
        parameters: [
          { name: 'appId', in: 'path', type: 'string', required: true, description: '应用ID' },
        ],
        requestBody: {
          description: '更新的应用配置',
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              appName: { type: 'string', description: '应用名称' },
              description: { type: 'string', description: '应用描述' },
              notifyUrl: { type: 'string', description: '支付回调地址' },
              enabledPayTypes: { type: 'array', description: '启用的支付方式' },
            },
          },
        },
        responseBody: { description: '更新成功', schema: { type: 'object', properties: {} } },
      },
      {
        id: 'app-reset-secret',
        method: 'POST',
        path: '/app/:appId/reset-secret',
        name: '重置AppSecret',
        description: '重置应用的AppSecret，重置后旧Secret立即失效',
        auth: true,
        parameters: [
          { name: 'appId', in: 'path', type: 'string', required: true, description: '应用ID' },
        ],
        responseBody: {
          description: '返回新的AppSecret',
          schema: { type: 'object', properties: {} },
          example: {
            code: 0,
            data: { appSecret: 'new_app_secret_xxxxxxxx' },
          },
        },
      },
    ],
  },
  {
    id: 'apikey',
    name: 'API Key管理',
    version: 'v1',
    description: 'API Key的创建、禁用、删除等管理',
    category: 'app',
    baseUrl: '/api/v1',
    authType: 'jwt',
    endpoints: [
      {
        id: 'key-create',
        method: 'POST',
        path: '/app/:appId/key',
        name: '创建API Key',
        description: '为应用创建一个新的API Key',
        auth: true,
        parameters: [],
        requestBody: {
          description: 'Key配置',
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              alias: { type: 'string', description: 'Key别名', example: '生产环境Key' },
              signType: { type: 'string', description: '签名类型', enum: ['hmac_sha256', 'rsa_2048', 'sm2'], defaultValue: 'hmac_sha256' },
              boundIp: { type: 'string', description: '绑定IP(选填)', example: '192.168.1.1' },
              expireDays: { type: 'number', description: '有效期天数(默认永久)', example: 365 },
            },
          },
        },
        responseBody: {
          description: '返回创建的API Key',
          schema: { type: 'object', properties: {} },
          example: {
            code: 0,
            data: {
              keyId: 'KEY1234567890',
              apiKey: 'DGKJ_AK_xxxxxxxxxxxxxxxx',
              apiSecret: 'DGKJ_SK_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
              signType: 'hmac_sha256',
              boundIp: null,
              expireTime: null,
              createdAt: '2024-01-01T00:00:00Z',
            },
          },
        },
      },
      {
        id: 'key-list',
        method: 'GET',
        path: '/app/:appId/keys',
        name: '获取API Key列表',
        description: '获取应用的所有API Key',
        auth: true,
        parameters: [
          { name: 'appId', in: 'path', type: 'string', required: true, description: '应用ID' },
        ],
        responseBody: { description: 'Key列表', schema: { type: 'array', properties: {} } },
      },
      {
        id: 'key-disable',
        method: 'POST',
        path: '/app/:appId/key/:keyId/disable',
        name: '禁用API Key',
        description: '禁用指定API Key，被禁用的Key将无法使用',
        auth: true,
        parameters: [
          { name: 'appId', in: 'path', type: 'string', required: true, description: '应用ID' },
          { name: 'keyId', in: 'path', type: 'string', required: true, description: 'Key ID' },
        ],
        responseBody: { description: '禁用成功', schema: { type: 'object', properties: {} } },
      },
      {
        id: 'key-delete',
        method: 'DELETE',
        path: '/app/:appId/key/:keyId',
        name: '删除API Key',
        description: '删除指定API Key，删除后不可恢复',
        auth: true,
        parameters: [
          { name: 'appId', in: 'path', type: 'string', required: true, description: '应用ID' },
          { name: 'keyId', in: 'path', type: 'string', required: true, description: 'Key ID' },
        ],
        responseBody: { description: '删除成功', schema: { type: 'object', properties: {} } },
      },
    ],
  },
  {
    id: 'payment',
    name: '支付接口',
    version: 'v1',
    description: '发起支付、查询订单、关闭订单等接口',
    category: 'trade',
    baseUrl: '/api/v1',
    authType: 'signature',
    endpoints: [
      {
        id: 'pay-gateway',
        method: 'POST',
        path: '/pay/gateway',
        name: '发起支付',
        description: '调用此接口发起支付，返回支付二维码或支付链接',
        auth: true,
        deprecated: false,
        parameters: [],
        requestBody: {
          description: '支付请求参数',
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              mchNo: { type: 'string', description: '商户号', required: true, example: 'M1234567890' },
              appId: { type: 'string', description: '应用ID', required: true, example: 'APP1234567890' },
              payType: { type: 'string', description: '支付方式', required: true, enum: ['wx_native', 'wx_jsapi', 'wx_h5', 'alipay_qr', 'alipay_wap', 'unionpay'], example: 'wx_native' },
              amount: { type: 'number', description: '支付金额(分)', required: true, example: 100 },
              subject: { type: 'string', description: '商品标题', required: true, example: '测试商品' },
              body: { type: 'string', description: '商品描述(选填)', example: '这是商品的详细描述' },
              orderNo: { type: 'string', description: '商户订单号', required: true, example: 'ORDER123456789' },
              clientIp: { type: 'string', description: '客户端IP(选填)', example: '127.0.0.1' },
              attach: { type: 'string', description: '附加数据(选填)', example: '额外信息' },
              notifyUrl: { type: 'string', description: '异步通知地址', required: true, example: 'https://example.com/notify' },
              returnUrl: { type: 'string', description: '支付完成跳转地址(选填)', example: 'https://example.com/success' },
            },
          },
          example: {
            mchNo: 'M1234567890',
            appId: 'APP1234567890',
            payType: 'wx_native',
            amount: 100,
            subject: '测试商品',
            body: '这是商品的详细描述',
            orderNo: 'ORDER123456789',
            clientIp: '127.0.0.1',
            notifyUrl: 'https://example.com/notify',
          },
        },
        responseBody: {
          description: '支付响应',
          schema: {
            type: 'object',
            properties: {
              orderNo: { type: 'string', description: '平台订单号' },
              payUrl: { type: 'string', description: '支付链接(跳转支付时使用)' },
              qrCode: { type: 'string', description: '二维码内容(扫码支付时使用)' },
              deeplink: { type: 'string', description: '深度链接(APP支付时使用)' },
              amount: { type: 'number', description: '订单金额(分)' },
              status: { type: 'string', description: '订单状态(pending/success/failed)' },
              expireTime: { type: 'string', description: '订单过期时间' },
            },
          },
          example: {
            code: 0,
            message: 'success',
            data: {
              orderNo: 'OP1234567890',
              payUrl: 'https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=xxx',
              qrCode: 'weixin://wxpay/bizpayurl?pr=xxx',
              amount: 100,
              status: 'pending',
              expireTime: '2024-01-01T12:00:00Z',
            },
          },
        },
      },
      {
        id: 'query-order',
        method: 'GET',
        path: '/query/order/:orderNo',
        name: '查询订单',
        description: '通过平台订单号查询订单状态',
        auth: true,
        parameters: [
          { name: 'orderNo', in: 'path', type: 'string', required: true, description: '平台订单号' },
        ],
        responseBody: {
          description: '订单信息',
          schema: { type: 'object', properties: {} },
          example: {
            code: 0,
            data: {
              orderNo: 'OP1234567890',
              mchNo: 'M1234567890',
              payType: 'wx_native',
              amount: 100,
              actualAmount: 100,
              status: 'paid',
              paidTime: '2024-01-01T10:00:00Z',
              createTime: '2024-01-01T09:55:00Z',
            },
          },
        },
      },
      {
        id: 'close-order',
        method: 'POST',
        path: '/order/:orderNo/close',
        name: '关闭订单',
        description: '关闭未支付的订单',
        auth: true,
        parameters: [
          { name: 'orderNo', in: 'path', type: 'string', required: true, description: '平台订单号' },
        ],
        responseBody: {
          description: '关闭结果',
          schema: { type: 'object', properties: {} },
          example: { code: 0, data: { orderNo: 'OP1234567890', status: 'closed' } },
        },
      },
    ],
  },
  {
    id: 'refund',
    name: '退款接口',
    version: 'v1',
    description: '申请退款、查询退款状态等接口',
    category: 'trade',
    baseUrl: '/api/v1',
    authType: 'signature',
    endpoints: [
      {
        id: 'refund-apply',
        method: 'POST',
        path: '/refund/apply',
        name: '申请退款',
        description: '对已支付订单申请退款',
        auth: true,
        parameters: [],
        requestBody: {
          description: '退款请求参数',
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              orderNo: { type: 'string', description: '原订单号', required: true, example: 'OP1234567890' },
              refundAmount: { type: 'number', description: '退款金额(分)', required: true, example: 100 },
              refundReason: { type: 'string', description: '退款原因', required: true, example: '用户申请取消' },
              notifyUrl: { type: 'string', description: '退款结果通知地址(选填)', example: 'https://example.com/refund/notify' },
            },
          },
        },
        responseBody: {
          description: '退款申请结果',
          schema: { type: 'object', properties: {} },
          example: {
            code: 0,
            data: {
              refundNo: 'RF1234567890',
              orderNo: 'OP1234567890',
              refundAmount: 100,
              status: 'pending',
              createTime: '2024-01-01T10:00:00Z',
            },
          },
        },
      },
      {
        id: 'query-refund',
        method: 'GET',
        path: '/query/refund/:refundNo',
        name: '查询退款',
        description: '通过退款单号查询退款状态',
        auth: true,
        parameters: [
          { name: 'refundNo', in: 'path', type: 'string', required: true, description: '退款单号' },
        ],
        responseBody: {
          description: '退款信息',
          schema: { type: 'object', properties: {} },
        },
      },
    ],
  },
  {
    id: 'transfer',
    name: '转账接口',
    version: 'v1',
    description: '商户转账、企业付款等接口',
    category: 'trade',
    baseUrl: '/api/v1',
    authType: 'signature',
    endpoints: [
      {
        id: 'transfer-pay',
        method: 'POST',
        path: '/transfer/pay',
        name: '发起转账',
        description: '向指定账户发起转账',
        auth: true,
        parameters: [],
        requestBody: {
          description: '转账请求参数',
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              outNo: { type: 'string', description: '商户转账单号', required: true, example: 'TR123456789' },
              amount: { type: 'number', description: '转账金额(分)', required: true, example: 10000 },
              accountType: { type: 'string', description: '账户类型', required: true, enum: ['bank_card', 'wechat', 'alipay'], example: 'bank_card' },
              accountName: { type: 'string', description: '账户名', required: true, example: '张三' },
              accountNo: { type: 'string', description: '账户号/卡号', required: true, example: '6222021234567890' },
              bankName: { type: 'string', description: '银行名称', required: true, example: '中国工商银行' },
              remark: { type: 'string', description: '转账备注(选填)', example: '工资发放' },
              notifyUrl: { type: 'string', description: '结果通知地址(选填)', example: 'https://example.com/transfer/notify' },
            },
          },
        },
        responseBody: {
          description: '转账结果',
          schema: { type: 'object', properties: {} },
          example: {
            code: 0,
            data: {
              transferNo: 'TF1234567890',
              outNo: 'TR123456789',
              amount: 10000,
              fee: 10,
              actualAmount: 9990,
              status: 'pending',
            },
          },
        },
      },
      {
        id: 'query-transfer',
        method: 'GET',
        path: '/query/transfer/:transferNo',
        name: '查询转账',
        description: '通过转账单号查询转账状态',
        auth: true,
        parameters: [
          { name: 'transferNo', in: 'path', type: 'string', required: true, description: '平台转账单号' },
        ],
        responseBody: { description: '转账信息', schema: { type: 'object', properties: {} } },
      },
    ],
  },
  {
    id: 'account',
    name: '账户接口',
    version: 'v1',
    description: '账户余额、账务明细等查询接口',
    category: 'finance',
    baseUrl: '/api/v1',
    authType: 'signature',
    endpoints: [
      {
        id: 'account-balance',
        method: 'GET',
        path: '/account/balance',
        name: '查询余额',
        description: '查询商户账户余额信息',
        auth: true,
        parameters: [
          { name: 'mchNo', in: 'query', type: 'string', required: false, description: '商户号(不传则查询当前商户)' },
        ],
        responseBody: {
          description: '账户余额信息',
          schema: {
            type: 'object',
            properties: {
              mchNo: { type: 'string', description: '商户号' },
              availableBalance: { type: 'number', description: '可用余额(元)' },
              frozenBalance: { type: 'number', description: '冻结余额(元)' },
              totalBalance: { type: 'number', description: '总余额(元)' },
              currency: { type: 'string', description: '币种' },
            },
          },
          example: {
            code: 0,
            data: {
              mchNo: 'M1234567890',
              availableBalance: 10000.00,
              frozenBalance: 1000.00,
              totalBalance: 11000.00,
              currency: 'CNY',
            },
          },
        },
      },
    ],
  },
];

/**
 * 获取API文档列表
 */
export function getApiDocList(): ApiDoc[] {
  return apiDocs;
}

/**
 * 根据ID获取API文档
 */
export function getApiDocById(id: string): ApiDoc | undefined {
  return apiDocs.find(doc => doc.id === id);
}

/**
 * 获取所有API端点列表
 */
export function getAllEndpoints(): Array<ApiDoc['endpoints'][0] & { category: string; docName: string }> {
  const endpoints: Array<ApiDoc['endpoints'][0] & { category: string; docName: string }> = [];
  for (const doc of apiDocs) {
    for (const endpoint of doc.endpoints) {
      endpoints.push({ ...endpoint, category: doc.category, docName: doc.name });
    }
  }
  return endpoints;
}

/**
 * 获取支付方式列表
 */
export const payTypes = [
  { code: 'wx_native', name: '微信扫码支付', icon: 'wechat' },
  { code: 'wx_jsapi', name: '微信JSAPI支付', icon: 'wechat' },
  { code: 'wx_h5', name: '微信H5支付', icon: 'wechat' },
  { code: 'wx_app', name: '微信APP支付', icon: 'wechat' },
  { code: 'alipay_qr', name: '支付宝扫码支付', icon: 'alipay' },
  { code: 'alipay_wap', name: '支付宝WAP支付', icon: 'alipay' },
  { code: 'alipay_app', name: '支付宝APP支付', icon: 'alipay' },
  { code: 'unionpay', name: '银联全渠道支付', icon: 'unionpay' },
  { code: 'unionpay_qr', name: '银联二维码支付', icon: 'unionpay' },
];

/**
 * 获取签名类型列表
 */
export const signTypes = [
  { code: 'hmac_sha256', name: 'HMAC-SHA256', description: '对称签名，速度快，推荐使用' },
  { code: 'rsa_2048', name: 'RSA-2048', description: '非对称签名，安全性高' },
  { code: 'sm2', name: 'SM2国密', description: '国密算法，国产化场景使用' },
];

/**
 * SDK下载列表
 */
export const sdkList = [
  { 
    language: 'Java', 
    version: '1.0.0',
    downloadUrl: '#',
    docsUrl: '#',
    description: '适用于Java 8及以上版本',
  },
  { 
    language: 'PHP', 
    version: '1.0.0',
    downloadUrl: '#',
    docsUrl: '#',
    description: '适用于PHP 7.4及以上版本',
  },
  { 
    language: 'Python', 
    version: '1.0.0',
    downloadUrl: '#',
    docsUrl: '#',
    description: '适用于Python 3.7及以上版本',
  },
  { 
    language: 'Node.js', 
    version: '1.0.0',
    downloadUrl: '#',
    docsUrl: '#',
    description: '适用于Node.js 14及以上版本',
  },
  { 
    language: '.NET', 
    version: '1.0.0',
    downloadUrl: '#',
    docsUrl: '#',
    description: '适用于.NET Framework 4.6及以上版本',
  },
];
