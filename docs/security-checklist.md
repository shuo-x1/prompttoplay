# 安全自查清单

> 目的：AI 生成 / 补全的代码很容易带着「看着能跑但默认不安全」的写法上线。
> 每次功能改动后按这张表过一遍，逐项确认或明确记录「未做」。

## 1. 密钥与配置

- [x] `.env` 不进仓库（`.gitignore` 已忽略），仓库里只有 `.env.example` 占位
- [x] 全仓库检索 `sk-`，无明文 Key
- [x] 服务端 Key 不下发到前端：体验版走「用户自己的 Key 存 localStorage、浏览器直连 DeepSeek」
- [x] 缺配置时**降级启动**（警告），而不是内置一个默认密钥

## 2. 生成代码的执行隔离（本项目最要紧的一条）

模型产出的是一整份 HTML + JS，属于**不可信代码**，必须当成第三方脚本对待：

- [x] 一律在 `sandbox` iframe 里运行，不直接写进父页面 DOM
- [x] **不给 `allow-same-origin`**：一旦 `allow-scripts` 与 `allow-same-origin` 同时存在，iframe 与页面同源，可以读走 `localStorage` 里的 JWT（等于账号接管），也能反向操作父页面
- [x] 沙箱内 `localStorage` 不可用 → 注入内存版兜底，避免游戏写最高分时抛 `SecurityError` 白屏
- [x] 三个预览入口（首页生成、详情页、积分换水印后重渲染）统一走 `renderGameFrame()`，避免有人漏改

## 3. XSS

- [x] 所有进入 `innerHTML` 的用户内容（游戏标题 = 用户 prompt 截断、简介、创作者邮箱）统一 `escapeHtml()`，**包含引号**转义（属性值场景也安全）
- [x] 详情页标题用 `textContent`，不走 HTML 拼接
- [x] 封面图在服务端生成时已过滤 `<>"'`

## 4. 认证与授权

- [x] JWT + bcrypt，token 只放 `Authorization` 头
- [x] 改 / 删 / 换水印都校验 `game.user_id === req.user.id`，否则 403
- [x] 订单确认校验归属（别人的订单号改不了）
- [x] 免登录的 `/api/demo/generate` 不写库、不扣配额，单独限流 5 次/分钟

## 5. 输入与注入

- [x] SQL 全部参数化（`?` 占位符）；动态片段只剩固定白名单排序键和固定 `WHERE` 片段（逐处确认过）
- [x] 请求体上限 2 MB
- [x] prompt 长度校验（体验版 500 字上限）
- [x] 简单 IP 限流：全局 60 次/分钟、生成 10 次/分钟

## 6. 依赖与响应头

- [x] 安全响应头：`X-Content-Type-Options: nosniff`、`X-Frame-Options: SAMEORIGIN`、`Referrer-Policy`
- [x] 没有开 `Access-Control-Allow-Origin: *`
- [x] `npm audit` 结果记录在案（见下），升级另行安排

## 7. 本次修复记录

| 问题 | 风险 | 修复 |
| --- | --- | --- |
| iframe 同时给了 `allow-scripts` + `allow-same-origin` | 生成代码可读走 `localStorage` 里的登录 token → 账号接管 | 去掉 `allow-same-origin`，注入 `localStorage` 兜底，三个入口统一走 `renderGameFrame()`；回归测试见 `test/security.test.js`（含「旧写法」对照组） |
| 首页「热门游戏」用 `innerHTML` 直接拼 `game.title` / `description` | 存储型 XSS（标题来自用户 prompt） | 统一 `escapeHtml()`（含引号）；`test/security.test.js` 覆盖 |
| 大厅 / 个人中心各自复制了一份 `escapeHtml`，不转义引号 | 属性注入 | 收口到 `public/app.js` 一份实现 |

## 8. 已知未做（不粉饰）

- 没有 CSP / SRI，静态页可以再补一层 meta CSP
- 登录态在 `localStorage`，XSS 一旦成立就能偷 token；更稳的做法是 httpOnly Cookie + CSRF token
- `npm audit` 待处理：`body-parser`（DoS）、`proxy-addr`（IP 欺骗）,来自 express 4.21 的传递依赖，需要评估升级到 express 5
- 生成结果没有服务端扫描（例如禁止 `fetch` 外链、限制 `window.open`），目前只靠沙箱兜底
