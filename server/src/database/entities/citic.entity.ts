import { Entity, Column, PrimaryColumn } from 'typeorm';

// ========== 枚举定义 ==========

/** 账户状态 */
export enum CiticAccountStatus {
  DISABLED = 0,
  ENABLED = 1,
}

/** 账户类型 */
export enum CiticAccountType {
  PERSONAL = 1,  // 个人账户
  ENTERPRISE = 2, // 企业账户
}

/** 银行卡类型 */
export enum CiticCardType {
  PUBLIC = 1, // 对公账户
  PRIVATE = 2, // 对私账户
}

/** 银行卡状态 */
export enum CiticCardStatus {
  UNBIND = 0, // 已解绑
  BIND = 1,   // 已绑定
  FROZEN = 2, // 已冻结
}

/** 归集状态 */
export enum CiticCollectionStatus {
  PENDING = 0,    // 待处理
  SUCCESS = 1,    // 成功
  FAILED = 2,     // 失败
  PROCESSING = 3, // 处理中
}

/** 分账状态 */
export enum CiticProfitShareStatus {
  PENDING = 0,    // 待处理
  SUCCESS = 1,    // 成功
  FAILED = 2,     // 失败
  PROCESSING = 3, // 处理中
}

/** 代付状态 */
export enum CiticTransferStatus {
  PENDING = 0,    // 待处理
  SUCCESS = 1,    // 成功
  FAILED = 2,     // 失败
  PROCESSING = 3, // 处理中
}

/** 结算状态 */
export enum CiticSettlementStatus {
  PENDING = 0,    // 待处理
  PROCESSING = 1, // 处理中
  SUCCESS = 2,    // 已结算
  FAILED = 3,     // 已拒绝
}

/** 对账状态 */
export enum CiticCheckStatus {
  PENDING = 0,    // 待处理
  DIFF = 1,       // 有差异
  BALANCED = 2,    // 已平账
}

// ========== 实体定义 ==========

/**
 * 中信银行E管家账户实体
 * 对应中信银行用户账户信息
 */
@Entity('citic_account')
export class CiticAccount {
  @PrimaryColumn({ length: 64 })
  id: string;

  /** 中信银行用户唯一标识 */
  @Column({ name: 'biz_user_id', length: 64, unique: true })
  bizUserId: string;

  /** 账户编号 */
  @Column({ name: 'account_no', length: 32, unique: true })
  accountNo: string;

  /** 账户名称 */
  @Column({ name: 'account_name', length: 128 })
  accountName: string;

  /** 账户类型: 1-个人 2-企业 */
  @Column({ name: 'account_type', type: 'tinyint' })
  accountType: number;

  /** 账户属性: 1-普通 2-过渡 3-归集 */
  @Column({ name: 'account_attr', type: 'tinyint', default: 1 })
  accountAttr: number;

