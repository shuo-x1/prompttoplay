/**
 * DeepSeek 调用层：只负责「发请求 + 取回 HTML」，
 * 提示词 / 类型识别 / 风格字典统一放在 web/prompt.js（前后端共用一份）。
 */
const { buildMessages, extractHtml, detectGameType, isMultiplayer } = require('../web/prompt');

// 可配置的 API 地址：默认 DeepSeek 官方，也可通过中转
const API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1';

/**
 * 调 DeepSeek 生成一个单文件 HTML5 游戏。
 * @param {string} userPrompt 用户的一句话
 * @param {string|null} previousCode 迭代模式下的旧代码
 * @param {string} style 视觉风格 key（web/prompt.js 的 VISUAL_STYLES）
 * @param {string} [apiKey] 可选：优先于 process.env.DEEPSEEK_API_KEY（在线体验版自带 Key）
 * @returns {Promise<string>} 完整 HTML
 */
async function generateGame(userPrompt, previousCode, style, apiKey) {
  const key = apiKey || process.env.DEEPSEEK_API_KEY;
  if (!key) {
    const err = new Error('NO_API_KEY');
    err.code = 'NO_API_KEY';
    throw err;
  }
  const { messages, gameType } = buildMessages(userPrompt, previousCode, style);
  console.log(`[DeepSeek] Original prompt: ${String(userPrompt).slice(0, 50)}...`);
  console.log(`[DeepSeek] Game type: ${gameType} | Multiplayer: ${isMultiplayer(userPrompt)} | Style: ${style || 'auto'}`);

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
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        max_tokens: Number(process.env.DEEPSEEK_MAX_TOKENS || 32000),
        temperature: 0.85
      })
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    const msg = choice.message;
    let content = msg.content || '';
    if (!content.trim() && msg.reasoning_content) {
      content = msg.reasoning_content;
      console.warn('[DeepSeek] Using reasoning_content fallback');
    }

    // 输出被 max_tokens 截断时，HTML 一定是残的，宁可报错也不要返回半份代码
    if (choice.finish_reason === 'length') {
      const err = new Error('OUTPUT_TRUNCATED');
      err.code = 'OUTPUT_TRUNCATED';
      throw err;
    }

    const htmlCode = extractHtml(content);

    if (data.usage) {
      const cost = (data.usage.prompt_tokens * 0.001 + data.usage.completion_tokens * 0.002) / 1000;
      console.log(`[DeepSeek] OK! Code: ${htmlCode.length} chars | Tokens: ${JSON.stringify(data.usage)} | 预估成本: ¥${cost.toFixed(4)}`);
    } else {
      console.log(`[DeepSeek] OK! Code length: ${htmlCode.length}`);
    }

    return htmlCode;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('生成超时（180秒），请尝试更简单的描述。');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { generateGame, detectGameType };
