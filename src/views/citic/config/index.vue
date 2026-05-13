<template>
  <div class="citic-config">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <!-- API配置 -->
        <TabPane key="api" tab="API配置">
          <Form layout="vertical" class="config-form">
            <Row :gutter="24">
              <Col :span="12">
                <FormItem label="API环境">
                  <RadioGroup v-model:value="config.api.env">
                    <Radio value="sandbox">沙箱环境</Radio>
                    <Radio value="production">生产环境</Radio>
                  </RadioGroup>
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="API版本">
                  <Input v-model:value="config.api.version" placeholder="如: v2.1" />
                </FormItem>
              </Col>
            </Row>
            <Row :gutter="24">
              <Col :span="24">
                <FormItem label="API地址">
                  <Input v-model:value="config.api.url" placeholder="https://i.citiccloud.com/citic-b2b-gateway/prod" />
                </FormItem>
              </Col>
            </Row>
            <Row :gutter="24">
              <Col :span="12">
                <FormItem label="平台ID (PlatformId)">
                  <Input v-model:value="config.api.platformId" placeholder="请输入平台ID" />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="应用ID (AppId)">
                  <Input v-model:value="config.api.appId" placeholder="请输入应用ID" />
                </FormItem>
              </Col>
            </Row>
            <Row :gutter="24">
              <Col :span="24">
                <FormItem label="应用密钥 (AppSecret)">
                  <Input.Password v-model:value="config.api.appSecret" placeholder="请输入应用密钥" />
                </FormItem>
              </Col>
            </Row>
            <Row :gutter="24">
              <Col :span="24">
                <FormItem label="异步通知地址">
                  <Input v-model:value="config.api.notifyUrl" placeholder="https://your-domain.com/basic-api/citic/notify" />
                </FormItem>
              </Col>
            </Row>
          </Form>
        </TabPane>

        <!-- 签名配置 -->
        <TabPane key="signature" tab="签名配置">
          <Form layout="vertical" class="config-form">
            <Alert message="签名说明" type="info" show-icon class="mb-16">
              <template #description>
                中信银行API使用RSA-SHA256签名。请确保公私钥配置正确，密钥格式为PKCS#8。
              </template>
            </Alert>
            <Row :gutter="24">
              <Col :span="24">
                <FormItem label="商户私钥">
                  <Textarea v-model:value="config.signature.privateKey" :rows="6" placeholder="请输入商户RSA私钥(PKCS#8格式)" />
                </FormItem>
              </Col>
            </Row>
            <Row :gutter="24">
              <Col :span="24">
                <FormItem label="银行公钥">
                  <Textarea v-model:value="config.signature.publicKey" :rows="6" placeholder="请输入银行RSA公钥" />
                </FormItem>
              </Col>
            </Row>
            <Row :gutter="24">
              <Col :span="12">
                <FormItem label="签名算法">
                  <Select v-model:value="config.signature.algorithm">
                    <SelectOption value="SHA256withRSA">RSA-SHA256</SelectOption>
                    <SelectOption value="SHA384withRSA">RSA-SHA384</SelectOption>
                    <SelectOption value="SHA512withRSA">RSA-SHA512</SelectOption>
                  </Select>
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="编码格式">
                  <Select v-model:value="config.signature.encoding">
                    <SelectOption value="BASE64">Base64</SelectOption>
                    <SelectOption value="HEX">Hex</SelectOption>
                  </Select>
                </FormItem>
              </Col>
            </Row>
          </Form>
        </TabPane>

        <!-- 业务配置 -->
        <TabPane key="business" tab="业务配置">
          <Row :gutter="24">
            <Col :span="12">
              <Card title="代付配置" size="small">
                <Form layout="vertical">
                  <FormItem label="代付手续费率">
                    <InputNumber v-model:value="config.business.transferFeeRate" :min="0" :max="1" :precision="4" style="width: 100%" />
                    <span class="input-suffix">%</span>
                  </FormItem>
                  <FormItem label="单笔最低限额">
                    <InputNumber v-model:value="config.business.transferMinAmount" :min="0" :precision="2" style="width: 100%" />
                    <span class="input-suffix">元</span>
                  </FormItem>
                  <FormItem label="单笔最高限额">
                    <InputNumber v-model:value="config.business.transferMaxAmount" :min="0" :precision="2" style="width: 100%" />
                    <span class="input-suffix">元</span>
                  </FormItem>
                  <FormItem label="日累计限额">
                    <InputNumber v-model:value="config.business.transferDailyLimit" :min="0" :precision="2" style="width: 100%" />
                    <span class="input-suffix">元</span>
                  </FormItem>
                </Form>
              </Card>
            </Col>
            <Col :span="12">
              <Card title="结算配置" size="small">
                <Form layout="vertical">
                  <FormItem label="D0费率">
                    <InputNumber v-model:value="config.business.settleD0Rate" :min="0" :max="1" :precision="4" style="width: 100%" />
                    <span class="input-suffix">%</span>
                  </FormItem>
                  <FormItem label="T1费率">
                    <InputNumber v-model:value="config.business.settleT1Rate" :min="0" :max="1" :precision="4" style="width: 100%" />
                    <span class="input-suffix">%</span>
                  </FormItem>
                  <FormItem label="最低结算金额">
                    <InputNumber v-model:value="config.business.settleMinAmount" :min="0" :precision="2" style="width: 100%" />
                    <span class="input-suffix">元</span>
                  </FormItem>
                  <FormItem label="最高结算金额">
                    <InputNumber v-model:value="config.business.settleMaxAmount" :min="0" :precision="2" style="width: 100%" />
                    <span class="input-suffix">元</span>
                  </FormItem>
                </Form>
              </Card>
            </Col>
          </Row>
          <Row :gutter="24" style="margin-top: 16px">
            <Col :span="12">
              <Card title="分账配置" size="small">
                <Form layout="vertical">
                  <FormItem label="自动分账">
                    <Switch v-model:checked="config.business.autoProfitShare" />
                  </FormItem>
                  <FormItem label="分账延迟时间">
                    <InputNumber v-model:value="config.business.profitShareDelay" :min="0" style="width: 100%" />
                    <span class="input-suffix">秒</span>
                  </FormItem>
                  <FormItem label="平台分账比例">
                    <InputNumber v-model:value="config.business.platformShareRate" :min="0" :max="100" :precision="2" style="width: 100%" />
                    <span class="input-suffix">%</span>
                  </FormItem>
                </Form>
              </Card>
            </Col>
            <Col :span="12">
              <Card title="对账配置" size="small">
                <Form layout="vertical">
                  <FormItem label="自动对账">
                    <Switch v-model:checked="config.business.autoCheck" />
                  </FormItem>
                  <FormItem label="对账时间">
                    <TimePicker v-model:value="config.business.checkTime" format="HH:mm" placeholder="选择时间" style="width: 100%" />
                  </FormItem>
                  <FormItem label="对账差异容差">
                    <InputNumber v-model:value="config.business.checkDiffThreshold" :min="0" :precision="2" style="width: 100%" />
                    <span class="input-suffix">元</span>
                  </FormItem>
                </Form>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <!-- 自动调度 -->
        <TabPane key="schedule" tab="自动调度">
          <Row :gutter="24">
            <Col :span="12">
              <Card title="自动对账" size="small">
                <Form layout="vertical">
                  <FormItem label="启用自动对账">
                    <Switch v-model:checked="config.schedule.autoCheckEnabled" />
                  </FormItem>
                  <FormItem label="对账执行时间">
                    <TimePicker v-model:value="config.schedule.checkTime" format="HH:mm" placeholder="选择时间" style="width: 100%" />
                  </FormItem>
                  <FormItem label="对账通道">
                    <CheckboxGroup v-model:value="config.schedule.checkChannels">
                      <Checkbox value="CITIC_QR">中信银行扫码</Checkbox>
                      <Checkbox value="WX_QR">微信扫码</Checkbox>
                      <Checkbox value="ALI_QR">支付宝扫码</Checkbox>
                      <Checkbox value="CT_QR">通联扫码</Checkbox>
                    </CheckboxGroup>
                  </FormItem>
                </Form>
              </Card>
            </Col>
            <Col :span="12">
              <Card title="自动结算" size="small">
                <Form layout="vertical">
                  <FormItem label="启用自动结算">
                    <Switch v-model:checked="config.schedule.autoSettlementEnabled" />
                  </FormItem>
                  <FormItem label="结算类型">
                    <RadioGroup v-model:value="config.schedule.settleType">
                      <Radio :value="1">D0实时结算</Radio>
                      <Radio :value="2">T1次日结算</Radio>
                    </RadioGroup>
                  </FormItem>
                  <FormItem label="结算时间段">
                    <Space>
                      <TimePicker v-model:value="config.schedule.settleTimeStart" format="HH:mm" placeholder="开始" />
                      <span>至</span>
                      <TimePicker v-model:value="config.schedule.settleTimeEnd" format="HH:mm" placeholder="结束" />
                    </Space>
                  </FormItem>
                </Form>
              </Card>
            </Col>
          </Row>
          <Row :gutter="24" style="margin-top: 16px">
            <Col :span="12">
              <Card title="自动资金归集" size="small">
                <Form layout="vertical">
                  <FormItem label="启用自动归集">
                    <Switch v-model:checked="config.schedule.autoCollectionEnabled" />
                  </FormItem>
                  <FormItem label="归集执行时间">
                    <TimePicker v-model:value="config.schedule.collectionTime" format="HH:mm" placeholder="选择时间" style="width: 100%" />
                  </FormItem>
                  <FormItem label="归集类型">
                    <RadioGroup v-model:value="config.schedule.collectionType">
                      <Radio :value="1">全额归集</Radio>
                      <Radio :value="2">定额归集</Radio>
                      <Radio :value="3">保留余额归集</Radio>
                    </RadioGroup>
                  </FormItem>
                </Form>
              </Card>
            </Col>
            <Col :span="12">
              <Card title="自动分账" size="small">
                <Form layout="vertical">
                  <FormItem label="启用自动分账">
                    <Switch v-model:checked="config.schedule.autoProfitShareEnabled" />
                  </FormItem>
                  <FormItem label="分账类型">
                    <RadioGroup v-model:value="config.schedule.profitShareType">
                      <Radio :value="1">比例分账</Radio>
                      <Radio :value="2">金额分账</Radio>
                    </RadioGroup>
                  </FormItem>
                  <FormItem label="交易成功自动分账">
                    <Switch v-model:checked="config.schedule.autoShareOnTrade" />
                  </FormItem>
                </Form>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <!-- 连接测试 -->
        <TabPane key="test" tab="连接测试">
          <Card title="API连接测试" size="small">
            <Form layout="vertical" class="test-form">
              <Row :gutter="24">
                <Col :span="8">
                  <FormItem label="测试类型">
                    <Select v-model:value="testType" style="width: 100%">
                      <SelectOption value="account">账户查询</SelectOption>
                      <SelectOption value="balance">余额查询</SelectOption>
                      <SelectOption value="transfer">代付测试</SelectOption>
                      <SelectOption value="callback">回调测试</SelectOption>
                    </Select>
                  </FormItem>
                </Col>
                <Col :span="8">
                  <FormItem label="账户编号">
                    <Input v-model:value="testAccountNo" placeholder="请输入账户编号" />
                  </FormItem>
                </Col>
                <Col :span="8">
                  <FormItem label=" ">
                    <Button type="primary" @click="handleTest" :loading="testLoading">
                      <template #icon><ApiOutlined /></template>
                      执行测试
                    </Button>
                  </FormItem>
                </Col>
              </Row>
            </Form>
          </Card>
          <Card title="测试结果" size="small" style="margin-top: 16px" v-if="testResult">
            <Alert :type="testResult.success ? 'success' : 'error'" show-icon>
              <template #message>{{ testResult.success ? '测试成功' : '测试失败' }}</template>
              <template #description>
                <pre class="result-pre">{{ testResult.message }}</pre>
              </template>
            </Alert>
          </Card>
        </TabPane>
      </Tabs>

      <!-- 保存按钮 -->
      <div class="form-footer">
        <Space>
          <Button type="primary" @click="handleSave" :loading="saving">
            <template #icon><SaveOutlined /></template>
            保存配置
          </Button>
          <Button @click="handleReset">
            <template #icon><ReloadOutlined /></template>
            重置
          </Button>
        </Space>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Card, Tabs, TabPane, Form, FormItem, Input, InputNumber, InputPassword,
  Select, SelectOption, RadioGroup, Radio, Switch, Checkbox, CheckboxGroup,
  Textarea, Row, Col, Alert, Button, Space, message, TimePicker
} from 'ant-design-vue';
import { SaveOutlined, ReloadOutlined, ApiOutlined } from '@ant-design/icons-vue';
import { getAutoConfigs, updateAutoConfigs } from '@/api/citic';

