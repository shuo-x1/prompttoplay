const express = require('express');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { getRemainingQuota } = require('./games');

const router = express.Router();

router.get('/me', authMiddleware, (req, res) => {
  const user = db.get(
    'SELECT id, email, plan, daily_generations_used, daily_generations_date, extra_generations, daily_share_claimed, daily_share_date, invitation_code, credits FROM users WHERE id = ?',
    [req.user.id]
  );

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const quota = getRemainingQuota(user);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      plan: user.plan,
      invitation_code: user.invitation_code,
      credits: user.credits || 0,
      quota
    }
  });
});

router.get('/stats', authMiddleware, (req, res) => {
  const gameStats = db.get(
    'SELECT COUNT(*) as total_games, COALESCE(SUM(plays), 0) as total_plays FROM games WHERE user_id = ?',
    [req.user.id]
  );

  const remixStats = db.get(
    'SELECT COALESCE(SUM(remix_count), 0) as total_remixes FROM games WHERE user_id = ?',
    [req.user.id]
  );

  const currentUser = db.get('SELECT email FROM users WHERE id = ?', [req.user.id]);

  const inviteStats = db.get(
    'SELECT COUNT(*) as invited_users_count FROM users WHERE invited_by = ?',
    [currentUser ? currentUser.email : '']
  );

  res.json({
    total_plays: (gameStats && gameStats.total_plays) || 0,
    total_remixes: (remixStats && remixStats.total_remixes) || 0,
    total_games: (gameStats && gameStats.total_games) || 0,
    invited_users_count: (inviteStats && inviteStats.invited_users_count) || 0
  });
});

router.get('/games', authMiddleware, (req, res) => {
  const games = db.all(
    'SELECT * FROM games WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ games });
});

module.exports = router;
