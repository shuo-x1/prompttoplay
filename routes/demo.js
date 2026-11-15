/**
 * 在线体验版（web/）用的极简生成接口。
 *
 * 和 /api/generate 的区别：不登录、不建游戏记录、不扣配额，
 * 只做「一句话 -> HTML」这一件事，供展示 / 面试演示 / 本地无配置启动时使用。
 *
 * Key 来源优先级：请求头 X-DeepSeek-Key > 服务端环境变量 DEEPSEEK_API_KEY。
 */
const express = require('express');
const { generateGame } = require('../services/deepseek');
const { detectGameType } = require('../web/prompt');

const router = express.Router();

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => t > now - WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    return res.status(429).json({ error: `生成太频繁了，每分钟最多 ${MAX_PER_WINDOW} 次，稍等一下` });
  }
  recent.push(now);
  hits.set(ip, recent);
  next();
}

// 体验版页面启动时探测：是否存在同源代理、服务端有没有 Key
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    serverKey: Boolean(process.env.DEEPSEEK_API_KEY),
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  });
});

router.post('/generate', rateLimit, async (req, res) => {
  const prompt = String(req.body && req.body.prompt ? req.body.prompt : '').trim();
  const style = String((req.body && req.body.style) || '').trim();
  const key = String(req.get('X-DeepSeek-Key') || '').trim();

  if (prompt.length < 2) return res.status(400).json({ error: '请先写一句游戏描述' });
  if (prompt.length > 500) return res.status(400).json({ error: '描述太长了，200 字以内即可' });
  if (!key && !process.env.DEEPSEEK_API_KEY) {
    return res.status(400).json({ error: '服务端没有配置 DEEPSEEK_API_KEY，请在页面里填自己的 Key' });
  }

  const startedAt = Date.now();
  try {
    const html = await generateGame(prompt, null, style, key || undefined);
    console.log(`[demo] ${detectGameType(prompt)} ${html.length} chars ${Date.now() - startedAt}ms`);
    res.json({ html, meta: { gameType: detectGameType(prompt), ms: Date.now() - startedAt } });
  } catch (err) {
    const noKey = err && (err.code === 'NO_API_KEY' || err.message === 'NO_API_KEY');
    const status = noKey ? 400 : 500;
    console.error('[demo] generate failed:', err.message);
    res.status(status).json({
      error: noKey ? '没有可用的 API Key' : (err.code === 'OUTPUT_TRUNCATED'
        ? '这次生成的游戏太长被截断了，把描述收敛一点再试'
        : (err.message === 'NO_HTML_TAG' ? '模型这次没返回完整 HTML，再试一次' : '生成失败：' + err.message))
    });
  }
});

module.exports = router;
