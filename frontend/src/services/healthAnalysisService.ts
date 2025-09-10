import { ProcessedProductData } from './openFoodFactsService';

export interface HealthScore {
  overall: number; // 1-10 scale
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  riskLevel: 'low' | 'medium' | 'high';
  breakdown: {
    nutrition: number;
    processing: number;
    additives: number;
    allergens: number;
  };
}

export interface HealthAnalysis {
  barcode: string;
  productName: string;
  brand: string;
  healthScore: HealthScore;
  nutritionalHighlights: {
    positive: string[];
    negative: string[];
  };
  processingLevel: {
    group: number;
    name: string;
    description: string;
    recommendation: string;
  };
  ingredientWarnings: {
    harmful: string[];
    questionable: string[];
    allergens: string[];
  };
  recommendations: string[];
  alternatives: string[];
  dataSource: 'openfoodfacts' | 'web_search';
  lastAnalyzed: Date;
}

class HealthAnalysisService {
  // Harmful additives to watch out for
  private harmfulAdditives = [
    'artificial colors',
    'artificial flavors',
    'high fructose corn syrup',
    'trans fat',
    'partially hydrogenated',
    'sodium nitrite',
    'sodium nitrate',
    'bha',
    'bht',
    'tbhq',
    'potassium bromate',
    'azodicarbonamide',
    'carrageenan',
    'polysorbate 80',
    'sodium benzoate',
    'potassium sorbate',
    'sodium sulfite',
    'tartrazine',
    'sunset yellow',
    'carmoisine',
    'allura red',
    'quinoline yellow',
    'aspartame',
    'sucralose',
    'acesulfame k',
    'saccharin',
    'neotame',
  ];

  // Questionable additives (moderate concern)
  private questionableAdditives = [
    'monosodium glutamate',
    'msg',
    'natural flavors',
    'artificial flavors',
    'xanthan gum',
    'guar gum',
    'lecithin',
    'glycerin',
    'propylene glycol',
    'sodium phosphate',
    'calcium phosphate',
    'titanium dioxide',
    'silicon dioxide',
    'magnesium stearate',
  ];

  // Common allergens
  private commonAllergens = [
    'milk',
    'eggs',
    'fish',
    'shellfish',
    'tree nuts',
    'peanuts',
    'wheat',
    'soybeans',
    'sesame',
    'mustard',
    'celery',
    'lupin',
    'sulphites',
  ];

  /**
   * Analyze product health and generate comprehensive health report
   */
  analyzeProduct(productData: ProcessedProductData): HealthAnalysis {
    console.log(`Analyzing health for product: ${productData.productName}`);

    const healthScore = this.calculateHealthScore(productData);
    const nutritionalHighlights = this.analyzeNutrition(productData);
    const processingLevel = this.analyzeProcessingLevel(productData);
    const ingredientWarnings = this.analyzeIngredients(productData);
    const recommendations = this.generateRecommendations(productData, healthScore, processingLevel);
    const alternatives = this.suggestAlternatives(productData, processingLevel);

    return {
      barcode: productData.barcode,
      productName: productData.productName,
      brand: productData.brand,
      healthScore,
      nutritionalHighlights,
      processingLevel,
      ingredientWarnings,
      recommendations,
      alternatives,
      dataSource: productData.dataSource,
      lastAnalyzed: new Date(),
    };
  }

