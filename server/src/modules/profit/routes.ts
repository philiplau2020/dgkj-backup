import { Router } from 'express';
import profitController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Account Group routes
router.get('/account-group/list', profitController.getAccountGroupList);
router.post('/account-group', profitController.createAccountGroup);
router.put('/account-group/:id', profitController.updateAccountGroup);

// Receiver routes
router.get('/receiver/list', profitController.getReceiverList);
router.post('/receiver', profitController.createReceiver);
router.put('/receiver/:id', profitController.updateReceiver);

// Record routes
router.get('/record/list', profitController.getRecordList);
router.post('/record', profitController.createRecord);
router.put('/record/:id/settle', profitController.settleRecord);

// Rollback routes
router.get('/rollback/list', profitController.getRollbackList);
router.post('/rollback', profitController.createRollback);
router.put('/rollback/:id/complete', profitController.completeRollback);

export default router;
