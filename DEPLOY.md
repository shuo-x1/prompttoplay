# PromptToPlay 部署指南

> 代码已推送到 Gitee: https://gitee.com/zhang-hangshuo051117/prompttoplay
> 以下提供 3 种免费部署方案，按推荐顺序排列

---

## 方案一：Render.com（推荐，最简单）

### 步骤：
1. 打开 https://render.com 注册账号（可以用 GitHub 注册）
2. 登录后点击 **"New"** → **"Web Service"**
3. 点击 **"Connect a repository"** → 但 Render 需要 GitHub...
   - **替代方法**：Render 也支持直接上传代码
   - 或者使用 Render 的 **Blueprint** 功能

### 算了，Render 也需要 GitHub...

---

## 方案二：Vercel（免费，支持自定义后端）

### 步骤：
1. 打开 https://vercel.com 用 GitHub 账号登录
2. 如果没有 GitHub，可以先用邮箱注册 Vercel
3. **Vercel 不适合 Node.js 后端 + SQLite**（只支持无状态）
4. ❌ 不推荐

---

## 方案三：Fly.io 免费部署（最佳方案）

Fly.io 提供 3 台免费虚拟机，完美支持 Node.js + SQLite。

### 第一步：安装 flyctl

**方法 A - 科学上网后安装（推荐）：**
打开 PowerShell，运行：
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**方法 B - 手动下载：**
1. 用浏览器（开启代理/VPN）打开：
   https://github.com/superfly/flyctl/releases/latest
2. 下载 `flyctl_0.4.55_Windows_x86_64.zip`
3. 解压到 `C:\Users\lenovo123456\flyctl\`
4. 添加到系统 PATH：打开 PowerShell 运行：
```powershell
[Environment]::SetEnvironmentVariable("PATH", "$env:PATH;C:\Users\lenovo123456\flyctl", "User")
```

**方法 C - 通过国内镜像下载：**
在浏览器中打开（可能需要多次尝试）：
https://ghfast.top/https://github.com/superfly/flyctl/releases/download/v0.4.55/flyctl_0.4.55_Windows_x86_64.zip

安装完成后，**关闭并重新打开 VS Code 终端**，然后验证：
```
flyctl version
```

### 第二步：注册 Fly.io 账号

打开 PowerShell 运行：
```
flyctl auth register
```
按照提示在浏览器中注册。

或者如果已有账号：
```
flyctl auth login
```

### 第三步：创建并部署应用

```powershell
cd C:\Users\lenovo123456\prompttoplay

# 创建应用（选择香港节点，国内访问快）
flyctl apps create prompttoplay --region hkg

# 设置环境变量（必须设置！）
flyctl secrets set DEEPSEEK_API_KEY=你的DeepSeek密钥
flyctl secrets set JWT_SECRET=随便一个长字符串比如abc123xyz456
flyctl secrets set DEV_MODE=false

# 扩展持久化卷（用于 SQLite 数据库）
flyctl volumes create prompttoplay_data --region hkg --size 1

# 部署！
flyctl deploy
```

部署成功后，Fly.io 会分配一个地址：
`https://prompttoplay.fly.dev`

### 第四步：绑定自定义域名（可选）

如果你有域名，可以在 Fly.io 控制台添加：
1. 打开 https://dash.fly.io
2. 选择你的应用 → Settings → Custom Domains
3. 添加你的域名

---

## 方案四：Zeabur（国内可用，有免费额度）

### 步骤：
1. 打开 https://zeabur.com 用 GitHub 登录
2. 创建项目 → 选择 Gitee 仓库
3. Zeabur 会自动检测 Node.js 项目并部署
4. 免费额度：$5/月

---

## 方案五：本地内网穿透（开发/演示用）

如果只是想让别人访问你的电脑上的项目：

### 使用 ngrok：
1. 注册 https://ngrok.com
2. 下载 ngrok Windows 客户端
3. 运行：
```
ngrok http 3000
```
会得到一个公网 URL（如 `https://xxxx.ngrok-free.app`）

### 使用 Cloudflare Tunnel（免费）：
1. 安装 cloudflared
2. 运行：
```
cloudflared tunnel --url http://localhost:3000
```

---

## 当前项目重要信息

| 项目 | 值 |
|------|-----|
| Gitee 仓库 | https://gitee.com/zhang-hangshuo051117/prompttoplay |
| 本地端口 | http://localhost:3000 |
| 数据库 | SQLite (data/prompttoplay.db) |
| Node 依赖 | express, sql.js, bcryptjs, jsonwebtoken, dotenv |
| 启动命令 | `node server.js` |
| 环境变量 | DEEPSEEK_API_KEY, JWT_SECRET, PORT, DEV_MODE, DOMAIN |

## 需要在服务器设置的环境变量

```env
DEEPSEEK_API_KEY=你的密钥
JWT_SECRET=随机长字符串
PORT=8080
DEV_MODE=false
DOMAIN=https://你的域名
DB_PATH=/data/prompttoplay.db
```
