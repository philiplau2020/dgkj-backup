import { Router } from 'express';
import tradeController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Pay Order routes
router.get('/order/list', tradeController.getOrderList);
router.get('/order/:id', tradeController.getOrderById);
router.post('/order', tradeController.createOrder);
router.put('/order/:id/close', tradeController.closeOrder);

// Refund routes
router.get('/refund/list', tradeController.getRefundList);
router.post('/refund', tradeController.createRefund);

// Transfer routes
router.get('/transfer/list', tradeController.getTransferList);
router.post('/transfer', tradeController.createTransfer);

// Notify routes
router.get('/notify/list', tradeController.getNotifyList);
router.post('/notify/:id/resend', tradeController.resendNotify);

export default router;
