const db = require('../config/db');

// Pricing (in credits)
const PRICES = {
  remove_watermark: 1,
  pro_upgrade: 10,
  enterprise_upgrade: 30,
  extra_generation: 2
};

// 积分充值套餐（人民币）
const CREDIT_PACKAGES = [
  { id: 'basic',   name: '基础包', price: 10,  credits: 100,  tag: '入门', icon: '🪙' },
  { id: 'popular', name: '热门包', price: 30,  credits: 350,  tag: '超值+50', icon: '⭐' },
  { id: 'premium', name: '豪华包', price: 50,  credits: 700,  tag: '推荐+200', icon: '💎' },
  { id: 'ultra',   name: '尊享包', price: 100, credits: 1500, tag: '最实惠+500', icon: '👑' }
];

function isDevMode() {
  return process.env.DEV_MODE === 'true';
}

// Get user credits
function getCredits(userId) {
  const user = db.get('SELECT credits FROM users WHERE id = ?', [userId]);
  return user ? (user.credits || 0) : 0;
}

// Deduct credits
function spendCredits(userId, amount, type, description, relatedId) {
  const current = getCredits(userId);
  if (current < amount) {
    return { success: false, error: `积分不足！需要 ${amount} 积分，当前只有 ${current} 积分`, current, needed: amount };
  }
  const newBalance = current - amount;
  db.run('UPDATE users SET credits = ? WHERE id = ?', [newBalance, userId]);
  recordTransaction(userId, type, -amount, description, relatedId);
  return { success: true, remaining: newBalance, spent: amount };
}

// Add credits
function addCredits(userId, amount, type, description, relatedId) {
  const current = getCredits(userId);
  const newBalance = current + amount;
  db.run('UPDATE users SET credits = ? WHERE id = ?', [newBalance, userId]);
  recordTransaction(userId, type, amount, description, relatedId);
  return { success: true, remaining: newBalance, added: amount };
}

// Record a transaction
function recordTransaction(userId, type, amount, description, relatedId) {
  const now = new Date().toISOString();
  db.run(
    'INSERT INTO transactions (user_id, type, amount, description, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, type, amount, description, relatedId || null, now]
  );
}

// Get transaction history
function getTransactions(userId, limit = 20) {
  return db.all(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
}

// 充值积分套餐
function buyCreditsPackage(userId, packageId) {
  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
  if (!pkg) return { success: false, error: '无效的套餐' };

  if (isDevMode()) {
    // 开发模式：直接到账
    return addCredits(userId, pkg.credits, 'purchase', `购买 ${pkg.name} (开发模式)`, packageId);
  }

  // 生产模式：创建订单
  const orderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6);
  const now = new Date().toISOString();
  db.run(
    'INSERT INTO payment_orders (order_id, user_id, package_id, amount_yuan, credits, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [orderId, userId, packageId, pkg.price, pkg.credits, 'pending', now]
  );
  return {
    success: true,
    orderId,
    amount: pkg.price,
    credits: pkg.credits,
    status: 'pending',
    message: '订单已创建，请完成支付'
  };
}

// 确认支付（管理员/回调）
function confirmPayment(orderId) {
  const order = db.get('SELECT * FROM payment_orders WHERE order_id = ?', [orderId]);
  if (!order) return { success: false, error: '订单不存在' };
  if (order.status === 'completed') return { success: false, error: '订单已完成' };
  if (order.status === 'cancelled') return { success: false, error: '订单已取消' };

  const pkg = CREDIT_PACKAGES.find(p => p.id === order.package_id);
  if (!pkg) return { success: false, error: '套餐信息错误' };

  // 发放积分
  const result = addCredits(order.user_id, order.credits, 'purchase', `购买 ${pkg.name}`, order.order_id);
  if (!result.success) return result;

  // 更新订单状态
  db.run('UPDATE payment_orders SET status = ?, paid_at = ? WHERE order_id = ?', ['completed', new Date().toISOString(), orderId]);

  return { success: true, remaining: result.remaining, credits: order.credits, message: '支付成功！积分已到账' };
}

// 获取订单状态
function getOrderStatus(orderId) {
  return db.get('SELECT * FROM payment_orders WHERE order_id = ?', [orderId]);
}

// 获取用户订单列表
function getUserOrders(userId, limit = 10) {
  return db.all('SELECT * FROM payment_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
}

// Watermark removal
function purchaseRemoveWatermark(userId, gameId) {
  const game = db.get('SELECT * FROM games WHERE id = ?', [gameId]);
  if (!game) return { success: false, error: '游戏不存在' };
  if (game.watermark_removed) return { success: false, error: '水印已去除' };

  const result = spendCredits(userId, PRICES.remove_watermark, 'remove_watermark', '去除水印', gameId.toString());
  if (!result.success) return result;

  const cleaned = game.html_code.replace(
    /<div id=['"]ptp-watermark['"][^>]*>.*?<\/div>/g, ''
  );
  db.run('UPDATE games SET html_code = ?, watermark_removed = 1 WHERE id = ?', [cleaned, gameId]);

  return { success: true, remaining: result.remaining, message: '水印已成功去除！' };
}

// Plan upgrade
function purchasePlanUpgrade(userId, plan) {
  const price = plan === 'enterprise' ? PRICES.enterprise_upgrade : PRICES.pro_upgrade;
  const user = db.get('SELECT plan, credits FROM users WHERE id = ?', [userId]);

  if (user.plan === plan) return { success: false, error: `您已经是 ${plan === 'pro' ? 'Pro' : '企业版'} 用户` };
  if (user.plan === 'enterprise') return { success: false, error: '企业版已是最高的等级' };
  if (plan === 'enterprise' && user.plan === 'pro') {
    const diff = PRICES.enterprise_upgrade - PRICES.pro_upgrade;
    return doUpgrade(userId, plan, diff, 'plan_upgrade', `升级到${plan === 'pro' ? 'Pro' : '企业版'}`);
  }
  return doUpgrade(userId, plan, price, 'plan_upgrade', `升级到${plan === 'pro' ? 'Pro' : '企业版'}`);
}

function doUpgrade(userId, plan, price, type, description) {
  const result = spendCredits(userId, price, type, description, '');
  if (!result.success) return result;
  db.run('UPDATE users SET plan = ? WHERE id = ?', [plan, userId]);
  return { success: true, remaining: result.remaining, plan, message: `已升级到 ${plan === 'pro' ? 'Pro' : '企业版'}！` };
}

// Extra generation
function purchaseExtraGeneration(userId) {
  const result = spendCredits(userId, PRICES.extra_generation, 'extra_generation', '购买额外生成次数', '');
  if (!result.success) return result;
  db.run('UPDATE users SET extra_generations = extra_generations + 1 WHERE id = ?', [userId]);
  return { success: true, remaining: result.remaining, message: '获得 +1 次生成机会！' };
}

// Dev mode free credits
function devAddCredits(userId) {
  if (!isDevMode()) return { success: false, error: '开发模式未开启' };
  return addCredits(userId, 99, 'dev_recharge', '开发模式充值', '');
}

module.exports = {
  getCredits, spendCredits, addCredits, getTransactions,
  purchaseRemoveWatermark, purchasePlanUpgrade, purchaseExtraGeneration,
  devAddCredits, buyCreditsPackage, confirmPayment, getOrderStatus, getUserOrders,
  PRICES, CREDIT_PACKAGES, isDevMode
};
