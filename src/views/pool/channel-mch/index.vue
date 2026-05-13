<template>
  <div class="pool-channel-mch">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleRefresh"> 刷新状态 </a-button>
        <a-button @click="handleSimulate"> 模拟路由 </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)" size="small">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'circuitState'">
          <a-tag
            :color="getCircuitColor(record.circuitState)"
            size="small"
          >
            {{ getCircuitText(record.circuitState) }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'successRate'">
          <a-progress
            :percent="record.successRate || 100"
            :stroke-color="getSuccessRateColor(record.successRate)"
            size="small"
            :format="(p) => p?.toFixed(1) + '%'"
          />
        </template>

        <template v-else-if="column.key === 'quotaUsage'">
          <div class="quota-cell">
            <span>{{ formatAmount(record.dailyQuotaUsed || 0) }}</span>
            <span class="quota-sep">/</span>
            <span>{{ formatAmount(record.dailyLimit) }}</span>
            <a-progress
              :percent="record.dailyQuotaUsageRate || 0"
              :stroke-color="getQuotaColor(record.dailyQuotaUsageRate)"
              size="small"
              :show-info="false"
              style="margin-top: 4px"
            />
          </div>
        </template>

        <template v-else-if="column.key === 'weight'">
          <a-input-number
            v-model:value="record.weight"
            :min="1"
            :max="1000"
            size="small"
            style="width: 80px"
            @change="handleWeightChange(record)"
          />
        </template>

        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button
              type="link"
              size="small"
              @click="handleViewHealth(record)"
            >
              健康
            </a-button>
            <a-button
              type="link"
              size="small"
              @click="handleSwitch(record, 'disable')"
              v-if="record.status === 1"
            >
              禁用
            </a-button>
            <a-button
              type="link"
              size="small"
              @click="handleSwitch(record, 'enable')"
              v-if="record.status === 0"
            >
              启用
            </a-button>
            <a-button
              type="link"
              size="small"
              danger
              @click="handleSwitch(record, 'reset')"
            >
              重置
            </a-button>
          </a-space>
        </template>
      </template>
    </BasicTable>

    <!-- 健康详情抽屉 -->
    <BasicDrawer v-bind="healthDrawer">
      <HealthDetail :mch-no="currentMch?.mchNo" :channel-code="currentMch?.channelCode" />
    </BasicDrawer>

    <!-- 模拟路由弹窗 -->
    <BasicModal
      v-bind="simulateModal"
      title="模拟路由选择"
      @ok="doSimulate"
      @cancel="simulateModal.visible = false"
    >
      <a-form :model="simulateForm" layout="vertical">
        <a-form-item label="通道编码" required>
          <a-select v-model:value="simulateForm.channelCode">
            <a-select-option value="WX_JSAPI">微信</a-select-option>
            <a-select-option value="ALI_QR">支付宝</a-select-option>
            <a-select-option value="UNION_QR">银联</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="交易金额" required>
          <a-input-number
            v-model:value="simulateForm.amount"
            :min="0.01"
            :precision="2"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="银行卡 BIN">
          <a-input v-model:value="simulateForm.bin" placeholder="如: 621234" />
        </a-form-item>

        <a-form-item label="用户 ID">
          <a-input v-model:value="simulateForm.userId" placeholder="用户标识" />
        </a-form-item>
      </a-form>
    </BasicModal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { BasicTable, useTable } from '@/components/Table';
import { BasicModal, useModal } from '@/components/Modal';
import { BasicDrawer, useDrawer } from '@/components/Drawer';
import { PoolApi } from '@/api/pool';
import { useMessage } from '@/hooks/web/useMessage';
import HealthDetail from './HealthDetail.vue';

const { createMessage } = useMessage();

const columns = [
  { title: '商户号', dataIndex: 'mchNo', width: 120 },
  { title: '商户名称', dataIndex: 'mchName', minWidth: 150 },
  { title: '通道', dataIndex: 'channelCode', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: '熔断', key: 'circuitState', width: 80 },
  { title: '成功率', key: 'successRate', width: 120 },
  { title: '日配额使用', key: 'quotaUsage', width: 180 },
  { title: '权重', key: 'weight', width: 120 },
  { title: '单笔限额', dataIndex: 'singleMaxAmount', width: 120, customRender: ({ text }) => text ? `≤${formatAmount(text)}` : '-' },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const [registerTable, { reload }] = useTable({
  api: async (params) => {
    const result = await PoolApi.listChannelMch(params);
    return {
      list: result.list,
      total: result.total,
    };
  },
  columns,
  useSearchForm: true,
  formConfig: {
    schemas: [
      {
        fieldName: 'channelCode',
        label: '通道',
        component: 'Select',
        componentProps: {
          placeholder: '请选择通道',
          allowClear: true,
          options: [
            { label: '微信', value: 'WX_JSAPI' },
            { label: '支付宝', value: 'ALI_QR' },
            { label: '银联', value: 'UNION_QR' },
          ],
        },
      },
      {
        fieldName: 'status',
        label: '状态',
        component: 'Select',
        componentProps: {
          placeholder: '请选择状态',
          allowClear: true,
          options: [
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
            { label: '熔断', value: 2 },
          ],
        },
      },
    ],
  },
  rowKey: 'id',
  bordered: true,
  striped: true,
  size: 'small',
});

const currentMch = ref<any>(null);

const healthDrawer = useDrawer({
  title: '商户健康详情',
  width: 600,
  onClose: () => {
    currentMch.value = null;
  },
});

const [simulateModal, { openModal: openSimulateModal }] = useModal({
  visible: false,
  title: '模拟路由',
  width: 500,
});

const simulateForm = reactive({
  channelCode: 'WX_JSAPI',
  amount: 100,
  bin: '',
  userId: '',
});

function getStatusColor(status: number) {
  const colors: Record<number, string> = {
    0: 'default',
    1: 'success',
    2: 'error',
    3: 'warning',
  };
  return colors[status] || 'default';
}

function getStatusText(status: number) {
  const texts: Record<number, string> = {
    0: '禁用',
    1: '正常',
    2: '熔断',
    3: '维护',
  };
  return texts[status] || '未知';
}

function getCircuitColor(state: number) {
  const colors: Record<number, string> = {
    1: 'success',
    2: 'warning',
    3: 'error',
  };
  return colors[state] || 'default';
}

function getCircuitText(state: number) {
  const texts: Record<number, string> = {
    1: '正常',
    2: '半开',
    3: '打开',
  };
  return texts[state] || '未知';
}

function getSuccessRateColor(rate?: number) {
  if (!rate) return '#52c41a';
  if (rate >= 98) return '#52c41a';
  if (rate >= 95) return '#faad14';
  return '#f5222d';
}

function getQuotaColor(rate?: number) {
  if (!rate) return '#1890ff';
  if (rate >= 90) return '#f5222d';
  if (rate >= 70) return '#faad14';
  return '#1890ff';
}

function formatAmount(amount: number) {
  if (!amount) return '0';
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万';
  }
  return amount.toFixed(2);
}

async function handleRefresh() {
  await reload();
  createMessage.success('刷新成功');
}

function handleViewHealth(record: any) {
  currentMch.value = record;
  healthDrawer.open = true;
}

async function handleSwitch(record: any, action: 'enable' | 'disable' | 'reset') {
  try {
    await PoolApi.switchMerchantStatus(record.mchNo, action);
    createMessage.success('操作成功');
    await reload();
  } catch (error) {
    createMessage.error('操作失败');
  }
}

async function handleWeightChange(record: any) {
  try {
    await PoolApi.updateMerchantConfig(record.id, { weight: record.weight });
    createMessage.success('权重更新成功');
  } catch (error) {
    createMessage.error('更新失败');
  }
}

function handleSimulate() {
  simulateForm.channelCode = 'WX_JSAPI';
  simulateForm.amount = 100;
  simulateForm.bin = '';
  simulateForm.userId = '';
  openSimulateModal(true);
}

async function doSimulate() {
  try {
    const result = await PoolApi.simulateRoute(simulateForm);
    if (result.success) {
      createMessage.success(
        `选中商户: ${result.mchNo}, 原因: ${result.reason}, 耗时: ${result.routeTime}ms`
      );
    } else {
      createMessage.error(result.error || '模拟失败');
    }
    simulateModal.visible = false;
  } catch (error) {
    createMessage.error('模拟失败');
  }
}
</script>

<style scoped>
.pool-channel-mch {
  padding: 16px;
}

.quota-cell {
  font-size: 12px;
}

.quota-sep {
  margin: 0 4px;
  color: #999;
}
</style>
