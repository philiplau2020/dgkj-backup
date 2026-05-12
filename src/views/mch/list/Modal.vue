<template>
  <BasicModal v-bind="$attrs" @register="register" title="商户详情" width="800px">
    <Description :column="2" :data="record" :schema="schema" />
  </BasicModal>
</template>

<script setup lang="ts">
import { useModal } from '@/components/Modal';
import { Description } from '@/components/Description';

const [register] = useModal();

const record = ref<any>({});

const schema = [
  { field: 'mchNo', label: '商户号' },
  { field: 'mchName', label: '商户名称' },
  { field: 'mchType', label: '商户类型' },
  { field: 'contactName', label: '联系人' },
  { field: 'contactMobile', label: '联系电话' },
  { field: 'contactEmail', label: '邮箱' },
  { field: 'balance', label: '账户余额' },
  { field: 'rate', label: '费率' },
  { field: 'createdAt', label: '创建时间' },
];
</script>
