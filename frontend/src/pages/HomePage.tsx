import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Search, 
  QrCode, 
  Upload, 
  ArrowRight,
  Shield,
  Zap,
  Target,
  CheckCircle,
  Star,
  Heart,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import BarcodeScanner from '../components/BarcodeScanner';
import ImageUpload from '../components/ImageUpload';
import ScanResultDisplay from '../components/ScanResultDisplay';
import ErrorBoundary from '../components/ErrorBoundary';
import { scanService, ScanResult } from '../services/scanService';
import { HealthAnalysis } from '../services/healthAnalysisService';

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'barcode' | 'search' | 'camera'>('barcode');
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<HealthAnalysis | null>(null);
  
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleScan = async (data: { barcode?: string; productName?: string; image?: File }) => {
    try {
      setIsLoading(true);
      const result = await scanService.scanProduct(data);
      
      if (result.success && result.data) {
        setScanResult(result.data);
      } else {
        toast.error(result.message || 'Failed to scan product');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to scan product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      handleScan({ barcode: barcode.trim() });
    }
  };

  const handleProductSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (productName.trim()) {
      handleScan({ productName: productName.trim() });
    }
  };

  const handleImageUpload = (file: File) => {
    handleScan({ image: file });
  };

  const features = [
    {
      icon: Shield,
      title: 'AI-Powered Analysis',
      description: 'Advanced algorithms analyze nutrition facts, ingredients, and processing levels for accurate health insights.'
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get comprehensive nutrition analysis and health recommendations in seconds using our real-time barcode scanner.'
    },
    {
      icon: Target,
      title: 'Smart Recommendations',
      description: 'Receive personalized health scores, ingredient warnings, and healthier alternative suggestions.'
    },
    {
      icon: Heart,
      title: 'Health-First Approach',
      description: 'Based on Nutri-Score, NOVA classification, and scientific research to help you make informed choices.'
    }
  ];

  const stats = [
    { label: 'Products Analyzed', value: '50K+', icon: TrendingUp },
    { label: 'Happy Users', value: '10K+', icon: Users },
    { label: 'Health Score Accuracy', value: '95%', icon: Award },
    { label: 'Average Analysis Time', value: '< 3s', icon: Zap }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Scan. Analyze.{' '}
              <span className="text-primary-600">Choose Wisely.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Make informed food choices with our AI-powered nutrition scanner. 
              Get instant health insights, ingredient analysis, and personalized recommendations.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => setActiveTab('barcode')}
                className="btn btn-primary btn-lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Scanning
              </button>
              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/register')}
                  className="btn btn-secondary btn-lg"
                >
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Scanner Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="card-header">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Scan Your Food</h2>
              
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('barcode')}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'barcode'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Barcode
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'search'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </button>
                <button
                  onClick={() => setActiveTab('camera')}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'camera'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Camera
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Barcode Scanner Tab */}
              {activeTab === 'barcode' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <button
                      onClick={() => setShowScanner(true)}
                      className="btn btn-primary btn-lg mb-4"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Scan with Camera
                    </button>
                    <p className="text-gray-600 mb-6">or</p>
                  </div>
                  
                  <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                        Enter Barcode Number
                      </label>
                      <input
                        type="text"
                        id="barcode"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="e.g., 1234567890123"
                        className="input"
                        maxLength={13}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!barcode.trim() || isLoading}
                      className="btn btn-primary w-full"
                    >
                      {isLoading ? 'Analyzing...' : 'Analyze Product'}
                    </button>
                    
                    {/* Test Buttons */}
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleScan({ barcode: '8902080104581' })}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2 text-sm"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Test KitKat</span>
                      </button>
                      <button
                        onClick={() => handleScan({ barcode: '049000042566' })}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2 text-sm"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Test Coca-Cola</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Product Search Tab */}
              {activeTab === 'search' && (
                <form onSubmit={handleProductSearch} className="space-y-4">
                  <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g., Coca-Cola, KitKat, etc."
                      className="input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!productName.trim() || isLoading}
                    className="btn btn-primary w-full"
                  >
                    {isLoading ? 'Searching...' : 'Search Product'}
                  </button>
                </form>
              )}

              {/* Camera Upload Tab */}
              {activeTab === 'camera' && (
                <div className="space-y-6">
                  <ImageUpload onUpload={handleImageUpload} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Scan Results - Display right after scanner */}
      {scanResult && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScanResultDisplay 
              analysis={scanResult} 
              onClose={() => setScanResult(null)}
            />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose ConsumeWise?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced AI technology provides comprehensive nutrition analysis 
              to help you make better food choices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index}>
                  <div className="flex items-center justify-center mb-2">
                    <Icon className="w-8 h-8 text-primary-200 mr-2" />
                    <div className="text-3xl font-bold text-white">
                      {stat.value}
                    </div>
                  </div>
                  <div className="text-primary-100">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Make Healthier Choices?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who are already making informed food decisions with ConsumeWise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setActiveTab('barcode')}
              className="btn btn-primary btn-lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Start Scanning Now
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/register')}
                className="btn btn-secondary btn-lg"
              >
                Create Free Account
              </button>
            )}
          </div>
        </div>
      </section>


      {/* Barcode Scanner Modal */}
      <ErrorBoundary>
        <BarcodeScanner
          isActive={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={(barcode) => {
            setBarcode(barcode);
            setShowScanner(false);
            handleScan({ barcode });
          }}
        />
      </ErrorBoundary>
    </div>
  );
};

export default HomePage;

