// 生成带素材的横版动作闯关游戏
const fs = require('fs');
const path = require('path');

const rawJson = fs.readFileSync(path.join(__dirname, '..', 'assets', 'base64.json'), 'utf8').replace(/^\uFEFF/, '');
const assets = JSON.parse(rawJson);

const gameHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>勇者冒险记</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1a1a2e;overflow:hidden;display:flex;justify-content:center;align-items:center;height:100vh;font-family:'PingFang SC','Microsoft YaHei',sans-serif}
#gameWrap{position:relative;width:100%;max-width:960px;aspect-ratio:16/9;overflow:hidden;border-radius:12px;box-shadow:0 0 40px rgba(0,0,0,.5)}
canvas{display:block;width:100%;height:100%}
#hud{position:absolute;top:10px;left:10px;right:10px;display:flex;justify-content:space-between;align-items:flex-start;z-index:10;pointer-events:none}
#healthBar{width:180px;height:22px;background:rgba(0,0,0,.5);border-radius:11px;overflow:hidden;border:2px solid rgba(255,255,255,.3)}
#healthFill{height:100%;background:linear-gradient(90deg,#ff4757,#ff6b81);transition:width .3s;border-radius:9px}
#scoreText{color:#fff;font-size:18px;font-weight:bold;text-shadow:2px 2px 4px rgba(0,0,0,.8)}
#bossBar{position:absolute;top:50px;left:50%;transform:translateX(-50%);width:300px;display:none;z-index:10}
#bossBarText{color:#ff4757;text-align:center;font-size:14px;font-weight:bold;margin-bottom:4px;text-shadow:1px 1px 2px #000}
#bossBarFill{height:16px;background:rgba(0,0,0,.5);border-radius:8px;overflow:hidden;border:2px solid rgba(255,71,87,.5)}
#bossBarInner{height:100%;background:linear-gradient(90deg,#8b00ff,#ff4757);transition:width .3s;width:100%}
.overlay{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;background:rgba(0,0,0,.7);z-index:20;color:#fff;text-align:center}
.overlay h1{font-size:42px;margin-bottom:10px;background:linear-gradient(135deg,#ffd700,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.overlay p{font-size:16px;margin-bottom:20px;color:#ccc;max-width:400px;line-height:1.8}
.overlay button{padding:14px 40px;font-size:18px;font-weight:bold;border:none;border-radius:30px;cursor:pointer;background:linear-gradient(135deg,#ff6b6b,#ee5a24);color:#fff;box-shadow:0 4px 20px rgba(255,107,107,.4);transition:all .2s}
.overlay button:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(255,107,107,.6)}
.controls-hint{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.6);font-size:13px;z-index:10;pointer-events:none}
#mobileControls{position:absolute;bottom:20px;left:0;right:0;display:none;justify-content:space-between;padding:0 20px;z-index:15}
.mobile-btn{width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.4);color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;touch-action:manipulation}
.mobile-btn:active{background:rgba(255,255,255,.4)}
#leftControls{display:flex;gap:10px}
#rightControls{display:flex;gap:10px}
@media(pointer:coarse){#mobileControls{display:flex}}
</style>
</head>
<body>
<div id="gameWrap">
  <canvas id="c"></canvas>
  <div id="hud">
    <div><div id="healthBar"><div id="healthFill" style="width:100%"></div></div></div>
    <div id="scoreText">💰 0</div>
  </div>
  <div id="bossBar">
    <div id="bossBarText">👹 暗影魔王</div>
    <div id="bossBarFill"><div id="bossBarInner"></div></div>
  </div>
  <div id="startScreen" class="overlay">
    <h1>⚔️ 勇者冒险记</h1>
    <p>深入魔法森林，击败史莱姆，挑战暗影魔王！<br><br>← → 移动 | ↑/空格 跳跃 | J/鼠标 攻击<br>收集金币和血瓶，打败BOSS通关！</p>
    <button onclick="startGame()">开始冒险</button>
  </div>
  <div id="endScreen" class="overlay" style="display:none">
    <h1 id="endTitle">游戏结束</h1>
    <p id="endText"></p>
    <button onclick="restartGame()">再来一次</button>
  </div>
  <div class="controls-hint">← → 移动 | ↑/空格 跳跃 | J 攻击</div>
  <div id="mobileControls">
    <div id="leftControls">
      <div class="mobile-btn" id="btnLeft">◀</div>
      <div class="mobile-btn" id="btnRight">▶</div>
    </div>
    <div id="rightControls">
      <div class="mobile-btn" id="btnJump">⬆</div>
      <div class="mobile-btn" id="btnAttack">⚔</div>
    </div>
  </div>
</div>
<script>
// ===== 素材加载 =====
const IMG = {};
const assets = {
  player: 'data:image/png;base64,${assets['player.png']}',
  slime: 'data:image/png;base64,${assets['slime.png']}',
  coin: 'data:image/png;base64,${assets['coin.png']}',
  potion: 'data:image/png;base64,${assets['potion.png']}',
  boss: 'data:image/png;base64,${assets['boss.png']}'
};
let assetsLoaded = 0;
const totalAssets = Object.keys(assets).length;
for (const key in assets) {
  IMG[key] = new Image();
  IMG[key].onload = () => { assetsLoaded++; };
  IMG[key].src = assets[key];
}

// ===== 画布设置 =====
const c = document.getElementById('c');
const ctx = c.getContext('2d');
const W = 960, H = 540;
c.width = W; c.height = H;

// ===== 音效系统 =====
let audioCtx;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playSound(type) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  switch(type) {
    case 'jump': o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(800, now+0.1); g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now+0.15); o.start(now); o.stop(now+0.15); break;
    case 'attack': o.type='sawtooth'; o.frequency.setValueAtTime(200, now); o.frequency.exponentialRampToValueAtTime(100, now+0.1); g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.01, now+0.12); o.start(now); o.stop(now+0.12); break;
    case 'coin': o.frequency.setValueAtTime(800, now); o.frequency.setValueAtTime(1200, now+0.05); g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now+0.2); o.start(now); o.stop(now+0.2); break;
    case 'hurt': o.type='square'; o.frequency.setValueAtTime(150, now); o.frequency.exponentialRampToValueAtTime(50, now+0.2); g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now+0.25); o.start(now); o.stop(now+0.25); break;
    case 'potion': o.frequency.setValueAtTime(500, now); o.frequency.exponentialRampToValueAtTime(1000, now+0.15); g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now+0.3); o.start(now); o.stop(now+0.3); break;
    case 'bossHit': o.type='sawtooth'; o.frequency.setValueAtTime(100, now); o.frequency.exponentialRampToValueAtTime(50, now+0.15); g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.01, now+0.2); o.start(now); o.stop(now+0.2); break;
    case 'win': [523,659,784,1047].forEach((f,i)=>{setTimeout(()=>{const oo=audioCtx.createOscillator();const gg=audioCtx.createGain();oo.connect(gg);gg.connect(audioCtx.destination);oo.frequency.value=f;gg.gain.setValueAtTime(0.2,audioCtx.currentTime);gg.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.3);oo.start();oo.stop(audioCtx.currentTime+0.3);},i*150)}); break;
    case 'lose': [400,350,300,200].forEach((f,i)=>{setTimeout(()=>{const oo=audioCtx.createOscillator();const gg=audioCtx.createGain();oo.connect(gg);gg.connect(audioCtx.destination);oo.type='sawtooth';oo.frequency.value=f;gg.gain.setValueAtTime(0.15,audioCtx.currentTime);gg.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.4);oo.start();oo.stop(audioCtx.currentTime+0.4);},i*200)}); break;
  }
}

