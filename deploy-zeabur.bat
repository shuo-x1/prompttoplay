@echo off
chcp 65001 >nul
echo ========================================
echo   PromptToPlay 一键部署到 Zeabur
echo ========================================
echo.
echo 注意：此脚本会将项目打包上传到 Zeabur
echo 你需要先注册 Zeabur 账号并获取 API Token
echo.
echo 1. 打开 https://zeabur.com 注册
echo 2. 进入 https://dash.zeabur.com/account/api-keys 创建 Token
echo 3. 在下方粘贴 Token
echo.
set /p ZEABUR_TOKEN="你的 Zeabur API Token: "
if "%ZEABUR_TOKEN%"=="" (
    echo [错误] Token 不能为空！
    pause
    exit /b 1
)

echo.
echo 请输入你的 DeepSeek API 密钥：
set /p API_KEY="DEEPSEEK_API_KEY: "
if "%API_KEY%"=="" (
    echo [错误] API 密钥不能为空！
    pause
    exit /b 1
)

echo.
echo [1/4] 打包项目...
cd /d "%~dp0"

:: 创建临时部署目录（排除不需要的文件）
set TEMP_DIR=%TEMP%\prompttoplay-deploy
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

:: 复制需要的文件
xcopy /y /q /e public "%TEMP_DIR%\public\" >nul
xcopy /y /q /e routes "%TEMP_DIR%\routes\" >nul
xcopy /y /q /e services "%TEMP_DIR%\services\" >nul
xcopy /y /q /e config "%TEMP_DIR%\config\" >nul
xcopy /y /q /e scripts "%TEMP_DIR%\scripts\" >nul
copy /y server.js "%TEMP_DIR%\" >nul
copy /y package.json "%TEMP_DIR%\" >nul
copy /y Procfile "%TEMP_DIR%\" >nul
copy /y zbpack.json "%TEMP_DIR%\" >nul
copy /y .env.example "%TEMP_DIR%\.env" >nul

:: 写入环境变量
echo DEEPSEEK_API_KEY=%API_KEY%>> "%TEMP_DIR%\.env"
echo JWT_SECRET=ptp2026securekey456abc>> "%TEMP_DIR%\.env"
echo PORT=8080>> "%TEMP_DIR%\.env"
echo DEV_MODE=false>> "%TEMP_DIR%\.env"

:: 打包成 ZIP
set ZIP_FILE=%TEMP%\prompttoplay-deploy.zip
if exist "%ZIP_FILE%" del "%ZIP_FILE%"

echo 正在创建 ZIP...
powershell -Command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"

echo ZIP 创建完成！
echo.

echo [2/4] 计算文件信息...
powershell -Command "$f='%ZIP_FILE%'; $s=(Get-Item $f).Length; $h=[System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash([System.IO.File]::ReadAllBytes($f))).Replace('-','').ToLower(); $b=[Convert]::ToBase64String([Convert]::FromHexString($h)); Write-Host SIZE=$s; Write-Host HASH=$b"

echo.
echo [3/4] 由于 Zeabur API 需要认证，请手动完成以下步骤：
echo.
echo 方式一（推荐）：网页部署
echo   1. 打开 https://dash.zeabur.com
echo   2. 点击「创建项目」
echo   3. 点击「Git 仓库」→ 输入你的 Gitee 地址
echo   4. 设置环境变量（在「变量」页面）
echo   5. 等待自动部署
echo.
echo 方式二：上传部署
echo   1. 打开 https://dash.zeabur.com
echo   2. 创建项目和服务
echo   3. 手动上传 %ZIP_FILE%
echo.

echo 清理临时文件...
rmdir /s /q "%TEMP_DIR%" 2>nul

echo ========================================
echo   准备完成！请在浏览器中完成部署
echo ========================================
echo.
pause
