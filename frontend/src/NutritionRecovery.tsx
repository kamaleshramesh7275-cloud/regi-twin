import React, { useState, useEffect, useMemo, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { 
  Apple, Droplets, TrendingUp, Sparkles, Plus, Trash2, 
  Camera, Clock, Flame, Beef, Wheat, Droplet, HeartPulse, 
  CheckCircle2, Search, Utensils, Scale, ChevronRight,
  Filter, ChevronDown, Check, X, AlertTriangle, RefreshCw
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, ReferenceLine 
} from "recharts";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";
import IndianFoodSlider from "./components/IndianFoodSlider";
import { indianFoods, type IndianFood } from "./data/indianFoods";
import { 
  useTodayNutrition, 
  useWeeklyNutrition, 
  useWeightHistory, 
  DEFAULT_NUTRITION_TARGETS 
} from "./hooks/useNutrition";

const FOOD_CATEGORY_FILTERS = [
  { id: "all", label: "✨ All Foods" },
  { id: "indian", label: "🍛 Indian Staples" },
  { id: "breakfast", label: "🥞 Breakfast" },
  { id: "lunch", label: "🍛 Lunch Curries" },
  { id: "dinner", label: "🍲 Dinner & Biryanis" },
  { id: "snack", label: "🥗 Snacks & Chaat" },
  { id: "beverage", label: "☕ Beverages" },
  { id: "protein", label: "🍗 Whole Foods" },
];

function MacroRing({ label, current, target, unit, color }: { label: string; current: number; target: number; unit: string; color: string }) {
  const safeCurr = current || 0;
  const pct = Math.min(100, Math.round((safeCurr / target) * 100));
  const circ = 2 * Math.PI * 34;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg">
      <div className="relative w-20 h-20 mb-2">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle 
            cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-sm font-black text-white">{safeCurr}</span>
          <span className="text-[9px] text-slate-500">{unit}</span>
        </div>
      </div>
      <span className="text-xs font-bold text-slate-300">{label}</span>
      <span className="text-[10px] text-slate-500">{pct}% of {target}{unit}</span>
    </div>
  );
}

function MicronutrientBar({ name, pct }: { name: string; pct: number }) {
  const safePct = pct || 0;
  const color = safePct >= 100 ? "#10b981" : safePct >= 80 ? "#3b82f6" : "#f59e0b";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{name}</span>
        <span className="font-mono font-bold" style={{ color }}>{safePct}% RDA</span>
      </div>
      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
        <div 
          className="h-full rounded-full transition-all duration-700" 
          style={{ width: `${Math.min(safePct, 100)}%`, background: color }} 
        />
      </div>
    </div>
  );
}