// ===== 游戏状态 =====
let gameState = 'menu'; // menu, playing, win, lose
let cameraX = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('heroHighScore') || '0');
let particles = [];
let projectiles = [];
let screenShake = 0;
let frameCount = 0;

const LEVEL_WIDTH = 3200;
const GROUND_Y = 440;

// 玩家
const player = {
  x: 100, y: GROUND_Y - 70, w: 50, h: 70,
  vx: 0, vy: 0, speed: 4, jumpPower: 14,
  onGround: false, facing: 1, health: 100, maxHealth: 100,
  attacking: false, attackTimer: 0, attackCooldown: 0,
  invincible: 0, animFrame: 0
};

// 平台
const platforms = [
  {x: 300, y: 360, w: 120, h: 20},
  {x: 550, y: 300, w: 100, h: 20},
  {x: 800, y: 350, w: 140, h: 20},
  {x: 1100, y: 280, w: 100, h: 20},
  {x: 1350, y: 340, w: 120, h: 20},
  {x: 1600, y: 300, w: 100, h: 20},
  {x: 1900, y: 360, w: 150, h: 20},
  {x: 2200, y: 300, w: 100, h: 20},
  {x: 2500, y: 340, w: 120, h: 20},
];

// 敌人
let enemies = [];
function spawnEnemies() {
  enemies = [
    {x: 400, y: GROUND_Y-45, w: 45, h: 45, vx: -1, type:'slime', hp:2, alive:true, patrolMin:350, patrolMax:550},
    {x: 700, y: GROUND_Y-45, w: 45, h: 45, vx: 1, type:'slime', hp:2, alive:true, patrolMin:650, patrolMax:900},
    {x: 1000, y: GROUND_Y-45, w: 45, h: 45, vx: -1, type:'slime', hp:2, alive:true, patrolMin:950, patrolMax:1150},
    {x: 1300, y: GROUND_Y-45, w: 45, h: 45, vx: 1, type:'slime', hp:3, alive:true, patrolMin:1250, patrolMax:1500},
    {x: 1700, y: GROUND_Y-45, w: 45, h: 45, vx: -1, type:'slime', hp:3, alive:true, patrolMin:1650, patrolMax:1850},
    {x: 2100, y: GROUND_Y-45, w: 45, h: 45, vx: 1, type:'slime', hp:3, alive:true, patrolMin:2050, patrolMax:2300},
    {x: 2400, y: GROUND_Y-45, w: 45, h: 45, vx: -1, type:'slime', hp:4, alive:true, patrolMin:2350, patrolMax:2600},
  ];
}

