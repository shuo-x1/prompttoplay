require('dotenv').config();

// ===== 启动前校验 =====
if (!process.env.DEEPSEEK_API_KEY) {
  console.error('FATAL: DEEPSEEK_API_KEY environment variable is required');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

const express = require('express');
const path = require('path');
const { initDb } = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const gameRoutes = require('./routes/games');
const paymentRoutes = require('./routes/payment');
const shareRoutes = require('./routes/share');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 安全 & 解析中间件 =====
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 简单安全响应头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ===== 简易速率限制（内存版，单实例够用）=====
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 分钟
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '60');

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  let record = rateLimitMap.get(ip);
  if (!record || record.timestamps[0] < windowStart) {
    record = { timestamps: [] };
  }
  record.timestamps = record.timestamps.filter(t => t > windowStart);

  if (record.timestamps.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
  }
  record.timestamps.push(now);
  rateLimitMap.set(ip, record);
  next();
}

// 生成接口更严格的限流（10次/分钟）
const genLimitMap = new Map();
const GEN_LIMIT_MAX = 10;
function genRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  let record = genLimitMap.get(ip);
  if (!record) record = { timestamps: [] };
  record.timestamps = record.timestamps.filter(t => t > windowStart);
  if (record.timestamps.length >= GEN_LIMIT_MAX) {
    return res.status(429).json({ error: '生成请求过于频繁，请稍后再试' });
  }
  record.timestamps.push(now);
  genLimitMap.set(ip, record);
  next();
}

// ===== 健康检查（无需认证）=====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: require('./package.json').version
  });
});

// ===== 路由 =====
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }), paymentRoutes);
app.use('/api', rateLimiter);
app.use('/api/generate', genRateLimiter);
app.use('/api/generate/iterate', genRateLimiter);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', gameRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', shareRoutes);

// ===== 404 处理 =====
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API 端点不存在' });
});

// 前端路由 fallback：非 API 请求返回 index.html（SPA 友好）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== 全局错误处理 =====
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.message, err.stack);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: '请求体过大' });
  }
  res.status(500).json({ error: '服务器内部错误' });
});

// ===== 启动 =====
initDb(async (err) => {
  if (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }

  // 自动 seed：如果数据库中没有游戏，自动插入演示游戏
  const { all, run } = require('./config/db');
  const existingGames = all('SELECT COUNT(*) as count FROM games');
  if (existingGames[0].count === 0) {
    console.log('No games found, seeding demo games...');
    try {
      const { seedGames } = require('./scripts/seed-games');
      seedGames();
      console.log('Demo games seeded.');
    } catch (seedErr) {
      console.error('Seed failed (non-fatal):', seedErr.message);
    }
  }

  // 自动补充缺失的封面图（分批处理，避免内存问题）
  try {
    const { generateCoverImage } = require('./services/gameMeta');
    const gamesWithoutCover = all('SELECT id, title, category FROM games WHERE cover_image IS NULL OR cover_image = "" LIMIT 20');
    if (gamesWithoutCover.length > 0) {
      console.log(`补全 ${gamesWithoutCover.length} 个游戏的封面图...`);
      gamesWithoutCover.forEach(g => {
        const cover = generateCoverImage(g.title || '游戏', g.category || 'other');
        run('UPDATE games SET cover_image = ? WHERE id = ?', [cover, g.id]);
      });
      console.log('封面补全完成。');
    }
  } catch (coverErr) {
    console.error('Cover fix failed (non-fatal):', coverErr.message);
  }

  app.listen(PORT, () => {
    console.log(`\n  🎮 PromptToPlay server running on http://localhost:${PORT}`);
    console.log(`  🔧 Health check: http://localhost:${PORT}/api/health`);
    console.log(`  🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