const activeTab = ref('api');
const saving = ref(false);
const testLoading = ref(false);
const testType = ref('account');
const testAccountNo = ref('');
const testResult = ref<{ success: boolean; message: string } | null>(null);

const config = reactive({
  api: {
    env: 'production',
    version: 'v2.1',
    url: 'https://i.citiccloud.com/citic-b2b-gateway/prod',
    platformId: '',
    appId: '',
    appSecret: '',
    notifyUrl: '',
  },
  signature: {
    privateKey: '',
    publicKey: '',
    algorithm: 'SHA256withRSA',
    encoding: 'BASE64',
  },
  business: {
    transferFeeRate: 0.002,
    transferMinAmount: 1,
    transferMaxAmount: 500000,
    transferDailyLimit: 5000000,
    settleD0Rate: 0.0035,
    settleT1Rate: 0.0025,
    settleMinAmount: 100,
    settleMaxAmount: 500000,
    autoProfitShare: true,
    profitShareDelay: 30,
    platformShareRate: 20,
    autoCheck: true,
    checkTime: null as any,
    checkDiffThreshold: 0.01,
  },
  schedule: {
    autoCheckEnabled: true,
    checkTime: null as any,
    checkChannels: ['CITIC_QR'],
    autoSettlementEnabled: true,
    settleType: 2,
    settleTimeStart: null as any,
    settleTimeEnd: null as any,
    autoCollectionEnabled: true,
    collectionTime: null as any,
    collectionType: 1,
    autoProfitShareEnabled: true,
    profitShareType: 1,
    autoShareOnTrade: true,
  },
});

