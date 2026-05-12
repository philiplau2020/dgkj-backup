import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date;

  @Column({ name: 'create_by', nullable: true })
  createBy: string;

  @Column({ name: 'update_by', nullable: true })
  updateBy: string;

  @Column({ name: 'remark', nullable: true })
  remark: string;
}

export abstract class StatusEntity extends BaseEntity {
  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;
}
