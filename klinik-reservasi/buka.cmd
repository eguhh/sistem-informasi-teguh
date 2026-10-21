@echo off
REM ============================================================
REM  Sehat Klinik - Sistem Reservasi
REM  Membuka aplikasi di browser default.
REM ============================================================
cd /d "%~dp0"
start "" "index.html"
echo Sehat Klinik sedang dibuka di browser Anda.
echo.
echo Data tersimpan di browser (localStorage).
echo Untuk mencadangkan: menu Pengaturan - tab "Data & Backup" - "Ekspor Semua Data (JSON)".
timeout /t 4 >nul
