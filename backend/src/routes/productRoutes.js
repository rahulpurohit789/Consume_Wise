const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// POST /api/products/scan - Scan a product barcode
router.post('/scan', productController.scanProduct.bind(productController));

module.exports = router; 