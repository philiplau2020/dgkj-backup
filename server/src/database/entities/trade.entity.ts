import { Entity, Column, PrimaryColumn } from 'typeorm';

export enum OrderStatus {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
  CLOSED = 3,
  REFUNDING = 4,
  REFUNDED = 5,
}

export enum TradeType {
  PAY = 1,
  REFUND = 2,
  TRANSFER = 3,
  WITHDRAW = 4,
}

export enum PayType {
  WX_NATIVE = 'WX_NATIVE',
  WX_APP = 'WX_APP',
  WX_JSAPI = 'WX_JSAPI',
  WX_H5 = 'WX_H5',
  ALI_QR = 'ALI_QR',
  ALI_APP = 'ALI_APP',
  ALI_WAP = 'ALI_WAP',
  ALI_JSAPI = 'ALI_JSAPI',
  UNION_QR = 'UNION_QR',
  UNION_JK = 'UNION_JK',
  YSF_QR = 'YSF_QR',
  CASH = 'CASH',
}

@Entity('pay_order')
export class PayOrder {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'order_no', length: 32, unique: true })
  orderNo: string;

  @Column({ name: 'mch_no', length: 32 })
  mchNo: string;

  @Column({ name: 'mch_name', length: 128, nullable: true })
  mchName: string;

  @Column({ name: 'app_id', length: 32 })
  appId: string;

  @Column({ name: 'channel_code', length: 32, nullable: true })
  channelCode: string;

  @Column({ name: 'pay_type', length: 32 })
  payType: PayType;

  @Column({ name: 'trade_type', type: 'tinyint', default: TradeType.PAY })
  tradeType: TradeType;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ name: 'coupon_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  couponAmount: number;

  @Column({ name: 'actual_amount', type: 'decimal', precision: 18, scale: 2 })
  actualAmount: number;

  @Column({ name: 'fee', type: 'decimal', precision: 18, scale: 2, default: 0 })
  fee: number;

  @Column({ name: 'profit_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  profitAmount: number;

  @Column({ name: 'subject', length: 128, nullable: true })
  subject: string;

  @Column({ name: 'body', length: 255, nullable: true })
  body: string;

  @Column({ name: 'channel_order_no', length: 64, nullable: true })
  channelOrderNo: string;

  @Column({ name: 'pay_url', type: 'text', nullable: true })
  payUrl: string;

  @Column({ name: 'pay_time', nullable: true })
  payTime: Date;

  @Column({ name: 'expire_time', nullable: true })
  expireTime: Date;

  @Column({ name: 'status', type: 'tinyint', default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'notify_status', type: 'tinyint', default: 0 })
  notifyStatus: number;

  @Column({ name: 'notify_time', nullable: true })
  notifyTime: Date;

  @Column({ name: 'notify_url', length: 255, nullable: true })
  notifyUrl: string;

  @Column({ name: 'client_ip', length: 64, nullable: true })
  clientIp: string;

  @Column({ name: 'attach', type: 'text', nullable: true })
  attach: string;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('refund_order')
export class RefundOrder {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'refund_no', length: 32, unique: true })
  refundNo: string;

  @Column({ name: 'order_no', length: 32 })
  orderNo: string;

  @Column({ name: 'mch_no', length: 32 })
  mchNo: string;

  @Column({ name: 'app_id', length: 32 })
  appId: string;

  @Column({ name: 'channel_code', length: 32, nullable: true })
  channelCode: string;

  @Column({ name: 'pay_type', length: 32 })
  payType: string;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 18, scale: 2 })
  refundAmount: number;

  @Column({ name: 'refund_reason', length: 255, nullable: true })
  refundReason: string;

  @Column({ name: 'channel_refund_no', length: 64, nullable: true })
  channelRefundNo: string;

  @Column({ name: 'refund_time', nullable: true })
  refundTime: Date;

  @Column({ name: 'status', type: 'tinyint', default: 0 })
  status: number;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('transfer_order')
export class TransferOrder {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'transfer_no', length: 32, unique: true })
  transferNo: string;

  @Column({ name: 'mch_no', length: 32 })
  mchNo: string;

  @Column({ name: 'app_id', length: 32 })
  appId: string;

  @Column({ name: 'out_no', length: 64, nullable: true })
  outNo: string;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ name: 'fee', type: 'decimal', precision: 18, scale: 2, default: 0 })
  fee: number;

  @Column({ name: 'actual_amount', type: 'decimal', precision: 18, scale: 2 })
  actualAmount: number;

  @Column({ name: 'pay_type', length: 32 })
  payType: string;

  @Column({ name: 'account_type', type: 'tinyint', default: 1 })
  accountType: number;

  @Column({ name: 'account_name', length: 64 })
  accountName: string;

  @Column({ name: 'account_no', length: 32 })
  accountNo: string;

  @Column({ name: 'bank_name', length: 64, nullable: true })
  bankName: string;

  @Column({ name: 'bank_code', length: 32, nullable: true })
  bankCode: string;

  @Column({ name: 'status', type: 'tinyint', default: 0 })
  status: number;

  @Column({ name: 'channel_transfer_no', length: 64, nullable: true })
  channelTransferNo: string;

  @Column({ name: 'complete_time', nullable: true })
  completeTime: Date;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('trade_notify')
export class TradeNotify {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'notify_id', length: 64 })
  notifyId: string;

  @Column({ name: 'order_no', length: 32 })
  orderNo: string;

  @Column({ name: 'mch_no', length: 32 })
  mchNo: string;

  @Column({ name: 'app_id', length: 32 })
  appId: string;

  @Column({ name: 'notify_url', length: 255 })
  notifyUrl: string;

  @Column({ name: 'notify_type', type: 'tinyint' })
  notifyType: number;

  @Column({ name: 'status', type: 'tinyint', default: 0 })
  status: number;

  @Column({ name: 'notify_count', type: 'int', default: 0 })
  notifyCount: number;

  @Column({ name: 'last_notify_time', nullable: true })
  lastNotifyTime: Date;

  @Column({ name: 'next_notify_time', nullable: true })
  nextNotifyTime: Date;

  @Column({ name: 'response_result', type: 'text', nullable: true })
  responseResult: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}
