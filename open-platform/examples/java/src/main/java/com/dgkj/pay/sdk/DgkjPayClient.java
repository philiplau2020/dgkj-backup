/**
 * DGKJ Open Platform SDK - Java
 *
 * Maven dependency:
 * <dependency>
 *   <groupId>com.dgkj</groupId>
 *   <artifactId>dgkj-pay-sdk</artifactId>
 *   <version>1.0.0</version>
 * </dependency>
 *
 * Gradle:
 * implementation 'com.dgkj:dgkj-pay-sdk:1.0.0'
 */
package com.dgkj.pay.sdk;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.*;

public class DgkjPayClient {
    private final String appId;
    private final String appKey;
    private final String appSecret;
    private final String mchNo;
    private final String baseUrl;
    private final int timeout;
    private final ObjectMapper mapper = new ObjectMapper();

    public DgkjPayClient(String appId, String appKey, String appSecret, String mchNo) {
        this(appId, appKey, appSecret, mchNo, "https://api.dgkjpay.com");
    }

    public DgkjPayClient(String appId, String appKey, String appSecret, String mchNo, String baseUrl) {
        this.appId = appId;
        this.appKey = appKey;
        this.appSecret = appSecret;
        this.mchNo = mchNo;
        this.baseUrl = baseUrl;
        this.timeout = 30000;
    }

    // ==================== 签名 ====================

    /**
     * 生成时间戳 (yyyyMMddHHmmss)
     */
    public String getTimestamp() {
        return new SimpleDateFormat("yyyyMMddHHmmss", Locale.CHINA).format(new Date());
    }

    /**
     * 生成随机字符串
     */
    public String generateNonce() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }

    /**
     * HMAC-SHA256 签名
     */
    public String sign(Map<String, Object> params) throws Exception {
        // 过滤空值和 sign 参数
        Map<String, Object> filtered = new TreeMap<>();
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().toString().isEmpty() && !"sign".equals(entry.getKey())) {
                filtered.put(entry.getKey(), entry.getValue());
            }
        }

        // 拼接字符串
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Object> entry : filtered.entrySet()) {
            if (sb.length() > 0) sb.append("&");
            sb.append(entry.getKey()).append("=").append(entry.getValue());
        }

        // HMAC-SHA256
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(appSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] hash = mac.doFinal(sb.toString().getBytes(StandardCharsets.UTF_8));

        // 转十六进制大写
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            String h = Integer.toHexString(b & 0xff);
            if (h.length() == 1) hex.append("0");
            hex.append(h);
        }
        return hex.toString().toUpperCase();
    }

    /**
     * 签名并返回所有参数
     */
    public Map<String, Object> signParams(Map<String, Object> params) throws Exception {
        Map<String, Object> all = new TreeMap<>(params);
        all.put("appKey", appKey);
        all.put("timestamp", getTimestamp());
        all.put("nonce", generateNonce());

        String sign = sign(all);
        all.put("sign", sign);
        all.put("signType", "HMAC-SHA256");
        return all;
    }

    // ==================== HTTP 请求 ====================

    public DgkjResponse request(String method, String path, Map<String, Object> data) throws Exception {
        String url = baseUrl + path;
        Map<String, Object> signed = signParams(data != null ? data : new HashMap<>());

        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(timeout);
        conn.setReadTimeout(timeout);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("X-App-Key", appKey);
        conn.setRequestProperty("X-Sign-Type", "HMAC-SHA256");
        conn.setRequestProperty("X-Timestamp", (String) signed.get("timestamp"));
        conn.setRequestProperty("X-Nonce", (String) signed.get("nonce"));
        conn.setDoOutput(true);

        String json = mapper.writeValueAsString(signed);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(json.getBytes(StandardCharsets.UTF_8));
        }

        int code = conn.getResponseCode();
        StringBuilder resp = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
            code >= 400 ? conn.getErrorStream() : conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) resp.append(line);
        }

        return mapper.readValue(resp.toString(), DgkjResponse.class);
    }

    // ==================== 支付接口 ====================

    /**
     * 发起支付
     * @param payType 支付方式: wx_native/wx_jsapi/wx_h5/alipay_qr/alipay/alipay_wap/unionpay/bank
     * @param amount 金额(分)
     * @param subject 商品标题
     * @param orderNo 商户订单号
     * @param notifyUrl 回调通知地址
     * @return 支付结果
     */
    public DgkjResponse pay(String payType, long amount, String subject, String orderNo, String notifyUrl) throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("mchNo", mchNo);
        params.put("appId", appId);
        params.put("payType", payType);
        params.put("amount", amount);
        params.put("subject", subject);
        params.put("orderNo", orderNo);
        params.put("notifyUrl", notifyUrl);
        return request("POST", "/api/v1/pay/gateway", params);
    }

    /**
     * Native 二维码支付
     */
    public DgkjResponse payNative(long amount, String subject, String orderNo, String notifyUrl) throws Exception {
        return pay("wx_native", amount, subject, orderNo, notifyUrl);
    }

    /**
     * JSAPI 支付
     */
    public DgkjResponse payJsapi(long amount, String subject, String orderNo, String notifyUrl, String openid) throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("mchNo", mchNo);
        params.put("appId", appId);
        params.put("payType", "wx_jsapi");
        params.put("amount", amount);
        params.put("subject", subject);
        params.put("orderNo", orderNo);
        params.put("notifyUrl", notifyUrl);
        params.put("openid", openid);
        return request("POST", "/api/v1/pay/gateway", params);
    }

    /**
     * 查询订单
     */
    public DgkjResponse queryOrder(String orderNo) throws Exception {
        return request("GET", "/api/v1/query/order/" + orderNo, null);
    }

    /**
     * 关闭订单
     */
    public DgkjResponse closeOrder(String orderNo) throws Exception {
        return request("POST", "/api/v1/order/" + orderNo + "/close", null);
    }

    // ==================== 退款接口 ====================

    /**
     * 申请退款
     */
    public DgkjResponse refund(String orderNo, long refundAmount, String refundReason) throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("orderNo", orderNo);
        params.put("refundAmount", refundAmount);
        params.put("refundReason", refundReason);
        return request("POST", "/api/v1/refund/apply", params);
    }

    /**
     * 查询退款
     */
    public DgkjResponse queryRefund(String refundNo) throws Exception {
        return request("GET", "/api/v1/query/refund/" + refundNo, null);
    }

    // ==================== 转账接口 ====================

    /**
     * 发起转账
     */
    public DgkjResponse transfer(String outNo, long amount, String accountType,
                                  String accountName, String accountNo, String bankName) throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("outNo", outNo);
        params.put("amount", amount);
        params.put("accountType", accountType);
        params.put("accountName", accountName);
        params.put("accountNo", accountNo);
        params.put("bankName", bankName);
        return request("POST", "/api/v1/transfer/pay", params);
    }

    /**
     * 查询转账
     */
    public DgkjResponse queryTransfer(String transferNo) throws Exception {
        return request("GET", "/api/v1/query/transfer/" + transferNo, null);
    }

    // ==================== 账户接口 ====================

    /**
     * 查询余额
     */
    public DgkjResponse getBalance() throws Exception {
        return request("GET", "/api/v1/account/balance", null);
    }

    // ==================== 回调处理 ====================

    /**
     * 验证回调签名
     */
    public boolean verifyCallback(Map<String, Object> data, String sign) throws Exception {
        Map<String, Object> params = new TreeMap<>(data);
        params.remove("sign");
        String expected = sign(params);
        return expected.equalsIgnoreCase(sign);
    }
}

