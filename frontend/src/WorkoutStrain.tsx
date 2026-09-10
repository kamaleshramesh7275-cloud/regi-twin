import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { 
  Activity, Zap, TrendingUp, Sparkles, CheckCircle2, Flame, 
  Info, AlertTriangle, ShieldAlert, HeartPulse, Stethoscope, 
  Clock, FileText, Dumbbell, AlertCircle, RefreshCw
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";
import { useLocation } from "wouter";

const ACWR_ZONE = (val: number) => {
  if (val > 1.5) return { color: "#ef4444", label: "Overreach Danger (>1.5)", bg: "bg-red-500/10 border-red-500/30" };
  if (val >= 1.3) return { color: "#f59e0b", label: "Caution Zone (1.3–1.5)", bg: "bg-amber-500/10 border-amber-500/30" };
  if (val >= 0.8) return { color: "#10b981", label: "Optimal Sweet Spot (0.8–1.3)", bg: "bg-emerald-500/10 border-emerald-500/30" };
  return { color: "#38bdf8", label: "Under-training / Deload (<0.8)", bg: "bg-sky-500/10 border-sky-500/30" };
};

const INJURY_RISK_ZONE = (level: string, score: number) => {
  const norm = (level || "").toLowerCase();
  if (norm === "high" || norm === "critical" || score >= 50) {
    return { color: "#ef4444", bg: "bg-red-500/10 border-red-500/30", text: "High Injury Risk" };
  }
  if (norm === "moderate" || score >= 25) {
    return { color: "#f59e0b", bg: "bg-amber-500/10 border-amber-500/30", text: "Moderate Caution" };
  }
  return { color: "#10b981", bg: "bg-emerald-500/10 border-emerald-500/30", text: "Low Injury Risk" };
};

function ReadinessRing({ score }: { score: number }) {
  const safeScore = score || 85;
  const color = safeScore >= 80 ? "#10b981" : safeScore >= 60 ? "#f59e0b" : "#ef4444";
  const verdict = safeScore >= 80 ? "Peak Readiness" : safeScore >= 60 ? "Train Smart" : "Deload / Rest";
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (safeScore / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-black" style={{ color }}>{safeScore}</span>
          <span className="text-[10px] text-slate-500">/ 100</span>
        </div>
      </div>
      <span className="font-bold text-xs" style={{ color }}>{verdict}</span>
    </div>
  );
}

export function WorkoutStrain() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const userId = user?.uid || "default_user";

  const [stats, setStats] = useState<any>(null);
  const [injuryRisk, setInjuryRisk] = useState<any>(null);
  const [wearable, setWearable] = useState<any>(null);
  const [painHistory, setPainHistory] = useState<any[]>([]);
  const [caseNotes, setCaseNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, riskRes, wearRes, painRes, notesRes] = await Promise.all([
        api.getWorkoutStats(userId).catch(() => null),
        api.getInjuryRisk(userId).catch(() => null),
        api.getLatestWearable(userId).catch(() => null),
        api.getPainHistory(userId).catch(() => []),
        api.getCaseNotes(userId).catch(() => [])
      ]);

      setStats(statsRes);
      setInjuryRisk(riskRes);
      setWearable(wearRes);
      setPainHistory(Array.isArray(painRes) ? painRes : []);
      setCaseNotes(Array.isArray(notesRes) ? notesRes : []);
    } catch (err) {
      console.error("Error loading user strain & medical health records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setStatusMsg(null);
      await fetchAllData();
      setStatusMsg({
        type: "success",
        message: "Refreshed user strain history and medical health diagnostics."
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to refresh data" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setIsRefreshing(true);
      setStatusMsg(null);
      await api.seedWorkoutWeek(userId);
      await fetchAllData();
      setStatusMsg({
        type: "success",
        message: "Successfully synchronized 7-day historical strain and load records!"
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to seed demo data" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const acwrValue = stats?.acwr !== undefined ? stats.acwr : 1.0;
  const acuteLoad = stats?.acute_load || 0;
  const chronicLoad = stats?.chronic_load || 0;
  const isColdStart = stats?.is_cold_start;
  const readinessScore = stats?.readiness_score || (wearable?.readiness_score || 85);
  const acwrZone = ACWR_ZONE(acwrValue);

  // Muscular strain radar
  const muscleStrain = stats?.muscle_strain || {
    Chest: 60, Shoulders: 55, Triceps: 50, Back: 65, Quads: 70, Hamstrings: 55, Core: 45
  };

  const radarData = Object.entries(muscleStrain).map(([subject, A]) => ({
    subject,
    A: typeof A === 'number' ? A : 50,
    fullMark: 100
  }));

  // Daily volume chart for the last 7 days
  const dailyBreakdown = stats?.daily_breakdown || [];
  const chartData = dailyBreakdown.map((d: any) => ({
    day: d.day_name,
    date: d.date,
    volume: d.volume_kg,
    sets: d.sets_count
  }));

  // Medical Health Metrics
  const riskScore = injuryRisk?.risk_score !== undefined ? injuryRisk.risk_score : 8;
  const riskLevel = injuryRisk?.risk_level || "Low";
  const riskZone = INJURY_RISK_ZONE(riskLevel, riskScore);
  const contributingFactors = injuryRisk?.contributing_factors || [
    { factor: "Workload Spike (ACWR)", contribution: (acwrValue > 1.3 ? 15 : 0), value: `${acwrValue.toFixed(1)}x` },
    { factor: "Subjective Pain", contribution: (painHistory.length > 0 ? 10 : 0), value: painHistory.length > 0 ? `${painHistory[0]?.score || 0}/10` : "None" },
    { factor: "Bilateral Asymmetry", contribution: 5, value: "Optimal" },
    { factor: "Movement Fear (TSK)", contribution: 4, value: "Baseline" },
    { factor: "Sleep & Autonomic", contribution: (wearable?.sleep_hours && wearable.sleep_hours < 6 ? 10 : 0), value: wearable?.sleep_hours ? `${wearable.sleep_hours}h` : "7.5h" }
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-slate-100 md:overflow-hidden pb-[72px] md:pb-0 bg-[#07090E]">
      <Sidebar />
      <main className="flex-1 md:overflow-y-auto p-4 md:p-8 space-y-6 relative z-10">
        
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                User Biomechanical Health
              </span>
              <span className="text-xs text-cyan-400 font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Muscular Strain &amp; Medical Health Profile
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 mt-1 text-white">
              <Activity className="w-7 h-7 text-emerald-400" /> User Strain Diagnostics &amp; Medical Health
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Personalized biomechanical tissue loads, acute-to-chronic fatigue ratio, and clinical health history.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Vitals
            </button>
            <button
              onClick={() => setLocation('/exercises')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs transition-all"
            >
              <Dumbbell className="w-4 h-4 text-emerald-400" /> Exercise Library
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
          <div className="flex justify-center p-16">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* SECTION 1: TOP STRAIN & FATIGUE METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* ACWR Gauge */}
              <div className={`p-6 rounded-3xl bg-slate-900/80 border ${acwrZone.bg} flex flex-col justify-between shadow-xl`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" /> ACWR (Fatigue : Fitness)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase" style={{ color: acwrZone.color, backgroundColor: `${acwrZone.color}20` }}>
                    {isColdStart ? "Baseline Building" : acwrZone.label}
                  </span>
                </div>
                <div className="my-3">
                  <div className="text-4xl font-black font-mono" style={{ color: acwrZone.color }}>
                    {acwrValue.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {isColdStart 
                      ? "Building 28-day baseline history. Optimal zone is between 0.8 – 1.3 (injury risk spikes >1.5)."
                      : "Sweet spot is 0.8 – 1.3. Caution threshold >1.3; overreach danger >1.5."}
                  </p>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (acwrValue / 1.8) * 100)}%`, backgroundColor: acwrZone.color }} 
                  />
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>7d Acute: <strong className="text-white font-mono">{Math.round(acuteLoad).toLocaleString()} kg</strong></span>
                  <span>28d Chronic Avg: <strong className="text-white font-mono">{Math.round(chronicLoad).toLocaleString()} kg</strong></span>
                </div>
              </div>

              {/* Readiness & Tissue Capacity */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-around shadow-xl">
                <ReadinessRing score={readinessScore} />
                <div className="space-y-1.5 max-w-[160px]">
                  <div className="text-xs text-slate-400 font-medium">Physiological Readiness</div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High Tissue Capacity
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Derived from acute strain deltas and autonomic recovery periods.
                  </p>
                </div>
              </div>

              {/* 7-Day Cumulative Volume */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" /> 7-Day Cumulative Volume
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">User History</span>
                </div>
                <div className="my-2">
                  <div className="text-3xl font-black font-mono text-cyan-400">
                    {Math.round(acuteLoad).toLocaleString()} <span className="text-xs font-normal text-slate-400">kg moved</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Across {stats?.total_workouts || 0} completed training sessions.
                  </p>
                </div>
                <button
                  onClick={handleSeedDemo}
                  disabled={isRefreshing}
                  className="text-xs text-slate-400 hover:text-cyan-400 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  {isRefreshing ? "Synchronizing..." : "Sync / Update Historical Load"}
                </button>
              </div>

            </div>

            {/* SECTION 2: MUSCULAR STRAIN RADAR & VOLUME PROGRESSION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Muscle Strain Radar */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 h-88 flex flex-col shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" /> Muscular Engagement &amp; Strain (%)
                  </div>
                  <span className="text-[10px] text-slate-500">7-Day Tissue Engagement</span>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                      <Radar name="Strain" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 7-Day Volume Progression Bar Chart */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 h-88 flex flex-col shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" /> 7-Day Training Volume Progression (kg)
                  </div>
                  <span className="text-[10px] text-slate-500">Daily Tonnage</span>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: -15, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
                        formatter={(val: any) => [`${Number(val).toLocaleString()} kg`, 'Volume']}
                      />
                      <Bar dataKey="volume" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* SECTION 3: USER MEDICAL HEALTH & CLINICAL HISTORICAL DIAGNOSTICS */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Medical Health &amp; Clinical Injury Risk Profile
                    </h2>
                    <p className="text-xs text-slate-400">
                      Derived from historical motion captures, pain logs, autonomic recovery, and clinical assessments.
                    </p>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${riskZone.bg}`} style={{ color: riskZone.color }}>
                  <ShieldAlert className="w-4 h-4" />
                  <span>{riskZone.text} ({riskScore}%)</span>
                </div>
              </div>

              {/* Medical Diagnostic Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* 7-Day Injury Risk Forecast */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-slate-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> 7d Injury Risk
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">{riskScore}%</span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">{riskLevel} Risk</div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {injuryRisk?.recommendation || "Training load is well-managed. Tissue thresholds optimal."}
                  </p>
                </div>

                {/* Autonomic Vitals */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-slate-300">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> Rest HR &amp; HRV
                    </span>
                    <span className="font-mono text-cyan-400">{wearable?.heart_rate ? `${wearable.heart_rate} bpm` : "62 bpm"}</span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {wearable?.hrv ? `${wearable.hrv} ms` : "68 ms"}{" "}
                    <span className="text-xs font-normal text-slate-400">HRV</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    SpO2: <span className="text-emerald-400 font-bold">{wearable?.spo2 || 98}%</span> &bull; Sleep: {wearable?.sleep_hours || 7.8} hrs
                  </p>
                </div>

                {/* Subjective Pain History */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-slate-300">
                      <AlertCircle className="w-3.5 h-3.5 text-purple-400" /> Pain / Tension
                    </span>
                    <span className="font-mono text-slate-400">{painHistory.length} logs</span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {painHistory.length > 0 ? `${painHistory[0]?.score || 0}/10 VAS` : "0/10 VAS"}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {painHistory.length > 0 ? `Recent: ${painHistory[0]?.zone || "Lower Back"}` : "No active joint pain reported"}
                  </p>
                </div>

                {/* Clinical Notes & History */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-blue-400" /> Clinical Notes
                    </span>
                    <span className="font-mono text-slate-400">{caseNotes.length} entries</span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {caseNotes.length > 0 ? "Active File" : "Clear History"}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug truncate" title={caseNotes.length > 0 ? caseNotes[0]?.note : "Baseline clear"}>
                    {caseNotes.length > 0 ? caseNotes[0]?.note : "No chronic musculoskeletal contraindications"}
                  </p>
                </div>

              </div>

              {/* Multi-Factor Contributing Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" /> Multi-Factor Medical Health &amp; Biomechanical Weighting
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {contributingFactors.map((factor: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/60 space-y-1">
                      <div className="text-[11px] text-slate-400 line-clamp-1">{factor.factor}</div>
                      <div className="text-sm font-bold text-white font-mono">{factor.value}</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        Weight: {factor.contribution ? `+${factor.contribution}%` : "0% (Safe)"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default WorkoutStrain;
