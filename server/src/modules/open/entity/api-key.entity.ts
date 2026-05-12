/**
 * API密钥实体
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('op_api_key')
export class OpApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true, comment: 'Key ID' })
  keyId: string;

  @Column({ type: 'varchar', length: 64, comment: '应用ID' })
  appId: string;

  @Column({ type: 'varchar', length: 64, comment: '开发者ID' })
  developerId: string;

  @Column({ type: 'varchar', length: 128, comment: 'Key值(公钥/明文标识)' })
  keyValue: string;

  @Column({ type: 'varchar', length: 512, comment: '密钥(加密存储,用于验签)' })
  keySecret: string;

  @Column({ type: 'enum', enum: ['hmac_sha256', 'rsa_2048', 'sm2'], default: 'hmac_sha256', comment: '签名算法' })
  signType: 'hmac_sha256' | 'rsa_2048' | 'sm2';

  @Column({ type: 'enum', enum: ['active', 'disabled', 'expired'], default: 'active', comment: '状态' })
  status: 'active' | 'disabled' | 'expired';

  @Column({ type: 'varchar', length: 128, nullable: true, comment: 'Key别名' })
  alias: string;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '授权IP' })
  boundIp: string;

  @Column({ type: 'datetime', nullable: true, comment: '过期时间' })
  expireTime: Date;

  @Column({ type: 'int', default: 0, comment: '累计使用次数' })
  usedCount: number;

  @Column({ type: 'datetime', nullable: true, comment: '最后使用时间' })
  lastUsedTime: Date;

  @Column({ type: 'datetime', nullable: true, comment: '最后使用IP' })
  lastUsedIp: string;

  @CreateDateColumn({ type: 'datetime' })
  createTime: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updateTime: Date;
}
