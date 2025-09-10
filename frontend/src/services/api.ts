import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  ProductAnalysis, 
  ScanRecord, 
  UserStats, 
  ApiResponse, 
  PaginatedResponse,
  LoginForm,
  RegisterForm,
  ScanForm
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: RegisterForm): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', data);
    return response.data;
  }

  async login(data: LoginForm): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', data);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<{ user: any }>> {
    const response: AxiosResponse<ApiResponse<{ user: any }>> = await this.api.get('/auth/profile');
    return response.data;
  }

  async updatePreferences(preferences: any): Promise<ApiResponse<{ user: any }>> {
    const response: AxiosResponse<ApiResponse<{ user: any }>> = await this.api.put('/auth/preferences', { preferences });
    return response.data;
  }

  async deleteAccount(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete('/auth/account');
    return response.data;
  }

  // Product endpoints
  async scanProduct(data: ScanForm): Promise<ApiResponse<ProductAnalysis>> {
    const formData = new FormData();
    
    if (data.barcode) {
      formData.append('barcode', data.barcode);
    }
    if (data.productName) {
      formData.append('productName', data.productName);
    }
    if (data.image) {
      formData.append('image', data.image);
    }

    const response: AxiosResponse<ApiResponse<ProductAnalysis>> = await this.api.post('/products/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getProduct(id: string): Promise<ApiResponse<ScanRecord>> {
    const response: AxiosResponse<ApiResponse<ScanRecord>> = await this.api.get(`/products/${id}`);
    return response.data;
  }

  async getHistory(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<PaginatedResponse<ScanRecord>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<ScanRecord>>> = await this.api.get('/products/history/list', { params });
    return response.data;
  }

  async getStats(): Promise<ApiResponse<UserStats>> {
    const response: AxiosResponse<ApiResponse<UserStats>> = await this.api.get('/products/stats/overview');
    return response.data;
  }

  async deleteHistory(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/products/history/${id}`);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;

