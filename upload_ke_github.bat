@echo off
chcp 65001 >nul
title Upload WanderMemories ke GitHub
echo ========================================================
echo   Mengunggah WanderMemories ke GitHub: daffasalsa-git/Journal
echo ========================================================
echo.

"C:\Program Files\Git\cmd\git.exe" push origin main

echo.
echo ========================================================
echo Selesai! Silakan refresh halaman:
echo https://github.com/daffasalsa-git/Journal
echo ========================================================
pause
