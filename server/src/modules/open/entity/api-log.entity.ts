/**
 * API调用日志实体
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('op_api_log')
@Index(['appId', 'createTime'])
@Index(['developerId', 'createTime'])
@Index(['apiPath', 'createTime'])
@Index(['orderNo'])
export class OpApiLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, comment: '应用ID' })
  appId: string;

  @Column({ type: 'varchar', length: 64, comment: '开发者ID' })
  developerId: string;

  @Column({ type: 'varchar', length: 64, comment: '商户号' })
  mchNo: string;

  @Column({ type: 'varchar', length: 32, comment: 'Key ID' })
  keyId: string;

  @Column({ type: 'varchar', length: 10, comment: 'HTTP方法' })
  method: string;

  @Column({ type: 'varchar', length: 255, comment: 'API路径' })
  apiPath: string;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '业务单号(订单/退款等)' })
  bizNo: string;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '关联支付订单号' })
  orderNo: string;

  @Column({ type: 'enum', enum: ['success', 'fail', 'error', 'pending'], comment: '调用结果' })
  result: 'success' | 'fail' | 'error' | 'pending';

  @Column({ type: 'int', comment: 'HTTP响应码' })
  httpCode: number;

  @Column({ type: 'varchar', length: 16, comment: '平台响应码' })
  code: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '响应消息' })
  message: string;

  @Column({ type: 'int', default: 0, comment: '响应时间(ms)' })
  responseTime: number;

  @Column({ type: 'int', default: 0, comment: '请求体大小(字节)' })
  requestSize: number;

  @Column({ type: 'int', default: 0, comment: '响应体大小(字节)' })
  responseSize: number;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '客户端IP' })
  clientIp: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'User-Agent' })
  userAgent: string;

  @Column({ type: 'text', nullable: true, comment: '请求参数(JSON)' })
  requestParams: string;

  @Column({ type: 'text', nullable: true, comment: '响应内容(JSON,截断)' })
  responseContent: string;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '签名' })
  sign: string;

  @Column({ type: 'enum', enum: ['low', 'medium', 'high'], nullable: true, comment: '安全等级' })
  securityLevel: 'low' | 'medium' | 'high';

  @CreateDateColumn({ type: 'datetime' })
  createTime: Date;
}
