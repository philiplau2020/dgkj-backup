import { Router } from 'express';
import sysController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authGuard);

// User routes
router.get('/user/list', sysController.getUserList);
router.get('/user/:id', sysController.getUserById);
router.post('/user', sysController.createUser);
router.put('/user/:id', sysController.updateUser);
router.delete('/user/:id', sysController.deleteUser);
router.put('/user/:id/password', sysController.resetPassword);

// Role routes
router.get('/role/list', sysController.getRoleList);
router.post('/role', sysController.createRole);
router.put('/role/:id', sysController.updateRole);
router.delete('/role/:id', sysController.deleteRole);
router.get('/role/:id/menus', sysController.getRoleMenus);
router.post('/role/:id/menus', sysController.assignRoleMenus);

// Menu routes
router.get('/menu/list', sysController.getMenuList);
router.post('/menu', sysController.createMenu);
router.put('/menu/:id', sysController.updateMenu);
router.delete('/menu/:id', sysController.deleteMenu);

// Dept routes
router.get('/dept/list', sysController.getDeptList);
router.post('/dept', sysController.createDept);
router.put('/dept/:id', sysController.updateDept);
router.delete('/dept/:id', sysController.deleteDept);

// Dict routes
router.get('/dict/list', sysController.getDictList);
router.get('/dict/data/:dictCode', sysController.getDictData);
router.post('/dict', sysController.createDict);
router.post('/dict/data', sysController.createDictData);

// Config routes
router.get('/config/list', sysController.getConfigList);
router.put('/config', sysController.updateConfig);

// Log routes
router.get('/log/list', sysController.getLogList);

// Notice routes
router.get('/notice/list', sysController.getNoticeList);
router.post('/notice', sysController.createNotice);
router.put('/notice/:id', sysController.updateNotice);
router.delete('/notice/:id', sysController.deleteNotice);

export default router;
