/**
 * DGKJ 支付平台 - 支付回调路由
 */

import { Router } from 'express';
import payService from './pay.service';

const router = Router();

/**
 * 微信支付回调
 * POST /basic-api/pay/callback/wechat
 */
router.post('/callback/wechat', async (req, res) => {
  try {
    const result = await payService.handleCallback('wechat', req.body);
    
    if (result.success) {
      res.type('xml').send(result.message || 'success');
    } else {
      res.type('xml').status(400).send(result.message || 'fail');
    }
  } catch (error: any) {
    console.error('微信支付回调处理失败:', error);
    res.type('xml').status(500).send('error');
  }
});

/**
 * 支付宝回调
 * POST /basic-api/pay/callback/alipay
 */
router.post('/callback/alipay', async (req, res) => {
  try {
    const result = await payService.handleCallback('alipay', req.body);
    
    if (result.success) {
      res.send('success');
    } else {
      res.status(400).send('fail');
    }
  } catch (error: any) {
    console.error('支付宝回调处理失败:', error);
    res.status(500).send('error');
  }
});

/**
 * 银联支付回调
 * POST /basic-api/pay/callback/unionpay
 */
router.post('/callback/unionpay', async (req, res) => {
  try {
    const result = await payService.handleCallback('unionpay', req.body);
    
    if (result.success) {
      res.json({ status: 'success' });
    } else {
      res.status(400).json({ status: 'fail', message: result.message });
    }
  } catch (error: any) {
    console.error('银联支付回调处理失败:', error);
    res.status(500).json({ status: 'error' });
  }
});

/**
 * 通用回调处理
 * POST /basic-api/pay/callback/:channelCode
 */
router.post('/callback/:channelCode', async (req, res) => {
  try {
    const { channelCode } = req.params;
    const result = await payService.handleCallback(channelCode, req.body);
    
    if (result.success) {
      res.json({ code: 'SUCCESS', message: '处理成功' });
    } else {
      res.status(400).json({ code: 'FAIL', message: result.message });
    }
  } catch (error: any) {
    console.error('支付回调处理失败:', error);
    res.status(500).json({ code: 'ERROR', message: error.message });
  }
});

export default router;
