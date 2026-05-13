import { Router } from 'express';
import profitController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Main list route (alias for record list)
router.get('/list', profitController.getRecordList.bind(profitController));

// Account Group routes
router.get('/account-group/list', profitController.getAccountGroupList.bind(profitController));
router.post('/account-group', profitController.createAccountGroup.bind(profitController));
router.put('/account-group/:id', profitController.updateAccountGroup.bind(profitController));

// Receiver routes
router.get('/receiver/list', profitController.getReceiverList.bind(profitController));
router.post('/receiver', profitController.createReceiver.bind(profitController));
router.put('/receiver/:id', profitController.updateReceiver.bind(profitController));

// Record routes
router.get('/record/list', profitController.getRecordList.bind(profitController));
router.post('/record', profitController.createRecord.bind(profitController));
router.put('/record/:id/settle', profitController.settleRecord.bind(profitController));

// Rollback routes
router.get('/rollback/list', profitController.getRollbackList.bind(profitController));
router.post('/rollback', profitController.createRollback.bind(profitController));
router.put('/rollback/:id/complete', profitController.completeRollback.bind(profitController));

export default router;
