@echo off
title WanderMemories - Jejak Kenangan Petualangan
echo ========================================================
echo   WanderMemories - Memori Petualangan Foto ^& Video
echo ========================================================

netstat -ano | findstr :8080 > nul
if errorlevel 1 (
  echo Menjalankan server lokal di port 8080...
  start /B python -m http.server 8080 > nul 2>&1
  timeout /t 1 /nobreak > nul
)

echo Membuka aplikasi di browser...
start http://localhost:8080/

echo.
echo Aplikasi aktif di http://localhost:8080/
echo Jendela ini dapat Anda tutup kapan saja.
timeout /t 3 > nul
