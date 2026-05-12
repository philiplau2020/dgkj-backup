/**
 * 商户列表 - 表格配置
 */
import { h } from 'vue';
import { optionsListApi } from '@/api/demo/select';
import { descItem } from '@/components/Table';
import { FormSchema } from '@/components/Form';

export const columns = [
  {
    title: '商户号',
    dataIndex: 'mchNo',
    width: 120,
  },
  {
    title: '商户名称',
    dataIndex: 'mchName',
    width: 200,
  },
  {
    title: '商户类型',
    dataIndex: 'mchType',
    width: 100,
  },
  {
    title: '联系人',
    dataIndex: 'contactName',
    width: 100,
  },
  {
    title: '联系电话',
    dataIndex: 'contactMobile',
    width: 120,
  },
  {
    title: '账户余额',
    dataIndex: 'balance',
    width: 120,
  },
  {
    title: '审核状态',
    dataIndex: 'auditStatus',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    width: 180,
  },
];

export const searchSchema: FormSchema[] = [
  {
    field: 'mchNo',
    label: '商户号',
    component: 'Input',
    colProps: { span: 6 },
  },
  {
    field: 'mchName',
    label: '商户名称',
    component: 'Input',
    colProps: { span: 6 },
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      options: [
        { label: '待审核', value: 0 },
        { label: '正常', value: 1 },
        { label: '冻结', value: 2 },
      ],
    },
    colProps: { span: 6 },
  },
  {
    field: 'auditStatus',
    label: '审核状态',
    component: 'Select',
    componentProps: {
      options: [
        { label: '待审核', value: 0 },
        { label: '已通过', value: 1 },
        { label: '已拒绝', value: 2 },
      ],
    },
    colProps: { span: 6 },
  },
];

export const formSchema: FormSchema[] = [
  {
    field: 'mchName',
    label: '商户名称',
    component: 'Input',
    required: true,
  },
  {
    field: 'mchType',
    label: '商户类型',
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '企业', value: 2 },
        { label: '个人', value: 1 },
      ],
    },
  },
  {
    field: 'contactName',
    label: '联系人',
    component: 'Input',
    required: true,
  },
  {
    field: 'contactMobile',
    label: '联系电话',
    component: 'Input',
    required: true,
  },
  {
    field: 'contactEmail',
    label: '邮箱',
    component: 'Input',
  },
  {
    field: 'rate',
    label: '费率',
    component: 'InputNumber',
    componentProps: { min: 0, max: 1, step: 0.0001 },
  },
];
