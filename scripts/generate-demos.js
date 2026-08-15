// 批量生成高质量内置游戏
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { generateGame } = require('../services/deepseek');

const GAMES = [
  { title: '贪吃蛇大作战', category: 'action', prompt: '经典贪吃蛇游戏，蛇吃食物变长，撞墙或撞自己游戏结束。要有开始界面、计分、最高分、难度递增（速度加快）、粒子特效（吃食物时爆炸粒子）、Web Audio音效（吃食物、游戏结束）、屏幕震动、移动端滑动控制、暂停功能。蛇身要有渐变色，食物有脉冲动画。' },
  { title: '打砖块', category: 'action', prompt: '打砖块游戏，控制挡板反弹小球打碎所有砖块。要有开始界面、多条生命、计分、最高分、多种颜色砖块、道具掉落（加长挡板、多球、减速）、粒子特效（砖块碎裂）、音效（击球、碎砖、道具）、鼠标和键盘双控制、关卡通关界面、暂停功能。' },
  { title: '飞机大战', category: 'shooting', prompt: '竖版飞机射击游戏，玩家飞机在底部，敌人从上方下来。要有开始界面、计分、最高分、多种敌人（普通、快速、Boss）、子弹特效、爆炸粒子、道具（火力增强、护盾、炸弹）、Web Audio音效（射击、爆炸、道具）、屏幕震动、移动端触摸控制、暂停功能。背景有滚动星空。' },
  { title: '2048', category: 'puzzle', prompt: '2048数字合并游戏，滑动方块合并相同数字。要有开始界面、计分、最高分、撤销功能、动画过渡（方块滑动和合并动画）、音效（合并、移动、游戏结束）、新方块弹出动画、胜利界面（到2048）、游戏结束界面、键盘和触摸滑动双控制、配色美观。' },
  { title: '记忆翻牌', category: 'puzzle', prompt: '记忆配对翻牌游戏，翻开卡牌找到相同图案配对。要有开始界面、难度选择（简单4x3、中等4x4、困难6x4）、计分（步数和时间）、翻牌3D动画、配对成功特效（粒子+闪光）、音效（翻牌、配对成功、失败、胜利）、通关界面、可重玩。卡牌用emoji图案。' },
  { title: '宝石消消乐', category: 'puzzle', prompt: '三消游戏，交换相邻宝石使三个以上同色连成一线消除。要有开始界面、计分、最高分、连击系统（combo）、消除特效（粒子爆炸）、新宝石下落动画、音效（交换、消除、连击、胜利）、步数限制或时间限制、通关界面、鼠标和触摸双控制。宝石用不同颜色的圆形或菱形。' },
  { title: '太空跑酷', category: 'action', prompt: '横版跑酷游戏，角色自动奔跑，跳跃躲避障碍物收集金币。要有开始界面、计分、最高分、难度递增（速度加快）、多种障碍物（高低不同）、金币收集、二段跳、粒子特效（跑步尘土、收集金币）、音效（跳跃、收集、碰撞）、屏幕震动、移动端点击跳跃、暂停功能。' },
  { title: '五子棋', category: 'puzzle', prompt: '五子棋对弈游戏，玩家对战AI。要有开始界面（选择先手/后手、难度）、棋盘15x15、落子动画、最后一步高亮、胜负判定（五连珠）、悔棋功能、重开功能、音效（落子、胜利、失败）、AI有简单和困难两种难度、胜利界面。黑白棋子有立体阴影效果。' },
];

async function main() {
  const results = [];
  for (let i = 0; i < GAMES.length; i++) {
    const game = GAMES[i];
    console.log(`\n[${i+1}/${GAMES.length}] 生成: ${game.title}...`);
    const startTime = Date.now();
    try {
      const html = await generateGame(game.prompt);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✅ 完成! 大小: ${html.length} 字符, 耗时: ${elapsed}s`);
      results.push({
        title: game.title,
        category: game.category,
        description: game.prompt.split('。')[0],
        html: html
      });
    } catch (err) {
      console.log(`  ❌ 失败: ${err.message}`);
    }
  }
  
  const outputPath = path.join(__dirname, 'generated-games.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ 共生成 ${results.length} 个游戏，保存到 ${outputPath}`);
}

main().catch(console.error);
