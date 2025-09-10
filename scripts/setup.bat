@echo off
echo 🚀 Setting up ConsumeWise...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
if not exist package.json (
    echo ❌ Backend package.json not found
    pause
    exit /b 1
)

call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
if not exist package.json (
    echo ❌ Frontend package.json not found
    pause
    exit /b 1
)

call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Create environment files if they don't exist
echo ⚙️ Setting up environment files...

REM Backend .env
if not exist ..\backend\.env (
    echo 📝 Creating backend .env file...
    (
        echo NODE_ENV=development
        echo PORT=5000
        echo DATABASE_URL=mongodb://localhost:27017/consumewise
        echo JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
        echo JWT_EXPIRES_IN=7d
        echo LLAMA_API_KEY=your_llama_api_key_here
        echo LLAMA_API_URL=your_llama_endpoint_here
        echo OPEN_FOOD_FACTS_API=https://world.openfoodfacts.org/api/v0
        echo HUGGING_FACE_TOKEN=your_hugging_face_token_here
        echo MAX_FILE_SIZE=5242880
        echo ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
    ) > ..\backend\.env
    echo ✅ Backend .env created
) else (
    echo ✅ Backend .env already exists
)

REM Frontend .env
if not exist .env (
    echo 📝 Creating frontend .env file...
    (
        echo VITE_API_URL=http://localhost:5000/api
        echo VITE_APP_NAME=ConsumeWise
        echo VITE_MAX_FILE_SIZE=5242880
        echo VITE_SUPPORTED_FORMATS=JPEG,PNG,WebP
        echo VITE_ENABLE_ANALYTICS=false
        echo VITE_ENABLE_DEBUG=false
    ) > .env
    echo ✅ Frontend .env created
) else (
    echo ✅ Frontend .env already exists
)

REM Create uploads directory
echo 📁 Creating uploads directory...
if not exist ..\backend\uploads mkdir ..\backend\uploads
echo ✅ Uploads directory created

REM Build backend
echo 🔨 Building backend...
cd ..\backend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build backend
    pause
    exit /b 1
)

echo ✅ Backend built successfully

REM Type check
echo 🔍 Running type checks...
call npm run type-check
if %errorlevel% neq 0 (
    echo ⚠️ Type check failed, but continuing...
)

cd ..\frontend
call npm run type-check
if %errorlevel% neq 0 (
    echo ⚠️ Frontend type check failed, but continuing...
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Update the API keys in backend\.env if you have them
echo 2. Start MongoDB (if using local instance)
echo 3. Start the backend: cd backend ^&^& npm run dev
echo 4. Start the frontend: cd frontend ^&^& npm run dev
echo.
echo 🌐 The application will be available at:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    API Docs: http://localhost:5000/api/health
echo.
echo 📚 For more information, check the README.md file
pause

