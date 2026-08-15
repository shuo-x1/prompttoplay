// 可配置的 API 地址：默认 DeepSeek 官方，也可通过中转
const API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1';

/**
 * 游戏类型识别
 */
function detectGameType(prompt) {
  const p = prompt.toLowerCase();
  if (/射击|飞机|大战|雷电|弹幕|shoot|gun|太空|外星/.test(p)) return 'shooting';
  if (/跑酷|跳跃|闯关|动作|冒险|勇士|忍者|格斗|拳皇|action|jump|run|横版/.test(p)) return 'action';
  if (/消除|消消乐|三消|宝石|match|糖果|连连看/.test(p)) return 'match3';
  if (/塔防|植物|僵尸|tower|defense|守城/.test(p)) return 'tower';
  if (/赛车|开车|竞速|car|race|speed|摩托|漂移/.test(p)) return 'racing';
  if (/益智|拼图|数独|记忆|翻牌|2048|方块|推箱子|解谜|puzzle/.test(p)) return 'puzzle';
  if (/经营|餐厅|汉堡|农场|模拟|tycoon|sim|商店/.test(p)) return 'simulation';
  if (/体育|足球|篮球|乒乓|球|sport|网球|棒球/.test(p)) return 'sports';
  if (/生存|幸存者|吸血鬼|割草|survivor|io游戏/.test(p)) return 'survivor';
  return 'general';
}

/**
 * 双人游戏检测
 */
function isMultiplayer(prompt) {
  return /双人|两人|2人|对战|pk|对决|双打|多人|合作|双人对战|双人合作/i.test(prompt);
}

const MULTIPLAYER_REQ = `【双人游戏特别要求】
- 开始界面必须有"单人/双人"选择
- P1：WASD移动 + F/G攻击；P2：方向键移动 + Enter/空格攻击
- 两个玩家用不同颜色区分（P1蓝青系、P2橙红系）
- 各自独立血量和分数显示
- 有胜负判定（P1胜/P2胜/平局）
- 操作说明分别标注P1和P2的按键`;

const TYPE_REQ = {
  shooting: `射击游戏专属要求：
- 玩家飞机有引擎尾焰粒子，子弹有发光拖尾
- 至少3种敌人（普通/快速/重装），各有不同外形和血量
- 道具掉落：火力升级（三连发/散射）、护盾、炸弹清屏
- 击杀连击系统，连击数越高倍率越大，显示连击文字
- 至少1个BOSS：体型大、有血条、多种攻击模式（散射/追踪）
- 爆炸用多层粒子（核心闪光+碎片+烟雾）+屏幕震动`,
  action: `动作闯关游戏专属要求：
- 角色有跳跃重力手感，跳跃有挤压拉伸动画
- 平台关卡设计：地面平台、浮空平台、移动平台
- 至少2种敌人（巡逻怪/飞行怪），有受击闪红和死亡爆炸
- 攻击有挥砍特效和打击停顿（hit-stop 80ms）
- 金币收集有磁吸效果和弹出音效
- 至少1个BOSS战，BOSS有多个攻击阶段
- 关卡有进度感（背景随移动变化）`,
  match3: `三消游戏专属要求：
- 棋子用圆角方块+渐变+高光，糖果质感，不同颜色不同形状
- 交换有弹性动画，消除有缩放+粒子爆发
- 连击(combo)系统：连续消除有倍率加成和大字提示
- 特殊棋子：四连生成条纹棋子（消一行），五连生成彩虹球（消全色）
- 下落填充有缓动动画，新棋子从顶部弹入
- 有步数限制或时间限制，目标分数显示
- 背景用柔和渐变，棋盘有奶油色底板和阴影`,
  tower: `塔防游戏专属要求：
- 至少3种防御塔（箭塔/炮塔/魔法塔），各有不同攻击方式和外观
- 敌人沿固定路径行进，有血条，至少3种敌人类型
- 波次系统，波次间有准备时间
- 金币经济：击杀获得金币，建造/升级消耗金币
- 塔升级系统，升级后外观变化（更大/更华丽）
- 至少1个BOSS波次，BOSS有特殊能力
- 路径地图清晰，塔放置位置有网格提示`,
  racing: `竞速游戏专属要求：
- 赛车有加速/刹车/转向手感，有漂移机制
- AI对手车辆，有不同颜色和速度
- 赛道有弯道、直道、加速带
- 圈数计时和排名系统
- 速度感：路面标线滚动、速度线粒子、氮气加速特效
- 碰撞有反馈（震动+粒子+减速）
- 小地图或进度条显示位置`,
  puzzle: `益智游戏专属要求：
- 清晰的关卡目标和规则说明
- 操作有即时反馈（正确/错误都有动画和音效）
- 难度递进，前期引导后期挑战
- 撤销/重开功能
- 步数或时间统计
- 通关有庆祝特效（粒子+音效）`,
  simulation: `模拟经营游戏专属要求：
- 资源管理系统（金币/材料/时间）
- 顾客/需求系统，有排队机制
- 升级解锁新内容
- 进度目标和成就感设计
- 数值平衡，前期快后期稳
- 所有操作有动画反馈`,
  sports: `体育游戏专属要求：
- AI对手，有难度递进
- 计分系统，有局/盘概念
- 操作手感扎实，物理反馈真实
- 胜负判定明确
- 多局制或锦标赛
- 进球/得分有慢动作和庆祝特效`,
  survivor: `幸存者割草游戏专属要求：
- 玩家自动攻击，WASD移动
- 经验宝石掉落，升级时选择技能（3选1）
- 至少5种武器/技能（环绕/弹射/激光/范围/召唤）
- 敌人从四面八方涌来，波次递增
- 至少1个精英怪和BOSS
- 技能组合进化系统
- 伤害数字飘字，击杀爆炸粒子`,
  general: `通用游戏要求：
- 明确的游戏目标和胜负条件
- 多种游戏元素（敌人/道具/障碍）
- 递进难度，越玩越有挑战
- 成就感设计（分数/解锁/通关）
- 重玩价值（随机/变化）`
};

