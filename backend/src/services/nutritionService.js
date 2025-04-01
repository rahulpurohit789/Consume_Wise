const axios = require('axios');
const { evaluateNutritionalValues } = require('../utils/nutritionUtils');
const { getRelevantExamples } = require('../utils/trainingData');

class NutritionService {
    constructor() {
        this.HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
        this.API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";
    }

    async analyzeProduct(inputMethod, barcode, productName) {
        try {
            let productInfo;
            
            if (inputMethod === 'barcode') {
                productInfo = await this.getProductFromOpenFoodFacts(barcode);
                if (!productInfo) {
                    throw new Error('Product not found in database');
                }
            } else {
                // For direct product name entry, create a more detailed product info object
                productInfo = {
                    name: productName,
                    brand: this.extractBrandFromName(productName),
                    nutrition: {
                        serving_size: '100g',
                        calories: 'N/A',
                        protein: 'N/A',
                        fat: 'N/A',
                        sugar: 'N/A',
                        sodium: 'N/A'
                    },
                    categories: this.getProductCategory(productName),
                    ingredients: this.getDefaultIngredients(productName),
                    hasNutritionData: false
                };
            }

            // Analyze the product using LLM
            const analysis = await this.analyzeProductWithLLM(productInfo);
            return analysis;
        } catch (error) {
            console.error('Error analyzing product:', error);
            // Create a fallback response with basic analysis
            return this.createFallbackResponse({
                name: productName || 'Unknown Product',
                brand: this.extractBrandFromName(productName) || 'Unknown Brand',
                nutrition: {
                    serving_size: '100g',
                    calories: 'N/A',
                    protein: 'N/A',
                    fat: 'N/A',
                    sugar: 'N/A',
                    sodium: 'N/A'
                }
            });
        }
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

        // Create the product info object
        const productInfo = {
            name: product.product_name || 'Unknown Product',
            brand: product.brands || 'Unknown Brand',
            nutrition,
            ingredients: product.ingredients_text || '',
            categories: product.categories || '',
            hasNutritionData: false // Will be set after checking
        };

        // Check if we have enough nutrition data
        productInfo.hasNutritionData = this.checkHasNutritionData(nutrition);

        // If we don't have enough nutrition data, mark it for LLM generation
        if (!productInfo.hasNutritionData) {
            console.log('Insufficient nutrition data from Open Food Facts, will use LLM to generate');
        }

        return productInfo;
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
        // Check if any of the important nutritional values are 'N/A'
        const importantFields = ['calories', 'protein', 'fat', 'sugar', 'sodium'];
        const hasEnoughData = importantFields.every(field => 
            nutrition[field] !== 'N/A' && 
            nutrition[field] !== undefined && 
            nutrition[field] !== null
        );
        return hasEnoughData;
    }

    async generateNutritionLabel(productInfo) {
        const prompt = this.createNutritionLabelPrompt(productInfo);
        return await this.callLLMApi(prompt, productInfo);
    }

