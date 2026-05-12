import { Entity, Column, PrimaryColumn } from 'typeorm';

export enum StatisticsPeriod {
  DAILY = 1,
  WEEKLY = 2,
  MONTHLY = 3,
}

@Entity('stat_trade')
export class StatTrade {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'stat_date', type: 'date' })
  statDate: Date;

  @Column({ name: 'stat_type', type: 'tinyint' })
  statType: StatisticsPeriod;

  @Column({ name: 'mch_no', length: 32, nullable: true })
  mchNo: string;

  @Column({ name: 'agent_no', length: 32, nullable: true })
  agentNo: string;

  @Column({ name: 'channel_code', length: 32, nullable: true })
  channelCode: string;

  @Column({ name: 'pay_type', length: 32, nullable: true })
  payType: string;

  @Column({ name: 'total_count', type: 'int', default: 0 })
  totalCount: number;

  @Column({ name: 'success_count', type: 'int', default: 0 })
  successCount: number;

  @Column({ name: 'fail_count', type: 'int', default: 0 })
  failCount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'success_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  successAmount: number;

  @Column({ name: 'fail_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  failAmount: number;

  @Column({ name: 'refund_count', type: 'int', default: 0 })
  refundCount: number;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ name: 'fee_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  feeAmount: number;

  @Column({ name: 'profit_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  profitAmount: number;

  @Column({ name: 'create_time' })
  createTime: Date;
}

@Entity('stat_mch')
export class StatMch {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'stat_date', type: 'date' })
  statDate: Date;

  @Column({ name: 'mch_no', length: 32 })
  mchNo: string;

  @Column({ name: 'mch_name', length: 128 })
  mchName: string;

  @Column({ name: 'agent_no', length: 32, nullable: true })
  agentNo: string;

  @Column({ name: 'total_count', type: 'int', default: 0 })
  totalCount: number;

  @Column({ name: 'success_count', type: 'int', default: 0 })
  successCount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'success_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  successAmount: number;

  @Column({ name: 'fee_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  feeAmount: number;

  @Column({ name: 'refund_count', type: 'int', default: 0 })
  refundCount: number;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ name: 'create_time' })
  createTime: Date;
}

@Entity('stat_agent')
export class StatAgent {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'stat_date', type: 'date' })
  statDate: Date;

  @Column({ name: 'agent_no', length: 32 })
  agentNo: string;

  @Column({ name: 'agent_name', length: 128 })
  agentName: string;

  @Column({ name: 'parent_id', length: 64, nullable: true })
  parentId: string;

  @Column({ name: 'mch_count', type: 'int', default: 0 })
  mchCount: number;

  @Column({ name: 'total_trade_count', type: 'int', default: 0 })
  totalTradeCount: number;

  @Column({ name: 'success_trade_count', type: 'int', default: 0 })
  successTradeCount: number;

  @Column({ name: 'total_trade_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalTradeAmount: number;

  @Column({ name: 'success_trade_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  successTradeAmount: number;

  @Column({ name: 'profit_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  profitAmount: number;

  @Column({ name: 'withdraw_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  withdrawAmount: number;

  @Column({ name: 'balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'create_time' })
  createTime: Date;
}

@Entity('stat_channel')
export class StatChannel {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'stat_date', type: 'date' })
  statDate: Date;

  @Column({ name: 'channel_code', length: 32 })
  channelCode: string;

  @Column({ name: 'channel_name', length: 128 })
  channelName: string;

  @Column({ name: 'pay_type', length: 32, nullable: true })
  payType: string;

  @Column({ name: 'total_count', type: 'int', default: 0 })
  totalCount: number;

  @Column({ name: 'success_count', type: 'int', default: 0 })
  successCount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'success_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  successAmount: number;

  @Column({ name: 'fee_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  feeAmount: number;

  @Column({ name: 'success_rate', type: 'decimal', precision: 6, scale: 4, default: 0 })
  successRate: number;

  @Column({ name: 'create_time' })
  createTime: Date;
}

@Entity('stat_finance')
export class StatFinance {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'stat_date', type: 'date' })
  statDate: Date;

  @Column({ name: 'total_income', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalIncome: number;

  @Column({ name: 'total_expense', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalExpense: number;

  @Column({ name: 'net_income', type: 'decimal', precision: 18, scale: 2, default: 0 })
  netIncome: number;

  @Column({ name: 'total_balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalBalance: number;

  @Column({ name: 'settle_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  settleAmount: number;

  @Column({ name: 'withdraw_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  withdrawAmount: number;

  @Column({ name: 'profit_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  profitAmount: number;

  @Column({ name: 'create_time' })
  createTime: Date;
}
