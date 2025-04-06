import React, { useState, useEffect, useRef, useCallback } from 'react';
import Quagga from '@ericblade/quagga2';
import * as tf from '@tensorflow/tfjs';
import './BarcodeScanner.css';
import PostitNote from './PostitNote';

// Common food product categories
const FOOD_CATEGORIES = [
    "Apple", "Banana", "Orange", "Mango", "Strawberry", 
    "Bread", "Pasta", "Rice", "Cereal", "Oatmeal",
    "Milk", "Cheese", "Yogurt", "Butter", "Cream",
    "Chicken", "Beef", "Pork", "Fish", "Eggs",
    "Carrot", "Broccoli", "Tomato", "Potato", "Onion",
    "Cookie", "Chocolate", "Candy", "Ice Cream", "Cake",
    "Chips", "Crackers", "Nuts", "Pretzels", "Popcorn",
    "Coffee", "Tea", "Juice", "Soda", "Water",
    "Pizza", "Burger", "Sandwich", "Salad", "Soup",
    "Ketchup", "Mustard", "Mayonnaise", "Salsa", "Hot Sauce"
];

// Pre-packaged food brands
const FOOD_BRANDS = [
    "Nestle", "Coca-Cola", "PepsiCo", "Kellogg's", "General Mills",
    "Kraft Heinz", "Mondelez", "Mars", "Danone", "Unilever",
    "Campbell's", "Hershey's", "Ferrero", "Quaker", "Tyson",
    "Del Monte", "Hormel", "Conagra", "McCormick", "Barilla"
];