  /**
   * Calculate overall health score (1-10 scale)
   */
  private calculateHealthScore(productData: ProcessedProductData): HealthScore {
    let nutritionScore = 5; // Base score
    let processingScore = 5;
    let additivesScore = 5;
    let allergensScore = 5;

    // Nutrition scoring based on Nutri-Score and nutritional content
    if (productData.healthIndicators.nutriscoreGrade) {
      switch (productData.healthIndicators.nutriscoreGrade.toLowerCase()) {
        case 'a':
          nutritionScore = 9;
          break;
        case 'b':
          nutritionScore = 7;
          break;
        case 'c':
          nutritionScore = 5;
          break;
        case 'd':
          nutritionScore = 3;
          break;
        case 'e':
          nutritionScore = 1;
          break;
        default:
          nutritionScore = 5;
      }
    }

    // Adjust nutrition score based on specific nutrients
    const nutrition = productData.nutritionFacts;
    
    // Positive nutrients (increase score)
    if (nutrition.fiber > 3) nutritionScore += 0.5;
    if (nutrition.protein > 10) nutritionScore += 0.5;
    if (nutrition.vitaminC > 10) nutritionScore += 0.3;
    if (nutrition.calcium > 100) nutritionScore += 0.3;
    if (nutrition.iron > 2) nutritionScore += 0.3;

    // Negative nutrients (decrease score)
    if (nutrition.sugars > 15) nutritionScore -= 1;
    if (nutrition.sodium > 400) nutritionScore -= 1;
    if (nutrition.saturatedFat > 5) nutritionScore -= 0.5;
    if (nutrition.transFat > 0) nutritionScore -= 1.5;
    if (nutrition.salt > 1.5) nutritionScore -= 0.5;

    // Processing level scoring
    switch (productData.healthIndicators.novaGroup) {
      case 1:
        processingScore = 9; // Unprocessed/minimally processed
        break;
      case 2:
        processingScore = 7; // Processed culinary ingredients
        break;
      case 3:
        processingScore = 4; // Processed foods
        break;
      case 4:
        processingScore = 1; // Ultra-processed foods
        break;
      default:
        processingScore = 5;
    }

    // Additives scoring
    const harmfulCount = this.countHarmfulAdditives(productData.additives);
    const questionableCount = this.countQuestionableAdditives(productData.additives);
    
    additivesScore = Math.max(1, 5 - (harmfulCount * 2) - (questionableCount * 0.5));

    // Allergens scoring (neutral unless user has specific allergies)
    allergensScore = 5; // Could be customized based on user profile

    // Calculate overall score
    const overall = Math.round((nutritionScore + processingScore + additivesScore + allergensScore) / 4 * 10) / 10;
    const clampedOverall = Math.max(1, Math.min(10, overall));

    // Determine grade and risk level
    const grade = this.getGradeFromScore(clampedOverall);
    const riskLevel = this.getRiskLevelFromScore(clampedOverall);

    return {
      overall: clampedOverall,
      grade,
      riskLevel,
      breakdown: {
        nutrition: Math.round(nutritionScore * 10) / 10,
        processing: Math.round(processingScore * 10) / 10,
        additives: Math.round(additivesScore * 10) / 10,
        allergens: Math.round(allergensScore * 10) / 10,
      },
    };
  }

  /**
   * Analyze nutritional content and identify highlights/concerns
   */
  private analyzeNutrition(productData: ProcessedProductData): { positive: string[]; negative: string[] } {
    const positive: string[] = [];
    const negative: string[] = [];
    const nutrition = productData.nutritionFacts;

    // Positive highlights
    if (nutrition.fiber > 3) {
      positive.push(`High in fiber (${nutrition.fiber}g per 100g)`);
    }
    if (nutrition.protein > 10) {
      positive.push(`Good source of protein (${nutrition.protein}g per 100g)`);
    }
    if (nutrition.vitaminC > 10) {
      positive.push(`Rich in vitamin C (${nutrition.vitaminC}mg per 100g)`);
    }
    if (nutrition.calcium > 100) {
      positive.push(`Good source of calcium (${nutrition.calcium}mg per 100g)`);
    }
    if (nutrition.iron > 2) {
      positive.push(`Contains iron (${nutrition.iron}mg per 100g)`);
    }

    // Negative concerns
    if (nutrition.sugars > 15) {
      negative.push(`High in sugar (${nutrition.sugars}g per 100g)`);
    }
    if (nutrition.sodium > 400) {
      negative.push(`High in sodium (${nutrition.sodium}mg per 100g)`);
    }
    if (nutrition.saturatedFat > 5) {
      negative.push(`High in saturated fat (${nutrition.saturatedFat}g per 100g)`);
    }
    if (nutrition.transFat > 0) {
      negative.push(`Contains trans fats (${nutrition.transFat}g per 100g)`);
    }
    if (nutrition.salt > 1.5) {
      negative.push(`High in salt (${nutrition.salt}g per 100g)`);
    }
    if (nutrition.energy > 400) {
      negative.push(`High in calories (${nutrition.energy}${nutrition.energyUnit} per 100g)`);
    }

    return { positive, negative };
  }

