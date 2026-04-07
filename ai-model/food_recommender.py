def recommend_food(conditions):
    food_map = {
        "Anemia": {
            "nutrients": ["Iron", "Vitamin B12", "Folate"],
            "foods": ["Spinach", "Beetroot", "Dates", "Lentils"],
            "avoid": [
                "Tea and coffee with meals (reduces iron absorption)",
                "Excess dairy during iron intake",
                "Processed junk food"
            ],
            "meals": ["Spinach curry + roti", "Lentil soup"],
            "tips": ["Take vitamin C (lemon, orange) with iron-rich food"]
        },

        "High Blood Sugar": {
            "nutrients": ["Fiber", "Protein"],
            "foods": ["Oats", "Vegetables", "Nuts", "Whole grains"],
            "avoid": [
                "Sugary foods (sweets, chocolates)",
                "Soft drinks and juices",
                "White bread, white rice",
                "Fried snacks"
            ],
            "meals": ["Oats breakfast", "Vegetable salad"],
            "tips": ["Eat small frequent meals, avoid sugar spikes"]
        },

        "High Cholesterol": {
            "nutrients": ["Omega-3", "Fiber"],
            "foods": ["Oats", "Fruits", "Nuts", "Fish"],
            "avoid": [
                "Fried and oily food",
                "Butter and ghee (in excess)",
                "Processed meats",
                "Fast food (burgers, fries)"
            ],
            "meals": ["Oatmeal breakfast", "Grilled vegetables"],
            "tips": ["Exercise regularly and avoid trans fats"]
        },

        "Vitamin D Deficiency": {
            "nutrients": ["Vitamin D", "Calcium"],
            "foods": ["Milk", "Egg yolk", "Mushrooms"],
            "avoid": [
                "Highly processed junk food",
                "Excess soda (affects calcium absorption)"
            ],
            "meals": ["Milk + eggs breakfast"],
            "tips": ["Get sunlight exposure daily (15–20 min)"]
        }
    }

    recommendations = []

    for condition in conditions:
        if condition in food_map:
            recommendations.append({
                "condition": condition,
                **food_map[condition]
            })

    return recommendations