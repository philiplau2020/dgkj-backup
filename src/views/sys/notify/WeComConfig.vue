<template>
  <div class="wecom-config">
    <Form
      ref="formRef"
      :model="formState"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 16 }"
    >
      <FormItem label="启用状态">
        <Switch v-model:checked="formState.enabled" />
      </FormItem>

      <FormItem label="企业ID" name="corpId">
        <Input v-model:value="formState.corpId" placeholder="企业微信的企业ID" />
      </FormItem>

      <FormItem label="应用Secret" name="corpSecret">
        <InputPassword v-model:value="formState.corpSecret" placeholder="企业微信应用的Secret" />
      </FormItem>

      <FormItem label="应用AgentId" name="agentId">
        <Input v-model:value="formState.agentId" placeholder="企业微信应用的AgentId" />
      </FormItem>

      <FormItem label="使用说明">
        <Alert type="info" show-icon>
          <template #message>配置步骤</template>
          <template #description>
            <ol style="margin: 0; padding-left: 20px; line-height: 2;">
              <li>在企业微信管理后台创建自建应用</li>
              <li>获取企业的CorpId和应用的AgentId、Secret</li>
              <li>配置应用的可信IP（服务器出口IP）</li>
              <li>给应用开通"消息推送"权限</li>
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
import { getWeComConfig, saveWeComConfig, testWeCom } from '@/api/sys/notify';

const formRef = ref<FormInstance>();
const saving = ref(false);
const testing = ref(false);

const formState = reactive({
  enabled: false,
  corpId: '',
  corpSecret: '',
  agentId: '',
});

const originalData = ref<any>({});

onMounted(async () => {
  try {
    const res = await getWeComConfig();
    if (res?.data) {
      Object.assign(formState, res.data);
      originalData.value = { ...res.data };
    }
  } catch (e) {
    console.error('加载企业微信配置失败', e);
  }
});

const handleSave = async () => {
  saving.value = true;
  try {
    await saveWeComConfig(formState);
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
    const res = await testWeCom();
    if (res?.success) {
      message.success('测试消息发送成功，请检查企业微信');
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
.wecom-config {
  max-width: 800px;
  padding: 20px 0;
}
</style>
