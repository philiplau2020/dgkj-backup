<template>
  <div class="mch-store">
    <Card>
      <Form layout="inline" :model="searchForm" class="search-form">
        <FormItem label="商户">
          <Select v-model:value="searchForm.mchNo" placeholder="请选择商户" allow-clear show-search style="width: 180px">
            <SelectOption v-for="item in mchList" :key="item.mchNo" :value="item.mchNo">{{ item.mchName }}</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="门店名称">
          <Input v-model:value="searchForm.storeName" placeholder="请输入门店名称" allow-clear style="width: 150px" />
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
          <Button type="primary" @click="openAddModal">
            <template #icon><PlusOutlined /></template>
            新建门店
          </Button>
          <Button @click="handleExport">导出</Button>
        </Space>
      </div>

      <Table :data-source="dataSource" :columns="columns" :loading="loading" :pagination="pagination" @change="handleTableChange" row-key="id" :scroll="{ x: 1100 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'isDefault'">
            <Tag :color="record.isDefault === 1 ? 'green' : 'default'">{{ record.isDefault === 1 ? '默认' : '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'green' : 'default'">{{ record.status === 1 ? '正常' : '停用' }}</Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openEditModal(record)">编辑</Button>
              <Button type="link" size="small" @click="openDetailModal(record)">详情</Button>
              <Dropdown>
                <Button type="link" size="small">更多</Button>
                <template #overlay>
                  <Menu @click="({ key }) => handleMenuClick(key, record)">
                    <MenuItem key="setDefault" v-if="record.isDefault !== 1">设为默认</MenuItem>
                    <MenuItem key="delete" danger>删除</MenuItem>
                  </Menu>
                </template>
              </Dropdown>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="formVisible" :title="formMode === 'add' ? '新建门店' : '编辑门店'" width="550px" @ok="handleFormSubmit">
      <Form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }" :rules="formRules">
        <FormItem label="所属商户" name="mchNo">
          <Select v-model:value="formData.mchNo" placeholder="请选择商户" show-search>
            <SelectOption v-for="item in mchList" :key="item.mchNo" :value="item.mchNo">{{ item.mchName }}</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="门店名称" name="storeName">
          <Input v-model:value="formData.storeName" placeholder="请输入门店名称" />
        </FormItem>
        <FormItem label="门店编号" name="storeId">
          <Input v-model:value="formData.storeId" placeholder="请输入门店编号" />
        </FormItem>
        <FormItem label="联系人">
          <Input v-model:value="formData.contactName" placeholder="请输入联系人" />
        </FormItem>
        <FormItem label="联系电话">
          <Input v-model:value="formData.contactMobile" placeholder="请输入联系电话" />
        </FormItem>
        <FormItem label="门店地址">
          <Input v-model:value="formData.address" placeholder="请输入门店地址" />
        </FormItem>
        <FormItem label="备注">
          <Textarea v-model:value="formData.remark" :rows="2" placeholder="请输入备注" />
        </FormItem>
      </Form>
    </Modal>

    <Modal v-model:open="detailVisible" title="门店详情" width="550px" :footer="null">
      <Descriptions :column="2" bordered v-if="currentStore">
        <DescriptionsItem label="门店编号" :span="2">{{ currentStore.storeId }}</DescriptionsItem>
        <DescriptionsItem label="所属商户">{{ currentStore.mchName }}</DescriptionsItem>
        <DescriptionsItem label="门店名称">{{ currentStore.storeName }}</DescriptionsItem>
        <DescriptionsItem label="联系人">{{ currentStore.contactName }}</DescriptionsItem>
        <DescriptionsItem label="联系电话">{{ currentStore.contactMobile }}</DescriptionsItem>
        <DescriptionsItem label="门店地址" :span="2">{{ currentStore.address }}</DescriptionsItem>
        <DescriptionsItem label="是否默认">
          <Tag :color="currentStore.isDefault === 1 ? 'green' : 'default'">{{ currentStore.isDefault === 1 ? '默认门店' : '-' }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Tag :color="currentStore.status === 1 ? 'green' : 'default'">{{ currentStore.status === 1 ? '正常' : '停用' }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ currentStore.createdAt }}</DescriptionsItem>
      </Descriptions>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Form, FormItem, Input, Select, SelectOption, Button, Space, Tag, Dropdown, Menu, MenuItem, Modal, Descriptions, DescriptionsItem, Textarea } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { defHttp } from '@/utils/http/axios';
