import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('check_batch')
export class CheckBatch {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'batch_no', length: 32, unique: true })
  batchNo: string;

  @Column({ name: 'check_date', type: 'date' })
  checkDate: Date;

  @Column({ name: 'check_type', type: 'tinyint' })
  checkType: number;

  @Column({ name: 'channel_code', length: 32, nullable: true })
  channelCode: string;

  @Column({ name: 'status', type: 'tinyint', default: 0 })
  status: number;

  @Column({ name: 'total_count', type: 'int', default: 0 })
  totalCount: number;

  @Column({ name: 'success_count', type: 'int', default: 0 })
  successCount: number;

  @Column({ name: 'fail_count', type: 'int', default: 0 })
  failCount: number;

  @Column({ name: 'diff_count', type: 'int', default: 0 })
  diffCount: number;

  @Column({ name: 'complete_time', nullable: true })
  completeTime: Date;

  @Column({ name: 'remark', length: 255, nullable: true })
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

  @Column({ name: 'bill_no', length: 64, unique: true })
  billNo: string;

  @Column({ name: 'batch_no', length: 32 })
  batchNo: string;

  @Column({ name: 'channel_code', length: 32 })
  channelCode: string;

  @Column({ name: 'channel_order_no', length: 64 })
  channelOrderNo: string;

  @Column({ name: 'mch_no', length: 32, nullable: true })
  mchNo: string;

  @Column({ name: 'order_no', length: 64, nullable: true })
  orderNo: string;

  @Column({ name: 'pay_type', length: 32 })
  payType: string;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ name: 'fee', type: 'decimal', precision: 18, scale: 2, default: 0 })
  fee: number;

  @Column({ name: 'status', type: 'tinyint' })
  status: number;

  @Column({ name: 'trade_time', nullable: true })
  tradeTime: Date;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;
}

@Entity('check_diff_bill')
export class CheckDiffBill {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'diff_no', length: 32, unique: true })
  diffNo: string;

  @Column({ name: 'batch_no', length: 32 })
  batchNo: string;

  @Column({ name: 'channel_code', length: 32 })
  channelCode: string;

  @Column({ name: 'diff_type', type: 'tinyint' })
  diffType: number;

  @Column({ name: 'channel_order_no', length: 64, nullable: true })
  channelOrderNo: string;

  @Column({ name: 'order_no', length: 64, nullable: true })
  orderNo: string;

  @Column({ name: 'mch_no', length: 32, nullable: true })
  mchNo: string;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ name: 'channel_amount', type: 'decimal', precision: 18, scale: 2, nullable: true })
  channelAmount: number;

  @Column({ name: 'platform_amount', type: 'decimal', precision: 18, scale: 2, nullable: true })
  platformAmount: number;

  @Column({ name: 'diff_amount', type: 'decimal', precision: 18, scale: 2 })
  diffAmount: number;

  @Column({ name: 'status', type: 'tinyint', default: 0 })
  status: number;

  @Column({ name: 'handle_remark', length: 255, nullable: true })
  handleRemark: string;

  @Column({ name: 'handle_time', nullable: true })
  handleTime: Date;

  @Column({ name: 'handle_user_id', length: 64, nullable: true })
  handleUserId: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}
