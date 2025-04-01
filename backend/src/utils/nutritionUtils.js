function evaluateNutritionalValues(nutrition) {
    let concerns = [];
    let benefits = [];

    // Check protein content
    if (nutrition.protein !== 'N/A') {
        const protein = parseFloat(nutrition.protein);
        if (protein >= 5) benefits.push('good protein content');
        if (protein < 2) concerns.push('low protein');
    }

    // Check sugar content
    if (nutrition.sugar !== 'N/A') {
        const sugar = parseFloat(nutrition.sugar);
        if (sugar > 10) concerns.push('high sugar');
        if (sugar <= 5) benefits.push('low sugar');
    }

    // Check fat content
    if (nutrition.fat !== 'N/A') {
        const fat = parseFloat(nutrition.fat);
        if (fat > 15) concerns.push('high fat');
        if (fat <= 3) benefits.push('low fat');
    }

    // Check sodium content
    if (nutrition.sodium !== 'N/A') {
        const sodium = parseFloat(nutrition.sodium);
        if (sodium > 400) concerns.push('high sodium');
        if (sodium <= 120) benefits.push('low sodium');
    }

    return { concerns, benefits };
}

module.exports = {
    evaluateNutritionalValues
}; 