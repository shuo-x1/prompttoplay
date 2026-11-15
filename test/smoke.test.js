/**
 * 冒烟测试（不需要 DeepSeek Key）
 *
 * 启动真实服务 → 健康检查 → 打开在线体验版 → 画廊加载出示例 → 点开第一个能正常渲染 canvas。
 * 目的：防止「改了预览/静态资源，页面白屏」这类低级回归。
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { spawn } = require('child_process');
const { launchBrowser } = require('./helpers/browser');

const ROOT = path.join(__dirname, '..');

async function waitForHealth(baseUrl, timeoutMs = 30000) {
  const started = Date.now();
  for (;;) {
    try {
      const res = await fetch(baseUrl + '/api/health');
      if (res.ok) return await res.json();
    } catch (_) { /* 还没起来 */ }
    if (Date.now() - started > timeoutMs) throw new Error('服务 30 秒内没起来');
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

test('冒烟：服务能起、体验版能加载示例并渲染 canvas', async (t) => {
  const port = 41000 + Math.floor(Math.random() * 2000);
  const baseUrl = `http://127.0.0.1:${port}`;

  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const serverLog = [];
  server.stdout.on('data', (chunk) => serverLog.push(chunk.toString()));
  server.stderr.on('data', (chunk) => serverLog.push(chunk.toString()));

  t.after(() => {
    if (!server.killed) server.kill();
  });

  const health = await waitForHealth(baseUrl);
  assert.equal(health.status, 'ok', '健康检查应返回 ok：' + serverLog.join(''));

  const demoHealth = await (await fetch(baseUrl + '/api/demo/health')).json();
  assert.equal(demoHealth.ok, true);
  assert.equal(typeof demoHealth.serverKey, 'boolean');

  const browser = await launchBrowser();
  t.after(() => browser.close());

  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto(baseUrl + '/demo/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.card', { timeout: 15000 });

  const cardCount = await page.locator('.card').count();
  assert.ok(cardCount >= 9, '画廊示例数量偏少：' + cardCount);

  await page.locator('.card').first().click();
  const frame = page.frameLocator('#stage');
  await frame.locator('canvas').first().waitFor({ timeout: 15000 });

  assert.equal(await frame.locator('canvas').count() > 0, true, '示例游戏里没有渲染出 canvas');
  assert.deepEqual(pageErrors, [], '页面有未捕获异常：' + pageErrors.join('; '));
});
