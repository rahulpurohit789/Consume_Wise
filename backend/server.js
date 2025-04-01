const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Configuration
const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
if (!HUGGING_FACE_TOKEN) {
  console.error('HUGGING_FACE_TOKEN environment variable is not set');
  process.exit(1);
}
const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

// Training examples for product recommendations
const HEALTHY_EXAMPLES = [
  { name: "Saffola Oats", reason: "High in fiber and protein, low in sugar. Perfect for a healthy breakfast." },
  { name: "Amul Toned Milk", reason: "Good source of calcium and protein, with reduced fat content." },
  { name: "Britannia Nutrichoice", reason: "High fiber biscuits with whole grains, good for digestive health." },
  { name: "MTR Dosa Mix", reason: "Made from natural ingredients, good source of complex carbs." },
  { name: "Patanjali Honey", reason: "Natural sweetener with antibacterial properties, better than refined sugar." }
];

const UNHEALTHY_EXAMPLES = [
  { name: "Lay's Potato Chips", reason: "High in sodium and unhealthy fats, minimal nutritional value." },
  { name: "Cadbury Dairy Milk", reason: "High sugar content and empty calories, can lead to weight gain." },
  { name: "Maggi Noodles", reason: "High in sodium and refined carbs, low in essential nutrients." },
  { name: "Coca Cola", reason: "High in sugar with no nutritional value, can harm dental health." },
  { name: "Bourbon Biscuits", reason: "High in sugar and trans fats, low in beneficial nutrients." }
];

async function getProductFromOpenFoodFacts(barcode) {
  try {
    // Focus on Indian products (890 prefix)
    if (!barcode.startsWith('890')) {
      console.log('Warning: Not an Indian product barcode');
    }

    console.log(`\nFetching product info for barcode: ${barcode}`);
    const response = await axios.get(`https://in.openfoodfacts.org/api/v0/product/${barcode}.json`);
    
    if (response.data && response.data.product) {
      const product = response.data.product;
      
      // Get serving size with proper formatting
      let servingSize = 'N/A';
      if (product.serving_size) {
        servingSize = product.serving_size;
      } else if (product.serving_quantity && product.serving_unit) {
        servingSize = `${product.serving_quantity}${product.serving_unit}`;
      } else if (product.quantity) {
        servingSize = product.quantity;
      } else {
        servingSize = '100g';
      }

      // Format nutrition values based on serving size
      const per100g = product.nutriments;
      const perServing = product.nutriments_serving || {};
      
      const getNutritionValue = (key, defaultValue = 'N/A') => {
        // Try to get per serving value first
        if (perServing[key] !== undefined) {
          return perServing[key];
        }
        // Fallback to per 100g value
        if (per100g[key] !== undefined) {
          return per100g[key];
        }
        return defaultValue;
      };

      const productInfo = {
        name: product.product_name || 'Unknown Product',
        brand: product.brands || 'Unknown Brand',
        nutrition: {
          serving_size: servingSize,
          calories: getNutritionValue('energy-kcal'),
          sugar: getNutritionValue('sugars'),
          fat: getNutritionValue('fat'),
          protein: getNutritionValue('proteins'),
          sodium: getNutritionValue('sodium')
        },
        ingredients: product.ingredients_text || '',
        categories: product.categories || '',
        hasNutritionData: true
      };

      // Check if we have actual nutrition data
      const hasRealData = Object.values(productInfo.nutrition)
        .filter(value => value !== 'N/A' && value !== '100g')
        .length > 1;

      productInfo.hasNutritionData = hasRealData;
      console.log('\nExtracted Product Information:', JSON.stringify(productInfo, null, 2));
      return productInfo;
    }
    console.log('No product found in Open Food Facts database');
    return null;
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error.message);
    return null;
  }
}

function evaluateNutritionalValues(nutrition) {
  let concerns = [];
  let benefits = [];

  // Check protein content
  if (nutrition.protein !== 'N/A') {
    const protein = parseFloat(nutrition.protein);
    if (protein >= 5) benefits.push('good protein content');
    if (protein < 2) concerns.push('low protein');
  }

  // Check sugar content
  if (nutrition.sugar !== 'N/A') {
    const sugar = parseFloat(nutrition.sugar);
    if (sugar > 10) concerns.push('high sugar');
    if (sugar <= 5) benefits.push('low sugar');
  }

  // Check fat content
  if (nutrition.fat !== 'N/A') {
    const fat = parseFloat(nutrition.fat);
    if (fat > 15) concerns.push('high fat');
    if (fat <= 3) benefits.push('low fat');
  }

  // Check sodium content
  if (nutrition.sodium !== 'N/A') {
    const sodium = parseFloat(nutrition.sodium);
    if (sodium > 400) concerns.push('high sodium');
    if (sodium <= 120) benefits.push('low sodium');
  }

  return { concerns, benefits };
}