  /**
   * Analyze processing level and provide recommendations
   */
  private analyzeProcessingLevel(productData: ProcessedProductData): {
    group: number;
    name: string;
    description: string;
    recommendation: string;
  } {
    const novaGroup = productData.healthIndicators.novaGroup;
    
    switch (novaGroup) {
      case 1:
        return {
          group: 1,
          name: 'Unprocessed or minimally processed foods',
          description: 'Natural foods with minimal processing, such as fresh fruits, vegetables, grains, and nuts.',
          recommendation: 'Excellent choice! These foods are the foundation of a healthy diet.',
        };
      case 2:
        return {
          group: 2,
          name: 'Processed culinary ingredients',
          description: 'Ingredients used in cooking, such as oils, butter, sugar, and salt.',
          recommendation: 'Use in moderation as part of a balanced diet.',
        };
      case 3:
        return {
          group: 3,
          name: 'Processed foods',
          description: 'Foods that have been processed to improve taste or shelf life, such as canned vegetables or cheese.',
          recommendation: 'Consume occasionally. Check labels for added sugars, salt, and preservatives.',
        };
      case 4:
        return {
          group: 4,
          name: 'Ultra-processed foods',
          description: 'Highly processed foods with many additives, such as packaged snacks, sodas, and ready meals.',
          recommendation: 'Limit consumption. These foods are often high in sugar, salt, and unhealthy fats.',
        };
      default:
        return {
          group: 0,
          name: 'Unknown processing level',
          description: 'Unable to determine the processing level of this product.',
          recommendation: 'Check the ingredient list and nutrition facts carefully.',
        };
    }
  }

  /**
   * Analyze ingredients for harmful substances and allergens
   */
  private analyzeIngredients(productData: ProcessedProductData): {
    harmful: string[];
    questionable: string[];
    allergens: string[];
  } {
    const harmful: string[] = [];
    const questionable: string[] = [];
    const allergens: string[] = [];

    // Check additives
    productData.additives.forEach(additive => {
      const lowerAdditive = additive.toLowerCase();
      
      if (this.harmfulAdditives.some(harmful => lowerAdditive.includes(harmful))) {
        harmful.push(additive);
      } else if (this.questionableAdditives.some(questionable => lowerAdditive.includes(questionable))) {
        questionable.push(additive);
      }
    });

    // Check allergens
    productData.allergens.forEach(allergen => {
      const lowerAllergen = allergen.toLowerCase();
      if (this.commonAllergens.some(common => lowerAllergen.includes(common))) {
        allergens.push(allergen);
      }
    });

    // Also check ingredients text for allergens
    productData.ingredients.forEach(ingredient => {
      const lowerIngredient = ingredient.toLowerCase();
      this.commonAllergens.forEach(allergen => {
        if (lowerIngredient.includes(allergen) && !allergens.includes(ingredient)) {
          allergens.push(ingredient);
        }
      });
    });

    return { harmful, questionable, allergens };
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    productData: ProcessedProductData,
    healthScore: HealthScore,
    processingLevel: any
  ): string[] {
    const recommendations: string[] = [];

    // Overall health score recommendations
    if (healthScore.overall >= 8) {
      recommendations.push('This is a healthy choice! Great for regular consumption.');
    } else if (healthScore.overall >= 6) {
      recommendations.push('This is a moderately healthy choice. Good for occasional consumption.');
    } else if (healthScore.overall >= 4) {
      recommendations.push('This product has some health concerns. Consume in moderation.');
    } else {
      recommendations.push('This product has significant health concerns. Consider healthier alternatives.');
    }

    // Processing level recommendations
    if (processingLevel.group === 4) {
      recommendations.push('This is an ultra-processed food. Try to limit consumption and look for less processed alternatives.');
    } else if (processingLevel.group === 3) {
      recommendations.push('This is a processed food. Check the ingredient list for added sugars and preservatives.');
    }

    // Specific nutrient recommendations
    const nutrition = productData.nutritionFacts;
    if (nutrition.sugars > 15) {
      recommendations.push('High sugar content. Consider portion control or look for lower-sugar alternatives.');
    }
    if (nutrition.sodium > 400) {
      recommendations.push('High sodium content. This may contribute to high blood pressure if consumed regularly.');
    }
    if (nutrition.saturatedFat > 5) {
      recommendations.push('High saturated fat content. Consider limiting intake for heart health.');
    }

    // Additive recommendations
    const harmfulCount = this.countHarmfulAdditives(productData.additives);
    if (harmfulCount > 0) {
      recommendations.push(`Contains ${harmfulCount} potentially harmful additive${harmfulCount > 1 ? 's' : ''}. Consider natural alternatives.`);
    }

    return recommendations;
  }