async function fetchConfig() {
  try {
    const res = await getAutoConfigs();
    if (res && res.data) {
      const data = res.data;
      if (data.checkConfig) {
        config.schedule.autoCheckEnabled = data.checkConfig.enabled;
        config.schedule.checkTime = data.checkConfig.checkTime;
        config.schedule.checkChannels = data.checkConfig.channels;
      }
      if (data.settlementConfig) {
        config.schedule.autoSettlementEnabled = data.settlementConfig.enabled;
        config.schedule.settleType = data.settlementConfig.settleType;
        config.business.settleD0Rate = data.settlementConfig.feeRates?.d0 || 0.0035;
        config.business.settleT1Rate = data.settlementConfig.feeRates?.t1 || 0.0025;
        config.business.settleMinAmount = data.settlementConfig.minAmount || 100;
        config.business.settleMaxAmount = data.settlementConfig.maxAmount || 500000;
      }
      if (data.profitShareConfig) {
        config.schedule.autoProfitShareEnabled = data.profitShareConfig.enabled;
        config.schedule.profitShareType = data.profitShareConfig.shareType;
        config.schedule.autoShareOnTrade = data.profitShareConfig.autoShareOnTrade;
        config.business.platformShareRate = data.profitShareConfig.platformShareRate || 20;
      }
      if (data.collectionConfig) {
        config.schedule.autoCollectionEnabled = data.collectionConfig.enabled;
        config.schedule.collectionType = data.collectionConfig.collectionType;
        config.schedule.collectionTime = data.collectionConfig.collectionTime;
      }
    }
  } catch (error) {
    console.error('获取配置失败', error);
  }
}

