import { Router } from 'express';
import channelController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// Channel routes
router.get('/channel/list', channelController.getChannelList);
router.get('/channel/:id', channelController.getChannelById);
router.post('/channel', channelController.createChannel);
router.put('/channel/:id', channelController.updateChannel);

// Channel Mch routes
router.get('/channel-mch/list', channelController.getChannelMchList);
router.post('/channel-mch', channelController.createChannelMch);

// Channel Route routes
router.get('/route/list', channelController.getChannelRouteList);
router.post('/route', channelController.createChannelRoute);
router.put('/route/:id', channelController.updateChannelRoute);

// Pool routes
router.get('/pool/list', channelController.getPoolList);
router.post('/pool', channelController.createPool);

// Strategy routes
router.get('/strategy/list', channelController.getStrategyList);
router.post('/strategy', channelController.createStrategy);
router.put('/strategy/:id', channelController.updateStrategy);

// Recommend channel
router.get('/recommend', channelController.getRecommendedChannel);

export default router;
