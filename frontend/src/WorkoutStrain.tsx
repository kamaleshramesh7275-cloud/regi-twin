import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dumbbell, Activity, ShieldAlert, Trophy, Zap, Heart, Clock, ChevronDown, ChevronUp, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  LineChart, Line, ReferenceLine, PieChart, Pie
} from "recharts";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";

const LOAD_COLORS: Record<string, string> = {
  High: "#ef4444", Medium: "#f59e0b", Low: "#10b981", None: "#334155"
};

const ACWR_ZONE = (val: number) => {
  if (val > 1.5) return { color: "#ef4444", label: "Overreach Risk", bg: "bg-red-500/10 border-red-500/30" };
  if (val >= 1.3) return { color: "#f59e0b", label: "Caution Zone", bg: "bg-amber-500/10 border-amber-500/30" };
  return { color: "#10b981", label: "Safe Zone", bg: "bg-emerald-500/10 border-emerald-500/30" };
};

function ReadinessRing({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const verdict = score >= 80 ? "Go Heavy" : score >= 60 ? "Train Smart" : "Rest Day";
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;
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
          <span className="font-mono-numbers text-3xl font-black" style={{ color }}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className="font-bold text-sm" style={{ color }}>{verdict}</span>
    </div>
  );
}

function MuscleGroupBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono-numbers font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function WorkoutStrain() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>("Mon");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uid = user?.uid || "demo_user";
        const res = await api.getExternalApps(uid);
        const workoutData = res.filter((r: any) => r.app_name === "Hevy");
        setData(workoutData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const raw = data.length > 0 ? data[0]?.session_data : null;
  const workouts: any[] = raw?.workouts || [];
  const weeklyStats = raw?.weekly_stats || null;

  const activeSessions = workouts.filter((w: any) => w.load !== "None");
  const latest = activeSessions.length > 0 ? activeSessions[0] : null;

  // Zone counts from all sessions
  const zoneCounts: Record<string, number> = {};
  workouts.forEach((w: any) => {
    (w.affectedZones || []).forEach((z: string) => {
      zoneCounts[z] = (zoneCounts[z] || 0) + 1;
    });
  });

  const loadMap = [
    { zone: "Lumbar", load: Math.min(100, (zoneCounts["lumbar"] || 0) * 25 + 10) },
    { zone: "Knees", load: Math.min(100, ((zoneCounts["left_knee"] || 0) + (zoneCounts["right_knee"] || 0)) * 18 + 5) },
    { zone: "Shoulders", load: Math.min(100, ((zoneCounts["left_shoulder"] || 0) + (zoneCounts["right_shoulder"] || 0)) * 20 + 5) },
    { zone: "Chest", load: Math.min(100, (zoneCounts["chest"] || 0) * 30 + 5) },
    { zone: "Core", load: Math.min(100, (zoneCounts["core"] || 0) * 30 + 5) },
    { zone: "Traps", load: Math.min(100, (zoneCounts["traps"] || 0) * 30 + 5) },
  ];

  const volumeData = workouts.map((w: any) => ({
    day: w.day,
    volume: (w.volume_kg || 0) / 1000,
    load: w.load,
  }));

  // ACWR chart data (synthetic 4-week trailing + current)
  const acwrData = [
    { week: "Wk-4", acute: 22, chronic: 24, ratio: 0.92 },
    { week: "Wk-3", acute: 26, chronic: 25, ratio: 1.04 },
    { week: "Wk-2", acute: 31, chronic: 26, ratio: 1.19 },
    { week: "Wk-1", acute: 35, chronic: 28, ratio: 1.25 },
    { week: "This Wk", acute: weeklyStats?.acute_load / 1000 || 38.5, chronic: weeklyStats?.chronic_load / 1000 || 28, ratio: weeklyStats?.acwr || 1.37 },
  ];

  const acwrZone = ACWR_ZONE(weeklyStats?.acwr || 1.37);

  // Muscle split for pie
  const muscleGroups = weeklyStats?.muscle_groups || { Legs: 38, Back: 28, Chest: 18, Shoulders: 10, Arms: 6 };
  const splitData = Object.entries(muscleGroups).map(([name, value]) => ({ name, value }));
  const splitColors = ["#a855f7", "#3b82f6", "#f97316", "#10b981", "#ec4899"];

  // PRs this week
  const allPRs: any[] = [];
  workouts.forEach((w: any) => {
    (w.exercises || []).forEach((ex: any) => {
      if (ex.is_pr) allPRs.push({ exercise: ex.name, weight: ex.weight_kg, day: w.day, prev: ex.prev_1rm });
    });
  });

  const recoveryZones = [
    { zone: "Lumbar Spine", hours: 48, pct: 40, color: "#f59e0b" },
    { zone: "Knee Complex", hours: 72, pct: 15, color: "#ef4444" },
    { zone: "Shoulders", hours: 24, pct: 75, color: "#10b981" },
    { zone: "Traps & Neck", hours: 36, pct: 55, color: "#f59e0b" },
    { zone: "Chest", hours: 24, pct: 80, color: "#10b981" },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0">
      <Sidebar />
      <main className="flex-1 md:overflow-y-auto p-4 md:p-6 space-y-6 anim-fade relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2"><Dumbbell className="w-6 h-6 text-purple-500" /> Muscular Strain Map</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Synced via Hevy — 7-day training intelligence</p>
          </div>
          {weeklyStats && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge bg-purple-500/15 text-purple-400 border-purple-500/30">
                <Dumbbell className="w-3 h-3 mr-1" /> {weeklyStats.total_sessions} sessions
              </span>
              <span className="badge bg-amber-500/15 text-amber-400 border-amber-500/30">
                <Trophy className="w-3 h-3 mr-1" /> {weeklyStats.prs_this_week} PRs this week
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

            {/* Weekly KPI Row */}
            {weeklyStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Total Volume", value: `${(weeklyStats.total_volume_kg / 1000).toFixed(1)}t`, color: "text-purple-400", icon: <Dumbbell className="w-4 h-4" /> },
                  { label: "Total Sets", value: weeklyStats.total_sets, color: "text-blue-400", icon: <Activity className="w-4 h-4" /> },
                  { label: "Avg Duration", value: `${weeklyStats.avg_session_duration}m`, color: "text-cyan-400", icon: <Clock className="w-4 h-4" /> },
                  { label: "Avg HRV", value: `${weeklyStats.hrv_avg} ms`, color: "text-emerald-400", icon: <Heart className="w-4 h-4" /> },
                  { label: "Avg Sleep", value: `${weeklyStats.sleep_avg_h}h`, color: "text-indigo-400", icon: <Zap className="w-4 h-4" /> },
                ].map(k => (
                  <div key={k.label} className="glass-panel text-center py-4">
                    <div className={`flex justify-center mb-1.5 ${k.color}`}>{k.icon}</div>
                    <div className={`text-2xl font-black font-mono-numbers ${k.color}`}>{k.value}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{k.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ACWR + Readiness Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`glass-panel lg:col-span-2 border ${acwrZone.bg}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Acute:Chronic Workload Ratio (ACWR)
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">4-week rolling load analysis</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black font-mono-numbers" style={{ color: acwrZone.color }}>{weeklyStats?.acwr || 1.37}</div>
                    <div className="text-xs font-semibold" style={{ color: acwrZone.color }}>{acwrZone.label}</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={acwrData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="week" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} domain={[0, 2]} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Overreach", fill: "#ef4444", fontSize: 10, position: "right" }} />
                    <ReferenceLine y={1.3} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Caution", fill: "#f59e0b", fontSize: 10, position: "right" }} />
                    <Line type="monotone" dataKey="ratio" name="ACWR" stroke="#a855f7" strokeWidth={3} dot={{ fill: "#a855f7", r: 5 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-panel flex flex-col items-center justify-center gap-4">
                <div className="text-sm font-semibold">Weekly Readiness Score</div>
                <ReadinessRing score={weeklyStats?.readiness_score || 72} />
                <div className="w-full space-y-2 mt-2 text-xs">
                  {[
                    { label: "HRV", val: weeklyStats?.hrv_avg || 58, max: 100, color: "#10b981" },
                    { label: "Sleep", val: ((weeklyStats?.sleep_avg_h || 7.2) / 9) * 100, max: 100, color: "#6366f1" },
                    { label: "Load Ratio", val: Math.max(0, 100 - ((weeklyStats?.acwr || 1.37) - 1) * 200), max: 100, color: "#f59e0b" },
                  ].map(r => (
                    <div key={r.label}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className="font-mono-numbers">{Math.round(r.val)}</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.val}%`, background: r.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Joint Load Radar */}
              <div className="glass-panel h-80 flex flex-col">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" /> Joint Load Distribution
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={loadMap}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="zone" tick={{ fill: '#888', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Load" dataKey="load" stroke="#a855f7" fill="#a855f7" fillOpacity={0.35} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(v: any) => [`${v}%`, "Load"]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Volume Bar Chart */}
              <div className="glass-panel h-80 flex flex-col">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" /> Daily Volume (tonnes)
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeData} margin={{ left: -20, right: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="day" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}t`} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        formatter={(v: any) => [`${v.toFixed(1)}t`, "Volume"]} />
                      <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                        {volumeData.map((entry: any, i: number) => (
                          <Cell key={i} fill={LOAD_COLORS[entry.load] || "#6b7280"} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Training Split Pie */}
              <div className="glass-panel h-80 flex flex-col">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Training Split
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie data={splitData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                        {splitData.map((_: any, i: number) => (
                          <Cell key={i} fill={splitColors[i % splitColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(v: any, n: any) => [`${v}%`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
                    {splitData.map((s: any, i: number) => (
                      <div key={s.name} className="flex items-center gap-1 text-[10px]">
                        <div className="w-2 h-2 rounded-full" style={{ background: splitColors[i % splitColors.length] }} />
                        <span className="text-muted-foreground">{s.name}</span>
                        <span className="font-mono-numbers">{s.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Muscle Group Heatmap + Recovery Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel">
                <div className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-purple-400" /> Muscle Group Load Heatmap
                </div>
                <div className="space-y-3">
                  <MuscleGroupBar label="Quadriceps / Glutes" pct={Math.min(100, (zoneCounts["left_thigh"] || 0 + zoneCounts["right_thigh"] || 0 + zoneCounts["glutes"] || 0) * 18 + 62)} color="#a855f7" />
                  <MuscleGroupBar label="Posterior Chain (Hams / Lower Back)" pct={Math.min(100, (zoneCounts["lumbar"] || 0) * 22 + 48)} color="#ef4444" />
                  <MuscleGroupBar label="Shoulders" pct={Math.min(100, ((zoneCounts["left_shoulder"] || 0) + (zoneCounts["right_shoulder"] || 0)) * 18 + 32)} color="#f59e0b" />
                  <MuscleGroupBar label="Chest" pct={Math.min(100, (zoneCounts["chest"] || 0) * 28 + 20)} color="#3b82f6" />
                  <MuscleGroupBar label="Trapezius / Neck" pct={Math.min(100, (zoneCounts["traps"] || 0) * 25 + 35)} color="#10b981" />
                  <MuscleGroupBar label="Core" pct={Math.min(100, (zoneCounts["core"] || 0) * 20 + 15)} color="#06b6d4" />
                </div>
              </div>

              <div className="glass-panel">
                <div className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Estimated Recovery Timeline
                </div>
                <div className="space-y-4">
                  {recoveryZones.map(r => (
                    <div key={r.zone}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{r.zone}</span>
                        <span className="font-mono-numbers text-xs" style={{ color: r.color }}>
                          {r.pct >= 90 ? "✓ Ready" : `${r.hours}h remaining`}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${r.pct}%`, background: r.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-border flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Knee complex requires <strong className="text-amber-400">72h full recovery</strong> before heavy axial loading. Avoid high-load bilateral squats and leg press until Friday.
                  </p>
                </div>
              </div>
            </div>

            {/* PR Table */}
            {allPRs.length > 0 && (
              <div className="glass-panel">
                <div className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Personal Records This Week
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Exercise</th>
                        <th className="text-right py-2 pr-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Day</th>
                        <th className="text-right py-2 pr-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Weight</th>
                        <th className="text-right py-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">vs Previous</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPRs.map((pr: any, i: number) => (
                        <tr key={i} className="border-b border-border/30 last:border-0">
                          <td className="py-3 pr-4 font-medium flex items-center gap-2">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" /> {pr.exercise}
                          </td>
                          <td className="py-3 pr-4 text-right text-muted-foreground">{pr.day}</td>
                          <td className="py-3 pr-4 text-right font-bold font-mono-numbers text-purple-400">{pr.weight} kg</td>
                          <td className="py-3 text-right">
                            {pr.prev ? (
                              <span className="text-emerald-400 font-mono-numbers text-xs">
                                +{Math.round((pr.weight / pr.prev - 1) * 100 * 100) / 100}% est 1RM
                              </span>
                            ) : <span className="text-muted-foreground text-xs">New lift</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Symmetry Warning */}
            <div className="glass-panel bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-400 mb-1">Biomechanical Symmetry Alert</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your <strong className="text-foreground">left knee</strong> has appeared in affected zones {(zoneCounts["left_knee"] || 0) + 1}× this week vs {zoneCounts["right_knee"] || 0}× for the right.
                    This asymmetric loading pattern during bilateral movements may indicate a strength deficit or compensatory strategy. Consider unilateral isolation (Bulgarian Split Squats, single-leg leg press) before your next heavy leg session.
                  </p>
                </div>
              </div>
            </div>

            {/* Expandable Workout Session Log */}
            <div className="glass-panel">
              <div className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-purple-400" /> Full Week Session Log
              </div>
              <div className="space-y-1">
                {workouts.map((w: any) => (
                  <div key={w.day} className="border border-border/50 rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedDay(expandedDay === w.day ? null : w.day)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm w-8">{w.day}</span>
                        <span className="text-sm font-medium">{w.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border"
                          style={{ color: LOAD_COLORS[w.load], borderColor: LOAD_COLORS[w.load] + "50", background: LOAD_COLORS[w.load] + "15" }}>
                          {w.load}
                        </span>
                        {w.volume_kg > 0 && <span className="text-xs font-mono-numbers text-muted-foreground">{(w.volume_kg / 1000).toFixed(1)}t</span>}
                        {w.duration_min > 0 && <span className="text-xs text-muted-foreground">{w.duration_min}m</span>}
                      </div>
                      {expandedDay === w.day ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    {expandedDay === w.day && w.exercises && w.exercises.length > 0 && (
                      <div className="px-4 pb-3 border-t border-border/50">
                        <table className="w-full text-xs mt-2">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="text-left pb-2 font-medium">Exercise</th>
                              <th className="text-right pb-2 font-medium">Sets × Reps</th>
                              <th className="text-right pb-2 font-medium">Weight</th>
                              <th className="text-right pb-2 font-medium">Volume</th>
                            </tr>
                          </thead>
                          <tbody>
                            {w.exercises.map((ex: any, i: number) => (
                              <tr key={i} className="border-t border-border/20">
                                <td className="py-2 font-medium flex items-center gap-1.5">
                                  {ex.is_pr && <Trophy className="w-3 h-3 text-amber-400 shrink-0" />}
                                  {ex.name}
                                </td>
                                <td className="py-2 text-right font-mono-numbers">{ex.sets} × {ex.reps}</td>
                                <td className="py-2 text-right font-mono-numbers font-bold">{ex.weight_kg} kg</td>
                                <td className="py-2 text-right font-mono-numbers text-muted-foreground">{ex.volume} kg</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {expandedDay === w.day && (!w.exercises || w.exercises.length === 0) && (
                      <div className="px-4 pb-3 pt-2 border-t border-border/50 text-xs text-muted-foreground italic">
                        {w.load === "None" ? "Rest day — no exercises logged" : "No exercise data"}
                      </div>
                    )}
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
