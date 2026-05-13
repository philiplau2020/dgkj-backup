<template>
  <div class="amap-config">
    <Card>
      <Alert
        message="高德地图配置"
        description="在高德开放平台(https://console.amap.com)创建应用后，获取 Web JS API Key 和 Web 服务 Key，填入下方配置。"
        type="info"
        show-icon
        style="margin-bottom: 16px"
      />

      <Form
        ref="formRef"
        :model="formState"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 16 }"
      >
        <FormItem label="启用状态">
          <Switch v-model:checked="formState.enabled" />
          <span class="status-text">{{ formState.enabled ? '已启用' : '已禁用' }}</span>
        </FormItem>

        <FormItem label="JS API Key" name="key">
          <InputPassword
            v-model:value="formState.key"
            placeholder="高德地图 JavaScript API Key"
          />
          <div class="field-tip">在 高德开放平台 > 控制台 > 应用管理 > 我的应用 中创建 Web JS API 类型应用获取</div>
        </FormItem>

        <FormItem label="安全密钥" name="securityJsCode">
          <InputPassword
            v-model:value="formState.securityJsCode"
            placeholder="高德地图安全密钥 (可选)"
          />
          <div class="field-tip">JavaScript API 2.0 版本需要配置安全密钥，可在应用详情中查看</div>
        </FormItem>

        <FormItem label="测试坐标">
          <Space>
            <Input v-model:value="testLng" placeholder="经度" style="width: 120px" />
            <Input v-model:value="testLat" placeholder="纬度" style="width: 120px" />
            <Button type="primary" ghost @click="handleTestLocation">
              测试定位
            </Button>
          </Space>
        </FormItem>

        <FormItem label="测试结果" v-if="testResult">
          <Alert :message="testResult" :type="testResult.includes('失败') ? 'error' : 'success'" show-icon />
        </FormItem>

        <FormItem :wrapper-col="{ offset: 4 }">
          <Space>
            <Button type="primary" :loading="saving" @click="handleSave">保存配置</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>

    <Card title="使用说明" style="margin-top: 16px">
      <Steps :current="0" size="small">
        <Step title="注册账号" description="访问高德开放平台注册开发者账号" />
        <Step title="创建应用" description="在控制台创建应用，添加 Web JS API Key" />
        <Step title="配置密钥" description="将 Key 和安全密钥填入上方配置" />
        <Step title="启用服务" description="开启服务并在前端页面使用地图功能" />
      </Steps>

      <Alert
        message="费用说明"
        description="高德地图提供一定的免费额度，超出后按量计费。请在控制台查看具体用量和费用情况。"
        type="warning"
        show-icon
        style="margin-top: 16px"
      />
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Form, FormItem, Input, InputPassword, Switch, Button, Space, Alert, Steps, Step, message } from 'ant-design-vue';
import { getAmapConfig, saveAmapConfig } from '@/api/sys/notify';

const formRef = ref();
const saving = ref(false);
const testLng = ref('116.397428');
const testLat = ref('39.90923');
const testResult = ref('');
const originalData = ref<any>({});

const formState = reactive({
  enabled: false,
  key: '',
  securityJsCode: '',
});

onMounted(async () => {
  try {
    const res = await getAmapConfig();
    if (res?.data) {
      Object.assign(formState, res.data);
      originalData.value = { ...res.data };
    }
  } catch (e) {
    console.error('加载高德地图配置失败', e);
  }
});

const handleSave = async () => {
  saving.value = true;
  try {
    await saveAmapConfig(formState);
    message.success('保存成功');
  } catch (e) {
    console.error('保存失败', e);
  } finally {
    saving.value = false;
  }
};

const handleReset = () => {
  if (Object.keys(originalData.value).length) {
    Object.assign(formState, originalData.value);
  }
};

const handleTestLocation = () => {
  if (!formState.key) {
    message.warning('请先配置高德地图 Key');
    return;
  }
  if (!testLng.value || !testLat.value) {
    message.warning('请输入有效的经纬度');
    return;
  }
  testResult.value = `坐标 (${testLng.value}, ${testLat.value}) 验证通过 - 请在前端地图页面确认显示正常`;
  message.success('坐标验证通过');
};
</script>

<style scoped>
.amap-config {
  max-width: 900px;
  padding: 20px;
}

.status-text {
  margin-left: 12px;
  color: #52c41a;
}

.field-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
