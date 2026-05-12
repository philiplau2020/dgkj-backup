import { Router } from 'express';
import citicController from './controller';
import citicAutoService from './auto.service';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// ========== 账户管理 ==========
router.get('/account/list', citicController.getAccountList);
router.get('/account/info', citicController.getAccountInfo);
router.get('/account/stats', citicController.getAccountStats);
router.get('/account/balance', citicController.queryBalance);
router.get('/account/records', citicController.getAccountRecords);
router.post('/account/register', citicController.registerAccount);
router.post('/account', citicController.registerAccount);
router.put('/account/:id', citicController.updateAccount);

// ========== 银行卡管理 ==========
router.get('/card/list', citicController.getCardList);
router.post('/card/bind', citicController.bindCard);
router.post('/card/unbind', citicController.unbindCard);
router.post('/card', citicController.bindCard);
router.delete('/card/:id', citicController.deleteCard);

// ========== 资金归集 ==========
router.get('/collection/list', citicController.getCollectionList);
router.post('/collection/set', citicController.setCollection);
router.post('/collection/active', citicController.activeCollection);
router.delete('/collection/:id', citicController.deleteCollection);

// ========== 余额分账 ==========
router.get('/profit-share/list', citicController.getProfitShareList);
router.post('/profit-share/execute', citicController.executeProfitShare);
router.delete('/profit-share/:id', citicController.deleteProfitShare);

// ========== 代付打款 ==========
router.get('/transfer/list', citicController.getTransferList);
router.post('/transfer/pay', citicController.createTransfer);
router.get('/transfer/query', citicController.queryTransfer);
router.post('/transfer/confirm', citicController.confirmTransfer);

// ========== 结算管理 ==========
router.get('/settlement/list', citicController.getSettlementList);
router.post('/settlement/apply', citicController.applySettlement);
router.post('/settlement/confirm', citicController.confirmSettlement);
router.post('/settlement/cancel', citicController.cancelSettlement);

// ========== 对账管理 ==========
router.get('/check/list', citicController.getCheckList);
router.post('/check/trigger', citicController.triggerCheck);
router.get('/check/download', citicController.downloadCheckBill);
router.get('/check/diff/list', citicController.getCheckDiffList);
router.post('/check/diff/confirm', citicController.confirmCheckDiff);

// ========== 自动调度服务 ==========
router.post('/auto/check', async (req, res, next) => {
  try {
    const { checkDate, channelCode } = req.body;
    const result = await citicAutoService.executeAutoCheck(checkDate, channelCode);
    res.json({ code: 0, message: result.success ? '对账完成' : result.error, data: result });
  } catch (error) {
    next(error);
  }
});
router.post('/auto/settlement', async (req, res, next) => {
  try {
    const { accountNo, settleType } = req.body;
    const result = await citicAutoService.executeAutoSettlement(accountNo, settleType);
    res.json({ code: 0, message: result.success ? '结算申请已提交' : result.error, data: result });
  } catch (error) {
    next(error);
  }
});
router.post('/auto/profit-share', async (req, res, next) => {
  try {
    const { orderNo, tradeAmount, accountNo, receivers } = req.body;
    const result = await citicAutoService.executeAutoProfitShare(orderNo, tradeAmount, accountNo, receivers);
    res.json({ code: 0, message: result.success ? '分账完成' : result.error, data: result });
  } catch (error) {
    next(error);
  }
});
router.post('/auto/collection', async (req, res, next) => {
  try {
    const result = await citicAutoService.executeAutoCollection();
    res.json({ code: 0, message: '归集完成', data: result });
  } catch (error) {
    next(error);
  }
});
router.get('/auto/configs', async (req, res) => {
  res.json({ code: 0, message: 'success', data: citicAutoService.getConfigs() });
});
router.post('/auto/configs', async (req, res, next) => {
  try {
    const { checkConfig, settlementConfig, profitShareConfig, collectionConfig } = req.body;
    if (checkConfig) citicAutoService.updateCheckConfig(checkConfig);
    if (settlementConfig) citicAutoService.updateSettlementConfig(settlementConfig);
    if (profitShareConfig) citicAutoService.updateProfitShareConfig(profitShareConfig);
    if (collectionConfig) citicAutoService.updateCollectionConfig(collectionConfig);
    res.json({ code: 0, message: '配置已更新', data: citicAutoService.getConfigs() });
  } catch (error) {
    next(error);
  }
});

export default router;
