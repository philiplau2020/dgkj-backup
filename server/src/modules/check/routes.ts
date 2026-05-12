import { Router } from 'express';
import checkController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Batch routes
router.get('/batch/list', checkController.getBatchList);
router.post('/batch', checkController.createBatch);
router.put('/batch/:id/review', checkController.reviewBatch);

// Channel Bill routes
router.get('/channel-bill/list', checkController.getChannelBillList);
router.post('/channel-bill', checkController.createChannelBill);

// Diff Bill routes
router.get('/diff-bill/list', checkController.getDiffBillList);
router.put('/diff-bill/:id/handle', checkController.handleDiffBill);

export default router;
