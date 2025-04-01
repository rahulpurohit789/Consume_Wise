import React, { useState } from 'react';
import axios from 'axios';
import './BarcodeScanner.css';

const BarcodeScanner = () => {
  const [barcode, setBarcode] = useState('');
  const [productInfo, setProductInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const getScoreColor = (score) => {
    if (score >= 8) return '#2ecc71'; // Green
    if (score >= 6) return '#f1c40f'; // Yellow
    if (score >= 4) return '#e67e22'; // Orange
    return '#e74c3c'; // Red
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProductInfo(null);

    try {
      const response = await axios.post(`${API_URL}/api/products/scan`, { barcode });
      // Ensure nutrition_label exists with default values
      const data = {
        ...response.data,
        nutrition_label: {
          serving_size: 'N/A',
          calories: 'N/A',
          protein: 'N/A',
          fat: 'N/A',
          sugar: 'N/A',
          sodium: 'N/A',
          ...response.data.nutrition_label
        },
        score: response.data.score || 5 // Default score if not provided
      };
      setProductInfo(data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error scanning barcode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-container">
      <header className="app-header">
        <h1 className="app-title">ConsumeWise</h1>
        <p className="app-description">Your Personal Nutrition Assistant</p>
        <p className="app-subtitle">Scan • Analyze • Make Informed Choices</p>
      </header>
      
      <form onSubmit={handleSubmit} className="barcode-form">
        <div className="input-group">
          <label>Enter Barcode</label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Enter barcode number"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Nutrition'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {productInfo && (
        <div className="product-info">
          <div className="product-header">
            <h2>{productInfo.name || 'Unknown Product'}</h2>
            <span className="brand-tag">{productInfo.brand || 'Unknown Brand'}</span>
          </div>
          
          <div className="product-details">
            <div className="recommendation-box">
              <h3>Fitness Recommendation</h3>
              <div className={`recommendation-status ${productInfo.should_consume === 'Yes' ? 'recommend-yes' : 'recommend-no'}`}>
                {productInfo.should_consume === 'Yes' ? '✓ Recommended' : '✕ Not Recommended'}
              </div>
              <div className="score-container">
                <div className="score-label">Health Score</div>
                <div className="score-circle" style={{ backgroundColor: getScoreColor(productInfo.score) }}>
                  {productInfo.score}/10
                </div>
                <div className="score-bar-container">
                  <div 
                    className="score-bar" 
                    style={{ 
                      width: `${(productInfo.score / 10) * 100}%`,
                      backgroundColor: getScoreColor(productInfo.score)
                    }}
                  ></div>
                </div>
              </div>
              <p className="recommendation-reason">{productInfo.reason || 'No recommendation available'}</p>
            </div>
            
            <div className="nutrition-label">
              <h3>Nutrition Facts</h3>
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span>Serving Size</span>
                  <span>{productInfo.nutrition_label.serving_size}</span>
                </div>
                <div className="nutrition-item">
                  <span>Calories</span>
                  <span>{productInfo.nutrition_label.calories}</span>
                </div>
                <div className="nutrition-item">
                  <span>Protein</span>
                  <span>{productInfo.nutrition_label.protein === 'N/A' ? 'N/A' : `${productInfo.nutrition_label.protein}g`}</span>
                </div>
                <div className="nutrition-item">
                  <span>Fat</span>
                  <span>{productInfo.nutrition_label.fat === 'N/A' ? 'N/A' : `${productInfo.nutrition_label.fat}g`}</span>
                </div>
                <div className="nutrition-item">
                  <span>Sugar</span>
                  <span>{productInfo.nutrition_label.sugar === 'N/A' ? 'N/A' : `${productInfo.nutrition_label.sugar}g`}</span>
                </div>
                <div className="nutrition-item">
                  <span>Sodium</span>
                  <span>{productInfo.nutrition_label.sodium === 'N/A' ? 'N/A' : `${productInfo.nutrition_label.sodium}mg`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner; 