    async analyzeProductWithLLM(productInfo) {
        // Generate nutrition label if needed
        if (!productInfo.hasNutritionData) {
            console.log('Generating nutrition data using LLM...');
            const generatedNutrition = await this.generateNutritionLabel(productInfo);
            if (generatedNutrition) {
                console.log('Successfully generated nutrition data:', generatedNutrition);
                productInfo.nutrition = generatedNutrition;
                productInfo.hasNutritionData = true;
            } else {
                console.log('Failed to generate nutrition data, using default values');
            }
        }

        const { concerns, benefits } = evaluateNutritionalValues(productInfo.nutrition);
        
        // Calculate initial score based on benefits and concerns
        const initialScore = this.calculateInitialScore(benefits.length, concerns.length);
        
        // Get relevant examples based on the initial score
        const examples = getRelevantExamples(initialScore);
        
        const analysisPrompt = this.createAnalysisPrompt(productInfo, concerns, benefits, examples);
        const analysis = await this.callLLMApi(analysisPrompt, productInfo);
        
        // Ensure nutrition_label is included in the response
        return {
            name: productInfo.name,
            brand: productInfo.brand,
            ...analysis,
            nutrition_label: productInfo.nutrition
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
Category: ${productInfo.categories || this.getProductCategory(productInfo.name)}
Ingredients: ${productInfo.ingredients || this.getDefaultIngredients(productInfo.name)}

Return ONLY a JSON object with realistic nutrition values in this format:
{
    "serving_size": "realistic serving size",
    "calories": "number",
    "protein": "number in g",
    "fat": "number in g",
    "sugar": "number in g",
    "sodium": "number in mg"
}

Guidelines for values:
1. For ${productInfo.name}, use typical values found in similar Indian products
2. Serving size should be appropriate (e.g., "1 slice" for pizza, "100g" for general items)
3. Calories should be realistic (e.g., 250-350 for pizza slice)
4. Protein typically ranges from 5-20g per serving
5. Fat typically ranges from 5-25g per serving
6. Sugar typically ranges from 2-15g per serving
7. Sodium typically ranges from 400-800mg per serving

Return only the JSON object, no other text. Make sure all values are numbers (except serving_size).
[/INST]</s>`;
    }

    createAnalysisPrompt(productInfo, concerns, benefits, examples) {
        return `<s>[INST] Analyze this Indian food product and provide a health recommendation:

Product: ${productInfo.name}
Brand: ${productInfo.brand}
Nutrition per serving:
- Serving size: ${productInfo.nutrition.serving_size}
- Calories: ${productInfo.nutrition.calories}
- Protein: ${productInfo.nutrition.protein}g
- Fat: ${productInfo.nutrition.fat}g
- Sugar: ${productInfo.nutrition.sugar}g
- Sodium: ${productInfo.nutrition.sodium}mg

Health Concerns:
${concerns.map(c => `- ${c}`).join('\n')}

Health Benefits:
${benefits.map(b => `- ${b}`).join('\n')}

Similar Product Examples:
${examples.map(ex => `
Product: ${ex.name}
Score: ${ex.score}/10
Recommendation: ${ex.should_consume}
Reason: ${ex.reason}
`).join('\n')}

Return ONLY a JSON object in this exact format:
{
    "should_consume": "Yes/No",
    "score": "number between 1-10",
    "reason": "detailed explanation with health impacts"
}

Rules for analysis:
1. If score is 6 or higher, should_consume must be "Yes"
2. If score is 5 or lower, should_consume must be "No"
3. Reason must match the should_consume value (positive reasons for Yes, concerns for No)
4. For scores 1-4: Explain health risks and why to avoid
5. For score 5: Explain moderate concerns and suggest healthier alternatives
6. For scores 6-10: Explain health benefits and positive aspects

Example format for "No" recommendation:
{
    "should_consume": "No",
    "score": "3",
    "reason": "High in saturated fats (15g) and sodium (800mg). Contains artificial preservatives and excessive calories (450kcal per serving). Regular consumption may increase risk of heart disease and high blood pressure."
}

Example format for "Yes" recommendation:
{
    "should_consume": "Yes",
    "score": "8",
    "reason": "Good source of protein (12g) and fiber (6g). Low in saturated fats and sodium. Contains essential nutrients and no artificial preservatives. Supports healthy digestion and sustained energy levels."
}
[/INST]</s>`;
    }

    async callLLMApi(prompt, productInfo) {
        try {
            console.log('\nSending request to LLM...');
            console.log('Prompt:', prompt);
            
            if (!this.HUGGING_FACE_TOKEN) {
                console.error('HUGGING_FACE_TOKEN is not set');
                return this.createFallbackResponse(productInfo);
            }

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

            console.log('LLM Response Status:', response.status);
            console.log('LLM Response Data:', JSON.stringify(response.data, null, 2));

            if (response.status === 200 && response.data?.[0]?.generated_text) {
                const result = this.parseJsonFromLLMResponse(response.data[0].generated_text);
                if (result) {
                    console.log('Successfully parsed LLM response:', result);
                    return result;
                }

                console.log('Using fallback response due to parsing error');
                return this.createFallbackResponse(productInfo);
            }
            
            console.error('Invalid response from AI model:', response.data);
            return this.createFallbackResponse(productInfo);
        } catch (error) {
            console.error('Error calling LLM API:', error.message);
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
            }
            return this.createFallbackResponse(productInfo);
        }
    }

    async parseJsonFromLLMResponse(text) {
        try {
            // First attempt: Try parsing the raw text
            try {
                return JSON.parse(text);
            } catch (e) {
                console.log('Initial JSON parse failed, attempting cleanup...');
            }

            // Second attempt: Clean up the text and try again
            let cleanText = text
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
                .replace(/```json\s*|\s*```/g, '') // Remove markdown code blocks
                .replace(/^[^{]*?({.*})[^}]*$/s, '$1') // Extract just the JSON object
                .trim();

            // Ensure the response has the required fields
            const parsed = JSON.parse(cleanText);
            
            // Validate and fix the response
            const validatedResponse = this.validateAndFixResponse(parsed);
            
            return validatedResponse;
        } catch (error) {
            console.error('Error parsing LLM response:', error);
            console.error('Raw text:', text);
            return null;
        }
    }

    validateAndFixResponse(response) {
        // Ensure score is a number between 1 and 10
        let score = parseInt(response.score);
        if (isNaN(score) || score < 1) score = 1;
        if (score > 10) score = 10;

        // Ensure should_consume matches the score
        const shouldConsume = score >= 6 ? "Yes" : "No";

        // Ensure reason is not empty and matches should_consume
        let reason = response.reason || '';
        if (!reason || reason.includes('undefined') || reason.includes('null')) {
            reason = shouldConsume === "Yes" 
                ? "This product has good nutritional value and can be part of a balanced diet."
                : "This product has nutritional concerns and should be consumed in moderation.";
        }

        // Include nutrition_label in the response
        return {
            should_consume: shouldConsume,
            score: score,
            reason: reason,
            nutrition_label: response.nutrition_label || {
                serving_size: '100g',
                calories: 'N/A',
                protein: 'N/A',
                fat: 'N/A',
                sugar: 'N/A',
                sodium: 'N/A'
            }
        };
    }

    createFallbackResponse(productInfo) {
        const { concerns, benefits } = evaluateNutritionalValues(productInfo.nutrition);
        const score = Math.max(1, Math.min(10, 5 + benefits.length - concerns.length));
        const shouldConsume = score >= 6 ? "Yes" : "No";
        
        let reason;
        if (shouldConsume === "Yes") {
            reason = `This product has ${benefits.length} health benefits: ${benefits.join(', ')}. ${concerns.length > 0 ? `However, consider these concerns: ${concerns.join(', ')}.` : ''}`;
        } else {
            reason = `This product has ${concerns.length} health concerns: ${concerns.join(', ')}. ${benefits.length > 0 ? `However, it does have some benefits: ${benefits.join(', ')}.` : ''}`;
        }

        return {
            name: productInfo.name,
            brand: productInfo.brand,
            should_consume: shouldConsume,
            score: score,
            reason: reason,
            nutrition_label: productInfo.nutrition
        };
    }

    extractBrandFromName(productName) {
        const commonBrands = ['Dominos', 'Domino\'s', 'Pizza Hut', 'McDonald\'s', 'KFC', 'Burger King', 'Subway'];
        const words = productName.split(' ');
        
        for (const brand of commonBrands) {
            if (productName.toLowerCase().includes(brand.toLowerCase())) {
                return brand;
            }
        }
        
        return words[0] || 'Unknown Brand';
    }

    getProductCategory(productName) {
        const name = productName.toLowerCase();
        if (name.includes('pizza')) return 'Pizza';
        if (name.includes('burger')) return 'Burger';
        if (name.includes('sandwich')) return 'Sandwich';
        if (name.includes('noodles')) return 'Noodles';
        if (name.includes('rice')) return 'Rice';
        if (name.includes('bread')) return 'Bread';
        return 'Other';
    }

    getDefaultIngredients(productName) {
        const name = productName.toLowerCase();
        if (name.includes('pizza')) return 'Wheat flour, cheese, tomato sauce, vegetables';
        if (name.includes('burger')) return 'Bun, patty, lettuce, tomato, cheese';
        if (name.includes('sandwich')) return 'Bread, vegetables, cheese, sauce';
        if (name.includes('noodles')) return 'Wheat flour, vegetables, spices';
        if (name.includes('rice')) return 'Rice, spices, vegetables';
        if (name.includes('bread')) return 'Wheat flour, yeast, salt';
        return 'Ingredients not specified';
    }
}

module.exports = new NutritionService(); 