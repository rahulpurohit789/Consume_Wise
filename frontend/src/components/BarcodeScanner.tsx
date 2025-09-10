import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Camera, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import Quagga from '@ericblade/quagga2';

interface BarcodeScannerProps {
  isActive: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isActive, onClose, onScan }) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  
  // Refs for lifecycle management
  const scannerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const isScanning = useRef(false);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const REQUIRED_DETECTIONS = 3; // Require 3 consistent detections

  // Validate barcode checksum
  const isValidBarcode = useCallback((code: string): boolean => {
    if (!code || code.length < 8) return false;
    
    // EAN-13 validation
    if (code.length === 13) {
      const digits = code.split('').map(Number);
      const sum = digits.slice(0, 12).reduce((acc, digit, index) => {
        return acc + digit * (index % 2 === 0 ? 1 : 3);
      }, 0);
      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === digits[12];
    }
    
    // UPC-A validation (12 digits)
    if (code.length === 12) {
      const digits = code.split('').map(Number);
      const sum = digits.slice(0, 11).reduce((acc, digit, index) => {
        return acc + digit * (index % 2 === 0 ? 3 : 1);
      }, 0);
      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === digits[11];
    }
    
    // EAN-8 validation
    if (code.length === 8) {
      const digits = code.split('').map(Number);
      const sum = digits.slice(0, 7).reduce((acc, digit, index) => {
        return acc + digit * (index % 2 === 0 ? 3 : 1);
      }, 0);
      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === digits[7];
    }
    
    return true; // For other formats, assume valid
  }, []);

  // Handle barcode detection
  const handleBarcodeDetection = useCallback((result: any) => {
    if (!isScanning.current) return;
    
    const code = result.codeResult.code;
    
    if (!isValidBarcode(code)) {
      console.log('Invalid barcode detected:', code);
      return;
    }

    console.log('Valid barcode detected:', code);
    setIsDetecting(true);
    
    // Add to detection history
    setDetectionHistory(prev => {
      const newHistory = [...prev, code];
      
      // Check if we have enough consistent detections
      if (newHistory.length >= REQUIRED_DETECTIONS) {
        const recentDetections = newHistory.slice(-REQUIRED_DETECTIONS);
        const allSame = recentDetections.every(detection => detection === recentDetections[0]);
        
        if (allSame) {
          console.log('Barcode confirmed:', recentDetections[0]);
          onScan(recentDetections[0]);
          return [];
        }
      }
      
      // Keep only recent detections
      return newHistory.slice(-REQUIRED_DETECTIONS);
    });
  }, [isValidBarcode, onScan]);

  // Comprehensive cleanup function
  const cleanup = useCallback(async () => {
    console.log('Starting cleanup...');
    
    // Clear any pending timeouts
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
    
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }

    isInitialized.current = false;
    isScanning.current = false;
    setIsDetecting(false);

    try {
      // Stop Quagga if it's running
      if (Quagga && typeof Quagga.stop === 'function') {
        await new Promise<void>((resolve) => {
          try {
            Quagga.stop();
            // Give Quagga time to clean up
            setTimeout(resolve, 200);
          } catch (error) {
            console.warn('Quagga stop error (non-critical):', error);
            resolve();
          }
        });
      }

      // Remove detection handler
      if (Quagga && typeof Quagga.offDetected === 'function') {
        try {
          Quagga.offDetected(handleBarcodeDetection);
        } catch (error) {
          console.warn('Quagga offDetected error (non-critical):', error);
        }
      }

      // Manual DOM cleanup with safety checks
      if (scannerRef.current) {
        try {
          // Remove all Quagga-generated elements
          const elements = scannerRef.current.querySelectorAll('canvas, video, div[style*="position"]');
          elements.forEach(element => {
            try {
              if (element.parentNode) {
                element.parentNode.removeChild(element);
              }
            } catch (e) {
              console.warn('Element cleanup warning (non-critical):', e);
            }
          });
          
          // Clear the container
          scannerRef.current.innerHTML = '';
        } catch (error) {
          console.warn('DOM cleanup error (non-critical):', error);
        }
      }
    } catch (error) {
      console.warn('Cleanup error (non-critical):', error);
    }
    
    console.log('Cleanup completed');
  }, [handleBarcodeDetection]);

  // Initialize scanner
  const initializeScanner = useCallback(async () => {
    if (isInitialized.current || isScanning.current || !scannerRef.current) {
      return;
    }

    try {
      setIsInitializing(true);
      setError(null);
      setDetectionHistory([]);

      // Test camera access first
      const testStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      testStream.getTracks().forEach(track => track.stop());
      
      console.log('Camera access test successful');

      // Create container for Quagga
      if (scannerRef.current) {
        scannerRef.current.innerHTML = '';
        
        const container = document.createElement('div');
        container.id = 'quagga-scanner-container';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.style.background = '#f3f4f6';
        
        scannerRef.current.appendChild(container);

        // Quagga configuration
        const config = {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: container,
            constraints: {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              facingMode: "environment",
              aspectRatio: { ideal: 1.777778 }
            }
          },
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader", 
              "upc_reader",
              "upc_e_reader",
              "code_128_reader"
            ]
          },
          locate: true,
          locator: {
            patchSize: "large",
            halfSample: false,
            showCanvas: false,
            showPatches: false,
            showFoundPatches: false,
            showSkeleton: false,
            showLabels: false,
            showBoundingBox: false,
            boxFromPatches: {
              showTransformed: false,
              showTransformedBox: false,
              showBB: false
            }
          }
        };

        // Initialize Quagga
        await new Promise<void>((resolve, reject) => {
          Quagga.init(config, (err) => {
            if (err) {
              console.error('Quagga initialization error:', err);
              reject(err);
            } else {
              console.log('Quagga initialized successfully');
              resolve();
            }
          });
        });

        // Start Quagga
        Quagga.start();
        console.log('Quagga started successfully');

        // Set up detection handler
        Quagga.onDetected(handleBarcodeDetection);
        
        isInitialized.current = true;
        isScanning.current = true;
      }
    } catch (error: any) {
      console.error('Scanner initialization error:', error);
      setError(`Camera error: ${error.message}`);
      await cleanup();
    } finally {
      setIsInitializing(false);
    }
  }, [handleBarcodeDetection, cleanup]);

  // Handle manual barcode input
  const handleManualInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const barcode = formData.get('barcode') as string;
    
    if (barcode && isValidBarcode(barcode)) {
      onScan(barcode);
    } else {
      setError('Please enter a valid barcode');
    }
  };

  // Main effect for scanner lifecycle
  useEffect(() => {
    if (isActive) {
      // Add delay to ensure DOM is ready
      initTimeoutRef.current = setTimeout(() => {
        initializeScanner();
      }, 100);
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [isActive, initializeScanner, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Scan Barcode</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Camera View */}
          <div className="mb-6">
            <div 
              ref={scannerRef}
              className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden relative"
            >
              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Initializing camera...</p>
                  </div>
                </div>
              )}
              
              {!isInitializing && !isScanning.current && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Camera not ready</p>
                  </div>
                </div>
              )}

              {/* Scanning overlay */}
              {isScanning.current && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner guides */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-blue-500"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-blue-500"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-blue-500"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-blue-500"></div>
                  
                  {/* Center crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-2 border-blue-500 rounded-lg opacity-50"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Manual Input */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Or enter barcode manually:</h3>
            <form onSubmit={handleManualInput} className="flex gap-2">
              <input
                type="text"
                name="barcode"
                placeholder="Enter barcode number"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={13}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Scan
              </button>
            </form>
          </div>

          {/* Detection Status */}
          {isDetecting && detectionHistory.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
              <p className="text-blue-700 text-sm">
                Detecting... ({detectionHistory.length}/{REQUIRED_DETECTIONS} consistent readings)
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600 text-sm">
              <strong>Tips:</strong> Hold the barcode steady within the frame. Make sure there's good lighting and the barcode is clearly visible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;