  /**
   * Suggest healthier alternatives
   */
  private suggestAlternatives(productData: ProcessedProductData, processingLevel: any): string[] {
    const alternatives: string[] = [];

    // Category-based alternatives
    const categories = productData.categories.map(cat => cat.toLowerCase());
    
    if (categories.some(cat => cat.includes('snack') || cat.includes('chips'))) {
      alternatives.push('Fresh fruits and vegetables', 'Nuts and seeds', 'Homemade popcorn');
    }
    
    if (categories.some(cat => cat.includes('soda') || cat.includes('soft drink'))) {
      alternatives.push('Water', 'Sparkling water with fruit', 'Herbal teas', 'Fresh fruit juices (in moderation)');
    }
    
    if (categories.some(cat => cat.includes('candy') || cat.includes('chocolate'))) {
      alternatives.push('Dark chocolate (70%+ cocoa)', 'Fresh fruits', 'Dried fruits (no added sugar)');
    }
    
    if (categories.some(cat => cat.includes('cereal') || cat.includes('breakfast'))) {
      alternatives.push('Oatmeal', 'Greek yogurt with berries', 'Whole grain toast with avocado');
    }

    // Processing level alternatives
    if (processingLevel.group >= 3) {
      alternatives.push('Look for less processed versions of this product', 'Make homemade versions when possible');
    }

    return alternatives;
  }

  /**
   * Count harmful additives
   */
  private countHarmfulAdditives(additives: string[]): number {
    return additives.filter(additive => 
      this.harmfulAdditives.some(harmful => 
        additive.toLowerCase().includes(harmful)
      )
    ).length;
  }

  /**
   * Count questionable additives
   */
  private countQuestionableAdditives(additives: string[]): number {
    return additives.filter(additive => 
      this.questionableAdditives.some(questionable => 
        additive.toLowerCase().includes(questionable)
      )
    ).length;
  }

  /**
   * Convert numeric score to letter grade
   */
  private getGradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 9) return 'A';
    if (score >= 7) return 'B';
    if (score >= 5) return 'C';
    if (score >= 3) return 'D';
    return 'F';
  }

  /**
   * Convert numeric score to risk level
   */
  private getRiskLevelFromScore(score: number): 'low' | 'medium' | 'high' {
    if (score >= 7) return 'low';
    if (score >= 4) return 'medium';
    return 'high';
  }
}

export const healthAnalysisService = new HealthAnalysisService();
export default healthAnalysisService;
