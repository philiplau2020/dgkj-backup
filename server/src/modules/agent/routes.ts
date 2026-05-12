import { Router } from 'express';
import agentController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Agent routes
router.get('/list', agentController.getAgentList);
router.get('/:id', agentController.getAgentById);
router.post('/', agentController.createAgent);
router.put('/:id', agentController.updateAgent);
router.put('/:id/review', agentController.reviewAgent);

// Profit routes
router.get('/profit/list', agentController.getProfitList);

// Withdraw routes
router.get('/withdraw/list', agentController.getWithdrawList);
router.post('/withdraw', agentController.createWithdraw);
router.put('/withdraw/:id/review', agentController.reviewWithdraw);

export default router;
