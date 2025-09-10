import axios from 'axios';

export interface OpenFoodFactsProduct {
  code: string;
  status: number;
  status_verbose: string;
  product: {
    _id: string;
    product_name: string;
    product_name_en: string;
    brands: string;
    categories: string;
    categories_en: string;
    ingredients_text: string;
    ingredients_text_en: string;
    allergens: string;
    allergens_en: string;
    additives_tags: string[];
    nutrition_grades: string;
    nova_group: number;
    nova_groups: string;
    nutriscore_grade: string;
    nutriscore_score: number;
    nutriments: {
      energy_100g: number;
      energy_unit: string;
      proteins_100g: number;
      carbohydrates_100g: number;
      sugars_100g: number;
      fat_100g: number;
      'saturated-fat_100g': number;
      fiber_100g: number;
      sodium_100g: number;
      salt_100g: number;
      'trans-fat_100g': number;
      cholesterol_100g: number;
      'vitamin-a_100g': number;
      'vitamin-c_100g': number;
      'vitamin-d_100g': number;
      calcium_100g: number;
      iron_100g: number;
      potassium_100g: number;
    };
    image_url: string;
    image_front_url: string;
    image_nutrition_url: string;
    image_ingredients_url: string;
    url: string;
    created_t: number;
    last_modified_t: number;
  };
}

export interface ProcessedProductData {
  barcode: string;
  productName: string;
  brand: string;
  categories: string[];
  ingredients: string[];
  allergens: string[];
  additives: string[];
  nutritionFacts: {
    energy: number;
    energyUnit: string;
    protein: number;
    carbohydrates: number;
    sugars: number;
    fat: number;
    saturatedFat: number;
    fiber: number;
    sodium: number;
    salt: number;
    transFat: number;
    cholesterol: number;
    vitaminA: number;
    vitaminC: number;
    vitaminD: number;
    calcium: number;
    iron: number;
    potassium: number;
  };
  healthIndicators: {
    nutriscoreGrade: string;
    nutriscoreScore: number;
    novaGroup: number;
    novaGroupName: string;
  };
  images: {
    product: string;
    nutrition: string;
    ingredients: string;
  };
  url: string;
  dataSource: 'openfoodfacts';
  lastModified: Date;
}

class OpenFoodFactsService {
  private baseUrl = 'https://world.openfoodfacts.org/api/v2';
  private timeout = 10000; // 10 seconds

