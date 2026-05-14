<template>
  <div :class="prefixCls" class="relative w-full h-full px-4">
    <!-- 顶部工具栏 -->
    <div class="flex items-center absolute right-4 top-4 z-10">
      <AppDarkModeToggle class="enter-x mr-2" />
      <AppLocalePicker class="text-white enter-x xl:text-gray-600" :show-text="false" />
    </div>

    <div class="container relative h-full py-2 mx-auto sm:px-10">
      <div class="flex h-full">
        <!-- 左侧展示区 -->
        <div class="hidden min-h-full pl-4 mr-4 xl:flex xl:flex-col xl:w-6/12">
          <AppLogo class="-enter-x" />
          <div class="my-auto">
            <img :alt="title" src="../../../assets/svg/login-box-bg.svg" class="w-1/2 -mt-16 -enter-x" />
            <div class="mt-10 font-medium text-white -enter-x">
              <span class="inline-block mt-4 text-3xl">{{ t('sys.login.signInTitle') }}</span>
            </div>
            <div class="mt-5 font-normal text-white dark:text-gray-500 -enter-x">
              {{ t('sys.login.signInDesc') }}
            </div>
          </div>
        </div>

        <!-- 右侧登录表单区 -->
        <div class="flex w-full h-full py-5 xl:h-auto xl:py-0 xl:my-0 xl:w-6/12">
          <div
            :class="`${prefixCls}-form`"
            class="relative w-full px-5 py-10 mx-auto my-auto rounded-md shadow-md xl:ml-16 xl:bg-transparent sm:px-8 xl:p-4 xl:shadow-none sm:w-3/4 lg:w-2/4 xl:w-auto enter-x"
          >
            <!-- 角色选择 -->
            <div class="role-selector enter-x">
              <Select v-model:value="selectedRole" size="large" style="width: 200px">
                <SelectOption value="admin">运营后台</SelectOption>
                <SelectOption value="agent">代理商后台</SelectOption>
                <SelectOption value="mch">商户后台</SelectOption>
              </Select>
            </div>

            <!-- 标题 -->
            <h2 class="mb-6 text-2xl font-bold text-center xl:text-3xl enter-x">
              {{ roleConfig[selectedRole].title }}
            </h2>

            <!-- 登录表单 -->
            <Form class="p-4 enter-x" :model="formData" :rules="getFormRules" ref="formRef" @keypress.enter="handleLogin">
              <FormItem name="account">
                <Input size="large" v-model:value="formData.account" :placeholder="t('sys.login.userName')" autocomplete="username" class="fix-auto-fill">
                  <template #prefix><UserOutlined /></template>
                </Input>
              </FormItem>
              <FormItem name="password">
                <InputPassword size="large" visibilityToggle v-model:value="formData.password" autocomplete="current-password" :placeholder="t('sys.login.password')">
                  <template #prefix><LockOutlined /></template>
                </InputPassword>
              </FormItem>

              <FormItem>
                <Checkbox v-model:checked="rememberMe" size="small">{{ t('sys.login.rememberMe') }}</Checkbox>
                <Button type="link" size="small" class="float-right" @click="showForgetModal = true">
                  {{ t('sys.login.forgetPassword') }}
                </Button>
              </FormItem>

              <FormItem class="enter-x">
                <Button type="primary" size="large" block @click="handleLogin" :loading="loading">
                  {{ t('sys.login.loginButton') }}
                </Button>
              </FormItem>
            </Form>

            <!-- 忘记密码弹窗 -->
            <Modal v-model:open="showForgetModal" title="忘记密码" :footer="null" width="400px">
              <Form :model="forgetForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <FormItem label="手机号">
                  <Input v-model:value="forgetForm.phone" placeholder="请输入手机号" />
                </FormItem>
                <FormItem label="验证码">
                  <div class="flex gap-2">
                    <Input v-model:value="forgetForm.code" placeholder="请输入验证码" />
                    <Button @click="sendCode" :disabled="codeCooldown > 0">
                      {{ codeCooldown > 0 ? `${codeCooldown}s` : '发送验证码' }}
                    </Button>
                  </div>
                </FormItem>
                <FormItem label="新密码">
                  <InputPassword v-model:value="forgetForm.password" placeholder="请输入新密码" />
                </FormItem>
              </Form>
              <div class="text-right mt-4">
                <Button @click="showForgetModal = false" class="mr-2">取消</Button>
                <Button type="primary" @click="handleResetPassword">确认重置</Button>
              </div>
            </Modal>

            <!-- 版本号 -->
            <div class="version-info">
              <span>{{ appTitle }}</span>
              <span class="version-number">v{{ version }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onMounted } from 'vue';

import { AppDarkModeToggle, AppLocalePicker, AppLogo } from '@/components/Application';
import { useGlobSetting } from '@/hooks/setting';
import { useDesign } from '@/hooks/web/useDesign';
import { useI18n } from '@/hooks/web/useI18n';

import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { Checkbox, Form, Input, Button, Modal, Select, message } from 'ant-design-vue';

