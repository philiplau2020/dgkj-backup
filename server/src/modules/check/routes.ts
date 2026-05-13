import { Router } from 'express';
import checkController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Main list route (alias for batch list)
router.get('/list', checkController.getBatchList.bind(checkController));
router.get('/batch/list', checkController.getBatchList.bind(checkController));
router.post('/batch', checkController.createBatch.bind(checkController));
router.put('/batch/:id/review', checkController.reviewBatch.bind(checkController));

// Channel Bill routes
router.get('/channel-bill/list', checkController.getChannelBillList.bind(checkController));
router.post('/channel-bill', checkController.createChannelBill.bind(checkController));

// Diff Bill routes
router.get('/diff-bill/list', checkController.getDiffBillList.bind(checkController));
router.put('/diff-bill/:id/handle', checkController.handleDiffBill.bind(checkController));

export default router;
