import { Router } from 'express';
import statisticsController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Dashboard
router.get('/dashboard', statisticsController.getDashboardStats.bind(statisticsController));

// Trade Statistics
router.get('/trade/list', statisticsController.getTradeStatList.bind(statisticsController));
router.get('/trade/trend', statisticsController.getTradeTrend.bind(statisticsController));
router.get('/trade/pay-type', statisticsController.getPayTypeStats.bind(statisticsController));

// Merchant Statistics
router.get('/merchant/list', statisticsController.getMchStatList.bind(statisticsController));

// Agent Statistics
router.get('/agent/list', statisticsController.getAgentStatList.bind(statisticsController));

// Channel Statistics
router.get('/channel/list', statisticsController.getChannelStatList.bind(statisticsController));

// Finance Statistics
router.get('/finance/list', statisticsController.getFinanceStatList.bind(statisticsController));

export default router;
