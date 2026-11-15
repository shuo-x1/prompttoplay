# PromptToPlay · 项目说明（给评审看的版本）

> 面向面试 / 评审的补充材料：这个项目做了什么、哪些是我做的、怎么验证、哪里还不够好。
>
> 在线试玩：<https://shuo-x1.github.io/prompttoplay/> · 源码：<https://github.com/shuo-x1/prompttoplay>

## 1. 一句话说清

输入一句中文描述 → DeepSeek 生成一整份可玩的 HTML5 游戏（单文件，约 40 KB / 1000+ 行）→ 浏览器里直接玩、下载、分享。外面再包一层产品：账号、每日配额、积分充值、游戏大厅、分享邀请。

## 2. 我负责什么，AI 负责什么

不夸大，按真实情况说：

- **产品定义、信息架构、数据表设计、提示词体系、验收标准、部署方案**：本人。
- **代码实现**：主要由 AI（Codex / DeepSeek）按我的拆解产出，我逐段读懂、改、跑通之后才接受。
- 我不会声称「每一行都是手写」。我能保证的是：任意打开一个文件，能讲清它为什么存在、关键路径怎么走、出问题去哪查、怎么改对。

## 3. 技术上我具体做了什么（都能在代码里对上）

**① 提示词引擎 —— 把「一句话」变成可控的工程输入**（`web/prompt.js`）

- 关键词 → 9 种游戏类型，各自追加专属玩法要求（射击要有 BOSS/连击，闯关要有移动平台，三消要特殊棋子……）
- Juice System：屏幕震动、命中停顿、粒子、浮动文字、Web Audio 合成音效、挤压拉伸、缓动函数，全部写成可直接照抄的清单
- 8 套视觉风格（霓虹 / 像素 / 糖果 / 水墨 / 海洋……），每套给到具体色值和绘制规则
- 输出硬约束：只返回 ` ```html ` 代码块、禁用外部资源、必须完整写到 `</html>`

**② 生成链路的健壮性**（`services/deepseek.js`、`routes/games.js`）

- 180 秒超时（`AbortController`），超时给出可读提示
- 「没返回 HTML」和「输出被截断」分开判断，失败自动回滚已扣配额（`refundQuota`）
- `max_tokens` 16000 → 32000，并检查 `finish_reason === 'length'`

**③ 在线体验版**（`web/`，纯静态，可直接 GitHub Pages）

- 两条路径：示例体验（不发请求，直接玩预生成成品）/ 实时生成（浏览器直连 DeepSeek，BYO Key）
- Key 只存 `localStorage`，请求从浏览器直发，不经过任何第三方
- 本地跑完整版时自动探测 `/api/demo/health`，切到同源代理，Key 留在服务端
- 生成结果在 `sandbox` iframe 中渲染，并注入内存版 `localStorage` 兜底，防止游戏因沙箱抛异常白屏

**④ 安全评审**（`docs/security-checklist.md`）

- 把「模型产出的代码」当不可信脚本：沙箱 iframe 运行、不给 `allow-same-origin`
- 修掉一个真实隐患：原来 `sandbox="allow-scripts allow-same-origin"`，生成代码可以读走 `localStorage` 里的登录 token → 已改
- 修掉存储型 XSS：首页热门游戏用 `innerHTML` 直接拼 `game.title`（标题来自用户 prompt）→ 统一 `escapeHtml`（含引号）
- 逐项确认：密钥不进仓库、SQL 全参数化、改/删游戏校验 owner、`npm audit` 结果记录在案

**⑤ 让别人能直接跑起来**

- 缺 `DEEPSEEK_API_KEY` 不再 `process.exit(1)`，降级启动
- 新增 `/api/demo/generate`：免登录、不写库、不扣配额、限流 5 次/分钟
- Windows 双击 `启动.cmd`；`npm run check-demos` 静态自检（不用开浏览器）

## 4. 我自己发现并修掉的问题（最能说明「检查过」）

| 问题 | 怎么发现的 | 怎么修 |
| --- | --- | --- |
| 长游戏被截断，返回半份 HTML（没有 `</html>`） | 生成的横版闯关文件末尾停在半个绘制函数 | `max_tokens` 提到 32000 + 检测 `finish_reason` 明确报错 + 提示词要求完整收尾；重新生成 45 KB 完整文件 |
| 内置「飞机大战」一运行就 `SyntaxError` | 写了 `scripts/check-demos.js` 用 `vm.Script` 静态解析，报 `Unexpected token ')'` | 定位到多写一个右括号，修掉；现在 11/11 通过 |
| README 写着 Stripe 支付，代码里根本没有 Stripe | 核对 `package.json` 与 `services/payment.js` | 改成「积分 + 订单流水，`DEV_MODE` 模拟到账」，真实支付列入路线图 |
| 没有 `.env` 服务就起不来 | 在干净环境照 README 走一遍 | 降级启动 + 体验版免登录接口 |
| 沙箱 iframe 里 `localStorage` 抛 `SecurityError`，游戏白屏 | 本地打开生成结果，看控制台 | 预览时注入内存版 `localStorage` |

## 5. 怎么验证（每条 30 秒内）

1. 打开在线版 → 点任意示例 → 有开始界面、能操作、有音效、有暂停/结算。
2. 在线版切「实时生成」→ 填自己的 DeepSeek Key → 输入一句话 → 20~60 秒后右侧出现新游戏；点「下载 HTML」，下载的文件双击能独立运行。
3. 本地：`git clone` → `npm install && npm start` → <http://localhost:3000/demo>（不需要 `.env`）。
4. `npm run check-demos` → `11/11 个游戏通过检查`。
5. `curl http://localhost:3000/api/health` → `{"status":"ok",...}`。

