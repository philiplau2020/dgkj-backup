<template>
  <div class="pool-strategy">
    <a-card title="路由策略配置" size="small">
      <template #extra>
        <a-button type="primary" @click="handleAdd"> 添加策略 </a-button>
      </template>

      <BasicTable @register="registerTable">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-switch
              :checked="record.status === 1"
              @change="(checked) => handleToggleStatus(record, checked)"
            />
          </template>

          <template v-else-if="column.key === 'strategyType'">
            <a-tag>{{ getStrategyTypeText(record.strategyType) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'priority'">
            <a-input-number
              v-model:value="record.priority"
              :min="1"
              :max="999"
              size="small"
              style="width: 60px"
            />
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                编辑
              </a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record)">
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </BasicTable>
    </a-card>

    <!-- 策略编辑弹窗 -->
    <BasicModal
      v-bind="editModal"
      :title="isEdit ? '编辑策略' : '添加策略'"
      @ok="handleSave"
      @cancel="editModal.visible = false"
    >
      <a-form :model="formData" layout="vertical" ref="formRef">
        <a-form-item label="策略编码" required>
          <a-input
            v-model:value="formData.strategyCode"
            placeholder="如: AMOUNT_WECHAT"
            :disabled="isEdit"
          />
        </a-form-item>

        <a-form-item label="策略名称" required>
          <a-input v-model:value="formData.strategyName" placeholder="如: 小额微信优先" />
        </a-form-item>

        <a-form-item label="策略类型" required>
          <a-select v-model:value="formData.strategyType">
            <a-select-option value="amount">金额策略</a-select-option>
            <a-select-option value="time">时段策略</a-select-option>
            <a-select-option value="weekday">星期策略</a-select-option>
            <a-select-option value="bin">BIN策略</a-select-option>
            <a-select-option value="biz_type">业务类型策略</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="匹配条件" required>
          <a-input.TextArea
            v-model:value="formData.conditionsJson"
            placeholder='如: {"min": 0, "max": 1000}'
            :rows="3"
          />
        </a-form-item>

        <a-form-item label="动作类型" required>
          <a-select v-model:value="formData.actionType">
            <a-select-option value="assign_channel">分配通道</a-select-option>
            <a-select-option value="assign_mch">分配商户</a-select-option>
            <a-select-option value="exclude_channel">排除通道</a-select-option>
            <a-select-option value="exclude_mch">排除商户</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="动作值" required>
          <a-input
            v-model:value="formData.actionValue"
            placeholder="如: WX_JSAPI 或 M001,M002"
          />
        </a-form-item>

        <a-form-item label="优先级">
          <a-input-number v-model:value="formData.priority" :min="1" :max="999" />
        </a-form-item>

        <a-form-item label="备注">
          <a-input.TextArea v-model:value="formData.remark" :rows="2" />
        </a-form-item>
      </a-form>
    </BasicModal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { BasicTable, useTable } from '@/components/Table';
import { BasicModal, useModal } from '@/components/Modal';
import { useMessage } from '@/hooks/web/useMessage';

const { createMessage } = useMessage();

// 模拟策略数据
const mockStrategies = [
  {
    id: '1',
    strategyCode: 'AMOUNT_WECHAT',
    strategyName: '小额微信优先',
    strategyType: 'amount',
    conditions: { min: 0, max: 1000 },
    actionType: 'assign_channel',
    actionValue: 'WX_JSAPI',
    priority: 10,
    status: 1,
    remark: '金额小于1000元优先使用微信',
  },
  {
    id: '2',
    strategyCode: 'AMOUNT_UNION',
    strategyName: '大额银联优先',
    strategyType: 'amount',
    conditions: { min: 5000, max: 0 },
    actionType: 'assign_channel',
    actionValue: 'UNION_QR',
    priority: 20,
    status: 1,
    remark: '金额大于5000元优先使用银联',
  },
  {
    id: '3',
    strategyCode: 'NIGHT_ALI',
    strategyName: '夜间支付宝',
    strategyType: 'time',
    conditions: { startHour: 22, endHour: 6 },
    actionType: 'assign_channel',
    actionValue: 'ALI_QR',
    priority: 30,
    status: 1,
    remark: '夜间22:00-06:00使用支付宝',
  },
  {
    id: '4',
    strategyCode: 'VISA_UNION',
    strategyName: 'Visa卡走银联',
    strategyType: 'bin',
    conditions: { prefixes: ['4'], action: 'exclude' },
    actionType: 'assign_channel',
    actionValue: 'UNION_QR',
    priority: 5,
    status: 1,
    remark: 'Visa卡(BIN以4开头)走银联通道',
  },
];

const columns = [
  { title: '策略编码', dataIndex: 'strategyCode', width: 150 },
  { title: '策略名称', dataIndex: 'strategyName', minWidth: 150 },
  { title: '类型', key: 'strategyType', width: 100 },
  { title: '优先级', key: 'priority', width: 80 },
  { title: '条件', dataIndex: 'conditions', minWidth: 150, customRender: ({ text }) => JSON.stringify(text) },
  { title: '动作', dataIndex: 'actionValue', width: 150 },
  { title: '状态', key: 'status', width: 80 },
  { title: '备注', dataIndex: 'remark', minWidth: 150 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
];

const [registerTable, { reload }] = useTable({
  dataSource: mockStrategies,
  columns,
  rowKey: 'id',
  bordered: true,
  striped: true,
  size: 'small',
});

const isEdit = ref(false);
const [editModal, { openModal: openEditModal }] = useModal({
  visible: false,
  title: '编辑策略',
  width: 600,
});

const formData = reactive({
  strategyCode: '',
  strategyName: '',
  strategyType: 'amount',
  conditionsJson: '{}',
  actionType: 'assign_channel',
  actionValue: '',
  priority: 100,
  remark: '',
});

function getStrategyTypeText(type: string) {
  const texts: Record<string, string> = {
    amount: '金额',
    time: '时段',
    weekday: '星期',
    bin: 'BIN',
    biz_type: '业务类型',
  };
  return texts[type] || type;
}

function handleAdd() {
  isEdit.value = false;
  Object.assign(formData, {
    strategyCode: '',
    strategyName: '',
    strategyType: 'amount',
    conditionsJson: '{}',
    actionType: 'assign_channel',
    actionValue: '',
    priority: 100,
    remark: '',
  });
  openEditModal(true);
}

function handleEdit(record: any) {
  isEdit.value = true;
  Object.assign(formData, {
    ...record,
    conditionsJson: JSON.stringify(record.conditions),
  });
  openEditModal(true);
}

async function handleSave() {
  try {
    // TODO: 保存到后端
    console.log('保存策略', formData);
    createMessage.success('保存成功');
    editModal.visible = false;
    await reload();
  } catch (error) {
    createMessage.error('保存失败');
  }
}

async function handleToggleStatus(record: any, checked: boolean) {
  record.status = checked ? 1 : 0;
  createMessage.success(`已${checked ? '启用' : '禁用'}`);
}

async function handleDelete(record: any) {
  // TODO: 删除确认
  createMessage.success('删除成功');
  await reload();
}
</script>

<style scoped>
.pool-strategy {
  padding: 16px;
}
</style>
