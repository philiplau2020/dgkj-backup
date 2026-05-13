<template>
  <div class="system-config">
    <Descriptions bordered :column="2">
      <DescriptionsItem label="系统名称">{{ info.appTitle || 'DGKJ支付平台' }}</DescriptionsItem>
      <DescriptionsItem label="系统版本">{{ info.version || '1.0.0' }}</DescriptionsItem>
      <DescriptionsItem label="公司名称">{{ info.companyName || 'DGKJ支付' }}</DescriptionsItem>
      <DescriptionsItem label="版权信息">{{ info.copyright || '-' }}</DescriptionsItem>
      <DescriptionsItem label="备案号">{{ info.recordNumber || '-' }}</DescriptionsItem>
      <DescriptionsItem label="当前环境">{{ info.environment || 'production' }}</DescriptionsItem>
    </Descriptions>

    <Card title="修改系统信息" style="margin-top: 24px">
      <Form :model="form" :label-col="{ span: 4 }" :wrapper-col="{ span: 16 }">
        <FormItem label="系统名称">
          <Input v-model:value="form.appTitle" placeholder="请输入系统名称" />
        </FormItem>
        <FormItem label="公司名称">
          <Input v-model:value="form.companyName" placeholder="请输入公司名称" />
        </FormItem>
        <FormItem label="版权信息">
          <Input v-model:value="form.copyright" placeholder="请输入版权信息" />
        </FormItem>
        <FormItem label="备案号">
          <Input v-model:value="form.recordNumber" placeholder="请输入备案号" />
        </FormItem>
        <FormItem :wrapper-col="{ span: 16, offset: 4 }">
          <Button type="primary" @click="handleSave" :loading="loading">保存</Button>
        </FormItem>
      </Form>
    </Card>

    <Card title="环境变量" style="margin-top: 24px">
      <Alert type="info" show-icon style="margin-bottom: 16px">
        <template #message>说明</template>
        <template #description>
          以下环境变量需要在服务器上配置，修改后需要重启服务生效。
        </template>
      </Alert>
      <Table :data-source="envList" :columns="columns" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'required'">
            <Tag :color="record.required ? 'red' : 'default'">{{ record.required ? '必需' : '可选' }}</Tag>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Descriptions, DescriptionsItem, Form, FormItem, Input, Button, Table, Tag, Alert, message } from 'ant-design-vue';

const loading = ref(false);

const info = reactive({
  appTitle: '',
  version: '',
  companyName: '',
  copyright: '',
  recordNumber: '',
  environment: 'production',
});

const form = reactive({
  appTitle: '',
  companyName: '',
  copyright: '',
  recordNumber: '',
});

const envList = ref([
  { key: 'VITE_GLOB_APP_TITLE', value: 'DGKJ支付平台', desc: '系统名称', required: true },
  { key: 'VITE_GLOB_API_URL', value: 'https://dghs.gddogootech.com', desc: 'API地址', required: true },
  { key: 'VITE_USE_MOCK', value: 'false', desc: '是否启用Mock', required: true },
  { key: 'PORT', value: '3000', desc: '服务端口', required: true },
  { key: 'CORS_ORIGIN', value: 'https://dghs.gddogootech.com', desc: 'CORS白名单', required: true },
]);

const columns = [
  { title: '变量名', dataIndex: 'key', key: 'key' },
  { title: '当前值', dataIndex: 'value', key: 'value' },
  { title: '说明', dataIndex: 'desc', key: 'desc' },
  { title: '类型', key: 'required' },
];

async function loadInfo() {
  try {
    const res = await fetch('/api/public/system-info');
    const data = await res.json();
    if (data.data) {
      Object.assign(info, data.data);
      Object.assign(form, data.data);
    }
  } catch (e) {
    console.error('加载系统信息失败', e);
  }
}

async function handleSave() {
  loading.value = true;
  try {
    const configs = [
      { configKey: 'sys.appTitle', configValue: form.appTitle, groupName: 'system', configType: 'string' },
      { configKey: 'system.companyName', configValue: form.companyName, groupName: 'system', configType: 'string' },
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
    Object.assign(info, form);
  } catch (e) {
    message.error('保存失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadInfo();
});
</script>

<style scoped>
.system-config {
  max-width: 1000px;
}
</style>
