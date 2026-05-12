import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('profit_account_group')
export class ProfitAccountGroup {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'group_no', length: 32, unique: true })
  groupNo: string;

  @Column({ name: 'group_name', length: 64 })
  groupName: string;

  @Column({ name: 'agent_no', length: 32, nullable: true })
  agentNo: string;

  @Column({ name: 'mch_no', length: 32, nullable: true })
  mchNo: string;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('profit_receiver')
export class ProfitReceiver {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'receiver_no', length: 32, unique: true })
  receiverNo: string;

  @Column({ name: 'group_no', length: 32 })
  groupNo: string;

  @Column({ name: 'receiver_type', type: 'tinyint' })
  receiverType: number;

  @Column({ name: 'receiver_name', length: 64 })
  receiverName: string;

  @Column({ name: 'receiver_account', length: 32 })
  receiverAccount: string;

  @Column({ name: 'bank_name', length: 64, nullable: true })
  bankName: string;

  @Column({ name: 'profit_ratio', type: 'decimal', precision: 6, scale: 4 })
  profitRatio: number;

  @Column({ name: 'fixed_amount', type: 'decimal', precision: 18, scale: 2, nullable: true })
  fixedAmount: number;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('profit_record')
export class ProfitRecord {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'profit_no', length: 32, unique: true })
  profitNo: string;

  @Column({ name: 'order_no', length: 32 })
  orderNo: string;

  @Column({ name: 'mch_no', length: 32 })
  mchNo: string;

  @Column({ name: 'channel_code', length: 32, nullable: true })
  channelCode: string;

  @Column({ name: 'trade_amount', type: 'decimal', precision: 18, scale: 2 })
  tradeAmount: number;

  @Column({ name: 'profit_amount', type: 'decimal', precision: 18, scale: 2 })
  profitAmount: number;

  @Column({ name: 'profit_type', type: 'tinyint' })
  profitType: number;

  @Column({ name: 'status', type: 'tinyint', default: 0 })
  status: number;

  @Column({ name: 'settle_time', nullable: true })
  settleTime: Date;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;
}

@Entity('profit_rollback')
export class ProfitRollback {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'rollback_no', length: 32, unique: true })
  rollbackNo: string;

  @Column({ name: 'profit_no', length: 32 })
  profitNo: string;

  @Column({ name: 'order_no', length: 32 })
  orderNo: string;

  @Column({ name: 'mch_no', length: 32 })
  mchNo: string;

  @Column({ name: 'receiver_no', length: 32 })
  receiverNo: string;

  @Column({ name: 'receiver_name', length: 64 })
  receiverName: string;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ name: 'rollback_type', type: 'tinyint' })
  rollbackType: number;

  @Column({ name: 'reason', length: 255, nullable: true })
  reason: string;

  @Column({ name: 'status', type: 'tinyint', default: 0 })
  status: number;

  @Column({ name: 'complete_time', nullable: true })
  completeTime: Date;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;
}
