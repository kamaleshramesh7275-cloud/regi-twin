from database import SessionLocal
import models

FOOD_CATALOG = [
    # --- PROTEINS (POULTRY, MEAT, SEAFOOD, PLANT-BASED) ---
    {"name": "Chicken Breast (Boneless, Cooked)", "category": "Poultry", "serving_unit": "100g", "serving_size_g": 100, "calories": 165, "protein_g": 31.0, "carbs_g": 0.0, "fat_g": 3.6, "fiber_g": 0.0, "sodium_mg": 74, "iron_mg": 1.0, "calcium_mg": 15, "vitamin_d_iu": 5, "b12_mcg": 0.3, "magnesium_mg": 29, "potassium_mg": 256, "zinc_mg": 1.0},
    {"name": "Chicken Thigh (Skinless, Cooked)", "category": "Poultry", "serving_unit": "100g", "serving_size_g": 100, "calories": 209, "protein_g": 26.0, "carbs_g": 0.0, "fat_g": 10.9, "fiber_g": 0.0, "sodium_mg": 85, "iron_mg": 1.3, "calcium_mg": 11, "vitamin_d_iu": 6, "b12_mcg": 0.4, "magnesium_mg": 23, "potassium_mg": 223, "zinc_mg": 2.1},
    {"name": "Turkey Breast (Cooked)", "category": "Poultry", "serving_unit": "100g", "serving_size_g": 100, "calories": 135, "protein_g": 30.0, "carbs_g": 0.0, "fat_g": 1.5, "fiber_g": 0.0, "sodium_mg": 68, "iron_mg": 1.4, "calcium_mg": 14, "vitamin_d_iu": 4, "b12_mcg": 0.4, "magnesium_mg": 30, "potassium_mg": 293, "zinc_mg": 1.5},
    {"name": "Ground Turkey 93/7 (Cooked)", "category": "Poultry", "serving_unit": "100g", "serving_size_g": 100, "calories": 170, "protein_g": 27.0, "carbs_g": 0.0, "fat_g": 8.0, "fiber_g": 0.0, "sodium_mg": 75, "iron_mg": 1.5, "calcium_mg": 18, "vitamin_d_iu": 5, "b12_mcg": 1.1, "magnesium_mg": 26, "potassium_mg": 270, "zinc_mg": 2.4},
    {"name": "Lean Ground Beef 90/10 (Cooked)", "category": "Meat", "serving_unit": "100g", "serving_size_g": 100, "calories": 217, "protein_g": 26.1, "carbs_g": 0.0, "fat_g": 11.8, "fiber_g": 0.0, "sodium_mg": 66, "iron_mg": 2.6, "calcium_mg": 18, "vitamin_d_iu": 4, "b12_mcg": 2.6, "magnesium_mg": 21, "potassium_mg": 338, "zinc_mg": 5.4},
    {"name": "Sirloin Steak (Trimmed, Cooked)", "category": "Meat", "serving_unit": "100g", "serving_size_g": 100, "calories": 205, "protein_g": 28.5, "carbs_g": 0.0, "fat_g": 9.4, "fiber_g": 0.0, "sodium_mg": 58, "iron_mg": 2.9, "calcium_mg": 22, "vitamin_d_iu": 3, "b12_mcg": 2.9, "magnesium_mg": 24, "potassium_mg": 360, "zinc_mg": 6.1},
    {"name": "Pork Tenderloin (Cooked)", "category": "Meat", "serving_unit": "100g", "serving_size_g": 100, "calories": 143, "protein_g": 26.2, "carbs_g": 0.0, "fat_g": 3.5, "fiber_g": 0.0, "sodium_mg": 55, "iron_mg": 1.2, "calcium_mg": 6, "vitamin_d_iu": 15, "b12_mcg": 0.6, "magnesium_mg": 28, "potassium_mg": 421, "zinc_mg": 2.3},
    {"name": "Atlantic Salmon (Fillet, Cooked)", "category": "Seafood", "serving_unit": "100g", "serving_size_g": 100, "calories": 206, "protein_g": 22.1, "carbs_g": 0.0, "fat_g": 12.3, "fiber_g": 0.0, "sodium_mg": 61, "iron_mg": 0.8, "calcium_mg": 12, "vitamin_d_iu": 526, "b12_mcg": 3.2, "magnesium_mg": 29, "potassium_mg": 384, "zinc_mg": 0.6},
    {"name": "Canned Tuna (in Water, Drained)", "category": "Seafood", "serving_unit": "100g", "serving_size_g": 100, "calories": 116, "protein_g": 25.5, "carbs_g": 0.0, "fat_g": 0.8, "fiber_g": 0.0, "sodium_mg": 247, "iron_mg": 1.5, "calcium_mg": 11, "vitamin_d_iu": 68, "b12_mcg": 2.2, "magnesium_mg": 27, "potassium_mg": 237, "zinc_mg": 0.8},
    {"name": "Shrimp / Prawns (Cooked)", "category": "Seafood", "serving_unit": "100g", "serving_size_g": 100, "calories": 99, "protein_g": 24.0, "carbs_g": 0.2, "fat_g": 0.3, "fiber_g": 0.0, "sodium_mg": 111, "iron_mg": 2.4, "calcium_mg": 70, "vitamin_d_iu": 2, "b12_mcg": 1.1, "magnesium_mg": 37, "potassium_mg": 259, "zinc_mg": 1.6},
    {"name": "Cod Fillet (Baked)", "category": "Seafood", "serving_unit": "100g", "serving_size_g": 100, "calories": 82, "protein_g": 17.8, "carbs_g": 0.0, "fat_g": 0.7, "fiber_g": 0.0, "sodium_mg": 54, "iron_mg": 0.4, "calcium_mg": 16, "vitamin_d_iu": 40, "b12_mcg": 0.9, "magnesium_mg": 32, "potassium_mg": 413, "zinc_mg": 0.5},
    {"name": "Firm Tofu", "category": "Plant Protein", "serving_unit": "100g", "serving_size_g": 100, "calories": 144, "protein_g": 15.6, "carbs_g": 2.8, "fat_g": 8.7, "fiber_g": 2.3, "sodium_mg": 14, "iron_mg": 2.8, "calcium_mg": 350, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 58, "potassium_mg": 237, "zinc_mg": 1.6},
    {"name": "Tempeh", "category": "Plant Protein", "serving_unit": "100g", "serving_size_g": 100, "calories": 192, "protein_g": 20.3, "carbs_g": 7.6, "fat_g": 10.8, "fiber_g": 4.5, "sodium_mg": 9, "iron_mg": 2.7, "calcium_mg": 111, "vitamin_d_iu": 0, "b12_mcg": 0.1, "magnesium_mg": 81, "potassium_mg": 412, "zinc_mg": 1.8},
    {"name": "Seitan (Wheat Gluten)", "category": "Plant Protein", "serving_unit": "100g", "serving_size_g": 100, "calories": 370, "protein_g": 75.0, "carbs_g": 14.0, "fat_g": 1.9, "fiber_g": 1.5, "sodium_mg": 29, "iron_mg": 5.2, "calcium_mg": 142, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 25, "potassium_mg": 100, "zinc_mg": 0.9},

    # --- EGGS & DAIRY ---
    {"name": "Whole Egg (Large)", "category": "Eggs & Dairy", "serving_unit": "1 large (50g)", "serving_size_g": 50, "calories": 72, "protein_g": 6.3, "carbs_g": 0.4, "fat_g": 4.8, "fiber_g": 0.0, "sodium_mg": 71, "iron_mg": 0.9, "calcium_mg": 28, "vitamin_d_iu": 41, "b12_mcg": 0.5, "magnesium_mg": 6, "potassium_mg": 69, "zinc_mg": 0.6},
    {"name": "Egg Whites", "category": "Eggs & Dairy", "serving_unit": "100g", "serving_size_g": 100, "calories": 52, "protein_g": 10.9, "carbs_g": 0.7, "fat_g": 0.2, "fiber_g": 0.0, "sodium_mg": 166, "iron_mg": 0.1, "calcium_mg": 7, "vitamin_d_iu": 0, "b12_mcg": 0.1, "magnesium_mg": 11, "potassium_mg": 163, "zinc_mg": 0.0},
    {"name": "Greek Yogurt (Nonfat Plain)", "category": "Eggs & Dairy", "serving_unit": "170g (1 container)", "serving_size_g": 170, "calories": 100, "protein_g": 17.5, "carbs_g": 6.1, "fat_g": 0.7, "fiber_g": 0.0, "sodium_mg": 61, "iron_mg": 0.1, "calcium_mg": 187, "vitamin_d_iu": 0, "b12_mcg": 1.0, "magnesium_mg": 19, "potassium_mg": 240, "zinc_mg": 1.0},
    {"name": "Cottage Cheese (Low Fat 2%)", "category": "Eggs & Dairy", "serving_unit": "100g", "serving_size_g": 100, "calories": 81, "protein_g": 11.0, "carbs_g": 4.8, "fat_g": 2.3, "fiber_g": 0.0, "sodium_mg": 308, "iron_mg": 0.1, "calcium_mg": 111, "vitamin_d_iu": 0, "b12_mcg": 0.6, "magnesium_mg": 9, "potassium_mg": 125, "zinc_mg": 0.5},
    {"name": "Whole Milk", "category": "Eggs & Dairy", "serving_unit": "1 cup (244g)", "serving_size_g": 244, "calories": 149, "protein_g": 7.7, "carbs_g": 11.7, "fat_g": 7.9, "fiber_g": 0.0, "sodium_mg": 105, "iron_mg": 0.1, "calcium_mg": 276, "vitamin_d_iu": 98, "b12_mcg": 1.1, "magnesium_mg": 24, "potassium_mg": 322, "zinc_mg": 0.9},
    {"name": "Skim Milk", "category": "Eggs & Dairy", "serving_unit": "1 cup (245g)", "serving_size_g": 245, "calories": 83, "protein_g": 8.3, "carbs_g": 12.2, "fat_g": 0.2, "fiber_g": 0.0, "sodium_mg": 103, "iron_mg": 0.1, "calcium_mg": 299, "vitamin_d_iu": 100, "b12_mcg": 1.2, "magnesium_mg": 27, "potassium_mg": 382, "zinc_mg": 1.0},
    {"name": "Unsweetened Almond Milk", "category": "Eggs & Dairy", "serving_unit": "1 cup (240g)", "serving_size_g": 240, "calories": 30, "protein_g": 1.0, "carbs_g": 1.0, "fat_g": 2.5, "fiber_g": 0.5, "sodium_mg": 170, "iron_mg": 0.7, "calcium_mg": 450, "vitamin_d_iu": 100, "b12_mcg": 0.0, "magnesium_mg": 15, "potassium_mg": 170, "zinc_mg": 0.2},
    {"name": "Cheddar Cheese", "category": "Eggs & Dairy", "serving_unit": "1 slice (28g)", "serving_size_g": 28, "calories": 115, "protein_g": 7.0, "carbs_g": 0.4, "fat_g": 9.4, "fiber_g": 0.0, "sodium_mg": 180, "iron_mg": 0.2, "calcium_mg": 204, "vitamin_d_iu": 6, "b12_mcg": 0.2, "magnesium_mg": 8, "potassium_mg": 28, "zinc_mg": 0.9},
    {"name": "Whey Protein Powder (1 Scoop)", "category": "Supplements", "serving_unit": "1 scoop (30g)", "serving_size_g": 30, "calories": 120, "protein_g": 24.0, "carbs_g": 2.0, "fat_g": 1.5, "fiber_g": 0.0, "sodium_mg": 130, "iron_mg": 0.5, "calcium_mg": 140, "vitamin_d_iu": 0, "b12_mcg": 0.8, "magnesium_mg": 20, "potassium_mg": 160, "zinc_mg": 0.4},
    {"name": "Plant Protein Powder (Pea/Rice, 1 Scoop)", "category": "Supplements", "serving_unit": "1 scoop (32g)", "serving_size_g": 32, "calories": 130, "protein_g": 22.0, "carbs_g": 3.0, "fat_g": 2.5, "fiber_g": 2.0, "sodium_mg": 190, "iron_mg": 5.0, "calcium_mg": 80, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 45, "potassium_mg": 110, "zinc_mg": 1.2},

    # --- GRAINS, RICE & BREADS ---
    {"name": "White Rice (Jasmine/Basmati, Cooked)", "category": "Grains", "serving_unit": "1 cup (158g)", "serving_size_g": 158, "calories": 205, "protein_g": 4.2, "carbs_g": 44.5, "fat_g": 0.4, "fiber_g": 0.6, "sodium_mg": 0, "iron_mg": 1.9, "calcium_mg": 16, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 19, "potassium_mg": 55, "zinc_mg": 0.8},
    {"name": "Brown Rice (Cooked)", "category": "Grains", "serving_unit": "1 cup (195g)", "serving_size_g": 195, "calories": 218, "protein_g": 4.5, "carbs_g": 45.8, "fat_g": 1.6, "fiber_g": 3.5, "sodium_mg": 2, "iron_mg": 0.8, "calcium_mg": 20, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 86, "potassium_mg": 154, "zinc_mg": 1.2},
    {"name": "Rolled Oats (Dry)", "category": "Grains", "serving_unit": "1/2 cup (40g)", "serving_size_g": 40, "calories": 150, "protein_g": 5.0, "carbs_g": 27.0, "fat_g": 3.0, "fiber_g": 4.0, "sodium_mg": 0, "iron_mg": 1.7, "calcium_mg": 20, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 55, "potassium_mg": 150, "zinc_mg": 1.5},
    {"name": "Quinoa (Cooked)", "category": "Grains", "serving_unit": "1 cup (185g)", "serving_size_g": 185, "calories": 222, "protein_g": 8.1, "carbs_g": 39.4, "fat_g": 3.6, "fiber_g": 5.2, "sodium_mg": 13, "iron_mg": 2.8, "calcium_mg": 31, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 118, "potassium_mg": 318, "zinc_mg": 2.0},
    {"name": "Whole Wheat Bread", "category": "Grains", "serving_unit": "1 slice (43g)", "serving_size_g": 43, "calories": 81, "protein_g": 4.0, "carbs_g": 13.8, "fat_g": 1.1, "fiber_g": 2.0, "sodium_mg": 146, "iron_mg": 0.9, "calcium_mg": 30, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 23, "potassium_mg": 75, "zinc_mg": 0.5},
    {"name": "Sourdough Bread", "category": "Grains", "serving_unit": "1 slice (50g)", "serving_size_g": 50, "calories": 115, "protein_g": 4.5, "carbs_g": 22.0, "fat_g": 0.8, "fiber_g": 1.1, "sodium_mg": 210, "iron_mg": 1.4, "calcium_mg": 18, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 15, "potassium_mg": 60, "zinc_mg": 0.4},
    {"name": "Sweet Potato (Baked w/ Skin)", "category": "Grains", "serving_unit": "1 medium (114g)", "serving_size_g": 114, "calories": 103, "protein_g": 2.3, "carbs_g": 23.6, "fat_g": 0.2, "fiber_g": 3.8, "sodium_mg": 41, "iron_mg": 0.8, "calcium_mg": 43, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 31, "potassium_mg": 542, "zinc_mg": 0.3},
    {"name": "Russet Potato (Baked)", "category": "Grains", "serving_unit": "1 medium (173g)", "serving_size_g": 173, "calories": 164, "protein_g": 4.3, "carbs_g": 37.0, "fat_g": 0.2, "fiber_g": 4.0, "sodium_mg": 14, "iron_mg": 1.9, "calcium_mg": 26, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 48, "potassium_mg": 926, "zinc_mg": 0.6},
    {"name": "Pasta (Whole Wheat, Cooked)", "category": "Grains", "serving_unit": "1 cup (140g)", "serving_size_g": 140, "calories": 174, "protein_g": 7.5, "carbs_g": 37.2, "fat_g": 0.8, "fiber_g": 4.6, "sodium_mg": 4, "iron_mg": 1.8, "calcium_mg": 15, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 42, "potassium_mg": 98, "zinc_mg": 1.1},
    {"name": "Black Beans (Boiled)", "category": "Legumes", "serving_unit": "1 cup (172g)", "serving_size_g": 172, "calories": 227, "protein_g": 15.2, "carbs_g": 40.8, "fat_g": 0.9, "fiber_g": 15.0, "sodium_mg": 2, "iron_mg": 3.6, "calcium_mg": 46, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 120, "potassium_mg": 611, "zinc_mg": 1.9},
    {"name": "Chickpeas / Garbanzo Beans (Boiled)", "category": "Legumes", "serving_unit": "1 cup (164g)", "serving_size_g": 164, "calories": 269, "protein_g": 14.5, "carbs_g": 45.0, "fat_g": 4.2, "fiber_g": 12.5, "sodium_mg": 11, "iron_mg": 4.7, "calcium_mg": 80, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 79, "potassium_mg": 477, "zinc_mg": 2.5},
    {"name": "Lentils (Boiled)", "category": "Legumes", "serving_unit": "1 cup (198g)", "serving_size_g": 198, "calories": 230, "protein_g": 17.9, "carbs_g": 39.9, "fat_g": 0.8, "fiber_g": 15.6, "sodium_mg": 4, "iron_mg": 6.6, "calcium_mg": 38, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 71, "potassium_mg": 731, "zinc_mg": 2.5},

    # --- VEGETABLES ---
    {"name": "Broccoli (Cooked)", "category": "Vegetables", "serving_unit": "1 cup (156g)", "serving_size_g": 156, "calories": 55, "protein_g": 3.7, "carbs_g": 11.2, "fat_g": 0.6, "fiber_g": 5.1, "sodium_mg": 64, "iron_mg": 1.0, "calcium_mg": 62, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 33, "potassium_mg": 457, "zinc_mg": 0.7},
    {"name": "Spinach (Raw)", "category": "Vegetables", "serving_unit": "2 cups (60g)", "serving_size_g": 60, "calories": 14, "protein_g": 1.7, "carbs_g": 2.2, "fat_g": 0.2, "fiber_g": 1.3, "sodium_mg": 48, "iron_mg": 1.6, "calcium_mg": 59, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 47, "potassium_mg": 335, "zinc_mg": 0.3},
    {"name": "Kale (Raw)", "category": "Vegetables", "serving_unit": "1 cup (67g)", "serving_size_g": 67, "calories": 33, "protein_g": 2.9, "carbs_g": 6.0, "fat_g": 0.6, "fiber_g": 2.6, "sodium_mg": 25, "iron_mg": 1.1, "calcium_mg": 100, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 23, "potassium_mg": 329, "zinc_mg": 0.4},
    {"name": "Asparagus (Cooked)", "category": "Vegetables", "serving_unit": "1 cup (180g)", "serving_size_g": 180, "calories": 40, "protein_g": 4.3, "carbs_g": 7.4, "fat_g": 0.4, "fiber_g": 3.6, "sodium_mg": 25, "iron_mg": 1.6, "calcium_mg": 41, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 25, "potassium_mg": 403, "zinc_mg": 1.1},
    {"name": "Bell Pepper (Red, Raw)", "category": "Vegetables", "serving_unit": "1 medium (119g)", "serving_size_g": 119, "calories": 37, "protein_g": 1.2, "carbs_g": 7.2, "fat_g": 0.4, "fiber_g": 2.5, "sodium_mg": 5, "iron_mg": 0.5, "calcium_mg": 8, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 14, "potassium_mg": 251, "zinc_mg": 0.3},
    {"name": "Carrot (Raw)", "category": "Vegetables", "serving_unit": "1 medium (61g)", "serving_size_g": 61, "calories": 25, "protein_g": 0.6, "carbs_g": 5.8, "fat_g": 0.1, "fiber_g": 1.7, "sodium_mg": 42, "iron_mg": 0.2, "calcium_mg": 20, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 7, "potassium_mg": 195, "zinc_mg": 0.1},
    {"name": "Zucchini (Cooked)", "category": "Vegetables", "serving_unit": "1 cup (180g)", "serving_size_g": 180, "calories": 27, "protein_g": 2.0, "carbs_g": 4.8, "fat_g": 0.6, "fiber_g": 1.8, "sodium_mg": 5, "iron_mg": 0.6, "calcium_mg": 31, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 31, "potassium_mg": 475, "zinc_mg": 0.6},
    {"name": "Cucumber (with Peel)", "category": "Vegetables", "serving_unit": "1 cup sliced (104g)", "serving_size_g": 104, "calories": 16, "protein_g": 0.7, "carbs_g": 3.8, "fat_g": 0.1, "fiber_g": 0.5, "sodium_mg": 2, "iron_mg": 0.3, "calcium_mg": 17, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 13, "potassium_mg": 153, "zinc_mg": 0.2},
    {"name": "Cauliflower (Raw)", "category": "Vegetables", "serving_unit": "1 cup chopped (107g)", "serving_size_g": 107, "calories": 27, "protein_g": 2.1, "carbs_g": 5.3, "fat_g": 0.3, "fiber_g": 2.1, "sodium_mg": 32, "iron_mg": 0.4, "calcium_mg": 24, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 16, "potassium_mg": 320, "zinc_mg": 0.3},

    # --- FRUITS ---
    {"name": "Banana", "category": "Fruits", "serving_unit": "1 medium (118g)", "serving_size_g": 118, "calories": 105, "protein_g": 1.3, "carbs_g": 27.0, "fat_g": 0.3, "fiber_g": 3.1, "sodium_mg": 1, "iron_mg": 0.3, "calcium_mg": 6, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 32, "potassium_mg": 422, "zinc_mg": 0.2},
    {"name": "Apple (Medium with Skin)", "category": "Fruits", "serving_unit": "1 medium (182g)", "serving_size_g": 182, "calories": 95, "protein_g": 0.5, "carbs_g": 25.0, "fat_g": 0.3, "fiber_g": 4.4, "sodium_mg": 2, "iron_mg": 0.2, "calcium_mg": 11, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 9, "potassium_mg": 195, "zinc_mg": 0.1},
    {"name": "Blueberries (Fresh)", "category": "Fruits", "serving_unit": "1 cup (148g)", "serving_size_g": 148, "calories": 84, "protein_g": 1.1, "carbs_g": 21.4, "fat_g": 0.5, "fiber_g": 3.6, "sodium_mg": 1, "iron_mg": 0.4, "calcium_mg": 9, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 9, "potassium_mg": 114, "zinc_mg": 0.2},
    {"name": "Strawberries", "category": "Fruits", "serving_unit": "1 cup halves (152g)", "serving_size_g": 152, "calories": 49, "protein_g": 1.0, "carbs_g": 11.7, "fat_g": 0.5, "fiber_g": 3.0, "sodium_mg": 2, "iron_mg": 0.6, "calcium_mg": 24, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 20, "potassium_mg": 233, "zinc_mg": 0.2},
    {"name": "Avocado", "category": "Healthy Fats", "serving_unit": "1/2 medium (100g)", "serving_size_g": 100, "calories": 160, "protein_g": 2.0, "carbs_g": 8.5, "fat_g": 14.7, "fiber_g": 6.7, "sodium_mg": 7, "iron_mg": 0.6, "calcium_mg": 12, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 29, "potassium_mg": 485, "zinc_mg": 0.6},
    {"name": "Orange (Navel)", "category": "Fruits", "serving_unit": "1 medium (140g)", "serving_size_g": 140, "calories": 69, "protein_g": 1.3, "carbs_g": 17.6, "fat_g": 0.2, "fiber_g": 3.1, "sodium_mg": 0, "iron_mg": 0.1, "calcium_mg": 60, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 15, "potassium_mg": 232, "zinc_mg": 0.1},
    {"name": "Watermelon (Diced)", "category": "Fruits", "serving_unit": "1 cup (152g)", "serving_size_g": 152, "calories": 46, "protein_g": 0.9, "carbs_g": 11.5, "fat_g": 0.2, "fiber_g": 0.6, "sodium_mg": 2, "iron_mg": 0.4, "calcium_mg": 11, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 15, "potassium_mg": 170, "zinc_mg": 0.2},

    # --- HEALTHY FATS, NUTS & SEEDS ---
    {"name": "Almonds (Raw)", "category": "Nuts & Seeds", "serving_unit": "1 oz (28g / 23 almonds)", "serving_size_g": 28, "calories": 164, "protein_g": 6.0, "carbs_g": 6.1, "fat_g": 14.2, "fiber_g": 3.5, "sodium_mg": 0, "iron_mg": 1.1, "calcium_mg": 76, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 77, "potassium_mg": 208, "zinc_mg": 0.9},
    {"name": "Walnuts (Halves)", "category": "Nuts & Seeds", "serving_unit": "1 oz (28g / 14 halves)", "serving_size_g": 28, "calories": 185, "protein_g": 4.3, "carbs_g": 3.9, "fat_g": 18.5, "fiber_g": 1.9, "sodium_mg": 1, "iron_mg": 0.8, "calcium_mg": 28, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 45, "potassium_mg": 125, "zinc_mg": 0.9},
    {"name": "Peanut Butter (Natural 100%)", "category": "Nuts & Seeds", "serving_unit": "2 tbsp (32g)", "serving_size_g": 32, "calories": 190, "protein_g": 8.0, "carbs_g": 7.0, "fat_g": 16.0, "fiber_g": 2.0, "sodium_mg": 5, "iron_mg": 0.6, "calcium_mg": 14, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 49, "potassium_mg": 189, "zinc_mg": 0.9},
    {"name": "Extra Virgin Olive Oil", "category": "Healthy Fats", "serving_unit": "1 tbsp (14g)", "serving_size_g": 14, "calories": 119, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 13.5, "fiber_g": 0.0, "sodium_mg": 0, "iron_mg": 0.1, "calcium_mg": 0, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 0, "potassium_mg": 0, "zinc_mg": 0.0},
    {"name": "Chia Seeds", "category": "Nuts & Seeds", "serving_unit": "2 tbsp (28g)", "serving_size_g": 28, "calories": 138, "protein_g": 4.7, "carbs_g": 11.9, "fat_g": 8.7, "fiber_g": 9.8, "sodium_mg": 5, "iron_mg": 2.2, "calcium_mg": 179, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 95, "potassium_mg": 115, "zinc_mg": 1.3}
]

