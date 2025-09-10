# ConsumeWise - AI-Powered Food Health Scanner

A comprehensive React application that helps users make informed food choices by scanning barcodes and analyzing product health using AI-powered nutrition analysis.

## 🚀 Features

### Core Functionality

- **Real-time Barcode Scanning**: Uses Quagga2 library for accurate barcode detection
- **OpenFoodFacts Integration**: Primary data source for nutrition information
- **Health Analysis Engine**: Comprehensive scoring system based on multiple factors
- **Web Search Fallback**: Secondary data source for products not in OpenFoodFacts
- **Responsive Design**: Works on desktop and mobile devices

### Health Analysis

- **Overall Health Score**: 1-10 scale with letter grades (A-F)
- **Risk Assessment**: Low, medium, or high risk classification
- **Nutritional Analysis**: Detailed breakdown of positive and negative nutritional aspects
- **Processing Level**: NOVA classification (1-4) for food processing assessment
- **Ingredient Warnings**: Detection of harmful additives and allergens
- **Smart Recommendations**: Personalized suggestions for healthier alternatives

### User Experience

- **Camera Integration**: Live camera feed with visual scanning guides
- **Manual Entry**: Fallback option for barcode input
- **Product Search**: Search by product name
- **Comprehensive Results**: Detailed health analysis with expandable sections
- **Caching**: Local caching for improved performance
- **Error Handling**: Robust error handling with user-friendly messages

## 🛠️ Technical Implementation

### Architecture

```
src/
├── components/          # React components
│   ├── BarcodeScanner.tsx    # Camera-based barcode scanning
│   ├── ScanResultDisplay.tsx # Health analysis results display
│   └── ...
├── services/            # Business logic services
│   ├── openFoodFactsService.ts  # OpenFoodFacts API integration
│   ├── healthAnalysisService.ts # Health scoring algorithm
│   ├── scanService.ts          # Main scanning orchestration
│   └── webSearchService.ts     # Web search fallback
├── pages/               # Page components
│   ├── HomePage.tsx           # Landing page with scanner
│   └── ...
└── types/               # TypeScript type definitions
```

### Key Services

#### OpenFoodFacts Service

- Fetches product data from OpenFoodFacts API
- Processes nutrition facts, ingredients, and health indicators
- Handles API rate limiting and error cases
- Validates and cleans product data

#### Health Analysis Service

- Calculates comprehensive health scores
- Analyzes nutritional content and processing levels
- Detects harmful additives and allergens
- Generates personalized recommendations
- Suggests healthier alternatives

#### Scan Service

- Orchestrates the entire scanning process
- Manages caching for performance
- Handles fallback to web search
- Provides unified API for all scan types

### Health Scoring Algorithm

The health scoring system evaluates products across multiple dimensions:

1. **Nutrition Score (1-10)**

   - Based on Nutri-Score when available
   - Adjusted for specific nutrients (fiber, protein, vitamins)
   - Penalties for high sugar, sodium, saturated fat, trans fats

2. **Processing Score (1-10)**

   - NOVA Group 1 (Unprocessed): 9/10
   - NOVA Group 2 (Culinary ingredients): 7/10
   - NOVA Group 3 (Processed foods): 4/10
   - NOVA Group 4 (Ultra-processed): 1/10

3. **Additives Score (1-10)**

   - Penalties for harmful additives
   - Moderate penalties for questionable additives
   - Based on comprehensive additive database

4. **Allergens Score (1-10)**
   - Neutral scoring (customizable for user allergies)
   - Identifies common allergens

**Final Score**: Weighted average of all dimensions

### Barcode Validation

The system includes robust barcode validation:

- Format validation for common barcode types (UPC-A, EAN-13, EAN-8, CODE-128)
- Checksum verification for EAN-13, UPC-A, and EAN-8
- Pattern detection to avoid false positives
- Length and character validation

## 🔧 Installation & Setup

### Prerequisites

- Node.js 16+
- npm or yarn
- Modern web browser with camera support

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_OPENFOODFACTS_API_URL=https://world.openfoodfacts.org/api/v2
```

## 📱 Usage

### Barcode Scanning

1. Click "Start Scanner" to activate camera
2. Point camera at barcode
3. Hold steady until barcode is detected 3 times
4. View comprehensive health analysis

### Manual Entry

1. Enter barcode number manually
2. Click "Analyze Product"
3. View health analysis results

### Product Search

1. Enter product name
2. Select from search results
3. View health analysis

## 🎯 Health Analysis Features

### Score Breakdown

- **Overall Score**: 1-10 scale with letter grade
- **Risk Level**: Low, medium, or high risk
- **Detailed Breakdown**: Individual scores for nutrition, processing, additives, allergens

### Nutritional Highlights

- **Positive**: High fiber, protein, vitamins, minerals
- **Negative**: High sugar, sodium, saturated fat, trans fats

### Processing Analysis

- **NOVA Classification**: Scientific food processing classification
- **Recommendations**: Based on processing level
- **Health Impact**: Explanation of processing effects

### Ingredient Warnings

- **Harmful Additives**: Artificial colors, flavors, preservatives
- **Questionable Additives**: MSG, natural flavors, thickeners
- **Allergens**: Common food allergens identification

### Smart Recommendations

- **Personalized Advice**: Based on health score and processing level
- **Portion Control**: Guidance for moderate products
- **Healthier Alternatives**: Specific product suggestions

## 🔍 API Integration

### OpenFoodFacts API

- **Endpoint**: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
- **Rate Limiting**: Built-in delays and error handling
- **Data Processing**: Comprehensive parsing and validation
- **Fallback**: Web search for missing products

### Web Search Integration

- **Placeholder**: Ready for Google Custom Search, Bing API, or SerpAPI
- **Data Extraction**: NLP and pattern matching for nutrition data
- **Validation**: Cross-reference with known nutrition databases

## 🚀 Performance Optimizations

### Caching

- **Local Cache**: 24-hour cache for scan results
- **Memory Management**: Automatic cache size limiting
- **Cache Statistics**: Usage tracking and monitoring

### Error Handling

- **Graceful Degradation**: Fallback options for API failures
- **User Feedback**: Clear error messages and recovery options
- **Retry Logic**: Automatic retry for transient failures

### UI/UX

- **Loading States**: Visual feedback during processing
- **Progressive Disclosure**: Expandable sections for detailed information
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Screen reader support and keyboard navigation

## 🔮 Future Enhancements

### Planned Features

- **OCR Integration**: Image-based product recognition
- **User Profiles**: Personalized health goals and preferences
- **Scan History**: Track and analyze past scans
- **Social Features**: Share results and recommendations
- **Offline Mode**: Cached data for offline scanning
- **Multi-language**: Internationalization support

### Advanced Analytics

- **Trend Analysis**: Track health score trends over time
- **Category Insights**: Health analysis by food categories
- **Personalized Scoring**: Custom health criteria
- **Machine Learning**: Improved recommendation algorithms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenFoodFacts**: For providing comprehensive food database
- **Quagga2**: For barcode scanning capabilities
- **React Community**: For excellent documentation and tools
- **Nutrition Science**: For evidence-based health scoring algorithms

## 📞 Support

For support, email support@consumewise.com or create an issue in the repository.

---

**ConsumeWise** - Making healthy food choices simple and informed. 🥗✨
