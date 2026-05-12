import { Router } from 'express';
import financeController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Account routes
router.get('/account/list', financeController.getAccountList);
router.get('/account/:id', financeController.getAccountById);

// Record routes
router.get('/record/list', financeController.getRecordList);

// Settlement routes
router.get('/settlement/list', financeController.getSettlementList);
router.post('/settlement', financeController.createSettlement);
router.put('/settlement/:id/review', financeController.reviewSettlement);

// Withdraw routes
router.get('/withdraw/list', financeController.getWithdrawList);
router.post('/withdraw', financeController.createWithdraw);

// Statement routes
router.get('/statement/list', financeController.getStatementList);

export default router;
