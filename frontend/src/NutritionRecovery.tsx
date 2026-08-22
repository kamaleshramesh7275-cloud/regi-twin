import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Apple, Activity, Droplets, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Clock, Flame, Beef, Wheat, Droplet, Zap, HeartPulse, CheckCircle2, Crosshair, Star } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, ScatterChart, Scatter, ZAxis } from "recharts";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";

const PROTEIN_TARGET = 150;
const CALORIE_TARGET = 2400;

function DeficitGauge({ label, value, target, unit, colorClass, bgClass, isOver }: any) {
  const pct = Math.min(100, (value / target) * 100);
  const diff = Math.abs(target - value);
  return (
    <div className={`p-4 rounded-xl border ${bgClass}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-sm">{label}</span>
        <span className={`text-xs font-bold ${colorClass}`}>{isOver ? "+" : "-"}{diff}{unit}</span>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className={`text-2xl font-black font-mono-numbers ${colorClass}`}>{value}</span>
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
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uid = user?.uid || "demo_user";
        const res = await api.getExternalApps(uid);
        const nutritionData = res.filter((r: any) => r.app_name === "HealthifyMe");
        setData(nutritionData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const raw = (data.length > 0 && data[0]?.session_data) ? data[0].session_data : null;
  const nutritionHistory: any[] = raw?.nutrition || [];
  const weeklySummary = raw?.weekly_summary || null;
  
  const dayIdx = selectedDay !== null ? selectedDay : nutritionHistory.length - 1;
  const latest = nutritionHistory.length > 0 ? nutritionHistory[dayIdx] : null;
  
  const proteinDistribution = latest?.meals?.map((m: any) => ({
    name: m.meal,
    protein: m.protein,
    time: m.time
  })) || [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0">
      <Sidebar />
      <main className="flex-1 md:overflow-y-auto p-4 md:p-6 space-y-6 anim-fade relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2"><Apple className="w-6 h-6 text-emerald-500" /> Nutrition & Recovery</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Synced via HealthifyMe — 7-day metabolic intelligence</p>
          </div>
          {weeklySummary && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="badge bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                <TargetIcon className="w-3 h-3 mr-1" /> Targets hit: {weeklySummary.protein_target_hit_days}/7 days
              </span>
            </div>
          )}
        </header>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* Day Selector Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {nutritionHistory.map((d: any, i: number) => (
                <button key={d.day} onClick={() => setSelectedDay(i)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    dayIdx === i
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                      : "bg-card border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  }`}>
                  {d.day}
                  <span className="ml-1.5 font-mono-numbers opacity-70">{d.calories}</span>
                </button>
              ))}
            </div>

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
                      {latest?.food_quality_score >= 80 && <span className="badge bg-emerald-500/20 text-emerald-400 border-none text-[10px] px-1.5 py-0">Optimal</span>}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {latest?.recovery_note || "Nutrition data is synced and ready for analysis."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Food Quality Score */}
              <div className="glass-panel flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="36" fill="none" stroke={latest?.food_quality_score >= 80 ? "#10b981" : "#f59e0b"} strokeWidth="6"
                      strokeDasharray={226} strokeDashoffset={226 - (latest?.food_quality_score / 100) * 226} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono-numbers text-lg font-black">{latest?.food_quality_score}</span>
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" /> Food Quality
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Based on micronutrient density, whole foods ratio, and fiber content.</p>
                </div>
              </div>
            </div>

            {/* Deficit/Surplus Gauges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <DeficitGauge label="Calories" value={latest?.calories} target={CALORIE_TARGET} unit="kcal" 
                colorClass={latest?.calories > CALORIE_TARGET ? "text-blue-400" : "text-emerald-400"} 
                bgClass={latest?.calories > CALORIE_TARGET ? "bg-blue-500/5 border-blue-500/20" : "bg-emerald-500/5 border-emerald-500/20"} 
                isOver={latest?.calories > CALORIE_TARGET} />
                
              <DeficitGauge label="Protein" value={latest?.protein} target={PROTEIN_TARGET} unit="g" 
                colorClass={latest?.protein >= PROTEIN_TARGET ? "text-emerald-400" : "text-amber-400"} 
                bgClass={latest?.protein >= PROTEIN_TARGET ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"} 
                isOver={latest?.protein >= PROTEIN_TARGET} />
                
              <div className="glass-panel text-center py-4">
                <Droplets className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                <div className="text-xl font-black font-mono-numbers text-cyan-400">{(latest?.water_ml || 0) / 1000}L</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Hydration ({latest?.hydration})</div>
              </div>
              
              <div className="glass-panel text-center py-4">
                <Activity className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                <div className="text-xl font-black font-mono-numbers text-purple-400">{latest?.fiber || 0}g</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Dietary Fiber</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Protein Distribution */}
              <div className="glass-panel h-80 flex flex-col">
                <div className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Beef className="w-4 h-4 text-emerald-400" /> Protein Distribution (MPS Threshold)
                </div>
                <p className="text-xs text-muted-foreground mb-4">Muscle Protein Synthesis (MPS) maximizes at ~30g per meal.</p>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={proteinDistribution} margin={{ left: -25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="time" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}g`} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: 'none', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: 'Optimal MPS', fill: '#10b981', fontSize: 10 }} />
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
                  <HeartPulse className="w-4 h-4 text-rose-400" /> Micronutrient Readiness
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  <MicronutrientBar name="Iron (O2 Transport)" pct={latest?.micronutrients?.iron_pct || 0} />
                  <MicronutrientBar name="Calcium (Bone & Contraction)" pct={latest?.micronutrients?.calcium_pct || 0} />
                  <MicronutrientBar name="Magnesium (CNS Recovery)" pct={latest?.micronutrients?.magnesium_pct || 0} />
                  <MicronutrientBar name="Potassium (Electrolyte Bal)" pct={latest?.micronutrients?.potassium_pct || 0} />
                  <MicronutrientBar name="Vitamin D (Testosterone/Bone)" pct={latest?.micronutrients?.vit_d_pct || 0} />
                  <MicronutrientBar name="Vitamin B12 (Energy)" pct={latest?.micronutrients?.vit_b12_pct || 0} />
                </div>
              </div>

            </div>

            {/* Daily Meals Timeline */}
            <div className="glass-panel">
              <div className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Meal Timing & Composition
              </div>
              <div className="space-y-3">
                {latest?.meals?.map((meal: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                    <div className="w-12 text-xs font-mono-numbers text-muted-foreground">{meal.time}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{meal.meal}</div>
                      <div className="text-xs text-muted-foreground truncate">{meal.items}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono-numbers">{meal.kcal} <span className="text-[10px] text-muted-foreground">kcal</span></div>
                      <div className="text-xs font-mono-numbers text-emerald-400">{meal.protein}g protein</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

function TargetIcon(props: any) {
  return <Crosshair {...props} />;
}
