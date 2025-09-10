const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your production domain
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint for product scanning
app.post('/api/products/scan', (req, res) => {
  const { barcode, productName } = req.body;
  
  // Mock product analysis for demo
  const mockProducts = {
    '8902080104581': {
      name: 'Nestlé KitKat',
      brand: 'Nestlé',
      should_consume: 'No',
      score: 3,
      reason: 'High in saturated fat (15g) and sodium (800mg). Contains artificial preservatives and excessive calories (450kcal per serving). Regular consumption may increase risk of heart disease and high blood pressure.',
      nutrition_label: {
        calories: 250,
        protein: 8,
        carbohydrates: 30,
        sugars: 25,
        fat: 12,
        saturatedFat: 8,
        sodium: 400,
        fiber: 2,
        servingSize: '100g'
      },
      healthConcerns: [
        'High in saturated fat',
        'Contains artificial preservatives',
        'High in sugar'
      ],
      alternatives: [
        'Dark chocolate (70%+ cocoa)',
        'Fresh fruit',
        'Nuts and seeds'
      ]
    },
    '049000042566': {
      name: 'Coca-Cola Classic',
      brand: 'Coca-Cola',
      should_consume: 'No',
      score: 2,
      reason: 'High in added sugars (39g) and contains artificial sweeteners. No nutritional value and linked to obesity and diabetes.',
      nutrition_label: {
        calories: 140,
        protein: 0,
        carbohydrates: 39,
        sugars: 39,
        fat: 0,
        saturatedFat: 0,
        sodium: 45,
        fiber: 0,
        servingSize: '355ml'
      },
      healthConcerns: [
        'High in added sugars',
        'Contains artificial sweeteners',
        'No nutritional value'
      ],
      alternatives: [
        'Water',
        'Sparkling water with fruit',
        'Green tea'
      ]
    }
  };

  let product;
  if (barcode && mockProducts[barcode]) {
    product = mockProducts[barcode];
  } else if (productName) {
    // Simple product name matching
    const name = productName.toLowerCase();
    if (name.includes('kitkat') || name.includes('chocolate')) {
      product = mockProducts['8902080104581'];
    } else if (name.includes('coca') || name.includes('cola') || name.includes('soda')) {
      product = mockProducts['049000042566'];
    } else {
      // Generic product response
      product = {
        name: productName,
        brand: 'Unknown Brand',
        should_consume: 'No',
        score: 5,
        reason: 'Unable to analyze this product. Please check the product information manually.',
        nutrition_label: {
          calories: 200,
          protein: 5,
          carbohydrates: 30,
          sugars: 10,
          fat: 8,
          saturatedFat: 3,
          sodium: 400,
          fiber: 2,
          servingSize: '100g'
        },
        healthConcerns: ['Unable to verify nutritional information'],
        alternatives: ['Consider whole food alternatives']
      };
    }
  } else {
    return res.status(400).json({
      success: false,
      message: 'Either barcode or productName is required'
    });
  }

  res.json({
    success: true,
    data: product,
    message: 'Product analyzed successfully'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message || 'Internal server error'
  });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.DATABASE_URL || 'mongodb://localhost:27017/consumewise';
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
    
    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Uploads directory created');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Continuing without database connection...');
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api/products/scan`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

startServer();