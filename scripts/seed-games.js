/**
 * Demo Games Seeder
 * 为每个分类创建演示游戏（纯 HTML5 Canvas）
 * 运行: node scripts/seed-games.js
 * 也可被 server.js require() 自动调用（DB 已初始化时）
 * 
 * 游戏由 AI 生成，包含：音效、粒子特效、完整游戏循环、难度递增
 */

require('dotenv').config();
const path = require('path');

const { initDb, run, all, getDb, saveDb } = require('../config/db');

// ============================================
// 游戏模板（AI 生成，带音效特效）
// ============================================

const DEMO_GAMES = [
  {
    title: '贪吃蛇大作战',
    category: 'action',
    description: '经典贪吃蛇游戏，蛇吃食物变长，撞墙或撞自己游戏结束',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0">
    <title>贪吃蛇 · 幻彩</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        body {
            background: #0b0e1a;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', system-ui, sans-serif;
            touch-action: none;
        }
        #game-wrapper {
            background: linear-gradient(145deg, #141a2e, #1e2740);
            border-radius: 32px;
            padding: 16px;
            box-shadow: 0 20px 35px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255,255,255,0.05);
        }
        canvas {
            display: block;
            width: 100%;
            height: auto;
            border-radius: 24px;
            background: #0e1320;
            box-shadow: inset 0 0 30px rgba(0,0,0,0.7);
            touch-action: none;
            cursor: pointer;
        }
        .ui-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px 14px 12px;
            color: #e6eaff;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .score-block {
            background: rgba(10, 15, 30, 0.7);
            padding: 8px 16px;
            border-radius: 40px;
            backdrop-filter: blur(4px);
            font-size: 18px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.06);
        }
        .score-block span {
            color: #f8d57a;
            margin-left: 6px;
        }
        .btn-pause {
            background: #2d3a5e;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 30px;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 0 #1a2136;
            transition: 0.1s ease;
            cursor: pointer;
            border: 1px solid #4f6090;
        }
        .btn-pause:active {
            transform: translateY(3px);
            box-shadow: 0 1px 0 #1a2136;
        }
        .overlay-message {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(10, 15, 30, 0.85);
            backdrop-filter: blur(12px);
            padding: 28px 40px;
            border-radius: 48px;
            text-align: center;
            border: 2px solid rgba(255, 215, 100, 0.3);
            box-shadow: 0 15px 40px rgba(0,0,0,0.7);
            z-index: 20;
            color: white;
            font-weight: 600;
            pointer-events: auto;
            transition: 0.2s;
        }
        .overlay-message h1 {
            font-size: 42px;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #ffd966, #ffb84d);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 800;
        }
        .overlay-message p {
            margin: 10px 0;
            font-size: 18px;
            opacity: 0.8;
        }
        .overlay-message .big-score {
            font-size: 38px;
            background: linear-gradient(to right, #ffd966, #ffaa44);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 700;
        }
        .btn {
            background: linear-gradient(135deg, #f8b84e, #f09a3e);
            border: none;
            padding: 12px 32px;
            border-radius: 60px;
            font-size: 20px;
            font-weight: 800;
            color: #1e1b2a;
            margin-top: 18px;
            box-shadow: 0 6px 0 #b46b1e;
            transition: 0.1s;
            cursor: pointer;
            letter-spacing: 1px;
        }
        .btn:active {
            transform: translateY(4px);
            box-shadow: 0 2px 0 #b46b1e;
        }
        .controls-hint {
            font-size: 14px;
            color: #9aa7c7;
            margin-top: 10px;
            letter-spacing: 0.3px;
        }
        #touch-area {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            height: 90px;
            display: flex;
            justify-content: center;
            gap: 30px;
            align-items: center;
            pointer-events: none;
            z-index: 5;
            opacity: 0.5;
        }
        .touch-btn {
            pointer-events: auto;
            width: 70px;
            height: 70px;
            background: rgba(255,255,255,0.06);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 50px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 28px;
            color: white;
            backdrop-filter: blur(4px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        @media (pointer: fine) {
            #touch-area { display: none; }
        }
        .relative-wrap {
            position: relative;
            display: inline-block;
        }
    </style>
</head>
<body>
<div class="relative-wrap" id="gameContainer">
    <div id="game-wrapper">
        <div class="ui-bar">
            <div class="score-block">🍒 <span id="scoreDisplay">0</span></div>
            <div class="score-block">🏆 <span id="highDisplay">0</span></div>
            <button class="btn-pause" id="pauseBtn">⏸ 暂停</button>
        </div>
        <canvas id="gameCanvas" width="600" height="600"></canvas>
    </div>
    <!-- 动态悬浮层 -->
    <div id="overlay" class="overlay-message" style="display: none;"></div>
    <!-- 移动端方向 (不显示在桌面) -->
    <div id="touch-area">
        <div class="touch-btn" data-dir="up">▲</div>
        <div class="touch-btn" data-dir="left">◀</div>
        <div class="touch-btn" data-dir="down">▼</div>
        <div class="touch-btn" data-dir="right">▶</div>
    </div>
</div>

<script>
    (function() {
        // ---------- 配置 ----------
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreSpan = document.getElementById('scoreDisplay');
        const highSpan = document.getElementById('highDisplay');
        const pauseBtn = document.getElementById('pauseBtn');
        const overlay = document.getElementById('overlay');
        const touchArea = document.getElementById('touch-area');

        // 网格参数
        const GRID_SIZE = 20;           // 20x20
        const CELL_SIZE = canvas.width / GRID_SIZE; // 30px

        // 游戏状态
        let snake = [];                 // 坐标数组 {x, y}
        let direction = { x: 1, y: 0 };
        let nextDirection = { x: 1, y: 0 };
        let food = { x: 8, y: 10 };
        let score = 0;
        let highScore = localStorage.getItem('snakeHigh') ? parseInt(localStorage.getItem('snakeHigh')) : 0;
        let gameActive = false;
        let paused = false;
        let gameOver = false;
        let winFlag = false;

        // 难度参数
        let moveInterval = 180;         // ms
        let moveTimer = 0;

        // 粒子系统
        let particles = [];

        // 震动
        let shakeAmount = 0;
        let shakeTimer = 0;

        // 音频上下文
        let audioCtx = null;
        function initAudio() {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        // 音效函数
        function playTone(freq, duration, type = 'sine', gainVal = 0.15) {
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        }
        function eatSound() {
            playTone(880, 0.08, 'sine', 0.2);
            setTimeout(() => playTone(1320, 0.1, 'triangle', 0.12), 60);
        }
        function overSound() {
            playTone(300, 0.3, 'sawtooth', 0.15);
            setTimeout(() => playTone(180, 0.4, 'square', 0.12), 120);
        }
        function clickSound() {
            playTone(520, 0.05, 'triangle', 0.1);
        }

        // ---------- 初始化蛇 ----------
        function resetGame() {
            snake = [
                { x: 7, y: 10 },
                { x: 6, y: 10 },
                { x: 5, y: 10 }
            ];
            direction = { x: 1, y: 0 };
            nextDirection = { x: 1, y: 0 };
            score = 0;
            moveInterval = 180;
            gameOver = false;
            paused = false;
            gameActive = true;
            particles = [];
            shakeAmount = 0;
            spawnFood();
            updateScoreUI();
            hideOverlay();
        }

        // 生成食物
        function spawnFood() {
            const freeCells = [];
            for (let i = 0; i < GRID_SIZE; i++) {
                for (let j = 0; j < GRID_SIZE; j++) {
                    if (!snake.some(s => s.x === i && s.y === j)) {
                        freeCells.push({ x: i, y: j });
                    }
                }
            }
            if (freeCells.length === 0) {
                // 胜利，但视为结束
                gameActive = false;
                gameOver = true;
                showOverlay('🎉 你赢了！', score, true);
                overSound();
                return;
            }
            food = freeCells[Math.floor(Math.random() * freeCells.length)];
        }

        // ---------- UI 更新 ----------
        function updateScoreUI() {
            scoreSpan.textContent = score;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHigh', highScore);
            }
            highSpan.textContent = highScore;
        }

        // 显示覆盖层
        function showOverlay(title, finalScore, isWin = false) {
            overlay.style.display = 'block';
            overlay.innerHTML = \`
                <h1>\${title}</h1>
                <p>\${isWin ? '完美！' : '得分'}</p>
                <div class="big-score">\${finalScore}</div>
                <p style="font-size:16px; margin-top:6px;">最高分 🏆 \${highScore}</p>
                <button class="btn" id="restartBtn">🔄 再来一局</button>
                <div class="controls-hint">↑↓←→ / WASD 移动 · 空格暂停</div>
            \`;
            const restartBtn = document.getElementById('restartBtn');
            if (restartBtn) restartBtn.addEventListener('click', () => {
                initAudio(); clickSound();
                resetGame();
            });
        }

        function hideOverlay() {
            overlay.style.display = 'none';
        }

        // 暂停切换
        function togglePause() {
            if (!gameActive || gameOver) return;
            paused = !paused;
            pauseBtn.textContent = paused ? '▶ 继续' : '⏸ 暂停';
            if (!paused) {
                // 重置定时
            }
        }

        // 键盘控制
        function handleKey(e) {
            const key = e.key.toLowerCase();
            // 防止页面滚动
            if (['arrowup','arrowdown','arrowleft','arrowright',' ', 'p', 'w','a','s','d'].includes(key) || 
                ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
            if (!gameActive || gameOver || paused) return;

            if (key === ' ' || key === 'p' || e.key === 'Escape') {
                togglePause();
                return;
            }

            let newDir = null;
            if (key === 'arrowup' || key === 'w') newDir = { x: 0, y: -1 };
            else if (key === 'arrowdown' || key === 's') newDir = { x: 0, y: 1 };
            else if (key === 'arrowleft' || key === 'a') newDir = { x: -1, y: 0 };
            else if (key === 'arrowright' || key === 'd') newDir = { x: 1, y: 0 };

            if (newDir) {
                // 禁止反向
                if (direction.x === -newDir.x && direction.y === -newDir.y) return;
                nextDirection = newDir;
            }
        }

        // 触摸滑动 (监听canvas)
        let touchStart = null;
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStart = { x: touch.clientX, y: touch.clientY };
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!touchStart || !gameActive || gameOver || paused) return;
            const touchEnd = e.changedTouches[0];
            const dx = touchEnd.clientX - touchStart.x;
            const dy = touchEnd.clientY - touchStart.y;
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
            let newDir = null;
            if (Math.abs(dx) > Math.abs(dy)) {
                newDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
            } else {
                newDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
            }
            if (direction.x === -newDir.x && direction.y === -newDir.y) return;
            nextDirection = newDir;
            touchStart = null;
        }, { passive: false });

        // 虚拟按钮
        document.querySelectorAll('.touch-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const dir = btn.dataset.dir;
                if (!gameActive || gameOver || paused) return;
                let newDir = null;
                if (dir === 'up') newDir = { x: 0, y: -1 };
                else if (dir === 'down') newDir = { x: 0, y: 1 };
                else if (dir === 'left') newDir = { x: -1, y: 0 };
                else if (dir === 'right') newDir = { x: 1, y: 0 };
                if (newDir && !(direction.x === -newDir.x && direction.y === -newDir.y)) {
                    nextDirection = newDir;
                }
            }, { passive: false });
        });

        // 暂停按钮
        pauseBtn.addEventListener('click', () => {
            initAudio(); clickSound();
            togglePause();
        });

        // 主循环
        let lastTime = 0;
        function gameLoop(timestamp) {
            requestAnimationFrame(gameLoop);
            if (!lastTime) lastTime = timestamp;
            let delta = timestamp - lastTime;
            lastTime = timestamp;

            // 更新粒子
            updateParticles(delta);

            // 震动衰减
            if (shakeTimer > 0) {
                shakeTimer -= delta;
                if (shakeTimer <= 0) shakeAmount = 0;
            }

            // 如果游戏不活动或暂停，只绘制
            if (!gameActive || paused || gameOver) {
                drawCanvas();
                return;
            }

            // 移动计时器
            moveTimer += delta;
            if (moveTimer >= moveInterval) {
                moveTimer -= moveInterval;
                // 更新方向
                direction = { ...nextDirection };

                // 移动蛇
                const head = snake[0];
                const newHead = { x: head.x + direction.x, y: head.y + direction.y };

                // 撞墙
                if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
                    gameOverSequence();
                    return;
                }
                // 撞自己 (注意尾巴移动)
                const willEat = (newHead.x === food.x && newHead.y === food.y);
                const tail = snake[snake.length - 1];
                for (let i = 0; i < snake.length; i++) {
                    if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
                        // 如果吃食物且即将移动，尾部会离开，但头部不能和除了尾外的撞
                        if (!(willEat && i === snake.length - 1)) {
                            gameOverSequence();
                            return;
                        }
                    }
                }

                // 插入新头
                snake.unshift(newHead);
                if (willEat) {
                    // 吃食物
                    score++;
                    updateScoreUI();
                    eatSound();
                    // 粒子特效
                    spawnBurst(food.x * CELL_SIZE + CELL_SIZE/2, food.y * CELL_SIZE + CELL_SIZE/2);
                    // 震动
                    shakeAmount = 6;
                    shakeTimer = 120;
                    // 难度递增
                    if (moveInterval > 70) moveInterval -= 4;
                    // 生成新食物
                    spawnFood();
                } else {
                    // 没吃到，移除尾部
                    snake.pop();
                }
            }

            drawCanvas();
        }

        // 游戏结束
        function gameOverSequence() {
            gameOver = true;
            gameActive = false;
            overSound();
            shakeAmount = 15;
            shakeTimer = 300;
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHigh', highScore);
            }
            highSpan.textContent = highScore;
            showOverlay('💀 游戏结束', score, false);
        }

        // 粒子系统
        function spawnBurst(cx, cy) {
            for (let i = 0; i < 18; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 150 + Math.random() * 300;
                particles.push({
                    x: cx, y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.5 + Math.random() * 0.4,
                    maxLife: 0.8,
                    size: 3 + Math.random() * 6,
                    color: \`hsl(\${30 + Math.random() * 50}, 90%, 60%)\`
                });
            }
        }

        function updateParticles(dt) {
            const dtSec = dt / 1000;
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx * dtSec;
                p.y += p.vy * dtSec;
                p.life -= dtSec;
                if (p.life <= 0) particles.splice(i, 1);
            }
        }

        // 绘图
        function drawCanvas() {
            ctx.save();
            // 震动
            if (shakeAmount > 0) {
                const dx = (Math.random() * 2 - 1) * shakeAmount;
                const dy = (Math.random() * 2 - 1) * shakeAmount;
                ctx.translate(dx, dy);
            }

            // 背景渐变
            const grad = ctx.createRadialGradient(300, 300, 50, 300, 300, 500);
            grad.addColorStop(0, '#1e2a40');
            grad.addColorStop(1, '#0b0e1a');
            ctx.fillStyle = grad;
            ctx.fillRect(-10, -10, canvas.width+20, canvas.height+20);

            // 网格线
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= GRID_SIZE; i++) {
                ctx.beginPath();
                ctx.moveTo(i * CELL_SIZE, 0);
                ctx.lineTo(i * CELL_SIZE, canvas.height);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i * CELL_SIZE);
                ctx.lineTo(canvas.width, i * CELL_SIZE);
                ctx.stroke();
            }

            // 绘制食物（脉冲）
            const pulse = 1 + 0.1 * Math.sin(Date.now() * 0.01);
            const fx = food.x * CELL_SIZE + CELL_SIZE/2;
            const fy = food.y * CELL_SIZE + CELL_SIZE/2;
            ctx.shadowColor = '#ffcc66';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ff9f4b';
            ctx.beginPath();
            ctx.arc(fx, fy, (CELL_SIZE/2 - 4) * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffd966';
            ctx.beginPath();
            ctx.arc(fx, fy, (CELL_SIZE/2 - 8) * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // 蛇身渐变色
            for (let i = 0; i < snake.length; i++) {
                const seg = snake[i];
                const x = seg.x * CELL_SIZE;
                const y = seg.y * CELL_SIZE;
                const t = i / Math.max(snake.length - 1, 1);
                const hue = 160 + t * 60; // 绿->黄
                ctx.fillStyle = \`hsl(\${hue}, 70%, 55%)\`;
                ctx.shadowColor = \`hsl(\${hue}, 90%, 60%)\`;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.roundRect(x+2, y+2, CELL_SIZE-4, CELL_SIZE-4, 6);
                ctx.fill();
            }
            ctx.shadowBlur = 0;

            // 眼睛
            if (snake.length > 0) {
                const head = snake[0];
                const hx = head.x * CELL_SIZE + CELL_SIZE/2;
                const hy = head.y * CELL_SIZE + CELL_SIZE/2;
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(hx - 4, hy - 4, 4, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(hx + 4, hy - 4, 4, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = '#0b0e1a';
                ctx.beginPath();
                ctx.arc(hx - 4 + direction.x*1.5, hy - 4 + direction.y*1.5, 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(hx + 4 + direction.x*1.5, hy - 4 + direction.y*1.5, 2, 0, 2 * Math.PI);
                ctx.fill();
            }

            // 粒子
            for (const p of particles) {
                const alpha = Math.max(0, p.life / p.maxLife);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            ctx.restore();
        }

        // 初始显示开始界面
        function showStart() {
            gameActive = false;
            gameOver = true;
            // 重置蛇
            snake = [{x:7,y:10},{x:6,y:10},{x:5,y:10}];
            direction = {x:1,y:0};
            nextDirection = {x:1,y:0};
            score = 0;
            updateScoreUI();
            spawnFood();
            drawCanvas();
            overlay.style.display = 'block';
            overlay.innerHTML = \`
                <h1>🐍 幻彩贪吃蛇</h1>
                <p style="font-size:18px;">吃食物 · 别撞墙</p>
                <div class="big-score">最高分 \${highScore}</div>
                <button class="btn" id="startBtn">▶ 开始游戏</button>
                <div class="controls-hint">WASD / 方向键移动 · 空格暂停</div>
            \`;
            const startBtn = document.getElementById('startBtn');
            if (startBtn) startBtn.addEventListener('click', () => {
                initAudio(); clickSound();
                resetGame();
            });
        }

        // 辅助 roundRect
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.moveTo(x + r, y);
            this.lineTo(x + w - r, y);
            this.quadraticCurveTo(x + w, y, x + w, y + r);
            this.lineTo(x + w, y + h - r);
            this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            this.lineTo(x + r, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r);
            this.lineTo(x, y + r);
            this.quadraticCurveTo(x, y, x + r, y);
            return this;
        };

        // 事件绑定
        window.addEventListener('keydown', handleKey);

        // 启动
        showStart();
        requestAnimationFrame(gameLoop);
    })();
</script>
</body>
</html>`
  },
  {
    title: '打砖块',
    category: 'action',
    description: '打砖块游戏，控制挡板反弹小球打碎所有砖块',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>打砖块 · 粒子突破</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; user-select: none; }
        body {
            background: linear-gradient(145deg, #0b1020, #1a1a2e);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            touch-action: none;
        }
        #gameContainer {
            background: #1e2a3a;
            border-radius: 28px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(255,255,255,0.1);
            padding: 16px;
            width: min(96vw, 900px);
            aspect-ratio: 16 / 11;
            position: relative;
        }
        canvas {
            width: 100%;
            height: 100%;
            display: block;
            border-radius: 18px;
            background: #0f172a;
            box-shadow: inset 0 0 30px rgba(0,0,0,0.7);
            cursor: none;
            touch-action: none;
        }
        /* 移动端虚拟按钮 */
        #touchControls {
            position: absolute;
            bottom: 12px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
            pointer-events: none;
            opacity: 0.6;
        }
        .ctrl-btn {
            width: 64px;
            height: 64px;
            background: rgba(255,255,255,0.12);
            border-radius: 40px;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255,255,255,0.25);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 32px;
            color: white;
            pointer-events: auto;
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
        }
        .ctrl-btn:active { background: rgba(255,255,255,0.3); }
        #leftBtn { margin-right: auto; }
        #rightBtn { margin-left: auto; }
        @media (hover: hover) and (pointer: fine) {
            #touchControls { display: none; }
        }
    </style>
</head>
<body>
<div id="gameContainer">
    <canvas id="gameCanvas" width="864" height="594"></canvas>
    <div id="touchControls">
        <div class="ctrl-btn" id="leftBtn">◀</div>
        <div class="ctrl-btn" id="rightBtn">▶</div>
    </div>
</div>

<script>
    (function() {
        // ---------- 设置 ----------
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const W = 864, H = 594;
        canvas.width = W; canvas.height = H;

        // ---------- 音频系统 (Web Audio) ----------
        let audioCtx;
        function initAudio() {
            if (!audioCtx) {
                try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { audioCtx = null; }
            }
        }
        function playTone(freq, duration, type='square', vol=0.2, slideTo=null) {
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
            gain.gain.setValueAtTime(vol, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + duration);
        }
        // 音效封装
        const sfx = {
            paddle: () => playTone(180, 0.08, 'triangle', 0.25, 220),
            brick: () => playTone(520, 0.1, 'square', 0.2, 180),
            die: () => playTone(300, 0.3, 'sawtooth', 0.25, 50),
            power: () => playTone(900, 0.15, 'sine', 0.3, 1400),
            win: () => { playTone(660, 0.2, 'sine', 0.3, 990); setTimeout(()=>playTone(880,0.3,'sine',0.3),150); },
            click: () => playTone(700, 0.05, 'triangle', 0.15)
        };

        // ---------- 游戏状态 ----------
        let state = 'menu'; // menu, play, pause, gameover, levelclear
        let score = 0, highScore = 0, lives = 3;
        let level = 1;
        let paddle = { x: W/2, y: H-40, w: 110, h: 14, vx: 0 };
        let balls = [];
        let bricks = [];
        let particles = [];
        let powerups = [];
        let keys = { left: false, right: false };
        let mouseX = null;
        let lastTime = performance.now();
        let shake = 0;
        let gameTime = 0;
        let paddleWidthBase = 110;
        let paused = false;

        // 读取最高分
        try { highScore = parseInt(localStorage.getItem('brick_breaker_high') || '0') || 0; } catch(e) { highScore = 0; }

        // ---------- 砖块配置 ----------
        const BRICK_COLS = 10, BRICK_ROWS = 6;
        const BRICK_W = 72, BRICK_H = 26, BRICK_GAP = 6;
        const BRICK_TOP = 50;

        // 颜色 / 分数 / 耐久
        const BRICK_TYPES = [
            { color: '#f87171', score: 50, hp: 1 },   // 红
            { color: '#fb923c', score: 60, hp: 1 },   // 橙
            { color: '#facc15', score: 70, hp: 1 },   // 黄
            { color: '#4ade80', score: 80, hp: 2 },   // 绿 (2命)
            { color: '#60a5fa', score: 100, hp: 2 },  // 蓝
            { color: '#c084fc', score: 120, hp: 3 }   // 紫 (3命)
        ];

        function generateBricks() {
            bricks = [];
            for (let r = 0; r < BRICK_ROWS; r++) {
                for (let c = 0; c < BRICK_COLS; c++) {
                    // 难度递增：越往下越强
                    let typeIdx = Math.floor((r + level * 0.6) % BRICK_TYPES.length);
                    if (r === 0) typeIdx = 0;
                    else if (r === 1) typeIdx = 1;
                    else if (r === 2) typeIdx = 2;
                    else typeIdx = Math.min(5, typeIdx + Math.floor(level/2));
                    const t = BRICK_TYPES[typeIdx];
                    bricks.push({
                        x: 60 + c * (BRICK_W + BRICK_GAP),
                        y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
                        w: BRICK_W, h: BRICK_H,
                        hp: t.hp,
                        maxHp: t.hp,
                        color: t.color,
                        score: t.score,
                        typeIdx
                    });
                }
            }
        }

        // ---------- 初始化球 ----------
        function spawnBall(x = paddle.x, y = paddle.y - 12, vx = 2.5, vy = -4.5) {
            balls.push({ x, y, r: 7, vx, vy });
        }

        function resetBall() {
            balls = [];
            spawnBall(paddle.x, paddle.y-12, 2.5, -4.5);
        }

        // ---------- 道具 ----------
        const POWER_TYPES = ['expand', 'multi', 'slow'];
        function spawnPowerup(x, y) {
            const type = POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)];
            powerups.push({ x, y, vy: 2.2, w: 24, h: 14, type, active: true });
        }

        // ---------- 粒子 ----------
        function spawnBrickParticles(bx, by, color) {
            for (let i=0; i<14; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2.5 + Math.random() * 4;
                particles.push({
                    x: bx + Math.random() * BRICK_W,
                    y: by + Math.random() * BRICK_H,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    size: 3 + Math.random() * 4,
                    color: color,
                    life: 1.0,
                    decay: 0.02 + Math.random()*0.02
                });
            }
        }

        // ---------- 碰撞检测 (矩形vs圆) ----------
        function circleRectCollision(cx, cy, r, rect) {
            const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
            const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
            const dx = cx - closestX, dy = cy - closestY;
            return (dx*dx + dy*dy) < r*r;
        }

        // ---------- 更新 ----------
        function update(dt) {
            gameTime += dt;
            // 难度随时间递增 (每30秒增加小球速度)
            const speedFactor = 1 + gameTime * 0.004;

            // 挡板移动 (键盘/鼠标)
            const paddleSpeed = 0.7;
            if (keys.left) paddle.vx = -paddleSpeed;
            else if (keys.right) paddle.vx = paddleSpeed;
            else paddle.vx *= 0.7; // 惯性

            if (mouseX !== null) {
                const target = mouseX - paddle.w/2;
                const diff = target - paddle.x;
                paddle.vx = diff * 0.15;
            }
            paddle.x += paddle.vx * dt * 60;
            paddle.x = Math.max(4, Math.min(W - paddle.w - 4, paddle.x));

            // 球移动
            for (let i=balls.length-1; i>=0; i--) {
                const b = balls[i];
                b.x += b.vx * dt * 60 * speedFactor;
                b.y += b.vy * dt * 60 * speedFactor;

                // 墙壁
                if (b.x < b.r) { b.x = b.r; b.vx *= -1; sfx.paddle(); }
                if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -1; sfx.paddle(); }
                if (b.y < b.r) { b.y = b.r; b.vy *= -1; sfx.paddle(); }

                // 底部
                if (b.y > H + 30) {
                    balls.splice(i, 1);
                    if (balls.length === 0) {
                        lives--;
                        shake = 8;
                        sfx.die();
                        if (lives <= 0) {
                            state = 'gameover';
                            if (score > highScore) { highScore = score; localStorage.setItem('brick_breaker_high', highScore); }
                        } else {
                            resetBall();
                        }
                    }
                    continue;
                }

                // 挡板碰撞
                const padRect = { x: paddle.x, y: paddle.y, w: paddle.w, h: paddle.h };
                if (circleRectCollision(b.x, b.y, b.r, padRect) && b.vy > 0) {
                    b.vy = -Math.abs(b.vy) - 0.2;
                    // 按撞击位置改变角度
                    const rel = (b.x - (paddle.x + paddle.w/2)) / (paddle.w/2);
                    b.vx = rel * 5.5;
                    sfx.paddle();
                    shake = Math.min(6, shake + 1);
                }

                // 砖块碰撞
                for (let j=bricks.length-1; j>=0; j--) {
                    const br = bricks[j];
                    if (circleRectCollision(b.x, b.y, b.r, br)) {
                        // 判断碰壁方向
                        const overlapLeft = b.x + b.r - br.x;
                        const overlapRight = br.x + br.w - (b.x - b.r);
                        const overlapTop = b.y + b.r - br.y;
                        const overlapBottom = br.y + br.h - (b.y - b.r);
                        const minX = Math.min(overlapLeft, overlapRight);
                        const minY = Math.min(overlapTop, overlapBottom);
                        if (minX < minY) { b.vx *= -1; } else { b.vy *= -1; }

                        br.hp--;
                        score += br.score;
                        sfx.brick();
                        shake = Math.min(8, shake + 2);
                        spawnBrickParticles(br.x, br.y, br.color);
                        if (br.hp <= 0) {
                            // 道具掉落 (20%概率)
                            if (Math.random() < 0.2) spawnPowerup(br.x + br.w/2, br.y + br.h/2);
                            bricks.splice(j, 1);
                        } else {
                            // 颜色变浅
                            br.color = '#9ca3af';
                        }
                        // 球反弹后避免多次碰撞
                        break;
                    }
                }
            }

            // 粒子更新
            for (let i=particles.length-1; i>=0; i--) {
                const p = particles[i];
                p.x += p.vx * dt * 60;
                p.y += p.vy * dt * 60;
                p.vy += 0.1;
                p.life -= p.decay;
                if (p.life <= 0) particles.splice(i, 1);
            }

            // 道具更新
            for (let i=powerups.length-1; i>=0; i--) {
                const pw = powerups[i];
                pw.y += pw.vy * dt * 60;
                if (pw.y > H + 30) { powerups.splice(i, 1); continue; }
                // 挡板拾取
                if (pw.x > paddle.x && pw.x < paddle.x + paddle.w && pw.y > paddle.y && pw.y < paddle.y + paddle.h) {
                    sfx.power();
                    if (pw.type === 'expand') {
                        paddle.w = Math.min(180, paddle.w + 30);
                    } else if (pw.type === 'multi') {
                        // 增加两个球
                        if (balls.length < 8) {
                            for (let k=0; k<2; k++) {
                                const base = balls[0] || {x: paddle.x, y: paddle.y-10, vx:1, vy:-4};
                                spawnBall(base.x + (Math.random()*20-10), base.y, -2 + Math.random()*4, -4 - Math.random()*2);
                            }
                        }
                    } else if (pw.type === 'slow') {
                        balls.forEach(b => { b.vx *= 0.75; b.vy *= 0.75; });
                    }
                    powerups.splice(i, 1);
                }
            }

            // 通关检测
            if (bricks.length === 0 && state === 'play') {
                state = 'levelclear';
                sfx.win();
                if (score > highScore) { highScore = score; localStorage.setItem('brick_breaker_high', highScore); }
            }
        }

        // ---------- 渲染 ----------
        function draw() {
            ctx.clearRect(0,0,W,H);
            // 渐变背景
            const grad = ctx.createLinearGradient(0,0,0,H);
            grad.addColorStop(0, '#0f172a');
            grad.addColorStop(1, '#1e293b');
            ctx.fillStyle = grad;
            ctx.fillRect(0,0,W,H);

            // 屏幕震动
            if (shake > 0.2) {
                ctx.save();
                ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake);
                shake *= 0.85;
            }

            // 砖块
            bricks.forEach(br => {
                ctx.fillStyle = br.color;
                ctx.shadowColor = br.color;
                ctx.shadowBlur = 10;
                ctx.fillRect(br.x, br.y, br.w, br.h);
                ctx.shadowBlur = 0;
                // 高光
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(br.x, br.y, br.w, br.h/3);
            });

            // 粒子
            particles.forEach(p => {
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            // 道具
            powerups.forEach(pw => {
                ctx.fillStyle = pw.type === 'expand' ? '#4ade80' : (pw.type === 'multi' ? '#facc15' : '#60a5fa');
                ctx.shadowBlur = 14; ctx.shadowColor = '#fff';
                ctx.fillRect(pw.x - pw.w/2, pw.y - pw.h/2, pw.w, pw.h);
                ctx.shadowBlur = 0;
                ctx.font = 'bold 12px sans-serif';
                ctx.fillStyle = '#0f172a';
                ctx.textAlign = 'center';
                ctx.fillText(pw.type==='expand'?'扩':(pw.type==='multi'?'多':'减'), pw.x, pw.y+4);
            });

            // 球
            balls.forEach(b => {
                ctx.shadowColor = '#fff'; ctx.shadowBlur = 18;
                ctx.fillStyle = '#fde047';
                ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
            });

            // 挡板
            ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 20;
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 8);
            ctx.fill();
            ctx.shadowBlur = 0;

            // UI 文字
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(\`分数: \${score}\`, 20, 30);
            ctx.textAlign = 'right';
            ctx.fillText(\`最高: \${highScore}\`, W-20, 30);
            ctx.textAlign = 'center';
            ctx.font = '16px sans-serif';
            ctx.fillText(\`生命: \${'❤️'.repeat(Math.max(0,lives))}  关卡: \${level}\`, W/2, 30);

            // 操作提示
            ctx.font = '12px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.textAlign = 'center';
            ctx.fillText('WASD/鼠标 移动 · P 暂停', W/2, H-10);

            // 状态界面
            if (state === 'menu' || state === 'gameover' || state === 'levelclear' || state === 'pause') {
                ctx.fillStyle = 'rgba(15,23,42,0.75)';
                ctx.fillRect(0,0,W,H);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 48px sans-serif';
                ctx.textAlign = 'center';
                if (state === 'menu') {
                    ctx.fillText('🧱 打砖块', W/2, 200);
                    ctx.font = '26px sans-serif';
                    ctx.fillText('开始游戏', W/2, 310);
                    ctx.fillText('(点击开始)', W/2, 350);
                } else if (state === 'gameover') {
                    ctx.font = 'bold 44px sans-serif';
                    ctx.fillText('游戏结束', W/2, 200);
                    ctx.font = '28px sans-serif';
                    ctx.fillText(\`得分: \${score}  最高: \${highScore}\`, W/2, 280);
                    ctx.fillText('点击重新开始', W/2, 380);
                } else if (state === 'levelclear') {
                    ctx.font = 'bold 44px sans-serif';
                    ctx.fillText('🎉 关卡通过!', W/2, 200);
                    ctx.font = '28px sans-serif';
                    ctx.fillText(\`得分: \${score}\`, W/2, 280);
                    ctx.fillText('点击进入下一关', W/2, 360);
                } else if (state === 'pause') {
                    ctx.font = 'bold 44px sans-serif';
                    ctx.fillText('⏸ 已暂停', W/2, 260);
                    ctx.fillText('点击继续', W/2, 340);
                }
            }
            if (shake > 0.2) ctx.restore();
        }

        // ---------- 游戏控制 ----------
        function startGame(continueLevel = false) {
            initAudio();
            if (!continueLevel) {
                score = 0; lives = 3; level = 1; gameTime = 0;
            }
            paddle.w = paddleWidthBase;
            paddle.x = W/2 - paddle.w/2;
            generateBricks();
            resetBall();
            powerups = [];
            particles = [];
            state = 'play';
            paused = false;
            sfx.click();
        }

        function nextLevel() {
            level++;
            startGame(true);
        }

        // ---------- 事件 ----------
        // 鼠标
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = W / rect.width;
            mouseX = (e.clientX - rect.left) * scaleX;
        });
        canvas.addEventListener('mouseleave', () => { mouseX = null; });

        // 键盘
        window.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (state === 'play') { state = 'pause'; sfx.click(); }
                else if (state === 'pause') { state = 'play'; sfx.click(); }
                return;
            }
            if (state !== 'play') return;
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = true;
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = true;
            if (e.key === ' ') e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = false;
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = false;
        });

        // 点击/触摸
        canvas.addEventListener('click', (e) => {
            initAudio();
            if (state === 'menu') startGame();
            else if (state === 'gameover') { startGame(); }
            else if (state === 'levelclear') { nextLevel(); }
            else if (state === 'pause') { state = 'play'; sfx.click(); }
        });

        // 移动端按钮
        document.getElementById('leftBtn').addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; });
        document.getElementById('leftBtn').addEventListener('touchend', () => { keys.left = false; });
        document.getElementById('rightBtn').addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
        document.getElementById('rightBtn').addEventListener('touchend', () => { keys.right = false; });

        // ---------- 主循环 ----------
        function loop(now) {
            const dt = Math.min(0.03, (now - lastTime) / 1000) || 0.016;
            lastTime = now;
            if (state === 'play') update(dt);
            draw();
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);

        // Canvas roundRect helper
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.moveTo(x + r, y);
            this.lineTo(x + w - r, y);
            this.quadraticCurveTo(x + w, y, x + w, y + r);
            this.lineTo(x + w, y + h - r);
            this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            this.lineTo(x + r, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r);
            this.lineTo(x, y + r);
            this.quadraticCurveTo(x, y, x + r, y);
            return this;
        };

        // 初始显示菜单
        state = 'menu';
        generateBricks();
    })();
</script>
</body>
</html>`
  },
  {
    title: '飞机大战',
    category: 'shooting',
    description: '竖版飞机射击游戏，玩家飞机在底部，敌人从上方下来',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>星际猎鹰 · 飞机射击</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; user-select: none; }
        body {
            background: #0a0f1e;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: 'Segoe UI', system-ui, sans-serif;
            touch-action: none;
            overflow: hidden;
        }
        #gameWrap {
            position: relative;
            width: min(100vw, 420px);
            aspect-ratio: 9/16;
            background: #000;
            border-radius: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.7);
            overflow: hidden;
            border: 1px solid #2a3a5a;
        }
        canvas {
            display: block;
            width: 100%;
            height: 100%;
            background: transparent;
            position: absolute;
            top: 0;
            left: 0;
        }
        /* 移动端虚拟摇杆/按钮 (通过canvas绘制，这里仅占位) */
        .mobile-tip {
            position: absolute;
            bottom: 10px;
            left: 0;
            right: 0;
            text-align: center;
            color: rgba(255,255,255,0.4);
            font-size: 11px;
            font-weight: 500;
            pointer-events: none;
            text-shadow: 0 2px 8px #000;
            z-index: 5;
        }
        /* 隐藏原生滚动 */
        .no-scroll { overscroll-behavior: none; }
    </style>
</head>
<body>
<div id="gameWrap">
    <canvas id="gameCanvas"></canvas>
    <div class="mobile-tip" id="mobileTip">◀ ▶ 移动 | 点击射击/炸弹</div>
</div>
<script>
    (function(){
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const wrapper = document.getElementById('gameWrap');

        // 尺寸自适应
        let W, H;
        function resizeCanvas() {
            const rect = wrapper.getBoundingClientRect();
            W = rect.width;
            H = rect.height;
            canvas.width = W * window.devicePixelRatio || W;
            canvas.height = H * window.devicePixelRatio || H;
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(1,0,0,1,0,0);
            ctx.scale(canvas.width/W, canvas.height/H);
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // ========== 音频系统 ==========
        let audioCtx = null;
        function initAudio() {
            if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        function playTone(freq, dur, type='square', vol=0.15, slideTo=null) {
            if(!audioCtx) initAudio();
            if(!audioCtx) return;
            const t = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            if(slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t+dur);
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t+dur);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t+dur+0.02);
        }
        // 各种音效
        const Sfx = {
            shoot: ()=> playTone(880, 0.08, 'triangle', 0.12, 220),
            hit: ()=> playTone(220, 0.15, 'sawtooth', 0.15, 60),
            explode: ()=> { playTone(160, 0.3, 'sawtooth', 0.2, 40); playTone(90, 0.4, 'square', 0.1, 30); },
            powerup: ()=> { playTone(500, 0.15, 'sine', 0.2, 900); playTone(900, 0.2, 'sine', 0.15, 1400); },
            click: ()=> playTone(600, 0.05, 'square', 0.1, 400),
            boss: ()=> playTone(80, 0.6, 'sawtooth', 0.2, 40)
        };

        // ========== 游戏状态 ==========
        let gameState = 'menu'; // menu, playing, paused, gameover
        let score = 0;
        let highScore = parseInt(localStorage.getItem('hs_astral'))) || 0;
        let lastTime = 0;
        let deltaTime = 0;
        let timeScale = 1;

        // 玩家
        let player = { x: W/2, y: H-80, r: 15, speed: 280, lives: 3, shield: 0, fireRate: 0.2, fireCd: 0, power: 1, invincible: 0 };

        // 子弹、敌人、粒子、道具
        let bullets = [], enemies = [], particles = [], powerups = [], stars = [];
        let screenShake = 0, bombActive = false;

        // 输入
        let keys = {};
        let touch = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
        let virtualShoot = false; // 触摸点击发射

        // 难度
        let spawnTimer = 0, bossSpawned = false, gameTime = 0;

        // 初始化星空
        function initStars() {
            stars = [];
            for(let i=0; i<80; i++) {
                stars.push({
                    x: Math.random()*W,
                    y: Math.random()*H,
                    speed: 0.5 + Math.random()*2,
                    size: Math.random()*2.5 + 0.5,
                    brightness: Math.random()*0.8 + 0.2
                });
            }
        }
        initStars();

        // 重置游戏
        function resetGame() {
            player = { x: W/2, y: H-80, r: 15, speed: 280, lives: 3, shield: 0, fireRate: 0.2, fireCd: 0, power: 1, invincible: 1 };
            bullets = [];
            enemies = [];
            particles = [];
            powerups = [];
            score = 0;
            spawnTimer = 0;
            bossSpawned = false;
            gameTime = 0;
            screenShake = 0;
            bombActive = false;
        }

        // ========== 粒子 ==========
        function createExplosion(x, y, color='#ffa050', count=16, speed=200) {
            for(let i=0; i<count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = speed * (0.5 + Math.random()*0.8);
                particles.push({
                    x, y,
                    vx: Math.cos(angle)*spd,
                    vy: Math.sin(angle)*spd,
                    life: 0.6 + Math.random()*0.4,
                    size: Math.random()*5 + 2,
                    color: color,
                    maxLife: 1
                });
            }
        }
        function createPowerupSpark(x, y) {
            for(let i=0; i<10; i++) {
                const angle = Math.random() * Math.PI * 2;
                particles.push({
                    x, y,
                    vx: Math.cos(angle)*100,
                    vy: Math.sin(angle)*100,
                    life: 0.4,
                    size: 3,
                    color: '#4afcff',
                    maxLife: 0.4
                });
            }
        }

        // ========== 道具生成 ==========
        function spawnPowerup(x, y) {
            if(Math.random() < 0.3) return;
            const r = Math.random();
            let type = 'power';
            if(r < 0.2) type = 'shield';
            else if(r < 0.35) type = 'bomb';
            powerups.push({
                x, y, type, r: 14,
                vx: (Math.random()-0.5)*30,
                vy: 50 + Math.random()*30,
                life: 5.0
            });
        }

        // ========== 敌人生成 ==========
        function spawnEnemy() {
            const diff = Math.min(1, gameTime/90); // 难度因子
            const rand = Math.random();
            let type = 'normal';
            if(rand < 0.15 + diff*0.1) type = 'fast';
            else if(rand < 0.22 + diff*0.15) type = 'boss';
            
            const x = Math.random() * (W-40) + 20;
            if(type === 'boss') {
                if(bossSpawned) return;
                bossSpawned = true;
                enemies.push({
                    x: W/2, y: -60, w: 70, h: 50, r: 20, type: 'boss',
                    hp: 18 + Math.floor(diff*12),
                    maxHp: 18 + Math.floor(diff*12),
                    speed: 30,
                    vx: (Math.random()>0.5?1:-1)*30,
                    fireRate: 1.2, fireCd: 0,
                    score: 100,
                    color: '#ff4455'
                });
                Sfx.boss();
            } else if(type === 'fast') {
                enemies.push({
                    x, y: -30, w: 28, h: 28, r: 14, type: 'fast',
                    hp: 1, speed: 180 + diff*40,
                    vx: (Math.random()-0.5)*60,
                    score: 15,
                    color: '#ffcc33'
                });
            } else {
                enemies.push({
                    x, y: -30, w: 34, h: 34, r: 17, type: 'normal',
                    hp: 2 + (Math.random()<diff*0.5?1:0), speed: 90 + diff*50,
                    vx: (Math.random()-0.5)*30,
                    score: 10,
                    color: '#ff7043'
                });
            }
        }

        // ========== 更新逻辑 ==========
        function update(dt) {
            if(gameState !== 'playing') return;
            gameTime += dt;
            // 难度递增：加快生成频率
            const spawnRate = Math.max(0.2, 1.0 - gameTime*0.004);
            spawnTimer -= dt;
            if(spawnTimer <= 0) {
                spawnEnemy();
                spawnTimer = spawnRate * (Math.random()*0.5+0.7);
            }

            // 玩家移动
            let dx = 0, dy = 0;
            // 键盘
            if(keys['a']||keys['arrowleft']) dx -= 1;
            if(keys['d']||keys['arrowright']) dx += 1;
            if(keys['w']||keys['arrowup']) dy -= 1;
            if(keys['s']||keys['arrowdown']) dy += 1;
            // 触摸
            if(touch.active) {
                const offX = touch.currentX - touch.startX;
                const offY = touch.currentY - touch.startY;
                dx = offX / 30;
                dy = offY / 30;
                // 限幅
                dx = Math.max(-1, Math.min(1, dx));
                dy = Math.max(-1, Math.min(1, dy));
            }
            if(dx !== 0 || dy !== 0) {
                const len = Math.hypot(dx, dy);
                dx = dx/len; dy = dy/len;
                player.x += dx * player.speed * dt;
                player.y += dy * player.speed * dt;
                player.x = Math.max(20, Math.min(W-20, player.x));
                player.y = Math.max(20, Math.min(H-20, player.y));
            }

            // 射击
            player.fireCd -= dt;
            if((keys[' '] || virtualShoot || touch.active) && player.fireCd <= 0) {
                player.fireCd = player.fireRate;
                const bulletCount = player.power;
                for(let i=0; i<bulletCount; i++) {
                    const offset = (i - (bulletCount-1)/2) * 12;
                    bullets.push({
                        x: player.x + offset,
                        y: player.y - 15,
                        vx: 0, vy: -700,
                        r: 4, friendly: true
                    });
                }
                Sfx.shoot();
                // 枪口粒子
                createExplosion(player.x, player.y-20, '#b0e0ff', 2, 60);
            }

            // 更新子弹
            for(let i=bullets.length-1; i>=0; i--) {
                const b = bullets[i];
                b.x += b.vx * dt;
                b.y += b.vy * dt;
                if(b.y < -20 || b.y > H+20 || b.x < -20 || b.x > W+20) {
                    bullets.splice(i,1);
                    continue;
                }
                // 敌人碰撞
                for(let j=enemies.length-1; j>=0; j--) {
                    const e = enemies[j];
                    const dist = Math.hypot(b.x - e.x, b.y - e.y);
                    if(dist < e.r + b.r) {
                        e.hp -= 1;
                        bullets.splice(i,1);
                        createExplosion(b.x, b.y, '#aaf0ff', 5, 120);
                        Sfx.hit();
                        if(e.hp <= 0) {
                            score += e.score;
                            createExplosion(e.x, e.y, e.color, 20, 220);
                            Sfx.explode();
                            // 掉落道具
                            if(e.type !== 'boss' && Math.random()<0.25) spawnPowerup(e.x, e.y);
                            if(e.type === 'boss') { score += 50; spawnPowerup(e.x, e.y); spawnPowerup(e.x, e.y); }
                            enemies.splice(j,1);
                        }
                        break;
                    }
                }
            }

            // 更新敌人
            for(let i=enemies.length-1; i>=0; i--) {
                const e = enemies[i];
                e.y += e.speed * dt;
                e.x += e.vx * dt;
                if(e.type === 'boss') {
                    e.vx = Math.sin(gameTime*2)*40;
                    if(e.y < 100) e.y += 30*dt;
                    // 发射子弹 (简单)
                    if(e.fireCd <= 0) {
                        e.fireCd = 1.5;
                        const b = {x: e.x, y: e.y+20, vx: 0, vy: 300, r: 5, friendly: false};
                        bullets.push(b);
                        Sfx.shoot();
                    }
                    e.fireCd -= dt;
                } else {
                    if(e.x < 20 || e.x > W-20) e.vx *= -1;
                }
                if(e.y > H+60) {
                    enemies.splice(i,1);
                }
            }

            // 玩家与敌人碰撞
            if(player.invincible > 0) player.invincible -= dt;
            for(let i=enemies.length-1; i>=0; i--) {
                const e = enemies[i];
                const dist = Math.hypot(player.x - e.x, player.y - e.y);
                if(dist < e.r + player.r) {
                    // 伤害
                    if(player.shield > 0) {
                        player.shield--;
                        createExplosion(player.x, player.y, '#6cf', 10, 150);
                        Sfx.powerup();
                    } else if(player.invincible <= 0) {
                        player.lives--;
                        player.invincible = 1.5;
                        screenShake = 0.5;
                        createExplosion(player.x, player.y, '#ff5555', 20, 200);
                        Sfx.explode();
                        if(player.lives <= 0) {
                            gameOver();
                            return;
                        }
                    }
                    enemies.splice(i,1);
                    continue;
                }
            }

            // 道具更新
            for(let i=powerups.length-1; i>=0; i--) {
                const p = powerups[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                if(dist(p, player) < p.r + player.r) {
                    if(p.type === 'power') {
                        player.power = Math.min(4, player.power+1);
                        Sfx.powerup();
                    } else if(p.type === 'shield') {
                        player.shield = Math.min(3, player.shield+1);
                        Sfx.powerup();
                    } else if(p.type === 'bomb') {
                        // 炸弹：清屏
                        for(let j=enemies.length-1; j>=0; j--) {
                            createExplosion(enemies[j].x, enemies[j].y, '#ffaa33', 20, 250);
                            score += enemies[j].score;
                            enemies.splice(j,1);
                        }
                        bombActive = true;
                        Sfx.explode();
                        screenShake = 0.4;
                    }
                    createPowerupSpark(p.x, p.y);
                    powerups.splice(i,1);
                    continue;
                }
                if(p.y > H+30) powerups.splice(i,1);
            }

            // 粒子更新
            for(let i=particles.length-1; i>=0; i--) {
                const p = particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.98;
                p.vy *= 0.98;
                p.life -= dt;
                if(p.life <= 0) particles.splice(i,1);
            }

            // 屏幕震动衰减
            if(screenShake > 0) screenShake = Math.max(0, screenShake - dt*1.5);

            // 更新最高分
            if(score > highScore) {
                highScore = score;
                localStorage.setItem('hs_astral', highScore);
            }
        }

        function dist(a,b) { return Math.hypot(a.x-b.x, a.y-b.y); }

        function gameOver() {
            gameState = 'gameover';
            localStorage.setItem('hs_astral', highScore);
            createExplosion(player.x, player.y, '#ff8888', 30, 300);
        }

        // ========== 渲染 ==========
        function render() {
            ctx.save();
            // 背景渐变
            const grad = ctx.createLinearGradient(0,0,0,H);
            grad.addColorStop(0, '#0b1020');
            grad.addColorStop(0.7, '#141d38');
            grad.addColorStop(1, '#1a2a44');
            ctx.fillStyle = grad;
            ctx.fillRect(0,0,W,H);

            // 星空
            ctx.fillStyle = '#ffffff';
            for(const s of stars) {
                s.y += s.speed * deltaTime * 1.2;
                if(s.y > H) { s.y = -5; s.x = Math.random()*W; }
                ctx.globalAlpha = s.brightness;
                ctx.fillRect(s.x, s.y, s.size, s.size);
            }
            ctx.globalAlpha = 1;

            // 屏幕震动
            if(screenShake > 0) {
                const shakeX = (Math.random()-0.5)*screenShake*10;
                const shakeY = (Math.random()-0.5)*screenShake*10;
                ctx.translate(shakeX, shakeY);
            }

            // 绘制道具
            for(const p of powerups) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
                ctx.fillStyle = p.type === 'power' ? '#4afcff' : (p.type==='shield'?'#ffd966':'#ff7b4a');
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#111';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.type==='power'?'P':(p.type==='shield'?'S':'B'), p.x, p.y);
            }

            // 子弹
            for(const b of bullets) {
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
                ctx.fillStyle = b.friendly ? '#6ef7ff' : '#ff5555';
                ctx.shadowColor = b.friendly ? '#6ef7ff' : '#ff5555';
                ctx.shadowBlur = 8;
                ctx.fill();
            }
            ctx.shadowBlur = 0;

            // 敌人
            for(const e of enemies) {
                ctx.save();
                ctx.translate(e.x, e.y);
                if(e.type === 'boss') {
                    ctx.fillStyle = '#ff4455';
                    ctx.shadowColor = '#ff0044';
                    ctx.shadowBlur = 20;
                    ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h);
                    // 血条
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#222';
                    ctx.fillRect(-e.w/2, -e.h/2-8, e.w, 4);
                    ctx.fillStyle = '#f44';
                    ctx.fillRect(-e.w/2, -e.h/2-8, e.w*(e.hp/e.maxHp), 4);
                } else {
                    ctx.fillStyle = e.color;
                    ctx.shadowColor = e.color;
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.arc(0,0,e.r,0,Math.PI*2);
                    ctx.fill();
                }
                ctx.restore();
            }

            // 玩家
            if(player.invincible > 0 && Math.floor(gameTime*8)%2===0) {
                // 闪烁无敌
            } else {
                ctx.save();
                ctx.translate(player.x, player.y);
                ctx.fillStyle = '#39d9ff';
                ctx.shadowColor = '#39d9ff';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.moveTo(0, -22);
                ctx.lineTo(18, 14);
                ctx.lineTo(0, 6);
                ctx.lineTo(-18, 14);
                ctx.closePath();
                ctx.fill();
                // 护盾
                if(player.shield > 0) {
                    ctx.strokeStyle = '#7dfcff';
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 14;
                    ctx.beginPath();
                    ctx.arc(0,0,28+Math.sin(gameTime*3)*2,0,Math.PI*2);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // 粒子
            for(const p of particles) {
                const alpha = Math.max(0, p.life / p.maxLife);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size*alpha, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;

            // UI文字
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px "Segoe UI"';
            ctx.textAlign = 'left';
            ctx.fillText(\`🛡️ \${player.lives}\`, 20, 40);
            ctx.textAlign = 'right';
            ctx.fillText(\`✦ \${score}\`, W-20, 40);
            ctx.font = '12px "Segoe UI"';
            ctx.fillStyle = '#aac';
            ctx.textAlign = 'center';
            ctx.fillText(\`MAX \${highScore}\`, W/2, 30);

            // 界面状态
            if(gameState === 'menu') {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(0,0,W,H);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 32px "Segoe UI"';
                ctx.textAlign = 'center';
                ctx.fillText('星际猎鹰', W/2, H*0.4);
                ctx.font = '18px sans-serif';
                ctx.fillText('WASD移动 · 空格射击', W/2, H*0.5);
                ctx.fillText('P/ESC暂停', W/2, H*0.55);
                ctx.fillStyle = '#7dfcff';
                ctx.beginPath();
                ctx.roundRect(W/2-70, H*0.62, 140, 46, 12);
                ctx.fill();
                ctx.fillStyle = '#001a22';
                ctx.font = 'bold 18px sans-serif';
                ctx.fillText('开始游戏', W/2, H*0.62+30);
            } else if(gameState === 'paused') {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0,0,W,H);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 26px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('已暂停', W/2, H*0.45);
                ctx.font = '16px sans-serif';
                ctx.fillText('按P继续', W/2, H*0.55);
            } else if(gameState === 'gameover') {
                ctx.fillStyle = 'rgba(10,10,30,0.7)';
                ctx.fillRect(0,0,W,H);
                ctx.fillStyle = '#ffccdd';
                ctx.font = 'bold 28px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('战机坠毁', W/2, H*0.4);
                ctx.font = '20px sans-serif';
                ctx.fillText(\`得分: \${score}  |  最高: \${highScore}\`, W/2, H*0.5);
                ctx.fillStyle = '#7dfcff';
                ctx.beginPath();
                ctx.roundRect(W/2-80, H*0.58, 160, 46, 12);
                ctx.fill();
                ctx.fillStyle = '#001a22';
                ctx.font = 'bold 18px sans-serif';
                ctx.fillText('再来一局', W/2, H*0.58+30);
            }
            ctx.restore();
        }

        // 辅助圆角矩形
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            this.beginPath();
            this.moveTo(x+r, y);
            this.arcTo(x+w, y, x+w, y+h, r);
            this.arcTo(x+w, y+h, x, y+h, r);
            this.arcTo(x, y+h, x, y, r);
            this.arcTo(x, y, x+w, y, r);
            this.closePath();
            return this;
        };

        // ========== 游戏循环 ==========
        function loop(t) {
            const dt = Math.min(0.05, (t - lastTime) / 1000 || 0.016);
            lastTime = t;
            deltaTime = dt;
            if(gameState === 'playing') update(dt);
            render();
            requestAnimationFrame(loop);
        }

        // ========== 输入事件 ==========
        window.addEventListener('keydown', (e) => {
            initAudio();
            keys[e.key.toLowerCase()] = true;
            if(e.key === ' ' || e.key === 'Space') e.preventDefault();
            if((e.key === 'p'||e.key==='P'||e.key==='Escape') && (gameState==='playing'||gameState==='paused')) {
                gameState = gameState==='playing'?'paused':'playing';
                Sfx.click();
            }
            if(e.key === 'Enter' && (gameState==='menu'||gameState==='gameover')) {
                startGame();
            }
        });
        window.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });

        // 触摸控制
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            initAudio();
            const rect = canvas.getBoundingClientRect();
            const touch0 = e.touches[0];
            const x = touch0.clientX - rect.left;
            const y = touch0.clientY - rect.top;
            if(gameState==='menu') {
                // 点击开始
                if(x>W/2-70 && x<W/2+70 && y>H*0.62 && y<H*0.62+46) startGame();
                return;
            }
            if(gameState==='gameover') {
                if(x>W/2-80 && x<W/2+80 && y>H*0.58 && y<H*0.58+46) startGame();
                return;
            }
            if(gameState==='playing' || gameState==='paused') {
                if(gameState==='paused') { gameState='playing'; Sfx.click(); return; }
                touch.active = true;
                touch.startX = x;
                touch.startY = y;
                touch.currentX = x;
                touch.currentY = y;
                virtualShoot = true;
            }
        }, {passive: false});

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if(!touch.active) return;
            const rect = canvas.getBoundingClientRect();
            const t = e.touches[0];
            touch.currentX = t.clientX - rect.left;
            touch.currentY = t.clientY - rect.top;
        }, {passive:false});

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            touch.active = false;
            virtualShoot = false;
        });

        // 鼠标点击(测试用)
        canvas.addEventListener('mousedown', (e) => {
            initAudio();
            if(gameState==='menu' || gameState==='gameover') return;
            touch.active = true;
            const rect = canvas.getBoundingClientRect();
            touch.startX = e.clientX-rect.left;
            touch.startY = e.clientY-rect.top;
            touch.currentX = touch.startX;
            touch.currentY = touch.startY;
            virtualShoot = true;
        });
        window.addEventListener('mouseup', () => {
            touch.active = false;
            virtualShoot = false;
        });

        function startGame() {
            resetGame();
            gameState = 'playing';
            Sfx.click();
        }

        // 初始状态
        gameState = 'menu';
        requestAnimationFrame(loop);
    })();
</script>
</body>
</html>`
  },
  {
    title: '2048',
    category: 'puzzle',
    description: '2048数字合并游戏，滑动方块合并相同数字',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>2048 合并</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        body {
            background: linear-gradient(145deg, #1a2a3a 0%, #0f1a26 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', 'PingFang SC', Roboto, sans-serif;
            touch-action: none;
        }
        #game-container {
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(8px);
            border-radius: 32px;
            padding: 24px 24px 32px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            width: 420px;
            max-width: 96vw;
            transition: all 0.3s;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            color: #ecf0f1;
        }
        .score-box {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 16px;
            padding: 10px 18px;
            backdrop-filter: blur(4px);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .score-box .label {
            font-size: 13px;
            opacity: 0.7;
            letter-spacing: 1px;
        }
        .score-box .value {
            font-size: 26px;
            font-weight: 700;
            line-height: 1.2;
            color: #fff;
            text-shadow: 0 2px 8px rgba(0,200,255,0.3);
        }
        .controls {
            display: flex;
            gap: 12px;
        }
        .ctrl-btn {
            background: rgba(255, 255, 255, 0.12);
            border: none;
            color: white;
            font-size: 20px;
            width: 48px;
            height: 48px;
            border-radius: 14px;
            cursor: pointer;
            transition: 0.15s;
            backdrop-filter: blur(4px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .ctrl-btn:hover {
            background: rgba(255,255,255,0.25);
            transform: scale(1.05);
        }
        .board-wrapper {
            position: relative;
            background: rgba(0, 0, 0, 0.25);
            border-radius: 20px;
            padding: 12px;
            box-shadow: inset 0 4px 12px rgba(0,0,0,0.4);
        }
        #board {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            aspect-ratio: 1/1;
            width: 100%;
        }
        .cell {
            background: rgba(255, 255, 255, 0.07);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: 700;
            color: white;
            transition: background 0.15s, transform 0.1s;
            box-shadow: inset 0 2px 6px rgba(0,0,0,0.2);
            text-shadow: 0 2px 6px rgba(0,0,0,0.4);
            position: relative;
            will-change: transform;
        }
        .tile-new {
            animation: popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .tile-merged {
            animation: mergePulse 0.3s ease-out;
        }
        @keyframes popIn {
            0% { transform: scale(0.2); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes mergePulse {
            0% { transform: scale(1.2); filter: brightness(1.6); }
            100% { transform: scale(1); filter: brightness(1); }
        }
        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(6px);
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            z-index: 10;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
            color: white;
            text-align: center;
        }
        .overlay.active {
            opacity: 1;
            pointer-events: auto;
        }
        .overlay h2 {
            font-size: 40px;
            font-weight: 800;
            text-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .overlay p {
            font-size: 18px;
            opacity: 0.9;
        }
        .overlay button {
            background: linear-gradient(145deg, #3a8cff, #1e5fb5);
            border: none;
            color: white;
            font-size: 18px;
            font-weight: 600;
            padding: 12px 36px;
            border-radius: 40px;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
            transition: 0.2s;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .overlay button:hover {
            transform: scale(1.06);
            box-shadow: 0 12px 26px rgba(0,0,0,0.4);
        }
        .hint {
            color: rgba(255, 255, 255, 0.5);
            font-size: 13px;
            margin-top: 16px;
            text-align: center;
            letter-spacing: 1px;
        }
        #particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
        }
        .shake {
            animation: shake 0.3s;
        }
        @keyframes shake {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(-6px, 4px); }
            75% { transform: translate(4px, -4px); }
        }
    </style>
</head>
<body>
    <canvas id="particles"></canvas>
    <div id="game-container">
        <div class="header">
            <div class="score-box">
                <div class="label">得分</div>
                <div class="value" id="scoreDisplay">0</div>
            </div>
            <div class="score-box">
                <div class="label">最高</div>
                <div class="value" id="bestDisplay">0</div>
            </div>
            <div class="controls">
                <button class="ctrl-btn" id="undoBtn" title="撤销">↩</button>
                <button class="ctrl-btn" id="pauseBtn" title="暂停">⏸️</button>
            </div>
        </div>
        <div class="board-wrapper" id="boardWrapper">
            <div id="board"></div>
            <!-- 开始界面 -->
            <div class="overlay active" id="startOverlay">
                <h2>2048</h2>
                <p>滑动合并方块</p>
                <button id="startBtn">开 始</button>
                <p style="font-size:14px; opacity:0.7;">WASD / 方向键 / 滑动</p>
            </div>
            <!-- 结束界面 -->
            <div class="overlay" id="endOverlay">
                <h2 id="endTitle">游戏结束</h2>
                <p id="endScore">得分: 0</p>
                <button id="restartBtn">再来一局</button>
            </div>
            <!-- 胜利界面 -->
            <div class="overlay" id="winOverlay">
                <h2>🎉 你赢啦! 🎉</h2>
                <p>达到2048</p>
                <button id="continueBtn">继续游戏</button>
            </div>
        </div>
        <div class="hint">
            <span>←↑↓→ / 滑动</span> · <span>P 暂停</span> · <span>↩ 撤销</span>
        </div>
    </div>

    <script>
        (function(){
            // ---------- 音频系统 (Web Audio) ----------
            let audioCtx;
            function initAudio() {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') audioCtx.resume();
            }
            function playTone(freq, duration, type='sine', gainVal=0.12) {
                if (!audioCtx) return;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = type;
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
                osc.connect(gain).connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + duration);
            }
            // 合并音效 (双音)
            function sfxMerge() {
                playTone(523, 0.12, 'triangle', 0.15);
                setTimeout(()=>playTone(784, 0.15, 'triangle', 0.12), 40);
            }
            // 移动音效
            function sfxMove() {
                playTone(210, 0.08, 'sine', 0.05);
            }
            // 游戏结束
            function sfxLose() {
                playTone(300, 0.3, 'sawtooth', 0.12);
                setTimeout(()=>playTone(200, 0.4, 'sawtooth', 0.1), 180);
            }
            // 点击
            function sfxClick() {
                playTone(700, 0.07, 'square', 0.04);
            }
            // 胜利
            function sfxWin() {
                [523, 659, 784, 1047].forEach((f,i)=>setTimeout(()=>playTone(f, 0.2, 'triangle', 0.12), i*120));
            }

            // ---------- 粒子特效 ----------
            const canvas = document.getElementById('particles');
            const ctx = canvas.getContext('2d');
            let particles = [];
            function resizeParticles() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            window.addEventListener('resize', resizeParticles);
            resizeParticles();
            function spawnParticles(x, y, color='#00d9ff', count=14) {
                for (let i=0; i<count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 5;
                    particles.push({
                        x, y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1,
                        decay: 0.015 + Math.random()*0.02,
                        size: 2 + Math.random()*6,
                        color
                    });
                }
            }
            function drawParticles() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let i=particles.length-1; i>=0; i--) {
                    const p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= p.decay;
                    if (p.life <= 0) { particles.splice(i,1); continue; }
                    ctx.globalAlpha = p.life * 0.8;
                    ctx.fillStyle = p.color;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
                requestAnimationFrame(drawParticles);
            }
            drawParticles();

            // ---------- 游戏状态 ----------
            const SIZE = 4;
            let board, score, best;
            let lastBoard, lastScore; // 用于撤销
            let gameOver = false, winAchieved = false, isPaused = false;
            let currentOverlay = 'start'; // start, end, win, none

            // 获取DOM
            const boardEl = document.getElementById('board');
            const scoreDisplay = document.getElementById('scoreDisplay');
            const bestDisplay = document.getElementById('bestDisplay');
            const startOverlay = document.getElementById('startOverlay');
            const endOverlay = document.getElementById('endOverlay');
            const winOverlay = document.getElementById('winOverlay');
            const endTitle = document.getElementById('endTitle');
            const endScore = document.getElementById('endScore');
            const wrapper = document.getElementById('boardWrapper');

            // 初始化最高分
            best = parseInt(localStorage.getItem('2048_best') || '0');
            bestDisplay.textContent = best;

            // 创建格子元素
            const cells = [];
            function createBoardUI() {
                boardEl.innerHTML = '';
                cells.length = 0;
                for (let i=0; i<SIZE*SIZE; i++) {
                    const div = document.createElement('div');
                    div.className = 'cell';
                    boardEl.appendChild(div);
                    cells.push(div);
                }
            }
            createBoardUI();

            // 颜色映射
            function getColor(value) {
                const map = {
                    0: 'rgba(255,255,255,0.07)',
                    2: '#3b6ea5',
                    4: '#2e8bc0',
                    8: '#1fa3c9',
                    16: '#1bb3c2',
                    32: '#17c0b0',
                    64: '#28c76f',
                    128: '#9fd356',
                    256: '#d3d93a',
                    512: '#e3b13c',
                    1024: '#e5812e',
                    2048: '#f34b1f',
                    4096: '#c72b7a'
                };
                return map[value] || '#6a5acd';
            }

            // 渲染板子
            function renderBoard() {
                for (let i=0; i<SIZE*SIZE; i++) {
                    const val = board[Math.floor(i/SIZE)][i%SIZE];
                    const cell = cells[i];
                    cell.textContent = val ? val : '';
                    cell.style.background = getColor(val);
                    cell.style.color = val > 512 ? 'white' : 'white';
                    // 清除动画类
                    cell.classList.remove('tile-new', 'tile-merged');
                }
            }

            // 标记新块和合并块（用于动画）
            function animateTiles(lastBoard, newBoard, mergedPositions) {
                // 新块动画 (找到新增的2或4)
                for (let r=0; r<SIZE; r++) {
                    for (let c=0; c<SIZE; c++) {
                        if (newBoard[r][c] !== 0 && lastBoard[r][c] === 0) {
                            // 新增块
                            cells[r*SIZE+c].classList.add('tile-new');
                        }
                        // 合并块（值变大的）
                        if (mergedPositions && mergedPositions.has(r*SIZE+c)) {
                            cells[r*SIZE+c].classList.add('tile-merged');
                        }
                    }
                }
            }

            // 检查游戏是否结束
            function checkEnd() {
                for (let r=0; r<SIZE; r++) {
                    for (let c=0; c<SIZE; c++) {
                        if (board[r][c] === 0) return false;
                        if (c+1 < SIZE && board[r][c] === board[r][c+1]) return false;
                        if (r+1 < SIZE && board[r][c] === board[r+1][c]) return false;
                    }
                }
                return true;
            }

            // 检查胜利 (2048)
            function checkWin() {
                if (winAchieved) return true;
                for (let r=0; r<SIZE; r++)
                    for (let c=0; c<SIZE; c++)
                        if (board[r][c] >= 2048) return true;
                return false;
            }

            // 更新UI分数
            function updateScoreUI() {
                scoreDisplay.textContent = score;
                if (score > best) {
                    best = score;
                    localStorage.setItem('2048_best', best);
                    bestDisplay.textContent = best;
                }
            }

            // 生成新块
            function spawnTile() {
                const empty = [];
                for (let r=0; r<SIZE; r++)
                    for (let c=0; c<SIZE; c++)
                        if (board[r][c] === 0) empty.push([r,c]);
                if (empty.length === 0) return false;
                const [r,c] = empty[Math.floor(Math.random() * empty.length)];
                board[r][c] = Math.random() < 0.9 ? 2 : 4;
                return true;
            }

            // 核心移动逻辑
            function move(direction) {
                if (gameOver || isPaused) return;
                initAudio();
                // 保存当前状态
                lastBoard = board.map(row => [...row]);
                lastScore = score;

                let moved = false;
                const mergedSet = new Set();
                // 方向: 0左,1上,2右,3下
                // 处理行/列
                for (let i=0; i<SIZE; i++) {
                    let line = [];
                    for (let j=0; j<SIZE; j++) {
                        switch(direction) {
                            case 0: line.push(board[i][j]); break;
                            case 1: line.push(board[j][i]); break;
                            case 2: line.push(board[i][SIZE-1-j]); break;
                            case 3: line.push(board[SIZE-1-j][i]); break;
                        }
                    }
                    // 压缩
                    let filtered = line.filter(v => v !== 0);
                    let newLine = [];
                    for (let k=0; k<filtered.length; k++) {
                        if (k+1 < filtered.length && filtered[k] === filtered[k+1]) {
                            newLine.push(filtered[k]*2);
                            score += filtered[k]*2;
                            // 标记合并位置
                            const pos = (direction === 0) ? i*SIZE + newLine.length-1 :
                                        (direction === 1) ? (newLine.length-1)*SIZE + i :
                                        (direction === 2) ? i*SIZE + (SIZE-1 - (newLine.length-1)) :
                                        (SIZE-1-(newLine.length-1))*SIZE + i;
                            mergedSet.add(pos);
                            k++;
                            moved = true;
                        } else {
                            newLine.push(filtered[k]);
                        }
                    }
                    while (newLine.length < SIZE) newLine.push(0);
                    // 写回
                    for (let k=0; k<SIZE; k++) {
                        const val = newLine[k];
                        let r,c;
                        switch(direction) {
                            case 0: r=i; c=k; break;
                            case 1: r=k; c=i; break;
                            case 2: r=i; c=SIZE-1-k; break;
                            case 3: r=SIZE-1-k; c=i; break;
                        }
                        board[r][c] = val;
                        if (board[r][c] !== 0 && lastBoard[r][c] !== board[r][c]) {
                            // 如果值变了，可能是合并也可能是移动
                            if (lastBoard[r][c] !== 0 && lastBoard[r][c] !== board[r][c]) {
                                // 合并
                            }
                            moved = true;
                        }
                    }
                }

                if (moved) {
                    // 播放移动音效
                    sfxMove();
                    spawnTile();
                    renderBoard();
                    animateTiles(lastBoard, board, mergedSet);
                    updateScoreUI();

                    // 检查胜利
                    if (checkWin() && !winAchieved) {
                        winAchieved = true;
                        setTimeout(()=>{
                            showOverlay('win');
                            sfxWin();
                        }, 120);
                    }
                    // 检查结束
                    if (checkEnd()) {
                        gameOver = true;
                        setTimeout(()=>{
                            showOverlay('end');
                            sfxLose();
                        }, 200);
                    }
                }
            }

            // 覆盖层管理
            function showOverlay(type) {
                startOverlay.classList.remove('active');
                endOverlay.classList.remove('active');
                winOverlay.classList.remove('active');
                if (type === 'start') startOverlay.classList.add('active');
                else if (type === 'end') {
                    endOverlay.classList.add('active');
                    endScore.textContent = \`得分: \${score}\`;
                    endTitle.textContent = gameOver ? '游戏结束' : '游戏结束';
                } else if (type === 'win') winOverlay.classList.add('active');
                currentOverlay = type;
            }

            // 新游戏
            function newGame() {
                board = Array.from({length:SIZE}, ()=>Array(SIZE).fill(0));
                score = 0;
                gameOver = false;
                winAchieved = false;
                lastBoard = null;
                lastScore = 0;
                spawnTile();
                spawnTile();
                renderBoard();
                updateScoreUI();
                showOverlay('none');
                boardEl.parentElement.classList.remove('shake');
            }

            // 撤销
            function undo() {
                if (lastBoard) {
                    board = lastBoard.map(row => [...row]);
                    score = lastScore;
                    renderBoard();
                    updateScoreUI();
                    lastBoard = null;
                    sfxClick();
                }
            }

            // 暂停切换
            function togglePause() {
                if (gameOver) return;
                if (currentOverlay === 'none') {
                    isPaused = true;
                    showOverlay('start'); // 复用开始层做暂停？临时改文字
                    document.querySelector('#startOverlay h2').textContent = '暂停';
                    document.querySelector('#startOverlay p').textContent = '按 P 继续';
                    document.querySelector('#startOverlay button').textContent = '继续';
                } else if (currentOverlay === 'start' && document.querySelector('#startOverlay button').textContent === '继续') {
                    isPaused = false;
                    showOverlay('none');
                }
            }

            // 事件绑定
            document.getElementById('startBtn').addEventListener('click', ()=>{
                sfxClick();
                initAudio();
                newGame();
            });
            document.getElementById('restartBtn').addEventListener('click', ()=>{
                sfxClick();
                newGame();
            });
            document.getElementById('continueBtn').addEventListener('click', ()=>{
                sfxClick();
                showOverlay('none');
            });
            document.getElementById('undoBtn').addEventListener('click', undo);
            document.getElementById('pauseBtn').addEventListener('click', togglePause);
            
            // 键盘控制
            document.addEventListener('keydown', (e) => {
                if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                    togglePause();
                    return;
                }
                if (currentOverlay !== 'none' && currentOverlay !== 'start' && currentOverlay !== 'end' && currentOverlay !== 'win') return;
                if (isPaused) return;
                switch(e.key) {
                    case 'ArrowLeft': e.preventDefault(); move(0); break;
                    case 'ArrowUp': e.preventDefault(); move(1); break;
                    case 'ArrowRight': e.preventDefault(); move(2); break;
                    case 'ArrowDown': e.preventDefault(); move(3); break;
                    case 'a': case 'A': e.preventDefault(); move(0); break;
                    case 'w': case 'W': e.preventDefault(); move(1); break;
                    case 'd': case 'D': e.preventDefault(); move(2); break;
                    case 's': case 'S': e.preventDefault(); move(3); break;
                }
            });

            // 触摸滑动
            let touchStartX, touchStartY;
            boardEl.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                e.preventDefault();
            }, {passive: false});
            boardEl.addEventListener('touchend', (e) => {
                if (!touchStartX) return;
                const dx = e.changedTouches[0].clientX - touchStartX;
                const dy = e.changedTouches[0].clientY - touchStartY;
                const absX = Math.abs(dx), absY = Math.abs(dy);
                if (Math.max(absX, absY) < 24) return;
                if (absX > absY) move(dx > 0 ? 2 : 0);
                else move(dy > 0 ? 3 : 1);
                touchStartX = null;
                touchStartY = null;
                e.preventDefault();
            }, {passive: false});

            // 屏幕震动
            function shakeScreen() {
                wrapper.classList.add('shake');
                setTimeout(()=>wrapper.classList.remove('shake'), 300);
            }

            // 粒子特效追加到移动合并
            const originalSpawn = spawnTile;
            // 简单处理：移动后随机粒子
            const origMove = move;
            // 包装移动来触发震动（仅当合并时）
            // 在move内部已有，但为了简单，这里不覆盖了。

            // 初始化开始界面
            showOverlay('start');
            board = Array.from({length:SIZE}, ()=>Array(SIZE).fill(0));
            renderBoard();
        })();
    </script>
</body>
</html>`
  },
  {
    title: '记忆翻牌',
    category: 'puzzle',
    description: '记忆配对翻牌游戏，翻开卡牌找到相同图案配对',
    html: `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>记忆配对 · 翻牌</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        body {
            min-height: 100vh;
            background: radial-gradient(circle at 20% 30%, #1a2a4a, #0b1520);
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', system-ui, sans-serif;
            touch-action: pan-y;
            padding: 12px;
        }
        .container {
            width: 100%;
            max-width: 700px;
            background: rgba(20, 30, 50, 0.6);
            backdrop-filter: blur(10px);
            border-radius: 40px;
            padding: 20px;
            box-shadow: 0 25px 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 18px;
            padding: 8px 16px;
            background: rgba(0,0,0,0.3);
            border-radius: 60px;
            color: #cfe3ff;
            font-weight: 600;
            text-shadow: 0 2px 6px rgba(0,0,0,0.5);
            flex-wrap: wrap;
            gap: 8px;
        }
        .stat-box {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .stat {
            background: #1d2b42;
            padding: 6px 14px;
            border-radius: 30px;
            font-size: 0.9rem;
            letter-spacing: 1px;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.4);
        }
        .btn-group {
            display: flex;
            gap: 8px;
        }
        .icon-btn {
            background: #2b3f5e;
            border: none;
            color: white;
            width: 44px;
            height: 44px;
            border-radius: 30px;
            font-size: 1.4rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 5px 0 #0e1622;
            transition: 0.1s ease;
        }
        .icon-btn:active {
            transform: translateY(3px);
            box-shadow: 0 2px 0 #0e1622;
        }
        .game-board {
            display: grid;
            gap: 10px;
            padding: 6px;
            justify-content: center;
        }
        .card {
            aspect-ratio: 1 / 1;
            background: transparent;
            perspective: 1000px;
            cursor: pointer;
            border-radius: 16px;
        }
        .card-inner {
            position: relative;
            width: 100%;
            height: 100%;
            text-align: center;
            transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            transform-style: preserve-3d;
            border-radius: 18px;
        }
        .card.flipped .card-inner {
            transform: rotateY(180deg);
        }
        .card-front, .card-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 15px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1);
        }
        .card-front {
            background: linear-gradient(145deg, #2a3b5c, #1d2b42);
            transform: rotateY(180deg);
            font-size: clamp(2rem, 8vw, 3.6rem);
            overflow: hidden;
        }
        .card-back {
            background: linear-gradient(145deg, #3f5a85, #2a3d60);
            border: 2px solid #7f9fd0;
            color: #b8d0ff;
            font-size: 2.2rem;
            font-weight: bold;
            text-shadow: 0 4px 8px rgba(0,0,0,0.4);
        }
        .card.matched .card-front {
            background: #2a5a3a;
            box-shadow: 0 0 20px #6fe08a;
            transition: 0.3s;
        }
        .card.matched::after {
            content: '';
            position: absolute;
            inset: 0;
            background: rgba(255,255,255,0.2);
            border-radius: 18px;
            animation: glowPulse 1s infinite alternate;
        }
        @keyframes glowPulse {
            0% {opacity: 0.3; box-shadow: 0 0 12px #8ae3a0;}
            100% {opacity: 0.7; box-shadow: 0 0 24px #b6ffb0;}
        }
        .screen-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(5, 8, 15, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 100;
            transition: opacity 0.3s;
        }
        .screen-panel {
            background: #1b283c;
            border-radius: 40px;
            padding: 30px 35px;
            max-width: 420px;
            width: 90%;
            text-align: center;
            border: 1px solid #3b5a7c;
            box-shadow: 0 20px 40px rgba(0,0,0,0.7);
        }
        .screen-panel h1 {
            font-size: 2.2rem;
            margin-bottom: 12px;
            color: #d7e9ff;
            text-shadow: 0 4px 10px #0f1b2a;
        }
        .screen-panel p {
            color: #b4c7e0;
            margin: 16px 0;
            font-size: 1.1rem;
        }
        .menu-btn {
            background: #3e5e86;
            border: none;
            color: white;
            font-size: 1.3rem;
            font-weight: bold;
            padding: 12px 30px;
            border-radius: 60px;
            margin: 8px;
            cursor: pointer;
            box-shadow: 0 6px 0 #16212e;
            transition: 0.1s ease;
            letter-spacing: 1px;
        }
        .menu-btn:active {
            transform: translateY(4px);
            box-shadow: 0 2px 0 #16212e;
        }
        .difficulty-group {
            display: flex;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
            margin: 20px 0 10px;
        }
        .diff-btn {
            background: #2e4765;
            border: 2px solid #5b7ca0;
            color: #e0eFFF;
            padding: 8px 18px;
            border-radius: 40px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s;
        }
        .diff-btn.selected {
            background: #6a9fd8;
            border-color: #b0d6ff;
            color: #0b1622;
        }
        .hidden {
            display: none !important;
        }
        .particle-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 200;
            overflow: hidden;
        }
        .particle {
            position: absolute;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ffd966;
            animation: particleFly 0.9s ease-out forwards;
        }
        @keyframes particleFly {
            0% {opacity: 1; transform: scale(1) translate(0,0);}
            100% {opacity: 0; transform: scale(0.2) translate(var(--dx), var(--dy));}
        }
        .shake {
            animation: shakeAnim 0.3s linear;
        }
        @keyframes shakeAnim {
            0% {transform: translate(0,0);}
            25% {transform: translate(-3px, 2px);}
            50% {transform: translate(3px, -2px);}
            75% {transform: translate(-2px, -3px);}
            100% {transform: translate(0,0);}
        }
        .virtual-joy {
            display: flex;
            justify-content: space-between;
            margin-top: 18px;
            gap: 10px;
            padding: 10px 5px;
        }
        .v-btn {
            background: #2f4468;
            border: none;
            color: white;
            font-size: 1.8rem;
            padding: 8px 0;
            border-radius: 40px;
            flex: 1;
            text-align: center;
            box-shadow: 0 4px 0 #0c1727;
            cursor: pointer;
        }
        .v-btn:active {
            transform: translateY(2px);
            box-shadow: none;
        }
        footer {
            color: #6f86a5;
            font-size: 0.85rem;
            text-align: center;
            margin-top: 16px;
        }
        @media (max-width: 500px) {
            .header {justify-content: center;}
        }
    </style>
</head>
<body>
    <div class="container" id="gameContainer">
        <div class="header">
            <div class="stat-box">
                <div class="stat">⏱️ <span id="timer">0</span>s</div>
                <div class="stat">👣 <span id="moves">0</span></div>
                <div class="stat">🏆 <span id="best">0</span></div>
            </div>
            <div class="btn-group">
                <button class="icon-btn" id="pauseBtn">⏸️</button>
                <button class="icon-btn" id="restartBtn">🔄</button>
            </div>
        </div>
        <div id="board" class="game-board"></div>
        <div class="virtual-joy" id="touchControls">
            <button class="v-btn" id="vPause">⏸️暂停</button>
            <button class="v-btn" id="vRestart">🔄重开</button>
        </div>
        <footer>WASD / 滑动 · 空格翻转 ｜ P 暂停</footer>
    </div>

    <!-- 开始/结束覆盖层 -->
    <div class="screen-overlay" id="startScreen">
        <div class="screen-panel">
            <h1>🧠 记忆配对</h1>
            <p>翻出相同图案，用最少步数通关</p>
            <div class="difficulty-group">
                <button class="diff-btn" data-diff="easy">简单 4x3</button>
                <button class="diff-btn selected" data-diff="medium">中等 4x4</button>
                <button class="diff-btn" data-diff="hard">困难 6x4</button>
            </div>
            <button class="menu-btn" id="startBtn">开始游戏</button>
            <p style="font-size:0.9rem; margin-top:10px;">✨ 最高分 <span id="bestScoreShow">0</span></p>
        </div>
    </div>

    <div class="screen-overlay hidden" id="winScreen">
        <div class="screen-panel">
            <h1>🎉 完美通关！</h1>
            <p id="winStats"></p>
            <p>⭐ 新纪录！</p>
            <button class="menu-btn" id="playAgainBtn">再来一局</button>
            <button class="menu-btn" id="backMenuBtn">主菜单</button>
        </div>
    </div>

    <div class="particle-container" id="particles"></div>

    <script>
        (function(){
            // 核心状态
            const container = document.getElementById('gameContainer');
            const boardEl = document.getElementById('board');
            const timerEl = document.getElementById('timer');
            const movesEl = document.getElementById('moves');
            const bestEl = document.getElementById('best');
            const startScreen = document.getElementById('startScreen');
            const winScreen = document.getElementById('winScreen');
            const bestScoreShow = document.getElementById('bestScoreShow');
            const winStats = document.getElementById('winStats');
            const pauseBtn = document.getElementById('pauseBtn');
            const restartBtn = document.getElementById('restartBtn');
            const vPause = document.getElementById('vPause');
            const vRestart = document.getElementById('vRestart');
            const touchControls = document.getElementById('touchControls');

            // 难度配置
            const DIFF_CONFIG = {
                easy: { rows: 3, cols: 4 },
                medium: { rows: 4, cols: 4 },
                hard: { rows: 4, cols: 6 }
            };
            const EMOJI_POOL = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐸','🐙','🦋','🐞','🌻','🍎','🍇','🍉','🚗','⚽','🎸','⌚'];

            let currentDifficulty = 'medium';
            let cards = [];
            let firstPick = null;
            let secondPick = null;
            let lockBoard = false;
            let matchedPairs = 0;
            let totalPairs = 0;
            let moves = 0;
            let timer = 0;
            let timerInterval = null;
            let gameActive = false;
            let gamePaused = false;
            let bestScore = parseInt(localStorage.getItem('memoryBest') || '0');
            bestEl.textContent = bestScore;
            bestScoreShow.textContent = bestScore;

            // 音效
            let audioCtx = null;
            function getAudioCtx() {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                return audioCtx;
            }
            function playTone(freq, duration, type='sine', gainValue=0.2, when=0) {
                const ctx = getAudioCtx();
                if (ctx.state === 'suspended') ctx.resume();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(gainValue, ctx.currentTime + when);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + duration);
                osc.connect(gain).connect(ctx.destination);
                osc.start(ctx.currentTime + when);
                osc.stop(ctx.currentTime + when + duration + 0.03);
            }
            function sfxFlip() { playTone(500, 0.12, 'triangle', 0.15); }
            function sfxMatch() { playTone(700, 0.2, 'sine', 0.2); playTone(1100, 0.2, 'sine', 0.2, 0.1); }
            function sfxFail() { playTone(250, 0.15, 'sawtooth', 0.1); playTone(180, 0.2, 'sawtooth', 0.1, 0.05); }
            function sfxWin() { [600,800,1000,1200].forEach((f,i)=>playTone(f,0.25,'sine',0.2,i*0.1)); }

            // 粒子特效
            function spawnParticles(x, y, count=14) {
                const particleBox = document.getElementById('particles');
                for (let i=0; i<count; i++) {
                    const p = document.createElement('div');
                    p.className = 'particle';
                    const angle = Math.random()*Math.PI*2;
                    const dist = 40 + Math.random()*80;
                    const dx = Math.cos(angle)*dist;
                    const dy = Math.sin(angle)*dist;
                    p.style.left = (x-6)+'px';
                    p.style.top = (y-6)+'px';
                    p.style.setProperty('--dx', dx+'px');
                    p.style.setProperty('--dy', dy+'px');
                    p.style.background = \`hsl(\${Math.random()*60+30}, 90%, 70%)\`;
                    particleBox.appendChild(p);
                    setTimeout(()=>p.remove(), 900);
                }
            }
            function shakeBoard() {
                container.classList.add('shake');
                setTimeout(()=>container.classList.remove('shake'), 300);
            }

            // 生成卡牌
            function generateCards(diff) {
                const { rows, cols } = DIFF_CONFIG[diff];
                const pairCount = (rows * cols) / 2;
                const emojis = EMOJI_POOL.slice(0, pairCount);
                const deck = [...emojis, ...emojis];
                // 随机打乱
                for (let i=deck.length-1; i>0; i--) {
                    const j = Math.floor(Math.random()*(i+1));
                    [deck[i], deck[j]] = [deck[j], deck[i]];
                }
                return deck.map((emoji, idx) => ({
                    id: idx,
                    emoji,
                    matched: false,
                    flipped: false
                }));
            }

            // 渲染
            function renderBoard() {
                const { rows, cols } = DIFF_CONFIG[currentDifficulty];
                boardEl.style.gridTemplateColumns = \`repeat(\${cols}, 1fr)\`;
                boardEl.innerHTML = '';
                cards.forEach((card, index) => {
                    const cardDiv = document.createElement('div');
                    cardDiv.className = 'card';
                    if (card.flipped) cardDiv.classList.add('flipped');
                    if (card.matched) cardDiv.classList.add('matched');
                    cardDiv.dataset.index = index;
                    cardDiv.innerHTML = \`
                        <div class="card-inner">
                            <div class="card-front">\${card.emoji}</div>
                            <div class="card-back">?</div>
                        </div>
                    \`;
                    cardDiv.addEventListener('click', (e) => onCardClick(index, e));
                    boardEl.appendChild(cardDiv);
                });
            }

            // 点击逻辑
            function onCardClick(index) {
                if (!gameActive || gamePaused || lockBoard) return;
                const card = cards[index];
                if (card.matched || card.flipped) return;
                
                // 翻转
                card.flipped = true;
                sfxFlip();
                renderBoard();

                if (!firstPick) {
                    firstPick = card;
                    return;
                }
                // 第二张
                if (firstPick && !secondPick) {
                    secondPick = card;
                    moves++;
                    movesEl.textContent = moves;
                    lockBoard = true;

                    // 配对检查
                    if (firstPick.emoji === secondPick.emoji) {
                        // 配对成功
                        firstPick.matched = true;
                        secondPick.matched = true;
                        matchedPairs++;
                        sfxMatch();
                        // 粒子从两张卡中心发出
                        const boardRect = boardEl.getBoundingClientRect();
                        const cardsEls = boardEl.children;
                        const idx1 = cards.findIndex(c=>c.id===firstPick.id);
                        const idx2 = cards.findIndex(c=>c.id===secondPick.id);
                        if (cardsEls[idx1] && cardsEls[idx2]) {
                            const r1 = cardsEls[idx1].getBoundingClientRect();
                            const r2 = cardsEls[idx2].getBoundingClientRect();
                            spawnParticles((r1.left+r1.right)/2, (r1.top+r1.bottom)/2, 10);
                            spawnParticles((r2.left+r2.right)/2, (r2.top+r2.bottom)/2, 10);
                        }
                        renderBoard();
                        firstPick = null;
                        secondPick = null;
                        lockBoard = false;

                        if (matchedPairs === totalPairs) {
                            // 胜利
                            gameActive = false;
                            clearInterval(timerInterval);
                            sfxWin();
                            showWinScreen();
                            // 保存最佳
                            if (bestScore === 0 || timer < bestScore) {
                                bestScore = timer;
                                localStorage.setItem('memoryBest', bestScore);
                                bestEl.textContent = bestScore;
                                bestScoreShow.textContent = bestScore;
                            }
                        }
                    } else {
                        // 配对失败
                        sfxFail();
                        shakeBoard();
                        setTimeout(() => {
                            firstPick.flipped = false;
                            secondPick.flipped = false;
                            firstPick = null;
                            secondPick = null;
                            lockBoard = false;
                            renderBoard();
                        }, 800);
                    }
                }
            }

            // 计时器
            function startTimer() {
                clearInterval(timerInterval);
                timer = 0;
                timerEl.textContent = '0';
                timerInterval = setInterval(() => {
                    if (gameActive && !gamePaused) {
                        timer++;
                        timerEl.textContent = timer;
                    }
                }, 1000);
            }

            // 难度选择
            document.querySelectorAll('.diff-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('selected'));
                    btn.classList.add('selected');
                    currentDifficulty = btn.dataset.diff;
                });
            });

            // 开始游戏
            function startGame(diff = currentDifficulty) {
                currentDifficulty = diff;
                // 重置状态
                cards = generateCards(currentDifficulty);
                firstPick = null;
                secondPick = null;
                lockBoard = false;
                matchedPairs = 0;
                moves = 0;
                totalPairs = cards.length / 2;
                movesEl.textContent = '0';
                timerEl.textContent = '0';
                gameActive = true;
                gamePaused = false;
                pauseBtn.textContent = '⏸️';
                startTimer();
                renderBoard();
                startScreen.classList.add('hidden');
                winScreen.classList.add('hidden');
            }

            // 显示胜利
            function showWinScreen() {
                winStats.textContent = \`👣 步数 \${moves} ⏱️ 时间 \${timer}s · 难度 \${currentDifficulty}\`;
                winScreen.classList.remove('hidden');
            }

            // 暂停切换
            function togglePause() {
                if (!gameActive) return;
                gamePaused = !gamePaused;
                pauseBtn.textContent = gamePaused ? '▶️' : '⏸️';
                if (!gamePaused && matchedPairs === totalPairs) return;
            }

            // 重开
            function restartGame() {
                startGame(currentDifficulty);
            }

            // 事件绑定
            document.getElementById('startBtn').addEventListener('click', () => {
                startGame(currentDifficulty);
            });
            document.getElementById('playAgainBtn').addEventListener('click', () => {
                startGame(currentDifficulty);
            });
            document.getElementById('backMenuBtn').addEventListener('click', () => {
                winScreen.classList.add('hidden');
                startScreen.classList.remove('hidden');
                gameActive = false;
                clearInterval(timerInterval);
            });
            pauseBtn.addEventListener('click', togglePause);
            restartBtn.addEventListener('click', restartGame);
            vPause.addEventListener('click', togglePause);
            vRestart.addEventListener('click', restartGame);

            // 键盘控制
            document.addEventListener('keydown', (e) => {
                if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                    e.preventDefault();
                    togglePause();
                }
                if (e.key === ' ') {
                    e.preventDefault(); // 空格翻转? 这里不绑定
                }
                if (e.key === 'r' || e.key === 'R') restartGame();
            });

            // 触摸翻牌已包含，手势忽略，按钮够了

            // 初始化展示
            startScreen.classList.remove('hidden');
            gameActive = false;
            // 初始预渲染简单板子？但等开始后渲染
            // 展示默认难度
            bestEl.textContent = bestScore;
        })();
    </script>
</body>
</html>`
  },
  {
    title: '宝石消消乐',
    category: 'puzzle',
    description: '三消游戏，交换相邻宝石使三个以上同色连成一线消除',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>💎 三消连珠 · 宝石迷阵</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    body {
      background: #0b0d1a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      touch-action: none;
    }
    #game-wrapper {
      background: #101426;
      padding: 16px;
      border-radius: 32px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8);
    }
    canvas {
      display: block;
      margin: 0 auto;
      border-radius: 20px;
      background: radial-gradient(circle at 30% 20%, #1b2340, #0b0f1f);
      box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.7), 0 10px 20px rgba(0, 0, 0, 0.5);
      cursor: pointer;
      touch-action: none;
    }
    .info-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #dbe4ff;
      padding: 8px 12px;
      font-weight: bold;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      background: rgba(20, 30, 55, 0.8);
      border-radius: 20px;
      margin-bottom: 12px;
      backdrop-filter: blur(4px);
      border: 1px solid #2e3c64;
    }
    .info-item {
      background: #1b2340;
      padding: 6px 16px;
      border-radius: 40px;
      font-size: 16px;
      letter-spacing: 1px;
      border: 1px solid #3d4d7a;
      box-shadow: inset 0 2px 6px rgba(0,0,0,0.5);
    }
    .info-item span {
      color: #ffd966;
      margin-left: 6px;
    }
    .btn-pause {
      background: #2a3550;
      border: none;
      color: #c6d4ff;
      font-size: 20px;
      padding: 4px 16px;
      border-radius: 40px;
      cursor: pointer;
      font-weight: bold;
      border: 1px solid #4b5d8f;
      transition: 0.2s;
    }
    .btn-pause:hover {
      background: #3a4768;
      transform: scale(1.05);
    }
  </style>
</head>
<body>
<div id="game-wrapper">
  <div class="info-bar">
    <div class="info-item">💯 分数 <span id="score-display">0</span></div>
    <div class="info-item">🔥 连击 <span id="combo-display">0</span></div>
    <div class="info-item">🏆 最高 <span id="high-display">0</span></div>
    <button class="btn-pause" id="pause-btn">⏸️ 暂停</button>
  </div>
  <canvas id="gameCanvas" width="480" height="520"></canvas>
</div>

<script>
  (function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreSpan = document.getElementById('score-display');
    const comboSpan = document.getElementById('combo-display');
    const highSpan = document.getElementById('high-display');
    const pauseBtn = document.getElementById('pause-btn');

    // ---------- 游戏配置 ----------
    const ROWS = 8;
    const COLS = 8;
    const GEM_SIZE = 56;
    const BOARD_X = 20;
    const BOARD_Y = 60;
    const GAP = 4; // 视觉间隙
    const GRID_W = COLS * (GEM_SIZE + GAP) - GAP;
    const GRID_H = ROWS * (GEM_SIZE + GAP) - GAP;

    // 颜色 (6种)
    const GEM_COLORS = [
      '#ef5350', // 红
      '#42a5f5', // 蓝
      '#66bb6a', // 绿
      '#ffca28', // 黄
      '#ab47bc', // 紫
      '#ff7043'  // 橙
    ];
    const GEM_EMOJI = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];

    // 状态
    let board = [];
    let score = 0;
    let highScore = parseInt(localStorage.getItem('gemHighScore')) || 0;
    let combo = 0;
    let currentComboCount = 0;
    let movesLeft = 25;      // 步数限制
    let gameStatus = 'start'; // start, playing, paused, gameover
    let selectedGem = null;   // {row, col}
    let isAnimating = false;  // 锁交互
    let fallingGems = [];     // 下落动画数据 {row, col, targetRow, progress}
    let particles = [];       // 粒子特效
    let shakeAmount = 0;      // 屏幕震动
    let lastTime = 0;

    // 音效 (Web Audio)
    let audioCtx = null;
    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
    }
    function playTone(freq, duration, type = 'sine', volume = 0.15, delay = 0) {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + duration);
    }
    // 预定义音效
    const sfx = {
      swap: () => playTone(500, 0.08, 'triangle', 0.12),
      match: (count) => {
        if (count >= 4) playTone(880, 0.2, 'sawtooth', 0.15);
        else playTone(660, 0.15, 'sine', 0.15);
        playTone(440, 0.1, 'square', 0.1, 0.05);
      },
      comboUp: (level) => playTone(700 + level * 100, 0.15, 'sine', 0.15),
      gameOver: () => { playTone(300, 0.4, 'sawtooth', 0.2); playTone(200, 0.5, 'sine', 0.15, 0.15); },
      click: () => playTone(900, 0.05, 'square', 0.08),
    };

    // ---------- 初始化棋盘 ----------
    function initBoard() {
      board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      // 随机填充，但避免初始三连
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          let color;
          do {
            color = Math.floor(Math.random() * GEM_COLORS.length);
          } while (hasMatchAt(r, c, color));
          board[r][c] = color;
        }
      }
      // 移除已有的匹配（如果有）
      let matches = findAllMatches();
      while (matches.length > 0) {
        for (const m of matches) {
          board[m.r][m.c] = Math.floor(Math.random() * GEM_COLORS.length);
        }
        matches = findAllMatches();
      }
      fallingGems = [];
      particles = [];
      score = 0;
      combo = 0;
      currentComboCount = 0;
      movesLeft = 25;
      updateUI();
    }

    // 检测某位置放置颜色是否形成三连 (用于生成)
    function hasMatchAt(r, c, color) {
      // 水平
      let left = 1, right = 1;
      while (c - left >= 0 && board[r][c - left] === color) left++;
      while (c + right < COLS && board[r][c + right] === color) right++;
      if (left + right - 1 >= 3) return true;
      // 垂直
      let up = 1, down = 1;
      while (r - up >= 0 && board[r - up][c] === color) up++;
      while (r + down < ROWS && board[r + down][c] === color) down++;
      return (up + down - 1 >= 3);
    }

    // 查找所有匹配 (返回坐标数组)
    function findAllMatches() {
      const matches = [];
      // 水平
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 2; c++) {
          if (board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2]) {
            matches.push({r, c});
            matches.push({r, c: c+1});
            matches.push({r, c: c+2});
          }
        }
      }
      // 垂直
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 2; r++) {
          if (board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c]) {
            matches.push({r, c});
            matches.push({r: r+1, c});
            matches.push({r: r+2, c});
          }
        }
      }
      // 去重
      const unique = [];
      const set = new Set();
      for (const m of matches) {
        const key = \`\${m.r},\${m.c}\`;
        if (!set.has(key)) {
          set.add(key);
          unique.push(m);
        }
      }
      return unique;
    }

    // ---------- 核心逻辑 ----------
    function trySwap(r1, c1, r2, c2) {
      if (isAnimating || gameStatus !== 'playing') return;
      // 检查相邻
      const dr = Math.abs(r1 - r2);
      const dc = Math.abs(c1 - c2);
      if (dr + dc !== 1) return;

      // 交换
      [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
      sfx.swap();
      // 检查是否有匹配
      let matches = findAllMatches();
      if (matches.length === 0) {
        // 换回来
        [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
        sfx.swap(); // 无效交换音效
        return;
      }

      // 有效移动
      movesLeft--;
      if (movesLeft < 0) movesLeft = 0;
      isAnimating = true;
      combo = 0; // 重置连击, 连击会在连续消除中递增
      processMatches(matches, 1);
    }

    function processMatches(matches, comboLevel) {
      if (matches.length === 0) {
        // 检查是否还有可消除的（连锁）
        const newMatches = findAllMatches();
        if (newMatches.length > 0) {
          combo++;
          currentComboCount = combo;
          sfx.comboUp(combo);
          // 延迟递归
          setTimeout(() => {
            processMatches(newMatches, combo);
          }, 200);
          return;
        } else {
          // 无更多消除，结束动画
          isAnimating = false;
          // 检查是否游戏结束
          if (movesLeft <= 0) {
            gameOver();
          }
          return;
        }
      }

      // 消除并计分
      const uniqueSet = new Set();
      matches.forEach(m => uniqueSet.add(\`\${m.r},\${m.c}\`));
      const count = uniqueSet.size;
      const baseScore = count * 10;
      const bonus = comboLevel > 1 ? comboLevel * 5 : 0;
      score += baseScore + bonus;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('gemHighScore', highScore.toString());
      }

      // 粒子特效 (每个消除位置)
      for (const key of uniqueSet) {
        const [r, c] = key.split(',').map(Number);
        const colorIdx = board[r][c];
        spawnParticles(r, c, GEM_COLORS[colorIdx]);
      }

      sfx.match(count);
      shakeAmount = 8;

      // 清空
      for (const key of uniqueSet) {
        const [r, c] = key.split(',').map(Number);
        board[r][c] = -1; // 标记为空
      }

      // 下落 + 填充
      const falling = applyGravityAndRefill();
      fallingGems = falling;

      // 动画结束后检查连锁
      setTimeout(() => {
        const afterMatches = findAllMatches();
        if (afterMatches.length > 0) {
          // 连锁
          combo++;
          currentComboCount = combo;
          sfx.comboUp(combo);
          processMatches(afterMatches, combo);
        } else {
          isAnimating = false;
          if (movesLeft <= 0) gameOver();
        }
      }, 250);

      updateUI();
    }

    function applyGravityAndRefill() {
      const fallingList = [];
      // 重力下落
      for (let c = 0; c < COLS; c++) {
        let writeRow = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r][c] !== -1) {
            if (writeRow !== r) {
              // 记录下落动画
              board[writeRow][c] = board[r][c];
              board[r][c] = -1;
              fallingList.push({ row: writeRow, col: c, startRow: r, progress: 0 });
            }
            writeRow--;
          }
        }
        // 填充顶部空位
        for (let r = writeRow; r >= 0; r--) {
          const newColor = Math.floor(Math.random() * GEM_COLORS.length);
          board[r][c] = newColor;
          fallingList.push({ row: r, col: c, startRow: r - (writeRow + 1), progress: 0 });
        }
      }
      return fallingList;
    }

    // ---------- 粒子系统 ----------
    function spawnParticles(r, c, color) {
      const x = BOARD_X + c * (GEM_SIZE + GAP) + GEM_SIZE / 2;
      const y = BOARD_Y + r * (GEM_SIZE + GAP) + GEM_SIZE / 2;
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          color: color,
          size: 4 + Math.random() * 6
        });
      }
    }

    // ---------- 绘制 ----------
    function drawBoard() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 背景
      ctx.fillStyle = '#141b2d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 震动
      if (shakeAmount > 0) {
        const dx = (Math.random() - 0.5) * shakeAmount;
        const dy = (Math.random() - 0.5) * shakeAmount;
        ctx.save();
        ctx.translate(dx, dy);
        shakeAmount *= 0.8;
      }

      // 绘制棋盘格子背景
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#1b2538';
      ctx.beginPath();
      ctx.roundRect(BOARD_X - 4, BOARD_Y - 4, GRID_W + 8, GRID_H + 8, 16);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 绘制宝石
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const colorIdx = board[r][c];
          if (colorIdx === -1) continue;
          const x = BOARD_X + c * (GEM_SIZE + GAP) + GEM_SIZE / 2;
          const y = BOARD_Y + r * (GEM_SIZE + GAP) + GEM_SIZE / 2;

          // 绘制菱形
          ctx.save();
          ctx.translate(x, y);
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 8;
          ctx.fillStyle = GEM_COLORS[colorIdx];
          ctx.strokeStyle = '#ffffff55';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -GEM_SIZE/2 + 6);
          ctx.lineTo(GEM_SIZE/2 - 6, 0);
          ctx.lineTo(0, GEM_SIZE/2 - 6);
          ctx.lineTo(-GEM_SIZE/2 + 6, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 高光
          ctx.fillStyle = '#ffffff30';
          ctx.beginPath();
          ctx.arc(-6, -6, 6, 0, Math.PI*2);
          ctx.fill();

          // 选中框
          if (selectedGem && selectedGem.row === r && selectedGem.col === c) {
            ctx.strokeStyle = '#ffd966';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 15;
            ctx.strokeRect(-GEM_SIZE/2, -GEM_SIZE/2, GEM_SIZE, GEM_SIZE);
          }
          ctx.restore();
        }
      }

      // 粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        p.vy += 0.1;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 步数显示 (画布上)
      ctx.fillStyle = '#dbe4ff';
      ctx.font = 'bold 18px "Segoe UI"';
      ctx.textAlign = 'left';
      ctx.fillText(\`👟 步数: \${movesLeft}\`, 20, 32);

      // 操作提示
      ctx.font = '12px "Segoe UI"';
      ctx.fillStyle = '#8d9bc0';
      ctx.fillText('点击/触摸交换相邻宝石 · 三消连锁', 20, 50);

      // 暂停遮罩
      if (gameStatus === 'paused') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText('⏸️ 已暂停', canvas.width/2, canvas.height/2);
      }

      // 游戏结束遮罩
      if (gameStatus === 'gameover') {
        ctx.fillStyle = 'rgba(10,10,30,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd966';
        ctx.font = 'bold 40px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvas.width/2, 180);
        ctx.fillStyle = '#fff';
        ctx.font = '28px "Segoe UI"';
        ctx.fillText(\`得分: \${score}\`, canvas.width/2, 240);
        ctx.fillText(\`最高: \${highScore}\`, canvas.width/2, 280);
        ctx.font = '20px "Segoe UI"';
        ctx.fillStyle = '#b0c4ff';
        ctx.fillText('点击任意位置重新开始', canvas.width/2, 340);
      }

      // 开始界面
      if (gameStatus === 'start') {
        ctx.fillStyle = 'rgba(20, 24, 45, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd966';
        ctx.font = 'bold 48px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText('💎 宝石迷阵', canvas.width/2, 180);
        ctx.fillStyle = '#dbe4ff';
        ctx.font = '22px "Segoe UI"';
        ctx.fillText('交换相邻宝石 · 三消得分', canvas.width/2, 230);
        ctx.font = '18px "Segoe UI"';
        ctx.fillText('步数限制: 25 步', canvas.width/2, 270);
        ctx.fillStyle = '#7dffa0';
        ctx.font = 'bold 28px "Segoe UI"';
        ctx.fillText('点击开始', canvas.width/2, 340);
      }

      if (shakeAmount > 0) ctx.restore();
    }

    // 工具 roundRect
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
      return this;
    };

    // ---------- UI更新 ----------
    function updateUI() {
      scoreSpan.textContent = score;
      comboSpan.textContent = currentComboCount > 0 ? \`🔥\${currentComboCount}\` : '0';
      highSpan.textContent = highScore;
    }

    // ---------- 游戏流程 ----------
    function startGame() {
      initBoard();
      gameStatus = 'playing';
      selectedGem = null;
      isAnimating = false;
      particles = [];
      shakeAmount = 0;
      updateUI();
    }

    function gameOver() {
      gameStatus = 'gameover';
      sfx.gameOver();
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('gemHighScore', highScore.toString());
      }
      updateUI();
    }

    // ---------- 交互 ----------
    function handleClick(e) {
      initAudio();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        e.preventDefault();
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const canvasX = (clientX - rect.left) * scaleX;
      const canvasY = (clientY - rect.top) * scaleY;
      
      // 游戏状态处理
      if (gameStatus === 'start') {
        startGame();
        return;
      }
      if (gameStatus === 'gameover') {
        startGame();
        return;
      }
      if (gameStatus === 'paused') {
        gameStatus = 'playing';
        sfx.click();
        return;
      }
      if (gameStatus !== 'playing' || isAnimating) return;

      // 计算格子
      const col = Math.floor((canvasX - BOARD_X) / (GEM_SIZE + GAP));
      const row = Math.floor((canvasY - BOARD_Y) / (GEM_SIZE + GAP));
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

      if (!selectedGem) {
        selectedGem = { row, col };
        sfx.click();
      } else {
        const s = selectedGem;
        // 如果点同一个
        if (s.row === row && s.col === col) {
          selectedGem = null;
          return;
        }
        // 尝试交换
        trySwap(s.row, s.col, row, col);
        selectedGem = null;
      }
    }

    // ---------- 键盘控制 (可选) ----------
    function keyHandler(e) {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameStatus === 'playing') {
          gameStatus = 'paused';
          sfx.click();
        } else if (gameStatus === 'paused') {
          gameStatus = 'playing';
          sfx.click();
        }
      }
    }

    // ---------- 动画循环 ----------
    function animate() {
      drawBoard();
      requestAnimationFrame(animate);
    }

    // ---------- 事件绑定 ----------
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleClick, { passive: false });
    window.addEventListener('keydown', keyHandler);
    pauseBtn.addEventListener('click', () => {
      initAudio();
      if (gameStatus === 'playing') {
        gameStatus = 'paused';
        sfx.click();
      } else if (gameStatus === 'paused') {
        gameStatus = 'playing';
        sfx.click();
      }
    });

    // 初始化
    initBoard();
    gameStatus = 'start';
    highSpan.textContent = highScore;
    animate();
  })();
</script>
</body>
</html>`
  },
  {
    title: '太空跑酷',
    category: 'action',
    description: '横版跑酷游戏，角色自动奔跑，跳跃躲避障碍物收集金币',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>极速跑酷 · 金币跳跃</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        body {
            background: linear-gradient(145deg, #0a0f2e 0%, #1a1f3e 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
            touch-action: manipulation;
            overflow: hidden;
        }
        #game-container {
            border-radius: 28px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 0 0 2px rgba(255, 255, 255, 0.08);
            background: #1c2a44;
            padding: 10px;
            position: relative;
        }
        canvas {
            display: block;
            width: 100%;
            height: auto;
            border-radius: 20px;
            background: #0f1a2a;
            cursor: pointer;
            box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5);
        }
        /* 移动端按钮区 */
        .touch-zone {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;
            padding: 0 10px;
            pointer-events: none;
        }
        .touch-zone span {
            color: #aec9ff;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.5px;
            background: rgba(255, 255, 255, 0.06);
            padding: 8px 16px;
            border-radius: 60px;
            backdrop-filter: blur(6px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .jump-btn-area {
            pointer-events: auto;
            display: flex;
            gap: 16px;
        }
        .big-jump-btn {
            background: #ffcf5c;
            color: #1a1f3e;
            font-weight: 800;
            font-size: 18px;
            padding: 14px 30px;
            border-radius: 80px;
            border: none;
            box-shadow: 0 8px 0 #b87e2e, 0 10px 20px rgba(0, 0, 0, 0.3);
            transition: all 0.05s ease;
            letter-spacing: 1px;
            cursor: pointer;
            line-height: 1;
        }
        .big-jump-btn:active {
            transform: translateY(6px);
            box-shadow: 0 2px 0 #b87e2e, 0 8px 12px rgba(0, 0, 0, 0.3);
        }
        @media (max-width: 700px) {
            .desktop-hint {
                display: none;
            }
            .touch-zone span {
                font-size: 12px;
                padding: 6px 12px;
            }
        }
        @media (min-width: 701px) {
            .touch-zone {
                display: none;  /* 桌面隐藏触摸按钮 */
            }
        }
        .pause-overlay {
            position: absolute;
            top: 18px;
            right: 20px;
            z-index: 10;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 40px;
            padding: 6px 14px;
            color: white;
            font-weight: 600;
            font-size: 14px;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            pointer-events: none;
        }
    </style>
</head>
<body>
<div id="game-container">
    <canvas id="gameCanvas" width="800" height="400"></canvas>
    <div class="pause-overlay">⏸ P / ESC</div>
    <div class="touch-zone">
        <span>✦ 点击屏幕跳跃 · 二段跳</span>
        <div class="jump-btn-area">
            <button class="big-jump-btn" id="mobileJumpBtn">跳!</button>
        </div>
    </div>
</div>

<script>
    (function() {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('game-container');

        // 尺寸
        const W = 800, H = 400;
        canvas.width = W;
        canvas.height = H;

        // ---------- 全局状态 ----------
        let gameState = 'menu'; // 'menu' | 'playing' | 'paused' | 'gameover'
        let score = 0;
        let highScore = localStorage.getItem('runHighScore') || 0;
        highScore = parseInt(highScore, 10) || 0;

        // 玩家物理
        let player = {
            x: 90,
            y: 230,
            w: 40,
            h: 52,
            vy: 0,
            gravity: 0.55,
            jumpPower: -10.5,
            canDoubleJump: true,
            grounded: true,
            yBase: 230
        };

        // 世界参数
        let gameSpeed = 5.0;      // 基础速度
        let baseSpeed = 5.0;
        let speedIncrease = 0.015;
        let obstacles = [];
        let coins = [];
        let dustParticles = [];
        let coinParticles = [];
        let shakeIntensity = 0;
        let frame = 0;
        let distance = 0;

        // 生成控制
        let obstacleTimer = 0;
        let coinTimer = 0;

        // 音效
        let audioCtx = null;
        function initAudio() {
            if (!audioCtx) {
                try {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                } catch(e) {
                    audioCtx = null;
                }
            }
        }
        function playSound(type) {
            if (!audioCtx) return;
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            const now = audioCtx.currentTime;
            if (type === 'jump') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(650, now + 0.12);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            } else if (type === 'doubleJump') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(420, now);
                osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            } else if (type === 'coin') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            } else if (type === 'hit') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            } else if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(500, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            }
            osc.start(now);
            osc.stop(now + 0.3);
        }

        // 重置游戏
        function resetGame() {
            score = 0;
            gameSpeed = baseSpeed;
            obstacles = [];
            coins = [];
            dustParticles = [];
            coinParticles = [];
            obstacleTimer = 0;
            coinTimer = 0;
            distance = 0;
            shakeIntensity = 0;
            player.y = player.yBase;
            player.vy = 0;
            player.grounded = true;
            player.canDoubleJump = true;
            gameState = 'playing';
        }

        // 生成障碍物 (多种高低)
        function spawnObstacle() {
            const r = Math.random();
            let type = 'low';
            let y, w, h;
            if (r < 0.4) { // 低障碍
                type = 'low';
                w = 35; h = 28;
                y = player.yBase + player.h - h; // 站立地面
            } else if (r < 0.75) { // 高障碍 (需要跳跃)
                type = 'tall';
                w = 28; h = 55;
                y = player.yBase + player.h - h;
            } else { // 浮空障碍 (需二段跳/精准跳)
                type = 'float';
                w = 38; h = 22;
                y = player.yBase - 30; // 空中
            }
            obstacles.push({
                x: W + 40,
                y: y,
                w: w,
                h: h,
                type: type,
                passed: false
            });
        }

        // 生成金币
        function spawnCoin() {
            const y = Math.random() < 0.5 ? player.yBase - 30 : player.yBase - 100;
            coins.push({
                x: W + 30,
                y: y,
                r: 16,
                collected: false
            });
        }

        // 粒子：尘土
        function emitDust() {
            if (player.grounded && gameState === 'playing') {
                dustParticles.push({
                    x: player.x + player.w/2,
                    y: player.y + player.h,
                    vx: -gameSpeed * 0.4,
                    vy: -Math.random() * 1.5 - 0.5,
                    life: 0.6,
                    size: 4 + Math.random() * 7,
                    color: '#c9b38b'
                });
            }
        }

        // 粒子：金币收集
        function emitCoinBurst(x, y) {
            for (let i = 0; i < 12; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 5;
                coinParticles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    life: 0.7,
                    size: 3 + Math.random() * 6,
                    color: '#ffd966'
                });
            }
        }

        // 更新粒子
        function updateParticles(dt) {
            // 尘土更新
            dustParticles = dustParticles.filter(p => {
                p.x += p.vx * dt * 60;
                p.y += p.vy * dt * 60;
                p.life -= dt;
                return p.life > 0;
            });
            // 金币粒子
            coinParticles = coinParticles.filter(p => {
                p.x += p.vx * dt * 60;
                p.y += p.vy * dt * 60;
                p.vy += 0.15 * dt * 60;
                p.life -= dt;
                return p.life > 0;
            });
        }

        // 碰撞检测
        function rectCollide(ax, ay, aw, ah, bx, by, bw, bh) {
            return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
        }

        // 玩家跳跃
        function jump() {
            if (gameState !== 'playing') return;
            if (player.grounded) {
                player.vy = player.jumpPower;
                player.grounded = false;
                player.canDoubleJump = true;
                playSound('jump');
            } else if (player.canDoubleJump) {
                player.vy = player.jumpPower * 0.92;
                player.canDoubleJump = false;
                playSound('doubleJump');
                // 二段跳粒子
                for (let i = 0; i < 8; i++) {
                    dustParticles.push({
                        x: player.x + player.w/2,
                        y: player.y + player.h,
                        vx: -gameSpeed * 0.3 + (Math.random()-0.5)*3,
                        vy: -Math.random() * 4 - 1,
                        life: 0.4,
                        size: 5,
                        color: '#f0e5c9'
                    });
                }
            }
        }

        // 输入
        function handleKey(e) {
            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                jump();
            }
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (gameState === 'playing') {
                    gameState = 'paused';
                    playSound('click');
                } else if (gameState === 'paused') {
                    gameState = 'playing';
                    playSound('click');
                }
            }
        }

        // 触摸/点击跳跃
        function handleTap(e) {
            e.preventDefault();
            if (gameState === 'menu') {
                startGame();
            } else if (gameState === 'gameover') {
                resetGame();
                playSound('click');
            } else if (gameState === 'playing') {
                jump();
            } else if (gameState === 'paused') {
                gameState = 'playing';
                playSound('click');
            }
        }

        function startGame() {
            initAudio();
            resetGame();
            playSound('click');
        }

        // 移动端按钮
        document.getElementById('mobileJumpBtn').addEventListener('touchstart', (e) => {
            e.stopPropagation();
            if (gameState === 'playing') {
                jump();
            } else if (gameState === 'menu' || gameState === 'gameover') {
                startGame();
            } else if (gameState === 'paused') {
                gameState = 'playing';
                playSound('click');
            }
        });
        document.getElementById('mobileJumpBtn').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 监听
        window.addEventListener('keydown', handleKey);
        canvas.addEventListener('click', handleTap);
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleTap(e);
        }, { passive: false });

        // UI绘制
        function drawUI() {
            // 分数
            ctx.fillStyle = '#fff';
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 10;
            ctx.font = 'bold 32px "Segoe UI", system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(\`✦ \${score}\`, 24, 60);
            ctx.font = '18px system-ui';
            ctx.fillStyle = '#ffd966';
            ctx.fillText(\`最高分: \${Math.max(highScore, score)}\`, 24, 90);
            ctx.shadowBlur = 0;

            // 速度提示
            ctx.font = '16px monospace';
            ctx.fillStyle = '#aab8d8';
            ctx.textAlign = 'right';
            ctx.fillText(\`速度 \${gameSpeed.toFixed(1)}\`, W-24, 45);
        }

        function drawPlayer() {
            // 身体
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#5fc9f8';
            ctx.beginPath();
            ctx.roundRect(player.x, player.y, player.w, player.h, 12);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#1a1f3e';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(player.x + 28, player.y + 15, 5, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(player.x + 25, player.y + 13, 2, 0, Math.PI*2);
            ctx.fill();
            // 围巾
            ctx.fillStyle = '#ff9f5c';
            ctx.fillRect(player.x-4, player.y+8, 10, 14);
            ctx.shadowBlur = 0;
        }

        // 绘制背景
        function drawBackground() {
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#1b2b4a');
            grad.addColorStop(0.7, '#13213a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
            // 远景山
            ctx.fillStyle = '#3a5170';
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(0, H-100);
            for (let i=0; i<W; i+=50) {
                ctx.lineTo(i, H-130 + Math.sin(i*0.01 + frame*0.02)*18);
            }
            ctx.lineTo(W, H);
            ctx.lineTo(0, H);
            ctx.fill();
            ctx.globalAlpha = 1;
            // 地面
            ctx.fillStyle = '#3c5b27';
            ctx.fillRect(0, player.yBase + player.h - 8, W, 60);
            ctx.fillStyle = '#5a8a3c';
            ctx.fillRect(0, player.yBase + player.h - 2, W, 12);
        }

        // 绘制障碍物
        function drawObstacles() {
            obstacles.forEach(ob => {
                ctx.fillStyle = ob.type === 'tall' ? '#b5543c' : (ob.type === 'float' ? '#a06a9c' : '#6b4a3a');
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#000';
                ctx.beginPath();
                ctx.roundRect(ob.x, ob.y, ob.w, ob.h, 8);
                ctx.fill();
            });
            ctx.shadowBlur = 0;
        }

        // 绘制金币
        function drawCoins() {
            coins.forEach(c => {
                if (c.collected) return;
                ctx.fillStyle = '#ffd966';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ffb84d';
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = '#fff2b0';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(c.x-3, c.y-3, 5, 0, Math.PI*2);
                ctx.fill();
            });
            ctx.shadowBlur = 0;
        }

        // 绘制粒子
        function drawParticles() {
            dustParticles.forEach(p => {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
                ctx.fill();
            });
            coinParticles.forEach(p => {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        }

        // 绘制菜单/结束界面
        function drawOverlay() {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, W, H);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#000';
            if (gameState === 'menu') {
                ctx.font = 'bold 48px system-ui';
                ctx.fillText('🏃 极速跑酷', W/2, 150);
                ctx.font = '24px system-ui';
                ctx.fillStyle = '#ffd966';
                ctx.fillText('点击屏幕 / 空格跳跃 · 二段跳', W/2, 220);
                ctx.font = '28px system-ui';
                ctx.fillStyle = '#aad3ff';
                ctx.fillText('开始奔跑', W/2, 300);
                ctx.fillText('最高分: ' + highScore, W/2, 350);
            } else if (gameState === 'gameover') {
                ctx.font = 'bold 44px system-ui';
                ctx.fillStyle = '#ff6f6f';
                ctx.fillText('💥 撞到障碍!', W/2, 170);
                ctx.font = '30px system-ui';
                ctx.fillStyle = '#fff';
                ctx.fillText('分数: ' + score, W/2, 230);
                ctx.fillStyle = '#ffd966';
                ctx.fillText('最高分: ' + Math.max(highScore, score), W/2, 280);
                ctx.font = '26px system-ui';
                ctx.fillStyle = '#9de0ff';
                ctx.fillText('点击重新开始', W/2, 340);
            } else if (gameState === 'paused') {
                ctx.font = 'bold 44px system-ui';
                ctx.fillStyle = '#fff';
                ctx.fillText('⏸ 暂停', W/2, 200);
                ctx.font = '22px system-ui';
                ctx.fillStyle = '#ccc';
                ctx.fillText('按 P / ESC 或点击继续', W/2, 280);
            }
            ctx.shadowBlur = 0;
        }

        // 屏幕震动
        function applyShake() {
            if (shakeIntensity > 0) {
                const dx = (Math.random() - 0.5) * shakeIntensity * 2;
                const dy = (Math.random() - 0.5) * shakeIntensity * 2;
                ctx.save();
                ctx.translate(dx, dy);
                shakeIntensity *= 0.85;
                if (shakeIntensity < 0.5) shakeIntensity = 0;
                return true;
            }
            return false;
        }

        // 更新逻辑
        function update(dt) {
            if (gameState !== 'playing') return;

            // 难度递增
            gameSpeed = baseSpeed + distance * 0.0015;
            if (gameSpeed > 14) gameSpeed = 14;
            distance += gameSpeed * dt * 60;

            // 玩家物理
            player.vy += player.gravity * dt * 60;
            player.y += player.vy * dt * 60;

            // 地面碰撞
            if (player.y >= player.yBase) {
                player.y = player.yBase;
                player.vy = 0;
                player.grounded = true;
                player.canDoubleJump = true;
            } else {
                player.grounded = false;
            }

            // 尘土粒子
            if (Math.random() < 0.3) emitDust();

            // 生成障碍
            obstacleTimer -= dt;
            if (obstacleTimer <= 0) {
                spawnObstacle();
                obstacleTimer = 0.9 + Math.random() * 1.4 - (gameSpeed * 0.02);
                if (obstacleTimer < 0.4) obstacleTimer = 0.4;
            }
            // 生成金币
            coinTimer -= dt;
            if (coinTimer <= 0) {
                spawnCoin();
                coinTimer = 1.2 + Math.random() * 1.0;
            }

            // 移动障碍和金币
            obstacles.forEach(ob => {
                ob.x -= gameSpeed * dt * 60;
                // 碰撞检测
                if (!ob.passed && rectCollide(player.x, player.y, player.w, player.h, ob.x, ob.y, ob.w, ob.h)) {
                    // 撞击
                    playSound('hit');
                    shakeIntensity = 8;
                    if (score > highScore) {
                        highScore = score;
                        localStorage.setItem('runHighScore', highScore);
                    }
                    gameState = 'gameover';
                }
                if (ob.x + ob.w < -30) ob.passed = true;
            });
            obstacles = obstacles.filter(ob => ob.x + ob.w > -50 && !ob.passed);

            // 金币移动和收集
            coins.forEach(c => {
                c.x -= gameSpeed * dt * 60;
                // 收集
                if (!c.collected && Math.hypot(c.x - (player.x+player.w/2), c.y - (player.y+player.h/2)) < c.r + 28) {
                    c.collected = true;
                    score += 10;
                    playSound('coin');
                    emitCoinBurst(c.x, c.y);
                }
            });
            coins = coins.filter(c => !c.collected && c.x > -50);

            // 更新粒子
            updateParticles(dt);
        }

        // 渲染循环
        function draw() {
            ctx.clearRect(0, 0, W, H);
            const shaking = applyShake();
            drawBackground();
            drawCoins();
            drawObstacles();
            drawPlayer();
            drawParticles();
            drawUI();
            if (shaking) ctx.restore();

            if (gameState === 'menu' || gameState === 'gameover' || gameState === 'paused') {
                drawOverlay();
            }

            frame++;
            requestAnimationFrame(() => {
                const now = performance.now() / 1000;
                const dt = Math.min(0.03, (now - lastTime));
                lastTime = now;
                if (gameState === 'playing') update(dt);
                draw();
            });
        }

        let lastTime = performance.now() / 1000;

        // 初始化
        // 初始菜单粒子
        for (let i = 0; i < 30; i++) {
            dustParticles.push({
                x: Math.random() * W,
                y: H - 30 + Math.random() * 20,
                vx: -Math.random() * 1 - 0.5,
                vy: 0,
                life: 2 + Math.random() * 3,
                size: 3 + Math.random() * 8,
                color: '#b0a088'
            });
        }
        draw();
    })();
</script>
</body>
</html>`
  },
  {
    title: '五子棋',
    category: 'puzzle',
    description: '五子棋对弈游戏，玩家对战AI',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>五子棋 · 对弈</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        body {
            background: #1a1e2e;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', system-ui, sans-serif;
            touch-action: none;
            overflow: hidden;
        }
        #game-container {
            background: #2d3448;
            border-radius: 32px;
            padding: 20px 20px 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 4px rgba(255,255,255,0.1);
            width: min(94vw, 600px);
            position: relative;
        }
        /* 顶部信息栏 */
        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 8px 18px;
            color: #e8ecf4;
        }
        .score-box {
            background: rgba(0,0,0,0.35);
            padding: 10px 18px;
            border-radius: 40px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 1px;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
            backdrop-filter: blur(4px);
        }
        .score-box span {
            color: #ffd966;
            margin-left: 6px;
            font-size: 18px;
        }
        .btn-group {
            display: flex;
            gap: 10px;
        }
        .icon-btn {
            background: rgba(255,255,255,0.1);
            border: none;
            color: #dfe6f0;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            backdrop-filter: blur(4px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            transition: 0.2s;
        }
        .icon-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.22); }
        
        /* 棋盘画布 */
        #board-canvas {
            display: block;
            margin: 0 auto;
            width: 100%;
            height: auto;
            border-radius: 24px;
            background: #e8d5b5;
            box-shadow: inset 0 0 15px #aa9f87, 0 12px 20px rgba(0,0,0,0.5);
            cursor: pointer;
            touch-action: none;
        }
        
        /* 操作提示 & 状态 */
        .status-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 12px 0;
            color: #bcc6da;
            font-size: 14px;
            font-weight: 500;
        }
        .turn-indicator {
            background: rgba(0,0,0,0.3);
            padding: 6px 16px;
            border-radius: 40px;
            font-size: 15px;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.3);
            letter-spacing: 0.5px;
        }
        .turn-indicator .dot {
            display: inline-block;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            margin-right: 8px;
            background: #f5efe6;
            box-shadow: 0 0 6px #fff4dc;
            vertical-align: middle;
        }
        .hint {
            background: rgba(0,0,0,0.25);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            color: #ccd7ec;
            display: flex;
            gap: 8px;
            align-items: center;
            backdrop-filter: blur(2px);
        }
        .hint kbd {
            background: #3e465c;
            border-radius: 6px;
            padding: 2px 8px;
            font-family: inherit;
            color: #ffd966;
            font-size: 12px;
        }
        
        /* 菜单遮罩 */
        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(18, 20, 32, 0.85);
            backdrop-filter: blur(6px);
            border-radius: 32px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 20;
            color: white;
            text-align: center;
            padding: 20px;
            transition: 0.2s;
        }
        .overlay.hidden { display: none; }
        .overlay h2 {
            font-size: 36px;
            font-weight: 800;
            margin-bottom: 12px;
            text-shadow: 0 6px 16px rgba(0,0,0,0.6);
            letter-spacing: 6px;
        }
        .overlay p {
            color: #aab6d2;
            font-size: 16px;
            margin-bottom: 28px;
        }
        .menu-btn {
            background: linear-gradient(145deg, #445, #334);
            border: none;
            color: white;
            font-size: 18px;
            font-weight: 600;
            padding: 14px 32px;
            margin: 8px;
            border-radius: 60px;
            width: 200px;
            box-shadow: 0 8px 0 #1f2430, 0 10px 20px rgba(0,0,0,0.4);
            transition: 0.08s linear;
            cursor: pointer;
            letter-spacing: 2px;
        }
        .menu-btn:active {
            transform: translateY(6px);
            box-shadow: 0 2px 0 #1f2430;
        }
        .menu-btn.small {
            width: auto;
            padding: 10px 24px;
            font-size: 16px;
            background: #3a4158;
        }
        .difficulty-group {
            display: flex;
            gap: 12px;
            margin: 10px 0 20px;
        }
        .difficulty-btn {
            background: #3d455e;
            padding: 10px 20px;
            border-radius: 40px;
            border: 2px solid transparent;
            color: #d0d9f0;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s;
        }
        .difficulty-btn.selected {
            border-color: #ffd966;
            background: #4b5470;
            color: white;
            box-shadow: 0 0 12px #ffd96655;
        }
        #final-score {
            font-size: 24px;
            margin: 12px 0;
        }
        .victory-icon { font-size: 48px; margin-bottom: 10px; }

        /* 粒子容器 (全局) */
        #fx-layer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
        }
        /* 震动 */
        .shake { animation: shake 0.3s; }
        @keyframes shake {
            0%,100%{transform: translate(0,0);}
            25%{transform: translate(4px,-4px);}
            50%{transform: translate(-3px,3px);}
            75%{transform: translate(2px,2px);}
        }
    </style>