// BOSS
const boss = {
  x: 2900, y: GROUND_Y-120, w: 100, h: 120,
  hp: 30, maxHp: 30, alive: true,
  vx: 0, vy: 0, attackTimer: 0,
  phase: 0, hitFlash: 0
};

// 道具
let items = [];
function spawnItems() {
  items = [
    {x: 350, y: 320, type:'coin', collected:false},
    {x: 580, y: 260, type:'coin', collected:false},
    {x: 620, y: 260, type:'coin', collected:false},
    {x: 850, y: 310, type:'potion', collected:false},
    {x: 1130, y: 240, type:'coin', collected:false},
    {x: 1400, y: 300, type:'coin', collected:false},
    {x: 1440, y: 300, type:'coin', collected:false},
    {x: 1630, y: 260, type:'potion', collected:false},
    {x: 1950, y: 320, type:'coin', collected:false},
    {x: 1990, y: 320, type:'coin', collected:false},
    {x: 2230, y: 260, type:'coin', collected:false},
    {x: 2540, y: 300, type:'potion', collected:false},
    {x: 2700, y: GROUND_Y-30, type:'coin', collected:false},
    {x: 2750, y: GROUND_Y-30, type:'coin', collected:false},
  ];
}

// ===== 粒子系统 =====
function addParticle(x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random()-0.5) * speed,
      vy: (Math.random()-0.5) * speed - 2,
      life: 30 + Math.random()*20,
      maxLife: 50,
      color, size: 2 + Math.random()*4
    });
  }
}