/**
 * Juice 手感系统代码模板 —— 每个游戏必须包含
 */
const JUICE_SYSTEM = `
【必须实现的手感系统 Juice System】
在游戏代码中实现以下工具函数（可直接复制修改），所有游戏事件必须调用它们产生反馈：

1. 屏幕震动 screenShake：
function screenShake(intensity, duration) {
  shakeTime = duration; shakeIntensity = intensity;
}
// 渲染时：ctx.save(); if(shakeTime>0){ctx.translate((Math.random()-0.5)*shakeIntensity,(Math.random()-0.5)*shakeIntensity); shakeTime--;} ... ctx.restore();
// 小震动（吃道具）：intensity=3,duration=8；中震动（受击）：6,15；大震动（爆炸/BOSS）：12,25

2. 命中停顿 hitStop：
function hitStop(frames) { hitStopFrames = frames; }
// 游戏循环开头：if(hitStopFrames>0){hitStopFrames--; return;} // 暂停逻辑但继续渲染
// 普通命中：4帧；暴击：8帧；BOSS击杀：20帧

3. 粒子系统 Particle：
class Particle {
  constructor(x,y,vx,vy,color,size,life,gravity=0) {...}
  update() { this.x+=this.vx; this.y+=this.vy; this.vy+=this.gravity; this.life--; this.size*=0.96; }
  draw(ctx) { ctx.globalAlpha=this.life/this.maxLife; ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
}
// 爆炸粒子：发射12-20个，颜色用暖色（#ff6b6b,#ffd93d,#ff8c42），life 20-40帧，gravity 0.1
// 收集粒子：发射8个金色粒子，向上飘，life 30帧
// 拖尾粒子：每帧在移动物体后生成1-2个半透明同色粒子，life 10帧

4. 浮动文字 FloatingText：
class FloatingText {
  constructor(x,y,text,color,size) { this.x=x; this.y=y; this.text=text; this.color=color; this.size=size; this.life=60; this.vy=-1.5; }
  update() { this.y+=this.vy; this.vy*=0.95; this.life--; }
  draw(ctx) { ctx.globalAlpha=Math.min(1,this.life/30); ctx.font='bold '+this.size+'px sans-serif'; ctx.fillStyle=this.color; ctx.textAlign='center'; ctx.fillText(this.text,this.x,this.y); ctx.globalAlpha=1; }
}
// 得分：白色上飘；暴击：红色大字；连击：金色"COMBO x3!"；升级：绿色"LEVEL UP!"

5. 音效系统 AudioEngine（Web Audio API合成，不用外部文件）：
const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
function playSound(type) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  // 跳跃：type=sine, freq 300→600, 0.1s
  // 射击：type=square, freq 800→200, 0.05s
  // 击中：type=triangle, freq 200→100, 0.08s
  // 爆炸：type=sawtooth, freq 100→30, 0.2s
  // 收集：type=sine, freq 500→900, 0.1s
  // 胜利：上行音阶 523→659→784→1047
  // 失败：下行音阶 400→300→200
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+duration);
}
// 每个游戏至少实现：移动/跳跃、射击/攻击、击中、收集、爆炸、胜利、失败 这7种音效

6. 挤压拉伸：
// 物体落地/受击时：scaleY=0.7, scaleX=1.3，然后用缓动弹回 scaleY=1, scaleX=1
// 跳跃起跳：scaleY=1.3, scaleX=0.7
// 按钮按下：scale=0.95，松开弹回1.0（带overshoot）
// 实现：squash = {x:1,y:1}; 每帧 squash.x += (1-squash.x)*0.2; squash.y += (1-squash.y)*0.2;

7. 缓动函数：
// 所有数值变化用easeOutCubic：t=1-Math.pow(1-t,3)
// UI弹入用backEase：t=1+2.7*Math.pow(t-1,3)+1.7*Math.pow(t-1,2)（overshoot效果）
// 不要用线性变化！分数跳动、血条减少、面板弹出都要缓动`;

