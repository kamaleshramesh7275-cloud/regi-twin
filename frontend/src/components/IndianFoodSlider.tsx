import React, { useState, useMemo } from "react";
import { 
  UtensilsCrossed, Plus, Search, Coffee, Moon, Sun, Apple, Check 
} from "lucide-react";
import { indianFoods, type IndianFood } from "../data/indianFoods";

interface IndianFoodSliderProps {
  onSelectFood: (food: IndianFood) => void;
  selectedFoodId?: string | null;
}

const CATEGORY_TABS = [
  { id: "all", label: "All Quick Items", icon: UtensilsCrossed },
  { id: "breakfast", label: "Breakfast", icon: Sun },
  { id: "lunch", label: "Lunch", icon: UtensilsCrossed },
  { id: "dinner", label: "Dinner", icon: Moon },
  { id: "snack", label: "Snacks", icon: Apple },
  { id: "beverage", label: "Beverages", icon: Coffee },
];

const CATEGORY_ICONS: Record<string, string> = {
  breakfast: "🥞",
  lunch: "🍛",
  dinner: "🍲",
  snack: "🥗",
  beverage: "☕",
};

export default function IndianFoodSlider({ onSelectFood, selectedFoodId }: IndianFoodSliderProps) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const filteredFoods = useMemo(() => {
    return indianFoods.filter((f) => {
      const matchesCategory = selectedCat === "all" || f.category === selectedCat;
      const matchesSearch =
        search === "" ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCat]);

  const handleAdd = (food: IndianFood) => {
    onSelectFood(food);
    setJustAddedId(food.id);
    setTimeout(() => {
      setJustAddedId(null);
    }, 1500);
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/20 space-y-3 shadow-inner">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🍛</span>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              Quick Indian Foods &amp; Regional Staples
              <span className="text-[9px] font-normal normal-case px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                approx. macros
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Tap &ldquo;+ Add&rdquo; to pre-fill the form below, then adjust grams or servings.
            </p>
          </div>
        </div>

        {/* Lightweight Search Input */}
        <div className="relative w-full sm:w-48">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter Indian foods..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCat === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCat(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Horizontally Scrollable Slider Carousel */}
      <div className="relative">
        {filteredFoods.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/60">
            No matching Indian foods found. Try typing another term or reset category.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-0.5 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {filteredFoods.map((food) => {
              const isSelected = selectedFoodId === food.id;
              const isAdded = justAddedId === food.id;
              const emoji = CATEGORY_ICONS[food.category] || "🍽️";

              return (
                <div
                  key={food.id}
                  className={`snap-start shrink-0 w-44 rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 border relative group ${
                    isSelected
                      ? "bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10"
                      : "bg-slate-900/90 border-slate-800/90 hover:border-emerald-500/40 hover:bg-slate-900"
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Top Row: Category Icon & Serving */}
                    <div className="flex items-center justify-between">
                      <span className="text-lg" title={food.category}>{emoji}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {food.servingSize}
                      </span>
                    </div>

                    {/* Food Name */}
                    <div className="font-bold text-xs text-white line-clamp-1 group-hover:text-emerald-300 transition-colors" title={food.name}>
                      {food.name}
                    </div>

                    {/* Calories */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black font-mono text-cyan-400">
                        {food.calories}
                      </span>
                      <span className="text-[10px] text-slate-400">kcal</span>
                    </div>

                    {/* Macro Breakdown */}
                    <div className="grid grid-cols-3 gap-1 text-[10px] font-mono pt-1 border-t border-slate-800/80">
                      <div className="text-emerald-400">
                        <span className="text-[8px] text-slate-500 block uppercase">Prot</span>
                        {food.proteinG}g
                      </div>
                      <div className="text-purple-400">
                        <span className="text-[8px] text-slate-500 block uppercase">Carb</span>
                        {food.carbsG}g
                      </div>
                      <div className="text-amber-400">
                        <span className="text-[8px] text-slate-500 block uppercase">Fat</span>
                        {food.fatG}g
                      </div>
                    </div>
                  </div>

                  {/* + Add Quick Button */}
                  <button
                    type="button"
                    onClick={() => handleAdd(food)}
                    className={`mt-2.5 w-full py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                      isAdded
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                        : "bg-slate-800 hover:bg-emerald-500 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-emerald-400"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Added!
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> + Add
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
