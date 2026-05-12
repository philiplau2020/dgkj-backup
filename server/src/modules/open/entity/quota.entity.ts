/**
 * API配额实体
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('op_api_quota')
@Index(['appId', 'quotaType'])
export class OpApiQuota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, comment: '应用ID' })
  appId: string;

  @Column({ type: 'varchar', length: 64, comment: '开发者ID' })
  developerId: string;

  @Column({ type: 'enum', enum: ['daily', 'monthly', 'total'], comment: '配额类型' })
  quotaType: 'daily' | 'monthly' | 'total';

  @Column({ type: 'varchar', length: 64, comment: 'API标识(ALL表示全部API)' })
  apiCode: string;

  @Column({ type: 'int', default: 0, comment: '配额上限' })
  quotaLimit: number;

  @Column({ type: 'int', default: 0, comment: '已使用量' })
  quotaUsed: number;

  @Column({ type: 'datetime', nullable: true, comment: '重置日期' })
  resetTime: Date;

  @Column({ type: 'enum', enum: ['second', 'minute', 'hour', 'day', 'month'], default: 'day', comment: '限流窗口' })
  rateLimitWindow: 'second' | 'minute' | 'hour' | 'day' | 'month';

  @Column({ type: 'int', default: 0, comment: '限流阈值(每秒/分/小时)' })
  rateLimit: number;

  @Column({ type: 'int', default: 0, comment: '限流窗口内已使用' })
  rateLimitUsed: number;

  @CreateDateColumn({ type: 'datetime' })
  createTime: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updateTime: Date;
}
