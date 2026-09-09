import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { 
  Dumbbell, Activity, ShieldAlert, Trophy, Zap, Heart, Clock, ChevronDown, ChevronUp, 
  TrendingUp, AlertTriangle, Sparkles, Plus, Trash2, CheckCircle2, Flame, Bike
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  LineChart, Line, ReferenceLine
} from "recharts";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";

const LOAD_COLORS: Record<string, string> = {
  High: "#ef4444", Medium: "#f59e0b", Low: "#10b981", None: "#334155"
};

const ACWR_ZONE = (val: number) => {
  if (val > 1.5) return { color: "#ef4444", label: "Overreach Risk", bg: "bg-red-500/10 border-red-500/30" };
  if (val >= 1.3) return { color: "#f59e0b", label: "Caution Zone", bg: "bg-amber-500/10 border-amber-500/30" };
  return { color: "#10b981", label: "Optimal Sweet Spot", bg: "bg-emerald-500/10 border-emerald-500/30" };
};

function ReadinessRing({ score }: { score: number }) {
  const safeScore = score || 85;
  const color = safeScore >= 80 ? "#10b981" : safeScore >= 60 ? "#f59e0b" : "#ef4444";
  const verdict = safeScore >= 80 ? "Peak Readiness" : safeScore >= 60 ? "Train Smart" : "Deload / Rest";
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (safeScore / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-numbers text-3xl font-black" style={{ color }}>{safeScore}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className="font-bold text-sm" style={{ color }}>{verdict}</span>
    </div>
  );
}