// ==================== 响应对象 ====================

class DgkjResponse {
    public String code;
    public String message;
    public Object data;
    public String requestId;
    public String timestamp;

    public boolean isSuccess() {
        return "OP0000".equals(code);
    }

    @Override
    public String toString() {
        return "DgkjResponse{code=" + code + ", message=" + message + ", data=" + data + "}";
    }
}

// ==================== 使用示例 ====================

/*
// 1. 初始化客户端
DgkjPayClient client = new DgkjPayClient(
    "APPxxx",       // appId
    "DGKJxxx",      // appKey
    "your_secret",  // appSecret
    "Mxxx"          // mchNo
);

// 2. 发起 Native 二维码支付
DgkjResponse resp = client.payNative(
    100,                        // 金额: 1.00元
    "测试商品",                  // 商品标题
    "ORD" + System.currentTimeMillis(), // 商户订单号
    "https://your-domain.com/notify"     // 回调地址
);

if (resp.isSuccess()) {
    String qrCode = (String) ((Map) resp.data).get("qrCode");
    String orderNo = (String) ((Map) resp.data).get("orderNo");
    System.out.println("订单号: " + orderNo);
    System.out.println("二维码: " + qrCode);
} else {
    System.err.println("支付失败: " + resp.message);
}

// 3. 回调处理
@PostMapping("/notify")
public String notify(@RequestBody Map<String, Object> body) {
    boolean ok = client.verifyCallback(body, (String) body.get("sign"));
    if (ok) {
        String orderNo = (String) body.get("orderNo");
        String status = (String) body.get("status");
        if ("paid".equals(status)) {
            // TODO: 处理支付成功逻辑
        }
        return "{\"code\":\"OP0000\",\"message\":\"success\"}";
    }
    return "{\"code\":\"OP1001\",\"message\":\"签名验证失败\"}";
}
*/
