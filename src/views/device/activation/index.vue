<template>
  <div class="device-activation">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="激活码">
          <Input v-model:value="searchForm.code" placeholder="请输入激活码" allow-clear style="width: 160px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchForm.activated" allow-clear style="width: 100px">
            <SelectOption :value="1">已激活</SelectOption>
            <SelectOption :value="0">未激活</SelectOption>
          </Select>
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>

      <div class="table-toolbar">
        <Space>
          <Button type="primary" @click="openAddModal"><PlusOutlined />批量新建</Button>
        </Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1100 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'activated'">
            <Tag :color="record.activated === 1 ? 'green' : 'default'">{{ record.activated === 1 ? '已激活' : '未激活' }}</Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openBindModal(record)">绑定</Button>
              <Button type="link" size="small" @click="handleUnbind(record)" v-if="record.mchNo">解绑</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ code: '', activated: undefined as number | undefined });

const columns = [
  { title: '激活码', dataIndex: 'code', key: 'code', width: 180 },
  { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 120 },
  { title: '厂商', dataIndex: 'factory', key: 'factory', width: 100 },
  { title: '绑定商户', dataIndex: 'mchName', key: 'mchName', width: 130 },
  { title: '代理商', dataIndex: 'agentName', key: 'agentName', width: 100 },
  { title: '状态', key: 'activated', width: 80 },
  { title: '激活时间', dataIndex: 'activatedTime', key: 'activatedTime', width: 170 },
  { title: '有效期至', dataIndex: 'expireTime', key: 'expireTime', width: 170 },
  { title: '操作', key: 'action', width: 120 },
];

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = [
      { id: 1, code: 'ACT2024000001', batchNo: 'BATCH001', factory: '收银插件A', mchNo: 'M10001', mchName: '测试商户001', agentName: '代理商A', activated: 1, activatedTime: '2024-01-05 10:00:00', expireTime: '2025-01-05 10:00:00' },
      { id: 2, code: 'ACT2024000002', batchNo: 'BATCH001', factory: '收银插件A', mchNo: '', mchName: '未绑定', agentName: '代理商A', activated: 0, activatedTime: '-', expireTime: '2025-01-05 10:00:00' },
    ];
    pagination.total = dataSource.value.length;
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.code = ''; searchForm.activated = undefined; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openAddModal() { message.info('批量新建功能开发中'); }
function openBindModal(record: any) { message.info('绑定功能开发中'); }
function handleUnbind(record: any) { message.success('解绑成功'); fetchData(); }

onMounted(() => { fetchData(); });
</script>

<style scoped>
.device-activation { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
