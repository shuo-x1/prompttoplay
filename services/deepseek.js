// 可配置的 API 地址：默认 DeepSeek 官方，也可通过中转
const API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1';

/**
 * 游戏类型识别：根据用户输入判断类型，附加对应品质要求
 */
function detectGameType(prompt) {
  const p = prompt.toLowerCase();
  if (/射击|飞机|大战|雷电|弹幕|shoot|gun/.test(p)) return 'shooting';
  if (/跑酷|跳跃|闯关|动作|冒险|勇士|忍者|格斗|拳皇|action|jump|run/.test(p)) return 'action';
  if (/消除|消消乐|三消|宝石|match|puzzle/.test(p)) return 'match3';
  if (/塔防|植物|僵尸|tower|defense/.test(p)) return 'tower';
  if (/赛车|开车|竞速|car|race|speed/.test(p)) return 'racing';
  if (/益智|拼图|数独|记忆|翻牌|2048|方块|puzzle/.test(p)) return 'puzzle';
  if (/经营|餐厅|汉堡|农场|模拟|tycoon|sim/.test(p)) return 'simulation';
  if (/体育|足球|篮球|乒乓|球|sport/.test(p)) return 'sports';
  return 'general';
}

const TYPE_QUALITY = {
  shooting: '必须包含：多种敌人类型（普通/快速/精英）、至少1个BOSS战、道具掉落（火力增强/护盾/炸弹）、子弹特效、爆炸粒子、滚动星空背景、分数连击系统。',
  action: '必须包含：可跳跃的平台关卡、多种敌人、至少1个BOSS、攻击连招或技能、道具收集（金币/血瓶）、受击无敌帧、视差滚动背景、关卡进度。',
  match3: '必须包含：至少6种不同颜色宝石、交换消除动画、连击(combo)系统、特殊宝石（四连/五连生成）、下落填充动画、步数或时间限制、关卡目标。',
  tower: '必须包含：至少3种防御塔、多种敌人类型、波次系统、金币经济、升级系统、路径地图、BOSS波次。',
  racing: '必须包含：可操控的赛车、AI对手、赛道弯道、加速道具、圈数计时、排名系统、漂移或氮气机制。',
  puzzle: '必须包含：清晰的关卡目标、逐步引导、撤销功能、胜利条件明确、动画反馈、多关卡或难度递增。',
  simulation: '必须包含：资源管理系统、升级解锁、顾客/需求系统、金币经济、进度目标、动画反馈。',
  sports: '必须包含：AI对手、计分系统、难度递增、操作手感、胜利/失败判定、多局制。',
  general: '必须包含：明确的游戏目标、多种游戏元素、递进难度、成就感设计、重玩价值。'
};

/**
 * 提示词增强：将用户简单描述扩展为4399品质的游戏需求
 */
function enhancePrompt(userPrompt) {
  const trimmed = userPrompt.trim();
  const gameType = detectGameType(trimmed);
  const typeReq = TYPE_QUALITY[gameType];

  // 短输入（<20字）：自动补全完整游戏设计
  if (trimmed.length < 20) {
    return `${trimmed}

【游戏设计要求】
${typeReq}

【通用品质要求】
- 这是一个完整可玩的游戏，不是demo
- 有开始界面（游戏标题+开始按钮+操作说明）
- 有暂停功能（P或ESC）
- 有结束界面（分数+重玩按钮）
- 计分系统 + localStorage最高分
- 难度随时间/分数递增`;
  }

  // 中等输入：附加品质要求
  return `${trimmed}

【请确保游戏品质达到4399小游戏级别】
${typeReq}

【视觉与体验】
- 完整的开始/暂停/结束界面
- 计分系统 + localStorage 最高分
- 难度递增机制
- 粒子特效、动画过渡、屏幕震动
- Web Audio API 合成音效
- 桌面键盘 + 移动端触摸双适配
- 中文UI文字`;
}

const SYSTEM_PROMPT = `你是一位资深4399风格小游戏开发者，擅长用纯 HTML5 Canvas + JS 制作画面精美、手感扎实的网页小游戏。

【核心原则】
你做的不是简陋demo，而是让人想一直玩下去的完整游戏。参考4399上热门小游戏的品质：有角色、有关卡、有BOSS、有道具、有成就感。

【输出要求】
- 只返回 \`\`\`html 代码块，不要任何解释文字
- 不使用任何外部图片、字体、库、CDN
- 所有视觉元素用Canvas代码绘制（渐变+阴影+多图层）
- 所有 UI 文字用中文
- 单文件可直接运行

【角色绘制规范 - 不要画方块！】
用Canvas多图层绘制有辨识度的角色：
- 玩家角色：至少包含身体、头部、眼睛、四肢/武器，用渐变和阴影增加立体感
- 敌人：不同类型有不同造型和颜色，有表情或特征
- BOSS：体型大、有压迫感、有独特造型
- 所有角色有朝向翻转（左右移动时镜像）
- 移动时有简单动画（上下浮动、腿部摆动等用代码模拟）

【背景绘制规范】
- 不要纯色背景！用渐变天空 + 多层视差滚动（远山/中景/近景）
- 有地面/平台的纹理
- 有装饰元素（云朵、树木、星星等）
- 整体配色协调，有氛围感

【游戏必须包含】
1. **完整游戏循环**：开始界面（标题+开始按钮+操作说明）→ 游玩 → 结束界面（分数+重玩按钮）
2. **计分系统**：实时分数 + localStorage 保存最高分
3. **难度递增**：随时间/分数提升（速度加快、敌人变多、生成更密）
4. **视觉打磨**：
   - 渐变背景 + 视差滚动
   - 粒子特效（爆炸/收集/受击）
   - 屏幕震动（受击/BOSS出现时）
   - 动画过渡（开始/结束/升级）
   - 美观UI（圆角血条、分数框、技能图标）
5. **音效系统**：用 Web Audio API 合成至少5种音效（移动/跳跃/射击/得分/受击/爆炸/胜利/失败，选适合的）
6. **操作说明**：画面上有清晰的中文操作提示
7. **双端适配**：桌面键盘 + 移动端虚拟按钮或触摸滑动
8. **暂停功能**：按 P 或 ESC 可暂停/继续

【游戏机制要求】
- 玩家有血量或生命，不是一碰就死
- 有道具系统（加分/回血/增强能力）
- 有多种敌人或障碍物
- 有关卡进度或BOSS战（适合的类型必须有）
- 碰撞有反馈（音效+粒子+震动）
- 操作有手感：移动有加速度/惯性，跳跃有重力，射击有冷却

【代码规范】
- 用 requestAnimationFrame 游戏循环
- 变量名清晰，结构分明
- 适配不同屏幕尺寸（canvas居中，响应式）
- 防止内存泄漏（及时清理粒子/子弹数组）

记住：用户输入一句话，你要交付一个能直接玩、画面好看、有成就感的完整小游戏。`;

async function generateGame(prompt, previousCode) {
  const enhancedPrompt = enhancePrompt(prompt);
  console.log(`[DeepSeek] Original prompt: ${prompt.slice(0, 50)}...`);
  console.log(`[DeepSeek] Game type detected: ${detectGameType(prompt)}`);
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
      content: `请制作这个游戏：${enhancedPrompt}\n\n返回完整代码在 \`\`\`html 块中。`
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150000);

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

    // 打印 token 用量和成本
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
      throw new Error('生成超时（150秒），请尝试更简单的描述。');
    }
    throw err;
  }
}

module.exports = { generateGame, enhancePrompt, detectGameType };
