#!/bin/bash

# ConsumeWise Setup Script
echo "🚀 Setting up ConsumeWise..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB or use Docker."
    echo "   You can also use MongoDB Atlas (cloud) by updating the DATABASE_URL."
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -f package.json ]; then
    echo "❌ Backend package.json not found"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -f package.json ]; then
    echo "❌ Frontend package.json not found"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Create environment files if they don't exist
echo "⚙️  Setting up environment files..."

# Backend .env
if [ ! -f ../backend/.env ]; then
    echo "📝 Creating backend .env file..."
    cat > ../backend/.env << EOF
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/consumewise
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
LLAMA_API_KEY=your_llama_api_key_here
LLAMA_API_URL=your_llama_endpoint_here
OPEN_FOOD_FACTS_API=https://world.openfoodfacts.org/api/v0
HUGGING_FACE_TOKEN=your_hugging_face_token_here
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo "✅ Backend .env created"
else
    echo "✅ Backend .env already exists"
fi

# Frontend .env
if [ ! -f .env ]; then
    echo "📝 Creating frontend .env file..."
    cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=ConsumeWise
VITE_MAX_FILE_SIZE=5242880
VITE_SUPPORTED_FORMATS=JPEG,PNG,WebP
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false
EOF
    echo "✅ Frontend .env created"
else
    echo "✅ Frontend .env already exists"
fi

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p ../backend/uploads
echo "✅ Uploads directory created"

# Build backend
echo "🔨 Building backend..."
cd ../backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build backend"
    exit 1
fi

echo "✅ Backend built successfully"

# Type check
echo "🔍 Running type checks..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "⚠️  Type check failed, but continuing..."
fi

cd ../frontend
npm run type-check
if [ $? -ne 0 ]; then
    echo "⚠️  Frontend type check failed, but continuing..."
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update the API keys in backend/.env if you have them"
echo "2. Start MongoDB (if using local instance): mongod"
echo "3. Start the backend: cd backend && npm run dev"
echo "4. Start the frontend: cd frontend && npm run dev"
echo ""
echo "🌐 The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   API Docs: http://localhost:5000/api/health"
echo ""
echo "📚 For more information, check the README.md file"