// ===== 输入 =====
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  initAudio();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// 移动端控制
function setupMobileBtn(id, keyCode) {
  const btn = document.getElementById(id);
  btn.addEventListener('touchstart', e => { e.preventDefault(); keys[keyCode] = true; initAudio(); });
  btn.addEventListener('touchend', e => { e.preventDefault(); keys[keyCode] = false; });
}
setupMobileBtn('btnLeft', 'ArrowLeft');
setupMobileBtn('btnRight', 'ArrowRight');
setupMobileBtn('btnJump', 'Space');
setupMobileBtn('btnAttack', 'KeyJ');

// ===== 游戏逻辑 =====
function startGame() {
  initAudio();
  document.getElementById('startScreen').style.display = 'none';
  gameState = 'playing';
  resetGame();
}

function resetGame() {
  player.x = 100; player.y = GROUND_Y - 70;
  player.vx = 0; player.vy = 0;
  player.health = player.maxHealth;
  player.attacking = false; player.attackTimer = 0; player.attackCooldown = 0;
  player.invincible = 0;
  cameraX = 0; score = 0; particles = []; projectiles = [];
  spawnEnemies(); spawnItems();
  boss.hp = boss.maxHp; boss.alive = true; boss.x = 2900; boss.vx = 0;
  document.getElementById('bossBar').style.display = 'none';
  updateHUD();
}

function restartGame() {
  document.getElementById('endScreen').style.display = 'none';
  gameState = 'playing';
  resetGame();
}

function updateHUD() {
  document.getElementById('healthFill').style.width = (player.health / player.maxHealth * 100) + '%';
  document.getElementById('scoreText').textContent = '💰 ' + score;
  if (boss.alive && player.x > 2600) {
    document.getElementById('bossBar').style.display = 'block';
    document.getElementById('bossBarInner').style.width = (boss.hp / boss.maxHp * 100) + '%';
  }
}

function rectCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  if (gameState !== 'playing') return;
  frameCount++;

  // 玩家移动
  if (keys['ArrowLeft']) { player.vx = -player.speed; player.facing = -1; }
  else if (keys['ArrowRight']) { player.vx = player.speed; player.facing = 1; }
  else { player.vx *= 0.8; }

  // 跳跃
  if ((keys['Space'] || keys['ArrowUp']) && player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
    playSound('jump');
    addParticle(player.x + player.w/2, player.y + player.h, '#aaa', 5, 3);
  }

  // 攻击
  if ((keys['KeyJ'] || keys['KeyX']) && player.attackCooldown <= 0) {
    player.attacking = true;
    player.attackTimer = 15;
    player.attackCooldown = 25;
    playSound('attack');
  }
  if (player.attackTimer > 0) player.attackTimer--;
  else player.attacking = false;
  if (player.attackCooldown > 0) player.attackCooldown--;
  if (player.invincible > 0) player.invincible--;

  // 重力
  player.vy += 0.6;
  player.x += player.vx;
  player.y += player.vy;

  // 地面碰撞
  if (player.y + player.h >= GROUND_Y) {
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // 平台碰撞
  player.onGround = player.y + player.h >= GROUND_Y;
  platforms.forEach(p => {
    if (player.vy >= 0 && player.x + player.w > p.x && player.x < p.x + p.w) {
      if (player.y + player.h >= p.y && player.y + player.h <= p.y + p.h + 10) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
  });

  // 边界
  if (player.x < 0) player.x = 0;
  if (player.x > LEVEL_WIDTH - player.w) player.x = LEVEL_WIDTH - player.w;
  if (player.y > H + 100) { player.health = 0; }

  // 相机跟随
  const targetCam = player.x - W / 3;
  cameraX += (targetCam - cameraX) * 0.1;
  cameraX = Math.max(0, Math.min(LEVEL_WIDTH - W, cameraX));

  // 敌人更新
  enemies.forEach(e => {
    if (!e.alive) return;
    e.x += e.vx;
    if (e.x < e.patrolMin || e.x > e.patrolMax) e.vx *= -1;

    // 玩家攻击敌人
    if (player.attacking && player.attackTimer > 5) {
      const attackBox = {
        x: player.facing > 0 ? player.x + player.w : player.x - 50,
        y: player.y + 10, w: 50, h: 50
      };
      if (rectCollide(attackBox, e)) {
        e.hp--;
        addParticle(e.x + e.w/2, e.y + e.h/2, '#7cfc00', 8, 5);
        screenShake = 5;
        if (e.hp <= 0) {
          e.alive = false;
          score += 50;
          addParticle(e.x + e.w/2, e.y + e.h/2, '#32cd32', 15, 6);
          playSound('bossHit');
        }
      }
    }

    // 敌人伤害玩家
    if (e.alive && player.invincible <= 0 && rectCollide(player, e)) {
      player.health -= 15;
      player.invincible = 60;
      player.vx = player.x < e.x ? -8 : 8;
      player.vy = -6;
      screenShake = 10;
      playSound('hurt');
      addParticle(player.x + player.w/2, player.y + player.h/2, '#ff4757', 10, 5);
    }
  });

  // BOSS更新
  if (boss.alive && player.x > 2600) {
    boss.attackTimer++;
    // BOSS移动
    const dx = player.x - boss.x;
    boss.vx = dx > 0 ? 1.5 : -1.5;
    boss.x += boss.vx;
    boss.x = Math.max(2700, Math.min(3100, boss.x));

    // BOSS攻击 - 发射弹幕
    if (boss.attackTimer > 90) {
      boss.attackTimer = 0;
      for (let i = -1; i <= 1; i++) {
        projectiles.push({
          x: boss.x + boss.w/2, y: boss.y + 40,
          vx: (player.x - boss.x) * 0.01 + i * 2,
          vy: -3, w: 12, h: 12, damage: 10
        });
      }
      playSound('bossHit');
    }

    // 玩家攻击BOSS
    if (player.attacking && player.attackTimer > 5) {
      const attackBox = {
        x: player.facing > 0 ? player.x + player.w : player.x - 50,
        y: player.y + 10, w: 50, h: 50
      };
      if (rectCollide(attackBox, boss) && boss.hitFlash <= 0) {
        boss.hp--;
        boss.hitFlash = 10;
        addParticle(boss.x + boss.w/2, boss.y + boss.h/2, '#ff00ff', 12, 6);
        screenShake = 8;
        playSound('bossHit');
        if (boss.hp <= 0) {
          boss.alive = false;
          score += 500;
          addParticle(boss.x + boss.w/2, boss.y + boss.h/2, '#ffd700', 30, 8);
          screenShake = 20;
          playSound('win');
          setTimeout(() => {
            gameState = 'win';
            if (score > highScore) { highScore = score; localStorage.setItem('heroHighScore', highScore); }
            document.getElementById('endTitle').textContent = '🎉 恭喜通关！';
            document.getElementById('endText').innerHTML = '你击败了暗影魔王！<br>得分: ' + score + '<br>最高分: ' + highScore;
            document.getElementById('endScreen').style.display = 'flex';
          }, 1000);
        }
      }
    }
    if (boss.hitFlash > 0) boss.hitFlash--;

    // BOSS伤害玩家
    if (player.invincible <= 0 && rectCollide(player, boss)) {
      player.health -= 20;
      player.invincible = 60;
      player.vx = player.x < boss.x ? -10 : 10;
      player.vy = -8;
      screenShake = 15;
      playSound('hurt');
    }
  }

  // 弹幕更新
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.15;
    if (p.y > GROUND_Y || p.x < cameraX - 50 || p.x > cameraX + W + 50) {
      projectiles.splice(i, 1); continue;
    }
    if (player.invincible <= 0 && rectCollide(player, p)) {
      player.health -= p.damage;
      player.invincible = 45;
      screenShake = 8;
      playSound('hurt');
      addParticle(player.x + player.w/2, player.y + player.h/2, '#ff4757', 8, 4);
      projectiles.splice(i, 1);
    }
  }

  // 道具收集
  items.forEach(item => {
    if (item.collected) return;
    const itemBox = {x: item.x, y: item.y, w: 28, h: 28};
    if (rectCollide(player, itemBox)) {
      item.collected = true;
      if (item.type === 'coin') {
        score += 10;
        playSound('coin');
        addParticle(item.x + 14, item.y + 14, '#ffd700', 8, 4);
      } else if (item.type === 'potion') {
        player.health = Math.min(player.maxHealth, player.health + 30);
        playSound('potion');
        addParticle(item.x + 14, item.y + 14, '#ff4757', 10, 4);
      }
    }
  });

  // 粒子更新
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.2;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (screenShake > 0) screenShake--;

  // 玩家死亡
  if (player.health <= 0 && gameState === 'playing') {
    gameState = 'lose';
    playSound('lose');
    if (score > highScore) { highScore = score; localStorage.setItem('heroHighScore', highScore); }
    document.getElementById('endTitle').textContent = '💀 游戏结束';
    document.getElementById('endText').innerHTML = '勇者倒下了...<br>得分: ' + score + '<br>最高分: ' + highScore;
    document.getElementById('endScreen').style.display = 'flex';
  }

  updateHUD();
}

