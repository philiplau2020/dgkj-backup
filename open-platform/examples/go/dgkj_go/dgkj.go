/**
 * DGKJ Open Platform SDK - Go
 *
 * @example
 * go get github.com/dgkj/dgkj-pay-go
 *
 * @example
 * ```go
 * package main
 *
 * import (
 *     "fmt"
 *     dgkj "github.com/dgkj/dgkj-pay-go"
 * )
 *
 * func main() {
 *     client := dgkj.NewClient("APPxxx", "DGKJxxx", "your_secret", "Mxxx")
 *
 *     resp, err := client.Pay(dgkj.PayParams{
 *         PayType:   "wx_native",
 *         Amount:    100,
 *         Subject:   "测试商品",
 *         OrderNo:   "ORD" + strconv.FormatInt(time.Now().UnixMilli(), 10),
 *         NotifyUrl: "https://example.com/notify",
 *     })
 *     if err != nil { panic(err) }
 *     fmt.Println(resp.Data.QrCode)
 * }
 * ```
 */
package dgkj

import (
    "bytes"
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
    "sort"
    "strings"
    "time"
)

const (
    BaseURL = "https://api.dgkjpay.com"
    Version = "1.0.0"
)

// ==================== 响应结构 ====================

type Response struct {
    Code      string          `json:"code"`
    Message   string          `json:"message"`
    Data      json.RawMessage `json:"data"`
    RequestId string          `json:"requestId"`
    Timestamp string          `json:"timestamp"`
}

func (r *Response) IsSuccess() bool {
    return r.Code == "OP0000"
}

func (r *Response) GetData(v interface{}) error {
    return json.Unmarshal(r.Data, v)
}

// ==================== 客户端 ====================

type Client struct {
    AppId     string
    AppKey    string
    AppSecret string
    MchNo     string
    BaseURL   string
    Timeout   int
    httpClient *http.Client
}

type ClientOption func(*Client)

func WithBaseURL(baseURL string) ClientOption {
    return func(c *Client) { c.BaseURL = baseURL }
}

func WithTimeout(timeout int) ClientOption {
    return func(c *Client) { c.Timeout = timeout }
}

func NewClient(appId, appKey, appSecret, mchNo string, opts ...ClientOption) *Client {
    c := &Client{
        AppId:     appId,
        AppKey:    appKey,
        AppSecret: appSecret,
        MchNo:     mchNo,
        BaseURL:   BaseURL,
        Timeout:   30,
        httpClient: &http.Client{
            Timeout: 30 * time.Second,
        },
    }
    for _, opt := range opts {
        opt(c)
    }
    return c
}

// ==================== 签名 ====================

func (c *Client) getTimestamp() string {
    return time.Now().Format("20060102150405")
}

func (c *Client) generateNonce() string {
    b := make([]byte, 16)
    for i := range b {
        b[i] = byte(randomInt(0, 61))
    }
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    result := make([]byte, 32)
    for i := range result {
        result[i] = chars[b[i]%61]
    }
    return string(result)
}

func randomInt(min, max int) int {
    return min + int(time.Now().UnixNano()%int64(max-min+1))
}

func (c *Client) sign(params map[string]interface{}) string {
    // 过滤空值和 sign
    filtered := make(map[string]interface{})
    for k, v := range params {
        if v != nil && v != "" && k != "sign" {
            if s, ok := v.(string); ok && s == "" {
                continue
            }
            filtered[k] = v
        }
    }

    // 字典序排序
    keys := make([]string, 0, len(filtered))
    for k := range filtered {
        keys = append(keys, k)
    }
    sort.Strings(keys)

    // 拼接
    var parts []string
    for _, k := range keys {
        parts = append(parts, fmt.Sprintf("%s=%v", k, filtered[k]))
    }
    strToSign := strings.Join(parts, "&")

    // HMAC-SHA256
    mac := hmac.New(sha256.New, []byte(c.AppSecret))
    mac.Write([]byte(strToSign))
    return strings.ToUpper(hex.EncodeToString(mac.Sum(nil)))
}

