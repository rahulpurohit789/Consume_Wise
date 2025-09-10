import React, { useState } from 'react';
import { 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Heart, 
  Shield, 
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Share2,
  Bookmark
} from 'lucide-react';
import { HealthAnalysis } from '../services/healthAnalysisService';
import toast from 'react-hot-toast';

interface ScanResultDisplayProps {
  analysis: HealthAnalysis;
  onClose?: () => void;
}

const ScanResultDisplay: React.FC<ScanResultDisplayProps> = ({ analysis, onClose }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [isBookmarked, setIsBookmarked] = useState(false);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const shareResult = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Health Analysis: ${analysis.productName}`,
          text: `Health Score: ${analysis.healthScore.grade} (${analysis.healthScore.overall}/10)`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard(`Health Analysis: ${analysis.productName} - Score: ${analysis.healthScore.grade} (${analysis.healthScore.overall}/10)`);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getNovaColor = (group: number) => {
    switch (group) {
      case 1: return 'text-green-600 bg-green-100';
      case 2: return 'text-blue-600 bg-blue-100';
      case 3: return 'text-yellow-600 bg-yellow-100';
      case 4: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{analysis.productName}</h1>
          <p className="text-lg text-gray-600 mb-4">{analysis.brand}</p>
          
          {/* Health Score Badge */}
          <div className="flex items-center space-x-4 mb-4">
            <div className={`px-4 py-2 rounded-full font-bold text-lg ${getGradeColor(analysis.healthScore.grade)}`}>
              {analysis.healthScore.grade}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(analysis.healthScore.overall)}`}>
              {analysis.healthScore.overall}/10
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.healthScore.riskLevel)}`}>
              {analysis.healthScore.riskLevel.toUpperCase()} RISK
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2 rounded-full transition-colors ${
              isBookmarked ? 'text-yellow-600 bg-yellow-100' : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-100'
            }`}
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <button
            onClick={shareResult}
            className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Overview Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('overview')}
          className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Health Overview
          </h2>
          {expandedSections.has('overview') ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.has('overview') && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score Breakdown */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Score Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nutrition</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(analysis.healthScore.breakdown.nutrition)}`}>
                      {analysis.healthScore.breakdown.nutrition}/10
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Processing</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(analysis.healthScore.breakdown.processing)}`}>
                      {analysis.healthScore.breakdown.processing}/10
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Additives</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(analysis.healthScore.breakdown.additives)}`}>
                      {analysis.healthScore.breakdown.additives}/10
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Allergens</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(analysis.healthScore.breakdown.allergens)}`}>
                      {analysis.healthScore.breakdown.allergens}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Processing Level */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Processing Level</h3>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getNovaColor(analysis.processingLevel.group)}`}>
                  NOVA Group {analysis.processingLevel.group}
                </div>
                <p className="text-sm text-gray-600 mt-2">{analysis.processingLevel.description}</p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
              <div className="space-y-2">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nutritional Highlights */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('nutrition')}
          className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-red-500" />
            Nutritional Analysis
          </h2>
          {expandedSections.has('nutrition') ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.has('nutrition') && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Positive Highlights */}
              {analysis.nutritionalHighlights.positive.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Positive Highlights
                  </h3>
                  <ul className="space-y-1">
                    {analysis.nutritionalHighlights.positive.map((highlight, index) => (
                      <li key={index} className="text-sm text-green-700 flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Negative Concerns */}
              {analysis.nutritionalHighlights.negative.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-700 mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Health Concerns
                  </h3>
                  <ul className="space-y-1">
                    {analysis.nutritionalHighlights.negative.map((concern, index) => (
                      <li key={index} className="text-sm text-red-700 flex items-start">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ingredient Warnings */}
      {(analysis.ingredientWarnings.harmful.length > 0 || 
        analysis.ingredientWarnings.questionable.length > 0 || 
        analysis.ingredientWarnings.allergens.length > 0) && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('ingredients')}
            className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-orange-500" />
              Ingredient Analysis
            </h2>
            {expandedSections.has('ingredients') ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          {expandedSections.has('ingredients') && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-4">
                {/* Harmful Additives */}
                {analysis.ingredientWarnings.harmful.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-red-700 mb-2 flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Harmful Additives
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.ingredientWarnings.harmful.map((additive, index) => (
                        <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded">
                          {additive}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questionable Additives */}
                {analysis.ingredientWarnings.questionable.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-yellow-700 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Questionable Additives
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.ingredientWarnings.questionable.map((additive, index) => (
                        <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                          {additive}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Allergens */}
                {analysis.ingredientWarnings.allergens.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-orange-700 mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      Allergens
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.ingredientWarnings.allergens.map((allergen, index) => (
                        <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Healthier Alternatives */}
      {analysis.alternatives.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('alternatives')}
            className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-500" />
              Healthier Alternatives
            </h2>
            {expandedSections.has('alternatives') ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          {expandedSections.has('alternatives') && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {analysis.alternatives.map((alternative, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{alternative}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Data source: {analysis.dataSource === 'openfoodfacts' ? 'OpenFoodFacts' : 'Web Search'}</span>
            <span>Analyzed: {analysis.lastAnalyzed.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(analysis.barcode)}
              className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Barcode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResultDisplay;
