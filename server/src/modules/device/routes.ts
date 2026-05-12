import { Router } from 'express';
import deviceController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Device routes
router.get('/list', deviceController.getDeviceList);
router.get('/:id', deviceController.getDeviceById);
router.post('/', deviceController.createDevice);
router.put('/:id', deviceController.updateDevice);
router.put('/:id/bind', deviceController.bindDevice);

// Activation code routes
router.get('/code/list', deviceController.getActivationCodeList);
router.post('/code', deviceController.createActivationCode);

// QR Code routes
router.get('/qrcode/list', deviceController.getQrCodeList);

// Speaker routes
router.get('/speaker/list', deviceController.getSpeakerList);

// Printer routes
router.get('/printer/list', deviceController.getPrinterList);

// POS routes
router.get('/pos/list', deviceController.getPosList);

export default router;
