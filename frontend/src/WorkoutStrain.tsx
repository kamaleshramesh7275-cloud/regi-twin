import React, { useState, useEffect, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { 
  Activity, Zap, TrendingUp, CheckCircle2, Flame, 
  AlertTriangle, ShieldAlert, Stethoscope, 
  Clock, AlertCircle, Sliders, Edit3, 
  Plus, RotateCcw, Save, Moon, Brain, Droplets, 
  HeartHandshake, ChevronRight, SlidersHorizontal, Scale
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { useAuth } from "./context/AuthContext";

// ── ACWR Dynamic Zone Helper ──────────────────────────────────────────────────
const ACWR_ZONE = (val: number, isColdStart = false) => {
  if (isColdStart) {
    return { color: "#38bdf8", label: "Baseline Building", bg: "bg-sky-500/10 border-sky-500/30", text: "Building initial baseline" };
  }
  if (val > 1.5) {
    return { color: "#ef4444", label: "Overreach Danger (>1.5)", bg: "bg-red-500/10 border-red-500/30", text: "High acute workload spike. Significant injury risk." };
  }
  if (val >= 1.3) {
    return { color: "#f59e0b", label: "Caution Zone (1.3–1.5)", bg: "bg-amber-500/10 border-amber-500/30", text: "Approaching fatigue threshold. Prioritize recovery." };
  }
  if (val >= 0.8) {
    return { color: "#10b981", label: "Optimal Sweet Spot (0.8–1.3)", bg: "bg-emerald-500/10 border-emerald-500/30", text: "Optimal progressive overload with low injury risk." };
  }
  return { color: "#38bdf8", label: "Under-training / Deload (<0.8)", bg: "bg-sky-500/10 border-sky-500/30", text: "Below chronic capacity. Safe for deload or recovery." };
};

// ── RPE Description Reference (Borg CR10 Scale) ───────────────────────────────
const RPE_DESCRIPTIONS: Record<number, { title: string; desc: string; color: string }> = {
  1: { title: "Very Light", desc: "Minimal effort (Rest / Gentle walking)", color: "#38bdf8" },
  2: { title: "Light", desc: "Easy warmup, normal conversation", color: "#38bdf8" },
  3: { title: "Moderate", desc: "Comfortable pace, light perspiration", color: "#10b981" },
  4: { title: "Somewhat Hard", desc: "Steady tempo, elevated heart rate", color: "#10b981" },
  5: { title: "Challenging", desc: "Deep breathing, solid muscular pump", color: "#10b981" },
  6: { title: "Hard", desc: "Heavy effort, cannot maintain conversation", color: "#f59e0b" },
  7: { title: "Vigorous / 3 RIR", desc: "3 reps in reserve, strong fatigue", color: "#f59e0b" },
  8: { title: "Very Hard / 2 RIR", desc: "2 reps in reserve, heavy strain", color: "#f97316" },
  9: { title: "Near Maximum / 1 RIR", desc: "1 rep in reserve, extreme effort", color: "#ef4444" },
  10: { title: "Absolute Max / Failure", desc: "0 reps left, complete exhaustion", color: "#dc2626" },
};

// ── Readiness Ring Component ──────────────────────────────────────────────────
function ReadinessRing({ score }: { score: number }) {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  const color = safeScore >= 80 ? "#10b981" : safeScore >= 60 ? "#f59e0b" : "#ef4444";
  const verdict = safeScore >= 80 ? "Peak Readiness" : safeScore >= 60 ? "Train Smart" : "Deload / Rest";
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (safeScore / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle 
            cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-700" 
          />
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

// ── Default Muscle Groups ─────────────────────────────────────────────────────
const INITIAL_MUSCLE_STRAIN: Record<string, number> = {
  Chest: 55,
  Back: 60,
  Shoulders: 50,
  Arms: 45,
  Quads: 65,
  Hamstrings: 55,
  Core: 45,
};

export function WorkoutStrain() {
  const { user } = useAuth();
  const userId = user?.uid || "default_user";

  const storageKey = `physiotwin_manual_strain_${userId}`;

  // ── Manual State Initialization ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"overview" | "log_session" | "muscle_matrix" | "recovery_survey" | "acwr_simulator">("overview");
  
  // 1. Manual Session Logging Form State
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [sessionType, setSessionType] = useState<string>("Resistance Training");
  const [sessionDuration, setSessionDuration] = useState<number>(60);
  const [sessionRpe, setSessionRpe] = useState<number>(7);
  const [sessionTargetMuscles, setSessionTargetMuscles] = useState<string[]>(["Chest", "Shoulders", "Arms"]);
  const [manualVolumeKg, setManualVolumeKg] = useState<number>(5400);

  // 2. Manual Muscular Soreness & Strain Matrix (0-100)
  const [muscleStrain, setMuscleStrain] = useState<Record<string, number>>(INITIAL_MUSCLE_STRAIN);

  // 3. Manual Subjective Recovery & Fatigue Index (1-10 Scale)
  const [sleepScore, setSleepScore] = useState<number>(8);         // 1-10 (10 = Best)
  const [sleepHours, setSleepHours] = useState<number>(7.5);       // Hours
  const [sorenessLevel, setSorenessLevel] = useState<number>(4);   // 1-10 (10 = Worst DOMS)
  const [stressLevel, setStressLevel] = useState<number>(3);       // 1-10 (10 = High Stress)
  const [hydrationScore, setHydrationScore] = useState<number>(8); // 1-10 (10 = Optimal)

  // 4. Manual Pain & Injury Check-in
  const [painArea, setPainArea] = useState<string>("Lower Back");
  const [painVas, setPainVas] = useState<number>(0);               // 0-10 VAS Scale
  const [painType, setPainType] = useState<string>("Stiffness / Tightness");
  const [painLogs, setPainLogs] = useState<Array<{ id: string; date: string; area: string; score: number; type: string }>>([]);

  // 5. Workload & History
  const [manualSessions, setManualSessions] = useState<Array<{
    id: string;
    date: string;
    dayName: string;
    type: string;
    duration: number;
    rpe: number;
    loadAu: number;
    volumeKg: number;
    muscles: string[];
  }>>([]);

  // Workload Baseline Modifiers
  const [acuteLoadOverride, setAcuteLoadOverride] = useState<number | null>(null);
  const [chronicLoadOverride, setChronicLoadOverride] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ── Load Initial / Saved State ──────────────────────────────────────────────
  useEffect(() => {
    try {
      setLoading(true);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.muscleStrain) setMuscleStrain(parsed.muscleStrain);
        if (parsed.sleepScore !== undefined) setSleepScore(parsed.sleepScore);
        if (parsed.sleepHours !== undefined) setSleepHours(parsed.sleepHours);
        if (parsed.sorenessLevel !== undefined) setSorenessLevel(parsed.sorenessLevel);
        if (parsed.stressLevel !== undefined) setStressLevel(parsed.stressLevel);
        if (parsed.hydrationScore !== undefined) setHydrationScore(parsed.hydrationScore);
        if (parsed.painLogs) setPainLogs(parsed.painLogs);
        if (parsed.painVas !== undefined) setPainVas(parsed.painVas);
        if (parsed.manualSessions && parsed.manualSessions.length > 0) {
          setManualSessions(parsed.manualSessions);
        } else {
          initDefaultSessions();
        }
      } else {
        initDefaultSessions();
      }
    } catch (e) {
      console.error("Failed to load local strain preferences:", e);
      initDefaultSessions();
    } finally {
      setLoading(false);
    }
  }, [userId, storageKey]);

  const initDefaultSessions = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const defaultList = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const dayName = days[d.getDay()];
      
      const volumes = [4200, 5600, 0, 6100, 4800, 7200, 3800];
      const rpes = [6, 8, 0, 7, 7, 9, 6];
      const durs = [50, 65, 0, 70, 55, 80, 45];
      const vol = volumes[6 - i] || 4500;
      const rpe = rpes[6 - i] || 7;
      const dur = durs[6 - i] || 60;

      defaultList.push({
        id: `sess-${dStr}-${i}`,
        date: dStr,
        dayName,
        type: vol === 0 ? "Rest & Mobility" : "Resistance Training",
        duration: dur,
        rpe,
        loadAu: dur * rpe,
        volumeKg: vol,
        muscles: i % 2 === 0 ? ["Chest", "Shoulders", "Arms"] : ["Quads", "Hamstrings", "Back"]
      });
    }
    setManualSessions(defaultList);
  };

  // ── Auto-save State to Local Storage ────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const payload = {
      muscleStrain,
      sleepScore,
      sleepHours,
      sorenessLevel,
      stressLevel,
      hydrationScore,
      painLogs,
      painVas,
      manualSessions
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.error("Storage save failed:", e);
    }
  }, [muscleStrain, sleepScore, sleepHours, sorenessLevel, stressLevel, hydrationScore, painLogs, painVas, manualSessions, loading, storageKey]);

  // ── Dynamic Calculations ────────────────────────────────────────────────────

  // 1. Calculate 7-Day Acute Load (Sum of last 7 days volume)
  const computedAcuteVolume = useMemo(() => {
    return manualSessions.reduce((sum, s) => sum + (Number(s.volumeKg) || 0), 0);
  }, [manualSessions]);

  const activeAcuteLoad = acuteLoadOverride !== null ? acuteLoadOverride : computedAcuteVolume;

  // 2. Calculate 28-Day Chronic Baseline Load (Simulated rolling baseline average)
  const defaultChronic = 28500;
  const activeChronicLoad = chronicLoadOverride !== null ? chronicLoadOverride : defaultChronic;

  // 3. Calculate ACWR
  const acwrValue = activeChronicLoad > 0 ? activeAcuteLoad / activeChronicLoad : 1.0;
  const acwrZone = ACWR_ZONE(acwrValue, false);

  // 4. Calculate Dynamic Physiological Readiness Score (0-100) from Subjective Inputs
  const readinessScore = useMemo(() => {
    // Hooper-Mackinnon weighted recovery model:
    // Base 50 + Sleep(0-28) + Hydration(0-16) - Soreness(0-22) - Stress(0-22) - Pain(VAS*2.5)
    const sleepWeight = (sleepScore / 10) * 28;
    const hydrationWeight = (hydrationScore / 10) * 16;
    const sorenessPenalty = (sorenessLevel / 10) * 22;
    const stressPenalty = (stressLevel / 10) * 22;
    const painPenalty = painVas * 2.5;

    let score = 50 + sleepWeight + hydrationWeight - sorenessPenalty - stressPenalty - painPenalty;
    return Math.min(100, Math.max(15, Math.round(score)));
  }, [sleepScore, hydrationScore, sorenessLevel, stressLevel, painVas]);

  // 5. Dynamic Injury Risk Score (0-100%)
  const injuryRiskScore = useMemo(() => {
    let risk = 5;
    // ACWR Spike (> 1.3 adds risk, > 1.5 adds heavy risk)
    if (acwrValue > 1.5) risk += 35;
    else if (acwrValue > 1.3) risk += 18;
    else if (acwrValue < 0.6) risk += 8;

    // Soreness / Overload
    if (sorenessLevel >= 8) risk += 18;
    else if (sorenessLevel >= 6) risk += 8;

    // Sleep deficit
    if (sleepHours < 6) risk += 15;
    else if (sleepHours < 7) risk += 6;

    // Pain Score
    risk += painVas * 3.5;

    // High Stress
    if (stressLevel >= 8) risk += 12;

    return Math.min(95, Math.max(4, Math.round(risk)));
  }, [acwrValue, sorenessLevel, sleepHours, painVas, stressLevel]);

  const riskLevel = injuryRiskScore >= 50 ? "High" : injuryRiskScore >= 25 ? "Moderate" : "Low";

  // 6. Muscle Radar Data
  const radarData = useMemo(() => {
    return Object.entries(muscleStrain).map(([subject, val]) => ({
      subject,
      A: typeof val === "number" ? val : 50,
      fullMark: 100
    }));
  }, [muscleStrain]);

  // 7. Daily 7-Day Chart Data
  const chartData = useMemo(() => {
    return manualSessions.map((s) => ({
      day: s.dayName,
      date: s.date,
      volume: s.volumeKg,
      rpe: s.rpe,
      load: s.loadAu,
      type: s.type
    }));
  }, [manualSessions]);

  // ── Actions & Handlers ──────────────────────────────────────────────────────

  // Handle Log New Manual Session
  const handleLogManualSession = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const d = new Date(sessionDate);
      const dayName = isNaN(d.getDay()) ? "Today" : days[d.getDay()];
      const loadAu = sessionDuration * sessionRpe;

      const newSession = {
        id: `sess-${Date.now()}`,
        date: sessionDate,
        dayName,
        type: sessionType,
        duration: sessionDuration,
        rpe: sessionRpe,
        loadAu,
        volumeKg: manualVolumeKg,
        muscles: sessionTargetMuscles
      };

      // Add to list and keep max 7 days in chart view
      const updated = [...manualSessions.filter(s => s.date !== sessionDate), newSession];
      updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const last7 = updated.slice(-7);
      setManualSessions(last7);

      // Dynamically bump targeted muscle strain on the radar chart
      setMuscleStrain(prev => {
        const next = { ...prev };
        sessionTargetMuscles.forEach(m => {
          if (next[m] !== undefined) {
            next[m] = Math.min(100, Math.round(next[m] + sessionRpe * 3.5));
          }
        });
        return next;
      });

      setStatusMsg({
        type: "success",
        message: `Logged manual session: ${sessionType} (${manualVolumeKg.toLocaleString()} kg, RPE ${sessionRpe}, ${loadAu} AU load).`
      });

      setActiveTab("overview");
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to log session" });
    }
  };

  // Handle Quick Muscle Presets
  const applyMusclePreset = (preset: "leg_day" | "upper_body" | "full_recovery" | "heavy_push") => {
    if (preset === "leg_day") {
      setMuscleStrain({ Chest: 30, Back: 45, Shoulders: 30, Arms: 25, Quads: 90, Hamstrings: 85, Core: 60 });
      setSorenessLevel(7);
      setStatusMsg({ type: "success", message: "Applied 'Heavy Leg Day' tissue fatigue profile." });
    } else if (preset === "upper_body") {
      setMuscleStrain({ Chest: 85, Back: 80, Shoulders: 85, Arms: 75, Quads: 25, Hamstrings: 25, Core: 50 });
      setSorenessLevel(6);
      setStatusMsg({ type: "success", message: "Applied 'Upper Body Hypertrophy' tissue fatigue profile." });
    } else if (preset === "heavy_push") {
      setMuscleStrain({ Chest: 95, Back: 35, Shoulders: 90, Arms: 80, Quads: 30, Hamstrings: 20, Core: 45 });
      setSorenessLevel(6);
      setStatusMsg({ type: "success", message: "Applied 'Max Push / Press' strain profile." });
    } else {
      setMuscleStrain({ Chest: 30, Back: 30, Shoulders: 30, Arms: 25, Quads: 30, Hamstrings: 30, Core: 25 });
      setSorenessLevel(2);
      setStatusMsg({ type: "success", message: "Reset all muscle groups to 'Fresh / Rested' state." });
    }
  };

  // Handle Log Pain Entry
  const handleLogPain = (e: React.FormEvent) => {
    e.preventDefault();
    if (painVas === 0) {
      setStatusMsg({ type: "success", message: "Pain score marked 0/10 (Pain Free)." });
      return;
    }
    const newEntry = {
      id: `pain-${Date.now()}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      area: painArea,
      score: painVas,
      type: painType
    };
    setPainLogs([newEntry, ...painLogs.slice(0, 4)]);
    setStatusMsg({
      type: "success",
      message: `Recorded ${painArea} discomfort (${painVas}/10 VAS - ${painType}). Biomechanical risk updated.`
    });
  };

  // Reset to Factory Default Data
  const handleResetDefaults = () => {
    if (confirm("Reset all manual strain and recovery inputs back to default?")) {
      localStorage.removeItem(storageKey);
      setMuscleStrain(INITIAL_MUSCLE_STRAIN);
      setSleepScore(8);
      setSleepHours(7.5);
      setSorenessLevel(4);
      setStressLevel(3);
      setHydrationScore(8);
      setPainVas(0);
      setPainLogs([]);
      setAcuteLoadOverride(null);
      setChronicLoadOverride(null);
      initDefaultSessions();
      setStatusMsg({ type: "success", message: "Strain metrics restored to baseline defaults." });
    }
  };

  // Auto-calculate manual volume when duration or RPE changes
  const handleDurationOrRpeChange = (dur: number, rpe: number) => {
    setSessionDuration(dur);
    setSessionRpe(rpe);
    // Rough athletic tonnage estimation: ~75kg moved per min of resistance training at RPE 7
    const intensityMultiplier = (rpe / 10) * 1.3;
    const estVol = Math.round(dur * 70 * intensityMultiplier);
    setManualVolumeKg(estVol);
  };

  const toggleTargetMuscle = (m: string) => {
    setSessionTargetMuscles(prev => 
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-slate-100 md:overflow-hidden pb-[72px] md:pb-0 bg-[#07090E]">
      <Sidebar />
      <main className="flex-1 md:overflow-y-auto p-4 md:p-8 space-y-6 relative z-10">
        
        {/* PAGE HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Sliders className="w-3 h-3" /> Manual Athletic Input
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Biomechanical Strain &amp; ACWR Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 mt-1 text-white">
              <Activity className="w-7 h-7 text-emerald-400" /> Dynamic Strain &amp; Workload Calibration
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Directly input session RPE, duration, subjective muscle soreness, and recovery scores to dynamically govern your ACWR.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveTab(activeTab === "log_session" ? "overview" : "log_session")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              {activeTab === "log_session" ? "View Dashboard" : "Log Strain / RPE"}
            </button>
            <button
              onClick={() => setActiveTab(activeTab === "muscle_matrix" ? "overview" : "muscle_matrix")}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
              Soreness Sliders
            </button>
            <button
              onClick={() => setActiveTab(activeTab === "recovery_survey" ? "overview" : "recovery_survey")}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs transition-all"
            >
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              Recovery Index
            </button>
            <button
              onClick={handleResetDefaults}
              title="Reset metrics to initial values"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* STATUS ALERT NOTIFICATION */}
        {statusMsg && (
          <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            statusMsg.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            <span className="flex items-center gap-2">
              {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {statusMsg.message}
            </span>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white font-bold ml-4">✕</button>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Strain Overview & Gauges", icon: Activity },
            { id: "log_session", label: "Manual Session Logger (RPE)", icon: Edit3 },
            { id: "muscle_matrix", label: "Muscle Soreness Matrix", icon: Flame },
            { id: "recovery_survey", label: "Subjective Wellness & Sleep", icon: HeartHandshake },
            { id: "acwr_simulator", label: "ACWR Workload Simulator", icon: Scale },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  isActive 
                    ? "bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-md" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: OVERVIEW DASHBOARD ────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">

            {/* TOP 3 CORE METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* ACWR Gauge */}
              <div className={`p-6 rounded-3xl bg-slate-900/80 border ${acwrZone.bg} flex flex-col justify-between shadow-xl relative overflow-hidden`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" /> ACWR (Acute : Chronic Ratio)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase" style={{ color: acwrZone.color, backgroundColor: `${acwrZone.color}20` }}>
                    {acwrZone.label}
                  </span>
                </div>

                <div className="my-3">
                  <div className="text-4xl font-black font-mono flex items-baseline gap-2" style={{ color: acwrZone.color }}>
                    {acwrValue.toFixed(2)}
                    <span className="text-xs font-sans font-normal text-slate-400">Ratio</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {acwrZone.text}
                  </p>
                </div>

                {/* Progress bar gauge */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full transition-all duration-700 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, Math.max(5, (acwrValue / 2.0) * 100))}%`, 
                        backgroundColor: acwrZone.color 
                      }} 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.0 (Deload)</span>
                    <span className="text-emerald-400 font-bold">0.8 - 1.3 (Optimal)</span>
                    <span className="text-red-400 font-bold">&gt;1.5 (Danger)</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>7d Acute: <strong className="text-white font-mono">{Math.round(activeAcuteLoad).toLocaleString()} kg</strong></span>
                  <span>28d Baseline: <strong className="text-white font-mono">{Math.round(activeChronicLoad).toLocaleString()} kg</strong></span>
                </div>
              </div>

              {/* Dynamic Readiness Ring */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-around shadow-xl">
                <ReadinessRing score={readinessScore} />
                <div className="space-y-2 max-w-[170px]">
                  <div className="text-xs text-slate-400 font-medium">Physiological Readiness</div>
                  <div className={`text-xs font-bold flex items-center gap-1 ${
                    readinessScore >= 80 ? "text-emerald-400" : readinessScore >= 60 ? "text-amber-400" : "text-rose-400"
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {readinessScore >= 80 ? "Full Capacity" : readinessScore >= 60 ? "Moderate Capacity" : "Recovery Needed"}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Calibrated from your manual sleep ({sleepHours}h), DOMS ({sorenessLevel}/10), and stress ({stressLevel}/10).
                  </p>
                  <button
                    onClick={() => setActiveTab("recovery_survey")}
                    className="text-[10px] text-cyan-400 hover:underline font-bold flex items-center gap-0.5"
                  >
                    Adjust Recovery Survey <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {/* 7-Day Cumulative Volume */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" /> 7-Day Manual Training Load
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {manualSessions.length} Sessions
                  </span>
                </div>

                <div className="my-2">
                  <div className="text-3xl font-black font-mono text-cyan-400">
                    {Math.round(activeAcuteLoad).toLocaleString()} <span className="text-xs font-normal text-slate-400">kg moved</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Calculated from your logged resistance &amp; athletic sessions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("log_session")}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Log Session
                  </button>
                  <button
                    onClick={() => setActiveTab("acwr_simulator")}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <Scale className="w-3.5 h-3.5 text-amber-400" /> Simulate
                  </button>
                </div>
              </div>

            </div>

            {/* RADAR CHART & 7-DAY PROGRESSION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Muscular Engagement Radar */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 h-96 flex flex-col shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" /> Muscular Soreness &amp; Engagement (%)
                    </div>
                    <p className="text-[11px] text-slate-400">Live tissue strain calibrated by your manual inputs.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("muscle_matrix")}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold transition-colors"
                  >
                    Edit Sliders
                  </button>
                </div>

                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                      <Radar name="Strain" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Quick Muscle Presets Bar */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Presets:</span>
                  <button onClick={() => applyMusclePreset("leg_day")} className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300">Leg Day</button>
                  <button onClick={() => applyMusclePreset("upper_body")} className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300">Upper Body</button>
                  <button onClick={() => applyMusclePreset("heavy_push")} className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300">Heavy Push</button>
                  <button onClick={() => applyMusclePreset("full_recovery")} className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400">Reset Fresh</button>
                </div>
              </div>

              {/* 7-Day Daily Tonnage Bar Chart */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 h-96 flex flex-col shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" /> 7-Day Training Volume Progression (kg)
                    </div>
                    <p className="text-[11px] text-slate-400">Dynamic daily volume entered via manual session logs.</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    Acute Sum: {Math.round(activeAcuteLoad).toLocaleString()} kg
                  </span>
                </div>

                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: -15, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }} 
                        formatter={(val: any) => [`${Number(val).toLocaleString()} kg`, "Volume"]}
                      />
                      <Bar dataKey="volume" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span>Target Acute Zone: <strong className="text-white">22,000 – 35,000 kg</strong></span>
                  <button onClick={() => setActiveTab("log_session")} className="text-cyan-400 hover:underline font-bold">
                    + Add New Session
                  </button>
                </div>
              </div>

            </div>

            {/* CLINICAL INJURY RISK & SUBJECTIVE PAIN CHECK-IN */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Subjective Clinical &amp; Biomechanical Injury Risk Profile
                    </h2>
                    <p className="text-xs text-slate-400">
                      Dynamically weighted from your manual ACWR spike, muscle soreness index, pain score, and sleep duration.
                    </p>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                  riskLevel === "High" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                  riskLevel === "Moderate" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                  "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                }`}>
                  <ShieldAlert className="w-4 h-4" />
                  <span>{riskLevel} Injury Risk ({injuryRiskScore}%)</span>
                </div>
              </div>

              {/* 4 Multi-factor diagnostic tiles */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* ACWR Workload Contribution */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" /> Workload Delta
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">{acwrValue.toFixed(2)}x</span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {acwrValue > 1.5 ? "High Spike" : acwrValue >= 1.3 ? "Caution Spike" : "Safe Ratio"}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {acwrValue > 1.5 ? "+35% risk weighting due to rapid workload escalation." : "Optimal progressive stimulus."}
                  </p>
                </div>

                {/* Sleep & Restfulness */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5 text-blue-400" /> Sleep Quality
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">{sleepHours} hrs</span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {sleepScore}/10 Score
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {sleepHours < 6 ? "Sleep debt reduces tissue repair capacity." : "Restorative deep recovery achieved."}
                  </p>
                </div>

                {/* DOMS & Soreness */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> Muscle DOMS
                    </span>
                    <span className="font-mono text-amber-400 font-bold">{sorenessLevel}/10</span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {sorenessLevel >= 7 ? "High DOMS" : sorenessLevel >= 4 ? "Moderate DOMS" : "Fresh Tissue"}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Manual rating of subjective peripheral muscle soreness.
                  </p>
                </div>

                {/* Subjective Pain / Joint Discomfort */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-purple-400" /> Joint VAS Score
                    </span>
                    <span className="font-mono text-purple-400 font-bold">{painVas}/10 VAS</span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {painVas === 0 ? "Pain-Free" : `${painArea} (${painVas}/10)`}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {painVas > 0 ? `Active report: ${painType}.` : "No active musculoskeletal symptoms logged."}
                  </p>
                </div>

              </div>

              {/* Quick Pain Entry Mini-Form */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-cyan-400" /> Quick Joint &amp; Tendon Discomfort Check-in
                  </h4>
                  <span className="text-[11px] text-slate-400">Adjust the slider below to recalibrate clinical risk</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Anatomical Region</label>
                    <select
                      value={painArea}
                      onChange={(e) => setPainArea(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Lower Back">Lower Back / Lumbar</option>
                      <option value="Left Knee">Left Knee / Patella</option>
                      <option value="Right Knee">Right Knee / Patella</option>
                      <option value="Left Shoulder">Left Shoulder / Rotator Cuff</option>
                      <option value="Right Shoulder">Right Shoulder / Rotator Cuff</option>
                      <option value="Hamstrings">Hamstrings / Posterior Chain</option>
                      <option value="Achilles Tendon">Achilles / Ankle</option>
                      <option value="Hip Flexor">Hip Flexor / Groin</option>
                      <option value="Neck">Neck / Cervical Spine</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-semibold mb-1">
                      <span>Pain Severity (VAS)</span>
                      <span className="text-cyan-400 font-mono font-bold">{painVas}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={painVas}
                      onChange={(e) => setPainVas(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Sensation Type</label>
                    <select
                      value={painType}
                      onChange={(e) => setPainType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Stiffness / Tightness">Stiffness / Tightness</option>
                      <option value="Dull Muscle Ache">Dull Muscle Ache</option>
                      <option value="Sharp on Loading">Sharp on Loading / Reps</option>
                      <option value="Pinching / Impingement">Pinching / Impingement</option>
                      <option value="Nerve / Tingling">Nerve / Tingling</option>
                    </select>
                  </div>

                  <button
                    onClick={handleLogPain}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" /> Save Discomfort Log
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── TAB 2: MANUAL SESSION LOGGER (RPE) ──────────────────────────────── */}
        {activeTab === "log_session" && (
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-400" /> Manual Session &amp; RPE Workload Logger
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Uses Foster's Session-RPE athletic methodology: <code className="text-cyan-400">Session Load (AU) = Duration (min) &times; RPE</code>.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("overview")}
                className="text-xs text-slate-400 hover:text-white font-bold px-3 py-1.5 rounded-lg bg-slate-800"
              >
                Cancel / Close
              </button>
            </div>

            <form onSubmit={handleLogManualSession} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Date */}
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">Session Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Activity Type */}
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">Session Type</label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Resistance Training">Resistance Training (Hypertrophy / Strength)</option>
                    <option value="Powerlifting / Heavy Compounding">Powerlifting / Heavy Compounding</option>
                    <option value="HIIT & Metcon">HIIT &amp; Metcon Conditioning</option>
                    <option value="Athletic Speed & Agility">Athletic Speed &amp; Agility</option>
                    <option value="Endurance Running / Rowing">Endurance Running / Rowing</option>
                    <option value="Mobility & Active Recovery">Mobility &amp; Active Recovery</option>
                  </select>
                </div>

              </div>

              {/* DURATION SLIDER */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" /> Session Duration
                  </span>
                  <span className="text-lg font-mono text-cyan-400">{sessionDuration} minutes</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="5"
                  value={sessionDuration}
                  onChange={(e) => handleDurationOrRpeChange(Number(e.target.value), sessionRpe)}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>15 min (Quick)</span>
                  <span>60 min (Standard)</span>
                  <span>120 min (Extended)</span>
                  <span>180 min (Marathon)</span>
                </div>
              </div>

              {/* RPE SLIDER & VISUAL SELECTOR */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> Rate of Perceived Exertion (RPE 1–10)
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-mono font-black" style={{ color: RPE_DESCRIPTIONS[sessionRpe]?.color }}>
                      RPE {sessionRpe}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">({RPE_DESCRIPTIONS[sessionRpe]?.title})</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={sessionRpe}
                  onChange={(e) => handleDurationOrRpeChange(sessionDuration, Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
                />

                {/* 10 Quick Buttons */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => handleDurationOrRpeChange(sessionDuration, val)}
                      className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                        sessionRpe === val 
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 scale-105" 
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-slate-400 italic">
                  &ldquo;{RPE_DESCRIPTIONS[sessionRpe]?.desc}&rdquo;
                </p>
              </div>

              {/* ESTIMATED VOLUME & SESSION LOAD PREVIEW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Calculated Session Strain</div>
                  <div className="text-2xl font-black font-mono text-white">
                    {sessionDuration * sessionRpe} <span className="text-xs font-normal text-emerald-400">Arbitrary Units (AU)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{sessionDuration} mins &times; RPE {sessionRpe}</p>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-1">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Estimated Tonnage Volume</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={manualVolumeKg}
                      onChange={(e) => setManualVolumeKg(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1 text-lg font-mono font-bold text-white w-36 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-xs text-slate-400">kg moved</span>
                  </div>
                  <p className="text-[10px] text-slate-400">You can manually adjust or accept the estimate.</p>
                </div>
              </div>

              {/* TARGET MUSCLE GROUPS */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-2 block">Primary Muscles Loaded</label>
                <div className="flex flex-wrap gap-2">
                  {["Chest", "Back", "Shoulders", "Arms", "Quads", "Hamstrings", "Core"].map((muscle) => {
                    const isSelected = sessionTargetMuscles.includes(muscle);
                    return (
                      <button
                        type="button"
                        key={muscle}
                        onClick={() => toggleTargetMuscle(muscle)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? "bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/30"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {muscle} {isSelected ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20"
              >
                <Save className="w-4 h-4" /> Save &amp; Recalculate 7-Day Strain
              </button>

            </form>
          </div>
        )}

        {/* ── TAB 3: MUSCLE SORENESS MATRIX ───────────────────────────────────── */}
        {activeTab === "muscle_matrix" && (
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-purple-400" /> Anatomical Muscular Soreness &amp; Strain Matrix
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Drag the sliders (0–100%) to calibrate local muscle fatigue. Updates the radar chart in real-time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => applyMusclePreset("leg_day")} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300">Leg Day</button>
                <button onClick={() => applyMusclePreset("upper_body")} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300">Upper Body</button>
                <button onClick={() => applyMusclePreset("full_recovery")} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold">Reset Fresh</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(muscleStrain).map(([muscle, val]) => {
                const color = val >= 80 ? "text-red-400" : val >= 60 ? "text-amber-400" : "text-emerald-400";
                const badge = val >= 80 ? "High Strain" : val >= 60 ? "Moderate DOMS" : "Fresh / Rested";

                return (
                  <div key={muscle} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-white">{muscle}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          val >= 80 ? "bg-red-500/10 text-red-400" : val >= 60 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                        }`}>
                          {badge}
                        </span>
                        <span className={`font-mono font-bold text-sm ${color}`}>{val}%</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={val}
                      onChange={(e) => {
                        const newVal = Number(e.target.value);
                        setMuscleStrain(prev => ({ ...prev, [muscle]: newVal }));
                      }}
                      className="w-full accent-purple-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
                    />
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setStatusMsg({ type: "success", message: "Muscular strain calibration saved." });
                  setActiveTab("overview");
                }}
                className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20"
              >
                <Save className="w-4 h-4" /> Save Matrix &amp; View Chart
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 4: SUBJECTIVE RECOVERY & WELLNESS ───────────────────────────── */}
        {activeTab === "recovery_survey" && (
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Moon className="w-5 h-5 text-cyan-400" /> Subjective Recovery &amp; Wellness Index
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Calibrate your daily restorative parameters to dynamically adjust your 0–100 Physiological Readiness Score.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Computed Readiness</span>
                <span className="text-2xl font-black font-mono text-emerald-400">{readinessScore} / 100</span>
              </div>
            </div>

            <div className="space-y-6">
              
              {/* Sleep Hours & Quality */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Moon className="w-4 h-4 text-blue-400" /> Sleep Duration &amp; Restfulness
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">{sleepHours} Hours &bull; {sleepScore}/10 Score</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Hours Slept: <strong className="text-white font-mono">{sleepHours} hrs</strong></label>
                    <input
                      type="range"
                      min="4.0"
                      max="11.0"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Number(e.target.value))}
                      className="w-full accent-blue-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Sleep Quality Rating: <strong className="text-white font-mono">{sleepScore}/10</strong></label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={sleepScore}
                      onChange={(e) => setSleepScore(Number(e.target.value))}
                      className="w-full accent-blue-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* DOMS / Muscle Soreness */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" /> Overall Body Muscle Soreness (DOMS)
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{sorenessLevel} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={sorenessLevel}
                  onChange={(e) => setSorenessLevel(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 (Zero Soreness / Fresh)</span>
                  <span>5 (Moderate Tightness)</span>
                  <span>10 (Crippling Soreness)</span>
                </div>
              </div>

              {/* Mental Stress */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" /> Mental Fatigue &amp; Stress Level
                  </span>
                  <span className="font-mono text-purple-400 font-bold">{stressLevel} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 (Calm / Focused)</span>
                  <span>5 (Normal Daily Load)</span>
                  <span>10 (High Burnout / Overwhelmed)</span>
                </div>
              </div>

              {/* Hydration & Nutrition */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-400" /> Hydration &amp; Nutrition Satiety
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">{hydrationScore} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={hydrationScore}
                  onChange={(e) => setHydrationScore(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 (Dehydrated / Fasting)</span>
                  <span>5 (Adequate)</span>
                  <span>10 (Optimally Hydrated &amp; Fueled)</span>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setStatusMsg({ type: "success", message: `Updated Daily Readiness to ${readinessScore}/100.` });
                  setActiveTab("overview");
                }}
                className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
              >
                <Save className="w-4 h-4" /> Save Recovery Survey
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 5: ACWR WORKLOAD SIMULATOR ─────────────────────────────────── */}
        {activeTab === "acwr_simulator" && (
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" /> ACWR &amp; Workload Simulator
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust 7-day acute volume vs. 28-day chronic baseline to test what-if training scenarios before lifting.
                </p>
              </div>

              <button
                onClick={() => {
                  setAcuteLoadOverride(null);
                  setChronicLoadOverride(null);
                  setStatusMsg({ type: "success", message: "Reset ACWR simulation to real user values." });
                }}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800"
              >
                Reset Simulator
              </button>
            </div>

            {/* LIVE SIMULATED RATIO DISPLAY */}
            <div className={`p-6 rounded-3xl border ${acwrZone.bg} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Simulated ACWR Status</span>
                <div className="text-4xl font-black font-mono mt-1" style={{ color: acwrZone.color }}>
                  {acwrValue.toFixed(2)}x
                </div>
                <span className="text-xs font-semibold" style={{ color: acwrZone.color }}>{acwrZone.label}</span>
                <p className="text-xs text-slate-300 mt-2 max-w-md">{acwrZone.text}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 min-w-[200px]">
                <div className="text-xs text-slate-400 font-semibold">Simulated Injury Risk</div>
                <div className="text-2xl font-black font-mono text-white">{injuryRiskScore}%</div>
                <div className="text-[10px] text-emerald-400 font-bold">
                  {acwrValue > 1.5 ? "⚠️ High Risk Spike" : acwrValue >= 1.3 ? "⚡ Caution Threshold" : "✓ Optimal Safety Window"}
                </div>
              </div>
            </div>

            {/* 7-DAY ACUTE SLIDER */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-white">7-Day Acute Training Load</span>
                <span className="font-mono text-cyan-400 font-bold text-lg">{Math.round(activeAcuteLoad).toLocaleString()} kg</span>
              </div>
              <input
                type="range"
                min="5000"
                max="75000"
                step="500"
                value={activeAcuteLoad}
                onChange={(e) => setAcuteLoadOverride(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5,000 kg (Deload)</span>
                <span>28,000 kg (Standard)</span>
                <span>75,000 kg (High Volume)</span>
              </div>
            </div>

            {/* 28-DAY CHRONIC BASELINE SLIDER */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-white">28-Day Chronic Baseline Capacity</span>
                <span className="font-mono text-amber-400 font-bold text-lg">{Math.round(activeChronicLoad).toLocaleString()} kg</span>
              </div>
              <input
                type="range"
                min="5000"
                max="75000"
                step="500"
                value={activeChronicLoad}
                onChange={(e) => setChronicLoadOverride(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5,000 kg</span>
                <span>28,500 kg (Baseline Average)</span>
                <span>75,000 kg</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveTab("overview")}
                className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default WorkoutStrain;
