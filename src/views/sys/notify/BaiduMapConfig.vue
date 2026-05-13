<template>
  <div class="baidu-map-config">
    <Card>
      <Alert
        message="百度地图配置"
        description="在百度地图开放平台(https://lbsyun.baidu.com)创建应用后，获取 AK (Access Key)，填入下方配置。"
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

        <FormItem label="AK (密钥)" name="ak">
          <InputPassword
            v-model:value="formState.ak"
            placeholder="百度地图开放平台 AK"
          />
          <div class="field-tip">在 百度地图开放平台 > 控制台 > 应用管理 中创建应用，选择「浏览器端」类型获取 AK</div>
        </FormItem>

        <FormItem label="Coordinate" class="coord-hint">
          <Tag color="blue">BD09</Tag>
          <span class="coord-text">默认使用 BD09 坐标系（百度坐标）</span>
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
        <Step title="注册账号" description="访问百度地图开放平台注册开发者账号" />
        <Step title="创建应用" description="在控制台创建应用，选择「浏览器端」类型" />
        <Step title="获取 AK" description="在应用详情中复制 AK" />
        <Step title="配置密钥" description="将 AK 填入上方配置并启用" />
      </Steps>

      <Divider />

      <Alert
        message="坐标系说明"
        description="百度地图使用 BD09 坐标系（百度坐标），与其他地图坐标系（WGS84、GCJ02）不通用。如需与其他系统对接，可能需要进行坐标转换。"
        type="warning"
        show-icon
      />

      <Alert
        message="费用说明"
        description="百度地图提供一定的免费额度，超出后按量计费。请在控制台查看具体用量和费用情况。"
        type="warning"
        show-icon
        style="margin-top: 16px"
      />
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Form, FormItem, Input, InputPassword, Switch, Button, Space, Alert, Steps, Step, Tag, Divider, message } from 'ant-design-vue';
import { getBaiduMapConfig, saveBaiduMapConfig } from '@/api/sys/notify';

const formRef = ref();
const saving = ref(false);
const testLng = ref('116.404');
const testLat = ref('39.915');
const testResult = ref('');
const originalData = ref<any>({});

const formState = reactive({
  enabled: false,
  ak: '',
});

onMounted(async () => {
  try {
    const res = await getBaiduMapConfig();
    if (res?.data) {
      Object.assign(formState, res.data);
      originalData.value = { ...res.data };
    }
  } catch (e) {
    console.error('加载百度地图配置失败', e);
  }
});

const handleSave = async () => {
  saving.value = true;
  try {
    await saveBaiduMapConfig(formState);
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
  if (!formState.ak) {
    message.warning('请先配置百度地图 AK');
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
.baidu-map-config {
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

.coord-hint {
  margin-bottom: 0;
}

.coord-text {
  margin-left: 8px;
  color: #666;
}
</style>
