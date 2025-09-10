import { create } from 'zustand';
import { ProductAnalysis, ScanRecord, UserStats } from '../types';
import { apiService } from '../services/api';

interface ScanState {
  currentAnalysis: ProductAnalysis | null;
  scanHistory: ScanRecord[];
  userStats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface ScanActions {
  scanProduct: (data: { barcode?: string; productName?: string; image?: File }) => Promise<void>;
  getHistory: (params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => Promise<void>;
  getStats: () => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  clearCurrentAnalysis: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type ScanStore = ScanState & ScanActions;

export const useScanStore = create<ScanStore>((set, get) => ({
  // State
  currentAnalysis: null,
  scanHistory: [],
  userStats: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },

  // Actions
  scanProduct: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.scanProduct(data);
      set({
        currentAnalysis: response.data!,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Scan failed',
        isLoading: false,
      });
      throw error;
    }
  },

  getHistory: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getHistory(params);
      const { data, pagination } = response.data!;
      
      set({
        scanHistory: data,
        pagination,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch history',
        isLoading: false,
      });
      throw error;
    }
  },

  getStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getStats();
      set({
        userStats: response.data!,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch stats',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteRecord: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.deleteHistory(id);
      
      // Remove from local state
      const { scanHistory } = get();
      set({
        scanHistory: scanHistory.filter(record => record._id !== id),
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete record',
        isLoading: false,
      });
      throw error;
    }
  },

  clearCurrentAnalysis: () => {
    set({ currentAnalysis: null });
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));

