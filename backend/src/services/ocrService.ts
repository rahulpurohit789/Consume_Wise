import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { IOCRResult } from '../types';

export class OCRService {
  private static instance: OCRService;

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Process image and extract text using OCR
   */
  async extractText(imageBuffer: Buffer): Promise<IOCRResult> {
    try {
      // Preprocess image for better OCR results
      const processedImageBuffer = await this.preprocessImage(imageBuffer);

      // Perform OCR
      const { data } = await Tesseract.recognize(
        processedImageBuffer,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      return {
        text: data.text.trim(),
        confidence: data.confidence,
        boundingBoxes: data.words
      };
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Preprocess image to improve OCR accuracy
   */
  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(2000, 2000, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .grayscale()
        .normalize()
        .sharpen()
        .png()
        .toBuffer();
    } catch (error) {
      console.error('Image preprocessing error:', error);
      return imageBuffer; // Return original if preprocessing fails
    }
  }

  /**
   * Extract nutrition facts from OCR text
   */
  extractNutritionFacts(ocrText: string): any {
    const nutritionFacts: any = {};
    
    // Common nutrition fact patterns
    const patterns = {
      calories: /(?:calories?|kcal|energy)[\s:]*(\d+)/i,
      protein: /(?:protein)[\s:]*(\d+(?:\.\d+)?)\s*g/i,
      carbohydrates: /(?:carbohydrates?|carbs?)[\s:]*(\d+(?:\.\d+)?)\s*g/i,
      sugars: /(?:sugars?|total sugars?)[\s:]*(\d+(?:\.\d+)?)\s*g/i,
      fat: /(?:total fat|fat)[\s:]*(\d+(?:\.\d+)?)\s*g/i,
      saturatedFat: /(?:saturated fat|sat fat)[\s:]*(\d+(?:\.\d+)?)\s*g/i,
      sodium: /(?:sodium)[\s:]*(\d+(?:\.\d+)?)\s*mg/i,
      fiber: /(?:dietary fiber|fiber)[\s:]*(\d+(?:\.\d+)?)\s*g/i,
      servingSize: /(?:serving size|per serving)[\s:]*([^\n\r]+)/i
    };

    // Extract values using patterns
    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = ocrText.match(pattern);
      if (match) {
        if (key === 'servingSize') {
          nutritionFacts[key] = match[1].trim();
        } else {
          nutritionFacts[key] = parseFloat(match[1]);
        }
      }
    });

    return nutritionFacts;
  }

  /**
   * Extract ingredients list from OCR text
   */
  extractIngredients(ocrText: string): string[] {
    const ingredients: string[] = [];
    
    // Look for ingredients section
    const ingredientsMatch = ocrText.match(/(?:ingredients?)[\s:]*([^]*?)(?:\n\n|\n[A-Z]|$)/i);
    
    if (ingredientsMatch) {
      const ingredientsText = ingredientsMatch[1];
      
      // Split by common separators
      const ingredientList = ingredientsText
        .split(/[,;]\s*/)
        .map(ingredient => ingredient.trim())
        .filter(ingredient => ingredient.length > 0 && !ingredient.match(/^\d+$/));
      
      ingredients.push(...ingredientList);
    }

    return ingredients;
  }

  /**
   * Extract product name from OCR text
   */
  extractProductName(ocrText: string): string {
    // Try to find product name in the first few lines
    const lines = ocrText.split('\n').slice(0, 5);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 3 && 
          !trimmedLine.match(/^\d+$/) && 
          !trimmedLine.match(/^(calories?|protein|fat|sodium|ingredients?)$/i)) {
        return trimmedLine;
      }
    }
    
    return 'Unknown Product';
  }
}

