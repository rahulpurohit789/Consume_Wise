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
                    // Create a basic product info for unknown barcodes
                    productInfo = {
                        name: `Product ${barcode}`,
                        brand: 'Unknown Brand',
                        nutrition: {
                            serving_size: '100g',
                            calories: 'N/A',
                            protein: 'N/A',
                            fat: 'N/A',
                            sugar: 'N/A',
                            sodium: 'N/A'
                        },
                        categories: 'Unknown',
                        ingredients: 'Unknown',
                        hasNutritionData: false
                    };
                }
            } else {
                // For direct product name entry, create product info
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
            console.log(`\nFetching product info for barcode: ${barcode}`);
            
            // Validate barcode format first
            if (!this.validateBarcodeFormat(barcode)) {
                console.log('Invalid barcode format');
                return null;
            }
            
            // Try multiple Open Food Facts endpoints with priority order
            const endpoints = [
                { url: `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, priority: 1 },
                { url: `https://in.openfoodfacts.org/api/v0/product/${barcode}.json`, priority: 2 },
                { url: `https://us.openfoodfacts.org/api/v0/product/${barcode}.json`, priority: 3 }
            ];

            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint.url}`);
                    const response = await axios.get(endpoint.url, { 
                        timeout: 8000,
                        headers: {
                            'User-Agent': 'ConsumeWise/1.0 (Food Analysis App)'
                        }
                    });
                    
                    if (response.data?.product && response.data.product.product_name) {
                        const product = response.data.product;
                        console.log(`Found product: ${product.product_name}`);
                        
                        // Assess data quality
                        const dataQuality = this.assessDataQuality(product);
                        console.log(`Data quality score: ${dataQuality.score}/100`);
                        
                        return this.formatProductInfo(product, dataQuality);
                    }
                } catch (endpointError) {
                    console.log(`Endpoint ${endpoint.url} failed:`, endpointError.message);
                    continue;
                }
            }
            
            console.log('No product found in any Open Food Facts database');
            return null;
        } catch (error) {
            console.error('Error fetching from Open Food Facts:', error.message);
            return null;
        }
    }

    validateBarcodeFormat(barcode) {
        // Validate EAN-13, EAN-8, UPC-A, UPC-E formats
        const cleanBarcode = barcode.replace(/\D/g, '');
        
        if (cleanBarcode.length === 13) {
            return this.validateEAN13(cleanBarcode);
        } else if (cleanBarcode.length === 12) {
            return this.validateUPC(cleanBarcode);
        } else if (cleanBarcode.length === 8) {
            return this.validateEAN8(cleanBarcode);
        }
        
        return false;
    }

    validateEAN13(barcode) {
        const digits = barcode.split('').map(Number);
        const checkDigit = digits[12];
        let sum = 0;
        
        for (let i = 0; i < 12; i++) {
            sum += digits[i] * (i % 2 === 0 ? 1 : 3);
        }
        
        const calculatedCheckDigit = (10 - (sum % 10)) % 10;
        return calculatedCheckDigit === checkDigit;
    }

    validateUPC(barcode) {
        const digits = barcode.split('').map(Number);
        const checkDigit = digits[11];
        let sum = 0;
        
        for (let i = 0; i < 11; i++) {
            sum += digits[i] * (i % 2 === 0 ? 3 : 1);
        }
        
        const calculatedCheckDigit = (10 - (sum % 10)) % 10;
        return calculatedCheckDigit === checkDigit;
    }

    validateEAN8(barcode) {
        const digits = barcode.split('').map(Number);
        const checkDigit = digits[7];
        let sum = 0;
        
        for (let i = 0; i < 7; i++) {
            sum += digits[i] * (i % 2 === 0 ? 3 : 1);
        }
        
        const calculatedCheckDigit = (10 - (sum % 10)) % 10;
        return calculatedCheckDigit === checkDigit;
    }

    assessDataQuality(product) {
        let score = 0;
        const maxScore = 100;
        const issues = [];
        
        // Product name (20 points)
        if (product.product_name && product.product_name.length > 3) {
            score += 20;
        } else {
            issues.push('Missing or incomplete product name');
        }
        
        // Brand information (15 points)
        if (product.brands && product.brands.length > 0) {
            score += 15;
        } else {
            issues.push('Missing brand information');
        }
        
        // Nutrition facts completeness (30 points)
        const nutritionFields = ['energy-kcal_100g', 'proteins_100g', 'fat_100g', 'carbohydrates_100g', 'sugars_100g', 'sodium_100g'];
        const nutritionScore = nutritionFields.filter(field => product.nutriments && product.nutriments[field] !== undefined).length;
        score += (nutritionScore / nutritionFields.length) * 30;
        
        if (nutritionScore < nutritionFields.length) {
            issues.push(`Missing ${nutritionFields.length - nutritionScore} nutrition facts`);
        }
        
        // Ingredients list (20 points)
        if (product.ingredients_text && product.ingredients_text.length > 10) {
            score += 20;
        } else {
            issues.push('Missing or incomplete ingredients list');
        }
        
        // Product images (10 points)
        if (product.image_front_url || product.image_ingredients_url || product.image_nutrition_url) {
            score += 10;
        } else {
            issues.push('No product images available');
        }
        
        // Categories (5 points)
        if (product.categories && product.categories.length > 0) {
            score += 5;
        } else {
            issues.push('Missing category information');
        }
        
        return {
            score: Math.round(score),
            issues: issues,
            completeness: Math.round((score / maxScore) * 100)
        };
    }

    formatProductInfo(product, dataQuality = null) {
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
            hasNutritionData: false, // Will be set after checking
            dataQuality: dataQuality,
            images: {
                front: product.image_front_url,
                ingredients: product.image_ingredients_url,
                nutrition: product.image_nutrition_url
            },
            allergens: product.allergens_tags || [],
            additives: product.additives_tags || [],
            novaGroup: product.nova_group || null,
            ecoScore: product.ecoscore_grade || null
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
            
            // For demo purposes, let's use a mock LLM response if no token is set
            if (!this.HUGGING_FACE_TOKEN) {
                console.log('HUGGING_FACE_TOKEN is not set, using mock LLM response');
                return this.createMockLLMResponse(productInfo);
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
            // Use mock response on API failure
            return this.createMockLLMResponse(productInfo);
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

    // Local product database with realistic data
    getProductFromLocalDB(barcode, productName) {
        const products = {
            // Barcode-based products
            '8902080104581': {
                name: 'KitKat',
                brand: 'Nestle',
                nutrition: {
                    serving_size: '1 bar (21g)',
                    calories: 106,
                    protein: 1.3,
                    fat: 5.3,
                    sugar: 10.6,
                    sodium: 8
                },
                ingredients: 'Sugar, wheat flour, cocoa butter, cocoa mass, milk powder, vegetable fat, emulsifier, flavoring',
                category: 'Chocolate'
            },
            '049000042566': {
                name: 'Coca-Cola',
                brand: 'Coca-Cola',
                nutrition: {
                    serving_size: '1 can (355ml)',
                    calories: 140,
                    protein: 0,
                    fat: 0,
                    sugar: 39,
                    sodium: 45
                },
                ingredients: 'Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine',
                category: 'Soft Drink'
            },
            // Name-based products
            'avocado': {
                name: 'Avocado',
                brand: 'Fresh Produce',
                nutrition: {
                    serving_size: '1 medium (150g)',
                    calories: 240,
                    protein: 3,
                    fat: 22,
                    sugar: 1,
                    sodium: 11
                },
                ingredients: 'Avocado',
                category: 'Fruit'
            },
            'kitkat': {
                name: 'KitKat',
                brand: 'Nestle',
                nutrition: {
                    serving_size: '1 bar (21g)',
                    calories: 106,
                    protein: 1.3,
                    fat: 5.3,
                    sugar: 10.6,
                    sodium: 8
                },
                ingredients: 'Sugar, wheat flour, cocoa butter, cocoa mass, milk powder, vegetable fat, emulsifier, flavoring',
                category: 'Chocolate'
            },
            'coca-cola': {
                name: 'Coca-Cola',
                brand: 'Coca-Cola',
                nutrition: {
                    serving_size: '1 can (355ml)',
                    calories: 140,
                    protein: 0,
                    fat: 0,
                    sugar: 39,
                    sodium: 45
                },
                ingredients: 'Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine',
                category: 'Soft Drink'
            }
        };

        if (barcode && products[barcode]) {
            return products[barcode];
        }
        
        if (productName) {
            const name = productName.toLowerCase().trim();
            for (const [key, product] of Object.entries(products)) {
                if (product.name.toLowerCase().includes(name) || name.includes(product.name.toLowerCase())) {
                    return product;
                }
            }
        }

        return null;
    }

    analyzeProductLocally(productInfo) {
        const nutrition = productInfo.nutrition;
        const analysis = this.performAdvancedHealthAnalysis(productInfo);
        
        return {
            name: productInfo.name,
            brand: productInfo.brand,
            should_consume: analysis.shouldConsume,
            score: analysis.healthScore,
            reason: analysis.reason,
            nutrition_label: nutrition,
            healthConcerns: analysis.concerns,
            alternatives: analysis.alternatives,
            detailedAnalysis: analysis.detailedAnalysis,
            dataQuality: productInfo.dataQuality
        };
    }

    performAdvancedHealthAnalysis(productInfo) {
        const nutrition = productInfo.nutrition;
        const analysis = {
            healthScore: 0,
            shouldConsume: 'No',
            concerns: [],
            benefits: [],
            alternatives: [],
            detailedAnalysis: {},
            reason: ''
        };

        // Multi-factor health scoring system
        const scores = {
            sugarAnalysis: this.analyzeSugarContent(nutrition, productInfo),
            processingLevel: this.assessProcessingLevel(productInfo),
            nutritionalDensity: this.assessNutritionalDensity(nutrition, productInfo),
            harmfulIngredients: this.detectHarmfulIngredients(productInfo),
            portionReality: this.assessPortionSizeReality(nutrition, productInfo),
            positiveAspects: this.identifyPositiveAspects(productInfo)
        };

        // Calculate weighted health score
        analysis.healthScore = Math.round(
            scores.sugarAnalysis.score * 0.25 +
            scores.processingLevel.score * 0.20 +
            scores.nutritionalDensity.score * 0.20 +
            scores.harmfulIngredients.score * 0.15 +
            scores.portionReality.score * 0.10 +
            scores.positiveAspects.score * 0.10
        );

        // Compile concerns and benefits
        analysis.concerns = [
            ...scores.sugarAnalysis.concerns,
            ...scores.processingLevel.concerns,
            ...scores.nutritionalDensity.concerns,
            ...scores.harmfulIngredients.concerns,
            ...scores.portionReality.concerns
        ];

        analysis.benefits = [
            ...scores.sugarAnalysis.benefits,
            ...scores.processingLevel.benefits,
            ...scores.nutritionalDensity.benefits,
            ...scores.harmfulIngredients.benefits,
            ...scores.portionReality.benefits,
            ...scores.positiveAspects.benefits
        ];

        analysis.alternatives = this.generateAlternatives(productInfo, scores);
        analysis.shouldConsume = analysis.healthScore >= 60 ? 'Yes' : 'No';
        analysis.reason = this.generateDetailedReason(productInfo, analysis, scores);
        analysis.detailedAnalysis = scores;

        return analysis;
    }

    analyzeSugarContent(nutrition, productInfo) {
        const score = { score: 0, concerns: [], benefits: [] };
        const sugarPer100g = nutrition.sugar || 0;
        const caloriesPer100g = nutrition.calories || 0;
        
        // WHO recommendation: <10% of calories from sugar
        const sugarCalories = sugarPer100g * 4; // 4 calories per gram of sugar
        const sugarPercentage = caloriesPer100g > 0 ? (sugarCalories / caloriesPer100g) * 100 : 0;
        
        if (sugarPercentage > 20) {
            score.score = 0;
            score.concerns.push('Extremely high sugar content (>20% of calories)');
        } else if (sugarPercentage > 15) {
            score.score = 20;
            score.concerns.push('High sugar content (>15% of calories)');
        } else if (sugarPercentage > 10) {
            score.score = 40;
            score.concerns.push('Moderate sugar content (>10% of calories)');
        } else if (sugarPercentage > 5) {
            score.score = 70;
            score.benefits.push('Low sugar content (<10% of calories)');
        } else {
            score.score = 100;
            score.benefits.push('Very low sugar content (<5% of calories)');
        }
        
        return score;
    }

    assessProcessingLevel(productInfo) {
        const score = { score: 50, concerns: [], benefits: [] };
        
        // NOVA classification assessment
        if (productInfo.novaGroup) {
            switch (productInfo.novaGroup) {
                case 1:
                    score.score = 100;
                    score.benefits.push('Unprocessed or minimally processed food');
                    break;
                case 2:
                    score.score = 80;
                    score.benefits.push('Processed culinary ingredients');
                    break;
                case 3:
                    score.score = 40;
                    score.concerns.push('Processed food with added ingredients');
                    break;
                case 4:
                    score.score = 0;
                    score.concerns.push('Ultra-processed food with many additives');
                    break;
            }
        }
        
        // Ingredient count analysis
        const ingredientCount = productInfo.ingredients ? productInfo.ingredients.split(',').length : 0;
        if (ingredientCount > 20) {
            score.score = Math.min(score.score, 20);
            score.concerns.push('High number of ingredients (>20)');
        } else if (ingredientCount < 5) {
            score.score = Math.max(score.score, 80);
            score.benefits.push('Simple ingredient list (<5 ingredients)');
        }
        
        return score;
    }

    assessNutritionalDensity(nutrition, productInfo) {
        const score = { score: 50, concerns: [], benefits: [] };
        
        // Protein quality assessment
        const proteinPer100g = nutrition.protein || 0;
        if (proteinPer100g > 15) {
            score.score += 20;
            score.benefits.push('High protein content (>15g per 100g)');
        } else if (proteinPer100g > 10) {
            score.score += 10;
            score.benefits.push('Good protein content (>10g per 100g)');
        } else if (proteinPer100g < 3) {
            score.score -= 10;
            score.concerns.push('Low protein content (<3g per 100g)');
        }
        
        return score;
    }

    detectHarmfulIngredients(productInfo) {
        const score = { score: 100, concerns: [], benefits: [] };
        
        // High sodium detection
        const sodiumPer100g = productInfo.nutrition?.sodium || 0;
        if (sodiumPer100g > 600) {
            score.score -= 30;
            score.concerns.push('Very high sodium content (>600mg per 100g)');
        } else if (sodiumPer100g > 400) {
            score.score -= 15;
            score.concerns.push('High sodium content (>400mg per 100g)');
        }
        
        return score;
    }

    assessPortionSizeReality(nutrition, productInfo) {
        const score = { score: 50, concerns: [], benefits: [] };
        
        // Realistic serving size assessment
        const servingSize = nutrition.serving_size || '100g';
        const caloriesPerServing = nutrition.calories || 0;
        
        if (servingSize.includes('100g') || servingSize.includes('100ml')) {
            score.score = 70;
        } else if (servingSize.includes('1') && (servingSize.includes('slice') || servingSize.includes('piece'))) {
            score.score = 80;
        } else {
            score.score = 50;
        }
        
        return score;
    }

    identifyPositiveAspects(productInfo) {
        const score = { score: 0, concerns: [], benefits: [] };
        
        // Organic certification
        if (productInfo.ingredients && productInfo.ingredients.toLowerCase().includes('organic')) {
            score.score += 20;
            score.benefits.push('Contains organic ingredients');
        }
        
        // Whole grain detection
        const wholeGrains = ['whole wheat', 'whole grain', 'brown rice', 'quinoa', 'oats'];
        if (productInfo.ingredients) {
            const hasWholeGrains = wholeGrains.some(grain => 
                productInfo.ingredients.toLowerCase().includes(grain)
            );
            if (hasWholeGrains) {
                score.score += 15;
                score.benefits.push('Contains whole grains');
            }
        }
        
        return score;
    }

    generateAlternatives(productInfo, scores) {
        const alternatives = [];
        
        // Category-based alternatives
        if (productInfo.category === 'Chocolate') {
            alternatives.push('Dark chocolate (70%+ cocoa)', 'Fresh fruits', 'Nuts and seeds');
        } else if (productInfo.category === 'Soft Drink') {
            alternatives.push('Water', 'Sparkling water', 'Fresh fruit juice', 'Herbal tea');
        }
        
        return alternatives;
    }

    generateDetailedReason(productInfo, analysis, scores) {
        let reason = `Health Score: ${analysis.healthScore}/100. `;
        
        if (analysis.shouldConsume === 'Yes') {
            reason += `This ${productInfo.name} is a good choice. `;
            if (analysis.benefits.length > 0) {
                reason += `Key benefits: ${analysis.benefits.slice(0, 3).join(', ')}. `;
            }
        } else {
            reason += `This ${productInfo.name} has health concerns. `;
            if (analysis.concerns.length > 0) {
                reason += `Main issues: ${analysis.concerns.slice(0, 3).join(', ')}. `;
            }
        }
        
        reason += 'Consider healthier alternatives for better nutrition.';
        return reason;
    }

    createMockLLMResponse(productInfo) {
        // Create realistic mock responses based on product type
        const productName = productInfo.name.toLowerCase();
        let mockResponse;

        if (productName.includes('avocado')) {
            mockResponse = {
                should_consume: "Yes",
                score: 8,
                reason: "Avocado is an excellent source of healthy monounsaturated fats, fiber, and essential nutrients like potassium and folate. It supports heart health, aids in nutrient absorption, and provides sustained energy. The healthy fats help with satiety and can support weight management when consumed in moderation.",
                nutrition_label: {
                    serving_size: "1 medium (150g)",
                    calories: 240,
                    protein: 3,
                    fat: 22,
                    sugar: 1,
                    sodium: 11
                },
                healthConcerns: [],
                alternatives: ["Fresh seasonal fruits", "Nuts and seeds", "Olive oil"]
            };
        } else if (productName.includes('kitkat') || productName.includes('chocolate')) {
            mockResponse = {
                should_consume: "No",
                score: 4,
                reason: "This chocolate product is high in sugar (10.6g) and processed ingredients. While it provides a quick energy boost, regular consumption can lead to blood sugar spikes, weight gain, and increased risk of dental issues. The high sugar content and artificial additives make it less suitable for regular consumption.",
                nutrition_label: {
                    serving_size: "1 bar (21g)",
                    calories: 106,
                    protein: 1.3,
                    fat: 5.3,
                    sugar: 10.6,
                    sodium: 8
                },
                healthConcerns: ["High sugar content", "Processed ingredients", "Artificial additives"],
                alternatives: ["Dark chocolate (70%+ cocoa)", "Fresh fruits", "Nuts and seeds", "Greek yogurt with berries"]
            };
        } else if (productName.includes('coca-cola') || productName.includes('soda')) {
            mockResponse = {
                should_consume: "No",
                score: 2,
                reason: "This soft drink is extremely high in sugar (39g per can) and contains artificial ingredients, phosphoric acid, and caffeine. It provides no nutritional value and can contribute to obesity, diabetes, dental decay, and bone density issues. The high sugar content causes rapid blood sugar spikes followed by crashes.",
                nutrition_label: {
                    serving_size: "1 can (355ml)",
                    calories: 140,
                    protein: 0,
                    fat: 0,
                    sugar: 39,
                    sodium: 45
                },
                healthConcerns: ["Extremely high sugar content", "No nutritional value", "Artificial ingredients", "Phosphoric acid", "Caffeine"],
                alternatives: ["Water", "Sparkling water", "Fresh fruit juice", "Herbal tea", "Coconut water"]
            };
        } else {
            // Generic response for unknown products
            mockResponse = {
                should_consume: "Maybe",
                score: 5,
                reason: "This product requires manual verification of nutritional information. Please check the product label for accurate nutrition facts, ingredients, and allergen information. Consider consulting with a nutritionist for personalized dietary advice.",
                nutrition_label: {
                    serving_size: "100g",
                    calories: "N/A",
                    protein: "N/A",
                    fat: "N/A",
                    sugar: "N/A",
                    sodium: "N/A"
                },
                healthConcerns: ["Unable to verify nutritional information"],
                alternatives: ["Whole food alternatives", "Fresh produce", "Unprocessed foods"]
            };
        }

        return {
            name: productInfo.name,
            brand: productInfo.brand,
            ...mockResponse
        };
    }
}

module.exports = new NutritionService(); 