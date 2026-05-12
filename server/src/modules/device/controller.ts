import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../../config/data-source';
import { DeviceInfo, DeviceActivationCode, DeviceBinding } from '../../database/entities/device.entity';

export class DeviceController {
  private deviceRepo = AppDataSource.getRepository(DeviceInfo);
  private codeRepo = AppDataSource.getRepository(DeviceActivationCode);
  private bindingRepo = AppDataSource.getRepository(DeviceBinding);

  // ============== Device Info ==============
  async getDeviceList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, deviceNo, deviceType, status, mchNo } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.deviceRepo.createQueryBuilder('device');
      if (deviceNo) queryBuilder.andWhere('device.deviceNo LIKE :deviceNo', { deviceNo: `%${deviceNo}%` });
      if (deviceType !== undefined) queryBuilder.andWhere('device.deviceType = :deviceType', { deviceType });
      if (status !== undefined) queryBuilder.andWhere('device.status = :status', { status });
      if (mchNo) queryBuilder.andWhere('device.mchNo = :mchNo', { mchNo });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('device.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async getDeviceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const device = await this.deviceRepo.findOne({ where: { id } });
      if (!device) return res.status(404).json({ code: 404, message: '设备不存在', data: null, timestamp: new Date().toISOString() });
      res.json({ code: 0, message: 'success', data: device, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { deviceNo, deviceType, deviceName, deviceModel, sn, iccid, imei } = req.body;

      const device = this.deviceRepo.create({
        id: uuidv4(),
        deviceNo,
        deviceType,
        deviceName,
        deviceModel,
        sn,
        iccid,
        imei,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });

      await this.deviceRepo.save(device);
      res.json({ code: 0, message: '创建成功', data: device, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async updateDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updateTime = new Date();
      await this.deviceRepo.update(id, updateData);
      res.json({ code: 0, message: '更新成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async bindDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { mchNo, storeId } = req.body;

      await this.deviceRepo.update(id, { mchNo, storeId, status: 2, activateTime: new Date(), updateTime: new Date() });

      // Create binding record
      const binding = this.bindingRepo.create({
        id: uuidv4(),
        deviceNo: (await this.deviceRepo.findOne({ where: { id } }))?.deviceNo,
        mchNo,
        storeId,
        bindingType: 1,
        status: 1,
        createTime: new Date(),
        updateTime: new Date(),
      });
      await this.bindingRepo.save(binding);

      res.json({ code: 0, message: '绑定成功', data: null, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Activation Code ==============
  async getActivationCodeList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, code, status, deviceType } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.codeRepo.createQueryBuilder('ac');
      if (code) queryBuilder.andWhere('ac.code LIKE :code', { code: `%${code}%` });
      if (status !== undefined) queryBuilder.andWhere('ac.status = :status', { status });
      if (deviceType !== undefined) queryBuilder.andWhere('ac.deviceType = :deviceType', { deviceType });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('ac.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  async createActivationCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { deviceType, batchNo, count = 1, expireTime } = req.body;

      const codes = [];
      for (let i = 0; i < count; i++) {
        const code = this.codeRepo.create({
          id: uuidv4(),
          code: uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase(),
          deviceType,
          batchNo,
          status: 0,
          expireTime,
          createTime: new Date(),
        });
        codes.push(code);
      }

      await this.codeRepo.save(codes);
      res.json({ code: 0, message: '创建成功', data: { count: codes.length }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== QR Code Management ==============
  async getQrCodeList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, deviceNo, status, mchNo } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.deviceRepo.createQueryBuilder('device').where('device.deviceType = 1');
      if (deviceNo) queryBuilder.andWhere('device.deviceNo LIKE :deviceNo', { deviceNo: `%${deviceNo}%` });
      if (status !== undefined) queryBuilder.andWhere('device.status = :status', { status });
      if (mchNo) queryBuilder.andWhere('device.mchNo = :mchNo', { mchNo });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('device.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Speaker Management ==============
  async getSpeakerList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, deviceNo, status, mchNo } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.deviceRepo.createQueryBuilder('device').where('device.deviceType = 2');
      if (deviceNo) queryBuilder.andWhere('device.deviceNo LIKE :deviceNo', { deviceNo: `%${deviceNo}%` });
      if (status !== undefined) queryBuilder.andWhere('device.status = :status', { status });
      if (mchNo) queryBuilder.andWhere('device.mchNo = :mchNo', { mchNo });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('device.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== Printer Management ==============
  async getPrinterList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, deviceNo, status, mchNo } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.deviceRepo.createQueryBuilder('device').where('device.deviceType = 3');
      if (deviceNo) queryBuilder.andWhere('device.deviceNo LIKE :deviceNo', { deviceNo: `%${deviceNo}%` });
      if (status !== undefined) queryBuilder.andWhere('device.status = :status', { status });
      if (mchNo) queryBuilder.andWhere('device.mchNo = :mchNo', { mchNo });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('device.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }

  // ============== POS Management ==============
  async getPosList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10, deviceNo, status, mchNo } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);

      const queryBuilder = this.deviceRepo.createQueryBuilder('device').where('device.deviceType = 4');
      if (deviceNo) queryBuilder.andWhere('device.deviceNo LIKE :deviceNo', { deviceNo: `%${deviceNo}%` });
      if (status !== undefined) queryBuilder.andWhere('device.status = :status', { status });
      if (mchNo) queryBuilder.andWhere('device.mchNo = :mchNo', { mchNo });

      const [list, total] = await queryBuilder.skip(skip).take(Number(pageSize)).orderBy('device.createTime', 'DESC').getManyAndCount();
      res.json({ code: 0, message: 'success', data: { list, total }, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }
}

export default new DeviceController();