def seed_foods():
    models.Base.metadata.create_all(bind=models.database.engine if hasattr(models, 'database') else SessionLocal().get_bind())
    db = SessionLocal()
    try:
        count = db.query(models.Food).count()
        if count >= len(FOOD_CATALOG):
            print(f"Foods already seeded ({count} foods present).")
            return

        for item in FOOD_CATALOG:
            slug_id = item["name"].lower().replace(" ", "-").replace("(", "").replace(")", "").replace("/", "-").replace("%", "").replace(",", "")[:40]
            existing = db.query(models.Food).filter(models.Food.name == item["name"]).first()
            if not existing:
                food = models.Food(
                    id=slug_id,
                    name=item["name"],
                    category=item["category"],
                    serving_unit=item["serving_unit"],
                    serving_size_g=item["serving_size_g"],
                    calories=item["calories"],
                    protein_g=item["protein_g"],
                    carbs_g=item["carbs_g"],
                    fat_g=item["fat_g"],
                    fiber_g=item["fiber_g"],
                    sodium_mg=item["sodium_mg"],
                    iron_mg=item["iron_mg"],
                    calcium_mg=item["calcium_mg"],
                    vitamin_d_iu=item["vitamin_d_iu"],
                    b12_mcg=item["b12_mcg"],
                    magnesium_mg=item["magnesium_mg"],
                    potassium_mg=item["potassium_mg"],
                    zinc_mg=item["zinc_mg"]
                )
                db.add(food)
        db.commit()
        print(f"Successfully seeded {len(FOOD_CATALOG)} native foods.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding foods: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_foods()
