import { Router } from 'express';
import statisticsController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Dashboard
router.get('/dashboard', statisticsController.getDashboardStats);

// Trade Statistics
router.get('/trade/list', statisticsController.getTradeStatList);
router.get('/trade/trend', statisticsController.getTradeTrend);
router.get('/trade/pay-type', statisticsController.getPayTypeStats);

// Merchant Statistics
router.get('/merchant/list', statisticsController.getMchStatList);

// Agent Statistics
router.get('/agent/list', statisticsController.getAgentStatList);

// Channel Statistics
router.get('/channel/list', statisticsController.getChannelStatList);

// Finance Statistics
router.get('/finance/list', statisticsController.getFinanceStatList);

export default router;
