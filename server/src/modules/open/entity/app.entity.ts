/**
 * 开放平台应用实体
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AppStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export enum AppType {
  WEB = 'web',
  MOBILE = 'mobile',
  MINIAPP = 'miniapp',
  API = 'api',
}

@Entity('op_app')
export class OpApp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true, comment: '应用ID' })
  appId: string;

  @Column({ type: 'varchar', length: 32, unique: true, comment: '应用Key(AppKey)' })
  appKey: string;

  @Column({ type: 'varchar', length: 64, comment: '应用密钥(AppSecret)' })
  appSecret: string;

  @Column({ type: 'varchar', length: 64, comment: '所属开发者ID' })
  developerId: string;

  @Column({ type: 'varchar', length: 64, comment: '商户号(关联)' })
  mchNo: string;

  @Column({ type: 'varchar', length: 128, comment: '应用名称' })
  appName: string;

  @Column({ type: 'enum', enum: AppType, default: AppType.WEB, comment: '应用类型' })
  appType: AppType;

  @Column({ type: 'text', nullable: true, comment: '应用描述' })
  description: string;

  @Column({ type: 'text', nullable: true, comment: '应用场景说明' })
  appScenario: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '应用图标URL' })
  appIcon: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '正式域名' })
  domain: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '回调地址(支付通知)' })
  notifyUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '退款回调地址' })
  refundNotifyUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '转账回调地址' })
  transferNotifyUrl: string;

  @Column({ type: 'simple-array', nullable: true, comment: '已授权支付方式(wx_jsapi,wx_native,alipay,alipay_qr,unionpay,bank)' })
  enabledPayTypes: string[];

  @Column({ type: 'simple-array', nullable: true, comment: '已授权API接口列表' })
  enabledApis: string[];

  @Column({ type: 'enum', enum: AppStatus, default: AppStatus.PENDING, comment: '应用状态' })
  status: AppStatus;

  @Column({ type: 'int', default: 0, comment: '今日API调用次数' })
  todayCallCount: number;

  @Column({ type: 'int', default: 0, comment: '累计API调用次数' })
  totalCallCount: number;

  @Column({ type: 'int', default: 0, comment: '当月API调用次数' })
  monthCallCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '本月累计交易金额(元)' })
  monthTradeAmount: number;

  @Column({ type: 'int', default: 0, comment: 'IP白名单数量' })
  ipWhitelistCount: number;

  @Column({ type: 'text', nullable: true, comment: 'IP白名单(JSON数组)' })
  ipWhitelist: string;

  @Column({ type: 'datetime', nullable: true, comment: '秘钥最后更新时间' })
  secretUpdateTime: Date;

  @CreateDateColumn({ type: 'datetime' })
  createTime: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updateTime: Date;
}
