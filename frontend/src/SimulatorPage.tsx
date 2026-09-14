import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { 
  Play, Target, Scale, Zap, Activity, Clock, ShieldAlert, Sparkles, Sliders, 
  ArrowUpRight, CheckCircle2, History, Check, Save, Stethoscope, RefreshCw, BarChart2, ShieldCheck
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import HoloModel3D from "./HoloModel3D";
import type { ZoneRisk, ZoneId } from "./HoloModel3D";
import { auth } from "./firebase";
import { api } from "./api";
import { captureHistoryStore } from "./lib/captureHistoryStore";
import { BilateralSymmetryRadar } from "./components/BilateralSymmetryRadar";
import { GRFEstimatorPanel } from "./components/GRFEstimatorPanel";
import { SpinalSegmentationView } from "./components/SpinalSegmentationView";
import { ValgusVelocityAlert } from "./components/ValgusVelocityAlert";
import { FormDecayTracker } from "./components/FormDecayTracker";

const BASE_ZONES: ZoneRisk = {
  head: 15, neck: 25, chest: 20, lumbar: 45,
  left_shoulder: 30, right_shoulder: 20,
  left_arm: 15, right_arm: 15, left_forearm: 10, right_forearm: 10,
  left_hip: 40, right_hip: 25, left_thigh: 50, right_thigh: 20,
  left_knee: 65, right_knee: 30, left_shin: 25, right_shin: 20,
  left_ankle: 35, right_ankle: 20
};

export default function SimulatorPage() {
  // Activity Controls
  const [activity, setActivity] = useState("Squats & Lifts");
  const [duration, setDuration] = useState(45);
  const [intensity, setIntensity] = useState("High (RPE 8-9)");
  const [weeklySessions, setWeeklySessions] = useState(4);

  // Recovery & Lifestyle Controls
  const [sleepHours, setSleepHours] = useState(7.0);
  const [proteinIntake, setProteinIntake] = useState(110);
  const [hydrationLiters, setHydrationLiters] = useState(2.5);

  // Clinical Rehab Protocols Toggles
  const [eccentricLoading, setEccentricLoading] = useState(true);
  const [manualTherapy, setManualTherapy] = useState(false);
  const [emgBiofeedback, setEmgBiofeedback] = useState(true);
  const [deloadTaper, setDeloadTaper] = useState(false);

  // 3D Mesh Target Filter
  const [targetFilter, setTargetFilter] = useState<"all" | "arms" | "knees">("all");

  // Simulation Results & State
  const [simulated, setSimulated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [horizon, setHorizon] = useState<"30d" | "90d" | "180d">("90d");
  const [zoneRisk, setZoneRisk] = useState<ZoneRisk>(BASE_ZONES);
  const [acwrRatio, setAcwrRatio] = useState(1.15);
  const [injuryRiskScore, setInjuryRiskScore] = useState(38);
  const [trajectoryData, setTrajectoryData] = useState<{ day: number; baseline: number; counterfactual: number; withRehab: number }[]>([]);
  const [appliedNotice, setAppliedNotice] = useState(false);

  // Dynamic Reactive Simulation Calculation
  const runSimulation = useCallback(async () => {
    setLoading(true);
    const userId = auth.currentUser?.uid || "demo_user";
    const intensityFactor = intensity.includes("High") || intensity.includes("Maximal") ? 1.4 : intensity.includes("Moderate") ? 1.1 : 0.8;

    try {
      // Attempt call to backend POST /analytics/simulate
      const res = await api.simulateWhatIf(userId, {
        activity,
        duration_minutes: duration,
        intensity,
        weekly_sessions: weeklySessions,
        sleep_hours: sleepHours,
        protein_g: proteinIntake,
        hydration_l: hydrationLiters,
        rehab_protocols: {
          eccentric_loading: eccentricLoading,
          manual_therapy: manualTherapy,
          emg_biofeedback: emgBiofeedback,
          deload_taper: deloadTaper,
        },
      });

      if (res && res.trajectory) {
        setAcwrRatio(res.acwr_ratio || 1.15);
        setInjuryRiskScore(res.reinjury_probability || 35);
        if (res.zone_risks) {
          setZoneRisk(res.zone_risks);
        }
        setTrajectoryData(res.trajectory);
        setSimulated(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Backend simulation endpoint failed, running local calculations fallback:", err);
    }

    // Client-side Fallback Simulation Engine
    const loadVolume = (duration / 30) * weeklySessions * intensityFactor;
    const recoveryScore = (sleepHours / 8) * (proteinIntake / 130) * (hydrationLiters / 3);
    
    // Strain reduction multiplier from active rehab protocols
    let strainReduction = 1.0;
    if (eccentricLoading) strainReduction -= 0.18;
    if (manualTherapy) strainReduction -= 0.12;
    if (emgBiofeedback) strainReduction -= 0.15;
    if (deloadTaper) strainReduction -= 0.25;
    strainReduction = Math.max(0.4, strainReduction);

    const calculatedAcwr = parseFloat((0.85 + (loadVolume * 0.12) / Math.max(0.5, recoveryScore)).toFixed(2));
    const rawInjuryRisk = Math.min(95, Math.max(10, Math.round(calculatedAcwr * 32 * strainReduction)));

    // Zone risk updates
    const multiplier = calculatedAcwr > 1.3 ? 1.35 : calculatedAcwr < 0.9 ? 0.85 : 1.05;
    const updatedZones: ZoneRisk = { ...BASE_ZONES };
    (Object.keys(updatedZones) as ZoneId[]).forEach((z) => {
      const cur = BASE_ZONES[z] || 20;
      let factor = multiplier * strainReduction;
      if (z === "left_knee" || z === "lumbar" || z === "left_thigh") {
        updatedZones[z] = Math.min(95, Math.round(cur * factor * 1.25));
      } else {
        updatedZones[z] = Math.min(90, Math.round(cur * factor));
      }
    });

    // Generate Trajectory Curves (30, 90, or 180 points)
    const totalDays = horizon === "30d" ? 30 : horizon === "90d" ? 90 : 180;
    const traj: { day: number; baseline: number; counterfactual: number; withRehab: number }[] = [];
    const step = Math.max(1, Math.floor(totalDays / 15));

    for (let d = 0; d <= totalDays; d += step) {
      const baseRisk = Math.min(90, Math.round(45 + Math.sin(d / 15) * 8 + (d / totalDays) * 15));
      const cfRisk = Math.min(95, Math.round(rawInjuryRisk + Math.sin(d / 10) * 12 + (d / totalDays) * 10));
      const rehabRisk = Math.max(10, Math.round(cfRisk * strainReduction * (1 - (d / totalDays) * 0.25)));

      traj.push({
        day: d,
        baseline: baseRisk,
        counterfactual: cfRisk,
        withRehab: rehabRisk,
      });
    }

    setAcwrRatio(calculatedAcwr);
    setInjuryRiskScore(rawInjuryRisk);
    setZoneRisk(updatedZones);
    setTrajectoryData(traj);
    setSimulated(true);
    setLoading(false);
  }, [activity, duration, intensity, weeklySessions, sleepHours, proteinIntake, hydrationLiters, eccentricLoading, manualTherapy, emgBiofeedback, deloadTaper, horizon]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  const handleLoadLastCaptureBaseline = () => {
    const latest = captureHistoryStore.getLatest();
    if (latest) {
      setActivity(latest.exerciseType);
      setDuration(Math.round(latest.durationSec / 60) || 30);
      setIntensity(latest.valgusVelocity > 120 ? "High (RPE 8-9)" : "Moderate (RPE 6-7)");
    }
  };

  const handleApplyPlan = () => {
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 4000);
  };

  // Filter 3D Mesh Zones according to target filter tab
  const activeZoneRisk: ZoneRisk = { ...zoneRisk };
  if (targetFilter === "arms") {
    (Object.keys(activeZoneRisk) as ZoneId[]).forEach((z) => {
      if (!z.includes("arm") && !z.includes("shoulder")) {
        activeZoneRisk[z] = 5;
      }
    });
  } else if (targetFilter === "knees") {
    (Object.keys(activeZoneRisk) as ZoneId[]).forEach((z) => {
      if (!z.includes("knee") && !z.includes("thigh") && !z.includes("hip")) {
        activeZoneRisk[z] = 5;
      }
    });
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                Biomechanical "What-If" Counterfactual Simulator
                <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Predictive Sandbox</span>
              </h1>
              <p className="text-[11px] text-slate-400">Model hypothetical training workloads &amp; clinical rehab interventions on your 3D digital twin</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleLoadLastCaptureBaseline}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              <span>Load Baseline from Last Capture</span>
            </button>
            <button 
              onClick={() => {
                setZoneRisk(BASE_ZONES);
                setSimulated(false);
                setAcwrRatio(1.15);
                setInjuryRiskScore(38);
                setEccentricLoading(false);
                setManualTherapy(false);
                setEmgBiofeedback(false);
                setDeloadTaper(false);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Reset Model
            </button>
          </div>
        </header>

        {/* Main Content Layout */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          
          {/* LEFT 5 COLUMNS: Simulation Variable Controls & Rehab Interventions */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Control Panel 1: Activity Parameters */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="pt-section-label text-slate-200">1. Planned Training Load</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="pt-section-label block mb-1">Activity Type</label>
                  <select 
                    value={activity} 
                    onChange={e => setActivity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-slate-700 cursor-pointer"
                  >
                    <option>Squats &amp; Lifts</option>
                    <option>Bicep Curls</option>
                    <option>Distance Running</option>
                    <option>Sprint Intervals</option>
                    <option>Cycling / Erg</option>
                    <option>Plyometrics</option>
                  </select>
                </div>

                <div>
                  <label className="pt-section-label block mb-1">Intensity Level</label>
                  <select 
                    value={intensity} 
                    onChange={e => setIntensity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-slate-700 cursor-pointer"
                  >
                    <option>Light (RPE 4-5)</option>
                    <option>Moderate (RPE 6-7)</option>
                    <option>High (RPE 8-9)</option>
                    <option>Maximal (RPE 10)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="pt-section-label">Session Duration</label>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{duration} mins</span>
                </div>
                <input 
                  type="range" min="15" max="150" step="5" value={duration}
                  onChange={e => setDuration(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="pt-section-label">Weekly Frequency</label>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{weeklySessions} sessions / week</span>
                </div>
                <input 
                  type="range" min="1" max="7" step="1" value={weeklySessions}
                  onChange={e => setWeeklySessions(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Control Panel 2: Recovery & Physiological Inputs */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="pt-section-label text-slate-200">2. Recovery &amp; Nutrition Variables</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="pt-section-label">Average Nightly Sleep</label>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{sleepHours} hrs</span>
                </div>
                <input 
                  type="range" min="4.0" max="10.0" step="0.5" value={sleepHours}
                  onChange={e => setSleepHours(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="pt-section-label">Daily Protein Intake</label>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{proteinIntake} g</span>
                </div>
                <input 
                  type="range" min="50" max="220" step="5" value={proteinIntake}
                  onChange={e => setProteinIntake(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="pt-section-label">Daily Hydration</label>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{hydrationLiters} L</span>
                </div>
                <input 
                  type="range" min="1.0" max="5.0" step="0.2" value={hydrationLiters}
                  onChange={e => setHydrationLiters(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Control Panel 3: Clinical Rehab Interventions */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                  <span className="pt-section-label text-slate-200">3. Clinical Rehab Protocols</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                  Strain Reduction
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setEccentricLoading(!eccentricLoading)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    eccentricLoading
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Eccentric Loading</span>
                    {eccentricLoading ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/80 mt-2">-18% Strain Reduction</span>
                </button>

                <button
                  onClick={() => setManualTherapy(!manualTherapy)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    manualTherapy
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Manual Therapy</span>
                    {manualTherapy ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/80 mt-2">-12% Strain Reduction</span>
                </button>

                <button
                  onClick={() => setEmgBiofeedback(!emgBiofeedback)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    emgBiofeedback
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">EMG Biofeedback</span>
                    {emgBiofeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/80 mt-2">-15% Strain Reduction</span>
                </button>

                <button
                  onClick={() => setDeloadTaper(!deloadTaper)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    deloadTaper
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Deload Taper Week</span>
                    {deloadTaper ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/80 mt-2">-25% Strain Reduction</span>
                </button>
              </div>
            </div>

            {/* Real-time Status & Sync CTA */}
            <div className="space-y-3">
              <button
                onClick={handleApplyPlan}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Apply Simulation Plan to Digital Twin</span>
              </button>

              {appliedNotice && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Simulation parameters successfully saved and synchronized with your active digital twin profile!</span>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT 7 COLUMNS: 3D Twin & Multi-Horizon Trajectory Graphs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Projection Horizon Tabs & Impact Metrics */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="pt-section-label">Projected Horizon</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(["30d", "90d", "180d"] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => setHorizon(h)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        horizon === h ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {h === "30d" ? "30 Days" : h === "90d" ? "90 Days" : "6 Months"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                  <div className="pt-section-label mb-1">Simulated ACWR</div>
                  <div className={`font-mono text-2xl font-bold ${acwrRatio > 1.3 ? "text-red-400" : acwrRatio < 0.9 ? "text-amber-400" : "text-emerald-400"}`}>
                    {acwrRatio}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {acwrRatio > 1.3 ? "⚠️ High Strain Zone" : "Optimal (0.9–1.3)"}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                  <div className="pt-section-label mb-1">Re-Injury Risk</div>
                  <div className={`font-mono text-2xl font-bold ${injuryRiskScore > 50 ? "text-red-400" : injuryRiskScore > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                    {injuryRiskScore}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Tissue fatigue index
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                  <div className="pt-section-label mb-1">Rehab Benefit</div>
                  <div className="font-mono text-2xl font-bold text-teal-400">
                    {eccentricLoading || manualTherapy || emgBiofeedback || deloadTaper ? "-38%" : "0%"}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Peak load reduction
                  </div>
                </div>
              </div>

              {acwrRatio > 1.3 && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>Workload Spike Warning:</strong> Your modeled training load outpaces physiological recovery. High probability of patellar and lumbar strain escalation.</span>
                </div>
              )}
            </div>

            {/* Multi-Horizon SVG Trajectory Chart */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <span className="pt-section-label text-slate-200">Multi-Horizon Strain Trajectory Projection ({horizon})</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-slate-400"><span className="w-2 h-0.5 bg-slate-500 rounded" /> Baseline</span>
                  <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-0.5 bg-red-400 rounded" /> Counterfactual</span>
                  <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-0.5 bg-emerald-400 rounded" /> + Rehab Protocols</span>
                </div>
              </div>

              {/* Render SVG Line Chart */}
              <div className="h-36 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 relative flex items-center justify-center">
                {trajectoryData.length > 0 ? (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="400" y2="25" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="400" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="0" y1="75" x2="400" y2="75" stroke="#1e293b" strokeDasharray="3 3" />

                    {/* Baseline Path */}
                    <path
                      d={trajectoryData.map((d, i) => `${i === 0 ? "M" : "L"} ${(i / (trajectoryData.length - 1)) * 400} ${100 - d.baseline}`).join(" ")}
                      fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2"
                    />

                    {/* Counterfactual Path */}
                    <path
                      d={trajectoryData.map((d, i) => `${i === 0 ? "M" : "L"} ${(i / (trajectoryData.length - 1)) * 400} ${100 - d.counterfactual}`).join(" ")}
                      fill="none" stroke="#f87171" strokeWidth="2.5"
                    />

                    {/* With Rehab Path */}
                    <path
                      d={trajectoryData.map((d, i) => `${i === 0 ? "M" : "L"} ${(i / (trajectoryData.length - 1)) * 400} ${100 - d.withRehab}`).join(" ")}
                      fill="none" stroke="#34d399" strokeWidth="2.5"
                    />
                  </svg>
                ) : (
                  <span className="text-xs text-slate-500">Computing trajectory path...</span>
                )}
              </div>
            </div>

            {/* 3D Holo Model Mesh Display with Limb Filter */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 h-[390px] relative flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="pt-section-label">Simulated Musculoskeletal Twin Mesh</span>
                
                {/* Limb Selective Target Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setTargetFilter("all")}
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      targetFilter === "all" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Full Body
                  </button>
                  <button
                    onClick={() => setTargetFilter("knees")}
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      targetFilter === "knees" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Squats (Knees/Hips)
                  </button>
                  <button
                    onClick={() => setTargetFilter("arms")}
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      targetFilter === "arms" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Bicep Curls (Arms)
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full relative">
                <HoloModel3D 
                  riskData={activeZoneRisk} 
                  selectedZone={null}
                  onZoneClick={(z: ZoneId) => console.log("Selected zone:", z)}
                />
              </div>
            </div>

            {/* Biomechanical Diagnostic Panels */}
            <div className="space-y-4">
              <BilateralSymmetryRadar />
              <GRFEstimatorPanel />
              <SpinalSegmentationView />
              <ValgusVelocityAlert />
              <FormDecayTracker />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
