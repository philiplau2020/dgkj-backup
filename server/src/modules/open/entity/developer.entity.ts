/**
 * 开放平台开发者实体
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('op_developer')
export class OpDeveloper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true, comment: '开发者ID' })
  developerId: string;

  @Column({ type: 'varchar', length: 64, comment: '开发者名称/公司名' })
  developerName: string;

  @Column({ type: 'varchar', length: 64, unique: true, comment: '登录账号' })
  username: string;

  @Column({ type: 'varchar', length: 255, comment: '密码(bcrypt)' })
  password: string;

  @Column({ type: 'varchar', length: 64, unique: true, comment: '邮箱' })
  email: string;

  @Column({ type: 'varchar', length: 20, comment: '手机号' })
  mobile: string;

  @Column({ type: 'varchar', length: 255, comment: '公司名称' })
  company: string;

  @Column({ type: 'varchar', length: 18, comment: '统一社会信用代码' })
  businessLicense: string;

  @Column({ type: 'text', nullable: true, comment: '营业执照图片URL' })
  businessLicenseUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '联系人姓名' })
  contactPerson: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '联系人电话' })
  contactPhone: string;

  @Column({ type: 'text', nullable: true, comment: '开发者简介' })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '官网地址' })
  website: string;

  @Column({ type: 'enum', enum: ['pending', 'active', 'suspended', 'rejected'], default: 'pending', comment: '状态' })
  status: 'pending' | 'active' | 'suspended' | 'rejected';

  @Column({ type: 'enum', enum: ['trial', 'basic', 'professional', 'enterprise'], default: 'trial', comment: '开发者等级' })
  level: 'trial' | 'basic' | 'professional' | 'enterprise';

  @Column({ type: 'int', default: 0, comment: '已创建应用数' })
  appCount: number;

  @Column({ type: 'int', default: 0, comment: '累计API调用次数' })
  totalCallCount: number;

  @Column({ type: 'datetime', nullable: true, comment: '最后登录时间' })
  lastLoginTime: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '最后登录IP' })
  lastLoginIp: string;

  @Column({ type: 'datetime', nullable: true, comment: '审核时间' })
  reviewTime: Date;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '审核人' })
  reviewBy: string;

  @Column({ type: 'text', nullable: true, comment: '审核备注' })
  reviewRemark: string;

  @CreateDateColumn({ type: 'datetime' })
  createTime: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updateTime: Date;
}