## 6. 实测数据（2026-11，本机）

| 场景 | 耗时 | 体积 | tokens | 成本 |
| --- | --- | --- | --- | --- |
| 霓虹赛博太空射击（含 BOSS/连击） | 49.3 s | 41 KB | 17.6k | ≈ ¥0.033 |
| 像素风横版闯关（移动平台/BOSS） | 59.2 s | 45 KB | 18.1k | ≈ ¥0.039 |
| 浏览器端实时生成（街机射击） | 52.9 s | 42 KB / 1263 行 | — | ≈ ¥0.03 |

浏览器端到端验证（Edge + Playwright 无头）：示例卡片 11 个、点击后 iframe 内出现 canvas、实时生成成功、下载按钮可用、控制台无 JS 报错。

## 7. 自动化测试现状

- `npm test`：3 条用例，约 5 秒，不需要 Key、不需要数据库
  - 安全回归：沙箱里的生成代码读不到父页面 `localStorage`（**带「旧写法」对照组**，保证这条测试真的能抓到回归）+ `escapeHtml` 转义
  - 冒烟：起真实服务 → 体验版画廊 → 点开示例后 iframe 内渲染出 canvas、无未捕获异常
- `npm run check-demos`：11 个示例游戏的完整性与内联脚本语法
- **CI 还未接入**：token 缺 `workflow` 权限，`.github/workflows/*` 推不上去；workflow 文件已经写好放在 [docs/ci.md](ci.md)，补权限或网页手动加即可
- 没做的：覆盖率、视觉回归、真实 DeepSeek 的端到端用例（要花钱且不可重复，只在发版前手跑）

## 8. 已知不足（不粉饰）

- 没有覆盖率统计，测试用的是 Node 内置 `node --test`，报告比较朴素。
- 真实支付渠道未接，`DEV_MODE` 下是模拟到账。
- 数据层是单机 SQLite（sql.js），无法多实例横向扩展；配额扣减是「读-改-写」，并发下需要事务或原子更新。
- 生成质量依赖模型，偶尔出现玩法单薄或小逻辑 bug；没有分级评测集。
- 前端是原生 JS，规模再大需要组件化。

## 9. 如果继续做

1. 建 20~30 条评测集（提示词 → 期望玩法），模型换代时做回归对比。
2. 生成结果加一层「静态可玩性检查 + 首屏截图对比」。
3. SQLite 换 Postgres，配额/积分走事务。
4. 接真实支付（Stripe / 微信支付），替换模拟到账。
5. 前端抽成组件（Vite + 原生组件或 React），支持「在生成结果上继续改」的可视化编辑。
