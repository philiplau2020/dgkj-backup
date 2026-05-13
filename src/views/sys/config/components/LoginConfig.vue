<template>
  <div class="login-config">
    <Form :model="form" :label-col="{ span: 4 }" :wrapper-col="{ span: 16 }" ref="formRef">
      <FormItem label="登录页标题">
        <Input v-model:value="form.loginTitle" placeholder="请输入登录页标题" />
      </FormItem>
      <FormItem label="登录页副标题">
        <Input v-model:value="form.loginSubtitle" placeholder="请输入登录页副标题" />
      </FormItem>
      <FormItem label="登录页主题">
        <RadioGroup v-model:value="form.loginTheme">
          <Radio value="light">亮色主题</Radio>
          <Radio value="dark">暗色主题</Radio>
          <Radio value="gradient">渐变主题</Radio>
        </RadioGroup>
      </FormItem>
      <FormItem label="登录页背景">
        <Input v-model:value="form.loginBackground" placeholder="背景图片URL" />
        <div class="form-hint">支持本地路径（如 /assets/bg.png）或完整URL</div>
        <div class="preview-box" v-if="form.loginBackground">
          <img :src="form.loginBackground" alt="背景预览" class="bg-preview" />
        </div>
      </FormItem>
      <FormItem label="允许注册">
        <Switch v-model:checked="form.allowRegister" />
      </FormItem>
      <FormItem label="启用验证码">
        <Switch v-model:checked="form.enableCaptcha" />
      </FormItem>
      <FormItem label="登录超时">
        <InputNumber v-model:value="form.loginTimeout" :min="5" :max="120" style="width: 200px" />
        <span style="margin-left: 8px">分钟</span>
      </FormItem>
      <FormItem label="显示版权">
        <Switch v-model:checked="form.showCopyright" />
      </FormItem>
      <FormItem label="版权信息">
        <Input v-model:value="form.copyright" placeholder="请输入版权信息" />
      </FormItem>
      <FormItem label="备案号">
        <Input v-model:value="form.recordNumber" placeholder="请输入备案号" />
      </FormItem>
      <FormItem :wrapper-col="{ span: 16, offset: 4 }">
        <Space>
          <Button type="primary" @click="handleSave" :loading="loading">保存配置</Button>
          <Button @click="handleReset">重置</Button>
          <Button @click="handlePreview">预览登录页</Button>
        </Space>
      </FormItem>
    </Form>

    <Modal v-model:open="previewVisible" title="登录页预览" width="800px" :footer="null">
      <div class="login-preview">
        <div class="preview-header">
          <img :src="form.loginLogo || '/assets/logo.png'" class="preview-logo" />
          <span class="preview-title">{{ form.loginTitle || 'DGKJ支付平台' }}</span>
        </div>
        <div class="preview-content">
          <div class="preview-form">
            <div class="preview-form-title">{{ form.loginTitle }}</div>
            <Input placeholder="用户名" style="margin-bottom: 12px" />
            <InputPassword placeholder="密码" style="margin-bottom: 12px" />
            <Button type="primary" block>登录</Button>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Form, FormItem, Input, InputNumber, Switch, Radio, RadioGroup, Button, Space, message, Modal } from 'ant-design-vue';

const loading = ref(false);
const previewVisible = ref(false);
const formRef = ref();

const form = reactive({
  loginTitle: 'DGKJ支付平台',
  loginSubtitle: '安全、便捷、高效的支付解决方案',
  loginTheme: 'gradient',
  loginBackground: '/assets/login-bg.svg',
  loginLogo: '',
  allowRegister: false,
  enableCaptcha: false,
  loginTimeout: 30,
  showCopyright: true,
  copyright: 'Copyright © 2024 DGKJ. All Rights Reserved.',
  recordNumber: '',
});

// 加载配置
async function loadConfig() {
  try {
    const res = await fetch('/api/public/config');
    const data = await res.json();
    if (data.data) {
      Object.assign(form, data.data);
    }
  } catch (e) {
    console.error('加载配置失败', e);
  }
}

// 保存配置
async function handleSave() {
  loading.value = true;
  try {
    // 将配置保存到后端
    const configs = [
      { configKey: 'login.title', configValue: form.loginTitle, groupName: 'login', configType: 'string' },
      { configKey: 'login.subtitle', configValue: form.loginSubtitle, groupName: 'login', configType: 'string' },
      { configKey: 'login.theme', configValue: form.loginTheme, groupName: 'login', configType: 'string' },
      { configKey: 'login.background', configValue: form.loginBackground, groupName: 'login', configType: 'string' },
      { configKey: 'login.allowRegister', configValue: form.allowRegister ? 'true' : 'false', groupName: 'login', configType: 'boolean' },
      { configKey: 'login.enableCaptcha', configValue: form.enableCaptcha ? 'true' : 'false', groupName: 'login', configType: 'boolean' },
      { configKey: 'login.timeout', configValue: String(form.loginTimeout), groupName: 'login', configType: 'number' },
      { configKey: 'system.showCopyright', configValue: form.showCopyright ? 'true' : 'false', groupName: 'system', configType: 'boolean' },
      { configKey: 'system.copyright', configValue: form.copyright, groupName: 'system', configType: 'string' },
      { configKey: 'system.recordNumber', configValue: form.recordNumber, groupName: 'system', configType: 'string' },
    ];

    for (const config of configs) {
      await fetch('/basic-api/sys/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    }

    message.success('保存成功');
  } catch (e) {
    message.error('保存失败');
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  loadConfig();
}

function handlePreview() {
  previewVisible.value = true;
}

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.login-config {
  max-width: 800px;
}

.form-hint {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.preview-box {
  margin-top: 12px;
}

.bg-preview {
  max-width: 300px;
  max-height: 150px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.login-preview {
  height: 400px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 40px;
  color: white;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}

.preview-logo {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 8px;
}

.preview-title {
  font-size: 24px;
  font-weight: bold;
}

.preview-content {
  display: flex;
  justify-content: center;
}

.preview-form {
  background: white;
  padding: 32px;
  border-radius: 8px;
  width: 320px;
  color: #333;
}

.preview-form-title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 24px;
  color: #333;
}
</style>
