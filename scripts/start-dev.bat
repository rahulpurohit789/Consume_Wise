@echo off
echo 🚀 Starting ConsumeWise in development mode...

REM Start backend in new window
echo 📡 Starting backend server...
start "ConsumeWise Backend" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo 🎨 Starting frontend server...
start "ConsumeWise Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Development servers started!
echo.
echo 🌐 Application URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo.
echo 📝 To stop the servers, close the command windows or press Ctrl+C in each window
echo.
pause

