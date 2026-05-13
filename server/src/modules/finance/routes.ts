import { Router } from 'express';
import financeController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Account routes
router.get('/list', financeController.getAccountList.bind(financeController));
router.get('/:id', financeController.getAccountById.bind(financeController));

// Record routes
router.get('/record/list', financeController.getRecordList.bind(financeController));

// Settlement routes
router.get('/settlement/list', financeController.getSettlementList.bind(financeController));
router.post('/settlement', financeController.createSettlement.bind(financeController));
router.put('/settlement/:id/review', financeController.reviewSettlement.bind(financeController));

// Withdraw routes
router.get('/withdraw/list', financeController.getWithdrawList.bind(financeController));
router.post('/withdraw', financeController.createWithdraw.bind(financeController));

// Statement routes
router.get('/statement/list', financeController.getStatementList.bind(financeController));

export default router;
