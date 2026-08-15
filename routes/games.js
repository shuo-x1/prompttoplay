const express = require('express');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { generateGame, detectGameType } = require('../services/deepseek');
const { injectWatermark, shouldWatermark } = require('../services/watermark');
const { generateDescription, generateCoverImage } = require('../services/gameMeta');

const router = express.Router();

const PLAN_QUOTAS = { free: 3, pro: 400, enterprise: 3000 };

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getRemainingQuota(user) {
  const today = getToday();
  const dailyLimit = PLAN_QUOTAS[user.plan] || 3;
  const dailyUsed = (user.daily_generations_date === today) ? (user.daily_generations_used || 0) : 0;
  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);
  const extra = user.extra_generations || 0;
  return { dailyRemaining, extra, total: dailyRemaining + extra };
}

// Check and deduct quota. Returns { remaining, used } or null if exhausted
function checkAndDeductQuota(userId, plan) {
  const today = getToday();
  const user = db.get(
    'SELECT daily_generations_used, daily_generations_date, extra_generations FROM users WHERE id = ?',
    [userId]
  );
  if (!user) return null;

  let dailyUsed = user.daily_generations_used || 0;
  const dailyDate = user.daily_generations_date;
  let extra = user.extra_generations || 0;

  if (dailyDate !== today) {
    dailyUsed = 0;
  }

  const dailyLimit = PLAN_QUOTAS[plan] || 3;

  if (dailyUsed < dailyLimit) {
    const newDailyUsed = dailyUsed + 1;
    db.run(
      'UPDATE users SET daily_generations_used = ?, daily_generations_date = ? WHERE id = ?',
      [newDailyUsed, today, userId]
    );
    return { remaining: (dailyLimit - newDailyUsed) + extra, used: 'daily' };
  } else if (extra > 0) {
    db.run(
      'UPDATE users SET extra_generations = extra_generations - 1, daily_generations_used = ?, daily_generations_date = ? WHERE id = ?',
      [dailyUsed, today, userId]
    );
    return { remaining: extra - 1, used: 'extra' };
  }

  return null; // quota exhausted
}

// Refund a quota deduction
function refundQuota(userId, used) {
  if (used === 'daily') {
    db.run('UPDATE users SET daily_generations_used = MAX(0, daily_generations_used - 1) WHERE id = ?', [userId]);
  } else if (used === 'extra') {
    db.run('UPDATE users SET extra_generations = extra_generations + 1 WHERE id = ?', [userId]);
  }
}

