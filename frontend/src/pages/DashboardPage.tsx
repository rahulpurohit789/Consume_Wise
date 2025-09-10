import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  TrendingUp, 
  TrendingDown, 
  Target,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useScanStore } from '../store/scanStore';
import { useAuthStore } from '../store/authStore';

const DashboardPage: React.FC = () => {
  const { userStats, getStats, scanHistory, getHistory } = useScanStore();
  const { user } = useAuthStore();

  useEffect(() => {
    getStats();
    getHistory({ limit: 5 });
  }, []);

  const getHealthScoreColor = (score: number) => {
    if (score >= 8) return 'text-success-600';
    if (score >= 6) return 'text-primary-600';
    if (score >= 4) return 'text-warning-600';
    return 'text-danger-600';
  };

  const getHealthScoreBg = (score: number) => {
    if (score >= 8) return 'bg-success-100';
    if (score >= 6) return 'bg-primary-100';
    if (score >= 4) return 'bg-warning-100';
    return 'bg-danger-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's your nutrition analysis overview
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  to="/"
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
                >
                  <Camera className="w-6 h-6 text-gray-400 group-hover:text-primary-600 mr-3" />
                  <span className="text-gray-700 group-hover:text-primary-600 font-medium">
                    Scan New Product
                  </span>
                </Link>
                <Link
                  to="/history"
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
                >
                  <BarChart3 className="w-6 h-6 text-gray-400 group-hover:text-primary-600 mr-3" />
                  <span className="text-gray-700 group-hover:text-primary-600 font-medium">
                    View History
                  </span>
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
                >
                  <Target className="w-6 h-6 text-gray-400 group-hover:text-primary-600 mr-3" />
                  <span className="text-gray-700 group-hover:text-primary-600 font-medium">
                    Update Profile
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Camera className="w-5 h-5 text-primary-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Scans</p>
                    <p className="text-2xl font-semibold text-gray-900">{userStats.totalScans}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Recommended</p>
                    <p className="text-2xl font-semibold text-gray-900">{userStats.recommendedScans}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-warning-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Health Score</p>
                    <p className="text-2xl font-semibold text-gray-900">{userStats.averageScore}/10</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Success Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{userStats.recommendationRate}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Scans */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Recent Scans</h2>
              <Link
                to="/history"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
            <div className="card-body">
              {scanHistory && scanHistory.length > 0 ? (
                <div className="space-y-4">
                  {scanHistory.map((scan) => (
                    <div key={scan._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{scan.productName}</h3>
                        <p className="text-xs text-gray-500">
                          {new Date(scan.scannedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthScoreBg(scan.healthScore)} ${getHealthScoreColor(scan.healthScore)}`}>
                          {scan.healthScore}/10
                        </div>
                        {scan.healthScore >= 6 ? (
                          <CheckCircle className="w-4 h-4 text-success-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-danger-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No scans yet</p>
                  <Link to="/" className="btn btn-primary">
                    Start Scanning
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Health Insights */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Health Insights</h2>
            </div>
            <div className="card-body">
              {userStats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="w-5 h-5 text-success-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-success-900">Great Progress!</p>
                        <p className="text-xs text-success-700">
                          {userStats.recommendationRate}% of your scans were healthy choices
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                    <div className="flex items-center">
                      <Target className="w-5 h-5 text-primary-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-primary-900">Average Score</p>
                        <p className="text-xs text-primary-700">
                          Your average health score is {userStats.averageScore}/10
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-warning-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-warning-900">Keep It Up!</p>
                        <p className="text-xs text-warning-700">
                          You've scanned {userStats.totalScans} products so far
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Start scanning to see your health insights</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

