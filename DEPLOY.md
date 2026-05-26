# PromptToPlay 部署指南

> Gitee 仓库: https://gitee.com/zhang-hangshuo051117/prompttoplay

---

## 方案一：Zeabur（推荐！国内可直接访问）

Zeabur 支持中文界面、Gitee 仓库、有免费额度，最适合国内用户。

### 步骤：

1. **注册账号**
   - 打开 https://zeabur.com
   - 用 GitHub 或邮箱注册

2. **创建项目**
   - 登录后点击「创建项目」
   - 选择「从 Git 仓库部署」
   - 输入 Gitee 地址：`https://gitee.com/zhang-hangshuo051117/prompttoplay.git`

3. **设置环境变量**
   - 部署前点击「变量」
   - 添加以下变量：
   ```
   DEEPSEEK_API_KEY = 你的DeepSeek API密钥
   JWT_SECRET = 随便一个长字符串，比如 ptp2026securekey123
   PORT = 8080
   DEV_MODE = false
   DOMAIN = https://你的zeabur域名
   ```

4. **部署**
   - 点击「部署」
   - 等待 1-2 分钟构建完成
   - Zeabur 会自动分配一个公网 URL

### 费用：
- 免费额度：$5/月（约 ¥35/月）
- 对小项目完全够用

---

## 方案二：Fly.io 免费部署（完全免费）

Fly.io 提供免费额度：3 台虚拟机 + 1GB 持久化存储。但需要安装命令行工具。

### 第一步：安装 flyctl（需要能访问 GitHub）

打开 PowerShell，运行：
```powershell
winget install Fly-io.flyctl
```
或（如果 winget 不行）：
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**注意**：安装需要能连接 GitHub，可能需要开代理/VPN。
安装后**重新打开终端**，运行 `flyctl version` 验证。

### 第二步：注册并登录
```powershell
flyctl auth register
```
在浏览器中完成注册。

### 第三步：部署
```powershell
cd C:\Users\lenovo123456\prompttoplay

flyctl apps create prompttoplay --region hkg
flyctl secrets set DEEPSEEK_API_KEY=你的密钥
flyctl secrets set JWT_SECRET=ptp2026securekey123
flyctl secrets set DEV_MODE=false
flyctl volumes create prompttoplay_data --region hkg --size 1
flyctl deploy
```

成功后会得到地址：`https://prompttoplay.fly.dev`

---

## 方案三：本地内网穿透（临时演示用）

让别人临时访问你电脑上的项目（免费）：

### Cloudflare Tunnel（推荐）：
```powershell
# 安装
winget install Cloudflare.cloudflared

# 运行
cloudflared tunnel --url http://localhost:3000
```
会得到一个公网 URL。

### ngrok：
1. 注册 https://ngrok.com
2. 下载客户端
3. 运行 `ngrok http 3000`

---

## 项目信息

| 项目 | 值 |
|------|-----|
| Gitee 仓库 | https://gitee.com/zhang-hangshuo051117/prompttoplay |
| 本地端口 | http://localhost:3000 |
| 数据库 | SQLite（自动初始化） |
| 启动命令 | `node server.js` |
| 环境变量 | DEEPSEEK_API_KEY, JWT_SECRET, PORT, DEV_MODE, DOMAIN |
