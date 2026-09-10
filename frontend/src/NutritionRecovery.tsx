import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { 
  Apple, Droplets, TrendingUp, Sparkles, Plus, Trash2, 
  Camera, Clock, Flame, Beef, Wheat, Droplet, HeartPulse, 
  CheckCircle2, Search, Utensils, Scale, ChevronRight
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, ReferenceLine 
} from "recharts";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";
import IndianFoodSlider from "./components/IndianFoodSlider";
import type { IndianFood } from "./data/indianFoods";

const TARGETS = {
  calories: 2400,
  protein: 150,
  carbs: 250,
  fat: 65,
  water: 3000
};

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
  const userId = user?.uid || "default_user";

  const [dailyData, setDailyData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Food Search & Logger Modal
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [modalTab, setModalTab] = useState<'database' | 'custom'>('database');
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [servingGrams, setServingGrams] = useState(150);
  const [mealType, setMealType] = useState("Lunch");
  const [mealPhoto, setMealPhoto] = useState<File | null>(null);
  const [mealPhotoPreview, setMealPhotoPreview] = useState<string | null>(null);
  const [isLoggingMeal, setIsLoggingMeal] = useState(false);

  // Custom manual entry states
  const [customFoodName, setCustomFoodName] = useState("");
  const [customCalories, setCustomCalories] = useState(450);
  const [customProtein, setCustomProtein] = useState(35);
  const [customCarbs, setCustomCarbs] = useState(45);
  const [customFat, setCustomFat] = useState(12);

  // Water Quick Log
  const [waterMl, setWaterMl] = useState(0);

  // Weight Log Modal
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [inputWeight, setInputWeight] = useState(72.5);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [daily, weekly, weights] = await Promise.all([
        api.getDailyNutrition(userId).catch(() => null),
        api.getWeeklyNutrition(userId).catch(() => null),
        api.getWeightHistory(userId).catch(() => [])
      ]);

      setDailyData(daily);
      setWeeklyData(weekly);
      setWeightHistory(weights || []);
      setWaterMl(daily?.water_ml || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setIsSearching(true);
      const results = await api.searchFoods(searchQuery.trim());
      setSearchResults(results);
      if (results.length > 0) setSelectedFood(results[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogFood = async () => {
    if (!selectedFood) return;
    try {
      setIsLoggingMeal(true);
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

      const logRes = await api.logNutrition(userId, {
        meal_type: mealType,
        items: [item]
      });

      if (mealPhoto && logRes.id) {
        await api.uploadMealImage(logRes.id, mealPhoto);
      }

      setStatusMsg({
        type: "success",
        message: `Logged ${servingGrams}g ${selectedFood.name} (${cal} kcal, ${prot}g protein) to ${mealType}!`
      });

      setShowSearchModal(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedFood(null);
      setMealPhoto(null);
      setMealPhotoPreview(null);
      await fetchData();
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to log food" });
    } finally {
      setIsLoggingMeal(false);
    }
  };

  const handleLogCustomMeal = async () => {
    if (!customFoodName.trim()) {
      setStatusMsg({ type: "error", message: "Please enter a food or meal name" });
      return;
    }
    try {
      setIsLoggingMeal(true);
      const item = {
        name: customFoodName.trim(),
        portion_g: servingGrams,
        calories: Number(customCalories) || 0,
        protein_g: Number(customProtein) || 0,
        carbs_g: Number(customCarbs) || 0,
        fat_g: Number(customFat) || 0,
        micros: {}
      };

      const logRes = await api.logNutrition(userId, {
        meal_type: mealType,
        items: [item]
      });

      if (mealPhoto && logRes.id) {
        await api.uploadMealImage(logRes.id, mealPhoto);
      }

      setStatusMsg({
        type: "success",
        message: `Logged "${customFoodName}" (${customCalories} kcal, ${customProtein}g P) to ${mealType}!`
      });

      setShowSearchModal(false);
      setCustomFoodName("");
      setMealPhoto(null);
      setMealPhotoPreview(null);
      await fetchData();
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to log custom meal" });
    } finally {
      setIsLoggingMeal(false);
    }
  };

  const handleSelectIndianFood = (food: IndianFood) => {
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
      const res = await api.logWater(userId, amount);
      setWaterMl(res.total_water_ml);
      setStatusMsg({ type: "success", message: `Added ${amount}ml water!` });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleLogWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.logWeight(userId, Number(inputWeight));
      setShowWeightModal(false);
      setStatusMsg({ type: "success", message: `Logged body weight: ${inputWeight} kg` });
      await fetchData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSeedWeek = async () => {
    try {
      setIsSeeding(true);
      setStatusMsg(null);
      await api.seedNutritionWeek(userId);
      await fetchData();
      setStatusMsg({
        type: "success",
        message: "Loaded 7 full days of native athletic meal logs into PhysioTwin recovery engine!"
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to seed nutrition" });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteMeal = async (logId: string) => {
    if (!confirm("Delete this meal entry?")) return;
    try {
      await api.deleteNutritionLog(logId);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const currentCals = dailyData?.totals?.calories || 0;
  const currentProt = dailyData?.totals?.protein_g || 0;
  const currentCarbs = dailyData?.totals?.carbs_g || 0;
  const currentFat = dailyData?.totals?.fat_g || 0;
  const mealsList = dailyData?.meals || [];
  const micros = dailyData?.totals?.micros || {};

  const hasData = (dailyData && dailyData.meals && dailyData.meals.length > 0) || (weeklyData && weeklyData.nutrition && weeklyData.nutrition.length > 0);

  // 7-Day Protein & Calorie distribution chart
  const weeklyDays = weeklyData?.nutrition || [];
  const chartDays = weeklyDays.map((d: any) => ({
    day: d.day_name,
    date: d.date,
    calories: d.calories,
    protein: d.protein,
    carbs: d.carbs
  }));

  // MPS breakdown per meal
  const mpsData = mealsList.map((m: any) => ({
    name: m.meal_type,
    protein: m.protein_g,
    calories: m.calories
  }));

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
                <Flame className="w-3.5 h-3.5" /> Muscle Protein Synthesis & Micronutrients
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 mt-1 text-white">
              <Apple className="w-7 h-7 text-emerald-400" /> Nutrition & Metabolic Recovery
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Built-in food catalog, macro rings, photo logging, hydration & body weight trends.
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
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/25"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Log Meal Manually
            </button>
          </div>
        </header>

        {statusMsg && (
          <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <span>{statusMsg.message}</span>
            <button onClick={() => setStatusMsg(null)} className="ml-3 text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          </div>
        ) : !hasData ? (
          /* HONEST EMPTY STATE */
          <div className="flex flex-col items-center justify-center p-10 bg-slate-900/60 rounded-3xl border border-slate-800 text-center max-w-lg mx-auto mt-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Apple className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">No Nutrition Logs Found</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Log your first meal using the built-in food search or load 7 full days of athletic nutrition data.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center pt-2">
              <button
                onClick={() => setShowSearchModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Search & Log Food
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
              <MacroRing label="Calories" current={currentCals} target={TARGETS.calories} unit="kcal" color="#06b6d4" />
              <MacroRing label="Protein" current={currentProt} target={TARGETS.protein} unit="g" color="#10b981" />
              <MacroRing label="Carbohydrates" current={currentCarbs} target={TARGETS.carbs} unit="g" color="#a855f7" />
              <MacroRing label="Healthy Fats" current={currentFat} target={TARGETS.fat} unit="g" color="#f59e0b" />
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
                    <span className="text-xs text-slate-400">/ {TARGETS.water} ml goal ({Math.min(100, Math.round((waterMl / TARGETS.water) * 100))}%)</span>
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
                    <BarChart data={mpsData.length > 0 ? mpsData : [{ name: 'Lunch', protein: 45 }]} margin={{ left: -20, right: 10 }}>
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
                  <Clock className="w-4 h-4 text-emerald-400" /> Today's Meal Timeline ({mealsList.length} logged)
                </h3>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Meal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mealsList.map((m: any) => (
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
                    <p className="text-xs text-slate-400">Tracking long-term mass & body composition adaptations</p>
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

        {/* ── MODAL: LOG MEAL & FOOD DATABASE ── */}
        {showSearchModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col max-h-[85vh] space-y-4 shadow-2xl">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Apple className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-xl font-bold text-white">Log Meal Manually</h3>
                </div>
                <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {/* Mode Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalTab('database')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    modalTab === 'database' ? 'bg-slate-800 text-emerald-400 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 inline mr-1" /> Search Food Database
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('custom')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    modalTab === 'custom' ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Custom Food Entry
                </button>
              </div>

              {modalTab === 'database' ? (
                <>
                  {/* Search Form */}
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search foods (e.g. Chicken breast, Oats, Eggs, Salmon)..."
                      className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:border-emerald-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                    >
                      {isSearching ? "Searching..." : "Search"}
                    </button>
                  </form>

                  {/* Results */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-52">
                    {searchResults.length === 0 && !isSearching && (
                      <p className="text-center text-xs text-slate-500 py-6">
                        Type a food name above to browse hundreds of calorie-accurate whole foods.
                      </p>
                    )}
                    {searchResults.map(f => (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFood(f)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          selectedFood?.id === f.id
                            ? "bg-emerald-500/10 border-emerald-500 text-white"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div>
                          <strong className="text-sm text-white block">{f.name}</strong>
                          <span className="text-xs text-slate-400 capitalize">{f.category} • {f.serving_size_g}g serving</span>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <div className="font-bold text-white">{f.calories_per_100g} kcal/100g</div>
                          <div className="text-emerald-400">{f.protein_g_100g}g P | {f.carbs_g_100g}g C | {f.fat_g_100g}g F</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Portion Customizer & Photo Upload */}
                  {selectedFood && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400">Selected: {selectedFood.name}</span>
                        <span className="font-mono text-white font-bold">
                          {Math.round(selectedFood.calories_per_100g * (servingGrams / 100))} kcal • {Math.round(selectedFood.protein_g_100g * (servingGrams / 100))}g Protein
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Serving Amount (grams):</label>
                          <input
                            type="number"
                            min="10"
                            max="2000"
                            step="10"
                            value={servingGrams}
                            onChange={(e) => setServingGrams(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Meal Category:</label>
                          <select
                            value={mealType}
                            onChange={(e) => setMealType(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm"
                          >
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Snack">Snack</option>
                            <option value="Post-Workout">Post-Workout</option>
                          </select>
                        </div>
                      </div>

                      {/* Meal Photo */}
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-cyan-400" /> Attach Meal Photo (Local):
                        </label>
                        {mealPhotoPreview ? (
                          <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-800">
                            <img src={mealPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
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
                        onClick={handleLogFood}
                        disabled={isLoggingMeal}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20"
                      >
                        {isLoggingMeal ? "Logging..." : `Log ${servingGrams}g to ${mealType}`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* ── CUSTOM MANUAL FOOD ENTRY FORM ── */
                <div className="space-y-4 overflow-y-auto pr-1">
                  {/* Indian Foods Quick Slider */}
                  <IndianFoodSlider onSelectFood={handleSelectIndianFood} />

                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1">Meal / Food Description:</label>
                    <input
                      type="text"
                      value={customFoodName}
                      onChange={(e) => setCustomFoodName(e.target.value)}
                      placeholder="e.g. Grilled Chicken Wrap with Avocado"
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
                      <Camera className="w-3.5 h-3.5 text-cyan-400" /> Attach Meal Photo (Local):
                    </label>
                    {mealPhotoPreview ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-800">
                        <img src={mealPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
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
                    onClick={handleLogCustomMeal}
                    disabled={isLoggingMeal}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20"
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
