/**
 * 安全回归测试（不需要真实数据库 / DeepSeek Key）
 *
 * 1) 沙箱：模型生成的代码在预览 iframe 里跑，读不到父页面的 localStorage（登录 token）。
 *    同时留了一个「旧写法」对照组，证明这条测试真的能抓到回归 —— 去掉 allow-same-origin 之前的写法
 *    在对照里依然是能读到的。
 * 2) 转义：用户内容（游戏标题来自 prompt）进 HTML 前必须被 escapeHtml 转义。
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { launchBrowser, startStaticServer, waitForResults } = require('./helpers/browser');

const SANDBOX_FIXTURE = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>sandbox fixture</title></head>
<body>
<div id="host"></div>
<script src="/app.js"></script>
<script>
  // 模拟一个已经登录的用户：JWT 存在 localStorage 里（真实项目就是这样存的）
  localStorage.setItem('ptp_token', 'SECRET-TOKEN-for-test');

  function makePayload(label) {
    return '<' + 'script>' +
      'function report(ok, extra) {' +
      '  parent.postMessage({ source: "payload", label: "' + label + '", ok: ok, extra: extra }, "*");' +
      '}' +
      'try {' +
      '  var token = window.parent.localStorage.getItem("ptp_token");' +
      '  report(true, token);' +
      '} catch (err) {' +
      '  report(false, err && err.name);' +
      '}' +
      '<' + '/script>';
  }

  window.__results = [];
  window.addEventListener('message', function (event) {
    if (event.data && event.data.source === 'payload') window.__results.push(event.data);
  });

  var host = document.getElementById('host');

  // ① 被测实现：走 app.js 里的 renderGameFrame（沙箱不给 allow-same-origin）
  var hardened = document.createElement('iframe');
  host.appendChild(hardened);
  window.renderGameFrame(hardened, makePayload('hardened'));

  // ② 对照组：故意用修复前的属性组合，证明这条测试确实抓得住问题
  var legacy = document.createElement('iframe');
  legacy.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  host.appendChild(legacy);
  legacy.srcdoc = makePayload('legacy');
</script>
</body>
</html>`;

test('沙箱：生成代码读不到父页面的登录 token', async (t) => {
  const server = await startStaticServer({ 'sandbox.html': SANDBOX_FIXTURE });
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await server.close();
  });

  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto(server.origin + '/__fixture/sandbox.html');
  const results = await waitForResults(page, 2);

  const hardened = results.find((item) => item.label === 'hardened');
  const legacy = results.find((item) => item.label === 'legacy');

  assert.ok(hardened, '没收到被测 iframe 的结果');
  assert.equal(hardened.ok, false, '被测沙箱居然读到了父页面的 token');
  assert.equal(hardened.extra, 'SecurityError', '期望被浏览器拦下并抛 SecurityError，实际是：' + hardened.extra);

  // 对照组：旧写法确实能读到 —— 保证这条测试不是「假绿」
  assert.ok(legacy, '没收到对照组 iframe 的结果');
  assert.equal(legacy.ok, true, '对照组都读不到 token，说明测试环境有问题，结论不可信');
  assert.match(String(legacy.extra), /^SECRET-TOKEN-/, '对照组应能读到测试塞进去的 token');

  assert.deepEqual(pageErrors, [], '页面不应有未捕获异常：' + pageErrors.join('; '));
});

test('转义：用户内容不能带出 HTML 标签和引号', async (t) => {
  const server = await startStaticServer({});
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await server.close();
  });

  const page = await browser.newPage();
  await page.goto(server.origin + '/__fixture/missing.html'); // 404 页也行，只要同源能执行脚本

  const escaped = await page.evaluate(async () => {
    const script = document.createElement('script');
    script.src = '/app.js';
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return {
      html: window.escapeHtml('<img src=x onerror="alert(1)">'),
      quote: window.escapeHtml('a" onmouseover="alert(1)'),
      nullish: window.escapeHtml(null),
    };
  });

  assert.equal(escaped.html, '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(escaped.quote, 'a&quot; onmouseover=&quot;alert(1)');
  assert.equal(escaped.nullish, '');

  // 真正塞进 DOM 之后也应该只是一个文本节点，不会生成 img 元素
  const injected = await page.evaluate(() => {
    const box = document.createElement('div');
    box.innerHTML = window.escapeHtml('<img src=x onerror="window.__xss = true">');
    return { tags: box.querySelectorAll('img').length, text: box.textContent, xss: Boolean(window.__xss) };
  });
  assert.equal(injected.tags, 0, '转义后不应出现 img 标签');
  assert.equal(injected.xss, false);
  assert.match(injected.text, /<img/);
});
