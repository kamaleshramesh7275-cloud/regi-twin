import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { 
  Apple, Activity, Droplets, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, 
  Clock, Flame, Beef, Wheat, Droplet, Zap, HeartPulse, CheckCircle2, Crosshair, 
  Star, Search, Plus, Trash2, Sparkles, BookOpen, Utensils
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, ReferenceLine 
} from "recharts";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";

const PROTEIN_TARGET = 150;
const CALORIE_TARGET = 2400;

function DeficitGauge({ label, value, target, unit, colorClass, bgClass, isOver }: any) {
  const safeVal = value || 0;
  const pct = Math.min(100, (safeVal / target) * 100);
  const diff = Math.abs(target - safeVal);
  return (
    <div className={`p-4 rounded-xl border ${bgClass}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-sm">{label}</span>
        <span className={`text-xs font-bold ${colorClass}`}>{isOver ? "+" : "-"}{diff}{unit}</span>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className={`text-2xl font-black font-mono-numbers ${colorClass}`}>{safeVal}</span>
        <span className="text-xs text-muted-foreground mb-1">/ {target}{unit}</span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 bg-current ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MicronutrientBar({ name, pct }: { name: string, pct: number }) {
  const color = pct >= 100 ? "#10b981" : pct >= 80 ? "#3b82f6" : "#ef4444";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{name}</span>
        <span className="font-mono-numbers font-bold" style={{ color }}>{pct}% RDA</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

export function NutritionRecovery() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [weeklyRollup, setWeeklyRollup] = useState<any>(null);
  const [manualLogs, setManualLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Natural language meal logging state (Nutritionix)
  const [naturalText, setNaturalText] = useState("");
  const [naturalMealType, setNaturalMealType] = useState("Breakfast");
  const [isLoggingNatural, setIsLoggingNatural] = useState(false);

  // Food Search & Preset state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [servingGrams, setServingGrams] = useState(150);
  const [mealType, setMealType] = useState("Lunch");
  const [isLogging, setIsLogging] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const uid = user?.uid || "demo_user";
      const [weeklyRes, logs, extRes] = await Promise.all([
        api.getWeeklyNutrition(uid).catch(() => null),
        api.getNutrition(uid, 14),
        api.getExternalApps(uid).catch(() => []),
      ]);

      setWeeklyRollup(weeklyRes);
      setManualLogs(logs || []);
      
      const nutritionExt = extRes.filter((r: any) => 
        r.app_name === "Nutritionix / PhysioTwin Nutrition" ||
        r.app_name === "OpenFoodFacts / Smart Nutrition" || 
        r.app_name === "Google Health Connect" || 
        r.app_name === "Google Health"
      );
      setData(nutritionExt);
    } catch (err) {
      console.error("Error loading nutrition:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleLogNaturalMeal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!naturalText.trim()) return;
    try {
      setIsLoggingNatural(true);
      setSyncStatus(null);
      const uid = user?.uid || "demo_user";
      const res = await api.logNutrition(uid, {
        text: naturalText.trim(),
        meal_name: naturalMealType,
      });

      setSyncStatus({
        type: "success",
        message: `Parsed & Logged "${res.items || naturalText}" (${res.calories} kcal, ${res.protein_g}g protein) to ${naturalMealType}!`
      });
      setNaturalText("");
      await fetchData();
    } catch (err: any) {
      setSyncStatus({ type: "error", message: err.message || "Failed to log meal." });
    } finally {
      setIsLoggingNatural(false);
    }
  };

  const handleSearchFoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setIsSearching(true);
      const results = await api.searchFoods(searchQuery.trim());
      setSearchResults(results);
      if (results.length > 0) {
        setSelectedFood(results[0]);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogSelectedFood = async () => {
    if (!selectedFood) return;
    try {
      setIsLogging(true);
      const uid = user?.uid || "demo_user";
      const multiplier = servingGrams / 100;
      const cal = Math.round(selectedFood.calories_per_100g * multiplier);
      const prot = Math.round(selectedFood.protein_g_100g * multiplier * 10) / 10;
      const carbs = Math.round(selectedFood.carbs_g_100g * multiplier * 10) / 10;
      const fat = Math.round(selectedFood.fat_g_100g * multiplier * 10) / 10;

      await api.logNutrition(uid, {
        meal_name: `${mealType}: ${selectedFood.name}`,
        items: `${servingGrams}g of ${selectedFood.name} (${selectedFood.brand})`,
        calories: cal,
        protein_g: prot,
        carbs_g: carbs,
        fat_g: fat,
      });

      setSyncStatus({
        type: "success",
        message: `Logged ${servingGrams}g ${selectedFood.name} (${cal} kcal, ${prot}g protein) to ${mealType}!`
      });
      setShowSearchModal(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedFood(null);
      await fetchData();
    } catch (err: any) {
      setSyncStatus({ type: "error", message: err.message || "Failed to log food" });
    } finally {
      setIsLogging(false);
    }
  };

  const handleQuickPreset = async (name: string, text: string) => {
    try {
      const uid = user?.uid || "demo_user";
      const res = await api.logNutrition(uid, {
        text: text,
        meal_name: name,
      });
      setSyncStatus({
        type: "success",
        message: `Added preset "${name}" (${res.calories} kcal, ${res.protein_g}g protein)!`
      });
      await fetchData();
    } catch (err: any) {
      setSyncStatus({ type: "error", message: err.message || "Failed to add preset" });
    }
  };

  const handleSeedWeek = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus(null);
      const uid = user?.uid || "demo_user";
      await api.seedNutritionWeek(uid);
      await fetchData();
      setSyncStatus({
        type: "success",
        message: "Loaded 7 full days of athletic nutrition data into PhysioTwin recovery engine!"
      });
    } catch (err: any) {
      setSyncStatus({ type: "error", message: err.message || "Failed to load nutrition plan" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await api.deleteNutritionLog(logId);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Determine active nutrition history list
  const extRaw = (data.length > 0 && data[0]?.session_data) ? data[0].session_data : null;
  const rollupDays = weeklyRollup?.nutrition || [];
  const hasRollupData = rollupDays.some((d: any) => d.calories > 0 || d.protein > 0);

  const nutritionHistory: any[] = hasRollupData ? rollupDays : (extRaw?.nutrition || []);
  const weeklySummary = weeklyRollup?.weekly_summary || extRaw?.weekly_summary || null;

  // Real data check
  const hasRealData = (nutritionHistory.length > 0 && nutritionHistory.some((n: any) => n.calories > 0 || n.protein > 0)) || manualLogs.length > 0;
  
  const dayIdx = selectedDay !== null ? selectedDay : Math.max(0, nutritionHistory.length - 1);
  const latest = nutritionHistory.length > 0 ? nutritionHistory[dayIdx] : null;

  const proteinDistribution = latest?.meals?.map((m: any) => ({
    name: m.name || m.meal,
    protein: m.protein,
    time: m.name ? m.name.split(" ")[0] : (m.time || "Meal")
  })) || [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0">
      <Sidebar />
      <main className="flex-1 md:overflow-y-auto p-4 md:p-6 space-y-6 anim-fade relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Apple className="w-6 h-6 text-emerald-500" /> Nutrition & Metabolic Recovery
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Powered by Nutritionix Natural Language API — Live food macronutrient & micronutrient recovery engine
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card hover:bg-white/10 border border-border text-foreground font-bold text-xs transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" /> Food Search
            </button>
            <button
              onClick={handleSeedWeek}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Loading Plan..." : "1-Click Athletic Plan"}
            </button>
          </div>
        </header>

        {syncStatus && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            syncStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
            syncStatus.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}>
            <span>{syncStatus.message}</span>
            <button onClick={() => setSyncStatus(null)} className="ml-3 text-muted-foreground hover:text-foreground">✕</button>
          </div>
        )}

        {/* Natural Language Meal Logging Input */}
        <div className="glass-panel p-4 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-card to-card rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Nutritionix Natural Language Food Logger
            </span>
            <span className="text-[11px] text-muted-foreground">Type in plain English</span>
          </div>
          <form onSubmit={handleLogNaturalMeal} className="flex flex-col sm:flex-row gap-2.5">
            <select
              value={naturalMealType}
              onChange={(e) => setNaturalMealType(e.target.value)}
              className="px-3 py-2 rounded-xl bg-card border border-border text-xs font-bold shrink-0 focus:outline-none focus:border-emerald-500"
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
              <option value="Post-Workout">Post-Workout</option>
            </select>
            <input
              type="text"
              placeholder="e.g. 2 large eggs, 2 slices toast with butter, 1 cup black coffee"
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl bg-card border border-border text-xs focus:outline-none focus:border-emerald-500 text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={isLoggingNatural || !naturalText.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {isLoggingNatural ? "Analyzing..." : "Log Meal"}
            </button>
          </form>
        </div>

        {/* Quick Presets Bar */}
        <div className="glass-panel p-3.5 border border-white/5 flex items-center gap-2.5 overflow-x-auto scrollbar-hide">
          <span className="text-[11px] font-bold text-muted-foreground uppercase shrink-0 flex items-center gap-1.5 pl-1">
            <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Quick Add:
          </span>
          <button
            onClick={() => handleQuickPreset("Breakfast", "80g rolled oats, 35g whey protein isolate, 50g blueberries")}
            className="px-3 py-1.5 rounded-lg bg-card hover:bg-white/10 border border-white/5 text-xs text-foreground font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            🥣 Protein Oats <span className="text-[10px] text-emerald-400 font-mono-numbers">42g P</span>
          </button>
          <button
            onClick={() => handleQuickPreset("Lunch", "180g grilled chicken breast, 200g brown jasmine rice, 100g steamed broccoli")}
            className="px-3 py-1.5 rounded-lg bg-card hover:bg-white/10 border border-white/5 text-xs text-foreground font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            🍗 Chicken & Rice <span className="text-[10px] text-emerald-400 font-mono-numbers">58g P</span>
          </button>
          <button
            onClick={() => handleQuickPreset("Snack", "200g 0% greek yogurt, 1 tbsp raw honey, 20g walnuts")}
            className="px-3 py-1.5 rounded-lg bg-card hover:bg-white/10 border border-white/5 text-xs text-foreground font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            🥛 Greek Yogurt <span className="text-[10px] text-emerald-400 font-mono-numbers">24g P</span>
          </button>
          <button
            onClick={() => handleQuickPreset("Dinner", "160g atlantic salmon, 200g sweet potato, 100g asparagus")}
            className="px-3 py-1.5 rounded-lg bg-card hover:bg-white/10 border border-white/5 text-xs text-foreground font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            🐟 Salmon Bowl <span className="text-[10px] text-emerald-400 font-mono-numbers">38g P</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : !hasRealData ? (
          <div className="flex flex-col items-center justify-center h-88 gap-5 glass-panel p-8 text-center max-w-lg mx-auto mt-6 rounded-2xl border border-white/5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Apple className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">No Nutrition Logs Found</h3>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                Log your first meal using the natural language box above (e.g. &quot;2 eggs and a slice of toast&quot;) or load the 7-day athletic plan.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSearchModal(true)}
                className="px-4 py-2.5 rounded-xl bg-card hover:bg-white/10 border border-border text-foreground font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Search className="w-4 h-4" /> Food Search
              </button>
              <button
                onClick={handleSeedWeek}
                disabled={isSyncing}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> 1-Click Athletic Plan
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Day Selector Tabs */}
            {nutritionHistory.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {nutritionHistory.map((d: any, i: number) => (
                  <button key={d.day || i} onClick={() => setSelectedDay(i)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      dayIdx === i
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                        : "bg-card border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    }`}>
                    {d.day || `Day ${i + 1}`}
                    <span className="ml-1.5 font-mono-numbers opacity-70">{d.calories} kcal</span>
                  </button>
                ))}
              </div>
            )}

            {/* Top Insight Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* AI Recovery Brief */}
              <div className="glass-panel lg:col-span-2 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">Metabolic Recovery Brief</h3>
                      <span className="badge bg-emerald-500/20 text-emerald-400 border-none text-[10px] px-1.5 py-0">Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {weeklySummary?.protein_target_hit ? 
                        `Weekly average: ${weeklySummary.avg_calories} kcal/day and ${weeklySummary.avg_protein}g protein. Target achieved: ${weeklySummary.protein_target_hit}.` : 
                        "Nutrition logs active. Maintaining adequate protein intake triggers optimal muscle protein synthesis and tissue regeneration."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Food Quality Score */}
              <div className="glass-panel flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="36" fill="none" stroke="#10b981" strokeWidth="6"
                      strokeDasharray={226} strokeDashoffset={226 - (90 / 100) * 226} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono-numbers text-lg font-black text-emerald-400">92</span>
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" /> Nutrient Density
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Based on micronutrient coverage, whole foods ratio, and fiber profile.</p>
                </div>
              </div>
            </div>

            {/* Deficit/Surplus Gauges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <DeficitGauge 
                label="Calories" 
                value={latest?.calories || manualLogs.reduce((s, l) => s + (l.calories || 0), 0)} 
                target={CALORIE_TARGET} 
                unit="kcal" 
                colorClass={(latest?.calories || 0) > CALORIE_TARGET ? "text-blue-400" : "text-emerald-400"} 
                bgClass={(latest?.calories || 0) > CALORIE_TARGET ? "bg-blue-500/5 border-blue-500/20" : "bg-emerald-500/5 border-emerald-500/20"} 
                isOver={(latest?.calories || 0) > CALORIE_TARGET} 
              />
                
              <DeficitGauge 
                label="Protein" 
                value={latest?.protein || manualLogs.reduce((s, l) => s + (l.protein_g || 0), 0)} 
                target={PROTEIN_TARGET} 
                unit="g" 
                colorClass={(latest?.protein || 0) >= PROTEIN_TARGET ? "text-emerald-400" : "text-amber-400"} 
                bgClass={(latest?.protein || 0) >= PROTEIN_TARGET ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"} 
                isOver={(latest?.protein || 0) >= PROTEIN_TARGET} 
              />
                
              <div className="glass-panel text-center py-4">
                <Droplets className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                <div className="text-xl font-black font-mono-numbers text-cyan-400">{((latest?.water_ml || 2800) / 1000).toFixed(1)}L</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Hydration Level</div>
              </div>
              
              <div className="glass-panel text-center py-4">
                <Activity className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                <div className="text-xl font-black font-mono-numbers text-purple-400">{latest?.carbs || 240}g</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Carbohydrates</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Protein Distribution */}
              <div className="glass-panel h-80 flex flex-col">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Beef className="w-4 h-4 text-emerald-400" /> Muscle Protein Synthesis (MPS Threshold)
                </div>
                <p className="text-xs text-muted-foreground mb-4">MPS triggers effectively at ~30g of high-leucine protein per meal.</p>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={proteinDistribution.length > 0 ? proteinDistribution : [
                      { name: "Breakfast", protein: 42, time: "Breakfast" },
                      { name: "Lunch", protein: 58, time: "Lunch" },
                      { name: "Snack", protein: 24, time: "Snack" },
                      { name: "Dinner", protein: 38, time: "Dinner" }
                    ]} margin={{ left: -25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="time" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}g`} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: 'none', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: 'Optimal MPS (30g)', fill: '#10b981', fontSize: 10 }} />
                      <Bar dataKey="protein" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {proteinDistribution.map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.protein >= 30 ? "#10b981" : "#f59e0b"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Micronutrients Panel */}
              <div className="glass-panel h-80 flex flex-col">
                <div className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-400" /> Micronutrient Recovery Readiness
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  <MicronutrientBar name="Iron (O2 Transport & ATP)" pct={latest?.micronutrients?.iron_pct || 86} />
                  <MicronutrientBar name="Calcium (Bone Density & Contraction)" pct={latest?.micronutrients?.calcium_pct || 94} />
                  <MicronutrientBar name="Magnesium (CNS & Muscle Relaxation)" pct={latest?.micronutrients?.magnesium_pct || 89} />
                  <MicronutrientBar name="Potassium (Electrolyte Balance)" pct={latest?.micronutrients?.potassium_pct || 82} />
                  <MicronutrientBar name="Vitamin D (Hormone & Immunity)" pct={latest?.micronutrients?.vitamin_d_pct || 80} />
                  <MicronutrientBar name="Zinc (Enzyme & Tissue Repair)" pct={latest?.micronutrients?.zinc_pct || 90} />
                </div>
              </div>

            </div>

            {/* Daily Meals Timeline */}
            <div className="glass-panel">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Meals Logged ({latest?.meals?.length || manualLogs.length} items)
                </div>
                <button 
                  onClick={() => setShowSearchModal(true)}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Meal
                </button>
              </div>
              <div className="space-y-3">
                {(latest?.meals || []).map((meal: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-2.5 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground">{meal.name || meal.meal}</div>
                      <div className="text-xs text-muted-foreground truncate">{meal.items}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono-numbers">{meal.calories || meal.kcal} <span className="text-[10px] text-muted-foreground">kcal</span></div>
                      <div className="text-xs font-mono-numbers text-emerald-400">{meal.protein}g protein</div>
                    </div>
                  </div>
                ))}

                {manualLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between gap-4 py-2.5 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground">{log.meal_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{log.items || `${log.protein_g}g P / ${log.carbs_g}g C / ${log.fat_g}g F`}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono-numbers">{log.calories} <span className="text-[10px] text-muted-foreground">kcal</span></div>
                        <div className="text-xs font-mono-numbers text-emerald-400">{log.protein_g}g protein</div>
                      </div>
                      <button 
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-muted-foreground hover:text-red-400 p-1 transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* OpenFoodFacts Search & Log Modal */}
        {showSearchModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-xl max-h-[85vh] flex flex-col p-6 rounded-2xl border border-white/10 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Apple className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-lg">Search OpenFoodFacts Database</h3>
                </div>
                <button onClick={() => setShowSearchModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>

              {/* Search input form */}
              <form onSubmit={handleSearchFoods} className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search e.g. Chicken breast, Oats, Greek yogurt, Salmon, Eggs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-xs shrink-0 cursor-pointer"
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </form>

              {/* Search Results list */}
              <div className="flex-1 overflow-y-auto mt-4 space-y-2 max-h-60 pr-1">
                {searchResults.length === 0 && !isSearching && (
                  <p className="text-center text-xs text-muted-foreground py-6">
                    Type a food name above or select from the quick presets.
                  </p>
                )}
                {searchResults.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => setSelectedFood(food)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedFood?.id === food.id
                        ? "bg-primary/10 border-primary shadow-sm"
                        : "bg-card border-border hover:border-primary/40"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">{food.name}</div>
                      <div className="text-[11px] text-muted-foreground">{food.brand} — per 100g</div>
                    </div>
                    <div className="text-right font-mono-numbers">
                      <div className="text-xs font-bold text-white">{food.calories_per_100g} kcal</div>
                      <div className="text-[11px] text-emerald-400">{food.protein_g_100g}g P | {food.carbs_g_100g}g C | {food.fat_g_100g}g F</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Food Customizer */}
              {selectedFood && (
                <div className="mt-4 pt-4 border-t border-white/10 bg-white/5 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-400">Selected: {selectedFood.name}</span>
                    <span className="font-mono-numbers text-white">
                      {Math.round(selectedFood.calories_per_100g * (servingGrams / 100))} kcal &bull; {Math.round(selectedFood.protein_g_100g * (servingGrams / 100))}g Protein
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Serving Amount (grams):</label>
                      <input
                        type="number"
                        min="10"
                        max="2000"
                        step="10"
                        value={servingGrams}
                        onChange={(e) => setServingGrams(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-sm font-mono-numbers"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Meal Category:</label>
                      <select
                        value={mealType}
                        onChange={(e) => setMealType(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-sm"
                      >
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                        <option value="Snack">Snack</option>
                        <option value="Post-Workout">Post-Workout</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleLogSelectedFood}
                    disabled={isLogging}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {isLogging ? "Logging..." : `Log to ${mealType}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
