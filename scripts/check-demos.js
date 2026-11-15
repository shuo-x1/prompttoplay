/**
 * 静态检查 web/demos 里的示例游戏：
 *   1) 文件是否完整收尾（</html>）
 *   2) 每段内联 <script> 是否能通过 JS 语法解析
 *
 * 不启动浏览器也能挡住「模型输出被截断 / 括号没闭合」这类最常见的问题。
 * 用法：node scripts/check-demos.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DEMO_DIR = path.join(__dirname, '..', 'web', 'demos');

function readManifests() {
  const files = [];
  for (const name of ['demos.json', 'ai-samples.json']) {
    const file = path.join(DEMO_DIR, name);
    if (!fs.existsSync(file)) continue;
    const items = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const item of items) {
      if (item.ok === false) continue;
      files.push({ file: item.file, title: item.title });
    }
  }
  return files;
}

function checkOne(entry) {
  const full = path.join(DEMO_DIR, entry.file);
  if (!fs.existsSync(full)) return { ...entry, problems: ['文件不存在'] };

  const html = fs.readFileSync(full, 'utf8');
  const problems = [];

  if (!/<\/html>\s*$/i.test(html)) problems.push('没有以 </html> 结尾（很可能是生成时被截断）');

  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  if (scripts.length === 0) problems.push('没有任何内联 <script>');

  scripts.forEach((match, index) => {
    const code = match[1];
    if (!code.trim()) return;
    try {
      new vm.Script(code, { filename: `${entry.file}#script${index + 1}` });
    } catch (err) {
      problems.push(`第 ${index + 1} 段脚本语法错误：${err.message}`);
    }
  });

  return { ...entry, bytes: Buffer.byteLength(html, 'utf8'), scripts: scripts.length, problems };
}

function main() {
  const entries = readManifests();
  if (entries.length === 0) {
    console.error('没找到 demos.json / ai-samples.json，先跑 npm run export-demos');
    process.exit(1);
  }

  const results = entries.map(checkOne);
  const failed = results.filter((item) => item.problems.length > 0);

  for (const item of results) {
    const size = ((item.bytes || 0) / 1024).toFixed(0) + 'KB';
    const state = item.problems.length ? '✗ ' + item.problems.join('；') : '✓';
    console.log(`${state.padEnd(2)} ${(item.title || item.file).padEnd(16)} ${size.padStart(6)}  ${item.scripts || 0} 段脚本`);
  }

  console.log(`\n${results.length - failed.length}/${results.length} 个游戏通过检查`);
  if (failed.length) process.exit(1);
}

main();
