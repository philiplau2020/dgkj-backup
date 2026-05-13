/**
 * DGKJ 支付平台 - 设备管理服务
 * 
 * 支持设备注册、激活、绑定、解绑、固件管理
 */

import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { AppDataSource } from '../../config/data-source';
import { DeviceInfo, DeviceStatus, DeviceType, DeviceActivationCode } from '../../database/entities/device.entity';
import { OpCode, opResult } from '../../utils/op-code';

export class DeviceService {
  private deviceRepo = AppDataSource.getRepository(DeviceInfo);
  private activationCodeRepo = AppDataSource.getRepository(DeviceActivationCode);

  /**
   * 注册设备
   */
  async registerDevice(params: {
    deviceNo: string;       // 设备编号
    deviceType: number;    // 设备类型
    deviceModel: string;   // 设备型号
    manufacturer: string;   // 厂商
    mchNo?: string;        // 商户号 (可选)
  }): Promise<any> {
    // 检查设备是否已注册
    const existing = await this.deviceRepo.findOne({ where: { deviceNo: params.deviceNo } });
    if (existing) {
      return opResult(OpCode.BIZ_DEVICE_EXISTED, null, '设备已注册');
    }

    // 生成设备密钥
    const deviceSecret = this.generateDeviceSecret();
    
    // 创建设备记录
    const device = this.deviceRepo.create({
      id: uuidv4(),
      deviceNo: params.deviceNo,
      deviceName: `${params.deviceModel}_${params.deviceNo.slice(-6)}`,
      deviceType: params.deviceType as DeviceType,
      deviceModel: params.deviceModel,
      mchNo: params.mchNo,
      status: DeviceStatus.ENABLED,
      createTime: new Date(),
      updateTime: new Date(),
    });
    await this.deviceRepo.save(device);

    return opResult(OpCode.SUCCESS, {
      deviceId: device.id,
      deviceNo: device.deviceNo,
      deviceSecret: deviceSecret,
    });
  }

  /**
   * 激活设备
   */
  async activateDevice(params: {
    deviceNo: string;
    mchNo: string;
    storeId?: string;
  }): Promise<any> {
    const device = await this.deviceRepo.findOne({ 
      where: { deviceNo: params.deviceNo } 
    });
    
    if (!device) {
      return opResult(OpCode.BIZ_DEVICE_NOT_EXIST, null, '设备不存在');
    }

    device.mchNo = params.mchNo;
    device.storeId = params.storeId;
    device.activateTime = new Date();
    device.lastHeartbeat = new Date();
    device.status = DeviceStatus.ACTIVATED;
    device.updateTime = new Date();
    await this.deviceRepo.save(device);

    return opResult(OpCode.SUCCESS, {
      deviceId: device.id,
      deviceNo: device.deviceNo,
      status: 'active',
    });
  }

  /**
   * 设备心跳
   */
  async heartbeat(deviceNo: string, params: {
    firmwareVersion?: string;
    batteryLevel?: number;
    deviceIp?: string;
  }): Promise<any> {
    const device = await this.deviceRepo.findOne({ where: { deviceNo } });
    if (!device) {
      return opResult(OpCode.BIZ_DEVICE_NOT_EXIST, null, '设备不存在');
    }

    device.lastHeartbeat = new Date();
    device.updateTime = new Date();
    await this.deviceRepo.save(device);

    return opResult(OpCode.SUCCESS, {
      deviceNo,
      serverTime: new Date().toISOString(),
      status: 'ok',
    });
  }

