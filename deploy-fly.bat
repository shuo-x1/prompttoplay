@echo off
chcp 65001 >nul
echo ========================================
echo   PromptToPlay 一键部署到 Fly.io
echo ========================================
echo.

:: 检查 flyctl 是否安装
where flyctl >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 flyctl！
    echo.
    echo 请先安装 flyctl，在 PowerShell 中运行：
    echo   winget install Fly-io.flyctl
    echo.
    echo 或用代理运行：
    echo   iwr https://fly.io/install.ps1 -useb ^| iex
    echo.
    echo 安装后请关闭此窗口并重新打开。
    pause
    exit /b 1
)

echo [1/6] 检查 flyctl 版本...
flyctl version
echo.

echo [2/6] 登录 Fly.io（会自动打开浏览器）...
flyctl auth login
if %errorlevel% neq 0 (
    echo [错误] 登录失败！
    pause
    exit /b 1
)
echo.

echo [3/6] 创建应用（香港节点，国内访问快）...
flyctl apps create prompttoplay --region hkg 2>nul
echo.

echo [4/6] 请输入你的 DeepSeek API 密钥（QuickRouter 转发地址）：
set /p API_KEY="DEEPSEEK_API_KEY: "
if "%API_KEY%"=="" (
    echo [错误] API 密钥不能为空！
    pause
    exit /b 1
)

echo 设置环境变量...
flyctl secrets set DEEPSEEK_API_KEY=%API_KEY%
flyctl secrets set JWT_SECRET=ptp2026securekey456abc
flyctl secrets set DEV_MODE=false
echo.

echo [5/6] 创建数据持久化卷...
flyctl volumes create prompttoplay_data --region hkg --size 1 2>nul
echo.

echo [6/6] 开始部署！
echo 这可能需要几分钟...
flyctl deploy
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo   部署成功！🎉
    echo ========================================
    echo.
    echo 你的网站地址：
    echo   https://prompttoplay.fly.dev
    echo.
    echo 管理面板：
    echo   https://dash.fly.io/apps/prompttoplay
    echo.
) else (
    echo [错误] 部署失败，请检查错误信息。
)

pause
