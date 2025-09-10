import axios from 'axios';
import { IProductAnalysis, INutritionFacts, IOpenFoodFactsProduct, IHealthAnalysis } from '../types';
import { evaluateNutritionalValues } from '../utils/nutritionUtils';
import { getRelevantExamples } from '../utils/trainingData';

export class NutritionService {
  private static instance: NutritionService;
  private readonly OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v0';
  private readonly LLAMA_API_URL = process.env.LLAMA_API_URL;
  private readonly LLAMA_API_KEY = process.env.LLAMA_API_KEY;

  public static getInstance(): NutritionService {
    if (!NutritionService.instance) {
      NutritionService.instance = new NutritionService();
    }
    return NutritionService.instance;
  }

  /**
   * Analyze product using multiple data sources
   */
  async analyzeProduct(inputMethod: 'barcode' | 'name' | 'ocr', data: any): Promise<IProductAnalysis> {
    try {
      let productInfo: any;
      
      if (inputMethod === 'barcode') {
        productInfo = await this.getProductFromOpenFoodFacts(data.barcode);
      } else if (inputMethod === 'name') {
        productInfo = await this.searchProductByName(data.productName);
      } else if (inputMethod === 'ocr') {
        productInfo = await this.processOCRData(data);
      }

      if (!productInfo) {
        throw new Error('Product information not found');
      }

      // Perform health analysis
      const healthAnalysis = await this.performHealthAnalysis(productInfo);
      
      // Generate AI insights
      const aiInsights = await this.generateAIInsights(productInfo, healthAnalysis);

      return {
        name: productInfo.name,
        brand: productInfo.brand || 'Unknown Brand',
        should_consume: healthAnalysis.score >= 6 ? 'Yes' : 'No',
        score: healthAnalysis.score,
        reason: aiInsights.reason,
        nutrition_label: productInfo.nutritionFacts,
        healthConcerns: healthAnalysis.concerns,
        alternatives: healthAnalysis.alternatives
      };
    } catch (error) {
      console.error('Error analyzing product:', error);
      return this.createFallbackAnalysis(data);
    }
  }

