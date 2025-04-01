const nutritionService = require('../services/nutritionService');

class ProductController {
    async scanProduct(req, res) {
        try {
            const { barcode } = req.body;

            if (!barcode) {
                return res.status(400).json({ message: 'Barcode is required' });
            }

            // Get product info from Open Food Facts
            const productInfo = await nutritionService.getProductFromOpenFoodFacts(barcode);
            
            if (!productInfo) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Analyze product with LLM
            const analysis = await nutritionService.analyzeProductWithLLM(productInfo);
            
            if (!analysis) {
                return res.status(500).json({ message: 'Error analyzing product' });
            }

            res.json(analysis);
        } catch (error) {
            console.error('Error in scanProduct:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new ProductController(); 