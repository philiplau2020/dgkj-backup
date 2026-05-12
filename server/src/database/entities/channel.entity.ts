import { Entity, Column, PrimaryColumn } from 'typeorm';

export enum ChannelStatus {
  DISABLED = 0,
  ENABLED = 1,
}

@Entity('channel_info')
export class ChannelInfo {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'channel_code', length: 32, unique: true })
  channelCode: string;

  @Column({ name: 'channel_name', length: 128 })
  channelName: string;

  @Column({ name: 'channel_short_name', length: 64, nullable: true })
  channelShortName: string;

  @Column({ name: 'channel_type', length: 32 })
  channelType: string;

  @Column({ name: 'provider', length: 64, nullable: true })
  provider: string;

  @Column({ name: 'app_id', length: 128, nullable: true })
  appId: string;

  @Column({ name: 'app_secret', length: 255, nullable: true })
  appSecret: string;

  @Column({ name: 'mch_id', length: 64, nullable: true })
  mchId: string;

  @Column({ name: 'api_key', length: 255, nullable: true })
  apiKey: string;

  @Column({ name: 'public_key', type: 'text', nullable: true })
  publicKey: string;

  @Column({ name: 'private_key', type: 'text', nullable: true })
  privateKey: string;

  @Column({ name: 'pay_url', length: 255, nullable: true })
  payUrl: string;

  @Column({ name: 'notify_url', length: 255, nullable: true })
  notifyUrl: string;

  @Column({ name: 'query_url', length: 255, nullable: true })
  queryUrl: string;

  @Column({ name: 'settle_url', length: 255, nullable: true })
  settleUrl: string;

  @Column({ name: 'logo', length: 255, nullable: true })
  logo: string;

  @Column({ name: 'config', type: 'json', nullable: true })
  config: any;

  @Column({ name: 'status', type: 'tinyint', default: ChannelStatus.ENABLED })
  status: ChannelStatus;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('channel_mch')
export class ChannelMch {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'channel_code', length: 32 })
  channelCode: string;

  @Column({ name: 'channel_mch_id', length: 64 })
  channelMchId: string;

  @Column({ name: 'mch_no', length: 32 })
  mchNo: string;

  @Column({ name: 'mch_name', length: 128 })
  mchName: string;

  @Column({ name: 'app_id', length: 128, nullable: true })
  appId: string;

  @Column({ name: 'app_secret', length: 255, nullable: true })
  appSecret: string;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('channel_route')
export class ChannelRoute {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'route_name', length: 64 })
  routeName: string;

  @Column({ name: 'route_code', length: 32, unique: true })
  routeCode: string;

  @Column({ name: 'pay_type', length: 32 })
  payType: string;

  @Column({ name: 'priority', type: 'int', default: 1 })
  priority: number;

  @Column({ name: 'channel_codes', type: 'text' })
  channelCodes: string;

  @Column({ name: 'route_type', type: 'tinyint', default: 1 })
  routeType: number;

  @Column({ name: 'route_rule', type: 'json', nullable: true })
  routeRule: any;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('pool_strategy')
export class PoolStrategy {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'strategy_name', length: 64 })
  strategyName: string;

  @Column({ name: 'strategy_code', length: 32, unique: true })
  strategyCode: string;

  @Column({ name: 'strategy_type', type: 'tinyint' })
  strategyType: number;

  @Column({ name: 'channel_code', length: 32, nullable: true })
  channelCode: string;

  @Column({ name: 'weight', type: 'int', default: 100 })
  weight: number;

  @Column({ name: 'max_amount', type: 'decimal', precision: 18, scale: 2, nullable: true })
  maxAmount: number;

  @Column({ name: 'min_amount', type: 'decimal', precision: 18, scale: 2, nullable: true })
  minAmount: number;

  @Column({ name: 'time_range', type: 'json', nullable: true })
  timeRange: any;

  @Column({ name: 'week_days', type: 'json', nullable: true })
  weekDays: any;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('pool_channel')
export class PoolChannel {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'pool_id', length: 64 })
  poolId: string;

  @Column({ name: 'channel_code', length: 32 })
  channelCode: string;

  @Column({ name: 'weight', type: 'int', default: 100 })
  weight: number;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'create_time' })
  createTime: Date;
}

@Entity('pool_config')
export class PoolConfig {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'pool_name', length: 64 })
  poolName: string;

  @Column({ name: 'pool_code', length: 32, unique: true })
  poolCode: string;

  @Column({ name: 'pool_type', type: 'tinyint' })
  poolType: number;

  @Column({ name: 'description', length: 255, nullable: true })
  description: string;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}
