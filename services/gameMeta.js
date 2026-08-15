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
  survivor: { name: '生存', icon: '🧛', colors: ['#8e44ad', '#6c5ce7'], desc: '幸存者割草' },
  other: { name: '休闲', icon: '🎮', colors: ['#ff9ff3', '#f368e0'], desc: '休闲娱乐' },
  general: { name: '休闲', icon: '🎮', colors: ['#ff9ff3', '#f368e0'], desc: '休闲娱乐' }
};

const STYLE_INFO = {
  neon:   { name: '霓虹赛博', icon: '🌃', colors: ['#0a0a1a', '#00f5ff'], accent: '#ff00ff' },
  candy:  { name: '糖果卡通', icon: '🍬', colors: ['#667eea', '#f5576c'], accent: '#ffe66d' },
  forest: { name: '森林自然', icon: '🌲', colors: ['#134e5e', '#71b280'], accent: '#f9d423' },
  sunset: { name: '日落暖橙', icon: '🌅', colors: ['#ff6e7f', '#ff8c42'], accent: '#ffd700' },
  pixel:  { name: '像素复古', icon: '👾', colors: ['#1a1c2c', '#3b82f6'], accent: '#eab308' },
  ink:    { name: '水墨中国', icon: '🏔️', colors: ['#2c2c2c', '#555555'], accent: '#c0392b' },
  dark:   { name: '暗黑哥特', icon: '🦇', colors: ['#1a0a2e', '#6a0dad'], accent: '#b8860b' },
  ocean:  { name: '海洋清新', icon: '🌊', colors: ['#0077b6', '#00b4d8'], accent: '#ff7f50' }
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
 * 支持根据风格(style)生成不同配色
 */
function generateCoverImage(title, category, style) {
  const info = CATEGORY_INFO[category] || CATEGORY_INFO.general;
  const styleInfo = STYLE_INFO[style];

  // 如果有风格，用风格配色；否则用分类配色
  let c1, c2, accent, styleLabel;
  if (styleInfo) {
    [c1, c2] = styleInfo.colors;
    accent = styleInfo.accent;
    styleLabel = styleInfo.name;
  } else {
    [c1, c2] = info.colors;
    accent = '#ffffff';
    styleLabel = null;
  }

  const safeTitle = title.substring(0, 20).replace(/[<>&"']/g, '');

  // 像素风特殊处理：方块像素感
  const isPixel = style === 'pixel';
  const isInk = style === 'ink';

  // 水墨风特殊：米白底+墨色
  let bgRect, decorCircles, iconColor, titleColor, tagBg, tagColor;
  if (isInk) {
    bgRect = '<rect width="400" height="240" fill="#f5f0e1"/>';
    decorCircles = `
      <circle cx="320" cy="60" r="70" fill="rgba(44,44,44,0.06)"/>
      <circle cx="80" cy="180" r="50" fill="rgba(192,57,43,0.08)"/>`;
    iconColor = '#2c2c2c';
    titleColor = '#2c2c2c';
    tagBg = 'rgba(192,57,43,0.85)';
    tagColor = '#f5f0e1';
  } else if (isPixel) {
    bgRect = `<rect width="400" height="240" fill="${c1}"/>`;
    decorCircles = `
      <rect x="40" y="30" width="8" height="8" fill="${accent}" opacity="0.6"/>
      <rect x="340" y="50" width="8" height="8" fill="${accent}" opacity="0.4"/>
      <rect x="60" y="190" width="8" height="8" fill="${c2}" opacity="0.5"/>
      <rect x="300" y="180" width="8" height="8" fill="${accent}" opacity="0.3"/>
      <rect x="200" y="20" width="8" height="8" fill="${c2}" opacity="0.4"/>`;
    iconColor = '#fff';
    titleColor = '#fff';
    tagBg = accent;
    tagColor = '#1a1c2c';
  } else {
    bgRect = `<rect width="400" height="240" fill="url(#bg)"/>`;
    decorCircles = `
      <circle cx="320" cy="60" r="80" fill="url(#glow)"/>
      <circle cx="80" cy="180" r="60" fill="url(#glow)"/>
      <circle cx="50" cy="40" r="4" fill="rgba(255,255,255,0.4)"/>
      <circle cx="350" cy="200" r="6" fill="rgba(255,255,255,0.3)"/>
      <circle cx="200" cy="30" r="3" fill="rgba(255,255,255,0.5)"/>`;
    iconColor = '#fff';
    titleColor = '#fff';
    tagBg = 'rgba(255,255,255,0.25)';
    tagColor = '#fff';
  }

  // 风格标签（右下角小标签）
  const styleTag = styleLabel ? `
    <rect x="280" y="195" width="100" height="24" rx="12" fill="${isInk ? 'rgba(44,44,44,0.7)' : 'rgba(0,0,0,0.3)'}"/>
    <text x="330" y="211" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="middle">${styleInfo.icon} ${styleLabel}</text>` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${c2};stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:0.25" />
      <stop offset="100%" style="stop-color:#fff;stop-opacity:0" />
    </radialGradient>
  </defs>
  ${bgRect}
  ${decorCircles}
  <text x="200" y="105" font-size="64" text-anchor="middle" dominant-baseline="middle">${info.icon}</text>
  <text x="200" y="160" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="${titleColor}" text-anchor="middle" dominant-baseline="middle">${safeTitle}</text>
  <rect x="150" y="185" width="100" height="26" rx="13" fill="${tagBg}"/>
  <text x="200" y="202" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="${tagColor}" text-anchor="middle" dominant-baseline="middle">${info.name}游戏</text>
  ${styleTag}
</svg>`;

  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

module.exports = { generateDescription, generateCoverImage, CATEGORY_INFO, STYLE_INFO };
