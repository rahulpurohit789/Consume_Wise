const axios = require('axios');
const { evaluateNutritionalValues } = require('../utils/nutritionUtils');
const { getRelevantExamples } = require('../utils/trainingData');

class NutritionService {
    constructor() {
        this.HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
        this.API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";
    }

    async getProductFromOpenFoodFacts(barcode) {
        try {
            if (!barcode.startsWith('890')) {
                console.log('Warning: Not an Indian product barcode');
            }

            console.log(`\nFetching product info for barcode: ${barcode}`);
            const response = await axios.get(`https://in.openfoodfacts.org/api/v0/product/${barcode}.json`);
            
            if (response.data?.product) {
                return this.formatProductInfo(response.data.product);
            }
            
            console.log('No product found in Open Food Facts database');
            return null;
        } catch (error) {
            console.error('Error fetching from Open Food Facts:', error.message);
            return null;
        }
    }

    formatProductInfo(product) {
        // Get serving size with proper formatting
        let servingSize = this.getServingSize(product);

        // Format nutrition values
        const nutrition = this.formatNutritionValues(product);

        return {
            name: product.product_name || 'Unknown Product',
            brand: product.brands || 'Unknown Brand',
            nutrition,
            ingredients: product.ingredients_text || '',
            categories: product.categories || '',
            hasNutritionData: this.checkHasNutritionData(nutrition)
        };
    }

    getServingSize(product) {
        if (product.serving_size) return product.serving_size;
        if (product.serving_quantity && product.serving_unit) {
            return `${product.serving_quantity}${product.serving_unit}`;
        }
        if (product.quantity) return product.quantity;
        return '100g';
    }

    formatNutritionValues(product) {
        const per100g = product.nutriments;
        const perServing = product.nutriments_serving || {};

        return {
            serving_size: this.getServingSize(product),
            calories: this.getNutritionValue(per100g, perServing, 'energy-kcal'),
            sugar: this.getNutritionValue(per100g, perServing, 'sugars'),
            fat: this.getNutritionValue(per100g, perServing, 'fat'),
            protein: this.getNutritionValue(per100g, perServing, 'proteins'),
            sodium: this.getNutritionValue(per100g, perServing, 'sodium')
        };
    }

    getNutritionValue(per100g, perServing, key) {
        if (perServing[key] !== undefined) return perServing[key];
        if (per100g[key] !== undefined) return per100g[key];
        return 'N/A';
    }

    checkHasNutritionData(nutrition) {
        return Object.values(nutrition)
            .filter(value => value !== 'N/A' && value !== '100g')
            .length > 1;
    }

    async generateNutritionLabel(productInfo) {
        const prompt = this.createNutritionLabelPrompt(productInfo);
        return await this.callLLMApi(prompt, productInfo);
    }

    async analyzeProductWithLLM(productInfo) {
        // Generate nutrition label if needed
        if (!productInfo.hasNutritionData) {
            console.log('No nutrition data available, generating with LLM...');
            const generatedNutrition = await this.generateNutritionLabel(productInfo);
            if (generatedNutrition) {
                productInfo.nutrition = generatedNutrition;
            }
        }

        const { concerns, benefits } = evaluateNutritionalValues(productInfo.nutrition);
        
        // Calculate initial score based on benefits and concerns
        const initialScore = this.calculateInitialScore(benefits.length, concerns.length);
        
        // Get relevant examples based on the initial score
        const examples = getRelevantExamples(initialScore);
        
        const analysisPrompt = this.createAnalysisPrompt(productInfo, concerns, benefits, examples);
        const analysis = await this.callLLMApi(analysisPrompt, productInfo);
        
        return {
            name: productInfo.name,
            brand: productInfo.brand,
            ...analysis
        };
    }

    calculateInitialScore(benefitsCount, concernsCount) {
        // Base score starts at 5
        let score = 5;
        
        // Add points for benefits
        score += benefitsCount;
        
        // Subtract points for concerns
        score -= concernsCount;
        
        // Ensure score stays within 1-10 range
        return Math.min(Math.max(score, 1), 10);
    }

    createNutritionLabelPrompt(productInfo) {
        return `<s>[INST] Generate realistic nutrition label values for this Indian product:

Product Name: ${productInfo.name}
Brand: ${productInfo.brand}
Category: ${productInfo.categories}
Ingredients: ${productInfo.ingredients}

Return ONLY a JSON object with realistic nutrition values in this format:
{
  "serving_size": "realistic serving size",
  "calories": "realistic calories",
  "protein": "realistic protein in g",
  "fat": "realistic fat in g",
  "sugar": "realistic sugar in g",
  "sodium": "realistic sodium in mg"
}

Rules:
1. Use realistic values based on similar Indian products
2. Serving size should be appropriate for the product type
3. All values should be reasonable and proportional
4. Return only the JSON, no other text [/INST]</s>`;
    }

