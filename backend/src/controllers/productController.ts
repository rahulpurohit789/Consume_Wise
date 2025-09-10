import { Request, Response } from 'express';
import { ScanRecord } from '../models/ScanRecord';
import { NutritionService } from '../services/nutritionService';
import { OCRService } from '../services/ocrService';
import { IApiResponse, IScanRecordInput } from '../types';

export class ProductController {
  private nutritionService: NutritionService;
  private ocrService: OCRService;

  constructor() {
    this.nutritionService = NutritionService.getInstance();
    this.ocrService = OCRService.getInstance();
  }

  /**
   * Scan product using barcode, name, or image
   */
  async scanProduct(req: any, res: Response): Promise<void> {
    try {
      const { barcode, productName, imageUrl } = req.body;
      const userId = req.user?._id;

      let analysis;
      let inputMethod: 'barcode' | 'name' | 'ocr' = 'name';
      let ocrData: any = null;

      // Determine input method and process accordingly
      if (barcode) {
        inputMethod = 'barcode';
        analysis = await this.nutritionService.analyzeProduct(inputMethod, { barcode });
      } else if (productName) {
        inputMethod = 'name';
        analysis = await this.nutritionService.analyzeProduct(inputMethod, { productName });
      } else if (req.file) {
        // Process uploaded image with OCR
        inputMethod = 'ocr';
        const ocrResult = await this.ocrService.extractText(req.file.buffer);
        
        ocrData = {
          productName: this.ocrService.extractProductName(ocrResult.text),
          nutritionFacts: this.ocrService.extractNutritionFacts(ocrResult.text),
          ingredients: this.ocrService.extractIngredients(ocrResult.text),
          ocrText: ocrResult.text
        };

        analysis = await this.nutritionService.analyzeProduct(inputMethod, ocrData);
      } else {
        res.status(400).json({
          success: false,
          message: 'Either barcode, productName, or image file is required'
        });
        return;
      }

      // Save scan record if user is authenticated
      if (userId) {
        const scanRecord: IScanRecordInput = {
          userId,
          productName: analysis.name,
          ingredients: ocrData?.ingredients || [],
          nutritionFacts: analysis.nutrition_label,
          ocrText: ocrData?.ocrText || '',
          healthScore: analysis.score,
          aiAnalysis: analysis.reason,
          imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined
        };

        await ScanRecord.create(scanRecord);
      }

      res.json({
        success: true,
        data: analysis,
        message: 'Product analyzed successfully'
      });
    } catch (error) {
      console.error('Scan product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze product'
      });
    }
  }

  /**
   * Get product details by ID
   */
  async getProduct(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const scanRecord = await ScanRecord.findOne({
        _id: id,
        ...(userId && { userId }) // Only return user's own records if authenticated
      });

      if (!scanRecord) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      res.json({
        success: true,
        data: scanRecord,
        message: 'Product retrieved successfully'
      });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve product'
      });
    }
  }

  /**
   * Get user's scan history
   */
  async getHistory(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const { page = 1, limit = 10, sortBy = 'scannedAt', sortOrder = 'desc' } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const [scanRecords, totalCount] = await Promise.all([
        ScanRecord.find({ userId })
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit as string))
          .select('-ocrText') // Exclude OCR text for performance
          .lean(),
        ScanRecord.countDocuments({ userId })
      ]);

      const totalPages = Math.ceil(totalCount / parseInt(limit as string));

      res.json({
        success: true,
        data: {
          scanRecords,
          pagination: {
            currentPage: parseInt(page as string),
            totalPages,
            totalCount,
            hasNextPage: parseInt(page as string) < totalPages,
            hasPrevPage: parseInt(page as string) > 1
          }
        },
        message: 'History retrieved successfully'
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve history'
      });
    }
  }

  /**
   * Delete scan record
   */
  async deleteHistory(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const scanRecord = await ScanRecord.findOneAndDelete({
        _id: id,
        userId
      });

      if (!scanRecord) {
        res.status(404).json({
          success: false,
          message: 'Record not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Record deleted successfully'
      });
    } catch (error) {
      console.error('Delete history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete record'
      });
    }
  }

  /**
   * Get user statistics
   */
  async getStats(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const [
        totalScans,
        recommendedScans,
        averageScore,
        recentScans
      ] = await Promise.all([
        ScanRecord.countDocuments({ userId }),
        ScanRecord.countDocuments({ userId, healthScore: { $gte: 6 } }),
        ScanRecord.aggregate([
          { $match: { userId } },
          { $group: { _id: null, avgScore: { $avg: '$healthScore' } } }
        ]),
        ScanRecord.find({ userId })
          .sort({ scannedAt: -1 })
          .limit(5)
          .select('productName healthScore scannedAt')
          .lean()
      ]);

      const avgScore = averageScore[0]?.avgScore || 0;

      res.json({
        success: true,
        data: {
          totalScans,
          recommendedScans,
          averageScore: Math.round(avgScore * 10) / 10,
          recommendationRate: totalScans > 0 ? Math.round((recommendedScans / totalScans) * 100) : 0,
          recentScans
        },
        message: 'Statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics'
      });
    }
  }
}

