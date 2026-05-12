/**
 * DGKJ Open Platform SDK - PHP
 *
 * @example
 * ```php
 * <?php
 * require_once 'DgkjPayClient.php';
 *
 * $client = new DgkjPayClient([
 *     'app_id'   => 'APPxxx',
 *     'app_key'  => 'DGKJxxx',
 *     'secret'   => 'your_secret',
 *     'mch_no'   => 'Mxxx',
 *     'base_url' => 'https://api.dgkjpay.com',
 * ]);
 *
 * // 发起支付
 * $result = $client->pay([
 *     'pay_type'   => 'wx_native',
 *     'amount'     => 100,
 *     'subject'    => '测试商品',
 *     'order_no'   => 'ORD' . time(),
 *     'notify_url' => 'https://example.com/notify',
 * ]);
 *
 * if ($result['code'] === 'OP0000') {
 *     echo $result['data']['qr_code'];
 * }
 *
 * // 回调验签
 * $ok = $client->verifyCallback($_POST);
 * ```
 */

class DgkjPayClient
{
    private $appId;
    private $appKey;
    private $appSecret;
    private $mchNo;
    private $baseUrl;
    private $timeout;

    public function __construct(array $config)
    {
        if (empty($config['app_id'])) throw new InvalidArgumentException('app_id is required');
        if (empty($config['app_key'])) throw new InvalidArgumentException('app_key is required');
        if (empty($config['secret'])) throw new InvalidArgumentException('secret is required');
        if (empty($config['mch_no'])) throw new InvalidArgumentException('mch_no is required');

        $this->appId = $config['app_id'];
        $this->appKey = $config['app_key'];
        $this->appSecret = $config['secret'];
        $this->mchNo = $config['mch_no'];
        $this->baseUrl = $config['base_url'] ?? 'https://api.dgkjpay.com';
        $this->timeout = $config['timeout'] ?? 30;
    }

    /**
     * 生成时间戳
     */
    public function getTimestamp(): string
    {
        return date('YmdHis');
    }

    /**
     * 生成随机字符串
     */
    public function generateNonce(int $length = 32): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        $result = '';
        for ($i = 0; $i < $length; $i++) {
            $result .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $result;
    }

    /**
     * HMAC-SHA256 签名
     */
    public function sign(array $params): string
    {
        // 过滤空值和 sign
        $filtered = [];
        foreach ($params as $k => $v) {
            if ($v !== null && $v !== '' && $k !== 'sign') {
                $filtered[$k] = $v;
            }
        }
        ksort($filtered);

        // 拼接
        $str = '';
        foreach ($filtered as $k => $v) {
            if ($str) $str .= '&';
            $str .= "{$k}={$v}";
        }

        return strtoupper(hash_hmac('sha256', $str, $this->appSecret));
    }

    /**
     * 签名并返回所有认证参数
     */
    public function signParams(array $params = []): array
    {
        $all = array_merge($params, [
            'appKey' => $this->appKey,
            'timestamp' => $this->getTimestamp(),
            'nonce' => $this->generateNonce(),
        ]);

        $sign = $this->sign($all);
        $all['sign'] = $sign;
        $all['signType'] = 'HMAC-SHA256';

        return $all;
    }

