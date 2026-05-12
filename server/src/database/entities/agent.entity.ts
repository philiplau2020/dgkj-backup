import { Entity, Column, PrimaryColumn } from 'typeorm';

export enum AgentStatus {
  DISABLED = 0,
  ENABLED = 1,
  PENDING_REVIEW = 2,
  REJECTED = 3,
}

@Entity('agent_info')
export class AgentInfo {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'agent_no', length: 32, unique: true })
  agentNo: string;

  @Column({ name: 'agent_name', length: 128 })
  agentName: string;

  @Column({ name: 'parent_id', length: 64, nullable: true })
  parentId: string;

  @Column({ name: 'level', type: 'int', default: 1 })
  level: number;

  @Column({ name: 'contact_name', length: 64 })
  contactName: string;

  @Column({ name: 'contact_phone', length: 32 })
  contactPhone: string;

  @Column({ name: 'contact_email', length: 128, nullable: true })
  contactEmail: string;

  @Column({ name: 'province', length: 32, nullable: true })
  province: string;

  @Column({ name: 'city', length: 32, nullable: true })
  city: string;

  @Column({ name: 'district', length: 32, nullable: true })
  district: string;

  @Column({ name: 'address', length: 255, nullable: true })
  address: string;

  @Column({ name: 'id_card_front', length: 255, nullable: true })
  idCardFront: string;

  @Column({ name: 'id_card_back', length: 255, nullable: true })
  idCardBack: string;

  @Column({ name: 'bank_name', length: 64, nullable: true })
  bankName: string;

  @Column({ name: 'bank_account', length: 32, nullable: true })
  bankAccount: string;

  @Column({ name: 'bank_username', length: 64, nullable: true })
  bankUsername: string;

  @Column({ name: 'balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'frozen_balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  frozenBalance: number;

  @Column({ name: 'profit_balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  profitBalance: number;

  @Column({ name: 'status', type: 'tinyint', default: AgentStatus.PENDING_REVIEW })
  status: AgentStatus;

  @Column({ name: 'review_remark', length: 255, nullable: true })
  reviewRemark: string;

  @Column({ name: 'review_time', nullable: true })
  reviewTime: Date;

  @Column({ name: 'review_user_id', length: 64, nullable: true })
  reviewUserId: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('agent_profit')
export class AgentProfit {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'agent_no', length: 32 })
  agentNo: string;

  @Column({ name: 'order_no', length: 64, nullable: true })
  orderNo: string;

  @Column({ name: 'mch_no', length: 32, nullable: true })
  mchNo: string;

  @Column({ name: 'trade_type', length: 32 })
  tradeType: string;

  @Column({ name: 'trade_amount', type: 'decimal', precision: 18, scale: 2 })
  tradeAmount: number;

  @Column({ name: 'profit_amount', type: 'decimal', precision: 18, scale: 2 })
  profitAmount: number;

  @Column({ name: 'profit_rate', type: 'decimal', precision: 6, scale: 4 })
  profitRate: number;

  @Column({ name: 'profit_type', type: 'tinyint', default: 1 })
  profitType: number;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'settle_time', nullable: true })
  settleTime: Date;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;
}

@Entity('agent_withdraw')
export class AgentWithdraw {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'withdraw_no', length: 32, unique: true })
  withdrawNo: string;

  @Column({ name: 'agent_no', length: 32 })
  agentNo: string;

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

  @Column({ name: 'status', type: 'tinyint', default: 0 })
  status: number;

  @Column({ name: 'fail_reason', length: 255, nullable: true })
  failReason: string;

  @Column({ name: 'complete_time', nullable: true })
  completeTime: Date;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}
