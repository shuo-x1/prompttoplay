@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo   PromptToPlay 一键启动
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [错误] 没找到 Node.js。请先安装 Node.js 18 或更高版本：
    echo        https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\express" (
    echo 首次启动，正在安装依赖（大约 30 秒）...
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo [错误] 依赖安装失败，检查一下网络或换 npm 镜像重试。
        pause
        exit /b 1
    )
)

echo.
echo 启动后会自动打开浏览器：http://localhost:3000/demo
echo 关闭这个窗口就会停止服务。
echo.
set PTP_OPEN_BROWSER=1
node server.js
pause
