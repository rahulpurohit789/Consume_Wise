const express = require('express');
const cors = require('cors');
const nutritionService = require('./services/nutritionService');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS with specific options
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true,
    maxAge: 86400 // 24 hours
}));

// Add pre-flight OPTIONS handling
app.options('*', cors());

app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Request headers:', req.headers);
    next();
});

// Add a test endpoint to verify server is running
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ 
        message: 'Backend server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        status: 'ok'
    });
});

// New unified endpoint for product analysis
app.post('/api/analyze-product', async (req, res) => {
    try {
        console.log('Received analyze-product request:', req.body);
        const { inputMethod, barcode, productName } = req.body;

        if (!inputMethod || (inputMethod === 'barcode' && !barcode) || (inputMethod === 'name' && !productName)) {
            return res.status(400).json({ message: 'Invalid input parameters' });
        }

        const result = await nutritionService.analyzeProduct(inputMethod, barcode, productName);
        console.log('Sending analyze-product response:', result);
        res.json(result);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend URLs: http://localhost:3000, http://127.0.0.1:3000`);
    console.log(`Backend URL: http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 