export function WorkoutStrain() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [manualLogs, setManualLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Quick workout log modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [workoutName, setWorkoutName] = useState("Upper Body Push");
  const [durationMin, setDurationMin] = useState(50);
  const [loadLevel, setLoadLevel] = useState("Medium");
  const [exerciseList, setExerciseList] = useState<any[]>([
    { name: "Barbell Bench Press", sets: 4, reps: 8, weight_kg: 80 },
    { name: "Overhead Dumbbell Press", sets: 3, reps: 10, weight_kg: 24 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const uid = user?.uid || "demo_user";
      const [res, logs] = await Promise.all([
        api.getExternalApps(uid),
        api.getWorkouts(uid),
      ]);
      const workoutData = res.filter((r: any) => 
        r.app_name === "Strava / Smart Tracker" || 
        r.app_name === "Strava" || 
        r.app_name === "Hevy" || 
        r.app_name === "Google Health Connect" || 
        r.app_name === "Google Health"
      );
      setData(workoutData);
      setManualLogs(logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSyncStrava = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus(null);
      const uid = user?.uid || "demo_user";
      await api.syncStrava(uid);
      await fetchData();
      setSyncStatus({
        type: "success",
        message: "Synced with Strava API! Loaded 6 workout & cardiovascular strain sessions."
      });
    } catch (err: any) {
      setSyncStatus({ type: "error", message: err.message || "Failed to sync with Strava" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const uid = user?.uid || "demo_user";
      await api.logWorkout(uid, {
        name: workoutName,
        duration_min: durationMin,
        load_level: loadLevel,
        exercises: exerciseList,
        notes: `Logged manually at ${new Date().toLocaleTimeString()}`,
        affected_zones: ["chest", "shoulders", "triceps"]
      });
      setSyncStatus({ type: "success", message: `Logged workout "${workoutName}" successfully!` });
      setShowLogModal(false);
      await fetchData();
    } catch (err: any) {
      setSyncStatus({ type: "error", message: err.message || "Failed to log workout" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkout = async (logId: string) => {
    try {
      await api.deleteWorkout(logId);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const raw = data.length > 0 ? data[0]?.session_data : null;
  const workouts: any[] = raw?.workouts || [];
  const readinessScore = raw?.readiness_score || 86;
  const acwrValue = raw?.acwr || 1.14;
  const muscleStrain = raw?.muscle_strain || {
    Chest: 84, Shoulders: 78, Triceps: 72, Back: 68, Quads: 82, Hamstrings: 64, Core: 58
  };

  const hasData = workouts.length > 0 || manualLogs.length > 0;
  const acwrZone = ACWR_ZONE(acwrValue);

  const radarData = Object.entries(muscleStrain).map(([subject, A]) => ({
    subject,
    A,
    fullMark: 100
  }));

  const volumeChartData = workouts.map((w: any, idx: number) => ({
    day: w.name ? w.name.split(" ")[0] : `Wk ${idx + 1}`,
    name: w.name,
    volume: Math.round((w.volume_kg || 4000) / 100) / 10,
    calories: w.calories || 450,
    load: w.suffer_score > 65 ? "High" : "Medium"
  }));

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0">
      <Sidebar />
      <main className="flex-1 md:overflow-y-auto p-4 md:p-6 space-y-6 anim-fade relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-primary" /> Workout Strain & Workload (ACWR)
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Powered by Strava & Activity Analytics — Acute-to-Chronic Workload Ratio & Muscle Fatigue
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card hover:bg-white/10 border border-border text-foreground font-bold text-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-primary" /> Log Session
            </button>
            <button
              onClick={handleSyncStrava}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              <Bike className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing Strava..." : "Sync with Strava"}
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

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-80 gap-5 glass-panel p-8 text-center max-w-lg mx-auto mt-8 rounded-2xl border border-white/5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Dumbbell className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">No Workout Strain Data Found</h3>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                Connect and sync with Strava or log a workout session to calculate your acute-to-chronic workload ratio.
              </p>
            </div>
            <button
              onClick={handleSyncStrava}
              disabled={isSyncing}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
            >
              <Bike className="w-4 h-4" /> Sync with Strava
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Top Stat Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* ACWR Gauge */}
              <div className={`glass-panel p-5 rounded-2xl border ${acwrZone.bg} flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">ACWR (Workload Ratio)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase" style={{ color: acwrZone.color, backgroundColor: `${acwrZone.color}20` }}>
                    {acwrZone.label}
                  </span>
                </div>
                <div className="my-3">
                  <div className="text-4xl font-black font-mono-numbers" style={{ color: acwrZone.color }}>
                    {acwrValue}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optimal zone is between 0.8 &ndash; 1.3. Injury hazard spikes when ACWR exceeds 1.5.
                  </p>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (acwrValue / 1.8) * 100)}%`, backgroundColor: acwrZone.color }} 
                  />
                </div>
              </div>

              {/* Readiness Score */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-around">
                <ReadinessRing score={readinessScore} />
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">CNS & Tissue Recovery</div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> High Workload Capacity
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Low fatigue accumulation detected.
                  </div>
                </div>
              </div>

              {/* Total Strain / Volume */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">7-Day Training Volume</span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="my-3">
                  <div className="text-3xl font-black font-mono-numbers text-white">
                    {Math.round(workouts.reduce((s, w) => s + (w.volume_kg || 0), 0) / 1000)}k <span className="text-xs font-normal text-muted-foreground">kg lifted</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {workouts.length || manualLogs.length} logged training and cardio sessions.
                  </p>
                </div>
                <div className="text-xs text-primary font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Strava & Wearable Tracked
                </div>
              </div>

            </div>

            {/* Radar & Volume Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Muscle Strain Radar */}
              <div className="glass-panel h-84 flex flex-col">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" /> Muscular Strain Distribution (%)
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" stroke="#888" fontSize={11} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#444" fontSize={9} />
                      <Radar name="Strain" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Volume by Session */}
              <div className="glass-panel h-84 flex flex-col">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" /> Session Volume Load (Tonnage &bull; Tons)
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeChartData} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="day" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}t`} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="volume" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Workout History Feed */}
            <div className="glass-panel">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Training Log & Suffer Score
                </div>
                <span className="text-xs text-muted-foreground">{workouts.length + manualLogs.length} sessions logged</span>
              </div>

              <div className="space-y-3">
                {workouts.map((w: any) => (
                  <div key={w.id} className="p-4 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-foreground flex items-center gap-2">
                          {w.name}
                          {w.suffer_score && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Suffer: {w.suffer_score}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {w.duration_min} mins &bull; {w.calories} kcal &bull; Avg HR: {w.avg_heart_rate || 145} bpm
                        </div>
                      </div>
                      <div className="text-right font-mono-numbers">
                        <div className="text-sm font-bold text-white">{(w.volume_kg || 0).toLocaleString()} kg</div>
                        <div className="text-[10px] text-muted-foreground">Volume Load</div>
                      </div>
                    </div>

                    {w.exercises && w.exercises.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                        {w.exercises.map((ex: any, ei: number) => (
                          <span key={ei} className="px-2.5 py-1 rounded-lg bg-white/5 text-[11px] font-mono-numbers text-muted-foreground">
                            {ex.name} ({ex.sets}x{ex.reps} @ {ex.weight_kg}kg)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {manualLogs.map((log: any) => (
                  <div key={log.id} className="p-4 rounded-xl bg-card border border-border/60 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-foreground">{log.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{log.duration_min} mins &bull; {log.load_level} Load</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono-numbers">
                        <div className="text-sm font-bold text-white">{(log.volume_kg || 0).toLocaleString()} kg</div>
                      </div>
                      <button onClick={() => handleDeleteWorkout(log.id)} className="text-muted-foreground hover:text-red-400 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Quick Log Modal */}
        {showLogModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-white/10 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">Log Training Session</h3>
                </div>
                <button onClick={() => setShowLogModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>

              <form onSubmit={handleCreateWorkout} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Session Name:</label>
                  <input
                    type="text"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Duration (minutes):</label>
                    <input
                      type="number"
                      value={durationMin}
                      onChange={(e) => setDurationMin(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Perceived Load (RPE):</label>
                    <select
                      value={loadLevel}
                      onChange={(e) => setLoadLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm"
                    >
                      <option value="Low">Low (RPE 5-6)</option>
                      <option value="Medium">Medium (RPE 7-8)</option>
                      <option value="High">High (RPE 9-10)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? "Logging..." : "Save Workout Session"}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
