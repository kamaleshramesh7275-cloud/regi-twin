export interface IndianFood {
  id: string;
  name: string;
  category: "breakfast" | "lunch" | "dinner" | "snack" | "beverage";
  servingSize: string;
  servingGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  emoji?: string;
  tags?: string[];
}

export const indianFoods: IndianFood[] = [
  // --- BREAKFAST ---
  { id: "idli",                 name: "Idli (2 pcs)",               category: "breakfast", servingSize: "2 pcs (120g)", servingGrams: 120, calories: 140, proteinG: 4.5, carbsG: 28,  fatG: 1.2, emoji: "🥞", tags: ["South Indian", "Steamed", "Light"] },
  { id: "dosa-plain",           name: "Plain Dosa",                 category: "breakfast", servingSize: "1 pc (100g)",  servingGrams: 100, calories: 168, proteinG: 4.0, carbsG: 29,  fatG: 3.7, emoji: "🥞", tags: ["South Indian", "Crispy", "Tiffin"] },
  { id: "masala-dosa",          name: "Masala Dosa",                category: "breakfast", servingSize: "1 pc (160g)",  servingGrams: 160, calories: 250, proteinG: 6.0, carbsG: 38,  fatG: 8.0, emoji: "🥞", tags: ["South Indian", "Potato", "Staple"] },
  { id: "poha",                 name: "Kanda Poha",                 category: "breakfast", servingSize: "1 bowl (150g)",servingGrams: 150, calories: 180, proteinG: 4.2, carbsG: 30,  fatG: 5.0, emoji: "🥣", tags: ["Maharashtrian", "Iron Rich", "Peanuts"] },
  { id: "upma",                 name: "Rava Upma",                  category: "breakfast", servingSize: "1 bowl (150g)",servingGrams: 150, calories: 190, proteinG: 5.0, carbsG: 32,  fatG: 5.0, emoji: "🍲", tags: ["South Indian", "Semolina"] },
  { id: "paratha-plain",        name: "Plain Paratha",              category: "breakfast", servingSize: "1 pc (80g)",   servingGrams: 80,  calories: 260, proteinG: 6.0, carbsG: 36,  fatG: 10.0, emoji: "🫓", tags: ["North Indian", "Whole Wheat"] },
  { id: "aloo-paratha",         name: "Aloo Paratha",               category: "breakfast", servingSize: "1 pc (120g)",  servingGrams: 120, calories: 320, proteinG: 7.0, carbsG: 45,  fatG: 12.0, emoji: "🫓", tags: ["North Indian", "Stuffed"] },
  { id: "paneer-paratha",       name: "Paneer Paratha",             category: "breakfast", servingSize: "1 pc (130g)",  servingGrams: 130, calories: 340, proteinG: 14.0, carbsG: 38, fatG: 14.0, emoji: "🫓", tags: ["High Protein", "Paneer"] },
  { id: "besan-chilla",         name: "Besan Chilla (2 pcs)",       category: "breakfast", servingSize: "2 pcs (120g)", servingGrams: 120, calories: 210, proteinG: 10.0, carbsG: 28, fatG: 6.0, emoji: "🥞", tags: ["High Protein", "Gram Flour"] },
  { id: "oats-upma",            name: "Vegetable Oats Upma",        category: "breakfast", servingSize: "1 bowl (150g)",servingGrams: 150, calories: 175, proteinG: 6.0, carbsG: 28,  fatG: 4.0, emoji: "🥣", tags: ["Fiber Rich", "Heart Healthy"] },
  { id: "ragi-dosa",            name: "Ragi Dosa (Finger Millet)",  category: "breakfast", servingSize: "1 pc (90g)",   servingGrams: 90,  calories: 145, proteinG: 3.5, carbsG: 27,  fatG: 2.5, emoji: "🥞", tags: ["Calcium Rich", "Millet"] },
  { id: "medu-vada",            name: "Medu Vada (2 pcs)",          category: "breakfast", servingSize: "2 pcs (100g)", servingGrams: 100, calories: 220, proteinG: 6.0, carbsG: 22,  fatG: 12.0, emoji: "🍩", tags: ["Crispy", "Lentil"] },

  // --- LUNCH ---
  { id: "chapati",              name: "Chapati / Phulka / Roti",    category: "lunch",     servingSize: "1 pc (35g)",   servingGrams: 35,  calories: 104, proteinG: 3.2, carbsG: 18,  fatG: 2.5, emoji: "🫓", tags: ["Daily Staple", "Whole Wheat"] },
  { id: "plain-rice",           name: "Steamed White Rice",         category: "lunch",     servingSize: "1 cup (158g)", servingGrams: 158, calories: 205, proteinG: 4.2, carbsG: 45,  fatG: 0.4, emoji: "🍚", tags: ["Carbs", "Basmati / Ponni"] },
  { id: "brown-rice",           name: "Brown Rice",                 category: "lunch",     servingSize: "1 cup (195g)", servingGrams: 195, calories: 218, proteinG: 4.5, carbsG: 46,  fatG: 1.8, emoji: "🍚", tags: ["Complex Carbs", "Fiber"] },
  { id: "dal-tadka",            name: "Yellow Dal Tadka",           category: "lunch",     servingSize: "1 bowl (180g)",servingGrams: 180, calories: 180, proteinG: 9.0, carbsG: 24,  fatG: 6.0, emoji: "🍲", tags: ["Lentils", "Moong / Toor"] },
  { id: "dal-makhani",          name: "Dal Makhani",                category: "lunch",     servingSize: "1 bowl (180g)",servingGrams: 180, calories: 290, proteinG: 10.0, carbsG: 26, fatG: 16.0, emoji: "🍲", tags: ["Creamy", "Black Urad"] },
  { id: "rajma",                name: "Rajma Masala (Kidney Beans)",category: "lunch",     servingSize: "1 bowl (180g)",servingGrams: 180, calories: 220, proteinG: 10.5, carbsG: 30, fatG: 6.0, emoji: "🍲", tags: ["High Protein", "Fiber"] },
  { id: "chole",                name: "Chole Masala (Chickpeas)",   category: "lunch",     servingSize: "1 bowl (180g)",servingGrams: 180, calories: 230, proteinG: 9.5, carbsG: 32,  fatG: 7.0, emoji: "🍲", tags: ["North Indian", "Protein"] },
  { id: "sambar",               name: "South Indian Sambar",        category: "lunch",     servingSize: "1 bowl (200g)",servingGrams: 200, calories: 140, proteinG: 6.0, carbsG: 20,  fatG: 3.5, emoji: "🍲", tags: ["Veggies", "Toor Dal"] },
  { id: "paneer-bhurji",        name: "Paneer Bhurji",              category: "lunch",     servingSize: "1 bowl (150g)",servingGrams: 150, calories: 260, proteinG: 16.0, carbsG: 8,   fatG: 18.0, emoji: "🧀", tags: ["High Protein", "Keto Friendly"] },
  { id: "egg-curry",            name: "Egg Curry (2 eggs)",         category: "lunch",     servingSize: "1 bowl (180g)",servingGrams: 180, calories: 240, proteinG: 14.0, carbsG: 8,   fatG: 16.0, emoji: "🥚", tags: ["Complete Protein", "Gravy"] },
  { id: "khichdi-moong",        name: "Moong Dal Khichdi",          category: "lunch",     servingSize: "1 bowl (200g)",servingGrams: 200, calories: 210, proteinG: 8.0, carbsG: 36,  fatG: 4.0, emoji: "🥣", tags: ["Gut Healing", "Ayurvedic"] },
  { id: "curd-rice",            name: "South Indian Curd Rice",     category: "lunch",     servingSize: "1 bowl (180g)",servingGrams: 180, calories: 230, proteinG: 6.0, carbsG: 35,  fatG: 7.0, emoji: "🍚", tags: ["Probiotic", "Cooling"] },

  // --- DINNER ---
  { id: "paneer-butter-masala", name: "Paneer Butter Masala",       category: "dinner",    servingSize: "1 bowl (180g)",servingGrams: 180, calories: 320, proteinG: 12.0, carbsG: 12, fatG: 24.0, emoji: "🍲", tags: ["North Indian", "Rich"] },
  { id: "chicken-curry",        name: "Homestyle Chicken Curry",    category: "dinner",    servingSize: "1 bowl (200g)",servingGrams: 200, calories: 280, proteinG: 25.0, carbsG: 8,  fatG: 17.0, emoji: "🍗", tags: ["High Protein", "Lean Meat"] },
  { id: "butter-chicken",       name: "Butter Chicken",             category: "dinner",    servingSize: "1 bowl (200g)",servingGrams: 200, calories: 350, proteinG: 22.0, carbsG: 10, fatG: 24.0, emoji: "🍗", tags: ["Makhani", "Rich Protein"] },
  { id: "biryani-veg",          name: "Vegetable Biryani",          category: "dinner",    servingSize: "1 plate (250g)",servingGrams: 250, calories: 400, proteinG: 8.0, carbsG: 65, fatG: 12.0, emoji: "🍛", tags: ["Aromatic Rice", "Spiced"] },
  { id: "biryani-chicken",      name: "Chicken Biryani (Dum)",      category: "dinner",    servingSize: "1 plate (300g)",servingGrams: 300, calories: 480, proteinG: 24.0, carbsG: 60, fatG: 15.0, emoji: "🍛", tags: ["High Protein", "Dum Rice"] },
  { id: "palak-paneer",         name: "Palak Paneer",               category: "dinner",    servingSize: "1 bowl (180g)",servingGrams: 180, calories: 260, proteinG: 11.0, carbsG: 10, fatG: 19.0, emoji: "🥬", tags: ["Iron & Calcium", "Spinach"] },
  { id: "fish-curry",           name: "South Indian Fish Curry",    category: "dinner",    servingSize: "1 bowl (200g)",servingGrams: 200, calories: 220, proteinG: 22.0, carbsG: 6,  fatG: 12.0, emoji: "🐟", tags: ["Omega 3", "Lean Protein"] },
  { id: "tandoori-chicken",     name: "Tandoori Chicken (2 pcs)",   category: "dinner",    servingSize: "2 pcs (180g)", servingGrams: 180, calories: 260, proteinG: 32.0, carbsG: 4,  fatG: 12.0, emoji: "🍗", tags: ["High Protein", "Grilled", "Keto"] },
  { id: "grilled-paneer-tikka", name: "Paneer Tikka (4 pcs)",       category: "dinner",    servingSize: "4 pcs (140g)", servingGrams: 140, calories: 240, proteinG: 16.0, carbsG: 8,  fatG: 16.0, emoji: "🍢", tags: ["Grilled", "Vegetarian Protein"] },
  { id: "soya-chunks-curry",    name: "Soya Chunks Masala",         category: "dinner",    servingSize: "1 bowl (180g)",servingGrams: 180, calories: 210, proteinG: 22.0, carbsG: 18, fatG: 5.0, emoji: "🌱", tags: ["Plant Protein", "Low Fat"] },

  // --- SNACKS ---
  { id: "curd",                 name: "Curd / Dahi (Plain)",        category: "snack",     servingSize: "1 bowl (150g)",servingGrams: 150, calories: 98,  proteinG: 5.0, carbsG: 8,   fatG: 5.0, emoji: "🥛", tags: ["Probiotic", "Calcium"] },
  { id: "samosa",               name: "Samosa",                     category: "snack",     servingSize: "1 pc (80g)",   servingGrams: 80,  calories: 260, proteinG: 4.0, carbsG: 24,  fatG: 17.0, emoji: "🥟", tags: ["Crispy Snack", "Street Food"] },
  { id: "sprouts-salad",        name: "Moong Sprouts Salad",        category: "snack",     servingSize: "1 bowl (120g)",servingGrams: 120, calories: 120, proteinG: 8.0, carbsG: 18,  fatG: 1.0, emoji: "🥗", tags: ["Enzyme Rich", "Clean Snack"] },
  { id: "roasted-chana",        name: "Roasted Chana",              category: "snack",     servingSize: "1 handful (40g)", servingGrams: 40, calories: 120, proteinG: 7.0, carbsG: 20, fatG: 2.0, emoji: "🥜", tags: ["High Fiber", "Satiety"] },
  { id: "dhokla",               name: "Khaman Dhokla (2 pcs)",      category: "snack",     servingSize: "2 pcs (100g)", servingGrams: 100, calories: 160, proteinG: 6.0, carbsG: 26,  fatG: 3.5, emoji: "🧽", tags: ["Gujarati", "Steamed"] },
  { id: "boiled-eggs",          name: "Boiled Eggs (2 pcs)",        category: "snack",     servingSize: "2 pcs (100g)", servingGrams: 100, calories: 140, proteinG: 12.6, carbsG: 1, fatG: 9.6, emoji: "🥚", tags: ["Zero Carb", "Bioavailable"] },
  { id: "peanut-chaat",         name: "Boiled Peanut Chaat",        category: "snack",     servingSize: "1 bowl (100g)",servingGrams: 100, calories: 190, proteinG: 9.0, carbsG: 12,  fatG: 12.0, emoji: "🥜", tags: ["Healthy Fats", "Protein"] },
  { id: "makhana-roasted",      name: "Roasted Foxnuts (Makhana)",  category: "snack",     servingSize: "1 bowl (35g)", servingGrams: 35,  calories: 110, proteinG: 3.0, carbsG: 22,  fatG: 1.5, emoji: "🍿", tags: ["Low Calorie", "Antioxidants"] },

  // --- BEVERAGES ---
  { id: "buttermilk",           name: "Masala Chaas / Buttermilk",  category: "beverage",  servingSize: "1 glass (200ml)", servingGrams: 200, calories: 40, proteinG: 2.2, carbsG: 4, fatG: 1.0, emoji: "🥛", tags: ["Electrolytes", "Cooling"] },
  { id: "masala-chai",          name: "Indian Masala Chai",         category: "beverage",  servingSize: "1 cup (150ml)", servingGrams: 150, calories: 60, proteinG: 1.5, carbsG: 9,   fatG: 2.0, emoji: "☕", tags: ["Ginger & Cardamom", "Classic"] },
  { id: "lassi",                name: "Sweet Punjabi Lassi",        category: "beverage",  servingSize: "1 glass (250ml)", servingGrams: 250, calories: 180, proteinG: 5.0, carbsG: 30, fatG: 5.0, emoji: "🥤", tags: ["Dahi Drink", "Refreshing"] },
  { id: "tender-coconut",       name: "Tender Coconut Water",       category: "beverage",  servingSize: "1 glass (240ml)", servingGrams: 240, calories: 45, proteinG: 1.0, carbsG: 10, fatG: 0.2, emoji: "🥥", tags: ["Potassium Rich", "Hydration"] },
  { id: "sattu-drink",          name: "Sattu Protein Sharbat",      category: "beverage",  servingSize: "1 glass (250ml)", servingGrams: 250, calories: 160, proteinG: 9.0, carbsG: 24, fatG: 3.0, emoji: "🥤", tags: ["Desi Whey", "High Protein"] },
];
