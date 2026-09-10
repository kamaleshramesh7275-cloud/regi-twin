export interface IndianFood {
  id: string;
  name: string;
  category: "breakfast" | "lunch" | "dinner" | "snack" | "beverage";
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

// Nutrition values are approximate per standard serving — flagged as
// "approx." in the UI; refine later with a nutrition API if needed.
export const indianFoods: IndianFood[] = [
  // --- BREAKFAST ---
  { id: "idli",                 name: "Idli (2 pcs)",               category: "breakfast", servingSize: "2 pcs",    calories: 78,  proteinG: 2,  carbsG: 16, fatG: 0.4 },
  { id: "dosa-plain",           name: "Plain Dosa",                 category: "breakfast", servingSize: "1 pc",     calories: 168, proteinG: 4,  carbsG: 29, fatG: 3.7 },
  { id: "masala-dosa",          name: "Masala Dosa",                category: "breakfast", servingSize: "1 pc",     calories: 250, proteinG: 6,  carbsG: 38, fatG: 8   },
  { id: "poha",                 name: "Poha",                       category: "breakfast", servingSize: "1 bowl",   calories: 180, proteinG: 4,  carbsG: 30, fatG: 5   },
  { id: "upma",                 name: "Upma",                       category: "breakfast", servingSize: "1 bowl",   calories: 190, proteinG: 5,  carbsG: 32, fatG: 5   },
  { id: "paratha-plain",        name: "Plain Paratha",            category: "breakfast", servingSize: "1 pc",     calories: 260, proteinG: 6,  carbsG: 36, fatG: 10  },
  { id: "aloo-paratha",         name: "Aloo Paratha",               category: "breakfast", servingSize: "1 pc",     calories: 320, proteinG: 7,  carbsG: 45, fatG: 12  },
  { id: "paneer-paratha",       name: "Paneer Paratha",             category: "breakfast", servingSize: "1 pc",     calories: 340, proteinG: 14, carbsG: 38, fatG: 14  },
  { id: "besan-chilla",         name: "Besan Chilla (2 pcs)",       category: "breakfast", servingSize: "2 pcs",    calories: 210, proteinG: 10, carbsG: 28, fatG: 6   },
  { id: "oats-upma",            name: "Vegetable Oats Upma",        category: "breakfast", servingSize: "1 bowl",   calories: 175, proteinG: 6,  carbsG: 28, fatG: 4   },
  { id: "ragi-dosa",            name: "Ragi Dosa",                  category: "breakfast", servingSize: "1 pc",     calories: 145, proteinG: 3.5,carbsG: 27, fatG: 2.5 },
  { id: "medu-vada",            name: "Medu Vada (2 pcs)",          category: "breakfast", servingSize: "2 pcs",    calories: 220, proteinG: 6,  carbsG: 22, fatG: 12  },

  // --- LUNCH ---
  { id: "chapati",              name: "Chapati / Roti",             category: "lunch",     servingSize: "1 pc",     calories: 104, proteinG: 3,  carbsG: 18, fatG: 2.5 },
  { id: "plain-rice",           name: "Steamed White Rice",         category: "lunch",     servingSize: "1 cup",    calories: 205, proteinG: 4,  carbsG: 45, fatG: 0.4 },
  { id: "brown-rice",           name: "Brown Rice",                 category: "lunch",     servingSize: "1 cup",    calories: 215, proteinG: 5,  carbsG: 45, fatG: 1.8 },
  { id: "dal-tadka",            name: "Yellow Dal Tadka",           category: "lunch",     servingSize: "1 bowl",   calories: 180, proteinG: 9,  carbsG: 24, fatG: 6   },
  { id: "dal-makhani",          name: "Dal Makhani",                category: "lunch",     servingSize: "1 bowl",   calories: 290, proteinG: 10, carbsG: 26, fatG: 16  },
  { id: "rajma",                name: "Rajma (Kidney Bean Curry)",  category: "lunch",     servingSize: "1 bowl",   calories: 220, proteinG: 10, carbsG: 30, fatG: 6   },
  { id: "chole",                name: "Chole (Chickpea Curry)",     category: "lunch",     servingSize: "1 bowl",   calories: 230, proteinG: 9,  carbsG: 32, fatG: 7   },
  { id: "sambar",               name: "South Indian Sambar",        category: "lunch",     servingSize: "1 bowl",   calories: 140, proteinG: 6,  carbsG: 20, fatG: 3.5 },
  { id: "paneer-bhurji",        name: "Paneer Bhurji",              category: "lunch",     servingSize: "1 bowl",   calories: 260, proteinG: 16, carbsG: 8,  fatG: 18  },
  { id: "egg-curry",            name: "Egg Curry (2 eggs)",         category: "lunch",     servingSize: "1 bowl",   calories: 240, proteinG: 14, carbsG: 8,  fatG: 16  },
  { id: "khichdi-moong",        name: "Moong Dal Khichdi",          category: "lunch",     servingSize: "1 bowl",   calories: 210, proteinG: 8,  carbsG: 36, fatG: 4   },
  { id: "curd-rice",            name: "Curd Rice",                  category: "lunch",     servingSize: "1 bowl",   calories: 230, proteinG: 6,  carbsG: 35, fatG: 7   },

  // --- DINNER ---
  { id: "paneer-butter-masala", name: "Paneer Butter Masala",       category: "dinner",    servingSize: "1 bowl",   calories: 320, proteinG: 12, carbsG: 12, fatG: 24  },
  { id: "chicken-curry",        name: "Homestyle Chicken Curry",    category: "dinner",    servingSize: "1 bowl",   calories: 280, proteinG: 25, carbsG: 8,  fatG: 17  },
  { id: "butter-chicken",       name: "Butter Chicken",             category: "dinner",    servingSize: "1 bowl",   calories: 350, proteinG: 22, carbsG: 10, fatG: 24  },
  { id: "biryani-veg",          name: "Vegetable Biryani",          category: "dinner",    servingSize: "1 plate",  calories: 400, proteinG: 8,  carbsG: 65, fatG: 12  },
  { id: "biryani-chicken",      name: "Chicken Biryani",            category: "dinner",    servingSize: "1 plate",  calories: 480, proteinG: 24, carbsG: 60, fatG: 15  },
  { id: "palak-paneer",         name: "Palak Paneer",               category: "dinner",    servingSize: "1 bowl",   calories: 260, proteinG: 11, carbsG: 10, fatG: 19  },
  { id: "fish-curry",           name: "Fish Curry",                 category: "dinner",    servingSize: "1 bowl",   calories: 220, proteinG: 22, carbsG: 6,  fatG: 12  },
  { id: "tandoori-chicken",     name: "Tandoori Chicken (2 pcs)",   category: "dinner",    servingSize: "2 pcs",    calories: 260, proteinG: 32, carbsG: 4,  fatG: 12  },
  { id: "grilled-paneer-tikka", name: "Paneer Tikka (4 pcs)",       category: "dinner",    servingSize: "4 pcs",    calories: 240, proteinG: 16, carbsG: 8,  fatG: 16  },
  { id: "soya-chunks-curry",    name: "Soya Chunks Masala",         category: "dinner",    servingSize: "1 bowl",   calories: 210, proteinG: 22, carbsG: 18, fatG: 5   },

  // --- SNACKS ---
  { id: "curd",                 name: "Curd / Dahi",                category: "snack",     servingSize: "1 bowl",   calories: 98,  proteinG: 5,  carbsG: 8,  fatG: 5   },
  { id: "samosa",               name: "Samosa",                     category: "snack",     servingSize: "1 pc",     calories: 260, proteinG: 4,  carbsG: 24, fatG: 17  },
  { id: "sprouts-salad",        name: "Sprouts Salad",              category: "snack",     servingSize: "1 bowl",   calories: 120, proteinG: 8,  carbsG: 18, fatG: 1   },
  { id: "roasted-chana",        name: "Roasted Chana",              category: "snack",     servingSize: "1 handful",calories: 120, proteinG: 7,  carbsG: 20, fatG: 2   },
  { id: "dhokla",               name: "Khaman Dhokla (2 pcs)",      category: "snack",     servingSize: "2 pcs",    calories: 160, proteinG: 6,  carbsG: 26, fatG: 3.5 },
  { id: "boiled-eggs",          name: "Boiled Eggs (2 pcs)",        category: "snack",     servingSize: "2 pcs",    calories: 140, proteinG: 12, carbsG: 1,  fatG: 10  },
  { id: "peanut-chaat",         name: "Boiled Peanut Chaat",        category: "snack",     servingSize: "1 bowl",   calories: 190, proteinG: 9,  carbsG: 12, fatG: 12  },
  { id: "makhana-roasted",      name: "Roasted Foxnuts (Makhana)",  category: "snack",     servingSize: "1 bowl",   calories: 110, proteinG: 3,  carbsG: 22, fatG: 1.5 },

  // --- BEVERAGES ---
  { id: "buttermilk",           name: "Buttermilk / Chaas",         category: "beverage",  servingSize: "1 glass",  calories: 40,  proteinG: 2,  carbsG: 4,  fatG: 1   },
  { id: "masala-chai",          name: "Masala Chai",                category: "beverage",  servingSize: "1 cup",    calories: 60,  proteinG: 1,  carbsG: 9,  fatG: 2   },
  { id: "lassi",                name: "Sweet Lassi",                category: "beverage",  servingSize: "1 glass",  calories: 180, proteinG: 5,  carbsG: 30, fatG: 5   },
  { id: "tender-coconut",       name: "Tender Coconut Water",       category: "beverage",  servingSize: "1 glass",  calories: 45,  proteinG: 1,  carbsG: 10, fatG: 0.2 },
  { id: "sattu-drink",          name: "Sattu Protein Sharbat",      category: "beverage",  servingSize: "1 glass",  calories: 160, proteinG: 9,  carbsG: 24, fatG: 3   },
];
