@echo off
cd /d "%~dp0"
echo.
echo === Petravox-modpack — Push GitHub ===
echo.
git add -A
git status
echo.
set /p msg="Message de commit (Entree = mise a jour auto) : "
if "%msg%"=="" set msg=Mise a jour %date% %time%
git commit -m "%msg%"
git push
echo.
echo === Push termine ! ===
pause
