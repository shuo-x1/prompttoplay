@echo off
rem PromptToPlay launcher (Windows). ASCII only on purpose: cmd.exe may decode
rem this file with a non-UTF8 codepage, so all Chinese text lives in the PS1.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\start-local.ps1"
echo.
pause
