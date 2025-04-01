const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const productRoutes = require('./src/routes/productRoutes');

// Check for required environment variables
if (!process.env.HUGGING_FACE_TOKEN) {
    console.error('HUGGING_FACE_TOKEN environment variable is not set');
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint for server connectivity
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/products', productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
}); 