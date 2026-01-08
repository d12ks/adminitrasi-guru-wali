@echo off
echo ======================================
echo UPDATE REPO GITHUB (React + Pages)
echo ======================================

echo.
echo [1/6] Masuk ke folder repo...
cd /d C:\guru-wali-github || exit /b

echo.
echo [2/6] Ambil update terbaru dari GitHub...
git pull origin main || exit /b

echo.
echo [3/6] Tambahkan semua perubahan...
git add .

echo.
echo [4/6] Commit perubahan...
git commit -m "Update project" || echo Tidak ada perubahan source

echo.
echo [5/6] Build project...
npm run build || exit /b

echo.
echo [6/6] Commit hasil build & push...
git add dist
git commit -m "Build deploy" || echo Tidak ada perubahan build
git push origin main

echo.
echo ======================================
echo SELESAI - CEK URL WEBSITE
echo ======================================
pause






