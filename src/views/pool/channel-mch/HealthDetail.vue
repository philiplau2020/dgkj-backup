<template>
  <div class="health-detail">
    <!-- 基本信息 -->
    <a-descriptions title="商户信息" :column="2" size="small" bordered>
      <a-descriptions-item label="商户号">{{ health?.mchNo || '-' }}</a-descriptions-item>
      <a-descriptions-item label="通道编码">{{ health?.channelCode || '-' }}</a-descriptions-item>
      <a-descriptions-item label="商户名称">{{ health?.mchNo }}</a-descriptions-item>
      <a-descriptions-item label="统计日期">{{ health?.date || '-' }}</a-descriptions-item>
    </a-descriptions>

    <!-- 健康状态 -->
    <a-card title="健康状态" size="small" style="margin-top: 16px">
      <a-row :gutter="16">
        <a-col :span="6">
          <div class="stat-item">
            <div class="stat-value" :style="{ color: getStatusColor(health?.status) }">
              {{ getStatusText(health?.status) }}
            </div>
            <div class="stat-label">健康状态</div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-item">
            <div class="stat-value" :style="{ color: getSuccessRateColor(health?.successRate) }">
              {{ health?.successRate?.toFixed(2) || '100' }}%
            </div>
            <div class="stat-label">成功率</div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ health?.totalCount || 0 }}</div>
            <div class="stat-label">总交易笔数</div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ health?.consecutiveFails || 0 }}</div>
            <div class="stat-label">连续失败</div>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <!-- 熔断状态 -->
    <a-card title="熔断器状态" size="small" style="margin-top: 16px">
      <a-descriptions :column="2" size="small">
        <a-descriptions-item label="熔断状态">
          <a-tag :color="getCircuitColor(circuit?.state)">
            {{ getCircuitText(circuit?.state) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="是否健康">
          <a-tag :color="circuit?.isHealthy ? 'success' : 'error'">
            {{ circuit?.isHealthy ? '是' : '否' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="熔断打开时间">
          {{ health?.circuitOpenedAt || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="可恢复">
          <a-tag :color="circuit?.canRecover ? 'success' : 'default'">
            {{ circuit?.canRecover ? '是' : '否' }}
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>

      <a-space style="margin-top: 16px">
        <a-button
          type="primary"
          size="small"
          @click="handleResetCircuit"
        >
          重置熔断器
        </a-button>
      </a-space>
    </a-card>

    <!-- 延迟分布 -->
    <a-card title="延迟分布 (ms)" size="small" style="margin-top: 16px">
      <a-row :gutter="16">
        <a-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ latency?.avg || 0 }}</div>
            <div class="stat-label">平均延迟</div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ latency?.p50 || 0 }}</div>
            <div class="stat-label">P50</div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ latency?.p95 || 0 }}</div>
            <div class="stat-label">P95</div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ latency?.p99 || 0 }}</div>
            <div class="stat-label">P99</div>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <!-- 配额使用 -->
    <a-card title="配额使用" size="small" style="margin-top: 16px">
      <a-row :gutter="16">
        <a-col :span="8">
          <div class="stat-item">
            <div class="stat-value">{{ formatAmount(quota?.dailyUsed || 0) }}</div>
            <div class="stat-label">日已用</div>
          </div>
        </a-col>
        <a-col :span="8">
          <div class="stat-item">
            <div class="stat-value">{{ formatAmount(quota?.dailyLimit || 0) }}</div>
            <div class="stat-label">日限额</div>
          </div>
        </a-col>
        <a-col :span="8">
          <div class="stat-item">
            <div class="stat-value" :style="{ color: getQuotaUsageRate() >= 90 ? '#f5222d' : '#52c41a' }">
              {{ getQuotaUsageRate().toFixed(1) }}%
            </div>
            <div class="stat-label">使用率</div>
          </div>
        </a-col>
      </a-row>

      <a-progress
        :percent="getQuotaUsageRate()"
        :stroke-color="getQuotaUsageRate() >= 90 ? '#f5222d' : getQuotaUsageRate() >= 70 ? '#faad14' : '#1890ff'"
        style="margin-top: 16px"
      />
    </a-card>

    <!-- 操作记录 -->
    <a-card title="最近记录" size="small" style="margin-top: 16px">
      <a-descriptions :column="2" size="small">
        <a-descriptions-item label="最后成功时间">
          {{ health?.lastSuccessTime || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="最后失败时间">
          {{ health?.lastFailTime || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="成功笔数">
          {{ health?.successCount || 0 }}
        </a-descriptions-item>
        <a-descriptions-item label="失败笔数">
          {{ health?.failCount || 0 }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 重置按钮 -->
    <a-space style="margin-top: 16px">
      <a-button danger @click="handleResetAll"> 重置所有统计 </a-button>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { PoolApi } from '@/api/pool';
import { useMessage } from '@/hooks/web/useMessage';

const props = defineProps<{
  mchNo?: string;
  channelCode?: string;
}>();

const { createMessage } = useMessage();

const health = ref<any>(null);
const quota = ref<any>(null);
const circuit = ref<any>(null);
const latency = ref<any>(null);

async function loadData() {
  if (!props.mchNo || !props.channelCode) return;

  try {
    const result = await PoolApi.getMerchantHealth(props.channelCode, props.mchNo);
    health.value = result.health;
    quota.value = result.quota;
    circuit.value = result.circuit;
    latency.value = result.latencyDistribution;
  } catch (error) {
    console.error('加载失败', error);
  }
}

onMounted(loadData);

watch(() => [props.mchNo, props.channelCode], loadData);

function getStatusColor(status?: string) {
  const colors: Record<string, string> = {
    healthy: '#52c41a',
    warning: '#faad14',
    critical: '#f5222d',
    down: '#f5222d',
  };
  return colors[status || ''] || '#999';
}

function getStatusText(status?: string) {
  const texts: Record<string, string> = {
    healthy: '健康',
    warning: '警告',
    critical: '危险',
    down: '宕机',
  };
  return texts[status || ''] || '未知';
}

function getCircuitColor(state?: number) {
  const colors: Record<number, string> = {
    1: 'success',
    2: 'warning',
    3: 'error',
  };
  return colors[state || 1] || 'default';
}

function getCircuitText(state?: number) {
  const texts: Record<number, string> = {
    1: '关闭',
    2: '半开',
    3: '打开',
  };
  return texts[state || 1] || '未知';
}

function getSuccessRateColor(rate?: number) {
  if (!rate) return '#52c41a';
  if (rate >= 98) return '#52c41a';
  if (rate >= 95) return '#faad14';
  return '#f5222d';
}

function formatAmount(amount: number) {
  if (!amount) return '0';
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万';
  }
  return amount.toFixed(2);
}

function getQuotaUsageRate() {
  if (!quota.value || !quota.value.dailyLimit) return 0;
  return (quota.value.dailyUsed / quota.value.dailyLimit) * 100;
}

async function handleResetCircuit() {
  if (!props.mchNo) return;
  try {
    await PoolApi.resetCircuitBreaker(props.mchNo);
    createMessage.success('重置成功');
    await loadData();
  } catch (error) {
    createMessage.error('重置失败');
  }
}

async function handleResetAll() {
  if (!props.mchNo || !props.channelCode) return;
  try {
    await PoolApi.resetMerchantStats(props.channelCode, props.mchNo);
    createMessage.success('重置成功');
    await loadData();
  } catch (error) {
    createMessage.error('重置失败');
  }
}
</script>

<style scoped>
.health-detail {
  padding: 16px;
}

.stat-item {
  text-align: center;
  padding: 8px 0;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
