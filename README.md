# ConsumeWise - AI Food Label Scanner

A comprehensive full-stack application that helps users make healthier food choices by analyzing packaged food labels through OCR, ingredient analysis, and AI-generated health insights.

## 🚀 Features

### Core Functionality

- **Barcode Scanning**: Scan product barcodes using camera or manual entry
- **OCR Processing**: Extract text from food label images using Tesseract.js
- **AI Analysis**: Generate health insights using LLaMA API integration
- **Nutrition Analysis**: Comprehensive nutrition facts parsing and scoring
- **User Authentication**: Secure JWT-based authentication system
- **Scan History**: Track and manage your product analysis history
- **Personalized Recommendations**: Get tailored suggestions based on dietary preferences

### Technical Features

- **TypeScript**: Full type safety across frontend and backend
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Real-time Processing**: Fast OCR and AI analysis
- **File Upload**: Support for multiple image formats (JPEG, PNG, WebP)
- **Database Integration**: MongoDB with Mongoose ODM
- **API Integration**: Open Food Facts API for product data
- **Security**: Helmet, rate limiting, input validation

## 🏗️ Architecture

### Backend (Node.js + TypeScript)

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── middleware/     # Auth, validation, etc.
│   ├── services/       # Business logic
│   ├── schemas/        # Zod validation schemas
│   ├── types/          # TypeScript interfaces
│   └── utils/          # Helper functions
├── uploads/            # File upload directory
└── dist/              # Compiled JavaScript
```

### Frontend (React + TypeScript)

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── store/         # Zustand state management
│   ├── services/      # API services
│   ├── types/         # TypeScript interfaces
│   └── utils/         # Helper functions
└── public/            # Static assets
```

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer
- **OCR**: Tesseract.js
- **Validation**: Zod
- **Security**: Helmet, express-rate-limit
- **Image Processing**: Sharp

### Frontend

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Image Handling**: react-dropzone, react-image-crop
- **Icons**: Lucide React
- **Notifications**: react-hot-toast
- **Charts**: Recharts

### External APIs

- **Open Food Facts API**: Product verification and nutritional data
- **LLaMA API**: Health analysis and recommendations
- **Hugging Face API**: Alternative AI analysis

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud instance)
- API keys for external services (optional)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ConsumeWise
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/consumewise
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
LLAMA_API_KEY=your_llama_api_key
LLAMA_API_URL=your_llama_endpoint
OPEN_FOOD_FACTS_API=https://world.openfoodfacts.org/api/v0
HUGGING_FACE_TOKEN=your_hugging_face_token
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=ConsumeWise
VITE_MAX_FILE_SIZE=5242880
VITE_SUPPORTED_FORMATS=JPEG,PNG,WebP
```

### 4. Start the Application

#### Development Mode

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### Production Mode

```bash
# Build and start backend
cd backend
npm run build
npm start

# Build and start frontend
cd frontend
npm run build
npm run preview
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/preferences` - Update user preferences
- `DELETE /api/auth/account` - Delete user account

### Product Endpoints

- `POST /api/products/scan` - Scan product (barcode, name, or image)
- `GET /api/products/:id` - Get product details
- `GET /api/products/history/list` - Get user scan history
- `GET /api/products/stats/overview` - Get user statistics
- `DELETE /api/products/history/:id` - Delete scan record

### Health Check

- `GET /api/health` - Server health status

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

| Variable             | Description               | Default                                 |
| -------------------- | ------------------------- | --------------------------------------- |
| `NODE_ENV`           | Environment mode          | `development`                           |
| `PORT`               | Server port               | `5000`                                  |
| `DATABASE_URL`       | MongoDB connection string | `mongodb://localhost:27017/consumewise` |
| `JWT_SECRET`         | JWT signing secret        | Required                                |
| `JWT_EXPIRES_IN`     | JWT expiration time       | `7d`                                    |
| `LLAMA_API_KEY`      | LLaMA API key             | Optional                                |
| `LLAMA_API_URL`      | LLaMA API endpoint        | Optional                                |
| `HUGGING_FACE_TOKEN` | Hugging Face API token    | Optional                                |
| `MAX_FILE_SIZE`      | Max upload file size      | `5242880` (5MB)                         |

#### Frontend (.env)

| Variable             | Description          | Default                     |
| -------------------- | -------------------- | --------------------------- |
| `VITE_API_URL`       | Backend API URL      | `http://localhost:5000/api` |
| `VITE_APP_NAME`      | Application name     | `ConsumeWise`               |
| `VITE_MAX_FILE_SIZE` | Max file upload size | `5242880`                   |

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm run test
```

### Type Checking

```bash
# Backend
cd backend
npm run type-check

# Frontend
cd frontend
npm run type-check
```

## 📦 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment

#### Backend

1. Build the application: `npm run build`
2. Set production environment variables
3. Start with PM2: `pm2 start dist/server.js`

#### Frontend

1. Build the application: `npm run build`
2. Serve the `dist` folder with a web server (nginx, Apache, etc.)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Zod schema validation
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Configured for specific origins
- **Helmet**: Security headers
- **File Upload Security**: Type and size validation

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Dark/Light Theme**: Theme switching capability
- **Loading States**: Skeleton screens and progress indicators
- **Error Handling**: User-friendly error messages
- **Accessibility**: ARIA labels and keyboard navigation
- **Health Visualization**: Color-coded health meter

## 📱 Mobile Support

- **Responsive Layout**: Works on all screen sizes
- **Touch-Friendly**: Optimized for mobile interactions
- **Camera Integration**: Barcode scanning on mobile devices
- **Progressive Web App**: PWA capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Email**: support@consumewise.app

## 🗺️ Roadmap

### Phase 1 (Current)

- ✅ Basic OCR and barcode scanning
- ✅ AI-powered health analysis
- ✅ User authentication and profiles
- ✅ Scan history and statistics

### Phase 2 (Planned)

- 🔄 Mobile app (React Native)
- 🔄 Barcode scanning improvements
- 🔄 Advanced nutrition tracking
- 🔄 Social features and sharing

### Phase 3 (Future)

- 📋 Meal planning integration
- 📋 Grocery list generation
- 📋 Health goal tracking
- 📋 Integration with fitness apps

## 🙏 Acknowledgments

- **Open Food Facts**: For providing comprehensive food database
- **Tesseract.js**: For OCR capabilities
- **Tailwind CSS**: For beautiful UI components
- **React Community**: For excellent libraries and tools

---

**Made with ❤️ for healthier choices**
