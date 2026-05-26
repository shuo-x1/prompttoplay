require('dotenv').config();

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

app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }), paymentRoutes);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', gameRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', shareRoutes);

initDb(async (err) => {
  if (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }

  // 自动 seed：如果数据库中没有游戏，自动插入演示游戏
  const { all } = require('./config/db');
  const existingGames = all('SELECT COUNT(*) as count FROM games');
  if (existingGames[0].count === 0) {
    console.log('No games found, seeding demo games...');
    try {
      const { seedGames } = require('./scripts/seed-games');
      seedGames();
    } catch (seedErr) {
      console.error('Seed failed (non-fatal):', seedErr.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`PromptToPlay server running on http://localhost:${PORT}`);
  });
});
