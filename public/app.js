async function apiCall(url, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  const token = localStorage.getItem('ptp_token');
  if (token) {
    opts.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    opts.body = JSON.stringify(body);
  }

  const response = await fetch(url, opts);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(data.error || '请求失败');
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

function checkAuth() {
  return !!localStorage.getItem('ptp_token');
}

function logout() {
  localStorage.removeItem('ptp_token');
  window.location.href = 'auth.html';
}

function showModal(title, message, buttons = null, extraClass = '') {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  let buttonsHtml = '';
  if (buttons) {
    buttonsHtml = `<div class="modal-buttons">${buttons.map(b =>
      `<button class="btn ${b.cls || 'btn-primary'}" id="modal-btn-${b.id}">${b.label}</button>`
    ).join('')}</div>`;
  } else {
    buttonsHtml = `<div class="modal-buttons"><button class="btn btn-primary" id="modal-btn-close">确定</button></div>`;
  }

  content.innerHTML = `<h2>${title}</h2><div class="${extraClass}">${message}</div>${buttonsHtml}`;
  overlay.style.display = 'flex';

  const closeHandler = () => { overlay.style.display = 'none'; };
  document.getElementById('modal-btn-close')?.addEventListener('click', closeHandler);

  if (buttons) {
    buttons.forEach(b => {
      const el = document.getElementById(`modal-btn-${b.id}`);
      if (el && b.onClick) {
        el.addEventListener('click', () => { b.onClick(); overlay.style.display = 'none'; });
      }
    });
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
}

async function getCredits() {
  try {
    const data = await apiCall('/api/payment/credits');
    return { credits: data.credits, devMode: data.devMode };
  } catch {
    return { credits: 0, devMode: false };
  }
}

// ===== 积分充值（真钱变积分） =====
function showCreditShop() {
  getCredits().then(c => {
    const devSection = c.devMode ? `
      <div class="dev-section" style="margin-top:16px;padding:16px;background:#fef3c7;border-radius:8px;text-align:center;">
        <p style="color:#92400e;margin-bottom:8px;font-size:.85rem;">🔧 开发模式（测试用，不花钱）</p>
        <button class="btn btn-warning" onclick="devRecharge(event)">免费获得 99 积分</button>
      </div>` : '';

    const msg = `
      <div class="credit-shop">
        <div class="shop-balance">
          <span>💰 当前积分：</span>
          <b id="shop-credits">${c.credits}</b>
        </div>

        <div class="shop-section-title">💳 充值积分（购买套餐）</div>
        <div class="recharge-grid" id="recharge-grid">
          <div class="recharge-item highlight">
            <div class="recharge-price">¥10</div>
            <div class="recharge-credits">🪙 100 积分</div>
            <div class="recharge-tag">入门</div>
            <button class="btn btn-primary btn-block btn-sm" onclick="buyPackage('basic', event)">立即购买</button>
          </div>
          <div class="recharge-item recommended">
            <div class="recharge-badge">⭐ 超值</div>
            <div class="recharge-price">¥30</div>
            <div class="recharge-credits">🪙 350 积分</div>
            <div class="recharge-tag">送50积分</div>
            <button class="btn btn-primary btn-block btn-sm" onclick="buyPackage('popular', event)">立即购买</button>
          </div>
          <div class="recharge-item">
            <div class="recharge-price">¥50</div>
            <div class="recharge-credits">🪙 700 积分</div>
            <div class="recharge-tag">送200积分</div>
            <button class="btn btn-primary btn-block btn-sm" onclick="buyPackage('premium', event)">立即购买</button>
          </div>
          <div class="recharge-item">
            <div class="recharge-price">¥100</div>
            <div class="recharge-credits">🪙 1,500 积分</div>
            <div class="recharge-tag">送500积分</div>
            <button class="btn btn-primary btn-block btn-sm" onclick="buyPackage('ultra', event)">立即购买</button>
          </div>
        </div>

        <div class="shop-section-title">🎮 消费积分</div>
        <div class="shop-grid">
          <div class="shop-item" onclick="buyRemoveWatermark(event)">
            <div class="shop-icon">🎮</div>
            <div class="shop-title">去除水印</div>
            <div class="shop-price">1 积分</div>
          </div>
          <div class="shop-item" onclick="buyUpgrade('pro', event)">
            <div class="shop-icon">⭐</div>
            <div class="shop-title">升级 Pro</div>
            <div class="shop-price">10 积分</div>
          </div>
          <div class="shop-item" onclick="buyUpgrade('enterprise', event)">
            <div class="shop-icon">👑</div>
            <div class="shop-title">升级企业版</div>
            <div class="shop-price">30 积分</div>
          </div>
          <div class="shop-item" onclick="buyExtraGeneration(event)">
            <div class="shop-icon">🎲</div>
            <div class="shop-title">额外生成次数</div>
            <div class="shop-price">2 积分</div>
          </div>
        </div>
        ${devSection}
      </div>
    `;

    showModal('积分商城', msg, [
      { id: 'close-shop', label: '关闭', cls: 'btn-outline' }
    ]);
  });
}

// 买套餐 - 先确认支付
async function buyPackage(packageId, event) {
  if (event) { event.stopPropagation(); event.preventDefault(); }

  const packages = {
    basic: { name: '基础包', price: 10, credits: 100 },
    popular: { name: '热门包', price: 30, credits: 350 },
    premium: { name: '豪华包', price: 50, credits: 700 },
    ultra: { name: '尊享包', price: 100, credits: 1500 }
  };
  const pkg = packages[packageId];
  if (!pkg) return;

  // 先关闭积分商城弹窗
  document.getElementById('modal-overlay').style.display = 'none';

  // 显示支付确认弹窗
  getCredits().then(c => {
    const payMsg = `
      <div class="checkout-card">
        <div class="checkout-header">
          <div class="checkout-icon">💳</div>
          <h3>确认支付</h3>
        </div>
        <div class="checkout-detail">
          <div class="checkout-row"><span>套餐</span><b>${pkg.name}</b></div>
          <div class="checkout-row"><span>获得积分</span><b style="color:#7c3aed;">${pkg.credits} 积分</b></div>
          <div class="checkout-row checkout-total"><span>支付金额</span><b style="font-size:1.5em;color:#ef4444;">¥${pkg.price}</b></div>
        </div>
        ${c.devMode ? `
          <div class="checkout-dev-note">
            <p style="font-size:.8rem;color:#92400e;">🔧 开发模式：点击确认后积分直接到账（不收取费用）</p>
          </div>
        ` : `
          <div class="checkout-qr">
            <div class="qr-placeholder">[ 扫码支付 ]</div>
            <p style="font-size:.75rem;color:#666;">请使用微信/支付宝扫描二维码完成支付</p>
          </div>
        `}
      </div>
    `;

    showModal('确认支付', payMsg, [
      {
        id: 'confirm-pay',
        label: '💰 确认支付 ¥' + pkg.price,
        cls: 'btn-danger',
        onClick: async () => {
          try {
            const data = await apiCall('/api/payment/buy-credits', 'POST', { packageId });
            if (c.devMode || data.remaining) {
              showModal('支付成功',
                `✅ 成功获得 <b style="color:#7c3aed;">${pkg.credits} 积分</b>！<br/>当前积分余额：<b>${data.remaining || (c.credits + pkg.credits)}</b>`,
                [{ id: 'ok-done', label: '好的', cls: 'btn-primary', onClick: () => { refreshNavCredits(); } }]
              );
            } else if (data.orderId) {
              showModal('订单已创建',
                `订单号：<b>${data.orderId}</b><br/>请完成支付后联系管理员确认。`,
                [{ id: 'ok-order', label: '知道了', cls: 'btn-primary' }]
              );
            }
          } catch (err) {
            showModal('支付失败', err.message || '请稍后重试');
          }
        }
      },
      { id: 'cancel-pay', label: '取消', cls: 'btn-outline' }
    ]);
  });
}

// 更新导航栏积分显示
async function refreshNavCredits() {
  const badge = document.getElementById('credits-badge');
  const count = document.getElementById('credits-count');
  if (!badge || !count) return;
  try {
    const data = await apiCall('/api/user/me');
    badge.style.display = 'inline';
    count.textContent = data.user.credits || 0;
  } catch {}
}

function buyRemoveWatermark(event) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  (async () => {
    const gameId = window._currentGameId;
    if (!gameId) {
      showModal('提示', '请先生成一个游戏再去除水印');
      return;
    }
    try {
      const data = await apiCall('/api/games/' + gameId + '/remove-watermark', 'POST');
      showModal('成功', `水印已去除！剩余积分: ${data.remaining}`);
      const iframe = document.getElementById('game-preview');
      if (iframe && data.html) { iframe.srcdoc = data.html; }
    } catch (err) {
      showModal('积分不足', err.message + '\n\n请先到积分商城充值积分。', [
        { id: 'open-shop', label: '去充值', cls: 'btn-primary', onClick: showCreditShop },
      ]);
    }
  })();
}

async function buyUpgrade(plan, event) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  const planName = plan === 'pro' ? 'Pro' : '企业版';
  try {
    const data = await apiCall('/api/payment/upgrade', 'POST', { plan });
    showModal('升级成功', `已升级到 ${planName}！剩余积分: ${data.remaining}`, [
      { id: 'reload', label: '刷新页面', cls: 'btn-primary', onClick: () => location.reload() },
    ]);
  } catch (err) {
    showModal('升级失败', err.message, [
      { id: 'go-shop', label: '去充值积分', cls: 'btn-primary', onClick: showCreditShop },
    ]);
  }
}

