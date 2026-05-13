<template>
  <div class="sms-config">
    <Form
      ref="formRef"
      :model="formState"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 16 }"
    >
      <FormItem label="服务商">
        <Select v-model:value="formState.provider" style="width: 200px" @change="handleProviderChange">
          <SelectOption value="aliyun">阿里云短信</SelectOption>
          <SelectOption value="tencent">腾讯云短信</SelectOption>
          <SelectOption value="mock">模拟模式(开发环境)</SelectOption>
        </Select>
      </FormItem>

      <FormItem label="启用状态">
        <Switch v-model:checked="formState.enabled" />
      </FormItem>

      <template v-if="formState.provider !== 'mock'">
        <FormItem label="AppKey/ID" name="accessKeyId">
          <Input v-model:value="formState.accessKeyId" placeholder="AppKey或AppID" />
        </FormItem>

        <FormItem label="AppSecret" name="accessKeySecret">
          <InputPassword v-model:value="formState.accessKeySecret" placeholder="AppSecret或AppKey" />
        </FormItem>
      </template>

      <FormItem label="短信签名" name="signName">
        <Input v-model:value="formState.signName" placeholder="如: DGKJ支付" />
      </FormItem>

      <FormItem label="模板ID" name="templateCode">
        <Input v-model:value="formState.templateCode" placeholder="短信模板ID" />
      </FormItem>

      <FormItem label="测试手机号">
        <Space>
          <Input v-model:value="testPhone" placeholder="输入测试手机号" style="width: 200px" />
          <Button type="primary" ghost :loading="testing" @click="handleTest">
            发送测试短信
          </Button>
        </Space>
      </FormItem>

      <FormItem :wrapper-col="{ offset: 4 }">
        <Space>
          <Button type="primary" :loading="saving" @click="handleSave">保存配置</Button>
          <Button @click="handleReset">重置</Button>
        </Space>
      </FormItem>
    </Form>

    <Divider>服务商配置说明</Divider>

    <Alert type="info" show-icon>
      <template #message>
        <strong>阿里云短信</strong>
      </template>
      <template #description>
        需要在阿里云短信服务申请AccessKey，配置签名和模板，获取模板CODE后填入。
      </template>
    </Alert>

    <Alert type="info" show-icon style="margin-top: 12px">
      <template #message>
        <strong>腾讯云短信</strong>
      </template>
      <template #description>
        需要在腾讯云短信服务申请SecretId/SecretKey，配置签名和模板ID。
      </template>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import {
  Form,
  FormItem,
  Input,
  InputPassword,
  Select,
  SelectOption,
  Switch,
  Button,
  Space,
  Divider,
  Alert,
} from 'ant-design-vue';
import { getSmsConfig, saveSmsConfig, testSms } from '@/api/sys/notify';

const formRef = ref<FormInstance>();
const saving = ref(false);
const testing = ref(false);
const testPhone = ref('');

const formState = reactive({
  provider: 'mock',
  accessKeyId: '',
  accessKeySecret: '',
  signName: 'DGKJ支付',
  templateCode: '',
  enabled: false,
});

const originalData = ref<any>({});

onMounted(async () => {
  try {
    const res = await getSmsConfig();
    if (res?.data) {
      Object.assign(formState, res.data);
      originalData.value = { ...res.data };
    }
  } catch (e) {
    console.error('加载短信配置失败', e);
  }
});

const handleProviderChange = () => {
  // 切换服务商时清空密钥
  if (formState.provider === 'mock') {
    formState.accessKeyId = '';
    formState.accessKeySecret = '';
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    await saveSmsConfig(formState);
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

const handleTest = async () => {
  if (!testPhone.value) {
    message.warning('请输入测试手机号');
    return;
  }
  testing.value = true;
  try {
    const res = await testSms({ phone: testPhone.value });
    if (res?.code === 0) {
      message.success('测试短信发送成功');
    } else {
      message.error(res?.message || '发送失败');
    }
  } catch (e) {
    message.error('发送失败');
  } finally {
    testing.value = false;
  }
};
</script>

<style scoped>
.sms-config {
  max-width: 800px;
  padding: 20px 0;
}
</style>
