/**
 * 把内置演示游戏导出为静态文件，供 web/ 在线体验版直接读取。
 *
 * 用法：node scripts/export-demos.js
 * 产出：web/demos/game-XX.html + web/demos/demos.json
 */
const fs = require('fs');
const path = require('path');
const { DEMO_GAMES } = require('./seed-games');

const OUT_DIR = path.join(__dirname, '..', 'web', 'demos');

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifest = DEMO_GAMES.map((game, index) => {
    const file = `game-${String(index + 1).padStart(2, '0')}.html`;
    const html = game.html.trim();
    fs.writeFileSync(path.join(OUT_DIR, file), html, 'utf8');
    return {
      title: game.title,
      category: game.category,
      description: game.description,
      file,
      size: Buffer.byteLength(html, 'utf8'),
    };
  });

  fs.writeFileSync(
    path.join(OUT_DIR, 'demos.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8'
  );

  const total = manifest.reduce((sum, item) => sum + item.size, 0);
  console.log(`导出 ${manifest.length} 个演示游戏 -> web/demos/（共 ${(total / 1024).toFixed(0)} KB）`);
}

main();
