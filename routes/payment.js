const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const payment = require('../services/payment');

const router = express.Router();

// GET /api/payment/credits
router.get('/credits', authMiddleware, (req, res) => {
  const credits = payment.getCredits(req.user.id);
  res.json({ credits, devMode: payment.isDevMode() });
});

// GET /api/payment/packages - 充值套餐列表
router.get('/packages', (req, res) => {
  res.json({ packages: payment.CREDIT_PACKAGES, devMode: payment.isDevMode() });
});

// GET /api/payment/transactions
router.get('/transactions', authMiddleware, (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const transactions = payment.getTransactions(req.user.id);
  res.json({ transactions });
});

// GET /api/payment/orders
router.get('/orders', authMiddleware, (req, res) => {
  const orders = payment.getUserOrders(req.user.id);
  res.json({ orders });
});

// POST /api/payment/buy-credits - 购买积分套餐
router.post('/buy-credits', authMiddleware, (req, res) => {
  const { packageId } = req.body;
  if (!packageId) return res.status(400).json({ error: '请选择套餐' });

  const result = payment.buyCreditsPackage(req.user.id, packageId);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// POST /api/payment/confirm-order - 确认支付订单
router.post('/confirm-order', authMiddleware, (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: '缺少订单号' });

  const result = payment.confirmPayment(orderId);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// POST /api/payment/remove-watermark
router.post('/remove-watermark', authMiddleware, (req, res) => {
  const { gameId } = req.body;
  if (!gameId) return res.status(400).json({ error: '缺少游戏 ID' });

  const result = payment.purchaseRemoveWatermark(req.user.id, gameId);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// POST /api/payment/upgrade
router.post('/upgrade', authMiddleware, (req, res) => {
  const { plan } = req.body;
  if (!plan || !['pro', 'enterprise'].includes(plan)) {
    return res.status(400).json({ error: '无效的计划类型' });
  }

  const result = payment.purchasePlanUpgrade(req.user.id, plan);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// POST /api/payment/buy-generation
router.post('/buy-generation', authMiddleware, (req, res) => {
  const result = payment.purchaseExtraGeneration(req.user.id);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// POST /api/payment/dev-recharge
router.post('/dev-recharge', authMiddleware, (req, res) => {
  const result = payment.devAddCredits(req.user.id);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// Legacy
router.post('/', (req, res) => {
  res.status(200).json({ received: true, note: 'Using credit system' });
});

module.exports = router;
