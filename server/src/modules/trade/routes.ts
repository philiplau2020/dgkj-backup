import { Router } from 'express';
import tradeController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Pay Order routes
router.get('/list', tradeController.getOrderList.bind(tradeController));
router.get('/:id', tradeController.getOrderById.bind(tradeController));
router.post('/', tradeController.createOrder.bind(tradeController));
router.put('/:id/close', tradeController.closeOrder.bind(tradeController));

// Refund routes
router.get('/refund/list', tradeController.getRefundList.bind(tradeController));
router.post('/refund', tradeController.createRefund.bind(tradeController));

// Transfer routes
router.get('/transfer/list', tradeController.getTransferList.bind(tradeController));
router.post('/transfer', tradeController.createTransfer.bind(tradeController));

// Notify routes
router.get('/notify/list', tradeController.getNotifyList.bind(tradeController));
router.post('/notify/:id/resend', tradeController.resendNotify.bind(tradeController));

export default router;