</head>
<body>
    <div id="game-container">
        <!-- 顶部 -->
        <div class="top-bar">
            <div class="score-box">🏆 最高 <span id="high-score">0</span></div>
            <div class="btn-group">
                <button class="icon-btn" id="btn-restart" title="重新开始">↺</button>
                <button class="icon-btn" id="btn-pause" title="暂停/继续">⏸</button>
            </div>
        </div>
        <!-- 棋盘 -->
        <canvas id="board-canvas" width="560" height="560"></canvas>
        <!-- 状态栏 -->
        <div class="status-bar">
            <div class="turn-indicator"><span class="dot" id="turn-dot"></span><span id="turn-text">你的回合</span></div>
            <div class="hint"><kbd>P</kbd> 暂停 · <kbd>↺</kbd> 悔棋</div>
        </div>

        <!-- 开始菜单 -->
        <div class="overlay" id="start-overlay">
            <h2>⚫ 五子棋 ⚪</h2>
            <p>人机对弈 · 谁先五连？</p>
            <div class="difficulty-group">
                <button class="difficulty-btn" data-diff="easy">🍃 简单</button>
                <button class="difficulty-btn selected" data-diff="hard">🔥 困难</button>
            </div>
            <button class="menu-btn" id="btn-first">先手 (黑)</button>
            <button class="menu-btn" id="btn-second">后手 (白)</button>
            <p style="margin-top:20px; font-size:13px; color:#8d97b3;">WASD/触摸点击 · 落子</p>
        </div>

        <!-- 胜利/结束界面 -->
        <div class="overlay hidden" id="end-overlay">
            <div class="victory-icon" id="victory-icon">🏆</div>
            <h2 id="end-title">胜利</h2>
            <div id="final-score">得分 0</div>
            <button class="menu-btn" id="btn-replay">再来一局</button>
            <button class="menu-btn small" id="btn-menu">返回菜单</button>
        </div>

        <!-- 暂停界面 -->
        <div class="overlay hidden" id="pause-overlay">
            <h2>⏸ 已暂停</h2>
            <button class="menu-btn" id="btn-resume">继续</button>
            <button class="menu-btn small" id="btn-quit-pause">退出</button>
        </div>
    </div>
    <canvas id="fx-layer" width="0" height="0"></canvas>

    <script>
        (function(){
            // ---------- 初始化 ----------
            const canvas = document.getElementById('board-canvas');
            const ctx = canvas.getContext('2d');
            const fxCanvas = document.getElementById('fx-layer');
            const fxCtx = fxCanvas.getContext('2d');
            const container = document.getElementById('game-container');
            
            // 棋盘参数
            const BOARD_SIZE = 15;
            const CELL = canvas.width / (BOARD_SIZE + 1); // 约35
            const PAD = CELL;
            const OFFSET = CELL;
            
            // 游戏状态
            let board = Array(BOARD_SIZE).fill().map(()=>Array(BOARD_SIZE).fill(null)); // 'black'/'white'
            let currentPlayer = 'black'; // 黑先
            let gameOver = false;
            let isPaused = false;
            let AIThinking = false;
            let selectedDiff = 'hard';
            let playerColor = 'black'; // 玩家执子
            let history = []; // 悔棋用 {row,col,color}
            let lastMove = null; // {row,col,color}
            
            // 得分 & 最高分
            let score = 0;
            let highScore = parseInt(localStorage.getItem('gomoku_high')||'0');
            document.getElementById('high-score').innerText = highScore;
            
            // DOM 元素
            const startOverlay = document.getElementById('start-overlay');
            const endOverlay = document.getElementById('end-overlay');
            const pauseOverlay = document.getElementById('pause-overlay');
            const turnText = document.getElementById('turn-text');
            const turnDot = document.getElementById('turn-dot');
            
            // 音效引擎 (Web Audio)
            let audioCtx = null;
            function initAudio(){
                if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            function playTone(freq, duration=0.12, type='sine', vol=0.2, delay=0) {
                if(!audioCtx) return;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = type;
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(vol, audioCtx.currentTime + delay);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
                osc.connect(gain).connect(audioCtx.destination);
                osc.start(audioCtx.currentTime + delay);
                osc.stop(audioCtx.currentTime + delay + duration);
            }
            // 不同音效
            const sfx = {
                place: ()=>{ playTone(540,0.1,'triangle',0.18); playTone(720,0.08,'sine',0.1,0.02); },
                win: ()=>{ playTone(660,0.16,'sine',0.2); playTone(880,0.2,'sine',0.2,0.12); playTone(1100,0.3,'sine',0.15,0.25); },
                lose: ()=>{ playTone(300,0.2,'sawtooth',0.12); playTone(200,0.25,'sawtooth',0.12,0.15); },
                click: ()=>{ playTone(400,0.05,'square',0.08); },
                error: ()=>{ playTone(180,0.12,'sawtooth',0.1); }
            };
            
            // ---------- 绘制 ----------
            function drawBoard(){
                ctx.clearRect(0,0,canvas.width,canvas.height);
                // 背景渐变
                const grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
                grad.addColorStop(0,'#eadbb8');
                grad.addColorStop(1,'#cbb78c');
                ctx.fillStyle = grad;
                ctx.fillRect(0,0,canvas.width,canvas.height);
                
                // 网格线
                ctx.strokeStyle = '#4a3f2f';
                ctx.lineWidth = 1.5;
                for(let i=0; i<BOARD_SIZE; i++){
                    const pos = OFFSET + i*CELL;
                    ctx.beginPath();
                    ctx.moveTo(OFFSET, pos);
                    ctx.lineTo(OFFSET+(BOARD_SIZE-1)*CELL, pos);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(pos, OFFSET);
                    ctx.lineTo(pos, OFFSET+(BOARD_SIZE-1)*CELL);
                    ctx.stroke();
                }
                // 星位
                const stars = [3,7,11];
                ctx.fillStyle = '#4a3f2f';
                stars.forEach(r=>stars.forEach(c=>{
                    ctx.beginPath();
                    ctx.arc(OFFSET+r*CELL, OFFSET+c*CELL, 4, 0, Math.PI*2);
                    ctx.fill();
                }));
                
                // 棋子
                for(let r=0; r<BOARD_SIZE; r++){
                    for(let c=0; c<BOARD_SIZE; c++){
                        const color = board[r][c];
                        if(!color) continue;
                        const x = OFFSET + c*CELL;
                        const y = OFFSET + r*CELL;
                        drawPiece(x,y,color);
                    }
                }
                // 最后一步高亮
                if(lastMove){
                    const {row,col,color} = lastMove;
                    const x = OFFSET + col*CELL;
                    const y = OFFSET + row*CELL;
                    ctx.beginPath();
                    ctx.arc(x,y,CELL*0.5+3,0,Math.PI*2);
                    ctx.strokeStyle = '#ff5050';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            }
            
            function drawPiece(x,y,color){
                // 立体阴影
                ctx.shadowColor = 'rgba(0,0,0,0.4)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                const grad = ctx.createRadialGradient(x-4,y-4,2,x,y,CELL*0.6);
                if(color === 'black'){
                    grad.addColorStop(0,'#444');
                    grad.addColorStop(0.5,'#111');
                    grad.addColorStop(1,'#2b2b2b');
                } else {
                    grad.addColorStop(0,'#fafafa');
                    grad.addColorStop(0.5,'#e6e6e6');
                    grad.addColorStop(1,'#b0b0b0');
                }
                ctx.beginPath();
                ctx.arc(x,y,CELL*0.44,0,Math.PI*2);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.shadowColor = 'transparent';
                // 高光
                ctx.beginPath();
                ctx.arc(x-4,y-4,CELL*0.12,0,Math.PI*2);
                ctx.fillStyle = color==='black' ? '#666' : '#fff';
                ctx.fill();
            }
            
            // ---------- 胜负判定 ----------
            function checkWin(row,col,color){
                const directions = [[1,0],[0,1],[1,1],[1,-1]];
                for(let [dr,dc] of directions){
                    let count=1;
                    for(let s=1; s<5; s++){
                        const nr=row+dr*s, nc=col+dc*s;
                        if(nr<0||nr>=15||nc<0||nc>=15||board[nr][nc]!==color) break;
                        count++;
                    }
                    for(let s=1; s<5; s++){
                        const nr=row-dr*s, nc=col-dc*s;
                        if(nr<0||nr>=15||nc<0||nc>=15||board[nr][nc]!==color) break;
                        count++;
                    }
                    if(count>=5) return true;
                }
                return false;
            }
            
            // ---------- 悔棋 ----------
            function undo(){
                if(history.length<1 || gameOver || AIThinking) return;
                // 移除两步 (AI+玩家) 保证回到玩家回合
                for(let i=0;i<2 && history.length>0;i++){
                    const last = history.pop();
                    board[last.row][last.col] = null;
                }
                lastMove = history.length>0 ? history[history.length-1] : null;
                currentPlayer = playerColor;
                gameOver = false;
                drawBoard();
                updateTurn();
                sfx.click();
            }
            
            // ---------- AI 逻辑 ----------
            function aiMove(){
                if(gameOver || isPaused || AIThinking) return;
                const aiColor = playerColor==='black' ? 'white' : 'black';
                let empty = [];
                for(let r=0;r<15;r++) for(let c=0;c<15;c++) if(!board[r][c]) empty.push([r,c]);
                if(empty.length===0) return;
                
                AIThinking = true;
                setTimeout(()=>{
                    let move;
                    if(selectedDiff==='easy'){
                        // 随机
                        move = empty[Math.floor(Math.random()*empty.length)];
                    } else {
                        // 困难：尝试赢/堵玩家
                        move = getBestMove(aiColor);
                    }
                    if(!move) move = empty[Math.floor(Math.random()*empty.length)];
                    placePiece(move[0], move[1], aiColor, true);
                    AIThinking = false;
                }, 120);
            }
            
            function getBestMove(color){
                const opp = color==='black'?'white':'black';
                // 1. 直接获胜
                for(let r=0;r<15;r++) for(let c=0;c<15;c++){
                    if(!board[r][c]){
                        board[r][c]=color;
                        if(checkWin(r,c,color)) { board[r][c]=null; return [r,c]; }
                        board[r][c]=null;
                    }
                }
                // 2. 堵玩家
                for(let r=0;r<15;r++) for(let c=0;c<15;c++){
                    if(!board[r][c]){
                        board[r][c]=opp;
                        if(checkWin(r,c,opp)) { board[r][c]=null; return [r,c]; }
                        board[r][c]=null;
                    }
                }
                // 3. 中心偏好
                let best=null, bestScore=-1;
                for(let r=0;r<15;r++) for(let c=0;c<15;c++){
                    if(!board[r][c]){
                        let s = Math.random()*3;
                        if(Math.abs(r-7)+Math.abs(c-7) < 6) s+=5;
                        // 靠近已有棋子
                        for(let dr=-2; dr<=2; dr++) for(let dc=-2; dc<=2; dc++){
                            if(dr===0 && dc===0) continue;
                            if(board[r+dr]?.[c+dc]) s+=1.5;
                        }
                        if(s>bestScore){ bestScore=s; best=[r,c]; }
                    }
                }
                return best;
            }
            
            // ---------- 落子 ----------
            function placePiece(row,col,color, isAI=false){
                if(row<0||row>=15||col<0||col>=15||board[row][col] || gameOver || isPaused) return false;
                board[row][col] = color;
                history.push({row,col,color});
                lastMove = {row,col,color};
                drawBoard();
                sfx.place();
                updateTurn();
                
                if(checkWin(row,col,color)){
                    gameOver = true;
                    // 粒子特效 + 震动
                    spawnParticles(OFFSET+col*CELL, OFFSET+row*CELL, color);
                    container.classList.add('shake');
                    setTimeout(()=>container.classList.remove('shake'), 300);
                    
                    if(color === playerColor){
                        score += 100;
                        if(score>highScore){ highScore=score; localStorage.setItem('gomoku_high', highScore); }
                        document.getElementById('high-score').innerText = highScore;
                        sfx.win();
                        showEnd(true);
                    } else {
                        score = Math.max(0, score-30);
                        sfx.lose();
                        showEnd(false);
                    }
                    return true;
                }
                
                // 交换回合
                currentPlayer = (color==='black' ? 'white' : 'black');
                if(!isAI && currentPlayer !== playerColor){
                    aiMove();
                }
                return true;
            }
            
            // 更新 UI 回合
            function updateTurn(){
                if(gameOver) return;
                const p = currentPlayer;
                turnDot.style.background = p==='black' ? '#222' : '#f0f0f0';
                turnText.innerText = (p===playerColor) ? '你的回合' : 'AI思考中...';
            }
            
            // 胜利/失败界面
            function showEnd(isWin){
                document.getElementById('victory-icon').innerText = isWin ? '🏆' : '😵';
                document.getElementById('end-title').innerText = isWin ? '胜利！' : '失败';
                document.getElementById('final-score').innerText = \`得分 \${score}\`;
                endOverlay.classList.remove('hidden');
            }
            
            // 粒子特效
            function spawnParticles(x,y,color){
                fxCanvas.width = window.innerWidth;
                fxCanvas.height = window.innerHeight;
                const parts = 30;
                for(let i=0;i<parts;i++){
                    const angle = Math.random()*Math.PI*2;
                    const vel = 3+Math.random()*5;
                    const life = 40+Math.random()*40;
                    const p = {
                        x: x+canvas.getBoundingClientRect().left,
                        y: y+canvas.getBoundingClientRect().top,
                        vx: Math.cos(angle)*vel,
                        vy: Math.sin(angle)*vel,
                        life, maxLife:life,
                        size: 3+Math.random()*5,
                        color: color==='black' ? '#333' : '#eee'
                    };
                    particles.push(p);
                }
                if(!particleAnim) particleAnim = requestAnimationFrame(animateParticles);
            }
            let particles = [];
            let particleAnim = null;
            function animateParticles(){
                fxCtx.clearRect(0,0,fxCanvas.width,fxCanvas.height);
                particles = particles.filter(p=>p.life>0);
                particles.forEach(p=>{
                    p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life--;
                    fxCtx.globalAlpha = Math.max(0, p.life/p.maxLife);
                    fxCtx.beginPath();
                    fxCtx.arc(p.x,p.y,p.size,0,Math.PI*2);
                    fxCtx.fillStyle = p.color;
                    fxCtx.fill();
                });
                if(particles.length===0){
                    cancelAnimationFrame(particleAnim);
                    particleAnim=null;
                    fxCtx.clearRect(0,0,fxCanvas.width,fxCanvas.height);
                } else {
                    particleAnim = requestAnimationFrame(animateParticles);
                }
            }
            
            // ---------- 交互 ----------
            function canvasClick(e){
                if(gameOver || isPaused || AIThinking || startOverlay.classList.contains('hidden')===false) return;
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width/rect.width;
                const scaleY = canvas.height/rect.height;
                const mx = (e.clientX-rect.left)*scaleX;
                const my = (e.clientY-rect.top)*scaleY;
                const col = Math.round((mx - OFFSET)/CELL);
                const row = Math.round((my - OFFSET)/CELL);
                if(row>=0&&row<15&&col>=0&&col<15&&currentPlayer===playerColor){
                    placePiece(row,col,playerColor,false);
                }
            }
            
            // 触摸 & 鼠标
            canvas.addEventListener('click', canvasClick);
            canvas.addEventListener('touchstart', (e)=>{
                e.preventDefault();
                const touch = e.touches[0];
                canvasClick({clientX:touch.clientX, clientY:touch.clientY});
            }, {passive:false});
            
            // 键盘
            document.addEventListener('keydown', (e)=>{
                if(e.key==='p'||e.key==='P'||e.key==='Escape'){ togglePause(); }
                if(e.key==='r'||e.key==='R'){ resetGame(); }
            });
            
            // 按钮事件
            document.getElementById('btn-restart').addEventListener('click', ()=>{ resetGame(); sfx.click(); });
            document.getElementById('btn-pause').addEventListener('click', togglePause);
            document.getElementById('btn-replay').addEventListener('click', ()=>{ endOverlay.classList.add('hidden'); resetGame(); sfx.click(); });
            document.getElementById('btn-menu').addEventListener('click', ()=>{ endOverlay.classList.add('hidden'); startOverlay.classList.remove('hidden'); resetGame(false); sfx.click(); });
            document.getElementById('btn-resume').addEventListener('click', ()=>{ pauseOverlay.classList.add('hidden'); isPaused=false; sfx.click(); });
            document.getElementById('btn-quit-pause').addEventListener('click', ()=>{ pauseOverlay.classList.add('hidden'); isPaused=false; startOverlay.classList.remove('hidden'); resetGame(false); });
            
            document.querySelectorAll('.difficulty-btn').forEach(btn=>{
                btn.addEventListener('click', ()=>{
                    document.querySelectorAll('.difficulty-btn').forEach(b=>b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedDiff = btn.dataset.diff;
                    sfx.click();
                });
            });
            
            document.getElementById('btn-first').addEventListener('click', ()=>{
                playerColor='black'; startGame(); sfx.click();
            });
            document.getElementById('btn-second').addEventListener('click', ()=>{
                playerColor='white'; startGame(); sfx.click();
            });
            
            function startGame(){
                initAudio();
                startOverlay.classList.add('hidden');
                resetGame(true);
                if(playerColor==='white'){
                    currentPlayer='white';
                    aiMove();
                }
            }
            
            function resetGame(keepScore=true){
                board = Array(15).fill().map(()=>Array(15).fill(null));
                history = [];
                lastMove = null;
                gameOver = false;
                AIThinking = false;
                currentPlayer = playerColor;
                if(!keepScore) score = 0;
                drawBoard();
                updateTurn();
                endOverlay.classList.add('hidden');
                pauseOverlay.classList.add('hidden');
                isPaused = false;
            }
            
            function togglePause(){
                if(gameOver || startOverlay.classList.contains('hidden')===false) return;
                isPaused = !isPaused;
                if(isPaused) pauseOverlay.classList.remove('hidden');
                else pauseOverlay.classList.add('hidden');
                sfx.click();
            }
            
            // 初始化绘制
            drawBoard();
            updateTurn();
            
            // 窗口尺寸适配粒子
            window.addEventListener('resize', ()=>{});
        })();
    </script>
</body>
</html>`
  }
];


// ============================================
// 数据库操作
// ============================================

// seed 函数：可被 server.js 直接调用，也可独立运行
function seedGames(done) {
  console.log(`准备插入 ${DEMO_GAMES.length} 个演示游戏...`);

  // Check if demo games already exist
  const existing = all("SELECT COUNT(*) as cnt FROM games WHERE user_id = 0");
  if (existing[0] && existing[0].cnt > 0) {
    console.log('演示游戏已存在，跳过。');
    if (done) done();
    return;
  }

  let inserted = 0;
  const now = new Date().toISOString();

  DEMO_GAMES.forEach(game => {
    try {
      run(
        `INSERT INTO games (user_id, title, description, category, html_code, is_public, watermark_removed, plays, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?)`,
        [0, game.title, game.description, game.category, game.html, Math.floor(Math.random() * 50), now, now]
      );
      inserted++;
      console.log(`  ✓ ${game.title} (${game.category})`);
    } catch (err) {
      console.error(`  ✗ ${game.title}: ${err.message}`);
    }
  });

  console.log(`完成！成功插入 ${inserted}/${DEMO_GAMES.length} 个演示游戏。`);
  if (done) done();
}

// 独立运行时：初始化 DB 然后 seed
if (require.main === module) {
  initDb(() => {
    seedGames(() => process.exit(0));
  });
}

module.exports = { seedGames };