  /** 总余额 */
  @Column({ name: 'balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  balance: number;

  /** 可用余额 */
  @Column({ name: 'available_balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  availableBalance: number;

  /** 冻结金额 */
  @Column({ name: 'frozen_balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  frozenBalance: number;

  /** 待结算金额 */
  @Column({ name: 'pending_balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  pendingBalance: number;

  /** 账户状态 */
  @Column({ name: 'status', type: 'tinyint', default: CiticAccountStatus.ENABLED })
  status: CiticAccountStatus;

  /** 审核状态 */
  @Column({ name: 'audit_status', type: 'tinyint', default: 0 })
  auditStatus: number;

  /** 开户渠道 */
  @Column({ name: 'channel', length: 32, nullable: true })
  channel: string;

  /** 关联商户号 */
  @Column({ name: 'mch_no', length: 32, nullable: true })
  mchNo: string;

  /** 关联代理商号 */
  @Column({ name: 'agent_no', length: 32, nullable: true })
  agentNo: string;

  /** 备注 */
  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  /** 创建时间 */
  @Column({ name: 'create_time' })
  createTime: Date;

  /** 更新时间 */
  @Column({ name: 'update_time' })
  updateTime: Date;
}

/**
 * 中信银行银行卡实体
 * 对应中信银行用户绑定的银行卡信息
 */
@Entity('citic_card')
export class CiticCard {
  @PrimaryColumn({ length: 64 })
  id: string;

  /** 中信银行用户唯一标识 */
  @Column({ name: 'biz_user_id', length: 64 })
  bizUserId: string;

  /** 账户编号 */
  @Column({ name: 'account_no', length: 32 })
  accountNo: string;

  /** 银行卡号 */
  @Column({ name: 'card_no', length: 32, unique: true })
  cardNo: string;

  /** 银行卡类型: 1-对公 2-对私 */
  @Column({ name: 'card_type', type: 'tinyint' })
  cardType: CiticCardType;

  /** 银行名称 */
  @Column({ name: 'bank_name', length: 64 })
  bankName: string;

  /** 银行编码 */
  @Column({ name: 'bank_code', length: 32 })
  bankCode: string;

  /** 开户行名称 */
  @Column({ name: 'branch_name', length: 128, nullable: true })
  branchName: string;

  /** 开户行联行号 */
  @Column({ name: 'branch_code', length: 32, nullable: true })
  branchCode: string;

  /** 持卡人姓名 */
  @Column({ name: 'card_holder', length: 64 })
  cardHolder: string;

  /** 持卡人证件号 */
  @Column({ name: 'cert_no', length: 32, nullable: true })
  certNo: string;

  /** 持卡人手机号 */
  @Column({ name: 'phone', length: 32, nullable: true })
  phone: string;

  /** CVV2 */
  @Column({ name: 'cvv2', length: 8, nullable: true })
  cvv2: string;

  /** 有效期 */
  @Column({ name: 'expire_date', length: 8, nullable: true })
  expireDate: string;

  /** 银行卡状态: 0-已解绑 1-已绑定 2-已冻结 */
  @Column({ name: 'status', type: 'tinyint', default: CiticCardStatus.BIND })
  status: CiticCardStatus;

  /** 绑定时间 */
  @Column({ name: 'bind_time', nullable: true })
  bindTime: Date;

  /** 解绑时间 */
  @Column({ name: 'unbind_time', nullable: true })
  unbindTime: Date;

  /** 解绑原因 */
  @Column({ name: 'unbind_reason', length: 255, nullable: true })
  unbindReason: string;

  /** 备注 */
  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  /** 创建时间 */
  @Column({ name: 'create_time' })
  createTime: Date;

  /** 更新时间 */
  @Column({ name: 'update_time' })
  updateTime: Date;
}

/**
 * 资金归集关系实体
 * 定义账户间的资金归集关系
 */
@Entity('citic_collection')
export class CiticCollection {
  @PrimaryColumn({ length: 64 })
  id: string;

  /** 归集单号 */
  @Column({ name: 'collection_no', length: 64, unique: true })
  collectionNo: string;

  /** 子账户编号（被归集的账户） */
  @Column({ name: 'from_account_no', length: 32 })
  fromAccountNo: string;

  /** 子账户名称 */
  @Column({ name: 'from_account_name', length: 128, nullable: true })
  fromAccountName: string;

  /** 主账户编号（归集到的账户） */
  @Column({ name: 'to_account_no', length: 32 })
  toAccountNo: string;

  /** 主账户名称 */
  @Column({ name: 'to_account_name', length: 128, nullable: true })
  toAccountName: string;

  /** 归集类型: 1-全额归集 2-定额归集 3-保留余额归集 */
  @Column({ name: 'collection_type', type: 'tinyint' })
  collectionType: number;

  /** 归集金额（定额归集时使用） */
  @Column({ name: 'collection_amount', type: 'decimal', precision: 18, scale: 2, nullable: true })
  collectionAmount: number;

  /** 保留金额（保留余额归集时使用） */
  @Column({ name: 'reserved_amount', type: 'decimal', precision: 18, scale: 2, nullable: true })
  reservedAmount: number;

  /** 归集状态: 0-待处理 1-成功 2-失败 3-处理中 */
  @Column({ name: 'status', type: 'tinyint', default: CiticCollectionStatus.PENDING })
  status: CiticCollectionStatus;

  /** 关系状态: 0-停用 1-启用 */
  @Column({ name: 'relation_status', type: 'tinyint', default: 1 })
  relationStatus: number;

  /** 实际归集金额 */
  @Column({ name: 'collection_amount_real', type: 'decimal', precision: 18, scale: 2, nullable: true })
  collectionAmountReal: number;

  /** 完成时间 */
  @Column({ name: 'complete_time', nullable: true })
  completeTime: Date;

  /** 失败原因 */
  @Column({ name: 'fail_reason', length: 255, nullable: true })
  failReason: string;

  /** 备注 */
  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  /** 创建时间 */
  @Column({ name: 'create_time' })
  createTime: Date;

  /** 更新时间 */
  @Column({ name: 'update_time' })
  updateTime: Date;
}

/**
 * 余额分账关系实体
 * 定义分账各方及分账比例
 */
@Entity('citic_profit_share')
export class CiticProfitShare {
  @PrimaryColumn({ length: 64 })
  id: string;

  /** 分账单号 */
  @Column({ name: 'share_no', length: 64, unique: true })
  shareNo: string;

  /** 原订单号 */
  @Column({ name: 'order_no', length: 64, nullable: true })
  orderNo: string;

  /** 账户编号 */
  @Column({ name: 'account_no', length: 32 })
  accountNo: string;

  /** 账户名称 */
  @Column({ name: 'account_name', length: 128, nullable: true })
  accountName: string;

  /** 分账接收方账户 */
  @Column({ name: 'receiver_account_no', length: 32 })
  receiverAccountNo: string;

  /** 分账接收方名称 */
  @Column({ name: 'receiver_name', length: 128, nullable: true })
  receiverName: string;

  /** 分账类型: 1-比例分账 2-金额分账 */
  @Column({ name: 'share_type', type: 'tinyint' })
  shareType: number;

  /** 分账比例（百分比，如50.00表示50%） */
  @Column({ name: 'share_rate', type: 'decimal', precision: 10, scale: 4, nullable: true })
  shareRate: number;

  /** 分账金额 */
  @Column({ name: 'share_amount', type: 'decimal', precision: 18, scale: 2 })
  shareAmount: number;

  /** 原交易金额 */
  @Column({ name: 'order_amount', type: 'decimal', precision: 18, scale: 2, nullable: true })
  orderAmount: number;

  /** 分账状态: 0-待处理 1-成功 2-失败 3-处理中 */
  @Column({ name: 'status', type: 'tinyint', default: CiticProfitShareStatus.PENDING })
  status: CiticProfitShareStatus;

  /** 分账时间 */
  @Column({ name: 'share_time', nullable: true })
  shareTime: Date;

  /** 失败原因 */
  @Column({ name: 'fail_reason', length: 255, nullable: true })
  failReason: string;

  /** 备注 */
  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  /** 创建时间 */
  @Column({ name: 'create_time' })
  createTime: Date;

  /** 更新时间 */
  @Column({ name: 'update_time' })
  updateTime: Date;
}

/**
 * 代付打款实体
 * 对应中信银行代付业务
 */
@Entity('citic_transfer')
export class CiticTransfer {
  @PrimaryColumn({ length: 64 })
  id: string;

  /** 代付单号 */
  @Column({ name: 'transfer_no', length: 64, unique: true })
  transferNo: string;

  /** 中信银行代付订单号 */
  @Column({ name: 'citic_order_no', length: 64, nullable: true })
  citicOrderNo: string;

  /** 账户编号 */
  @Column({ name: 'account_no', length: 32 })
  accountNo: string;

  /** 账户名称 */
  @Column({ name: 'account_name', length: 128, nullable: true })
  accountName: string;

  /** 收款方银行卡号 */
  @Column({ name: 'receiver_card_no', length: 32 })
  receiverCardNo: string;

  /** 收款方银行名称 */
  @Column({ name: 'receiver_bank_name', length: 64 })
  receiverBankName: string;

  /** 收款方银行编码 */
  @Column({ name: 'receiver_bank_code', length: 32, nullable: true })
  receiverBankCode: string;

  /** 收款方开户行名称 */
  @Column({ name: 'receiver_branch_name', length: 128, nullable: true })
  receiverBranchName: string;

  /** 收款方开户行联行号 */
  @Column({ name: 'receiver_branch_code', length: 32, nullable: true })
  receiverBranchCode: string;

  /** 收款方姓名 */
  @Column({ name: 'receiver_name', length: 64 })
  receiverName: string;

  /** 收款方手机号 */
  @Column({ name: 'receiver_phone', length: 32, nullable: true })
  receiverPhone: string;

  /** 代付金额 */
  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  /** 手续费 */
  @Column({ name: 'fee', type: 'decimal', precision: 18, scale: 2, default: 0 })
  fee: number;

  /** 实付金额 */
  @Column({ name: 'actual_amount', type: 'decimal', precision: 18, scale: 2 })
  actualAmount: number;

  /** 代付类型: 1-直接代付 2-批量代付 3-商户提现 */
  @Column({ name: 'transfer_type', type: 'tinyint', default: 1 })
  transferType: number;

  /** 代付状态: 0-待处理 1-成功 2-失败 3-处理中 */
  @Column({ name: 'status', type: 'tinyint', default: CiticTransferStatus.PENDING })
  status: CiticTransferStatus;

  /** 成功时间 */
  @Column({ name: 'success_time', nullable: true })
  successTime: Date;

  /** 失败原因 */
  @Column({ name: 'fail_reason', length: 255, nullable: true })
  failReason: string;

  /** 回调通知时间 */
  @Column({ name: 'notify_time', nullable: true })
  notifyTime: Date;

  /** 备注 */
  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  /** 创建时间 */
  @Column({ name: 'create_time' })
  createTime: Date;

  /** 更新时间 */
  @Column({ name: 'update_time' })
  updateTime: Date;
}

/**
 * 中信银行结算实体
 */
@Entity('citic_settlement')
export class CiticSettlement {
  @PrimaryColumn({ length: 64 })
  id: string;

  /** 结算单号 */
  @Column({ name: 'settle_no', length: 64, unique: true })
  settleNo: string;

  /** 中信银行结算订单号 */
  @Column({ name: 'citic_order_no', length: 64, nullable: true })
  citicOrderNo: string;

  /** 账户编号 */
  @Column({ name: 'account_no', length: 32 })
  accountNo: string;

  /** 账户名称 */
  @Column({ name: 'account_name', length: 128, nullable: true })
  accountName: string;

  /** 结算类型: 1-D0结算 2-T1结算 */
  @Column({ name: 'settle_type', type: 'tinyint' })
  settleType: number;

  /** 结算金额 */
  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  /** 手续费 */
  @Column({ name: 'fee', type: 'decimal', precision: 18, scale: 2, default: 0 })
  fee: number;

  /** 实结金额 */
  @Column({ name: 'actual_amount', type: 'decimal', precision: 18, scale: 2 })
  actualAmount: number;

  /** 目标银行卡号 */
  @Column({ name: 'target_card_no', length: 32 })
  targetCardNo: string;

  /** 目标银行名称 */
  @Column({ name: 'target_bank_name', length: 64 })
  targetBankName: string;

  /** 目标银行编码 */
  @Column({ name: 'target_bank_code', length: 32, nullable: true })
  targetBankCode: string;

  /** 目标开户行名称 */
  @Column({ name: 'target_branch_name', length: 128, nullable: true })
  targetBranchName: string;

  /** 目标开户行联行号 */
  @Column({ name: 'target_branch_code', length: 32, nullable: true })
  targetBranchCode: string;

  /** 结算状态: 0-待处理 1-处理中 2-已结算 3-已拒绝 */
  @Column({ name: 'status', type: 'tinyint', default: CiticSettlementStatus.PENDING })
  status: CiticSettlementStatus;

  /** 结算时间 */
  @Column({ name: 'settle_time', nullable: true })
  settleTime: Date;

  /** 完成时间 */
  @Column({ name: 'complete_time', nullable: true })
  completeTime: Date;

  /** 失败原因 */
  @Column({ name: 'fail_reason', length: 255, nullable: true })
  failReason: string;

  /** 备注 */
  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  /** 创建时间 */
  @Column({ name: 'create_time' })
  createTime: Date;

  /** 更新时间 */
  @Column({ name: 'update_time' })
  updateTime: Date;
}

/**
 * 中信银行对账实体
 */
@Entity('citic_check')
export class CiticCheck {
  @PrimaryColumn({ length: 64 })
  id: string;

  /** 对账单号 */
  @Column({ name: 'check_no', length: 64, unique: true })
  checkNo: string;

  /** 对账日期 */
  @Column({ name: 'check_date', type: 'date' })
  checkDate: Date;

  /** 对账类型: 1-交易对账 2-退款对账 3-结算对账 */
  @Column({ name: 'check_type', type: 'tinyint', default: 1 })
  checkType: number;

  /** 通道编号 */
  @Column({ name: 'channel_code', length: 32, nullable: true })
  channelCode: string;

  /** 通道名称 */
  @Column({ name: 'channel_name', length: 64, nullable: true })
  channelName: string;

  /** 总交易笔数 */
  @Column({ name: 'total_count', type: 'int', default: 0 })
  totalCount: number;

  /** 总交易金额 */
  @Column({ name: 'total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  /** 成功笔数 */
  @Column({ name: 'success_count', type: 'int', default: 0 })
  successCount: number;

  /** 成功金额 */
  @Column({ name: 'success_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  successAmount: number;

  /** 失败笔数 */
  @Column({ name: 'fail_count', type: 'int', default: 0 })
  failCount: number;

  /** 失败金额 */
  @Column({ name: 'fail_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  failAmount: number;

  /** 差异笔数 */
  @Column({ name: 'diff_count', type: 'int', default: 0 })
  diffCount: number;

  /** 差异金额 */
  @Column({ name: 'diff_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  diffAmount: number;

  /** 对账状态: 0-待处理 1-有差异 2-已平账 */
  @Column({ name: 'status', type: 'tinyint', default: CiticCheckStatus.PENDING })
  status: CiticCheckStatus;

  /** 对账单文件路径 */
  @Column({ name: 'file_path', length: 255, nullable: true })
  filePath: string;

  /** 对账单文件URL */
  @Column({ name: 'file_url', length: 500, nullable: true })
  fileUrl: string;

  /** 备注 */
  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  /** 创建时间 */
  @Column({ name: 'create_time' })
  createTime: Date;

  /** 更新时间 */
  @Column({ name: 'update_time' })
  updateTime: Date;
}

/**
 * 中信银行账户流水实体
 * 记录账户的所有资金变动
 */
@Entity('citic_account_record')
export class CiticAccountRecord {
  @PrimaryColumn({ length: 64 })
  id: string;

  /** 流水号 */
  @Column({ name: 'record_no', length: 64, unique: true })
  recordNo: string;

  /** 账户编号 */
  @Column({ name: 'account_no', length: 32 })
  accountNo: string;

  /** 账户名称 */
  @Column({ name: 'account_name', length: 128, nullable: true })
  accountName: string;

  /** 业务类型: 1-收入 2-支出 3-冻结 4-解冻 5-归集 6-分账 7-代付 8-结算 */
  @Column({ name: 'biz_type', type: 'tinyint' })
  bizType: number;

  /** 业务类型名称 */
  @Column({ name: 'biz_type_name', length: 32, nullable: true })
  bizTypeName: string;

  /** 变动金额 */
  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  /** 变动前余额 */
  @Column({ name: 'balance_before', type: 'decimal', precision: 18, scale: 2 })
  balanceBefore: number;

  /** 变动后余额 */
  @Column({ name: 'balance_after', type: 'decimal', precision: 18, scale: 2 })
  balanceAfter: number;

  /** 关联订单号 */
  @Column({ name: 'order_no', length: 64, nullable: true })
  orderNo: string;

  /** 对方账户编号 */
  @Column({ name: 'opposite_account_no', length: 32, nullable: true })
  oppositeAccountNo: string;

  /** 对方账户名称 */
  @Column({ name: 'opposite_account_name', length: 128, nullable: true })
  oppositeAccountName: string;

  /** 备注 */
  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  /** 创建时间 */
  @Column({ name: 'create_time' })
  createTime: Date;
}