// ===== 渲染 =====
function drawBackground() {
  // 天空渐变
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#87ceeb');
  sky.addColorStop(0.5, '#98d8e8');
  sky.addColorStop(1, '#b8e8d0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // 远山（视差）
  ctx.fillStyle = '#7cb88e';
  for (let i = 0; i < 5; i++) {
    const mx = (i * 400 - cameraX * 0.2) % (W + 400) - 200;
    ctx.beginPath();
    ctx.moveTo(mx, GROUND_Y);
    ctx.lineTo(mx + 200, 200);
    ctx.lineTo(mx + 400, GROUND_Y);
    ctx.fill();
  }

  // 树木（视差）
  ctx.fillStyle = '#5a9e6f';
  for (let i = 0; i < 8; i++) {
    const tx = (i * 250 - cameraX * 0.5) % (W + 250) - 125;
    ctx.fillRect(tx + 20, GROUND_Y - 80, 15, 80);
    ctx.beginPath();
    ctx.arc(tx + 27, GROUND_Y - 90, 35, 0, Math.PI * 2);
    ctx.fill();
  }

  // 云朵
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 4; i++) {
    const cx = (i * 350 + frameCount * 0.3 - cameraX * 0.1) % (W + 200) - 100;
    const cy = 60 + i * 30;
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI*2);
    ctx.arc(cx+25, cy-5, 30, 0, Math.PI*2);
    ctx.arc(cx+55, cy, 25, 0, Math.PI*2);
    ctx.fill();
  }

  // 地面
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = '#6b5344';
  ctx.fillRect(0, GROUND_Y, W, 8);
  // 草地
  ctx.fillStyle = '#7cb88e';
  ctx.fillRect(0, GROUND_Y - 6, W, 10);
}

function drawPlatforms() {
  platforms.forEach(p => {
    const sx = p.x - cameraX;
    if (sx > -200 && sx < W + 200) {
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(sx, p.y, p.w, p.h);
      ctx.fillStyle = '#7cb88e';
      ctx.fillRect(sx, p.y - 4, p.w, 8);
    }
  });
}