import { getMchList } from '@/api/mch/merchant';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const searchForm = reactive({ mchNo: undefined as string | undefined, storeName: '' });
const mchList = ref<any[]>([]);

const columns = [
  { title: '门店编号', dataIndex: 'storeId', key: 'storeId', width: 120 },
  { title: '门店名称', dataIndex: 'storeName', key: 'storeName', width: 150 },
  { title: '所属商户', dataIndex: 'mchName', key: 'mchName', width: 150 },
  { title: '联系人', dataIndex: 'contactName', key: 'contactName', width: 100 },
  { title: '联系电话', dataIndex: 'contactMobile', key: 'contactMobile', width: 130 },
  { title: '默认', key: 'isDefault', width: 80 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formData = reactive({ mchNo: '', mchName: '', storeId: '', storeName: '', contactName: '', contactMobile: '', address: '', remark: '' });
const formRules = { mchNo: [{ required: true, message: '请选择商户' }], storeName: [{ required: true, message: '请输入门店名称' }] };

const currentStore = ref<any>(null);
const detailVisible = ref(false);

async function fetchMchList() {
  try {
    const res = await getMchList({ page: 1, pageSize: 100 });
    const data = res?.data || res;
    mchList.value = data?.list || [];
  } catch (e) {
    console.error('获取商户列表失败', e);
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = { page: pagination.current, pageSize: pagination.pageSize };
    if (searchForm.mchNo) params.mchNo = searchForm.mchNo;
    if (searchForm.storeName) params.storeName = searchForm.storeName;
    
    const res = await defHttp.get({ url: '/basic-api/mch/store/list', params });
    const data = res?.data || res;
    dataSource.value = data?.list || [];
    pagination.total = data?.total || 0;
  } catch (error) {
    console.error('获取门店列表失败', error);
    dataSource.value = [];
  } finally { loading.value = false; }
}

function handleSearch() { pagination.current = 1; fetchData(); }
function handleReset() { searchForm.mchNo = undefined; searchForm.storeName = ''; fetchData(); }
function handleTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchData(); }
function openAddModal() { formMode.value = 'add'; Object.assign(formData, { mchNo: '', mchName: '', storeId: '', storeName: '', contactName: '', contactMobile: '', address: '', remark: '' }); formVisible.value = true; }
function openEditModal(record: any) { formMode.value = 'edit'; Object.assign(formData, record); formVisible.value = true; }
function openDetailModal(record: any) { currentStore.value = record; detailVisible.value = true; }
async function handleFormSubmit() {
  try {
    if (formMode.value === 'add') {
      await defHttp.post({ url: '/basic-api/mch/store', params: formData });
    } else {
      await defHttp.put({ url: `/basic-api/mch/store/${formData.id}`, params: formData });
    }
    message.success(formMode.value === 'add' ? '创建成功' : '更新成功');
    formVisible.value = false;
    fetchData();
  } catch (e) {
    message.error('操作失败');
  }
}
function handleMenuClick(key: string, record: any) {
  if (key === 'setDefault') { message.success('设置成功'); fetchData(); }
  else if (key === 'delete') { message.warning('删除需要确认'); }
}
function handleExport() { message.info('导出功能开发中'); }

onMounted(() => { fetchMchList(); fetchData(); });
</script>

<style scoped>
.mch-store { padding: 16px; background: #f0f2f5; }
.search-form { margin-bottom: 16px; }
.table-toolbar { margin-bottom: 16px; }
</style>