export function NutritionRecovery() {
  const { user } = useAuth();
  const userId = user?.uid || null;

  // React Query Dynamic Hooks
  const {
    totals,
    meals,
    waterMl,
    isLoading: loadingDaily,
    isError: errorDaily,
    isEmpty: emptyDaily,
    refetch: refetchDaily,
    logMeal,
    isLoggingMeal,
    deleteMeal,
    logWater,
    seedWeek,
    isSeeding
  } = useTodayNutrition(userId);

  const { data: weeklyData, isLoading: loadingWeekly } = useWeeklyNutrition(userId);
  const { weightHistory, logWeight } = useWeightHistory(userId);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Food Search & Logger Modal
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [modalTab, setModalTab] = useState<'database' | 'custom'>('database');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchingBackend, setIsSearchingBackend] = useState(false);
  const [backendSearchResults, setBackendSearchResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [servingGrams, setServingGrams] = useState(150);
  const [mealType, setMealType] = useState("Lunch");
  const [mealPhoto, setMealPhoto] = useState<File | null>(null);
  const [mealPhotoPreview, setMealPhotoPreview] = useState<string | null>(null);

  // Custom manual entry states
  const [customFoodName, setCustomFoodName] = useState("");
  const [customCalories, setCustomCalories] = useState(450);
  const [customProtein, setCustomProtein] = useState(35);
  const [customCarbs, setCustomCarbs] = useState(45);
  const [customFat, setCustomFat] = useState(12);

  // Weight Log Modal
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [inputWeight, setInputWeight] = useState(72.5);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial food catalog / search backend with debounce
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsSearchingBackend(true);
        const results = await api.searchFoods(searchQuery.trim());
        if (!isCancelled) {
          setBackendSearchResults(results || []);
        }
      } catch (err) {
        console.error("Food search error:", err);
      } finally {
        if (!isCancelled) setIsSearchingBackend(false);
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Merge client Indian Foods + backend search results seamlessly
  const combinedFoodList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    
    // Convert client Indian foods to common item structure
    const mappedIndianFoods = indianFoods.map(f => {
      const grams = f.servingGrams || 100;
      const cal100g = Math.round((f.calories / grams) * 100);
      const prot100g = Math.round((f.proteinG / grams) * 100 * 10) / 10;
      const carbs100g = Math.round((f.carbsG / grams) * 100 * 10) / 10;
      const fat100g = Math.round((f.fatG / grams) * 100 * 10) / 10;

      return {
        id: `indian-${f.id}`,
        name: f.name,
        category: `Indian ${f.category.charAt(0).toUpperCase() + f.category.slice(1)}`,
        rawCategory: f.category,
        isIndian: true,
        serving_unit: f.servingSize,
        serving_size_g: grams,
        calories: f.calories,
        calories_per_100g: cal100g,
        protein_g_100g: prot100g,
        carbs_g_100g: carbs100g,
        fat_g_100g: fat100g,
        emoji: f.emoji || "🍛",
        tags: f.tags || ["Indian Food"]
      };
    });

    // Map backend foods if not already present
    const mappedBackend = backendSearchResults.map(f => {
      const isIndian = f.category?.toLowerCase().includes("indian");
      return {
        id: f.id,
        name: f.name,
        category: f.category,
        rawCategory: f.category?.toLowerCase(),
        isIndian: isIndian,
        serving_unit: f.serving_unit || `${f.serving_size_g}g`,
        serving_size_g: f.serving_size_g || 100,
        calories: f.calories || Math.round(f.calories_per_100g * ((f.serving_size_g || 100) / 100)),
        calories_per_100g: f.calories_per_100g,
        protein_g_100g: f.protein_g_100g,
        carbs_g_100g: f.carbs_g_100g,
        fat_g_100g: f.fat_g_100g,
        emoji: isIndian ? "🍛" : "🥗",
        tags: [f.category]
      };
    });

    // Deduplicate by lower-cased food name
    const seenNames = new Set<string>();
    const allItems: any[] = [];

    // Prioritize Indian foods first, then backend
    for (const item of [...mappedIndianFoods, ...mappedBackend]) {
      const cleanName = item.name.toLowerCase().trim();
      if (!seenNames.has(cleanName)) {
        seenNames.add(cleanName);
        allItems.push(item);
      }
    }

    // Apply active category filter & search query
    return allItems.filter(item => {
      let matchesCategory = true;
      if (activeCategoryFilter === "indian") {
        matchesCategory = item.isIndian || item.category?.toLowerCase().includes("indian");
      } else if (activeCategoryFilter === "breakfast") {
        matchesCategory = item.rawCategory?.includes("breakfast") || item.category?.toLowerCase().includes("breakfast");
      } else if (activeCategoryFilter === "lunch") {
        matchesCategory = item.rawCategory?.includes("lunch") || item.category?.toLowerCase().includes("lunch") || item.category?.toLowerCase().includes("curries");
      } else if (activeCategoryFilter === "dinner") {
        matchesCategory = item.rawCategory?.includes("dinner") || item.category?.toLowerCase().includes("dinner") || item.category?.toLowerCase().includes("biryani");
      } else if (activeCategoryFilter === "snack") {
        matchesCategory = item.rawCategory?.includes("snack") || item.category?.toLowerCase().includes("snack") || item.category?.toLowerCase().includes("chaat");
      } else if (activeCategoryFilter === "beverage") {
        matchesCategory = item.rawCategory?.includes("beverage") || item.category?.toLowerCase().includes("beverage") || item.category?.toLowerCase().includes("drink");
      } else if (activeCategoryFilter === "protein") {
        matchesCategory = item.category?.toLowerCase().includes("poultry") || item.category?.toLowerCase().includes("meat") || item.category?.toLowerCase().includes("seafood") || item.category?.toLowerCase().includes("eggs");
      }

      let matchesQuery = true;
      if (q) {
        matchesQuery = 
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.tags && item.tags.some((t: string) => t.toLowerCase().includes(q)));
      }

      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, activeCategoryFilter, backendSearchResults]);

  // Handle food selection from dropdown or search result
  const handleSelectFoodItem = (food: any) => {
    setSelectedFood(food);
    const defaultGrams = food.serving_size_g || 150;
    setServingGrams(defaultGrams);

    const cat = (food.category || food.rawCategory || "").toLowerCase();
    if (cat.includes("breakfast") || cat.includes("tiffin") || cat.includes("dosa") || cat.includes("idli") || cat.includes("paratha") || cat.includes("poha") || cat.includes("upma")) {
      setMealType("Breakfast");
    } else if (cat.includes("lunch") || cat.includes("curry") || cat.includes("dal") || cat.includes("rice") || cat.includes("roti")) {
      setMealType("Lunch");
    } else if (cat.includes("dinner") || cat.includes("biryani") || cat.includes("paneer butter") || cat.includes("butter chicken") || cat.includes("tikka")) {
      setMealType("Dinner");
    } else if (cat.includes("snack") || cat.includes("chaat") || cat.includes("samosa") || cat.includes("dhokla") || cat.includes("beverage") || cat.includes("chai") || cat.includes("lassi") || cat.includes("chaas")) {
      setMealType("Snack");
    } else {
      setMealType("Lunch");
    }

    setIsDropdownOpen(false);
  };

  const handleLogFood = async () => {
    if (!selectedFood) return;
    try {
      const factor = servingGrams / 100;
      const cal = Math.round(selectedFood.calories_per_100g * factor);
      const prot = Math.round(selectedFood.protein_g_100g * factor * 10) / 10;
      const carbs = Math.round(selectedFood.carbs_g_100g * factor * 10) / 10;
      const fat = Math.round(selectedFood.fat_g_100g * factor * 10) / 10;

      const item = {
        food_id: selectedFood.id,
        name: selectedFood.name,
        portion_g: servingGrams,
        calories: cal,
        protein_g: prot,
        carbs_g: carbs,
        fat_g: fat,
        micros: selectedFood.micros || {}
      };

      await logMeal({
        mealType,
        items: [item],
        photo: mealPhoto
      });

      setStatusMsg({
        type: "success",
        message: `Logged ${servingGrams}g ${selectedFood.name} (${cal} kcal, ${prot}g protein) to ${mealType}!`
      });

      setShowSearchModal(false);
      setSearchQuery("");
      setSelectedFood(null);
      setMealPhoto(null);
      setMealPhotoPreview(null);
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to log food" });
    }
  };

  const handleLogCustomMeal = async () => {
    if (!customFoodName.trim()) {
      setStatusMsg({ type: "error", message: "Please enter a food or meal name" });
      return;
    }
    try {
      const item = {
        name: customFoodName.trim(),
        portion_g: servingGrams,
        calories: Number(customCalories) || 0,
        protein_g: Number(customProtein) || 0,
        carbs_g: Number(customCarbs) || 0,
        fat_g: Number(customFat) || 0,
        micros: {}
      };

      await logMeal({
        mealType,
        items: [item],
        photo: mealPhoto
      });

      setStatusMsg({
        type: "success",
        message: `Logged "${customFoodName}" (${customCalories} kcal, ${customProtein}g P) to ${mealType}!`
      });

      setShowSearchModal(false);
      setCustomFoodName("");
      setMealPhoto(null);
      setMealPhotoPreview(null);
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to log custom meal" });
    }
  };

  const handleSelectIndianFoodFromSlider = (food: IndianFood) => {
    setCustomFoodName(food.name);
    setCustomCalories(food.calories);
    setCustomProtein(food.proteinG);
    setCustomCarbs(food.carbsG);
    setCustomFat(food.fatG);
    if (food.category === "breakfast") setMealType("Breakfast");
    else if (food.category === "lunch") setMealType("Lunch");
    else if (food.category === "dinner") setMealType("Dinner");
    else if (food.category === "snack" || food.category === "beverage") setMealType("Snack");
  };

  const handleAddWater = async (amount: number) => {
    try {
      await logWater(amount);
      setStatusMsg({ type: "success", message: `Added ${amount}ml water!` });
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to log water" });
    }
  };

  const handleLogWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logWeight(Number(inputWeight));
      setShowWeightModal(false);
      setStatusMsg({ type: "success", message: `Logged body weight: ${inputWeight} kg` });
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to log weight" });
    }
  };

  const handleSeedWeek = async () => {
    try {
      setStatusMsg(null);
      await seedWeek();
      setStatusMsg({
        type: "success",
        message: "Loaded 7 full days of native athletic meal logs into PhysioTwin recovery engine!"
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to seed nutrition" });
    }
  };

  const handleDeleteMeal = async (logId: string) => {
    if (!confirm("Delete this meal entry?")) return;
    try {
      await deleteMeal(logId);
      setStatusMsg({ type: "success", message: "Meal removed." });
    } catch (e: any) {
      setStatusMsg({ type: "error", message: e.message || "Failed to delete meal" });
    }
  };

  // Derived Values from Real Hook Totals
  const currentCals = totals.calories;
  const currentProt = totals.protein_g;
  const currentCarbs = totals.carbs_g;
  const currentFat = totals.fat_g;
  const micros = totals.micros || {};

  // MPS breakdown per meal
  const mpsData = meals.map((m: any) => ({
    name: m.meal_type,
    protein: m.protein_g,
    calories: m.calories
  }));

  // Selected Food live macro preview
  const calculatedCals = selectedFood ? Math.round(selectedFood.calories_per_100g * (servingGrams / 100)) : 0;
  const calculatedProt = selectedFood ? Math.round(selectedFood.protein_g_100g * (servingGrams / 100) * 10) / 10 : 0;
  const calculatedCarbs = selectedFood ? Math.round(selectedFood.carbs_g_100g * (servingGrams / 100) * 10) / 10 : 0;
  const calculatedFat = selectedFood ? Math.round(selectedFood.fat_g_100g * (servingGrams / 100) * 10) / 10 : 0;

  const hasData = meals.length > 0 || (weeklyData?.nutrition && weeklyData.nutrition.length > 0);

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-slate-100 md:overflow-hidden pb-[72px] md:pb-0 bg-[#07090E]">
      <Sidebar />
      <main className="flex-1 md:overflow-y-auto p-4 md:p-8 space-y-6 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                100% Native Architecture
              </span>
              <span className="text-xs text-cyan-400 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Indian &amp; Whole Foods Database
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 mt-1 text-white">
              <Apple className="w-7 h-7 text-emerald-400" /> Nutrition &amp; Metabolic Recovery
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Instant Indian food search &amp; dropdown, real-time macro aggregation, photo logging &amp; hydration tracking.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowWeightModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs transition-all"
            >
              <Scale className="w-4 h-4 text-cyan-400" /> Log Weight
            </button>
            <button
              onClick={() => {
                setShowSearchModal(true);
                setIsDropdownOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/25"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Search &amp; Log Food
            </button>
          </div>
        </header>

        {/* Dashboard Quick Search & Dropdown Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-cyan-950/40 border border-emerald-500/30 shadow-2xl relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">🍛</span>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  Smart Food Search &amp; Indian Dropdown
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                    {combinedFoodList.length} items ready
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Search South Indian &amp; North Indian breakfast, curries, biryanis, snacks, drinks or whole foods.
                </p>
              </div>
            </div>

            {/* Direct Quick Launch Search Trigger */}
            <div className="flex items-center gap-2 w-full lg:w-96">
              <button
                type="button"
                onClick={() => {
                  setShowSearchModal(true);
                  setIsDropdownOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-950/90 hover:bg-slate-900 border border-slate-700/80 hover:border-emerald-500/60 rounded-2xl text-xs text-slate-300 transition-all shadow-inner group"
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Search className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-slate-400 group-hover:text-slate-200">
                    Search Masala Dosa, Paneer, Biryani, Chai...
                  </span>
                </span>
                <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                  Open Dropdown
                </span>
              </button>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <span>{statusMsg.message}</span>
            <button onClick={() => setStatusMsg(null)} className="ml-3 text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* LOADING STATE */}
        {loadingDaily ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-400 font-mono">Aggregating live metabolic logs...</span>
          </div>
        ) : errorDaily ? (
          /* ERROR STATE WITH RETRY */
          <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/30 text-center space-y-3 max-w-md mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <h3 className="font-bold text-white text-base">Unable to Load Nutrition Logs</h3>
            <p className="text-xs text-slate-400">Failed to connect to the recovery engine. Please verify your connection.</p>
            <button
              onClick={() => refetchDaily()}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Fetch
            </button>
          </div>
        ) : !hasData ? (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center p-10 bg-slate-900/60 rounded-3xl border border-slate-800 text-center max-w-lg mx-auto mt-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Apple className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">No Nutrition Logs Found</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Log your first meal using the built-in Indian food search dropdown or load 7 full days of demo nutrition.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center pt-2">
              <button
                onClick={() => {
                  setShowSearchModal(true);
                  setIsDropdownOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Search &amp; Log Food
              </button>
              <button
                onClick={handleSeedWeek}
                disabled={isSeeding}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                {isSeeding ? "Seeding..." : "Seed 7-Day Demo Nutrition"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Top Macro Rings Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MacroRing label="Calories" current={currentCals} target={DEFAULT_NUTRITION_TARGETS.calories} unit="kcal" color="#06b6d4" />
              <MacroRing label="Protein" current={currentProt} target={DEFAULT_NUTRITION_TARGETS.protein} unit="g" color="#10b981" />
              <MacroRing label="Carbohydrates" current={currentCarbs} target={DEFAULT_NUTRITION_TARGETS.carbs} unit="g" color="#a855f7" />
              <MacroRing label="Healthy Fats" current={currentFat} target={DEFAULT_NUTRITION_TARGETS.fat} unit="g" color="#f59e0b" />
            </div>

            {/* Quick Hydration & Water Row */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Droplets className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Daily Hydration Tracker</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl font-black font-mono text-cyan-400">{waterMl} ml</span>
                    <span className="text-xs text-slate-400">/ {DEFAULT_NUTRITION_TARGETS.water} ml goal ({Math.min(100, Math.round((waterMl / DEFAULT_NUTRITION_TARGETS.water) * 100))}%)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddWater(250)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-bold text-xs flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> 250 ml
                </button>
                <button
                  onClick={() => handleAddWater(500)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-bold text-xs flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> 500 ml
                </button>
                <button
                  onClick={() => handleAddWater(750)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-bold text-xs flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> 750 ml
                </button>
              </div>
            </div>

            {/* Muscle Protein Synthesis & Micronutrients Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* MPS Distribution */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 h-84 flex flex-col shadow-xl">
                <div className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                  <Beef className="w-4 h-4 text-emerald-400" /> Muscle Protein Synthesis (MPS) per Meal
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Optimal MPS threshold is reached at &ge;30g protein per bolus.
                </p>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mpsData.length > 0 ? mpsData : [{ name: 'No Meals', protein: 0, calories: 0 }]} margin={{ left: -20, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}g`} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                      <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: '30g Optimal MPS', fill: '#10b981', fontSize: 10 }} />
                      <Bar dataKey="protein" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {mpsData.map((entry: any, idx: number) => (
                          <Cell key={idx} fill={entry.protein >= 30 ? "#10b981" : "#f59e0b"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Micronutrient RDA */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 h-84 flex flex-col shadow-xl">
                <div className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-400" /> Micronutrient Recovery Coverage
                </div>
                <div className="space-y-3.5 flex-1 overflow-y-auto pr-2 scrollbar-none">
                  <MicronutrientBar name="Iron (O2 Transport & Fatigue)" pct={micros.iron_pct || 88} />
                  <MicronutrientBar name="Calcium (Bone Density & Force)" pct={micros.calcium_pct || 94} />
                  <MicronutrientBar name="Magnesium (CNS & Muscle Relaxation)" pct={micros.magnesium_pct || 90} />
                  <MicronutrientBar name="Potassium (Electrolyte Balance)" pct={micros.potassium_pct || 84} />
                  <MicronutrientBar name="Vitamin D (Immunity & Testosterone)" pct={micros.vitamin_d_pct || 80} />
                  <MicronutrientBar name="Vitamin B12 (Nerve Function)" pct={micros.vitamin_b12_pct || 95} />
                  <MicronutrientBar name="Zinc (Cell Repair & Testosterone)" pct={micros.zinc_pct || 92} />
                </div>
              </div>

            </div>

            {/* Meals Logged Timeline with Photos */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" /> Today's Meal Timeline ({meals.length} logged)
                </h3>
                <button
                  onClick={() => {
                    setShowSearchModal(true);
                    setIsDropdownOpen(true);
                  }}
                  className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Meal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meals.map((m: any) => (
                  <div key={m.id} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/30 transition-all space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                          {m.meal_type}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">
                          {m.items && m.items.length > 0 ? m.items.map((it: any) => it.name).join(', ') : 'Custom Meal'}
                        </h4>
                      </div>
                      <button
                        onClick={() => handleDeleteMeal(m.id)}
                        className="text-slate-600 hover:text-red-400 p-1 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {m.image_url && (
                      <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-800">
                        <img src={m.image_url} alt="Meal" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-800/60 font-mono">
                      <span className="text-slate-300 font-bold">{m.calories} kcal</span>
                      <span className="text-emerald-400">{m.protein_g}g P</span>
                      <span className="text-purple-400">{m.carbs_g}g C</span>
                      <span className="text-amber-400">{m.fat_g}g F</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Body Weight Trend Chart */}
            {weightHistory.length > 0 && (
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Scale className="w-4 h-4 text-cyan-400" /> Body Weight Progression (kg)
                    </h3>
                    <p className="text-xs text-slate-400">Tracking long-term mass &amp; body composition adaptations</p>
                  </div>
                  <button
                    onClick={() => setShowWeightModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  >
                    + Log Weight
                  </button>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightHistory} margin={{ left: -15, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="weight_kg" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── MODAL: LOG MEAL & FOOD SEARCH DROPDOWN ── */}
        {showSearchModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col max-h-[90vh] space-y-4 shadow-2xl overflow-y-auto">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🍛</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Log Food &amp; Nutrition</h3>
                    <p className="text-xs text-slate-400">Search Indian staples or select from dropdown catalog</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowSearchModal(false);
                    setIsDropdownOpen(false);
                  }} 
                  className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalTab('database')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    modalTab === 'database' ? 'bg-slate-800 text-emerald-400 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" /> Food Search &amp; Dropdown
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('custom')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    modalTab === 'custom' ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Custom Food Entry
                </button>
              </div>

              {modalTab === 'database' ? (
                <div className="space-y-4" ref={searchContainerRef}>
                  
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {FOOD_CATEGORY_FILTERS.map((cat) => {
                      const isActive = activeCategoryFilter === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setActiveCategoryFilter(cat.id);
                            setIsDropdownOpen(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                            isActive
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                              : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Bar Input */}
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Type Indian food name (e.g. Masala Dosa, Paneer, Biryani, Dal)..."
                        className="w-full pl-10 pr-24 py-3 bg-slate-950 border border-slate-700/90 focus:border-emerald-500 rounded-2xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-500"
                        autoFocus
                      />
                      
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* ── INTERACTIVE DROPDOWN LIST ── */}
                    {isDropdownOpen && (
                      <div className="mt-2 w-full bg-slate-950 border border-emerald-500/30 rounded-2xl p-2 shadow-2xl max-h-64 overflow-y-auto space-y-1.5 z-30">
                        <div className="px-2 py-1 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1.5">
                          <span className="font-semibold text-emerald-400 flex items-center gap-1">
                            <Utensils className="w-3 h-3" /> Select a food item to log:
                          </span>
                          <span>{combinedFoodList.length} matches</span>
                        </div>

                        {combinedFoodList.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No matching items found for &ldquo;{searchQuery}&rdquo;. Try another term or switch categories above.
                          </div>
                        ) : (
                          combinedFoodList.map((item: any) => {
                            const isSelected = selectedFood?.id === item.id;
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleSelectFoodItem(item)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                                  isSelected
                                    ? "bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                                    : "bg-slate-900/70 border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900 text-slate-200"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xl p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                                    {item.emoji || "🍛"}
                                  </span>
                                  <div>
                                    <div className="font-bold text-xs md:text-sm text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                                      {item.name}
                                      {item.isIndian && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                                          Indian
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                      <span>{item.category}</span>
                                      <span>•</span>
                                      <span className="font-mono text-slate-300 font-semibold">{item.serving_unit || `${item.serving_size_g}g`}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right font-mono shrink-0 pl-2">
                                  <div className="text-xs md:text-sm font-black text-cyan-400">
                                    {item.calories} kcal
                                  </div>
                                  <div className="text-[10px] text-emerald-400 font-semibold">
                                    {Math.round(item.protein_g_100g * (item.serving_size_g / 100) * 10) / 10}g P
                                    <span className="text-slate-500 mx-1">|</span>
                                    <span className="text-purple-400">{Math.round(item.carbs_g_100g * (item.serving_size_g / 100) * 10) / 10}g C</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── PORTION CUSTOMIZER & LOG FORM ── */}
                  {selectedFood ? (
                    <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-4 shadow-xl">
                      {/* Selected Food Top Preview */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{selectedFood.emoji || "🍛"}</span>
                          <div>
                            <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">
                              Selected Food Item
                            </span>
                            <h4 className="text-base font-bold text-white">
                              {selectedFood.name}
                            </h4>
                            <span className="text-xs text-slate-400">{selectedFood.category}</span>
                          </div>
                        </div>

                        <div className="flex items-baseline gap-2 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                          <span className="text-xl font-black text-cyan-400">{calculatedCals}</span>
                          <span className="text-xs text-slate-400">kcal for {servingGrams}g</span>
                        </div>
                      </div>

                      {/* Live Macro Breakdown */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center font-mono">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-[10px] text-slate-400 block uppercase">Protein</span>
                          <span className="text-sm font-bold text-emerald-400">{calculatedProt}g</span>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <span className="text-[10px] text-slate-400 block uppercase">Carbs</span>
                          <span className="text-sm font-bold text-purple-400">{calculatedCarbs}g</span>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <span className="text-[10px] text-slate-400 block uppercase">Fat</span>
                          <span className="text-sm font-bold text-amber-400">{calculatedFat}g</span>
                        </div>
                      </div>

                      {/* Quick Gram Preset Chips */}
                      <div>
                        <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                          Quick Portion Selection:
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { label: "1 Serving", grams: selectedFood.serving_size_g || 150 },
                            { label: "50g", grams: 50 },
                            { label: "100g", grams: 100 },
                            { label: "150g", grams: 150 },
                            { label: "200g", grams: 200 },
                            { label: "250g", grams: 250 },
                            { label: "300g", grams: 300 }
                          ].map(chip => (
                            <button
                              key={chip.label}
                              type="button"
                              onClick={() => setServingGrams(chip.grams)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                                servingGrams === chip.grams
                                  ? "bg-emerald-500 text-slate-950 font-bold"
                                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-300 font-semibold block mb-1">
                            Exact Serving Portion (grams):
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="2000"
                            step="10"
                            value={servingGrams}
                            onChange={(e) => setServingGrams(Math.max(1, Number(e.target.value)))}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 font-semibold block mb-1">
                            Meal Category:
                          </label>
                          <select
                            value={mealType}
                            onChange={(e) => setMealType(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500"
                          >
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Snack">Snack</option>
                            <option value="Post-Workout">Post-Workout</option>
                          </select>
                        </div>
                      </div>

                      {/* Photo Upload */}
                      <div>
                        <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-cyan-400" /> Attach Meal Photo (Optional):
                        </label>
                        {mealPhotoPreview ? (
                          <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-800">
                            <img src={mealPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => { setMealPhoto(null); setMealPhotoPreview(null); }}
                              className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full text-white text-xs hover:bg-black"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const f = e.target.files[0];
                                setMealPhoto(f);
                                setMealPhotoPreview(URL.createObjectURL(f));
                              }
                            }}
                            className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200"
                          />
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={handleLogFood}
                        disabled={isLoggingMeal}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                      >
                        {isLoggingMeal ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                            Logging Food to {mealType}...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            Log {servingGrams}g {selectedFood.name} to {mealType}
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                      <p className="text-xs text-slate-400">
                        👆 Click the search bar or pick an Indian dish from the dropdown list to customize portion &amp; log.
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                /* ── CUSTOM MANUAL FOOD ENTRY FORM ── */
                <div className="space-y-4 overflow-y-auto pr-1">
                  {/* Indian Foods Quick Slider Carousel */}
                  <IndianFoodSlider onSelectFood={handleSelectIndianFoodFromSlider} />

                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1">Meal / Food Description:</label>
                    <input
                      type="text"
                      value={customFoodName}
                      onChange={(e) => setCustomFoodName(e.target.value)}
                      placeholder="e.g. Masala Dosa with Sambar or Grilled Chicken Wrap"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Meal Category:</label>
                      <select
                        value={mealType}
                        onChange={(e) => setMealType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                      >
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                        <option value="Snack">Snack</option>
                        <option value="Post-Workout">Post-Workout</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Portion (g):</label>
                      <input
                        type="number"
                        value={servingGrams}
                        onChange={(e) => setServingGrams(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Macros Row */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                    <div>
                      <label className="text-[10px] text-slate-400 block uppercase font-bold">Calories</label>
                      <input
                        type="number"
                        value={customCalories}
                        onChange={(e) => setCustomCalories(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center font-mono text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-emerald-400 block uppercase font-bold">Protein (g)</label>
                      <input
                        type="number"
                        value={customProtein}
                        onChange={(e) => setCustomProtein(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center font-mono text-xs text-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-purple-400 block uppercase font-bold">Carbs (g)</label>
                      <input
                        type="number"
                        value={customCarbs}
                        onChange={(e) => setCustomCarbs(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center font-mono text-xs text-purple-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-amber-400 block uppercase font-bold">Fat (g)</label>
                      <input
                        type="number"
                        value={customFat}
                        onChange={(e) => setCustomFat(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center font-mono text-xs text-amber-400"
                      />
                    </div>
                  </div>

                  {/* Meal Photo */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" /> Attach Meal Photo (Optional):
                    </label>
                    {mealPhotoPreview ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-800">
                        <img src={mealPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setMealPhoto(null); setMealPhotoPreview(null); }}
                          className="absolute top-1 right-1 p-1 bg-black/70 rounded-full text-white text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const f = e.target.files[0];
                            setMealPhoto(f);
                            setMealPhotoPreview(URL.createObjectURL(f));
                          }
                        }}
                        className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200"
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleLogCustomMeal}
                    disabled={isLoggingMeal}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                  >
                    {isLoggingMeal ? "Saving Custom Meal..." : `Log Custom Meal to ${mealType}`}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── MODAL: LOG WEIGHT ── */}
        {showWeightModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-cyan-400" /> Log Body Weight
                </h3>
                <button onClick={() => setShowWeightModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleLogWeightSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Body Weight (kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputWeight}
                    onChange={(e) => setInputWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xl font-mono text-center text-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs"
                >
                  Save Body Weight
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