func (c *Client) signParams(params map[string]interface{}) map[string]interface{} {
    all := make(map[string]interface{})
    for k, v := range params {
        all[k] = v
    }
    all["appKey"] = c.AppKey
    all["timestamp"] = c.getTimestamp()
    all["nonce"] = c.generateNonce()
    all["sign"] = c.sign(all)
    all["signType"] = "HMAC-SHA256"
    return all
}

// ==================== HTTP 请求 ====================

func (c *Client) request(method, path string, data map[string]interface{}) (*Response, error) {
    fullURL := c.BaseURL + path
    signed := c.signParams(data)

    var body io.Reader
    if method == "POST" || method == "PUT" {
        jsonData, _ := json.Marshal(signed)
        body = bytes.NewBuffer(jsonData)
    } else {
        // GET: 将 signed 参数作为 query string
        q := url.Values{}
        for k, v := range signed {
            q.Set(k, fmt.Sprintf("%v", v))
        }
        fullURL += "?" + q.Encode()
    }

    req, err := http.NewRequest(method, fullURL, body)
    if err != nil {
        return nil, err
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("X-App-Key", c.AppKey)
    req.Header.Set("X-Sign-Type", "HMAC-SHA256")
    req.Header.Set("X-Timestamp", signed["timestamp"].(string))
    req.Header.Set("X-Nonce", signed["nonce"].(string))
    req.Header.Set("User-Agent", "dgkj-pay-sdk-go/"+Version)

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    respBody, _ := io.ReadAll(resp.Body)
    var result Response
    if err := json.Unmarshal(respBody, &result); err != nil {
        return nil, err
    }

    return &result, nil
}

// ==================== 支付接口 ====================

type PayParams struct {
    PayType   string
    Amount    int64
    Subject   string
    OrderNo   string
    NotifyUrl string
    Body      string
    ReturnUrl string
    ClientIp  string
    Attach    string
}

type PayData struct {
    OrderNo   string `json:"orderNo"`
    PayUrl    string `json:"payUrl"`
    QrCode    string `json:"qrCode"`
    Deeplink  string `json:"deeplink"`
    Amount    int64  `json:"amount"`
    Status    string `json:"status"`
    ExpireTime string `json:"expireTime"`
}

func (c *Client) Pay(params PayParams) (*Response, error) {
    if params.PayType == "" { return nil, fmt.Errorf("PayType is required") }
    if params.Amount < 1 { return nil, fmt.Errorf("Amount must be >= 1") }
    if params.Subject == "" { return nil, fmt.Errorf("Subject is required") }
    if params.OrderNo == "" { return nil, fmt.Errorf("OrderNo is required") }
    if params.NotifyUrl == "" { return nil, fmt.Errorf("NotifyUrl is required") }

    data := map[string]interface{}{
        "mchNo":     c.MchNo,
        "appId":     c.AppId,
        "payType":   params.PayType,
        "amount":    params.Amount,
        "subject":   params.Subject,
        "orderNo":   params.OrderNo,
        "notifyUrl": params.NotifyUrl,
    }
    if params.Body != "" { data["body"] = params.Body }
    if params.ReturnUrl != "" { data["returnUrl"] = params.ReturnUrl }
    if params.ClientIp != "" { data["clientIp"] = params.ClientIp }
    if params.Attach != "" { data["attach"] = params.Attach }

    return c.request("POST", "/api/v1/pay/gateway", data)
}

func (c *Client) PayNative(amount int64, subject, orderNo, notifyUrl string) (*Response, error) {
    return c.Pay(PayParams{
        PayType:   "wx_native",
        Amount:    amount,
        Subject:   subject,
        OrderNo:   orderNo,
        NotifyUrl: notifyUrl,
    })
}

func (c *Client) PayJsapi(amount int64, subject, orderNo, notifyUrl, openid string) (*Response, error) {
    return c.Pay(PayParams{
        PayType:   "wx_jsapi",
        Amount:    amount,
        Subject:   subject,
        OrderNo:   orderNo,
        NotifyUrl: notifyUrl,
        Attach:    openid,
    })
}

func (c *Client) PayAlipayQr(amount int64, subject, orderNo, notifyUrl string) (*Response, error) {
    return c.Pay(PayParams{
        PayType:   "alipay_qr",
        Amount:    amount,
        Subject:   subject,
        OrderNo:   orderNo,
        NotifyUrl: notifyUrl,
    })
}

func (c *Client) QueryOrder(orderNo string) (*Response, error) {
    return c.request("GET", fmt.Sprintf("/api/v1/query/order/%s", orderNo), nil)
}

func (c *Client) CloseOrder(orderNo string) (*Response, error) {
    return c.request("POST", fmt.Sprintf("/api/v1/order/%s/close", orderNo), nil)
}

// ==================== 退款接口 ====================

func (c *Client) Refund(orderNo string, refundAmount int64, refundReason string) (*Response, error) {
    return c.request("POST", "/api/v1/refund/apply", map[string]interface{}{
        "orderNo":       orderNo,
        "refundAmount":  refundAmount,
        "refundReason": refundReason,
    })
}

func (c *Client) QueryRefund(refundNo string) (*Response, error) {
    return c.request("GET", fmt.Sprintf("/api/v1/query/refund/%s", refundNo), nil)
}

// ==================== 转账接口 ====================

func (c *Client) Transfer(params struct {
    OutNo       string
    Amount      int64
    AccountType string
    AccountName string
    AccountNo   string
    BankName    string
    Remark      string
}) (*Response, error) {
    data := map[string]interface{}{
        "outNo":        params.OutNo,
        "amount":       params.Amount,
        "accountType":  params.AccountType,
        "accountName":  params.AccountName,
        "accountNo":    params.AccountNo,
        "bankName":     params.BankName,
    }
    if params.Remark != "" { data["remark"] = params.Remark }
    return c.request("POST", "/api/v1/transfer/pay", data)
}

func (c *Client) QueryTransfer(transferNo string) (*Response, error) {
    return c.request("GET", fmt.Sprintf("/api/v1/query/transfer/%s", transferNo), nil)
}

// ==================== 账户接口 ====================

func (c *Client) GetBalance() (*Response, error) {
    return c.request("GET", "/api/v1/account/balance", map[string]interface{}{"mchNo": c.MchNo})
}

// ==================== 回调验签 ====================

func (c *Client) VerifyCallback(data map[string]interface{}) bool {
    sign, ok := data["sign"].(string)
    if !ok || sign == "" {
        return false
    }
    params := make(map[string]interface{})
    for k, v := range data {
        if k != "sign" {
            params[k] = v
        }
    }
    expected := c.sign(params)
    return hmac.Equal([]byte(expected), []byte(strings.ToUpper(sign)))
}

// 使用示例
/*
package main

import (
    "fmt"
    "time"
    dgkj "github.com/dgkj/dgkj-pay-go"
)

func main() {
    client := dgkj.NewClient(
        "APPxxx",
        "DGKJxxx",
        "your_secret",
        "Mxxx",
    )

    resp, err := client.PayNative(
        100,
        "测试商品",
        "ORD"+strconv.FormatInt(time.Now().UnixMilli(), 10),
        "https://example.com/notify",
    )
    if err != nil { panic(err) }
    if resp.IsSuccess() {
        var data dgkj.PayData
        resp.GetData(&data)
        fmt.Println("订单号:", data.OrderNo)
        fmt.Println("二维码:", data.QrCode)
    }

    // Gin 回调处理
    // router.POST("/notify", func(c *gin.Context) {
    //     var data map[string]interface{}
    //     c.ShouldBindJSON(&data)
    //     if client.VerifyCallback(data) && data["status"] == "paid" {
    //         c.JSON(200, gin.H{"code": "OP0000", "message": "success"})
    //     } else {
    //         c.JSON(200, gin.H{"code": "OP1001", "message": "签名验证失败"})
    //     }
    // })
}
*/