    createAnalysisPrompt(productInfo, concerns, benefits, examples) {
        return `<s>[INST] Analyze this Indian food product and provide health recommendations based on these similar products:

Example products and their health impacts:
${examples.map(ex => `- ${ex.name} (${ex.brand}): ${ex.reason}`).join('\n')}

Product to analyze:
Name: ${productInfo.name}
Brand: ${productInfo.brand}
Nutritional Info per ${productInfo.nutrition.serving_size}:
- Calories: ${productInfo.nutrition.calories}
- Protein: ${productInfo.nutrition.protein}g
- Sugar: ${productInfo.nutrition.sugar}g
- Fat: ${productInfo.nutrition.fat}g
- Sodium: ${productInfo.nutrition.sodium}mg

Benefits found: ${benefits.join(', ')}
Concerns found: ${concerns.join(', ')}

Return ONLY a JSON object in this exact format:
{
  "should_consume": "Yes or No",
  "reason": "2-line simple explanation focusing on health impact",
  "score": "number between 1-10 based on nutritional value",
  "nutrition_label": {
    "serving_size": "${productInfo.nutrition.serving_size}",
    "calories": "${productInfo.nutrition.calories}",
    "sugar": "${productInfo.nutrition.sugar}",
    "fat": "${productInfo.nutrition.fat}",
    "protein": "${productInfo.nutrition.protein}",
    "sodium": "${productInfo.nutrition.sodium}"
  }
}

Rules:
1. Compare with similar example products
2. Give clear, simple 2-line reason that anyone can understand
3. Focus on health impact for Indian consumers
4. Keep nutrition label values exactly as provided
5. Score should reflect overall healthiness (10 = very healthy, 1 = unhealthy)
6. Consider both benefits and concerns in scoring
7. Return only the JSON, no other text [/INST]</s>`;
    }

    async callLLMApi(prompt, productInfo) {
        try {
            console.log('\nSending request to LLM...');
            const response = await axios.post(this.API_URL, {
                inputs: prompt,
                parameters: {
                    temperature: 0.1,
                    max_new_tokens: 500,
                    return_full_text: false,
                    do_sample: false
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.HUGGING_FACE_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data?.[0]?.generated_text) {
                const result = this.parseJsonFromLLMResponse(response.data[0].generated_text);
                if (result) return result;

                console.log('Using fallback response due to parsing error');
                return this.createFallbackResponse(productInfo);
            }
            throw new Error('Invalid response from AI model');
        } catch (error) {
            console.error('Error calling LLM API:', error);
            return this.createFallbackResponse(productInfo);
        }
    }

    parseJsonFromLLMResponse(text) {
        try {
            console.log('Raw LLM response:', text);
            
            // First, try to parse the raw text in case it's already valid JSON
            try {
                const directParse = JSON.parse(text);
                if (this.validateParsedResponse(directParse)) {
                    return directParse;
                }
            } catch (e) {
                console.log('Direct parsing failed, trying cleanup...');
            }
            
            // If direct parsing fails, try to clean up the text
            let jsonStr = text;
            
            const startIdx = text.indexOf('{');
            const endIdx = text.lastIndexOf('}') + 1;
            
            if (startIdx !== -1 && endIdx !== 0) {
                jsonStr = text.slice(startIdx, endIdx);
            }

            // Remove escaped quotes and clean up the JSON string
            jsonStr = jsonStr
                .replace(/\\"/g, '"')  // Remove escaped quotes
                .replace(/\n/g, ' ')
                .replace(/\r/g, '')
                .replace(/\t/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/,\s*}/g, '}')
                .replace(/,\s*]/g, ']')
                .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
                .replace(/:\s*'([^']*)'/g, ':"$1"')
                .trim();

            console.log('Cleaned JSON string:', jsonStr);
            
            const parsed = JSON.parse(jsonStr);
            
            if (!this.validateParsedResponse(parsed)) {
                throw new Error('Invalid response structure');
            }

            return parsed;
        } catch (error) {
            console.error('Error parsing LLM response:', error);
            return null;
        }
    }

    validateParsedResponse(parsed) {
        // Update validation to not require name and brand in LLM response
        const requiredFields = ['should_consume', 'reason', 'score', 'nutrition_label'];
        const requiredNutritionFields = ['serving_size', 'calories', 'sugar', 'fat', 'protein', 'sodium'];
        
        if (!requiredFields.every(field => field in parsed)) {
            console.error('Missing required fields in response');
            return false;
        }
        
        if (!requiredNutritionFields.every(field => field in parsed.nutrition_label)) {
            console.error('Missing required nutrition fields in response');
            return false;
        }
        
        return true;
    }

    createFallbackResponse(productInfo) {
        const { concerns, benefits } = evaluateNutritionalValues(productInfo.nutrition);
        const score = benefits.length > concerns.length ? 7 : 3;
        
        return {
            name: productInfo.name,
            brand: productInfo.brand,
            should_consume: benefits.length > concerns.length ? "Yes" : "No",
            reason: concerns.length > 0 ? 
                `This product has ${concerns.join(' and ')}. Consider healthier alternatives with ${benefits.length > 0 ? benefits.join(' and ') : 'better nutritional values'}.` :
                `This product has ${benefits.join(' and ')}. Good choice for your health.`,
            score: score.toString(),
            nutrition_label: productInfo.nutrition
        };
    }
}

module.exports = new NutritionService(); 