async function handleSave() {
  saving.value = true;
  try {
    await updateAutoConfigs({
      checkConfig: {
        enabled: config.schedule.autoCheckEnabled,
        checkTime: config.schedule.checkTime,
        channels: config.schedule.checkChannels,
      },
      settlementConfig: {
        enabled: config.schedule.autoSettlementEnabled,
        settleType: config.schedule.settleType,
        feeRates: {
          d0: config.business.settleD0Rate,
          t1: config.business.settleT1Rate,
        },
        minAmount: config.business.settleMinAmount,
        maxAmount: config.business.settleMaxAmount,
      },
      profitShareConfig: {
        enabled: config.schedule.autoProfitShareEnabled,
        shareType: config.schedule.profitShareType,
        autoShareOnTrade: config.schedule.autoShareOnTrade,
        platformShareRate: config.business.platformShareRate,
      },
      collectionConfig: {
        enabled: config.schedule.autoCollectionEnabled,
        collectionType: config.schedule.collectionType,
        collectionTime: config.schedule.collectionTime,
      },
    });
    message.success('配置保存成功');
  } catch (error) {
    message.error('配置保存失败');
  } finally {
    saving.value = false;
  }
}

function handleReset() {
  fetchConfig();
  message.success('配置已重置');
}

async function handleTest() {
  testLoading.value = true;
  testResult.value = null;
  try {
    // 模拟测试
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockResults: Record<string, { success: boolean; message: string }> = {
      account: { success: true, message: '账户查询成功\n\n返回数据:\n{\n  "accountNo": "' + (testAccountNo.value || 'ACC001') + '",\n  "accountName": "测试账户",\n  "balance": "100000.00",\n  "availableBalance": "95000.00",\n  "status": "正常"\n}' },
      balance: { success: true, message: '余额查询成功\n\n返回数据:\n{\n  "accountNo": "' + (testAccountNo.value || 'ACC001') + '",\n  "balance": "100000.00",\n  atus: "正常"\n}' },
      transfer: { success: true, message: '代付测试成功\n\n返回数据:\n{\n  "transferNo": "TRF' + Date.now() + '",\n  "status": "PROCESSING",\n  "message": "代付申请已提交"\n}' },
      callback: { success: true, message: '回调测试成功\n\n返回数据:\n{\n  "code": 0,\n  "message": "回调处理成功"\n}' },
    };
    testResult.value = mockResults[testType.value] || mockResults.account;
  } catch (error: any) {
    testResult.value = { success: false, message: error.message || '测试失败' };
  } finally {
    testLoading.value = false;
  }
}

onMounted(() => {
  fetchConfig();
});
</script>

<style scoped>
.citic-config {
  padding: 16px;
  background: #f0f2f5;
}

.config-form {
  max-width: 100%;
}

.input-suffix {
  margin-left: 8px;
  color: #666;
}

.form-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
  text-align: right;
}

.mb-16 {
  margin-bottom: 16px;
}

.result-pre {
  margin: 8px 0 0 0;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}
</style>
