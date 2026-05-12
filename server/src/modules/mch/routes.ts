import { Router } from 'express';
import mchController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Merchant routes
router.get('/list', mchController.getMchList);
router.get('/:id', mchController.getMchById);
router.post('/', mchController.createMch);
router.put('/:id', mchController.updateMch);
router.put('/:id/review', mchController.reviewMch);

// App routes
router.get('/app/list', mchController.getAppList);
router.post('/app', mchController.createApp);
router.put('/app/:id', mchController.updateApp);

// Store routes
router.get('/store/list', mchController.getStoreList);
router.post('/store', mchController.createStore);
router.put('/store/:id', mchController.updateStore);

// Rate routes
router.get('/rate/list', mchController.getRateList);
router.post('/rate', mchController.createRate);
router.put('/rate/:id', mchController.updateRate);

export default router;
