import { Router } from 'express';
import deviceService from './device.service';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// ==================== 设备管理 ====================

/**
 * GET /basic-api/device/list
 * 获取设备列表
 */
router.get('/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, mchNo, status, deviceType, keyword } = req.query;
    const result = await deviceService.getDeviceList({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      mchNo: mchNo as string,
      status: status ? parseInt(status as string) : undefined,
      deviceType: deviceType ? parseInt(deviceType as string) : undefined,
      keyword: keyword as string,
    });
    res.json({ code: 0, message: 'ok', data: result });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/device/detail
 * 获取设备详情
 */
router.get('/detail', async (req, res) => {
  try {
    const { id } = req.query;
    const result = await deviceService.getDeviceDetail(id as string);
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * POST /basic-api/device/register
 * 注册设备
 */
router.post('/register', async (req, res) => {
  try {
    const result = await deviceService.registerDevice(req.body);
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * POST /basic-api/device/activate
 * 激活设备
 */
router.post('/activate', async (req, res) => {
  try {
    const result = await deviceService.activateDevice(req.body);
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * POST /basic-api/device/heartbeat
 * 设备心跳
 */
router.post('/heartbeat', async (req, res) => {
  try {
    const { deviceNo, firmwareVersion, batteryLevel, deviceIp } = req.body;
    const result = await deviceService.heartbeat(deviceNo, {
      firmwareVersion,
      batteryLevel,
      deviceIp,
    });
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * PUT /basic-api/device/update
 * 更新设备信息
 */
router.put('/update', async (req, res) => {
  try {
    const { id, deviceName, storeId, remark } = req.body;
    const result = await deviceService.updateDevice(id, { deviceName, storeId, remark });
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * PUT /basic-api/device/bind
 * 绑定商户
 */
router.put('/bind', async (req, res) => {
  try {
    const { id, mchNo } = req.body;
    const result = await deviceService.bindMerchant(id, mchNo);
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * PUT /basic-api/device/unbind
 * 解绑设备
 */
router.put('/unbind', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await deviceService.unbindDevice(id);
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * PUT /basic-api/device/disable
 * 禁用设备
 */
router.put('/disable', async (req, res) => {
  try {
    const { id, reason } = req.body;
    const result = await deviceService.disableDevice(id, reason);
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * PUT /basic-api/device/enable
 * 启用设备
 */
router.put('/enable', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await deviceService.enableDevice(id);
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * PUT /basic-api/device/damage
 * 设备报损
 */
router.put('/damage', async (req, res) => {
  try {
    const { id, reason } = req.body;
    const result = await deviceService.reportDamage(id, reason);
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/device/qr
 * 生成设备二维码
 */
router.get('/qr', async (req, res) => {
  try {
    const { id } = req.query;
    const result = await deviceService.generateDeviceQR(id as string);
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/device/stats
 * 获取设备交易统计
 */
router.get('/stats', async (req, res) => {
  try {
    const { id } = req.query;
    const result = await deviceService.getDeviceStats(id as string);
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 按设备类型查询 ====================

/**
 * GET /basic-api/device/qrcode/list
 * 获取码牌设备列表 (deviceType = 1)
 */
router.get('/qrcode/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, deviceNo, status, mchNo, keyword } = req.query;
    const result = await deviceService.getDeviceList({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      deviceType: 1,
      deviceNo: deviceNo as string,
      status: status ? parseInt(status as string) : undefined,
      mchNo: mchNo as string,
      keyword: keyword as string,
    });
    res.json({ code: 0, message: 'ok', data: result });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/device/speaker/list
 * 获取云喇叭设备列表 (deviceType = 2)
 */
router.get('/speaker/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, deviceNo, status, mchNo, keyword } = req.query;
    const result = await deviceService.getDeviceList({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      deviceType: 2,
      deviceNo: deviceNo as string,
      status: status ? parseInt(status as string) : undefined,
      mchNo: mchNo as string,
      keyword: keyword as string,
    });
    res.json({ code: 0, message: 'ok', data: result });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/device/printer/list
 * 获取云打印设备列表 (deviceType = 3)
 */
router.get('/printer/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, deviceNo, status, mchNo, keyword } = req.query;
    const result = await deviceService.getDeviceList({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      deviceType: 3,
      deviceNo: deviceNo as string,
      status: status ? parseInt(status as string) : undefined,
      mchNo: mchNo as string,
      keyword: keyword as string,
    });
    res.json({ code: 0, message: 'ok', data: result });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/device/pos/list
 * 获取扫码POS设备列表 (deviceType = 4)
 */
router.get('/pos/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, deviceNo, status, mchNo, keyword } = req.query;
    const result = await deviceService.getDeviceList({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      deviceType: 4,
      deviceNo: deviceNo as string,
      status: status ? parseInt(status as string) : undefined,
      mchNo: mchNo as string,
      keyword: keyword as string,
    });
    res.json({ code: 0, message: 'ok', data: result });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * GET /basic-api/device/activation/list
 * 获取激活码列表
 */
router.get('/activation/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, code, status, deviceType } = req.query;
    const result = await deviceService.getActivationCodeList({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      code: code as string,
      status: status ? parseInt(status as string) : undefined,
      deviceType: deviceType ? parseInt(deviceType as string) : undefined,
    });
    res.json({ code: 0, message: 'ok', data: result });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * POST /basic-api/device/activation/generate
 * 生成激活码
 */
router.post('/activation/generate', async (req, res) => {
  try {
    const { deviceType, batchNo, count = 1, expireTime } = req.body;
    const result = await deviceService.generateActivationCodes({
      deviceType,
      batchNo,
      count,
      expireTime,
    });
    res.json({ code: 0, message: 'ok', data: result });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

// ==================== 兼容旧路由 ====================

/**
 * GET /basic-api/device/:id
 * 获取设备详情 (兼容旧路由)
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await deviceService.getDeviceDetail(req.params.id);
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

/**
 * PUT /basic-api/device/:id/bind
 * 绑定设备 (兼容旧路由)
 */
router.put('/:id/bind', async (req, res) => {
  try {
    const result = await deviceService.bindMerchant(req.params.id, req.body.mchNo);
    res.json({ code: result.code, message: result.message, data: result.data });
  } catch (error: any) {
    res.json({ code: 500, message: error.message, data: null });
  }
});

export default router;
