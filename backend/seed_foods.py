from database import SessionLocal
import models

FOOD_CATALOG = [
    # --- INDIAN BREAKFAST & TIFFIN ---
    {"name": "Idli (2 pcs with Sambar & Chutney)", "category": "Indian Breakfast", "serving_unit": "2 pcs (120g)", "serving_size_g": 120, "calories": 140, "protein_g": 4.5, "carbs_g": 28.0, "fat_g": 1.2, "fiber_g": 2.5, "sodium_mg": 180, "iron_mg": 1.4, "calcium_mg": 32, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 28, "potassium_mg": 160, "zinc_mg": 0.8},
    {"name": "Plain Dosa (with Sambar)", "category": "Indian Breakfast", "serving_unit": "1 pc (100g)", "serving_size_g": 100, "calories": 168, "protein_g": 4.0, "carbs_g": 29.0, "fat_g": 3.7, "fiber_g": 2.0, "sodium_mg": 160, "iron_mg": 1.2, "calcium_mg": 25, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 24, "potassium_mg": 140, "zinc_mg": 0.7},
    {"name": "Masala Dosa (Potato Stuffed)", "category": "Indian Breakfast", "serving_unit": "1 pc (160g)", "serving_size_g": 160, "calories": 250, "protein_g": 6.0, "carbs_g": 38.0, "fat_g": 8.0, "fiber_g": 3.5, "sodium_mg": 290, "iron_mg": 2.1, "calcium_mg": 38, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 35, "potassium_mg": 280, "zinc_mg": 1.0},
    {"name": "Poha (Kanda Poha with Peanuts)", "category": "Indian Breakfast", "serving_unit": "1 bowl (150g)", "serving_size_g": 150, "calories": 180, "protein_g": 4.2, "carbs_g": 30.0, "fat_g": 5.0, "fiber_g": 2.5, "sodium_mg": 220, "iron_mg": 3.8, "calcium_mg": 22, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 30, "potassium_mg": 150, "zinc_mg": 0.9},
    {"name": "Rava Upma", "category": "Indian Breakfast", "serving_unit": "1 bowl (150g)", "serving_size_g": 150, "calories": 190, "protein_g": 5.0, "carbs_g": 32.0, "fat_g": 5.0, "fiber_g": 2.0, "sodium_mg": 240, "iron_mg": 1.6, "calcium_mg": 20, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 25, "potassium_mg": 120, "zinc_mg": 0.6},
    {"name": "Plain Paratha (Homestyle)", "category": "Indian Breakfast", "serving_unit": "1 pc (80g)", "serving_size_g": 80, "calories": 260, "protein_g": 6.0, "carbs_g": 36.0, "fat_g": 10.0, "fiber_g": 3.0, "sodium_mg": 190, "iron_mg": 2.0, "calcium_mg": 28, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 35, "potassium_mg": 130, "zinc_mg": 0.8},
    {"name": "Aloo Paratha (with Curd)", "category": "Indian Breakfast", "serving_unit": "1 pc (120g)", "serving_size_g": 120, "calories": 320, "protein_g": 7.0, "carbs_g": 45.0, "fat_g": 12.0, "fiber_g": 3.8, "sodium_mg": 310, "iron_mg": 2.5, "calcium_mg": 45, "vitamin_d_iu": 0, "b12_mcg": 0.1, "magnesium_mg": 40, "potassium_mg": 310, "zinc_mg": 1.1},
    {"name": "Paneer Paratha", "category": "Indian Breakfast", "serving_unit": "1 pc (130g)", "serving_size_g": 130, "calories": 340, "protein_g": 14.0, "carbs_g": 38.0, "fat_g": 14.0, "fiber_g": 3.2, "sodium_mg": 280, "iron_mg": 2.2, "calcium_mg": 180, "vitamin_d_iu": 8, "b12_mcg": 0.4, "magnesium_mg": 45, "potassium_mg": 200, "zinc_mg": 1.6},
    {"name": "Besan Chilla (2 pcs)", "category": "Indian Breakfast", "serving_unit": "2 pcs (120g)", "serving_size_g": 120, "calories": 210, "protein_g": 10.0, "carbs_g": 28.0, "fat_g": 6.0, "fiber_g": 5.0, "sodium_mg": 250, "iron_mg": 3.1, "calcium_mg": 45, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 52, "potassium_mg": 290, "zinc_mg": 1.4},
    {"name": "Vegetable Oats Upma", "category": "Indian Breakfast", "serving_unit": "1 bowl (150g)", "serving_size_g": 150, "calories": 175, "protein_g": 6.0, "carbs_g": 28.0, "fat_g": 4.0, "fiber_g": 4.5, "sodium_mg": 190, "iron_mg": 2.2, "calcium_mg": 30, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 58, "potassium_mg": 180, "zinc_mg": 1.2},
    {"name": "Ragi Dosa (Finger Millet)", "category": "Indian Breakfast", "serving_unit": "1 pc (90g)", "serving_size_g": 90, "calories": 145, "protein_g": 3.5, "carbs_g": 27.0, "fat_g": 2.5, "fiber_g": 3.8, "sodium_mg": 130, "iron_mg": 3.5, "calcium_mg": 310, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 42, "potassium_mg": 160, "zinc_mg": 1.0},
    {"name": "Medu Vada (2 pcs)", "category": "Indian Breakfast", "serving_unit": "2 pcs (100g)", "serving_size_g": 100, "calories": 220, "protein_g": 6.0, "carbs_g": 22.0, "fat_g": 12.0, "fiber_g": 3.0, "sodium_mg": 260, "iron_mg": 1.8, "calcium_mg": 35, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 30, "potassium_mg": 190, "zinc_mg": 0.9},

    # --- INDIAN LUNCH & CURRIES ---
    {"name": "Chapati / Phulka / Roti", "category": "Indian Grains", "serving_unit": "1 pc (35g)", "serving_size_g": 35, "calories": 104, "protein_g": 3.2, "carbs_g": 18.0, "fat_g": 2.5, "fiber_g": 2.8, "sodium_mg": 60, "iron_mg": 1.1, "calcium_mg": 15, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 26, "potassium_mg": 85, "zinc_mg": 0.6},
    {"name": "Yellow Dal Tadka (Moong / Toor)", "category": "Indian Curries", "serving_unit": "1 bowl (180g)", "serving_size_g": 180, "calories": 180, "protein_g": 9.0, "carbs_g": 24.0, "fat_g": 6.0, "fiber_g": 6.0, "sodium_mg": 340, "iron_mg": 2.8, "calcium_mg": 42, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 55, "potassium_mg": 340, "zinc_mg": 1.5},
    {"name": "Dal Makhani (Black Lentil)", "category": "Indian Curries", "serving_unit": "1 bowl (180g)", "serving_size_g": 180, "calories": 290, "protein_g": 10.0, "carbs_g": 26.0, "fat_g": 16.0, "fiber_g": 7.0, "sodium_mg": 380, "iron_mg": 3.5, "calcium_mg": 95, "vitamin_d_iu": 10, "b12_mcg": 0.2, "magnesium_mg": 62, "potassium_mg": 410, "zinc_mg": 1.8},
    {"name": "Rajma Masala (Kidney Beans)", "category": "Indian Curries", "serving_unit": "1 bowl (180g)", "serving_size_g": 180, "calories": 220, "protein_g": 10.5, "carbs_g": 30.0, "fat_g": 6.0, "fiber_g": 8.5, "sodium_mg": 360, "iron_mg": 3.9, "calcium_mg": 60, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 70, "potassium_mg": 480, "zinc_mg": 1.9},
    {"name": "Chole Masala (Chickpeas Curry)", "category": "Indian Curries", "serving_unit": "1 bowl (180g)", "serving_size_g": 180, "calories": 230, "protein_g": 9.5, "carbs_g": 32.0, "fat_g": 7.0, "fiber_g": 7.8, "sodium_mg": 370, "iron_mg": 3.6, "calcium_mg": 75, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 68, "potassium_mg": 390, "zinc_mg": 2.0},
    {"name": "South Indian Sambar", "category": "Indian Curries", "serving_unit": "1 bowl (200g)", "serving_size_g": 200, "calories": 140, "protein_g": 6.0, "carbs_g": 20.0, "fat_g": 3.5, "fiber_g": 5.0, "sodium_mg": 420, "iron_mg": 2.0, "calcium_mg": 52, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 48, "potassium_mg": 360, "zinc_mg": 1.1},
    {"name": "Paneer Bhurji", "category": "Indian Curries", "serving_unit": "1 bowl (150g)", "serving_size_g": 150, "calories": 260, "protein_g": 16.0, "carbs_g": 8.0, "fat_g": 18.0, "fiber_g": 2.0, "sodium_mg": 310, "iron_mg": 1.8, "calcium_mg": 240, "vitamin_d_iu": 12, "b12_mcg": 0.5, "magnesium_mg": 38, "potassium_mg": 210, "zinc_mg": 1.7},
    {"name": "Egg Curry (2 Eggs with Gravy)", "category": "Indian Curries", "serving_unit": "1 bowl (180g)", "serving_size_g": 180, "calories": 240, "protein_g": 14.0, "carbs_g": 8.0, "fat_g": 16.0, "fiber_g": 1.8, "sodium_mg": 350, "iron_mg": 2.2, "calcium_mg": 60, "vitamin_d_iu": 75, "b12_mcg": 1.0, "magnesium_mg": 22, "potassium_mg": 240, "zinc_mg": 1.3},
    {"name": "Moong Dal Khichdi", "category": "Indian Lunch", "serving_unit": "1 bowl (200g)", "serving_size_g": 200, "calories": 210, "protein_g": 8.0, "carbs_g": 36.0, "fat_g": 4.0, "fiber_g": 4.5, "sodium_mg": 280, "iron_mg": 2.4, "calcium_mg": 35, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 45, "potassium_mg": 210, "zinc_mg": 1.2},
    {"name": "South Indian Curd Rice (Thayir Sadam)", "category": "Indian Lunch", "serving_unit": "1 bowl (180g)", "serving_size_g": 180, "calories": 230, "protein_g": 6.0, "carbs_g": 35.0, "fat_g": 7.0, "fiber_g": 1.5, "sodium_mg": 210, "iron_mg": 0.8, "calcium_mg": 140, "vitamin_d_iu": 5, "b12_mcg": 0.4, "magnesium_mg": 28, "potassium_mg": 190, "zinc_mg": 0.8},

    # --- INDIAN DINNER & SPECIALS ---
    {"name": "Paneer Butter Masala", "category": "Indian Curries", "serving_unit": "1 bowl (180g)", "serving_size_g": 180, "calories": 320, "protein_g": 12.0, "carbs_g": 12.0, "fat_g": 24.0, "fiber_g": 2.5, "sodium_mg": 390, "iron_mg": 1.9, "calcium_mg": 220, "vitamin_d_iu": 15, "b12_mcg": 0.5, "magnesium_mg": 34, "potassium_mg": 240, "zinc_mg": 1.6},
    {"name": "Homestyle Chicken Curry", "category": "Indian Non-Veg", "serving_unit": "1 bowl (200g)", "serving_size_g": 200, "calories": 280, "protein_g": 25.0, "carbs_g": 8.0, "fat_g": 17.0, "fiber_g": 2.0, "sodium_mg": 380, "iron_mg": 2.1, "calcium_mg": 35, "vitamin_d_iu": 10, "b12_mcg": 0.8, "magnesium_mg": 35, "potassium_mg": 380, "zinc_mg": 2.2},
    {"name": "Butter Chicken (Murgh Makhani)", "category": "Indian Non-Veg", "serving_unit": "1 bowl (200g)", "serving_size_g": 200, "calories": 350, "protein_g": 22.0, "carbs_g": 10.0, "fat_g": 24.0, "fiber_g": 2.0, "sodium_mg": 410, "iron_mg": 1.8, "calcium_mg": 50, "vitamin_d_iu": 12, "b12_mcg": 0.7, "magnesium_mg": 30, "potassium_mg": 350, "zinc_mg": 2.0},
    {"name": "Vegetable Biryani", "category": "Indian Rice", "serving_unit": "1 plate (250g)", "serving_size_g": 250, "calories": 400, "protein_g": 8.0, "carbs_g": 65.0, "fat_g": 12.0, "fiber_g": 6.0, "sodium_mg": 440, "iron_mg": 2.6, "calcium_mg": 60, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 45, "potassium_mg": 290, "zinc_mg": 1.4},
    {"name": "Chicken Biryani (Dum Style)", "category": "Indian Non-Veg", "serving_unit": "1 plate (300g)", "serving_size_g": 300, "calories": 480, "protein_g": 24.0, "carbs_g": 60.0, "fat_g": 15.0, "fiber_g": 3.5, "sodium_mg": 520, "iron_mg": 2.8, "calcium_mg": 45, "vitamin_d_iu": 8, "b12_mcg": 0.6, "magnesium_mg": 42, "potassium_mg": 410, "zinc_mg": 2.4},
    {"name": "Palak Paneer (Spinach Cottage Cheese)", "category": "Indian Curries", "serving_unit": "1 bowl (180g)", "serving_size_g": 180, "calories": 260, "protein_g": 11.0, "carbs_g": 10.0, "fat_g": 19.0, "fiber_g": 4.5, "sodium_mg": 340, "iron_mg": 4.2, "calcium_mg": 260, "vitamin_d_iu": 10, "b12_mcg": 0.4, "magnesium_mg": 75, "potassium_mg": 450, "zinc_mg": 1.8},
    {"name": "Fish Curry (South Indian / Bengali)", "category": "Indian Non-Veg", "serving_unit": "1 bowl (200g)", "serving_size_g": 200, "calories": 220, "protein_g": 22.0, "carbs_g": 6.0, "fat_g": 12.0, "fiber_g": 1.5, "sodium_mg": 360, "iron_mg": 1.5, "calcium_mg": 45, "vitamin_d_iu": 210, "b12_mcg": 2.4, "magnesium_mg": 36, "potassium_mg": 420, "zinc_mg": 1.2},
    {"name": "Tandoori Chicken (2 pcs)", "category": "Indian Non-Veg", "serving_unit": "2 pcs (180g)", "serving_size_g": 180, "calories": 260, "protein_g": 32.0, "carbs_g": 4.0, "fat_g": 12.0, "fiber_g": 1.0, "sodium_mg": 450, "iron_mg": 2.0, "calcium_mg": 35, "vitamin_d_iu": 10, "b12_mcg": 0.8, "magnesium_mg": 38, "potassium_mg": 390, "zinc_mg": 2.5},
    {"name": "Grilled Paneer Tikka (4 pcs)", "category": "Indian Vegetarian", "serving_unit": "4 pcs (140g)", "serving_size_g": 140, "calories": 240, "protein_g": 16.0, "carbs_g": 8.0, "fat_g": 16.0, "fiber_g": 2.0, "sodium_mg": 310, "iron_mg": 1.6, "calcium_mg": 220, "vitamin_d_iu": 10, "b12_mcg": 0.5, "magnesium_mg": 32, "potassium_mg": 190, "zinc_mg": 1.6},
    {"name": "Soya Chunks Masala Curry", "category": "Indian Vegetarian", "serving_unit": "1 bowl (180g)", "serving_size_g": 180, "calories": 210, "protein_g": 22.0, "carbs_g": 18.0, "fat_g": 5.0, "fiber_g": 6.0, "sodium_mg": 340, "iron_mg": 5.8, "calcium_mg": 120, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 85, "potassium_mg": 510, "zinc_mg": 2.4},

    # --- INDIAN SNACKS & CHAAT ---
    {"name": "Indian Curd / Dahi (Plain)", "category": "Indian Dairy", "serving_unit": "1 bowl (150g)", "serving_size_g": 150, "calories": 98, "protein_g": 5.0, "carbs_g": 8.0, "fat_g": 5.0, "fiber_g": 0.0, "sodium_mg": 70, "iron_mg": 0.2, "calcium_mg": 180, "vitamin_d_iu": 10, "b12_mcg": 0.6, "magnesium_mg": 18, "potassium_mg": 220, "zinc_mg": 0.8},
    {"name": "Samosa (Potato & Peas)", "category": "Indian Snacks", "serving_unit": "1 pc (80g)", "serving_size_g": 80, "calories": 260, "protein_g": 4.0, "carbs_g": 24.0, "fat_g": 17.0, "fiber_g": 2.5, "sodium_mg": 310, "iron_mg": 1.5, "calcium_mg": 20, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 22, "potassium_mg": 180, "zinc_mg": 0.7},
    {"name": "Sprouts Salad (Moong & Veggies)", "category": "Indian Snacks", "serving_unit": "1 bowl (120g)", "serving_size_g": 120, "calories": 120, "protein_g": 8.0, "carbs_g": 18.0, "fat_g": 1.0, "fiber_g": 6.0, "sodium_mg": 90, "iron_mg": 2.9, "calcium_mg": 40, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 48, "potassium_mg": 320, "zinc_mg": 1.3},
    {"name": "Roasted Chana (Bengal Gram)", "category": "Indian Snacks", "serving_unit": "1 handful (40g)", "serving_size_g": 40, "calories": 120, "protein_g": 7.0, "carbs_g": 20.0, "fat_g": 2.0, "fiber_g": 5.0, "sodium_mg": 40, "iron_mg": 2.4, "calcium_mg": 35, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 40, "potassium_mg": 240, "zinc_mg": 1.2},
    {"name": "Khaman Dhokla (2 pcs)", "category": "Indian Snacks", "serving_unit": "2 pcs (100g)", "serving_size_g": 100, "calories": 160, "protein_g": 6.0, "carbs_g": 26.0, "fat_g": 3.5, "fiber_g": 3.0, "sodium_mg": 290, "iron_mg": 1.8, "calcium_mg": 30, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 32, "potassium_mg": 180, "zinc_mg": 0.8},
    {"name": "Boiled Peanut Chaat", "category": "Indian Snacks", "serving_unit": "1 bowl (100g)", "serving_size_g": 100, "calories": 190, "protein_g": 9.0, "carbs_g": 12.0, "fat_g": 12.0, "fiber_g": 4.5, "sodium_mg": 140, "iron_mg": 1.8, "calcium_mg": 45, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 65, "potassium_mg": 260, "zinc_mg": 1.4},
    {"name": "Roasted Foxnuts (Makhana / Phool Makhana)", "category": "Indian Snacks", "serving_unit": "1 bowl (35g)", "serving_size_g": 35, "calories": 110, "protein_g": 3.0, "carbs_g": 22.0, "fat_g": 1.5, "fiber_g": 2.8, "sodium_mg": 30, "iron_mg": 1.2, "calcium_mg": 55, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 38, "potassium_mg": 160, "zinc_mg": 0.7},

    # --- INDIAN BEVERAGES ---
    {"name": "Masala Chaas / Spiced Buttermilk", "category": "Indian Beverages", "serving_unit": "1 glass (200ml)", "serving_size_g": 200, "calories": 40, "protein_g": 2.2, "carbs_g": 4.0, "fat_g": 1.0, "fiber_g": 0.2, "sodium_mg": 190, "iron_mg": 0.2, "calcium_mg": 95, "vitamin_d_iu": 5, "b12_mcg": 0.3, "magnesium_mg": 15, "potassium_mg": 180, "zinc_mg": 0.5},
    {"name": "Indian Masala Chai (Tea with Milk)", "category": "Indian Beverages", "serving_unit": "1 cup (150ml)", "serving_size_g": 150, "calories": 60, "protein_g": 1.5, "carbs_g": 9.0, "fat_g": 2.0, "fiber_g": 0.0, "sodium_mg": 35, "iron_mg": 0.2, "calcium_mg": 65, "vitamin_d_iu": 15, "b12_mcg": 0.2, "magnesium_mg": 12, "potassium_mg": 95, "zinc_mg": 0.3},
    {"name": "Sweet Lassi (Punjabi Dahi Lassi)", "category": "Indian Beverages", "serving_unit": "1 glass (250ml)", "serving_size_g": 250, "calories": 180, "protein_g": 5.0, "carbs_g": 30.0, "fat_g": 5.0, "fiber_g": 0.0, "sodium_mg": 85, "iron_mg": 0.3, "calcium_mg": 160, "vitamin_d_iu": 10, "b12_mcg": 0.5, "magnesium_mg": 22, "potassium_mg": 240, "zinc_mg": 0.8},
    {"name": "Tender Coconut Water (Elaneer / Nariyal Pani)", "category": "Indian Beverages", "serving_unit": "1 glass (240ml)", "serving_size_g": 240, "calories": 45, "protein_g": 1.0, "carbs_g": 10.0, "fat_g": 0.2, "fiber_g": 1.0, "sodium_mg": 105, "iron_mg": 0.4, "calcium_mg": 40, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 60, "potassium_mg": 600, "zinc_mg": 0.2},
    {"name": "Sattu Protein Sharbat (Roasted Gram Drink)", "category": "Indian Beverages", "serving_unit": "1 glass (250ml)", "serving_size_g": 250, "calories": 160, "protein_g": 9.0, "carbs_g": 24.0, "fat_g": 3.0, "fiber_g": 5.5, "sodium_mg": 180, "iron_mg": 3.2, "calcium_mg": 55, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 52, "potassium_mg": 310, "zinc_mg": 1.4},

    # --- WHOLE FOOD PROTEINS & ATHLETIC NUTRITION ---
    {"name": "Chicken Breast (Boneless, Cooked)", "category": "Poultry", "serving_unit": "100g", "serving_size_g": 100, "calories": 165, "protein_g": 31.0, "carbs_g": 0.0, "fat_g": 3.6, "fiber_g": 0.0, "sodium_mg": 74, "iron_mg": 1.0, "calcium_mg": 15, "vitamin_d_iu": 5, "b12_mcg": 0.3, "magnesium_mg": 29, "potassium_mg": 256, "zinc_mg": 1.0},
    {"name": "Chicken Thigh (Skinless, Cooked)", "category": "Poultry", "serving_unit": "100g", "serving_size_g": 100, "calories": 209, "protein_g": 26.0, "carbs_g": 0.0, "fat_g": 10.9, "fiber_g": 0.0, "sodium_mg": 85, "iron_mg": 1.3, "calcium_mg": 11, "vitamin_d_iu": 6, "b12_mcg": 0.4, "magnesium_mg": 23, "potassium_mg": 223, "zinc_mg": 2.1},
    {"name": "Atlantic Salmon (Fillet, Cooked)", "category": "Seafood", "serving_unit": "100g", "serving_size_g": 100, "calories": 206, "protein_g": 22.1, "carbs_g": 0.0, "fat_g": 12.3, "fiber_g": 0.0, "sodium_mg": 61, "iron_mg": 0.8, "calcium_mg": 12, "vitamin_d_iu": 526, "b12_mcg": 3.2, "magnesium_mg": 29, "potassium_mg": 384, "zinc_mg": 0.6},
    {"name": "Whole Boiled Eggs (2 Large)", "category": "Eggs & Dairy", "serving_unit": "2 large (100g)", "serving_size_g": 100, "calories": 144, "protein_g": 12.6, "carbs_g": 0.8, "fat_g": 9.6, "fiber_g": 0.0, "sodium_mg": 142, "iron_mg": 1.8, "calcium_mg": 56, "vitamin_d_iu": 82, "b12_mcg": 1.0, "magnesium_mg": 12, "potassium_mg": 138, "zinc_mg": 1.2},
    {"name": "Egg Whites", "category": "Eggs & Dairy", "serving_unit": "100g", "serving_size_g": 100, "calories": 52, "protein_g": 10.9, "carbs_g": 0.7, "fat_g": 0.2, "fiber_g": 0.0, "sodium_mg": 166, "iron_mg": 0.1, "calcium_mg": 7, "vitamin_d_iu": 0, "b12_mcg": 0.1, "magnesium_mg": 11, "potassium_mg": 163, "zinc_mg": 0.0},
    {"name": "Greek Yogurt (Nonfat Plain)", "category": "Eggs & Dairy", "serving_unit": "170g", "serving_size_g": 170, "calories": 100, "protein_g": 17.5, "carbs_g": 6.1, "fat_g": 0.7, "fiber_g": 0.0, "sodium_mg": 61, "iron_mg": 0.1, "calcium_mg": 187, "vitamin_d_iu": 0, "b12_mcg": 1.0, "magnesium_mg": 19, "potassium_mg": 240, "zinc_mg": 1.0},
    {"name": "Paneer / Indian Cottage Cheese (Raw)", "category": "Eggs & Dairy", "serving_unit": "100g", "serving_size_g": 100, "calories": 265, "protein_g": 18.3, "carbs_g": 3.4, "fat_g": 20.8, "fiber_g": 0.0, "sodium_mg": 22, "iron_mg": 0.4, "calcium_mg": 480, "vitamin_d_iu": 15, "b12_mcg": 0.6, "magnesium_mg": 28, "potassium_mg": 135, "zinc_mg": 2.0},
    {"name": "Whey Protein Powder (1 Scoop)", "category": "Supplements", "serving_unit": "1 scoop (30g)", "serving_size_g": 30, "calories": 120, "protein_g": 24.0, "carbs_g": 2.0, "fat_g": 1.5, "fiber_g": 0.0, "sodium_mg": 130, "iron_mg": 0.5, "calcium_mg": 140, "vitamin_d_iu": 0, "b12_mcg": 0.8, "magnesium_mg": 20, "potassium_mg": 160, "zinc_mg": 0.4},
    {"name": "Rolled Oats (Dry)", "category": "Grains", "serving_unit": "1/2 cup (40g)", "serving_size_g": 40, "calories": 150, "protein_g": 5.0, "carbs_g": 27.0, "fat_g": 3.0, "fiber_g": 4.0, "sodium_mg": 0, "iron_mg": 1.7, "calcium_mg": 20, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 55, "potassium_mg": 150, "zinc_mg": 1.5},
    {"name": "White Rice (Basmati / Ponni, Cooked)", "category": "Grains", "serving_unit": "1 cup (158g)", "serving_size_g": 158, "calories": 205, "protein_g": 4.2, "carbs_g": 44.5, "fat_g": 0.4, "fiber_g": 0.6, "sodium_mg": 0, "iron_mg": 1.9, "calcium_mg": 16, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 19, "potassium_mg": 55, "zinc_mg": 0.8},
    {"name": "Sweet Potato (Boiled)", "category": "Grains", "serving_unit": "1 medium (114g)", "serving_size_g": 114, "calories": 103, "protein_g": 2.3, "carbs_g": 23.6, "fat_g": 0.2, "fiber_g": 3.8, "sodium_mg": 41, "iron_mg": 0.8, "calcium_mg": 43, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 31, "potassium_mg": 542, "zinc_mg": 0.3},
    {"name": "Almonds (Badam, Raw)", "category": "Nuts & Seeds", "serving_unit": "1 handful (28g)", "serving_size_g": 28, "calories": 164, "protein_g": 6.0, "carbs_g": 6.1, "fat_g": 14.2, "fiber_g": 3.5, "sodium_mg": 0, "iron_mg": 1.1, "calcium_mg": 76, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 77, "potassium_mg": 208, "zinc_mg": 0.9},
    {"name": "Walnuts (Akhrot)", "category": "Nuts & Seeds", "serving_unit": "1 handful (28g)", "serving_size_g": 28, "calories": 185, "protein_g": 4.3, "carbs_g": 3.9, "fat_g": 18.5, "fiber_g": 1.9, "sodium_mg": 1, "iron_mg": 0.8, "calcium_mg": 28, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 45, "potassium_mg": 125, "zinc_mg": 0.9},
    {"name": "Banana (Robusta / Yelakki)", "category": "Fruits", "serving_unit": "1 medium (118g)", "serving_size_g": 118, "calories": 105, "protein_g": 1.3, "carbs_g": 27.0, "fat_g": 0.3, "fiber_g": 3.1, "sodium_mg": 1, "iron_mg": 0.3, "calcium_mg": 6, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 32, "potassium_mg": 422, "zinc_mg": 0.2},
    {"name": "Apple (Kashmiri / Shimla)", "category": "Fruits", "serving_unit": "1 medium (182g)", "serving_size_g": 182, "calories": 95, "protein_g": 0.5, "carbs_g": 25.0, "fat_g": 0.3, "fiber_g": 4.4, "sodium_mg": 2, "iron_mg": 0.2, "calcium_mg": 11, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 9, "potassium_mg": 195, "zinc_mg": 0.1},
    {"name": "Fresh Papaya Slices", "category": "Fruits", "serving_unit": "1 bowl (145g)", "serving_size_g": 145, "calories": 62, "protein_g": 0.7, "carbs_g": 16.0, "fat_g": 0.4, "fiber_g": 2.5, "sodium_mg": 12, "iron_mg": 0.4, "calcium_mg": 29, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 30, "potassium_mg": 264, "zinc_mg": 0.1},
    {"name": "Pomegranate (Anar Arils)", "category": "Fruits", "serving_unit": "1 bowl (100g)", "serving_size_g": 100, "calories": 83, "protein_g": 1.7, "carbs_g": 18.7, "fat_g": 1.2, "fiber_g": 4.0, "sodium_mg": 3, "iron_mg": 0.3, "calcium_mg": 10, "vitamin_d_iu": 0, "b12_mcg": 0.0, "magnesium_mg": 12, "potassium_mg": 236, "zinc_mg": 0.35}
]

