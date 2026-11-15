/**
 * PromptToPlay · 在线体验版前端
 *
 * 两种生成路径：
 *   1) 示例体验 —— 不发任何请求，直接加载 web/demos 下预先生成的成品游戏；
 *   2) 实时生成 —— 浏览器直连 DeepSeek；如果本页由完整版服务端（/demo）提供，
 *      则改走同源代理 /api/demo/generate，Key 由服务端持有，前端不用填。
 */
(function () {
  'use strict';

  const Prompt = window.PTPPrompt;
  const API_BASE = 'https://api.deepseek.com/v1';
  const MODEL = 'deepseek-chat';
  const KEY_STORAGE = 'ptp:api-key';
  const PROXY_GENERATE = '/api/demo/generate';
  const PROXY_HEALTH = '/api/demo/health';

  /* 生成结果的 iframe 沙箱：不给 allow-same-origin，模型产出的代码拿不到本页 localStorage 里的 Key */
  const SANDBOX_GENERATED = 'allow-scripts allow-pointer-lock allow-popups allow-modals';
  /* 仓库自带的示例游戏是可信文件，允许同源（它们要用 localStorage 存最高分） */
  const SANDBOX_TRUSTED = 'allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-modals';

  /* 沙箱里没有 localStorage 时补一个内存版，避免游戏在读写最高分时抛异常卡死 */
  const STORAGE_SHIM =
    '<script>(function(){try{window.localStorage.getItem("__probe__");}catch(e){' +
    'var store={};var api={getItem:function(k){return Object.prototype.hasOwnProperty.call(store,k)?store[k]:null;},' +
    'setItem:function(k,v){store[k]=String(v);},removeItem:function(k){delete store[k];},clear:function(){store={};},' +
    'key:function(i){return Object.keys(store)[i]||null;},get length(){return Object.keys(store).length;}};' +
    'try{Object.defineProperty(window,"localStorage",{configurable:true,value:api});}catch(_){}}})();<\/script>';

  const CATEGORY = {
    shooting: { label: '射击', emoji: '🚀', cover: 'linear-gradient(135deg,#3b0764,#0e7490)' },
    action: { label: '动作', emoji: '🏃', cover: 'linear-gradient(135deg,#7c2d12,#b45309)' },
    puzzle: { label: '益智', emoji: '🧩', cover: 'linear-gradient(135deg,#1e3a8a,#0e7490)' },
    match3: { label: '消除', emoji: '💎', cover: 'linear-gradient(135deg,#831843,#be185d)' },
    tower: { label: '塔防', emoji: '🏰', cover: 'linear-gradient(135deg,#14532d,#4d7c0f)' },
    racing: { label: '竞速', emoji: '🏎️', cover: 'linear-gradient(135deg,#7f1d1d,#ea580c)' },
    sports: { label: '体育', emoji: '⚽', cover: 'linear-gradient(135deg,#065f46,#0d9488)' },
    simulation: { label: '模拟', emoji: '🏪', cover: 'linear-gradient(135deg,#78350f,#a16207)' },
    survivor: { label: '生存', emoji: '🧟', cover: 'linear-gradient(135deg,#4c1d95,#6d28d9)' },
    general: { label: '综合', emoji: '🎮', cover: 'linear-gradient(135deg,#4c1d95,#0e7490)' },
  };

  /* 示例卡片封面：按标题挑一个更像的 emoji，比只按分类更有辨识度 */
  const TITLE_EMOJI = [
    [/(蛇|贪吃)/, '🐍'],
    [/(砖)/, '🧱'],
    [/(飞机|战机|空战|雷电)/, '✈️'],
    [/(2048|数字)/, '🔢'],
    [/(记忆|翻牌)/, '🃏'],
    [/(宝石|消消|三消)/, '💎'],
    [/(跑酷|闯关|勇者|冒险)/, '🏃'],
    [/(五子|棋)/, '⚫'],
    [/(射击|太空|陨石)/, '🚀'],
  ];

  function coverEmoji(game) {
    const hit = TITLE_EMOJI.find(([pattern]) => pattern.test(game.title || ''));
    if (hit) return hit[1];
    return (CATEGORY[game.category] || CATEGORY.general).emoji;
  }

  const MODE_NOTE = {    demo: '不填 Key：直接加载预先用 DeepSeek 生成的成品游戏，用来先看「生成出来的东西到底能不能玩」。',
    live: '填自己的 Key：浏览器直接调 DeepSeek 生成一个全新的游戏，约 20~60 秒，费用 ¥0.1 以内。',
  };

  const els = {
    tabs: Array.from(document.querySelectorAll('.tab')),
    modeNote: document.getElementById('mode-note'),
    prompt: document.getElementById('prompt'),
    chips: document.getElementById('chips'),
    style: document.getElementById('style'),
    key: document.getElementById('key'),
    keyField: document.getElementById('key-field'),
    keyHint: document.getElementById('key-hint'),
    generate: document.getElementById('generate'),
    status: document.getElementById('status'),
    stage: document.getElementById('stage'),
    stageEmpty: document.getElementById('stage-empty'),
    stageTitle: document.getElementById('stage-title'),
    stageSub: document.getElementById('stage-sub'),
    stageFoot: document.getElementById('stage-foot'),
    download: document.getElementById('download'),
    copy: document.getElementById('copy'),
    open: document.getElementById('open'),
    cards: document.getElementById('cards'),
    galleryCount: document.getElementById('gallery-count'),
    envBadge: document.getElementById('env-badge'),
    helpBtn: document.getElementById('help-btn'),
    help: document.getElementById('help'),
  };

  const state = {
    mode: 'demo',
    games: [],
    proxy: { available: false, serverKey: false },
    lastHtml: '',
    lastName: '',
    busy: false,
    timer: null,
    startedAt: 0,
  };

  /* ---------------- 小工具 ---------------- */

  function setStatus(text, kind) {
    els.status.textContent = text || '';
    els.status.className = 'status' + (kind ? ' is-' + kind : '');
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function humanSize(bytes) {
    return bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.round(bytes / 1024) + ' KB';
  }

  function elapsedText() {
    return ((Date.now() - state.startedAt) / 1000).toFixed(1) + 's';
  }

  function startTimer(render) {
    state.startedAt = Date.now();
    stopTimer();
    state.timer = setInterval(render, 200);
  }

  function stopTimer() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  }

  function setBusy(busy) {
    state.busy = busy;
    els.generate.disabled = busy;
    els.generate.textContent = busy ? '生成中…' : '✨ 生成游戏';
  }

  /* ---------------- 预览区 ---------------- */

  function showStage(kind, { title, sub, foot }) {
    els.stageEmpty.hidden = kind !== 'empty';
    els.stage.classList.toggle('is-on', kind !== 'empty');
    if (title !== undefined) els.stageTitle.textContent = title;
    if (sub !== undefined) els.stageSub.textContent = sub;
    if (foot !== undefined) els.stageFoot.textContent = foot;
  }

  function setTools(enabled) {
    ['download', 'copy', 'open'].forEach((key) => { els[key].disabled = !enabled; });
  }

  /** 加载仓库自带的示例游戏（可信、同源） */
  function loadDemoGame(game) {
    state.lastHtml = '';
    state.lastName = game.title;
    els.stage.setAttribute('sandbox', SANDBOX_TRUSTED);
    els.stage.removeAttribute('srcdoc');
    els.stage.src = 'demos/' + game.file;
    showStage('game', {
      title: game.title,
      sub: `${CATEGORY[game.category] ? CATEGORY[game.category].label : game.category} · 示例游戏`,
      foot: game.ai
        ? '这一份是 DeepSeek 实时生成的产出，未经手工改代码，直接作为一个 HTML 文件运行。'
        : '仓库内置示例：单个 HTML 文件，包含音效、粒子、完整的开始/暂停/结束流程。',
    });
    setTools(false);
    els.stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /** 渲染新生成的 HTML（不可信来源 -> 封闭沙箱 + localStorage 兜底） */
  function renderGenerated(html, meta) {
    state.lastHtml = html;
    state.lastName = meta && meta.title ? meta.title : 'generated-game';
    els.stage.setAttribute('sandbox', SANDBOX_GENERATED);
    els.stage.removeAttribute('src');
    els.stage.srcdoc = STORAGE_SHIM + html;
    showStage('game', {
      title: (meta && meta.title) || 'AI 实时生成',
      sub: '沙箱中运行 · 可直接下载为单文件 HTML',
      foot: '生成结果在 allow-scripts 沙箱里运行，拿不到本页的 Key，也不会污染 localStorage。',
    });
    setTools(true);
    els.stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------------- 示例体验 ---------------- */

  const KEYWORD_HINTS = [
    { type: 'shooting', re: /射击|太空|飞机|飞船|陨石|子弹|枪|boss|敌机/i },
    { type: 'action', re: /闯关|跳跃|跑酷|横版|勇者|冒险|平台/i },
    { type: 'match3', re: /消除|三消|宝石|消消乐|连连看/i },
    { type: 'puzzle', re: /2048|益智|拼图|记忆|翻牌|数独|解谜|方块/i },
    { type: 'tower', re: /塔防|守城|防御/i },
    { type: 'racing', re: /赛车|竞速|漂移|开车/i },
    { type: 'sports', re: /球|体育|足球|篮球|乒乓/i },
    { type: 'survivor', re: /生存|割草|幸存者/i },
  ];

  function matchDemo(promptText) {
    const text = String(promptText || '');
    let type = Prompt.detectGameType(text);
    if (type === 'general') {
      const hit = KEYWORD_HINTS.find((item) => item.re.test(text));
      if (hit) type = hit.type;
    }
    const pool = state.games.filter((game) => game.category === type);
    const candidates = pool.length ? pool : state.games;
    if (!candidates.length) return null;
    const index = Math.abs(hash(text)) % candidates.length;
    return { game: candidates[index], type };
  }

  function hash(text) {
    let value = 0;
    for (let i = 0; i < text.length; i += 1) {
      value = (value << 5) - value + text.charCodeAt(i);
      value |= 0;
    }
    return value;
  }

  async function runDemoMode(promptText) {
    setBusy(true);
    setStatus('解析关键词…', 'busy');
    await new Promise((resolve) => setTimeout(resolve, 320));
    const match = matchDemo(promptText);
    setBusy(false);
    if (!match) {
      setStatus('示例库没加载出来，试试刷新页面，或切到「实时生成」。', 'error');
      return;
    }
    loadDemoGame(match.game);
    const categoryName = CATEGORY[match.type] ? CATEGORY[match.type].label : match.type;
    setStatus(
      `已加载示例《${match.game.title}》（识别为「${categoryName}」，未调用模型）。` +
      '想看真正的实时生成：切到「实时生成」并填一个 DeepSeek Key。',
      'ok'
    );
  }

  /* ---------------- 实时生成 ---------------- */

  function currentKey() {
    return (els.key.value || '').trim();
  }

  function canGenerateWithoutKey() {
    return state.proxy.available && state.proxy.serverKey;
  }

  async function runLiveMode(promptText) {
    const style = els.style.value;
    const key = currentKey();
    const needKey = !canGenerateWithoutKey();

    if (needKey && !key) {
      setStatus('实时生成需要一个 DeepSeek Key：填到上面 Key 框里（大约 30 秒能申请一个），或者切回「示例体验」。', 'error');
      els.key.focus();
      return;
    }

    const messages = Prompt.buildMessages(promptText, null, style);
    setBusy(true);
    setStatus('正在调用 DeepSeek…', 'busy');
    startTimer(() => setStatus(`正在调用 DeepSeek… 已用时 ${elapsedText()}`, 'busy'));

    const startedAt = Date.now();
    try {
      const html = state.proxy.available && state.proxy.serverKey && !key
        ? await generateViaProxy(promptText, style, key)
        : await generateDirect(messages, key);

      stopTimer();
      const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
      const lines = html.split('\n').length;
      renderGenerated(html, { title: promptText.slice(0, 24) });
      setStatus(
        `生成完成：${humanSize(new Blob([html]).size)} / ${lines} 行 / 用时 ${seconds}s` +
        `（识别为「${CATEGORY[messages.gameType] ? CATEGORY[messages.gameType].label : messages.gameType}」风格 ${style || 'auto'}）`,
        'ok'
      );
    } catch (err) {
      stopTimer();
      setStatus(explainError(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function generateViaProxy(promptText, style, key) {
    const headers = { 'Content-Type': 'application/json' };
    if (key) headers['X-DeepSeek-Key'] = key;
    const res = await fetch(PROXY_GENERATE, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt: promptText, style }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    if (!data.html) throw new Error('服务端没有返回 html');
    return data.html;
  }

  async function generateDirect(messages, key) {
    if (!window.fetch || !window.TextDecoder) throw new Error('当前浏览器不支持流式请求，请用 Chrome / Edge / Safari 新版');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);
    let content = '';
    let lastPaint = 0;
    let finishReason = null;

    try {
      const res = await fetch(API_BASE + '/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + key,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages.messages,
          max_tokens: 32000,
          temperature: 0.85,
          stream: true,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        const err = new Error(httpHint(res.status, detail));
        err.status = res.status;
        throw err;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const chunk = JSON.parse(payload);
            const choice = chunk.choices && chunk.choices[0];
            if (choice) {
              if (choice.finish_reason) finishReason = choice.finish_reason;
              if (choice.delta && choice.delta.content) content += choice.delta.content;
            }
          } catch (_) { /* 半包忽略，下一轮继续 */ }
        }
        const now = Date.now();
        if (now - lastPaint > 250) {
          lastPaint = now;
          setStatus(`正在生成… 已收 ${Math.round(content.length / 1024)} KB · ${elapsedText()}`, 'busy');
        }
      }

      if (!content.trim()) throw new Error('模型返回为空，重试一次试试');
      if (finishReason === 'length') {
        const truncated = new Error('OUTPUT_TRUNCATED');
        truncated.code = 'OUTPUT_TRUNCATED';
        throw truncated;
      }
      return Prompt.extractHtml(content);
    } finally {
      clearTimeout(timeout);
    }
  }

  function httpHint(status, detail) {
    if (status === 401) return 'Key 无效或已失效（401），检查一下是否复制完整。';
    if (status === 402) return 'DeepSeek 账户余额不足（402），充值后再试。';
    if (status === 429) return '请求太频繁或额度用尽（429），等一会儿再试。';
    if (status === 400) return '请求被拒绝（400）：' + String(detail || '').slice(0, 120);
    if (status >= 500) return `DeepSeek 服务端错误（${status}），稍后重试。`;
    return `请求失败（${status}）：` + String(detail || '').slice(0, 120);
  }

  function explainError(err) {
    if (err && err.name === 'AbortError') return '生成超时（180 秒），可以换个更简单的描述，或重试。';
    if (err && err.code === 'NO_HTML_TAG') return '模型这次没返回完整 HTML（偶发），再点一次生成即可。';
    if (err && err.code === 'OUTPUT_TRUNCATED') return '输出被长度上限截断了（游戏写太长），把描述收敛一点再试，或换更小的玩法。';
    if (err && err.message === 'Failed to fetch') {
      return '请求被浏览器拦住了：可能是网络问题，或 Key 里有空格。也可以改用完整版服务端（见页面底部说明）。';
    }
    return (err && err.message) || '出错了，重试一次。';
  }

  /* ---------------- 下载 / 复制 / 新窗口 ---------------- */

  function downloadCurrent() {
    if (!state.lastHtml) return;
    const blob = new Blob([state.lastHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prompttoplay-' + Date.now() + '.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setStatus('已下载单文件 HTML，双击就能在浏览器里独立运行。', 'ok');
  }

  async function copyCurrent() {
    if (!state.lastHtml) return;
    try {
      await navigator.clipboard.writeText(state.lastHtml);
      setStatus('整份 HTML 已复制到剪贴板。', 'ok');
    } catch (_) {
      setStatus('浏览器不允许写剪贴板，用「下载 HTML」吧。', 'error');
    }
  }

  function openCurrent() {
    if (!state.lastHtml) return;
    const blob = new Blob([state.lastHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /* ---------------- 画廊 ---------------- */

  async function loadGallery() {
    try {
      const [demoRes, aiRes] = await Promise.all([
        fetch('demos/demos.json', { cache: 'no-cache' }),
        fetch('demos/ai-samples.json', { cache: 'no-cache' }).catch(() => null),
      ]);
      if (!demoRes.ok) throw new Error('demos.json ' + demoRes.status);
      const demos = await demoRes.json();
      const ai = aiRes && aiRes.ok ? await aiRes.json().catch(() => []) : [];

      state.games = demos
        .map((item) => ({ ...item, ai: false }))
        .concat(ai.filter((item) => item.ok).map((item) => ({
          title: item.title,
          category: item.category,
          description: item.description,
          file: item.file,
          size: item.bytes,
          ai: true,
        })));

      renderCards();
    } catch (err) {
      els.cards.innerHTML =
        '<p class="hint">示例库没加载出来（' + escapeHtml(err.message) + '）。' +
        '如果是直接双击打开的 index.html，请用 <code>python -m http.server</code> 之类的静态服务打开，' +
        '或者直接访问 GitHub Pages 版本。</p>';
    }
  }

  function renderCards() {
    els.galleryCount.textContent = '共 ' + state.games.length + ' 个，单个文件 ' +
      humanSize(state.games.reduce((sum, item) => sum + (item.size || 0), 0));

    els.cards.innerHTML = state.games.map((game, index) => {
      const meta = CATEGORY[game.category] || CATEGORY.general;
      return (
        '<button type="button" class="card" data-index="' + index + '" aria-label="试玩 ' + escapeHtml(game.title) + '">' +
          '<span class="card-cover" style="background:' + meta.cover + '">' + coverEmoji(game) + '</span>' +
          '<span class="card-body">' +
            '<strong>' + escapeHtml(game.title) + '</strong>' +
            '<small>' + escapeHtml(game.description || '') + '</small>' +
            '<span class="card-tags">' +
              '<span class="tag">' + meta.label + '</span>' +
              (game.ai ? '<span class="tag ai">AI 实时生成</span>' : '') +
            '</span>' +
          '</span>' +
        '</button>'
      );
    }).join('');

    els.cards.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('click', () => {
        const game = state.games[Number(card.dataset.index)];
        if (!game) return;
        setStatus('已打开示例《' + game.title + '》', 'ok');
        loadDemoGame(game);
      });
    });
  }

  /* ---------------- 模式切换 / 初始化 ---------------- */

  function setMode(mode) {
    state.mode = mode;
    els.tabs.forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    els.modeNote.textContent = MODE_NOTE[mode];
    els.keyField.hidden = mode !== 'live';

    if (mode === 'live' && canGenerateWithoutKey()) {
      els.keyField.hidden = true;
      els.keyHint.innerHTML = '当前页面由完整版服务端提供，<b>服务端已配置 Key</b>，直接点生成即可。';
    }

    if (mode === 'demo') {
      setStatus('示例体验：随便点一个示例，或写一句话让我帮你匹配一个最像的。');
    } else if (canGenerateWithoutKey()) {
      setStatus('实时生成：服务端 Key 已就绪，直接点生成。');
    } else {
      setStatus('实时生成：填入 DeepSeek Key 后，输入一句话即可生成新游戏。');
    }
    syncGenerateButton();
  }

  function syncGenerateButton() {
    if (state.mode === 'live' && !currentKey() && !canGenerateWithoutKey()) {
      els.generate.textContent = '🔑 填 Key 后生成';
    } else if (!state.busy) {
      els.generate.textContent = '✨ 生成游戏';
    }
  }

  function restoreKey() {
    try {
      const saved = localStorage.getItem(KEY_STORAGE);
      if (saved) els.key.value = saved;
    } catch (_) { /* 隐私模式下忽略 */ }
  }

  function persistKey() {
    try {
      const value = currentKey();
      if (value) localStorage.setItem(KEY_STORAGE, value);
      else localStorage.removeItem(KEY_STORAGE);
    } catch (_) { /* 忽略 */ }
    syncGenerateButton();
  }

  async function probeProxy() {
    if (typeof fetch !== 'function') return;
    try {
      const res = await fetch(PROXY_HEALTH, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      state.proxy = { available: true, serverKey: Boolean(data.serverKey) };
      els.envBadge.hidden = false;
      els.envBadge.textContent = data.serverKey ? '本地完整版 · 服务端已有 Key' : '本地完整版 · 需自备 Key';
      setMode(state.mode);
    } catch (_) { /* 静态托管下正常会出现 404 */ }
  }

  function bind() {
    els.tabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
    els.generate.addEventListener('click', () => submit());
    els.chips.addEventListener('click', (event) => {
      const chip = event.target.closest('button[data-prompt]');
      if (!chip) return;
      els.prompt.value = chip.dataset.prompt;
      els.prompt.focus();
    });
    els.prompt.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submit();
    });
    els.prompt.addEventListener('input', () => { if (state.mode === 'demo') syncGenerateButton(); });
    els.key.addEventListener('input', persistKey);
    els.key.addEventListener('change', persistKey);
    els.download.addEventListener('click', downloadCurrent);
    els.copy.addEventListener('click', copyCurrent);
    els.open.addEventListener('click', openCurrent);
    els.helpBtn.addEventListener('click', () => els.help.showModal());
  }

  async function submit() {
    if (state.busy) return;
    const promptText = els.prompt.value.trim();
    if (promptText.length < 2) {
      setStatus('先写一句你想要什么游戏，比如「一个躲避陨石、收集道具的太空射击游戏」。', 'error');
      els.prompt.focus();
      return;
    }
    if (state.mode === 'demo') await runDemoMode(promptText);
    else await runLiveMode(promptText);
  }

  bind();
  restoreKey();
  setMode('demo');
  loadGallery();
  probeProxy();
})();
