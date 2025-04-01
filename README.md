# ConsumeWise

A modern web application that allows users to scan and get detailed information about products using barcodes and Google PaLM AI.

## Features
- Barcode scanning and lookup
- Product information retrieval using Google PaLM AI
- User-friendly interface
- Real-time product details

## Tech Stack
- Frontend: React.js
- Backend: Node.js/Express.js
- Database: MongoDB
- AI Service: Python with Google PaLM API

## Project Structure
```
consume/
├── frontend/          # React frontend
├── backend/           # Node.js/Express backend
├── ai-service/        # Python PaLM service
└── README.md
```

## Setup Instructions

### Frontend
1. Navigate to frontend directory
2. Run `npm install`
3. Run `npm start`

### Backend
1. Navigate to backend directory
2. Run `npm install`
3. Create .env file with required environment variables
4. Run `npm start`

### AI Service
1. Navigate to ai-service directory
2. Create virtual environment: `python -m venv venv`
3. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create .env file with your Google PaLM API key
6. Run the service: `python app.py`

## Environment Variables
Create a .env file in the backend directory with:
```
MONGODB_URI=your_mongodb_uri
PORT=5000
```

Create a .env file in the frontend directory with:
```
REACT_APP_API_URL=http://localhost:5000
```

Create a .env file in the ai-service directory with:
```
GOOGLE_API_KEY=your_google_palm_api_key
PORT=5001
```

## Getting a Google PaLM API Key
1. Go to the Google AI Studio (https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key and add it to your ai-service/.env file 