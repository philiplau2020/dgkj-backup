<template>
  <div class="dingtalk-config">
    <Form
      ref="formRef"
      :model="formState"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 16 }"
    >
      <FormItem label="启用状态">
        <Switch v-model:checked="formState.enabled" />
      </FormItem>

      <FormItem label="Webhook地址" name="webhook">
        <Input
          v-model:value="formState.webhook"
          placeholder="钉钉群机器人的Webhook地址"
        />
      </FormItem>

      <FormItem label="加签密钥" name="secret">
        <InputPassword
          v-model:value="formState.secret"
          placeholder="可选，加签机器人密钥"
        />
      </FormItem>

      <FormItem label="使用说明">
        <Alert type="info" show-icon>
          <template #message>配置步骤</template>
          <template #description>
            <ol style="margin: 0; padding-left: 20px; line-height: 2;">
              <li>在钉钉群中添加"自定义机器人"</li>
              <li>复制机器人 Webhook 地址填入上方</li>
              <li>如启用加签安全，填写机器人密钥</li>
            </ol>
          </template>
        </Alert>
      </FormItem>

      <FormItem :wrapper-col="{ offset: 4 }">
        <Space>
          <Button type="primary" :loading="saving" @click="handleSave">保存配置</Button>
          <Button type="primary" ghost :loading="testing" @click="handleTest">
            发送测试消息
          </Button>
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
  Switch,
  Button,
  Space,
  Alert,
} from 'ant-design-vue';
import { getDingTalkConfig, saveDingTalkConfig, testDingTalk } from '@/api/sys/notify';

const formRef = ref<FormInstance>();
const saving = ref(false);
const testing = ref(false);

const formState = reactive({
  enabled: false,
  webhook: '',
  secret: '',
});

const originalData = ref<any>({});

onMounted(async () => {
  try {
    const res = await getDingTalkConfig();
    if (res?.data) {
      Object.assign(formState, res.data);
      originalData.value = { ...res.data };
    }
  } catch (e) {
    console.error('加载钉钉配置失败', e);
  }
});

const handleSave = async () => {
  saving.value = true;
  try {
    await saveDingTalkConfig(formState);
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
  testing.value = true;
  try {
    const res = await testDingTalk();
    if (res?.success) {
      message.success('测试消息发送成功，请检查钉钉群');
    } else {
      message.error(res?.errorMsg || '发送失败');
    }
  } catch (e) {
    message.error('发送失败');
  } finally {
    testing.value = false;
  }
};
</script>

<style scoped>
.dingtalk-config {
  max-width: 800px;
  padding: 20px 0;
}
</style>
