<template>
  <div class="open-platform-overview">
    <!-- 欢迎横幅 -->
    <div class="hero-banner">
      <div class="hero-content">
        <h1>DGKJ 开放平台</h1>
        <p>为合作伙伴提供安全、稳定、合规的支付 API 服务</p>
        <Space>
          <Button type="primary" size="large" @click="$router.push('/open-platform/developer')">
            <RocketOutlined /> 立即入驻
          </Button>
          <Button size="large" @click="$router.push('/open-platform/document')">
            <BookOutlined /> 查看文档
          </Button>
        </Space>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <span class="num">99.99%</span>
          <span class="label">服务可用性</span>
        </div>
        <div class="hero-stat">
          <span class="num">&lt;50ms</span>
          <span class="label">平均响应时间</span>
        </div>
        <div class="hero-stat">
          <span class="num">1000+</span>
          <span class="label">接入商户</span>
        </div>
        <div class="hero-stat">
          <span class="num">7×24</span>
          <span class="label">技术支持</span>
        </div>
      </div>
    </div>

    <!-- 能力展示 -->
    <Row :gutter="24" class="capability-row">
      <Col :span="6">
        <Card class="capability-card" hoverable>
          <template #cover>
            <div class="cap-icon" style="background: #e6f7ff">
              <ApiOutlined style="font-size: 32px; color: #1890ff" />
            </div>
          </template>
          <CardMeta title="聚合支付" description="支持微信、支付宝、银联、云闪付等主流支付方式，一次接入全渠道覆盖" />
        </Card>
      </Col>
      <Col :span="6">
        <Card class="capability-card" hoverable>
          <template #cover>
            <div class="cap-icon" style="background: #f6ffed">
              <SafetyCertificateOutlined style="font-size: 32px; color: #52c41a" />
            </div>
          </template>
          <CardMeta title="安全合规" description="金融级安全防护，PCI DSS合规，签名验签保障数据完整性" />
        </Card>
      </Col>
      <Col :span="6">
        <Card class="capability-card" hoverable>
          <template #cover>
            <div class="cap-icon" style="background: #fff7e6">
              <ThunderboltOutlined style="font-size: 32px; color: #fa8c16" />
            </div>
          </template>
          <CardMeta title="高并发" description="分布式架构，单集群 QPS 10万+，弹性扩缩容保障峰值性能" />
        </Card>
      </Col>
      <Col :span="6">
        <Card class="capability-card" hoverable>
          <template #cover>
            <div class="cap-icon" style="background: #f9f0ff">
              <NodeIndexOutlined style="font-size: 32px; color: #722ed1" />
            </div>
          </template>
          <CardMeta title="多语言SDK" description="提供 Java、PHP、Python、Go、Node.js、C# 等全语言 SDK" />
        </Card>
      </Col>
    </Row>

    <!-- API 列表 -->
    <Card title="开放能力" class="api-list-card">
      <template #extra>
        <Button type="link" @click="$router.push('/open-platform/document')">查看完整文档 →</Button>
      </template>
      <Row :gutter="16">
        <Col :span="8" v-for="api in apiList" :key="api.name">
          <Card size="small" class="api-item" hoverable @click="$router.push('/open-platform/document')">
            <div class="api-item-inner">
              <div class="api-method" :class="api.method.toLowerCase()">{{ api.method }}</div>
              <div class="api-info">
                <div class="api-path">{{ api.path }}</div>
                <div class="api-desc">{{ api.desc }}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Card>

    <!-- 接入流程 -->
    <Card title="快速接入" class="process-card">
      <Steps :current="0" size="small">
        <Step title="注册入驻" description="填写基本信息完成开发者注册" />
        <Step title="创建应用" description="创建应用获取 AppKey 和 AppSecret" />
        <Step title="开发调试" description="使用 SDK 和沙箱环境进行开发调试" />
        <Step title="上线审核" description="提交资料审核通过后正式接入生产环境" />
      </Steps>
    </Card>

    <!-- 支付方式 -->
    <Card title="支持的支付方式" class="paytype-card">
      <Row :gutter="16">
        <Col :span="4" v-for="pt in payTypes" :key="pt.name">
          <Card size="small" class="paytype-item" hoverable>
            <div class="paytype-icon">{{ pt.icon }}</div>
            <div class="paytype-name">{{ pt.name }}</div>
            <div class="paytype-desc">{{ pt.desc }}</div>
          </Card>
        </Col>
      </Row>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Row, Col, Card, CardMeta, Button, Space, Steps, Step } from 'ant-design-vue';
