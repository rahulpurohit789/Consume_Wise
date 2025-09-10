// User Types
export interface User {
  _id: string;
  email: string;
  name: string;
  preferences?: {
    allergies: string[];
    dietaryRestrictions: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message: string;
}

// Nutrition Facts Types
export interface NutritionFacts {
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

// Product Analysis Types
export interface ProductAnalysis {
  name: string;
  brand: string;
  should_consume: 'Yes' | 'No';
  score: number;
  reason: string;
  nutrition_label: NutritionFacts;
  healthConcerns?: string[];
  alternatives?: string[];
}

// Scan Record Types
export interface ScanRecord {
  _id: string;
  userId: string;
  productName: string;
  ingredients: string[];
  nutritionFacts: NutritionFacts;
  ocrText: string;
  healthScore: number;
  aiAnalysis: string;
  imageUrl?: string;
  scannedAt: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// User Statistics Types
export interface UserStats {
  totalScans: number;
  recommendedScans: number;
  averageScore: number;
  recommendationRate: number;
  recentScans: Array<{
    _id: string;
    productName: string;
    healthScore: number;
    scannedAt: string;
  }>;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  name: string;
  preferences?: {
    allergies: string[];
    dietaryRestrictions: string[];
  };
}

export interface ScanForm {
  barcode?: string;
  productName?: string;
  image?: File;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  details?: any;
}

// Camera/Scanner Types
export interface ScannerConfig {
  inputStream: {
    type: string;
    constraints: {
      width: number;
      height: number;
    };
  };
  locator: {
    patchSize: string;
    halfSample: boolean;
  };
  numOfWorkers: number;
  decoder: {
    readers: string[];
  };
  locate: boolean;
}

// File Upload Types
export interface UploadedFile {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// Health Score Types
export interface HealthScore {
  score: number;
  label: string;
  color: string;
  description: string;
}

// Navigation Types
export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current?: boolean;
}

// Chart Types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

// Toast Types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

