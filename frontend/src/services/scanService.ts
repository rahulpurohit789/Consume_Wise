import { openFoodFactsService, ProcessedProductData } from './openFoodFactsService';
import { healthAnalysisService, HealthAnalysis } from './healthAnalysisService';
import { webSearchService } from './webSearchService';
import toast from 'react-hot-toast';

export interface ScanRequest {
  barcode?: string;
  productName?: string;
  image?: File;
}

export interface ScanResult {
  success: boolean;
  data?: HealthAnalysis;
  message?: string;
  error?: string;
}

class ScanService {
  private cache = new Map<string, HealthAnalysis>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Main scan method that handles all types of scan requests
   */
  async scanProduct(request: ScanRequest): Promise<ScanResult> {
    try {
      console.log('Starting product scan:', request);

      // Handle different types of scan requests
      if (request.barcode) {
        return await this.scanByBarcode(request.barcode);
      } else if (request.productName) {
        return await this.scanByName(request.productName);
      } else if (request.image) {
        return await this.scanByImage(request.image);
      } else {
        throw new Error('No valid scan input provided');
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      return {
        success: false,
        message: 'Failed to scan product',
        error: error.message,
      };
    }
  }

  /**
   * Scan product by barcode
   */
  private async scanByBarcode(barcode: string): Promise<ScanResult> {
    try {
      // Check cache first
      const cached = this.getCachedResult(barcode);
      if (cached) {
        console.log('Returning cached result for barcode:', barcode);
        return {
          success: true,
          data: cached,
        };
      }

      // Validate barcode format
      if (!this.isValidBarcode(barcode)) {
        throw new Error('Invalid barcode format');
      }

      toast.loading('Searching for product...', { id: 'scan-loading' });

      // Try OpenFoodFacts first
      let productData: ProcessedProductData | null = null;
      
      try {
        productData = await openFoodFactsService.getProductByBarcode(barcode);
      } catch (error: any) {
        console.warn('OpenFoodFacts API error:', error);
        // Continue to web search fallback
      }

      // If not found in OpenFoodFacts, try web search
      if (!productData) {
        toast.loading('Product not found in database, searching web...', { id: 'scan-loading' });
        productData = await this.searchWebForProduct(barcode);
      }

      if (!productData) {
        toast.dismiss('scan-loading');
        return {
          success: false,
          message: `Product with barcode ${barcode} not found in our database. Try searching by product name instead, or use a different barcode.`,
        };
      }

      // Analyze the product
      toast.loading('Analyzing product health...', { id: 'scan-loading' });
      const analysis = healthAnalysisService.analyzeProduct(productData);

      // Cache the result
      this.cacheResult(barcode, analysis);

      toast.dismiss('scan-loading');
      toast.success('Product analysis complete!');

      return {
        success: true,
        data: analysis,
      };
    } catch (error: any) {
      toast.dismiss('scan-loading');
      throw error;
    }
  }

  /**
   * Scan product by name
   */
  private async scanByName(productName: string): Promise<ScanResult> {
    try {
      toast.loading('Searching for product...', { id: 'scan-loading' });

      // Search OpenFoodFacts by name
      const products = await openFoodFactsService.searchProductsByName(productName, 5);

      if (products.length === 0) {
        toast.dismiss('scan-loading');
        return {
          success: false,
          message: `No products found for "${productName}". Try searching for a more specific product name or use barcode scanning instead.`,
        };
      }

      // For now, take the first result
      // In a real app, you might want to show a list for user selection
      const productData = products[0];
      
      toast.loading('Analyzing product health...', { id: 'scan-loading' });
      const analysis = healthAnalysisService.analyzeProduct(productData);

      // Cache the result
      this.cacheResult(productData.barcode, analysis);

      toast.dismiss('scan-loading');
      toast.success('Product analysis complete!');

      return {
        success: true,
        data: analysis,
      };
    } catch (error: any) {
      toast.dismiss('scan-loading');
      throw error;
    }
  }

  /**
   * Scan product by image (placeholder for future OCR implementation)
   */
  private async scanByImage(image: File): Promise<ScanResult> {
    // This would integrate with OCR service in the future
    // For now, return a placeholder response
    toast.dismiss('scan-loading');
    return {
      success: false,
      message: 'Image scanning is not yet implemented. Please use barcode scanning or manual entry.',
    };
  }

  /**
   * Web search fallback for products not in OpenFoodFacts
   */
  private async searchWebForProduct(barcode: string): Promise<ProcessedProductData | null> {
    try {
      console.log('Attempting web search for barcode:', barcode);
      return await webSearchService.searchProductInfo(barcode);
    } catch (error) {
      console.error('Web search error:', error);
      return null;
    }
  }

  /**
   * Validate barcode format
   */
  private isValidBarcode(barcode: string): boolean {
    if (!barcode || typeof barcode !== 'string') return false;
    
    const cleanCode = barcode.replace(/[^a-zA-Z0-9]/g, '');
    
    // Check minimum length
    if (cleanCode.length < 8) return false;
    
    // Check maximum length
    if (cleanCode.length > 20) return false;
    
    // Check if it's all the same character
    if (/^(.)\1+$/.test(cleanCode)) return false;
    
    // Must contain at least some digits
    if (!/\d/.test(cleanCode)) return false;
    
    return true;
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult(key: string): HealthAnalysis | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is expired
    const now = Date.now();
    const cacheTime = cached.lastAnalyzed.getTime();
    if (now - cacheTime > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Cache analysis result
   */
  private cacheResult(key: string, analysis: HealthAnalysis): void {
    this.cache.set(key, analysis);
    
    // Limit cache size to prevent memory issues
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    toast.success('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Check if services are available
   */
  async checkServices(): Promise<{ openFoodFacts: boolean; webSearch: boolean }> {
    try {
      const [openFoodFacts, webSearch] = await Promise.all([
        openFoodFactsService.isAvailable(),
        webSearchService.isAvailable(),
      ]);
      return {
        openFoodFacts,
        webSearch,
      };
    } catch (error) {
      console.error('Service check error:', error);
      return {
        openFoodFacts: false,
        webSearch: false,
      };
    }
  }
}

export const scanService = new ScanService();
export default scanService;
