<template>
  <div class="logo-config">
    <Row :gutter="24">
      <Col :span="12">
        <Card title="登录页Logo" hoverable>
          <div class="logo-preview">
            <img :src="form.loginLogo || '/assets/logo.png'" alt="登录页Logo" class="preview-img" />
          </div>
          <Form :model="form" :label-col="{ span: 6 }" style="margin-top: 16px">
            <FormItem label="Logo地址">
              <Input v-model:value="form.loginLogo" placeholder="请输入Logo URL" />
            </FormItem>
            <FormItem label="或上传文件">
              <Upload :before-upload="handleLoginLogoUpload" :show-upload-list="false">
                <Button><UploadOutlined /> 选择图片</Button>
              </Upload>
            </FormItem>
          </Form>
        </Card>
      </Col>
      <Col :span="12">
        <Card title="侧边栏Logo" hoverable>
          <div class="logo-preview">
            <img :src="form.sidebarLogo || '/assets/logo.png'" alt="侧边栏Logo" class="preview-img" />
          </div>
          <Form :model="form" :label-col="{ span: 6 }" style="margin-top: 16px">
            <FormItem label="Logo地址">
              <Input v-model:value="form.sidebarLogo" placeholder="请输入Logo URL" />
            </FormItem>
            <FormItem label="或上传文件">
              <Upload :before-upload="handleSidebarLogoUpload" :show-upload-list="false">
                <Button><UploadOutlined /> 选择图片</Button>
              </Upload>
            </FormItem>
          </Form>
        </Card>
      </Col>
    </Row>

    <Row :gutter="24" style="margin-top: 24px">
      <Col :span="12">
        <Card title="浏览器图标(Favicon)" hoverable>
          <div class="logo-preview favicon-preview">
            <img :src="form.favicon || '/assets/favicon.ico'" alt="Favicon" class="favicon-img" />
          </div>
          <Form :model="form" :label-col="{ span: 6 }" style="margin-top: 16px">
            <FormItem label="Favicon地址">
              <Input v-model:value="form.favicon" placeholder="请输入Favicon URL" />
            </FormItem>
            <FormItem label="或上传文件">
              <Upload :before-upload="handleFaviconUpload" accept=".ico,.png,.svg" :show-upload-list="false">
                <Button><UploadOutlined /> 选择图片</Button>
              </Upload>
            </FormItem>
          </Form>
        </Card>
      </Col>
      <Col :span="12">
        <Card title="Logo尺寸规范" hoverable>
          <Alert type="info" show-icon style="margin-bottom: 16px">
            <template #message>Logo尺寸要求</template>
            <template #description>
              <ul class="spec-list">
                <li><strong>登录页Logo:</strong> 建议尺寸 200x60px，支持PNG/SVG</li>
                <li><strong>侧边栏Logo:</strong> 建议尺寸 32x32px，支持PNG/SVG</li>
                <li><strong>Favicon:</strong> 建议尺寸 32x32px，支持ICO/PNG格式</li>
              </ul>
            </template>
          </Alert>
        </Card>
      </Col>
    </Row>

    <div class="actions">
      <Button type="primary" @click="handleSave" :loading="loading">保存配置</Button>
      <Button @click="handleReset">重置</Button>
      <Button @click="handleRestore">恢复默认</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Row, Col, Card, Form, FormItem, Input, Button, Upload, Alert, message } from 'ant-design-vue';
import { UploadOutlined } from '@ant-design/icons-vue';

const loading = ref(false);

const form = reactive({
  loginLogo: '/assets/logo.png',
  sidebarLogo: '/assets/logo.png',
  favicon: '/assets/favicon.ico',
});

const defaultForm = {
  loginLogo: '/assets/logo.png',
  sidebarLogo: '/assets/logo.png',
  favicon: '/assets/favicon.ico',
};

async function loadConfig() {
  try {
    const res = await fetch('/api/public/logo');
    const data = await res.json();
    if (data.data) {
      Object.assign(form, data.data);
    }
  } catch (e) {
    console.error('加载配置失败', e);
  }
}

async function handleSave() {
  loading.value = true;
  try {
    const configs = [
      { configKey: 'logo.login', configValue: form.loginLogo, groupName: 'logo', configType: 'string' },
      { configKey: 'logo.sidebar', configValue: form.sidebarLogo, groupName: 'logo', configType: 'string' },
      { configKey: 'logo.favicon', configValue: form.favicon, groupName: 'logo', configType: 'string' },
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

function handleRestore() {
  Object.assign(form, defaultForm);
}

async function handleLoginLogoUpload(file: File) {
  // TODO: 实现文件上传
  message.info('文件上传功能开发中');
  return false;
}

async function handleSidebarLogoUpload(file: File) {
  message.info('文件上传功能开发中');
  return false;
}

async function handleFaviconUpload(file: File) {
  message.info('文件上传功能开发中');
  return false;
}

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.logo-config {
  max-width: 1200px;
}

.logo-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  background: #f5f5f5;
  border-radius: 8px;
}

.preview-img {
  max-width: 200px;
  max-height: 80px;
}

.favicon-preview {
  height: 80px;
}

.favicon-img {
  width: 32px;
  height: 32px;
}

.spec-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.spec-list li {
  margin-bottom: 4px;
}

.actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
</style>
