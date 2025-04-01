const TRAINING_DATA = {
    // Score 1 (Very Unhealthy)
    1: [
        {
            name: "Lay's Classic Potato Chips",
            brand: "Lay's",
            reason: "High in unhealthy fats and sodium, minimal nutritional value. Can contribute to obesity and cardiovascular issues.",
            nutrition: { serving_size: "30g", calories: "160", protein: "2", fat: "10", sugar: "0", sodium: "170" }
        },
        {
            name: "Aloo Bhujia",
            brand: "Haldiram's",
            reason: "Deep fried, high sodium content, refined flour base. Regular consumption may lead to high blood pressure.",
            nutrition: { serving_size: "30g", calories: "150", protein: "3", fat: "9", sugar: "1", sodium: "200" }
        },
        {
            name: "Bourbon Biscuits",
            brand: "Britannia",
            reason: "High sugar content, refined flour, unhealthy fats. Can contribute to diabetes and weight gain.",
            nutrition: { serving_size: "30g", calories: "140", protein: "2", fat: "6", sugar: "12", sodium: "50" }
        }
        // Add more examples...
    ],

    // Score 2 (Unhealthy)
    2: [
        {
            name: "Instant Maggi Noodles",
            brand: "Nestle",
            reason: "High in refined carbs and sodium, low in fiber and protein. Not suitable for regular consumption.",
            nutrition: { serving_size: "70g", calories: "320", protein: "7", fat: "12", sugar: "1", sodium: "860" }
        },
        {
            name: "Kurkure",
            brand: "PepsiCo",
            reason: "Processed corn, artificial flavors, high sodium. Contains unhealthy fats and additives.",
            nutrition: { serving_size: "30g", calories: "140", protein: "2", fat: "8", sugar: "2", sodium: "180" }
        }
        // Add more examples...
    ],

    // Score 3 (Below Average)
    3: [
        {
            name: "Cream Biscuits",
            brand: "Parle",
            reason: "Contains refined sugar and palm oil, low nutritional value. Better alternatives available.",
            nutrition: { serving_size: "30g", calories: "130", protein: "2", fat: "5", sugar: "8", sodium: "40" }
        },
        {
            name: "Fruit Juice",
            brand: "Real",
            reason: "High in natural sugars, lacks fiber of whole fruits. Not as healthy as eating whole fruits.",
            nutrition: { serving_size: "200ml", calories: "90", protein: "0", fat: "0", sugar: "20", sodium: "10" }
        }
        // Add more examples...
    ],

    // Score 4 (Slightly Below Average)
    4: [
        {
            name: "White Bread",
            brand: "Britannia",
            reason: "Made with refined flour, moderate nutritional value. Choose whole grain alternatives.",
            nutrition: { serving_size: "30g", calories: "75", protein: "3", fat: "1", sugar: "2", sodium: "125" }
        },
        {
            name: "Fruit Jam",
            brand: "Kissan",
            reason: "Contains added sugars but some fruit content. Moderate in small quantities.",
            nutrition: { serving_size: "20g", calories: "50", protein: "0", fat: "0", sugar: "12", sodium: "5" }
        }
        // Add more examples...
    ],

    // Score 5 (Average)
    5: [
        {
            name: "Marie Gold Biscuits",
            brand: "Britannia",
            reason: "Lower in sugar than cream biscuits, but still refined flour. Acceptable for occasional snacking.",
            nutrition: { serving_size: "30g", calories: "120", protein: "3", fat: "4", sugar: "5", sodium: "30" }
        },
        {
            name: "Poha",
            brand: "Fortune",
            reason: "Rice-based, moderate nutritional value. Good for breakfast when prepared with vegetables.",
            nutrition: { serving_size: "50g", calories: "170", protein: "3", fat: "1", sugar: "0", sodium: "5" }
        }
        // Add more examples...
    ],

    // Score 6 (Above Average)
    6: [
        {
            name: "Wheat Rusks",
            brand: "Britannia",
            reason: "Made with whole wheat, moderate fiber content. Better choice than regular biscuits.",
            nutrition: { serving_size: "30g", calories: "110", protein: "4", fat: "2", sugar: "3", sodium: "20" }
        },
        {
            name: "Soya Chunks",
            brand: "Nutrela",
            reason: "High protein content, good for vegetarians. Watch sodium content in seasoned varieties.",
            nutrition: { serving_size: "30g", calories: "100", protein: "15", fat: "1", sugar: "0", sodium: "15" }
        }
        // Add more examples...
    ],

    // Score 7 (Good)
    7: [
        {
            name: "Multigrain Bread",
            brand: "Modern",
            reason: "Contains multiple grains, good fiber content. Better choice for daily bread consumption.",
            nutrition: { serving_size: "30g", calories: "75", protein: "4", fat: "1", sugar: "2", sodium: "115" }
        },
        {
            name: "Low Fat Yogurt",
            brand: "Amul",
            reason: "Good protein and calcium content, probiotics. Healthy snack option.",
            nutrition: { serving_size: "100g", calories: "60", protein: "4", fat: "2", sugar: "4", sodium: "50" }
        }
        // Add more examples...
    ],

    // Score 8 (Very Good)
    8: [
        {
            name: "Steel Cut Oats",
            brand: "Saffola",
            reason: "High in fiber and protein, low glycemic index. Excellent breakfast choice.",
            nutrition: { serving_size: "40g", calories: "150", protein: "6", fat: "3", sugar: "1", sodium: "0" }
        },
        {
            name: "Quinoa",
            brand: "24 Mantra Organic",
            reason: "Complete protein, high fiber, nutrient-rich. Great for health-conscious consumers.",
            nutrition: { serving_size: "50g", calories: "180", protein: "7", fat: "3", sugar: "0", sodium: "5" }
        }
        // Add more examples...
    ],

    // Score 9 (Excellent)
    9: [
        {
            name: "Roasted Muesli",
            brand: "Bagrry's",
            reason: "Whole grains, nuts, seeds, no added sugar. Nutrient-dense breakfast option.",
            nutrition: { serving_size: "45g", calories: "170", protein: "6", fat: "5", sugar: "2", sodium: "10" }
        },
        {
            name: "Green Tea",
            brand: "Organic India",
            reason: "Rich in antioxidants, zero calories, no additives. Supports overall health.",
            nutrition: { serving_size: "200ml", calories: "0", protein: "0", fat: "0", sugar: "0", sodium: "0" }
        }
        // Add more examples...
    ],

    // Score 10 (Superior Health Choice)
    10: [
        {
            name: "Chia Seeds",
            brand: "True Elements",
            reason: "Omega-3 fatty acids, high fiber, protein-rich. Superfood with multiple health benefits.",
            nutrition: { serving_size: "30g", calories: "140", protein: "5", fat: "9", sugar: "0", sodium: "0" }
        },
        {
            name: "Organic Flaxseeds",
            brand: "24 Mantra Organic",
            reason: "Rich in omega-3, lignans, and fiber. Excellent for heart and digestive health.",
            nutrition: { serving_size: "30g", calories: "150", protein: "5", fat: "12", sugar: "0", sodium: "0" }
        }
        // Add more examples...
    ]
};

// Helper function to get examples for a specific score range
function getExamplesForScore(score) {
    return TRAINING_DATA[score] || [];
}

// Helper function to get relevant examples based on nutritional analysis
function getRelevantExamples(nutritionScore) {
    // Get examples from similar scores (±1 point)
    const score = Math.round(nutritionScore);
    const examples = [
        ...getExamplesForScore(score),
        ...getExamplesForScore(score - 1),
        ...getExamplesForScore(score + 1)
    ];
    
    // Shuffle and take first 3 examples
    return examples
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
}

module.exports = {
    TRAINING_DATA,
    getExamplesForScore,
    getRelevantExamples
}; 