    /**
     * 发送 HTTP 请求
     */
    public function request(string $method, string $path, array $data = []): array
    {
        $url = $this->baseUrl . $path;
        $params = $this->signParams($data);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-App-Key: ' . $this->appKey,
                'X-Sign-Type: HMAC-SHA256',
                'X-Timestamp: ' . $params['timestamp'],
                'X-Nonce: ' . $params['nonce'],
            ],
        ]);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
        }

        $response = curl_exec($ch);
        $error = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($error) {
            throw new RuntimeException('CURL Error: ' . $error);
        }

        $result = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('JSON decode error: ' . json_last_error_msg());
        }

        return $result ?? [];
    }

    // ==================== 支付接口 ====================

    /**
     * 发起支付
     *
     * @param array $params
     * @return array
     */
    public function pay(array $params): array
    {
        $required = ['pay_type', 'amount', 'subject', 'order_no', 'notify_url'];
        foreach ($required as $field) {
            if (empty($params[$field])) {
                throw new InvalidArgumentException("{$field} is required");
            }
        }

        $data = array_merge($params, [
            'mchNo' => $this->mchNo,
            'appId' => $this->appId,
        ]);

        return $this->request('POST', '/api/v1/pay/gateway', $data);
    }

    /**
     * Native 二维码支付
     */
    public function payNative(int $amount, string $subject, string $orderNo, string $notifyUrl): array
    {
        return $this->pay([
            'pay_type' => 'wx_native',
            'amount' => $amount,
            'subject' => $subject,
            'order_no' => $orderNo,
            'notify_url' => $notifyUrl,
        ]);
    }

    /**
     * JSAPI 支付
     */
    public function payJsapi(int $amount, string $subject, string $orderNo, string $notifyUrl, string $openid): array
    {
        return $this->pay([
            'pay_type' => 'wx_jsapi',
            'amount' => $amount,
            'subject' => $subject,
            'order_no' => $orderNo,
            'notify_url' => $notifyUrl,
            'openid' => $openid,
        ]);
    }

    /**
     * 支付宝扫码
     */
    public function payAlipayQr(int $amount, string $subject, string $orderNo, string $notifyUrl): array
    {
        return $this->pay([
            'pay_type' => 'alipay_qr',
            'amount' => $amount,
            'subject' => $subject,
            'order_no' => $orderNo,
            'notify_url' => $notifyUrl,
        ]);
    }

    /**
     * 查询订单
     */
    public function queryOrder(string $orderNo): array
    {
        return $this->request('GET', "/api/v1/query/order/{$orderNo}");
    }

    /**
     * 关闭订单
     */
    public function closeOrder(string $orderNo): array
    {
        return $this->request('POST', "/api/v1/order/{$orderNo}/close");
    }

    // ==================== 退款接口 ====================

    /**
     * 申请退款
     */
    public function refund(string $orderNo, int $refundAmount, string $refundReason): array
    {
        return $this->request('POST', '/api/v1/refund/apply', [
            'orderNo' => $orderNo,
            'refundAmount' => $refundAmount,
            'refundReason' => $refundReason,
        ]);
    }

    /**
     * 查询退款
     */
    public function queryRefund(string $refundNo): array
    {
        return $this->request('GET', "/api/v1/query/refund/{$refundNo}");
    }

    // ==================== 转账接口 ====================

    /**
     * 发起转账
     */
    public function transfer(array $params): array
    {
        $required = ['out_no', 'amount', 'account_type', 'account_name', 'account_no', 'bank_name'];
        foreach ($required as $field) {
            if (empty($params[$field])) {
                throw new InvalidArgumentException("{$field} is required");
            }
        }

        $data = [
            'outNo' => $params['out_no'],
            'amount' => $params['amount'],
            'accountType' => $params['account_type'],
            'accountName' => $params['account_name'],
            'accountNo' => $params['account_no'],
            'bankName' => $params['bank_name'],
            'remark' => $params['remark'] ?? '',
        ];

        return $this->request('POST', '/api/v1/transfer/pay', $data);
    }

    /**
     * 查询转账
     */
    public function queryTransfer(string $transferNo): array
    {
        return $this->request('GET', "/api/v1/query/transfer/{$transferNo}");
    }

    // ==================== 账户接口 ====================

    /**
     * 查询余额
     */
    public function getBalance(): array
    {
        return $this->request('GET', '/api/v1/account/balance');
    }

    // ==================== 回调验签 ====================

    /**
     * 验证回调签名
     *
     * @param array $data POST 数据
     * @return bool
     */
    public function verifyCallback(array $data): bool
    {
        $sign = $data['sign'] ?? '';
        unset($data['sign']);

        $expected = $this->sign($data);
        return hash_equals($expected, strtoupper($sign));
    }
}

// 使用示例
/*
<?php
require_once 'DgkjPayClient.php';

$client = new DgkjPayClient([
    'app_id' => 'APPxxx',
    'app_key' => 'DGKJxxx',
    'secret' => 'your_secret',
    'mch_no' => 'Mxxx',
]);

// 发起支付
$result = $client->pay([
    'pay_type' => 'wx_native',
    'amount' => 100,
    'subject' => '测试商品',
    'order_no' => 'ORD' . time(),
    'notify_url' => 'https://example.com/notify',
]);

if ($result['code'] === 'OP0000') {
    echo "订单号: " . $result['data']['orderNo'] . "\n";
    echo "二维码: " . $result['data']['qrCode'] . "\n";
}

// 回调处理
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ok = $client->verifyCallback($_POST);
    if ($ok && ($_POST['status'] ?? '') === 'paid') {
        $orderNo = $_POST['orderNo'];
        // TODO: 处理支付成功逻辑
        echo json_encode(['code' => 'OP0000', 'message' => 'success']);
    } else {
        echo json_encode(['code' => 'OP1001', 'message' => '签名验证失败']);
    }
}
*/