import { useUserStore } from '@/store/modules/user';
import { useFormRules, useFormValid } from './useLogin';

const SelectOption = Select.Option;
const FormItem = Form.Item;
const InputPassword = Input.Password;

const globSetting = useGlobSetting();
const { prefixCls } = useDesign('login');
const { t } = useI18n();
const userStore = useUserStore();
const { getFormRules } = useFormRules();

const title = computed(() => globSetting?.title ?? '');
const appTitle = computed(() => globSetting?.title ?? 'DGKJ支付平台');
const version = ref('1.0.0');

const formRef = ref();
const loading = ref(false);
const rememberMe = ref(false);
const showForgetModal = ref(false);
const codeCooldown = ref(0);

const selectedRole = ref<'admin' | 'agent' | 'mch'>('admin');

const roleConfig = {
  admin: { title: '运营后台', welcome: '欢迎使用运营管理系统' },
  agent: { title: '代理商后台', welcome: '欢迎使用代理商管理系统' },
  mch: { title: '商户后台', welcome: '欢迎使用商户管理系统' },
};

const formData = reactive({
  account: '',
  password: '',
});

const forgetForm = reactive({
  phone: '',
  code: '',
  password: '',
});

const { validForm } = useFormValid(formRef);

// 加载版本号
async function loadVersion() {
  try {
    const res = await fetch('/api/public/config');
    const data = await res.json();
    if (data?.data?.version) {
      version.value = data.data.version;
    }
  } catch (e) {
    console.error('获取版本号失败', e);
  }
}

async function handleLogin() {
  const data = await validForm();
  if (!data) return;

  try {
    loading.value = true;
    const userInfo = await userStore.login({
      password: data.password,
      username: data.account,
      role: selectedRole.value,
      mode: 'none',
    });
    if (userInfo) {
      message.success({
        content: `${t('sys.login.loginSuccessDesc')}: ${userInfo.realName}`,
        duration: 3,
      });
    }
  } catch (error) {
    message.error({
      content: (error as unknown as Error).message || t('sys.api.networkExceptionMsg'),
    });
  } finally {
    loading.value = false;
  }
}

function sendCode() {
  if (!forgetForm.phone) {
    message.warning('请输入手机号');
    return;
  }
  codeCooldown.value = 60;
  const timer = setInterval(() => {
    codeCooldown.value--;
    if (codeCooldown.value <= 0) clearInterval(timer);
  }, 1000);
  message.success('验证码已发送');
}

function handleResetPassword() {
  if (!forgetForm.phone || !forgetForm.code || !forgetForm.password) {
    message.warning('请填写完整信息');
    return;
  }
  message.success('密码重置成功');
  showForgetModal.value = false;
}

onMounted(() => {
  loadVersion();
});
</script>

<style lang="less">
@prefix-cls: ~'@{namespace}-login';
@logo-prefix-cls: ~'@{namespace}-app-logo';
@dark-bg: #293146;

html[data-theme='dark'] {
  .@{prefix-cls} {
    background-color: @dark-bg;

    &::before {
      background-image: url('@/assets/svg/login-bg-dark.svg');
    }

    .ant-input,
    .ant-input-password {
      background-color: #232a3b;
    }

    &-form {
      background: transparent !important;
    }
  }
}

.@{prefix-cls} {
  min-height: 100%;
  overflow: hidden;

  @media (max-width: @screen-xl) {
    background-color: #293146;

    .@{prefix-cls}-form {
      background-color: #fff;
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin-left: -48%;
    background-image: url('@/assets/svg/login-bg.svg');
    background-repeat: no-repeat;
    background-position: 100%;
    background-size: auto 100%;

    @media (max-width: @screen-xl) {
      display: none;
    }
  }

  .@{logo-prefix-cls} {
    position: absolute;
    top: 12px;
    height: 30px;

    &__title {
      color: #fff;
      font-size: 16px;
    }

    img {
      width: 32px;
    }
  }

  .container {
    .@{logo-prefix-cls} {
      display: flex;
      width: 60%;
      height: 80px;

      &__title {
        color: #fff;
        font-size: 24px;
      }

      img {
        width: 48px;
      }
    }
  }

  &-form {
    position: relative;

    .role-selector {
      text-align: center;
      margin-bottom: 20px;
    }

    input:not([type='checkbox']) {
      min-width: 260px;

      @media (max-width: @screen-xl) {
        min-width: 220px;
      }
      @media (max-width: @screen-lg) {
        min-width: 200px;
      }
      @media (max-width: @screen-md) {
        min-width: 180px;
      }
      @media (max-width: @screen-sm) {
        min-width: 140px;
      }
    }
  }

  .version-info {
    position: absolute;
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    white-space: nowrap;

    .version-number {
      margin-left: 8px;
      padding: 2px 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    @media (max-width: @screen-xl) {
      color: #999;
      bottom: -30px;

      .version-number {
        background: #f0f0f0;
      }
    }
  }
}
</style>
