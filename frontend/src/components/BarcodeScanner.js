import React, { useState, useEffect, useRef } from 'react';
import Quagga from '@ericblade/quagga2';
import './BarcodeScanner.css';

const BarcodeScanner = () => {
    const [barcode, setBarcode] = useState('');
    const [productName, setProductName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [productInfo, setProductInfo] = useState(null);
    const [inputMethod, setInputMethod] = useState('barcode'); // 'barcode' or 'name'
    const [isServerConnected, setIsServerConnected] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef(null);
    const [quaggaInitialized, setQuaggaInitialized] = useState(false);
    
    // Use refs for barcode detection state to persist between renders
    const lastResultRef = useRef(null);
    const sameResultCountRef = useRef(0);
    const quaggaRef = useRef(null);

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

    const startCamera = async () => {
        setIsCameraActive(true);
        setError('');
        
        try {
            // First, request camera permissions explicitly
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            
            // Stop the test stream
            stream.getTracks().forEach(track => track.stop());

            // Now get the list of available video devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            console.log('Available video devices:', videoDevices);

            if (videoDevices.length === 0) {
                throw new Error('No video devices found');
            }

            // Try to find DroidCam specifically
            const droidCam = videoDevices.find(device => 
                device.label.toLowerCase().includes('droid') || 
                device.label.toLowerCase().includes('ip camera')
            );

            // Use DroidCam if found, otherwise use the last available camera
            const selectedDevice = droidCam || videoDevices[videoDevices.length - 1];
            console.log('Selected camera device:', selectedDevice.label);

            // Make sure any existing instance is stopped
            if (quaggaInitialized) {
                try {
                    await Quagga.stop();
                } catch (err) {
                    console.log('Error stopping existing Quagga instance:', err);
                }
            }

            // Reset detection state
            lastResultRef.current = null;
            sameResultCountRef.current = 0;

            // Wait for the DOM element to be ready
            await new Promise(resolve => setTimeout(resolve, 500));

            const config = {
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: document.querySelector("#interactive.viewport"),
                    constraints: {
                        deviceId: { exact: selectedDevice.deviceId },
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 },
                        aspectRatio: { min: 1, max: 2 },
                        facingMode: "environment",
                        frameRate: { ideal: 30 }
                    },
                    area: {
                        top: "0%",
                        right: "0%",
                        left: "0%",
                        bottom: "0%"
                    },
                    singleChannel: false
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: 4,
                frequency: 10,
                decoder: {
                    readers: ["ean_reader"],
                    debug: {
                        drawBoundingBox: true,
                        showFrequency: true,
                        drawScanline: true,
                        showPattern: true
                    }
                },
                locate: true
            };

            // Initialize Quagga with a promise wrapper
            await new Promise((resolve, reject) => {
                try {
                    Quagga.init(config, function(err) {
                        if (err) {
                            console.error("Quagga initialization failed:", err);
                            reject(err);
                            return;
                        }
                        console.log("Quagga initialization succeeded");
                        resolve();
                    });
                } catch (initError) {
                    console.error("Error during Quagga initialization:", initError);
                    reject(initError);
                }
            });

            // Store Quagga instance
            quaggaRef.current = Quagga;
            setQuaggaInitialized(true);
            
            // Start the scanner
            await Quagga.start();
            console.log("Quagga started successfully");

            // Remove any existing handlers before adding new ones
            Quagga.offDetected();

            // Add barcode detection handler
            Quagga.onDetected((result) => {
                if (result.codeResult) {
                    const scannedCode = result.codeResult.code;
                    console.log("Scanned code:", scannedCode);
                    
                    // Check if this is the same code as last time
                    if (scannedCode === lastResultRef.current) {
                        sameResultCountRef.current++;
                        console.log("Same code count:", sameResultCountRef.current);
                        
                        // If we've seen the same code 2 times, we're confident it's correct
                        if (sameResultCountRef.current >= 2) {
                            console.log("Barcode detected and verified:", scannedCode);
                            setBarcode(scannedCode);
                            stopCamera();
                        }
                    } else {
                        // Reset counter for new code
                        lastResultRef.current = scannedCode;
                        sameResultCountRef.current = 1;
                        console.log("New code detected, count reset");
                    }
                }
            });

        } catch (error) {
            console.error("Error starting camera:", error);
            let errorMessage = "Failed to start camera. ";
            
            if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage += "No camera devices found. ";
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage += "Camera permission denied. Please allow camera access. ";
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage += "Camera is in use by another application. ";
            } else if (error.message.includes('Ut[e] is not a constructor')) {
                errorMessage = "Barcode scanner initialization failed. Please try refreshing the page. ";
            }
            
            errorMessage += "Please ensure DroidCam is running and connected. If using DroidCam, try restarting the DroidCam app and client.";
            
            setError(errorMessage);
            setIsCameraActive(false);
            setQuaggaInitialized(false);
            quaggaRef.current = null;
        }
    };

    const stopCamera = async () => {
        if (quaggaRef.current && quaggaInitialized) {
            try {
                quaggaRef.current.offDetected();
                await quaggaRef.current.stop();
                console.log("Camera stopped successfully");
            } catch (err) {
                console.error("Error stopping camera:", err);
            }
            quaggaRef.current = null;
            setQuaggaInitialized(false);
        }
        setIsCameraActive(false);
    };

    // Cleanup camera when component unmounts
    useEffect(() => {
        return () => {
            if (quaggaRef.current && quaggaInitialized) {
                stopCamera();
            }
        };
    }, [quaggaInitialized]);

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

            {isCameraActive && (
                <div className="camera-container">
                    <div className="viewport-container">
                        <div id="interactive" className="viewport" />
                        <div className="laser"></div>
                        <div className="camera-overlay">
                            <div className="scan-region-highlight"></div>
                            <div className="scan-region-highlight-svg"></div>
                        </div>
                        <button className="camera-close-btn" onClick={stopCamera}>
                            ✕ Close Camera
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="barcode-form">
                {inputMethod === 'barcode' ? (
                    <div className="input-group">
                        <div className="barcode-input-container">
                            <input
                                type="text"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                placeholder="Enter barcode number (e.g., 8901234567890)"
                                required
                                pattern="[0-9]*"
                                maxLength="13"
                            />
                            <button 
                                type="button" 
                                className="camera-btn"
                                onClick={startCamera}
                                disabled={isCameraActive}
                            >
                                📷
                            </button>
                        </div>
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