// GET /api/games - public
router.get('/games', (req, res) => {
  const { category, search, sort = 'created', page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  let where = 'WHERE g.is_public = 1';
  const params = [];

  if (category && category !== 'all') {
    where += ' AND g.category = ?';
    params.push(category);
  }
  if (search) {
    where += ' AND (g.title LIKE ? OR g.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const orderBy = sort === 'plays' ? 'g.plays DESC' : sort === 'likes' ? 'g.likes DESC' : 'g.created_at DESC';

  const games = db.all(
    `SELECT g.*, COALESCE(u.email, 'PromptToPlay 官方') as creator_email FROM games g
     LEFT JOIN users u ON g.user_id = u.id
     ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  const countRow = db.get(
    `SELECT COUNT(*) as total FROM games g ${where}`,
    params
  );

  res.json({ games, total: countRow ? countRow.total : 0, page: parseInt(page), limit: limitNum });
});

// GET /api/games/:id - public
router.get('/games/:id', (req, res) => {
  const game = db.get(
    `SELECT g.*, COALESCE(u.email, 'PromptToPlay 官方') as creator_email FROM games g
     LEFT JOIN users u ON g.user_id = u.id
     WHERE g.id = ?`,
    [req.params.id]
  );

  if (!game) return res.status(404).json({ error: 'Game not found' });

  db.run('UPDATE games SET plays = plays + 1 WHERE id = ?', [req.params.id]);
  res.json(game);
});

// POST /api/generate - JWT required
router.post('/generate', authMiddleware, (req, res) => {
  const { prompt, category = 'other' } = req.body;
  if (!prompt) return res.status(400).json({ error: '请输入游戏描述' });

  const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const quotaResult = checkAndDeductQuota(user.id, user.plan);
  if (!quotaResult) return res.status(429).json({ error: '配额已用完', retryable: false });

  generateGame(prompt)
    .then((htmlCode) => {
      const shouldAddWatermark = shouldWatermark(user.plan, false);
      const finalHtml = shouldAddWatermark ? injectWatermark(htmlCode) : htmlCode;
      const now = new Date().toISOString();
      const gameCategory = category !== 'other' ? category : detectGameType(prompt);
      const title = prompt.substring(0, 80);
      const description = generateDescription(prompt, gameCategory);
      const coverImage = generateCoverImage(title, gameCategory);

      const result = db.run(
        `INSERT INTO games (user_id, title, description, category, html_code, cover_image, watermark_removed, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [user.id, title, description, gameCategory, finalHtml, coverImage, now, now]
      );
      const gameId = result.lastID;

      // Invite reward: if this is user's first game and they were invited
      if (user.invited_by) {
        const countRow = db.get('SELECT COUNT(*) as count FROM games WHERE user_id = ?', [user.id]);
        if (countRow && countRow.count === 1) {
          db.run('UPDATE users SET extra_generations = extra_generations + 1 WHERE email = ?', [user.invited_by]);
        }
      }

      res.json({ game_id: gameId, html: finalHtml });
    })
    .catch((genErr) => {
      refundQuota(user.id, quotaResult.used);
      console.error('Generation error:', genErr.message);
      const isNoHtml = genErr.message === 'NO_HTML_TAG';
      return res.status(500).json({
        error: isNoHtml ? '生成失败，未扣除配额。请尝试其他描述。' : '生成失败',
        retryable: true
      });
    });
});

// POST /api/generate/iterate - Pro/Enterprise only
router.post('/generate/iterate', authMiddleware, (req, res) => {
  if (req.user.plan !== 'pro' && req.user.plan !== 'enterprise') {
    return res.status(403).json({ error: 'Pro or Enterprise plan required for iteration' });
  }

  const { gameId, prompt } = req.body;
  if (!gameId || !prompt) return res.status(400).json({ error: 'gameId and prompt are required' });

  const game = db.get('SELECT * FROM games WHERE id = ?', [gameId]);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const quotaResult = checkAndDeductQuota(req.user.id, req.user.plan);
  if (!quotaResult) return res.status(429).json({ error: '配额已用完', retryable: false });

  generateGame(prompt, game.html_code)
    .then((htmlCode) => {
      const shouldAddWatermark = shouldWatermark(req.user.plan, game.watermark_removed);
      const finalHtml = shouldAddWatermark ? injectWatermark(htmlCode) : htmlCode;
      const now = new Date().toISOString();

      db.run('UPDATE games SET html_code = ?, updated_at = ? WHERE id = ?', [finalHtml, now, gameId]);
      res.json({ html: finalHtml });
    })
    .catch((genErr) => {
      refundQuota(req.user.id, quotaResult.used);
      const isNoHtml = genErr.message === 'NO_HTML_TAG';
      return res.status(500).json({
        error: isNoHtml ? '生成失败，未扣除配额。请尝试其他描述。' : '生成失败',
        retryable: true
      });
    });
});

// POST /api/games/:id/remix - JWT required
router.post('/games/:id/remix', authMiddleware, (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: '请输入游戏描述' });

  const originalGame = db.get('SELECT * FROM games WHERE id = ?', [req.params.id]);
  if (!originalGame) return res.status(404).json({ error: 'Game not found' });

  const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const quotaResult = checkAndDeductQuota(user.id, user.plan);
  if (!quotaResult) return res.status(429).json({ error: '配额已用完', retryable: false });

  generateGame(prompt, originalGame.html_code)
    .then((htmlCode) => {
      const shouldAddWatermark = shouldWatermark(user.plan, false);
      const finalHtml = shouldAddWatermark ? injectWatermark(htmlCode) : htmlCode;
      const now = new Date().toISOString();
      const title = prompt.substring(0, 80);
      const gameCategory = originalGame.category;
      const description = generateDescription(prompt, gameCategory);
      const coverImage = generateCoverImage(title, gameCategory);

      const result = db.run(
        `INSERT INTO games (user_id, title, description, category, html_code, cover_image, original_game_id, watermark_removed, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [user.id, title, description, gameCategory, finalHtml, coverImage, parseInt(req.params.id), now, now]
      );

      db.run('UPDATE games SET remix_count = remix_count + 1 WHERE id = ?', [req.params.id]);

      // Invite reward on first game
      if (user.invited_by) {
        const countRow = db.get('SELECT COUNT(*) as count FROM games WHERE user_id = ?', [user.id]);
        if (countRow && countRow.count === 1) {
          db.run('UPDATE users SET extra_generations = extra_generations + 1 WHERE email = ?', [user.invited_by]);
        }
      }

      res.json({ game_id: result.lastID, html: finalHtml });
    })
    .catch((genErr) => {
      refundQuota(user.id, quotaResult.used);
      const isNoHtml = genErr.message === 'NO_HTML_TAG';
      return res.status(500).json({
        error: isNoHtml ? '生成失败，未扣除配额。请尝试其他描述。' : '生成失败',
        retryable: true
      });
    });
});

// POST /api/games/:id/like - JWT required, toggle like
router.post('/games/:id/like', authMiddleware, (req, res) => {
  const game = db.get('SELECT * FROM games WHERE id = ?', [req.params.id]);
  if (!game) return res.status(404).json({ error: '游戏不存在' });

  const existing = db.get('SELECT * FROM game_likes WHERE game_id = ? AND user_id = ?', [req.params.id, req.user.id]);
  const now = new Date().toISOString();

  if (existing) {
    // 取消点赞
    db.run('DELETE FROM game_likes WHERE game_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    db.run('UPDATE games SET likes = MAX(0, likes - 1) WHERE id = ?', [req.params.id]);
    res.json({ liked: false, likes: Math.max(0, (game.likes || 0) - 1) });
  } else {
    // 点赞
    db.run('INSERT INTO game_likes (game_id, user_id, created_at) VALUES (?, ?, ?)', [req.params.id, req.user.id, now]);
    db.run('UPDATE games SET likes = likes + 1 WHERE id = ?', [req.params.id]);
    res.json({ liked: true, likes: (game.likes || 0) + 1 });
  }
});

// GET /api/games/:id/liked - check if current user liked
router.get('/games/:id/liked', authMiddleware, (req, res) => {
  const existing = db.get('SELECT * FROM game_likes WHERE game_id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ liked: !!existing });
});

// PUT /api/games/:id - owner only
router.put('/games/:id', authMiddleware, (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: '请输入游戏描述' });

  const game = db.get('SELECT * FROM games WHERE id = ?', [req.params.id]);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const now = new Date().toISOString();
  db.run('UPDATE games SET description = ?, updated_at = ? WHERE id = ?', [prompt, now, req.params.id]);
  res.json({ success: true });
});

// POST /api/games/:id/remove-watermark - use credits
router.post('/games/:id/remove-watermark', authMiddleware, (req, res) => {
  const game = db.get('SELECT * FROM games WHERE id = ?', [req.params.id]);
  if (!game) return res.status(404).json({ error: '游戏不存在' });
  if (game.user_id !== req.user.id) return res.status(403).json({ error: '无权操作' });

  const payment = require('../services/payment');
  const result = payment.purchaseRemoveWatermark(req.user.id, parseInt(req.params.id));

  if (result.success) {
    // Return the cleaned HTML
    const updated = db.get('SELECT html_code FROM games WHERE id = ?', [req.params.id]);
    res.json({ success: true, html: updated.html_code, message: result.message, remaining: result.remaining });
  } else {
    res.status(400).json(result);
  }
});

module.exports = router;
module.exports.getRemainingQuota = getRemainingQuota;
