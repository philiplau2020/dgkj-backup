import { Entity, Column, PrimaryColumn } from 'typeorm';

/** 对账批次状态 */
export enum CheckBatchStatus {
  PROCESSING = 0,     // 处理中
  SUCCESS = 1,       // 成功
  DIFF_FOUND = 2,    // 有差异
  FAILED = 3,        // 失败
}

@Entity('check_batch')
export class CheckBatch {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'batch_no', length: 32, unique: true })
  batchNo: string;

  @Column({ name: 'check_date', length: 8 })
  checkDate: string;

  @Column({ name: 'channel_code', length: 32, default: '' })
  channelCode: string;

  @Column({ name: 'channel_name', length: 100, nullable: true })
  channelName: string;

  @Column({ name: 'platform_order_count', type: 'int', default: 0 })
  platformOrderCount: number;

  @Column({ name: 'platform_total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  platformTotalAmount: number;

  @Column({ name: 'channel_order_count', type: 'int', default: 0 })
  channelOrderCount: number;

  @Column({ name: 'channel_total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  channelTotalAmount: number;

  @Column({ name: 'diff_order_count', type: 'int', default: 0 })
  diffOrderCount: number;

  @Column({ name: 'diff_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  diffAmount: number;

  @Column({ name: 'status', type: 'tinyint', default: 0 })
  status: CheckBatchStatus;

  @Column({ name: 'complete_time', nullable: true })
  completeTime: Date;

  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('check_channel_bill')
export class CheckChannelBill {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'batch_no', length: 32 })
  batchNo: string;

  @Column({ name: 'channel_code', length: 32 })
  channelCode: string;

  @Column({ name: 'order_no', length: 64 })
  orderNo: string;

  @Column({ name: 'channel_order_no', length: 100, nullable: true })
  channelOrderNo: string;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ name: 'fee', type: 'decimal', precision: 18, scale: 2, default: 0 })
  fee: number;

  @Column({ name: 'status', length: 20 })
  status: string;

  @Column({ name: 'create_time' })
  createTime: Date;
}

@Entity('check_diff_bill')
export class CheckDiffBill {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'batch_no', length: 32 })
  batchNo: string;

  @Column({ name: 'order_no', length: 64 })
  orderNo: string;

  @Column({ name: 'channel_order_no', length: 100, nullable: true })
  channelOrderNo: string;

  @Column({ name: 'diff_type', type: 'tinyint' })
  diffType: number;

  @Column({ name: 'platform_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  platformAmount: number;

  @Column({ name: 'channel_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  channelAmount: number;

  @Column({ name: 'diff_amount', type: 'decimal', precision: 18, scale: 2 })
  diffAmount: number;

  @Column({ name: 'platform_status', length: 20, default: '' })
  platformStatus: string;

  @Column({ name: 'channel_status', length: 20, default: '' })
  channelStatus: string;

  @Column({ name: 'handle_status', type: 'tinyint', default: 0 })
  handleStatus: number;

  @Column({ name: 'handle_remark', length: 255, nullable: true })
  handleRemark: string;

  @Column({ name: 'handle_time', nullable: true })
  handleTime: Date;

  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}
