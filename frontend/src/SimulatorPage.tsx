import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  Play, Target, Scale, Zap, Activity, Clock, ShieldAlert, Sparkles, Sliders, ArrowUpRight, CheckCircle2, History
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
  const [intensity, setIntensity] = useState("High");
  const [weeklySessions, setWeeklySessions] = useState(4);

  // Recovery & Lifestyle Controls
  const [sleepHours, setSleepHours] = useState(7.0);
  const [proteinIntake, setProteinIntake] = useState(110);
  const [hydrationLiters, setHydrationLiters] = useState(2.5);

  // Simulation Results
  const [simulated, setSimulated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [horizon, setHorizon] = useState<"30d" | "90d" | "180d">("90d");
  const [zoneRisk, setZoneRisk] = useState<ZoneRisk>(BASE_ZONES);
  const [acwrRatio, setAcwrRatio] = useState(1.15);
  const [injuryRiskScore, setInjuryRiskScore] = useState(38);

  // Dynamic Reactive Calculations Engine
  useEffect(() => {
    const intensityFactor = intensity.includes("High") || intensity.includes("Maximal") ? 1.4 : intensity.includes("Moderate") ? 1.1 : 0.8;
    const loadVolume = (duration / 30) * weeklySessions * intensityFactor;
    const recoveryScore = (sleepHours / 8) * (proteinIntake / 130) * (hydrationLiters / 3);
    const newAcwr = parseFloat((0.85 + (loadVolume * 0.12) / Math.max(0.5, recoveryScore)).toFixed(2));
    const newInjuryRisk = Math.min(95, Math.max(10, Math.round(newAcwr * 32)));

    // Strain multiplier per zone
    const multiplier = newAcwr > 1.3 ? 1.35 : newAcwr < 0.9 ? 0.85 : 1.05;
    const updatedZones: ZoneRisk = { ...BASE_ZONES };
    (Object.keys(updatedZones) as ZoneId[]).forEach((z) => {
      const cur = BASE_ZONES[z] || 20;
      if (z === "left_knee" || z === "lumbar" || z === "left_thigh") {
        updatedZones[z] = Math.min(95, Math.round(cur * multiplier * 1.2));
      } else {
        updatedZones[z] = Math.min(90, Math.round(cur * multiplier));
      }
    });

    setAcwrRatio(newAcwr);
    setInjuryRiskScore(newInjuryRisk);
    setZoneRisk(updatedZones);
    setSimulated(true);
  }, [activity, duration, intensity, weeklySessions, sleepHours, proteinIntake, hydrationLiters]);

  const handleLoadLastCaptureBaseline = () => {
    const latest = captureHistoryStore.getLatest();
    if (latest) {
      setActivity(latest.exerciseType);
      setDuration(Math.round(latest.durationSec / 60) || 30);
      setIntensity(latest.valgusVelocity > 120 ? "High" : "Moderate");
    }
  };

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
              <p className="text-[11px] text-slate-400">Model hypothetical training workloads &amp; physiological recovery on your 3D digital twin</p>
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
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Reset Model
            </button>
          </div>
        </header>

        {/* Main Content Layout */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          
          {/* LEFT 5 COLUMNS: Simulation Variable Controls */}
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-slate-700"
                  >
                    <option>Squats &amp; Lifts</option>
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-slate-700"
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
                  className="w-full"
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
                  className="w-full"
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
                  className="w-full"
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
                  className="w-full"
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
                  className="w-full"
                />
              </div>
            </div>

            {/* Real-time Status Banner */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Real-Time Model Active</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">Auto-calculated on slider drag</span>
            </div>

          </div>

          {/* RIGHT 7 COLUMNS: 3D Twin Impact Visualization */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Projection Horizon Tabs & Score Bar */}
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

              {/* 2 Impact Metric Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <div className="pt-section-label mb-1">Simulated ACWR</div>
                  <div className={`font-mono text-2xl font-bold ${acwrRatio > 1.3 ? "text-red-400" : acwrRatio < 0.9 ? "text-amber-400" : "text-emerald-400"}`}>
                    {acwrRatio}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {acwrRatio > 1.3 ? "⚠️ High Risk Zone (> 1.3)" : "Optimal Range (0.9–1.3)"}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <div className="pt-section-label mb-1">Re-Injury Probability</div>
                  <div className={`font-mono text-2xl font-bold ${injuryRiskScore > 50 ? "text-red-400" : injuryRiskScore > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                    {injuryRiskScore}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Based on tissue fatigue modeling
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

            {/* 3D Holo Model Mesh Display */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 h-[380px] relative flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="pt-section-label">Simulated Musculoskeletal Twin Mesh</span>
                {simulated && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Simulation Active
                  </span>
                )}
              </div>
              <div className="flex-1 w-full relative">
                <HoloModel3D 
                  riskData={zoneRisk} 
                  selectedZone={null}
                  onZoneClick={(z: ZoneId) => console.log("Selected zone:", z)}
                />
              </div>
            </div>

            {/* Sub-Feature Tabs: Bilateral Radar, GRF Estimator, Spinal Segmentation, Valgus Velocity & Form Decay */}
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
