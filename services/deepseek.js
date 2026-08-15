// 可配置的 API 地址：默认 DeepSeek 官方，也可通过中转
const API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1';

/**
 * 提示词增强：将用户简单描述扩展为高品质游戏需求
 * 控制成本：增强后的 prompt 不会过长，主要靠 system prompt 保证质量
 */
function enhancePrompt(userPrompt) {
  const trimmed = userPrompt.trim();

  // 短输入自动补全游戏类型
  if (trimmed.length < 15) {
    return `${trimmed}。要求：完整的游戏循环（开始界面→游玩→结束→重玩），有计分和最高分，难度递增，有视觉特效和音效，操作流畅有手感。`;
  }

  // 中等输入附加品质要求
  return `${trimmed}

请确保游戏品质：
- 完整的开始/暂停/结束界面
- 计分系统 + localStorage 最高分
- 难度随时间递增
- 粒子特效、动画、屏幕震动等视觉反馈
- Web Audio API 合成音效（不需要外部文件）
- 桌面键盘 + 移动端触摸双适配
- 中文 UI 文字`;
}

const SYSTEM_PROMPT = `你是一位资深独立游戏开发者，擅长用纯 HTML5（Canvas/CSS + JS）制作有可玩性的小游戏。

【输出要求】
- 只返回 \`\`\`html 代码块，不要任何解释文字
- 不使用任何外部图片、字体、库、CDN
- 所有 UI 文字用中文

【游戏必须包含】
1. **完整游戏循环**：开始界面（标题+开始按钮）→ 游玩 → 结束界面（分数+重玩按钮）
2. **计分系统**：实时分数 + localStorage 保存最高分
3. **难度递增**：随时间/分数提升难度（速度加快、敌人变多等）
4. **视觉打磨**：
   - 渐变背景、粒子特效、动画过渡
   - 受击/得分时的屏幕震动或闪烁反馈
   - 美观的 UI（圆角、阴影、配色协调）
5. **音效**：用 Web Audio API 合成简单音效（射击、得分、爆炸、点击等），不需要外部文件
6. **操作说明**：画面上有清晰的中文操作提示（如 "WASD 移动 · 空格射击"）
7. **双端适配**：桌面用键盘，移动端显示虚拟按钮或支持触摸滑动
8. **暂停功能**：按 P 或 ESC 可暂停

【设计原则】
- 游戏要有"手感"：移动有惯性/加速度，射击有冷却，碰撞有反馈
- 不要做最简陋的 demo，要让人想再玩一局
- 代码结构清晰，单文件可直接运行`;

async function generateGame(prompt, previousCode) {
  const enhancedPrompt = enhancePrompt(prompt);
  console.log(`[DeepSeek] Original prompt: ${prompt.slice(0, 50)}...`);
  console.log(`[DeepSeek] Enhanced prompt length: ${enhancedPrompt.length}`);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  if (previousCode) {
    messages.push({
      role: 'user',
      content: `这是现有游戏代码：\n\`\`\`html\n${previousCode}\n\`\`\`\n\n请基于以上代码进行修改：${enhancedPrompt}\n\n返回完整的更新后代码。`
    });
  } else {
    messages.push({
      role: 'user',
      content: `请制作这个游戏：${enhancedPrompt}\n\n返回完整代码在 \`\`\`html 块中。`
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

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
        max_tokens: 12000,
        temperature: 0.8
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

    // 打印 token 用量（如果有）
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
      throw new Error('生成超时（120秒），请尝试更简单的描述。');
    }
    throw err;
  }
}

module.exports = { generateGame, enhancePrompt };
