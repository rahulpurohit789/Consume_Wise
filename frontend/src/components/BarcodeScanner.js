import React, { useState, useEffect } from 'react';
import './BarcodeScanner.css';

const BarcodeScanner = () => {
    const [barcode, setBarcode] = useState('');
    const [productName, setProductName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [productInfo, setProductInfo] = useState(null);
    const [inputMethod, setInputMethod] = useState('barcode'); // 'barcode' or 'name'
    const [isServerConnected, setIsServerConnected] = useState(false);

    useEffect(() => {
        // Initial connection check
        checkServerConnection();
        
        // Check connection every 30 seconds
        const interval = setInterval(checkServerConnection, 30000);
        
        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);

    const checkServerConnection = async () => {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        console.log('Checking server connection at:', apiUrl);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(`${apiUrl}/api/test`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log('Server check response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Server check response:', data);
                setIsServerConnected(true);
                setError('');
            } else {
                console.error('Server check failed with status:', response.status);
                setIsServerConnected(false);
                setError('Backend server is not responding correctly');
            }
        } catch (err) {
            console.error('Server connection error:', err);
            setIsServerConnected(false);
            if (err.name === 'AbortError') {
                setError('Server connection timed out. Please check if the server is running.');
            } else {
                setError('Cannot connect to backend server. Please check if the server is running.');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isServerConnected) {
            setError('Cannot connect to backend server. Please check if the server is running.');
            return;
        }

        setIsLoading(true);
        setError('');
        setProductInfo(null);

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        console.log('Making request to:', `${apiUrl}/api/products/scan`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(`${apiUrl}/api/products/scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    barcode: inputMethod === 'barcode' ? barcode : null,
                    productName: inputMethod === 'name' ? productName : null
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);

            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server is not responding correctly. Please check if the backend server is running.');
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to analyze product');
            }

            setProductInfo(data);
        } catch (err) {
            console.error('Error details:', err);
            if (err.name === 'AbortError') {
                setError('Request timed out. Please try again.');
            } else if (err.message.includes('Failed to fetch')) {
                setError(`Cannot connect to the server at ${apiUrl}. Please check if the backend server is running.`);
            } else if (err.message.includes('Server is not responding correctly')) {
                setError('Server is not responding correctly. Please check if the backend server is running and accessible.');
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputMethodChange = (method) => {
        setInputMethod(method);
        setBarcode('');
        setProductName('');
        setError('');
        setProductInfo(null);
    };

    return (
        <div className="scanner-container">
            <div className="app-header">
                <h1>ConsumeWise</h1>
                <p className="subtitle">Your Personal Nutrition Assistant</p>
                <p className="tagline">Scan • Analyze • Make Informed Choices</p>
                <div className={`server-status ${isServerConnected ? 'connected' : 'disconnected'}`}>
                    {isServerConnected ? '✓ Server Connected' : '✗ Server Disconnected'}
                </div>
            </div>

            <div className="input-method-toggle">
                <button 
                    className={`toggle-btn ${inputMethod === 'barcode' ? 'active' : ''}`}
                    onClick={() => handleInputMethodChange('barcode')}
                >
                    Scan Barcode
                </button>
                <button 
                    className={`toggle-btn ${inputMethod === 'name' ? 'active' : ''}`}
                    onClick={() => handleInputMethodChange('name')}
                >
                    Enter Product Name
                </button>
            </div>

            <form onSubmit={handleSubmit} className="barcode-form">
                {inputMethod === 'barcode' ? (
                    <div className="input-group">
                        <input
                            type="text"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            placeholder="Enter barcode number (e.g., 8901234567890)"
                            required
                            pattern="[0-9]*"
                            maxLength="13"
                        />
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? 'Analyzing...' : 'Analyze Nutrition'}
                        </button>
                    </div>
                ) : (
                    <div className="input-group">
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Enter product name (e.g., Maggi Noodles, Dominos Pizza)"
                            required
                        />
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? 'Analyzing...' : 'Analyze Nutrition'}
                        </button>
                    </div>
                )}
            </form>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <p className="error-tip">
                        {inputMethod === 'barcode' 
                            ? 'Please enter a valid 13-digit barcode number'
                            : 'Please enter a product name (e.g., Maggi Noodles, Dominos Pizza)'}
                    </p>
                </div>
            )}

            {isLoading && (
                <div className="loading-message">
                    <div className="loading-spinner"></div>
                    <p>Analyzing product information...</p>
                </div>
            )}

            {productInfo && (
                <div className="product-info">
                    <div className="product-header">
                        <h2>{productInfo.name}</h2>
                        <span className="brand-tag">{productInfo.brand}</span>
                    </div>

                    <div className={`recommendation-box ${productInfo.should_consume === "Yes" ? "positive" : "negative"}`}>
                        <div className="recommendation-header">
                            <span className="recommendation-icon">
                                {productInfo.should_consume === "Yes" ? "✓" : "✗"}
                            </span>
                            <h3>{productInfo.should_consume === "Yes" ? "Recommended" : "Not Recommended"}</h3>
                        </div>
                        <p className="recommendation-reason">{productInfo.reason}</p>
                        <div className="health-score">
                            Health Score: <span className={`score-${productInfo.score}`}>{productInfo.score}/10</span>
                        </div>
                    </div>

                    <div className="nutrition-label">
                        <h3>Nutrition Facts</h3>
                        <div className="nutrition-grid">
                            <div className="nutrition-item">
                                <span className="label">Serving Size</span>
                                <span className="value">{productInfo.nutrition_label.serving_size}</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="label">Calories</span>
                                <span className="value">{productInfo.nutrition_label.calories}</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="label">Protein</span>
                                <span className="value">{productInfo.nutrition_label.protein}g</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="label">Sugar</span>
                                <span className="value">{productInfo.nutrition_label.sugar}g</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="label">Fat</span>
                                <span className="value">{productInfo.nutrition_label.fat}g</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="label">Sodium</span>
                                <span className="value">{productInfo.nutrition_label.sodium}mg</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner; 