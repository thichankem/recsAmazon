@echo off
echo ========================================================
echo DANG KHOI DONG CHROME CHO BOT PLAYWRIGHT (Profile 1 - prohung)
echo ========================================================
echo.
echo 1. Dang dong cac cua so Chrome hien tai de tranh loi...
taskkill /F /IM chrome.exe /T >nul 2>&1
timeout /t 2 >nul

echo 2. Mo Chrome o che do ket noi (CDP Port 9222)...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --profile-directory="Profile 1"

echo.
echo HOAN TAT! 
echo Ban hay giu cua so Chrome vua hien len (khong dong no lai).
echo Bay gio ban co the quay lai Dashboard va nhan CHAY BOT.
echo.
pause