function drawPlayer() {
  const sx = player.x - cameraX;
  ctx.save();
  if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }
  // 翻转
  if (player.facing < 0) {
    ctx.translate(sx + player.w, 0);
    ctx.scale(-1, 1);
    ctx.translate(-sx, 0);
  }
  // 绘制玩家图片
  if (IMG.player && IMG.player.complete) {
    ctx.drawImage(IMG.player, sx, player.y, player.w, player.h);
  } else {
    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(sx, player.y, player.w, player.h);
  }
  // 攻击特效
  if (player.attacking) {
    ctx.fillStyle = 'rgba(255,255,200,0.6)';
    ctx.beginPath();
    ctx.arc(sx + player.w + 15, player.y + 35, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx + player.w + 15, player.y + 35, 25, -0.5, 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemies() {
  enemies.forEach(e => {
    if (!e.alive) return;
    const sx = e.x - cameraX;
    if (sx > -100 && sx < W + 100) {
      if (IMG.slime && IMG.slime.complete) {
        // 史莱姆弹跳动画
        const bounce = Math.sin(frameCount * 0.15) * 3;
        ctx.drawImage(IMG.slime, sx, e.y + bounce, e.w, e.h);
      } else {
        ctx.fillStyle = '#32cd32';
        ctx.beginPath();
        ctx.ellipse(sx + e.w/2, e.y + e.h/2, e.w/2, e.h/2, 0, 0, Math.PI*2);
        ctx.fill();
      }
    }
  });
}

function drawBoss() {
  if (!boss.alive) return;
  const sx = boss.x - cameraX;
  if (sx > -200 && sx < W + 200) {
    ctx.save();
    if (boss.hitFlash > 0) {
      ctx.filter = 'brightness(2)';
    }
    if (IMG.boss && IMG.boss.complete) {
      const float = Math.sin(frameCount * 0.05) * 5;
      ctx.drawImage(IMG.boss, sx, boss.y + float, boss.w, boss.h);
    } else {
      ctx.fillStyle = '#8b00ff';
      ctx.fillRect(sx, boss.y, boss.w, boss.h);
    }
    ctx.restore();
  }
}

function drawItems() {
  items.forEach(item => {
    if (item.collected) return;
    const sx = item.x - cameraX;
    if (sx > -50 && sx < W + 50) {
      const float = Math.sin(frameCount * 0.1 + item.x) * 3;
      const img = item.type === 'coin' ? IMG.coin : IMG.potion;
      if (img && img.complete) {
        ctx.drawImage(img, sx, item.y + float, 28, 28);
      } else {
        ctx.fillStyle = item.type === 'coin' ? '#ffd700' : '#ff4757';
        ctx.beginPath();
        ctx.arc(sx + 14, item.y + 14 + float, 12, 0, Math.PI*2);
        ctx.fill();
      }
    }
  });
}

function drawProjectiles() {
  projectiles.forEach(p => {
    const sx = p.x - cameraX;
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(sx, p.y, 6, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,0,255,0.3)';
    ctx.beginPath();
    ctx.arc(sx, p.y, 10, 0, Math.PI*2);
    ctx.fill();
  });
}

function drawParticles() {
  particles.forEach(p => {
    const sx = p.x - cameraX;
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(sx, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

function render() {
  ctx.save();
  if (screenShake > 0) {
    ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);
  }
  drawBackground();
  drawPlatforms();
  drawItems();
  drawEnemies();
  drawBoss();
  drawProjectiles();
  drawPlayer();
  drawParticles();
  ctx.restore();
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// 初始化
spawnEnemies();
spawnItems();
gameLoop();
</script>
</body>
</html>`;

const outputPath = path.join(__dirname, '..', 'public', 'hero-adventure.html');
fs.writeFileSync(outputPath, gameHtml);
console.log(`✅ 游戏已生成: ${outputPath}`);
console.log(`   文件大小: ${(gameHtml.length / 1024).toFixed(1)} KB`);