import { ApiOutlined, SafetyCertificateOutlined, ThunderboltOutlined, NodeIndexOutlined, RocketOutlined, BookOutlined } from '@ant-design/icons-vue';

const apiList = [
  { method: 'POST', path: '/api/v1/pay/gateway', desc: '发起支付' },
  { method: 'GET', path: '/api/v1/query/order/:orderNo', desc: '查询订单' },
  { method: 'POST', path: '/api/v1/order/:orderNo/close', desc: '关闭订单' },
  { method: 'POST', path: '/api/v1/refund/apply', desc: '申请退款' },
  { method: 'GET', path: '/api/v1/query/refund/:refundNo', desc: '查询退款' },
  { method: 'POST', path: '/api/v1/transfer/pay', desc: '发起转账' },
  { method: 'GET', path: '/api/v1/query/transfer/:transferNo', desc: '查询转账' },
  { method: 'GET', path: '/api/v1/account/balance', desc: '查询余额' },
];

const payTypes = [
  { icon: 'WX', name: '微信支付', desc: 'JSAPI/Native/H5' },
  { icon: 'ZFB', name: '支付宝', desc: 'JSAPI/PC网站' },
  { icon: 'YL', name: '银联云闪付', desc: 'APP/条码' },
  { icon: 'WX', name: '微信小程序', desc: 'AapPay' },
  { icon: 'YLT', name: '银行卡', desc: '快捷支付' },
  { icon: 'QT', name: '更多渠道', desc: '敬请期待' },
];
</script>

<style scoped>
.open-platform-overview {
  padding: 16px;
  background: #f0f2f5;
}
.hero-banner {
  background: linear-gradient(135deg, #001529 0%, #003a70 100%);
  border-radius: 12px;
  padding: 48px 40px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hero-content h1 {
  color: #fff;
  font-size: 32px;
  margin-bottom: 8px;
}
.hero-content p {
  color: rgba(255,255,255,0.8);
  font-size: 16px;
  margin-bottom: 24px;
}
.hero-stats {
  display: flex;
  gap: 40px;
}
.hero-stat {
  text-align: center;
}
.hero-stat .num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1890ff;
}
.hero-stat .label {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
}
.capability-row {
  margin-bottom: 24px;
}
.cap-icon {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.capability-card :deep(.ant-card-body) {
  text-align: center;
}
.capability-card :deep(.ant-card-meta-description) {
  font-size: 12px;
  color: #666;
}
.api-list-card {
  margin-bottom: 24px;
}
.api-item {
  margin-bottom: 8px;
}
.api-item-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}
.api-method {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  min-width: 50px;
  text-align: center;
}
.api-method.post { background: #fff7e6; color: #fa8c16; }
.api-method.get { background: #e6f7ff; color: #1890ff; }
.api-method.put { background: #f6ffed; color: #52c41a; }
.api-method.delete { background: #fff2f0; color: #f5222d; }
.api-path {
  font-family: monospace;
  font-size: 13px;
  color: #333;
}
.api-desc {
  font-size: 11px;
  color: #999;
}
.process-card, .paytype-card {
  margin-bottom: 24px;
}
.paytype-item {
  text-align: center;
  padding: 8px;
}
.paytype-icon {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #1890ff;
}
.paytype-name {
  font-weight: 600;
  margin-bottom: 4px;
}
.paytype-desc {
  font-size: 11px;
  color: #999;
}
</style>
