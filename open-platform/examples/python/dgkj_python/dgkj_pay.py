"""
DGKJ Open Platform SDK - Python

@requires requests>=2.20.0

@example
```python
from dgkj_pay import DgkjPayClient

client = DgkjPayClient(
    app_id='APPxxx',
    app_key='DGKJxxx',
    app_secret='your_secret',
    mch_no='Mxxx',
)

# 发起支付
result = client.pay(
    pay_type='wx_native',
    amount=100,
    subject='测试商品',
    order_no='ORD' + str(int(time.time())),
    notify_url='https://example.com/notify',
)

if result['code'] == 'OP0000':
    print(result['data']['qr_code'])
```
"""

import hashlib
import hmac
import json
import time
import uuid
import random
import string
from typing import Dict, Any, Optional
from urllib.parse import urlencode

try:
    import requests
except ImportError:
    raise ImportError("requests library is required. Install: pip install requests")


class DgkjPayException(Exception):
    def __init__(self, code: str, message: str, data: Any = None):
        super().__init__(message)
        self.code = code
        self.data = data


class DgkjPayClient:
    BASE_URL = 'https://api.dgkjpay.com'
    SANDBOX_URL = 'https://sandbox-api.dgkjpay.com'

    def __init__(
        self,
        app_id: str,
        app_key: str,
        app_secret: str,
        mch_no: str,
        base_url: str = BASE_URL,
        timeout: int = 30,
    ):
        if not app_id: raise ValueError('app_id is required')
        if not app_key: raise ValueError('app_key is required')
        if not app_secret: raise ValueError('app_secret is required')
        if not mch_no: raise ValueError('mch_no is required')

        self.app_id = app_id
        self.app_key = app_key
        self.app_secret = app_secret
        self.mch_no = mch_no
        self.base_url = base_url
        self.timeout = timeout

    # ==================== 签名 ====================

    def _get_timestamp(self) -> str:
        """生成时间戳"""
        return time.strftime('%Y%m%d%H%M%S')

    def _generate_nonce(self, length: int = 32) -> str:
        """生成随机字符串"""
        return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

    def _sign(self, params: Dict[str, Any]) -> str:
        """HMAC-SHA256 签名"""
        # 过滤空值和 sign
        filtered = {k: v for k, v in params.items()
                    if v is not None and v != '' and k != 'sign'}
        # 字典序排序
        sorted_keys = sorted(filtered.keys())
        # 拼接
        str_to_sign = '&'.join(f'{k}={filtered[k]}' for k in sorted_keys)
        # HMAC-SHA256
        return hmac.new(
            self.app_secret.encode('utf-8'),
            str_to_sign.encode('utf-8'),
            hashlib.sha256
        ).hexdigest().upper()

    def _sign_params(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """签名并返回所有认证参数"""
        params = params or {}
        all_params = {
            **params,
            'appKey': self.app_key,
            'timestamp': self._get_timestamp(),
            'nonce': self._generate_nonce(),
        }
        sign = self._sign(all_params)
        return {**all_params, 'sign': sign, 'signType': 'HMAC-SHA256'}

    # ==================== HTTP 请求 ====================

    def _request(self, method: str, path: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        """发送 HTTP 请求"""
        url = f"{self.base_url}{path}"
        signed = self._sign_params(data or {})

        headers = {
            'Content-Type': 'application/json',
            'X-App-Key': self.app_key,
            'X-Sign-Type': 'HMAC-SHA256',
            'X-Timestamp': signed['timestamp'],
            'X-Nonce': signed['nonce'],
            'User-Agent': 'dgkj-pay-sdk-python/1.0.0',
        }

        try:
            if method.upper() == 'GET':
                resp = requests.get(url, params=signed, headers=headers, timeout=self.timeout)
            else:
                resp = requests.post(url, json=signed, headers=headers, timeout=self.timeout)

            result = resp.json()
            return result

        except requests.RequestException as e:
            raise DgkjPayException('OP9001', f'Request failed: {str(e)}')

    # ==================== 支付接口 ====================

    def pay(
        self,
        pay_type: str,
        amount: int,
        subject: str,
        order_no: str,
        notify_url: str,
        body: str = None,
        return_url: str = None,
        client_ip: str = None,
        attach: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        发起支付

        @param pay_type: 支付方式 wx_native/wx_jsapi/wx_h5/alipay_qr/alipay/alipay_wap/unionpay/bank
        @param amount: 金额(分)
        @param subject: 商品标题
        @param order_no: 商户订单号
        @param notify_url: 回调通知地址
        """
        if not pay_type: raise ValueError('pay_type is required')
        if not amount or amount < 1: raise ValueError('amount must be >= 1 (fen)')
        if not subject: raise ValueError('subject is required')
        if not order_no: raise ValueError('order_no is required')
        if not notify_url: raise ValueError('notify_url is required')

        data = {
            'mchNo': self.mch_no,
            'appId': self.app_id,
            'payType': pay_type,
            'amount': amount,
            'subject': subject,
            'orderNo': order_no,
            'notifyUrl': notify_url,
        }
        if body: data['body'] = body
        if return_url: data['returnUrl'] = return_url
        if client_ip: data['clientIp'] = client_ip
        if attach: data['attach'] = attach
        data.update(kwargs)

        return self._request('POST', '/api/v1/pay/gateway', data)

    def pay_native(self, amount: int, subject: str, order_no: str, notify_url: str, **kwargs) -> Dict[str, Any]:
        """Native 二维码支付"""
        return self.pay('wx_native', amount, subject, order_no, notify_url, **kwargs)

    def pay_jsapi(self, amount: int, subject: str, order_no: str, notify_url: str, openid: str, **kwargs) -> Dict[str, Any]:
        """JSAPI 支付"""
        return self.pay('wx_jsapi', amount, subject, order_no, notify_url, **kwargs)

    def pay_h5(self, amount: int, subject: str, order_no: str, notify_url: str, return_url: str, **kwargs) -> Dict[str, Any]:
        """H5 支付"""
        return self.pay('wx_h5', amount, subject, order_no, notify_url, returnUrl=return_url, **kwargs)

    def pay_alipay_qr(self, amount: int, subject: str, order_no: str, notify_url: str, **kwargs) -> Dict[str, Any]:
        """支付宝扫码"""
        return self.pay('alipay_qr', amount, subject, order_no, notify_url, **kwargs)

    def query_order(self, order_no: str) -> Dict[str, Any]:
        """查询订单"""
        return self._request('GET', f'/api/v1/query/order/{order_no}')

    def close_order(self, order_no: str) -> Dict[str, Any]:
        """关闭订单"""
        return self._request('POST', f'/api/v1/order/{order_no}/close')

    # ==================== 退款接口 ====================

    def refund(self, order_no: str, refund_amount: int, refund_reason: str) -> Dict[str, Any]:
        """
        申请退款
        @param order_no: 原订单号
        @param refund_amount: 退款金额(分)
        @param refund_reason: 退款原因
        """
        if not order_no: raise ValueError('order_no is required')
        if not refund_amount or refund_amount < 1: raise ValueError('refund_amount must be >= 1')
        if not refund_reason: raise ValueError('refund_reason is required')

        return self._request('POST', '/api/v1/refund/apply', {
            'orderNo': order_no,
            'refundAmount': refund_amount,
            'refundReason': refund_reason,
        })

    def query_refund(self, refund_no: str) -> Dict[str, Any]:
        """查询退款"""
        return self._request('GET', f'/api/v1/query/refund/{refund_no}')

    # ==================== 转账接口 ====================

    def transfer(
        self,
        out_no: str,
        amount: int,
        account_type: str,
        account_name: str,
        account_no: str,
        bank_name: str,
        remark: str = None,
    ) -> Dict[str, Any]:
        """发起转账"""
        return self._request('POST', '/api/v1/transfer/pay', {
            'outNo': out_no,
            'amount': amount,
            'accountType': account_type,
            'accountName': account_name,
            'accountNo': account_no,
            'bankName': bank_name,
            'remark': remark or '',
        })

    def query_transfer(self, transfer_no: str) -> Dict[str, Any]:
        """查询转账"""
        return self._request('GET', f'/api/v1/query/transfer/{transfer_no}')

    # ==================== 账户接口 ====================

    def get_balance(self, mch_no: str = None) -> Dict[str, Any]:
        """查询余额"""
        params = {'mchNo': mch_no or self.mch_no}
        return self._request('GET', '/api/v1/account/balance', params)

    # ==================== 回调验签 ====================

    def verify_callback(self, data: Dict[str, Any]) -> bool:
        """
        验证回调签名
        @param data: POST 数据
        @return: True 验签成功
        """
        sign = data.get('sign', '')
        if not sign:
            return False

        params = {k: v for k, v in data.items() if k != 'sign'}
        expected = self._sign(params)
        return hmac.compare_digest(expected, sign.upper())

    # ==================== 快捷方法 ====================

    @property
    def is_sandbox(self) -> bool:
        """是否沙箱环境"""
        return self.base_url == self.SANDBOX_URL


# 使用示例
"""
from dgkj_pay import DgkjPayClient
import time

client = DgkjPayClient(
    app_id='APPxxx',
    app_key='DGKJxxx',
    app_secret='your_secret',
    mch_no='Mxxx',
)

# 发起支付
result = client.pay_native(
    amount=100,
    subject='测试商品',
    order_no='ORD' + str(int(time.time())),
    notify_url='https://example.com/notify',
)

if result['code'] == 'OP0000':
    print(f"订单号: {result['data']['orderNo']}")
    print(f"二维码: {result['data']['qrCode']}")

# Flask 回调处理
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/notify', methods=['POST'])
def notify():
    data = request.get_json()
    ok = client.verify_callback(data)
    if ok and data.get('status') == 'paid':
        # TODO: 处理支付成功
        return jsonify(code='OP0000', message='success')
    return jsonify(code='OP1001', message='签名验证失败')
"""
