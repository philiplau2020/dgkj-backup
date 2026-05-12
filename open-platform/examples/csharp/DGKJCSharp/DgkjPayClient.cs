/**
 * DGKJ Open Platform SDK - C# (.NET)
 *
 * Install via NuGet:
 * dotnet add package DGKJ.PaySDK
 *
 * @example
 * ```csharp
 * using DGKJ.Pay;
 *
 * var client = new DgkjPayClient(
 *     appId: "APPxxx",
 *     appKey: "DGKJxxx",
 *     appSecret: "your_secret",
 *     mchNo: "Mxxx"
 * );
 *
 * var result = await client.PayAsync(new PayRequest {
 *     PayType = "wx_native",
 *     Amount = 100,
 *     Subject = "测试商品",
 *     OrderNo = "ORD" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
 *     NotifyUrl = "https://example.com/notify"
 * });
 *
 * if (result.IsSuccess()) {
 *     Console.WriteLine(result.Data.QrCode);
 * }
 * ```
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace DGKJ.Pay.SDK
{
    /// <summary>
    /// DGKJ 支付客户端
    /// </summary>
    public class DgkjPayClient : IDisposable
    {
        private readonly string _appId;
        private readonly string _appKey;
        private readonly string _appSecret;
        private readonly string _mchNo;
        private readonly string _baseUrl;
        private readonly HttpClient _httpClient;

        public DgkjPayClient(string appId, string appKey, string appSecret, string mchNo, string baseUrl = "https://api.dgkjpay.com")
        {
            _appId = appId ?? throw new ArgumentNullException(nameof(appId));
            _appKey = appKey ?? throw new ArgumentNullException(nameof(appKey));
            _appSecret = appSecret ?? throw new ArgumentNullException(nameof(appSecret));
            _mchNo = mchNo ?? throw new ArgumentNullException(nameof(mchNo));
            _baseUrl = baseUrl ?? "https://api.dgkjpay.com";
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        }

        // ==================== 签名 ====================

        /// <summary>生成时间戳 (yyyyMMddHHmmss)</summary>
        public string GetTimestamp() => DateTime.Now.ToString("yyyyMMddHHmmss");

        /// <summary>生成随机字符串</summary>
        public string GenerateNonce(int length = 32)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var rng = RandomNumberGenerator.Create();
            var bytes = new byte[length];
            rng.GetBytes(bytes);
            return new string(bytes.Select(b => chars[b % chars.Length]).ToArray());
        }

        /// <summary>HMAC-SHA256 签名</summary>
        public string Sign(Dictionary<string, object> parameters)
        {
            // 过滤空值
            var filtered = parameters
                .Where(p => p.Value != null && p.Value.ToString() != "" && p.Key != "sign")
                .OrderBy(p => p.Key)
                .ToDictionary(p => p.Key, p => p.Value);

            // 拼接
            var str = string.Join("&", filtered.Select(p => $"{p.Key}={p.Value}"));

            // HMAC-SHA256
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_appSecret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(str));
            return Convert.ToHexString(hash).ToUpper();
        }

        /// <summary>签名并返回所有认证参数</summary>
        public Dictionary<string, object> SignParams(Dictionary<string, object> parameters = null)
        {
            parameters ??= new Dictionary<string, object>();
            var all = new Dictionary<string, object>(parameters)
            {
                ["appKey"] = _appKey,
                ["timestamp"] = GetTimestamp(),
                ["nonce"] = GenerateNonce()
            };

            all["sign"] = Sign(all);
            all["signType"] = "HMAC-SHA256";
            return all;
        }

        // ==================== HTTP 请求 ====================

        private async Task<DgkjResponse> RequestAsync(string method, string path, Dictionary<string, object> data = null)
        {
            var signed = SignParams(data ?? new Dictionary<string, object>());
            var url = $"{_baseUrl}{path}";

            HttpContent content = null;
            if (method == "POST")
            {
                var json = JsonSerializer.Serialize(signed);
                content = new StringContent(json, Encoding.UTF8, "application/json");
            }

            var request = new HttpRequestMessage(new HttpMethod(method), url)
            {
                Content = content
            };

            request.Headers.Add("X-App-Key", _appKey);
            request.Headers.Add("X-Sign-Type", "HMAC-SHA256");
            request.Headers.Add("X-Timestamp", signed["timestamp"].ToString());
            request.Headers.Add("X-Nonce", signed["nonce"].ToString());
            request.Headers.Add("User-Agent", "dgkj-pay-sdk-csharp/1.0.0");

            var response = await _httpClient.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<DgkjResponse>(body);
        }

        // ==================== 支付接口 ====================

        /// <summary>发起支付</summary>
        public async Task<DgkjResponse> PayAsync(PayRequest request)
        {
            if (string.IsNullOrEmpty(request.PayType)) throw new ArgumentException("PayType is required");
            if (request.Amount < 1) throw new ArgumentException("Amount must be >= 1");
            if (string.IsNullOrEmpty(request.Subject)) throw new ArgumentException("Subject is required");
            if (string.IsNullOrEmpty(request.OrderNo)) throw new ArgumentException("OrderNo is required");
            if (string.IsNullOrEmpty(request.NotifyUrl)) throw new ArgumentException("NotifyUrl is required");

            var data = new Dictionary<string, object>
            {
                ["mchNo"] = _mchNo,
                ["appId"] = _appId,
                ["payType"] = request.PayType,
                ["amount"] = request.Amount,
                ["subject"] = request.Subject,
                ["orderNo"] = request.OrderNo,
                ["notifyUrl"] = request.NotifyUrl,
            };
            if (!string.IsNullOrEmpty(request.Body)) data["body"] = request.Body;
            if (!string.IsNullOrEmpty(request.ReturnUrl)) data["returnUrl"] = request.ReturnUrl;
            if (!string.IsNullOrEmpty(request.ClientIp)) data["clientIp"] = request.ClientIp;
            if (!string.IsNullOrEmpty(request.Attach)) data["attach"] = request.Attach;

            return await RequestAsync("POST", "/api/v1/pay/gateway", data);
        }

        /// <summary>Native 二维码支付</summary>
        public Task<DgkjResponse> PayNativeAsync(long amount, string subject, string orderNo, string notifyUrl)
            => PayAsync(new PayRequest { PayType = "wx_native", Amount = amount, Subject = subject, OrderNo = orderNo, NotifyUrl = notifyUrl });

        /// <summary>JSAPI 支付</summary>
        public Task<DgkjResponse> PayJsapiAsync(long amount, string subject, string orderNo, string notifyUrl, string openid)
            => PayAsync(new PayRequest { PayType = "wx_jsapi", Amount = amount, Subject = subject, OrderNo = orderNo, NotifyUrl = notifyUrl, Attach = openid });

        /// <summary>查询订单</summary>
        public Task<DgkjResponse> QueryOrderAsync(string orderNo)
            => RequestAsync("GET", $"/api/v1/query/order/{orderNo}");

        /// <summary>关闭订单</summary>
        public Task<DgkjResponse> CloseOrderAsync(string orderNo)
            => RequestAsync("POST", $"/api/v1/order/{orderNo}/close");

        // ==================== 退款接口 ====================

        /// <summary>申请退款</summary>
        public async Task<DgkjResponse> RefundAsync(string orderNo, long refundAmount, string refundReason)
        {
            if (string.IsNullOrEmpty(orderNo)) throw new ArgumentException("orderNo is required");
            if (refundAmount < 1) throw new ArgumentException("refundAmount must be >= 1");
            if (string.IsNullOrEmpty(refundReason)) throw new ArgumentException("refundReason is required");

            return await RequestAsync("POST", "/api/v1/refund/apply", new Dictionary<string, object>
            {
                ["orderNo"] = orderNo,
                ["refundAmount"] = refundAmount,
                ["refundReason"] = refundReason,
            });
        }

        /// <summary>查询退款</summary>
        public Task<DgkjResponse> QueryRefundAsync(string refundNo)
            => RequestAsync("GET", $"/api/v1/query/refund/{refundNo}");

        // ==================== 转账接口 ====================

        /// <summary>发起转账</summary>
        public async Task<DgkjResponse> TransferAsync(TransferRequest request)
        {
            if (string.IsNullOrEmpty(request.OutNo)) throw new ArgumentException("OutNo is required");
            if (request.Amount < 1) throw new ArgumentException("Amount must be >= 1");
            if (string.IsNullOrEmpty(request.AccountType)) throw new ArgumentException("AccountType is required");
            if (string.IsNullOrEmpty(request.AccountName)) throw new ArgumentException("AccountName is required");
            if (string.IsNullOrEmpty(request.AccountNo)) throw new ArgumentException("AccountNo is required");
            if (string.IsNullOrEmpty(request.BankName)) throw new ArgumentException("BankName is required");

            var data = new Dictionary<string, object>
            {
                ["outNo"] = request.OutNo,
                ["amount"] = request.Amount,
                ["accountType"] = request.AccountType,
                ["accountName"] = request.AccountName,
                ["accountNo"] = request.AccountNo,
                ["bankName"] = request.BankName,
            };
            if (!string.IsNullOrEmpty(request.Remark)) data["remark"] = request.Remark;

            return await RequestAsync("POST", "/api/v1/transfer/pay", data);
        }

        /// <summary>查询转账</summary>
        public Task<DgkjResponse> QueryTransferAsync(string transferNo)
            => RequestAsync("GET", $"/api/v1/query/transfer/{transferNo}");

        // ==================== 账户接口 ====================

        /// <summary>查询余额</summary>
        public Task<DgkjResponse> GetBalanceAsync()
            => RequestAsync("GET", "/api/v1/account/balance");

        // ==================== 回调验签 ====================

        /// <summary>验证回调签名</summary>
        public bool VerifyCallback(Dictionary<string, object> data)
        {
            if (!data.TryGetValue("sign", out var signObj) || string.IsNullOrEmpty(signObj?.ToString()))
                return false;

            var sign = data["sign"].ToString();
            data.Remove("sign");
            var expected = Sign(data);
            return string.Equals(expected, sign, StringComparison.OrdinalIgnoreCase);
        }

        public void Dispose() => _httpClient?.Dispose();
    }

    // ==================== 请求模型 ====================

    public class PayRequest
    {
        public string PayType { get; set; }
        public long Amount { get; set; }
        public string Subject { get; set; }
        public string OrderNo { get; set; }
        public string NotifyUrl { get; set; }
        public string Body { get; set; }
        public string ReturnUrl { get; set; }
        public string ClientIp { get; set; }
        public string Attach { get; set; }
    }

    public class TransferRequest
    {
        public string OutNo { get; set; }
        public long Amount { get; set; }
        public string AccountType { get; set; }
        public string AccountName { get; set; }
        public string AccountNo { get; set; }
        public string BankName { get; set; }
        public string Remark { get; set; }
    }

    // ==================== 响应模型 ====================

    public class DgkjResponse
    {
        [JsonPropertyName("code")]
        public string Code { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; }

        [JsonPropertyName("data")]
        public JsonElement? Data { get; set; }

        [JsonPropertyName("requestId")]
        public string RequestId { get; set; }

        [JsonPropertyName("timestamp")]
        public string Timestamp { get; set; }

        public bool IsSuccess() => Code == "OP0000";
    }

    // 使用示例
    /*
    // Program.cs
    using DGKJ.Pay.SDK;

    var client = new DgkjPayClient(
        appId: "APPxxx",
        appKey: "DGKJxxx",
        appSecret: "your_secret",
        mchNo: "Mxxx"
    );

    var result = await client.PayNativeAsync(
        amount: 100,
        subject: "测试商品",
        orderNo: "ORD" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        notifyUrl: "https://example.com/notify"
    );

    if (result.IsSuccess()) {
        var qrCode = result.Data.GetProperty("qrCode").GetString();
        Console.WriteLine("二维码: " + qrCode);
    }

    // ASP.NET Core 回调
    [ApiController]
    [Route("notify")]
    public class NotifyController : ControllerBase
    {
        [HttpPost]
        public IActionResult Post([FromBody] Dictionary<string, object> data)
        {
            var client = new DgkjPayClient("APPxxx", "DGKJxxx", "secret", "Mxxx");
            if (client.VerifyCallback(data) && data["status"]?.ToString() == "paid")
            {
                var orderNo = data["orderNo"]?.ToString();
                // TODO: 处理支付成功
                return Ok(new { code = "OP0000", message = "success" });
            }
            return Ok(new { code = "OP1001", message = "签名验证失败" });
        }
    }
    */
}
