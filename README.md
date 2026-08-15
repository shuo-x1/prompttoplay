<div align="center">

# 🎮 PromptToPlay

**用一句话，生成一个可玩的 HTML5 游戏**

AI-powered HTML5 game generator — 输入自然语言描述，DeepSeek 帮你写出完整可玩的网页游戏。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![DeepSeek](https://img.shields.io/badge/AI-DeepSeek%20V4%20Pro-blue.svg)](https://platform.deepseek.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

[功能特性](#-功能特性) · [快速开始](#-快速开始) · [部署指南](#-部署) · [技术栈](#-技术栈) · [路线图](#-路线图)

</div>

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🤖 **AI 游戏生成** | 基于 DeepSeek V4 Pro，输入描述即可生成完整 HTML5 游戏 |
| 🎯 **18 个内置演示游戏** | 开箱即用，首次启动自动 seed，直接体验效果 |
| 👤 **用户系统** | 注册 / 登录 / JWT 认证，个人中心管理游戏 |
| 💎 **积分配额体系** | 免费版 3 次/天，Pro 版 $9.90/月 400 次，企业版 3000 次/月 |
| 🔗 **分享 & 邀请奖励** | 分享 +1 次/天，邀请好友首次生成 +1 次 |
| 💳 **Stripe 支付** | 内置 Stripe 订阅支付，Webhook 自动开通 |
| 🚀 **一键部署** | 支持 Zeabur（国内推荐）、Fly.io、Docker 等多种部署方式 |
| 📦 **零配置数据库** | SQLite 自动初始化，无需额外安装数据库 |

## 🎯 它能生成什么游戏？

PromptToPlay 可以生成各类轻量级 HTML5 游戏，例如：

- 贪吃蛇、俄罗斯方块、2048 等经典休闲游戏
- 打砖块、飞机大战、射击类游戏
- 迷宫、解谜、益智类游戏
- 简单的平台跳跃、跑酷游戏
- 卡牌、文字冒险类游戏

> 生成的游戏为单文件 HTML，可直接在浏览器运行，也可导出分享。

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- DeepSeek API Key（[免费申请](https://platform.deepseek.com/)）

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/shuo-x1/prompttoplay.git
cd prompttoplay

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY 和 JWT_SECRET

# 3. 安装依赖
npm install

# 4. 启动服务
npm start
```

服务启动后访问 **http://localhost:3000** 即可使用。

> 首次启动会自动创建 SQLite 数据库并 seed 18 个演示游戏。

## ⚙️ 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DEEPSEEK_API_KEY` | ✅ | — | DeepSeek API 密钥 |
| `JWT_SECRET` | ✅ | — | JWT 签名密钥（任意长字符串） |
| `STRIPE_SECRET_KEY` | ❌ | — | Stripe 支付密钥（不填则禁用支付） |
| `STRIPE_WEBHOOK_SECRET` | ❌ | — | Stripe Webhook 签名密钥 |
| `PORT` | ❌ | `3000` | 服务端口 |
| `DOMAIN` | ❌ | — | 公开域名（Stripe 回调需要） |
| `DEV_MODE` | ❌ | `true` | 开发模式开关 |

## 💎 配额系统

| 套餐 | 价格 | 生成次数 | 额外获取方式 |
|------|------|----------|-------------|
| **Free** | 免费 | 3 次 / 天 | 分享 +1/天，邀请 +1/次 |
| **Pro** | $9.90 / 月 | 400 次 / 月 | — |
| **Enterprise** | 联系定制 | 3000 次 / 月 | 专属支持 |

## 📦 部署

详细部署指南请参考 [DEPLOY.md](./DEPLOY.md)，包含三种方案：

- **Zeabur**（推荐，国内可直接访问，有免费额度）
- **Fly.io**（完全免费，需命令行操作）
- **本地内网穿透**（Cloudflare Tunnel / ngrok，临时演示用）

也提供了一键部署脚本：
- `deploy-zeabur.bat` — Windows 一键部署到 Zeabur
- `deploy-fly.bat` — Windows 一键部署到 Fly.io

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Express |
| 数据库 | SQLite (sql.js，纯 JS 实现，无需原生依赖) |
| 前端 | 原生 HTML / CSS / JavaScript（无框架，零构建） |
| AI | DeepSeek V4 Pro |
| 认证 | JWT + bcryptjs |
| 支付 | Stripe |
| 部署 | Zeabur / Fly.io / Docker |

## 📁 项目结构

```
prompttoplay/
├── config/          # 数据库配置与初始化
├── middleware/      # Express 中间件（认证等）
├── public/          # 前端静态文件
│   ├── index.html   # 首页 / 游戏生成页
│   ├── hall.html    # 游戏大厅
│   ├── game.html    # 游戏播放页
│   ├── auth.html    # 登录注册
│   ├── profile.html # 个人中心
│   ├── app.js       # 前端逻辑
│   └── style.css    # 样式
├── routes/          # API 路由
│   ├── auth.js      # 认证接口
│   ├── user.js      # 用户接口
│   ├── games.js     # 游戏生成与管理
│   ├── payment.js   # Stripe 支付
│   └── share.js     # 分享与邀请
├── services/        # 业务逻辑层
├── scripts/         # 脚本（seed 演示游戏等）
├── server.js        # 入口文件
├── .env.example     # 环境变量模板
├── DEPLOY.md        # 部署指南
├── fly.toml         # Fly.io 配置
└── Procfile         # 进程配置
```

## 🗺 路线图

- [x] AI 游戏生成核心功能
- [x] 用户系统与 JWT 认证
- [x] 积分配额与 Stripe 支付
- [x] 分享 & 邀请奖励
- [x] 18 个内置演示游戏
- [x] Zeabur / Fly.io 一键部署
- [ ] 游戏模板市场（用户分享自制游戏）
- [ ] 多人在线对战支持
- [ ] 游戏导出为 APK / 小程序
- [ ] 支持更多 AI 模型（GPT-4o、Claude 等）
- [ ] 游戏编辑器（可视化微调生成结果）
- [ ] 国际化（i18n）支持

> 欢迎提交 Issue 提议新功能！

## 🤝 贡献 <a name="contributing"></a>

欢迎贡献代码！请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

---

<div align="center">

如果这个项目对你有帮助，欢迎给个 ⭐ Star 支持一下！

Made with ❤️ by [shuo-x1](https://github.com/shuo-x1)

</div>
