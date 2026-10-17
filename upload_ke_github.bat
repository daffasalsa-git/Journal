@echo off
chcp 65001 >nul
title Upload WanderMemories ke GitHub
echo ========================================================
echo   Mengunggah WanderMemories ke GitHub: daffasalsa-git/Journal
echo ========================================================
echo.

"C:\Program Files\Git\cmd\git.exe" branch -M main
"C:\Program Files\Git\cmd\git.exe" push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [Info] Mencoba sinkronisasi jika repository GitHub sudah memiliki README/License...
    "C:\Program Files\Git\cmd\git.exe" push -u origin main --force
)

echo.
echo ========================================================
echo Selesai! Silakan cek di: https://github.com/daffasalsa-git/Journal
echo ========================================================
pause