/**
 * 视觉风格规范
 */
const VISUAL_STYLE = `
【现代视觉风格规范】
1. 配色方案（选择一套，不要混用）：
   - 霓虹风：深色背景(#0a0a1a) + 霓虹青(#00f5ff) + 霓虹粉(#ff00ff) + 亮黄(#ffd700)
   - 糖果风：浅紫渐变背景(#667eea→#764ba2) + 珊瑚橙(#ff6b6b) + 薄荷绿(#4ecdc4) + 鹅黄(#ffe66d)
   - 森林风：深绿渐变(#134e5e→#71b280) + 金色(#f9d423) + 白色
   - 日落风：橙紫渐变(#ff6e7f→#bfe9ff) + 暖橙(#ff8c42) + 玫红(#e94057)

2. 发光效果：
   - 重要元素用 ctx.shadowColor=颜色; ctx.shadowBlur=15 做发光
   - 子弹/道具/玩家都有发光
   - 发光颜色与元素主色一致

3. 渐变填充：
   - 所有角色、按钮、UI面板都用渐变填充（createLinearGradient）
   - 不要用纯色填充！至少2色渐变
   - 圆形物体用径向渐变（createRadialGradient）做高光

4. UI设计：
   - 所有面板用圆角矩形（自己实现roundRect函数）
   - 半透明毛玻璃效果：ctx.fillStyle='rgba(0,0,0,0.5)'
   - 按钮有渐变+发光+按下缩放
   - 血条：圆角底框+渐变填充+高光，减少时缓动
   - 分数用大号粗体字，有描边（strokeText+fillText）

5. 背景层次：
   - 渐变天空/底色
   - 远景层（星星/云朵/山脉，慢速移动）
   - 中景层（建筑/树木，中速移动）
   - 近景层（地面/装饰，快速移动）
   - 视差滚动营造深度

6. 角色绘制（禁止画方块！）：
   - 玩家：身体用圆角矩形+渐变，头部圆形+眼睛，武器/配件，有朝向
   - 敌人：每种有独特轮廓和颜色，有表情或特征
   - BOSS：体型大2-3倍，有王冠/角/装甲等特征，有压迫感
   - 所有角色有idle动画（上下浮动/呼吸缩放）`;

/**
 * 提示词增强
 */
function enhancePrompt(userPrompt) {
  const trimmed = userPrompt.trim();
  const gameType = detectGameType(trimmed);
  const typeReq = TYPE_REQ[gameType] || TYPE_REQ.general;
  const multiplayer = isMultiplayer(trimmed);
  const mpReq = multiplayer ? MULTIPLAYER_REQ : '';

  if (trimmed.length < 20) {
    return `${trimmed}

【游戏设计要求】
${typeReq}
${mpReq}

【通用品质要求】
- 完整可玩的游戏，不是demo
- 开始界面（游戏标题+开始按钮+操作说明）
- 暂停功能（P/ESC）
- 结束界面（分数+重玩按钮）
- 计分系统 + localStorage最高分
- 难度随时间/分数递增
- 操作说明文字要大且醒目（至少20px，带半透明背景框）`;
  }

  return `${trimmed}

【游戏品质要求】
${typeReq}
${mpReq}

【视觉与体验】
- 完整的开始/暂停/结束界面
- 计分系统 + localStorage最高分
- 难度递增机制
- 粒子特效、动画过渡、屏幕震动
- Web Audio API合成音效
- 桌面键盘 + 移动端触摸双适配
- 中文UI文字
- 操作说明文字要大且醒目（至少20px，带半透明背景框）`;
}

