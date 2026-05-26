const express = require('express');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { getRemainingQuota } = require('./games');
const payment = require('../services/payment');

const router = express.Router();

function getToday() {
  return new Date().toISOString().split('T')[0];
}

router.post('/share/claim', authMiddleware, (req, res) => {
  const today = getToday();

  const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const shareDate = user.daily_share_date;
  const shareClaimed = shareDate === today ? (user.daily_share_claimed || 0) : 0;

  if (shareClaimed >= 1) {
    return res.status(400).json({ error: '今日已领取分享奖励' });
  }

  // +1 credit and +1 extra generation
  db.run(
    'UPDATE users SET extra_generations = extra_generations + 1, daily_share_claimed = 1, daily_share_date = ? WHERE id = ?',
    [today, user.id]
  );
  payment.addCredits(user.id, 1, 'share_reward', '每日分享奖励', '');

  const updatedUser = db.get('SELECT * FROM users WHERE id = ?', [user.id]);
  const quota = getRemainingQuota(updatedUser);
  const credits = payment.getCredits(user.id);
  res.json({ success: true, quota, credits });
});

module.exports = router;
