# Changelog

本项目所有重要变更都记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-05-15

### Added
- 🎮 AI 游戏生成核心功能（基于 DeepSeek V4 Pro）
- 👤 用户注册 / 登录系统（JWT 认证）
- 💎 积分配额体系（Free / Pro / Enterprise 三档）
- 💳 Stripe 订阅支付集成
- 🔗 分享 & 邀请奖励机制
- 🎯 18 个内置演示游戏（首次启动自动 seed）
- 🏠 游戏大厅与个人中心
- 🚀 Zeabur / Fly.io 一键部署支持
- 📦 SQLite 自动初始化数据库
- 📝 完整的部署指南（DEPLOY.md）

### Tech
- 后端：Node.js + Express
- 数据库：SQLite (sql.js)
- 前端：原生 HTML/CSS/JS
- AI：DeepSeek V4 Pro
- 支付：Stripe

---

## [Unreleased]

### Planned
- [ ] 游戏模板市场（用户分享自制游戏）
- [ ] 多人在线对战支持
- [ ] 游戏导出为 APK / 小程序
- [ ] 支持更多 AI 模型（GPT-4o、Claude 等）
- [ ] 游戏编辑器（可视化微调生成结果）
- [ ] 国际化（i18n）支持
