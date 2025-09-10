import { Document } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  preferences?: {
    allergies: string[];
    dietaryRestrictions: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserInput {
  email: string;
  password: string;
  name: string;
  preferences?: {
    allergies: string[];
    dietaryRestrictions: string[];
  };
}

// Nutrition Facts Types
export interface INutritionFacts {
  calories: number;
  protein: number;
  carbohydrates: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  sodium: number;
  fiber: number;
  servingSize: string;
}

// Scan Record Types
export interface IScanRecord extends Document {
  _id: string;
  userId: string;
  productName: string;
  ingredients: string[];
  nutritionFacts: INutritionFacts;
  ocrText: string;
  healthScore: number;
  aiAnalysis: string;
  imageUrl?: string;
  scannedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScanRecordInput {
  userId: string;
  productName: string;
  ingredients: string[];
  nutritionFacts: INutritionFacts;
  ocrText: string;
  healthScore: number;
  aiAnalysis: string;
  imageUrl?: string;
}

// API Response Types
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface IProductAnalysis {
  name: string;
  brand: string;
  should_consume: 'Yes' | 'No';
  score: number;
  reason: string;
  nutrition_label: INutritionFacts;
  healthConcerns?: string[];
  alternatives?: string[];
}

// OCR Types
export interface IOCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: any[];
}

// Authentication Types
export interface IAuthRequest extends Request {
  user?: IUser;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  name: string;
}

// File Upload Types
export interface IUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Health Analysis Types
export interface IHealthAnalysis {
  score: number;
  concerns: string[];
  benefits: string[];
  recommendations: string[];
  alternatives: string[];
}

// Open Food Facts API Types
export interface IOpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  ingredients_text?: string;
  categories?: string;
  nutriments?: {
    'energy-kcal'?: number;
    'proteins'?: number;
    'fat'?: number;
    'sugars'?: number;
    'sodium'?: number;
    'fiber'?: number;
    'saturated-fat'?: number;
    'carbohydrates'?: number;
  };
  serving_size?: string;
  serving_quantity?: number;
  serving_unit?: string;
  quantity?: string;
}