  /**
   * Get product from Open Food Facts API
   */
  private async getProductFromOpenFoodFacts(barcode: string): Promise<any> {
    try {
      const response = await axios.get(`${this.OPEN_FOOD_FACTS_API}/product/${barcode}.json`);
      
      if (response.data?.product) {
        return this.formatOpenFoodFactsProduct(response.data.product);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching from Open Food Facts:', error);
      return null;
    }
  }

  /**
   * Search product by name
   */
  private async searchProductByName(productName: string): Promise<any> {
    try {
      const response = await axios.get(`${this.OPEN_FOOD_FACTS_API}/cgi/search.pl`, {
        params: {
          search_terms: productName,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: 1
        }
      });

      if (response.data?.products?.[0]) {
        return this.formatOpenFoodFactsProduct(response.data.products[0]);
      }

      // Fallback to basic product info
      return {
        name: productName,
        brand: this.extractBrandFromName(productName),
        nutritionFacts: this.getDefaultNutritionFacts(productName),
        ingredients: this.getDefaultIngredients(productName),
        category: this.getProductCategory(productName)
      };
    } catch (error) {
      console.error('Error searching product by name:', error);
      return null;
    }
  }

  /**
   * Process OCR data to extract product information
   */
  private async processOCRData(ocrData: any): Promise<any> {
    return {
      name: ocrData.productName || 'Unknown Product',
      brand: this.extractBrandFromName(ocrData.productName) || 'Unknown Brand',
      nutritionFacts: ocrData.nutritionFacts || this.getDefaultNutritionFacts(ocrData.productName),
      ingredients: ocrData.ingredients || [],
      category: this.getProductCategory(ocrData.productName),
      ocrText: ocrData.ocrText
    };
  }

  /**
   * Format Open Food Facts product data
   */
  private formatOpenFoodFactsProduct(product: IOpenFoodFactsProduct): any {
    const nutritionFacts: INutritionFacts = {
      calories: product.nutriments?.['energy-kcal'] || 0,
      protein: product.nutriments?.proteins || 0,
      carbohydrates: product.nutriments?.carbohydrates || 0,
      sugars: product.nutriments?.sugars || 0,
      fat: product.nutriments?.fat || 0,
      saturatedFat: product.nutriments?.['saturated-fat'] || 0,
      sodium: product.nutriments?.sodium || 0,
      fiber: product.nutriments?.fiber || 0,
      servingSize: product.serving_size || product.quantity || '100g'
    };

    return {
      name: product.product_name || 'Unknown Product',
      brand: product.brands || 'Unknown Brand',
      nutritionFacts,
      ingredients: product.ingredients_text?.split(',').map(i => i.trim()) || [],
      category: product.categories || 'Other'
    };
  }

  /**
   * Perform health analysis on product
   */
  private async performHealthAnalysis(productInfo: any): Promise<IHealthAnalysis> {
    const { concerns, benefits } = evaluateNutritionalValues(productInfo.nutritionFacts);
    
    // Calculate health score (1-10)
    let score = 5; // Base score
    score += benefits.length * 1.5; // Add points for benefits
    score -= concerns.length * 1.2; // Subtract points for concerns
    
    // Adjust score based on specific nutrition values
    const nutrition = productInfo.nutritionFacts;
    
    // Penalize high sugar, sodium, saturated fat
    if (nutrition.sugars > 15) score -= 1;
    if (nutrition.sodium > 600) score -= 1;
    if (nutrition.saturatedFat > 5) score -= 1;
    
    // Reward high protein, fiber
    if (nutrition.protein > 10) score += 1;
    if (nutrition.fiber > 3) score += 1;
    
    // Ensure score stays within 1-10 range
    score = Math.max(1, Math.min(10, Math.round(score)));

    // Generate recommendations and alternatives
    const recommendations = this.generateRecommendations(concerns, benefits);
    const alternatives = this.generateAlternatives(productInfo.category, concerns);

    return {
      score,
      concerns,
      benefits,
      recommendations,
      alternatives
    };
  }

  /**
   * Generate AI insights using LLM
   */
  private async generateAIInsights(productInfo: any, healthAnalysis: IHealthAnalysis): Promise<any> {
    try {
      if (!this.LLAMA_API_URL || !this.LLAMA_API_KEY) {
        return this.createFallbackInsights(healthAnalysis);
      }

      const prompt = this.createAnalysisPrompt(productInfo, healthAnalysis);
      const response = await this.callLLMAPI(prompt);
      
      return this.parseLLMResponse(response);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.createFallbackInsights(healthAnalysis);
    }
  }

  /**
   * Create analysis prompt for LLM
   */
  private createAnalysisPrompt(productInfo: any, healthAnalysis: IHealthAnalysis): string {
    return `Analyze this food product and provide health insights:

Product: ${productInfo.name}
Brand: ${productInfo.brand}
Category: ${productInfo.category}

Nutrition Facts (per ${productInfo.nutritionFacts.servingSize}):
- Calories: ${productInfo.nutritionFacts.calories}
- Protein: ${productInfo.nutritionFacts.protein}g
- Carbohydrates: ${productInfo.nutritionFacts.carbohydrates}g
- Sugars: ${productInfo.nutritionFacts.sugars}g
- Fat: ${productInfo.nutritionFacts.fat}g
- Saturated Fat: ${productInfo.nutritionFacts.saturatedFat}g
- Sodium: ${productInfo.nutritionFacts.sodium}mg
- Fiber: ${productInfo.nutritionFacts.fiber}g

Health Score: ${healthAnalysis.score}/10
Concerns: ${healthAnalysis.concerns.join(', ')}
Benefits: ${healthAnalysis.benefits.join(', ')}

Provide a detailed health analysis in JSON format:
{
  "reason": "Detailed explanation of health impact and recommendation",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "recommendation": "Specific advice for consumption"
}`;
  }

  /**
   * Call LLM API
   */
  private async callLLMAPI(prompt: string): Promise<string> {
    const response = await axios.post(this.LLAMA_API_URL!, {
      prompt,
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${this.LLAMA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices?.[0]?.text || response.data.response || '';
  }

  /**
   * Parse LLM response
   */
  private parseLLMResponse(response: string): any {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback to simple text response
      return {
        reason: response.trim(),
        keyPoints: [],
        recommendation: 'Consider the nutritional information when making your choice.'
      };
    } catch (error) {
      return {
        reason: response.trim(),
        keyPoints: [],
        recommendation: 'Consider the nutritional information when making your choice.'
      };
    }
  }

  /**
   * Generate recommendations based on concerns and benefits
   */
  private generateRecommendations(concerns: string[], benefits: string[]): string[] {
    const recommendations: string[] = [];
    
    if (concerns.includes('High in sugar')) {
      recommendations.push('Limit consumption due to high sugar content');
    }
    if (concerns.includes('High in sodium')) {
      recommendations.push('Consider sodium intake if you have blood pressure concerns');
    }
    if (concerns.includes('High in saturated fat')) {
      recommendations.push('Moderate consumption due to saturated fat content');
    }
    if (benefits.includes('Good source of protein')) {
      recommendations.push('Good protein content for muscle health');
    }
    if (benefits.includes('High in fiber')) {
      recommendations.push('Excellent fiber content for digestive health');
    }
    
    return recommendations;
  }

  /**
   * Generate healthier alternatives
   */
  private generateAlternatives(category: string, concerns: string[]): string[] {
    const alternatives: string[] = [];
    
    if (category.toLowerCase().includes('snack')) {
      alternatives.push('Fresh fruits', 'Nuts and seeds', 'Vegetable sticks with hummus');
    } else if (category.toLowerCase().includes('drink')) {
      alternatives.push('Water', 'Herbal tea', 'Sparkling water with fruit');
    } else if (category.toLowerCase().includes('cereal')) {
      alternatives.push('Oatmeal', 'Whole grain cereals', 'Greek yogurt with berries');
    } else {
      alternatives.push('Whole food alternatives', 'Homemade versions', 'Organic options');
    }
    
    return alternatives;
  }

  /**
   * Create fallback analysis
   */
  private createFallbackAnalysis(data: any): IProductAnalysis {
    return {
      name: data.productName || 'Unknown Product',
      brand: 'Unknown Brand',
      should_consume: 'No',
      score: 3,
      reason: 'Unable to analyze this product. Please check the product information manually.',
      nutrition_label: this.getDefaultNutritionFacts(data.productName),
      healthConcerns: ['Unable to verify nutritional information'],
      alternatives: ['Consider whole food alternatives']
    };
  }

  /**
   * Create fallback insights
   */
  private createFallbackInsights(healthAnalysis: IHealthAnalysis): any {
    const shouldConsume = healthAnalysis.score >= 6 ? 'Yes' : 'No';
    
    return {
      reason: shouldConsume === 'Yes' 
        ? `This product has a health score of ${healthAnalysis.score}/10. ${healthAnalysis.benefits.join(', ')}.`
        : `This product has a health score of ${healthAnalysis.score}/10. ${healthAnalysis.concerns.join(', ')}.`,
      keyPoints: [...healthAnalysis.benefits, ...healthAnalysis.concerns],
      recommendation: shouldConsume === 'Yes' 
        ? 'This product can be part of a balanced diet.'
        : 'Consider consuming in moderation or choosing healthier alternatives.'
    };
  }

  /**
   * Helper methods
   */
  private extractBrandFromName(productName: string): string {
    const commonBrands = ['Nestle', 'Coca-Cola', 'Pepsi', 'McDonald\'s', 'KFC', 'Pizza Hut', 'Domino\'s'];
    const name = productName.toLowerCase();
    
    for (const brand of commonBrands) {
      if (name.includes(brand.toLowerCase())) {
        return brand;
      }
    }
    
    return productName.split(' ')[0] || 'Unknown Brand';
  }

  private getProductCategory(productName: string): string {
    const name = productName.toLowerCase();
    if (name.includes('pizza')) return 'Pizza';
    if (name.includes('burger')) return 'Burger';
    if (name.includes('drink') || name.includes('soda')) return 'Beverage';
    if (name.includes('snack') || name.includes('chips')) return 'Snack';
    if (name.includes('cereal')) return 'Cereal';
    return 'Other';
  }

  private getDefaultNutritionFacts(productName: string): INutritionFacts {
    return {
      calories: 200,
      protein: 5,
      carbohydrates: 30,
      sugars: 10,
      fat: 8,
      saturatedFat: 3,
      sodium: 400,
      fiber: 2,
      servingSize: '100g'
    };
  }

  private getDefaultIngredients(productName: string): string[] {
    return ['Ingredients not specified'];
  }
}

