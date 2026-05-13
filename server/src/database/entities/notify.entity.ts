/**
 * 通知模板实体
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('sys_notify_template')
export class NotifyTemplate {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true, comment: '模板编码' })
  @Index('idx_template_code')
  templateCode: string;

  @Column({ type: 'varchar', length: 128, comment: '模板名称' })
  templateName: string;

  @Column({ type: 'varchar', length: 16, comment: '通知类型: email/sms/dingtalk/wecom' })
  notifyType: string;

  @Column({ type: 'varchar', length: 64, comment: '场景编码' })
  @Index('idx_scene_code')
  sceneCode: string;

  @Column({ type: 'varchar', length: 256, nullable: true, comment: '邮件主题（邮件模板专用）' })
  subject: string;

  @Column({ type: 'text', comment: '模板内容，支持 ${变量} 语法' })
  content: string;

  @Column({ type: 'varchar', length: 512, nullable: true, comment: '变量列表，JSON格式' })
  variables: string;

  @Column({ type: 'tinyint', default: 1, comment: '状态: 0-禁用, 1-启用' })
  status: number;

  @Column({ type: 'varchar', length: 256, nullable: true, comment: '备注' })
  remark: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}

/**
 * 通知发送记录实体
 */
@Entity('sys_notify_record')
export class NotifyRecord {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 64, comment: '通知ID' })
  @Index('idx_notify_id')
  notifyId: string;

  @Column({ type: 'varchar', length: 16, comment: '通知类型: email/sms/dingtalk/wecom' })
  notifyType: string;

  @Column({ type: 'varchar', length: 64, comment: '场景编码' })
  @Index('idx_scene_code')
  sceneCode: string;

  @Column({ type: 'varchar', length: 128, comment: '接收人' })
  @Index('idx_receiver')
  receiver: string;

  @Column({ type: 'varchar', length: 32, nullable: true, comment: '接收人类型: merchant/agent/admin' })
  receiverType: string;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '接收人编号' })
  receiverNo: string;

  @Column({ type: 'varchar', length: 256, nullable: true, comment: '邮件主题' })
  subject: string;

  @Column({ type: 'text', nullable: true, comment: '发送内容' })
  content: string;

  @Column({ type: 'tinyint', default: 0, comment: '发送状态: 0-待发送, 1-发送中, 2-成功, 3-失败' })
  @Index('idx_send_status')
  sendStatus: number;

  @Column({ type: 'datetime', nullable: true, comment: '发送时间' })
  sendTime: Date;

  @Column({ type: 'varchar', length: 512, nullable: true, comment: '失败原因' })
  failReason: string;

  @Column({ type: 'int', default: 0, comment: '重试次数' })
  retryCount: number;

  @Column({ type: 'varchar', length: 1024, nullable: true, comment: '扩展数据(JSON)' })
  extData: string;

  @CreateDateColumn({ type: 'datetime' })
  @Index('idx_created_at')
  createdAt: Date;
}

/**
 * 订阅配置实体
 */
@Entity('sys_notify_subscription')
export class NotifySubscription {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 32, comment: '订阅类型: merchant/agent' })
  subscribeType: string;

  @Column({ type: 'varchar', length: 64, comment: '订阅人编号' })
  subscribeNo: string;

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '订阅人名称' })
  subscribeName: string;

  @Column({ type: 'varchar', length: 512, comment: '订阅场景，逗号分隔' })
  sceneCodes: string;

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '通知邮箱' })
  notifyEmail: string;

  @Column({ type: 'varchar', length: 32, nullable: true, comment: '通知手机' })
  notifyMobile: string;

  @Column({ type: 'tinyint', default: 1, comment: '邮件通知状态: 0-禁用, 1-启用' })
  emailStatus: number;

  @Column({ type: 'tinyint', default: 1, comment: '短信通知状态: 0-禁用, 1-启用' })
  smsStatus: number;

  @Column({ type: 'tinyint', default: 1, comment: '状态: 0-禁用, 1-启用' })
  status: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}

/**
 * 风控预警配置实体
 */
@Entity('sys_risk_alert_config')
export class RiskAlertConfig {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true, comment: '预警类型: large_amount/daily_total/abnormal/channel' })
  alertType: string;

  @Column({ type: 'varchar', length: 128, comment: '预警名称' })
  alertName: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true, comment: '金额阈值' })
  thresholdAmount: number;

  @Column({ type: 'int', nullable: true, comment: '次数阈值' })
  thresholdCount: number;

  @Column({ type: 'int', nullable: true, comment: '周期（分钟）' })
  thresholdPeriod: number;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '通知方式: email,sms' })
  notifyTypes: string;

  @Column({ type: 'varchar', length: 512, nullable: true, comment: '通知接收人，逗号分隔' })
  notifyReceivers: string;

  @Column({ type: 'varchar', length: 512, nullable: true, comment: '通知邮箱，逗号分隔' })
  notifyEmails: string;

  @Column({ type: 'varchar', length: 256, nullable: true, comment: '通知手机，逗号分隔' })
  notifyMobiles: string;

  @Column({ type: 'tinyint', default: 1, comment: '状态: 0-禁用, 1-启用' })
  status: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
