import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  Share2,
  Download,
  Heart,
  Zap
} from 'lucide-react';
import { useScanStore } from '../store/scanStore';
import { HealthScore } from '../types';

const ScanResultPage: React.FC = () => {
  const { currentAnalysis, clearCurrentAnalysis } = useScanStore();
  const navigate = useNavigate();

  if (!currentAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Analysis Found</h2>
          <p className="text-gray-600 mb-6">Please scan a product first.</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Scanner
          </button>
        </div>
      </div>
    );
  }

  const getHealthScore = (score: number): HealthScore => {
    if (score >= 8) {
      return {
        score,
        label: 'Excellent',
        color: 'success',
        description: 'This product has excellent nutritional value'
      };
    } else if (score >= 6) {
      return {
        score,
        label: 'Good',
        color: 'primary',
        description: 'This product is a good choice'
      };
    } else if (score >= 4) {
      return {
        score,
        label: 'Fair',
        color: 'warning',
        description: 'This product has some nutritional concerns'
      };
    } else {
      return {
        score,
        label: 'Poor',
        color: 'danger',
        description: 'This product has significant nutritional concerns'
      };
    }
  };

  const healthScore = getHealthScore(currentAnalysis.score);
  const isRecommended = currentAnalysis.should_consume === 'Yes';

  const nutritionFacts = currentAnalysis.nutrition_label;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              clearCurrentAnalysis();
              navigate('/');
            }}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Scanner
          </button>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Header */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentAnalysis.name}
                    </h1>
                    <p className="text-gray-600 mb-4">{currentAnalysis.brand}</p>
                    
                    {/* Recommendation Badge */}
                    <div className="flex items-center space-x-2">
                      {isRecommended ? (
                        <span className="badge badge-success">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Recommended
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <XCircle className="w-4 h-4 mr-1" />
                          Not Recommended
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Health Score */}
                  <div className="text-center">
                    <div className={`health-score health-score-${healthScore.color} mb-2`}>
                      {healthScore.score}/10
                    </div>
                    <p className="text-sm font-medium text-gray-900">{healthScore.label}</p>
                    <p className="text-xs text-gray-500">{healthScore.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-primary-600" />
                  AI Health Analysis
                </h2>
              </div>
              <div className="card-body">
                <p className="text-gray-700 leading-relaxed">
                  {currentAnalysis.reason}
                </p>
              </div>
            </div>

            {/* Health Concerns */}
            {currentAnalysis.healthConcerns && currentAnalysis.healthConcerns.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-warning-600" />
                    Health Concerns
                  </h2>
                </div>
                <div className="card-body">
                  <ul className="space-y-2">
                    {currentAnalysis.healthConcerns.map((concern, index) => (
                      <li key={index} className="flex items-start">
                        <TrendingDown className="w-5 h-5 text-danger-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Healthier Alternatives */}
            {currentAnalysis.alternatives && currentAnalysis.alternatives.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-success-600" />
                    Healthier Alternatives
                  </h2>
                </div>
                <div className="card-body">
                  <ul className="space-y-2">
                    {currentAnalysis.alternatives.map((alternative, index) => (
                      <li key={index} className="flex items-start">
                        <TrendingUp className="w-5 h-5 text-success-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{alternative}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Nutrition Facts */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Nutrition Facts</h2>
                <p className="text-sm text-gray-600">Per {nutritionFacts.servingSize}</p>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Calories</span>
                    <span className="text-sm font-semibold text-gray-900">{nutritionFacts.calories}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Protein</span>
                    <span className="text-sm font-semibold text-gray-900">{nutritionFacts.protein}g</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Carbohydrates</span>
                    <span className="text-sm font-semibold text-gray-900">{nutritionFacts.carbohydrates}g</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Sugars</span>
                    <span className="text-sm font-semibold text-gray-900">{nutritionFacts.sugars}g</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Fat</span>
                    <span className="text-sm font-semibold text-gray-900">{nutritionFacts.fat}g</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Saturated Fat</span>
                    <span className="text-sm font-semibold text-gray-900">{nutritionFacts.saturatedFat}g</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Sodium</span>
                    <span className="text-sm font-semibold text-gray-900">{nutritionFacts.sodium}mg</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-700">Fiber</span>
                    <span className="text-sm font-semibold text-gray-900">{nutritionFacts.fiber}g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="card-body space-y-3">
                <button className="btn btn-primary w-full">
                  <Heart className="w-4 h-4 mr-2" />
                  Save to Favorites
                </button>
                <button className="btn btn-secondary w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Result
                </button>
                <button className="btn btn-secondary w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-primary-600" />
                  Health Tips
                </h2>
              </div>
              <div className="card-body">
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Read nutrition labels carefully before purchasing</p>
                  <p>• Look for products with lower sodium and sugar content</p>
                  <p>• Choose whole foods over processed alternatives</p>
                  <p>• Consider your overall daily nutrition goals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResultPage;

