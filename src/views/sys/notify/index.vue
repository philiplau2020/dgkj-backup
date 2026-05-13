<template>
  <div class="notify-container">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="email" tab="邮件配置">
          <EmailConfig />
        </TabPane>
        <TabPane key="sms" tab="短信配置">
          <SmsConfig />
        </TabPane>
        <TabPane key="aliyun" tab="阿里云短信">
          <AliyunSmsConfig />
        </TabPane>
        <TabPane key="dingtalk" tab="钉钉配置">
          <DingTalkConfig />
        </TabPane>
        <TabPane key="wecom" tab="企业微信配置">
          <WeComConfig />
        </TabPane>
        <TabPane key="amap" tab="高德地图">
          <AmapConfig />
        </TabPane>
        <TabPane key="baidu" tab="百度地图">
          <BaiduMapConfig />
        </TabPane>
        <TabPane key="template" tab="模板管理">
          <TemplateManage />
        </TabPane>
        <TabPane key="records" tab="发送记录">
          <SendRecords />
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Card, Tabs, TabPane } from 'ant-design-vue';
import EmailConfig from './EmailConfig.vue';
import SmsConfig from './SmsConfig.vue';
import AliyunSmsConfig from './AliyunSmsConfig.vue';
import DingTalkConfig from './DingTalkConfig.vue';
import WeComConfig from './WeComConfig.vue';
import AmapConfig from './AmapConfig.vue';
import BaiduMapConfig from './BaiduMapConfig.vue';
import TemplateManage from './TemplateManage.vue';
import SendRecords from './SendRecords.vue';

const activeTab = ref('email');
</script>

<style scoped>
.notify-container {
  padding: 16px;
}
</style>
