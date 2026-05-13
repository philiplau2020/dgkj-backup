import { Router, Request, Response } from 'express';
import authController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.post('/logout', authGuard, authController.logout.bind(authController));
router.get('/userinfo', authGuard, authController.getUserInfo.bind(authController));

router.get('/perm', authGuard, (req: Request, res: Response) => {
  res.json({ code: 0, data: [], message: 'ok' });
});

export default router;