async function buyExtraGeneration(event) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  try {
    const data = await apiCall('/api/payment/buy-generation', 'POST');
    showModal('购买成功', `获得 +1 次生成机会！剩余积分: ${data.remaining}`);
  } catch (err) {
    showModal('购买失败', err.message, [
      { id: 'go-shop', label: '去充值积分', cls: 'btn-primary', onClick: showCreditShop },
    ]);
  }
}

async function devRecharge(event) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  try {
    const data = await apiCall('/api/payment/dev-recharge', 'POST');
    showModal('充值成功', `已获得 99 积分！当前积分: ${data.remaining}`, [
      { id: 'ok', label: '好的', onClick: () => { document.getElementById('modal-overlay').style.display = 'none'; refreshNavCredits(); } }
    ]);
  } catch (err) {
    showModal('充值失败', err.message);
  }
}

function showQuotaModal() {
  getCredits().then(c => {
    const creditsMsg = c.credits > 0
      ? `<br/><span style="color:#7c3aed;">当前积分: ${c.credits}（可在积分商城购买生成次数、去除水印等）</span>`
      : '<br/><span style="color:#f59e0b;">积分余额: 0，快去积分商城获取积分吧！</span>';

    showModal(
      '配额用完',
      `您的免费生成次数已用完！分享可获得 +1 次 + 1 积分。${creditsMsg}`,
      [
        {
          id: 'share',
          label: '分享 +1 次',
          cls: 'btn-outline',
          onClick: async () => {
            try {
              const data = await apiCall('/api/share/claim', 'POST');
              showModal('成功', `获得 +1 次生成机会和 +1 积分！剩余：${data.quota.total} 次，积分：${data.credits}。`);
            } catch (err) {
              showModal('错误', err.message || '分享奖励领取失败');
            }
          }
        },
        {
          id: 'shop',
          label: '积分商城',
          cls: 'btn-primary',
          onClick: showCreditShop
        }
      ]
    );
  });
}

function shareGame(gameId) {
  const url = gameId
    ? `${window.location.origin}/game.html?id=${gameId}`
    : window.location.href;

  if (navigator.share) {
    navigator.share({
      title: 'Check out this game on PromptToPlay',
      url
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      showModal('链接已复制', '游戏链接已复制到剪贴板！');
    }).catch(() => {
      showModal('分享', `分享链接: ${url}`);
    });
  }
}

// Update nav on page load
(function updateNav() {
  const token = localStorage.getItem('ptp_token');
  const loginEl = document.getElementById('nav-login');
  const logoutEl = document.getElementById('nav-logout');
  if (loginEl) loginEl.style.display = token ? 'none' : 'inline';
  if (logoutEl) logoutEl.style.display = token ? 'inline' : 'none';
})();