const SYSTEM_PROMPT = `你是一位顶级HTML5小游戏开发专家，擅长制作画面精美、手感炸裂、让人一玩就停不下来的网页小游戏。你的游戏品质对标4399/Poki上的热门作品。

【核心原则】
你做的不是简陋demo，而是让人想一直玩下去的完整游戏。评判标准：玩家前三秒就觉得"爽"，玩完一局还想再来一局。

${JUICE_SYSTEM}

${VISUAL_STYLE}

【游戏必须包含】
1. 完整游戏循环：开始界面（标题+开始按钮+操作说明）→ 游玩 → 暂停(P/ESC) → 结束界面（分数+最高分+重玩按钮）
2. 计分系统：实时分数（跳动缓动）+ localStorage保存最高分
3. 难度递增：随时间/分数提升（速度加快、敌人变多、生成更密）
4. 手感反馈（Juice）：每个玩家动作必须有3个以上反馈通道（视觉+听觉+物理）
   - 击中：命中停顿4-8帧 + 粒子爆发 + 音效 + 屏幕震动 + 伤害数字
   - 收集：磁吸效果 + 金色粒子 + 清脆音效 + 浮动加分文字
   - 爆炸：多层粒子 + 大屏震 + 低频音效 + 闪光
   - 跳跃/移动：挤压拉伸 + 尘土粒子 + 音效
5. 视觉打磨：渐变背景+视差滚动、发光效果、圆角UI、粒子拖尾
6. 音效系统：Web Audio API合成至少7种音效（移动/攻击/击中/收集/爆炸/胜利/失败）
7. 操作说明：画面上有清晰的中文操作提示，文字至少20px，带半透明背景框，放在屏幕顶部或底部
8. 双端适配：桌面键盘 + 移动端虚拟按键/触摸滑动
9. 游戏机制深度：
   - 玩家有血量/生命，不是一碰就死
   - 道具系统（加分/回血/增强能力/护盾）
   - 多种敌人或障碍物
   - 关卡进度或BOSS战
   - 连击/倍率系统（适合的类型）
10. 代码规范：
    - requestAnimationFrame游戏循环
    - 固定时间步长（60fps逻辑更新）
    - 变量名清晰，结构分明
    - Canvas居中，响应式适配不同屏幕
    - 及时清理粒子/子弹数组防止内存泄漏

【输出要求】
- 只返回\`\`\`html代码块，不要任何解释文字
- 不使用任何外部图片、字体、库、CDN
- 所有视觉元素用Canvas代码绘制（渐变+阴影+多图层）
- 所有UI文字用中文
- 单文件可直接运行
- 代码量不少于800行，确保游戏内容充实

记住：用户输入一句话，你要交付一个能直接玩、画面好看、手感爽到爆、有成就感的完整小游戏。宁可代码长一点，也要把juice反馈和视觉打磨做到位。`;

async function generateGame(prompt, previousCode) {
  const enhancedPrompt = enhancePrompt(prompt);
  console.log(`[DeepSeek] Original prompt: ${prompt.slice(0, 50)}...`);
  console.log(`[DeepSeek] Game type: ${detectGameType(prompt)} | Multiplayer: ${isMultiplayer(prompt)}`);
  console.log(`[DeepSeek] Enhanced prompt length: ${enhancedPrompt.length}`);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  if (previousCode) {
    messages.push({
      role: 'user',
      content: `这是现有游戏代码：\n\`\`\`html\n${previousCode}\n\`\`\`\n\n请基于以上代码进行修改优化：${enhancedPrompt}\n\n返回完整的更新后代码。`
    });
  } else {
    messages.push({
      role: 'user',
      content: `请制作这个游戏：${enhancedPrompt}\n\n返回完整代码在\`\`\`html块中。`
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);

  try {
    const modelName = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    console.log(`[DeepSeek] Calling ${modelName} via ${API_BASE}...`);
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        max_tokens: 16000,
        temperature: 0.85
      })
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const msg = data.choices[0].message;
    let content = msg.content || '';
    if (!content.trim() && msg.reasoning_content) {
      content = msg.reasoning_content;
      console.warn('[DeepSeek] Using reasoning_content fallback');
    }

    const codeMatch = content.match(/```html\s*([\s\S]*?)```/);
    let htmlCode = codeMatch ? codeMatch[1].trim() : content.trim();

    if (!/<html/i.test(htmlCode)) {
      console.error('[DeepSeek] No <html> tag. Content:', content.slice(0, 300));
      throw new Error('NO_HTML_TAG');
    }

    if (data.usage) {
      const cost = (data.usage.prompt_tokens * 0.001 + data.usage.completion_tokens * 0.002) / 1000;
      console.log(`[DeepSeek] OK! Code: ${htmlCode.length} chars | Tokens: ${JSON.stringify(data.usage)} | 预估成本: ¥${cost.toFixed(4)}`);
    } else {
      console.log(`[DeepSeek] OK! Code length: ${htmlCode.length}`);
    }

    return htmlCode;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('生成超时（180秒），请尝试更简单的描述。');
    }
    throw err;
  }
}

module.exports = { generateGame, enhancePrompt, detectGameType, isMultiplayer };
