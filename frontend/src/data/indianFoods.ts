export interface Micronutrients {
  ironMg?: number;
  calciumMg?: number;
  magnesiumMg?: number;
  potassiumMg?: number;
  vitaminDUg?: number;
  vitaminB12Ug?: number;
  zincMg?: number;
}

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
  micros?: Micronutrients;
  tags?: string[];
}

export const indianFoods: IndianFood[] = [
  // --- BREAKFAST ---
  {
    id: "idli",
    name: "Idli (2 pcs with Sambar & Chutney)",
    category: "breakfast",
    servingSize: "2 pcs (140g)",
    servingGrams: 140,
    calories: 160,
    proteinG: 5.5,
    carbsG: 32,
    fatG: 1.5,
    micros: { ironMg: 1.8, calciumMg: 45, magnesiumMg: 38, potassiumMg: 240, vitaminDUg: 0.1, vitaminB12Ug: 0.2, zincMg: 1.1 },
    tags: ["South Indian", "Steamed", "Light Digestible"]
  },
  {
    id: "plain-dosa",
    name: "Plain Dosa with Coconut Chutney",
    category: "breakfast",
    servingSize: "1 pc (120g)",
    servingGrams: 120,
    calories: 180,
    proteinG: 4.5,
    carbsG: 30,
    fatG: 4.5,
    micros: { ironMg: 1.4, calciumMg: 35, magnesiumMg: 30, potassiumMg: 210, vitaminDUg: 0.0, vitaminB12Ug: 0.1, zincMg: 0.9 },
    tags: ["South Indian", "Crispy", "Tiffin"]
  },
  {
    id: "masala-dosa",
    name: "Masala Dosa (Potato Stuffed)",
    category: "breakfast",
    servingSize: "1 pc (180g)",
    servingGrams: 180,
    calories: 270,
    proteinG: 6.8,
    carbsG: 42,
    fatG: 9.0,
    micros: { ironMg: 2.5, calciumMg: 52, magnesiumMg: 48, potassiumMg: 420, vitaminDUg: 0.1, vitaminB12Ug: 0.2, zincMg: 1.3 },
    tags: ["South Indian", "Potato Masala", "Staple"]
  },
  {
    id: "poha",
    name: "Kanda Poha with Peanuts & Lemon",
    category: "breakfast",
    servingSize: "1 bowl (160g)",
    servingGrams: 160,
    calories: 195,
    proteinG: 4.8,
    carbsG: 33,
    fatG: 5.5,
    micros: { ironMg: 3.2, calciumMg: 28, magnesiumMg: 55, potassiumMg: 280, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 1.2 },
    tags: ["Maharashtrian", "Iron Rich", "Peanuts"]
  },
  {
    id: "rava-upma",
    name: "Rava Upma with Veggies",
    category: "breakfast",
    servingSize: "1 bowl (160g)",
    servingGrams: 160,
    calories: 205,
    proteinG: 5.2,
    carbsG: 34,
    fatG: 5.8,
    micros: { ironMg: 1.6, calciumMg: 32, magnesiumMg: 35, potassiumMg: 230, vitaminDUg: 0.1, vitaminB12Ug: 0.1, zincMg: 1.0 },
    tags: ["South Indian", "Semolina", "Veggies"]
  },
  {
    id: "aloo-paratha",
    name: "Aloo Paratha with Curd & Butter",
    category: "breakfast",
    servingSize: "1 pc (140g)",
    servingGrams: 140,
    calories: 340,
    proteinG: 7.5,
    carbsG: 48,
    fatG: 13.5,
    micros: { ironMg: 2.8, calciumMg: 85, magnesiumMg: 42, potassiumMg: 480, vitaminDUg: 0.4, vitaminB12Ug: 0.4, zincMg: 1.4 },
    tags: ["North Indian", "Whole Wheat", "Stuffed"]
  },
  {
    id: "paneer-paratha",
    name: "Paneer Paratha",
    category: "breakfast",
    servingSize: "1 pc (140g)",
    servingGrams: 140,
    calories: 365,
    proteinG: 15.2,
    carbsG: 39,
    fatG: 16.0,
    micros: { ironMg: 2.2, calciumMg: 260, magnesiumMg: 46, potassiumMg: 310, vitaminDUg: 0.8, vitaminB12Ug: 0.9, zincMg: 2.1 },
    tags: ["High Protein", "Paneer", "North Indian"]
  },
  {
    id: "besan-chilla",
    name: "Besan Chilla (Gram Flour Pancake 2 pcs)",
    category: "breakfast",
    servingSize: "2 pcs (130g)",
    servingGrams: 130,
    calories: 225,
    proteinG: 11.2,
    carbsG: 29,
    fatG: 6.8,
    micros: { ironMg: 3.5, calciumMg: 65, magnesiumMg: 68, potassiumMg: 380, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 1.8 },
    tags: ["High Protein", "Besan", "Gluten Free"]
  },
  {
    id: "ragi-dosa",
    name: "Ragi Dosa (Finger Millet Dosa)",
    category: "breakfast",
    servingSize: "1 pc (100g)",
    servingGrams: 100,
    calories: 155,
    proteinG: 4.0,
    carbsG: 29,
    fatG: 2.8,
    micros: { ironMg: 2.6, calciumMg: 210, magnesiumMg: 52, potassiumMg: 260, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 1.2 },
    tags: ["Calcium Rich", "Millet", "High Fiber"]
  },
  {
    id: "medu-vada",
    name: "Medu Vada (2 pcs with Sambar)",
    category: "breakfast",
    servingSize: "2 pcs (110g)",
    servingGrams: 110,
    calories: 235,
    proteinG: 6.5,
    carbsG: 24,
    fatG: 13.0,
    micros: { ironMg: 2.1, calciumMg: 42, magnesiumMg: 45, potassiumMg: 320, vitaminDUg: 0.1, vitaminB12Ug: 0.1, zincMg: 1.1 },
    tags: ["South Indian", "Crispy", "Urad Dal"]
  },
  {
    id: "puri-bhaji",
    name: "Puri Bhaji (3 puris + Potato Curry)",
    category: "breakfast",
    servingSize: "1 plate (200g)",
    servingGrams: 200,
    calories: 420,
    proteinG: 8.0,
    carbsG: 58,
    fatG: 18.0,
    micros: { ironMg: 3.1, calciumMg: 50, magnesiumMg: 45, potassiumMg: 520, vitaminDUg: 0.2, vitaminB12Ug: 0.2, zincMg: 1.3 },
    tags: ["North Indian", "Weekend Special", "Fried"]
  },
  {
    id: "oats-upma",
    name: "Vegetable Oats Upma",
    category: "breakfast",
    servingSize: "1 bowl (160g)",
    servingGrams: 160,
    calories: 185,
    proteinG: 6.5,
    carbsG: 29,
    fatG: 4.5,
    micros: { ironMg: 2.2, calciumMg: 40, magnesiumMg: 62, potassiumMg: 290, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 1.4 },
    tags: ["Fiber Rich", "Complex Carbs", "Heart Healthy"]
  },

  // --- LUNCH ---
  {
    id: "chapati",
    name: "Whole Wheat Roti / Chapati (1 pc)",
    category: "lunch",
    servingSize: "1 pc (40g)",
    servingGrams: 40,
    calories: 110,
    proteinG: 3.5,
    carbsG: 20,
    fatG: 2.2,
    micros: { ironMg: 1.2, calciumMg: 18, magnesiumMg: 32, potassiumMg: 110, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 0.8 },
    tags: ["Daily Staple", "Whole Wheat", "Fiber"]
  },
  {
    id: "steamed-basmati-rice",
    name: "Steamed Basmati Rice",
    category: "lunch",
    servingSize: "1 cup (160g)",
    servingGrams: 160,
    calories: 208,
    proteinG: 4.4,
    carbsG: 45,
    fatG: 0.5,
    micros: { ironMg: 0.8, calciumMg: 15, magnesiumMg: 22, potassiumMg: 55, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 0.9 },
    tags: ["Staple", "Carbs", "Basmati"]
  },
  {
    id: "dal-tadka",
    name: "Yellow Dal Tadka (Toor / Moong)",
    category: "lunch",
    servingSize: "1 bowl (190g)",
    servingGrams: 190,
    calories: 185,
    proteinG: 9.5,
    carbsG: 25,
    fatG: 6.2,
    micros: { ironMg: 2.8, calciumMg: 42, magnesiumMg: 58, potassiumMg: 390, vitaminDUg: 0.1, vitaminB12Ug: 0.1, zincMg: 1.5 },
    tags: ["Lentils", "High Protein", "Comfort Food"]
  },
  {
    id: "dal-makhani",
    name: "Dal Makhani (Black Urad & Butter)",
    category: "lunch",
    servingSize: "1 bowl (190g)",
    servingGrams: 190,
    calories: 295,
    proteinG: 10.8,
    carbsG: 27,
    fatG: 16.5,
    micros: { ironMg: 3.4, calciumMg: 110, magnesiumMg: 72, potassiumMg: 460, vitaminDUg: 0.6, vitaminB12Ug: 0.5, zincMg: 1.9 },
    tags: ["Creamy", "Black Urad", "North Indian"]
  },
  {
    id: "rajma-masala",
    name: "Rajma Masala (Red Kidney Bean Curry)",
    category: "lunch",
    servingSize: "1 bowl (190g)",
    servingGrams: 190,
    calories: 225,
    proteinG: 11.0,
    carbsG: 31,
    fatG: 6.2,
    micros: { ironMg: 3.8, calciumMg: 65, magnesiumMg: 82, potassiumMg: 580, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 1.7 },
    tags: ["High Protein", "Fiber", "Punjabi Staple"]
  },
  {
    id: "chole-masala",
    name: "Chole Masala (Spiced Chickpeas)",
    category: "lunch",
    servingSize: "1 bowl (190g)",
    servingGrams: 190,
    calories: 240,
    proteinG: 10.2,
    carbsG: 33,
    fatG: 7.5,
    micros: { ironMg: 3.6, calciumMg: 78, magnesiumMg: 75, potassiumMg: 490, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 1.8 },
    tags: ["North Indian", "Chickpeas", "Protein"]
  },
  {
    id: "sambar-south",
    name: "South Indian Vegetable Sambar",
    category: "lunch",
    servingSize: "1 bowl (200g)",
    servingGrams: 200,
    calories: 145,
    proteinG: 6.2,
    carbsG: 21,
    fatG: 3.8,
    micros: { ironMg: 2.2, calciumMg: 52, magnesiumMg: 48, potassiumMg: 410, vitaminDUg: 0.1, vitaminB12Ug: 0.1, zincMg: 1.1 },
    tags: ["South Indian", "Toor Dal", "Veggies"]
  },
  {
    id: "paneer-bhurji",
    name: "Paneer Bhurji (Scrambled Cottage Cheese)",
    category: "lunch",
    servingSize: "1 bowl (160g)",
    servingGrams: 160,
    calories: 275,
    proteinG: 17.5,
    carbsG: 8.5,
    fatG: 19.0,
    micros: { ironMg: 1.8, calciumMg: 340, magnesiumMg: 38, potassiumMg: 280, vitaminDUg: 0.9, vitaminB12Ug: 1.1, zincMg: 2.3 },
    tags: ["High Protein", "Paneer", "Keto Friendly"]
  },
  {
    id: "egg-curry",
    name: "Homestyle Egg Curry (2 eggs)",
    category: "lunch",
    servingSize: "1 bowl (190g)",
    servingGrams: 190,
    calories: 245,
    proteinG: 14.8,
    carbsG: 7.5,
    fatG: 16.8,
    micros: { ironMg: 2.6, calciumMg: 75, magnesiumMg: 28, potassiumMg: 260, vitaminDUg: 1.8, vitaminB12Ug: 1.4, zincMg: 1.6 },
    tags: ["Complete Protein", "Gravy", "Eggs"]
  },
  {
    id: "khichdi-moong",
    name: "Moong Dal Khichdi with Ghee",
    category: "lunch",
    servingSize: "1 bowl (210g)",
    servingGrams: 210,
    calories: 220,
    proteinG: 8.5,
    carbsG: 37,
    fatG: 4.8,
    micros: { ironMg: 2.1, calciumMg: 38, magnesiumMg: 45, potassiumMg: 270, vitaminDUg: 0.2, vitaminB12Ug: 0.2, zincMg: 1.2 },
    tags: ["Gut Healing", "Ayurvedic", "Easy Digest"]
  },
  {
    id: "curd-rice",
    name: "South Indian Curd Rice (Thayir Sadam)",
    category: "lunch",
    servingSize: "1 bowl (190g)",
    servingGrams: 190,
    calories: 235,
    proteinG: 6.5,
    carbsG: 36,
    fatG: 7.2,
    micros: { ironMg: 0.9, calciumMg: 180, magnesiumMg: 32, potassiumMg: 220, vitaminDUg: 0.4, vitaminB12Ug: 0.6, zincMg: 1.0 },
    tags: ["Probiotic", "Cooling", "Dahi"]
  },
  {
    id: "kadhi-pakora",
    name: "Punjabi Kadhi Pakora",
    category: "lunch",
    servingSize: "1 bowl (200g)",
    servingGrams: 200,
    calories: 230,
    proteinG: 7.8,
    carbsG: 22,
    fatG: 12.5,
    micros: { ironMg: 2.0, calciumMg: 160, magnesiumMg: 40, potassiumMg: 290, vitaminDUg: 0.5, vitaminB12Ug: 0.5, zincMg: 1.2 },
    tags: ["Besan", "Yogurt Curry", "North Indian"]
  },
  {
    id: "baingan-bharta",
    name: "Roasted Baingan Bharta (Eggplant)",
    category: "lunch",
    servingSize: "1 bowl (160g)",
    servingGrams: 160,
    calories: 130,
    proteinG: 3.2,
    carbsG: 14,
    fatG: 7.0,
    micros: { ironMg: 1.4, calciumMg: 35, magnesiumMg: 28, potassiumMg: 360, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 0.6 },
    tags: ["Roasted Eggplant", "Low Calorie", "Veggies"]
  },

  // --- DINNER ---
  {
    id: "paneer-butter-masala",
    name: "Paneer Butter Masala",
    category: "dinner",
    servingSize: "1 bowl (190g)",
    servingGrams: 190,
    calories: 335,
    proteinG: 13.0,
    carbsG: 13,
    fatG: 25.0,
    micros: { ironMg: 1.9, calciumMg: 380, magnesiumMg: 42, potassiumMg: 310, vitaminDUg: 1.1, vitaminB12Ug: 1.2, zincMg: 2.2 },
    tags: ["North Indian", "Rich Gravy", "Paneer"]
  },
  {
    id: "chicken-curry",
    name: "Desi Homestyle Chicken Curry",
    category: "dinner",
    servingSize: "1 bowl (210g)",
    servingGrams: 210,
    calories: 290,
    proteinG: 26.5,
    carbsG: 8.5,
    fatG: 17.5,
    micros: { ironMg: 2.4, calciumMg: 32, magnesiumMg: 48, potassiumMg: 420, vitaminDUg: 0.3, vitaminB12Ug: 0.6, zincMg: 2.8 },
    tags: ["High Protein", "Lean Meat", "Chicken"]
  },
  {
    id: "butter-chicken",
    name: "Delhi Style Butter Chicken (Murgh Makhani)",
    category: "dinner",
    servingSize: "1 bowl (210g)",
    servingGrams: 210,
    calories: 365,
    proteinG: 23.5,
    carbsG: 11.0,
    fatG: 25.0,
    micros: { ironMg: 2.1, calciumMg: 85, magnesiumMg: 45, potassiumMg: 390, vitaminDUg: 0.8, vitaminB12Ug: 0.7, zincMg: 2.6 },
    tags: ["Makhani", "Rich Protein", "Creamy"]
  },
  {
    id: "chicken-biryani",
    name: "Hyderabadi Chicken Dum Biryani",
    category: "dinner",
    servingSize: "1 plate (320g)",
    servingGrams: 320,
    calories: 510,
    proteinG: 27.0,
    carbsG: 64,
    fatG: 16.0,
    micros: { ironMg: 3.2, calciumMg: 65, magnesiumMg: 62, potassiumMg: 480, vitaminDUg: 0.4, vitaminB12Ug: 0.8, zincMg: 3.1 },
    tags: ["High Protein", "Dum Rice", "Classic Biryani"]
  },
  {
    id: "veg-biryani",
    name: "Hyderabadi Veg Biryani with Raita",
    category: "dinner",
    servingSize: "1 plate (280g)",
    servingGrams: 280,
    calories: 410,
    proteinG: 9.2,
    carbsG: 68,
    fatG: 12.0,
    micros: { ironMg: 2.8, calciumMg: 95, magnesiumMg: 58, potassiumMg: 410, vitaminDUg: 0.3, vitaminB12Ug: 0.3, zincMg: 1.5 },
    tags: ["Basmati", "Veggies", "Spiced Rice"]
  },
  {
    id: "palak-paneer",
    name: "Palak Paneer (Spinach & Cottage Cheese)",
    category: "dinner",
    servingSize: "1 bowl (190g)",
    servingGrams: 190,
    calories: 270,
    proteinG: 12.5,
    carbsG: 11,
    fatG: 19.5,
    micros: { ironMg: 4.2, calciumMg: 410, magnesiumMg: 95, potassiumMg: 520, vitaminDUg: 0.8, vitaminB12Ug: 1.0, zincMg: 2.1 },
    tags: ["Iron & Calcium", "Spinach", "Paneer"]
  },
  {
    id: "fish-curry",
    name: "Malabar Fish Curry (Coconut Milk)",
    category: "dinner",
    servingSize: "1 bowl (210g)",
    servingGrams: 210,
    calories: 235,
    proteinG: 23.5,
    carbsG: 6.5,
    fatG: 13.0,
    micros: { ironMg: 1.8, calciumMg: 45, magnesiumMg: 52, potassiumMg: 450, vitaminDUg: 4.2, vitaminB12Ug: 2.8, zincMg: 1.4 },
    tags: ["Omega 3", "Lean Protein", "Seafood"]
  },
  {
    id: "tandoori-chicken",
    name: "Tandoori Chicken (2 Leg Pieces)",
    category: "dinner",
    servingSize: "2 pcs (190g)",
    servingGrams: 190,
    calories: 275,
    proteinG: 34.0,
    carbsG: 4.2,
    fatG: 13.0,
    micros: { ironMg: 2.5, calciumMg: 35, magnesiumMg: 44, potassiumMg: 410, vitaminDUg: 0.4, vitaminB12Ug: 0.9, zincMg: 3.4 },
    tags: ["High Protein", "Grilled", "Keto Friendly"]
  },
  {
    id: "paneer-tikka",
    name: "Grilled Paneer Tikka (5 pcs)",
    category: "dinner",
    servingSize: "5 pcs (150g)",
    servingGrams: 150,
    calories: 255,
    proteinG: 17.0,
    carbsG: 8.5,
    fatG: 17.0,
    micros: { ironMg: 1.6, calciumMg: 360, magnesiumMg: 36, potassiumMg: 290, vitaminDUg: 0.9, vitaminB12Ug: 1.1, zincMg: 2.2 },
    tags: ["Grilled", "Veg Protein", "Tandoori"]
  },
  {
    id: "soya-chunks-masala",
    name: "Soya Chunks Masala Curry",
    category: "dinner",
    servingSize: "1 bowl (190g)",
    servingGrams: 190,
    calories: 220,
    proteinG: 23.5,
    carbsG: 19,
    fatG: 5.5,
    micros: { ironMg: 5.8, calciumMg: 140, magnesiumMg: 110, potassiumMg: 620, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 2.5 },
    tags: ["Plant Protein", "High Iron", "Low Fat"]
  },
  {
    id: "egg-bhurji",
    name: "Masala Egg Bhurji (3 eggs)",
    category: "dinner",
    servingSize: "1 plate (170g)",
    servingGrams: 170,
    calories: 260,
    proteinG: 18.2,
    carbsG: 5.5,
    fatG: 18.5,
    micros: { ironMg: 2.9, calciumMg: 82, magnesiumMg: 32, potassiumMg: 280, vitaminDUg: 2.1, vitaminB12Ug: 1.6, zincMg: 1.9 },
    tags: ["High Protein", "Quick Dinner", "Eggs"]
  },

  // --- SNACKS & CHAAT ---
  {
    id: "dahi-curd",
    name: "Plain Whole Milk Curd / Dahi",
    category: "snack",
    servingSize: "1 bowl (160g)",
    servingGrams: 160,
    calories: 105,
    proteinG: 5.5,
    carbsG: 8.5,
    fatG: 5.5,
    micros: { ironMg: 0.2, calciumMg: 190, magnesiumMg: 22, potassiumMg: 240, vitaminDUg: 0.4, vitaminB12Ug: 0.7, zincMg: 0.9 },
    tags: ["Probiotic", "Calcium", "Digestive"]
  },
  {
    id: "samosa",
    name: "Potato Samosa (1 pc)",
    category: "snack",
    servingSize: "1 pc (85g)",
    servingGrams: 85,
    calories: 265,
    proteinG: 4.2,
    carbsG: 26,
    fatG: 16.5,
    micros: { ironMg: 1.5, calciumMg: 25, magnesiumMg: 28, potassiumMg: 310, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 0.7 },
    tags: ["Crispy Snack", "Street Food", "Potato"]
  },
  {
    id: "sprouts-salad",
    name: "Moong Sprouts Salad with Lemon",
    category: "snack",
    servingSize: "1 bowl (130g)",
    servingGrams: 130,
    calories: 125,
    proteinG: 8.5,
    carbsG: 19,
    fatG: 1.2,
    micros: { ironMg: 3.1, calciumMg: 45, magnesiumMg: 62, potassiumMg: 380, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 1.3 },
    tags: ["Enzyme Rich", "Clean Snack", "High Fiber"]
  },
  {
    id: "roasted-chana",
    name: "Roasted Black Chana",
    category: "snack",
    servingSize: "1 handful (45g)",
    servingGrams: 45,
    calories: 135,
    proteinG: 8.2,
    carbsG: 22,
    fatG: 2.4,
    micros: { ironMg: 2.9, calciumMg: 40, magnesiumMg: 52, potassiumMg: 340, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 1.4 },
    tags: ["High Fiber", "Satiety", "Chana"]
  },
  {
    id: "dhokla",
    name: "Khaman Dhokla (Steamed 2 pcs)",
    category: "snack",
    servingSize: "2 pcs (110g)",
    servingGrams: 110,
    calories: 165,
    proteinG: 6.2,
    carbsG: 27,
    fatG: 3.8,
    micros: { ironMg: 1.8, calciumMg: 38, magnesiumMg: 42, potassiumMg: 260, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 1.0 },
    tags: ["Gujarati", "Steamed", "Besan"]
  },
  {
    id: "boiled-eggs",
    name: "Hard Boiled Eggs (2 pcs)",
    category: "snack",
    servingSize: "2 pcs (100g)",
    servingGrams: 100,
    calories: 140,
    proteinG: 12.6,
    carbsG: 1.1,
    fatG: 9.5,
    micros: { ironMg: 1.8, calciumMg: 56, magnesiumMg: 12, potassiumMg: 138, vitaminDUg: 2.2, vitaminB12Ug: 1.1, zincMg: 1.3 },
    tags: ["Zero Carb", "Bioavailable", "Whole Eggs"]
  },
  {
    id: "peanut-chaat",
    name: "Boiled Peanut Chaat",
    category: "snack",
    servingSize: "1 bowl (110g)",
    servingGrams: 110,
    calories: 205,
    proteinG: 9.8,
    carbsG: 13,
    fatG: 13.0,
    micros: { ironMg: 2.2, calciumMg: 48, magnesiumMg: 85, potassiumMg: 360, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 1.6 },
    tags: ["Healthy Fats", "Protein", "Street Chaat"]
  },
  {
    id: "makhana-roasted",
    name: "Roasted Foxnuts (Makhana)",
    category: "snack",
    servingSize: "1 bowl (40g)",
    servingGrams: 40,
    calories: 125,
    proteinG: 3.8,
    carbsG: 25,
    fatG: 1.8,
    micros: { ironMg: 1.4, calciumMg: 60, magnesiumMg: 68, potassiumMg: 210, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 0.9 },
    tags: ["Low Calorie", "Antioxidants", "Light Snack"]
  },

  // --- BEVERAGES ---
  {
    id: "buttermilk",
    name: "Masala Chaas / Spiced Buttermilk",
    category: "beverage",
    servingSize: "1 glass (220ml)",
    servingGrams: 220,
    calories: 45,
    proteinG: 2.5,
    carbsG: 4.8,
    fatG: 1.2,
    micros: { ironMg: 0.2, calciumMg: 120, magnesiumMg: 18, potassiumMg: 190, vitaminDUg: 0.2, vitaminB12Ug: 0.4, zincMg: 0.5 },
    tags: ["Electrolytes", "Cooling", "Probiotic"]
  },
  {
    id: "masala-chai",
    name: "Indian Ginger Cardamom Masala Chai",
    category: "beverage",
    servingSize: "1 cup (150ml)",
    servingGrams: 150,
    calories: 65,
    proteinG: 1.8,
    carbsG: 9.5,
    fatG: 2.2,
    micros: { ironMg: 0.3, calciumMg: 65, magnesiumMg: 12, potassiumMg: 110, vitaminDUg: 0.1, vitaminB12Ug: 0.2, zincMg: 0.3 },
    tags: ["Ginger & Cardamom", "Classic Chai", "Comfort"]
  },
  {
    id: "punjabi-lassi",
    name: "Sweet Punjabi Lassi",
    category: "beverage",
    servingSize: "1 glass (250ml)",
    servingGrams: 250,
    calories: 195,
    proteinG: 5.8,
    carbsG: 32,
    fatG: 5.5,
    micros: { ironMg: 0.3, calciumMg: 210, magnesiumMg: 26, potassiumMg: 280, vitaminDUg: 0.5, vitaminB12Ug: 0.8, zincMg: 1.0 },
    tags: ["Dahi Drink", "Refreshing", "Sweet"]
  },
  {
    id: "coconut-water",
    name: "Fresh Tender Coconut Water",
    category: "beverage",
    servingSize: "1 glass (250ml)",
    servingGrams: 250,
    calories: 48,
    proteinG: 1.1,
    carbsG: 10.5,
    fatG: 0.2,
    micros: { ironMg: 0.7, calciumMg: 60, magnesiumMg: 42, potassiumMg: 600, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 0.3 },
    tags: ["Potassium Rich", "Hydration", "Natural Electrolytes"]
  },
  {
    id: "sattu-drink",
    name: "Desi Sattu Protein Sharbat (Roasted Gram Flour)",
    category: "beverage",
    servingSize: "1 glass (260ml)",
    servingGrams: 260,
    calories: 170,
    proteinG: 9.5,
    carbsG: 25,
    fatG: 3.2,
    micros: { ironMg: 3.4, calciumMg: 55, magnesiumMg: 58, potassiumMg: 390, vitaminDUg: 0.0, vitaminB12Ug: 0.0, zincMg: 1.5 },
    tags: ["Desi Whey", "High Protein", "Summer Cooler"]
  }
];
