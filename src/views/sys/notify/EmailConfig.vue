<template>
  <div class="email-config">
    <Form
      ref="formRef"
      :model="formState"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 16 }"
    >
      <FormItem label="启用状态">
        <Switch v-model:checked="formState.enabled" />
      </FormItem>

      <FormItem label="SMTP服务器" name="host">
        <Input v-model:value="formState.host" placeholder="如: smtp.qq.com" />
      </FormItem>

      <FormItem label="端口号" name="port">
        <InputNumber v-model:value="formState.port" :min="1" :max="65535" style="width: 200px" />
        <span class="port-hint">常用端口: 25(SMTP), 465(SSL), 587(TLS)</span>
      </FormItem>

      <FormItem label="加密方式">
        <RadioGroup v-model:value="formState.secure">
          <Radio :value="false">无加密</Radio>
          <Radio :value="true">SSL/TLS</Radio>
        </RadioGroup>
      </FormItem>

      <FormItem label="用户名" name="user">
        <Input v-model:value="formState.user" placeholder="发件人邮箱" />
      </FormItem>

      <FormItem label="密码/授权码" name="pass">
        <InputPassword v-model:value="formState.pass" placeholder="邮箱授权码或密码" />
      </FormItem>

      <FormItem label="发件人地址" name="from">
        <Input v-model:value="formState.from" placeholder="如: noreply@example.com" />
      </FormItem>

      <FormItem label="发件人昵称" name="fromName">
        <Input v-model:value="formState.fromName" placeholder="如: DGKJ支付平台" />
      </FormItem>

      <FormItem label="测试收件人">
        <Space>
          <Input v-model:value="testEmail" placeholder="输入测试邮箱地址" style="width: 250px" />
          <Button type="primary" ghost :loading="testing" @click="handleTest">
            发送测试邮件
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
  InputNumber,
  Switch,
  Radio,
  RadioGroup,
  Button,
  Space,
} from 'ant-design-vue';
import { getEmailConfig, saveEmailConfig, testEmail as testEmailApi } from '@/api/sys/notify';

const formRef = ref<FormInstance>();
const saving = ref(false);
const testing = ref(false);
const testEmail = ref('');

const formState = reactive({
  enabled: false,
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  user: '',
  pass: '',
  from: '',
  fromName: 'DGKJ支付平台',
});

const originalData = ref<any>({});

onMounted(async () => {
  try {
    const res = await getEmailConfig();
    if (res?.data) {
      Object.assign(formState, res.data);
      originalData.value = { ...res.data };
    }
  } catch (e) {
    console.error('加载邮件配置失败', e);
  }
});

const handleSave = async () => {
  saving.value = true;
  try {
    await saveEmailConfig(formState);
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
  if (!testEmail.value) {
    message.warning('请输入测试收件人邮箱');
    return;
  }
  testing.value = true;
  try {
    const res = await testEmailApi({ to: testEmail.value });
    if (res?.code === 0) {
      message.success('测试邮件发送成功，请查收');
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
.email-config {
  max-width: 800px;
  padding: 20px 0;
}
.port-hint {
  margin-left: 12px;
  color: #999;
  font-size: 12px;
}
</style>
