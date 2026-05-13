<template>
  <div class="pool-monitor">
    <!-- 概览卡片 -->
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="6">
        <a-card size="small">
          <a-statistic
            title="商户总数"
            :value="overview?.health?.total || 0"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card size="small">
          <a-statistic
            title="健康商户"
            :value="overview?.health?.healthy || 0"
            :value-style="{ color: '#52c41a' }"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card size="small">
          <a-statistic
            title="熔断中"
            :value="overview?.circuit?.open || 0"
            :value-style="{ color: '#f5222d' }"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card size="small">
          <a-statistic
            title="日配额使用率"
            :value="overview?.quota?.quotaUsageRate || 0"
            suffix="%"
            :precision="1"
            :value-style="{ color: getQuotaColor(overview?.quota?.quotaUsageRate) }"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- 健康状态分布 -->
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="12">
        <a-card title="健康状态分布" size="small">
          <div class="status-chart">
            <a-progress
              type="circle"
              :percent="getHealthPercent('healthy')"
              :stroke-color="'#52c41a'"
            >
              <template #format>健康</template>
            </a-progress>
            <a-progress
              type="circle"
              :percent="getHealthPercent('warning')"
              :stroke-color="'#faad14'"
            >
              <template #format>警告</template>
            </a-progress>
            <a-progress
              type="circle"
              :percent="getHealthPercent('critical')"
              :stroke-color="'#f5222d'"
            >
              <template #format>危险</template>
            </a-progress>
          </div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="熔断状态分布" size="small">
          <div class="status-chart">
            <a-progress
              type="circle"
              :percent="getCircuitPercent('closed')"
              :stroke-color="'#52c41a'"
            >
              <template #format>关闭</template>
            </a-progress>
            <a-progress
              type="circle"
              :percent="getCircuitPercent('halfOpen')"
              :stroke-color="'#faad14'"
            >
              <template #format>半开</template>
            </a-progress>
            <a-progress
              type="circle"
              :percent="getCircuitPercent('open')"
              :stroke-color="'#f5222d'"
            >
              <template #format>打开</template>
            </a-progress>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 商户列表 -->
    <a-card title="通道商户状态" size="small">
      <BasicTable @register="registerTable">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'successRate'">
            <a-progress
              :percent="record.successRate || 100"
              :stroke-color="getSuccessRateColor(record.successRate)"
              size="small"
              :format="(p) => p?.toFixed(1) + '%'"
            />
          </template>

          <template v-else-if="column.key === 'circuitState'">
            <a-tag
              :color="getCircuitColor(record.circuitState)"
              size="small"
            >
              {{ getCircuitText(record.circuitState) }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'quotaUsage'">
            <a-progress
              :percent="record.dailyQuotaUsageRate || 0"
              :stroke-color="getQuotaColor(record.dailyQuotaUsageRate)"
              size="small"
              :format="(p) => (p || 0).toFixed(0) + '%'"
            />
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleView(record)">
                详情
              </a-button>
              <a-button
                type="link"
                size="small"
                danger
                @click="handleReset(record)"
              >
                重置
              </a-button>
            </a-space>
          </template>
        </template>
      </BasicTable>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { BasicTable, useTable } from '@/components/Table';
import { PoolApi, PoolOverview } from '@/api/pool';
import { useMessage } from '@/hooks/web/useMessage';

const { createMessage } = useMessage();

const overview = ref<PoolOverview | null>(null);

const columns = [
  { title: '商户号', dataIndex: 'mchNo', width: 120 },
  { title: '商户名称', dataIndex: 'mchName', minWidth: 150 },
  { title: '通道', dataIndex: 'channelCode', width: 100 },
  { title: '成功率', key: 'successRate', width: 120 },
  { title: '熔断', key: 'circuitState', width: 80 },
  { title: '配额使用', key: 'quotaUsage', width: 120 },
  { title: '权重', dataIndex: 'weight', width: 80 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
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
    ],
  },
  rowKey: 'id',
  bordered: true,
  striped: true,
  size: 'small',
});

async function loadOverview() {
  try {
    overview.value = await PoolApi.getPoolOverview();
  } catch (error) {
    console.error('加载概览失败', error);
  }
}

onMounted(() => {
  loadOverview();
});

function getHealthPercent(type: 'healthy' | 'warning' | 'critical' | 'down') {
  const total = overview.value?.health?.total || 1;
  const map: Record<string, string> = {
    healthy: 'healthy',
    warning: 'warning',
    critical: 'critical',
    down: 'down',
  };
  const count = overview.value?.health?.[map[type]] || 0;
  return Math.round((count / total) * 100);
}

function getCircuitPercent(type: 'closed' | 'halfOpen' | 'open') {
  const total = overview.value?.circuit?.total || 1;
  const map: Record<string, string> = {
    closed: 'closed',
    halfOpen: 'halfOpen',
    open: 'open',
  };
  const count = overview.value?.circuit?.[map[type]] || 0;
  return Math.round((count / total) * 100);
}

function getSuccessRateColor(rate?: number) {
  if (!rate) return '#52c41a';
  if (rate >= 98) return '#52c41a';
  if (rate >= 95) return '#faad14';
  return '#f5222d';
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
    1: '正常',
    2: '半开',
    3: '熔断',
  };
  return texts[state || 1] || '未知';
}

function getQuotaColor(rate?: number) {
  if (!rate) return '#1890ff';
  if (rate >= 90) return '#f5222d';
  if (rate >= 70) return '#faad14';
  return '#1890ff';
}

function handleView(record: any) {
  // 跳转到详情页
  console.log('查看详情', record);
}

async function handleReset(record: any) {
  try {
    await PoolApi.resetMerchantStats(record.channelCode, record.mchNo);
    createMessage.success('重置成功');
    await reload();
    await loadOverview();
  } catch (error) {
    createMessage.error('重置失败');
  }
}
</script>

<style scoped>
.pool-monitor {
  padding: 16px;
}

.status-chart {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 16px 0;
}
</style>
