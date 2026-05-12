<template>
  <div class="sys-about">
    <Card>
      <div class="about-container">
        <div class="about-header">
          <div class="logo-area">
            <div class="logo-icon">
              <svg viewBox="0 0 100 100" width="80" height="80">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1890ff;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#096dd9;stop-opacity:1" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="url(#logoGrad)" />
                <text x="50" y="58" font-size="28" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">DG</text>
              </svg>
            </div>
            <div class="app-info">
              <h1 class="app-title">DGKJ支付平台</h1>
              <p class="app-subtitle">DGKJ Payment Platform</p>
            </div>
          </div>
          <div class="version-badge">
            <Tag color="blue">v1.0.0</Tag>
            <Tag color="green">正式版</Tag>
          </div>
        </div>

        <Descriptions :column="2" bordered class="about-descriptions">
          <DescriptionsItem label="系统名称">DGKJ支付平台</DescriptionsItem>
          <DescriptionsItem label="系统版本">v1.0.0</DescriptionsItem>
          <DescriptionsItem label="构建日期">2026-05-11</DescriptionsItem>
          <DescriptionsItem label="前端框架">Vue 3 + TypeScript + Vite</DescriptionsItem>
          <DescriptionsItem label="UI组件库">Ant Design Vue</DescriptionsItem>
          <DescriptionsItem label="后端框架">Express.js + TypeORM</DescriptionsItem>
          <DescriptionsItem label="数据库">MySQL</DescriptionsItem>
          <DescriptionsItem label="运行环境">Node.js 18+</DescriptionsItem>
          <DescriptionsItem label="联系邮箱" :span="2">support@dgkjpay.com</DescriptionsItem>
          <DescriptionsItem label="官方网站" :span="2">https://www.dgkjpay.com</DescriptionsItem>
          <DescriptionsItem label="系统描述" :span="2">
            DGKJ支付平台是一套完整的聚合支付解决方案，支持微信、支付宝、银联等多种支付方式，提供商户管理、代理商管理、交易管理、财务管理、通道管理等核心功能。
          </DescriptionsItem>
        </Descriptions>

        <Divider>核心功能模块</Divider>

        <Row :gutter="[24, 24]">
          <Col :span="6" v-for="(module, idx) in modules" :key="idx">
            <Card hoverable size="small">
              <div class="module-card">
                <div class="module-icon" :style="{ background: module.color + '15', color: module.color }">
                  <component :is="module.icon" />
                </div>
                <div class="module-info">
                  <div class="module-name">{{ module.name }}</div>
                  <div class="module-desc">{{ module.desc }}</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Divider>技术架构</Divider>

        <Row :gutter="[16, 16]">
          <Col :span="8">
            <Card title="前端架构" size="small">
              <ul class="tech-list">
                <li>Vue 3 (Composition API)</li>
                <li>TypeScript</li>
                <li>Vite 5</li>
                <li>Pinia (状态管理)</li>
                <li>Vue Router 4</li>
                <li>Ant Design Vue 4</li>
                <li>Axios</li>
                <li>ECharts 5</li>
              </ul>
            </Card>
          </Col>
          <Col :span="8">
            <Card title="后端架构" size="small">
              <ul class="tech-list">
                <li>Node.js</li>
                <li>Express.js</li>
                <li>TypeORM</li>
                <li>MySQL</li>
                <li>Redis (可选)</li>
                <li>JWT (认证)</li>
                <li>Helmet (安全)</li>
                <li>Swagger (文档)</li>
              </ul>
            </Card>
          </Col>
          <Col :span="8">
            <Card title="部署架构" size="small">
              <ul class="tech-list">
                <li>Nginx (反向代理)</li>
                <li>PM2 (进程管理)</li>
                <li>Docker (可选)</li>
                <li>阿里云 OSS</li>
                <li>HTTPS (SSL)</li>
                <li>CORS (跨域)</li>
                <li>Gzip (压缩)</li>
                <li>反向代理缓存</li>
              </ul>
            </Card>
          </Col>
        </Row>

        <Divider>版权信息</Divider>
        <div class="copyright">
          <p>&copy; 2024-2026 DGKJ支付平台 版权所有</p>
          <p>本系统仅供授权用户使用，禁止未经授权的复制、分发或修改</p>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue';
import { Card, Descriptions, DescriptionsItem, Tag, Divider, Row, Col } from 'ant-design-vue';

const ShopOutlined = () => h('span', {}, '🏪');
const TeamOutlined = () => h('span', {}, '👥');
const SwapOutlined = () => h('span', {}, '💱');
const AccountBookOutlined = () => h('span', {}, '💰');
const ApiOutlined = () => h('span', {}, '🔗');
const BarChartOutlined = () => h('span', {}, '📊');
const SettingOutlined = () => h('span', {}, '⚙️');
const MonitorOutlined = () => h('span', {}, '🖥️');
const MobileOutlined = () => h('span', {}, '📱');

const modules = [
  { name: '商户管理', desc: '商户入驻审核', icon: ShopOutlined, color: '#1890ff' },
  { name: '代理商管理', desc: '代理分润结算', icon: TeamOutlined, color: '#52c41a' },
  { name: '交易管理', desc: '支付退款转账', icon: SwapOutlined, color: '#faad14' },
  { name: '财务管理', desc: '账户账务结算', icon: AccountBookOutlined, color: '#f5222d' },
  { name: '通道管理', desc: '支付通道配置', icon: ApiOutlined, color: '#722ed1' },
  { name: '数据统计', desc: '多维度数据报表', icon: BarChartOutlined, color: '#13c2c2' },
  { name: '系统管理', desc: '权限菜单配置', icon: SettingOutlined, color: '#8c8c8c' },
  { name: '运维监控', desc: '服务器服务监控', icon: MonitorOutlined, color: '#eb2f96' },
  { name: '设备配置', desc: '码牌喇叭打印', icon: MobileOutlined, color: '#fa8c16' },
];
</script>

<style scoped>
.sys-about { padding: 16px; background: #f0f2f5; }
.about-container { max-width: 1000px; margin: 0 auto; }
.about-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}
.logo-area { display: flex; align-items: center; gap: 16px; }
.app-title { font-size: 24px; font-weight: 600; color: #262626; margin: 0; }
.app-subtitle { font-size: 14px; color: #8c8c8c; margin: 4px 0 0; }
.version-badge { display: flex; gap: 8px; }
.about-descriptions { margin-bottom: 8px; }
.module-card { display: flex; align-items: center; gap: 12px; }
.module-icon { font-size: 24px; padding: 8px; border-radius: 8px; }
.module-name { font-weight: 500; color: #262626; }
.module-desc { font-size: 12px; color: #8c8c8c; margin-top: 2px; }
.tech-list { margin: 0; padding-left: 20px; }
.tech-list li { line-height: 2; color: #595959; font-size: 13px; }
.copyright { text-align: center; color: #8c8c8c; font-size: 13px; line-height: 2; }
</style>
