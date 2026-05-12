import { Entity, Column, PrimaryColumn } from 'typeorm';

export enum DeviceStatus {
  DISABLED = 0,
  ENABLED = 1,
  ACTIVATED = 2,
  LOST = 3,
}

export enum DeviceType {
  QR_CODE = 1,
  SPEAKER = 2,
  PRINTER = 3,
  POS = 4,
}

@Entity('device_info')
export class DeviceInfo {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'device_no', length: 32, unique: true })
  deviceNo: string;

  @Column({ name: 'device_type', type: 'tinyint' })
  deviceType: DeviceType;

  @Column({ name: 'device_name', length: 64 })
  deviceName: string;

  @Column({ name: 'device_model', length: 64, nullable: true })
  deviceModel: string;

  @Column({ name: 'mch_no', length: 32, nullable: true })
  mchNo: string;

  @Column({ name: 'store_id', length: 32, nullable: true })
  storeId: string;

  @Column({ name: 'sn', length: 64, nullable: true })
  sn: string;

  @Column({ name: 'iccid', length: 64, nullable: true })
  iccid: string;

  @Column({ name: 'imei', length: 64, nullable: true })
  imei: string;

  @Column({ name: 'status', type: 'tinyint', default: DeviceStatus.ENABLED })
  status: DeviceStatus;

  @Column({ name: 'activate_time', nullable: true })
  activateTime: Date;

  @Column({ name: 'last_heartbeat', nullable: true })
  lastHeartbeat: Date;

  @Column({ name: 'remark', length: 255, nullable: true })
  remark: string;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}

@Entity('device_activation_code')
export class DeviceActivationCode {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'code', length: 32, unique: true })
  code: string;

  @Column({ name: 'device_type', type: 'tinyint' })
  deviceType: DeviceType;

  @Column({ name: 'batch_no', length: 32, nullable: true })
  batchNo: string;

  @Column({ name: 'status', type: 'tinyint', default: 0 })
  status: number;

  @Column({ name: 'used_time', nullable: true })
  usedTime: Date;

  @Column({ name: 'used_mch_no', length: 32, nullable: true })
  usedMchNo: string;

  @Column({ name: 'expire_time', nullable: true })
  expireTime: Date;

  @Column({ name: 'create_time' })
  createTime: Date;
}

@Entity('device_binding')
export class DeviceBinding {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ name: 'device_no', length: 32 })
  deviceNo: string;

  @Column({ name: 'mch_no', length: 32 })
  mchNo: string;

  @Column({ name: 'store_id', length: 32, nullable: true })
  storeId: string;

  @Column({ name: 'binding_type', type: 'tinyint' })
  bindingType: number;

  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'create_time' })
  createTime: Date;

  @Column({ name: 'update_time' })
  updateTime: Date;
}
