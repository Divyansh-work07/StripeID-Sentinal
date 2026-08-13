@echo off
echo =========================================================================
echo 🐅 Pench Tiger Reserve Intelligence Platform - 1-Click Automated Setup
echo =========================================================================
echo.

echo [1/3] Installing root dependencies...
call npm install

echo [2/3] Installing Express REST API server dependencies...
cd server
call npm install
cd ..

echo [3/3] Installing Vite Local HTTPS UI client dependencies...
cd client
call npm install
cd ..

echo.
echo =========================================================================
echo ✅ Setup Complete! 
echo To launch both Express Backend API & Vite HTTPS Frontend, run:
echo    npm run dev
echo =========================================================================
pause
