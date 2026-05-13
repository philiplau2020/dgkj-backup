import { Router } from 'express';
import agentController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Agent routes
router.get('/list', agentController.getAgentList.bind(agentController));
router.get('/:id', agentController.getAgentById.bind(agentController));
router.post('/', agentController.createAgent.bind(agentController));
router.put('/:id', agentController.updateAgent.bind(agentController));
router.put('/:id/review', agentController.reviewAgent.bind(agentController));

// Audit routes (frontend uses /agent/audit/*)
router.get('/audit/list', agentController.getAuditList.bind(agentController));
router.put('/audit/:id/review', agentController.reviewAgent.bind(agentController));

// Profit routes
router.get('/profit/list', agentController.getProfitList.bind(agentController));

// Withdraw routes
router.get('/withdraw/list', agentController.getWithdrawList.bind(agentController));
router.post('/withdraw', agentController.createWithdraw.bind(agentController));
router.put('/withdraw/:id/review', agentController.reviewWithdraw.bind(agentController));

// Agent info and stats
router.get('/info', agentController.getAgentInfo.bind(agentController));
router.get('/stats', agentController.getAgentStats.bind(agentController));

export default router;
