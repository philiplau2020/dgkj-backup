<template>
  <div class="aliyun-sms-config">
    <Card>
      <Alert
        message="阿里云短信配置"
        description="在阿里云短信服务控制台(https://dysms.console.aliyun.com)获取 AccessKey 和短信模板信息。"
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

        <FormItem label="AccessKey ID" name="accessKeyId">
          <Input
            v-model:value="formState.accessKeyId"
            placeholder="阿里云 AccessKey ID"
          />
          <div class="field-tip">在阿里云 RAM 控制台创建 AccessKey，获取 AccessKey ID 和 AccessKey Secret</div>
        </FormItem>

        <FormItem label="AccessKey Secret" name="accessKeySecret">
          <InputPassword
            v-model:value="formState.accessKeySecret"
            placeholder="阿里云 AccessKey Secret"
          />
          <div class="field-tip">AccessKey Secret 只在创建时显示，请妥善保管</div>
        </FormItem>

        <FormItem label="签名名称" name="signName">
          <Input
            v-model:value="formState.signName"
            placeholder="短信签名名称"
          />
          <div class="field-tip">在阿里云短信服务控制台 > 签名管理 中创建签名</div>
        </FormItem>

        <FormItem label="模板CODE" name="templateCode">
          <Input
            v-model:value="formState.templateCode"
            placeholder="短信模板CODE"
          />
          <div class="field-tip">在阿里云短信服务控制台 > 模板管理 中创建模板并复制模板CODE</div>
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
    </Card>

    <Card title="模板变量说明" style="margin-top: 16px">
      <Alert
        message="常用模板变量"
        description="在短信模板中使用 ${变量名} 格式定义变量，系统会自动替换。"
        type="info"
        show-icon
        style="margin-bottom: 16px"
      />

      <Table :dataSource="variableList" :columns="variableColumns" :pagination="false" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'example'">
            <Tag color="blue">{{ record.example }}</Tag>
          </template>
        </template>
      </Table>
    </Card>

    <Card title="配置步骤" style="margin-top: 16px">
      <Steps :current="0" size="small">
        <Step title="开通服务" description="登录阿里云，开通短信服务" />
        <Step title="创建签名" description="在签名管理中创建短信签名，等待审核" />
        <Step title="创建模板" description="在模板管理中创建短信模板，设置变量" />
        <Step title="配置密钥" description="在 RAM 控制台创建 AccessKey" />
        <Step title="填入配置" description="将上述信息填入上方配置" />
      </Steps>

      <Alert
        message="费用说明"
        description="阿里云短信按条计费，具体价格请参考官方定价。国内短信 0.045 元/条起，实际价格以控制台显示为准。"
        type="warning"
        show-icon
        style="margin-top: 16px"
      />
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Form, FormItem, Input, InputPassword, Switch, Button, Space, Alert, Steps, Step, Table, Tag, message } from 'ant-design-vue';
import { getAliyunSmsConfig, saveAliyunSmsConfig, testSms } from '@/api/sys/notify';

const formRef = ref();
const saving = ref(false);
const testing = ref(false);
const testPhone = ref('');
const originalData = ref<any>({});

const formState = reactive({
  accessKeyId: '',
  accessKeySecret: '',
  signName: 'DGKJ支付',
  templateCode: '',
  enabled: false,
});

const variableColumns = [
  { title: '变量名', dataIndex: 'name', key: 'name' },
  { title: '说明', dataIndex: 'desc', key: 'desc' },
  { title: '示例', key: 'example' },
];

const variableList = ref([
  { name: '${code}', desc: '验证码', example: '123456' },
  { name: '${name}', desc: '用户名', example: '张三' },
  { name: '${amount}', desc: '金额', example: '100.00' },
  { name: '${orderNo}', desc: '订单号', example: 'ORDER123456' },
  { name: '${time}', desc: '时间', example: '2024-01-01 12:00' },
]);

onMounted(async () => {
  try {
    const res = await getAliyunSmsConfig();
    if (res?.data) {
      Object.assign(formState, res.data);
      originalData.value = { ...res.data };
    }
  } catch (e) {
    console.error('加载阿里云短信配置失败', e);
  }
});

const handleSave = async () => {
  saving.value = true;
  try {
    await saveAliyunSmsConfig(formState);
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
  if (!/^1[3-9]\d{9}$/.test(testPhone.value)) {
    message.warning('请输入正确的手机号');
    return;
  }
  testing.value = true;
  try {
    const res = await testSms({ phone: testPhone.value });
    if (res?.code === 0) {
      message.success('测试短信发送成功，请注意查收');
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
.aliyun-sms-config {
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
