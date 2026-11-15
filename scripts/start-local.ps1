# PromptToPlay 一键启动（Windows）
#
# 由「启动.cmd」调用：检查 Node 版本 -> 缺依赖就装 -> 启动服务 -> 打开浏览器。
# 体验版地址 http://localhost:3000/demo 不需要 .env，也不需要 API Key。

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

Write-Host ''
Write-Host '============================================' -ForegroundColor DarkCyan
Write-Host '  PromptToPlay 一键启动' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor DarkCyan
Write-Host ''

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host '[错误] 没找到 Node.js，请先安装 18 或更高版本：https://nodejs.org/' -ForegroundColor Red
    exit 1
}

$version = (& node -v).TrimStart('v')
$major = 0
[void][int]::TryParse(($version -split '\.')[0], [ref]$major)
if ($major -lt 18) {
    Write-Host "[错误] 当前 Node.js 版本是 v$version，本项目需要 18 及以上。" -ForegroundColor Red
    Write-Host '       下载地址：https://nodejs.org/' -ForegroundColor Red
    exit 1
}
Write-Host "Node.js v$version 已就绪" -ForegroundColor Green

if (-not (Test-Path (Join-Path $repoRoot 'node_modules\express'))) {
    Write-Host '首次启动，正在安装依赖（大约 30 秒）...' -ForegroundColor Yellow
    & npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
        Write-Host '[错误] 依赖安装失败，检查网络后重试，或换 npm 镜像：' -ForegroundColor Red
        Write-Host '       npm config set registry https://registry.npmmirror.com' -ForegroundColor Red
        exit 1
    }
}

Write-Host ''
Write-Host '启动后会自动打开浏览器：http://localhost:3000/demo' -ForegroundColor Cyan
Write-Host '关闭这个窗口（或按 Ctrl+C）就会停止服务。' -ForegroundColor DarkGray
Write-Host ''

if (-not $env:PTP_OPEN_BROWSER) { $env:PTP_OPEN_BROWSER = '1' }

& node server.js
exit $LASTEXITCODE
