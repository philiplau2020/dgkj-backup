import { Router } from 'express';
import channelController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// ========== Routes for /basic-api/channel/* ==========

// Channel list
router.get('/list', channelController.getChannelList.bind(channelController));
router.get('/channel/list', channelController.getChannelList.bind(channelController));

// MCH routes (frontend uses /channel/mch/*)
router.get('/mch/list', channelController.getChannelMchList.bind(channelController));
router.post('/mch', channelController.createChannelMch.bind(channelController));
router.put('/mch/:id', channelController.updateChannelMch.bind(channelController));
router.delete('/mch/:id', channelController.deleteChannelMch.bind(channelController));

// Channel MCH (legacy)
router.get('/channel-mch/list', channelController.getChannelMchList.bind(channelController));
router.post('/channel-mch', channelController.createChannelMch.bind(channelController));

// Route rules
router.get('/route/list', channelController.getRouteList.bind(channelController));
router.post('/route', channelController.createRoute.bind(channelController));
router.put('/route/:id', channelController.updateRoute.bind(channelController));

// Strategy routes
router.get('/strategy/list', channelController.getStrategyList.bind(channelController));
router.post('/strategy', channelController.createStrategy.bind(channelController));
router.put('/strategy/:id', channelController.updateStrategy.bind(channelController));

// Pool routes (works when mounted at /basic-api/pool)
router.get('/channel/list', channelController.getPoolList.bind(channelController));
router.get('/channel/info', channelController.getChannelById.bind(channelController));
router.get('/channel/stats', channelController.getChannelStats.bind(channelController));
router.post('/channel/add', channelController.createPool.bind(channelController));
router.get('/list', channelController.getPoolList.bind(channelController));

// ========== Routes for /basic-api/pool/* (when mounted separately) ==========
// These work when poolRoutes is mounted at /basic-api/pool

// Parameterized routes
router.get('/channel/:id', channelController.getChannelById.bind(channelController));
router.put('/channel/:id', channelController.updateChannel.bind(channelController));

// Other routes
router.get('/channel/recommend', channelController.getRecommendedChannel.bind(channelController));
router.get('/channel/stats', channelController.getChannelStats.bind(channelController));
router.get('/recommend', channelController.getRecommendedChannel.bind(channelController));

export default router;
