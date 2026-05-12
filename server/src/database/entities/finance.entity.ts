import { Entity, Column, PrimaryColumn } from 'typeorm';

export enum AccountType {
  MERCHANT = 1,
  AGENT = 2,
  PLATFORM = 3,
}

export enum WithdrawStatus {
  PENDING = 0,
  PROCESSING = 1,
  SUCCESS = 2,
  FAILED = 3,
}

export enum SettleStatus {
  PENDING = 0,
  PROCESSING = 1,
  SUCCESS = 2,
  FAILED = 3,
}

@Entity('account_info')
export class AccountInfo {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'account_no', length: 32, unique: true })
  accountNo: string;

  @Column({ name: 'owner_no', length: 32 })
  ownerNo: string;

  @Column({ name: 'owner_name', length: 128 })
  ownerName: string;

  @Column({ name: 'account_type', type: 'tinyint' })
  accountType: AccountType;

  @Column({ name: 'balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'frozen_balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  frozenBalance: number;

  @Column({ name: 'available_balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  availableBalance: number;

  @Column({ name: 'total_income', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalIncome: number;

  @Column({ name: 'total_expense', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalExpense: number;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('account_record')
export class AccountRecord {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'record_no', length: 32, unique: true })
  recordNo: string;

  @Column({ name: 'account_no', length: 32 })
  accountNo: string;

  @Column({ name: 'order_no', length: 32, nullable: true })
  orderNo: string;

  @Column({ name: 'biz_no', length: 32, nullable: true })
  bizNo: string;

  @Column({ name: 'biz_type', type: 'tinyint' })
  bizType: number;

  @Column({ name: 'biz_type_name', length: 64 })
  bizTypeName: string;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ name: 'balance_before', type: 'decimal', precision: 18, scale: 2 })
  balanceBefore: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 18, scale: 2 })
  balanceAfter: number;

  @Column({ name: 'change_type', type: 'tinyint' })
  changeType: number;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;
}

@Entity('account_settlement')
export class AccountSettlement {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'settle_no', length: 32, unique: true })
  settleNo: string;

  @Column({ name: 'account_no', length: 32 })
  accountNo: string;

  @Column({ name: 'owner_no', length: 32 })
  ownerNo: string;

  @Column({ name: 'owner_name', length: 128 })
  ownerName: string;

  @Column({ name: 'bank_name', length: 64 })
  bankName: string;

  @Column({ name: 'bank_account', length: 32 })
  bankAccount: string;

  @Column({ name: 'bank_username', length: 64 })
  bankUsername: string;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ name: 'fee', type: 'decimal', precision: 18, scale: 2, default: 0 })
  fee: number;

  @Column({ name: 'actual_amount', type: 'decimal', precision: 18, scale: 2 })
  actualAmount: number;

  @Column({ name: 'settle_type', type: 'tinyint' })
  settleType: number;

  @Column({ name: 'settle_cycle', length: 32 })
  settleCycle: string;

  @Column({ name: 'status', type: 'tinyint', default: SettleStatus.PENDING })
  status: SettleStatus;

  @Column({ name: 'fail_reason', length: 255, nullable: true })
  failReason: string;

  @Column({ name: 'settle_time', nullable: true })
  settleTime: Date;

  @Column({ name: 'complete_time', nullable: true })
  completeTime: Date;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('account_withdraw')
export class AccountWithdraw {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'withdraw_no', length: 32, unique: true })
  withdrawNo: string;

  @Column({ name: 'account_no', length: 32 })
  accountNo: string;

  @Column({ name: 'owner_no', length: 32 })
  ownerNo: string;

  @Column({ name: 'owner_name', length: 128 })
  ownerName: string;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ name: 'fee', type: 'decimal', precision: 18, scale: 2, default: 0 })
  fee: number;

  @Column({ name: 'actual_amount', type: 'decimal', precision: 18, scale: 2 })
  actualAmount: number;

  @Column({ name: 'bank_name', length: 64 })
  bankName: string;

  @Column({ name: 'bank_account', length: 32 })
  bankAccount: string;

  @Column({ name: 'bank_username', length: 64 })
  bankUsername: string;

  @Column({ name: 'status', type: 'tinyint', default: WithdrawStatus.PENDING })
  status: WithdrawStatus;

  @Column({ name: 'fail_reason', length: 255, nullable: true })
  failReason: string;

  @Column({ name: 'complete_time', nullable: true })
  completeTime: Date;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('account_statement')
export class AccountStatement {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'statement_no', length: 32, unique: true })
  statementNo: string;

  @Column({ name: 'account_no', length: 32 })
  accountNo: string;

  @Column({ name: 'statement_date', type: 'date' })
  statementDate: Date;

  @Column({ name: 'begin_balance', type: 'decimal', precision: 18, scale: 2 })
  beginBalance: number;

  @Column({ name: 'total_income', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalIncome: number;

  @Column({ name: 'total_expense', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalExpense: number;

  @Column({ name: 'end_balance', type: 'decimal', precision: 18, scale: 2 })
  endBalance: number;

  @Column({ name: 'order_count', type: 'int', default: 0 })
  orderCount: number;

  @Column({ name: 'success_count', type: 'int', default: 0 })
  successCount: number;

  @Column({ name: 'refund_count', type: 'int', default: 0 })
  refundCount: number;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'create_time' })
  createTime: Date;
}
