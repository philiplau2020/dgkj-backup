import { Router } from 'express';
import citicController from './controller';
import citicAutoService from './auto.service';
import { authGuard } from '../../common/middleware/auth.middleware';

const router = Router();
router.use(authGuard);

// ========== 账户管理 ==========
router.get('/account/list', citicController.getAccountList.bind(citicController));
router.get('/account/info', citicController.getAccountInfo.bind(citicController));
router.get('/account/stats', citicController.getAccountStats.bind(citicController));
router.get('/account/balance', citicController.queryBalance.bind(citicController));
router.get('/account/records', citicController.getAccountRecords.bind(citicController));
router.post('/account/register', citicController.registerAccount.bind(citicController));
router.post('/account', citicController.registerAccount.bind(citicController));
router.put('/account/:id', citicController.updateAccount.bind(citicController));

// ========== 银行卡管理 ==========
router.get('/card/list', citicController.getCardList.bind(citicController));
router.post('/card/bind', citicController.bindCard.bind(citicController));
router.post('/card/unbind', citicController.unbindCard.bind(citicController));
router.post('/card', citicController.bindCard.bind(citicController));
router.delete('/card/:id', citicController.deleteCard.bind(citicController));

// ========== 资金归集 ==========
router.get('/collection/list', citicController.getCollectionList.bind(citicController));
router.post('/collection/set', citicController.setCollection.bind(citicController));
router.post('/collection/active', citicController.activeCollection.bind(citicController));
router.delete('/collection/:id', citicController.deleteCollection.bind(citicController));

// ========== 余额分账 ==========
router.get('/profit-share/list', citicController.getProfitShareList.bind(citicController));
router.post('/profit-share/execute', citicController.executeProfitShare.bind(citicController));
router.delete('/profit-share/:id', citicController.deleteProfitShare.bind(citicController));

// ========== 代付打款 ==========
router.get('/transfer/list', citicController.getTransferList.bind(citicController));
router.post('/transfer/pay', citicController.createTransfer.bind(citicController));
router.get('/transfer/query', citicController.queryTransfer.bind(citicController));
router.post('/transfer/confirm', citicController.confirmTransfer.bind(citicController));

// ========== 结算管理 ==========
router.get('/settlement/list', citicController.getSettlementList.bind(citicController));
router.post('/settlement/apply', citicController.applySettlement.bind(citicController));
router.post('/settlement/confirm', citicController.confirmSettlement.bind(citicController));
router.post('/settlement/cancel', citicController.cancelSettlement.bind(citicController));

// ========== 对账管理 ==========
router.get('/check/list', citicController.getCheckList.bind(citicController));
router.post('/check/trigger', citicController.triggerCheck.bind(citicController));
router.get('/check/download', citicController.downloadCheckBill.bind(citicController));
router.get('/check/diff/list', citicController.getCheckDiffList.bind(citicController));
router.post('/check/diff/confirm', citicController.confirmCheckDiff.bind(citicController));

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