def seed_foods():
    models.Base.metadata.create_all(bind=models.database.engine if hasattr(models, 'database') else SessionLocal().get_bind())
    db = SessionLocal()
    try:
        updated_count = 0
        inserted_count = 0
        for item in FOOD_CATALOG:
            serving_g = item.get("serving_size_g", 100) or 100
            cal = item["calories"]
            cal_100g = round((cal / serving_g) * 100, 1)
            prot_100g = round((item["protein_g"] / serving_g) * 100, 1)
            carbs_100g = round((item["carbs_g"] / serving_g) * 100, 1)
            fat_100g = round((item["fat_g"] / serving_g) * 100, 1)
            fiber_100g = round((item.get("fiber_g", 0.0) / serving_g) * 100, 1)

            slug_id = item["name"].lower().replace(" ", "-").replace("(", "").replace(")", "").replace("/", "-").replace("%", "").replace(",", "")[:40]
            existing = db.query(models.Food).filter(models.Food.name == item["name"]).first()
            if existing:
                existing.category = item["category"]
                existing.serving_unit = item["serving_unit"]
                existing.serving_size_g = serving_g
                existing.calories = cal
                existing.calories_per_100g = cal_100g
                existing.protein_g = item["protein_g"]
                existing.protein_g_100g = prot_100g
                existing.carbs_g = item["carbs_g"]
                existing.carbs_g_100g = carbs_100g
                existing.fat_g = item["fat_g"]
                existing.fat_g_100g = fat_100g
                existing.fiber_g = item.get("fiber_g", 0.0)
                existing.fiber_g_100g = fiber_100g
                existing.sodium_mg = item.get("sodium_mg", 0.0)
                existing.iron_mg = item.get("iron_mg", 0.0)
                existing.calcium_mg = item.get("calcium_mg", 0.0)
                existing.vitamin_d_iu = item.get("vitamin_d_iu", 0.0)
                existing.b12_mcg = item.get("b12_mcg", 0.0)
                existing.magnesium_mg = item.get("magnesium_mg", 0.0)
                existing.potassium_mg = item.get("potassium_mg", 0.0)
                existing.zinc_mg = item.get("zinc_mg", 0.0)
                updated_count += 1
            else:
                food = models.Food(
                    id=slug_id,
                    name=item["name"],
                    category=item["category"],
                    serving_unit=item["serving_unit"],
                    serving_size_g=serving_g,
                    calories=cal,
                    calories_per_100g=cal_100g,
                    protein_g=item["protein_g"],
                    protein_g_100g=prot_100g,
                    carbs_g=item["carbs_g"],
                    carbs_g_100g=carbs_100g,
                    fat_g=item["fat_g"],
                    fat_g_100g=fat_100g,
                    fiber_g=item.get("fiber_g", 0.0),
                    fiber_g_100g=fiber_100g,
                    sodium_mg=item.get("sodium_mg", 0.0),
                    iron_mg=item.get("iron_mg", 0.0),
                    calcium_mg=item.get("calcium_mg", 0.0),
                    vitamin_d_iu=item.get("vitamin_d_iu", 0.0),
                    b12_mcg=item.get("b12_mcg", 0.0),
                    magnesium_mg=item.get("magnesium_mg", 0.0),
                    potassium_mg=item.get("potassium_mg", 0.0),
                    zinc_mg=item.get("zinc_mg", 0.0)
                )
                db.add(food)
                inserted_count += 1
        db.commit()
        total = db.query(models.Food).count()
        print(f"Foods seed completed: {inserted_count} inserted, {updated_count} updated. Total foods in DB: {total}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding foods: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_foods()
