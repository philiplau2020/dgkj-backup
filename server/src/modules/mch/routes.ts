import { Router } from 'express';
import mchController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Merchant routes
router.get('/list', mchController.getMchList.bind(mchController));
router.get('/:id', mchController.getMchById.bind(mchController));
router.get('/no/:mchNo', mchController.getMchByMchNo.bind(mchController));
router.post('/', mchController.createMch.bind(mchController));
router.put('/:id', mchController.updateMch.bind(mchController));
router.delete('/:id', mchController.deleteMch.bind(mchController));
router.put('/:id/enable', mchController.enableMch.bind(mchController));
router.put('/:id/disable', mchController.disableMch.bind(mchController));
router.put('/:id/review', mchController.reviewMch.bind(mchController));

// App routes
router.get('/app/list', mchController.getAppList.bind(mchController));
router.post('/app', mchController.createApp.bind(mchController));
router.put('/app/:id', mchController.updateApp.bind(mchController));

// Store routes
router.get('/store/list', mchController.getStoreList.bind(mchController));
router.get('/store/:id', mchController.getStoreById.bind(mchController));
router.post('/store', mchController.createStore.bind(mchController));
router.put('/store/:id', mchController.updateStore.bind(mchController));
router.delete('/store/:id', mchController.deleteStore.bind(mchController));
router.put('/store/:id/enable', mchController.enableStore.bind(mchController));
router.put('/store/:id/disable', mchController.disableStore.bind(mchController));

// Rate routes
router.get('/rate/list', mchController.getRateList.bind(mchController));
router.get('/rate/:id', mchController.getRateById.bind(mchController));
router.post('/rate', mchController.createRate.bind(mchController));
router.post('/rate/batch', mchController.batchCreateRate.bind(mchController));
router.put('/rate/:id', mchController.updateRate.bind(mchController));
router.delete('/rate/:id', mchController.deleteRate.bind(mchController));
router.put('/rate/:id/enable', mchController.enableRate.bind(mchController));
router.put('/rate/:id/disable', mchController.disableRate.bind(mchController));

export default router;
