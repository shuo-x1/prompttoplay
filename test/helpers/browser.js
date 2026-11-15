/**
 * 测试用的小工具：启动浏览器 + 一个只读静态服务器
 *
 * 浏览器优先用系统已装的 Edge / Chrome（CI 上先跑 `npx playwright install chromium`，
 * 就会退回到 Playwright 自带的 Chromium）。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

async function launchBrowser() {
  const attempts = [{ channel: 'msedge' }, { channel: 'chrome' }, {}];
  let lastError;
  for (const options of attempts) {
    try {
      return await chromium.launch({ headless: true, ...options });
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error('找不到可用浏览器，请先执行 npx playwright install chromium。原始错误：' + lastError.message);
}

/**
 * 起一个静态服务器：
 *   /app.js、/style.css …   -> public/
 *   /__fixture/<name>.html  -> 由 fixtures 对象动态返回
 */
function startStaticServer(fixtures = {}) {
  const publicDir = path.join(__dirname, '..', '..', 'public');

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);

    const fixtureName = urlPath.startsWith('/__fixture/') ? urlPath.slice('/__fixture/'.length) : null;
    if (fixtureName && fixtures[fixtureName]) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fixtures[fixtureName]);
      return;
    }

    const filePath = path.join(publicDir, urlPath === '/' ? 'index.html' : urlPath);
    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        origin: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

/** 等着被测试页把结果写进 window.__results */
async function waitForResults(page, count, timeout = 5000) {
  await page.waitForFunction(
    (expected) => window.__results && window.__results.length >= expected,
    count,
    { timeout }
  );
  return page.evaluate(() => window.__results);
}

module.exports = { launchBrowser, startStaticServer, waitForResults };
