const nutritionService = require('../services/nutritionService');

class ProductController {
    async scanProduct(req, res) {
        try {
            const { barcode, productName } = req.body;
            const inputMethod = barcode ? 'barcode' : 'name';

            if (!barcode && !productName) {
                return res.status(400).json({ message: 'Either barcode or product name is required' });
            }

            // Analyze product using nutrition service
            const analysis = await nutritionService.analyzeProduct(inputMethod, barcode, productName);
            
            if (!analysis) {
                return res.status(500).json({ message: 'Error analyzing product' });
            }

            res.json(analysis);
        } catch (error) {
            console.error('Error in scanProduct:', error);
            res.status(500).json({ message: error.message || 'Internal server error' });
        }
    }
}

module.exports = new ProductController(); 