# 贡献指南

感谢你对 PromptToPlay 的关注！我们欢迎所有形式的贡献，无论是代码、文档、Bug 报告还是功能建议。

## 📋 贡献方式

### 1. 报告 Bug

如果你发现了 Bug，请在 [Issues](https://github.com/shuo-x1/prompttoplay/issues) 中提交，包含以下信息：

- **复现步骤**：详细描述如何复现该问题
- **预期行为**：你认为正确的行为是什么
- **实际行为**：实际发生了什么
- **环境信息**：操作系统、Node.js 版本、浏览器等
- **截图/日志**：如有，请附上

### 2. 提议新功能

有好的想法？欢迎在 Issues 中用 `[Feature Request]` 标签提交，说明：

- 功能描述
- 使用场景
- 可能的实现方案（可选）

### 3. 贡献代码

#### 开发流程

1. **Fork 并克隆**
   ```bash
   git clone https://github.com/你的用户名/prompttoplay.git
   cd prompttoplay
   npm install
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/你的功能名
   # 或修复 bug
   git checkout -b fix/问题描述
   ```

3. **编写代码**
   - 遵循现有代码风格
   - 添加必要的注释
   - 确保不破坏现有功能

4. **本地测试**
   ```bash
   npm start
   # 访问 http://localhost:3000 验证功能
   ```

5. **提交并推送**
   ```bash
   git add .
   git commit -m "feat: 添加某某功能"
   git push origin feature/你的功能名
   ```

6. **发起 Pull Request**
   - 在 GitHub 上创建 PR
   - 详细描述改动内容和原因
   - 关联相关 Issue（如有）

#### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat: 新增功能描述
fix: 修复问题描述
docs: 文档更新
style: 代码格式调整（不影响逻辑）
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建/工具/依赖相关
```

#### 代码规范

- 使用 2 空格缩进
- 字符串优先使用单引号
- 注释使用中文或英文均可，但要清晰易懂
- 前端代码保持原生 JS，不引入框架依赖
- API 路由放在 `routes/`，业务逻辑放在 `services/`

## 📝 文档贡献

文档同样重要！如果你发现文档有错误、不清晰或需要补充，欢迎提交 PR 修改：

- README.md
- DEPLOY.md
- 代码注释
- Wiki（未来）

## ❓ 有问题？

如果在贡献过程中遇到问题，可以：

- 在 Issues 中提问
- 查看现有代码和文档

再次感谢你的贡献！🎉
