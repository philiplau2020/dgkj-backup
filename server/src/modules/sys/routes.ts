import { Router } from 'express';
import sysController from './controller';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// User routes
router.get('/user/list', sysController.getUserList.bind(sysController));
router.get('/user/:id', sysController.getUserById.bind(sysController));
router.post('/user', sysController.createUser.bind(sysController));
router.put('/user/:id', sysController.updateUser.bind(sysController));
router.delete('/user/:id', sysController.deleteUser.bind(sysController));
router.put('/user/:id/password', sysController.resetPassword.bind(sysController));

// Role routes
router.get('/role/list', sysController.getRoleList.bind(sysController));
router.post('/role', sysController.createRole.bind(sysController));
router.put('/role/:id', sysController.updateRole.bind(sysController));
router.delete('/role/:id', sysController.deleteRole.bind(sysController));
router.get('/role/:id/menus', sysController.getRoleMenus.bind(sysController));
router.post('/role/:id/menus', sysController.assignRoleMenus.bind(sysController));

// Menu routes
router.get('/menu/list', sysController.getMenuList.bind(sysController));
router.post('/menu', sysController.createMenu.bind(sysController));
router.put('/menu/:id', sysController.updateMenu.bind(sysController));
router.delete('/menu/:id', sysController.deleteMenu.bind(sysController));

// Dept routes
router.get('/dept/list', sysController.getDeptList.bind(sysController));
router.post('/dept', sysController.createDept.bind(sysController));
router.put('/dept/:id', sysController.updateDept.bind(sysController));
router.delete('/dept/:id', sysController.deleteDept.bind(sysController));

// Dict routes
router.get('/dict/list', sysController.getDictList.bind(sysController));
router.get('/dict/data/:dictCode', sysController.getDictData.bind(sysController));
router.post('/dict', sysController.createDict.bind(sysController));
router.post('/dict/data', sysController.createDictData.bind(sysController));

// Config routes
router.get('/config/list', sysController.getConfigList.bind(sysController));
router.get('/config/groups', sysController.getConfigGroups.bind(sysController));
router.get('/config/key/:configKey', sysController.getConfigByKey.bind(sysController));
router.post('/config', sysController.createConfig.bind(sysController));
router.put('/config/:id', sysController.updateConfigById.bind(sysController));
router.put('/config/key/:configKey', sysController.updateConfigByKey.bind(sysController));
router.delete('/config/:id', sysController.deleteConfig.bind(sysController));
router.post('/config/batch-delete', sysController.batchDeleteConfig.bind(sysController));

// Log routes
router.get('/log/list', sysController.getLogList.bind(sysController));
router.get('/log/:id', sysController.getLogById.bind(sysController));
router.get('/log/statistics', sysController.getLogStatistics.bind(sysController));
router.get('/log/export', sysController.exportLogs.bind(sysController));
router.post('/log/clean', sysController.cleanLogs.bind(sysController));

// Notice routes
router.get('/notice/list', sysController.getNoticeList.bind(sysController));
router.get('/notice/:id', sysController.getNoticeById.bind(sysController));
router.get('/notice/published/list', sysController.getPublishedNotices.bind(sysController));
router.post('/notice', sysController.createNotice.bind(sysController));
router.put('/notice/:id', sysController.updateNotice.bind(sysController));
router.put('/notice/:id/top', sysController.toggleTop.bind(sysController));
router.put('/notice/:id/publish', sysController.publishNotice.bind(sysController));
router.put('/notice/:id/revoke', sysController.revokeNotice.bind(sysController));
router.delete('/notice/:id', sysController.deleteNotice.bind(sysController));
router.post('/notice/batch-delete', sysController.batchDeleteNotice.bind(sysController));

export default router;