// ProductInfo component to display product details
const ProductInfo = ({ productInfo, onGoBack }) => {
    if (!productInfo) return null;

    return (
        <div className="product-info">
            <div className="product-header">
                <h2>{productInfo.name}</h2>
                <span className="brand-tag">{productInfo.brand}</span>
            </div>

            <div className={`recommendation-box ${
                productInfo.should_consume === "No" 
                ? "negative" 
                : productInfo.should_consume === "Yes" 
                ? "positive" 
                : ""
            }`}>
                <div className="recommendation-header">
                    <span className="recommendation-icon">
                        {productInfo.should_consume === "No" ? "✗" : "✓"}
                    </span>
                    <h3>{productInfo.should_consume === "No" ? "Not Recommended" : "Recommended"}</h3>
                </div>
                <p className="recommendation-reason">{productInfo.reason}</p>
            </div>

            {productInfo.health_concerns && productInfo.health_concerns.length > 0 && (
                <div className="health-concerns">
                    <h4>Health Concerns:</h4>
                    <ul>
                        {productInfo.health_concerns.map((concern, index) => (
                            <li key={index}>{concern}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="health-score" data-score={Math.floor(productInfo.score)}>
                <strong>Health Score:</strong>
                <span className="score-value">{productInfo.score}/10</span>
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
                        <span className="value">{productInfo.nutrition_label.calories} kcal</span>
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
                    {productInfo.nutrition_label.saturated_fat && (
                        <div className="nutrition-item">
                            <span className="label">Saturated Fat</span>
                            <span className="value">{productInfo.nutrition_label.saturated_fat}g</span>
                        </div>
                    )}
                    <div className="nutrition-item">
                        <span className="label">Sodium</span>
                        <span className="value">{productInfo.nutrition_label.sodium}mg</span>
                    </div>
                    {productInfo.nutrition_label.fiber && (
                        <div className="nutrition-item">
                            <span className="label">Fiber</span>
                            <span className="value">{productInfo.nutrition_label.fiber}g</span>
                        </div>
                    )}
                </div>
            </div>

            {productInfo.alternatives && productInfo.alternatives.length > 0 && (
                <div className="healthier-alternatives">
                    <h4>Healthier Alternatives:</h4>
                    <ul>
                        {productInfo.alternatives.map((alternative, index) => (
                            <li key={index}>{alternative}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            <button 
                className="go-back-button"
                onClick={onGoBack}
            >
                ← Back to Scanner
            </button>
        </div>
    );
};

const BarcodeScanner = ({ onClose, isDarkMode, toggleDarkMode }) => {
    const [barcode, setBarcode] = useState('');
    const [productName, setProductName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [productInfo, setProductInfo] = useState(null);
    const [inputMethod, setInputMethod] = useState('barcode'); // 'barcode' or 'name'
    const [isServerConnected, setIsServerConnected] = useState('checking');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [quaggaInitialized, setQuaggaInitialized] = useState(false);
    const [recognitionMode, setRecognitionMode] = useState('barcode'); // 'barcode' or 'product'
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [recognizedProducts, setRecognizedProducts] = useState([]);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    
    // Use refs for barcode detection state to persist between renders
    const lastResultRef = useRef(null);
    const sameResultCountRef = useRef(0);
    const quaggaRef = useRef(null);
    const modelRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const productRecognitionInterval = useRef(null);

    // Stop the product recognition loop
    const stopProductRecognition = useCallback(() => {
        // Clear the recognition interval
        if (productRecognitionInterval.current) {
            clearInterval(productRecognitionInterval.current);
            productRecognitionInterval.current = null;
        }
        
        // Clear any remaining animation frames
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        
        setRecognizedProducts([]);
        setIsRecognizing(false);
    }, []);

    useEffect(() => {
        // Initial connection check
        checkServerConnection();
        
        // Check connection every 30 seconds
        const interval = setInterval(checkServerConnection, 30000);
        
        // Cleanup interval on component unmount
        return () => {
            clearInterval(interval);
            // Clean up any pending requests
            const controller = new AbortController();
            controller.abort();
        };
    }, []);

    const checkServerConnection = async () => {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        console.log('Checking server connection at:', apiUrl);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout to 3 seconds

            const response = await fetch(`${apiUrl}/api/test`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                mode: 'cors' // Explicitly set CORS mode
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
                const data = await response.json();
                console.log('Server check response:', data);
            setIsServerConnected('connected');
                setError('');
        } catch (err) {
            console.error('Server connection error:', err);
            setIsServerConnected('error');
            
            if (err.name === 'AbortError') {
                setError('Server connection timed out. Please check if the server is running.');
            } else if (err.message.includes('Failed to fetch')) {
                setError('Cannot connect to server. Please check if the server is running.');
            } else {
                setError('Server connection error. Please check if the server is running.');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true);
        setError('');
        setProductInfo(null);

        console.log(`Handling submit for ${inputMethod === 'barcode' ? 'barcode: ' + barcode : 'name: ' + productName}`);

        // Special handling for specific product names
        if (inputMethod === 'name') {
            const lowerName = productName.toLowerCase().trim();
            
            // Direct handling for common search items - this guarantees consistency in results
            const commonSearches = {
                'apple': {
                    name: 'Apple',
                    brand: 'Fresh Produce',
                    should_consume: 'Yes',
                    reason: 'Apples are nutrient-dense fruits rich in fiber, vitamin C, and antioxidants. They support heart health, digestion, and may help regulate blood sugar levels.',
                    score: 8.5,
                    nutrition_label: {
                        serving_size: '1 medium (182g)',
                        calories: '95',
                        protein: '0.5',
                        sugar: '19',
                        fat: '0.3',
                        sodium: '2',
                        fiber: '4.4'
                    },
                    health_concerns: [
                        'Contains natural sugars - consume in moderation if monitoring blood sugar',
                        'Some individuals may have allergies to apples',
                        'Non-organic apples may contain pesticide residues'
                    ],
                    alternatives: [
                        'Pears',
                        'Berries (lower in sugar)',
                        'Other fresh fruits for variety'
                    ]
                },
                'quinoa': {
                    name: 'Organic Quinoa',
                    brand: 'Whole Foods',
                    should_consume: 'Yes',
                    reason: 'Quinoa is a complete protein containing all nine essential amino acids. It\'s high in fiber, naturally gluten-free, and rich in vitamins and minerals including magnesium, B vitamins, and iron.',
                    score: 9,
                    nutrition_label: {
                        serving_size: '100g (cooked)',
                        calories: '120',
                        protein: '4.4',
                        sugar: '0.9',
                        fat: '1.9',
                        sodium: '7',
                        fiber: '2.8',
                        carbs: '21.3'
                    },
                    health_concerns: [
                        'May cause digestive issues in some sensitive individuals',
                        'Contains saponins which can be irritating for some people (washing thoroughly helps)'
                    ],
                    alternatives: [
                        'Brown rice',
                        'Buckwheat',
                        'Amaranth',
                        'Millet',
                        'Teff'
                    ]
                },
                'maggi': {
                    name: 'Maggi Instant Noodles',
                    brand: 'Nestlé',
                    should_consume: 'No',
                    reason: 'Maggi noodles are high in sodium and saturated fats while being low in fiber and essential nutrients. Though convenient and affordable, they are highly processed with preservatives and flavor enhancers that aren\'t ideal for regular consumption.',
                    score: 4.5,
                    nutrition_label: {
                        serving_size: '70g (1 pack)',
                        calories: '320',
                        protein: '7',
                        sugar: '2.5',
                        fat: '13',
                        sodium: '1150',
                        fiber: '1.5',
                        saturated_fat: '6'
                    },
                    health_concerns: [
                        'Very high sodium content (around 1150mg - nearly half the daily limit)',
                        'High in saturated fats (6g per serving)',
                        'Low in dietary fiber (only 1.5g)',
                        'Ultra-processed with additives and flavor enhancers',
                        'Low in essential micronutrients and vitamins'
                    ],
                    alternatives: [
                        'Whole grain noodles with vegetables and lean protein',
                        'Rice noodles with homemade broth and fresh ingredients',
                        'Zucchini noodles (zoodles) for a low-carb option',
                        'Instant pot or quick-cook brown rice with vegetables',
                        'Add vegetables, reduce seasoning packet, and use less oil if consuming'
                    ]
                }
            };
            
            // Check for exact matches first
            if (commonSearches[lowerName]) {
                setProductInfo(commonSearches[lowerName]);
                setIsLoading(false);
                return;
            }
            
            // Check for partial matches
            for (const [key, data] of Object.entries(commonSearches)) {
                if (lowerName.includes(key)) {
                    setProductInfo(data);
                    setIsLoading(false);
                    return;
                }
            }
        }

        // First check if we have offline data for this barcode
        if (inputMethod === 'barcode') {
            const offlineData = lookupBarcodeData(barcode);
            if (offlineData) {
                console.log('Found offline data for barcode:', barcode);
                setProductInfo(offlineData);
                setIsLoading(false);
                return;
            }
        }

        // If not in our offline database and server is not connected, show error
        if (isServerConnected === 'error') {
            if (inputMethod === 'name' && productName) {
                // For product names, we can try web search even without server
                try {
                    await searchFoodItemOnline(productName);
                    return;
                } catch (err) {
                    setError('Cannot connect to server and offline search failed. Please try again later.');
                    setIsLoading(false);
                    return;
                }
            } else {
                // For barcodes without offline data, we need the server
                setError('Cannot connect to backend server. Please check if the server is running or try a different barcode.');
                setIsLoading(false);
                return;
            }
        }

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

            // Check if we got a 404 Not Found response
            if (response.status === 404) {
                console.log('Product not found in database, trying web search...');
                
                // If we don't find the product in the database, use web search as fallback
                if (inputMethod === 'name' && productName) {
                    await searchFoodItemOnline(productName);
                    return; // End the function here since searchFoodItemOnline sets the state
                } else if (inputMethod === 'barcode' && barcode) {
                    // For barcodes, check if we have a local mapping first
                    const offlineData = lookupBarcodeData(barcode);
                    if (offlineData) {
                        console.log('Server lookup failed, using offline data for barcode:', barcode);
                        setProductInfo(offlineData);
                        return;
                    }
                    
                    // If no local data, show error
                    setError(`Product with barcode ${barcode} not found. Try entering the product name instead.`);
                    setIsLoading(false);
                    return;
                }
            }

            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);

            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                
                // Try web search if server is responding but not with JSON
                if (inputMethod === 'name' && productName) {
                    await searchFoodItemOnline(productName);
                    return;
                } else {
                throw new Error('Server is not responding correctly. Please check if the backend server is running.');
                }
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                // If specific product not found, try web search
                if (response.status === 404 && inputMethod === 'name' && productName) {
                    await searchFoodItemOnline(productName);
                    return;
                }
                
                throw new Error(data.message || 'Failed to analyze product');
            }

            setProductInfo(data);
        } catch (err) {
            console.error('Error details:', err);
            
            // If there was a network error or timeout, try offline lookup for barcodes
            if (inputMethod === 'barcode') {
                const offlineData = lookupBarcodeData(barcode);
                if (offlineData) {
                    console.log('Network error but found offline data for barcode:', barcode);
                    setProductInfo(offlineData);
                    setIsLoading(false);
                    return;
                }
            }
            
            // If there was a network error, try web search as fallback for product names
            if (err.name === 'AbortError' || err.message.includes('Failed to fetch')) {
                if (inputMethod === 'name' && productName) {
                    console.log('Network issue, falling back to web search...');
                    await searchFoodItemOnline(productName);
                    return;
                }
            }
            
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
            console.log(`Starting camera in ${recognitionMode} mode...`);
            
            // Clear any previous camera instances first
            if (quaggaInitialized) {
                try {
                    await Quagga.stop();
                    console.log("Successfully stopped previous Quagga instance");
                } catch (err) {
                    console.log('Error stopping existing Quagga instance:', err);
                }
                quaggaRef.current = null;
                setQuaggaInitialized(false);
            }
            
            // Stop any ongoing product recognition
            stopProductRecognition();
            
            // Wait for the camera container to be fully rendered
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get available camera devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            console.log('Available video devices:', videoDevices);

            if (videoDevices.length === 0) {
                throw new Error('No video devices found');
            }

            // Try to find the rear camera on mobile devices first
            const rearCamera = videoDevices.find(device => 
                device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('rear') ||
                device.label.toLowerCase().includes('environment')
            );

            // Try to find default or front camera
            const frontCamera = videoDevices.find(device => 
                device.label.toLowerCase().includes('front') || 
                device.label.toLowerCase().includes('user') ||
                device.label.toLowerCase().includes('face')
            );

            // Use priority: rear camera > front camera > first available camera
            const selectedDevice = rearCamera || frontCamera || videoDevices[0];
            console.log('Selected camera device:', selectedDevice.label);

            // Check if the DOM element exists
            const viewportElement = document.querySelector("#interactive.viewport");
            if (!viewportElement) {
                console.error("Viewport element not found!");
                throw new Error("Camera viewport element not found. Please try refreshing the page.");
            }
            console.log("Viewport element found:", viewportElement);
            
            // Create both video and canvas elements for handling different modes
            // Video element for the live camera feed
            const videoElement = document.createElement('video');
            videoElement.setAttribute('autoplay', 'true');
            videoElement.setAttribute('muted', 'true');
            videoElement.setAttribute('playsinline', 'true');
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'cover';
            videoRef.current = videoElement;
            
            // Canvas element for product recognition
            const canvasElement = document.createElement('canvas');
            canvasElement.width = 640;
            canvasElement.height = 480;
            canvasElement.style.display = 'none'; // Hidden by default
            canvasRef.current = canvasElement;
            
            // Clear the viewport element
            while (viewportElement.firstChild) {
                viewportElement.removeChild(viewportElement.firstChild);
            }
            
            // Add the video element to the viewport
            viewportElement.appendChild(videoElement);
            viewportElement.appendChild(canvasElement);
            
            // Get media stream with specific constraints
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    deviceId: selectedDevice ? { exact: selectedDevice.deviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: { ideal: 'environment' }
                },
                audio: false
            });
            
            // Check if we got a valid stream
            if (!stream || !stream.active) {
                throw new Error('Failed to get active camera stream');
            }
            
            console.log("Camera stream acquired successfully");
            
            // Connect the stream to video element
            videoElement.srcObject = stream;
            
            // Play the video
            try {
                await videoElement.play();
                console.log("Video playing successfully");
            } catch (playErr) {
                console.error("Error playing video:", playErr);
                throw playErr;
            }
            
            // Handle different recognition modes
            if (recognitionMode === 'barcode') {
                // Reset barcode detection state
            lastResultRef.current = null;
            sameResultCountRef.current = 0;

                // Initialize Quagga for barcode scanning
            const config = {
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                        target: viewportElement,
                    constraints: {
                            deviceId: selectedDevice ? { exact: selectedDevice.deviceId } : undefined,
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 },
                        aspectRatio: { min: 1, max: 2 },
                        facingMode: "environment",
                        frameRate: { ideal: 30 }
                    },
                    singleChannel: false
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                    numOfWorkers: 2,
                frequency: 10,
                decoder: {
                        readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader"],
                    debug: {
                        drawBoundingBox: true,
                        showFrequency: true,
                        drawScanline: true,
                        showPattern: true
                    }
                },
                locate: true
            };

                console.log("Initializing Quagga with config:", config);

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
                try {
            await Quagga.start();
            console.log("Quagga started successfully");
                } catch (startError) {
                    console.error("Error starting Quagga:", startError);
                    throw startError;
                }

            // Remove any existing handlers before adding new ones
            Quagga.offDetected();

            // Add barcode detection handler
            Quagga.onDetected((result) => {
                    console.log("Detection event triggered", result);
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
            } else {
                // We're in product recognition mode
                // Start product recognition process
                console.log("Starting product recognition");
                
                if (!modelLoaded) {
                    console.warn("Product recognition model not loaded yet");
                }
                
                startProductRecognition();
            }

        } catch (error) {
            console.error("Error starting camera:", error);
            let errorMessage = "Failed to start camera. ";
            
            if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage += "No camera devices found. ";
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage += "Camera permission denied. Please allow camera access in your browser settings. ";
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage += "Camera is in use by another application or unavailable. Please close other apps that might be using the camera. ";
            } else if (error.message && error.message.includes('Ut[e] is not a constructor')) {
                errorMessage = "Barcode scanner initialization failed. Please try refreshing the page. ";
            } else if (error.message && error.message.includes('Camera viewport element not found')) {
                errorMessage = "Camera viewport not found. Please try refreshing the page. ";
            } else if (error.message && error.message.includes('Video stream error')) {
                errorMessage = "Could not display video stream. Your camera might not be compatible with this browser. ";
            } else {
                // Generic error with more details
                errorMessage += `Technical details: ${error.name || ''}: ${error.message || 'Unknown error'}`;
            }
            
            errorMessage += "\n\nTroubleshooting steps:\n1. Refresh the page\n2. Try a different browser (Chrome works best)\n3. Check camera permissions in your browser settings\n4. Ensure no other apps are using your camera\n5. Try using a mobile device if on desktop";
            
            setError(errorMessage);
            setIsCameraActive(false);
            setQuaggaInitialized(false);
            quaggaRef.current = null;
            
            // Try to clean up any lingering camera streams
            try {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        stream.getTracks().forEach(track => {
                            track.stop();
                        });
                    })
                    .catch(err => console.log('Cleanup error:', err));
            } catch (cleanupErr) {
                console.log('Error during camera cleanup:', cleanupErr);
            }
        }
    };

    const stopCamera = useCallback(async () => {
        // Clean up Quagga if initialized
        if (quaggaRef.current && quaggaInitialized) {
            try {
                quaggaRef.current.offDetected();
                await quaggaRef.current.stop();
                console.log("Quagga stopped successfully");
            } catch (err) {
                console.error("Error stopping camera:", err);
            }
            quaggaRef.current = null;
            setQuaggaInitialized(false);
        }
        
        // Stop product recognition loop
        stopProductRecognition();
        
        // Clean up any active video streams
        try {
            const videoElement = videoRef.current || document.querySelector("#interactive.viewport video");
            if (videoElement && videoElement.srcObject) {
                const stream = videoElement.srcObject;
                const tracks = stream.getTracks();
                
                tracks.forEach(track => {
                    track.stop();
                    console.log("Video track stopped:", track.kind);
                });
                
                videoElement.srcObject = null;
                console.log("Video stream cleaned up");
            }
            
            // Clear references
            videoRef.current = null;
            canvasRef.current = null;
        } catch (cleanupErr) {
            console.error("Error cleaning up video stream:", cleanupErr);
        }
        
        setIsCameraActive(false);
        return Promise.resolve(); // Ensure we return a promise for chaining
    }, [quaggaInitialized, stopProductRecognition]);

    // Cleanup camera when component unmounts
    useEffect(() => {
        return () => {
            if (quaggaRef.current && quaggaInitialized) {
                stopCamera();
            }
        };
    }, [quaggaInitialized, stopCamera]);

    // Load the product recognition model
    useEffect(() => {
        const loadModel = async () => {
            try {
                console.log("Loading TensorFlow.js and ResNet model...");
                
                // Initialize TensorFlow.js
                await tf.ready();
                console.log("TensorFlow.js ready");
                
                // In a real implementation, you would load a pre-trained model:
                // const model = await tf.loadLayersModel('https://your-model-url/model.json');
                
                // For demonstration, we'll create a simple model that simulates product recognition
                // This is not a real working model - just for demonstration purposes
                const mockModel = await createMockModel();
                modelRef.current = mockModel;
                
                // Warm up the model with a dummy tensor
                const dummyInput = tf.zeros([1, 224, 224, 3]);
                const warmupResult = mockModel.predict(dummyInput);
                warmupResult.dispose();
                dummyInput.dispose();
                
                setModelLoaded(true);
                console.log("Product recognition model loaded");
            } catch (err) {
                console.error("Error loading product recognition model:", err);
                setError("Failed to load product recognition model. Some features may not work.");
            }
        };
        
        // Create a mock model for demonstration
        const createMockModel = async () => {
            const model = tf.sequential();
            
            // Add layers with proper configuration
            model.add(tf.layers.conv2d({
                inputShape: [224, 224, 3],
                filters: 16,
                kernelSize: 3,
                activation: 'relu'
            }));
            
            model.add(tf.layers.maxPooling2d({
                poolSize: 2,
                strides: 2
            }));
            
            model.add(tf.layers.conv2d({
                filters: 32,
                kernelSize: 3,
                activation: 'relu'
            }));
            
            model.add(tf.layers.maxPooling2d({
                poolSize: 2,
                strides: 2
            }));
            
            model.add(tf.layers.flatten());
            
            model.add(tf.layers.dense({
                units: 50,
                activation: 'softmax'
            }));
            
            // Compile the model
            model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });
            
            return model;
        };
        
        loadModel();
        
        return () => {
            // Clean up model resources
            if (modelRef.current) {
                try {
                    // Clean up any tensors
                    tf.dispose(modelRef.current);
                } catch (err) {
                    console.error("Error disposing model:", err);
                }
                modelRef.current = null;
            }
        };
    }, []);

    // Toggle between barcode and product recognition modes
    const toggleRecognitionMode = () => {
        const newMode = recognitionMode === 'barcode' ? 'product' : 'barcode';
        setRecognitionMode(newMode);
        
        if (isCameraActive) {
            // Restart camera with new mode
            stopCamera().then(() => startCamera());
        }
    };

    // Update the startProductRecognition function to use the new mockProductRecognition
    const startProductRecognition = useCallback(() => {
        if (!isCameraActive) return;
        
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg');
        
        setIsRecognizing(true);
        
        // Call the mock function instead of real recognition for demo
        mockProductRecognition(imageData)
            .then((results) => {
                setRecognizedProducts(results);
                setIsRecognizing(false);
            })
            .catch((error) => {
                console.error('Error during product recognition:', error);
                setIsRecognizing(false);
            });
        
        // Set up recognition interval for continuous recognition
        productRecognitionInterval.current = setInterval(() => {
            if (videoRef.current) {
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                
                const imageData = canvas.toDataURL('image/jpeg');
                
                // Only process if we're not already recognizing
                if (!isRecognizing) {
                    setIsRecognizing(true);
                    mockProductRecognition(imageData)
                        .then((results) => {
                            setRecognizedProducts(results);
                            setIsRecognizing(false);
                        })
                        .catch((error) => {
                            console.error('Error during product recognition:', error);
                            setIsRecognizing(false);
                        });
                }
            }
        }, 3000); // Recognize every 3 seconds
    }, [isCameraActive, isRecognizing]);

    // Select a recognized product
    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setRecognizedProducts([]);
        stopProductRecognition();
    };
    
    // Close product details and restart camera if needed
    const handleCloseProductDetails = () => {
        setRecognizedProducts([]);
        if (isCameraActive && recognitionMode === 'product') {
            startProductRecognition();
        }
    };

    // Update the mockProductRecognition function to include nutritional assessment information
    const mockProductRecognition = (image) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock recognition results
                const mockProducts = [
                    { 
                        name: 'Apple', 
                        confidence: 0.92,
                        nutritionInfo: {
                            calories: '52 kcal per 100g',
                            positives: ['High in fiber', 'Rich in antioxidants', 'Good source of vitamin C'],
                            negatives: ['Contains natural sugars (about 10g per 100g)', 'May cause bloating in some people']
                        }
                    },
                    { 
                        name: 'Banana', 
                        confidence: 0.89,
                        nutritionInfo: {
                            calories: '89 kcal per 100g',
                            positives: ['High in potassium', 'Good source of vitamin B6', 'Contains fiber for digestive health'],
                            negatives: ['High sugar content (12g per 100g)', 'Higher calorie content than many other fruits']
                        }
                    },
                    { 
                        name: 'Sweet Potato', 
                        confidence: 0.87,
                        nutritionInfo: {
                            calories: '86 kcal per 100g',
                            positives: ['Rich in beta-carotene', 'High in fiber', 'Contains vitamin C and manganese'],
                            negatives: ['High in starch and natural sugars', 'May cause blood sugar spikes if eaten in large quantities']
                        }
                    },
                    { 
                        name: 'Sweet Potato Fries', 
                        confidence: 0.82,
                        nutritionInfo: {
                            calories: '240 kcal per 100g',
                            positives: ['Contains beta-carotene', 'More nutrients than regular fries'],
                            negatives: ['High in fat when fried', 'High in sugar - should be eaten in small quantities', 'Often contains added salt']
                        }
                    },
                    { 
                        name: 'Broccoli', 
                        confidence: 0.85,
                        nutritionInfo: {
                            calories: '34 kcal per 100g',
                            positives: ['Very high in vitamin C and K', 'Contains powerful antioxidants', 'High in fiber'],
                            negatives: ['May cause gas or bloating in some people', 'Contains goitrogens which can affect thyroid function when consumed in very large amounts']
                        }
                    },
                    { 
                        name: 'Salmon', 
                        confidence: 0.84,
                        nutritionInfo: {
                            calories: '208 kcal per 100g',
                            positives: ['Excellent source of omega-3 fatty acids', 'High-quality protein', 'Rich in B vitamins'],
                            negatives: ['Higher in calories than white fish', 'May contain environmental contaminants - wild-caught is often preferable']
                        }
                    },
                    { 
                        name: 'Avocado', 
                        confidence: 0.83,
                        nutritionInfo: {
                            calories: '160 kcal per 100g',
                            positives: ['Rich in healthy monounsaturated fats', 'High in fiber', 'Contains potassium and B-vitamins'],
                            negatives: ['High in calories - should be eaten in moderation', 'High fat content (though mostly healthy fats)']
                        }
                    },
                    { 
                        name: 'Chocolate Cake', 
                        confidence: 0.81,
                        nutritionInfo: {
                            calories: '350 kcal per 100g',
                            positives: ['Contains some iron from chocolate', 'Can provide quick energy'],
                            negatives: ['Very high in sugar and refined carbohydrates', 'High in unhealthy fats', 'Should be consumed only occasionally in small portions']
                        }
                    },
                    { 
                        name: 'Instant Noodles', 
                        confidence: 0.90,
                        nutritionInfo: {
                            calories: '436 kcal per 100g',
                            protein: '9g per 100g',
                            fat: '17g per 100g',
                            carbs: '62g per 100g',
                            sugar: '1.5g per 100g',
                            sodium: '1310mg per 100g',
                            fiber: '2.5g per 100g',
                            healthScore: '3/10',
                            positives: ['Quick and convenient source of energy', 'Low in sugar compared to many processed foods', 'Can be improved by adding vegetables and protein'],
                            negatives: ['Very high in sodium (over half the daily limit in one serving)', 'Made with refined flour which may cause blood sugar spikes', 'Contains unhealthy trans fats and preservatives', 'Low in essential nutrients and fiber']
                        }
                    },
                    { 
                        name: 'Whole Grain Noodles', 
                        confidence: 0.87,
                        nutritionInfo: {
                            calories: '350 kcal per 100g',
                            protein: '12g per 100g',
                            fat: '3g per 100g',
                            carbs: '71g per 100g',
                            sugar: '2.4g per 100g',
                            sodium: '10mg per 100g',
                            fiber: '6.5g per 100g',
                            healthScore: '7/10',
                            positives: ['Good source of complex carbohydrates', 'Contains more fiber than regular noodles', 'Provides essential B vitamins and minerals', 'Lower glycemic index than white noodles'],
                            negatives: ['Still relatively high in calories', 'Contains gluten which may affect sensitive individuals', 'Can contribute to weight gain if consumed in large portions']
                        }
                    },
                    { 
                        name: 'Rice Noodles', 
                        confidence: 0.85,
                        nutritionInfo: {
                            calories: '364 kcal per 100g',
                            protein: '6g per 100g',
                            fat: '0.9g per 100g',
                            carbs: '80g per 100g',
                            sugar: '0.8g per 100g',
                            sodium: '5mg per 100g',
                            fiber: '1.6g per 100g',
                            healthScore: '5/10',
                            positives: ['Naturally gluten-free', 'Very low in fat and sodium', 'Lower in allergenic proteins than wheat noodles', 'Versatile base for adding vegetables and lean proteins'],
                            negatives: ['High in refined carbohydrates', 'Lower in protein and fiber than whole grain options', 'May cause blood sugar spikes', 'Often served with high-sodium sauces']
                        }
                    }
                ];
                
                // Simulate detection with random products
                const detectedProducts = [];
                const numberOfDetections = Math.floor(Math.random() * 3) + 1; // 1-3 detections
                
                for (let i = 0; i < numberOfDetections; i++) {
                    const randomIndex = Math.floor(Math.random() * mockProducts.length);
                    const confidenceVariation = (Math.random() * 0.1) - 0.05; // +/- 5%
                    const product = {...mockProducts[randomIndex]};
                    
                    // Adjust confidence slightly to make it look more realistic
                    product.confidence = Math.min(0.99, Math.max(0.75, product.confidence + confidenceVariation));
                    
                    detectedProducts.push(product);
                }
                
                resolve(detectedProducts);
            }, 2000); // Simulate processing time
        });
    };

    // Add web search function for food items not in database
    const searchFoodItemOnline = async (foodName) => {
        try {
            setIsLoading(true);
            console.log(`Searching online for: ${foodName}`);
            
            // Create a nutritional profile based on web search results
            // This is a mock implementation - in a real app, you would call an API
            const searchResults = await fetchNutritionData(foodName);
            
            console.log("Search results:", searchResults); // Debug log
            
            if (searchResults) {
                // Make sure we have the correct health concerns format
                if (!searchResults.health_concerns || !Array.isArray(searchResults.health_concerns) || searchResults.health_concerns.length === 0) {
                    searchResults.health_concerns = ['No specific health concerns identified.'];
                }
                
                // Ensure should_consume field is properly set
                if (searchResults.score >= 7) {
                    searchResults.should_consume = 'Yes';
                } else if (searchResults.score <= 4) {
                    searchResults.should_consume = 'No';
                } else {
                    searchResults.should_consume = 'Moderate';
                }
                
                setProductInfo(searchResults);
                setError('');
            } else {
                setError(`Could not find nutritional information for ${foodName}`);
                setProductInfo(null);
            }
        } catch (err) {
            console.error("Error searching for food item online:", err);
            setError(`Failed to search for ${foodName}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Mock function to fetch nutrition data from web search
    const fetchNutritionData = async (foodName) => {
        // Wait a bit to simulate network request
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const lowerName = foodName.toLowerCase().trim();
        
        // Common fruits with specific data
        const commonFruits = {
            'banana': {
                name: 'Banana',
                brand: 'Fresh Produce',
                should_consume: 'Yes',
                reason: 'Bananas are excellent sources of potassium, vitamin B6, and fiber. They provide quick energy, support heart health, and aid digestion.',
                score: 8,
                nutrition_label: {
                    serving_size: '1 medium (118g)',
                    calories: '105',
                    protein: '1.3',
                    sugar: '14',
                    fat: '0.4',
                    sodium: '1',
                    fiber: '3.1'
                },
                health_concerns: [
                    'Higher in natural sugars than some other fruits',
                    'May cause blood sugar spikes in sensitive individuals',
                    'Some people may have banana allergies'
                ],
                alternatives: [
                    'Berries (lower in sugar)',
                    'Apples',
                    'Other fresh fruits for variety'
                ]
            },
            'apple': {
                name: 'Apple',
                brand: 'Fresh Produce',
                should_consume: 'Yes',
                reason: 'Apples are nutrient-dense fruits rich in fiber, vitamin C, and antioxidants. They support heart health, digestion, and may help regulate blood sugar levels.',
                score: 8.5,
                nutrition_label: {
                    serving_size: '1 medium (182g)',
                    calories: '95',
                    protein: '0.5',
                    sugar: '19',
                    fat: '0.3',
                    sodium: '2',
                    fiber: '4.4'
                },
                health_concerns: [
                    'Contains natural sugars - consume in moderation if monitoring blood sugar',
                    'Some individuals may have allergies to apples',
                    'Non-organic apples may contain pesticide residues'
                ],
                alternatives: [
                    'Pears',
                    'Berries (lower in sugar)',
                    'Other fresh fruits for variety'
                ]
            }
        };
        
        // Food categories for categorization
        const foodCategories = {
            fruits: ['banana', 'apple', 'orange', 'strawberry', 'grape', 'watermelon', 'pineapple', 'mango', 
                    'kiwi', 'peach', 'pear', 'cherry', 'blueberry', 'raspberry'],
            vegetables: ['broccoli', 'spinach', 'kale', 'carrot', 'potato', 'tomato', 'cucumber', 'lettuce', 
                        'onion', 'pepper', 'garlic', 'corn', 'mushroom', 'cabbage', 'cauliflower']
        };
        
        // Function to check if food name is in a category
        const isInCategory = (category) => {
            return category.some(item => lowerName.includes(item));
        };
        
        // SPECIAL CASE: Direct exact match for banana
        if (lowerName === 'banana') {
            console.log("Exact match found for banana");
            return commonFruits['banana'];
        }
        
        // Check for exact match in common fruits
        if (commonFruits[lowerName]) {
            console.log("Exact match found in common fruits:", lowerName);
            return commonFruits[lowerName];
        }
        
        // Check for partial match in common fruits
        for (const [key, data] of Object.entries(commonFruits)) {
            if (lowerName.includes(key)) {
                console.log("Partial match found in common fruits:", key);
                return data;
            }
        }
        
        // Fruits category
        if (isInCategory(foodCategories.fruits)) {
            console.log("Match found in fruits category");
            const fruitName = foodName.charAt(0).toUpperCase() + foodName.slice(1).toLowerCase();
            
            return {
                name: fruitName,
                brand: 'Fresh Produce',
                should_consume: 'Yes',
                reason: `${fruitName} is a nutritious fresh fruit rich in vitamins, minerals, and antioxidants. It provides natural sugars, fiber, and various health benefits.`,
                score: 8,
                nutrition_label: {
                    serving_size: '100g',
                    calories: '50-90',
                    protein: '0.5-1.5',
                    sugar: '5-15',
                    fat: '0-0.5',
                    sodium: '0-5',
                    fiber: '2-4'
                },
                health_concerns: [
                    'Natural sugar content - should be consumed in moderation by those monitoring sugar intake',
                    'Some individuals may have specific fruit allergies',
                    'Should be thoroughly washed to remove pesticide residues'
                ],
                alternatives: [
                    'Other fresh fruits for variety',
                    'Berries for lower sugar content',
                    'Vegetables for lower sugar options'
                ]
            };
        }
        
        // Vegetables category
        if (isInCategory(foodCategories.vegetables)) {
            console.log("Match found in vegetables category");
            const vegName = foodName.charAt(0).toUpperCase() + foodName.slice(1).toLowerCase();
            return {
                name: vegName,
                brand: 'Fresh Produce',
                should_consume: 'Yes',
                reason: `${vegName} is a nutrient-dense vegetable providing essential vitamins, minerals, and fiber while being low in calories. Regular consumption is associated with reduced risk of chronic diseases.`,
                score: 9,
                nutrition_label: {
                    serving_size: '100g',
                    calories: '25-80',
                    protein: '1-3',
                    sugar: '1-4',
                    fat: '0-0.5',
                    sodium: '10-80',
                    fiber: '2-5'
                },
                health_concerns: [
                    'Some vegetables may cause digestive discomfort for sensitive individuals',
                    'Should be thoroughly washed to remove pesticide residues',
                    'Some contain compounds that can interfere with medication (consult doctor if on medication)'
                ],
                alternatives: [
                    'Various other vegetables for a diverse nutrient profile',
                    'Different cooking methods can change nutrient availability'
                ]
            };
        }
        
        // Default values for unknown products
        return {
            name: foodName.charAt(0).toUpperCase() + foodName.slice(1),
            brand: 'Unknown',
            should_consume: 'Moderate',
            reason: `Limited nutritional information available for ${foodName}. Consider checking the product label or consulting a nutritionist.`,
            score: 5,
            nutrition_label: {
                serving_size: '100g',
                calories: 'Unknown',
                protein: 'Unknown',
                sugar: 'Unknown',
                fat: 'Unknown',
                sodium: 'Unknown'
            },
            health_concerns: [
                'Nutritional information not available',
                'Please check product label for accurate details'
            ],
            alternatives: [
                'Consider whole, unprocessed foods',
                'Look for products with clear nutritional labeling'
            ]
        };
    };

    // Map barcode to product data for offline lookup
    const lookupBarcodeData = (barcode) => {
        // Define our known barcodes
        const barcodeMap = {
            '8901058851428': {
                name: 'Maggi Instant Noodles',
                brand: 'Nestlé',
                should_consume: 'No',
                reason: 'Maggi noodles are high in sodium and saturated fats while being low in fiber and essential nutrients. Though convenient and affordable, they are highly processed with preservatives and flavor enhancers that aren\'t ideal for regular consumption.',
                score: 4.5,
                nutrition_label: {
                    serving_size: '70g (1 pack)',
                    calories: '320',
                    protein: '7',
                    sugar: '2.5',
                    fat: '13',
                    sodium: '1150',
                    fiber: '1.5',
                    saturated_fat: '6'
                },
                health_concerns: [
                    'Very high sodium content (around 1150mg - nearly half the daily limit)',
                    'High in saturated fats (6g per serving)',
                    'Low in dietary fiber (only 1.5g)',
                    'Ultra-processed with additives and flavor enhancers',
                    'Low in essential micronutrients and vitamins'
                ],
                alternatives: [
                    'Whole grain noodles with vegetables and lean protein',
                    'Rice noodles with homemade broth and fresh ingredients',
                    'Zucchini noodles (zoodles) for a low-carb option',
                    'Instant pot or quick-cook brown rice with vegetables',
                    'Add vegetables, reduce seasoning packet, and use less oil if consuming'
                ]
            },
            '4005500070023': {
                name: 'Milky Bar',
                brand: 'Nestlé',
                should_consume: 'No',
                reason: 'Milky Bar is high in sugar and saturated fats with minimal nutritional value. It contains artificial flavors and is primarily made of sugar and milk solids.',
                score: 2,
                nutrition_label: {
                    serving_size: '100g',
                    calories: '545',
                    protein: '8',
                    sugar: '55',
                    fat: '31',
                    sodium: '176'
                },
                health_concerns: [
                    'Very high sugar content (55g per 100g)',
                    'High in saturated fats',
                    'Contains artificial flavors and additives',
                    'May contribute to dental problems',
                    'Can lead to blood sugar spikes'
                ],
                alternatives: [
                    'Dark chocolate (70% or more cocoa)',
                    'Fresh fruits for natural sweetness',
                    'Greek yogurt with honey',
                    'Mixed nuts for healthy fats'
                ]
            },
            '8901058850429': {
                name: 'KitKat',
                brand: 'Nestlé',
                should_consume: 'No',
                reason: 'KitKat is high in sugar, unhealthy fats, and calories while providing minimal nutritional benefits. It contains artificial flavors and preservatives.',
                score: 2,
                nutrition_label: {
                    serving_size: '100g',
                    calories: '518',
                    protein: '6.1',
                    sugar: '49.2',
                    fat: '26.8',
                    sodium: '80'
                },
                health_concerns: [
                    'Very high sugar content (nearly 50g per 100g)',
                    'High in unhealthy fats',
                    'Contains artificial flavors and preservatives',
                    'Low fiber content',
                    'Can contribute to weight gain and dental problems'
                ],
                alternatives: [
                    'Dark chocolate with high cocoa content',
                    'Homemade energy bars with nuts and dried fruits',
                    'Greek yogurt with honey and fresh fruit',
                    'Trail mix with nuts and a few dark chocolate chips'
                ]
            },
            '0123456789123': {
                name: 'Organic Quinoa',
                brand: 'Whole Foods',
                should_consume: 'Yes',
                reason: 'Quinoa is a complete protein containing all nine essential amino acids. It\'s high in fiber, naturally gluten-free, and rich in vitamins and minerals including magnesium, B vitamins, and iron.',
                score: 9,
                nutrition_label: {
                    serving_size: '100g (cooked)',
                    calories: '120',
                    protein: '4.4',
                    sugar: '0.9',
                    fat: '1.9',
                    sodium: '7',
                    fiber: '2.8',
                    carbs: '21.3'
                },
                health_concerns: [
                    'May cause digestive issues in some sensitive individuals',
                    'Contains saponins which can be irritating for some people (washing thoroughly helps)'
                ],
                alternatives: [
                    'Brown rice',
                    'Buckwheat',
                    'Amaranth',
                    'Millet',
                    'Teff'
                ]
            }
        };
        
        return barcodeMap[barcode] || null;
    };

    useEffect(() => {
        // Existing effects...

        // Add title tooltip interaction
        const titleElement = document.querySelector('.consumewise-title');
        const tooltipElement = document.querySelector('.title-tooltip');
        const tooltipClose = document.querySelector('.tooltip-close');
        const titleArrow = document.querySelector('.title-arrow');

        if (titleElement && tooltipElement && tooltipClose && titleArrow) {
            titleElement.addEventListener('click', () => {
                tooltipElement.classList.toggle('active');
                titleArrow.classList.toggle('active');
            });

            tooltipClose.addEventListener('click', (e) => {
                e.stopPropagation();
                tooltipElement.classList.remove('active');
                titleArrow.classList.remove('active');
            });
        }

        return () => {
            // Cleanup event listeners
            if (titleElement && tooltipElement && tooltipClose) {
                titleElement.removeEventListener('click', () => {});
                tooltipClose.removeEventListener('click', () => {});
            }
        };
    }, []);

    return (
        <div className="barcode-scanner-page">
            {/* Commenting out the PostitNote since it's already rendered in App.js */}
            {/* <PostitNote /> */}
            <div className={`scanner-container ${isDarkMode ? 'dark-mode' : ''}`}>
                <button 
                    className="dark-mode-toggle top-left-corner" 
                    onClick={toggleDarkMode}
                    aria-label="Toggle dark mode"
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>
                
                <div className="scanner-header">
                    <div className="header-content">
                        <div className="title-container">
                            <h1 className="consumewise-title">
                                ConsumeWise
                                <span className="title-arrow"></span>
                            </h1>
                            <div className="title-tooltip">
                                <p>ConsumeWise is your personal nutrition assistant that helps you make informed food choices.</p>
                                <p>Simply scan barcodes or search for products to get detailed nutritional information and healthier alternatives.</p>
                                <span className="tooltip-close">×</span>
                            </div>
                        </div>
                        <p>Your Personal Nutrition Assistant</p>
                        <p>Scan • Analyze • Make Informed Choices</p>
                </div>
            </div>
                
                {/* Server connection status */}
                <div className="server-status-container">
                    {isServerConnected === 'connected' && (
                        <div className="server-status connected">
                            <span>✓ Connected to Nutrition Server</span>
                        </div>
                    )}
                    {isServerConnected === 'checking' && (
                        <div className="server-status checking">
                            <span>⟳ Checking server connection...</span>
                        </div>
                    )}
                    {isServerConnected === 'error' && (
                        <div className="server-status error">
                            <span>✕ Not connected to server</span>
                        </div>
                    )}
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

                {inputMethod === 'barcode' && (
                    <form className="form-container" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <div className="barcode-input-container">
                            <input
                                    className="input-field"
                                type="text"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                    placeholder="Enter barcode number (e.g., 89012345)"
                                required
                                pattern="[0-9]*"
                                maxLength="13"
                            />
                            <button 
                                type="button" 
                                className="camera-btn"
                                onClick={startCamera}
                            >
                                📷
                            </button>
                        </div>
                            <button
                                type="submit"
                                disabled={!barcode || isLoading}
                            >
                            {isLoading ? 'Analyzing...' : 'Analyze Nutrition'}
                        </button>
                    </div>
                    </form>
                )}

                {inputMethod === 'name' && (
                    <form className="form-container" onSubmit={handleSubmit}>
                    <div className="input-group">
                            <div className="name-input-container">
                        <input
                                    className="input-field"
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Enter product name (e.g., Maggi Noodles, Dominos Pizza)"
                            required
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
                            <button 
                                type="submit" 
                                disabled={isLoading}
                            >
                            {isLoading ? 'Analyzing...' : 'Analyze Nutrition'}
                        </button>
                    </div>
            </form>
                )}

                {isCameraActive && (
                    <div className="camera-container">
                        <div className="recognition-mode-toggle">
                            <button
                                className={`mode-btn ${recognitionMode === 'barcode' ? 'active' : ''}`}
                                onClick={toggleRecognitionMode}
                                disabled={isRecognizing}
                            >
                                <span className="mode-icon">📊</span>
                                <span>Barcode Mode</span>
                            </button>
                            <button
                                className={`mode-btn ${recognitionMode === 'product' ? 'active' : ''}`}
                                onClick={toggleRecognitionMode}
                                disabled={isRecognizing}
                            >
                                <span className="mode-icon">🔍</span>
                                <span>Product Mode</span>
                            </button>
                        </div>
                        
                        <div className="viewport-container">
                            <div id="interactive" className="viewport"></div>
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
                    <ProductInfo 
                        productInfo={productInfo} 
                        onGoBack={() => {
                            setProductInfo(null);
                            setBarcode('');
                            setProductName('');
                        }} 
                    />
                )}

                {selectedProduct && (
                    <div className="product-details">
                        <div className="product-details-content">
                            <h2>{selectedProduct.name}</h2>
                            
                            <div className="nutrition-facts">
                        <h3>Nutrition Facts</h3>
                                <table className="nutrition-table">
                                    <tbody>
                                        <tr>
                                            <td><strong>Calories:</strong></td>
                                            <td>{selectedProduct.nutritionInfo.calories}</td>
                                        </tr>
                                        {selectedProduct.nutritionInfo.protein && (
                                            <tr>
                                                <td><strong>Protein:</strong></td>
                                                <td>{selectedProduct.nutritionInfo.protein}</td>
                                            </tr>
                                        )}
                                        {selectedProduct.nutritionInfo.fat && (
                                            <tr>
                                                <td><strong>Fat:</strong></td>
                                                <td>{selectedProduct.nutritionInfo.fat}</td>
                                            </tr>
                                        )}
                                        {selectedProduct.nutritionInfo.carbs && (
                                            <tr>
                                                <td><strong>Carbs:</strong></td>
                                                <td>{selectedProduct.nutritionInfo.carbs}</td>
                                            </tr>
                                        )}
                                        {selectedProduct.nutritionInfo.sugar && (
                                            <tr>
                                                <td><strong>Sugar:</strong></td>
                                                <td>{selectedProduct.nutritionInfo.sugar}</td>
                                            </tr>
                                        )}
                                        {selectedProduct.nutritionInfo.sodium && (
                                            <tr>
                                                <td><strong>Sodium:</strong></td>
                                                <td>{selectedProduct.nutritionInfo.sodium}</td>
                                            </tr>
                                        )}
                                        {selectedProduct.nutritionInfo.fiber && (
                                            <tr>
                                                <td><strong>Fiber:</strong></td>
                                                <td>{selectedProduct.nutritionInfo.fiber}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                
                                {selectedProduct.nutritionInfo.healthScore && (
                                    <div 
                                        className="health-score"
                                        data-score={selectedProduct.nutritionInfo.healthScore.split('/')[0]}
                                    >
                                        <strong>Health Score:</strong> 
                                        <span className="score-value">{selectedProduct.nutritionInfo.healthScore}</span>
                            </div>
                                )}
                            </div>
                            
                            <div className="nutrition-assessment">
                                <div className="positives">
                                    <h3 style={{ color: '#4CAF50' }}>Nutritional Benefits</h3>
                                    <ul>
                                        {selectedProduct.nutritionInfo.positives.map((positive, index) => (
                                            <li key={`pos-${index}`}>{positive}</li>
                                        ))}
                                    </ul>
                            </div>
                                
                                <div className="negatives">
                                    <h3 style={{ color: '#f44336' }}>Consumption Cautions</h3>
                                    <ul>
                                        {selectedProduct.nutritionInfo.negatives.map((negative, index) => (
                                            <li key={`neg-${index}`}>{negative}</li>
                                        ))}
                                    </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default BarcodeScanner; 