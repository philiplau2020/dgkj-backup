import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';

export enum MchStatus {
  DISABLED = 0,
  ENABLED = 1,
  PENDING_REVIEW = 2,
  REJECTED = 3,
}

export enum MchType {
  PERSONAL = 1,
  ENTERPRISE = 2,
}

@Entity('mch_info')
export class MchInfo {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'mch_no', length: 32, unique: true })
  mchNo: string;

  @Column({ name: 'mch_name', length: 128 })
  mchName: string;

  @Column({ name: 'mch_short_name', length: 64, nullable: true })
  mchShortName: string;

  @Column({ name: 'mch_type', type: 'tinyint', default: MchType.PERSONAL })
  mchType: MchType;

  @Column({ name: 'agent_id', length: 64, nullable: true })
  agentId: string;

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

  @Column({ name: 'business_license', length: 255, nullable: true })
  businessLicense: string;

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

  @Column({ name: 'status', type: 'tinyint', default: MchStatus.PENDING_REVIEW })
  status: MchStatus;

  @Column({ name: 'review_remark', length: 255, nullable: true })
  reviewRemark: string;

  @Column({ name: 'review_time', nullable: true })
  reviewTime: Date;

  @Column({ name: 'review_user_id', length: 64, nullable: true })
  reviewUserId: string;

  @Column({ name: 'balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'frozen_balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  frozenBalance: number;

  @Column({ name: 'settle_balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  settleBalance: number;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('mch_app')
export class MchApp {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'app_id', length: 32, unique: true })
  appId: string;

  @Column({ name: 'mch_no', length: 32 })
  mchNo: string;

  @Column({ name: 'app_name', length: 64 })
  appName: string;

  @Column({ name: 'app_secret', length: 64 })
  appSecret: string;

  @Column({ name: 'notify_url', length: 255, nullable: true })
  notifyUrl: string;

  @Column({ name: 'return_url', length: 255, nullable: true })
  returnUrl: string;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('mch_store')
export class MchStore {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'store_id', length: 32, unique: true })
  storeId: string;

  @Column({ name: 'mch_no', length: 32 })
  mchNo: string;

  @Column({ name: 'store_name', length: 64 })
  storeName: string;

  @Column({ name: 'store_no', length: 32, nullable: true })
  storeNo: string;

  @Column({ name: 'contact_name', length: 64, nullable: true })
  contactName: string;

  @Column({ name: 'contact_phone', length: 32, nullable: true })
  contactPhone: string;

  @Column({ name: 'province', length: 32, nullable: true })
  province: string;

  @Column({ name: 'city', length: 32, nullable: true })
  city: string;

  @Column({ name: 'district', length: 32, nullable: true })
  district: string;

  @Column({ name: 'address', length: 255, nullable: true })
  address: string;

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ name: 'device_count', type: 'int', default: 0 })
  deviceCount: number;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('mch_rate')
export class MchRate {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'mch_no', length: 32 })
  mchNo: string;

  @Column({ name: 'pay_way', length: 32 })
  payWay: string;

  @Column({ name: 'rate_type', type: 'tinyint', default: 1 })
  rateType: number;

  @Column({ name: 'rate', type: 'decimal', precision: 6, scale: 4 })
  rate: number;

  @Column({ name: 'min_fee', type: 'decimal', precision: 18, scale: 2, default: 0 })
  minFee: number;

  @Column({ name: 'max_fee', type: 'decimal', precision: 18, scale: 2, nullable: true })
  maxFee: number;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}