async function generateNutritionLabel(productInfo) {
  const prompt = `<s>[INST] Generate realistic nutrition label values for this Indian product:

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

  try {
    console.log('\nGenerating nutrition label with LLM...');
    const response = await axios.post(API_URL, {
      inputs: prompt,
      parameters: {
        temperature: 0.3,
        max_new_tokens: 200,
        return_full_text: false
      }
    }, {
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data && response.data.length > 0) {
      const generatedText = response.data[0].generated_text;
      const startIdx = generatedText.indexOf('{');
      const endIdx = generatedText.lastIndexOf('}') + 1;
      
      if (startIdx !== -1 && endIdx !== 0) {
        const jsonStr = generatedText.slice(startIdx, endIdx)
          .replace(/\n/g, ' ')
          .replace(/\r/g, '')
          .trim();
        
        try {
          const nutrition = JSON.parse(jsonStr);
          console.log('Generated nutrition label:', nutrition);
          return nutrition;
        } catch (error) {
          console.error('Error parsing generated nutrition label:', error);
          return null;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error generating nutrition label:', error);
    return null;
  }
}

async function analyzeProductWithLLM(productInfo) {
  // If no nutrition data available, generate it
  if (!productInfo.hasNutritionData) {
    console.log('No nutrition data available, generating with LLM...');
    const generatedNutrition = await generateNutritionLabel(productInfo);
    if (generatedNutrition) {
      productInfo.nutrition = generatedNutrition;
      console.log('Using generated nutrition data:', generatedNutrition);
    }
  }

  // First do a nutritional analysis
  const { concerns, benefits } = evaluateNutritionalValues(productInfo.nutrition);
  
  // Prepare examples based on analysis
  const examples = concerns.length > benefits.length ? 
    UNHEALTHY_EXAMPLES.slice(0, 3) : 
    HEALTHY_EXAMPLES.slice(0, 3);

  const analysisPrompt = `<s>[INST] Analyze this Indian food product and provide health recommendations based on these examples:

Example products and reasons:
${examples.map(ex => `- ${ex.name}: ${ex.reason}`).join('\n')}

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
1. Base recommendation on nutritional values and examples
2. Give clear, simple 2-line reason that anyone can understand
3. Focus on health impact for Indian consumers
4. Keep nutrition label values exactly as provided
5. Score should reflect overall healthiness (10 = very healthy, 1 = unhealthy)
6. Return only the JSON, no other text [/INST]</s>`;


  try {
    console.log('\nSending analysis request to LLM...');
    const response = await axios.post(API_URL, {
      inputs: analysisPrompt,
      parameters: {
        temperature: 0.3,
        max_new_tokens: 300,
        return_full_text: false
      }
    }, {
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data && response.data.length > 0) {
      const analysisText = response.data[0].generated_text;
      console.log('Raw LLM response:', analysisText);

      // Extract and parse JSON
      const startIdx = analysisText.indexOf('{');
      const endIdx = analysisText.lastIndexOf('}') + 1;
      
      if (startIdx !== -1 && endIdx !== 0) {
        const jsonStr = analysisText.slice(startIdx, endIdx)
          .replace(/\n/g, ' ')
          .replace(/\r/g, '')
          .trim();
        
        try {
          const analysis = JSON.parse(jsonStr);
          console.log('Parsed analysis:', analysis);
          return analysis;
        } catch (parseError) {
          console.error('Error parsing LLM response:', parseError);
          // Provide a fallback response based on nutritional analysis
          return {
            should_consume: benefits.length > concerns.length ? "Yes" : "No",
            reason: concerns.length > 0 ? 
              `This product has ${concerns.join(' and ')}. Consider healthier alternatives with ${benefits.length > 0 ? benefits.join(' and ') : 'better nutritional values'}.` :
              `This product has ${benefits.join(' and ')}. Good choice for your health.`,
            score: benefits.length > concerns.length ? "10" : "1",
            nutrition_label: productInfo.nutrition
          };
        }
      }
    }
    throw new Error('Invalid response from AI model');
  } catch (error) {
    console.error('Error in LLM analysis:', error.message);
    // Return fallback response
    return {
      should_consume: benefits.length > concerns.length ? "Yes" : "No",
      reason: `Based on nutritional analysis: ${benefits.length > 0 ? 'Benefits: ' + benefits.join(', ') : ''} ${concerns.length > 0 ? 'Concerns: ' + concerns.join(', ') : ''}`,
      score: benefits.length > concerns.length ? "10" : "1",
      nutrition_label: productInfo.nutrition
    };
  }
}

// Routes
app.post('/api/products/scan', async (req, res) => {
  try {
    const { barcode } = req.body;
    console.log('Received barcode:', barcode);

    if (!barcode) {
      return res.status(400).json({ 
        message: 'Barcode is required',
        error: 'Missing barcode in request body'
      });
    }

    // Get product info from Open Food Facts (Indian database)
    const productInfo = await getProductFromOpenFoodFacts(barcode);
    
    if (!productInfo) {
      return res.status(404).json({
        message: 'Product not found in database',
        error: 'Product not available in Indian database'
      });
    }

    // Analyze product with LLM
    const analysis = await analyzeProductWithLLM(productInfo);
    
    // Return combined product information
    const response = {
      barcode,
      name: productInfo.name,
      brand: productInfo.brand,
      should_consume: analysis.should_consume,
      reason: analysis.reason,
      score: analysis.score,
      nutrition_label: analysis.nutrition_label
    };

    console.log('Final response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error processing barcode:', error);
    res.status(500).json({
      message: 'Error processing barcode',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 