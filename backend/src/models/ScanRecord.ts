import mongoose, { Schema } from 'mongoose';
import { IScanRecord, INutritionFacts } from '../types';

const nutritionFactsSchema = new Schema<INutritionFacts>({
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbohydrates: { type: Number, required: true },
  sugars: { type: Number, required: true },
  fat: { type: Number, required: true },
  saturatedFat: { type: Number, required: true },
  sodium: { type: Number, required: true },
  fiber: { type: Number, required: true },
  servingSize: { type: String, required: true }
}, { _id: false });

const scanRecordSchema = new Schema<IScanRecord>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  nutritionFacts: {
    type: nutritionFactsSchema,
    required: true
  },
  ocrText: {
    type: String,
    required: true,
    trim: true
  },
  healthScore: {
    type: Number,
    required: true,
    min: [1, 'Health score must be at least 1'],
    max: [10, 'Health score cannot exceed 10']
  },
  aiAnalysis: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  scannedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
scanRecordSchema.index({ userId: 1, scannedAt: -1 });
scanRecordSchema.index({ productName: 'text' });

export const ScanRecord = mongoose.model<IScanRecord>('ScanRecord', scanRecordSchema);