  /**
   * 获取设备列表
   */
  async getDeviceList(params: {
    page?: number;
    pageSize?: number;
    mchNo?: string;
    status?: number;
    deviceType?: number;
    deviceNo?: string;
    keyword?: string;
  }): Promise<any> {
    const { page = 1, pageSize = 20, mchNo, status, deviceType, deviceNo, keyword } = params;

    const query = this.deviceRepo.createQueryBuilder('device')
      .where('1=1');

    if (mchNo) {
      query.andWhere('device.mchNo = :mchNo', { mchNo });
    }
    if (status !== undefined) {
      query.andWhere('device.status = :status', { status });
    }
    if (deviceType !== undefined) {
      query.andWhere('device.deviceType = :deviceType', { deviceType });
    }
    if (deviceNo) {
      query.andWhere('device.deviceNo = :deviceNo', { deviceNo });
    }
    if (keyword) {
      query.andWhere('(device.deviceNo LIKE :keyword OR device.deviceName LIKE :keyword)', 
        { keyword: `%${keyword}%` });
    }

    const [list, total] = await query
      .orderBy('device.createTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list: list.map(d => this.formatDevice(d)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取设备详情
   */
  async getDeviceDetail(id: string): Promise<any> {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) {
      return opResult(OpCode.BIZ_DEVICE_NOT_EXIST, null, '设备不存在');
    }

    return opResult(OpCode.SUCCESS, this.formatDevice(device, true));
  }

  /**
   * 更新设备信息
   */
  async updateDevice(id: string, params: {
    deviceName?: string;
    storeId?: string;
    remark?: string;
  }): Promise<any> {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) {
      return opResult(OpCode.BIZ_DEVICE_NOT_EXIST, null, '设备不存在');
    }

    if (params.deviceName) device.deviceName = params.deviceName;
    if (params.storeId) device.storeId = params.storeId;
    if (params.remark) device.remark = params.remark;
    device.updateTime = new Date();
    await this.deviceRepo.save(device);

    return opResult(OpCode.SUCCESS, this.formatDevice(device));
  }

  /**
   * 绑定商户
   */
  async bindMerchant(id: string, mchNo: string): Promise<any> {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) {
      return opResult(OpCode.BIZ_DEVICE_NOT_EXIST, null, '设备不存在');
    }

    device.mchNo = mchNo;
    device.updateTime = new Date();
    await this.deviceRepo.save(device);

