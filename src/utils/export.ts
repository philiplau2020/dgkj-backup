/**
 * 数据导出工具
 */
import { jsonToSheetXlsx } from '@/components/Excel';
import type { JsonToSheet } from '@/components/Excel/src/typing';

export interface ExportColumn {
  title: string;
  dataIndex: string;
  /** 自定义转换函数 */
  formatter?: (value: any, record: any) => string;
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
}

/**
 * 通用数据导出函数
 * @param data 数据源
 * @param columns 列配置
 * @param options 导出选项
 */
export function exportToExcel<T = any>(
  data: T[],
  columns: ExportColumn[],
  options: ExportOptions = { filename: 'export.xlsx' }
) {
  const { filename, sheetName = 'Sheet1' } = options;

  // 转换数据
  const exportData = data.map((record: any) => {
    const row: Record<string, any> = {};
    columns.forEach((col) => {
      const value = record[col.dataIndex];
      row[col.title] = col.formatter ? col.formatter(value, record) : value;
    });
    return row;
  });

  // 生成表头
  const header: Record<string, string> = {};
  columns.forEach((col) => {
    header[col.title] = col.title;
  });

  jsonToSheetXlsx({
    data: exportData,
    header,
    filename,
    sheetName,
  });
}

/**
 * 导出商户列表
 */
export function exportMchList(data: any[]) {
  const columns: ExportColumn[] = [
    { title: '商户号', dataIndex: 'mchNo' },
    { title: '商户名称', dataIndex: 'mchName' },
    { 
      title: '商户类型', 
      dataIndex: 'mchType',
      formatter: (v) => v === 1 ? '个人' : '企业',
    },
    { title: '联系人', dataIndex: 'contactName' },
    { title: '联系电话', dataIndex: 'contactPhone' },
    { 
      title: '状态', 
      dataIndex: 'status',
      formatter: (v) => ({ 0: '待审核', 1: '正常', 2: '冻结' }[v] || '未知'),
    },
    { title: '创建时间', dataIndex: 'createTime' },
  ];

  exportToExcel(data, columns, { filename: `商户列表_${formatDate(new Date())}.xlsx` });
}

/**
 * 导出订单列表
 */
export function exportOrderList(data: any[]) {
  const columns: ExportColumn[] = [
    { title: '订单号', dataIndex: 'orderNo' },
    { title: '商户号', dataIndex: 'mchNo' },
    { title: '支付方式', dataIndex: 'payType' },
    { 
      title: '订单金额', 
      dataIndex: 'amount',
      formatter: (v) => `¥${v}`,
    },
    { 
      title: '实际金额', 
      dataIndex: 'actualAmount',
      formatter: (v) => `¥${v}`,
    },
    { 
      title: '订单状态', 
      dataIndex: 'status',
      formatter: (v) => ({ 0: '待支付', 1: '已支付', 2: '支付中', 3: '已关闭', 4: '已退款' }[v] || '未知'),
    },
    { title: '创建时间', dataIndex: 'createTime' },
  ];

  exportToExcel(data, columns, { filename: `订单列表_${formatDate(new Date())}.xlsx` });
}

/**
 * 导出交易统计
 */
export function exportTradeStats(data: any[]) {
  const columns: ExportColumn[] = [
    { title: '日期', dataIndex: 'date' },
    { 
      title: '交易笔数', 
      dataIndex: 'count',
      formatter: (v) => `${v}笔`,
    },
    { 
      title: '交易金额', 
      dataIndex: 'amount',
      formatter: (v) => `¥${v}`,
    },
    { 
      title: '退款笔数', 
      dataIndex: 'refundCount',
      formatter: (v) => `${v}笔`,
    },
    { 
      title: '退款金额', 
      dataIndex: 'refundAmount',
      formatter: (v) => `¥${v}`,
    },
    { 
      title: '成功率', 
      dataIndex: 'successRate',
      formatter: (v) => `${(v * 100).toFixed(2)}%`,
    },
  ];

  exportToExcel(data, columns, { filename: `交易统计_${formatDate(new Date())}.xlsx` });
}

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 格式化金额
 */
export function formatAmount(amount: number, precision = 2): string {
  return `¥${amount.toFixed(precision)}`;
}

/**
 * 状态映射
 */
export const statusMaps = {
  mchStatus: {
    0: { text: '待审核', color: 'orange' },
    1: { text: '正常', color: 'green' },
    2: { text: '冻结', color: 'red' },
  },
  orderStatus: {
    0: { text: '待支付', color: 'default' },
    1: { text: '已支付', color: 'success' },
    2: { text: '支付中', color: 'processing' },
    3: { text: '已关闭', color: 'default' },
    4: { text: '已退款', color: 'warning' },
  },
  agentStatus: {
    0: { text: '待审核', color: 'orange' },
    1: { text: '正常', color: 'green' },
    2: { text: '冻结', color: 'red' },
  },
  withdrawStatus: {
    0: { text: '待处理', color: 'orange' },
    1: { text: '处理中', color: 'processing' },
    2: { text: '已成功', color: 'success' },
    3: { text: '已失败', color: 'error' },
  },
};
