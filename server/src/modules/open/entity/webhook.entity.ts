/**
 * 开放平台Webhook实体
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('op_webhook')
export class OpWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, comment: '应用ID' })
  appId: string;

  @Column({ type: 'varchar', length: 64, comment: '开发者ID' })
  developerId: string;

  @Column({ type: 'varchar', length: 64, comment: '商户号' })
  mchNo: string;

  @Column({ type: 'enum', enum: ['payment', 'refund', 'transfer', 'account', 'alert'], comment: '事件类型' })
  eventType: 'payment' | 'refund' | 'transfer' | 'account' | 'alert';

  @Column({ type: 'varchar', length: 255, comment: '回调地址' })
  callbackUrl: string;

  @Column({ type: 'enum', enum: ['active', 'disabled'], default: 'active', comment: '状态' })
  status: 'active' | 'disabled';

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '签名密钥' })
  secretKey: string;

  @Column({ type: 'int', default: 0, comment: '累计推送次数' })
  totalSent: number;

  @Column({ type: 'int', default: 0, comment: '成功次数' })
  successCount: number;

  @Column({ type: 'int', default: 0, comment: '失败次数' })
  failCount: number;

  @Column({ type: 'datetime', nullable: true, comment: '最后推送时间' })
  lastSentTime: Date;

  @Column({ type: 'int', default: 0, comment: '最后响应码' })
  lastResponseCode: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '最后响应消息' })
  lastResponseMsg: string;

  @CreateDateColumn({ type: 'datetime' })
  createTime: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updateTime: Date;
}