  /**
   * Search for a product by barcode
   */
  async getProductByBarcode(barcode: string): Promise<ProcessedProductData | null> {
    try {
      console.log(`Searching OpenFoodFacts for barcode: ${barcode}`);
      
      const response = await axios.get<OpenFoodFactsProduct>(
        `${this.baseUrl}/product/${barcode}.json`,
        {
          timeout: this.timeout,
          headers: {
            'User-Agent': 'ConsumeWise/1.0 (https://consumewise.com)',
          },
        }
      );

      if (response.data.status === 0) {
        console.log(`Product not found in OpenFoodFacts: ${barcode}`);
        return null;
      }

      if (!response.data.product) {
        console.log(`No product data in response for barcode: ${barcode}`);
        return null;
      }

      const product = response.data.product;
      console.log(`Product found in OpenFoodFacts: ${product.product_name}`);

      return this.processProductData(response.data);
    } catch (error: any) {
      console.error('Error fetching product from OpenFoodFacts:', error);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - OpenFoodFacts API is slow to respond');
      }
      
      if (error.response?.status === 404) {
        return null; // Product not found
      }
      
      throw new Error(`Failed to fetch product data: ${error.message}`);
    }
  }

  /**
   * Search for products by name
   */
  async searchProductsByName(query: string, limit: number = 20): Promise<ProcessedProductData[]> {
    try {
      console.log(`Searching OpenFoodFacts for: ${query}`);
      
      const response = await axios.get(
        `${this.baseUrl}/cgi/search.pl`,
        {
          timeout: this.timeout,
          params: {
            search_terms: query,
            search_simple: 1,
            action: 'process',
            json: 1,
            page_size: limit,
            sort_by: 'popularity',
            search_terms2: query, // Try alternative search
            page: 1,
          },
          headers: {
            'User-Agent': 'ConsumeWise/1.0 (https://consumewise.com)',
          },
        }
      );

      console.log('OpenFoodFacts search response:', response.data);
      
      if (!response.data.products || response.data.products.length === 0) {
        console.log(`No products found for query: ${query}`);
        console.log('Response data:', response.data);
        
        // Try a simpler search as fallback
        try {
          console.log('Trying fallback search...');
          const fallbackResponse = await axios.get(
            `${this.baseUrl}/cgi/search.pl`,
            {
              timeout: this.timeout,
              params: {
                search_terms: query,
                action: 'process',
                json: 1,
                page_size: limit,
              },
              headers: {
                'User-Agent': 'ConsumeWise/1.0 (https://consumewise.com)',
              },
            }
          );
          
          if (fallbackResponse.data.products && fallbackResponse.data.products.length > 0) {
            console.log(`Fallback search found ${fallbackResponse.data.products.length} products`);
            const products = fallbackResponse.data.products
              .filter((product: any) => product.product_name && product.code)
              .slice(0, limit)
              .map((product: any) => this.processProductData({ product }));
            return products;
          }
        } catch (fallbackError) {
          console.log('Fallback search also failed:', fallbackError);
        }
        
        return [];
      }

      const products = response.data.products
        .filter((product: any) => product.product_name && product.code)
        .slice(0, limit)
        .map((product: any) => this.processProductData({ product }));

      console.log(`Found ${products.length} products for query: ${query}`);
      return products;
    } catch (error: any) {
      console.error('Error searching products in OpenFoodFacts:', error);
      throw new Error(`Failed to search products: ${error.message}`);
    }
  }

  /**
   * Process raw OpenFoodFacts data into our standardized format
   */
  private processProductData(data: OpenFoodFactsProduct): ProcessedProductData {
    const product = data.product;

    // Parse categories
    const categories = product.categories_en 
      ? product.categories_en.split(',').map(cat => cat.trim())
      : product.categories 
        ? product.categories.split(',').map(cat => cat.trim())
        : [];

    // Parse ingredients
    const ingredients = product.ingredients_text_en 
      ? product.ingredients_text_en.split(',').map(ing => ing.trim())
      : product.ingredients_text 
        ? product.ingredients_text.split(',').map(ing => ing.trim())
        : [];

    // Parse allergens
    const allergens = product.allergens_en 
      ? product.allergens_en.split(',').map(all => all.trim())
      : product.allergens 
        ? product.allergens.split(',').map(all => all.trim())
        : [];

    // Process additives
    const additives = product.additives_tags 
      ? product.additives_tags.map(tag => tag.replace('en:', '').replace(/-/g, ' '))
      : [];

    // Process nutrition facts
    const nutriments = product.nutriments || {};
    const nutritionFacts = {
      energy: nutriments.energy_100g || 0,
      energyUnit: nutriments.energy_unit || 'kcal',
      protein: nutriments.proteins_100g || 0,
      carbohydrates: nutriments.carbohydrates_100g || 0,
      sugars: nutriments.sugars_100g || 0,
      fat: nutriments.fat_100g || 0,
      saturatedFat: nutriments['saturated-fat_100g'] || 0,
      fiber: nutriments.fiber_100g || 0,
      sodium: nutriments.sodium_100g || 0,
      salt: nutriments.salt_100g || 0,
      transFat: nutriments['trans-fat_100g'] || 0,
      cholesterol: nutriments.cholesterol_100g || 0,
      vitaminA: nutriments['vitamin-a_100g'] || 0,
      vitaminC: nutriments['vitamin-c_100g'] || 0,
      vitaminD: nutriments['vitamin-d_100g'] || 0,
      calcium: nutriments.calcium_100g || 0,
      iron: nutriments.iron_100g || 0,
      potassium: nutriments.potassium_100g || 0,
    };

    // Process health indicators
    const healthIndicators = {
      nutriscoreGrade: product.nutriscore_grade || product.nutrition_grades || 'unknown',
      nutriscoreScore: product.nutriscore_score || 0,
      novaGroup: product.nova_group || 0,
      novaGroupName: this.getNovaGroupName(product.nova_group || 0),
    };

    // Process images
    const images = {
      product: product.image_url || product.image_front_url || '',
      nutrition: product.image_nutrition_url || '',
      ingredients: product.image_ingredients_url || '',
    };

    return {
      barcode: product._id || data.code,
      productName: product.product_name_en || product.product_name || 'Unknown Product',
      brand: product.brands || 'Unknown Brand',
      categories,
      ingredients,
      allergens,
      additives,
      nutritionFacts,
      healthIndicators,
      images,
      url: product.url || `https://world.openfoodfacts.org/product/${data.code}`,
      dataSource: 'openfoodfacts' as const,
      lastModified: new Date((product.last_modified_t || product.created_t || 0) * 1000),
    };
  }

  /**
   * Get human-readable NOVA group name
   */
  private getNovaGroupName(novaGroup: number): string {
    switch (novaGroup) {
      case 1:
        return 'Unprocessed or minimally processed foods';
      case 2:
        return 'Processed culinary ingredients';
      case 3:
        return 'Processed foods';
      case 4:
        return 'Ultra-processed foods';
      default:
        return 'Unknown processing level';
    }
  }

  /**
   * Check if the service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/product/3017620422003.json`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('OpenFoodFacts service check failed:', error);
      return false;
    }
  }
}

export const openFoodFactsService = new OpenFoodFactsService();
export default openFoodFactsService;