    return opResult(OpCode.SUCCESS, {
      deviceId: device.id,
      deviceNo: device.deviceNo,
      mchNo: device.mchNo,
    });
  }

  /**
   * 解绑设备
   */
  async unbindDevice(id: string): Promise<any> {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) {
      return opResult(OpCode.BIZ_DEVICE_NOT_EXIST, null, '设备不存在');
    }

    device.mchNo = '';
    device.storeId = '';
    device.updateTime = new Date();
    await this.deviceRepo.save(device);

    return opResult(OpCode.SUCCESS, {
      deviceId: device.id,
      deviceNo: device.deviceNo,
      status: 'unbound',
    });
  }

  /**
   * 禁用设备
   */
  async disableDevice(id: string, reason: string): Promise<any> {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) {
      return opResult(OpCode.BIZ_DEVICE_NOT_EXIST, null, '设备不存在');
    }

    device.status = DeviceStatus.DISABLED;
    device.remark = `[设备禁用] ${reason} - ${new Date().toISOString()}`;
    device.updateTime = new Date();
    await this.deviceRepo.save(device);

    return opResult(OpCode.SUCCESS, {
      deviceId: device.id,
      deviceNo: device.deviceNo,
      status: 'disabled',
    });
  }

  /**
   * 启用设备
   */
  async enableDevice(id: string): Promise<any> {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) {
      return opResult(OpCode.BIZ_DEVICE_NOT_EXIST, null, '设备不存在');
    }

    device.status = DeviceStatus.ENABLED;
    device.updateTime = new Date();
    await this.deviceRepo.save(device);

    return opResult(OpCode.SUCCESS, {
      deviceId: device.id,
      deviceNo: device.deviceNo,
      status: 'active',
    });
  }

  /**
   * 报损设备
   */
  async reportDamage(id: string, reason: string): Promise<any> {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) {
      return opResult(OpCode.BIZ_DEVICE_NOT_EXIST, null, '设备不存在');
    }

    device.status = DeviceStatus.LOST;
    device.remark = `[设备报损] ${reason} - ${new Date().toISOString()}`;
    device.updateTime = new Date();
    await this.deviceRepo.save(device);

    return opResult(OpCode.SUCCESS, {
      deviceId: device.id,
      deviceNo: device.deviceNo,
      status: 'damaged',
    });
  }

  /**
   * 生成设备二维码
   */
  async generateDeviceQR(id: string): Promise<any> {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) {
      return opResult(OpCode.BIZ_DEVICE_NOT_EXIST, null, '设备不存在');
    }

    // 生成包含设备信息的二维码
    const qrData = JSON.stringify({
      type: 'device',
      no: device.deviceNo,
      appId: process.env.DGKJ_APP_ID,
    });

    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    return opResult(OpCode.SUCCESS, {
      deviceId: device.id,
      deviceNo: device.deviceNo,
      qrCode: qrCodeUrl,
      qrContent: qrData,
    });
  }

  /**
   * 获取设备交易统计
   */
  async getDeviceStats(id: string): Promise<any> {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) {
      return opResult(OpCode.BIZ_DEVICE_NOT_EXIST, null, '设备不存在');
    }

    // 模拟统计数据
    return opResult(OpCode.SUCCESS, {
      deviceId: device.id,
      deviceNo: device.deviceNo,
      today: {
        orderCount: Math.floor(Math.random() * 100),
        orderAmount: Math.floor(Math.random() * 50000) * 100,
        successRate: 99.5,
      },
      month: {
        orderCount: Math.floor(Math.random() * 3000),
        orderAmount: Math.floor(Math.random() * 1500000) * 100,
        successRate: 99.2,
      },
    });
  }

  /**
   * 获取激活码列表
   */
  async getActivationCodeList(params: {
    page?: number;
    pageSize?: number;
    code?: string;
    status?: number;
    deviceType?: number;
  }): Promise<any> {
    const { page = 1, pageSize = 20, code, status, deviceType } = params;

    const query = this.activationCodeRepo.createQueryBuilder('ac')
      .where('1=1');

    if (code) {
      query.andWhere('ac.code LIKE :code', { code: `%${code}%` });
    }
    if (status !== undefined) {
      query.andWhere('ac.status = :status', { status });
    }
    if (deviceType !== undefined) {
      query.andWhere('ac.deviceType = :deviceType', { deviceType });
    }

    const [list, total] = await query
      .orderBy('ac.createTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list: list.map(c => this.formatActivationCode(c)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 生成激活码
   */
  async generateActivationCodes(params: {
    deviceType: number;
    batchNo?: string;
    count?: number;
    expireTime?: Date;
  }): Promise<any> {
    const { deviceType, batchNo, count = 1, expireTime } = params;

    const codes = [];
    for (let i = 0; i < count; i++) {
      const activationCode = this.activationCodeRepo.create({
        id: uuidv4(),
        code: uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase(),
        deviceType,
        batchNo: batchNo || `BATCH${Date.now()}`,
        status: 0,
        expireTime,
        createTime: new Date(),
      });
      codes.push(activationCode);
    }

    await this.activationCodeRepo.save(codes);

    return {
      batchNo: codes[0].batchNo,
      count: codes.length,
      codes: codes.map(c => c.code),
    };
  }

  /**
   * 格式化激活码信息
   */
  private formatActivationCode(ac: DeviceActivationCode): any {
    const typeMap: Record<number, string> = {
      [DeviceType.QR_CODE]: '二维码设备',
      [DeviceType.SPEAKER]: '云喇叭',
      [DeviceType.PRINTER]: '小票机',
      [DeviceType.POS]: 'POS机',
    };

    const statusMap: Record<number, string> = {
      0: '未使用',
      1: '已使用',
      2: '已过期',
    };

    return {
      id: ac.id,
      code: ac.code,
      deviceType: ac.deviceType,
      deviceTypeName: typeMap[ac.deviceType] || '未知',
      batchNo: ac.batchNo,
      status: ac.status,
      statusName: statusMap[ac.status] || '未知',
      expireTime: ac.expireTime,
      usedTime: ac.usedTime,
      createTime: ac.createTime,
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 生成设备密钥
   */
  private generateDeviceSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * 格式化设备信息
   */
  private formatDevice(device: DeviceInfo, includeSecret: boolean = false): any {
    const statusMap: Record<number, string> = {
      [DeviceStatus.DISABLED]: '已禁用',
      [DeviceStatus.ENABLED]: '已启用',
      [DeviceStatus.ACTIVATED]: '已激活',
      [DeviceStatus.LOST]: '已报损',
    };

    const typeMap: Record<number, string> = {
      [DeviceType.QR_CODE]: '二维码设备',
      [DeviceType.SPEAKER]: '云喇叭',
      [DeviceType.PRINTER]: '小票机',
      [DeviceType.POS]: 'POS机',
    };

    return {
      id: device.id,
      deviceNo: device.deviceNo,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      deviceTypeName: typeMap[device.deviceType] || '未知',
      deviceModel: device.deviceModel,
      mchNo: device.mchNo,
      storeId: device.storeId,
      status: device.status,
      statusName: statusMap[device.status] || '未知',
      activateTime: device.activateTime,
      lastHeartbeat: device.lastHeartbeat,
      remark: device.remark,
      createTime: device.createTime,
      updateTime: device.updateTime,
    };
  }
}

export default new DeviceService();
