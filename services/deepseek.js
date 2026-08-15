// 可配置的 API 地址：默认 DeepSeek 官方，也可通过中转
const API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1';

async function generateGame(prompt, previousCode) {
  const messages = [
    {
      role: 'system',
      content: 'You are a game developer. Return ONLY a complete HTML5 game inside ```html block. Use Canvas or CSS only. No external images/fonts. CRITICAL: The game MUST include a visible control legend panel showing which keys do what (e.g. "WASD - Move, Space - Jump"). Place it on the side or top of the game area. Use Chinese labels. No explanations outside the code block.'
    }
  ];

  if (previousCode) {
    messages.push({
      role: 'user',
      content: `Previous game code:\n\`\`\`html\n${previousCode}\n\`\`\`\n\nModify this game: ${prompt}. Return complete updated code.`
    });
  } else {
    messages.push({
      role: 'user',
      content: `Create an HTML5 game: ${prompt}. Return complete code inside \`\`\`html block.`
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

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
        max_tokens: 8192,
        temperature: 0.7
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
      console.error('[DeepSeek] No <html> tag. Content:', content.slice(0, 200));
      throw new Error('NO_HTML_TAG');
    }

    console.log(`[DeepSeek] OK! Code length: ${htmlCode.length}`);
    return htmlCode;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Generation timed out (90s). Try a simpler prompt.');
    }
    throw err;
  }
}

module.exports = { generateGame };
