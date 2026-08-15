/**
 * 游戏元数据生成服务
 * 自动生成游戏介绍文本和SVG封面图
 */

const CATEGORY_INFO = {
  action: { name: '动作', icon: '⚔️', colors: ['#ff6b6b', '#ee5a24'], desc: '动作冒险' },
  shooting: { name: '射击', icon: '🚀', colors: ['#4ecdc4', '#44a08d'], desc: '射击挑战' },
  puzzle: { name: '益智', icon: '🧩', colors: ['#a78bfa', '#7c3aed'], desc: '益智解谜' },
  match3: { name: '消除', icon: '💎', colors: ['#feca57', '#ff9f43'], desc: '三消游戏' },
  tower: { name: '塔防', icon: '🏰', colors: ['#54a0ff', '#2e86de'], desc: '塔防策略' },
  racing: { name: '竞速', icon: '🏎️', colors: ['#ff6b6b', '#feca57'], desc: '赛车竞速' },
  simulation: { name: '模拟', icon: '🏪', colors: ['#1dd1a1', '#10ac84'], desc: '模拟经营' },
  sports: { name: '体育', icon: '⚽', colors: ['#5f27cd', '#341f97'], desc: '体育竞技' },
  other: { name: '休闲', icon: '🎮', colors: ['#ff9ff3', '#f368e0'], desc: '休闲娱乐' },
  general: { name: '休闲', icon: '🎮', colors: ['#ff9ff3', '#f368e0'], desc: '休闲娱乐' }
};

/**
 * 根据提示词和类型生成游戏介绍
 */
function generateDescription(prompt, category) {
  const info = CATEGORY_INFO[category] || CATEGORY_INFO.general;
  const cleanPrompt = prompt.replace(/[。.！!？?]/g, '').trim();
  
  const templates = [
    `${cleanPrompt}。这是一款${info.name}类游戏，包含完整的游戏循环、计分系统和难度递增机制，支持键盘和触摸操作。`,
    `基于"${cleanPrompt}"打造的${info.desc}游戏。拥有精美的视觉效果、流畅的操作手感和丰富的游戏内容，快来挑战吧！`,
    `${info.icon} ${cleanPrompt}。${info.name}游戏新体验，多关卡设计、道具系统、特效拉满，让你停不下来！`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * 生成SVG封面图（data URI格式）
 */
function generateCoverImage(title, category) {
  const info = CATEGORY_INFO[category] || CATEGORY_INFO.general;
  const [c1, c2] = info.colors;
  const safeTitle = title.substring(0, 20).replace(/[<>&"']/g, '');
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${c2};stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#fff;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#fff;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="400" height="240" fill="url(#bg)"/>
  <circle cx="320" cy="60" r="80" fill="url(#glow)"/>
  <circle cx="80" cy="180" r="60" fill="url(#glow)"/>
  <!-- 装饰圆点 -->
  <circle cx="50" cy="40" r="4" fill="rgba(255,255,255,0.4)"/>
  <circle cx="350" cy="200" r="6" fill="rgba(255,255,255,0.3)"/>
  <circle cx="200" cy="30" r="3" fill="rgba(255,255,255,0.5)"/>
  <!-- 大图标 -->
  <text x="200" y="110" font-size="64" text-anchor="middle" dominant-baseline="middle">${info.icon}</text>
  <!-- 游戏标题 -->
  <text x="200" y="165" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="middle">${safeTitle}</text>
  <!-- 分类标签 -->
  <rect x="150" y="190" width="100" height="28" rx="14" fill="rgba(255,255,255,0.25)"/>
  <text x="200" y="209" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="middle">${info.name}游戏</text>
</svg>`;

  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

module.exports = { generateDescription, generateCoverImage, CATEGORY_INFO };
